import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// DELETE /api/creative-works/[id] — 删除自己的草稿
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || '认证失败' }, { status: 401 });
    }
    const userId = authResult.user?.id;
    const { id } = params;
    const numericId = Number(id);
    if (!userId || !Number.isInteger(numericId)) {
      return NextResponse.json({ error: '参数无效' }, { status: 400 });
    }

    const result = await db.query(
      `DELETE FROM creative_works WHERE id = $1 AND user_id = $2 RETURNING id`,
      [numericId, userId]
    );
    if (!result.rows.length) {
      return NextResponse.json({ error: '草稿不存在或无权删除' }, { status: 404 });
    }
    return NextResponse.json({ data: { id: numericId } });
  } catch (error) {
    console.error('[creative-works] DELETE failed:', error);
    return NextResponse.json({ error: '删除草稿失败' }, { status: 500 });
  }
}
