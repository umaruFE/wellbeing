import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { createServerClient } from '@/lib/db';

const uuid = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = authenticate(request).user;
  if (!user) return NextResponse.json({ error: '请登录后复制课程。' }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!uuid.test(params.id) || typeof body?.requestId !== 'string' || !uuid.test(body.requestId)) {
    return NextResponse.json({ error: '复制请求无效。' }, { status: 400 });
  }
  const client = await createServerClient().connect().catch(() => null);
  if (!client) return NextResponse.json({ error: '暂时无法连接数据库，请稍后重试。' }, { status: 503 });
  let discard = false;
  try {
    await client.query('BEGIN');
    const source = await client.query(
      "SELECT copy_count FROM courses WHERE id=$1 AND is_public AND status='published' FOR UPDATE", [params.id],
    );
    if (!source.rowCount) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: '这门课程已从广场下架。' }, { status: 404 });
    }
    // Repeating an interrupted request for the same teacher and source returns the same copy.
    const { rows: [key] } = await client.query('SELECT md5($1)::uuid AS id', [[user.id, params.id, body.requestId].join('/')]);
    const copy = await client.query(
      `INSERT INTO courses (id, user_id, organization_id, title, description, age_group, unit, duration, theme,
        keywords, status, is_public, course_data, canvas_data, reading_materials_data)
       SELECT $2, $3, $4, concat(title,' (',$5::text,')'), description, age_group, unit, duration, theme,
        keywords, 'draft', false, course_data, canvas_data, reading_materials_data FROM courses WHERE id=$1
       ON CONFLICT (id) DO NOTHING RETURNING id`,
      [params.id, key.id, user.id, user.organizationId, body.language === 'en' ? 'Copy' : '复制'],
    );
    let copyCount = source.rows[0].copy_count || 0;
    if (copy.rowCount) {
      await client.query(
        `INSERT INTO course_slides (course_id, page_number, title, content, slide_type)
         SELECT $2, page_number, title, content, slide_type FROM course_slides WHERE course_id=$1`, [params.id, key.id],
      );
      const result = await client.query('UPDATE courses SET copy_count=coalesce(copy_count,0)+1 WHERE id=$1 RETURNING copy_count', [params.id]);
      copyCount = result.rows[0].copy_count;
    }
    await client.query('COMMIT');
    return NextResponse.json({ data: { id: key.id, copyCount } });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => { discard = true; });
    console.error('[courses/copy] Failed to copy course', (error as Error).name);
    return NextResponse.json({ error: '课程复制失败，请重试。' }, { status: 500 });
  } finally {
    client.release(discard);
  }
}
