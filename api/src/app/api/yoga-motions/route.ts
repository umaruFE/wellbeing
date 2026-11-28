import { NextResponse } from 'next/server';
import { readYogaMotions } from '@/lib/yoga-motions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    const data = await readYogaMotions();
    return NextResponse.json({ data }, { headers });
  } catch {
    return NextResponse.json({ error: '动作库暂时无法读取，请重试。' }, { status: 503, headers });
  }
}
