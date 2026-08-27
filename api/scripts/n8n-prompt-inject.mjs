// 一次性迁移工具（步骤3）：n8n 提示词外置到后端注册表
//   1. 从 9 个工作流 JSON 提取全部 LLM 提示词（含 optimize 的 task_type 模板映射）
//   2. 转换 n8n 表达式 {{ $json.xxx }} → {{xxx}}（渲染语法与后端注册表一致）
//   3. 工作流改造：参数组装 Code 节点渲染后端下发的 promptTemplate；LLM 节点改读 $json.system_prompt
//   4. 生成 api/src/prompts/n8n-templates.json（builtin 兜底模板，单一事实源）
// 用法: node api/scripts/n8n-prompt-inject.mjs
// 注意：仅可运行一次（运行后原 LLM 节点内联提示词已被移除）
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const N8N_ROOT = join(API_ROOT, '..', 'n8n');

const RENDER_LIB = `
// ─── 提示词注册表渲染（模板由后端下发：api/src/prompts，Wiki 页面可覆盖）───
const __renderPrompt = (tpl, vars) => String(tpl).replace(/\\{\\{\\s*(\\w+)\\s*\\}\\}/g, (m, k) => (vars[k] === undefined || vars[k] === null) ? '' : String(vars[k]));
const __template = input.promptTemplate;
if (!__template) throw new Error('缺少 promptTemplate：后端提示词注册表未下发，请先部署最新 api/src/prompts 再导入本工作流');
__out.system_prompt = __renderPrompt(__template, __out);
return __out;
`;

const MISSING_TPL_ERROR = '缺少 promptTemplate：后端提示词注册表未下发，请先部署最新 api/src/prompts 再导入本工作流';

/** n8n 表达式 → 注册表占位符 */
function convertExpr(text) {
  return String(text)
    .replace(/^\s*=\s*/, '')
    .replace(/\{\{\s*\$json\.([A-Za-z_][\w.]*)\s*\}\}/g, (_, p) => `{{${p.replace(/\./g, '__')}}}`)
    .replace(/\{\{\s*\$json\.slideIndex \+ 1\s*\}\}/g, '{{slideIndexPlus1}}')
    .replace(/\{\{\s*JSON\.stringify\(\$json\.slidePlan\)\s*\}\}/g, '{{slidePlanJson}}')
    .replace(/\{\{\s*JSON\.stringify\(\$json\.sourceStep\)\s*\}\}/g, '{{sourceStepJson}}');
}

function node(wf, name) {
  const n = wf.nodes.find((x) => x.name === name);
  if (!n) throw new Error(`节点不存在: ${name}`);
  return n;
}

const templates = {};

function readWf(rel) {
  return JSON.parse(readFileSync(join(N8N_ROOT, rel), 'utf8'));
}
function writeWf(rel, wf) {
  const out = JSON.stringify(wf, null, 2);
  JSON.parse(out); // 写回前校验
  writeFileSync(join(N8N_ROOT, rel), out + '\n', 'utf8');
}

// ── 1) 标准链：Webhook → 参数组装 → LLM ───────────────────────
function migrateStandard(rel, codeNodeName, llmNodeName, key) {
  const wf = readWf(rel);
  const code = node(wf, codeNodeName);
  const src = code.parameters.jsCode || code.parameters.code;
  const wrapped = src.replace(/return\s*\{([\s\S]*)\}\s*;\s*$/, `const __out = {$1};${RENDER_LIB}`);
  if (wrapped === src) throw new Error(`${rel}: 参数组装 return 包装失败`);
  code.parameters.jsCode = wrapped;

  const llm = node(wf, llmNodeName);
  templates[key] = convertExpr(llm.parameters.text);
  llm.parameters.text = '={{ $json.system_prompt }}';

  writeWf(rel, wf);
  console.log(`OK ${rel} -> ${key} (${templates[key].length} chars)`);
}

// ── 2) PPT：两条 LLM 链 ────────────────────────────────────────
function migratePpt() {
  const rel = 'PPT/PPT英文内容与布局生成.json';
  const wf = readWf(rel);

  // Plan 链：Prepare Course Context 渲染
  const prepare = node(wf, 'Prepare Course Context');
  const src = prepare.parameters.jsCode;
  const wrapped = src.replace(
    /return\s*\[\{\s*json:\s*([\s\S]*)\s*\}\s*\]\s*;?\s*$/,
    `const __out = {$1};${RENDER_LIB}return [{ json: __out }];`
  );
  if (wrapped === src) throw new Error('PPT Prepare 包装失败');
  prepare.parameters.jsCode = wrapped;

  templates['n8n.ppt-plan'] = convertExpr(node(wf, 'Plan Slide Deck').parameters.text);
  node(wf, 'Plan Slide Deck').parameters.text = '={{ $json.system_prompt }}';

  // Slide 链：Parse Slide Plan 每项渲染
  const parse = node(wf, 'Parse Slide Plan');
  const psrc = parse.parameters.jsCode;
  const MAP_RETURN = 'return normalized.map((slide, slideIndex) => ({ json: {';
  if (!psrc.includes(MAP_RETURN)) throw new Error('PPT Parse map 锚点未找到');
  const helpers = `
// ─── 提示词注册表渲染（模板由后端下发：api/src/prompts）───
const __renderPrompt = (tpl, vars) => String(tpl).replace(/\\{\\{\\s*(\\w+)\\s*\\}\\}/g, (m, k) => (vars[k] === undefined || vars[k] === null) ? '' : String(vars[k]));
const __slideTemplate = $('PPT Generation Webhook').first().json.body.promptTemplateSlide;
if (!__slideTemplate) throw new Error('${MISSING_TPL_ERROR}');
const __renderSlide = (slide, slideIndex) => __renderPrompt(__slideTemplate, {
  courseTitle: prepared.courseTitle,
  courseContext: prepared.courseContext,
  visualStyle: prepared.visualStyle,
  totalSlides: prepared.totalSlides,
  slideIndex,
  slideIndexPlus1: slideIndex + 1,
  slidePlanJson: JSON.stringify(slide),
  sourceStepJson: JSON.stringify(slide.stepId === 'cover-step' ? null : stepMap.get(slide.stepId)),
  slidePlan__id: slide.id,
  slidePlan__phaseKey: slide.phaseKey,
  slidePlan__stepId: slide.stepId,
  slidePlan__type: slide.type
});
`;
  parse.parameters.jsCode = psrc.replace(MAP_RETURN, `${helpers}\n${MAP_RETURN}\n  system_prompt: __renderSlide(slide, slideIndex),`);

  templates['n8n.ppt-slide'] = convertExpr(node(wf, 'Generate One Slide').parameters.text);
  node(wf, 'Generate One Slide').parameters.text = '={{ $json.system_prompt }}';

  writeWf(rel, wf);
  console.log(`OK ${rel} -> n8n.ppt-plan (${templates['n8n.ppt-plan'].length}) + n8n.ppt-slide (${templates['n8n.ppt-slide'].length})`);
}

