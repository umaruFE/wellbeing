import { NextRequest, NextResponse } from 'next/server';
import { promptOptimizationSystemPrompt } from '@/lib/prompt-config';

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_API_URL = process.env.DASHSCOPE_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

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

// POST /api/ai/optimize-prompt - 优化提示词
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalPrompt, elementType } = body;

    if (!originalPrompt) {
      return NextResponse.json(
        { error: '缺少originalPrompt参数' },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (!DASHSCOPE_API_KEY) {
      console.error('DASHSCOPE_API_KEY 未配置');
      return NextResponse.json(
        { error: 'DASHSCOPE_API_KEY 未配置' },
        { status: 500, headers: corsHeaders() }
      );
    }

    const systemPrompt = promptOptimizationSystemPrompt(originalPrompt, elementType || 'general');

    const response = await fetch(`${DASHSCOPE_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DASHSCOPE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: originalPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('通义千问 API 调用失败:', response.status, response.statusText, errorText);
      return NextResponse.json(
        { error: `API请求失败: ${response.status} ${response.statusText}` },
        { status: 500, headers: corsHeaders() }
      );
    }

    const data = await response.json();
    const optimizedPrompt = data.choices?.[0]?.message?.content?.trim();

    if (!optimizedPrompt) {
      return NextResponse.json(
        { error: 'API返回数据格式不正确' },
        { status: 500, headers: corsHeaders() }
      );
    }

    console.log('原始提示词:', originalPrompt);
    console.log('优化后提示词:', optimizedPrompt);

    return NextResponse.json({
      success: true,
      optimizedPrompt,
      originalPrompt
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('优化提示词失败:', error);
    return NextResponse.json(
      { error: '优化提示词失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500, headers: corsHeaders() }
    );
  }
}
