import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';

/**
 * N8N 任务状态查询路由
 * 
 * 改造说明：
 * - 原来直接查询 ComfyUI，现改为调用 N8N Workflow
 * - N8N Workflow 统一处理 ComfyUI/N8N 内部状态查询
 * - 同时支持直接查询 ComfyUI（用于 generate-scene 场景）
 */

// 禁用缓存以避免大文件下载时的警告
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// ComfyUI 地址配置
const COMFYUI_URL = process.env.COMFYUI_URL || 'http://117.50.218.161:8188';

/**
 * 从 URL 下载图片并上传到 OSS，带超时和重试
 */
async function downloadAndUploadToOSS(imageUrl: string, folder: string, maxRetries = 2): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 下载图片，设置30秒超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`下载图片失败: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get('content-type') || 'image/png';
      const filename = `image-${Date.now()}.png`;
      
      // 上传到 OSS
      const uploadUrl = new URL('/api/upload', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
      const formData = new FormData();
      const file = new File([buffer], filename, { type: contentType });
      formData.append('file', file);
      formData.append('folder', folder);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) {
        const data = await uploadResponse.json();
        throw new Error(data.error || '上传到OSS失败');
      }

      const data = await uploadResponse.json();
      console.log('[task-status] OSS上传成功:', data.url);
      return data.url;
    } catch (error) {
      console.error(`[task-status] OSS上传失败(尝试${attempt + 1}/${maxRetries + 1}):`, error instanceof Error ? error.message : String(error));
      if (attempt < maxRetries) {
        console.log(`[task-status] 等待 ${attempt + 1} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
      } else {
        throw error;
      }
    }
  }
  throw new Error('OSS上传重试次数耗尽');
}

/**
 * 直接查询 ComfyUI 历史记录，并将图片上传到 OSS
 */
async function queryComfyUIHistory(promptId: string, apiUrl?: string, uploadToOSS: boolean = true) {
  const baseUrl = apiUrl ? apiUrl.replace(/\/history\/.*$/, '') : COMFYUI_URL;
  const historyUrl = `${baseUrl}/history/${promptId}`;

  try {
    const response = await fetch(historyUrl);
    if (!response.ok) {
      return { status: 'pending' };
    }

    const history = await response.json();
    const data = history[promptId];
    if (!data) {
      return { status: 'pending' };
    }

    // ComfyUI 返回的状态字段：status.status_str (success/pending/error) 和 status.completed (true/false)
    const execStatus = data.status?.status_str || data.status?.exec_node;
    const isCompleted = data.status?.completed === true;
    
    if (execStatus === 'success' || isCompleted) {
      // 提取输出图片
      const outputs = data.outputs || {};
      for (const nodeId of Object.keys(outputs)) {
        const nodeOutput = outputs[nodeId];
        if (nodeOutput?.images) {
          const images = nodeOutput.images;
          const comfyUrl = `${baseUrl}/view?filename=${images[0].filename}&subfolder=${images[0].subfolder || ''}&type=${images[0].type || 'output'}`;
          
          // 如果需要上传到 OSS
          if (uploadToOSS) {
            try {
              const ossUrl = await downloadAndUploadToOSS(comfyUrl, 'ai-generated-images');
              return {
                status: 'completed',
                url: ossUrl,
                filename: images[0].filename
              };
            } catch (uploadError) {
              console.error('[task-status] OSS上传失败，使用原URL');
              return {
                status: 'completed',
                url: comfyUrl,
                filename: images[0].filename
              };
            }
          }
          
          return {
            status: 'completed',
            url: comfyUrl,
            filename: images[0].filename
          };
        }
      }
      return { status: 'completed' };
    } else if (execStatus === 'error' || execStatus === 'failed') {
      return { status: 'error', error: data.status?.error || data.status?.exception || '执行失败' };
    }

    return { status: 'pending' };

  } catch (error) {
    console.error('[task-status] ComfyUI查询失败:', error.message);
    return { status: 'pending' };
  }
}

/**
 * GET /api/ai/task-status/{promptId}
 * 
 * 查询任务状态，支持：
 * 1. 通过 N8N Workflow 查询
 * 2. 直接查询 ComfyUI（当 useComfyUI=true 时）
 * 
 * @param params.promptId - 任务ID
 * @param query.workflowType - 工作流类型: image|audio|video|voice
 * @param query.useComfyUI - 是否直接查询 ComfyUI: true|false
 * @param query.apiUrl - 自定义 ComfyUI API 地址（可选）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { promptId: string } }
) {
  try {
    const { promptId } = params;
    const { searchParams } = new URL(request.url);
    const workflowType = searchParams.get('workflowType') || 'image';
    const useComfyUI = searchParams.get('useComfyUI') === 'true';
    const apiUrl = searchParams.get('apiUrl');

    if (!promptId) {
      return NextResponse.json(
        { error: '缺少 promptId' },
        { status: 400 }
      );
    }

    // 如果指定直接查询 ComfyUI
    if (useComfyUI) {
      const result = await queryComfyUIHistory(promptId, apiUrl || undefined);
      if (result.status === 'completed') {
        console.log('[task-status] ComfyUI完成:', result.filename);
      }
      return NextResponse.json(result);
    }

    // 默认：通过 N8N Workflow 查询
    const result = await n8nClient.call('ai-task-status', {
      executionId: promptId,
      workflowType
    });

    if (result.status === 'completed') {
      console.log('[task-status] N8N完成:', result.filename);
    }

    // 根据状态返回结果
    if (result.status === 'completed') {
      return NextResponse.json({
        status: 'completed',
        url: result.url,
        filename: result.filename
      });
    } else if (result.status === 'error') {
      return NextResponse.json({
        status: 'error',
        error: result.error || '任务执行失败'
      });
    } else {
      return NextResponse.json({
        status: 'pending'
      });
    }

  } catch (error) {
    console.error('[task-status] 查询失败:', error);

    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : '查询失败'
      },
      { status: 500 }
    );
  }
}
