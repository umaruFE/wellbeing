import { readFile } from 'node:fs/promises';
import pg from 'pg';

const { DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD } = process.env;
if (!DB_NAME || !DB_USER) throw new Error('请提供案例库的数据库名称和账号。');

const schema = await readFile(new URL('./workbench-cases.sql', import.meta.url), 'utf8');
const catalog = JSON.parse(await readFile(new URL('./workbench-cases.json', import.meta.url), 'utf8'));
const rows = Object.entries(catalog).flatMap(([module_id, cases]) =>
  cases.map((payload, sort_order) => ({ module_id, case_id: payload.id, sort_order, payload }))
);
const client = new pg.Client({
  host: DB_HOST,
  port: DB_PORT ? Number(DB_PORT) : undefined,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  application_name: 'wellbeing-seed-workbench-cases',
  connectionTimeoutMillis: 10000,
});

try {
  await client.connect();
  await client.query('BEGIN');
  await client.query("SET LOCAL lock_timeout = '5s'");
  await client.query(schema);
  const { rowCount } = await client.query(
    `INSERT INTO workbench_cases (module_id, case_id, sort_order, payload)
     SELECT module_id, case_id, sort_order, payload
     FROM jsonb_to_recordset($1::jsonb)
       AS seed(module_id TEXT, case_id TEXT, sort_order INTEGER, payload JSONB)
     ON CONFLICT (module_id, case_id) DO NOTHING`,
    [JSON.stringify(rows)],
  );
  await client.query('COMMIT');
  console.log(JSON.stringify({ inserted: rowCount, catalog: rows.length }));
} catch (error) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('案例库迁移失败。', error.code || error.name);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
