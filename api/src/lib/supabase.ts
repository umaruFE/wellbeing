// Database client configuration based on DB_TYPE
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

const dbType = process.env.DB_TYPE || 'postgres';

// Common interface for database operations
let supabase;
let db;
let query;
let createServerClient;
let closePool;
let insert;
let select;

if (dbType === 'supabase') {
  // Supabase client configuration
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  // Create Supabase client
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  db = supabase;
  
  // Server-side client with service role key (for admin operations)
  createServerClient = () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  };
  
  // Supabase query wrapper
  query = async (text: string, params: any[]) => {
    // For Supabase, we would use the client methods
    // This is a simplified wrapper
    console.log('Supabase query:', text, params);
    // In a real implementation, you would map SQL to Supabase methods
    return { rows: [], rowCount: 0 };
  };
  
  // Supabase-specific methods
  insert = async (table: string, data: any) => {
    return await supabase
      .from(table)
      .insert(data)
      .select('id')
      .single();
  };
  
  select = async (table: string, params: any = {}) => {
    let query = supabase.from(table).select('*');
    
    // Apply filters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    // Apply ordering
    if (params.orderBy) {
      query = query.order(params.orderBy, { ascending: params.ascending || false });
    }
    
    // Apply limit
    if (params.limit) {
      query = query.limit(params.limit);
    }
    
    return await query;
  };
  
  closePool = async () => {
    // Supabase client doesn't need explicit closing
    console.log('Supabase client closed');
  };
} else {
  // Local PostgreSQL client configuration
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'wellbeing',
    user: process.env.DB_USER || 'wellbeing_user',
    password: process.env.DB_PASSWORD || 'your_password',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
  
  db = pool;
  
  // Helper function to execute queries
  query = async (text: string, params: any[]) => {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  };
  
  // Server-side client (for admin operations)
  createServerClient = () => {
    return pool;
  };
  
  // PostgreSQL-specific methods
  insert = async (table: string, data: any) => {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data).map((val, i) => `$${i + 1}`).join(', ');
    const placeholders = Object.values(data);
    
    const query = `INSERT INTO ${table} (${columns}) VALUES (${values}) RETURNING id`;
    
    try {
      const res = await pool.query(query, placeholders);
      return { data: res.rows[0], error: null };
    } catch (error) {
      return { data: null, error };
    }
  };
  
  select = async (table: string, params: any = {}) => {
    let query = `SELECT * FROM ${table}`;
    const conditions: string[] = [];
    const placeholders: any[] = [];
    let paramIndex = 1;
    
    // Apply filters
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        conditions.push(`${key} = $${paramIndex++}`);
        placeholders.push(value);
      });
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
    }
    
    // Apply ordering
    if (params.orderBy) {
      query += ` ORDER BY ${params.orderBy} ${params.ascending ? 'ASC' : 'DESC'}`;
    }
    
    // Apply limit
    if (params.limit) {
      query += ` LIMIT ${params.limit}`;
    }
    
    try {
      const res = await pool.query(query, placeholders);
      return { data: res.rows, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };
  
  // Close pool when application shuts down
  closePool = async () => {
    await pool.end();
  };
}

// Export database client and methods
export { supabase, db, query, createServerClient, closePool, insert, select };
export default supabase;

