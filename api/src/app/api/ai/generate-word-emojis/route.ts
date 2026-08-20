import { NextRequest, NextResponse } from 'next/server';

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

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'qwen-plus',
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: '你负责给儿童英文词卡匹配图标。每个词只返回一个语义最直接、儿童容易理解的 emoji；不要统一使用星星、对话框或问号。严格返回 JSON 对象，键必须与输入词完全一致，值只能是 emoji。',
          },
          { role: 'user', content: `为这些词匹配 emoji：${JSON.stringify(words)}` },
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
