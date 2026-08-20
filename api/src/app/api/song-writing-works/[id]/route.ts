import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = authenticate(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || '认证失败' }, { status: 401 });
    }
    const { title, coverUrl, workData } = await request.json();
    const result = await db.query(
      `UPDATE song_writing_works
       SET title = $1, cover_url = $2, work_data = $3::jsonb, updated_at = NOW()
       WHERE id = $4 AND user_id = $5 RETURNING *`,
      [title || '未命名歌曲', coverUrl || '', JSON.stringify(workData || {}), params.id, authResult.user.id],
    );
    if (!result.rows.length) return NextResponse.json({ error: '歌曲作品不存在' }, { status: 404 });
    return NextResponse.json({ data: result.rows[0] });
  } catch (error) {
    console.error('[song-writing-works] PUT failed:', error);
    return NextResponse.json({ error: '歌曲作品保存失败' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = authenticate(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || '认证失败' }, { status: 401 });
    }
    const result = await db.query(
      'DELETE FROM song_writing_works WHERE id = $1 AND user_id = $2 RETURNING id',
      [params.id, authResult.user.id],
    );
    if (!result.rows.length) return NextResponse.json({ error: '歌曲作品不存在' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[song-writing-works] DELETE failed:', error);
    return NextResponse.json({ error: '歌曲作品删除失败' }, { status: 500 });
  }
}
