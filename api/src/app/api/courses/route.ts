import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServerSupabaseClient } from '@/lib/supabase';

// GET /api/courses - Get courses list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const isPublic = searchParams.get('public');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let query = supabase
      .from('courses')
      .select(`
        *,
        user:users(id, name),
        slides:course_slides(count)
      `, { count: 'exact' });

    // Filter by user
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Filter by status
    if (status) {
      query = query.eq('status', status);
    }

    // Filter public courses
    if (isPublic === 'true') {
      query = query.eq('is_public', true);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
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
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      organizationId, 
      title, 
      description,
      ageGroup,
      unit,
      duration,
      theme,
      keywords,
      isPublic
    } = body;

    const { data, error } = await supabase
      .from('courses')
      .insert({
        user_id: userId,
        organization_id: organizationId,
        title,
        description,
        age_group: ageGroup,
        unit,
        duration,
        theme,
        keywords,
        is_public: isPublic || false,
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

