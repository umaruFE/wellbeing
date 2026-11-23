import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { getPrompt } from '@/prompts/registry';

// Older storyboard pages still call this route. Use the current platform's prompt registry.
export async function POST(request: NextRequest) {
  if (!authenticate(request).success) return NextResponse.json({ error: '请先登录' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const characterDescription = typeof body?.characterDescription === 'string' ? body.characterDescription.trim() : '';
  const videoStyle = typeof body?.videoStyle === 'string' ? body.videoStyle.trim() : '';
  if (!characterDescription || characterDescription.length > 4000 || videoStyle.length > 200) {
    return NextResponse.json({ error: '请提供有效的人物描述和视频风格。' }, { status: 400 });
  }
  const prompt = await getPrompt('frontend.character-reference-zh', { characterDescription });
  return NextResponse.json({ success: true, prompt: videoStyle ? `${prompt}，${videoStyle}` : prompt });
}
