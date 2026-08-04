import { getUploadProvider, uploadFile } from '@/lib/fileUpload';

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const COMFYUI_PUBLIC_URL = process.env.COMFYUI_PUBLIC_URL
  || 'https://vcbj5meqyp1y7ifw-8188.container.x-gpu.com';
const IMAGE_FILENAME_PATTERN = /^[\w.-]+\.(?:png|jpe?g|webp|gif)(?:\?.*)?$/i;

function isImageMediaUrl(value: string) {
  try {
    const url = new URL(value, 'http://localhost');
    const filename = url.searchParams.get('filename')
      || url.searchParams.get('path')
      || url.pathname.split('/').pop()
      || '';
    return IMAGE_FILENAME_PATTERN.test(decodeURIComponent(filename));
  } catch {
    return IMAGE_FILENAME_PATTERN.test(value.split('/').pop() || '');
  }
}

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
    ) && url.pathname.includes('/view')
      && isImageMediaUrl(value);
  } catch {
    return false;
  }
}

function toComfyImageUrl(value: string) {
  const raw = value.trim();
  if (!raw || isOssUrl(raw)) return null;

  if (/^https?:\/\//i.test(raw)) {
    return isComfyImageUrl(raw) ? raw : null;
  }

  if (raw.startsWith('/view?') || raw.startsWith('view?')) {
    return `${COMFYUI_PUBLIC_URL.replace(/\/$/, '')}/${raw.replace(/^\/+/, '')}`;
  }

  if (IMAGE_FILENAME_PATTERN.test(raw) && !raw.includes('/')) {
    const filename = raw.split('?')[0];
    return `${COMFYUI_PUBLIC_URL.replace(/\/$/, '')}/view?filename=${encodeURIComponent(filename)}&subfolder=&type=output`;
  }

  return null;
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
  const sourceUrl = toComfyImageUrl(imageUrl)
    || (isOssUrl(imageUrl) && isImageMediaUrl(imageUrl) && getUploadProvider() === 'ftp' ? imageUrl : null);
  if (!sourceUrl) return stableOssUrl(imageUrl);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Wellbeing-PPT-Image-Persistence/1.0' },
    });
    if (!response.ok) {
      throw new Error(`下载远程图片失败：HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    if (!contentType.startsWith('image/')) {
      throw new Error(`远程地址返回的不是图片：${contentType}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length || buffer.length > MAX_IMAGE_BYTES) {
      throw new Error(`图片大小无效：${buffer.length} bytes`);
    }

    const extension = imageExtension(new URL(sourceUrl), contentType);
    const uploadedUrl = await uploadFile(buffer, folder, `image-${Date.now()}.${extension}`);
    return stableOssUrl(uploadedUrl);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function persistComfyImagesInValue<T>(value: T, folder = 'ppt-generated-images'): Promise<T> {
  const cache = new Map<string, Promise<string>>();

  const persistSafely = (cacheKey: string, sourceUrl: string, fallbackUrl: string) => {
    if (!cache.has(cacheKey)) {
      cache.set(cacheKey, persistComfyImageUrl(sourceUrl, folder).catch((error) => {
        // Persisting generated media must not prevent an otherwise valid course
        // or PPT auto-save. The original URL remains usable and can be migrated
        // on a later save after the upload service is available again.
        console.warn('[persistRemoteImage] Keeping original image URL after persistence failed:', {
          sourceUrl,
          error: error instanceof Error ? error.message : error,
        });
        return fallbackUrl;
      }));
    }
    return cache.get(cacheKey)!;
  };

  const visit = async (current: unknown): Promise<unknown> => {
    if (typeof current === 'string') {
      if (isOssUrl(current)) {
        // Canvas data also contains video/audio URLs. They must remain untouched;
        // this helper only downloads and migrates actual image files.
        if (!isImageMediaUrl(current)) return current;
        if (getUploadProvider() !== 'ftp') return stableOssUrl(current);
        return persistSafely(current, current, stableOssUrl(current));
      }
      const comfyImageUrl = toComfyImageUrl(current);
      if (!comfyImageUrl) return current;
      return persistSafely(comfyImageUrl, comfyImageUrl, current);
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
