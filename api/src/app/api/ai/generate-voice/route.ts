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
      voice_id,
      speed = 1.0,
      pitch = 1.0,
      emotion_prompt,
      user_id,
      organization_id
    } = body;

    console.log('[generate-voice] 收到生成语音请求:', {
      textLength: text?.length,
      voice_id,
      speed,
      pitch,
      emotion_prompt
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
      voice_id: voice_id || 'zh-CN-XiaoxiaoNeural',
      speed,
      pitch,
      emotion_prompt,
      user_id,
      organization_id,
      timestamp: Date.now()
    };

    console.log('[generate-voice] 调用 N8N Workflow:', {
      workflow: 'gene-audio',
      textLength: text.length
    });

    // 调用 N8N Workflow
    const n8nResult = await n8nClient.call('gene-audio', n8nPayload);

    console.log('[generate-voice] N8N 响应:', n8nResult);

    // 保存到数据库
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validUserId = (user_id && uuidRegex.test(user_id)) ? user_id : null;
      const validOrganizationId = (organization_id && uuidRegex.test(organization_id)) ? organization_id : null;

      const n8nResultData = n8nResult as { executionId?: string; id?: string };
      const executionId = n8nResultData.executionId || n8nResultData.id;

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
    const n8nResultData = n8nResult as { executionId?: string; id?: string };
    return NextResponse.json({
      success: true,
      executionId: n8nResultData.executionId || n8nResultData.id,
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

    // 调用 N8N API 查询执行状态
    const executionStatus = await n8nClient.pollExecution(executionId, {
      maxAttempts: 1,
      interval: 0
    });

    console.log('[generate-voice] 执行状态:', executionStatus);

    // 根据状态返回结果
    const statusData = executionStatus as { status?: string; finished?: boolean };
    if (statusData.status === 'completed') {
      console.log('[generate-voice] 执行完成，获取音频资源...');

      try {
        // 通过 get-resource webhook 获取资源
        const resourceUrl = `${process.env.N8N_API_BASE_URL || 'http://117.50.218.161:5678'}/webhook/get-resource?execution_id=${executionId}`;
        console.log('[generate-voice] 获取音频资源:', resourceUrl);

        const resourceResponse = await fetch(resourceUrl, {
          method: 'GET',
          headers: {
            'X-N8N-API-KEY': process.env.N8N_API_KEY || ''
          }
        });

        const resourceData = await resourceResponse.json();
        console.log('[generate-voice] 音频资源数据:', resourceData);

        const audioUrl = resourceData?.url || resourceData?.audio_url || resourceData?.output?.url || resourceData?.data;

        return NextResponse.json({
          success: true,
          status: 'completed',
          url: audioUrl,
          filename: resourceData?.filename
        }, { headers: corsHeaders() });

      } catch (error) {
        console.error('[generate-voice] 获取音频资源失败:', error);
        return NextResponse.json({
          success: false,
          status: 'error',
          error: '获取音频资源失败'
        }, { headers: corsHeaders() });
      }

    } else if (statusData.status === 'error') {
      return NextResponse.json({
        success: false,
        status: 'error',
        error: '任务执行失败'
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
