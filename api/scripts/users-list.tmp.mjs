// 临时：查看账号清单与密码形态（用后即删）
import pg from 'pg';
const pool = new pg.Pool({
  host: '127.0.0.1', port: 5432, database: 'wellbeing',
  user: 'wellbeing', password: 'guixu@123', connectionTimeoutMillis: 8000,
});
const { rows } = await pool.query(
  `SELECT name, email, role, (password_hash LIKE '$2%') AS is_bcrypt,
          length(password_hash) AS len, created_at::date AS created
   FROM users ORDER BY created_at`
);
for (const r of rows) {
  console.log(`${String(r.name).padEnd(20)} | email=${String(r.email).padEnd(30)} | role=${String(r.role).padEnd(10)} | ${r.is_bcrypt ? 'bcrypt' : '明文'} | 建于 ${r.created}`);
}
await pool.end();
