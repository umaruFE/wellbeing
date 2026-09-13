/** Stored audio is a URL. Binary uploads belong to the file service, never result JSON. */
export function assertMusicAudioUrls(value: unknown): void {
  if (typeof value === 'string') {
    if (/^data:audio\//i.test(value) || /^data:application\/octet-stream[;,]/i.test(value)) {
      throw new Error('请先将音频上传到FTP，再保存文件URL；作品不接受base64音频');
    }
    return;
  }
  if (Array.isArray(value)) { value.forEach(assertMusicAudioUrls); return; }
  if (value && typeof value === 'object') Object.values(value).forEach(assertMusicAudioUrls);
}

export function isMusicCdnUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.origin === 'https://z.wellbeing.newstaredu.cn';
  } catch { return false; }
}
