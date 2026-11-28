export class MediaSubmissionError extends Error {}

export function mediaFailureMessage(reason: string, fallback: string): string {
  if (/没有可用的 GPU|GPU.+探测失败|GPU.+unavailable/i.test(reason)) return '生成服务未连上 GPU，请稍后重试。';
  if (/timed?\s*out|超时|ETIMEDOUT/i.test(reason)) return '生成服务连接超时，请稍后重试。';
  if (/ECONN|fetch failed|connection refused/i.test(reason)) return '暂时无法连接生成服务，请稍后重试。';
  return fallback;
}

export function mediaTaskId(result: any): string {
  const id = [result?.executionId, result?.promptId, result?.id]
    .map(value => typeof value === 'string' ? value.trim() : Number.isSafeInteger(value) ? String(value) : '')
    .find(Boolean);
  if (!id || result?.success === false || ['error', 'failed'].includes(String(result?.status).toLowerCase())) {
    throw new MediaSubmissionError(mediaFailureMessage(String(result?.error || result?.message || ''), '生成服务未确认任务，请稍后重试。'));
  }
  return id;
}

export function mediaSubmissionFailure(error: unknown, fallback: string, headers: HeadersInit): Response {
  const upstream = error instanceof MediaSubmissionError;
  return Response.json({ success: false, error: upstream ? error.message : fallback }, { status: upstream ? 502 : 500, headers });
}

type AudioFile = { url: string; filename?: string };

// get-resource returns a URL under data for single files and a list for batches.
export function audioFiles(value: any): AudioFile[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(audioFiles);
  if (typeof value === 'string') {
    const url = value.trim();
    return /^(https?:\/\/|\/(?!\/)|data:audio\/)/i.test(url) ? [{ url }] : [];
  }
  const files = audioFiles(value.url || value.audio_url || value.output?.url || value.data);
  return value.filename ? files.map(file => ({ ...file, filename: file.filename || value.filename })) : files;
}
