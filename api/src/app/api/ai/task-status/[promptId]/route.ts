import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';
import { mediaFailureMessage } from '@/lib/n8n/media';
import { uploadFile } from '@/lib/fileUpload';
import { persistComfyImagesInValue } from '@/lib/persistRemoteImage';
import { comfyuiAuthHeaders } from '@/lib/comfyuiAuth';

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

/**
 * 从 GPU 临时地址下载图片并上传到当前持久存储，带超时和重试
 */
async function downloadAndPersistImage(imageUrl: string, folder: string, maxRetries = 2): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 下载图片，设置30秒超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...comfyuiAuthHeaders(imageUrl),
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
      
      const persistedUrl = await uploadFile(buffer, folder, filename);
      console.log('[task-status] 图片持久化成功:', persistedUrl);
      return persistedUrl;
    } catch (error) {
      console.error(`[task-status] 图片持久化失败(尝试${attempt + 1}/${maxRetries + 1}):`, error instanceof Error ? error.message : String(error));
      if (attempt < maxRetries) {
        console.log(`[task-status] 等待 ${attempt + 1} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
      } else {
        throw error;
      }
    }
  }
  throw new Error('图片持久化重试次数耗尽');
}

/**
 * 直接查询 ComfyUI 历史记录，并将图片上传到当前环境的持久存储
 */
async function queryComfyUIHistory(promptId: string, apiUrl: string, shouldPersist: boolean = true) {
  const baseUrl = apiUrl.replace(/\/history\/.*$/, '');
  const historyUrl = `${baseUrl}/history/${promptId}`;

  try {
    // n8n owns the GPU credentials when this API has no local token.
    let authHeaders: Record<string, string> = {};
    try {
      authHeaders = comfyuiAuthHeaders(historyUrl);
    } catch {
      // The workflow can still check this task if the direct request fails.
    }
    const response = await fetch(historyUrl, { headers: authHeaders, signal: AbortSignal.timeout(6000) });
    if (!response.ok) return null;

    const history = await response.json();
    const data = history[promptId];
    if (!data) {
      return { status: 'pending' };
    }

    // ComfyUI 返回的状态字段：status.status_str (success/pending/error) 和 status.completed (true/false)
    const execStatus = data.status?.status_str || data.status?.exec_node;
    const isCompleted = data.status?.completed === true;
    
    if (execStatus === 'error' || execStatus === 'failed') {
      return { status: 'error', error: '图片生成失败，请重试。' };
    }
    if (execStatus === 'success' || isCompleted) {
      // 提取输出图片
      const outputs = data.outputs || {};
      for (const nodeId of Object.keys(outputs)) {
        const nodeOutput = outputs[nodeId];
        if (nodeOutput?.images?.length) {
          const images = nodeOutput.images;
          const comfyUrl = `${baseUrl}/view?filename=${images[0].filename}&subfolder=${images[0].subfolder || ''}&type=${images[0].type || 'output'}`;
          
          if (shouldPersist) {
            try {
              const persistedUrl = await downloadAndPersistImage(comfyUrl, 'ai-generated-images');
              return {
                status: 'completed',
                url: persistedUrl,
                filename: images[0].filename
              };
            } catch (uploadError) {
              console.error('[task-status] 图片持久化失败，拒绝返回临时图片地址');
              return {
                status: 'error',
                error: uploadError instanceof Error ? uploadError.message : 'Image persistence failed'
              };
            }
          }
          
          const proxyUrl = `/api/ai/proxy-image?mode=stream&url=${encodeURIComponent(comfyUrl)}`;
          
          return { status: 'completed', url: proxyUrl, filename: images[0].filename };
        }
      }
      return { status: 'error', error: '任务已结束，未取得生成的图片。' };
    }

    return { status: 'pending' };

  } catch (error) {
    console.warn('[task-status] 转由 n8n 查询图片任务:', (error as Error).message);
    return null;
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
    const apiUrl = searchParams.get('apiUrl') || process.env.COMFYUI_URL;

    if (!promptId) {
      return NextResponse.json(
        { error: '缺少 promptId' },
        { status: 400 }
      );
    }

    // Without an explicit GPU origin, let the active n8n workflow select its configured service.
    if (useComfyUI && apiUrl) {
      const result = await queryComfyUIHistory(promptId, apiUrl);
      if (result) return NextResponse.json(result);
    }

    // 默认：通过 N8N Workflow 查询
    const result = await n8nClient.call('ai-task-status', {
      executionId: promptId,
      workflowType
    });

    if (!result?.status) return NextResponse.json({ status: 'error', error: '暂时无法获取任务状态，请稍后重试。' });
    const resultData = result as { status?: string; filename?: string; url?: string; error?: string };
    if (resultData.status === 'completed') {
      if (!resultData.url) return NextResponse.json({ status: 'error', error: '任务已结束，未取得生成的文件。' });
      let url = resultData.url;
      if (workflowType === 'image') {
        // Direct requests can fall back to an authenticated n8n view URL. Save that image before returning it.
        const savedUrl = useComfyUI
          ? await downloadAndPersistImage(url, 'ai-generated-images')
          : (await persistComfyImagesInValue(resultData, 'ai-generated-images')).url;
        if (!savedUrl) return NextResponse.json({ status: 'error', error: '图片保存失败，请重试。' });
        url = savedUrl;
      }
      return NextResponse.json({ status: 'completed', url, filename: resultData.filename });
    } else if (resultData.status === 'error' || resultData.status === 'failed') {
      return NextResponse.json({
        status: 'error',
        error: mediaFailureMessage(String(resultData.error || ''), '生成任务失败，请重试。')
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
        error: mediaFailureMessage(error instanceof Error ? error.message : '', '暂时无法获取生成结果，请稍后重试。')
      },
      { status: 500 }
    );
  }
}
