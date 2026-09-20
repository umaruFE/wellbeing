import { NextRequest, NextResponse } from 'next/server';
import { buildStoryboardScriptPrompts } from '@/prompts';
import { generateJsonWithDeepSeek } from '@/lib/n8n/deepseek';

export const runtime = 'nodejs';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const requestedReferenceImageCount = Number(body.referenceImageCount);
    const referenceImageCount = Number.isFinite(requestedReferenceImageCount)
      ? Math.min(20, Math.max(0, Math.floor(requestedReferenceImageCount)))
      : 0;
    const requestedDuration = Number(body.duration);
    const duration = Number.isFinite(requestedDuration)
      ? Math.min(300, Math.max(3, requestedDuration))
      : 30;

    if (!description) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数: description' },
        { status: 400, headers: corsHeaders() },
      );
    }

    const prompts = buildStoryboardScriptPrompts({
      description,
      referenceImageCount,
      duration,
    });

    const storyboard = await generateJsonWithDeepSeek<{ scenes?: Record<string, unknown>[] }>(prompts.system, prompts.user);
    if (!Array.isArray(storyboard.scenes)) throw new Error('分镜脚本格式错误');

    storyboard.scenes = storyboard.scenes.map((scene: Record<string, unknown>) => ({
      ...scene,
      narration: scene.narration || '',
      generatedImage: null,
    }));

    return NextResponse.json({ success: true, data: storyboard }, { headers: corsHeaders() });
  } catch (error) {
    console.error('[generate-storyboard-script] 生成失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '分镜脚本生成失败' },
      { status: 500, headers: corsHeaders() },
    );
  }
}
