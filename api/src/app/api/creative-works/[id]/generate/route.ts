import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { generateYoga, generateMusic } from '@/lib/experience/generator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// 创作工坊 moduleId → 生成器
const GENERATOR_BY_MODULE: Record<string, (params: Record<string, string>) => Promise<{ result: unknown; html: string }>> = {
  'interactive-yoga': generateYoga,
  'music-star-quest': generateMusic,
};

// POST /api/creative-works/[id]/generate — 为自己的草稿生成作品（LLM + 模板注入）
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { rows } = await db.query(
      `SELECT id, module_id, title, parameters, status FROM creative_works WHERE id = $1 AND user_id = $2`,
      [numericId, userId]
    );
    const work = rows[0];
    if (!work) {
      return NextResponse.json({ error: '草稿不存在' }, { status: 404 });
    }

    const generator = GENERATOR_BY_MODULE[work.module_id];
    if (!generator) {
      return NextResponse.json({ error: `该模块（${work.module_id}）暂不支持生成` }, { status: 400 });
    }

    // 状态置为生成中
    await db.query(`UPDATE creative_works SET status = 'generating', updated_at = NOW() WHERE id = $1`, [numericId]);

    try {
      const parameters = (work.parameters && typeof work.parameters === 'object') ? work.parameters : {};
      const scalarParams: Record<string, string> = {};
      for (const [k, v] of Object.entries(parameters as Record<string, unknown>)) {
        if (v !== null && v !== undefined) scalarParams[k] = String(v);
      }
      if (work.title && !scalarParams.title) scalarParams.title = work.title;

      const { result, html } = await generator(scalarParams);

      await db.query(
        `UPDATE creative_works SET result = $1::jsonb, html = $2, status = 'done', updated_at = NOW() WHERE id = $3`,
        [JSON.stringify(result), html, numericId]
      );

      return NextResponse.json({
        data: { id: numericId, status: 'done', result, htmlUrl: `/api/creative-works/${numericId}/html` },
      });
    } catch (genError) {
      console.error('[creative-works/generate] generation failed:', genError);
      await db.query(`UPDATE creative_works SET status = 'failed', updated_at = NOW() WHERE id = $1`, [numericId]);
      return NextResponse.json(
        { error: (genError as Error).message || '生成失败，请重试' },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('[creative-works/generate] failed:', error);
    return NextResponse.json({ error: '生成请求失败' }, { status: 500 });
  }
}
