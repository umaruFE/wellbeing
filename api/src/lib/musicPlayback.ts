import { createHmac, timingSafeEqual } from 'node:crypto';
import { isMusicCdnUrl } from './musicAudioUrls';
const filePattern = /^(?:full_song_\d+_\d+|song_\d+_\d+_line_\d+)\.flac$/;
export const validMusicFile = (file: string) => filePattern.test(file);
const signature = (cdn: string, file: string) => createHmac('sha256', process.env.JWT_SECRET || 'wellbeing-secret-key-2024').update(JSON.stringify([cdn, file])).digest('hex');
export function verifyMusicPlayback(cdn: string, file: string, token: string): boolean {
  if (!isMusicCdnUrl(cdn) || !validMusicFile(file) || !/^[a-f0-9]{64}$/.test(token)) return false;
  return timingSafeEqual(Buffer.from(signature(cdn, file)), Buffer.from(token));
}
export function musicPlaybackUrl(cdn: string, file: string, origin: string): string {
  if (!isMusicCdnUrl(cdn) || !validMusicFile(file)) throw new Error('音频没有有效FTP地址或备用FLAC文件');
  const url = new URL('/api/media/music', origin);
  url.search = new URLSearchParams({ cdn, file, token: signature(cdn, file) }).toString();
  return url.toString();
}
export function musicPublicOrigin(request: { url: string; headers: Headers }): string {
  if (process.env.MUSIC_PUBLIC_BASE_URL) return new URL(process.env.MUSIC_PUBLIC_BASE_URL).origin;
  const current = new URL(request.url);
  if (['localhost', '127.0.0.1'].includes(current.hostname)) {
    const referer = request.headers.get('referer');
    if (referer) { const page = new URL(referer); if (['localhost', '127.0.0.1'].includes(page.hostname)) return page.origin; }
    return current.origin;
  }
  return 'https://wellbeing.newstaredu.cn';
}
// URLs authorize one intended-public audio asset; no n8n or ComfyUI credentials.
export function playableMusicManifest(manifest: any, origin: string) {
  const cdn = manifest.cdnUrl || manifest.url;
  const lyrics = manifest.lyrics.map((line: any) => {
    const resource = manifest.resources?.find((r: any) => r.filename === line.filename && r.subfolder === line.subfolder);
    const cdnUrl = line.cdnUrl || line.url;
    const fallbackFilename = line.fallbackFilename || resource?.localFilename;
    return { ...line, cdnUrl, fallbackFilename, url: musicPlaybackUrl(cdnUrl, fallbackFilename, origin) };
  });
  return { ...manifest, cdnUrl: cdn, fallbackFilename: manifest.fallbackFilename || manifest.filename,
    url: musicPlaybackUrl(cdn, manifest.fallbackFilename || manifest.filename, origin), lyrics,
    segments: lyrics.map((line: any) => line.url), playbackPolicy: 'cdn_with_n8n_fallback' };
}
export function musicByteRange(header: string | null, size: number): [number, number] | null {
  if (!header) return [0, size - 1];
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] ? (match[2] ? Math.min(size - 1, Number(match[2])) : size - 1) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || start > end || (!match[1] && Number(match[2]) === 0)) return null;
  return [start, end];
}
