const IMAGE_FILENAME_PATTERN = /^[\w.-]+\.(?:png|jpe?g|webp|gif)(?:\?.*)?$/i;

export function resolvePptMediaUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (value.startsWith('/api/media/oss') || value.startsWith('/api/media/ppt-image')) return value;
  if (/^https?:/i.test(value)) {
    try {
      const parsed = new URL(value);
      if (parsed.hostname.endsWith('.container.x-gpu.com') && parsed.pathname.includes('/view')) {
        return `/api/media/ppt-image?src=${encodeURIComponent(value)}`;
      }
      if (parsed.hostname.endsWith('.aliyuncs.com')) {
        const objectPath = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
        return objectPath
          ? `/api/media/oss?path=${encodeURIComponent(objectPath)}`
          : value;
      }
    } catch {
      return value;
    }
    return value;
  }
  if (/^(?:data:|blob:)/i.test(value)) return value;
  if (value.startsWith('/view?') || value.startsWith('view?')) {
    return `/api/media/ppt-image?src=${encodeURIComponent(value)}`;
  }
  if (IMAGE_FILENAME_PATTERN.test(value) && !value.includes('/')) {
    return `/api/media/ppt-image?src=${encodeURIComponent(value)}`;
  }
  return value;
}
