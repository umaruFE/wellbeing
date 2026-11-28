import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { n8nClient } from '@/lib/n8n/client';
import { audioFiles, mediaSubmissionFailure } from '@/lib/n8n/media';

/**
 * N8N 音乐生成路由
 * 
 * 改造说明：
 * - 原来直接调用 ComfyUI
 * - 现改为调用 N8N Workflow（ai-audio-generation）
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
 * POST /api/ai/generate-audio
 * 
 * 生成音乐
 * 通过 N8N Workflow 调用
 * 
 * @param request.body
 * @param prompt - 提示词（支持中文，会在 N8N 中翻译）
 * @param count - 生成数量
 * @param o3ics - 音乐参数
 * @param duration - 时长（秒）
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
      storyboard_prompts,
      count = 1,
      o3ics,
      duration = 30,
      workflow = 'gene-music',
      user_id,
      organization_id
    } = body;

    console.log('[generate-music] 收到生成音乐请求:', {
      promptLength: prompt?.length,
      storyboardCount: storyboard_prompts?.length,
      count,
      duration,
      workflow
    });

    // 参数验证
    if (!prompt && !storyboard_prompts) {
      return NextResponse.json(
        { error: '缺少必要参数: prompt 或 storyboard_prompts' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // 准备 N8N 调用参数
    const n8nPayload = {
      prompt: prompt || storyboard_prompts,
      count,
      o3ics,
      duration,
      user_id,
      organization_id,
      timestamp: Date.now()
    };

    console.log('[generate-music] 调用 N8N Workflow:', {
      workflow,
      promptLength: (prompt || storyboard_prompts)?.length
    });

    // 调用 N8N Workflow
    const submitted = await n8nClient.submitMedia(workflow, n8nPayload);

    const { executionId } = submitted;

    // 保存到数据库
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validUserId = (user_id && uuidRegex.test(user_id)) ? user_id : null;
      const validOrganizationId = (organization_id && uuidRegex.test(organization_id)) ? organization_id : null;

      await db.from('prompt_history').insert({
        user_id: validUserId,
        organization_id: validOrganizationId,
        prompt_type: 'audio_generation',
        original_prompt: prompt,
        generated_result: null,
        model_name: 'heartmula-audio',
        execution_time: null,
        success: true,
        error_message: null,
        prompt_id: executionId
      });

      console.log('[generate-music] 已保存 executionId 到数据库:', executionId);
    } catch (dbError) {
      console.error('[generate-music] 保存到数据库失败:', dbError);
    }

    // 返回结果
    return NextResponse.json({
      success: true,
      executionId,
      workflowType: 'music',
      workflow: 'gene-music'
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('[generate-music] 生成失败:', error);

    return mediaSubmissionFailure(error, '音乐生成失败，请重试。', corsHeaders());
  }
}

/**
 * GET /api/ai/generate-audio
 * 
 * 查询音频生成状态
 * 
 * @param query.executionId - 执行ID
 * 
 * @returns
 * @success - 是否成功
 * @status - completed|pending|error
 * @results - 音频结果数组（完成时）
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

    console.log('[generate-music] 查询执行状态:', executionId);

    // 调用 N8N API 查询执行状态
    const executionStatus = await n8nClient.pollExecution(executionId, {
      maxAttempts: 1,
      interval: 0
    });

    console.log('[generate-music] 执行状态:', executionStatus.status);

    // 根据状态返回结果
    const statusData = executionStatus as { error?: string; status?: string };
    if (statusData.status === 'completed') {
      console.log('[generate-music] 执行完成，获取音乐资源...');

      try {
        // 通过 N8N get-resource workflow 获取资源
        const resourceData = await n8nClient.call('get-resource', { execution_id: executionId }, { method: 'GET' });
        console.log('[generate-music] 音频资源数据:', resourceData);

        const results = audioFiles(resourceData);
        if (!results.length) throw new Error('音乐工作流未返回音频文件');

        return NextResponse.json({
          success: true,
          status: 'completed',
          results: results.map((file, index) => ({
            url: file.url,
            filename: file.filename || `audio_${index + 1}.mp3`
          }))
        }, { headers: corsHeaders() });

      } catch (error) {
        console.error('[generate-music] 获取音频资源失败:', error);
        return NextResponse.json({
          success: false,
          status: 'error',
          error: '未能取得生成的背景音乐，请稍后重试。'
        }, { headers: corsHeaders() });
      }

    } else if (statusData.status === 'error') {
      return NextResponse.json({
        success: false,
        status: 'error',
        error: statusData.error || '任务执行失败'
      }, { headers: corsHeaders() });
    } else {
      return NextResponse.json({
        success: true,
        status: 'pending'
      }, { headers: corsHeaders() });
    }

  } catch (error) {
    console.error('[generate-music] 查询失败:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '查询失败'
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
