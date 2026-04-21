import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Ensure course_data column exists
async function ensureCourseDataColumn() {
  try {
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'courses' 
      AND column_name IN ('course_data', 'canvas_data', 'reading_materials_data')
    `;
    const result = await db.query(checkColumnQuery);
    
    const existingColumns = result.rows.map(row => row.column_name);
    
    if (!existingColumns.includes('course_data')) {
      console.log('Adding course_data column to courses table...');
      await db.query('ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_data JSONB');
      console.log('course_data column added successfully');
    }
    
    if (!existingColumns.includes('canvas_data')) {
      console.log('Adding canvas_data column to courses table...');
      await db.query('ALTER TABLE courses ADD COLUMN IF NOT EXISTS canvas_data JSONB DEFAULT \'{}\'::jsonb');
      console.log('canvas_data column added successfully');
    }
    
    if (!existingColumns.includes('reading_materials_data')) {
      console.log('Adding reading_materials_data column to courses table...');
      await db.query('ALTER TABLE courses ADD COLUMN IF NOT EXISTS reading_materials_data JSONB DEFAULT \'{}\'::jsonb');
      console.log('reading_materials_data column added successfully');
    }
  } catch (error) {
    console.error('Error ensuring columns:', error);
  }
}

// Initialize column on startup
ensureCourseDataColumn();

// GET /api/courses/[id] - Get single course
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data, error } = await db.from('courses').select('*', { count: 'exact' }).eq('id', id);

    if (error) {
      console.error('Error fetching course:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const course = data[0];

    return NextResponse.json({ data: course });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/courses/[id] - Update course
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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
      status,
      courseData,
      canvasData,
      readingMaterialsData,
    } = body;

    let processed_user_id = userId;
    if (
      typeof userId === 'number' ||
      (typeof userId === 'string' && !isNaN(userId) && userId !== '')
    ) {
      processed_user_id = null;
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (typeof processed_user_id !== 'undefined') {
      updateData.user_id = processed_user_id;
    }
    if (typeof organizationId !== 'undefined') {
      updateData.organization_id = organizationId;
    }
    if (typeof title !== 'undefined') updateData.title = title;
    if (typeof description !== 'undefined') updateData.description = description;
    if (typeof ageGroup !== 'undefined') updateData.age_group = ageGroup;
    if (typeof unit !== 'undefined') updateData.unit = unit;
    if (typeof duration !== 'undefined') updateData.duration = duration;
    if (typeof theme !== 'undefined') updateData.theme = theme;
    if (typeof keywords !== 'undefined') updateData.keywords = keywords;
    if (typeof isPublic !== 'undefined') updateData.is_public = isPublic;
    if (typeof status !== 'undefined') updateData.status = status;
    if (typeof courseData !== 'undefined') {
      updateData.course_data = courseData;
    }
    
    if (typeof canvasData !== 'undefined') {
      updateData.canvas_data = canvasData;
    }
    
    if (typeof readingMaterialsData !== 'undefined') {
      updateData.reading_materials_data = readingMaterialsData;
    }

    const { data, error } = await db.from('courses').update(updateData).eq('id', id).select().single();

    if (error) {
      console.error('Error updating course:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/courses/[id] - Delete course
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { error } = await db.from('courses').delete().eq('id', id);

    if (error) {
      console.error('Error deleting course:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

