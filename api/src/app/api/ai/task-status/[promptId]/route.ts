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
 * 直接查询 ComfyUI 历史记录
 */
async function queryComfyUIHistory(promptId: string, apiUrl?: string) {
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

    // 检查执行状态
    const status = data.status?.exec_node;
    if (status === 'success' || status === 'completed') {
      // 提取输出图片
      const outputs = data.outputs || {};
      for (const nodeId of Object.keys(outputs)) {
        const nodeOutput = outputs[nodeId];
        if (nodeOutput?.images) {
          const images = nodeOutput.images;
          return {
            status: 'completed',
            url: `${baseUrl}/view?filename=${images[0].filename}&subfolder=${images[0].subfolder || ''}&type=${images[0].type || 'output'}`,
            filename: images[0].filename
          };
        }
      }
      return { status: 'completed' };
    } else if (status === 'error') {
      return { status: 'error', error: data.status?.error || '执行失败' };
    }

    return { status: 'pending' };

  } catch (error) {
    console.error('[task-status] ComfyUI 查询失败:', error);
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
      console.log('[task-status] 直接查询 ComfyUI:', { promptId, apiUrl });

      const result = await queryComfyUIHistory(promptId, apiUrl || undefined);
      console.log('[task-status] ComfyUI 结果:', result);

      return NextResponse.json(result);
    }

    // 默认：通过 N8N Workflow 查询
    console.log('[task-status] 调用 N8N Workflow:', {
      workflow: 'ai-task-status',
      executionId: promptId,
      workflowType
    });

    const result = await n8nClient.call('ai-task-status', {
      executionId: promptId,
      workflowType
    });

    console.log('[task-status] N8N 响应:', result);

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
