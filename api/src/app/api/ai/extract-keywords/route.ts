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

重要规则：
- 背景描述：只包含环境、场景、氛围等元素（天空、地面、树木、建筑等），不包含任何角色
- 角色动作描述：只描述角色本身的动作、姿态、表情，禁止包含任何环境元素
- 绝对禁止出现在角色描述中的词汇：月亮、太阳、星星、天空、地面、树木、花草、山、水、云、背景、场景、环境、室内、室外、建筑、望远镜（作为观察对象）、任何自然景观
- 如果原描述包含观察某个物体（如月亮、星星），只需描述"专注地观察"而不指明观察对象
- 好的角色描述示例："双手举起欢呼"、"开心地跳跃"、"坐在地上看书"、"双手合十微笑"
- 错误示例（包含环境）："抬头看月亮"、"站在草地上"、"坐在树下看书"（草地、树都是环境）`;

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
