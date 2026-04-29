import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/textbooks/images - Get textbook images for a unit
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unitId = searchParams.get('unitId');

    if (!unitId) {
      return NextResponse.json(
        { error: '缺少单元ID' },
        { status: 400 }
      );
    }

    const { data, error } = await db
      .from('textbook_images')
      .select('*')
      .eq('unit_id', unitId)
      .order('page_number', { ascending: true });

    if (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching textbook images:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/textbooks/images - Create textbook image
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { unitId, imageUrl, pageNumber, description } = body;

    const { data, error } = await db
      .from('textbook_images')
      .insert({
        unit_id: unitId,
        image_url: imageUrl,
        page_number: pageNumber,
        description
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating textbook image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

