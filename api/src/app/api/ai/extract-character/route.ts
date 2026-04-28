import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';

/**
 * N8N 人物特征提取路由
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
 * POST /api/ai/extract-character
 * 
 * 提取人物特征描述
 * 通过 N8N Workflow 调用
 * 
 * @param request.body
 * @param description - 人物描述
 * @param videoStyle - 风格名称 (default|ink-painting|pixar|cartoon|cyberpunk|realistic|scifi|fantasy)
 * 
 * @returns
 * @success - 是否成功
 * @character - 人物特征描述
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, videoStyle } = body;

    // 参数验证
    if (!description) {
      return NextResponse.json(
        { error: '缺少必要参数: description' },
        { status: 400, headers: corsHeaders() }
      );
    }

    console.log('[extract-character] 调用 N8N Workflow:', {
      workflow: 'ai-prompt-processing',
      taskType: 'character-extract',
      videoStyle: videoStyle || 'default',
      descriptionLength: description.length
    });

    // 调用 N8N Workflow
    const result = await n8nClient.call('ai-prompt-processing', {
      taskType: 'character-extract',
      description,
      videoStyle: videoStyle || 'default',
      timestamp: Date.now()
    });

    console.log('[extract-character] N8N 响应:', result);

    // 提取结果
    const resultData = result as { character?: string; data?: { character?: string } };
    const character = resultData.character || resultData.data?.character || '一个通用卡通人物';

    // 返回结果
    return NextResponse.json({
      success: true,
      character
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('[extract-character] 提取失败:', error);

    // 降级处理：返回默认人物描述
    return NextResponse.json(
      {
        success: true, // 返回 success: true，避免前端逻辑中断
        character: '一个通用卡通人物',
        error: error instanceof Error ? error.message : '提取人物特征失败'
      },
      { status: 200, headers: corsHeaders() }
    );
  }
}
