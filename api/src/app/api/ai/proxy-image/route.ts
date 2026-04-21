import { NextRequest, NextResponse } from 'next/server';

/**
 * 图片代理路由 - 解决 Canvas 跨域绘制问题
 * 
 * 将远程图片下载后返回，允许前端在 Canvas 中使用
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: '缺少 url 参数' },
        { status: 400 }
      );
    }

    console.log('[proxy-image] 代理请求:', imageUrl);

    // 验证 URL
    const parsedUrl = new URL(imageUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: '不支持的协议' },
        { status: 400 }
      );
    }

    // 下载图片
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    console.log('[proxy-image] 转换成功:', { contentType, size: arrayBuffer.byteLength });

    return NextResponse.json({
      success: true,
      url: dataUrl,
      contentType,
      size: arrayBuffer.byteLength
    });

  } catch (error) {
    console.error('[proxy-image] 代理失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '代理失败' },
      { status: 500 }
    );
  }
}
