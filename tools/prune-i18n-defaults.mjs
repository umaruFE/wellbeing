// Remove hardcoded defaultValue branches only when both locale catalogs contain the key.
import fs from 'node:fs';
import path from 'node:path';
import parser from '@babel/parser';
import traverseModule from '@babel/traverse';

const zh = JSON.parse(fs.readFileSync('src/i18n/locales/zh.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8'));
const lookup = (obj, key) => key.split('.').reduce((value, part) => value?.[part], obj);
const files = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(path.join(dir, entry.name)) : /\.(jsx|js)$/.test(entry.name) ? [path.join(dir, entry.name)] : []);
let total = 0;
for (const file of files('src')) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const edits = [];
  traverseModule.default(ast, {
    CallExpression(p) {
      const [key, opts] = p.node.arguments;
      if (key?.type !== 'StringLiteral' || opts?.type !== 'ObjectExpression') return;
      const callee = source.slice(p.node.callee.start, p.node.callee.end);
      if (!/^(?:t|i18next\.t)$/.test(callee) || typeof lookup(zh, key.value) !== 'string' || typeof lookup(en, key.value) !== 'string') return;
      const index = opts.properties.findIndex(prop => prop.type === 'ObjectProperty' && (prop.key.name || prop.key.value) === 'defaultValue');
      if (index < 0) return;
      if (opts.properties.length === 1) {
        edits.push({ start: source.lastIndexOf(',', opts.start), end: opts.end, replacement: '' });
      } else {
        const prop = opts.properties[index];
        const prev = opts.properties[index - 1];
        const next = opts.properties[index + 1];
        edits.push(index > 0
          ? { start: source.indexOf(',', prev.end), end: prop.end, replacement: '' }
          : { start: prop.start, end: source.indexOf(',', prop.end) + 1, replacement: '' });
      }
    },
  });
  if (!edits.length) continue;
  total += edits.length;
  let output = source;
  for (const edit of edits.sort((a, b) => b.start - a.start)) output = output.slice(0, edit.start) + edit.replacement + output.slice(edit.end);
  fs.writeFileSync(file, output);
  console.log(`${file}: ${edits.length}`);
}
console.log(`Removed ${total} redundant translation fallbacks`);
