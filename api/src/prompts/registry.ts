/**
 * 提示词统一注册表 —— 全部 LLM / n8n 调用提示词的唯一入口
 *
 * 用法：
 *   const text = await getPrompt('ppt.poster-b2', { scene: '...' });          // 单段（碎片）
 *   const pair = await getPromptPair('picture-book-activity-plan', vars);      // 双段（system/user）
 *
 * 解析顺序：Wiki 页面（wellbeing/prompts/<key>，启用时）→ builtin.ts 内置 → 抛错（强制登记）
 *
 * 新增提示词的流程：
 *   1. 文本放入 builtin.ts（复杂构建函数放本目录独立模块）
 *   2. 在下方 PROMPT_META 登记用途与调用方
 *   3. 路由/模块只 import registry，不再各自内联文本
 */

import { loadPromptTemplate, loadPromptSection, renderTemplate } from '@/lib/prompt-library';
import { BUILTIN_PROMPTS } from './builtin';

export type PromptVars = Record<string, string | number>;

export interface PromptMeta {
  /** 用途一句话 */
  description: string;
  /** 调用方（路由/模块） */
  caller: string;
  /** 模板形态 */
  kind: 'pair' | 'fragment';
  /** 当前生效位置 */
  source: 'builtin' | 'module' | 'n8n-workflow' | 'frontend';
  /** source=module/n8n/frontend 时的具体位置 */
  location?: string;
}

/**
 * 全量提示词清单（含尚未收编的，便于「一处可查」）。
 * source 说明：
 *   builtin      → 已收编，getPrompt/getPromptPair 可用，Wiki 可覆盖
 *   module       → 在 prompts/ 独立模块中（复杂构建函数），改代码文件
 *   n8n-workflow → 提示词在 n8n 工作流内部，后端只透传结构化字段，去 n8n 改
 *   frontend     → 前端组装后透传，去前端对应页面改
 */
