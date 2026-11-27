import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { persistComfyImagesInValue } from '@/lib/persistRemoteImage';

// GET /api/courses - Get courses list
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/courses - 开始认证');
    const authResult = await authenticate(request);
    console.log('GET /api/courses - 认证结果:', authResult.success ? '成功' : '失败', authResult.error || '');
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const library = searchParams.get('view') === 'library';
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1') || 1);
    const limit = Math.max(1, Number.parseInt(searchParams.get('limit') || '10') || 10);
    const conditions: string[] = [];
    const values: (string | number)[] = [];
    const where = () => conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    if (userId) conditions.push(`user_id = $${values.push(userId)}`);
    if (searchParams.get('public') === 'true') conditions.push('is_public IS TRUE');

    // Tab totals describe the entire visible catalogue, including later pages.
    let counts;
    if (library) {
      const result = await db.query(
        `SELECT count(*)::int AS all, count(*) FILTER (WHERE status IS DISTINCT FROM 'published')::int AS draft,
                count(*) FILTER (WHERE status='published')::int AS published FROM courses ${where()}`, values);
      counts = result.rows[0];
    }
    if (library && status === 'draft') conditions.push("status IS DISTINCT FROM 'published'");
    else if (status) conditions.push(`status = $${values.push(status)}`);
    const search = library && searchParams.get('search')?.trim();
    if (search) {
      conditions.push(`strpos(lower(concat_ws(' ', title, unit, theme, course_data->>'grade', course_data->>'theme',
        course_data #>> '{courseOverview,courseTitle}', course_data #>> '{courseOverview,courseOverview,courseTitle}',
        course_data #>> '{overview,courseTitle}', course_data #>> '{courseOverview,text}')), lower($${values.push(search)})) > 0`);
    }
    const total = counts && !search ? counts[status || 'all'] : undefined;
    const count = typeof total === 'number' ? total : (await db.query(`SELECT count(*)::int AS total FROM courses ${where()}`, values)).rows[0].total;
    const result = await db.query(
      `SELECT * FROM courses ${where()} ORDER BY created_at DESC, id DESC LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, (page - 1) * limit],
    );
    return NextResponse.json({
      data: result.rows,
      ...(library ? { counts } : {}),
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
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
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401 }
      );
    }

    const user = authResult.user;
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
    if (typeof userId === 'string' && !isNaN(Number(userId)) && userId !== '') {
      processed_user_id = Number(userId);
    }

    const persistedCourseData = courseData === undefined
      ? undefined
      : await persistComfyImagesInValue(courseData, 'course-images');

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
      course_data: persistedCourseData ? JSON.stringify(persistedCourseData) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await db.from('courses').insert(courseRecord).select().single();

    if (error) {
      console.error('Error creating course:', error);
      return NextResponse.json(
        { error: (error as Error).message },
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
