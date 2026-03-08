import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth';

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

    // 创建用户对象
    const authUser = {
      id: userData.id,
      username: userData.email || userData.name,
      role: userData.role || 'viewer',
      name: userData.name || userData.email,
      organizationId: userData.organization_id,
    };

    // 生成token
    const token = generateToken(authUser);

    return NextResponse.json({
      user: authUser,
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '登录失败，请重试' }, { status: 500 });
  }
}
