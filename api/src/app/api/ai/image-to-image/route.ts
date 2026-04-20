import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { n8nClient } from '@/lib/n8n/client';

/**
 * N8N 图生图路由
 * 
 * 改造说明：
 * - 原来直接调用 ComfyUI
 * - 现改为调用 N8N Workflow（ai-image-to-image）
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
 * POST /api/ai/image-to-image
 * 
 * 图生图
 * 通过 N8N Workflow 调用
 * 
 * @param request.body
 * @param prompt - 提示词
 * @param imageUrl - 参考图片URL
 * @param count - 生成数量
 * @param width - 图片宽度
 * @param height - 图片高度
 * @param strength - 重绘强度 (可选)
 * @param user_id - 用户ID
 * @param organization_id - 组织ID
 * 
 * @returns
 * @success - 是否成功
 * @executionId - 执行ID
 * @status - 状态
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      imageUrl,
      count = 1,
      width = 1024,
      height = 1024,
      strength = 0.75,
      user_id,
      organization_id
    } = body;

    console.log('[image-to-image] 收到图生图请求:', {
      promptLength: prompt?.length,
      imageUrlLength: imageUrl?.length,
      count,
      width,
      height,
      strength
    });

    // 参数验证
    if (!prompt) {
      return NextResponse.json(
        { error: '缺少必要参数: prompt' },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: '缺少必要参数: imageUrl' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // 准备 N8N 调用参数
    const n8nPayload = {
      prompt,
      image_url: imageUrl,
      width,
      height,
      strength,
      user_id,
      organization_id,
      timestamp: Date.now()
    };

    console.log('[image-to-image] 调用 N8N Workflow:', {
      workflow: 'ai-image-to-image',
      promptLength: prompt.length,
      hasImageUrl: !!imageUrl
    });

    // 调用 N8N Workflow
    const n8nResult = await n8nClient.call('ai-image-to-image', n8nPayload);

    console.log('[image-to-image] N8N 响应:', n8nResult);

    // 保存到数据库
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validUserId = (user_id && uuidRegex.test(user_id)) ? user_id : null;
      const validOrganizationId = (organization_id && uuidRegex.test(organization_id)) ? organization_id : null;

      const executionId = n8nResult.executionId || n8nResult.id;

      await db.from('prompt_history').insert({
        user_id: validUserId,
        organization_id: validOrganizationId,
        prompt_type: 'image_to_image',
        original_prompt: prompt,
        generated_result: null,
        model_name: 'qwen-image',
        execution_time: null,
        success: true,
        error_message: null,
        prompt_id: executionId
      });

      console.log('[image-to-image] 已保存 executionId 到数据库:', executionId);
    } catch (dbError) {
      console.error('[image-to-image] 保存到数据库失败:', dbError);
    }

    // 返回结果
    return NextResponse.json({
      success: true,
      executionId: n8nResult.executionId || n8nResult.id,
      workflowType: 'image-to-image',
      workflow: 'ai-image-to-image'
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('[image-to-image] 图生图失败:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '图生图失败',
        details: error instanceof Error ? error.stack : null
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
