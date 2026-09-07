/**
 * 校验体式库两份副本是否一致（不一致时退出码 1）：
 *   api/src/lib/experience/yogaPoses.ts（后端/生图） vs
 *   src/modules/creative-workshop/yogaPoses.js（前端下拉）
 * 用法：node api/scripts/verify-yoga-pose-sync.mjs（兼容 Node 20+）
 */
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const loadPoses = async (url) => {
  const source = await readFile(url, 'utf8');
  const match = source.match(/export const YOGA_POSES(?:\s*:[^=]+)?\s*=\s*(\[[\s\S]*?\n\]);/);
  if (!match) throw new Error(`无法解析体式库：${url.pathname}`);
  return vm.runInNewContext(`(${match[1]})`);
};

const tsPoses = await loadPoses(new URL('../src/lib/experience/yogaPoses.ts', import.meta.url));
const jsPoses = await loadPoses(new URL('../../src/modules/creative-workshop/yogaPoses.js', import.meta.url));

const ka = (p) => JSON.stringify(p);
const sb = new Set(jsPoses.map(ka));
const sa = new Set(tsPoses.map(ka));
const tsOnly = tsPoses.filter((p) => !sb.has(ka(p)));
const jsOnly = jsPoses.filter((p) => !sa.has(ka(p)));

if (tsPoses.length !== jsPoses.length || tsOnly.length || jsOnly.length) {
  tsOnly.forEach((p) => console.error('仅在 ts:', JSON.stringify(p)));
  jsOnly.forEach((p) => console.error('仅在 js:', JSON.stringify(p)));
  console.error(`不一致：ts=${tsPoses.length} js=${jsPoses.length}，请同步两份体式库`);
  process.exit(1);
}
console.log(`体式库一致：${tsPoses.length} 条`);
