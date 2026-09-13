import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';

export const musicRuntimeDirectory = () => process.env.MUSIC_RUNTIME_DIR || path.join(process.cwd(), '.music-runtime');
export const backingFilename = (source: string) => `backing_${createHash('sha256').update(source).digest('hex').slice(0, 32)}.flac`;
const jobPath = (source: string) => path.join(musicRuntimeDirectory(), 'jobs', backingFilename(source) + '.json');
const alive = (pid: number) => { try { process.kill(pid, 0); return true; } catch { return false; } };
export async function retryMusicBacking(source: string) {
  if (!/^full_song_\d+_\d+\.flac$/.test(source)) return;
  try { const state = JSON.parse(await fs.readFile(jobPath(source), 'utf8')); if (state.status === 'error') await fs.rm(jobPath(source), { force: true }); } catch { /* No existing job. */ }
}
export async function ensureMusicBacking(source: string): Promise<any> {
  if (!/^full_song_\d+_\d+\.flac$/.test(source)) throw new Error('整曲缺少可分离的备用文件');
  const filename = backingFilename(source), stateFile = jobPath(source), lockFile = stateFile + '.lock';
  await fs.mkdir(path.dirname(stateFile), { recursive: true });
  try {
    const state = JSON.parse(await fs.readFile(stateFile, 'utf8'));
    if (state.status === 'ready' || state.status === 'error') return state;
    if (state.status === 'processing' && alive(state.pid) && Date.now() - state.updatedAt < 20 * 60 * 1000) return state;
    await fs.rm(lockFile, { force: true });
  } catch (error: any) { if (error.code !== 'ENOENT') throw error; }
  let lock;
  try { lock = await fs.open(lockFile, 'wx'); } catch (error: any) { if (error.code === 'EEXIST') {
    const stat = await fs.stat(lockFile).catch(() => null);
    if (stat && Date.now() - stat.mtimeMs > 20 * 60 * 1000) { await fs.rm(lockFile, { force: true }); return ensureMusicBacking(source); }
    return { status: 'processing', phase: 'starting' };
  } throw error; }
  await lock.close();
  const log = await fs.open(path.join(path.dirname(stateFile), filename + '.log'), 'a');
  try {
    const child = spawn(process.execPath, [path.join(process.cwd(), 'music', 'backing-worker.mjs'), source, filename], {
      detached: true, stdio: ['ignore', log.fd, log.fd], env: process.env,
    });
    await new Promise<void>((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); });
    child.unref();
    // The worker owns all subsequent state writes, including errors and cleanup.
    return { status: 'processing', phase: 'starting' };
  } catch (error) { await fs.rm(lockFile, { force: true }); throw error; }
  finally { await log.close(); }
}
