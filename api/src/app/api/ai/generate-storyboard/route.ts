import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

async function callWebhookWithRetry(formData: FormData, maxRetries = 3, delay = 5000): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`尝试调用webhook (第${attempt}次)...`);
      
      const response = await fetch(`${AI_API_BASE_URL}/webhook/gene-images`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Webhook调用失败 (第${attempt}次):`, errorText);
        
        if (errorText.includes('实例可能正在启动中') && attempt < maxRetries) {
          console.log(`等待${delay/1000}秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        throw new Error(errorText);
      }

      const result = await response.json();
      console.log('Webhook调用成功:', result);
      return result;
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`第${attempt}次失败，等待${delay/1000}秒后重试...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function getStoryboardImages(executionId: string): Promise<any> {
  try {
    console.log('获取分镜图片数据:', executionId);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
    const response = await fetch(`${AI_API_BASE_URL}/webhook/get-images?execution_id=${executionId}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('获取分镜图片数据失败:', errorText);
      throw new Error(`获取分镜图片数据失败: ${errorText}`);
    }

    const data = await response.json();
    console.log('获取分镜图片数据成功:', data);
    return data;
  } catch (error: any) {
    console.error('获取分镜图片数据失败:', error);
    if (error.name === 'AbortError') {
      throw new Error('获取分镜图片数据超时');
    }
    throw error;
  }
}

async function queryExecutionStatus(executionId: string): Promise<any> {
  try {
    console.log(`查询执行状态: ${executionId}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
    
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { role, videoRatio, story, videoWidth, videoHeight } = body;

    console.log('收到生成分镜请求:', { role, videoRatio, story, videoWidth, videoHeight });

    if (!role || !story) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

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
        { status: 400 }
      );
    }

    const imagePath = path.join(process.cwd(), 'public', 'ip', imageName);
    console.log('IP角色图片路径:', imagePath);
    
    if (!fs.existsSync(imagePath)) {
      return NextResponse.json(
        { error: 'IP角色图片不存在', path: imagePath },
        { status: 404 }
      );
    }

    const imageBuffer = fs.readFileSync(imagePath);
    console.log('读取图片成功，大小:', imageBuffer.length, 'bytes');
    
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    formData.append('image', blob, imageName);
    formData.append('role', role);
    formData.append('video_ratio', videoRatio || '16:9');
    formData.append('story', story);
    formData.append('video_width', String(videoWidth || 1920));
    formData.append('video_height', String(videoHeight || 1080));

    console.log('FormData构建完成:');
    console.log('- 图片文件名:', imageName);
    console.log('- 图片大小:', imageBuffer.length, 'bytes');
    console.log('- role:', role);
    console.log('- video_ratio:', videoRatio || '16:9');
    console.log('- story:', story);
    console.log('- video_width:', videoWidth || 1920);
    console.log('- video_height:', videoHeight || 1080);

    console.log('开始调用webhook...');
    const webhookResult = await callWebhookWithRetry(formData, 3, 5000);
    
    if (webhookResult && webhookResult.executionId) {
      console.log('Webhook调用成功，返回executionId:', webhookResult.executionId);
      
      return NextResponse.json({
        success: true,
        data: {
          executionId: webhookResult.executionId,
          status: 'processing'
        }
      }, {
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else {
      throw new Error('Webhook调用失败：未返回executionId');
    }

  } catch (error) {
    console.error('生成分镜失败:', error);
    return NextResponse.json(
      { 
        error: '生成分镜失败', 
        details: error instanceof Error ? error.message : '未知错误',
        suggestion: 'webhook服务器可能正在启动中，请稍后重试'
      },
      { status: 500 }
    );
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

    console.log('查询执行状态:', executionId);
    const executionStatus = await queryExecutionStatus(executionId);
    
    console.log('执行状态:', executionStatus.status, '是否完成:', executionStatus.finished);
    
    if (executionStatus.status === 'success' && executionStatus.finished) {
      console.log('执行完成，获取分镜图片数据...');
      
      try {
        const storyboardData = await getStoryboardImages(executionId);
        
        console.log('获取分镜图片数据成功，完整数据:', JSON.stringify(storyboardData.data, null, 2));
        console.log('video_width:', storyboardData.data?.video_width, 'video_height:', storyboardData.data?.video_height);
        
        return NextResponse.json({
          success: true,
          data: {
            executionId: executionId,
            status: 'completed',
            storyboardData: storyboardData.data
          }
        }, {
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (error) {
        console.error('获取分镜图片数据失败:', error);
        return NextResponse.json({
          success: false,
          error: '获取分镜图片数据失败',
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
    console.error('查询执行状态失败:', error);
    return NextResponse.json(
      { 
        error: '查询执行状态失败', 
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
