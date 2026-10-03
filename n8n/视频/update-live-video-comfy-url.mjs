// One-off, concurrency-safe update of live video workflows. Run from repository root.
import { readFileSync } from 'node:fs';

const env = readFileSync('api/.env', 'utf8');
const key = env.match(/^N8N_API_KEY=(.*)\r?$/m)?.[1]?.trim();
if (!key) throw new Error('N8N_API_KEY missing');

const base = 'http://117.50.218.161:5678/api/v1/workflows';
const oldOrigin = 'http://10.60.91.244:8188';
const newOrigin = 'http://10.60.91.244:8188';
const workflowIds = [
  'TlQWcAQoa4n72j4P', // 视频片段
  '9xFQ2QOzi2rPI4a5', // 量化视频
  'nk3rGzPaap4DV1Qh', // 分镜图片
  'XdbAwSvOVdTaoJPA', // 人物生成
];
const headers = { 'X-N8N-API-KEY': key, 'Content-Type': 'application/json' };

async function getWorkflow(id) {
  const response = await fetch(`${base}/${id}`, { headers });
  if (!response.ok) throw new Error(`GET ${id}: ${response.status}`);
  return response.json();
}

function replaceDeep(value, stats) {
  if (typeof value === 'string') {
    const matches = value.split(oldOrigin).length - 1;
    stats.count += matches;
    return matches ? value.replaceAll(oldOrigin, newOrigin) : value;
  }
  if (Array.isArray(value)) return value.map(item => replaceDeep(item, stats));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replaceDeep(v, stats)]));
  }
  return value;
}

for (const id of workflowIds) {
  const workflow = await getWorkflow(id);
  const stats = { count: 0 };
  const nodes = replaceDeep(workflow.nodes, stats);
  if (!stats.count) {
    console.log(JSON.stringify({ id, name: workflow.name, status: 'unchanged', replacements: 0 }));
    continue;
  }

  const latest = await getWorkflow(id);
  if (latest.versionId !== workflow.versionId) throw new Error(`${id} changed during update`);
  const response = await fetch(`${base}/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      name: workflow.name,
      nodes,
      connections: workflow.connections,
      settings: {
        executionOrder: workflow.settings.executionOrder,
        callerPolicy: workflow.settings.callerPolicy,
      },
    }),
  });
  if (!response.ok) throw new Error(`PUT ${id}: ${response.status} ${await response.text()}`);

  const saved = await getWorkflow(id);
  const serialized = JSON.stringify(saved.nodes);
  if (serialized.includes(oldOrigin) || !serialized.includes(newOrigin)) {
    throw new Error(`${id} post-update URL verification failed`);
  }
  if (workflow.active && (!saved.active || saved.activeVersionId !== saved.versionId)) {
    throw new Error(`${id} active-version verification failed`);
  }
  console.log(JSON.stringify({
    id: saved.id,
    name: saved.name,
    active: saved.active,
    versionId: saved.versionId,
    replacements: stats.count,
    updatedAt: saved.updatedAt,
  }));
}
