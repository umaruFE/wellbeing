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

    console.log('[generate-course-idea] 调用 N8N 工作流: course-idea-generator');

    const result = await n8nClient.call('course-idea-generator', body, { timeout: 120000 });

    console.log('[generate-course-idea] N8N 响应:', JSON.stringify(result, null, 2).substring(0, 500));

    const firstItem = Array.isArray(result) ? result[0] : result;
    const data = firstItem?.data || firstItem;

    if (data?.text && typeof data.text === 'string') {
      try {
        const parsed = JSON.parse(data.text);
        return NextResponse.json({ success: true, data: parsed }, { headers: corsHeaders() });
      } catch {
        return NextResponse.json({ success: true, data }, { headers: corsHeaders() });
      }
    }

    return NextResponse.json({ success: true, data }, { headers: corsHeaders() });
  } catch (error) {
    console.error('[generate-course-idea] 失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '创意生成失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
