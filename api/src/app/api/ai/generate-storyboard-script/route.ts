import { NextRequest, NextResponse } from 'next/server';
import { buildStoryboardScriptPrompts } from '@/prompts';

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

    const apiKey = process.env.DASHSCOPE_API_KEY || process.env.VITE_DASHSCOPE_API_KEY;
    const apiUrl = process.env.DASHSCOPE_API_URL
      || process.env.VITE_DASHSCOPE_API_URL
      || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

    if (!apiKey) throw new Error('未配置大模型 API Key');

    const prompts = buildStoryboardScriptPrompts({
      description,
      referenceImageCount,
      duration,
    });

    const endpoint = apiUrl.endsWith('/chat/completions')
      ? apiUrl
      : `${apiUrl.replace(/\/$/, '')}/chat/completions`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: prompts.system },
          { role: 'user', content: prompts.user },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`大模型请求失败：${response.status} ${detail}`);
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content || '';
    const jsonText = content.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonText) throw new Error('无法解析分镜脚本');

    const storyboard = JSON.parse(jsonText);
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
