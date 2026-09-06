import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { generateYogaPlan, renderYogaHtml, YogaPlan, YogaResult } from '@/lib/experience/generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// POST /api/creative-works/[id]/plan — 生成互动式情境瑜伽的活动方案（工作室 step 2）
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
    if (work.module_id !== 'interactive-yoga') {
      return NextResponse.json({ error: '该模块不支持活动方案生成' }, { status: 400 });
    }

    const parameters = (work.parameters && typeof work.parameters === 'object') ? work.parameters : {};
    const scalarParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(parameters as Record<string, unknown>)) {
      if (v !== null && v !== undefined) scalarParams[k] = String(v);
    }
    if (work.title && !scalarParams.title) scalarParams.title = work.title;

    const { title, plan } = await generateYogaPlan(scalarParams);

    const existing = (work.result && typeof work.result === 'object') ? work.result as Partial<YogaResult> : {};
    const nextResult: Partial<YogaResult> = { ...existing, title: title || existing.title || work.title, plan: plan as YogaPlan };
    // 已有逐页设计时同步重渲染成品，保证方案改动反映到 HTML
    const html = Array.isArray(existing.pages) && existing.pages.length
      ? renderYogaHtml({ title: nextResult.title, pages: existing.pages }, work.title)
      : null;

    await db.query(
      `UPDATE creative_works SET result = $1::jsonb, html = COALESCE($2, html), updated_at = NOW() WHERE id = $3`,
      [JSON.stringify(nextResult), html, numericId]
    );

    return NextResponse.json({ data: { title: nextResult.title, plan } });
  } catch (error) {
    console.error('[creative-works/plan] failed:', error);
    return NextResponse.json({ error: (error as Error).message || '方案生成失败，请重试' }, { status: 502 });
  }
}
