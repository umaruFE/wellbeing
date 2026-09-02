/**
 * 创作工坊「体验类」生成器：互动式情境瑜伽 / 星光录音棚
 *
 * 链路：提示词（registry，Wiki 可覆盖）→ qwen-plus 生成 JSON → 校验 → 注入 HTML 模板 → 成品 HTML
 * 模板位于 api/public/templates/（Docker 运行时路径 /app/public/templates/）
 */

import * as fs from 'fs';
import * as path from 'path';
import { getPromptPair } from '@/prompts/registry';

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
  node?: string;
}

export interface MusicSong {
  title: string;
  songMeta: { goals?: string; age?: string; level?: string; duration?: string };
  lyrics: { time: string; text: string }[];
  targetPatterns: string[];
  exercises: {
    fill?: { sentenceParts: string[]; answer: string; options: string[] }[];
    scramble?: { words: string[]; answer: string }[];
  };
  teachingPlans: Record<string, { title?: string; sections?: { title: string; content: string }[] }>;
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

export async function generateYoga(params: Record<string, string>): Promise<{ result: { title: string; pages: YogaPage[] }; html: string }> {
  const vars = {
    theme: params.theme || params.title || '自然探索',
    goals: params.goals || '',
    age: params.age || '7-10 岁',
    duration: params.duration || params.duracion || '15 分钟',
    requirements: params.requirements || params.notes || '无',
  };
  const { system, user } = await getPromptPair('experience-yoga-design', {}, vars);
  const raw = await callLLM(system, user);
  const parsed = parseJson<{ title?: string; pages?: YogaPage[] }>(raw);

  const pages = Array.isArray(parsed.pages) ? parsed.pages : [];
  if (pages.length < 6) throw new Error(`生成的页数不足（${pages.length} 页，至少 6 页），请重试`);
  for (const p of pages) {
    if (!p.subtitle) throw new Error('存在缺少 subtitle 的页面，请重试');
    if (!YOGA_PAGE_TYPES.has(p.type)) throw new Error(`页面类型非法: ${p.type}`);
  }

  const title = parsed.title || params.theme || params.title || '情境瑜伽活动';
  const normalized = pages.map((p, i) => ({
    ...p,
    id: p.id || `P${i + 1}`,
    pose: p.pose || null,
    img: '',
    node: p.node || '🌿',
  }));

  let html = readTemplate('interactive-yoga.html');
  html = html.replace(/const pages = \[[\s\S]*?\n\];/, `const pages = ${JSON.stringify(normalized)};`);
  html = html.replace(/__TITLE__/g, escapeHtml(title));

  return { result: { title, pages: normalized }, html };
}

// ─────────────────────────────────────────────────────────────
// 星光录音棚（歌曲创作包）
// ─────────────────────────────────────────────────────────────
export async function generateMusic(params: Record<string, string>): Promise<{ result: MusicSong; html: string }> {
  const vars = {
    goals: params.goals || '',
    theme: params.theme || params.title || '英语学习',
    age: params.age || '7-10 岁',
    level: params.level || '初级',
    style: params.style || '欢快',
    duration: params.duration || '中 (60-90s)',
    requirements: params.requirements || params.notes || '无',
  };
  const { system, user } = await getPromptPair('experience-music-song', {}, vars);
  const raw = await callLLM(system, user);
  const song = parseJson<MusicSong>(raw);

  if (!Array.isArray(song.lyrics) || song.lyrics.length < 8) throw new Error('生成的歌词行数不足（至少 8 行），请重试');
  if (!song.title) throw new Error('缺少歌名，请重试');

  const lyrics = song.lyrics.map((l) => ({ time: l.time || '', text: l.text || '' }));
  const patterns = Array.isArray(song.targetPatterns) ? song.targetPatterns.filter(Boolean).map(String) : [];
  const meta = song.songMeta || {};
  const exercises = song.exercises || {};
  const plans = song.teachingPlans || {};

  let html = readTemplate('music-review.html');
  html = html.replace(/const lyrics = \[[\s\S]*?\n\];/, `const lyrics = ${JSON.stringify(lyrics)};`);
  html = html.replace(
    /const targetPatterns = \[[\s\S]*?\n\];/,
    `const targetPatterns = ${JSON.stringify(patterns)};`
  );
  html = html.replace(
    /const songMeta = \{[\s\S]*?\n\};/,
    `const songMeta = ${JSON.stringify({
      goals: meta.goals || vars.goals,
      age: meta.age || vars.age,
      level: meta.level || vars.level,
      duration: meta.duration || vars.duration,
    })};`
  );
  html = html.replace(
    /const exercises = \{[\s\S]*?\n\};/,
    `const exercises = ${JSON.stringify(exercises)};`
  );
  html = html.replace(
    /const teachingPlans = \{[\s\S]*?\n\};/,
    `const teachingPlans = ${JSON.stringify(plans)};`
  );
  html = html.replace(/__TITLE__/g, escapeHtml(song.title));

  return { result: { ...song, lyrics, targetPatterns: patterns }, html };
}

export const experienceGenerators = {
  yoga: generateYoga,
  music: generateMusic,
};
