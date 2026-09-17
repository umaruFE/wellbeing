// Reuse reviewed catalog translations for exact UI literals (dry-run by default).
import fs from 'node:fs';
import path from 'node:path';
import parser from '@babel/parser';
import traverseModule from '@babel/traverse';

const write = process.argv.includes('--write');
const chinese = /[\u3400-\u9fff]/;
const attributes = new Set(['placeholder', 'title', 'alt', 'aria-label', 'aria-description', 'label', 'description', 'okText', 'cancelText', 'emptyText', 'tooltip']);
const zh = JSON.parse(fs.readFileSync('src/i18n/locales/zh.json', 'utf8'));
const en = JSON.parse(fs.readFileSync('src/i18n/locales/en.json', 'utf8'));
const byText = new Map();
function walk(a, b, prefix = '') {
  if (Array.isArray(a) && Array.isArray(b)) return a.forEach((item, index) => walk(item, b[index], `${prefix}.${index}`));
  if (a && b && typeof a === 'object' && typeof b === 'object') return Object.keys(a).forEach(key => walk(a[key], b[key], prefix ? `${prefix}.${key}` : key));
  if (typeof a !== 'string' || typeof b !== 'string' || !chinese.test(a) || chinese.test(b)) return;
  if (prefix.split('.').some(part => !part || part.includes('.'))) return;
  const existing = byText.get(a);
  if (!existing) byText.set(a, { key: prefix, en: b });
  else if (existing.en !== b) byText.set(a, { ambiguous: true });
}
walk(zh, en);
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const name = path.join(dir, entry.name);
    return entry.isDirectory() ? files(name) : /\.(jsx|js)$/.test(name) ? [name] : [];
  });
}
let total = 0;
for (const file of files('src')) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
  const changes = [];
  let text = false;
  let attribute = false;
  const keyFor = value => {
    const match = byText.get(value.trim().replace(/\s+/g, ' '));
    return match?.ambiguous ? null : match?.key;
  };
  traverseModule.default(ast, {
    JSXText(p) {
      if (!chinese.test(p.node.value)) return;
      const key = keyFor(p.node.value);
      if (!key) return;
      const leading = p.node.value.match(/^\s*/)[0];
      const trailing = p.node.value.match(/\s*$/)[0];
      changes.push({ start: p.node.start, end: p.node.end, value: `${leading}<LocalizedText id="${key}" />${trailing}` });
      text = true;
    },
    JSXAttribute(p) {
      if (!attributes.has(p.node.name.name) || p.node.value?.type !== 'StringLiteral') return;
      const key = keyFor(p.node.value.value);
      if (!key) return;
      changes.push({ start: p.node.value.start, end: p.node.value.end, value: `{i18next.t('${key}')}` });
      attribute = true;
    },
  });
  if (!changes.length) continue;
  total += changes.length;
  console.log(`${file}: ${changes.length}`);
  if (!write) continue;
  let output = source;
  for (const c of changes.sort((a, b) => b.start - a.start)) output = output.slice(0, c.start) + c.value + output.slice(c.end);
  if (text && !source.includes("import { LocalizedText }")) {
    const relative = path.relative(path.dirname(file), 'src/i18n/LocalizedText.jsx').replaceAll('\\', '/').replace(/^(?!\.)/, './');
    output = `import { LocalizedText } from '${relative}';\n` + output;
  }
  if (attribute && !source.includes("import i18next from 'i18next'")) output = `import i18next from 'i18next';\n` + output;
  fs.writeFileSync(file, output);
}
console.log(`${write ? 'Migrated' : 'Reusable'}: ${total} UI literals`);
