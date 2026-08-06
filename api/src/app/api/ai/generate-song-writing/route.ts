import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { languagePoint, age, level, theme, melody } = await request.json();
    const apiKey = process.env.VITE_DASHSCOPE_API_KEY;
    const apiUrl = process.env.VITE_DASHSCOPE_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    if (!apiKey) throw new Error('未配置大模型 API Key');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'qwen-plus', temperature: 0.8, response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: '你是儿童英语歌曲创编与幸福力教学专家。仅返回合法 JSON。歌词必须严格适配指定旋律的节奏、句长和副歌结构；词库只提供能够填入歌词 ______ 的单词或短语，不能使用无关词。' },
          { role: 'user', content: `根据以下条件生成一首可课堂互动的英文歌曲：语言点=${languagePoint}；年龄=${age}岁；英文水平=${level}；幸福力主题=${theme}；旋律=${melody}。\n返回严格 JSON：{ "title":"英文歌名", "words":["8-12个能填入歌词空格的英文词或短语"], "lines":["8句英文歌词，其中4-6句含 ______ 填空；歌词句式与所选旋律匹配"], "activityPlan":{"englishGoal":"可观察的语言目标", "wellbeingGoal":"可观察的幸福力目标", "materials":["材料"], "steps":[{"title":"环节名称", "duration":"分钟", "teacherGuide":"教师可直接说的引导语与学生动作"}]}}。活动方案按导入、学唱填词、合作表演、回顾四步输出，具体、可执行。` },
        ],
      }),
    });
    if (!response.ok) throw new Error(`大模型请求失败：${response.status}`);
    const payload = await response.json();
    const data = JSON.parse(payload.choices?.[0]?.message?.content || '{}');
    if (!Array.isArray(data.lines) || !Array.isArray(data.words) || !data.activityPlan) throw new Error('大模型返回内容不完整');
    return NextResponse.json({ success: true, data: { ...data, words: data.words.slice(0, 12), lines: data.lines.slice(0, 8) } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '歌曲生成失败' }, { status: 500 });
  }
}
