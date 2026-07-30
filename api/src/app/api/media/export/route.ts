import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function isAllowedHost(target: URL, request: NextRequest) {
  const requestHost = new URL(request.url).hostname;
  const hostname = target.hostname.toLowerCase();
  return hostname === requestHost
    || hostname.endsWith('.container.x-gpu.com')
    || hostname.endsWith('.aliyuncs.com')
    || hostname.endsWith('.dhredu.cn')
    || hostname.endsWith('.newstaredu.cn');
}

// GET /api/media/export?url=...
// Streams a persisted/generated media file through the application origin so
// browser-side PPTX export can embed it without depending on third-party CORS.
export async function GET(request: NextRequest) {
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
    return NextResponse.json({ error: 'Media host is not allowed' }, { status: 403 });
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
