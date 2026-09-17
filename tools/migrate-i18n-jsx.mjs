// One-time mechanical migration of reviewed UI literals. The mapping file contains
// source Chinese -> reviewed English; unmapped literals are left untouched.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import parser from '@babel/parser';
import traverseModule from '@babel/traverse';

const [file, namespace, mapFile] = process.argv.slice(2);
if (!file || !namespace || !mapFile) throw new Error('Usage: node tools/migrate-i18n-jsx.mjs <file> <namespace> <mapping.json>');
const translations = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
const source = fs.readFileSync(file, 'utf8');
const ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
const traverse = traverseModule.default;
const normalize = value => value.trim().replace(/\s+/g, ' ');
const keys = new Map();
const changes = [];
const attributes = new Set(['placeholder', 'title', 'alt', 'aria-label', 'aria-description', 'label', 'description', 'okText', 'cancelText', 'emptyText', 'tooltip']);
let hasText = false;
let hasAttribute = false;

function keyFor(value) {
  const normalized = normalize(value);
  if (!Object.hasOwn(translations, normalized)) return null;
  const key = crypto.createHash('sha1').update(normalized).digest('hex').slice(0, 10);
  keys.set(key, { zh: normalized, en: translations[normalized] });
  return `${namespace}.${key}`;
}

traverse(ast, {
  JSXText(p) {
    const value = p.node.value;
    if (!/[\u3400-\u9fff]/.test(value)) return;
    const key = keyFor(value);
    if (!key) return;
    const leading = value.match(/^\s*/)[0];
    const trailing = value.match(/\s*$/)[0];
    changes.push({ start: p.node.start, end: p.node.end, replacement: `${leading}<LocalizedText id="${key}" />${trailing}` });
    hasText = true;
  },
  JSXAttribute(p) {
    if (!attributes.has(p.node.name.name) || p.node.value?.type !== 'StringLiteral') return;
    const key = keyFor(p.node.value.value);
    if (!key) return;
    changes.push({ start: p.node.value.start, end: p.node.value.end, replacement: `{i18next.t('${key}')}` });
    hasAttribute = true;
  },
});

let output = source;
for (const change of changes.sort((a, b) => b.start - a.start)) {
  output = output.slice(0, change.start) + change.replacement + output.slice(change.end);
}
if (hasText && !source.includes('import { LocalizedText }')) output = `import { LocalizedText } from '${path.relative(path.dirname(file), 'src/i18n/LocalizedText.jsx').replaceAll('\\', '/').replace(/^(?!\.)/, './')}';\n` + output;
if (hasAttribute && !source.includes("import i18next from 'i18next'")) output = `import i18next from 'i18next';\n` + output;

// Insert a single namespace without reformatting the large existing catalog.
for (const language of ['zh', 'en']) {
  const localeFile = `src/i18n/locales/${language}.json`;
  const original = fs.readFileSync(localeFile, 'utf8');
  const parsed = JSON.parse(original);
  if (parsed[namespace]) throw new Error(`Namespace already exists: ${namespace}`);
  const dictionary = Object.fromEntries([...keys].map(([key, pair]) => [key, pair[language]]));
  if (!Object.keys(dictionary).length) continue;
  const lastBrace = original.lastIndexOf('}');
  const before = original.slice(0, lastBrace).trimEnd();
  fs.writeFileSync(localeFile, `${before.replace(/,?$/, '')},\n  "${namespace}": ${JSON.stringify(dictionary, null, 2).replaceAll('\n', '\n  ')}\n}\n`);
}
fs.writeFileSync(file, output);
console.log(`Migrated ${changes.length} literals, ${keys.size} unique translations in ${file}`);
