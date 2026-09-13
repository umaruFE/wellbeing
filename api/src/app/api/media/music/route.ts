import { NextRequest, NextResponse } from 'next/server';
import { verifyMusicPlayback, musicByteRange } from '@/lib/musicPlayback';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS', 'Access-Control-Allow-Headers': 'Range', 'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges' };
const cdnState = new Map<string, { okay: boolean; until: number }>();
const cache = new Map<string, { bytes: Buffer; until: number }>();
const inFlight = new Map<string, Promise<Buffer>>();
const MAX_FILE = 40 * 1024 * 1024;
const MAX_CACHE = 64 * 1024 * 1024;
async function cdnReadable(url: string) {
  const cached = cdnState.get(url);
  if (cached && cached.until > Date.now()) return cached.okay;
  let okay = false;
  try {
    const response = await fetch(url, { headers: { Range: 'bytes=0-3' }, signal: AbortSignal.timeout(5000), cache: 'no-store', redirect: 'error' });
    const reader = response.body?.getReader();
    if (reader) {
      const item = await reader.read();
      okay = response.ok && Buffer.from(item.value || []).subarray(0, 4).toString() === 'fLaC';
      await reader.cancel();
    }
  } catch { /* FTP remains the primary storage; its HTTP availability is independent. */ }
  if (cdnState.size > 512) cdnState.clear();
  cdnState.set(url, { okay, until: Date.now() + 60000 });
  return okay;
}
async function backupAudio(file: string): Promise<Buffer> {
  const existing = cache.get(file);
  if (existing && existing.until > Date.now()) return existing.bytes;
  if (inFlight.has(file)) return inFlight.get(file)!;
  const pending = (async () => {
    const base = process.env.N8N_API_BASE_URL || 'http://117.50.218.161:5678';
    const url = new URL('/webhook/files', base); url.searchParams.set('file', file);
    const response = await fetch(url, { signal: AbortSignal.timeout(45000), cache: 'no-store', redirect: 'error' });
    if (!response.ok || !response.body) throw new Error('FTP/CDN与备用音频暂不可用');
    const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const item = await reader.read(); if (item.done) break;
      size += item.value.byteLength;
      if (size > MAX_FILE) { await reader.cancel(); throw new Error('备用音频超过40MB'); }
      chunks.push(item.value);
    }
    const bytes = Buffer.concat(chunks);
    if (bytes.subarray(0, 4).toString() !== 'fLaC') throw new Error('备用文件不是有效FLAC音频');
    cache.delete(file);
    let used = 0;
    for (const [key, value] of Array.from(cache)) {
      if (value.until <= Date.now()) cache.delete(key); else used += value.bytes.length;
    }
    for (const [key, value] of Array.from(cache)) {
      if (used + bytes.length <= MAX_CACHE) break;
      used -= value.bytes.length; cache.delete(key);
    }
    cache.set(file, { bytes, until: Date.now() + 60000 });
    return bytes;
  })();
  inFlight.set(file, pending);
  try { return await pending; } finally { inFlight.delete(file); }
}
async function serve(request: NextRequest, head = false) {
  const cdn = request.nextUrl.searchParams.get('cdn') || '';
  const file = request.nextUrl.searchParams.get('file') || '';
  const token = request.nextUrl.searchParams.get('token') || '';
  if (!verifyMusicPlayback(cdn, file, token)) return NextResponse.json({ error: '音频地址无效' }, { status: 403, headers: cors });
  try {
    if (await cdnReadable(cdn)) return NextResponse.redirect(cdn, { status: 307, headers: cors });
    const bytes = await backupAudio(file);
    const rangeHeader = request.headers.get('range');
    const range = musicByteRange(rangeHeader, bytes.length);
    if (!range) return new NextResponse(null, { status: 416, headers: { ...cors, 'Content-Range': `bytes */${bytes.length}` } });
    const [start, end] = range;
    const headers: Record<string, string> = { ...cors, 'Content-Type': 'audio/flac', 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes', 'Cache-Control': 'private, max-age=60', 'X-Music-Source': 'n8n-fallback' };
    if (rangeHeader) headers['Content-Range'] = `bytes ${start}-${end}/${bytes.length}`;
    return new NextResponse(head ? null : new Uint8Array(bytes.subarray(start, end + 1)), { status: rangeHeader ? 206 : 200, headers });
  } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 502, headers: cors }); }
}
export const GET = (request: NextRequest) => serve(request);
export const HEAD = (request: NextRequest) => serve(request, true);
export const OPTIONS = () => new NextResponse(null, { status: 204, headers: cors });
