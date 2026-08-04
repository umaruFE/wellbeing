import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createServerClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

const LEGACY_DOMAIN = 'https://z.dhr.dhredu.cn';
const CURRENT_DOMAIN = 'https://z.wellbeing.newstaredu.cn';
const EXCLUDED_TABLES = ['media_migration_backups', 'media_migration_file_map'];

type TargetColumn = { table_name: string; column_name: string; data_type: 'jsonb' | 'text' | 'character varying' };

function identifier(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

async function findTargetColumns() {
  const pool = createServerClient();
  const result = await pool.query<TargetColumn>(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND data_type IN ('jsonb', 'text', 'character varying')
      AND table_name <> ALL($1::text[])
    ORDER BY table_name, ordinal_position
  `, [EXCLUDED_TABLES]);
  return result.rows;
}

async function inspect() {
  const pool = createServerClient();
  const columns = await findTargetColumns();
  const matches = [] as Array<TargetColumn & { count: number }>;
  for (const column of columns) {
    const table = identifier(column.table_name);
    const field = identifier(column.column_name);
    const result = await pool.query(`SELECT count(*)::int AS count FROM ${table} WHERE ${field}::text LIKE $1`, [`%${LEGACY_DOMAIN}%`]);
    const count = result.rows[0].count as number;
    if (count) matches.push({ ...column, count });
  }
  return { matches, total: matches.reduce((sum, item) => sum + item.count, 0) };
}

export const GET = requireRole(['super_admin'])(async () => {
  const result = await inspect();
  return NextResponse.json({
    success: true,
    data: { legacyDomain: LEGACY_DOMAIN, currentDomain: CURRENT_DOMAIN, ...result },
  });
});

export const POST = requireRole(['super_admin'])(async (request, user) => {
  const body = await request.json().catch(() => ({}));
  if (body.confirm !== true) {
    return NextResponse.json({ error: '请先确认域名替换操作' }, { status: 400 });
  }

  const columns = await findTargetColumns();
  const pool = createServerClient();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS media_domain_migration_logs (
        id BIGSERIAL PRIMARY KEY,
        operator_id TEXT,
        legacy_domain TEXT NOT NULL,
        current_domain TEXT NOT NULL,
        changed_rows JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const changed = [] as Array<TargetColumn & { count: number }>;
    for (const column of columns) {
      const table = identifier(column.table_name);
      const field = identifier(column.column_name);
      const replacement = column.data_type === 'jsonb'
        ? `replace(${field}::text, $1, $2)::jsonb`
        : `replace(${field}, $1, $2)`;
      const result = await client.query(
        `UPDATE ${table} SET ${field} = ${replacement} WHERE ${field}::text LIKE $3`,
        [LEGACY_DOMAIN, CURRENT_DOMAIN, `%${LEGACY_DOMAIN}%`],
      );
      if (result.rowCount) changed.push({ ...column, count: result.rowCount });
    }
    await client.query(
      `INSERT INTO media_domain_migration_logs (operator_id, legacy_domain, current_domain, changed_rows)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [user.id, LEGACY_DOMAIN, CURRENT_DOMAIN, JSON.stringify(changed)],
    );
    await client.query('COMMIT');
    return NextResponse.json({
      success: true,
      data: { changed, total: changed.reduce((sum, item) => sum + item.count, 0) },
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[media-domain-migration] failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '媒体域名替换失败' },
      { status: 500 },
    );
  } finally {
    client.release();
  }
});
