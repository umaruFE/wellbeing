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

    const data = await response.json();
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
    
    console.log('执行状态:', executionStatus.status, '是否完成:', executionStatus.finished);
    
    if (executionStatus.status === 'success' && executionStatus.finished) {
      console.log('执行完成，获取视频数据...');
      
      try {
        const videoData = await getVideoData(executionId);
        
        console.log('获取视频数据成功，返回给前端');
        
        return NextResponse.json({
          success: true,
          data: {
            executionId: executionId,
            status: 'completed',
            videoData: videoData.data || videoData
          }
        }, {
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (error) {
        console.error('获取视频数据失败:', error);
        return NextResponse.json({
          success: false,
          error: '获取视频数据失败',
          data: {
            executionId: executionId,
            status: 'failed'
          }
        }, {
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    } else if (executionStatus.status === 'error' || executionStatus.status === 'failed') {
      console.error('执行失败，详细状态:', JSON.stringify(executionStatus, null, 2));
      return NextResponse.json({
        success: false,
        error: '执行失败',
        details: executionStatus.error || 'N8N工作流执行失败',
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
