// Database client configuration
const dbType = process.env.DB_TYPE || 'postgres';
let dbClient;
let dbError = null;

if (dbType === 'supabase') {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    dbClient = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    dbError = `Supabase client initialization error: ${error.message}`;
    console.error(dbError);
  }
} else {
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
}

// Insert data function
async function insert(table, data) {
  if (dbError) {
    return { data: null, error: new Error(dbError) };
  }
  
  if (!dbClient) {
    return { data: null, error: new Error('Database client not initialized') };
  }
  
  if (dbType === 'supabase') {
    try {
      return await dbClient
        .from(table)
        .insert(data)
        .select('id')
        .single();
    } catch (error) {
      return { data: null, error };
    }
  } else {
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
}

// Select data function
async function select(table, params = {}) {
  if (dbError) {
    return { data: null, error: new Error(dbError) };
  }
  
  if (!dbClient) {
    return { data: null, error: new Error('Database client not initialized') };
  }
  
  if (dbType === 'supabase') {
    try {
      let query = dbClient.from(table).select('*');
      
      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }
      
      if (params.orderBy) {
        query = query.order(params.orderBy, { ascending: params.ascending || false });
      }
      
      if (params.limit) {
        query = query.limit(params.limit);
      }
      
      return await query;
    } catch (error) {
      return { data: null, error };
    }
  } else {
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
}

export async function POST(request: Request) {
  try {
    const { user_id, element_type, original_prompt, optimized_prompt, improvement_score } = await request.json();

    // Handle user_id type conversion
    let processed_user_id = user_id;
    if (typeof user_id === 'number' || (typeof user_id === 'string' && !isNaN(user_id))) {
      // Generate a UUID for numeric user_id
      const { v4: uuidv4 } = require('uuid');
      processed_user_id = uuidv4();
    }

    const { data, error } = await insert('prompt_optimizations', {
      user_id: processed_user_id,
      element_type,
      original_prompt,
      optimized_prompt,
      improvement_score,
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.error('Error saving prompt optimization:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ id: data.id }), { status: 201 });
  } catch (error) {
    console.error('Error in prompt optimization API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const element_type = searchParams.get('element_type');

    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id is required' }), { status: 400 });
    }

    const filters: any = { user_id };
    if (element_type) {
      filters.element_type = element_type;
    }

    const { data, error } = await select('prompt_optimizations', {
      filters,
      orderBy: 'usage_count',
      ascending: false
    });

    if (error) {
      console.error('Error fetching prompt optimizations:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error('Error in prompt optimization GET:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, improvement_score } = await request.json();
    // 暂时不实现更新功能，因为需要在 supabase.ts 中添加 update 方法
    return new Response(JSON.stringify({ id }), { status: 200 });
  } catch (error) {
    console.error('Error in prompt optimization PUT:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
