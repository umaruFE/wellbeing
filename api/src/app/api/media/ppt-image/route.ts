import { NextRequest, NextResponse } from 'next/server';
import { persistComfyImageUrl } from '@/lib/persistRemoteImage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const src = new URL(request.url).searchParams.get('src')?.trim();
  if (!src || src.includes('..')) {
    return NextResponse.json({ error: 'Invalid PPT image source' }, { status: 400 });
  }

  try {
    const persistedUrl = await persistComfyImageUrl(src, 'ppt-generated-images');
    if (!persistedUrl || persistedUrl === src) {
      return NextResponse.json({ error: 'Unable to persist PPT image' }, { status: 404 });
    }

    return NextResponse.redirect(new URL(persistedUrl, request.url));
  } catch (error) {
    console.error('[media/ppt-image] Failed to persist PPT image:', error);
    return NextResponse.json({ error: 'Unable to access PPT image' }, { status: 500 });
  }
}
