import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import sharp from 'sharp';

// 并发控制和缓存
const MAX_CONCURRENT = 10; // 最大并发数，临时提高以避免429
let currentConcurrent = 0;
const imageCache = new Map(); // 图片缓存，避免重复下载
const cacheExpiry = 5 * 60 * 1000; // 缓存过期时间（5分钟）

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

async function fetchImageAsBuffer(imageUrl: string): Promise<Buffer> {
  // 检查缓存
  const cacheKey = imageUrl;
  const cached = imageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cacheExpiry) {
    console.log('[remove-white-background] 使用缓存图片');
    return cached.buffer;
  }

  // 如果是 OSS 或远程图片，直接下载（不再通过 proxy-image）
  if (imageUrl.includes('aliyuncs.com') || imageUrl.startsWith('https://') || imageUrl.startsWith('http://')) {
    console.log('[remove-white-background] 直接下载远程图片:', imageUrl);
    
    // 添加超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时
    
    try {
      const response = await fetch(imageUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`下载图片失败: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // 缓存图片
      imageCache.set(cacheKey, {
        buffer,
        timestamp: Date.now()
      });
      
      return buffer;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  // 本地图片直接读取
  const isProduction = process.env.NODE_ENV === 'production';
   const baseUrl = isProduction ? 'http://8.130.93.151:10002' : 'http://localhost:4000';
   let fullImageUrl = imageUrl;
   if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
     fullImageUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
   }
  
  const response = await fetch(fullImageUrl);
  if (!response.ok) {
    throw new Error(`下载图片失败: ${response.status} ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // 缓存图片
  imageCache.set(cacheKey, {
    buffer,
    timestamp: Date.now()
  });
  
  return buffer;
}

// 清理过期缓存
setInterval(() => {
  const now = Date.now();
  imageCache.forEach((value, key) => {
    if (now - value.timestamp > cacheExpiry) {
      imageCache.delete(key);
    }
  });
}, 60000); // 每分钟清理一次

export async function POST(request: NextRequest) {
  try {
    // 检查并发数
    if (currentConcurrent >= MAX_CONCURRENT) {
      console.log('[remove-white-background] 并发数达到上限，等待...');
      // 等待1秒后重试
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 再次检查
      if (currentConcurrent >= MAX_CONCURRENT) {
        return NextResponse.json(
          { error: '服务器忙，请稍后再试' },
          { status: 429, headers: corsHeaders() }
        );
      }
    }

    currentConcurrent++;
    console.log('[remove-white-background] 当前并发数:', currentConcurrent);

    const authResult = await authenticate(request);
    if (!authResult.success) {
      currentConcurrent--;
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const body = await request.json();
    const { imageUrl, threshold = 240 } = body;

    if (!imageUrl) {
      currentConcurrent--;
      return NextResponse.json(
        { error: '缺少图片URL' },
        { status: 400, headers: corsHeaders() }
      );
    }

    console.log('开始白色背景去除处理:', imageUrl);
    console.log('白色阈值:', threshold);

    // 使用改进的图片获取方法
    const imageBuffer = await fetchImageAsBuffer(imageUrl);
    
    const image = sharp(imageBuffer);
    
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
    
    // 开发环境用 localhost:4000，生产环境用 127.0.0.1:10002（Nginx 代理）
    const isProduction = process.env.NODE_ENV === 'production';
    const uploadBase = isProduction ? 'http://127.0.0.1:10012' : 'http://localhost:4000';
    const uploadUrl = new URL('/api/upload', uploadBase);
    const uploadFormData = new FormData();
    const file = new File([new Uint8Array(outputBuffer)], `character-transparent-${Date.now()}.png`, { type: 'image/png' });
    uploadFormData.append('file', file);
    uploadFormData.append('folder', 'ai-generated-images-transparent');

    // 添加上传超时控制
    const uploadController = new AbortController();
    const uploadTimeoutId = setTimeout(() => uploadController.abort(), 60000); // 60秒超时

    console.log('[remove-white-background] 开始上传到:', uploadUrl.toString());

    let uploadResponse;
    try {
      uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        body: uploadFormData,
        signal: uploadController.signal
      });
    } catch (err: unknown) {
      clearTimeout(uploadTimeoutId);
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[remove-white-background] 上传 fetch 失败:', errMsg);
      currentConcurrent--;
      throw new Error('上传 fetch 失败: ' + errMsg);
    }

    clearTimeout(uploadTimeoutId);

    if (!uploadResponse.ok) {
      currentConcurrent--;
      const errorData = await uploadResponse.json();
      throw new Error(errorData.error || '上传透明背景图片失败');
    }

    const uploadData = await uploadResponse.json();
    console.log('白色背景去除完成:', uploadData.url);

    currentConcurrent--;
    console.log('[remove-white-background] 完成，当前并发数:', currentConcurrent);

    return NextResponse.json({
      success: true,
      url: uploadData.url
    }, { headers: corsHeaders() });

  } catch (error) {
    currentConcurrent--;
    console.log('[remove-white-background] 失败，当前并发数:', currentConcurrent);
    console.error('白色背景去除失败:', error);
    return NextResponse.json(
      { error: '白色背景去除失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
