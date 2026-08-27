// v2 共存改造：9 个二期工作流 webhook path + name 加 v2 后缀
// 用途：n8n 实例无测试/正式区分，v2 新流程与 v1 老流程共存，
//       后端切流到 v2 验证通过后，删除 v1 老流程即可。
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// 工作流文件 → 旧 webhook path（须与 n8n 节点实际值一致，脚本会校验）
const TARGETS = {
  '概览/根据课程参数生成创意任务名称.json': 'course-idea-generator',
  '概览/润色优化已有的任务名称.json': 'course-content-polisher',
  '概览/课程概览调整建议生成.json': 'course-overview-adjustment-tips-generator',
  '教案/单步骤课程生成.json': 'course-step-generator',
  '教案/单环节重新生成.json': 'course-step-regenerator',
  '教案/单阶段课程重新生成.json': 'course-phase-regenerator',
  'PPT/PPT英文内容与布局生成.json': 'ppt-content-generator',
  '图片/ai-prompt-optimize.json': 'ai-prompt-optimize',
  '图片/ai-prompt-processing.json': 'ai-prompt-processing',
};

const SUFFIX = '-v2';
let fail = 0;

for (const [rel, oldPath] of Object.entries(TARGETS)) {
  const file = join(ROOT, 'n8n', rel);
  const wf = JSON.parse(readFileSync(file, 'utf8'));

  // 1) webhook 节点 path 改名
  const hookNodes = (wf.nodes || []).filter((n) => n.type === 'n8n-nodes-base.webhook');
  if (hookNodes.length === 0) {
    console.error(`!! ${rel}: 未找到 webhook 节点`);
    fail++;
    continue;
  }
  for (const n of hookNodes) {
    if (n.parameters?.path !== oldPath) {
      console.error(`!! ${rel}: webhook path 为 "${n.parameters?.path}"，预期 "${oldPath}"，中止该文件`);
      fail++;
      continue;
    }
    n.parameters.path = oldPath + SUFFIX;
  }

  // 2) 工作流显示名加标识
  const oldName = wf.name;
  if (!oldName.endsWith('[v2]')) wf.name = `${oldName} [v2]`;

  // 3) 检查工作流内部是否还有别处引用旧 path（如 HTTP Request 回调）
  const raw = JSON.stringify(wf);
  const leftover = (raw.match(new RegExp(`"${oldPath}"`, 'g')) || []).length;

  writeFileSync(file, JSON.stringify(wf, null, 2) + '\n', 'utf8');
  console.log(`OK ${rel}: "${oldName}" -> "${wf.name}", path ${oldPath} -> ${oldPath + SUFFIX}${leftover ? `（警告：仍有 ${leftover} 处引用旧 path）` : ''}`);
  if (leftover) fail++;
}

console.log(fail === 0 ? '\n全部通过 ✓ 请同步修改后端调用点' : `\n${fail} 项失败 ✗`);
process.exit(fail === 0 ? 0 : 1);
