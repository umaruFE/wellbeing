import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { buildActivityPlanPrompts, buildPictureBookDesignPrompts } from '@/prompts';
import { getPromptPair } from '@/prompts/registry';
import { isRagflowEnabled, ensureDataset, retrieval } from '@/lib/ragflow/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TABLE = 'picturebook_knowledge';
const RAGFLOW_DATASET_NAME = process.env.RAGFLOW_PICTUREBOOK_DATASET || 'picturebook-knowledge';

/**
 * RAGFlow 向量检索（启用时优先）
 * 用课程主题构造自然语言问题，在绘本知识数据集中检索相关切片
 */
async function fetchKnowledgeContextFromRagflow(themes: string[], basicInfo: any): Promise<string> {
  if (!isRagflowEnabled()) return '';
  try {
    const datasetId = await ensureDataset(RAGFLOW_DATASET_NAME, '绘本制作知识库（picturebook_knowledge 同步）');
    const question = [
      basicInfo?.title,
      Array.isArray(themes) ? themes.join(', ') : '',
      basicInfo?.ageRange ? `${basicInfo.ageRange} 岁` : '',
      'picture book creation knowledge 绘本创作知识',
    ]
      .filter(Boolean)
      .join(' ');

    const chunks = await retrieval({ question, datasetIds: [datasetId], topK: 10 });
    if (!chunks.length) return '';

    const parts: string[] = [];
    let totalLen = 0;
    for (const chunk of chunks) {
      const text = chunk.content.slice(0, 2000);
      if (totalLen + text.length > 8000) break;
      parts.push(`【${chunk.documentKeyword || '知识切片'}】\n${text}`);
      totalLen += text.length;
    }
    return parts.join('\n\n---\n\n');
  } catch (err) {
    console.error('[rag/generate] RAGFlow retrieval failed, fallback to PostgreSQL:', err);
    return '';
  }
}

/**
 * PostgreSQL 兜底检索（原有逻辑：category 匹配 + 最近 10 条）
 */
async function fetchKnowledgeContextFromPg(themes: string[], ageRange: string): Promise<string> {
  try {
    let rows;
    if (themes.length > 0) {
      const placeholders = themes.map((_, i) => `$${i + 1}`).join(',');
      const res = await db.query(
        `SELECT title, content, category, age_range FROM ${TABLE}
         WHERE category IN (${placeholders})
         ORDER BY created_at DESC LIMIT 10`,
        themes
      );
      rows = res.rows;
    } else {
      const res = await db.query(
        `SELECT title, content, category, age_range FROM ${TABLE}
         ORDER BY created_at DESC LIMIT 10`
      );
      rows = res.rows;
    }

    if (!rows.length) return '';

    // Build context text, cap at ~8000 chars to avoid token overflow
    const parts: string[] = [];
    let totalLen = 0;
    for (const row of rows) {
      const text = row.content.slice(0, 2000);
      if (totalLen + text.length > 8000) break;
      parts.push(`【${row.title}】(${row.category})\n${text}`);
      totalLen += text.length;
    }
    return parts.join('\n\n---\n\n');
  } catch (err) {
    console.error('[rag/generate] fetch knowledge failed:', err);
    return '';
  }
}

/** 统一入口：RAGFlow 向量检索优先，未启用/无结果/失败时回落 PG category 匹配 */
async function fetchKnowledgeContext(themes: string[], ageRange: string, basicInfo: any): Promise<string> {
  const ragflowContext = await fetchKnowledgeContextFromRagflow(themes, basicInfo);
  if (ragflowContext) return ragflowContext;
  return fetchKnowledgeContextFromPg(themes, ageRange);
}

function knowledgeBlock(context: string): string {
  return context ? `\nReference material from the knowledge base:\n${context}\n` : '';
}

/**
 * 知识库提示词统一入口（registry）：Wiki 覆盖 → builtin 模板；异常时回落原构建函数。
 */
