import { uploadToOss } from '@/lib/oss';

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const COMFYUI_PUBLIC_URL = process.env.COMFYUI_PUBLIC_URL
  || 'https://vcbj5meqyp1y7ifw-8188.container.x-gpu.com';

function isOssUrl(value: string) {
  const endpoint = process.env.ALIYUN_OSS_ENDPOINT || 'wellbeing1.oss-cn-beijing.aliyuncs.com';
  return value.includes('aliyuncs.com') || value.includes(endpoint);
}

function stableOssUrl(value: string) {
  if (!isOssUrl(value)) return value;
  try {
    const url = new URL(value);
    const objectPath = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
    return objectPath ? `/api/media/oss?path=${encodeURIComponent(objectPath)}` : value;
  } catch {
    return value;
  }
}

function isComfyImageUrl(value: string) {
  if (!/^https?:\/\//i.test(value) || isOssUrl(value)) return false;
  try {
    const url = new URL(value);
    const configuredHost = new URL(COMFYUI_PUBLIC_URL).host;
    return (
      url.host === configuredHost
      || url.host.endsWith('.container.x-gpu.com')
    ) && url.pathname.includes('/view');
  } catch {
    return false;
  }
}

function imageExtension(url: URL, contentType: string) {
  const filename = url.searchParams.get('filename') || url.pathname;
  const extension = filename.split('.').pop()?.toLowerCase();
  if (extension && ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(extension)) return extension;
  if (contentType.includes('webp')) return 'webp';
  if (contentType.includes('jpeg')) return 'jpg';
  if (contentType.includes('gif')) return 'gif';
  return 'png';
}

export async function persistComfyImageUrl(
  imageUrl: string,
  folder = 'ppt-generated-images',
): Promise<string> {
  if (!isComfyImageUrl(imageUrl)) return imageUrl;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Wellbeing-PPT-Image-Persistence/1.0' },
    });
    if (!response.ok) {
      throw new Error(`下载 ComfyUI 图片失败：HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    if (!contentType.startsWith('image/')) {
      throw new Error(`ComfyUI 返回的不是图片：${contentType}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
      throw new Error(`图片大小无效：${buffer.length} bytes`);
    }

    const extension = imageExtension(new URL(imageUrl), contentType);
    const uploadedUrl = await uploadToOss(buffer, folder, `ppt-${Date.now()}.${extension}`);
    return stableOssUrl(uploadedUrl);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function persistComfyImagesInValue<T>(value: T, folder = 'ppt-generated-images'): Promise<T> {
  const cache = new Map<string, Promise<string>>();

  const visit = async (current: unknown): Promise<unknown> => {
    if (typeof current === 'string') {
      if (isOssUrl(current)) return stableOssUrl(current);
      if (!isComfyImageUrl(current)) return current;
      if (!cache.has(current)) {
        cache.set(current, persistComfyImageUrl(current, folder));
      }
      return cache.get(current);
    }
    if (Array.isArray(current)) {
      return Promise.all(current.map(visit));
    }
    if (current && typeof current === 'object') {
      const entries = await Promise.all(
        Object.entries(current).map(async ([key, item]) => [key, await visit(item)]),
      );
      return Object.fromEntries(entries);
    }
    return current;
  };

  return await visit(value) as T;
}
