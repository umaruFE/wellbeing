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

    console.log('获取重新生成的图片:', executionId);
    
    const response = await fetch(`${AI_API_BASE_URL}/webhook/get-image?execution_id=${executionId}`, {
      method: 'GET',
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('获取图片失败:', errorText);
      return NextResponse.json(
        { error: '获取图片失败', details: errorText },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('获取图片成功:', result);

    return NextResponse.json({
      success: true,
      data: result
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error: any) {
    console.error('获取图片失败:', error);
    return NextResponse.json(
      { error: '获取图片失败', details: error.message },
      { status: 500 }
    );
  }
}
