const { Pool } = require('pg');

const pool = new Pool({
  host: '8.130.93.151',
  port: 10010,
  database: 'wellbeing',
  user: 'wellbeing',
  password: 'guixu@123',
});

async function checkUsersTable() {
  try {
    console.log('连接数据库...');
    await pool.connect();

    console.log('\n查询users表结构...');
    const columnsResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    console.log('users表字段:');
    columnsResult.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    console.log('\n查询现有用户...');
    const usersResult = await pool.query(`
      SELECT id, name, email, role FROM users LIMIT 5
    `);
    console.log('现有用户:');
    usersResult.rows.forEach(user => {
      console.log(`  - ${user.name} (${user.email}): ${user.role}`);
    });

  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsersTable();
