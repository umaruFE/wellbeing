import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { generateMusicSong, MusicResult } from '@/lib/experience/generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// POST /api/creative-works/[id]/song — 星光录音棚歌曲创作（工作室 step 2）
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
      `SELECT id, module_id, title, parameters, result FROM creative_works WHERE id = $1 AND user_id = $2`,
      [numericId, userId]
    );
    const work = rows[0];
    if (!work) {
      return NextResponse.json({ error: '作品不存在' }, { status: 404 });
    }
    if (work.module_id !== 'music-star-quest') {
      return NextResponse.json({ error: '该模块不支持歌曲生成' }, { status: 400 });
    }

    const parameters = (work.parameters && typeof work.parameters === 'object') ? work.parameters : {};
    const scalarParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(parameters as Record<string, unknown>)) {
      if (v !== null && v !== undefined) scalarParams[k] = String(v);
    }
    if (work.title && !scalarParams.title) scalarParams.title = work.title;

    const { title, song } = await generateMusicSong(scalarParams);

    const existing = (work.result && typeof work.result === 'object') ? work.result as Partial<MusicResult> : {};
    const nextResult: Partial<MusicResult> = {
      ...existing,
      title: title || existing.title || work.title,
      songMeta: song.songMeta,
      lyrics: song.lyrics,
      targetPatterns: song.targetPatterns,
    };

    await db.query(
      `UPDATE creative_works SET result = $1::jsonb, title = $2, updated_at = NOW() WHERE id = $3`,
      [JSON.stringify(nextResult), nextResult.title, numericId]
    );

    return NextResponse.json({ data: { title: nextResult.title, song } });
  } catch (error) {
    console.error('[creative-works/song] failed:', error);
    return NextResponse.json({ error: (error as Error).message || '歌曲生成失败，请重试' }, { status: 502 });
  }
}
