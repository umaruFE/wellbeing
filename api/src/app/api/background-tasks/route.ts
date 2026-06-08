import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { createGenerationTask, listGenerationTasks } from '@/lib/background-tasks';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || '认证失败' }, { status: 401, headers: corsHeaders() });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') === 'history' ? 'history' : 'active';
    const tasks = await listGenerationTasks(authResult.user?.id || null, scope);

    return NextResponse.json({ success: true, data: { tasks } }, { headers: corsHeaders() });
  } catch (error) {
    console.error('[background-tasks] list failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '后台任务获取失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || '认证失败' }, { status: 401, headers: corsHeaders() });
    }

    const body = await request.json();
    const task = await createGenerationTask({
      userId: authResult.user?.id,
      organizationId: body.organizationId || authResult.user?.organizationId || null,
      courseId: body.courseId || null,
      type: body.type || 'image',
      title: body.title || 'AI 生成任务',
      count: body.count || 1,
      related: body.related || '',
      provider: body.provider || null,
      externalTaskId: body.externalTaskId || null,
      statusUrl: body.statusUrl || null,
      input: body.input || body,
      result: body.result || null,
      status: body.status || undefined,
    });

    return NextResponse.json({ success: true, data: { task } }, { headers: corsHeaders() });
  } catch (error) {
    console.error('[background-tasks] create failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '后台任务创建失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
