import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TABLE = 'picturebook_knowledge';

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ${TABLE} (
      id SERIAL PRIMARY KEY,
      document_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT 'general',
      age_range TEXT NOT NULL DEFAULT '',
      source_type TEXT NOT NULL DEFAULT 'text',
      filename TEXT NOT NULL DEFAULT '',
      oss_url TEXT NOT NULL DEFAULT '',
      chunk_count INTEGER NOT NULL DEFAULT 0,
      uploaded_by TEXT NOT NULL DEFAULT 'anonymous',
      uploader_name TEXT NOT NULL DEFAULT '',
      qdrant_collection TEXT NOT NULL DEFAULT 'picturebook_knowledge',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  try {
    await db.query(`ALTER TABLE ${TABLE} ADD COLUMN IF NOT EXISTS oss_url TEXT NOT NULL DEFAULT ''`);
  } catch {
    // ignore
  }
}

export async function GET(request: NextRequest) {
  try {
    await ensureTable();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    let where: string[] = [];
    let params: any[] = [];
    let idx = 1;

    if (category && category !== 'all') {
      where.push(`category = $${idx++}`);
      params.push(category);
    }
    if (search) {
      where.push(`(title ILIKE $${idx} OR filename ILIKE $${idx} OR uploader_name ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (page - 1) * pageSize;

    const countRes = await db.query(`SELECT COUNT(*)::int as c FROM ${TABLE} ${whereClause}`, params);
    const total = countRes.rows[0]?.c || 0;

    const listRes = await db.query(
      `SELECT * FROM ${TABLE} ${whereClause} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, pageSize, offset]
    );

    // 获取分类统计
    const catRes = await db.query(
      `SELECT category, COUNT(*)::int as count FROM ${TABLE} GROUP BY category ORDER BY count DESC`
    );

    return NextResponse.json({
      success: true,
      data: listRes.rows,
      total,
      page,
      pageSize,
      categories: catRes.rows,
    });
  } catch (error) {
    console.error('[rag/knowledge] GET failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch knowledge list.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTable();

    const body = await request.json();
    const {
      documentId,
      title,
      category = 'general',
      ageRange = '',
      sourceType = 'text',
      filename = '',
      chunkCount = 0,
      uploadedBy = 'anonymous',
      uploaderName = '',
      qdrantCollection = 'picturebook_knowledge',
    } = body;

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'documentId is required.' },
        { status: 400 }
      );
    }

    const res = await db.query(
      `INSERT INTO ${TABLE} (document_id, title, category, age_range, source_type, filename, chunk_count, uploaded_by, uploader_name, qdrant_collection)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (document_id) DO UPDATE SET
         title = EXCLUDED.title,
         category = EXCLUDED.category,
         age_range = EXCLUDED.age_range,
         source_type = EXCLUDED.source_type,
         filename = EXCLUDED.filename,
         chunk_count = EXCLUDED.chunk_count,
         uploader_name = EXCLUDED.uploader_name,
         updated_at = NOW()
       RETURNING *`,
      [documentId, title, category, ageRange, sourceType, filename, chunkCount, uploadedBy, uploaderName, qdrantCollection]
    );

    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (error) {
    console.error('[rag/knowledge] POST failed:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to save knowledge metadata.' },
      { status: 500 }
    );
  }
}
