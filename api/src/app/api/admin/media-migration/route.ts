import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import {
  inspectGpuImageMigration,
  migrateGpuImagesToCurrentStorage,
} from '@/lib/gpuImageMigration';

export const dynamic = 'force-dynamic';
export const maxDuration = 900;

export const GET = requireRole(['super_admin'])(async () => {
  const result = await inspectGpuImageMigration();
  return NextResponse.json({ success: true, data: result });
});

export const POST = requireRole(['super_admin'])(async (_request, user) => {
  try {
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
