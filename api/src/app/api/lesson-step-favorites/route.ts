import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { createServerClient, db } from '@/lib/db';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };
const fields = ['title', 'duration', 'goal', 'activity', 'flow', 'resources', 'scenario', 'teacherScript'] as const;
const columns = 'id, course_ref AS "courseRef", phase_key AS "phaseKey", step, saved_at AS "savedAt"';
const json = (body: object, status = 200) => NextResponse.json(body, { status, headers });

async function writeForUser(sql: string, values: unknown[]) {
  const connection = await createServerClient().connect();
  try {
    await connection.query(process.env.WELLBEING_PREVIEW_FAVORITE_WRITES === 'true' ? 'BEGIN READ WRITE' : 'BEGIN');
    const result = await connection.query(sql, values);
    await connection.query('COMMIT');
    return result;
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  } finally {
    connection.release();
  }
}

export async function GET(request: NextRequest) {
  const user = authenticate(request).user;
  if (!user) return json({ error: '请登录后查看收藏。' }, 401);
  try {
    const result = await db.query(
      `SELECT ${columns} FROM lesson_step_favorites WHERE user_id = $1 ORDER BY saved_at DESC, id`, [user.id],
    );
    return json({ data: result.rows });
  } catch {
    return json({ error: '暂时无法读取环节收藏，请重试。' }, 503);
  }
}

export async function PUT(request: NextRequest) {
  const user = authenticate(request).user;
  if (!user) return json({ error: '请登录后收藏环节。' }, 401);
  const body = await request.json().catch(() => null);
  const { courseRef, phaseKey, step } = body || {};
  if (typeof courseRef !== 'string' || courseRef.length > 160 || !['eng', 'emp', 'exc', 'elv'].includes(phaseKey)
    || !step || typeof step.title !== 'string' || !step.title.trim()
    || fields.some(key => step[key] != null && typeof step[key] !== 'string')) {
    return json({ error: '环节数据无效。' }, 400);
  }
  const snapshot = Object.fromEntries(fields.map(key => [key, step[key] ?? '']));
  if (typeof step.id === 'string' || typeof step.id === 'number') snapshot.id = String(step.id);
  const content = JSON.stringify(snapshot);
  if (Buffer.byteLength(content) > 256 * 1024) return json({ error: '环节内容过长。' }, 413);
  const id = createHash('sha256').update(JSON.stringify([courseRef, phaseKey, snapshot.id || snapshot])).digest('hex');
  try {
    const result = await writeForUser(
      `INSERT INTO lesson_step_favorites (user_id, id, course_ref, phase_key, step) VALUES ($1, $2, $3, $4, $5::jsonb)
       ON CONFLICT (user_id, id) DO UPDATE SET step = EXCLUDED.step RETURNING ${columns}`,
      [user.id, id, courseRef, phaseKey, content],
    );
    return json({ data: result.rows[0] });
  } catch {
    return json({ error: '环节收藏未保存，请重试。' }, 503);
  }
}

export async function DELETE(request: NextRequest) {
  const user = authenticate(request).user;
  if (!user) return json({ error: '请登录后管理收藏。' }, 401);
  const body = await request.json().catch(() => null);
  if (typeof body?.id !== 'string' || !/^[a-f0-9]{64}$/.test(body.id)) return json({ error: '收藏编号无效。' }, 400);
  try {
    await writeForUser('DELETE FROM lesson_step_favorites WHERE user_id = $1 AND id = $2', [user.id, body.id]);
    return json({ data: { id: body.id } });
  } catch {
    return json({ error: '暂时无法移除收藏，请重试。' }, 503);
  }
}
