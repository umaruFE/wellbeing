import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const melodyReferences: Record<string, string> = {
  Edelweiss: '参考：自然场景与方位表达。可借鉴“Dancing ______ in the mountain breeze”“In the ______ I walk and dream”等短句长度与舒缓节奏；词库可围绕 mountain, river, forest, grass, lake 等。',
  'You Are My Sunshine': '参考：情绪词与 When I am/feel... 句型。可借鉴“When I am ______, I want to sing.”“When I feel ______, I close my eyes.”的重复句式；词库可围绕 happy, excited, sad, calm 等。',
  'Twinkle, Twinkle, Little Star': '参考：动作与身体/伙伴主题。可借鉴“Twinkle, twinkle, monster friend, Let’s ______ together”及短小重复副歌；词库可围绕 play, sing, dance, jump, hands, heart 等。',
  "If You're Happy and You Know It": '参考：身体部位与动作指令。可借鉴“If you’re happy and you know it, touch your ______!”“shake your ______!”的节奏与重复结构；词库可围绕 head, face, hand, knee, foot 等。',
};

export async function POST(request: NextRequest) {
  try {
    const { languagePoint, age, level, theme, melody } = await request.json();
    const melodyReference = melodyReferences[melody] || '暂无专属案例，可根据该旋律的节奏、重复句式和副歌结构自由创编。';
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
          { role: 'user', content: `根据以下条件生成一首可课堂互动的英文歌曲：语言点=${languagePoint}；年龄=${age}岁；英文水平=${level}；幸福力主题=${theme}；旋律=${melody}。\n旋律案例参考（仅用于借鉴节奏、句式和词库方向，绝不是必须照抄的内容要求；请优先匹配本次语言目标与主题）：${melodyReference}\n返回严格 JSON：{ "title":"英文歌名", "words":["8-12个能填入歌词空格的英文词或短语"], "lines":["8句英文歌词，其中4-6句含 ______ 填空；歌词句式与所选旋律匹配"], "activityPlan":{"englishGoal":"可观察的语言目标", "wellbeingGoal":"可观察的幸福力目标", "materials":["材料"], "steps":[{"title":"环节名称", "duration":"分钟", "teacherGuide":"教师可直接说的引导语与学生动作"}]}}。活动方案按导入、学唱填词、合作表演、回顾四步输出，具体、可执行。` },
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
