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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { width, height, role, prompt } = body;

    console.log('收到重新生成图片请求:', { width, height, role, prompt });

    if (!role || !prompt) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    console.log('调用 N8N regene-image webhook...');
    
    // 使用 FormData 格式
    const formData = new FormData();
    formData.append('width', String(width || 1280));
    formData.append('height', String(height || 720));
    formData.append('role', role);
    formData.append('prompt', prompt);

    const response = await fetch(`${AI_API_BASE_URL}/webhook/regene-image`, {
      method: 'POST',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('重新生成图片失败:', errorText);
      return NextResponse.json(
        { error: '重新生成图片失败', details: errorText },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('重新生成图片成功:', result);

    return NextResponse.json({
      success: true,
      data: result
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    console.error('重新生成图片失败:', error);
    return NextResponse.json(
      { error: '重新生成图片失败', details: error.message },
      { status: 500 }
    );
  }
}
