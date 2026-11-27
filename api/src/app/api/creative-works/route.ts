import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { renderYogaHtml } from '@/lib/experience/generator';
import { previewYogaWrites, withYogaWorkWrite, yogaModuleId } from '@/lib/yoga-work-write';

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
              (html IS NOT NULL) AS has_html,
              CASE WHEN module_id = 'music-star-quest' THEN NULL ELSE result END AS result,
              (module_id = 'music-star-quest') AS is_summary,
              CASE WHEN module_id = 'music-star-quest' AND jsonb_typeof(result->'lyrics') = 'array'
                   THEN jsonb_array_length(result->'lyrics') ELSE 0 END AS lyric_count,
              created_at, updated_at
       FROM creative_works WHERE user_id = $1 ${moduleId ? 'AND module_id = $2' : ''}
         AND (parameters->>'workbenchMusicCandidate') IS DISTINCT FROM 'true'
       ORDER BY created_at DESC`,
      moduleId ? [userId, moduleId] : [userId]
    );
    return NextResponse.json({
      data: result.rows,
      ...(moduleId === yogaModuleId && previewYogaWrites() ? { canWrite: true } : {}),
    }, { headers: { 'Cache-Control': 'no-store' } });
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

    const body = await request.json().catch(() => null);
    const { moduleId, moduleName, title, parameters } = body || {};
    if (!moduleId || !moduleName || !title) {
      return NextResponse.json({ error: 'moduleId、moduleName、title 不能为空' }, { status: 400 });
    }

    if (previewYogaWrites() && moduleId !== yogaModuleId) {
      return NextResponse.json({ error: '当前模块未开放作品写入。' }, { status: 403 });
    }
    const yoga = moduleId === yogaModuleId;
    const record = yoga ? parameters?.workbenchYoga : undefined;
    if (record !== undefined && (typeof record?.id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(record.id)
      || typeof record.saveToken !== 'string' || !record.saveToken)) {
      return NextResponse.json({ error: '瑜伽作品的保存标识无效。' }, { status: 400 });
    }
    const pages = yoga && Array.isArray(body.pages) && body.pages.length ? body.pages : null;
    const plan = yoga ? body.plan : null;
    const content = pages || plan ? { title, ...(pages && { pages }), ...(plan && { plan }) } : null;
    const html = pages ? renderYogaHtml({ title, pages }, title) : null;
    const columns = 'id, module_id, module_name, title, parameters, result, status, created_at, updated_at';
    const sql = `INSERT INTO creative_works (user_id, module_id, module_name, title, parameters, result, html)
                 VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7) RETURNING ${columns}`;
    const values = [userId, moduleId, moduleName, title, JSON.stringify(parameters || {}), content && JSON.stringify(content), html];
    if (yoga) {
      return await withYogaWorkWrite(async client => {
        if (record) {
          // Retrying a creation after a lost response must return the same personal copy.
          await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [JSON.stringify([userId, moduleId, record.id])]);
          const existing = await client.query(
            `SELECT ${columns} FROM creative_works WHERE user_id = $1 AND module_id = $2
             AND parameters->'workbenchYoga'->>'id' = $3 LIMIT 1`, [userId, moduleId, record.id],
          );
          const saved = existing.rows[0];
          if (saved) {
            if (saved.parameters.workbenchYoga.saveToken !== record.saveToken) {
              return NextResponse.json({ error: '后台课程已更新，当前修改已保留。' }, { status: 409 });
            }
            return NextResponse.json({ data: saved });
          }
        }
        const { rows } = await client.query(sql, values);
        return NextResponse.json({ data: rows[0] }, { status: 201 });
      });
    }
    const result = await db.query(sql, values);
    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[creative-works] POST failed:', error);
    return NextResponse.json({ error: '创建草稿失败' }, { status: 500 });
  }
}
