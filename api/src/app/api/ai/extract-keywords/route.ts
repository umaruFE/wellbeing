import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { n8nClient } from '@/lib/n8n/client';

/**
 * N8N 关键词提取路由
 * 
 * 改造说明：
 * - 原来直接调用 DashScope API（提示词在代码中）
 * - 现改为调用 N8N Workflow（ai-prompt-processing）
 * - 提示词由 N8N Workflow 从 Variables 中获取
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
 * POST /api/ai/extract-keywords
 * 
 * 提取场景关键词和角色动作描述
 * 通过 N8N Workflow 调用
 * 
 * @param request.body
 * @param prompt - 场景描述
 * @param selectedRoles - 选中的角色数组
 * 
 * @returns
 * @success - 是否成功
 * @background - 背景描述
 * @roles - 角色动作描述 { poppy: "...", edi: "..." }
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
    const { prompt, selectedRoles } = body;

    // 3. 参数验证
    if (!prompt || !selectedRoles || selectedRoles.length === 0) {
      return NextResponse.json(
        { error: '缺少必要参数: prompt 或 selectedRoles' },
        { status: 400, headers: corsHeaders() }
      );
    }

    console.log('[extract-keywords] 调用 N8N Workflow:', {
      workflow: 'ai-prompt-processing',
      taskType: 'keyword-extract',
      promptLength: prompt.length,
      roleCount: selectedRoles.length
    });

    // 4. 调用 N8N Workflow
    // 需要的参数：prompt（场景描述）、task_type（任务类型：extract-keywords）、selectedRoles（角色列表）
    const result = await n8nClient.call('ai-prompt-optimize', {
      task_type: 'extract-keywords',
      prompt,
      selectedRoles
    });

    console.log('[extract-keywords] N8N 响应:', result);

    // 5. 返回结果
    const resultData = result as { data?: object };
    return NextResponse.json({
      success: true,
      data: resultData.data || result
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('[extract-keywords] 提取失败:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '提取关键词失败',
        details: error instanceof Error ? error.stack : null
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
