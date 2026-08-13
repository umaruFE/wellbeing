import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const authResult = await authenticate(request);
  if (!authResult.success || !['super_admin', 'org_admin'].includes(authResult.user?.role || '')) {
    return NextResponse.json({ error: '无权删除账号' }, { status: 403 });
  }
  if (authResult.user?.id === params.id) {
    return NextResponse.json({ error: '不能删除当前登录账号' }, { status: 400 });
  }
  const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [params.id]);
  if (!result.rows.length) return NextResponse.json({ error: '账号不存在' }, { status: 404 });
  return NextResponse.json({ success: true });
}
