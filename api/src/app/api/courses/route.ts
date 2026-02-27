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
  
  if (params.orderBy) {
    query += ` ORDER BY ${params.orderBy} ${params.ascending ? 'ASC' : 'DESC'}`;
  }
  
  if (params.limit) {
    query += ` LIMIT ${params.limit} OFFSET ${params.offset || 0}`;
  }
  
  try {
    const res = await dbClient.query(query, placeholders);
    return { data: res.rows, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Insert data function
async function insert(table, data) {
  if (dbError) {
    return { data: null, error: new Error(dbError) };
  }
  
  if (!dbClient) {
    return { data: null, error: new Error('Database client not initialized') };
  }
  
  const columns = Object.keys(data).join(', ');
  const values = Object.values(data).map((val, i) => `$${i + 1}`).join(', ');
  const placeholders = Object.values(data);
  
  const query = `INSERT INTO ${table} (${columns}) VALUES (${values}) RETURNING *`;
  
  try {
    const res = await dbClient.query(query, placeholders);
    return { data: res.rows[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Count records function
async function count(table, filters = {}) {
  if (dbError) {
    return { count: 0, error: new Error(dbError) };
  }
  
  if (!dbClient) {
    return { count: 0, error: new Error('Database client not initialized') };
  }
  
  let query = `SELECT COUNT(*) as count FROM ${table}`;
  const conditions = [];
  const placeholders = [];
  let paramIndex = 1;
  
  if (Object.keys(filters).length > 0) {
    Object.entries(filters).forEach(([key, value]) => {
      conditions.push(`${key} = $${paramIndex++}`);
      placeholders.push(value);
    });
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }
  }
  
  try {
    const res = await dbClient.query(query, placeholders);
    return { count: parseInt(res.rows[0].count), error: null };
  } catch (error) {
    return { count: 0, error };
  }
}

// GET /api/courses - Get courses list
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const isPublic = searchParams.get('public');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const filters = {};
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

    // Get courses
    const { data: courses, error: coursesError } = await select('courses', {
      filters,
      orderBy: 'created_at',
      ascending: false,
      limit,
      offset
    });

    if (coursesError) {
      return NextResponse.json(
        { error: coursesError.message },
        { status: 500 }
      );
    }

    // Get total count
    const { count: total, error: countError } = await count('courses', filters);

    if (countError) {
      return NextResponse.json(
        { error: countError.message },
        { status: 500 }
      );
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
      isPublic
    } = body;

    // Handle userId type conversion
    // If userId is numeric or invalid, set to null to avoid foreign key constraint errors
    let processed_user_id = userId;
    if (typeof userId === 'number' || (typeof userId === 'string' && !isNaN(userId) && userId !== '')) {
      // Numeric userId - set to null since we don't have a real user record
      processed_user_id = null;
    }

    const courseData = {
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await insert('courses', courseData);

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

