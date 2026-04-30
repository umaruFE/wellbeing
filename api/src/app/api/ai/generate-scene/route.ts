import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { n8nClient } from '@/lib/n8n/client';

/**
 * 场景生成路由 - 并行生成背景和角色图
 * 
 * 工作流程：
 * 1. 接收提示词数据（背景 + 角色）
 * 2. 并行调用 N8N 的 ai-image-generation Webhook
 * 3. N8N 内部调用 ComfyUI 生成图片
 * 4. 返回所有任务 ID，供前端轮询 ComfyUI 获取结果
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
 * POST /api/ai/generate-scene
 * 
 * 并行生成背景图和角色图
 * 
 * @param request.body
 * @param backgroundPrompt - 背景提示词
 * @param backgroundWidth - 背景图宽度
 * @param backgroundHeight - 背景图高度
 * @param roles - 角色数据 [{ name: "poppy", prompt: "提示词" }, ...]
 * 
 * @returns
 * @success - 是否成功
 * @tasks - 任务列表 [{ type, name, promptId, apiUrl }]
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

    // 2. 解析请求参数
    const body = await request.json();
    const {
      backgroundPrompt,
      backgroundWidth = 1920,
      backgroundHeight = 1080,
      roles = [],
      user_id,
      organization_id
    } = body;

    // 3. 参数验证
    if (!backgroundPrompt) {
      return NextResponse.json(
        { error: '缺少必要参数: backgroundPrompt' },
        { status: 400, headers: corsHeaders() }
      );
    }

    console.log('[generate-scene] 开始生成:', {
      backgroundPrompt: backgroundPrompt.substring(0, 50) + '...',
      roleCount: roles.length,
      backgroundWidth,
      backgroundHeight
    });

    // ComfyUI URL 映射（与 N8N workflow 保持一致）
    const COMFYUI_URLS: Record<string, string> = {
      poppy: 'https://vcbj5meqyp1y7ifw-8188.container.x-gpu.com',
      edi: 'https://vcbj5meqyp1y7ifw-8188.container.x-gpu.com',
      rolly: 'https://vcbj5meqyp1y7ifw-8188.container.x-gpu.com',
      milo: 'https://vcbj5meqyp1y7ifw-8188.container.x-gpu.com',
      ace: 'https://vcbj5meqyp1y7ifw-8188.container.x-gpu.com',
      bg: 'https://vcbj5meqyp1y7ifw-8188.container.x-gpu.com'
    };

    // 4. 准备 N8N 任务
    const tasks = [];

    // 背景图任务
    tasks.push({
      type: 'background',
      name: null,
      comfyuiUrl: COMFYUI_URLS.bg,
      payload: {
        name: 'bg',  // 背景用 bg 作为 name
        prompt: backgroundPrompt,
        negative_prompt: 'blurry, low quality, deformed, ugly, bad anatomy, disfigured, poorly drawn face, mutation, extra limb, poorly drawn hands, missing limb, floating limbs, disconnected limbs, malformed hands, blur, out of focus, long neck, long body',
        width: backgroundWidth,
        height: backgroundHeight
      }
    });

    // 角色图任务
    for (const role of roles) {
      const roleName = (role.name || '').toLowerCase();
      tasks.push({
        type: 'character',
        name: role.name,
        comfyuiUrl: COMFYUI_URLS[roleName] || COMFYUI_URLS.bg,
        payload: {
          name: role.name,  // 传递角色名称给 N8N Workflow
          prompt: role.prompt,
          negative_prompt: 'blurry, low quality, deformed, ugly, bad anatomy, disfigured, poorly drawn face, mutation, extra limb, poorly drawn hands, missing limb, floating limbs, disconnected limbs, malformed hands, blur, out of focus, long neck, long body',
          width: 1024,
          height: 1024
        }
      });
    }

    // 5. 并行调用 N8N
    console.log('[generate-scene] 并行调用 N8N，任务数:', tasks.length);

    const taskResults = await Promise.all(
      tasks.map(async (task) => {
        try {
          console.log(`[generate-scene] 调用 ${task.type}: ${task.name || 'N/A'}`);

          // 使用 n8nClient 调用 ai-image-generation Workflow
          const result = await n8nClient.call('ai-image-generation', task.payload);
          console.log(`[generate-scene] ${task.type}:${task.name} 返回:`, result);

          // 从 N8N 结果中提取 executionId 和 comfyuiUrl（实际是 ComfyUI 的 prompt_id 和地址）
          const resultData = result as { executionId?: string; prompt_id?: string; id?: string; comfyuiUrl?: string };
          const promptId = resultData.executionId || resultData.prompt_id || resultData.id;
          const comfyUrl = resultData.comfyuiUrl || task.comfyuiUrl || 'https://vcbj5meqyp1y7ifw-8188.container.x-gpu.com';
          const historyUrl = `${comfyUrl}/history/${promptId}`;

          return {
            type: task.type,
            name: task.name,
            success: true,
            promptId,
            apiUrl: historyUrl,
            raw: result
          };

        } catch (error) {
          console.error(`[generate-scene] 调用失败: ${task.type}:${task.name}`, error);
          return {
            type: task.type,
            name: task.name,
            success: false,
            error: error instanceof Error ? error.message : '未知错误'
          };
        }
      })
    );

    // 6. 分析结果
    const successTasks = taskResults.filter(t => t.success);
    const failedTasks = taskResults.filter(t => !t.success);

    console.log('[generate-scene] 生成结果:', {
      success: successTasks.length,
      failed: failedTasks.length,
      tasks: successTasks.map(t => ({ type: t.type, name: t.name, promptId: t.promptId }))
    });

    // 7. 返回结果
    return NextResponse.json({
      success: true,
      totalTasks: tasks.length,
      successCount: successTasks.length,
      failedCount: failedTasks.length,
      tasks: successTasks.map(t => ({
        type: t.type,
        name: t.name,
        promptId: t.promptId,
        apiUrl: t.apiUrl
      })),
      errors: failedTasks.length > 0 ? failedTasks : undefined
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('[generate-scene] 生成失败:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '生成失败',
        details: error instanceof Error ? error.stack : null
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
