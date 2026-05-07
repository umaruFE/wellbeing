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
      prompt,
      width = 1024,
      height = 1024,
      negative_prompt,
      user_id,
      organization_id
    } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: '缺少必要参数: prompt' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const n8nPayload = {
      prompt,
      width,
      height,
      negative_prompt,
      user_id,
      organization_id,
      timestamp: Date.now()
    };

    console.log('[free-image-generation] 调用 N8N:', { prompt: prompt.substring(0, 50) });

    const n8nResult = await n8nClient.call('ai-free-image-generation', n8nPayload, { timeout: 120000 });

    const resultData = n8nResult as { executionId?: string; id?: string; comfyuiUrl?: string };
    const executionId = resultData.executionId || resultData.id;

    return NextResponse.json({
      success: true,
      tasks: [{
        type: 'scene',
        promptId: executionId,
        apiUrl: resultData.comfyuiUrl
      }],
      workflowType: 'image'
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('[free-image-generation] 失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '图片生成失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
