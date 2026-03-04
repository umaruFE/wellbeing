/**
 * PostgreSQL 数据库客户端 - 提供 Supabase 风格的链式 API
 * 完全移除 Supabase 依赖，仅使用 PostgreSQL
 */

import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'wellbeing',
  user: process.env.DB_USER || 'wellbeing_user',
  password: process.env.DB_PASSWORD || 'your_password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  maxUses: 7500,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('connect', () => {
  console.log('New client connected to PostgreSQL');
});

pool.on('remove', () => {
  console.log('Client removed from pool');
});

interface QueryState {
  table: string;
  selectColumns: string;
  countExact: boolean;
  whereConditions: { type: 'eq' | 'in' | 'or' | 'ilike'; column?: string; value?: any; values?: any[] }[];
  orderBy?: { column: string; ascending: boolean };
  rangeFrom?: number;
  rangeTo?: number;
}

function createQueryBuilder(table: string) {
  const state: QueryState = {
    table,
    selectColumns: '*',
    countExact: false,
    whereConditions: [],
  };

  const builder = {
    select(columns: string = '*', options?: { count?: 'exact' }) {
      state.selectColumns = columns;
      state.countExact = options?.count === 'exact';
      return builder;
    },

    eq(column: string, value: any) {
      state.whereConditions.push({ type: 'eq', column, value });
      return builder;
    },

    in(column: string, values: any[]) {
      state.whereConditions.push({ type: 'in', column, values });
      return builder;
    },

    or(filter: string) {
      // 解析 name.ilike.%x%,username.ilike.%x% 格式
      state.whereConditions.push({ type: 'or', value: filter });
      return builder;
    },

    ilike(column: string, pattern: string) {
      state.whereConditions.push({ type: 'ilike', column, value: pattern });
      return builder;
    },

    order(column: string, options?: { ascending?: boolean }) {
      state.orderBy = { column, ascending: options?.ascending ?? true };
      return builder;
    },

    range(from: number, to: number) {
      state.rangeFrom = from;
      state.rangeTo = to;
      return builder;
    },

    // Return a promise that executes the query
    then(onFulfilled?: any, onRejected?: any) {
      return executeSelect(state).then(onFulfilled, onRejected);
    },
  };

  return builder;
}

async function executeSelect(state: QueryState): Promise<{ data: any[]; error: any; count: number | null }> {
  const params: any[] = [];
  let paramIndex = 1;

  // 解析 select 中的关联查询，如 *, category:ppt_categories(*)
  const hasJoins = state.selectColumns.includes(':') && state.selectColumns.includes('(*)');
  let mainTable = state.table;
  let selectClause = state.selectColumns;

  if (hasJoins) {
    // 简化处理：提取主表字段和关联
    const parts = state.selectColumns.split(',').map((p) => p.trim());
    const mainParts: string[] = [];
    const joins: { alias: string; table: string; fkColumn: string }[] = [];

    for (const part of parts) {
      const match = part.match(/(\w+):(\w+)\(\*\)/);
      if (match) {
        const [, alias, refTable] = match;
        const fkMap: Record<string, string> = {
          'ppt_categories': 'category_id',
          'textbook_types': 'textbook_type_id',
          'grades': 'grade_id',
          'textbook_images': 'unit_id',
          'organizations': 'organization_id',
        };
        const fkColumn = fkMap[refTable] || `${refTable.replace(/s$/, '')}_id`;
        joins.push({ alias, table: refTable, fkColumn });
      } else if (part === '*') {
        mainParts.push(`${mainTable}.*`);
      }
    }

    if (joins.length > 0) {
      const joinClauses = joins.map((j) => `LEFT JOIN ${j.table} AS ${j.alias} ON ${mainTable}.${j.fkColumn} = ${j.alias}.id`);
      selectClause = `${mainTable}.*, ${joins.map((j) => `${j.alias}.*`).join(', ')}`;
      mainTable = `${mainTable} ${joinClauses.join(' ')}`;
    }
  } else {
    selectClause = state.selectColumns.replace(/\s+/g, ' ').trim();
    if (selectClause.includes(':')) {
      // 复杂 join 如 textbook_type:textbook_types(*), grade:grades(*), images:textbook_images(*)
      const fkMap: Record<string, string> = {
        textbook_types: 'textbook_type_id',
        grades: 'grade_id',
        textbook_images: 'textbook_units.id', // textbook_images.unit_id
      };
      const parts = selectClause.split(',').map((p) => p.trim());
      const selectParts: string[] = [`${state.table}.*`];
      const joinParts: string[] = [];

      for (const part of parts) {
        const m = part.match(/(\w+):(\w+)\(\*\)/);
        if (m) {
          const [, alias, refTable] = m;
          const fk = fkMap[refTable];
          if (fk) {
            const [tbl, col] = fk.includes('.') ? fk.split('.') : [state.table, fk];
            joinParts.push(`LEFT JOIN ${refTable} ${alias} ON ${state.table}.${col} = ${alias}.id`);
            selectParts.push(`row_to_json(${alias}.*) as ${alias}`);
          }
        }
      }
      // 简化：直接多表 join
      selectClause = `${state.table}.*`;
      if (joinParts.length > 0) {
        mainTable = `${state.table} ${joinParts.join(' ')}`;
      }
    }
  }

  let sql = `SELECT ${selectClause} FROM ${mainTable}`;
  let countSql = state.countExact ? `SELECT COUNT(*)::int FROM ${state.table}` : null;

  // WHERE
  const whereParts: string[] = [];
  for (const cond of state.whereConditions) {
    if (cond.type === 'eq' && cond.column && cond.value !== undefined) {
      whereParts.push(`${cond.column} = $${paramIndex++}`);
      params.push(cond.value);
    } else if (cond.type === 'in' && cond.column && cond.values) {
      const placeholders = cond.values.map(() => `$${paramIndex++}`).join(', ');
      whereParts.push(`${cond.column} IN (${placeholders})`);
      params.push(...cond.values);
    } else if (cond.type === 'ilike' && cond.column && cond.value) {
      whereParts.push(`${cond.column} ILIKE $${paramIndex++}`);
      params.push(cond.value);
    } else if (cond.type === 'or' && cond.value) {
      // 解析 name.ilike.%search%,username.ilike.%search% 格式
      const orFilter = cond.value as string;
      const orParts = orFilter.split(',').map((o) => o.trim());
      const searchMatch = orFilter.match(/%([^%]+)%/);
      const searchVal = searchMatch ? `%${searchMatch[1]}%` : '%';
      const orConds = orParts.map((p) => {
        const colMatch = p.match(/^(\w+)\./);
        return colMatch ? `${colMatch[1]} ILIKE $${paramIndex++}` : '';
      }).filter(Boolean);
      if (orConds.length > 0) {
        whereParts.push(`(${orConds.join(' OR ')})`);
        orConds.forEach(() => params.push(searchVal));
      }
    }
  }

  if (whereParts.length > 0) {
    sql += ` WHERE ${whereParts.join(' AND ')}`;
    if (countSql) {
      countSql = countSql + ` WHERE ${whereParts.join(' AND ')}`;
    }
  }

  // ORDER
  if (state.orderBy) {
    sql += ` ORDER BY ${state.orderBy.column} ${state.orderBy.ascending ? 'ASC' : 'DESC'}`;
  }

  // RANGE -> LIMIT OFFSET
  if (state.rangeFrom !== undefined && state.rangeTo !== undefined) {
    const limit = state.rangeTo - state.rangeFrom + 1;
    const offset = state.rangeFrom;
    sql += ` LIMIT ${limit} OFFSET ${offset}`;
  }

  try {
    let count: number | null = null;
    if (state.countExact) {
      let cs = `SELECT COUNT(*)::int as c FROM ${state.table}`;
      if (whereParts.length > 0) {
        cs += ` WHERE ${whereParts.join(' AND ')}`;
      }
      const countRes = await pool.query(cs, params);
      count = parseInt(countRes.rows[0]?.c || '0');
    }

    const res = await pool.query(sql, params);
    return { data: res.rows, error: null, count };
  } catch (err) {
    return { data: null, error: err, count: null };
  }
}

