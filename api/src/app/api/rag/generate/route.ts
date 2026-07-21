import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TABLE = 'picturebook_knowledge';

async function fetchKnowledgeContext(themes: string[], ageRange: string): Promise<string> {
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
    const knowledgeContext = await fetchKnowledgeContext(themes, ageRange);

    if (type === 'activity-plan') {
      const systemPrompt = `You are a professional designer of action-led children's English guided picture books.

CORE DEFINITION — UNDERSTAND THIS BEFORE GENERATING:
A guided picture book is NOT a story picture book. Never create characters with plots, narrative scenes, story arcs, or pages about what happened to someone else. The child must never be a passive reader.
A guided picture book makes the child an active creator. Every activity page asks the child to do something now: notice, answer an open question, choose, point, move, make, draw, name, or share.

FOUNDATION:
Art expression, emotional wellbeing, and natural language acquisition happen at the same time. Art is a medium for externalizing inner experience, not a technique lesson. Accept every choice without judgment or correction. English appears naturally because the child needs it for authentic self-expression; never teach grammar, test, or drill.

Create the activity plan from the student information and reference material.
Return JSON only, using this exact shape:
{
  "storyTitleEn": "An appealing English title",
  "storyTitleZh": "",
  "storyContent": "A concise guided creative experience concept with no plot",
  "englishGoal": "English learning goals",
  "wellbeingGoal": "Wellbeing goals",
  "outputGoal": "Expected output",
  "materials": "Required materials",
  "recommendedPageCount": 8
}
The title must always be English, action-oriented, memorable, and at most 8 words. Keep storyTitleZh empty.
storyContent must describe what children notice, choose, make, and express. It must not contain a plot, protagonist, conflict, story arc, or narrative sequence.
Choose recommendedPageCount from 6 to 14 according to the actual amount of meaningful content and child actions. Use 6–8 pages for a simple focused activity, 9–10 for a normal activity, and 11–14 only for genuinely complex content. Never add filler pages merely to increase the count.
${useEnglish
  ? 'Write every generated field entirely in English. Do not include Chinese translations, bilingual labels, or Chinese text anywhere in the output.'
  : 'Write storyContent, englishGoal, wellbeingGoal, outputGoal, and materials in Simplified Chinese. Keep storyTitleEn entirely in English.'}`;

      const userPrompt = `Student information:
- Age: ${basicInfo?.age || 'Not specified'}
- English level: ${basicInfo?.level || 'Not specified'}
- Themes: ${themes.join(', ') || 'Not specified'}
- Core vocabulary: ${basicInfo?.vocabulary || 'Not specified'}
- Core sentence patterns/grammar: ${basicInfo?.grammar || 'Not specified'}
- Activity duration: ${basicInfo?.duration || 'Not specified'}
- Participants: ${basicInfo?.participants || 'Not specified'}
${knowledgeContext ? `\nReference material from the knowledge base:\n${knowledgeContext}` : ''}

Design a guided picture-book activity plan suitable for the students' age and English level. Preserve the three simultaneous layers: artistic expression, wellbeing, and natural English use. Output language: ${useEnglish ? 'English' : 'Simplified Chinese, except for the English title'}.`;

      const result = await callLLM(systemPrompt, userPrompt);
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
      const systemPrompt = `You are a professional designer of action-led children's English guided picture books.

NON-NEGOTIABLE DEFINITION:
This is a GUIDED PICTURE BOOK, never a story picture book. Do not create a plot, protagonist journey, narrative scene, story arc, exposition, conflict, or sequence such as “then they...” and “the character went...”. The child is the active creator, not a passive reader.

Every activity page must make the child do something now. After each page, the answer to “What did the child do?” must be a concrete action. If the answer is “nothing, they only looked/read,” rewrite the page.

THE THREE SIMULTANEOUS LAYERS:
1. Artistic expression: colors, shapes, drawing, collage, or making externalize inner experience.
2. Wellbeing: the process accepts and releases feelings; never judge, correct, compare, or demand artistic quality.
3. Natural English: English is used for authentic choices and expression. Never explain grammar, test, or drill.

ALLOWED PAGE TYPES ONLY:
- cover: English title plus inviting group/creative tools; sparks curiosity.
- question: one open question with visual prompts and no correct answer.
- instruction: one clear action plus visible tools/materials/response space.
- choice: multiple illustrated option cards with short English labels.
- rule: a visual game mechanism plus minimal directions.
- back-cover: one memorable landing-point sentence plus a small guide saying goodbye visually; nothing else.

FORBIDDEN:
- narrative, plot-progression, passive viewing, preaching, art-technique teaching, praise-only endings, model answers, Chinese in child-facing page text, grammar instruction, tests, or more than one core task per page.

LANDING POINT:
The final back cover is the soul of the book. It must contain only one memorable, accepting English sentence connected to the child’s experience—not “Well done” or “You finished.” Ask what the child experienced and what they most need to hear; that sentence is the landing point.

TEXT AND VISUAL RULES:
- Core page text must always be English and at most 10 English words.
- pageType values must use the English enum shown in the JSON schema.
- ${useEnglish ? 'Write every imageDescription in English. Do not include Chinese anywhere.' : 'Write every imageDescription in clear Simplified Chinese, while keeping every text field entirely in English.'}
- visualWords must always be an empty array. The text field is the single source of visible typography.
- imageDescription must describe the child’s action, visible choices/tools, and response space—not a narrative scene. It must not request labels, headings, captions, annotations, or any writing beyond the exact text field.
- imagePrompt must always be an English-only, non-visible scene instruction. Prefer concise visual phrases instead of display-ready headings or sentences. It must allow only the exact text field while forbidding all other typography.
- Use exact short sentence anchors naturally when useful, such as “I pick...”, “I feel...”, or the user’s target pattern.

Design every page from the activity plan and student information.
ACTIVITY-SPECIFIC REQUIREMENTS:
- Build this book specifically from the current English title, story content, learning goals, wellbeing goals, materials, target vocabulary, and sentence patterns below.
- Do not reuse a generic sequence of color-feeling, body-awareness, drawing-a-shape, dice, naming, and sharing pages unless those actions are explicitly required by this activity plan.
- Every middle page must contain at least one concrete activity-specific object, material, vocabulary concept, or action from the current inputs.
- Pages from a nature activity, food activity, relationship activity, movement activity, and emotion activity must be visibly and structurally different.
- imageDescription and imagePrompt must describe the exact visible scene for that individual page. They must not be interchangeable boilerplate.
Return JSON only, using this exact shape:
{
  "pages": [
    {
      "page": 1,
      "pageType": "cover | question | instruction | choice | rule | back-cover",
      "imageDescription": "A detailed image-generation description",
      "imagePrompt": "An English-only visual prompt with no requested labels or extra writing",
      "visualWords": ["exact English words that this page explicitly permits, otherwise empty"],
      "text": "Short, child-friendly page text"
    }
  ]
}
Create exactly ${pageCount} pages. Page 1 must be type cover and its text must be the English title exactly: ${activityPlan?.storyTitleEn || 'My Picture Book'}. The final page must be type back-cover and contain only the landing point. Every page between them must use one allowed activity type. Include a purposeful progression from noticing to choosing, making, naming, and sharing; this is a progression of child actions, never a plot.`;

      const userPrompt = `Activity plan:
- English title: ${activityPlan?.storyTitleEn || 'My Picture Book'}
- Story content: ${activityPlan?.storyContent || ''}
- English goals: ${activityPlan?.englishGoal || ''}
- Wellbeing goals: ${activityPlan?.wellbeingGoal || ''}
- Expected output: ${activityPlan?.outputGoal || ''}
- Materials: ${activityPlan?.materials || ''}

Student information:
- Age: ${basicInfo?.age || 'Not specified'}
- English level: ${basicInfo?.level || 'Not specified'}
- Core vocabulary: ${basicInfo?.vocabulary || ''}
- Core sentence patterns: ${basicInfo?.grammar || ''}
${knowledgeContext ? `\nReference material from the knowledge base:\n${knowledgeContext}` : ''}

Design ${pageCount} guided picture-book pages. Page text must be English. Image-description language: ${useEnglish ? 'English' : 'Simplified Chinese'}.`;

      const result = await callLLM(systemPrompt, userPrompt);
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
