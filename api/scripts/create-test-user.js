const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: '8.130.93.151',
  port: 10010,
  database: 'wellbeing',
  user: 'wellbeing',
  password: 'guixu@123',
});

async function createTestUser() {
  try {
    console.log('连接数据库...');
    await pool.connect();

    const users = [
      {
        name: 'test',
        email: 'test@test.com',
        role: 'creator',
        password: '123456',
        organization_id: null,
      },
      {
        name: 'admin',
        email: 'admin@test.com',
        role: 'super_admin',
        password: 'xxx@123456',
        organization_id: null,
      },
    ];

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      console.log(`插入${user.name}用户...`);
      const result = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, organization_id, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           role = EXCLUDED.role,
           updated_at = EXCLUDED.updated_at
         RETURNING id, name, email, role`,
        [
          user.name,
          user.email,
          hashedPassword,
          user.role,
          user.organization_id,
          new Date(),
          new Date(),
        ]
      );
      console.log(`✅ ${user.name}用户创建成功:`, result.rows[0]);
    }
    
    console.log('\n测试登录信息:');
    console.log('用户名: test, 密码: 123456');
    console.log('用户名: admin, 密码: xxx@123456');
  } catch (error) {
    console.error('❌ 创建用户失败:', error.message);
  } finally {
    await pool.end();
  }
}

createTestUser();
