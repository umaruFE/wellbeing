// One-off update of the live music workflow. Run from repository root.
import { readFileSync } from 'node:fs';

const env = readFileSync('api/.env', 'utf8');
const key = env.match(/^N8N_API_KEY=(.*)\r?$/m)?.[1]?.trim();
if (!key) throw new Error('N8N_API_KEY missing');
const url = 'http://117.50.218.161:5678/api/v1/workflows/dSzHC0vfUXO3GgTo';
const headers = { 'X-N8N-API-KEY': key, 'Content-Type': 'application/json' };
const get = async () => {
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`GET workflow: ${response.status}`);
  return response.json();
};
const workflow = await get();
const config = workflow.nodes.find(node => node.name === '配置与构建ComfyUI API图');
const webhook = workflow.nodes.find(node => node.name === '接收整曲请求');
const probeName = '探测主ComfyUI服务';
if (!config || !webhook || !workflow.nodes.some(node => node.name === probeName)) throw new Error('Unexpected workflow structure');
if (!config.parameters.jsCode.includes("comfyUrl: ($input.first().json?.system ? 'http://117.50.171.219:8188' : 'http://117.50.214.226:8188')")) throw new Error('Unexpected ComfyUI configuration');
if (workflow.connections[webhook.name]?.main?.[0]?.[0]?.node !== probeName) throw new Error('Unexpected webhook connection');

config.parameters.jsCode = config.parameters.jsCode
  .replace("comfyUrl: ($input.first().json?.system ? 'http://117.50.171.219:8188' : 'http://117.50.214.226:8188')", "comfyUrl: 'http://117.50.214.226:8188'")
  .replace("const input = $('接收整曲请求').first().json;", 'const input = $input.first().json;');
workflow.nodes = workflow.nodes.filter(node => node.name !== probeName);
workflow.connections[webhook.name].main[0] = [{ node: config.name, type: 'main', index: 0 }];
delete workflow.connections[probeName];

const latest = await get();
if (latest.versionId !== workflow.versionId) throw new Error('Workflow changed during update');
const response = await fetch(url, { method: 'PUT', headers, body: JSON.stringify({
  name: workflow.name, nodes: workflow.nodes, connections: workflow.connections,
  settings: { executionOrder: workflow.settings.executionOrder, callerPolicy: workflow.settings.callerPolicy },
}) });
if (!response.ok) throw new Error(`PUT workflow: ${response.status} ${await response.text()}`);
const saved = await get();
if (!saved.active || saved.activeVersionId !== saved.versionId ||
    saved.nodes.some(node => node.name === probeName) ||
    !saved.nodes.find(node => node.name === config.name)?.parameters.jsCode.includes("comfyUrl: 'http://117.50.214.226:8188'")) {
  throw new Error('Post-update verification failed');
}
console.log(JSON.stringify({ id: saved.id, active: saved.active, versionId: saved.versionId, updatedAt: saved.updatedAt }));
