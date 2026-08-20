import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS song_writing_works (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      organization_id VARCHAR(255),
      title VARCHAR(500) NOT NULL,
      cover_url TEXT,
      work_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_song_writing_works_user_id
      ON song_writing_works(user_id);
  `);
}

export async function GET(request: NextRequest) {
  try {
    await ensureTable();
    const authResult = authenticate(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || '认证失败' }, { status: 401 });
    }
    const result = await db.query(
      'SELECT * FROM song_writing_works WHERE user_id = $1 ORDER BY updated_at DESC',
      [authResult.user.id],
    );
    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error('[song-writing-works] GET failed:', error);
    return NextResponse.json({ error: '歌曲作品加载失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTable();
    const authResult = authenticate(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || '认证失败' }, { status: 401 });
    }
    const { title, coverUrl, workData } = await request.json();
    const result = await db.query(
      `INSERT INTO song_writing_works (user_id, organization_id, title, cover_url, work_data)
       VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING *`,
      [authResult.user.id, authResult.user.organizationId, title || '未命名歌曲', coverUrl || '', JSON.stringify(workData || {})],
    );
    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[song-writing-works] POST failed:', error);
    return NextResponse.json({ error: '歌曲作品保存失败' }, { status: 500 });
  }
}
