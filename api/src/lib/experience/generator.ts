/**
 * 创作工坊「体验类」生成器：互动式情境瑜伽 / 星光录音棚
 *
 * 链路：提示词（registry，Wiki 可覆盖）→ qwen-plus 生成 JSON → 校验 → 注入 HTML 模板 → 成品 HTML
 * 模板位于 api/public/templates/（Docker 运行时路径 /app/public/templates/）
 */

import * as fs from 'fs';
import * as path from 'path';
import { getPromptPair } from '@/prompts/registry';
import { loadWikiPage } from '@/lib/prompt-library';
import { YOGA_POSE_LIBRARY_TEXT, findYogaPose } from '@/lib/experience/yogaPoses';

const LLM_MODEL = process.env.EXPERIENCE_LLM_MODEL || 'qwen-plus';
const DASHSCOPE_API_URL =
  process.env.VITE_DASHSCOPE_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

export interface YogaPage {
  id: string;
  type: 'scene' | 'transition' | 'action' | 'return' | 'ending';
  pose: string | null;
  subtitle: string;
  teacherLang: string;
  expression?: string;
  action?: string;
  /** 中文画面描述（供 AI 插图） */
  imagePrompt?: string;
  node?: string;
  /** 插图 URL（生成后写回，模板直接使用） */
  img?: string;
}

export interface YogaPlan {
  storyTitleEn?: string;
  storyTitleZh?: string;
  recommendedPageCount?: number;
  storyContent?: string;
  englishGoal?: string;
  wellbeingGoal?: string;
  outputGoal?: string;
  materials?: string;
}

/** 工作室流程的 result 结构：方案 + 逐页设计 */
export interface YogaResult {
  title: string;
  plan?: YogaPlan;
  pages: YogaPage[];
}

export interface MusicSong {
  title: string;
  songMeta: { goals?: string; age?: string; level?: string; duration?: string; style?: string };
  lyrics: { time: string; text: string }[];
  targetPatterns: string[];
}

/** Stage 1 三类练习（结构对齐游戏模板 music-star-quest.html 的注入点） */
export interface MusicExercises {
  /** 选词填空：sentence 片段数组（'' 为空位）、blanks 答案、options 候选、emoji */
  ex1FillData: { sentence: string[]; blanks: string[]; options: string[]; emoji?: string }[];
  /** 连词成句：answer 完整句、words 拆词 */
  ex2Items: { answer: string; words: string[] }[];
  /** 听音选词：options[correct] 为正确句 */
  ex3Data: { question: string; options: string[]; correct: number }[];
  teachingPlans: Record<string, { title?: string; sections?: { title: string; content: string }[] }>;
}

export interface MusicResult extends MusicSong, MusicExercises {
  /** 双音频 data URI（base64，体积大，仅在显式操作时写入） */
  audio?: { vocal?: string; backing?: string; vocalName?: string; backingName?: string };
}

async function callLLM(system: string, user: string): Promise<string> {
  const apiKey = process.env.VITE_DASHSCOPE_API_KEY;
  if (!apiKey) throw new Error('未配置 VITE_DASHSCOPE_API_KEY，无法生成');

  const response = await fetch(DASHSCOPE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`LLM 请求失败 ${response.status}: ${errText.slice(0, 300)}`);
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('LLM 返回为空');
  return content;
}

/** 剥离可能的 ```json 代码围栏后解析 JSON */
function parseJson<T>(raw: string): T {
  const stripped = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(stripped) as T;
}

function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
}

function readTemplate(name: string): string {
  const file = path.join(process.cwd(), 'public', 'templates', name);
  return fs.readFileSync(file, 'utf-8');
}

// ─────────────────────────────────────────────────────────────
// 互动式情境瑜伽
// ─────────────────────────────────────────────────────────────
const YOGA_PAGE_TYPES = new Set(['scene', 'transition', 'action', 'return', 'ending']);

// Wiki.js 上维护的瑜伽权威规范文档（wellbeing/docs/），生成时注入提示词；
// 加载失败自动跳过（提示词内置规则仍生效）。教研在 Wiki 改文档，缓存 TTL 后生成即生效。
const YOGA_SPEC_DOCS = {
  lessonPlan: { path: 'wellbeing/docs/yoga-lesson-plan-spec', label: '教案规范' },
  content: { path: 'wellbeing/docs/yoga-content-spec', label: '内容规范' },
  poseLibrary: { path: 'wellbeing/docs/yoga-pose-library', label: '体式-身体反应-情境匹配库' },
};

