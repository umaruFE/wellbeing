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
  return title && !/[\u3400-\u9fff]/.test(title) ? title : 'My Picture Book';
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
      const systemPrompt = `You are a professional designer of children's English picture-book courses. Create an activity plan from the student information and reference material.
Return JSON only, using this exact shape:
{
  "storyTitleEn": "An appealing English title",
  "storyTitleZh": "",
  "storyContent": "A story synopsis of no more than 100 words",
  "englishGoal": "English learning goals",
  "wellbeingGoal": "Wellbeing goals",
  "outputGoal": "Expected output",
  "materials": "Required materials"
}
The picture-book title must always be in English. Keep storyTitleZh as an empty string.
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

Design a picture-book activity plan suitable for the students' age and English level. Output language: ${useEnglish ? 'English' : 'Simplified Chinese, except for the English title'}.`;

      const result = await callLLM(systemPrompt, userPrompt);
      return NextResponse.json({
        success: true,
        activityPlan: {
          ...result,
          storyTitleEn: ensureEnglishTitle(result.storyTitleEn || result.title),
          storyTitleZh: '',
        },
      });

    } else if (type === 'picture-book-design') {
      const pageCount = body.pageCount || 6;
      const systemPrompt = `You are a professional children's English picture-book designer. Design every page from the activity plan and student information.
Return JSON only, using this exact shape:
{
  "pages": [
    {
      "page": 1,
      "imageDescription": "A detailed image-generation description",
      "text": "Short, child-friendly page text"
    }
  ]
}
Create exactly ${pageCount} pages. Page 1 is the cover, and its text must be the English title exactly: ${activityPlan?.storyTitleEn || 'My Picture Book'}.
The picture-book title must always remain in English.
${useEnglish
  ? 'Write every generated field entirely in English, including all imageDescription and text fields. Do not include Chinese text or bilingual translations.'
  : 'Write imageDescription fields in Simplified Chinese. Keep the cover title and child-facing page text in English for this English-learning picture book.'}`;

      const userPrompt = `Activity plan:
- English title: ${activityPlan?.storyTitleEn || 'My Picture Book'}
- Story content: ${activityPlan?.storyContent || ''}
- English goals: ${activityPlan?.englishGoal || ''}
- Materials: ${activityPlan?.materials || ''}

Student information:
- Age: ${basicInfo?.age || 'Not specified'}
- English level: ${basicInfo?.level || 'Not specified'}
- Core vocabulary: ${basicInfo?.vocabulary || ''}
- Core sentence patterns: ${basicInfo?.grammar || ''}
${knowledgeContext ? `\nReference material from the knowledge base:\n${knowledgeContext}` : ''}

Design ${pageCount} picture-book pages in the required output language.`;

      const result = await callLLM(systemPrompt, userPrompt);
      return NextResponse.json({ success: true, pages: result.pages || [] });
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
