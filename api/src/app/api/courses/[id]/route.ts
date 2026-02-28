import { NextRequest, NextResponse } from 'next/server';

// Database client configuration
let dbClient;
let dbError = null;

try {
  const { Pool } = require('pg');
  dbClient = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'wellbeing',
    user: process.env.DB_USER || 'wellbeing_user',
    password: process.env.DB_PASSWORD || 'your_password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
} catch (error) {
  dbError = `PostgreSQL client initialization error: ${error.message}`;
  console.error(dbError);
}

// Ensure course_data column exists
async function ensureCourseDataColumn() {
  try {
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'courses' 
      AND column_name = 'course_data'
    `;
    const result = await dbClient.query(checkColumnQuery);
    
    if (result.rows.length === 0) {
      console.log('Adding course_data column to courses table...');
      await dbClient.query('ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_data JSONB');
      console.log('course_data column added successfully');
    }
  } catch (error) {
    console.error('Error ensuring course_data column:', error);
  }
}

// Initialize column on startup
ensureCourseDataColumn();

// Select data function
async function select(table, params = {}) {
  if (dbError) {
    return { data: null, error: new Error(dbError) };
  }
  
  if (!dbClient) {
    return { data: null, error: new Error('Database client not initialized') };
  }
  
  let query = `SELECT * FROM ${table}`;
  const conditions = [];
  const placeholders = [];
  let paramIndex = 1;
  
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      conditions.push(`${key} = $${paramIndex++}`);
      placeholders.push(value);
    });
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
  }
  
  try {
    const res = await dbClient.query(query, placeholders);
    return { data: res.rows, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Update data function
async function update(table, data, filters) {
  if (dbError) {
    return { data: null, error: new Error(dbError) };
  }
  
  if (!dbClient) {
    return { data: null, error: new Error('Database client not initialized') };
  }
  
  const setClause = [];
  const values = [];
  let paramIndex = 1;
  
  Object.entries(data).forEach(([key, value]) => {
    // 如果是 JSONB 字段（以 _data 结尾），使用 JSON 格式
    if (key.endsWith('_data') && typeof value === 'string') {
      setClause.push(`${key} = $${paramIndex}::jsonb`);
      values.push(value);
    } else {
      setClause.push(`${key} = $${paramIndex}`);
      values.push(value);
    }
    paramIndex++;
  });
  
  const conditions = [];
  Object.entries(filters).forEach(([key, value]) => {
    conditions.push(`${key} = $${paramIndex++}`);
    values.push(value);
  });
  
  const query = `UPDATE ${table} SET ${setClause.join(', ')} WHERE ${conditions.join(' AND ')} RETURNING *`;
  
  try {
    console.log('Update query:', query);
    console.log('Update values:', values.map((v, i) => `$${i + 1} = ${typeof v === 'object' ? JSON.stringify(v).substring(0, 200) : v}`).join(', '));
    
    const res = await dbClient.query(query, values);
    return { data: res.rows[0], error: null };
  } catch (error) {
    console.error('Update error:', error.message);
    console.error('Error code:', error.code);
    console.error('Error detail:', error.detail);
    
    // 如果错误是列不存在，尝试跳过该列
    if (error.code === '42703') {
      console.log(`Column does not exist, retrying without it...`);
      
      // 找出不存在的列名
      const match = error.message.match(/column "(.+?)" of relation/);
      if (match && match[1]) {
        const invalidColumn = match[1];
        const newData = { ...data };
        delete newData[invalidColumn];
        
        // 递归调用，去掉无效列
        return update(table, newData, filters);
      }
    }
    
    return { data: null, error };
  }
}

// Delete data function
async function del(table, filters) {
  if (dbError) {
    return { success: false, error: new Error(dbError) };
  }
  
  if (!dbClient) {
    return { success: false, error: new Error('Database client not initialized') };
  }
  
  const conditions = [];
  const placeholders = [];
  let paramIndex = 1;
  
  Object.entries(filters).forEach(([key, value]) => {
    conditions.push(`${key} = $${paramIndex++}`);
    placeholders.push(value);
  });
  
  const query = `DELETE FROM ${table} WHERE ${conditions.join(' AND ')}`;
  
  try {
    await dbClient.query(query, placeholders);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
}

// GET /api/courses/[id] - Get single course
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const { data: courses, error } = await select('courses', {
      filters: { id }
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (courses.length === 0) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: courses[0] });
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

    // 只允许更新 courses 表中实际存在的字段，并做命名转换
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
    } = body;

    // 处理 userId（与创建接口保持一致逻辑）
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
      console.log('courseData type:', typeof courseData);
      console.log('courseData is array:', Array.isArray(courseData));
      console.log('courseData length:', Array.isArray(courseData) ? courseData.length : 'N/A');
      
      // 尝试序列化为 JSON 字符串
      try {
        const jsonString = JSON.stringify(courseData);
        console.log('JSON stringify successful, length:', jsonString.length);
        
        // 将 JSON 字符串传递给数据库，让 PostgreSQL 解析
        updateData.course_data = jsonString;
      } catch (error) {
        console.error('JSON stringify failed:', error);
        console.error('courseData sample:', JSON.stringify(courseData).substring(0, 500));
      }
    }

    const { data, error } = await update('courses', updateData, { id });

    if (error) {
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

    const { success, error } = await del('courses', { id });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

