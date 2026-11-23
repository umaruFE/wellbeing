import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { classificationPrompts, parseClassificationInput, parseClassificationOutput } from '@/lib/experience/classification';
import { generateJsonWithDeepSeek } from '@/lib/n8n/deepseek';

export const runtime = 'nodejs';
export const maxDuration = 180;

export async function POST(request: NextRequest) {
  const auth = authenticate(request);
  if (!auth.success || !auth.user?.id) {
    return NextResponse.json({ error: '请登录后生成分类内容。' }, { status: 401 });
  }

  let input;
  try {
    input = parseClassificationInput(await request.json().catch(() => null));
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }

  try {
    const { system, user } = classificationPrompts(input);
    const generated = await generateJsonWithDeepSeek<unknown>(system, user, 150_000);
    const data = parseClassificationOutput(input, generated);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[generate-classification] 生成失败:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({ error: '分类生成服务未能返回完整题目，请重试。' }, { status: 502 });
  }
}
