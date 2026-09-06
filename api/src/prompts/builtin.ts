/**
 * 内置提示词模板（收编自各路由的内联碎片）
 *
 * 规则：
 *   - 本文件是「碎片级模板」的集中地：原散落在路由里的提示词文本一律收编到此
 *   - 复杂构建函数（picture-book / song-writing / video / course-journey）仍在各自模块，
 *     仅在 registry 中登记位置——它们本身已集中在 prompts/ 目录
 *   - Wiki 页面（wellbeing/prompts/<key>）存在同名模板时优先生效，本文件为兜底
 *   - 模板为纯文本 + {{var}} 占位符，条件文案由调用方组装为变量注入
 */

import { ACTIVITY_PLAN_TEMPLATE, PICTURE_BOOK_DESIGN_TEMPLATE } from './picture-book';
import { YOGA_PLAN_TEMPLATE, YOGA_DESIGN_TEMPLATE, MUSIC_SONG_TEMPLATE, MUSIC_EXERCISES_TEMPLATE } from './experience';
// n8n 工作流提示词快照（由 api/scripts/n8n-prompt-inject.mjs 从工作流提取生成，勿手改；
// Wiki 页面 wellbeing/prompts/<key> 可覆盖）。渲染发生在 n8n Code 节点，后端经 getRawTemplate 原文下发。
import n8nTemplates from './n8n-templates.json';

export interface BuiltinTemplate {
  /** 单段模板（碎片） */
  main?: string;
  /** 双段模板（LLM chat） */
  system?: string;
  user?: string;
}

const N8N_PROMPTS: Record<string, BuiltinTemplate> = Object.fromEntries(
  Object.entries(n8nTemplates).map(([key, tpl]) => [key, { main: String(tpl) }])
);

