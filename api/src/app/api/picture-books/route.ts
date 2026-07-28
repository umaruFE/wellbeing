import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { persistComfyImageUrl, persistComfyImagesInValue } from '@/lib/persistRemoteImage';

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS picture_books (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255),
      organization_id VARCHAR(255),
      title VARCHAR(500),
      status VARCHAR(50) DEFAULT 'draft',
      cover_url TEXT,
      book_data JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

// GET /api/picture-books
export async function GET(request: NextRequest) {
  try {
    await ensureTable();
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || '认证失败' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const filters: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (userId) {
      filters.push(`user_id = $${paramIndex++}`);
      params.push(userId);
    }
    if (status && status !== 'all') {
      filters.push(`status = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const countResult = await db.query(`SELECT COUNT(*)::int as count FROM picture_books ${whereClause}`, params);
    const total = parseInt(countResult.rows[0]?.count || '0');

    const result = await db.query(
      `SELECT * FROM picture_books ${whereClause} ORDER BY updated_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[picture-books] GET failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/picture-books
export async function POST(request: NextRequest) {
  try {
    await ensureTable();
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || '认证失败' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, organizationId, title, status, coverUrl, bookData } = body;
    const [persistedCoverUrl, persistedBookData] = await Promise.all([
      coverUrl ? persistComfyImageUrl(coverUrl, 'picture-book-images') : null,
      persistComfyImagesInValue(bookData || {}, 'picture-book-images'),
    ]);

    const result = await db.query(
      `INSERT INTO picture_books (user_id, organization_id, title, status, cover_url, book_data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
      [
        userId || authResult.user?.id || null,
        organizationId || authResult.user?.organizationId || null,
        title || 'Untitled Picture Book',
        status || 'draft',
        persistedCoverUrl,
        JSON.stringify(persistedBookData),
      ]
    );

    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[picture-books] POST failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
