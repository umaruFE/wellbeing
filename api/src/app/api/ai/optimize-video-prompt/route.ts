import { NextRequest, NextResponse } from 'next/server';
import {
  VIDEO_OPTIMIZATION_SYSTEM_PROMPT,
  buildVideoOptimizationUserPrompt,
} from '@/prompts';
import { generateWithDeepSeek } from '@/lib/n8n/deepseek';

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { storyCore, overallStyle, characterSetting, videoDuration } = body;

    if (!storyCore || !overallStyle || !characterSetting) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const userPrompt = buildVideoOptimizationUserPrompt({
      storyCore,
      overallStyle,
      characterSetting,
      videoDuration,
    });

    const optimizedPrompt = await generateWithDeepSeek(VIDEO_OPTIMIZATION_SYSTEM_PROMPT, userPrompt);
    if (optimizedPrompt) {
      return NextResponse.json({
        success: true,
        optimizedPrompt
      }, { headers: corsHeaders() });
    } else {
      const fallbackPrompt = `故事核心要素：${storyCore}\n整体风格：${overallStyle}\n角色设定：${characterSetting}`;
      return NextResponse.json({
        success: true,
        optimizedPrompt: fallbackPrompt
      }, { headers: corsHeaders() });
    }
  } catch (error) {
    console.error('优化视频提示词失败:', error);
    return NextResponse.json(
      { error: '优化视频提示词失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