export const BUILTIN_PROMPTS: Record<string, BuiltinTemplate> = {
  // ── 绘本（模板常量在 picture-book.ts，一份文本两处用）─────
  'picture-book-activity-plan': ACTIVITY_PLAN_TEMPLATE,
  'picture-book-design': PICTURE_BOOK_DESIGN_TEMPLATE,

  // ── 创作工坊 · 体验类（模板常量在 experience.ts）─────
  'experience-yoga-plan': YOGA_PLAN_TEMPLATE,
  'experience-yoga-design': YOGA_DESIGN_TEMPLATE,
  'experience-music-song': MUSIC_SONG_TEMPLATE,
  'experience-music-exercises': MUSIC_EXERCISES_TEMPLATE,

  /** 儿童英文词卡 emoji 匹配（原 generate-word-emojis 内联） */
  'ai.word-emojis': {
    system: '你负责给儿童英文词卡匹配图标。每个词只返回一个语义最直接、儿童容易理解的 emoji；不要统一使用星星、对话框或问号。严格返回 JSON 对象，键必须与输入词完全一致，值只能是 emoji。',
    user: '为这些词匹配 emoji：{{words}}',
  },

  // ── 课程生成（n8n）────────────────────────────────────────

  /** 无文字封面插画要求（原 generate-course-overview TEXTLESS_THEME_IMAGE_REQUIREMENT） */
  'course.theme-image-requirement': {
    main: 'Theme image requirement: The cover image must be a textless full-canvas illustration with theme-specific scenery and props. Avoid listing forbidden text-container object names in themeImagePrompt; use positive composition language such as rich background details, continuous scenery, icons, colors, paths, props, and non-text symbols. If the course outcome mentions a card, promise, message, writing, or title, represent the idea with scenery, abstract decorative shapes, icons, colors, paths, props, or non-text symbols only.',
  },

  /** 课程概览输出指令-英文（原 generate-course-overview buildOutputInstruction） */
  'course.overview.output-instruction.en': {
    main: 'Return structured JSON only. Do not include Markdown, explanations, or Chinese text.\nAll user-facing fields in courseOverview must be written in English, including courseTitle, overallContext, languageGoals, selGoals, permaGoals, finalTask, themeImagePrompt, and every journey field.\nthemeImagePrompt must describe a textless full-canvas cover illustration. Use positive visual language only: theme-specific scenery, props, icons, colors, paths, background details, and non-text symbols. Do not mention speech bubbles, text boxes, whiteboards, posters, blank panels, or other text-container object names.\ncourseOverview must include a journey field.\njourney must include engage, empower, execute, and elevate.\nThe class journey must be based on this course theme, story context, language goals, final outcome, and growth goals. Do not use generic template sentences.\nEach journey field should be 20-45 English words and include concrete classroom actions.',
  },

  /** 课程概览输出指令-中文 */
  'course.overview.output-instruction.zh': {
    main: '请返回结构化 JSON。\ncourseOverview.courseTitle 必须使用中英双语格式："中文课程名称 | English Course Title"。竖线两侧均不能为空；除 courseTitle 外，其他面向用户字段仍使用中文。\ncourseOverview 中必须包含 journey 字段。\njourney 必须包含 engage、empower、execute、elevate 四个字段。\n课堂旅程必须基于本课程的主题、故事情境、语言目标、最终成果和成长目标生成，不能使用通用模板句。\n每个 journey 字段 35-70 个中文字符，并体现具体课堂动作。\nthemeImagePrompt 必须描述无文字、全画幅、连续场景的封面插画，只使用与主题相关的场景、道具、图标、颜色、路径和非文字符号。不要在 themeImagePrompt 中提及对话气泡、文本框、白板、海报、空白面板等文字容器名称。',
  },

  /** 教案输出指令-英文（原 generate-course 内联三元） */
  'course.output-instruction.en': {
    main: 'Generate all user-facing lesson plan content in English. Return structured JSON only. Do not include Chinese text unless it is explicitly provided as target language content by the user.',
  },

  /** 教案输出指令-中文 */
  'course.output-instruction.zh': {
    main: '请用中文生成所有面向用户展示的教案内容，并返回结构化 JSON。',
  },

  /** 已有概览注入文本-英文（原 generate-course buildOverviewText，变量 {{title}} 等） */
  'course.overview-text.en': {
    main: 'Existing course overview is provided below. Generate the lesson plan strictly based on this overview, keeping the story context, learning goals, and output task fully consistent.\nTitle: {{title}}\nContext: {{context}}\nLanguage goals: vocabulary={{vocabulary}}, sentence patterns={{grammar}}\nSEL goals: {{sel}}\nPERMA goals: {{perma}}\nOutput task: {{finalTask}}\nImage prompt: {{imagePrompt}}',
  },

  /** 已有概览注入文本-中文 */
  'course.overview-text.zh': {
    main: '已有课程概览如下，请严格基于此概览生成教案，保持故事情境、教学目标、产出任务完全一致：\n标题：{{title}}\n情境：{{context}}\n语言目标：词汇={{vocabulary}}，句型={{grammar}}\nSEL目标：{{sel}}\nPERMA目标：{{perma}}\n产出任务：{{finalTask}}\n生图提示词：{{imagePrompt}}',
  },

  // ── PPT 素材（n8n）────────────────────────────────────────

  /** B2 海报生图模板（原 generate-ppt-asset 内联） */
  'ppt.poster-b2': {
    main: 'Create a PPT poster-style atmospheric image with clear readable typography.{{scene}}{{overlayText}}{{textLayout}}{{whitespace}}{{styleInstruction}} Clean composition for a classroom PPT cover. Do not add watermark, logo, or unrelated extra text.',
  },

  /** B3 词卡生图模板（原 generate-ppt-asset 内联） */
  'ppt.flashcard-b3': {
    main: 'Create one very simple vocabulary flashcard for the word "{{word}}". Minimal white rounded card on a plain light background. Top area: one simple child-friendly illustration only. Middle: large bold lowercase English word. {{chineseRule}} {{phoneticRule}} Use lots of blank space, clean alignment, soft shadow, no decorative frame. Do not create a grid, worksheet, collage, icons list, labels, extra words, or complex layout.',
  },

  // ── 场景生图（n8n）────────────────────────────────────────

  /** 背景图负面提示词（原 generate-scene 内联） */
  'scene.negative.background': {
    main: 'blurry, low quality, deformed, ugly, bad anatomy, disfigured, poorly drawn face, mutation, extra limb, poorly drawn hands, missing limb, floating limbs, disconnected limbs, malformed hands, blur, out of focus, long neck, long body',
  },

 /** IP 角色图负面提示词（原 generate-scene 内联） */
  'scene.negative.character': {
    main: 'blurry, 3d, realistic, complex textures, bad anatomy, deformed, shadows, gradients, background details',
  },

  // ── 前端组装提示词（原散落在前端页面的硬编码常量）────────

  /** 绘本视觉风格（原 PictureBookStudioPage STORYBOOK_VISUAL_STYLE） */
  'frontend.storybook-visual-style': {
    main: 'Oliver Jeffers-inspired loose watercolor washes with expressive black pen-and-ink sketch lines, warm, restrained, playful, and emotionally gentle. Use an extremely low-saturation washed palette of gray-blue, dusty gray-pink, sage gray-green, muted gray-orange, pale gray-yellow, and soft gray-purple. Let each page-specific image prompt determine the number of elements, layout, density, and composition. Preserve creative-process traces: faint pencil construction lines, restrained watercolor splashes, and hand-drawn tool icons such as pencils or palettes. Use imperfect handwritten English typography only for the explicitly supplied page text. Use a flat light warm-beige textured drawing-paper background, no border, no frame, no open-book mockup, and no photographed book. Use one consistent landscape page ratio. Do not invent or display any words from the visual description or generation prompt.',
  },

  /** 绘本页面生图负面提示词（原 PictureBookStudioPage STORYBOOK_TEXT_NEGATIVE_PROMPT） */
  'frontend.storybook-negative': {
    main: 'Chinese characters, Chinese text, non-English text, unrequested words, extra letters, captions, annotations, speech bubbles, callouts, explanatory symbols, page numbers, borders, frames, open-book mockup, photographed book, saturated colors, neon colors, gibberish typography, pseudo-text, misspelled text, duplicated title, repeated text',
  },

  /** ComfyUI 通用负面提示词-中文（原 aiAssetService 内联） */
  'frontend.comfyui-negative-zh': {
    main: '模糊，低清，畸形，杂乱背景，过多装饰，恐怖，黑暗，血腥，写实照片，油画，过度写实，文字变形，文字模糊，手绘感太重，噪点，复杂纹理，水印，ui界面，多余人物',
  },

  /** 视频人物参考图提示词（原 videoStoryboardService 两处内联，{{characterDescription}} 由前端注入） */
  'frontend.character-reference-zh': {
    main: '{{characterDescription}}，单个或多个人物，纯白色背景，人物特写，正面视角，清晰面部特征，全身照，无背景元素，无道具，无场景，高质量，细节丰富，肖像摄影风格',
  },

  // ── n8n 工作流提示词（快照来源 n8n-templates.json，见文件头注释）──
  ...N8N_PROMPTS,
};