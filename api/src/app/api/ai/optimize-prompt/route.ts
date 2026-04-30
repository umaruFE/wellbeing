import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';

/**
 * N8N 提示词优化路由
 * 
 * 改造说明：
 * - 原来直接调用 DashScope API（提示词从 prompt-config.js 获取）
 * - 现改为调用 N8N Workflow（ai-prompt-processing）
 * - 提示词由 N8N Workflow 从 Variables 中获取
 */

// CORS 响应头
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
 * POST /api/ai/optimize-prompt
 * 
 * 优化提示词
 * 通过 N8N Workflow 调用
 * 
 * @param request.body
 * @param originalPrompt - 原始提示词
 * @param elementType - 元素类型 (video|storyboard|regene|extract-keywords|extract-character|optimize|general)
 * 
 * @returns
 * @success - 是否成功
 * @optimizedPrompt - 优化后的提示词
 * @originalPrompt - 原始提示词
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalPrompt, elementType } = body;

    // 参数验证
    if (!originalPrompt) {
      return NextResponse.json(
        { error: '缺少必要参数: originalPrompt' },
        { status: 400, headers: corsHeaders() }
      );
    }

    console.log('[optimize-prompt] 调用 N8N Workflow:', {
      workflow: 'ai-prompt-optimize',
      originalPromptLength: originalPrompt.length,
      elementType: elementType || 'general'
    });

    // 调用 N8N Workflow
    const result = await n8nClient.call('ai-prompt-optimize', {
      prompt: originalPrompt,
      task_type: elementType || 'general',
      timestamp: Date.now()
    });

    console.log('[optimize-prompt] N8N 响应:', result);

    // 提取结果
    const resultData = result as { optimized_prompt?: string; optimizedPrompt?: string };
    const optimizedPrompt = resultData.optimized_prompt || resultData.optimizedPrompt || originalPrompt;

    // 返回结果
    return NextResponse.json({
      success: true,
      optimizedPrompt,
      originalPrompt
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('[optimize-prompt] 优化失败:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '优化提示词失败',
        details: error instanceof Error ? error.stack : null
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
