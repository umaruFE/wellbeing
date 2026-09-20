import { NextRequest, NextResponse } from 'next/server';
import { getPromptPair } from '@/prompts/registry';
import { generateJsonWithDeepSeek } from '@/lib/n8n/deepseek';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const words: string[] = Array.isArray(body.words)
      ? Array.from(new Set<string>(body.words.map((word: unknown) => typeof word === 'string' ? word.trim() : '').filter(Boolean))).slice(0, 20)
      : [];
    if (!words.length) return NextResponse.json({ success: true, data: {} });

    const { system, user } = await getPromptPair('ai.word-emojis', {}, { words: JSON.stringify(words) });
    const generated = await generateJsonWithDeepSeek<Record<string, unknown>>(system, user);
    const data = Object.fromEntries(words.flatMap((word) => {
      const emoji = typeof generated[word] === 'string' ? generated[word].trim() : '';
      return emoji && emoji.length <= 16 && !/[a-z\d]/i.test(emoji) ? [[word, emoji]] : [];
    }));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '词卡图标生成失败' }, { status: 500 });
  }
}
