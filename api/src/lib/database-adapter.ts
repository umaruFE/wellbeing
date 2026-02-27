// Database adapter to handle both Supabase and local PostgreSQL
// This provides a unified interface for database operations

import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

const dbType = process.env.DB_TYPE || 'postgres';

class DatabaseAdapter {
  client: any;
  type: string;

  constructor() {
    if (dbType === 'supabase') {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      this.client = createClient(supabaseUrl, supabaseAnonKey);
      this.type = 'supabase';
    } else {
      this.client = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'wellbeing',
        user: process.env.DB_USER || 'wellbeing_user',
        password: process.env.DB_PASSWORD || 'your_password',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
      this.type = 'postgres';
    }
  }

  // Insert data
  async insert(table: string, data: any) {
    if (this.type === 'supabase') {
      const { data: result, error } = await this.client
        .from(table)
        .insert(data)
        .select('id')
        .single();
      return { data: result, error };
    } else {
      // Generate SQL for PostgreSQL
      const columns = Object.keys(data).join(', ');
      const values = Object.values(data).map((val, i) => `$${i + 1}`).join(', ');
      const placeholders = Object.values(data);
      
      const query = `INSERT INTO ${table} (${columns}) VALUES (${values}) RETURNING id`;
      
      try {
        const res = await this.client.query(query, placeholders);
        return { data: res.rows[0], error: null };
      } catch (error) {
        return { data: null, error };
      }
    }
  }

  // Select data
  async select(table: string, params: any = {}) {
    if (this.type === 'supabase') {
      let query = this.client.from(table).select('*');
      
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
      
      const { data, error } = await query;
      return { data, error };
    } else {
      // Generate SQL for PostgreSQL
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
        const res = await this.client.query(query, placeholders);
        return { data: res.rows, error: null };
      } catch (error) {
        return { data: null, error };
      }
    }
  }

  // Update data
  async update(table: string, id: string, data: any) {
    if (this.type === 'supabase') {
      const { data: result, error } = await this.client
        .from(table)
        .update(data)
        .eq('id', id)
        .select('id')
        .single();
      return { data: result, error };
    } else {
      // Generate SQL for PostgreSQL
      const updates = Object.entries(data).map(([key, val], i) => `${key} = $${i + 1}`).join(', ');
      const placeholders = [...Object.values(data), id];
      
      const query = `UPDATE ${table} SET ${updates} WHERE id = $${placeholders.length} RETURNING id`;
      
      try {
        const res = await this.client.query(query, placeholders);
        return { data: res.rows[0], error: null };
      } catch (error) {
        return { data: null, error };
      }
    }
  }

  // Delete data
  async delete(table: string, id: string) {
    if (this.type === 'supabase') {
      const { data, error } = await this.client
        .from(table)
        .delete()
        .eq('id', id);
      return { data, error };
    } else {
      const query = `DELETE FROM ${table} WHERE id = $1`;
      
      try {
        const res = await this.client.query(query, [id]);
        return { data: { deleted: res.rowCount > 0 }, error: null };
      } catch (error) {
        return { data: null, error };
      }
    }
  }

  // Raw SQL query
  async query(sql: string, params: any[] = []) {
    if (this.type === 'supabase') {
      // Supabase doesn't support raw SQL in the free tier
      console.warn('Raw SQL queries are not supported in Supabase mode');
      return { data: [], error: null };
    } else {
      try {
        const res = await this.client.query(sql, params);
        return { data: res.rows, error: null };
      } catch (error) {
        return { data: null, error };
      }
    }
  }

  // Close connection
  async close() {
    if (this.type === 'postgres') {
      await this.client.end();
    }
    // Supabase client doesn't need explicit closing
  }
}

// Create and export singleton instance
const db = new DatabaseAdapter();
export default db;
export { db };
