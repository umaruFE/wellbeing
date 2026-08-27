import { NextRequest, NextResponse } from 'next/server';
import { PROMPT_META, BUILTIN_PROMPTS } from '@/prompts/registry';
import { isPromptLibraryEnabled, loadPromptSection, loadPromptTemplate } from '@/lib/prompt-library';

/**
 * 提示词全量清单接口（测试/巡检用，浏览器直接打开）
 *
 * GET /api/prompts            → 全量 key 清单 + 元数据 + 归口状态
 * GET /api/prompts?probe=1    → 额外逐个探测 Wiki 页面是否可覆盖（较慢，仅调试用）
 * GET /api/prompts/:key       → 单个模板内容（见 [key]/route.ts）
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

export async function GET(request: NextRequest) {
  const probe = request.nextUrl.searchParams.get('probe') === '1';

  const items = await Promise.all(
    Object.entries(PROMPT_META).map(async ([key, meta]) => {
      const builtin = BUILTIN_PROMPTS[key];
      const stored = Boolean(builtin?.main || builtin?.system);

      /** runtime: 该 key 运行时实际从哪里取 */
      const runtime: 'registry' | 'external' =
        meta.source === 'builtin' || meta.source === 'module' ? 'registry' : 'external';

      let wikiOverride: boolean | null = null;
      if (probe && runtime === 'registry') {
        wikiOverride =
          meta.kind === 'pair'
            ? Boolean(await loadPromptTemplate(key))
            : Boolean(await loadPromptSection(key));
      }

      return {
        key,
        description: meta.description,
        caller: meta.caller,
        kind: meta.kind,
        source: meta.source,
        location: meta.location ?? null,
        runtime,
        stored,
        wikiOverride,
      };
    })
  );

  const bySource = items.reduce<Record<string, number>>((acc, it) => {
    acc[it.source] = (acc[it.source] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json(
    {
      total: items.length,
      wikiEnabled: isPromptLibraryEnabled(),
      bySource,
      // runtime=external 的条目运行时不经注册表（前端组装或 n8n 内部持有）
      notInRegistry: items.filter((i) => i.runtime === 'external').map((i) => i.key),
      items,
    },
    { headers: corsHeaders() }
  );
}
