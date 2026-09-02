import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/creative-works — 当前用户的创作工坊草稿列表
export async function GET(request: NextRequest) {
  try {
    const authResult = authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || '认证失败' }, { status: 401 });
    }
    const userId = authResult.user?.id;
    if (!userId) {
      return NextResponse.json({ error: '用户信息缺失' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');

    const result = await db.query(
      `SELECT id, module_id, module_name, title, parameters, status,
              (html IS NOT NULL) AS has_html, result, created_at, updated_at
       FROM creative_works WHERE user_id = $1 ${moduleId ? 'AND module_id = $2' : ''}
       ORDER BY created_at DESC`,
      moduleId ? [userId, moduleId] : [userId]
    );
    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error('[creative-works] GET failed:', error);
    return NextResponse.json({ error: '获取创作列表失败' }, { status: 500 });
  }
}

// POST /api/creative-works — 创建草稿
export async function POST(request: NextRequest) {
  try {
    const authResult = authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || '认证失败' }, { status: 401 });
    }
    const userId = authResult.user?.id;
    if (!userId) {
      return NextResponse.json({ error: '用户信息缺失' }, { status: 401 });
    }

    const body = await request.json();
    const { moduleId, moduleName, title, parameters } = body || {};
    if (!moduleId || !moduleName || !title) {
      return NextResponse.json({ error: 'moduleId、moduleName、title 不能为空' }, { status: 400 });
    }

    const result = await db.query(
      `INSERT INTO creative_works (user_id, module_id, module_name, title, parameters)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       RETURNING id, module_id, module_name, title, parameters, status, created_at, updated_at`,
      [userId, moduleId, moduleName, title, JSON.stringify(parameters || {})]
    );
    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[creative-works] POST failed:', error);
    return NextResponse.json({ error: '创建草稿失败' }, { status: 500 });
  }
}
