import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { generateJsonWithDeepSeek } from '@/lib/n8n/deepseek';
import { getPromptPair } from '@/prompts/registry';

export const runtime = 'nodejs';
export const maxDuration = 75;

const speakingRoles = new Set([
  'super_admin', 'org_admin', 'research_leader', 'creator', 'picture_song_creator', 'viewer',
]);

function englishText(value: unknown, maxLength: number) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!/[a-z]/i.test(text) || /[<>]/.test(text) || text.length > maxLength) {
    throw new Error('操练语言的字段格式有误');
  }
  return text;
}

type GeneratedLanguage = {
  unit?: unknown;
  sentences?: { main?: unknown; full?: unknown };
  dialog?: unknown;
  pools?: { acts?: unknown };
};

function normalizePack(generated: GeneratedLanguage | null) {
  const dialogs = generated?.dialog;
  const actions = generated?.pools?.acts;
  if (!Array.isArray(dialogs) || dialogs.length !== 3 || !Array.isArray(actions) || actions.length > 6) {
    throw new Error('操练语言的问答或动作格式有误');
  }

  const dialog = dialogs.map((pair) => ({
    q: englishText(pair?.q, 500),
    a: englishText(pair?.a, 500),
  }));
  return {
    unit: englishText(generated?.unit, 100),
    sentences: {
      main: englishText(generated?.sentences?.main, 800),
      full: englishText(generated?.sentences?.full, 1800),
    },
    dialog,
    pools: { acts: Array.from(new Set(actions.map((action) => englishText(action, 80)))) },
    sel: { main: true, full: true, d: dialog.map(() => true) },
  };
}

export async function POST(request: NextRequest) {
  const { user, error } = authenticate(request);
  if (!user?.id) {
    return NextResponse.json({ success: false, error: error || '请先登录' }, { status: 401 });
  }
  if (!speakingRoles.has(user.role)) {
    return NextResponse.json({ success: false, error: '当前账号没有口语活动权限' }, { status: 403 });
  }

  let input = '';
  try {
    const body = await request.json();
    if (typeof body?.input === 'string') input = body.input.trim();
  } catch {
    return NextResponse.json({ success: false, error: '请求需要使用 JSON 格式' }, { status: 400 });
  }
  if (!/[a-z]{2}/i.test(input) || input.length > 6000) {
    return NextResponse.json({ success: false, error: '请输入最多 6000 字符的英文课文、句子或问答' }, { status: 400 });
  }

  try {
    const { system, user: prompt } = await getPromptPair('ai.speaking-language', {}, { input: JSON.stringify(input) });
    const generated = await generateJsonWithDeepSeek<GeneratedLanguage>(system, prompt, 60_000);
    return NextResponse.json({ success: true, data: normalizePack(generated) });
  } catch (error) {
    console.error('[generate-speaking-language] generation failed:', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ success: false, error: '后台未能生成操练语言，请稍后重试' }, { status: 502 });
  }
}
