import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

async function ensureAudioAssetsTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS audio_assets (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      audio_url text NOT NULL,
      duration text NULL,
      tags text[] NULL,
      description text NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS audio_assets_created_idx ON audio_assets(created_at DESC);
  `);
}

export async function GET(request: NextRequest) {
  try {
    await ensureAudioAssetsTable();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.max(1, Math.min(100, Number(searchParams.get('limit') || 20)));
    const search = searchParams.get('search')?.trim();
    const offset = (page - 1) * limit;

    const params: any[] = [];
    let where = '';
    if (search) {
      params.push(`%${search}%`);
      where = 'WHERE name ILIKE $1 OR description ILIKE $1';
    }

    const countResult = await db.query(`SELECT COUNT(*)::int AS count FROM audio_assets ${where}`, params);
    const dataResult = await db.query(`
      SELECT *
      FROM audio_assets
      ${where}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);

    const total = countResult.rows[0]?.count || 0;
    return NextResponse.json({
      success: true,
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error in GET /api/audio-assets:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureAudioAssetsTable();
    const body = await request.json();
    const { name, audioUrl, audio_url, duration, tags, description } = body;
    const url = audio_url || audioUrl;

    if (!name || !url) {
      return NextResponse.json(
        { success: false, error: 'name and audioUrl are required' },
        { status: 400 }
      );
    }

    const { rows } = await db.query(`
      INSERT INTO audio_assets (id, name, audio_url, duration, tags, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      randomUUID(),
      name,
      url,
      duration || null,
      Array.isArray(tags) ? tags : null,
      description || null,
    ]);

    return NextResponse.json({ success: true, data: rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/audio-assets:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
