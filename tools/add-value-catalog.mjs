// Add reviewed English labels for stable Chinese domain values; Chinese labels
// remain identical in zh. This is a mechanical catalog migration.
import fs from 'node:fs';
const [namespace, mapFile] = process.argv.slice(2);
if (!namespace || !mapFile) throw new Error('Usage: node tools/add-value-catalog.mjs <namespace> <map.json>');
const map = JSON.parse(fs.readFileSync(mapFile, 'utf8'));
for (const language of ['en', 'zh']) {
  const file = `src/i18n/locales/${language}.json`;
  const source = fs.readFileSync(file, 'utf8');
  if (JSON.parse(source)[namespace]) throw new Error(`Namespace exists: ${namespace}`);
  const catalog = language === 'en' ? map : Object.fromEntries(Object.keys(map).map(key => [key, key]));
  const prefix = source.slice(0, source.lastIndexOf('}')).trimEnd();
  fs.writeFileSync(file, `${prefix},\n  "${namespace}": ${JSON.stringify(catalog, null, 2).replaceAll('\n', '\n  ')}\n}\n`);
}
console.log(`Added ${namespace} with ${Object.keys(map).length} values`);
