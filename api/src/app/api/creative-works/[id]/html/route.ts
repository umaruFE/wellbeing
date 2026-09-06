import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/creative-works/[id]/html — 查看/下载生成的作品 HTML（iframe 或新窗口打开）
// 新窗口打开带不了 Authorization 头，支持 ?token= 查询参数（与 header 二选一）
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = extractToken(request) || new URL(request.url).searchParams.get('token');
    const authResult = token ? verifyToken(token) : { success: false, error: '未提供认证token' };
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || '认证失败' }, { status: 401 });
    }
    const userId = authResult.user?.id;
    const { id } = params;
    const numericId = Number(id);
    if (!userId || !Number.isInteger(numericId)) {
      return NextResponse.json({ error: '参数无效' }, { status: 400 });
    }

    const { rows } = await db.query(
      `SELECT id, title, html FROM creative_works WHERE id = $1 AND user_id = $2`,
      [numericId, userId]
    );
    const work = rows[0];
    if (!work || !work.html) {
      return NextResponse.json({ error: '作品尚未生成' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const download = searchParams.get('download');
    const safeName = String(work.title || `work-${numericId}`).replace(/[^\w\u4e00-\u9fa5-]+/g, '_').slice(0, 60);

    return new NextResponse(work.html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, max-age=0, must-revalidate',
        ...(download
          ? { 'Content-Disposition': `attachment; filename="${encodeURIComponent(safeName)}.html"` }
          : {}),
      },
    });
  } catch (error) {
    console.error('[creative-works/html] failed:', error);
    return NextResponse.json({ error: '获取作品失败' }, { status: 500 });
  }
}
