import { NextRequest, NextResponse } from 'next/server';
import { cacheRemoteMedia } from '@/lib/mediaCache';

// POST /api/media/cache
// Body: { url: string, type?: 'image' | 'audio' | 'video' | string }
// 说明：当前实现为下载到本地 public/media-cache 下，后续可替换为上传到 OSS
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, type } = body as { url?: string; type?: string };

    if (!url) {
      return NextResponse.json(
        { success: false, error: '缺少媒体资源地址 url' },
        { status: 400 }
      );
    }

    // 根据类型选择子目录
    let subFolder = 'misc';
    if (type === 'image') subFolder = 'images';
    else if (type === 'audio') subFolder = 'audio';
    else if (type === 'video') subFolder = 'videos';

    const result = await cacheRemoteMedia(url, subFolder);

    return NextResponse.json({
      success: true,
      data: {
        filePath: result.filePath,
        url: result.publicUrl,
      },
    });
  } catch (error: any) {
    console.error('Error caching media:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || '缓存媒体失败',
      },
      { status: 500 }
    );
  }
}

