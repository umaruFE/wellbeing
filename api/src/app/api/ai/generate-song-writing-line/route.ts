import { NextRequest, NextResponse } from 'next/server';
import { SONG_WRITING_SYSTEM_PROMPTS, buildSongWritingLinePrompt } from '@/prompts';

export const runtime = 'nodejs';

const melodyReferences: Record<string, string> = {
  Edelweiss: '参考：自然场景与方位表达。',
  'You Are My Sunshine': '参考：情绪词与 When I am/feel... 句型。',
  'Twinkle, Twinkle, Little Star': '参考：动作与身体/伙伴主题。',
  "If You're Happy and You Know It": '参考：身体部位与动作指令。',
};

export async function POST(request: NextRequest) {
  try {
    const { age, level, melody, themes, themeOther, vocabulary, grammar, lines, regenerateIndex, adjustmentRequest } = await request.json();
    const themeList = Array.isArray(themes) ? themes.filter(Boolean) : [];
    if (themeOther) themeList.push(themeOther);
    const themeText = themeList.join('、') || '情绪表达';
    const melodyReference = melodyReferences[melody] || '';
    const apiKey = process.env.VITE_DASHSCOPE_API_KEY;
    const apiUrl = process.env.VITE_DASHSCOPE_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    if (!apiKey) throw new Error('未配置大模型 API Key');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'qwen-plus', temperature: 0.65, response_format: { type: 'json_object' },
        messages: [
          ...SONG_WRITING_SYSTEM_PROMPTS.map((content) => ({ role: 'system', content })),
          { role: 'user', content: buildSongWritingLinePrompt({ age, level, melody, themeText, vocabulary, grammar, lines, regenerateIndex, melodyReference, adjustmentRequest }) },
        ],
      }),
    });
    if (!response.ok) throw new Error(`大模型请求失败：${response.status}`);
    const payload = await response.json();
    const data = JSON.parse(payload.choices?.[0]?.message?.content || '{}');
    if (typeof data.line !== 'string') throw new Error('大模型返回内容不完整');
    return NextResponse.json({ success: true, data: { line: data.line } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '歌词重新生成失败' }, { status: 500 });
  }
}
