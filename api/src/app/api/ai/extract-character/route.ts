import { NextRequest, NextResponse } from 'next/server';
import { characterExtractionPrompt } from '@/lib/prompt-config';

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

// POST /api/ai/extract-character - 从描述中提取人物特征
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description } = body;

    if (!description) {
      return NextResponse.json(
        { error: '缺少description参数' },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (!DASHSCOPE_API_KEY) {
      console.error('DASHSCOPE_API_KEY 未配置');
      return NextResponse.json(
        { error: 'API密钥未配置' },
        { status: 500, headers: corsHeaders() }
      );
    }

    const systemPrompt = characterExtractionPrompt;

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
            content: description
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('通义千问 API 调用失败:', response.status, response.statusText, errorText);
      return NextResponse.json(
        { error: '提取人物特征失败', character: '一个通用卡通人物' },
        { status: 200, headers: corsHeaders() }
      );
    }

    const data = await response.json();
    let character = data.choices?.[0]?.message?.content?.trim() || '一个通用卡通人物';

    console.log('API返回的原始内容:', character);

    if (character.includes('character_description')) {
      try {
        let cleanedContent = character;
        if (cleanedContent.startsWith('```json')) {
          cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        const jsonMatch = cleanedContent.match(/\{[\s\S]*"character_description"[\s\S]*\}/);
        if (jsonMatch) {
          const parsedContent = JSON.parse(jsonMatch[0]);
          if (parsedContent.character_description) {
            character = parsedContent.character_description;
          }
        }
      } catch (parseError) {
        console.log('JSON解析失败，尝试正则提取');
        const match = character.match(/"character_description"\s*:\s*"([^"]+)"/);
        if (match && match[1]) {
          character = match[1].trim();
        } else {
          console.log('正则提取失败，使用原始内容');
        }
      }
    }

    console.log('提取的人物特征:', character);

    return NextResponse.json({
      success: true,
      character
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('提取人物特征失败:', error);
    return NextResponse.json(
      { error: '提取人物特征失败', character: '一个通用卡通人物' },
      { status: 200, headers: corsHeaders() }
    );
  }
}
