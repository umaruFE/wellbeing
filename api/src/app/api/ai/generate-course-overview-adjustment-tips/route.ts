import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function normalizeTips(value: any): string[] {
  const rawTips = Array.isArray(value)
    ? value
    : Array.isArray(value?.tips)
      ? value.tips
      : Array.isArray(value?.data?.tips)
        ? value.data.tips
        : [];

  return rawTips
    .map((tip) => String(tip || '').trim())
    .filter(Boolean)
    .slice(0, 6);
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      courseOverview,
      courseTitle,
      theme,
      age,
      duration,
      scale,
      vocabulary,
      grammar,
      skills,
      paths,
      storyContext,
      keyOutcome,
      userId,
      organizationId,
    } = body;

    const payload = {
      courseOverview: courseOverview || null,
      courseTitle: courseTitle || courseOverview?.courseTitle || '',
      theme: theme || courseOverview?.theme || '',
      age: age || '',
      duration: duration || '',
      scale: scale || '',
      vocabulary: vocabulary || [],
      grammar: grammar || [],
      skills: skills || [],
      paths: paths || [],
      storyContext: storyContext || courseOverview?.overallContext || '',
      keyOutcome: keyOutcome || courseOverview?.finalTask || '',
      userId,
      organizationId,
      timestamp: Date.now(),
    };

    const result = await n8nClient.call('course-overview-adjustment-tips-generator', payload, { timeout: 120000 });
    const firstItem = Array.isArray(result) ? result[0] : result;
    const tips = normalizeTips(firstItem);

    if (tips.length > 0) {
      return NextResponse.json({ success: true, data: { tips } }, { headers: corsHeaders() });
    }

    return NextResponse.json(
      { success: false, error: '未能获取调整建议' },
      { status: 500, headers: corsHeaders() }
    );
  } catch (error) {
    console.error('[generate-course-overview-adjustment-tips] 失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '调整建议生成失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
