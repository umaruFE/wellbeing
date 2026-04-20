import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { n8nClient } from '@/lib/n8n/client';

/**
 * N8N 分镜图生成路由
 * 
 * 改造说明：
 * - 已通过 N8N 调用（/webhook/gene-images）
 * - 现改为使用统一的 n8nClient 调用
 * - 提示词优化由 N8N Workflow 内部处理
 */

const AI_API_BASE_URL = process.env.N8N_API_BASE_URL || 'http://117.50.218.161:5678';

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
 * POST /api/ai/generate-storyboard
 * 
 * 生成分镜图，通过 N8N Workflow 调用
 * 
 * @param request.body
 * @param role - IP角色ID (poppy|edi|rolly|milo|ace)
 * @param videoRatio - 视频比例 (默认 16:9)
 * @param story - 故事内容
 * @param videoWidth - 视频宽度
 * @param videoHeight - 视频高度
 * 
 * @returns
 * @success - 是否成功
 * @executionId - 执行ID
 * @status - 状态
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, videoRatio, story, videoWidth, videoHeight } = body;

    console.log('[generate-storyboard] 收到生成分镜请求:', {
      role,
      videoRatio,
      story: story?.substring(0, 50) + '...',
      videoWidth,
      videoHeight
    });

    // 参数验证
    if (!role || !story) {
      return NextResponse.json(
        { error: '缺少必要参数: role 或 story' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // IP角色图片映射
    const ipImageMap: Record<string, string> = {
      poppy: 'poppy.png',
      edi: 'edi.png',
      rolly: 'rolly.png',
      milo: 'milo.png',
      ace: 'ace.png'
    };

    const imageName = ipImageMap[role];
    if (!imageName) {
      return NextResponse.json(
        { error: '无效的IP角色ID' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const imagePath = path.join(process.cwd(), 'public', 'ip', imageName);

    if (!fs.existsSync(imagePath)) {
      return NextResponse.json(
        { error: 'IP角色图片不存在', path: imagePath },
        { status: 404, headers: corsHeaders() }
      );
    }

    // 读取图片并转为 base64
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');
    const imageMimeType = 'image/png';

    // 构建 N8N 调用参数（JSON 格式）
    const n8nPayload = {
      role,
      video_ratio: videoRatio || '16:9',
      story,
      video_width: videoWidth || 1920,
      video_height: videoHeight || 1080,
      image_base64: imageBase64,
      image_mime_type: imageMimeType,
      image_name: imageName,
      timestamp: Date.now()
    };

    console.log('[generate-storyboard] 调用 N8N Workflow:', {
      workflow: 'ai-storyboard-generation',
      role,
      videoRatio: videoRatio || '16:9',
      storyLength: story.length,
      imageSize: imageBuffer.length
    });

    // 调用 N8N Workflow（使用 JSON 格式，图片转为 base64）
    const result = await n8nClient.call('gene-images', n8nPayload);

    console.log('[generate-storyboard] N8N 响应:', result);

    // 提取 executionId
    const executionId = result.executionId || result.id;

    if (executionId) {
      return NextResponse.json({
        success: true,
        data: {
          executionId,
          status: 'processing'
        }
      }, { headers: corsHeaders() });
    } else {
      throw new Error('Workflow调用失败：未返回executionId');
    }

  } catch (error) {
    console.error('[generate-storyboard] 分镜生成失败:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '分镜生成失败',
        details: error instanceof Error ? error.stack : null,
        suggestion: '服务器可能正在启动中，请稍后重试'
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}

/**
 * GET /api/ai/generate-storyboard
 * 
 * 查询分镜生成状态
 * 
 * @param query.executionId - 执行ID
 * 
 * @returns
 * @success - 是否成功
 * @executionId - 执行ID
 * @status - completed|processing|failed
 * @storyboardData - 分镜数据（完成时）
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

    console.log('[generate-storyboard] 查询执行状态:', executionId);

    // 调用 N8N 查询执行状态
    const executionStatus = await n8nClient.pollExecution(executionId, {
      maxAttempts: 1,
      interval: 0
    });

    console.log('[generate-storyboard] 执行状态:', executionStatus);

    if (executionStatus.status === 'completed') {
      console.log('[generate-storyboard] 执行完成，获取分镜图片数据...');

      try {
        // 获取分镜数据
        const response = await fetch(`${AI_API_BASE_URL}/webhook/get-images?execution_id=${executionId}`, {
          method: 'GET'
        });

        if (!response.ok) {
          throw new Error(`获取分镜图片数据失败: ${response.status}`);
        }

        const storyboardData = await response.json();

        return NextResponse.json({
          success: true,
          data: {
            executionId: executionId,
            status: 'completed',
            storyboardData: storyboardData.data
          }
        }, { headers: corsHeaders() });

      } catch (error) {
        console.error('[generate-storyboard] 获取分镜数据失败:', error);
        return NextResponse.json({
          success: false,
          error: '获取分镜图片数据失败',
          data: {
            executionId: executionId,
            status: 'failed'
          }
        }, { headers: corsHeaders() });
      }

    } else if (executionStatus.status === 'error') {
      return NextResponse.json({
        success: false,
        error: '执行失败',
        data: {
          executionId: executionId,
          status: 'failed'
        }
      }, { headers: corsHeaders() });

    } else {
      return NextResponse.json({
        success: true,
        data: {
          executionId: executionId,
          status: 'processing'
        }
      }, { headers: corsHeaders() });
    }

  } catch (error) {
    console.error('[generate-storyboard] 查询执行状态失败:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '查询执行状态失败',
        details: error instanceof Error ? error.stack : null
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
