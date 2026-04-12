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
    const { 
      storyboard_images_filepath,
      storyboard_prompts,
      video_width,
      video_height,
      voice,
      storyboard_image_prompts
    } = body;

    console.log('收到生成视频请求，完整参数:', JSON.stringify(body, null, 2));
    console.log('video_width:', video_width, 'video_height:', video_height);
    console.log('图片数量:', storyboard_images_filepath?.length);
    console.log('提示词数量:', storyboard_prompts?.length);
    console.log('是否有配音:', !!voice);

    if (!storyboard_images_filepath || !storyboard_prompts) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 清理URL，去除空格
    const cleanStoryboardImages = storyboard_images_filepath.map((path: string) => path.trim());

    const requestBody = {
      storyboard_images_filepath: cleanStoryboardImages,
      storyboard_prompts,
      video_width: video_width || 856,
      video_height: video_height || 480,
      voice,
      storyboard_image_prompts
    };

    console.log('发送给N8N的请求体:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${AI_API_BASE_URL}/webhook/gene-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('生成视频失败:', errorText);
      return NextResponse.json(
        { error: '生成视频失败', details: errorText },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('生成视频成功:', result);

    return NextResponse.json({
      success: true,
      data: {
        executionId: result.executionId,
        status: result.status,
        message: result.message
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('生成视频失败:', error);
    return NextResponse.json(
      { 
        error: '生成视频失败', 
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
