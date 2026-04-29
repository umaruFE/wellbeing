import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';

/**
 * N8N 资源获取路由
 * 
 * 前端通过 /api/ai/get-resource?executionId=xxx 调用
 * 用于查询任务状态并获取资源
 */

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

/**
 * GET /api/ai/get-resource?executionId=xxx
 * 
 * 查询任务状态，如果完成则获取资源
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

    console.log('[get-resource] 查询资源:', executionId);

    // 先查询执行状态
    const executionStatus = await n8nClient.pollExecution(executionId, {
      maxAttempts: 1,
      interval: 0
    });

    console.log('[get-resource] 执行状态:', executionStatus);

    const statusData = executionStatus as { status?: string; data?: any };

    if (statusData.status === 'completed') {
      console.log('[get-resource] 执行完成，获取资源...');

      try {
        // 调用 get-resource webhook 获取资源
        const resourceData = await n8nClient.call('get-resource', { execution_id: executionId }, { method: 'GET' });
        console.log('[get-resource] 资源数据:', resourceData);

        return NextResponse.json({
          success: true,
          data: {
            executionId,
            status: 'completed',
            storyboardData: resourceData
          }
        }, { headers: corsHeaders() });

      } catch (error) {
        console.error('[get-resource] 获取资源失败:', error);
        return NextResponse.json({
          success: false,
          error: '获取资源失败',
          data: {
            executionId,
            status: 'failed'
          }
        }, { headers: corsHeaders() });
      }

    } else if (statusData.status === 'error') {
      return NextResponse.json({
        success: false,
        error: '执行失败',
        data: {
          executionId,
          status: 'failed'
        }
      }, { headers: corsHeaders() });

    } else {
      // pending
      return NextResponse.json({
        success: true,
        data: {
          executionId,
          status: 'processing'
        }
      }, { headers: corsHeaders() });
    }

  } catch (error) {
    console.error('[get-resource] 查询失败:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '查询失败',
        details: error instanceof Error ? error.stack : null
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
