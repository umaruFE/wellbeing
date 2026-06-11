import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';

const WORKFLOW = process.env.N8N_COURSE_JOURNEY_WORKFLOW || 'course-overview-generator';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

function parseMaybeJson(value: any): any {
  if (!value || typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function normalizeJourney(input: any) {
  const data = parseMaybeJson(input?.text) || input;
  const candidate =
    data?.journey ||
    data?.classJourney ||
    data?.courseJourney ||
    data?.courseOverview?.journey ||
    data?.data?.journey ||
    data?.data?.courseJourney ||
    data?.data?.courseOverview?.journey;

  if (Array.isArray(candidate)) {
    const byIndex = candidate.reduce((acc: Record<string, string>, item: any, index: number) => {
      const key = ['engage', 'empower', 'execute', 'elevate'][index];
      const text = item?.description || item?.desc || item?.content || item?.text;
      if (key && text) acc[key] = String(text).trim();
      return acc;
    }, {});
    return byIndex;
  }

  if (!candidate || typeof candidate !== 'object') return null;

  const journey = {
    engage: candidate.engage || candidate.Engage || candidate.e_engage,
    empower: candidate.empower || candidate.Empower || candidate.e_empower,
    execute: candidate.execute || candidate.Execute || candidate.e_execute,
    elevate: candidate.elevate || candidate.Elevate || candidate.e_elevate,
  };

  return Object.fromEntries(
    Object.entries(journey)
      .map(([key, value]) => [key, String(value || '').trim()])
      .filter(([, value]) => value)
  );
}

function hasCompleteJourney(journey: any) {
  return Boolean(journey?.engage && journey?.empower && journey?.execute && journey?.elevate);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      courseTitle,
      age,
      duration,
      classSize,
      vocabulary,
      grammar,
      skills,
      experiencePath,
      taskName,
      theme,
      storyContext,
      keyOutcome,
      growth,
      atmosphere,
      specialRequirements,
      existingOverview,
      userId,
      organizationId,
    } = body;

    const prompt = [
      '你是一名儿童英语课程设计专家，请为 CourseGen AI 的课程地图生成“课堂旅程 Class Journey”。',
      '必须基于课程主题、故事情境、语言目标、最终成果和成长目标生成，不能使用通用模板句。',
      '请严格输出 JSON，不要 Markdown，不要解释。',
      'JSON 格式：{"journey":{"engage":"...","empower":"...","execute":"...","elevate":"..."}}',
      '四个字段要求：每项 35-70 个中文字符；必须出现本课程的具体任务、语言工具或成果物；elevate 必须体现迁移/反思/成长。',
      '课程信息：',
      `课程标题：${courseTitle || ''}`,
      `年龄：${age || ''}`,
      `时长：${duration || ''}`,
      `班级规模：${classSize || ''}`,
      `任务主题：${taskName || theme || ''}`,
      `故事情境：${storyContext || ''}`,
      `最终成果：${keyOutcome || ''}`,
      `词汇：${Array.isArray(vocabulary) ? vocabulary.join('、') : vocabulary || ''}`,
      `句型/语法：${Array.isArray(grammar) ? grammar.join('、') : grammar || ''}`,
      `能力侧重：${Array.isArray(skills) ? skills.join('、') : skills || ''}`,
      `体验路径：${experiencePath || ''}`,
      `课堂氛围：${atmosphere || ''}`,
      `成长目标：${growth || ''}`,
      `特殊要求：${specialRequirements || ''}`,
    ].join('\n');

    const n8nPayload = {
      taskType: 'generate-course-journey',
      generationType: 'class_journey',
      prompt,
      responseFormat: 'json',
      courseTitle: courseTitle || '',
      age: age || '7-9岁',
      duration: duration || '60分钟',
      scale: classSize || '9-15人',
      vocabulary: vocabulary || [],
      grammar: grammar || [],
      skills: skills || [],
      paths: experiencePath ? [experiencePath] : [],
      theme: theme || taskName || '',
      taskName: taskName || theme || '',
      storyContext: storyContext || '',
      keyOutcome: keyOutcome || '',
      growth: growth || '',
      atmosphere: atmosphere || '',
      requirements: specialRequirements || '',
      existing_overview: existingOverview
        ? (typeof existingOverview === 'string' ? existingOverview : JSON.stringify(existingOverview))
        : '',
      expectedOutput: {
        journey: {
          engage: 'string',
          empower: 'string',
          execute: 'string',
          elevate: 'string',
        },
      },
      userId,
      organizationId,
      timestamp: Date.now(),
    };

    console.log('[generate-course-journey] 调用 N8N:', { workflow: WORKFLOW });
    const result = await n8nClient.call(WORKFLOW, n8nPayload, { timeout: 180000 });
    console.log('[generate-course-journey] N8N 响应:', JSON.stringify(result, null, 2).substring(0, 500));

    const firstItem = Array.isArray(result) ? result[0] : result;
    const parsedData = parseMaybeJson(firstItem?.data?.text) || parseMaybeJson(firstItem?.text) || firstItem?.data || firstItem;
    const journey = normalizeJourney(parsedData);

    if (!hasCompleteJourney(journey)) {
      return NextResponse.json(
        { success: false, error: 'AI 未返回完整课堂旅程', raw: parsedData },
        { status: 502, headers: corsHeaders() }
      );
    }

    return NextResponse.json({ success: true, data: { journey } }, { headers: corsHeaders() });
  } catch (error) {
    console.error('[generate-course-journey] 失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '课堂旅程生成失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
