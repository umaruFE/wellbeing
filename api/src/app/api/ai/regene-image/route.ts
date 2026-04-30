import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';

/**
 * N8N 图片重新生成路由
 * 
 * 改造说明：
 * - 已通过 N8N 调用（/webhook/regene-image）
 * - 现改为使用统一的 n8nClient 调用
 * - 提示词优化由 N8N Workflow 内部处理
 */

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

/**
 * POST /api/ai/regene-image
 * 
 * 重新生成图片
 * 通过 N8N Workflow 调用
 * 
 * @param request.body
 * @param width - 图片宽度
 * @param height - 图片高度
 * @param role - 角色ID
 * @param prompt - 提示词
 * 
 * @returns
 * @success - 是否成功
 * @executionId - 执行ID
 * @status - 状态
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { width, height, role, prompt } = body;

    console.log('[regene-image] 收到重新生成图片请求:', {
      width,
      height,
      role,
      promptLength: prompt?.length
    });

    // 参数验证
    if (!role || !prompt) {
      return NextResponse.json(
        { error: '缺少必要参数: role 或 prompt' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // 构建 N8N 调用参数（JSON 格式）
    const n8nPayload = {
      width: width || 1280,
      height: height || 720,
      role,
      prompt,
      timestamp: Date.now()
    };

    console.log('[regene-image] 调用 N8N Workflow:', {
      workflow: 'ai-storyboard-generation',
      webhook: 'regene-image',
      role,
      width: n8nPayload.width,
      height: n8nPayload.height
    });

    // 调用 N8N Workflow（使用统一的 n8nClient）
    const result = await n8nClient.call('regene-image', n8nPayload);

    console.log('[regene-image] N8N 响应:', result);

    // 提取 executionId
    const resultData = result as { executionId?: string; id?: string; status?: string };
    const executionId = resultData.executionId || resultData.id;

    return NextResponse.json({
      success: true,
      data: {
        executionId,
        status: resultData.status || 'processing'
      }
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('[regene-image] 图片重生成失败:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '重新生成图片失败',
        details: error instanceof Error ? error.stack : null
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
