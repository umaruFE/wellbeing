import { NextRequest, NextResponse } from 'next/server';

const AI_API_BASE_URL = 'http://117.50.218.161:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

async function queryExecutionStatus(executionId: string): Promise<any> {
  try {
    console.log(`查询执行状态: ${executionId}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${AI_API_BASE_URL}/api/v1/executions/${executionId}?includeData=true`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('查询执行状态失败:', errorText);
      throw new Error(`查询执行状态失败: ${errorText}`);
    }

    const data = await response.json();
    console.log('执行状态查询成功:', data.status, 'finished:', data.finished);
    return data;
  } catch (error: any) {
    console.error('查询执行状态失败:', error);
    if (error.name === 'AbortError') {
      throw new Error('查询执行状态超时');
    }
    throw error;
  }
}

async function getVideoData(executionId: string): Promise<any> {
  try {
    console.log('获取视频数据:', executionId);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${AI_API_BASE_URL}/webhook/get-resource?execution_id=${executionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('获取视频数据失败:', errorText);
      throw new Error(`获取视频数据失败: ${errorText}`);
    }

    const responseText = await response.text();
    if (!responseText.trim()) return null;
    const data = JSON.parse(responseText);
    console.log('获取视频数据成功:', data);
    return data;
  } catch (error: any) {
    console.error('获取视频数据失败:', error);
    if (error.name === 'AbortError') {
      throw new Error('获取视频数据超时');
    }
    throw error;
  }
}

function findVideoUrl(value: unknown, depth = 0): string {
  if (depth > 14 || value == null) return '';
  if (typeof value === 'string') {
    return /^https?:\/\/[^\s"']+\.(?:mp4|mov|webm)(?:\?[^\s"']*)?$/i.test(value.trim())
      ? value.trim()
      : '';
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = findVideoUrl(item, depth + 1);
      if (url) return url;
    }
    return '';
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const preferredKeys = ['video_url', 'videoUrl', 'url', 'response', 'data', 'outputUrl', 'output_url'];
    for (const key of preferredKeys) {
      if (!(key in record)) continue;
      const url = findVideoUrl(record[key], depth + 1);
      if (url) return url;
    }
    for (const item of Object.values(record)) {
      const url = findVideoUrl(item, depth + 1);
      if (url) return url;
    }
  }
  return '';
}

function completedResponse(executionId: string, videoUrl: string, videoData?: unknown) {
  return NextResponse.json({
    success: true,
    data: {
      executionId,
      status: 'completed',
      videoData: videoData || { url: videoUrl, video_url: videoUrl },
    },
  }, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('executionId');

    if (!executionId) {
      return NextResponse.json(
        { error: '缺少executionId参数' },
        { status: 400 }
      );
    }

    console.log('查询视频生成状态:', executionId);
    
    // 先查询执行状态
    const executionStatus = await queryExecutionStatus(executionId);
    
    const statusData = executionStatus as { status?: string; finished?: boolean; error?: string };
    console.log('执行状态:', statusData.status, '是否完成:', statusData.finished);
    
    if (statusData.status === 'success' && statusData.finished) {
      console.log('执行完成，获取视频数据...');

      // A completed n8n execution already contains the final `Insert row`
      // response. Prefer it so a delayed get-resource webhook cannot keep the
      // UI polling forever.
      const executionVideoUrl = findVideoUrl(executionStatus);
      if (executionVideoUrl) {
        return completedResponse(executionId, executionVideoUrl);
      }
      
      try {
        const videoData = await getVideoData(executionId);
        const normalizedVideoData = videoData?.data || videoData;
        const resourceVideoUrl = findVideoUrl(normalizedVideoData);
        if (resourceVideoUrl) {
          console.log('获取视频数据成功，返回给前端');
          return completedResponse(executionId, resourceVideoUrl, normalizedVideoData);
        }

        const stoppedAt = Date.parse(String((executionStatus as any).stoppedAt || ''));
        const isWithinSyncGracePeriod = Number.isFinite(stoppedAt) && Date.now() - stoppedAt < 60_000;
        if (isWithinSyncGracePeriod) {
          return NextResponse.json({
            success: true,
            message: '视频数据正在同步，请继续轮询',
            data: { executionId, status: 'processing' },
          }, { headers: { 'Access-Control-Allow-Origin': '*' } });
        }

        return NextResponse.json({
          success: false,
          error: 'n8n 执行已结束，但没有返回视频文件',
          data: { executionId, status: 'failed' },
        }, { headers: { 'Access-Control-Allow-Origin': '*' } });
      } catch (error) {
        console.warn('执行已完成，但读取视频数据失败:', error);
        return NextResponse.json({
          success: false,
          error: error instanceof Error ? error.message : '读取视频结果失败',
          data: { executionId, status: 'failed' },
        }, {
          headers: { 'Access-Control-Allow-Origin': '*' }
        });
      }
    } else if (statusData.status === 'error' || statusData.status === 'failed') {
      console.error('执行失败，详细状态:', JSON.stringify(executionStatus, null, 2));
      return NextResponse.json({
        success: false,
        error: '执行失败',
        details: statusData.error || 'N8N工作流执行失败',
        executionStatus: executionStatus,
        data: {
          executionId: executionId,
          status: 'failed'
        }
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        data: {
          executionId: executionId,
          status: 'processing'
        }
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } catch (error) {
    console.error('查询视频状态失败:', error);
    return NextResponse.json(
      { 
        error: '查询视频状态失败', 
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
