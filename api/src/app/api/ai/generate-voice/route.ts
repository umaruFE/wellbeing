import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { n8nClient } from '@/lib/n8n/client';

/**
 * N8N 语音合成路由
 * 
 * 改造说明：
 * - 原来直接调用 ComfyUI
 * - 现改为调用 N8N Workflow（ai-voice-generation）
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
 * POST /api/ai/generate-voice
 * 
 * 生成语音
 * 通过 N8N Workflow 调用
 * 
 * @param request.body
 * @param text - 待合成文本
 * @param voice - 声音名称 (默认 zh-CN-XiaoxiaoNeural)
 * @param speed - 语速 (默认 1.0)
 * @param pitch - 音调 (默认 1.0)
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
      text,
      voice,
      speed = 1.0,
      pitch = 1.0,
      user_id,
      organization_id
    } = body;

    console.log('[generate-voice] 收到生成语音请求:', {
      textLength: text?.length,
      voice,
      speed,
      pitch
    });

    // 参数验证
    if (!text) {
      return NextResponse.json(
        { error: '缺少必要参数: text' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // 准备 N8N 调用参数
    const n8nPayload = {
      text,
      voice: voice || 'zh-CN-XiaoxiaoNeural',
      speed,
      pitch,
      user_id,
      organization_id,
      timestamp: Date.now()
    };

    console.log('[generate-voice] 调用 N8N Workflow:', {
      workflow: 'ai-voice-generation',
      textLength: text.length
    });

    // 调用 N8N Workflow
    const n8nResult = await n8nClient.call('ai-voice-generation', n8nPayload);

    console.log('[generate-voice] N8N 响应:', n8nResult);

    // 保存到数据库
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validUserId = (user_id && uuidRegex.test(user_id)) ? user_id : null;
      const validOrganizationId = (organization_id && uuidRegex.test(organization_id)) ? organization_id : null;

      const executionId = n8nResult.executionId || n8nResult.id;

      await db.from('prompt_history').insert({
        user_id: validUserId,
        organization_id: validOrganizationId,
        prompt_type: 'voice_generation',
        original_prompt: text,
        generated_result: null,
        model_name: 'edge-tts',
        execution_time: null,
        success: true,
        error_message: null,
        prompt_id: executionId
      });

      console.log('[generate-voice] 已保存 executionId 到数据库:', executionId);
    } catch (dbError) {
      console.error('[generate-voice] 保存到数据库失败:', dbError);
    }

    // 返回结果
    return NextResponse.json({
      success: true,
      executionId: n8nResult.executionId || n8nResult.id,
      workflowType: 'voice',
      workflow: 'ai-voice-generation'
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('[generate-voice] 生成失败:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '生成失败',
        details: error instanceof Error ? error.stack : null
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}

/**
 * GET /api/ai/generate-voice
 * 
 * 查询语音生成状态
 * 
 * @param query.executionId - 执行ID
 * 
 * @returns
 * @success - 是否成功
 * @status - completed|pending|error
 * @url - OSS文件URL（完成时）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('executionId');

    if (!executionId) {
      return NextResponse.json(
        { error: '缺少 executionId 参数' },
        { status: 400, headers: corsHeaders() }
      );
    }

    console.log('[generate-voice] 查询执行状态:', executionId);

    // 调用 N8N 查询执行状态
    const result = await n8nClient.call('ai-task-status', {
      executionId,
      workflowType: 'voice'
    });

    console.log('[generate-voice] N8N 响应:', result);

    // 根据状态返回结果
    if (result.status === 'completed') {
      return NextResponse.json({
        success: true,
        status: 'completed',
        url: result.url,
        filename: result.filename
      }, { headers: corsHeaders() });
    } else if (result.status === 'error') {
      return NextResponse.json({
        success: false,
        status: 'error',
        error: result.error || '任务执行失败'
      }, { headers: corsHeaders() });
    } else {
      return NextResponse.json({
        success: true,
        status: 'pending'
      }, { headers: corsHeaders() });
    }

  } catch (error) {
    console.error('[generate-voice] 查询失败:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '查询失败'
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
