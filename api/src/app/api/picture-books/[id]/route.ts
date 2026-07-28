import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { persistComfyImageUrl, persistComfyImagesInValue } from '@/lib/persistRemoteImage';

// GET /api/picture-books/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || '认证失败' }, { status: 401 });
    }

    const { id } = params;
    const result = await db.query('SELECT * FROM picture_books WHERE id = $1', [id]);

    if (!result.rows.length) {
      return NextResponse.json({ error: 'Picture book not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result.rows[0] });
  } catch (error) {
    console.error('[picture-books] GET by id failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/picture-books/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || '认证失败' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { title, status, coverUrl, bookData } = body;

    const updates: string[] = ['updated_at = NOW()'];
    const values: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(title);
    }
    if (status !== undefined) {
      updates.push(`status = $${paramIndex++}`);
      values.push(status);
    }
    if (coverUrl !== undefined) {
      updates.push(`cover_url = $${paramIndex++}`);
      values.push(coverUrl
        ? await persistComfyImageUrl(coverUrl, 'picture-book-images')
        : coverUrl);
    }
    if (bookData !== undefined) {
      updates.push(`book_data = $${paramIndex++}`);
      const persistedBookData = await persistComfyImagesInValue(
        bookData,
        'picture-book-images',
      );
      values.push(JSON.stringify(persistedBookData));
    }

    values.push(id);
    const result = await db.query(
      `UPDATE picture_books SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (!result.rows.length) {
      return NextResponse.json({ error: 'Picture book not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result.rows[0] });
  } catch (error) {
    console.error('[picture-books] PUT failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/picture-books/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || '认证失败' }, { status: 401 });
    }

    const { id } = params;
    await db.query('DELETE FROM picture_books WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[picture-books] DELETE failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