// Insert builder - 支持 .insert().select().single() 链式调用
function createInsertBuilder(table: string) {
  return {
    insert(data: Record<string, any>) {
      const runInsert = async () => {
        const cols = Object.keys(data).join(', ');
        const placeholders = Object.values(data).map((_, i) => `$${i + 1}`).join(', ');
        const sql = `INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING *`;
        try {
          const res = await pool.query(sql, Object.values(data));
          return { data: res.rows[0], error: null };
        } catch (err) {
          return { data: null, error: err };
        }
      };
      return {
        select: () => ({ single: runInsert }),
        single: runInsert,
      };
    },
  };
}

// Update builder
function createUpdateBuilder(table: string) {
  let updateData: Record<string, any> = {};
  let eqColumn: string | null = null;
  let eqValue: any = null;

  return {
    update(data: Record<string, any>) {
      updateData = data;
      return {
        eq(column: string, value: any) {
          eqColumn = column;
          eqValue = value;
          return {
            async select() {
              const sets = Object.keys(updateData).map((k, i) => `${k} = $${i + 1}`);
              const params = [...Object.values(updateData), eqValue];
              const sql = `UPDATE ${table} SET ${sets.join(', ')} WHERE ${eqColumn} = $${params.length} RETURNING *`;
              try {
                const res = await pool.query(sql, params);
                return { data: res.rows[0], error: null };
              } catch (err) {
                return { data: null, error: err };
              }
            },
            async single() {
              const sets = Object.keys(updateData).map((k, i) => `${k} = $${i + 1}`);
              const params = [...Object.values(updateData), eqValue];
              const sql = `UPDATE ${table} SET ${sets.join(', ')} WHERE ${eqColumn} = $${params.length} RETURNING *`;
              try {
                const res = await pool.query(sql, params);
                return { data: res.rows[0], error: null };
              } catch (err) {
                return { data: null, error: err };
              }
            },
          };
        },
      };
    },
  };
}

// Delete builder
function createDeleteBuilder(table: string) {
  return {
    delete() {
      return {
        eq(column: string, value: any) {
          return {
            async then(resolve: any) {
              try {
                const sql = `DELETE FROM ${table} WHERE ${column} = $1`;
                await pool.query(sql, [value]);
                return resolve({ data: null, error: null });
              } catch (err) {
                return resolve({ data: null, error: err });
              }
            },
          };
        },
      };
    },
  };
}

// 主客户端：模拟 supabase.from(table) 返回的链式 API
export const db = {
  from(table: string) {
    return {
      select: (cols?: string, opts?: { count?: 'exact' }) =>
        createQueryBuilder(table).select(cols || '*', opts),
      insert: (data: Record<string, any>) =>
        createInsertBuilder(table).insert(data),
      update: (data: Record<string, any>) =>
        createUpdateBuilder(table).update(data),
      delete: () => createDeleteBuilder(table).delete(),
    };
  },
  query: (text: string, params?: any[]) => pool.query(text, params || []),
};

// 兼容旧代码：createServerClient 返回 pool
export const createServerClient = () => pool;
export const closePool = () => pool.end();

export default db;