export const PROMPT_META: Record<string, PromptMeta> = {
  // ── 已收编（builtin，Wiki 可覆盖）────────────────────────
  'ai.word-emojis': { description: '儿童英文词卡 emoji 匹配', caller: 'ai/generate-word-emojis', kind: 'pair', source: 'builtin' },
  'picture-book-activity-plan': { description: '绘本活动计划生成（step 1）', caller: 'rag/generate', kind: 'pair', source: 'builtin' },
  'picture-book-design': { description: '绘本逐页设计生成（step 2）', caller: 'rag/generate', kind: 'pair', source: 'builtin' },
  'experience-yoga-design': { description: '互动式情境瑜伽逐页设计生成', caller: 'creative-works/[id]/generate', kind: 'pair', source: 'builtin' },
  'experience-music-song': { description: '星光录音棚歌曲创作包生成（歌词+练习+四关教学方案）', caller: 'creative-works/[id]/generate', kind: 'pair', source: 'builtin' },
  'course.theme-image-requirement': { description: '无文字封面插画要求', caller: 'ai/generate-course-overview', kind: 'fragment', source: 'builtin' },
  'course.overview.output-instruction.en': { description: '课程概览输出指令（英文）', caller: 'ai/generate-course-overview', kind: 'fragment', source: 'builtin' },
  'course.overview.output-instruction.zh': { description: '课程概览输出指令（中文）', caller: 'ai/generate-course-overview', kind: 'fragment', source: 'builtin' },
  'course.output-instruction.en': { description: '教案输出指令（英文）', caller: 'ai/generate-course', kind: 'fragment', source: 'builtin' },
  'course.output-instruction.zh': { description: '教案输出指令（中文）', caller: 'ai/generate-course', kind: 'fragment', source: 'builtin' },
  'course.overview-text.en': { description: '已有概览注入文本（英文）', caller: 'ai/generate-course', kind: 'fragment', source: 'builtin' },
  'course.overview-text.zh': { description: '已有概览注入文本（中文）', caller: 'ai/generate-course', kind: 'fragment', source: 'builtin' },
  'ppt.poster-b2': { description: 'B2 海报生图模板', caller: 'ai/generate-ppt-asset', kind: 'fragment', source: 'builtin' },
  'ppt.flashcard-b3': { description: 'B3 词卡生图模板', caller: 'ai/generate-ppt-asset', kind: 'fragment', source: 'builtin' },
  'scene.negative.background': { description: '背景图负面提示词', caller: 'ai/generate-scene', kind: 'fragment', source: 'builtin' },
  'scene.negative.character': { description: 'IP 角色图负面提示词', caller: 'ai/generate-scene', kind: 'fragment', source: 'builtin' },

  // ── 集中在 prompts/ 模块（改代码文件）────────────────────
  'course-journey': { description: '课堂旅程四阶段生成', caller: 'ai/generate-course-journey', kind: 'pair', source: 'module', location: 'prompts/course-journey.ts' },
  'song-writing': { description: '整首英文填空歌曲生成（含旋律/分级规则）', caller: 'ai/generate-song-writing', kind: 'pair', source: 'module', location: 'prompts/song-writing.ts' },
  'song-writing-line': { description: '单行歌词重生成', caller: 'ai/generate-song-writing-line', kind: 'pair', source: 'module', location: 'prompts/song-writing.ts' },
  'video-optimization': { description: '视频提示词优化', caller: 'ai/optimize-video-prompt', kind: 'pair', source: 'module', location: 'prompts/video.ts' },
  'storyboard-script': { description: '分镜脚本生成', caller: 'ai/generate-storyboard-script', kind: 'pair', source: 'module', location: 'prompts/video.ts' },

  // ── 前端组装透传（去前端改）──────────────────────────────
  'image-generation': { description: '通用图像生成 prompt（前端组装）', caller: 'ai/generate-images 等', kind: 'fragment', source: 'frontend', location: '前端各生成页组装' },
  'music-generation': { description: '音乐/配乐生成 prompt（前端组装）', caller: 'ai/generate-audio', kind: 'fragment', source: 'frontend', location: '前端音频页组装' },
  'voice-emotion': { description: 'TTS 情感提示（前端组装）', caller: 'ai/generate-voice', kind: 'fragment', source: 'frontend', location: '前端语音页组装' },

  // ── 前端组装提示词（已收编：前端经 /api/prompts/<key> 拉取，本地常量仅兜底）──
  'frontend.storybook-visual-style': { description: '绘本整页视觉风格', caller: '前端 picture-book/PictureBookStudioPage', kind: 'fragment', source: 'builtin' },
  'frontend.storybook-negative': { description: '绘本页面生图负面提示词', caller: '前端 picture-book/PictureBookStudioPage', kind: 'fragment', source: 'builtin' },
  'frontend.comfyui-negative-zh': { description: 'ComfyUI 通用负面提示词（中文）', caller: '前端 services/aiAssetService', kind: 'fragment', source: 'builtin' },
  'frontend.character-reference-zh': { description: '视频人物参考图提示词模板', caller: '前端 services/videoStoryboardService', kind: 'fragment', source: 'builtin' },

  // ── n8n 工作流提示词（已收编：后端 getRawTemplate 原文下发，n8n Code 节点渲染）──
  'n8n.course-idea': { description: '课程创意任务名生成', caller: 'ai/generate-course-idea → course-idea-generator-v2', kind: 'fragment', source: 'builtin' },
  'n8n.course-polish': { description: '任务名/内容润色', caller: 'ai/polish-course-content → course-content-polisher-v2', kind: 'fragment', source: 'builtin' },
  'n8n.overview-tips': { description: '概览调整建议生成', caller: 'ai/generate-course-overview-adjustment-tips → course-overview-adjustment-tips-generator-v2', kind: 'fragment', source: 'builtin' },
  'n8n.course-step': { description: '单步骤课程生成', caller: 'ai/generate-step → course-step-generator-v2', kind: 'fragment', source: 'builtin' },
  'n8n.course-step-regen': { description: '单环节重新生成', caller: 'ai/generate-step(regen), ai/regenerate-step → course-step-regenerator-v2', kind: 'fragment', source: 'builtin' },
  'n8n.course-phase-regen': { description: '单阶段课程重新生成', caller: 'ai/regenerate-phase → course-phase-regenerator-v2', kind: 'fragment', source: 'builtin' },
  'n8n.ppt-plan': { description: 'PPT 整体规划（页面分配）', caller: 'ai/generate-ppt-content → ppt-content-generator-v2', kind: 'fragment', source: 'builtin' },
  'n8n.ppt-slide': { description: 'PPT 单页内容与布局', caller: 'ai/generate-ppt-content → ppt-content-generator-v2', kind: 'fragment', source: 'builtin' },
  'n8n.optimize.video': { description: '视频提示词优化模板', caller: 'ai/optimize-prompt(task_type=video) → ai-prompt-optimize-v2', kind: 'fragment', source: 'builtin' },
  'n8n.optimize.storyboard': { description: '分镜提示词优化模板', caller: 'ai/optimize-prompt(task_type=storyboard) → ai-prompt-optimize-v2', kind: 'fragment', source: 'builtin' },
  'n8n.optimize.regene': { description: '重生成图提示词模板', caller: 'ai/optimize-prompt(task_type=regene) → ai-prompt-optimize-v2', kind: 'fragment', source: 'builtin' },
  'n8n.optimize.extract-keywords': { description: '场景关键词抽取模板', caller: 'ai/extract-keywords, ai/optimize-prompt → ai-prompt-optimize-v2', kind: 'fragment', source: 'builtin' },
  'n8n.optimize.extract-character': { description: '角色形象抽取模板', caller: 'ai/optimize-prompt(task_type=extract-character) → ai-prompt-optimize-v2', kind: 'fragment', source: 'builtin' },
  'n8n.optimize.optimize': { description: '通用提示词优化模板', caller: 'ai/optimize-prompt(task_type=optimize) → ai-prompt-optimize-v2', kind: 'fragment', source: 'builtin' },
  'n8n.optimize.general': { description: '兜底优化模板', caller: 'ai/optimize-prompt(task_type 缺省/general) → ai-prompt-optimize-v2', kind: 'fragment', source: 'builtin' },
  'n8n.scene-keywords': { description: '场景关键词/人物/风格提取（DashScope）', caller: 'ai/extract-character → ai-prompt-processing-v2', kind: 'fragment', source: 'builtin' },

  // ── 尚未收编（三期候选）：提示词仍在 n8n 工作流内部，运行时不经注册表，去 n8n 改 ──
  'n8n-pending.course-generator': { description: '课程生成主流程提示词（约 8300 字，含四阶段编排规则）', caller: 'ai/generate-course → course-generator', kind: 'fragment', source: 'n8n-workflow', location: 'n8n/教案/课程生成生产级流程.json' },
  'n8n-pending.course-overview': { description: '课程概览主流程提示词（约 6100 字）', caller: 'ai/generate-course-overview → course-overview-generator', kind: 'fragment', source: 'n8n-workflow', location: 'n8n/概览/课程概览生成.json' },
  'n8n-pending.storybook-batch': { description: '绘本批量生成（故事+角色）', caller: 'ai/generate-ppt-asset(B9) → ppt-storybook-generator', kind: 'fragment', source: 'n8n-workflow', location: 'n8n/PPT/绘本批量生成.json' },
  'n8n-pending.video-pipeline': { description: '图生视频系列（分镜图 prompt/语音脚本/字幕/分镜脚本/角色形象描述）', caller: 'ai/generate-storyboard → gene-images, ai/generate-video → gene-video', kind: 'fragment', source: 'n8n-workflow', location: 'n8n/视频/图生视频*主工作流*.json' },
  'n8n-pending.voice-dub': { description: '单人视频配音 Agent 提示词', caller: '配音链路（子流程）', kind: 'fragment', source: 'n8n-workflow', location: 'n8n/视频/🦅单人视频-生成配音.json' },
  'n8n-pending.bg-music': { description: '单人视频背景音乐 Agent 提示词', caller: '配乐链路（子流程）', kind: 'fragment', source: 'n8n-workflow', location: 'n8n/视频/🪿单人视频-生成背景音乐.json' },
};

