import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: { moduleId: string } };
type Snapshot = Record<string, unknown>;
const modules = new Set(['move-match', 'spin-speak', 'doodle']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const maxBytes = 16 * 1024 * 1024;

function isObject(value: unknown): value is Snapshot {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validSnapshot(moduleId: string, snapshot: unknown) {
  if (!isObject(snapshot)) return false;
  if (moduleId === 'move-match') {
    return snapshot.schemaVersion === 1 && Number.isSafeInteger(snapshot.revision)
      && Array.isArray(snapshot.activities) && Array.isArray(snapshot.sessions);
  }
  if (moduleId === 'doodle') return snapshot.schemaVersion === 1 && Array.isArray(snapshot.items);
  return isObject(snapshot.draft) && Array.isArray(snapshot.items);
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function account(request: NextRequest, moduleId: string) {
  const auth = authenticate(request);
  if (!auth.success || !auth.user || !uuid.test(auth.user.id)) {
    return json({ error: '请重新登录后访问活动。' }, 401);
  }
  if (!modules.has(moduleId)) return json({ error: '活动类型不存在。' }, 404);
  // Organization membership comes from the current account record, not from the browser token.
  const { rows } = await db.query(
    `SELECT COALESCE(organization_id::text, '') AS organization_key FROM users WHERE id = $1`,
    [auth.user.id],
  );
  if (!rows.length) return json({ error: '当前账号无法访问活动。' }, 401);
  return [auth.user.id, rows[0].organization_key, moduleId];
}

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const key = await account(request, params.moduleId);
    if (key instanceof NextResponse) return key;
    const { rows } = await db.query(
      `SELECT version, snapshot FROM workbench_activities
       WHERE user_id = $1 AND organization_key = $2 AND module_id = $3`, key,
    );
    return json({ data: rows[0] || { version: 0, snapshot: null } });
  } catch (error) {
    console.error('[workbench-activities] read failed:', error);
    return json({ error: '暂时无法读取后台活动，请稍后重试。' }, 503);
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const key = await account(request, params.moduleId);
    if (key instanceof NextResponse) return key;
    if (Number(request.headers.get('content-length')) > maxBytes) {
      return json({ error: '活动数据过大，请减少活动中嵌入的大图片后重试。' }, 413);
    }
    const raw = await request.text();
    if (Buffer.byteLength(raw) > maxBytes) {
      return json({ error: '活动数据过大，请减少活动中嵌入的大图片后重试。' }, 413);
    }
    let body;
    try { body = JSON.parse(raw); } catch { return json({ error: '活动数据格式无效。' }, 400); }
    const { version, writeId, snapshot } = body || {};
    if (!Number.isInteger(version) || version < 0 || version >= 2147483647
      || typeof writeId !== 'string' || !uuid.test(writeId) || !validSnapshot(params.moduleId, snapshot)) {
      return json({ error: '活动数据不完整。' }, 400);
    }

    const values = [...key, writeId, JSON.stringify(snapshot)];
    const { rows } = version === 0
      ? await db.query(
        `INSERT INTO workbench_activities (user_id, organization_key, module_id, write_id, snapshot)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         ON CONFLICT DO NOTHING RETURNING version`, values,
      )
      : await db.query(
        `UPDATE workbench_activities SET write_id = $4, snapshot = $5::jsonb, version = version + 1
         WHERE user_id = $1 AND organization_key = $2 AND module_id = $3 AND version = $6
         RETURNING version`, [...values, version],
      );
    if (rows.length) return json({ data: rows[0] });

    // A retry after a dropped response acknowledges the same write without applying it twice.
    const retry = await db.query(
      `SELECT version FROM workbench_activities
       WHERE user_id = $1 AND organization_key = $2 AND module_id = $3
         AND write_id = $4 AND snapshot = $5::jsonb`, values,
    );
    if (retry.rows.length) return json({ data: retry.rows[0] });
    return json({ error: '后台已有更新。当前修改已保留，请导出备份后载入最新版本。' }, 409);
  } catch (error) {
    console.error('[workbench-activities] save failed:', error);
    return json({ error: '暂时无法同步后台，当前修改已保留。' }, 503);
  }
}