async function loadSpecDocs(...keys: (keyof typeof YOGA_SPEC_DOCS)[]): Promise<string> {
  const parts = (await Promise.all(keys.map(async (key) => {
    const { path: docPath, label } = YOGA_SPEC_DOCS[key];
    const text = await loadWikiPage(docPath);
    return text ? `【${label}】\n${text}` : '';
  }))).filter(Boolean);
  return parts.join('\n\n');
}

/** 把规范文档追加为 system 提示词的权威参考（无文档时原样返回） */
export async function withSpecDocs(system: string, ...keys: (keyof typeof YOGA_SPEC_DOCS)[]): Promise<string> {
  const docs = await loadSpecDocs(...keys);
  if (!docs) return system;
  return `${system}\n\n## 权威规范文档（Wiki 维护版本，与其冲突时以下方文档为准，必须遵守）\n${docs}`;
}

const yogaVars = (params: Record<string, string>) => ({
  theme: params.theme || params.title || '自然探索',
  goals: params.goals || '',
  age: params.age || '7-10 岁',
  duration: params.duration || params.duracion || '15 分钟',
  requirements: params.requirements || params.notes || '无',
});

/** 把活动方案对象压成注入 design prompt 的纯文本摘要 */
function planSummary(plan?: YogaPlan | null): string {
  if (!plan || typeof plan !== 'object') return '';
  const lines = [
    plan.storyTitleEn && `- 英文标题：${plan.storyTitleEn}`,
    plan.storyContent && `- 情境旅程：${plan.storyContent}`,
    plan.englishGoal && `- 目标语言点：${plan.englishGoal}`,
    plan.recommendedPageCount && `- 建议页数：${plan.recommendedPageCount}`,
    plan.wellbeingGoal && `- 身心目标：${plan.wellbeingGoal}`,
  ].filter(Boolean);
  return lines.length ? `\n已确认的活动方案（逐页设计必须与之一致）：\n${lines.join('\n')}\n` : '';
}

function normalizeYogaPages(pages: YogaPage[]): YogaPage[] {
  return pages.map((p, i) => ({
    ...p,
    id: p.id || `P${i + 1}`,
    pose: p.pose || null,
    imagePrompt: p.imagePrompt || [p.subtitle, p.action].filter(Boolean).join('，'),
    img: p.img || '',
    node: p.node || '🌿',
  }));
}

function validateYogaPages(pages: YogaPage[]): void {
  if (pages.length < 6) throw new Error(`生成的页数不足（${pages.length} 页，至少 6 页），请重试`);
  for (const p of pages) {
    if (!p.subtitle) throw new Error('存在缺少 subtitle 的页面，请重试');
    if (!YOGA_PAGE_TYPES.has(p.type)) throw new Error(`页面类型非法: ${p.type}`);
  }
}

/** 把 {title, pages} 注入授课 HTML 模板（成品为自包含单文件） */
export function renderYogaHtml(result: { title?: string; pages: YogaPage[] }, fallbackTitle = '情境瑜伽活动'): string {
  let html = readTemplate('interactive-yoga.html');
  html = html.replace(/const pages = \[[\s\S]*?\n\];/, `const pages = ${JSON.stringify(result.pages)};`);
  html = html.replace(/__TITLE__/g, escapeHtml(result.title || fallbackTitle));
  return html;
}

// ── 一键生成（旧流程，generate 路由仍在用）─────────────────────
export async function generateYoga(params: Record<string, string>): Promise<{ result: { title: string; pages: YogaPage[] }; html: string }> {
  const vars = yogaVars(params);
  const base = await getPromptPair('experience-yoga-design', { poseLibrary: YOGA_POSE_LIBRARY_TEXT }, vars);
  const system = await withSpecDocs(base.system, 'content', 'poseLibrary');
  const { user } = base;
  const raw = await callLLM(system, user);
  const parsed = parseJson<{ title?: string; pages?: YogaPage[] }>(raw);

  const pages = Array.isArray(parsed.pages) ? parsed.pages : [];
  validateYogaPages(pages);

  const title = parsed.title || params.theme || params.title || '情境瑜伽活动';
  const normalized = normalizeYogaPages(pages);
  const html = renderYogaHtml({ title, pages: normalized }, title);

  return { result: { title, pages: normalized }, html };
}