/**
 * 取单段提示词（碎片模板）：Wiki 覆盖 → builtin 渲染 → 抛错
 */
export async function getPrompt(key: string, vars: PromptVars = {}): Promise<string> {
  const wiki = await loadPromptSection(key);
  if (wiki) return renderTemplate(wiki, vars);

  const builtin = BUILTIN_PROMPTS[key];
  if (builtin?.main) return renderTemplate(builtin.main, vars);

  throw new Error(`[prompt-registry] 未注册的提示词 key: "${key}"，请在 builtin.ts 与 PROMPT_META 登记后使用`);
}

/**
 * 取双段提示词（LLM chat 的 system/user）：Wiki 覆盖 → builtin 渲染 → 抛错
 */
export async function getPromptPair(
  key: string,
  systemVars: PromptVars = {},
  userVars: PromptVars = {}
): Promise<{ system: string; user: string }> {
  const wiki = await loadPromptTemplate(key);
  if (wiki) {
    return { system: renderTemplate(wiki.system, systemVars), user: renderTemplate(wiki.user, userVars) };
  }

  const builtin = BUILTIN_PROMPTS[key];
  if (builtin?.system && builtin?.user) {
    return {
      system: renderTemplate(builtin.system, systemVars),
      user: renderTemplate(builtin.user, userVars),
    };
  }

  throw new Error(`[prompt-registry] 未注册的双段提示词 key: "${key}"，请在 builtin.ts 与 PROMPT_META 登记后使用`);
}

/**
 * 取原始模板（不渲染）：供后端路由下发 promptTemplate 给 n8n 工作流，
 * 占位符 {{var}} 由 n8n Code 节点内的 __renderPrompt 渲染。
 * 解析顺序与 getPrompt 一致：Wiki 覆盖 → builtin 原文 → 抛错
 */
export async function getRawTemplate(key: string): Promise<string> {
  const wiki = await loadPromptSection(key);
  if (wiki) return wiki;

  const builtin = BUILTIN_PROMPTS[key];
  if (builtin?.main) return builtin.main;

  throw new Error(`[prompt-registry] 未注册的提示词 key: "${key}"，请在 builtin.ts 与 PROMPT_META 登记后使用`);
}

export { BUILTIN_PROMPTS };