async function resolveActivityPlanPrompts(input: {
  useEnglish: boolean;
  basicInfo: any;
  themes: string[];
  knowledgeContext: string;
}): Promise<{ system: string; user: string }> {
  const { useEnglish, basicInfo, themes, knowledgeContext } = input;
  try {
    return await getPromptPair(
      'picture-book-activity-plan',
      {
        languageRule: useEnglish
          ? 'Write every generated field entirely in English. Do not include Chinese translations, bilingual labels, or Chinese text anywhere in the output.'
          : 'Write storyContent, englishGoal, wellbeingGoal, outputGoal, and materials in Simplified Chinese. Keep storyTitleEn entirely in English.',
      },
      {
        age: basicInfo?.age || 'Not specified',
        level: basicInfo?.level || 'Not specified',
        themes: themes.join(', ') || 'Not specified',
        vocabulary: basicInfo?.vocabulary || 'Not specified',
        grammar: basicInfo?.grammar || 'Not specified',
        participants: basicInfo?.participants || 'Not specified',
        knowledgeBlock: knowledgeBlock(knowledgeContext),
        outputLanguage: useEnglish ? 'English' : 'Simplified Chinese, except for the English title',
      }
    );
  } catch {
    return buildActivityPlanPrompts(input);
  }
}

async function resolvePictureBookDesignPrompts(input: {
  useEnglish: boolean;
  pageCount: number;
  activityPlan: any;
  basicInfo: any;
  knowledgeContext: string;
}): Promise<{ system: string; user: string }> {
  const { useEnglish, pageCount, activityPlan, basicInfo, knowledgeContext } = input;
  try {
    return await getPromptPair(
      'picture-book-design',
      {
        pageCount,
        storyTitleEn: activityPlan?.storyTitleEn || 'My Picture Book',
        imageDescriptionLanguageRule: useEnglish
          ? 'Write every imageDescription in English. Do not include Chinese anywhere.'
          : 'Write every imageDescription in clear Simplified Chinese, while keeping every text field entirely in English.',
      },
      {
        pageCount,
        storyTitleEn: activityPlan?.storyTitleEn || 'My Picture Book',
        storyContent: activityPlan?.storyContent || '',
        englishGoal: activityPlan?.englishGoal || '',
        wellbeingGoal: activityPlan?.wellbeingGoal || '',
        outputGoal: activityPlan?.outputGoal || '',
        materials: activityPlan?.materials || '',
        age: basicInfo?.age || 'Not specified',
        level: basicInfo?.level || 'Not specified',
        vocabulary: basicInfo?.vocabulary || '',
        grammar: basicInfo?.grammar || '',
        knowledgeBlock: knowledgeBlock(knowledgeContext),
        imageDescriptionLanguage: useEnglish ? 'English' : 'Simplified Chinese',
      }
    );
  } catch {
    return buildPictureBookDesignPrompts(input);
  }
}

