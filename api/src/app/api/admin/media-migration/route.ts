import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import {
  inspectGpuImageMigration,
  finalizeGpuImageMigration,
  migrateGpuImagesToCurrentStorage,
} from '@/lib/gpuImageMigration';

export const dynamic = 'force-dynamic';
export const maxDuration = 900;

export const GET = requireRole(['super_admin'])(async () => {
  const result = await inspectGpuImageMigration();
  return NextResponse.json({ success: true, data: result });
});

export const POST = requireRole(['super_admin'])(async (request, user) => {
  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === 'finalize') {
      const entries = Object.entries(body.replacements || {}) as Array<[string, string]>;
      const result = await finalizeGpuImageMigration(entries, user.id);
      return NextResponse.json({ success: true, data: result });
    }
    const result = await migrateGpuImagesToCurrentStorage(user.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('[media-migration] GPU to FTP migration failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '旧图片迁移失败' },
      { status: 500 },
    );
  }
});
