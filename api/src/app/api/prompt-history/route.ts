import { v4 as uuidv4 } from 'uuid';

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
  
  const query = `INSERT INTO ${table} (${columns}) VALUES (${values}) RETURNING id`;
  
  try {
    const res = await dbClient.query(query, placeholders);
    return { data: res.rows[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
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
    query += ` LIMIT ${params.limit}`;
  }
  
  try {
    const res = await dbClient.query(query, placeholders);
    return { data: res.rows, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function POST(request: Request) {
  try {
    const { user_id, organization_id, prompt_type, original_prompt, generated_result, execution_time, success, error_message } = await request.json();

    // Handle user_id type conversion
    // If user_id is numeric or invalid, set to null to avoid foreign key constraint errors
    let processed_user_id = user_id;
    if (typeof user_id === 'number' || (typeof user_id === 'string' && !isNaN(user_id) && user_id !== '')) {
      // Numeric user_id - set to null since we don't have a real user record
      processed_user_id = null;
    }

    const { data, error } = await insert('prompt_history', {
      user_id: processed_user_id,
      organization_id,
      prompt_type,
      original_prompt,
      generated_result,
      execution_time,
      success,
      error_message
    });

    if (error) {
      console.error('Error saving prompt history:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ id: data.id }), { status: 201 });
  } catch (error) {
    console.error('Error in prompt history API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const prompt_type = searchParams.get('prompt_type');
    const limit = searchParams.get('limit') || '10';

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), { status: 400 });
    }

    // Handle user_id type conversion for GET requests
    let processed_user_id = user_id;
    if (!isNaN(user_id)) {
      // For numeric user_id, we'll need to handle it differently
      // Since we're generating UUIDs for numeric user_ids in POST, 
      // we'll need to adjust the filtering logic
      // For now, we'll just pass it as-is and let PostgreSQL handle it
    }

    const filters: any = { user_id: processed_user_id };
    if (prompt_type) {
      filters.prompt_type = prompt_type;
    }

    const { data, error } = await select('prompt_history', {
      filters,
      orderBy: 'created_at',
      ascending: false,
      limit: parseInt(limit)
    });

    if (error) {
      console.error('Error fetching prompt history:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error('Error in prompt history GET:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
