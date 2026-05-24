import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      age,
      duration,
      scale,
      vocabulary,
      grammar,
      skills,
      paths,
      theme,
      requirements,
      adjustments,
      existingOverview,
      userId,
      organizationId
    } = body;

    console.log('[generate-course-overview] 收到请求:', { theme, duration });

    const n8nPayload = {
      age: age || '7-9岁',
      duration: duration || '60分钟',
      scale: scale || '9-15人',
      vocabulary: vocabulary || [],
      grammar: grammar || [],
      skills: skills || [],
      paths: paths || [],
      theme: theme || '',
      requirements: requirements || '',
      adjustments: adjustments || '',
      existing_overview: existingOverview ? (typeof existingOverview === 'string' ? existingOverview : JSON.stringify(existingOverview)) : '',
      userId,
      organizationId,
      timestamp: Date.now()
    };

    console.log('[generate-course-overview] 调用 N8N:', { workflow: 'course-overview-generator' });

    const result = await n8nClient.call('course-overview-generator', n8nPayload, { timeout: 300000 });

    console.log('[generate-course-overview] N8N 响应:', JSON.stringify(result, null, 2).substring(0, 500));

    let courseOverview = null;

    if (Array.isArray(result) && result.length > 0) {
      const firstItem = result[0];

      if (firstItem?.text && typeof firstItem.text === 'string') {
        const text = firstItem.text.trim();
        try {
          const parsed = JSON.parse(text);
          courseOverview = parsed.courseOverview || parsed;
        } catch {
          try {
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleaned);
            courseOverview = parsed.courseOverview || parsed;
          } catch (e) {
            console.error('[generate-course-overview] JSON解析失败:', e);
          }
        }
      } else if (firstItem?.courseOverview) {
        courseOverview = firstItem.courseOverview;
      } else if (firstItem?.output?.courseOverview) {
        courseOverview = firstItem.output.courseOverview;
      }
    }

    if (courseOverview) {
      return NextResponse.json({
        success: true,
        data: { courseOverview }
      }, { headers: corsHeaders() });
    }

    return NextResponse.json({
      success: false,
      error: '未能获取课程概览数据'
    }, { status: 500, headers: corsHeaders() });

  } catch (error) {
    console.error('[generate-course-overview] 失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '课程概览生成失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
