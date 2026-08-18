import { NextRequest, NextResponse } from 'next/server';
import { SONG_WRITING_SYSTEM_PROMPTS, buildSongWritingUserPrompt } from '@/prompts';

export const runtime = 'nodejs';

const melodyReferences: Record<string, string> = {
  Edelweiss: '参考：自然场景与方位表达。可借鉴“Dancing ______ in the mountain breeze”“In the ______ I walk and dream”等短句长度与舒缓节奏；词库可围绕 mountain, river, forest, grass, lake 等。',
  'You Are My Sunshine': '参考：情绪词与 When I am/feel... 句型。可借鉴“When I am ______, I want to sing.”“When I feel ______, I close my eyes.”的重复句式；词库可围绕 happy, excited, sad, calm 等。',
  'Twinkle, Twinkle, Little Star': '参考：动作与身体/伙伴主题。可借鉴“Twinkle, twinkle, monster friend, Let’s ______ together”及短小重复副歌；词库可围绕 play, sing, dance, jump, hands, heart 等。',
  "If You're Happy and You Know It": '参考：身体部位与动作指令。可借鉴“If you’re happy and you know it, touch your ______!”“shake your ______!”的节奏与重复结构；词库可围绕 head, face, hand, knee, foot 等。',
};

function fallbackWordEmoji(word: string) {
  const value = word.toLowerCase();
  if (/(happy|joy|cheerful|smile)/.test(value)) return '😊';
  if (/(sad|cry|blue)/.test(value)) return '😢';
  if (/(angry|mad)/.test(value)) return '😠';
  if (/(calm|quiet|peace|relax)/.test(value)) return '😌';
  if (/(scared|afraid|fear)/.test(value)) return '😨';
  if (/(excited|wow)/.test(value)) return '🤩';
  if (/(tired|sleepy|sleep)/.test(value)) return '😴';
  if (/(brave|strong|bold)/.test(value)) return '💪';
  if (/(sun|sunny|bright|shine)/.test(value)) return '☀️';
  if (/(cloud|cloudy)/.test(value)) return '☁️';
  if (/(tree|forest)/.test(value)) return '🌳';
  if (/(leaf|leaves|grass)/.test(value)) return '🍃';
  if (/(river|ocean|wave|lake|water)/.test(value)) return '🌊';
  if (/(flower|bloom)/.test(value)) return '🌸';
  if (/(heart|love|kind)/.test(value)) return '❤️';
  if (/(hand|clap)/.test(value)) return '👏';
  if (/(hug|hold)/.test(value)) return '🤗';
  if (/(jump|hop)/.test(value)) return '🦘';
  if (/(dance|move|wiggle)/.test(value)) return '💃';
  if (/(sing|song)/.test(value)) return '🎵';
  if (/(breathe|breath|air)/.test(value)) return '🌬️';
  if (/(stand|tall|up)/.test(value)) return '🧍';
  if (/(pause|stop)/.test(value)) return '⏸️';
  return '✨';
}

function countBlanks(lines: unknown[]): number {
  return lines.reduce<number>((total, line) => total + (typeof line === 'string' ? (line.match(/______/g) || []).length : 0), 0);
}

function enforceFewerBlanks(lines: string[], words: string[], currentLines: unknown[]): string[] {
  const currentCount = countBlanks(currentLines);
  const targetCount = Math.max(0, currentCount - 2);
  let remainingToRemove = Math.max(0, countBlanks(lines) - targetCount);
  if (!remainingToRemove) return lines;

  const blankLineIndexes = lines.flatMap((line, index) => line.includes('______') ? [index] : []);
  const preferredIndexes = blankLineIndexes.filter((_, position) => position % 2 === 1)
    .concat(blankLineIndexes.filter((_, position) => position % 2 === 0).reverse());
  const removeFrom = new Set(preferredIndexes.slice(0, remainingToRemove));
  let wordIndex = 0;
  return lines.map((line, lineIndex) => {
    if (!removeFrom.has(lineIndex) || !line.includes('______')) return line;
    return line.replace(/______/g, () => {
      if (remainingToRemove <= 0) return '______';
      remainingToRemove -= 1;
      const replacement = words[wordIndex % Math.max(words.length, 1)] || 'happy';
      wordIndex += 1;
      return replacement;
    });
  });
}

export async function POST(request: NextRequest) {
  try {
    const { age, level, participants, themes, themeOther, vocabulary, grammar, melody, adjustmentRequest, currentLines, currentWords } = await request.json();
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
        model: 'qwen-plus', temperature: 0.65, response_format: { type: 'json_object' },
        messages: [
          ...SONG_WRITING_SYSTEM_PROMPTS.map((content) => ({ role: 'system', content })),
          { role: 'user', content: buildSongWritingUserPrompt({ age, level, participants, themeText, vocabulary, grammar, melody, melodyReference, adjustmentRequest, currentLines, currentWords }) },
        ],
      }),
    });
    if (!response.ok) throw new Error(`大模型请求失败：${response.status}`);
    const payload = await response.json();
    const data = JSON.parse(payload.choices?.[0]?.message?.content || '{}');
    if (!Array.isArray(data.lines) || !Array.isArray(data.words) || !data.activityPlan) throw new Error('大模型返回内容不完整');
    const rawWords = data.words.filter((word: unknown): word is string => typeof word === 'string');
    const lines = adjustmentRequest?.includes('填空太多') && Array.isArray(currentLines)
      ? enforceFewerBlanks(data.lines, rawWords, currentLines)
      : data.lines;
    const blankCount = countBlanks(lines);
    const words = rawWords.slice(0, Math.min(12, Math.max(blankCount + 2, blankCount + 3)));
    const wordEmojis = Object.fromEntries(
      words
        .filter((word: unknown): word is string => typeof word === 'string')
        .map((word: string) => {
          const generated = typeof data.wordEmojis?.[word] === 'string' ? data.wordEmojis[word].trim() : '';
          return [word, generated && generated !== '💬' ? generated : fallbackWordEmoji(word)];
        }),
    );
    return NextResponse.json({ success: true, data: { ...data, words, wordEmojis, lines: lines.slice(0, 8) } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '歌曲生成失败' }, { status: 500 });
  }
}
