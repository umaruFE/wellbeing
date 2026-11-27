import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'no-store' };

// The lesson picker only needs the published case description, not its game or media payload.
export async function GET(request: NextRequest) {
  if (!authenticate(request).user) return NextResponse.json({ error: '请登录后查看经典活动。' }, { status: 401, headers });
  try {
    const { rows } = await db.query(`
      SELECT module_id AS "moduleId", case_id AS id,
             COALESCE(NULLIF(payload->>'title', ''), NULLIF(payload->>'nameZh', ''), NULLIF(payload#>>'{meta,title}', ''),
                      NULLIF(payload#>>'{meta,name}', ''), NULLIF(payload#>>'{draft,title}', ''), payload->>'name') AS title,
             COALESCE(NULLIF(payload->>'description', ''), NULLIF(payload->>'subtitle', ''),
                      NULLIF(payload#>>'{meta,description}', ''), NULLIF(payload#>>'{meta,goal}', ''), payload->>'input') AS description
        FROM workbench_cases WHERE published ORDER BY module_id, sort_order, case_id`);
    return NextResponse.json({ data: rows.filter(row => row.title?.trim()) }, { headers });
  } catch {
    return NextResponse.json({ error: '暂时无法读取经典活动，请重试。' }, { status: 503, headers });
  }
}
