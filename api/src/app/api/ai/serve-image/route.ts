import { NextRequest, NextResponse } from 'next/server';

const AI_API_BASE_URL = 'http://117.50.218.161:5678';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imagePath = searchParams.get('path');

    if (!imagePath) {
      return NextResponse.json(
        { error: '缺少图片路径参数' },
        { status: 400 }
      );
    }

    console.log('获取图片:', imagePath);

    const filename = imagePath.split('/').pop();
    
    if (!filename) {
      return NextResponse.json(
        { error: '无效的图片路径' },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${AI_API_BASE_URL}/view?filename=${encodeURIComponent(filename)}&subfolder=&type=output`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('获取图片失败:', errorText);
      
      return NextResponse.json(
        { error: '获取图片失败', details: errorText },
        { status: response.status }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    
    const contentType = response.headers.get('content-type') || 'image/png';

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error: any) {
    console.error('获取图片失败:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: '获取图片超时' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { 
        error: '获取图片失败', 
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
