import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/courses - Get courses list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const isPublic = searchParams.get('public');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const filters: Record<string, any> = {};
    
    // Handle user_id type conversion - skip filtering for numeric user_id
    if (userId && !isNaN(userId)) {
      // Skip user_id filter for numeric IDs, return all courses
      console.log('Skipping user_id filter for numeric ID:', userId);
    } else if (userId) {
      filters.user_id = userId;
    }
    
    if (status) filters.status = status;
    if (isPublic === 'true') filters.is_public = true;

    // Pagination
    const offset = (page - 1) * limit;

    // Get courses using db client
    let courses;
    try {
      const result = await db.query(
        `SELECT * FROM courses 
         ${Object.keys(filters).length > 0 ? 'WHERE ' + Object.keys(filters).map((k, i) => `${k} = $${i + 1}`).join(' AND ') : ''} 
         ORDER BY created_at DESC 
         LIMIT $${Object.keys(filters).length + 1} OFFSET $${Object.keys(filters).length + 2}`,
        [...Object.values(filters), limit, offset]
      );
      courses = result.rows;
    } catch (coursesError) {
      console.error('Error fetching courses:', coursesError);
      return NextResponse.json(
        { error: coursesError.message },
        { status: 500 }
      );
    }

    // Get total count
    let total = 0;
    try {
      const countResult = await db.query(
        `SELECT COUNT(*) as count FROM courses 
         ${Object.keys(filters).length > 0 ? 'WHERE ' + Object.keys(filters).map((k, i) => `${k} = $${i + 1}`).join(' AND ') : ''}`,
        Object.values(filters)
      );
      total = parseInt(countResult.rows[0]?.count || '0');
    } catch (countError) {
      console.error('Error counting courses:', countError);
    }

    return NextResponse.json({
      data: courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
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
      isPublic,
      courseData
    } = body;

    // Handle userId type conversion
    let processed_user_id = userId;
    if (typeof userId === 'number' || (typeof userId === 'string' && !isNaN(userId) && userId !== '')) {
      processed_user_id = null;
    }

    const courseRecord = {
      user_id: processed_user_id,
      organization_id: organizationId,
      title,
      description,
      age_group: ageGroup,
      unit,
      duration,
      theme,
      keywords,
      is_public: isPublic || false,
      status: 'draft',
      course_data: courseData ? JSON.stringify(courseData) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await db.from('courses').insert(courseRecord).select().single();

    if (error) {
      console.error('Error creating course:', error);
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

