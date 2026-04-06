import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

const DASHSCOPE_API_KEY = process.env.VITE_DASHSCOPE_API_KEY;
const DASHSCOPE_API_URL = process.env.VITE_DASHSCOPE_API_URL;

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

interface ExtractRequest {
  prompt: string;
  selectedRoles: string[];
}

interface ExtractResponse {
  background: string;
  roles: {
    [roleName: string]: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const body = await request.json();
    const { prompt, selectedRoles } = body as ExtractRequest;

    if (!prompt || !selectedRoles || selectedRoles.length === 0) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const systemPrompt = `你是一个专业的场景描述分析助手。你的任务是从用户的场景描述中提取：
1. 背景环境描述（不包含任何角色的描述）
2. 每个IP角色的具体动作描述

请以JSON格式返回，格式如下：
{
  "background": "背景环境描述",
  "roles": {
    "poppy": "角色动作描述",
    "edi": "角色动作描述"
  }
}

注意事项：
- 背景描述应该只包含环境、场景、氛围等元素，不包含任何角色
- 角色动作描述应该简洁明了，只描述角色本身的动作、姿态、表情，不要包含任何背景、场景、环境描述
- 角色描述应该只关注角色本身，比如"站着微笑"、"坐着看书"、"跳跃"等
- 如果用户描述中没有明确提到某个角色的动作，可以生成一个合理的简单动作
- 保持描述的简洁性和画面感`;

    const userPrompt = `场景描述：${prompt}
选中的角色：${selectedRoles.join(', ')}

请提取背景描述和每个角色的动作描述。`;

    const response = await fetch(DASHSCOPE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DashScope API错误:', errorText);
      throw new Error(`AI服务调用失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('AI返回内容:', content);

    let extractedData: ExtractResponse;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法从AI响应中提取JSON');
      }
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError);
      extractedData = {
        background: prompt,
        roles: selectedRoles.reduce((acc, role) => {
          acc[role] = prompt;
          return acc;
        }, {} as { [key: string]: string })
      };
    }

    return NextResponse.json({
      success: true,
      data: extractedData
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('提取关键词失败:', error);
    return NextResponse.json(
      { error: '提取关键词失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
