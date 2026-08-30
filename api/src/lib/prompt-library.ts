/**
 * 提示词库：从 Wiki.js 按路径加载提示词模板
 *
 * 设计：
 *   - Wiki.js 中的提示词页面为【权威版本】，教研/运营可直接在 Wiki 修改，无需发版
 *   - 代码内置模板（api/src/prompts/*）为【兜底快照】，Wiki 不可用/页面缺失时自动回落
 *   - 页面格式：`## system` / `## user` 两个段落 + `{{var}}` 占位符
 *
 * 环境变量：
 *   WIKI_PROMPT_ENABLED   默认 false，开启后优先走知识库
 *   WIKI_API_URL          Wiki.js 地址，默认 http://localhost:3000
 *   WIKI_API_KEY          Administration -> API Access 生成的 API Key
 *   WIKI_PROMPT_ROOT      提示词页面根路径，默认 wellbeing/prompts
 *   WIKI_PROMPT_LOCALE    页面语言，默认 zh（与站点默认语言一致）
 *   WIKI_PROMPT_CACHE_TTL_SEC  内存缓存秒数，默认 300
 */

const API_URL = process.env.WIKI_API_URL || 'http://localhost:3000';
const API_KEY = process.env.WIKI_API_KEY || '';
const ROOT = process.env.WIKI_PROMPT_ROOT || 'wellbeing/prompts';
const LOCALE = process.env.WIKI_PROMPT_LOCALE || 'zh';
const TTL_MS = (Number(process.env.WIKI_PROMPT_CACHE_TTL_SEC) || 300) * 1000;

export interface PromptTemplate {
  system: string;
  user: string;
  /** 命中来源：wiki | cache */
  source: 'wiki' | 'cache';
}

export function isPromptLibraryEnabled(): boolean {
  return Boolean(process.env.WIKI_PROMPT_ENABLED === 'true' && API_KEY);
}

// ---------- 页面解析 ----------

/** 解析 `## system` / `## user` 等段落；只认第一个匹配段。无任何二级标题时整页作为 main 段（碎片模板用） */
function parseSections(content: string): { system?: string; user?: string; main?: string } {
  const out: Record<string, string> = {};
  const lines = content.split('\n');
  let current: string | null = null;
  const buf: string[] = [];
  let sawHeading = false;
  for (const line of lines) {
    const heading = line.match(/^##\s+(\w+)\s*$/);
    if (heading) {
      if (current && !(current in out)) out[current] = buf.join('\n').trim();
      current = heading[1];
      buf.length = 0;
      sawHeading = true;
    } else if (current) {
      buf.push(line);
    }
  }
  if (current && !(current in out)) out[current] = buf.join('\n').trim();
  if (!sawHeading) {
    // 整页去掉一级标题行后作为 main
    const body = content
      .split('\n')
      .filter((l) => !l.startsWith('# '))
      .join('\n')
      .trim();
    if (body) out.main = body;
  }
  return out;
}

// ---------- 缓存 ----------

interface CacheEntry {
  template: PromptTemplate | null;
  fetchedAt: number;
}
const cache = new Map<string, CacheEntry>();

// ---------- 加载 ----------

async function fetchFromWiki(key: string): Promise<PromptTemplate | null> {
  const path = `${ROOT}/${key}`;
  const query = `query ($path: String!, $locale: String!) {
    pages {
      singleByPath(path: $path, locale: $locale) {
        id
        title
        content
      }
    }
  }`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${API_URL}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({ query, variables: { path, locale: LOCALE } }),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    if (json?.errors?.length) throw new Error(json.errors[0]?.message || 'graphql error');

    const content: string | undefined = json?.data?.pages?.singleByPath?.content;
    if (!content) return null; // 页面不存在 → 走代码兜底

    const sections = parseSections(content);
    if (!sections.system || !sections.user) {
      console.warn(`[prompt-library] ${path} 缺少 ## system 或 ## user 段落，使用代码内置模板`);
      return null;
    }
    return { system: sections.system, user: sections.user, source: 'wiki' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 加载单段模板（碎片）：页面有 ## system/## user 段时不适用；
 * 无二级标题的整页作为 main 段返回。供 registry 的碎片模板走 Wiki 覆盖。
 */
const sectionCache = new Map<string, { text: string | null; fetchedAt: number }>();

export async function loadPromptSection(key: string): Promise<string | null> {
  if (!isPromptLibraryEnabled()) {
    console.info(`[prompt-library] MISS key=${key} reason=wiki-disabled fallback=builtin`);
    return null;
  }

  const cached = sectionCache.get(key);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
    console.info(
      cached.text
        ? `[prompt-library] HIT key=${key} source=wiki-cache`
        : `[prompt-library] MISS key=${key} source=wiki-cache fallback=builtin`
    );
    return cached.text;
  }

  const path = `${ROOT}/${key}`;
  const query = `query ($path: String!, $locale: String!) {
    pages { singleByPath(path: $path, locale: $locale) { id content } }
  }`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${API_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({ query, variables: { path, locale: LOCALE } }),
      signal: controller.signal,
    });
    if (!response.ok) {
      console.info(`[prompt-library] MISS key=${key} reason=http-${response.status} fallback=builtin`);
      return null;
    }
    const json = await response.json();
    const content: string | undefined = json?.data?.pages?.singleByPath?.content;
    if (!content) {
      console.info(`[prompt-library] MISS key=${key} reason=page-not-found fallback=builtin`);
      return null;
    }
    const sections = parseSections(content);
    const text = sections.main ?? null;
    sectionCache.set(key, { text, fetchedAt: Date.now() });
    console.info(
      text
        ? `[prompt-library] HIT key=${key} source=wiki`
        : `[prompt-library] MISS key=${key} reason=main-section-missing fallback=builtin`
    );
    return text;
  } catch (err) {
    console.warn(
      `[prompt-library] MISS key=${key} reason=request-error fallback=builtin:`,
      err instanceof Error ? err.message : err
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 加载提示词模板（带缓存）。
 * @returns 模板；未启用/失败/页面缺失时返回 null，调用方回落代码内置模板
 */
export async function loadPromptTemplate(key: string): Promise<PromptTemplate | null> {
  if (!isPromptLibraryEnabled()) {
    console.info(`[prompt-library] MISS key=${key} reason=wiki-disabled fallback=builtin`);
    return null;
  }

  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
    console.info(
      cached.template
        ? `[prompt-library] HIT key=${key} source=wiki-cache`
        : `[prompt-library] MISS key=${key} source=wiki-cache fallback=builtin`
    );
    return cached.template ? { ...cached.template, source: 'cache' } : null;
  }

  let template: PromptTemplate | null = null;
  try {
    template = await fetchFromWiki(key);
  } catch (err) {
    console.warn(`[prompt-library] 加载 ${key} 失败，使用代码内置模板:`, err instanceof Error ? err.message : err);
  }
  cache.set(key, { template, fetchedAt: Date.now() });
  console.info(
    template
      ? `[prompt-library] HIT key=${key} source=wiki`
      : `[prompt-library] MISS key=${key} reason=page-not-found-or-invalid fallback=builtin`
  );
  return template;
}

/**
 * 渲染模板：`{{var}}` → vars[var]；未提供的变量替换为空串
 */
export function renderTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) =>
    name in vars ? String(vars[name]) : ''
  );
}

/** 清空缓存（测试或强制刷新用） */
export function clearPromptCache(): void {
  cache.clear();
  sectionCache.clear();
}
