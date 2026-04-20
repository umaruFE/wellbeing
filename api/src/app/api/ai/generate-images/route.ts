import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { n8nClient } from '@/lib/n8n/client';

/**
 * N8N 图片生成路由
 * 
 * 改造说明：
 * - 原来直接调用 ComfyUI，现改为调用 N8N Workflow
 * - 提示词由 N8N Workflow 从 Variables 中获取
 * - 后端只负责传参数
 */

// CORS 响应头辅助函数
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// OPTIONS 处理函数 - 处理预检请求
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

/**
 * POST /api/ai/generate-images
 * 
 * 生成多张图片，通过 N8N Workflow 调用
 * 
 * @param request.body
 * @param workflow_type - 工作流类型: scene|person|lora-v3|background|ip-character|composite
 * @param prompt - 提示词
 * @param width - 图片宽度
 * @param height - 图片高度
 * @param count - 生成数量
 * @param reference_image - 参考图URL (可选)
 * @param character_name - IP角色名称 (可选)
 * @param video_style - 风格名称 (可选)
 * @param roles - 角色数组 (可选，用于composite)
 * @param user_id - 用户ID
 * @param organization_id - 组织ID
 * 
 * @returns
 * @success - executionId 列表，前端轮询状态
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 认证
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const user = authResult.user;

    // 2. 解析请求参数
    const body = await request.json();
    const {
      workflow_type = 'scene',
      prompt,
      width = 1024,
      height = 1024,
      count = 1,
      reference_image,
      video_style,
      character_name,
      roles,
      user_id,
      organization_id
    } = body;

    // 3. 参数验证
    if (!prompt) {
      return NextResponse.json(
        { error: '缺少必要参数: prompt' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // 4. 准备 N8N 调用参数
    const n8nPayload = {
      workflow_type,
      prompt,
      width,
      height,
      reference_image,
      video_style,
      character_name,
      roles,
      user_id: user.id,
      organization_id,
      timestamp: Date.now()
    };

    console.log('[generate-images] 调用 N8N Workflow:', {
      workflow: 'ai-image-generation',
      workflow_type,
      prompt: prompt.substring(0, 50) + '...',
      user_id: user.id
    });

    // 5. 调用 N8N Workflow
    const n8nResult = await n8nClient.call('ai-image-generation', n8nPayload);

    console.log('[generate-images] N8N 响应:', n8nResult);

    // 6. 保存到数据库
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validUserId = (user_id && uuidRegex.test(user_id)) ? user_id : null;
      const validOrganizationId = (organization_id && uuidRegex.test(organization_id)) ? organization_id : null;

      const executionId = n8nResult.executionId || n8nResult.id;

      await db.from('prompt_history').insert({
        user_id: validUserId,
        organization_id: validOrganizationId,
        prompt_type: 'image_generation',
        original_prompt: prompt,
        generated_result: null,
        model_name: 'qwen-image',
        execution_time: null,
        success: true,
        error_message: null,
        prompt_id: executionId
      });

      console.log('[generate-images] 已保存 executionId 到数据库:', executionId);
    } catch (dbError) {
      console.error('[generate-images] 保存到数据库失败:', dbError);
    }

    // 7. 返回结果
    return NextResponse.json({
      success: true,
      executionId: n8nResult.executionId || n8nResult.id,
      workflowType: workflow_type,
      workflow: 'ai-image-generation'
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('[generate-images] 调用失败:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '生成失败',
        details: error instanceof Error ? error.stack : null
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
