import { NextRequest, NextResponse } from 'next/server';
import { recordEvents } from '@/lib/usage-tracking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 前端使用习惯埋点上报接口
 *
 * POST /api/events
 * body: {
 *   userId?: string,
 *   organizationId?: string,
 *   events: [{ action, resourceType?, resourceId?, details? }]  // 单次上限 20 条
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, organizationId } = body || {};
    const rawEvents = Array.isArray(body?.events) ? body.events : [];

    if (!rawEvents.length) {
      return NextResponse.json({ success: false, error: 'events is required.' }, { status: 400 });
    }

    const events = rawEvents.slice(0, 20).filter(
      (e: any) => e && typeof e.action === 'string' && e.action.length <= 100
    );

    await recordEvents(
      events.map((e: any) => ({
        userId: userId || null,
        organizationId: organizationId || null,
        action: e.action,
        resourceType: e.resourceType || 'web',
        resourceId: e.resourceId || null,
        details: e.details || {},
      }))
    );

    return NextResponse.json({ success: true, accepted: events.length });
  } catch (error) {
    console.error('[events] failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record events.' },
      { status: 500 }
    );
  }
}
