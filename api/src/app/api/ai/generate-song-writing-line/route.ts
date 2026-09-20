import { NextRequest, NextResponse } from 'next/server';
import { SONG_WRITING_SYSTEM_PROMPTS, buildSongWritingLinePrompt } from '@/prompts';
import { generateJsonWithDeepSeek } from '@/lib/n8n/deepseek';

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
    const data = await generateJsonWithDeepSeek<{ line?: string }>(
      SONG_WRITING_SYSTEM_PROMPTS.join('\n\n'),
      buildSongWritingLinePrompt({ age, level, melody, themeText, vocabulary, grammar, lines, regenerateIndex, melodyReference, adjustmentRequest }),
    );
    if (typeof data.line !== 'string') throw new Error('大模型返回内容不完整');
    return NextResponse.json({ success: true, data: { line: data.line } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '歌词重新生成失败' }, { status: 500 });
  }
}
