// Broad second pass: find Chinese literals used in JSX expressions, UI config
// objects, and user-facing messages. Review each hit; many domain values and
// AI prompts deliberately remain Chinese in source data.
import fs from 'node:fs';
import path from 'node:path';
import parser from '@babel/parser';
import traverseModule from '@babel/traverse';

const root = 'src';
const chinese = /[\u3400-\u9fff]/;
const uiFields = new Set(['label', 'title', 'description', 'placeholder', 'tooltip', 'name', 'text', 'message', 'hint', 'emptyText', 'okText', 'cancelText', 'statusText']);
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const name = path.join(dir, entry.name);
    return entry.isDirectory() ? files(name) : /\.(jsx|js)$/.test(name) ? [name] : [];
  });
}
const hits = [];
for (const file of files(root)) {
  const source = fs.readFileSync(file, 'utf8');
  const ast = parser.parse(source, { sourceType: 'module', plugins: ['jsx'] });
  traverseModule.default(ast, {
    'StringLiteral|TemplateLiteral'(p) {
      const value = p.node.type === 'StringLiteral' ? p.node.value : p.node.quasis.map(q => q.value.cooked).join('${…}');
      if (!chinese.test(value)) return;
      if (p.parentPath.isJSXAttribute() && p.parentPath.node.value === p.node) return; // handled by audit-i18n
      const jsx = p.findParent(parent => parent.isJSXExpressionContainer());
      const prop = p.findParent(parent => parent.isObjectProperty() && uiFields.has(parent.node.key?.name || parent.node.key?.value));
      const call = p.findParent(parent => parent.isCallExpression() && /^(?:alert|confirm|prompt|setError|setProgress|setMessage|setToast|message\.|notification\.)/.test(source.slice(parent.node.callee.start, parent.node.callee.end)));
      if (!jsx && !prop && !call) return;
      const kind = jsx ? 'expression' : prop ? 'config' : 'message';
      hits.push(`${file}:${p.node.loc.start.line} [${kind}] ${value.replace(/\s+/g, ' ').slice(0, 150)}`);
    },
  });
}
const filter = process.argv.slice(2);
const selected = filter.length ? hits.filter(line => filter.some(item => line.includes(item))) : hits;
selected.forEach(line => console.log(line));
console.log(`String candidates: ${selected.length} in ${new Set(selected.map(line => line.split(':')[0])).size} files`);
