import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const mode = searchParams.get('mode') || 'base64';

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'url parameter required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const parsedUrl = new URL(imageUrl);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        { error: 'Unsupported protocol' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();

    if (mode === 'stream') {
      return new NextResponse(arrayBuffer, {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
          'Content-Length': String(arrayBuffer.byteLength),
        },
      });
    }

    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      contentType,
      size: arrayBuffer.byteLength,
    }, { headers: CORS_HEADERS });

  } catch (error) {
    console.error('[proxy-image] Failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Proxy failed' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
