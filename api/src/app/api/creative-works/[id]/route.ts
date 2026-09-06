import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { renderYogaHtml, YogaPage, YogaPlan, YogaResult, MusicResult } from '@/lib/experience/generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// PUT /api/creative-works/[id] — 保存步骤数据（基础信息/标题/方案/逐页设计），瑜伽作品同步重渲染成品 HTML
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: '请求体无效' }, { status: 400 });
    }

    const { rows } = await db.query(
      `SELECT id, module_id, title, parameters, result FROM creative_works WHERE id = $1 AND user_id = $2`,
      [numericId, userId]
    );
    const work = rows[0];
    if (!work) {
      return NextResponse.json({ error: '作品不存在' }, { status: 404 });
    }

    const parameters = (work.parameters && typeof work.parameters === 'object') ? { ...work.parameters } : {};
    if (body.parameters && typeof body.parameters === 'object') {
      Object.assign(parameters, body.parameters);
    }

    const existing = (work.result && typeof work.result === 'object') ? { ...work.result } as Partial<YogaResult & MusicResult> : {};
    if (body.plan !== undefined) existing.plan = body.plan as YogaPlan;
    if (Array.isArray(body.pages)) existing.pages = body.pages as YogaPage[];
    // 星光录音棚：歌曲 / 练习 / 音频 分段保存（音频 base64 体积大，仅显式上传时携带）
    if (body.song && typeof body.song === 'object') {
      if (body.song.songMeta !== undefined) existing.songMeta = body.song.songMeta;
      if (Array.isArray(body.song.lyrics)) existing.lyrics = body.song.lyrics;
      if (Array.isArray(body.song.targetPatterns)) existing.targetPatterns = body.song.targetPatterns;
    }
    if (body.exercises && typeof body.exercises === 'object') {
      if (Array.isArray(body.exercises.ex1FillData)) existing.ex1FillData = body.exercises.ex1FillData;
      if (Array.isArray(body.exercises.ex2Items)) existing.ex2Items = body.exercises.ex2Items;
      if (Array.isArray(body.exercises.ex3Data)) existing.ex3Data = body.exercises.ex3Data;
      if (body.exercises.teachingPlans !== undefined) existing.teachingPlans = body.exercises.teachingPlans;
    }
    if (body.audio !== undefined) existing.audio = body.audio;
    if (typeof body.title === 'string' && body.title.trim()) existing.title = body.title.trim();
    const title = existing.title || work.title;

    // 瑜伽作品：有逐页设计就重渲染成品；其他模块不动 html（音乐课件由 render 路由显式生成）
    let html: string | null = null;
    if (work.module_id === 'interactive-yoga' && Array.isArray(existing.pages) && existing.pages.length) {
      html = renderYogaHtml({ title, pages: existing.pages }, work.title);
    }

    const { rows: updated } = await db.query(
      `UPDATE creative_works
       SET parameters = $1::jsonb, result = $2::jsonb, title = $3, html = COALESCE($4, html), updated_at = NOW()
       WHERE id = $5 AND user_id = $6
       RETURNING id, module_id, module_name, title, parameters, status, result, created_at, updated_at`,
      [JSON.stringify(parameters), JSON.stringify(existing), title, html, numericId, userId]
    );

    return NextResponse.json({ data: updated[0] });
  } catch (error) {
    console.error('[creative-works] PUT failed:', error);
    return NextResponse.json({ error: '保存失败' }, { status: 500 });
  }
}

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
