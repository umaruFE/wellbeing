// Inventory user-facing Chinese literals. Comments, API payloads and authored course data
// are intentionally not treated as UI text by this scanner.
import fs from 'node:fs';
import path from 'node:path';
import parser from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default;
const root = path.resolve('src');
const chinese = /[\u3400-\u9fff]/;
const displayAttributes = new Set(['placeholder', 'title', 'alt', 'aria-label', 'aria-description', 'label', 'description', 'okText', 'cancelText', 'emptyText', 'tooltip']);
const displayCalls = /^(?:message|notification)\.(?:error|warning|success|info|open)$|^(?:alert|confirm)$/;

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? files(full) : /\.(jsx|js)$/.test(entry.name) ? [full] : [];
  });
}

const hits = [];
for (const file of files(root)) {
  const source = fs.readFileSync(file, 'utf8');
  let ast;
  try { ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx'] }); }
  catch (error) { console.error(`Parse failed: ${file}: ${error.message}`); continue; }
  const add = (node, kind, value) => {
    if (chinese.test(value)) hits.push({ file: path.relative(process.cwd(), file), line: node.loc.start.line, kind, value: value.trim().replace(/\s+/g, ' ').slice(0, 140) });
  };
  traverse(ast, {
    JSXText(p) { if (p.node.value.trim()) add(p.node, 'jsx', p.node.value); },
    JSXAttribute(p) {
      if (!displayAttributes.has(p.node.name.name)) return;
      if (p.node.value?.type === 'StringLiteral') add(p.node.value, 'attribute', p.node.value.value);
    },
    CallExpression(p) {
      const callee = source.slice(p.node.callee.start, p.node.callee.end);
      if (!displayCalls.test(callee)) return;
      const arg = p.node.arguments[0];
      if (arg?.type === 'StringLiteral') add(arg, 'message', arg.value);
    },
  });
}

const selected = process.argv.slice(2);
const filtered = selected.length ? hits.filter(hit => selected.some(s => hit.file.includes(s))) : hits;
for (const hit of filtered) console.log(`${hit.file}:${hit.line} [${hit.kind}] ${hit.value}`);
console.log(`UI literal candidates: ${filtered.length} in ${new Set(filtered.map(hit => hit.file)).size} files`);
