// Synchronize reviewed domain-label mappings into both locale catalogs.
import fs from 'node:fs';
const [namespace, mapFile] = process.argv.slice(2);
if (!namespace || !mapFile) throw new Error('Usage: node tools/merge-value-catalog.mjs <namespace> <map.json>');
const map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
for (const language of ['en', 'zh']) {
  const file = `src/i18n/locales/${language}.json`;
  const source = fs.readFileSync(file, 'utf8');
  const locale = JSON.parse(source);
  if (!locale[namespace]) throw new Error(`Missing catalog: ${namespace}`);
  const merged = { ...locale[namespace], ...(language === 'en' ? map : Object.fromEntries(Object.keys(map).map(key => [key, key]))) };
  // Preserve all other namespace ordering and only rewrite this catalog.
  const start = source.indexOf(`  "${namespace}": `);
  const end = source.indexOf('\n  }', start) + '\n  }'.length;
  if (start < 0 || end < start) throw new Error(`Cannot locate ${namespace} in ${file}`);
  fs.writeFileSync(file, `${source.slice(0, start)}  "${namespace}": ${JSON.stringify(merged, null, 2).replaceAll('\n', '\n  ')}${source.slice(end)}`);
}
