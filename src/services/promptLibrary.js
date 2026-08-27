// 提示词库服务：从后端统一注册表拉取提示词模板（/api/prompts/:key）
//
// 设计（与后端 registry 一致）：
//   - 后端 Wiki 页面（wellbeing/prompts/<key>）为权威版本，builtin 为兜底
//   - 前端仅保留「接口不可用时的本地兜底常量」，传给 getTemplate 的第二参
//   - 渲染语法 {{var}} 与后端/n8n 完全一致
//
// 用法：
//   import { getPromptTemplate, renderPromptTemplate } from '@/services/promptLibrary';
//   const tpl = await getPromptTemplate('frontend.storybook-visual-style', LOCAL_FALLBACK);
//   const text = renderPromptTemplate(tpl, { word: 'apple' });

const API_URL = import.meta.env.VITE_API_URL;

const cache = new Map();

/**
 * 拉取原始模板（含 {{var}} 占位符）。
 * @param {string} key 注册表 key（见 api/src/prompts/registry.ts 的 PROMPT_META）
 * @param {string} [fallback] 本地兜底文本（接口失败/未注册时使用，避免页面崩溃）
 * @returns {Promise<string>}
 */
export async function getPromptTemplate(key, fallback = '') {
  if (cache.has(key)) return cache.get(key);

  try {
    const response = await fetch(`${API_URL}/prompts/${encodeURIComponent(key)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data?.template) throw new Error('empty template');
    cache.set(key, data.template);
    return data.template;
  } catch (error) {
    console.warn(`[promptLibrary] 拉取 ${key} 失败，使用本地兜底:`, error?.message || error);
    return fallback;
  }
}

/**
 * 渲染模板：{{var}} → vars[var]，未提供的变量替换为空串（与后端 renderTemplate 一致）
 * @param {string} template
 * @param {Record<string, string|number>} vars
 */
export function renderPromptTemplate(template, vars = {}) {
  return String(template).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name) =>
    name in vars ? String(vars[name]) : ''
  );
}
