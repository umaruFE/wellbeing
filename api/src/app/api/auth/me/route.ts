import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const { data } = await db
      .from('users')
      .select('id,email,name,role,organization_id,organization:organizations(*)')
      .eq('id', authResult.user!.id)
      .single();

    const user = data ? {
      id: data.id,
      username: data.email || data.name,
      email: data.email || '',
      role: data.role || authResult.user!.role,
      name: data.name || data.email || authResult.user!.name,
      organizationId: data.organization_id || null,
      organization: data.organization || null,
    } : authResult.user;

    return NextResponse.json({
      success: true,
      user
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('[auth/me] 验证失败:', error);
    return NextResponse.json(
      { error: '认证失败' },
      { status: 401, headers: corsHeaders() }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticate(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const body = await request.json();
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '');

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: '当前密码和新密码不能为空' },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: '新密码至少 6 位' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const { data: currentUser, error: fetchError } = await db
      .from('users')
      .select('id,password_hash')
      .eq('id', authResult.user!.id)
      .single();

    if (fetchError || !currentUser) {
      return NextResponse.json(
        { error: fetchError?.message || '用户不存在' },
        { status: fetchError ? 500 : 404, headers: corsHeaders() }
      );
    }

    const storedPassword = currentUser.password_hash || '';
    const validPassword = storedPassword.startsWith('$2')
      ? await bcrypt.compare(currentPassword, storedPassword)
      : currentPassword === storedPassword;

    if (!validPassword) {
      return NextResponse.json(
        { error: '当前密码不正确' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const { data, error } = await db
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', authResult.user!.id)
      .select()
      .single();

    if (error || !data) {
      const updateError = error as { message?: string } | null;
      return NextResponse.json(
        { error: updateError?.message || '用户不存在' },
        { status: error ? 500 : 404, headers: corsHeaders() }
      );
    }

    return NextResponse.json({
      success: true,
      data: { id: data.id },
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('[auth/me] 修改密码失败:', error);
    return NextResponse.json(
      { error: '密码修改失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
