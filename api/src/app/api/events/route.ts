import { NextRequest, NextResponse } from 'next/server';
import { recordEvents } from '@/lib/usage-tracking';
import { authenticate } from '@/lib/auth';

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
    const auth = authenticate(request);
    if (!auth.success || !auth.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    const rawEvents = Array.isArray(body?.events) ? body.events : [];

    if (!rawEvents.length) {
      return NextResponse.json({ success: false, error: 'events is required.' }, { status: 400 });
    }

    if (rawEvents.length > 20) {
      return NextResponse.json({ success: false, error: 'Too many events.' }, { status: 400 });
    }
    const events = rawEvents.filter(
      (e: any) => e && typeof e.action === 'string' && /^[a-z][a-z0-9_.-]{1,99}$/.test(e.action)
    );

    const accepted = await recordEvents(
      events.map((e: any) => ({
        userId: auth.user!.id,
        organizationId: auth.user!.organizationId,
        action: e.action,
        resourceType: typeof e.resourceType === 'string' ? e.resourceType.slice(0, 100) : 'web',
        resourceId: typeof e.resourceId === 'string' ? e.resourceId : null,
        // Never accept arbitrary text/PII/credentials from the browser into the training corpus.
        details: e.details && typeof e.details === 'object' && !Array.isArray(e.details)
          ? Object.fromEntries(Object.entries(e.details).filter(([key, value]) =>
              ['module', 'stage', 'source', 'status', 'durationMs', 'slideCount', 'revisionCount'].includes(key)
              && (typeof value === 'number' || typeof value === 'boolean' || (typeof value === 'string' && value.length <= 100))
            )) : {},
      }))
    );

    return NextResponse.json(
      { success: accepted === events.length, accepted },
      { status: accepted === events.length ? 200 : 503 }
    );
  } catch (error) {
    console.error('[events] failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record events.' },
      { status: 500 }
    );
  }
}
