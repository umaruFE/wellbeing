/**
 * 数据库客户端 - 已完全迁移到 PostgreSQL
 * 此文件保留以兼容现有 import，实际使用 db.ts 中的 PostgreSQL 客户端
 */

import { db, createServerClient, closePool } from './db';

export const supabase = db;
export { db, createServerClient, closePool };
export const createServerSupabaseClient = () => db;
export default db;
