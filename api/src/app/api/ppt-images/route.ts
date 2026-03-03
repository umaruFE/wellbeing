import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/ppt-images - Get PPT images
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    let query = db
      .from('ppt_images')
      .select(`
        *,
        category:ppt_categories(id, name, display_order)
      `, { count: 'exact' });

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching PPT images:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/ppt-images - Create PPT image
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, categoryId, imageUrl, tags } = body;

    const { data, error } = await db
      .from('ppt_images')
      .insert({
        name,
        category_id: categoryId,
        image_url: imageUrl,
        tags
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating PPT image:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