// ── 工作室流程 step 2：活动方案 ────────────────────────────────
export async function generateYogaPlan(params: Record<string, string>): Promise<{ title: string; plan: YogaPlan }> {
  const base = await getPromptPair('experience-yoga-plan', {}, yogaVars(params));
  const { system, user } = { system: await withSpecDocs(base.system, 'lessonPlan', 'content'), user: base.user };
  const raw = await callLLM(system, user);
  const parsed = parseJson<YogaPlan>(raw);

  if (!parsed.storyTitleEn && !parsed.storyContent) throw new Error('方案生成结果为空，请重试');
  const plan: YogaPlan = {
    storyTitleEn: parsed.storyTitleEn || '',
    storyTitleZh: parsed.storyTitleZh || '',
    recommendedPageCount: Number(parsed.recommendedPageCount) || 8,
    storyContent: parsed.storyContent || '',
    englishGoal: parsed.englishGoal || '',
    wellbeingGoal: parsed.wellbeingGoal || '',
    outputGoal: parsed.outputGoal || '',
    materials: parsed.materials || '',
  };
  return { title: plan.storyTitleEn || '', plan };
}

// ── 工作室流程 step 3：逐页设计（结合活动方案）──────────────────
export async function generateYogaDesign(
  params: Record<string, string>,
  plan?: YogaPlan | null
): Promise<{ title: string; pages: YogaPage[] }> {
  const vars = yogaVars(params);
  const base = await getPromptPair(
    'experience-yoga-design',
    { poseLibrary: YOGA_POSE_LIBRARY_TEXT },
    { ...vars, plan: planSummary(plan) }
  );
  const { system, user } = { system: await withSpecDocs(base.system, 'content', 'poseLibrary'), user: base.user };
  const raw = await callLLM(system, user);
  const parsed = parseJson<{ title?: string; pages?: YogaPage[] }>(raw);

  const pages = Array.isArray(parsed.pages) ? parsed.pages : [];
  validateYogaPages(pages);

  const title = parsed.title || plan?.storyTitleEn || params.theme || params.title || '情境瑜伽活动';
  return { title, pages: normalizeYogaPages(pages) };
}

/** 导出给生图链路：按英文名取体式的身体反应描述（找不到返回空串） */
export function yogaPoseBody(pose: string | null | undefined): string {
  return findYogaPose(pose || '')?.body || '';
}

// ─────────────────────────────────────────────────────────────
// 星光录音棚（Music Star Quest 四关游戏课件）
// ─────────────────────────────────────────────────────────────
// Wiki.js 上维护的星光录音棚权威规范文档，生成时注入提示词（失败自动跳过）
const MUSIC_SPEC_DOCS = {
  flow: { path: 'wellbeing/docs/music-flow-spec', label: '流程与功能模块规范' },
  level1: { path: 'wellbeing/docs/music-level1-spec', label: '第一关题型设计规范' },
};

async function withMusicSpecDocs(system: string, ...keys: (keyof typeof MUSIC_SPEC_DOCS)[]): Promise<string> {
  const parts = (await Promise.all(keys.map(async (key) => {
    const { path: docPath, label } = MUSIC_SPEC_DOCS[key];
    const text = await loadWikiPage(docPath);
    return text ? `【${label}】\n${text}` : '';
  }))).filter(Boolean);
  if (!parts.length) return system;
  return `${system}\n\n## 权威规范文档（Wiki 维护版本，与其冲突时以下方文档为准，必须遵守）\n${parts.join('\n\n')}`;
}

const musicVars = (params: Record<string, string>) => ({
  goals: params.goals || '',
  theme: params.theme || params.title || '英语学习',
  age: params.age || '7-10 岁',
  level: params.level || '初级',
  style: params.style || '欢快',
  duration: params.duration || '中 (60-90s)',
  structure: params.structure || '主歌+副歌',
  requirements: params.requirements || params.notes || '无',
});

function normalizeMusicLyrics(lyrics: unknown): { time: string; text: string }[] {
  return (Array.isArray(lyrics) ? lyrics : [])
    .map((l) => ({ time: String((l as { time?: unknown })?.time || ''), text: String((l as { text?: unknown })?.text || '') }))
    .filter((l) => l.text);
}

