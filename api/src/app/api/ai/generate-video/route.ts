import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';

/**
 * N8N 视频生成路由
 * 
 * 改造说明：
 * - 已通过 N8N 调用（/webhook/gene-video）
 * - 现改为使用统一的 n8nClient 调用
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
 * POST /api/ai/generate-video
 * 
 * 生成视频，通过 N8N Workflow 调用
 * 
 * @param request.body
 * @param storyboard_images_filepath - 分镜图片路径数组
 * @param storyboard_prompts - 分镜提示词数组
 * @param video_width - 视频宽度
 * @param video_height - 视频高度
 * @param voice - 配音参数
 * @param storyboard_image_prompts - 分镜图片提示词数组
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
      storyboard_images_filepath,
      storyboard_prompts,
      video_width,
      video_height,
      voice,
      storyboard_image_prompts
    } = body;

    console.log('[generate-video] 收到生成视频请求:', {
      imageCount: storyboard_images_filepath?.length,
      promptCount: storyboard_prompts?.length,
      videoWidth: video_width,
      videoHeight: video_height,
      hasVoice: !!voice
    });

    // 参数验证
    if (!storyboard_images_filepath || !storyboard_prompts) {
      return NextResponse.json(
        { error: '缺少必要参数: storyboard_images_filepath 或 storyboard_prompts' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // 清理URL，去除空格
    const cleanStoryboardImages = storyboard_images_filepath.map((path: string) => path.trim());

    // 准备 N8N 调用参数
    const n8nPayload = {
      storyboard_images_filepath: cleanStoryboardImages,
      storyboard_prompts,
      video_width: video_width || 856,
      video_height: video_height || 480,
      voice,
      storyboard_image_prompts,
      timestamp: Date.now()
    };

    console.log('[generate-video] 调用 N8N Workflow:', {
      workflow: 'ai-video-generation',
      imageCount: cleanStoryboardImages.length
    });

    // 调用 N8N Workflow
    const result = await n8nClient.call('gene-video', n8nPayload);

    console.log('[generate-video] N8N 响应:', result);

    const resultData = result as { executionId?: string; id?: string; status?: string; message?: string };
    return NextResponse.json({
      success: true,
      data: {
        executionId: resultData.executionId || resultData.id,
        status: resultData.status || 'submitted',
        message: resultData.message || '视频生成任务已提交'
      }
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('[generate-video] 生成失败:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '生成失败',
        details: error instanceof Error ? error.stack : null
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