async function callLLM(systemPrompt: string, userPrompt: string): Promise<any> {
  const apiKey = process.env.VITE_DASHSCOPE_API_KEY;
  const apiUrl = process.env.VITE_DASHSCOPE_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'qwen-plus',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`LLM API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  return JSON.parse(content);
}

function isEnglishOutput(language?: string, outputLanguage?: string): boolean {
  const value = `${outputLanguage || language || ''}`.toLowerCase();
  return value === 'en' || value.startsWith('en-') || value.includes('english');
}

function ensureEnglishTitle(value: unknown): string {
  const title = typeof value === 'string' ? value.trim() : '';
  return title && !/[\u3400-\u9fff]/.test(title) ? title.split(/\s+/).slice(0, 8).join(' ') : 'My Picture Book';
}

function containsChinese(value: unknown): boolean {
  return /[\u3400-\u9fff]/.test(typeof value === 'string' ? value : '');
}

function normalizeImageDescription(
  value: unknown,
  useEnglish: boolean,
  pageText: unknown
): string {
  const description = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  if (description && (useEnglish ? !containsChinese(description) : containsChinese(description))) {
    return description;
  }

  const exactText = typeof pageText === 'string' && !containsChinese(pageText)
    ? pageText.replace(/\s+/g, ' ').trim()
    : '';
  const permittedText = exactText;

  if (useEnglish) {
    return `A spacious guided picture-book activity page with clear choices, visible tools, and a child response area.${permittedText ? ` The only visible English text is: ${permittedText}.` : ' Do not show any text.'}`;
  }
  return `一页留白充足的儿童引导绘本活动画面，展示清晰的选择、可见的工具和孩子的操作留白区。${permittedText ? `画面只允许出现这些英文文字：${permittedText}。` : '画面中不出现任何文字。'}`;
}

function limitEnglishWords(value: unknown, fallback: string): string {
  const text = typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  if (!text || containsChinese(text)) return fallback;
  return text.split(' ').length <= 10 ? text : fallback;
}

function normalizePageType(value: unknown): string {
  const allowed = new Set(['question', 'instruction', 'choice', 'rule']);
  const pageType = typeof value === 'string' ? value.trim().toLowerCase() : '';
  return allowed.has(pageType) ? pageType : 'instruction';
}

function normalizePageCount(value: unknown, fallback = 8): number {
  const count = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(count) ? Math.min(14, Math.max(6, count)) : fallback;
}

function inferPageCount(activityPlan: any, basicInfo: any): number {
  const contentLength = `${activityPlan?.storyContent || ''} ${activityPlan?.englishGoal || ''} ${activityPlan?.wellbeingGoal || ''}`.length;
  const vocabularyCount = String(basicInfo?.vocabulary || '').split(/[,，、\s]+/).filter(Boolean).length;
  const materialCount = Array.isArray(basicInfo?.materials) ? basicInfo.materials.length : 0;
  let count = contentLength > 500 ? 10 : contentLength > 250 ? 9 : 8;
  if (vocabularyCount > 6) count += 1;
  if (materialCount > 3) count += 1;
  return normalizePageCount(count);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, basicInfo, activityPlan, language, outputLanguage } = body;
    const useEnglish = isEnglishOutput(language, outputLanguage);

    // Fetch knowledge context
    const themes = basicInfo?.themes || [];
    const ageRange = basicInfo?.ageRange || '';
    const knowledgeContext = await fetchKnowledgeContext(themes, ageRange, basicInfo);

    if (type === 'activity-plan') {
      const prompts = await resolveActivityPlanPrompts({ useEnglish, basicInfo, themes, knowledgeContext });
      const result = await callLLM(prompts.system, prompts.user);
      const recommendedPageCount = normalizePageCount(
        result.recommendedPageCount,
        inferPageCount(result, basicInfo)
      );
      return NextResponse.json({
        success: true,
        activityPlan: {
          ...result,
          storyTitleEn: ensureEnglishTitle(result.storyTitleEn || result.title),
          storyTitleZh: '',
          recommendedPageCount,
        },
      });

    } else if (type === 'picture-book-design') {
      const pageCount = normalizePageCount(
        body.pageCount || activityPlan?.recommendedPageCount,
        inferPageCount(activityPlan, basicInfo)
      );
      const prompts = await resolvePictureBookDesignPrompts({
        useEnglish,
        pageCount,
        activityPlan,
        basicInfo,
        knowledgeContext,
      });
      const result = await callLLM(prompts.system, prompts.user);
      const pages = Array.isArray(result.pages) ? result.pages : [];
      if (pages.length !== pageCount) {
        throw new Error(`The model returned ${pages.length} pages instead of ${pageCount}.`);
      }
      const normalizedPages = pages.map((page: any, index: number) => ({
        ...page,
        page: index + 1,
        pageType: index === 0 ? 'cover' : index === pages.length - 1 ? 'back-cover' : normalizePageType(page.pageType),
        imageDescription: normalizeImageDescription(
          page.imageDescription,
          useEnglish,
          page.text
        ),
        imagePrompt: typeof page.imagePrompt === 'string' && page.imagePrompt.trim() && !containsChinese(page.imagePrompt)
          ? page.imagePrompt.trim()
          : 'Create a spacious child-friendly guided activity page with clear visual choices and tools. Do not render labels, captions, annotations, speech bubbles, symbols that resemble writing, or any typography beyond the separately supplied exact page text.',
        visualWords: [],
        text: index === 0
          ? limitEnglishWords(ensureEnglishTitle(activityPlan?.storyTitleEn), 'My Picture Book')
          : limitEnglishWords(page.text, index === pages.length - 1 ? 'Every part of you belongs.' : 'Choose, make, and show what feels true.'),
      }));
      return NextResponse.json({ success: true, pages: normalizedPages });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid type. Use "activity-plan" or "picture-book-design".' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[rag/generate] failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Generation failed.' },
      { status: 500 }
    );
  }
}
