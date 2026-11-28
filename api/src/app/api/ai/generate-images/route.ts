import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { n8nClient } from '@/lib/n8n/client';
import { generateWithDeepSeek } from '@/lib/n8n/deepseek';
import { mediaSubmissionFailure } from '@/lib/n8n/media';
import { createGenerationTask } from '@/lib/background-tasks';
import { getPrompt } from '@/prompts/registry';

// Course pages can contain older single-illustration descriptions with children
// and poses. Only the environment belongs in the bitmap behind the moving guide.
async function yogaBackdropPrompt(scene: string, changes: string, guide: string) {
  const setting = await generateWithDeepSeek(
    'Extract the physical SETTING of one educational story scene. Reply with only 1–3 short English sentences describing the place, time of day, light, story props and any story animals necessary to this particular scene. Apply the requested changes to the scenery. Keep the course story intact. Leave out people, the named guide, body positions, dialogue, lettering and physical instructions. Put a prop carried by a person on an environmental support if needed. Do not describe the omitted subjects. Do not introduce new locations or characters.',
    JSON.stringify({ scene, changes, guide }), 60000,
  );
  return [
    'A full-bleed 16:9 flat 2D cartoon environment for a children’s animated story.',
    setting,
    'Rounded illustrated shapes, clean thin dark-green or warm-brown contour lines, opaque softly colored flat fills. Use a limited harmonious palette suited to this time of day. Overlap large simple silhouettes in three depth planes, with distant shapes lighter and lower in contrast. A few small crisp decorative details at the edges.',
    'Broad uninterrupted open space around 43 percent from the left, with an unobstructed floor or ground extending to the bottom edge. Keep foreground props at the far sides and the story focal point toward the right. Fill the frame edge to edge.',
    'Scenery layer only. No people or mascots, no lettering, labels, borders or watermarks.',
  ].join(' ');
}

/**
 * N8N 图片生成路由
 * 
 * 改造说明：
 * - 原来直接调用 ComfyUI，现改为调用 N8N Workflow
 * - 提示词由 N8N Workflow 从 Variables 中获取
 * - 后端只负责传参数
 */

// CORS 响应头辅助函数
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// OPTIONS 处理函数 - 处理预检请求
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

/**
 * POST /api/ai/generate-images
 * 
 * 生成多张图片，通过 N8N Workflow 调用
 * 
 * @param request.body
 * @param workflow_type - 工作流类型: scene|person|lora-v3|background|ip-character|composite|yoga-backdrop
 * @param prompt - 提示词
 * @param width - 图片宽度
 * @param height - 图片高度
 * @param count - 生成数量
 * @param reference_image - 参考图URL (可选)
 * @param character_name - IP角色名称 (可选)
 * @param video_style - 风格名称 (可选)
 * @param roles - 角色数组 (可选，用于composite)
 * @param user_id - 用户ID
 * @param organization_id - 组织ID
 * 
 * @returns
 * @success - executionId 列表，前端轮询状态
 */
