import { gunzipSync } from 'node:zlib';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

type RouteParams = { params: { characterId: string; poseId: string } };
const validKey = /^[a-z][a-z0-9-]{0,63}$/;
const notFound = () => NextResponse.json({ error: '找不到这个角色动作。' }, {
  status: 404, headers: { 'Cache-Control': 'no-store' },
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { characterId, poseId } = params;
  const revision = request.nextUrl.searchParams.get('v');
  if (!validKey.test(characterId) || !validKey.test(poseId) ||
      (revision !== null && !/^[a-f0-9]{64}$/.test(revision))) return notFound();
  try {
    const selection = revision === null ? 'is_current' : 'sha256 = $3';
    const args = revision === null ? [characterId, poseId] : [characterId, poseId, revision];
    const { rows } = await db.query(
      `SELECT sha256, svg_gzip FROM yoga_motion_assets
       WHERE character_id = $1 AND pose_id = $2 AND ${selection}`, args,
    );
    if (!rows.length) return notFound();
    const { sha256, svg_gzip: svg } = rows[0];
    const etag = `W/"${sha256}"`;
    const headers = {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'self'",
      'Cache-Control': revision ? 'public, max-age=31536000, immutable' : 'public, no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Vary': 'Accept-Encoding',
      ETag: etag,
    };
    if (request.headers.get('if-none-match')?.split(/\s*,\s*/).includes(etag)) {
      return new Response(null, { status: 304, headers });
    }
    // Serve the pre-compressed bytes over the tunnel without re-encoding them.
    const encodings = request.headers.get('accept-encoding') || '';
    const gzip = encodings.split(',').some(entry => {
      const [name, quality = ''] = entry.trim().toLowerCase().split(/\s*;\s*/);
      return name === 'gzip' && !/^q=0(?:\.0*)?$/.test(quality);
    });
    if (gzip) return new Response(new Uint8Array(svg), { headers: { ...headers, 'Content-Encoding': 'gzip' } });
    return new Response(new Uint8Array(gunzipSync(svg)), { headers });
  } catch {
    return NextResponse.json({ error: '暂时无法读取动作文件，请重试。' }, {
      status: 503, headers: { 'Cache-Control': 'no-store' },
    });
  }
}
