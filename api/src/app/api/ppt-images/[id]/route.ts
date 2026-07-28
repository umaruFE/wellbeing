import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { db } from '@/lib/db';

// PUT /api/ppt-images/[id] - Update a PPT image record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const updates: string[] = ['updated_at = NOW()'];
    const values: unknown[] = [];

    if (body.name !== undefined) {
      values.push(body.name);
      updates.push(`name = $${values.length}`);
    }
    if (body.categoryId !== undefined) {
      values.push(body.categoryId);
      updates.push(`category_id = $${values.length}`);
    }
    if (body.imageUrl !== undefined) {
      values.push(body.imageUrl);
      updates.push(`image_url = $${values.length}`);
    }
    if (body.tags !== undefined) {
      values.push(body.tags);
      updates.push(`tags = $${values.length}`);
    }

    values.push(params.id);
    const result = await db.query(
      `UPDATE ppt_images SET ${updates.join(', ')}
       WHERE id = $${values.length}
       RETURNING *`,
      values,
    );
    if (!result.rows.length) {
      return NextResponse.json({ error: 'PPT image not found' }, { status: 404 });
    }
    return NextResponse.json({ data: result.rows[0] });
  } catch (error) {
    console.error('[ppt-images] PUT failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
