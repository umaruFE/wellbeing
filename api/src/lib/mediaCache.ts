import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export type MediaCacheResult = {
  /** 服务器上的绝对文件路径 */
  filePath: string;
  /** 前端可访问的相对 URL，例如 /media-cache/images/xxx.jpg */
  publicUrl: string;
};

/**
 * 将远程图片/音频/视频下载到本地缓存目录（后续可替换为 OSS）
 * @param url 远程资源地址
 * @param subFolder 子目录，如 'images' | 'audio' | 'videos'
 */
export async function cacheRemoteMedia(
  url: string,
  subFolder: string = 'misc'
): Promise<MediaCacheResult> {
  if (!url) {
    throw new Error('缺少媒体资源地址');
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`下载媒体失败: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 尝试从 Content-Type 或 URL 中解析扩展名
  const contentType = response.headers.get('content-type') || '';
  let ext = '';

  if (contentType.includes('image/')) {
    ext = contentType.split('image/')[1];
  } else if (contentType.includes('audio/')) {
    ext = contentType.split('audio/')[1];
  } else if (contentType.includes('video/')) {
    ext = contentType.split('video/')[1];
  }

  if (!ext) {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const guess = pathname.split('.').pop();
    if (guess && guess.length <= 5) {
      ext = guess;
    } else {
      ext = 'bin';
    }
  }

  const baseDir =
    process.env.MEDIA_CACHE_DIR ||
    path.join(process.cwd(), 'public', 'media-cache', subFolder);

  await fs.mkdir(baseDir, { recursive: true });

  const filename = `${Date.now()}-${randomUUID()}.${ext}`;
  const filePath = path.join(baseDir, filename);

  await fs.writeFile(filePath, buffer);

  // public 下的访问路径
  const publicUrl = `/media-cache/${subFolder}/${filename}`;

  return { filePath, publicUrl };
}

