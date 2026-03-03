import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '用户名和密码不能为空' },
        { status: 400 }
      );
    }

    // 从 PostgreSQL 查询用户（支持 email 或 name）
    const { data: byEmail } = await db.from('users').select('*').eq('email', username);
    const { data: byName } = await db.from('users').select('*').eq('name', username);
    const userData = (byEmail && byEmail[0]) || (byName && byName[0]);

    if (!userData) {
      // 无数据库用户时使用模拟数据（开发/测试）
      const mockUsers: Record<string, any> = {
        admin: { id: '1', email: 'admin@test.com', name: '超级管理员', role: 'super_admin', organization_id: null },
        org_admin: { id: '2', email: 'org_admin@test.com', name: '机构管理员', role: 'org_admin', organization_id: '1' },
        research_leader: { id: '3', email: 'research@test.com', name: '教研组长', role: 'research_leader', organization_id: '1' },
        creator: { id: '4', email: 'creator@test.com', name: '课件制作人', role: 'creator', organization_id: '1' },
        viewer: { id: '5', email: 'viewer@test.com', name: '普通老师', role: 'viewer', organization_id: '1' },
      };
      const mock = mockUsers[username];
      if (mock && password === '123456') {
        const token = `pg_token_${crypto.randomBytes(32).toString('hex')}`;
        return NextResponse.json({
          user: {
            id: mock.id,
            username: mock.email,
            role: mock.role,
            name: mock.name,
            organizationId: mock.organization_id,
          },
          token,
          message: '登录成功（模拟模式）',
        });
      }
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    // 验证密码（支持 bcrypt 或明文，便于迁移）
    const valid =
      userData.password_hash?.startsWith('$2') // bcrypt
        ? await bcrypt.compare(password, userData.password_hash)
        : password === userData.password_hash;

    if (!valid) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }

    const token = `pg_token_${crypto.randomBytes(32).toString('hex')}`;
    return NextResponse.json({
      user: {
        id: userData.id,
        username: userData.email || userData.name,
        role: userData.role || 'viewer',
        name: userData.name || userData.email,
        organizationId: userData.organization_id,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '登录失败，请重试' }, { status: 500 });
  }
}

