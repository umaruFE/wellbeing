import { NextRequest, NextResponse } from 'next/server';
import { SONG_WRITING_SYSTEM_PROMPTS, buildSongWritingUserPrompt } from '@/prompts';

export const runtime = 'nodejs';

const melodyReferences: Record<string, string> = {
  Edelweiss: '参考：自然场景与方位表达。可借鉴“Dancing ______ in the mountain breeze”“In the ______ I walk and dream”等短句长度与舒缓节奏；词库可围绕 mountain, river, forest, grass, lake 等。',
  'You Are My Sunshine': '参考：情绪词与 When I am/feel... 句型。可借鉴“When I am ______, I want to sing.”“When I feel ______, I close my eyes.”的重复句式；词库可围绕 happy, excited, sad, calm 等。',
  'Twinkle, Twinkle, Little Star': '参考：动作与身体/伙伴主题。可借鉴“Twinkle, twinkle, monster friend, Let’s ______ together”及短小重复副歌；词库可围绕 play, sing, dance, jump, hands, heart 等。',
  "If You're Happy and You Know It": '参考：身体部位与动作指令。可借鉴“If you’re happy and you know it, touch your ______!”“shake your ______!”的节奏与重复结构；词库可围绕 head, face, hand, knee, foot 等。',
};

export async function POST(request: NextRequest) {
  try {
    const { age, level, participants, themes, themeOther, vocabulary, grammar, melody } = await request.json();
    const themeList = Array.isArray(themes) ? themes.filter(Boolean) : [];
    if (themeOther) themeList.push(themeOther);
    const themeText = themeList.join('、') || '情绪表达';
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
          ...SONG_WRITING_SYSTEM_PROMPTS.map((content) => ({ role: 'system', content })),
          { role: 'user', content: buildSongWritingUserPrompt({ age, level, participants, themeText, vocabulary, grammar, melody, melodyReference }) },
        ],
      }),
    });
    if (!response.ok) throw new Error(`大模型请求失败：${response.status}`);
    const payload = await response.json();
    const data = JSON.parse(payload.choices?.[0]?.message?.content || '{}');
    if (!Array.isArray(data.lines) || !Array.isArray(data.words) || !data.activityPlan) throw new Error('大模型返回内容不完整');
    const words = data.words.slice(0, 12);
    const wordEmojis = Object.fromEntries(
      words
        .filter((word: unknown): word is string => typeof word === 'string')
        .map((word: string) => [word, typeof data.wordEmojis?.[word] === 'string' ? data.wordEmojis[word] : '💬']),
    );
    return NextResponse.json({ success: true, data: { ...data, words, wordEmojis, lines: data.lines.slice(0, 8) } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '歌曲生成失败' }, { status: 500 });
  }
}
