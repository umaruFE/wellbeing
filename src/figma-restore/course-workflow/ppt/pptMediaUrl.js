const IMAGE_FILENAME_PATTERN = /^[\w.-]+\.(?:png|jpe?g|webp|gif)(?:\?.*)?$/i;

export function resolvePptMediaUrl(url) {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^(?:https?:|data:|blob:)/i.test(value)) return value;
  if (value.startsWith('/api/media/oss') || value.startsWith('/api/media/ppt-image')) return value;
  if (value.startsWith('/view?') || value.startsWith('view?')) {
    return `/api/media/ppt-image?src=${encodeURIComponent(value)}`;
  }
  if (IMAGE_FILENAME_PATTERN.test(value) && !value.includes('/')) {
    return `/api/media/ppt-image?src=${encodeURIComponent(value)}`;
  }
  return value;
}
