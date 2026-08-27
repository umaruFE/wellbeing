// 一次性迁移工具：盘点 n8n 工作流中的 LLM 提示词节点结构
// 用法: node api/scripts/n8n-prompt-inventory.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'n8n');
const FILES = [
  '概览/根据课程参数生成创意任务名称.json',
  '概览/润色优化已有的任务名称.json',
  '概览/课程概览调整建议生成.json',
  '教案/单步骤课程生成.json',
  '教案/单环节重新生成.json',
  '教案/单阶段课程重新生成.json',
  'PPT/PPT英文内容与布局生成.json',
  '图片/ai-prompt-optimize.json',
  '图片/ai-prompt-processing.json',
];

for (const rel of FILES) {
  const wf = JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
  console.log(`\n======== ${rel} (workflow: ${wf.name}) ========`);
  for (const [i, node] of wf.nodes.entries()) {
    const t = node.type || '';
    const isLlm = /chainLlm|langchain\.agent/.test(t);
    const isCode = t.includes('code');
    const isWebhook = t.includes('webhook');
    if (!isLlm && !isCode && !isWebhook) continue;
    let desc = '';
    if (isWebhook) desc = `path=${node.parameters?.path}`;
    if (isCode) {
      const src = node.parameters?.jsCode || node.parameters?.code || '';
      desc = `codeLen=${src.length} returns=${(src.match(/return\s/g) || []).length}`;
    }
    if (isLlm) {
      const p = node.parameters?.promptType === 'define' ? node.parameters?.text : null;
      const messages = node.parameters?.messages;
      desc = p ? `promptLen=${p.length}` : `messages=${messages ? 'yes' : 'no'}`;
    }
    console.log(`  [${i}] "${node.name}" type=${t.split('.').pop()} ${desc}`);
    // 输出连接关系（谁连到 LLM 节点）
  }
  console.log('  connections:');
  for (const [from, conns] of Object.entries(wf.connections || {})) {
    for (const c of conns.main || []) {
      for (const t of c || []) console.log(`    ${from} -> ${t.node}`);
    }
  }
}
