import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import { authenticate } from '@/lib/auth';
import { createServerClient, db } from '@/lib/db';
import { publishedCase } from '@/lib/workbench-cases';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const modules = new Set(['song', 'music', 'yoga', 'spin-speak', 'doodle', 'move-match']);
const headers = { 'Cache-Control': 'no-store' };
type Context = { params: { moduleId: string } };

export async function GET(request: NextRequest, { params }: Context) {
  const auth = authenticate(request);
  if (!auth.success || !auth.user?.id) {
    return NextResponse.json({ error: '请重新登录后查看案例库。' }, { status: 401, headers });
  }
  if (!modules.has(params.moduleId)) {
    return NextResponse.json({ error: '案例库不存在。' }, { status: 404, headers });
  }

  try {
    const { rows } = await db.query(
      `SELECT payload FROM workbench_cases
       WHERE module_id = $1 AND published
       ORDER BY sort_order, case_id`,
      [params.moduleId],
    );
    return NextResponse.json({
      data: rows.map(row => row.payload),
      canPublish: auth.user.role === 'super_admin',
    }, { headers });
  } catch (error) {
    console.error('[workbench-cases] read failed:', (error as { code?: string }).code);
    return NextResponse.json({ error: '暂时无法读取平台案例，请稍后重试。' }, { status: 503, headers });
  }
}

async function sourceWork(connection: PoolClient, moduleId: string, userId: string, sourceId: string) {
  if (moduleId === 'song') {
    const { rows } = await connection.query(
      `SELECT work_data->'workbench' AS work FROM song_writing_works
       WHERE user_id = $1 AND work_data->'workbench'->>'id' = $2 LIMIT 1`,
      [userId, sourceId],
    );
    return rows[0]?.work;
  }
  if (moduleId === 'music' || moduleId === 'yoga') {
    const [module, field, key] = moduleId === 'music'
      ? ['music-star-quest', 'workbench', 'activityId']
      : ['interactive-yoga', 'workbenchYoga', 'id'];
    const { rows } = await connection.query(
      `SELECT parameters->$3::text AS work FROM creative_works
       WHERE user_id = $1 AND module_id = $2 AND (parameters->$3::text)->>$4::text = $5
         AND (parameters->>'workbenchMusicCandidate') IS DISTINCT FROM 'true' LIMIT 1`,
      [userId, module, field, key, sourceId],
    );
    return rows[0]?.work;
  }
  const snapshotKey = moduleId === 'move-match' ? 'activities' : 'items';
  const { rows } = await connection.query(
    `SELECT entry.work FROM workbench_activities activity
     JOIN users owner ON owner.id = activity.user_id
       AND activity.organization_key = COALESCE(owner.organization_id::text, '')
     CROSS JOIN LATERAL jsonb_array_elements(activity.snapshot->$3::text) AS entry(work)
     WHERE activity.user_id = $1 AND activity.module_id = $2 AND entry.work->>'id' = $4 LIMIT 1`,
    [userId, moduleId, snapshotKey, sourceId],
  );
  return rows[0]?.work;
}

export async function POST(request: NextRequest, { params }: Context) {
  const { moduleId } = params;
  const auth = authenticate(request);
  const user = auth.user;
  if (!auth.success || !user?.id) return NextResponse.json({ error: '请重新登录。' }, { status: 401, headers });
  if (user.role !== 'super_admin') return NextResponse.json({ error: '只有平台管理员可以发布案例。' }, { status: 403, headers });
  if (!modules.has(moduleId)) return NextResponse.json({ error: '案例库不存在。' }, { status: 404, headers });
  const body = await request.json().catch(() => null);
  const sourceId = body?.sourceId;
  if (typeof sourceId !== 'string' || !sourceId.trim() || sourceId.length > 160) {
    return NextResponse.json({ error: '请选择要发布的作品。' }, { status: 400, headers });
  }

  let connection: PoolClient | undefined;
  try {
    connection = await createServerClient().connect();
    // The guarded local preview authorizes only this case write, as with activity writes.
    await connection.query(process.env.WELLBEING_PREVIEW_ACTIVITY_WRITES === 'true' ? 'BEGIN READ WRITE' : 'BEGIN');
    const { rows } = await connection.query('SELECT role FROM users WHERE id = $1 FOR SHARE', [user.id]);
    if (rows[0]?.role !== 'super_admin') {
      await connection.query('ROLLBACK');
      return NextResponse.json({ error: '只有平台管理员可以发布案例。' }, { status: 403, headers });
    }
    const work = await sourceWork(connection, moduleId, user.id, sourceId);
    const id = 'work-' + createHash('sha256').update(JSON.stringify([user.id, sourceId])).digest('hex').slice(0, 32);
    const payload = work && publishedCase(moduleId, id, work);
    if (!payload) {
      await connection.query('ROLLBACK');
      return NextResponse.json({ error: '请先保存并确认自己作品的授课版。' }, { status: 422, headers });
    }
    const saved = await connection.query(
      `INSERT INTO workbench_cases (module_id, case_id, sort_order, payload, source_user_id, source_work_id)
       VALUES ($1, $2, 1000, $3::jsonb, $4, $5)
       ON CONFLICT (module_id, case_id) DO UPDATE SET payload = EXCLUDED.payload, published = TRUE
       WHERE workbench_cases.source_user_id = EXCLUDED.source_user_id
         AND workbench_cases.source_work_id = EXCLUDED.source_work_id`,
      [moduleId, id, JSON.stringify(payload), user.id, sourceId],
    );
    if (saved.rowCount !== 1) {
      await connection.query('ROLLBACK');
      return NextResponse.json({ error: '案例编号冲突，请联系平台管理员。' }, { status: 409, headers });
    }
    await connection.query('COMMIT');
    return NextResponse.json({ data: payload }, { status: 201, headers });
  } catch (error) {
    await connection?.query('ROLLBACK').catch(() => {});
    console.error('[workbench-cases] publish failed:', (error as { code?: string }).code);
    return NextResponse.json({ error: '暂时无法发布平台案例，请稍后重试。' }, { status: 503, headers });
  } finally {
    connection?.release();
  }
}
