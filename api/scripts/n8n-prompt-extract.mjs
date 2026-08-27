// 一次性迁移工具（步骤2）：提取全部 LLM 提示词与参数组装源码 → out-n8n-prompts.json 供审查
// 表达式语法自动转换：{{ $json.xxx }} → {{xxx}}；{{ $json.xxx.yyy }} → {{xxx__yyy}}；其余 n8n 表达式原样保留并标注
import { readFileSync, writeFileSync } from 'node:fs';
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

function convertExpr(text) {
  const leftovers = [];
  const out = text.replace(/\{\{\s*\$json\.([A-Za-z_][\w.]*)\s*\}\}/g, (_, path) => {
    const key = path.replace(/\./g, '__');
    return `{{${key}}}`;
  });
  // 找出剩余的非 $json 表达式（如 $input、$now、JSON.stringify）
  for (const m of out.matchAll(/\{\{[^}]*\}\}/g)) {
    if (!/^\{\{[\w_]+\}\}$/.test(m[0])) leftovers.push(m[0]);
  }
  return { text: out, leftovers };
}

const dump = [];
for (const rel of FILES) {
  const wf = JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
  const entry = { file: rel, nodes: [] };
  for (const node of wf.nodes) {
    const t = node.type || '';
    if (/chainLlm|langchain\.agent/.test(t)) {
      const raw = node.parameters?.promptType === 'define' ? node.parameters?.text : '';
      const conv = raw ? convertExpr(raw) : { text: '', leftovers: [] };
      entry.nodes.push({ name: node.name, kind: 'llm', rawLength: raw?.length || 0, prompt: conv.text, leftoverExpressions: conv.leftovers });
    } else if (t.includes('code')) {
      const src = node.parameters?.jsCode || node.parameters?.code || '';
      entry.nodes.push({ name: node.name, kind: 'code', source: src });
    }
  }
  dump.push(entry);
}
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), 'out-n8n-prompts.json'), JSON.stringify(dump, null, 2), 'utf8');
console.log('written out-n8n-prompts.json, workflows:', dump.length);
for (const e of dump) {
  for (const n of e.nodes.filter((x) => x.kind === 'llm')) {
    console.log(`${e.file} :: ${n.name} :: len=${n.rawLength} leftovers=${n.leftoverExpressions.length}`);
    n.leftoverExpressions.slice(0, 5).forEach((x) => console.log(`   LEFTOVER: ${x}`));
  }
}
