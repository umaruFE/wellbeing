import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

// PUT /api/song-library/[id] - Update a song
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
    let paramIndex = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(body.name);
    }
    if (body.melodyType !== undefined) {
      updates.push(`melody_type = $${paramIndex++}`);
      values.push(body.melodyType);
    }
    if (body.vocalUrl !== undefined) {
      updates.push(`vocal_url = $${paramIndex++}`);
      values.push(body.vocalUrl);
    }
    if (body.instrumentalUrl !== undefined) {
      updates.push(`instrumental_url = $${paramIndex++}`);
      values.push(body.instrumentalUrl);
    }
    if (body.lyrics !== undefined) {
      updates.push(`lyrics = $${paramIndex++}`);
      values.push(body.lyrics);
    }
    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(body.description);
    }

    values.push(params.id);
    const result = await db.query(
      `UPDATE song_library SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values,
    );

    if (!result.rows.length) {
      return NextResponse.json({ error: 'Song not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result.rows[0] });
  } catch (error) {
    console.error('[song-library] PUT failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/song-library/[id] - Delete a song
export async function DELETE(
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

    await db.query('DELETE FROM song_library WHERE id = $1', [params.id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[song-library] DELETE failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
