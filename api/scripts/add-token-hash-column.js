const { Pool } = require('pg');

const pool = new Pool({
  host: '8.130.93.151',
  port: 10010,
  database: 'wellbeing',
  user: 'wellbeing',
  password: 'guixu@123',
});

async function addTokenHashColumn() {
  try {
    console.log('连接数据库...');
    await pool.connect();

    console.log('添加token_hash字段...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS token_hash VARCHAR(255)
    `);
    console.log('✅ token_hash字段添加成功');

    // 创建索引
    console.log('创建token_hash索引...');
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_token_hash 
      ON users(token_hash)
    `);
    console.log('✅ 索引创建成功');

  } catch (error) {
    console.error('❌ 操作失败:', error.message);
  } finally {
    await pool.end();
  }
}

addTokenHashColumn();