export async function POST(request: NextRequest) {
  try {
    // 1. 认证
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const user = authResult.user;

    // 2. 解析请求参数
    const body = await request.json();
    const {
      workflow_type = 'scene',
      prompt,
      width = 1024,
      height = 1024,
      count = 1,
      reference_image,
      video_style,
      negative_prompt,
      name,
      character_name,
      roles,
      course_id,
      course_title,
      title,
      user_id,
      organization_id
    } = body;

    // 3. 参数验证
    if (!prompt) {
      return NextResponse.json(
        { error: '缺少必要参数: prompt' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // IP 场景编辑器的背景重生成走此通用路由。与首次生成保持同一套
    // 微调画风约束，避免重生成后退化为普通矢量插画。
    const isIpSceneBackground = workflow_type === 'background';
    const [backgroundStyle, backgroundNegative] = isIpSceneBackground
      ? await Promise.all([
          getPrompt('scene.style.background'),
          getPrompt('scene.negative.background'),
        ])
      : ['', ''];
    const isYogaBackdrop = workflow_type === 'yoga-backdrop';
    const effectivePrompt = isYogaBackdrop
      ? await yogaBackdropPrompt(prompt, String(body.scene_changes || ''), String(body.guide || ''))
      : isIpSceneBackground ? `${backgroundStyle}, ${prompt}` : prompt;
    const effectiveNegativePrompt = isYogaBackdrop
      ? 'human figures, children, teacher, mascot, yoga demonstration, lettering, text, watermark, paper border, book cover, watercolor, pencil hatching, photographic texture, 3D render'
      : negative_prompt || backgroundNegative || undefined;

    // 4. 准备 N8N 调用参数
    const n8nPayload = {
      workflow_type: isYogaBackdrop ? 'scene' : workflow_type,
      prompt: effectivePrompt,
      negative_prompt: effectiveNegativePrompt,
      width,
      height,
      reference_image,
      video_style,
      name: isYogaBackdrop ? 'bg' : name || character_name,  // N8N 用 name 判断角色
      character_name: isYogaBackdrop ? undefined : character_name,
      roles,
      user_id: user?.id,
      organization_id,
      timestamp: Date.now()
    };

    console.log('[generate-images] 调用 N8N Workflow:', {
      workflow: 'ai-image-generation',
      workflow_type,
      prompt: effectivePrompt.substring(0, 50) + '...',
      user_id: user?.id
    });

    // 5. 调用 N8N Workflow
    const submitted = await n8nClient.submitMedia('ai-image-generation', n8nPayload);

    const { executionId } = submitted;

    // 6. 保存到数据库
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validUserId = (user_id && uuidRegex.test(user_id)) ? user_id : null;
      const validOrganizationId = (organization_id && uuidRegex.test(organization_id)) ? organization_id : null;

      await db.from('prompt_history').insert({
        user_id: validUserId,
        organization_id: validOrganizationId,
        prompt_type: 'image_generation',
        original_prompt: effectivePrompt,
        generated_result: null,
        model_name: 'qwen-image',
        execution_time: null,
        success: true,
        error_message: null,
        prompt_id: executionId
      });

      console.log('[generate-images] 已保存 executionId 到数据库:', executionId);
    } catch (dbError) {
      console.error('[generate-images] 保存到数据库失败:', dbError);
    }

    // 7. 返回结果（包含 comfyuiUrl 让前端可以直接轮询）
    const statusParams = new URLSearchParams({ useComfyUI: 'true' });
    if (submitted.comfyuiUrl) statusParams.set('apiUrl', submitted.comfyuiUrl);
    const statusUrl = `/api/ai/task-status/${encodeURIComponent(executionId)}?${statusParams}`;
    let backgroundTask = null;

    try {
      backgroundTask = await createGenerationTask({
        userId: user?.id,
        organizationId: organization_id || user?.organizationId || null,
        courseId: course_id || null,
        type: 'image',
        title: title || character_name || name || '图片生成',
        count: Number(count) || 1,
        related: course_title || '',
        provider: 'n8n',
        externalTaskId: executionId,
        statusUrl,
        input: {
          workflow_type,
          prompt: effectivePrompt,
          negative_prompt: effectiveNegativePrompt,
          width,
          height,
          count,
          reference_image,
          video_style,
          name: name || character_name,
          character_name,
          roles,
        },
      });
    } catch (taskError) {
      console.error('[generate-images] 创建后台任务失败:', taskError);
    }

    return NextResponse.json({
      success: true,
      tasks: [{
        type: workflow_type,
        name: character_name,
        promptId: executionId,
        apiUrl: submitted.comfyuiUrl
      }],
      backgroundTaskId: backgroundTask?.id || null,
      backgroundTask,
      workflowType: workflow_type,
      workflow: 'ai-image-generation'
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('[generate-images] 调用失败:', error);

    return mediaSubmissionFailure(error, '图片生成失败，请重试。', corsHeaders());
  }
}
