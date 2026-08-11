import { NextRequest, NextResponse } from 'next/server';
import {
  VIDEO_OPTIMIZATION_SYSTEM_PROMPT,
  buildVideoOptimizationUserPrompt,
} from '@/prompts';

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_API_URL = process.env.DASHSCOPE_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

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

    if (!DASHSCOPE_API_KEY) {
      console.error('DASHSCOPE_API_KEY 未配置');
      const fallbackPrompt = `故事核心要素：${storyCore}\n整体风格：${overallStyle}\n角色设定：${characterSetting}`;
      return NextResponse.json({
        success: true,
        optimizedPrompt: fallbackPrompt
      }, { headers: corsHeaders() });
    }

    const userPrompt = buildVideoOptimizationUserPrompt({
      storyCore,
      overallStyle,
      characterSetting,
      videoDuration,
    });

    const response = await fetch(`${DASHSCOPE_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: VIDEO_OPTIMIZATION_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DashScope API 调用失败:', response.status, errorText);
      const fallbackPrompt = `故事核心要素：${storyCore}\n整体风格：${overallStyle}\n角色设定：${characterSetting}`;
      return NextResponse.json({
        success: true,
        optimizedPrompt: fallbackPrompt
      }, { headers: corsHeaders() });
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const optimizedPrompt = data.choices[0].message.content.trim();
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
