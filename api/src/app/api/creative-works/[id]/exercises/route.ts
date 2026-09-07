import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { generateMusicExercises, MusicResult } from '@/lib/experience/generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// POST /api/creative-works/[id]/exercises — 第一关练习 + 四关教学方案（工作室 step 3，基于已存歌词）
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || '认证失败' }, { status: 401 });
    }
    const userId = authResult.user?.id;
    const numericId = Number(params.id);
    const body = await request.json().catch(() => ({}));
    const section = typeof body?.section === 'string' ? body.section : '';
    const allowedSections = new Set(['ex1FillData', 'ex2Items', 'ex3Data', 'teachingPlans']);
    if (section && !allowedSections.has(section)) {
      return NextResponse.json({ error: '不支持的生成区块' }, { status: 400 });
    }
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
      return NextResponse.json({ error: '该模块不支持练习生成' }, { status: 400 });
    }

    const existing = (work.result && typeof work.result === 'object') ? work.result as Partial<MusicResult> : {};
    const lyrics = Array.isArray(existing.lyrics) ? existing.lyrics : [];
    if (lyrics.length < 4) {
      return NextResponse.json({ error: '请先在「歌曲创作」步骤生成或填写歌词' }, { status: 400 });
    }

    const parameters = (work.parameters && typeof work.parameters === 'object') ? work.parameters : {};
    const scalarParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(parameters as Record<string, unknown>)) {
      if (v !== null && v !== undefined) scalarParams[k] = String(v);
    }

    const exercises = await generateMusicExercises(scalarParams, {
      title: existing.title || work.title,
      lyrics,
      targetPatterns: Array.isArray(existing.targetPatterns) ? existing.targetPatterns : [],
    });

    const generated = section
      ? { [section]: exercises[section as keyof typeof exercises] }
      : exercises;
    const nextResult: Partial<MusicResult> = { ...existing, ...generated };
    await db.query(
      `UPDATE creative_works SET result = $1::jsonb, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(nextResult), numericId]
    );

    return NextResponse.json({ data: generated });
  } catch (error) {
    console.error('[creative-works/exercises] failed:', error);
    return NextResponse.json({ error: (error as Error).message || '练习生成失败，请重试' }, { status: 502 });
  }
}
