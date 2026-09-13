import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { db } from '@/lib/db';
import { createHash } from 'crypto';
import { playableMusicManifest, musicPublicOrigin } from '@/lib/musicPlayback';
import { isMusicCdnUrl } from '@/lib/musicAudioUrls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const workflow = 'gene-music-full-song';
const baseUrl = process.env.N8N_API_BASE_URL || 'http://117.50.218.161:5678';
export const maxDuration = 300;
const headers = () => ({ 'Content-Type': 'application/json', 'X-N8N-API-KEY': process.env.N8N_API_KEY || '' });
const fingerprint = (lyrics: { text: string }[]) => createHash('sha256').update(JSON.stringify(lyrics.map(l => l.text))).digest('hex');

async function readWork(request: NextRequest, id: string) {
  const auth = authenticate(request);
  if (!auth.success || !auth.user) return { response: NextResponse.json({ error: '请先登录' }, { status: 401 }) };
  if (!/^\d+$/.test(id)) return { response: NextResponse.json({ error: '作品ID无效' }, { status: 400 }) };
  const { rows } = await db.query('SELECT id, module_id, title, parameters, result FROM creative_works WHERE id=$1 AND user_id=$2', [Number(id), auth.user.id]);
  if (!rows[0] || rows[0].module_id !== 'music-star-quest') return { response: NextResponse.json({ error: '歌曲作品不存在' }, { status: 404 }) };
  return { work: rows[0] };
}

