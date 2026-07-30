import { NextRequest, NextResponse } from 'next/server';
import { isIP } from 'net';
import { authenticate } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DEFAULT_MEDIA_EXPORT_HOSTS = [
  // Current workflow/video-generation file service.
  '117.50.218.161',
  '117.50.218.161:5678',
];

function parseAllowedMediaHosts() {
  const values = [
    ...DEFAULT_MEDIA_EXPORT_HOSTS,
    process.env.MEDIA_EXPORT_ALLOWED_HOSTS,
    process.env.FTP_CDN_DOMAIN,
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.COMFYUI_PUBLIC_URL,
  ].filter(Boolean) as string[];

  return new Set(values.flatMap((value) => value.split(',')).flatMap((value) => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return [];
    try {
      const parsed = new URL(trimmed.includes('://') ? trimmed : `http://${trimmed}`);
      return [parsed.hostname, parsed.host];
    } catch {
      return [];
    }
  }));
}

function isAllowedHost(target: URL, request: NextRequest) {
  const requestHost = new URL(request.url).hostname;
  const hostname = target.hostname.toLowerCase();
  const host = target.host.toLowerCase();
  const configuredHosts = parseAllowedMediaHosts();
  const ipVersion = isIP(hostname);
  const isPublicIpv4 = ipVersion === 4 && !(
    hostname.startsWith('10.')
    || hostname.startsWith('127.')
    || hostname.startsWith('169.254.')
    || hostname.startsWith('192.168.')
    || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname)
  );
  return hostname === requestHost
    || configuredHosts.has(hostname)
    || configuredHosts.has(host)
    || isPublicIpv4
    || hostname.endsWith('.container.x-gpu.com')
    || hostname.endsWith('.aliyuncs.com')
    || hostname.endsWith('.dhredu.cn')
    || hostname.endsWith('.newstaredu.cn');
}

// GET /api/media/export?url=...
// Streams a persisted/generated media file through the application origin so
// browser-side PPTX export can embed it without depending on third-party CORS.
export async function GET(request: NextRequest) {
  const authResult = await authenticate(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error || '认证失败' }, { status: 401 });
  }

  const source = new URL(request.url).searchParams.get('url')?.trim();
  if (!source || source.startsWith('data:') || source.startsWith('blob:')) {
    return NextResponse.json({ error: 'Invalid media source' }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(source, request.url);
  } catch {
    return NextResponse.json({ error: 'Invalid media URL' }, { status: 400 });
  }

  if (!['http:', 'https:'].includes(target.protocol) || !isAllowedHost(target, request)) {
    console.warn('[media/export] Blocked media source:', target.origin);
    return NextResponse.json(
      { error: `Media host is not allowed: ${target.host}` },
      { status: 403 },
    );
  }

  try {
    const response = await fetch(target, {
      redirect: 'follow',
      headers: { 'User-Agent': 'Wellbeing-PPT-Exporter/1.0' },
    });
    if (!response.ok || !response.body) {
      return NextResponse.json(
        { error: `Unable to read media: HTTP ${response.status}` },
        { status: 502 },
      );
    }

    const headers = new Headers();
    headers.set('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
    headers.set('Content-Disposition', 'inline');
    headers.set('Cache-Control', 'private, max-age=300');
    const contentLength = response.headers.get('content-length');
    if (contentLength) headers.set('Content-Length', contentLength);
    return new NextResponse(response.body, { status: 200, headers });
  } catch (error) {
    console.error('[media/export] Failed to stream media:', error);
    return NextResponse.json({ error: 'Unable to export media' }, { status: 502 });
  }
}
