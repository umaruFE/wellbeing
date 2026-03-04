import { NextRequest, NextResponse } from 'next/server';

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

    const systemPrompt = `你是一个专业的人物特征提取助手。你的任务是从用户的视频描述中提取主要人物的外貌特征。

规则：
1. 只提取人物的外貌特征（如：年龄、性别、发型、发色、肤色、服装、配饰等）
2. 忽略所有场景、道具、动作、情节描述
3. 如果描述中有多个角色，只提取主要角色
4. 如果描述中没有明确的人物，返回"一个通用卡通人物"
5. 返回简洁的人物描述，不超过50个字

输出格式：直接返回人物描述，不要添加任何其他内容。

示例：
输入："画面1：一个穿着红色裙子的小女孩在公园里玩耍，旁边有一只小狗"
输出："一个穿着红色裙子的小女孩"

输入："画面1：地面上有几个打开的箱子，远处有一个架子。娃娃和球散落着"
输出："一个通用卡通人物"

输入："画面1：一个戴眼镜的中年男性教师在黑板前讲课"
输出："一个戴眼镜的中年男性教师"`;

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
        max_tokens: 100
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
    const character = data.choices?.[0]?.message?.content?.trim() || '一个通用卡通人物';

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