/** 渲染四关游戏课件（自包含单文件；双音频为 base64 data URI，可为空串） */
export function renderMusicGameHtml(result: MusicResult, fallbackTitle = 'Music Star Quest'): string {
  let html = readTemplate('music-star-quest.html');
  html = html.replace(/var lyrics = \[[\s\S]*?\n\];/, `var lyrics = ${JSON.stringify(result.lyrics)};`);
  html = html.replace(/var ex1FillData = \[[\s\S]*?\n\];/, `var ex1FillData = ${JSON.stringify(result.ex1FillData)};`);
  html = html.replace(/var ex2Items = \[[\s\S]*?\n\];/, `var ex2Items = ${JSON.stringify(result.ex2Items)};`);
  html = html.replace(/var ex3Data = \[[\s\S]*?\n\];/, `var ex3Data = ${JSON.stringify(result.ex3Data)};`);
  html = html.replace(/var teachingPlans = \{[\s\S]*?\n\};/, `var teachingPlans = ${JSON.stringify(result.teachingPlans)};`);
  html = html.replace(/__TITLE__/g, escapeHtml(result.title || fallbackTitle));
  const vocal = result.audio?.vocal || '';
  const backing = result.audio?.backing || '';
  html = html.replace(/(<audio id="audioOriginal" src=")[^"]*(")/, `$1${vocal}$2`);
  html = html.replace(/(<audio id="audioAccomp" src=")[^"]*(")/, `$1${backing}$2`);
  return html;
}

// ── 工作室流程 step 2：歌曲创作 ────────────────────────────────
export async function generateMusicSong(
  params: Record<string, string>
): Promise<{ title: string; song: { songMeta: MusicSong['songMeta']; lyrics: MusicSong['lyrics']; targetPatterns: string[] } }> {
  const vars = musicVars(params);
  const base = await getPromptPair('experience-music-song', {}, vars);
  const system = await withMusicSpecDocs(base.system, 'flow');
  const raw = await callLLM(system, base.user);
  const song = parseJson<MusicSong>(raw);

  const lyrics = normalizeMusicLyrics(song.lyrics);
  if (lyrics.length < 8) throw new Error(`生成的歌词行数不足（${lyrics.length} 行，至少 8 行），请重试`);
  if (!song.title) throw new Error('缺少歌名，请重试');

  return {
    title: song.title,
    song: {
      songMeta: song.songMeta || {},
      lyrics,
      targetPatterns: Array.isArray(song.targetPatterns) ? song.targetPatterns.filter(Boolean).map(String) : [],
    },
  };
}

// ── 工作室流程 step 3：第一关练习 + 四关教学方案（基于最终歌词）──
export async function generateMusicExercises(
  params: Record<string, string>,
  song: { title: string; lyrics: MusicSong['lyrics']; targetPatterns: string[] }
): Promise<MusicExercises> {
  const lyricsText = song.lyrics.map((l) => `${l.time} ${l.text}`).join('\n');
  const vars = {
    ...musicVars(params),
    title: song.title || '',
    lyricsText: lyricsText || '（无歌词）',
    targetPatterns: (song.targetPatterns || []).join('；') || '无',
  };
  const base = await getPromptPair('experience-music-exercises', {}, vars);
  const system = await withMusicSpecDocs(base.system, 'flow', 'level1');
  const raw = await callLLM(system, base.user);
  const ex = parseJson<MusicExercises>(raw);

  if (!Array.isArray(ex.ex1FillData) || !ex.ex1FillData.length) throw new Error('选词填空生成失败，请重试');
  if (!Array.isArray(ex.ex2Items) || !ex.ex2Items.length) throw new Error('连词成句生成失败，请重试');
  if (!Array.isArray(ex.ex3Data) || !ex.ex3Data.length) throw new Error('听音选词生成失败，请重试');

  return {
    ex1FillData: ex.ex1FillData.map((x) => ({
      sentence: (Array.isArray(x.sentence) ? x.sentence : []).map(String),
      blanks: (Array.isArray(x.blanks) ? x.blanks : []).map(String),
      options: (Array.isArray(x.options) ? x.options : []).map(String),
      emoji: x.emoji ? String(x.emoji) : '🎵',
    })),
    ex2Items: (Array.isArray(ex.ex2Items) ? ex.ex2Items : []).map((x) => ({
      answer: String(x.answer || ''),
      words: (Array.isArray(x.words) ? x.words : []).map(String),
    })),
    ex3Data: (Array.isArray(ex.ex3Data) ? ex.ex3Data : []).map((x) => ({
      question: String(x.question || 'Choose the sentence you hear:'),
      options: (Array.isArray(x.options) ? x.options : []).map(String),
      correct: Number(x.correct) || 0,
    })),
    teachingPlans: ex.teachingPlans || {},
  };
}

// ── 一键生成（旧接口兼容）：歌曲 → 练习 → 游戏课件 ──────────────
export async function generateMusic(params: Record<string, string>): Promise<{ result: MusicResult; html: string }> {
  const { title, song } = await generateMusicSong(params);
  const exercises = await generateMusicExercises(params, { title, lyrics: song.lyrics, targetPatterns: song.targetPatterns });
  const result: MusicResult = { title, ...song, ...exercises };
  const html = renderMusicGameHtml(result, title);
  return { result, html };
}

export const experienceGenerators = {
  yoga: generateYoga,
  music: generateMusic,
};
