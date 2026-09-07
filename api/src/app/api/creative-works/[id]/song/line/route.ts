import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateMusicLyricLine, MusicResult } from '@/lib/experience/generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// POST /api/creative-works/[id]/song/line — 按关键词生成/重新生成单行歌词
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = authenticate(request);
    if (!authResult.success) return NextResponse.json({ error: authResult.error || '认证失败' }, { status: 401 });
    const userId = authResult.user?.id;
    const numericId = Number(params.id);
    const body = await request.json().catch(() => null);
    const index = Number(body?.index);
    const keywords = String(body?.keywords || '').trim().slice(0, 200);
    if (!userId || !Number.isInteger(numericId) || numericId <= 0 || !Number.isInteger(index) || index < 0) {
      return NextResponse.json({ error: '参数无效' }, { status: 400 });
    }

    const { rows } = await db.query(
      `SELECT id, module_id, title, parameters, result FROM creative_works WHERE id = $1 AND user_id = $2`,
      [numericId, userId]
    );
    const work = rows[0];
    if (!work) return NextResponse.json({ error: '作品不存在' }, { status: 404 });
    if (work.module_id !== 'music-star-quest') return NextResponse.json({ error: '该模块不支持歌词生成' }, { status: 400 });

    const existing = (work.result && typeof work.result === 'object') ? work.result as Partial<MusicResult> : {};
    const lyrics = Array.isArray(existing.lyrics) ? existing.lyrics.map((line) => ({ ...line })) : [];
    if (!lyrics[index]) return NextResponse.json({ error: '歌词行不存在' }, { status: 404 });
    const scalarParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(work.parameters || {})) {
      if (value !== null && value !== undefined) scalarParams[key] = String(value);
    }
    const text = await generateMusicLyricLine(scalarParams, {
      index,
      time: String(lyrics[index].time || ''),
      currentText: String(lyrics[index].text || ''),
      keywords,
      lyrics,
      targetPatterns: Array.isArray(existing.targetPatterns) ? existing.targetPatterns.map(String) : [],
    });
    lyrics[index] = { ...lyrics[index], text };
    const nextResult = { ...existing, lyrics };
    await db.query(
      `UPDATE creative_works SET result = $1::jsonb, updated_at = NOW() WHERE id = $2 AND user_id = $3`,
      [JSON.stringify(nextResult), numericId, userId]
    );
    return NextResponse.json({ data: { index, line: lyrics[index], lyrics } });
  } catch (error) {
    console.error('[creative-works/song/line] failed:', error);
    return NextResponse.json({ error: (error as Error).message || '单行歌词生成失败，请重试' }, { status: 502 });
  }
}
