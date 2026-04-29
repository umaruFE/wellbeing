import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/ip-characters - Get IP characters
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await db
      .from('ip_characters')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching IP characters:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/ip-characters - Create IP character
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, gender, style, description, imageUrl } = body;

    const { data, error } = await db
      .from('ip_characters')
      .insert({
        name,
        gender,
        style,
        description,
        image_url: imageUrl
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating IP character:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

