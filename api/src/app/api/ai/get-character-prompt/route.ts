import { NextRequest, NextResponse } from 'next/server';
import { characterReferencePrompt, characterReferencePrompts } from '@/lib/prompt-config';

// CORS 响应头辅助函数
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// 根据视频风格获取对应的提示词（从配置文件加载）
function getStylePrompt(videoStyle: string): string {
  // 如果没有传风格，使用默认提示词
  if (!videoStyle) {
    return characterReferencePrompt;
  }

  // 精确匹配风格键
  if (characterReferencePrompts[videoStyle]) {
    return characterReferencePrompts[videoStyle];
  }

  // 尝试模糊匹配（检查风格描述是否包含某个风格关键词）
  const styleLower = videoStyle.toLowerCase();
  for (const [key, prompt] of Object.entries(characterReferencePrompts) as [string, string][]) {
    const keyLower = key.toLowerCase();
    // 检查风格描述中的关键词是否匹配
    const keywords = keyLower.split(/[、,]/).filter(k => k.trim());
    if (keywords.some(keyword => keyword && styleLower.includes(keyword))) {
      return prompt;
    }
  }

  // 没有匹配的风格，返回默认提示词
  console.log(`未找到匹配的风格 "${videoStyle}"，使用默认提示词`);
  return characterReferencePrompt;
}

// OPTIONS 处理函数 - 处理预检请求
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

// GET /api/ai/get-character-prompt - 获取人物参考图生成提示词
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      promptTemplate: characterReferencePrompt,
      availableStyles: Object.keys(characterReferencePrompts)
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('获取人物提示词失败:', error);
    return NextResponse.json(
      { error: '获取人物提示词失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

// POST /api/ai/get-character-prompt - 获取填充后的人物参考图生成提示词
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { characterDescription, videoStyle } = body;

    if (!characterDescription) {
      return NextResponse.json(
        { error: '缺少characterDescription参数' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // 根据风格获取对应的提示词模板
    const stylePromptTemplate = getStylePrompt(videoStyle);
    const filledPrompt = stylePromptTemplate.replace('${characterDescription}', characterDescription);

    return NextResponse.json({
      success: true,
      prompt: filledPrompt,
      promptTemplate: characterReferencePrompt,
      usedStyle: videoStyle || 'default'
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('获取人物提示词失败:', error);
    return NextResponse.json(
      { error: '获取人物提示词失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
