import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrl } from '@/lib/oss';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const objectPath = new URL(request.url).searchParams.get('path')?.replace(/^\/+/, '');
  if (!objectPath || objectPath.includes('..')) {
    return NextResponse.json({ error: 'Invalid OSS object path' }, { status: 400 });
  }

  try {
    const signedUrl = new URL(getSignedUrl(objectPath, 300));
    signedUrl.protocol = 'https:';
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error('[media/oss] Failed to sign OSS object:', error);
    return NextResponse.json({ error: 'Unable to access OSS image' }, { status: 500 });
  }
}
