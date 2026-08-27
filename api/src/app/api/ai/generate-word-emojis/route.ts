import { NextRequest, NextResponse } from 'next/server';
import { getPromptPair } from '@/prompts/registry';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const words: string[] = Array.isArray(body.words)
      ? Array.from(new Set<string>(body.words.map((word: unknown) => typeof word === 'string' ? word.trim() : '').filter(Boolean))).slice(0, 20)
      : [];
    if (!words.length) return NextResponse.json({ success: true, data: {} });

    const apiKey = process.env.VITE_DASHSCOPE_API_KEY;
    const apiUrl = process.env.VITE_DASHSCOPE_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';
    if (!apiKey) throw new Error('未配置大模型 API Key');

    const { system, user } = await getPromptPair('ai.word-emojis', {}, { words: JSON.stringify(words) });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'qwen-plus',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!response.ok) throw new Error(`大模型请求失败：${response.status}`);
    const payload = await response.json();
    const generated = JSON.parse(payload.choices?.[0]?.message?.content || '{}');
    const data = Object.fromEntries(words.flatMap((word) => {
      const emoji = typeof generated[word] === 'string' ? generated[word].trim() : '';
      return emoji && emoji.length <= 16 && !/[a-z\d]/i.test(emoji) ? [[word, emoji]] : [];
    }));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '词卡图标生成失败' }, { status: 500 });
  }
}
