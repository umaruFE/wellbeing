import { NextRequest, NextResponse } from 'next/server';
import { characterReferencePrompt } from '@/lib/prompt-config';

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

// GET /api/ai/get-character-prompt - 获取人物参考图生成提示词
export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      promptTemplate: characterReferencePrompt
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
    const { characterDescription } = body;

    if (!characterDescription) {
      return NextResponse.json(
        { error: '缺少characterDescription参数' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const filledPrompt = characterReferencePrompt.replace('${characterDescription}', characterDescription);

    return NextResponse.json({
      success: true,
      prompt: filledPrompt,
      promptTemplate: characterReferencePrompt
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('获取人物提示词失败:', error);
    return NextResponse.json(
      { error: '获取人物提示词失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
