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

    console.log('[polish-course-content] 调用 N8N 工作流: course-content-polisher');

    const result = await n8nClient.call('course-content-polisher', body, { timeout: 120000 });

    console.log('[polish-course-content] N8N 响应:', JSON.stringify(result, null, 2).substring(0, 500));

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
    console.error('[polish-course-content] 失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '内容润色失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
