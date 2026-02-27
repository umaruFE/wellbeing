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
  
  const setClause = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(', ');
  const values = Object.values(data);
  
  const conditions = [];
  let paramIndex = values.length + 1;
  Object.entries(filters).forEach(([key, value]) => {
    conditions.push(`${key} = $${paramIndex++}`);
    values.push(value);
  });
  
  const query = `UPDATE ${table} SET ${setClause} WHERE ${conditions.join(' AND ')} RETURNING *`;
  
  try {
    const res = await dbClient.query(query, values);
    return { data: res.rows[0], error: null };
  } catch (error) {
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

    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };

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

