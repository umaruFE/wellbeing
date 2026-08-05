import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { languagePoint, age, level, difficulty, theme, melody } = await request.json();
    const apiKey = process.env.VITE_DASHSCOPE_API_KEY;
    const apiUrl = process.env.VITE_DASHSCOPE_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    if (!apiKey) throw new Error('未配置大模型 API Key');

    const response = await fetch(apiUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'qwen-plus', temperature: 0.8, response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: '你是儿童英语歌曲创编与幸福力教学专家。仅返回合法 JSON。乐器固定为：砂槌、铃鼓、手鼓、三角铁、尤克里里、响板、沙锤、木琴；不要生成或修改乐器列表。' },
          { role: 'user', content: `根据以下条件生成一首可课堂互动的英文歌曲及活动方案：语言点=${languagePoint}；年龄=${age}岁；英语水平=${level}；填词难度=${difficulty}；幸福力主题=${theme}；旋律=${melody}。\n返回严格 JSON：{ "title":"英文歌名", "words":["8个以内英文词"], "lines":["8句英文歌词，其中4-6句含 ______ 填空"], "activityPlan":{"englishGoal":"", "wellbeingGoal":"", "materials":[""], "steps":[{"title":"", "duration":"", "teacherGuide":""}]}, "teacherGuide":"中文教学引导" }。歌词要适龄、可演唱；活动方案必须具体。` }
        ]
      })
    });
    if (!response.ok) throw new Error(`大模型请求失败：${response.status}`);
    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content || '{}';
    const data = JSON.parse(content);
    if (!Array.isArray(data.lines) || !Array.isArray(data.words) || !data.activityPlan) throw new Error('大模型返回内容不完整');
    return NextResponse.json({ success: true, data: { ...data, words: data.words.slice(0, 8), lines: data.lines.slice(0, 8) } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '歌曲生成失败' }, { status: 500 });
  }
}
