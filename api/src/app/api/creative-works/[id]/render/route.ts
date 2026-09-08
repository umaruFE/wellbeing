import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { renderMusicGameHtml, MusicResult } from '@/lib/experience/generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// POST /api/creative-works/[id]/render — 渲染星光录音棚游戏课件（显式触发：音频 base64 体积大，不走自动保存）
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || '认证失败' }, { status: 401 });
    }
    const userId = authResult.user?.id;
    const numericId = Number(params.id);
    if (!userId || !Number.isInteger(numericId)) {
      return NextResponse.json({ error: '参数无效' }, { status: 400 });
    }

    const { rows } = await db.query(
      `SELECT id, module_id, title, result FROM creative_works WHERE id = $1 AND user_id = $2`,
      [numericId, userId]
    );
    const work = rows[0];
    if (!work) {
      return NextResponse.json({ error: '作品不存在' }, { status: 404 });
    }
    if (work.module_id !== 'music-star-quest') {
      return NextResponse.json({ error: '该模块不支持课件渲染' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const existing = (work.result && typeof work.result === 'object') ? work.result as Partial<MusicResult> : {};
    const nextResult: Partial<MusicResult> = { ...existing };
    if (body?.audio && typeof body.audio === 'object') nextResult.audio = body.audio;

    if (!Array.isArray(nextResult.lyrics) || !nextResult.lyrics.length) {
      return NextResponse.json({ error: '请先完成「歌曲创作」步骤' }, { status: 400 });
    }

    const html = renderMusicGameHtml(nextResult as MusicResult, work.title);
    await db.query(
      `UPDATE creative_works SET result = $1::jsonb, html = $2, status = 'done', updated_at = NOW() WHERE id = $3`,
      [JSON.stringify(nextResult), html, numericId]
    );

    // HTML 直接随响应返回（前端用 Blob URL 在 iframe 中播放），不再提供独立的查看/下载路由
    return NextResponse.json({ data: { html, hasAudio: Boolean(nextResult.audio?.vocal || nextResult.audio?.backing) } });
  } catch (error) {
    console.error('[creative-works/render] failed:', error);
    return NextResponse.json({ error: (error as Error).message || '课件渲染失败，请重试' }, { status: 502 });
  }
}
