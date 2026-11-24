import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const release = JSON.parse(readFileSync(new URL('./workbench-cdn-assets.json', import.meta.url), 'utf8'));
const cdn = new URL(release.baseUrl);
const resourceHeaders = new Set([
  'accept', 'accept-encoding', 'cache-control', 'if-match', 'if-modified-since',
  'if-none-match', 'if-range', 'if-unmodified-since', 'range',
]);
const resourcePath = url => url.split('?', 1)[0].slice(1);

export function workbenchCdnAssets() {
  let config;
  const hasLocalFile = name => config.publicDir && existsSync(join(config.publicDir, name));

  return {
    name: 'wellbeing-workbench-cdn',
    config() {
      return {
        server: {
          proxy: {
            '^/(?:star\\.svg(?:\\?|$)|workbench-v6/)': {
              target: cdn.origin,
              changeOrigin: true,
              proxyTimeout: 30_000,
              bypass(request) {
                const name = resourcePath(request.url);
                if (!Object.hasOwn(release.files, name) || hasLocalFile(name)) return request.url;
                if (request.method !== 'GET' && request.method !== 'HEAD') return false;
                // Keep the app's credentials and page URL inside the local origin.
                request.headers = Object.fromEntries(Object.entries(request.headers)
                  .filter(([header]) => resourceHeaders.has(header)));
              },
              rewrite: url => cdn.pathname + resourcePath(url),
              configure(proxy) {
                proxy.on('proxyRes', response => {
                  delete response.headers['set-cookie'];
                  delete response.headers['clear-site-data'];
                  response.headers['x-wellbeing-resource-source'] = 'cdn';
                });
              },
            },
          },
        },
      };
    },
    configResolved(resolved) {
      config = resolved;
    },
    async buildStart() {
      if (config.command !== 'build') return;
      const missing = Object.entries(release.files).filter(([name]) => !hasLocalFile(name));
      // Keep the static build self-contained, including for offline previews.
      for (let offset = 0; offset < missing.length; offset += 8) {
        await Promise.all(missing.slice(offset, offset + 8).map(async ([name, expected]) => {
          const response = await fetch(new URL(name, cdn), {
            redirect: 'error',
            signal: AbortSignal.timeout(30_000),
          });
          if (response.status !== 200) throw new Error(`Workbench CDN returned HTTP ${response.status} for ${name}`);
          const data = Buffer.from(await response.arrayBuffer());
          const hash = createHash('sha256').update(data).digest('hex');
          if (data.length !== expected.bytes || hash !== expected.sha256) {
            throw new Error(`Workbench CDN checksum mismatch for ${name}`);
          }
          this.emitFile({ type: 'asset', fileName: name, source: data });
        }));
      }
    },
  };
}
