import { NextRequest, NextResponse } from 'next/server';

const AI_API_BASE_URL = 'http://117.50.218.161:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

async function queryExecutionStatus(executionId: string): Promise<any> {
  try {
    const response = await fetch(`${AI_API_BASE_URL}/api/v1/executions/${executionId}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('查询执行状态失败:', errorText);
      throw new Error(`查询执行状态失败: ${errorText}`);
    }

    const data = await response.json();
    console.log('执行状态:', data);
    return data;
  } catch (error: any) {
    console.error('查询执行状态失败:', error);
    throw error;
  }
}

async function getImageData(executionId: string): Promise<any> {
  try {
    console.log('获取重新生成的图片:', executionId);
    
    const response = await fetch(`${AI_API_BASE_URL}/webhook/get-resource?execution_id=${executionId}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('获取图片失败:', errorText);
      throw new Error(`获取图片失败: ${errorText}`);
    }

    const result = await response.json();
    console.log('获取图片成功:', result);
    return result;
  } catch (error: any) {
    console.error('获取图片失败:', error);
    throw error;
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
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

    console.log('查询重新生成图片状态:', executionId);
    
    // 先查询执行状态
    const statusData = await queryExecutionStatus(executionId);
    
    // 检查是否完成
    if (statusData.status === 'success' && statusData.finished) {
      console.log('执行完成，获取图片数据...');
      
      // 获取图片数据
      const imageData = await getImageData(executionId);
      
      return NextResponse.json({
        success: true,
        data: {
          status: 'completed',
          storyboardData: imageData
        }
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else if (statusData.status === 'error' || statusData.status === 'failed') {
      return NextResponse.json({
        success: false,
        error: '执行失败',
        data: {
          status: 'failed'
        }
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else {
      // 还在执行中
      return NextResponse.json({
        success: true,
        data: {
          status: 'running'
        }
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  } catch (error: any) {
    console.error('查询重新生成图片状态失败:', error);
    return NextResponse.json(
      { error: '查询失败', details: error.message },
      { status: 500 }
    );
  }
}