// ── 3) ai-prompt-optimize：task_type 模板映射 ───────────────────
function migrateOptimize() {
  const rel = '图片/ai-prompt-optimize.json';
  const wf = readWf(rel);
  const code = node(wf, '获取优化模板');
  const src = code.parameters.jsCode;

  const mapMatch = src.match(/const promptTemplates = ([\s\S]*?);\s*\nconst systemPrompt/);
  if (!mapMatch) throw new Error('optimize 模板映射提取失败');
  const map = new Function(`return (${mapMatch[1]})`)();
  for (const [taskType, tpl] of Object.entries(map)) {
    templates[`n8n.optimize.${taskType}`] = String(tpl);
  }

  let next = src.replace(/const promptTemplates = [\s\S]*?;\s*\nconst systemPrompt/, 'const systemPrompt');
  next = next.replace(
    /const systemPrompt = promptTemplates\[taskType\] \|\| promptTemplates\['general'\];/,
    `const systemPrompt = item.body?.promptTemplate;\nif (!systemPrompt) throw new Error('${MISSING_TPL_ERROR}');`
  );
  if (next === src) throw new Error('optimize 注入失败');
  code.parameters.jsCode = next;

  writeWf(rel, wf);
  console.log(`OK ${rel} -> n8n.optimize.* (${Object.keys(map).length} 个 task_type 模板)`);
}

// ── 4) ai-prompt-processing：静态 Agent 提示词 ──────────────────
function migrateProcessing() {
  const rel = '图片/ai-prompt-processing.json';
  const wf = readWf(rel);
  const code = node(wf, '🔍 解析与提取');
  const src = code.parameters.jsCode;
  const ANCHOR = 'return [{\n  json: {\n    original_text: text,';
  if (!src.includes(ANCHOR)) throw new Error('processing 锚点未找到');
  code.parameters.jsCode = src.replace(
    ANCHOR,
    `const __template = item.body?.promptTemplate;\nif (!__template) throw new Error('${MISSING_TPL_ERROR}');\n${ANCHOR.replace('original_text: text,', 'system_prompt: __template,\n    original_text: text,')}`
  );

  const agent = node(wf, 'AI Agent');
  templates['n8n.scene-keywords'] = convertExpr(agent.parameters.text);
  agent.parameters.text = '={{ $json.system_prompt }}';

  writeWf(rel, wf);
  console.log(`OK ${rel} -> n8n.scene-keywords (${templates['n8n.scene-keywords'].length})`);
}

// ── 执行 ───────────────────────────────────────────────────────
migrateStandard('概览/根据课程参数生成创意任务名称.json', '参数组装', '创意生成', 'n8n.course-idea');
migrateStandard('概览/润色优化已有的任务名称.json', '参数组装', '内容润色', 'n8n.course-polish');
migrateStandard('概览/课程概览调整建议生成.json', '参数组装', '调整建议生成', 'n8n.overview-tips');
migrateStandard('教案/单步骤课程生成.json', '参数组装', 'Basic LLM Chain', 'n8n.course-step');
migrateStandard('教案/单环节重新生成.json', '参数组装', 'Basic LLM Chain', 'n8n.course-step-regen');
migrateStandard('教案/单阶段课程重新生成.json', '参数组装', 'Basic LLM Chain', 'n8n.course-phase-regen');
migratePpt();
migrateOptimize();
migrateProcessing();

const templatesPath = join(API_ROOT, 'src', 'prompts', 'n8n-templates.json');
writeFileSync(templatesPath, JSON.stringify(templates, null, 2) + '\n', 'utf8');
console.log(`\nwritten ${templatesPath}`);
console.log('keys:', Object.keys(templates).join(', '));

// 校验：模板中不应再残留 n8n 表达式
for (const [k, v] of Object.entries(templates)) {
  if (/\$json|\$input|\$now/.test(v)) console.warn(`WARN ${k} 残留 n8n 表达式`);
}
console.log('done');
