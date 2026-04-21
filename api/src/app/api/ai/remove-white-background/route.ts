import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import sharp from 'sharp';

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
    const { imageUrl, threshold = 240 } = body;

    if (!imageUrl) {
      return NextResponse.json(
        { error: '缺少图片URL' },
        { status: 400, headers: corsHeaders() }
      );
    }

    console.log('开始白色背景去除处理:', imageUrl);
    console.log('白色阈值:', threshold);

    let fullImageUrl = imageUrl;
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      fullImageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      console.log('转换为完整URL:', fullImageUrl);
    }

    const imageResponse = await fetch(fullImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`下载图片失败: ${imageResponse.status} ${imageResponse.statusText}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    
    const image = sharp(Buffer.from(imageBuffer));
    
    const metadata = await image.metadata();
    console.log('图片信息:', metadata);
    
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const pixels = new Uint8ClampedArray(data);
    const width = info.width;
    const height = info.height;
    
    // 背景：接近纯白/浅灰统一改为全透明；角色像素保持完全不透明。
    // 旧逻辑用「距离白色的渐变 alpha」会让浅灰/浅色角色（如 edi）整身半透明，出现「幽灵」效果。
    const satMax = 40;
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const isLight = r >= threshold && g >= threshold && b >= threshold;
      const isGrayish = maxC - minC < satMax;

      if (isLight && isGrayish) {
        pixels[i + 3] = 0;
      } else {
        pixels[i + 3] = 255;
      }
    }
    
    const outputBuffer = await sharp(pixels, {
      raw: {
        width: width,
        height: height,
        channels: 4
      }
    })
    .png()
    .toBuffer();
    
    const uploadUrl = new URL('/api/upload', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
    const uploadFormData = new FormData();
    const file = new File([new Uint8Array(outputBuffer)], `character-transparent-${Date.now()}.png`, { type: 'image/png' });
    uploadFormData.append('file', file);
    uploadFormData.append('folder', 'ai-generated-images-transparent');

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      body: uploadFormData
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(errorData.error || '上传透明背景图片失败');
    }

    const uploadData = await uploadResponse.json();
    console.log('白色背景去除完成:', uploadData.url);

    return NextResponse.json({
      success: true,
      url: uploadData.url
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('白色背景去除失败:', error);
    return NextResponse.json(
      { error: '白色背景去除失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
