import { NextRequest, NextResponse } from 'next/server';
import { getOssDownloadUrl } from '@/lib/oss';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const signedUrl = getOssDownloadUrl(new URL(request.url), 300);
    if (!signedUrl) return NextResponse.json({ error: 'Invalid OSS object path' }, { status: 400 });
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error('[media/oss] Failed to sign OSS object:', error);
    return NextResponse.json({ error: 'Unable to access OSS image' }, { status: 500 });
  }
}
