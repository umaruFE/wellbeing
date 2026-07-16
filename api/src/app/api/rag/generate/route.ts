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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, basicInfo, activityPlan } = body;

    // Fetch knowledge context
    const themes = basicInfo?.themes || [];
    const ageRange = basicInfo?.ageRange || '';
    const knowledgeContext = await fetchKnowledgeContext(themes, ageRange);

    if (type === 'activity-plan') {
      const systemPrompt = `你是一位专业的儿童英语绘本课程设计师。根据学生信息和参考资料，设计一个绘本活动方案。
只返回JSON，格式：{
  "storyTitleEn": "英文标题",
  "storyTitleZh": "中文标题",
  "storyContent": "故事内容简介（中文，100字以内）",
  "englishGoal": "英文学习目标",
  "wellbeingGoal": "心理健康目标",
  "outputGoal": "产出目标",
  "materials": "所需物料（中文逗号分隔）"
}`;

      const userPrompt = `学生信息：
- 年龄：${basicInfo?.age || '未指定'}
- 英文水平：${basicInfo?.level || '未指定'}
- 主题：${themes.join('、') || '未指定'}
- 核心词汇：${basicInfo?.vocabulary || '未指定'}
- 核心句型/语法：${basicInfo?.grammar || '未指定'}
- 活动时长：${basicInfo?.duration || '未指定'}
- 参与人数：${basicInfo?.participants || '未指定'}
${knowledgeContext ? `\n参考资料（来自知识库）：\n${knowledgeContext}` : ''}

请设计一个适合该年龄段和英文水平的绘本活动方案。`;

      const result = await callLLM(systemPrompt, userPrompt);
      return NextResponse.json({ success: true, activityPlan: result });

    } else if (type === 'picture-book-design') {
      const pageCount = body.pageCount || 6;
      const systemPrompt = `你是一位专业的儿童英语绘本设计师。根据活动方案和学生信息，设计绘本每一页的内容。
只返回JSON，格式：{
  "pages": [
    {
      "page": 1,
      "imageDescription": "中文图片描述（用于AI生图）",
      "text": "英文页面文字（适合儿童阅读的简单句子）"
    }
  ]
}
共${pageCount}页，第1页是封面。`;

      const userPrompt = `活动方案：
- 英文标题：${activityPlan?.storyTitleEn || ''}
- 中文标题：${activityPlan?.storyTitleZh || ''}
- 故事内容：${activityPlan?.storyContent || ''}
- 英文目标：${activityPlan?.englishGoal || ''}
- 物料：${activityPlan?.materials || ''}

学生信息：
- 年龄：${basicInfo?.age || '未指定'}
- 英文水平：${basicInfo?.level || '未指定'}
- 核心词汇：${basicInfo?.vocabulary || ''}
- 核心句型：${basicInfo?.grammar || ''}
${knowledgeContext ? `\n参考资料（来自知识库）：\n${knowledgeContext}` : ''}

请设计${pageCount}页绘本，每页包含图片描述（中文）和页面文字（英文）。`;

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
