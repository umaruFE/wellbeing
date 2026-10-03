// Point live image workflows at the public address of the replacement ComfyUI.
import { readFileSync } from 'node:fs';

const env = readFileSync('api/.env', 'utf8');
const key = env.match(/^N8N_API_KEY=(.*)\r?$/m)?.[1]?.trim();
if (!key) throw new Error('N8N_API_KEY missing');

const api = 'http://117.50.218.161:5678/api/v1';
const newOrigin = 'http://117.50.194.242:8188';
const targets = new Map([
  ['1rBY3rKFlO4kzMN4', ['http://10.60.28.70:8188']],
  ['3olPU16KxeNqszal', ['http://10.60.28.70:8188']],
  ['EzsNcrFBrpavimcD', ['http://10.60.28.70:8188']],
  ['LvH22pvHG5oZdSDs', ['http://10.60.28.70:8188']],
  ['MO4azZnDmSOhhxBb', ['http://10.60.28.70:8188']],
  ['XXaDQExhv5oidrKh', ['http://10.60.28.70:8188']],
  ['Y6uV4Hb2iPlUJUVh', ['http://10.60.28.70:8188']],
  ['Yob3i0jyxxUCkEF0', ['http://10.60.28.70:8188']],
  ['YqdU9s7KibknkR1F', ['http://10.60.28.70:8188']],
  ['cXSOvlnODaYi4B6Y', ['http://10.60.28.70:8188']],
  ['nk3rGzPaap4DV1Qh', ['http://117.50.174.205:8188', 'http://10.60.28.70:8188']],
  ['XdbAwSvOVdTaoJPA', ['http://117.50.174.205:8188', 'http://10.60.28.70:8188']],
  ['FYRzERdowSuGbhMy', ['http://10.60.28.70:8188']], // 🦅单人视频-生成配音-Webhook
  ['YaPEJOrK4FpAa1LY', ['http://10.60.28.70:8188']], // 🪿单人视频-生成背景音乐
  ['dSzHC0vfUXO3GgTo', ['http://10.60.28.70:8188']], // gene-music-full-song · ACE-Step整曲生成
  ['htV9YwPHhjaIGOcn', ['http://10.60.28.70:8188']], // 🦅单人视频-生成配音
]);
const headers = { 'X-N8N-API-KEY': key, 'Content-Type': 'application/json' };

async function get(id) {
  const response = await fetch(`${api}/workflows/${id}`, { headers });
  if (!response.ok) throw new Error(`GET ${id}: ${response.status}`);
  return response.json();
}

function replaceDeep(value, oldOrigins, stats) {
  if (typeof value === 'string') {
    let next = value;
    for (const origin of oldOrigins) {
      const count = next.split(origin).length - 1;
      stats.count += count;
      if (count) next = next.replaceAll(origin, newOrigin);
    }
    return next;
  }
  if (Array.isArray(value)) return value.map(item => replaceDeep(item, oldOrigins, stats));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replaceDeep(v, oldOrigins, stats)]));
  }
  return value;
}

for (const [id, oldOrigins] of targets) {
  const workflow = await get(id);
  const stats = { count: 0 };
  const nodes = replaceDeep(workflow.nodes, oldOrigins, stats);
  if (!stats.count) {
    console.log(JSON.stringify({ id, name: workflow.name, status: 'unchanged' }));
    continue;
  }
  const latest = await get(id);
  if (latest.versionId !== workflow.versionId) throw new Error(`${id} changed during update`);
  const response = await fetch(`${api}/workflows/${id}`, {
    method: 'PUT', headers,
    body: JSON.stringify({
      name: workflow.name, nodes, connections: workflow.connections,
      settings: { executionOrder: workflow.settings.executionOrder, callerPolicy: workflow.settings.callerPolicy },
    }),
  });
  if (!response.ok) throw new Error(`PUT ${id}: ${response.status} ${await response.text()}`);
  const saved = await get(id);
  const serialized = JSON.stringify(saved.nodes);
  if (!serialized.includes(newOrigin) || oldOrigins.some(origin => serialized.includes(origin))) {
    throw new Error(`${id} post-update URL verification failed`);
  }
  if (!saved.active || saved.activeVersionId !== saved.versionId) {
    throw new Error(`${id} active-version verification failed`);
  }
  console.log(JSON.stringify({ id, name: saved.name, replacements: stats.count, active: saved.active }));
}
