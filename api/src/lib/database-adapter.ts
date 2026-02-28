/**
 * 数据库适配器 - 仅使用 PostgreSQL
 * 提供统一的数据库操作接口
 */

import { db, closePool } from './db';

const databaseAdapter = {
  async insert(table: string, data: Record<string, unknown>) {
    const { data: result, error } = await db.from(table).insert(data).select('id').single();
    return { data: result, error };
  },

  async select(table: string, params: { filters?: Record<string, unknown>; orderBy?: string; ascending?: boolean; limit?: number } = {}) {
    let query = db.from(table).select('*');
    if (params.filters) {
      Object.entries(params.filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    if (params.orderBy) {
      query = query.order(params.orderBy, { ascending: params.ascending ?? false });
    }
    if (params.limit) {
      query = query.range(0, params.limit - 1);
    }
    const { data, error } = await query;
    return { data, error };
  },

  async update(table: string, id: string, data: Record<string, unknown>) {
    const { data: result, error } = await db.from(table).update(data).eq('id', id).single();
    return { data: result, error };
  },

  async delete(table: string, id: string) {
    const { error } = await db.from(table).delete().eq('id', id);
    return { data: null, error };
  },

  async query(sql: string, params: unknown[] = []) {
    try {
      const res = await db.query(sql, params);
      return { data: res.rows, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async close() {
    await closePool();
  },
};

export default databaseAdapter;
export { databaseAdapter as db };
