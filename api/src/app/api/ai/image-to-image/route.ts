import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { n8nClient } from '@/lib/n8n/client';

export const runtime = 'nodejs';
export const maxDuration = 180;

function mediaReference(value: unknown, origin: string): string | null {
  if (typeof value !== 'string' || value.length > 4096 || /[\\\u0000-\u001f]/.test(value)) return null;
  try {
    const base = new URL(process.env.NEXT_PUBLIC_API_URL || origin);
    const url = new URL(value, base);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
    if (url.origin === base.origin || url.origin === origin) {
      return /^\/(?:uploads\/|api\/media\/(?:oss|ppt-image)$)/.test(url.pathname) ? url.href : null;
    }
    const providers = [process.env.FTP_CDN_DOMAIN, process.env.ALIYUN_OSS_ENDPOINT, process.env.COMFYUI_PUBLIC_URL];
    const hosts = providers.filter(Boolean).map(provider => {
      try { return new URL(provider!.includes('://') ? provider! : `https://${provider}`).host; }
      catch { return ''; }
    });
    return hosts.includes(url.host) || url.hostname.endsWith('.aliyuncs.com') ? url.href : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const auth = authenticate(request);
  if (!auth.user) return NextResponse.json({ error: '请先登录' }, { status: 401 });
  const body = await request.json().catch(() => null);
  const { prompt, imageUrl, count = 1, width = 1024, height = 1024, strength = 0.75 } = body || {};
  const reference = mediaReference(imageUrl, new URL(request.url).origin);
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 8000 || !reference
    || !Number.isInteger(count) || count < 1 || count > 4
    || ![width, height].every(size => Number.isInteger(size) && size >= 128 && size <= 2048)
    || typeof strength !== 'number' || !Number.isFinite(strength) || strength < 0 || strength > 1) {
    return NextResponse.json({ error: '请提供有效的提示词、平台参考图和生成参数。' }, { status: 400 });
  }
  try {
    // This is the original reference-image webhook, with tasks shaped for the current studio poller.
    const tasks = await Promise.all(Array.from({ length: count }, async () => {
      const result = await n8nClient.call('ai-image-to-image', {
        prompt: prompt.trim(), image_url: reference, width, height, strength,
        user_id: auth.user!.id, organization_id: auth.user!.organizationId, timestamp: Date.now(),
      });
      const promptId = result.executionId || result.id || result.prompt_id;
      if (!promptId) throw new Error('缺少任务编号');
      return { type: 'image-to-image', promptId, apiUrl: result.comfyuiUrl };
    }));
    return NextResponse.json({ success: true, executionId: tasks[0].promptId, tasks, workflowType: 'image-to-image', workflow: 'ai-image-to-image' });
  } catch (error) {
    console.error('[image-to-image] workflow failed:', error instanceof Error ? error.name : 'UnknownError');
    return NextResponse.json({ error: '原图生图工作流暂未返回任务，请稍后重试。' }, { status: 502 });
  }
}
