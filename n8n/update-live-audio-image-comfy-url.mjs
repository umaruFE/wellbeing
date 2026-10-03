// Update all active live workflows that still target the retired audio/image ComfyUI.
import { readFileSync } from 'node:fs';

const env = readFileSync('api/.env', 'utf8');
const key = env.match(/^N8N_API_KEY=(.*)\r?$/m)?.[1]?.trim();
if (!key) throw new Error('N8N_API_KEY missing');

const api = 'http://117.50.218.161:5678/api/v1';
const oldOrigin = 'http://117.50.171.219:8188';
const newOrigin = 'http://10.60.28.70:8188';
const headers = { 'X-N8N-API-KEY': key, 'Content-Type': 'application/json' };

async function request(path, options = {}) {
  const response = await fetch(`${api}${path}`, { headers, ...options });
  if (!response.ok) throw new Error(`${options.method || 'GET'} ${path}: ${response.status} ${await response.text()}`);
  return response.json();
}

async function listWorkflows() {
  const workflows = [];
  let cursor = '';
  do {
    const params = new URLSearchParams({ limit: '100' });
    if (cursor) params.set('cursor', cursor);
    const page = await request(`/workflows?${params}`);
    workflows.push(...page.data);
    cursor = page.nextCursor || '';
  } while (cursor);
  return workflows;
}

function replaceDeep(value, stats) {
  if (typeof value === 'string') {
    const count = value.split(oldOrigin).length - 1;
    stats.count += count;
    return count ? value.replaceAll(oldOrigin, newOrigin) : value;
  }
  if (Array.isArray(value)) return value.map(item => replaceDeep(item, stats));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replaceDeep(v, stats)]));
  }
  return value;
}

const summaries = await listWorkflows();
for (const summary of summaries) {
  if (!summary.active) continue;
  const workflow = await request(`/workflows/${summary.id}`);
  const stats = { count: 0 };
  const nodes = replaceDeep(workflow.nodes, stats);
  if (!stats.count) continue;

  const latest = await request(`/workflows/${summary.id}`);
  if (latest.versionId !== workflow.versionId) throw new Error(`${workflow.id} changed during update`);
  await request(`/workflows/${workflow.id}`, {
    method: 'PUT',
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

  const saved = await request(`/workflows/${workflow.id}`);
  const serialized = JSON.stringify(saved.nodes);
  if (serialized.includes(oldOrigin) || !serialized.includes(newOrigin)) {
    throw new Error(`${workflow.id} post-update URL verification failed`);
  }
  if (!saved.active || saved.activeVersionId !== saved.versionId) {
    throw new Error(`${workflow.id} active-version verification failed`);
  }
  console.log(JSON.stringify({ id: saved.id, name: saved.name, replacements: stats.count, active: saved.active }));
}
