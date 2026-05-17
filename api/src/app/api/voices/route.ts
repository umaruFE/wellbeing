import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/voices - Get voice configurations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let query = db
      .from('voice_configs')
      .select('*')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching voice configs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/voices - Create voice configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, voiceType, speed, pitch, volume, isDefault } = body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await db
        .from('voice_configs')
        .update({ is_default: false })
        .eq('user_id', userId);
    }

    const { data, error } = await db
      .from('voice_configs')
      .insert({
        user_id: userId,
        name,
        voice_type: voiceType,
        speed: speed || 1.0,
        pitch: pitch || 1.0,
        volume: volume || 1.0,
        is_default: isDefault || false
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating voice config:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