// Dedicated owner-checked API. n8n keys and ComfyUI credentials never reach the browser.
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const access = await readWork(request, params.id);
    if (access.response) return access.response;
    const work = access.work!;
    const result = work.result || {};
    const lyrics = result.lyrics as { text: string; time?: string }[];
    if (!Array.isArray(lyrics) || !lyrics.length || lyrics.some(l => !String(l.text || '').trim())) return NextResponse.json({ error: '请先保存完整歌词' }, { status: 400 });
    const previous = result.audio?.generationTask;
    const lyricsHash = fingerprint(lyrics);
    if (previous?.status === 'submitted' && previous.lyricsHash === lyricsHash) {
      const check = await fetch(`${baseUrl}/api/v1/executions/${encodeURIComponent(previous.executionId)}`, { headers: headers(), signal: AbortSignal.timeout(15000) });
      if (!check.ok) throw new Error('无法确认已有任务状态，请稍后重试，避免重复生成');
      const execution = await check.json();
      if (!['error', 'stopped', 'canceled', 'crashed'].includes(execution.status)) return NextResponse.json({ data: previous }, { status: 202 });
    }
    const p = work.parameters || {};
    // Reserve intro/outro and enough singing time; old LLM timestamps are NOT alignment.
    const words = lyrics.reduce((n, l) => n + (l.text.match(/\S+/g) || []).length, 0);
    const duration = Math.max(48, Math.ceil(words / 2 + lyrics.length * 0.6 + 12));
    if (duration > 120) return NextResponse.json({ error: '歌词过长，当前整曲流程最多支持120秒，请缩短歌词后再生成' }, { status: 400 });
    const caption = `A complete English classroom song titled ${String(work.title || '').slice(0, 160)}. ${p.style === '舒缓' ? 'Gentle acoustic pop, relaxed tempo' : 'Cheerful acoustic pop, ukulele, piano and light hand claps'}. One clear lead singer, natural English pronunciation, moderate singing speed and breathing gaps. Begin with approximately 8 seconds of instrumental intro before any singing. Sing EVERY supplied lyric line exactly once in the supplied order, including every repeated line and the final lines. Do not omit, add or rewrite words. No rap, ad libs or spoken introduction. Reserve approximately 4 seconds for an instrumental outro and a clean ending. Maintain one consistent melody and voice. The requested intro length is a musical instruction, not an exact timing guarantee.`;
    const upstream = await fetch(`${baseUrl}/webhook/${workflow}`, { method: 'POST', headers: headers(), body: JSON.stringify({ caption, lyrics: lyrics.map(l => ({ text: l.text })), duration, bpm: p.style === '舒缓' ? 85 : 100, language: 'en', targetPoints: (result.targetPatterns || []).map((p: any) => typeof p === 'string' ? p : p.pattern || p.text || '').filter(Boolean).join('\n') }), signal: AbortSignal.timeout(45000) });
    const data = await upstream.json().catch(() => ({}));
    if (!upstream.ok || !data.executionId || !data.promptId) throw new Error('整曲流程未接受任务，请检查n8n执行记录与已发布版本');
    const task = { executionId: String(data.executionId), promptId: data.promptId, status: 'submitted', lyricsHash, requestedDuration: duration, requestedIntroSeconds: 8, submittedAt: new Date().toISOString() };
    await db.query("UPDATE creative_works SET result=jsonb_set(COALESCE(result,'{}'::jsonb),'{audio}',$1::jsonb), updated_at=NOW() WHERE id=$2", [JSON.stringify({ ...(result.audio || {}), generationTask: task }), work.id]);
    return NextResponse.json({ data: task }, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || '整曲任务提交失败' }, { status: 502 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const access = await readWork(request, params.id);
    if (access.response) return access.response;
    const work = access.work!;
    const task = work.result?.audio?.generationTask;
    if (!task?.executionId) return NextResponse.json({ error: '没有待查询的整曲任务' }, { status: 404 });
    if (task.status !== 'completed' && task.lyricsHash !== fingerprint(work.result.lyrics || [])) return NextResponse.json({ error: '歌词已变更，旧歌曲任务已失效，请重新生成' }, { status: 409 });
    const stored = work.result?.audio;
    if (task.status === 'completed' && stored?.transcription?.storage === 'ftp') {
      const cached = playableMusicManifest(stored.transcription, musicPublicOrigin(request));
      return NextResponse.json({ data: { ...cached, status: 'completed', url: cached.url, executionId: task.executionId, promptId: task.promptId, lyricsHash: task.lyricsHash, requestedIntroSeconds: task.requestedIntroSeconds } });
    }
    const response = await fetch(`${baseUrl}/api/v1/executions/${encodeURIComponent(task.executionId)}?includeData=true`, { headers: headers(), signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`n8n任务查询失败（${response.status}）`);
    const execution = await response.json();
    if (['error', 'stopped', 'canceled', 'crashed'].includes(execution.status)) {
      const failure = execution.data?.resultData?.error;
      return NextResponse.json({ data: { status: 'error', executionId: task.executionId, error: `整曲流程失败：${failure?.node?.name || 'n8n'} — ${failure?.description || failure?.message || '请查看执行记录'}` } });
    }
    if (execution.status !== 'success') return NextResponse.json({ data: { status: 'pending', executionId: task.executionId } });
    const runs = execution.data?.resultData?.runData?.['执行结束返回字段'];
    const output = runs?.[runs.length - 1]?.data?.main?.[0]?.[0]?.json;
    const manifest = output?.splitterVersion === '2.0' ? playableMusicManifest(output, musicPublicOrigin(request)) : null;
    if (!manifest?.lyrics?.length) throw new Error('任务缺少v2实际歌词与切句结果，请使用新版流程重新生成');
    let lastEnd = 0;
    for (const line of manifest.lyrics) {
      if (typeof line.text !== 'string' || !line.text.trim() || !Number.isFinite(line.start) || !Number.isFinite(line.end) || line.start < lastEnd || line.end <= line.start || line.end > manifest.actualDuration) throw new Error('转写返回了无效逐句时间，请检查识别结果');
      lastEnd = line.end;
    }
    const url = manifest.url;
    if (!isMusicCdnUrl(manifest.cdnUrl) || manifest.lyrics.some((line: any) => !isMusicCdnUrl(line.cdnUrl))) throw new Error('任务尚未将整曲与句片段上传FTP，请使用新版流程重新生成');
    const nextAudio = {
      ...(work.result.audio || {}), vocal: url, backing: '', segments: manifest.lyrics.map((line: any) => line.url),
      segmentFailures: [], transcription: manifest, actualDuration: manifest.actualDuration,
      alignmentStatus: 'needs_review', timingSource: manifest.timingSource,
      generationTask: { ...task, status: 'completed' }, requestedIntroSeconds: task.requestedIntroSeconds,
    };
    const saved = await db.query("UPDATE creative_works SET result=jsonb_set(jsonb_set(result,'{lyrics}',$1::jsonb),'{audio}',$2::jsonb), updated_at=NOW() WHERE id=$3 AND result#>>'{audio,generationTask,executionId}'=$4 AND result->'lyrics'=$5::jsonb RETURNING id", [JSON.stringify(manifest.lyrics), JSON.stringify(nextAudio), work.id, task.executionId, JSON.stringify(work.result.lyrics)]);
    if (!saved.rows.length) return NextResponse.json({ error: '作品或歌词已变更，请重新打开作品' }, { status: 409 });
    return NextResponse.json({ data: { ...manifest, status: 'completed', executionId: task.executionId, promptId: task.promptId, lyricsHash: task.lyricsHash, url, requestedDuration: task.requestedDuration, requestedIntroSeconds: task.requestedIntroSeconds, alignmentStatus: 'needs_review' } });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || '整曲任务查询失败' }, { status: 502 });
  }
}
