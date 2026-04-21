import { NextRequest, NextResponse } from 'next/server';

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

    const systemPrompt = `你是一位专业的视频制作顾问，擅长优化视频描述提示词。

用户会提供三个维度的信息：
1. 故事核心要素：视频的主要内容、情节、主题
2. 整体风格：视频的视觉风格、色调、氛围
3. 角色设定：视频中的角色信息、人物数量、特征

请将这三个维度的信息整合成一个完整、详细、专业的视频描述提示词。

要求：
1. 保持原始信息的核心内容
2. 添加更多细节和专业术语
3. 确保描述清晰、具体、可执行
4. 使用中文回复
5. 直接输出优化后的提示词，不要添加任何解释或前缀

输出格式示例：
一个[年龄段]的[角色特征]在[场景描述]中[动作描述]，[风格描述]，[镜头描述]，[光影描述]，整体呈现[氛围描述]的感觉。`;

    const userPrompt = `故事核心要素：${storyCore}
整体风格：${overallStyle}
角色设定：${characterSetting}
视频时长：${videoDuration || 10}秒

请优化这个视频描述提示词。`;

    const response = await fetch(`${DASHSCOPE_API_URL}/chat/completions`, {
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
