import { NextRequest, NextResponse } from 'next/server';
import { getPrompt, getRawTemplate, PROMPT_META } from '@/prompts/registry';

/**
 * 提示词统一查询接口（前端/调试用）
 *
 * GET /api/prompts/:key            → 原始模板（含 {{var}} 占位符）
 * GET /api/prompts/:key?vars=JSON  → 渲染后的文本（vars 为 {"变量":"值"} 的 URL 编码 JSON）
 *
 * 前端通过 src/services/promptLibrary.js 拉取，不再各自硬编码提示词。
 */

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  const { key } = params;

  // 未注册的 key：与 registry 一致直接报错，强制登记
  if (!PROMPT_META[key]) {
    return NextResponse.json(
      { error: `未注册的提示词 key: "${key}"`, availableKeys: Object.keys(PROMPT_META) },
      { status: 404, headers: corsHeaders() }
    );
  }

  const varsParam = request.nextUrl.searchParams.get('vars');
  let vars: Record<string, string | number> = {};
  if (varsParam) {
    try {
      const parsed = JSON.parse(varsParam);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        vars = parsed as Record<string, string | number>;
      }
    } catch {
      return NextResponse.json(
        { error: 'vars 必须是 JSON 对象字符串，如 ?vars={"word":"apple"}' },
        { status: 400, headers: corsHeaders() }
      );
    }
  }

  const template = await getRawTemplate(key);
  const rendered = Object.keys(vars).length ? await getPrompt(key, vars) : undefined;

  return NextResponse.json(
    { key, meta: PROMPT_META[key], template, ...(rendered !== undefined ? { rendered } : {}) },
    { headers: corsHeaders() }
  );
}
