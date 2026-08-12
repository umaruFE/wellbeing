import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

// GET /api/song-library - List all songs
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await db
      .from('song_library')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching songs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/song-library - Create a new song
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, melodyType, vocalUrl, instrumentalUrl, lyrics, description } = body;

    const validMelodyTypes = [
      'Edelweiss',
      'You Are My Sunshine',
      'Twinkle, Twinkle, Little Star',
      "If You're Happy and You Know It",
    ];

    if (!name || !melodyType) {
      return NextResponse.json(
        { error: 'name and melodyType are required' },
        { status: 400 }
      );
    }

    if (!validMelodyTypes.includes(melodyType)) {
      return NextResponse.json(
        { error: 'Invalid melodyType' },
        { status: 400 }
      );
    }

    const { data, error } = await db
      .from('song_library')
      .insert({
        name,
        melody_type: melodyType,
        vocal_url: vocalUrl,
        instrumental_url: instrumentalUrl,
        lyrics,
        description,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating song:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
