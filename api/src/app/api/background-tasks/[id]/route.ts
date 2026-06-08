import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { cancelGenerationTask, createGenerationTask, getGenerationTask } from '@/lib/background-tasks';
import { n8nClient } from '@/lib/n8n/client';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || '认证失败' }, { status: 401, headers: corsHeaders() });
    }

    const task = await getGenerationTask(params.id);
    if (!task) {
      return NextResponse.json({ error: '任务不存在' }, { status: 404, headers: corsHeaders() });
    }
    if (task.user_id && task.user_id !== authResult.user?.id) {
      return NextResponse.json({ error: '无权访问该任务' }, { status: 403, headers: corsHeaders() });
    }

    return NextResponse.json({ success: true, data: { task } }, { headers: corsHeaders() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '任务获取失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error || '认证失败' }, { status: 401, headers: corsHeaders() });
    }

    const body = await request.json();
    if (body.action === 'cancel') {
      const task = await cancelGenerationTask(params.id, authResult.user?.id);
      return NextResponse.json({ success: true, data: { task } }, { headers: corsHeaders() });
    }

    if (body.action === 'retry') {
      const originalTask = await getGenerationTask(params.id);
      if (!originalTask) {
        return NextResponse.json({ error: '任务不存在' }, { status: 404, headers: corsHeaders() });
      }
      if (originalTask.user_id && originalTask.user_id !== authResult.user?.id) {
        return NextResponse.json({ error: '无权操作该任务' }, { status: 403, headers: corsHeaders() });
      }

      const input = originalTask.input || {};
      let externalTaskId: string | null = null;
      let statusUrl: string | null = null;

      if (originalTask.type === 'image') {
        const n8nResult = await n8nClient.call('ai-image-generation', {
          workflow_type: input.workflow_type || 'scene',
          prompt: input.prompt,
          width: input.width || 1024,
          height: input.height || 1024,
          reference_image: input.reference_image,
          video_style: input.video_style,
          name: input.name || input.character_name,
          character_name: input.character_name,
          roles: input.roles,
          user_id: authResult.user?.id,
          organization_id: originalTask.organization_id,
          timestamp: Date.now(),
        });
        const resultData = n8nResult as { executionId?: string; id?: string; comfyuiUrl?: string };
        externalTaskId = resultData.executionId || resultData.id || null;
        statusUrl = externalTaskId
          ? `/api/ai/task-status/${externalTaskId}?useComfyUI=true${resultData.comfyuiUrl ? `&apiUrl=${encodeURIComponent(resultData.comfyuiUrl)}` : ''}`
          : null;
      } else if (originalTask.type === 'video') {
        const n8nResult = await n8nClient.call('gene-video', {
          storyboard_images_filepath: input.storyboard_images_filepath || [],
          storyboard_prompts: input.storyboard_prompts || [],
          video_width: input.video_width || 856,
          video_height: input.video_height || 480,
          voice: input.voice,
          storyboard_image_prompts: input.storyboard_image_prompts,
          timestamp: Date.now(),
        });
        const resultData = n8nResult as { executionId?: string; id?: string };
        externalTaskId = resultData.executionId || resultData.id || null;
        statusUrl = externalTaskId ? `/api/ai/video-status?executionId=${encodeURIComponent(externalTaskId)}` : null;
      } else {
        return NextResponse.json({ error: '当前任务类型暂不支持重试' }, { status: 400, headers: corsHeaders() });
      }

      const task = await createGenerationTask({
        userId: authResult.user?.id,
        organizationId: originalTask.organization_id,
        courseId: originalTask.course_id,
        type: originalTask.type,
        title: originalTask.title,
        count: originalTask.count,
        related: originalTask.related,
        provider: originalTask.provider || 'n8n',
        externalTaskId,
        statusUrl,
        input,
      });

      return NextResponse.json({ success: true, data: { task } }, { headers: corsHeaders() });
    }

    return NextResponse.json({ error: '不支持的操作' }, { status: 400, headers: corsHeaders() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '任务操作失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
