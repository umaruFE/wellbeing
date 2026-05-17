import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

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

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: '缺少图片URL' },
        { status: 400, headers: corsHeaders() }
      );
    }

    console.log('开始去背景处理:', imageUrl);

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error('下载图片失败');
    }

    const imageBuffer = await imageResponse.arrayBuffer();

    const formData = new FormData();
    formData.append('image_file_b64', Buffer.from(imageBuffer).toString('base64'));
    formData.append('size', 'auto');

    const removeBgResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': process.env.REMOVEBG_API_KEY || '',
      },
      body: formData
    });

    if (!removeBgResponse.ok) {
      const errorText = await removeBgResponse.text();
      console.error('remove.bg API错误:', errorText);
      
      return NextResponse.json({
        success: true,
        url: imageUrl,
        message: '去背景服务暂时不可用，使用原图'
      }, { headers: corsHeaders() });
    }

    const resultBuffer = await removeBgResponse.arrayBuffer();

    const isProduction = process.env.NODE_ENV === 'production';
    const uploadBase = isProduction ? 'http://8.130.93.151:10012' : 'http://localhost:4000';
    const uploadUrl = new URL('/api/upload', uploadBase);
    const uploadFormData = new FormData();
    const file = new File([resultBuffer], `character-${Date.now()}.png`, { type: 'image/png' });
    uploadFormData.append('file', file);
    uploadFormData.append('folder', 'ai-generated-images-transparent');

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: uploadFormData
    });

    if (!uploadResponse.ok) {
      throw new Error('上传去背景图片失败');
    }

    const uploadData = await uploadResponse.json();
    console.log('去背景完成:', uploadData.url);

    return NextResponse.json({
      success: true,
      url: uploadData.url
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('去背景失败:', error);
    return NextResponse.json(
      { error: '去背景失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
