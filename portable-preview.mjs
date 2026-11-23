#!/usr/bin/env node
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createPreviewHandler, visualPreviewPlugin } from './dev/visual-preview.mjs';

const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 20 || (major === 20 && minor < 19)) {
  console.error('需要 Node.js 20.19 或更新版本；请先安装，再重新打开启动文件。');
  process.exit(1);
}
let port = 5200, backendPort = null, openBrowser = false;
const args = process.argv.slice(2);
for (let index = 0; index < args.length; index++) {
  const argument = args[index];
  const separator = argument.indexOf('=');
  const option = separator === -1 ? argument : argument.slice(0, separator);
  if (argument === '--open') openBrowser = true;
  else if (option === '--port' || option === '--backend-port') {
    const value = separator === -1 ? args[++index] : argument.slice(separator + 1);
    if (!/^\d+$/.test(value || '') || Number(value) < 1 || Number(value) > 65535) {
      console.error(`${option} 必须是 1–65535 的整数。`); process.exit(1);
    }
    if (option === '--port') port = Number(value);
    else backendPort = Number(value);
  } else {
    console.error('用法：node portable-preview.mjs [--port 5200] [--backend-port 4000] [--open]'); process.exit(1);
  }
}
if (backendPort === port) {
  console.error('预览端口和后台端口必须不同。'); process.exit(1);
}

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
let distRoot, indexSource;
try {
  distRoot = await realpath(path.join(packageRoot, 'dist'));
  indexSource = await readFile(path.join(distRoot, 'index.html'), 'utf8');
} catch {
  console.error('找不到完整 dist 目录。请先完整解压系统压缩包，再启动。'); process.exit(1);
}

const preview = backendPort ? null : createPreviewHandler();
const remoteMedia = backendPort ? ' https:' : '';
const contentSecurityPolicy = `connect-src 'self' ws:; img-src 'self' data: blob:${remoteMedia}; media-src 'self' data: blob:${remoteMedia}; frame-src 'self' data: blob:`;
const tags = backendPort ? [] : visualPreviewPlugin().transformIndexHtml.handler();
const tagHtml = tag => `<${tag.tag}${Object.entries(tag.attrs || {}).map(([key, value]) => ` ${key}="${value}"`).join('')}>${tag.children || ''}</${tag.tag}>`;
// The production bundle registers /sw.js itself. Serve a non-caching worker
// below, and clean any previous Workbox registration/cache for this origin.
// Neither the production bundle nor any dist file is changed on disk.
const cleanupScript = `<script>
(function () {
  if ('serviceWorker' in navigator) navigator.serviceWorker.getRegistrations().then(function (registrations) {
    return Promise.all(registrations.filter(function (registration) { return new URL(registration.scope).origin === location.origin; }).map(function (registration) { return registration.unregister(); }));
  }).catch(function () {});
  if ('caches' in window) caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return /^workbox[-:]/.test(key); }).map(function (key) { return caches.delete(key); }));
  }).catch(function () {});
})();
</script>`;
const indexHtml = indexSource
  .replace(/<link\b[^>]*\brel=["']manifest["'][^>]*>/gi, '')
  .replace(/<head(?:\s[^>]*)?>/i, match => match + `<script>window.WB_WORKBENCH_LIVE=${Boolean(backendPort)};</script>` + cleanupScript)
  .replace(/<\/head>/i, tags.filter(tag => tag.injectTo === 'head').map(tagHtml).join('') + '</head>')
  .replace(/<body(?:\s[^>]*)?>/i, match => match + tags.filter(tag => tag.injectTo === 'body-prepend').map(tagHtml).join(''));
const localWorker = `// Local preview: intentionally no fetch handler or precache.
self.addEventListener('install', function (event) { event.waitUntil(self.skipWaiting()); });
self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    const keys = await caches.keys();
    await Promise.all(keys.filter(function (key) { return /^workbox[-:]/.test(key); }).map(function (key) { return caches.delete(key); }));
    await self.clients.claim();
    await self.registration.unregister();
  })());
});
`;
const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.map': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.bmp': 'image/bmp',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.oga': 'audio/ogg', '.opus': 'audio/ogg',
  '.m4a': 'audio/mp4', '.aac': 'audio/aac', '.flac': 'audio/flac', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.vtt': 'text/vtt; charset=utf-8', '.pdf': 'application/pdf', '.wasm': 'application/wasm',
};
function sendText(req, res, status, body, type = 'text/plain; charset=utf-8') {
  res.statusCode = status;
  res.setHeader('Content-Type', type);
  res.setHeader('Content-Length', Buffer.byteLength(body));
  res.end(req.method === 'HEAD' ? undefined : body);
}
const hopHeaders = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'proxy-connection', 'te', 'trailer', 'transfer-encoding', 'upgrade',
]);
function endToEndHeaders(headers) {
  const named = new Set((headers.connection || '').toLowerCase().split(',').map(name => name.trim()));
  return Object.fromEntries(Object.entries(headers).filter(([name]) => !hopHeaders.has(name) && !named.has(name)));
}
function proxyBackend(req, res) {
  const headers = endToEndHeaders(req.headers);
  headers.host = `127.0.0.1:${backendPort}`;
  const upstream = http.request({
    hostname: '127.0.0.1', port: backendPort, path: req.url, method: req.method, headers, timeout: 240_000,
  }, incoming => {
    res.statusCode = incoming.statusCode || 502;
    for (const [name, value] of Object.entries(endToEndHeaders(incoming.headers))) {
      // The upstream is used through this origin, including for authentication.
      if (!name.startsWith('access-control-') && name !== 'cache-control') res.setHeader(name, value);
    }
    incoming.on('error', error => res.destroy(error));
    incoming.pipe(res);
  });
  upstream.on('timeout', () => upstream.destroy(new Error('Backend request timed out')));
  upstream.on('error', error => {
    if (res.destroyed) return;
    if (res.headersSent) res.destroy(error);
    else sendText(req, res, 502, JSON.stringify({ error: '本地后台未响应，请检查服务后重试。' }), 'application/json; charset=utf-8');
  });
  res.on('close', () => upstream.destroy());
  req.pipe(upstream);
}
function byteRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match || (!match[1] && !match[2]) || size === 0) return null;
  let start, end;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix); end = size - 1;
  } else {
    start = Number(match[1]); end = match[2] ? Number(match[2]) : size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start) return null;
    end = Math.min(end, size - 1);
  }
  return { start, end };
}
async function handle(req, res) {
  res.setHeader('Content-Security-Policy', contentSecurityPolicy);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  let pathname;
  try { pathname = decodeURIComponent((req.url || '').split('?')[0]); }
  catch { return sendText(req, res, 400, 'Invalid request path'); }
  if (!pathname.startsWith('/') || /[\\\u0000-\u001f]/.test(pathname) || pathname.split('/').includes('..')) {
    return sendText(req, res, 400, 'Invalid request path');
  }
  if (backendPort) {
    if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host)) {
      return sendText(req, res, 403, '本地联调仅接受回环地址。');
    }
    if (/^\/(?:api|uploads)(?:\/|$)/.test(pathname)) return proxyBackend(req, res);
    if (pathname === '/__preview/start' && ['GET', 'HEAD'].includes(req.method)) {
      res.setHeader('Location', '/login');
      return sendText(req, res, 302, '正在进入登录页。');
    }
  }
  if (/^\/(?:api|ai(?:-video)?|__preview)(?:\/|$)/.test(pathname)) {
    if (!preview) return sendText(req, res, 404, 'Unknown local preview endpoint');
    // Reuse the exact preview state/API; HEAD is its read-only GET equivalent.
    const head = req.method === 'HEAD', originalMethod = req.method;
    if (head) req.method = 'GET';
    try { await preview(req, res, () => sendText(req, res, 404, 'Unknown local preview endpoint')); }
    finally { req.method = originalMethod; }
    return;
  }
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD'); return sendText(req, res, 405, 'Method not allowed');
  }
  if (pathname === '/sw.js') {
    res.setHeader('Service-Worker-Allowed', '/');
    return sendText(req, res, 200, localWorker, 'text/javascript; charset=utf-8');
  }
  if (pathname.split('/').some(part => part.startsWith('.'))) return sendText(req, res, 404, 'Not found');
  const requested = path.resolve(distRoot, '.' + pathname);
  let filename, info;
  try {
    filename = await realpath(requested);
    if (filename !== distRoot && !filename.startsWith(distRoot + path.sep)) return sendText(req, res, 403, 'Forbidden');
    info = await stat(filename);
  } catch (error) {
    if (!['ENOENT', 'ENOTDIR'].includes(error.code)) throw error;
  }
  const protectedResource = /^\/(?:workbench-v6|assets)(?:\/|$)/.test(pathname);
  if ((pathname === '/index.html') || (!info?.isFile() && !protectedResource && !path.extname(pathname))) {
    return sendText(req, res, 200, indexHtml, 'text/html; charset=utf-8');
  }
  if (!info?.isFile()) return sendText(req, res, 404, 'Not found');
  res.setHeader('Content-Type', mimeTypes[path.extname(filename).toLowerCase()] || 'application/octet-stream');
  res.setHeader('Accept-Ranges', 'bytes');
  let range;
  if (req.headers.range) {
    range = byteRange(req.headers.range, info.size);
    if (!range) {
      res.setHeader('Content-Range', `bytes */${info.size}`);
      return sendText(req, res, 416, 'Requested range not satisfiable');
    }
    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${info.size}`);
  }
  res.setHeader('Content-Length', range ? range.end - range.start + 1 : info.size);
  if (req.method === 'HEAD') return res.end();
  const stream = createReadStream(filename, range || undefined);
  stream.on('error', error => res.destroy(error));
  res.on('close', () => stream.destroy());
  stream.pipe(res);
}
const server = http.createServer((req, res) => {
  handle(req, res).catch(error => {
    console.error('本地预览请求失败：', error.code || error.name);
    if (res.headersSent) res.destroy(); else sendText(req, res, 500, 'Local preview error');
  });
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE'
    ? `端口 ${port} 已被使用。请关闭原窗口，或运行 node portable-preview.mjs --port ${port < 65535 ? port + 1 : 5201} --open`
    : `无法启动本地预览：${error.code || error.message}`);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${port}/__preview/start`;
  const status = backendPort
    ? `后台联调模式 · 请求转发至 127.0.0.1:${backendPort}，请使用后台账号登录。`
    : '原系统示例保存仅本次运行有效，六模块活动保存在当前浏览器。\n未连接真实账号、后端或 AI 服务。';
  console.log(`\n小星星 · 完整系统本地预览\n${url}\n\n按 Ctrl+C 停止；请保持此窗口打开。\n${status}\n`);
  if (openBrowser) {
    const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'cmd.exe' : 'xdg-open';
    const browserArgs = process.platform === 'win32' ? ['/d', '/c', 'start', '', url] : [url];
    const child = spawn(command, browserArgs, { detached: true, stdio: 'ignore', windowsHide: true });
    child.on('error', () => console.error('未能自动打开浏览器，请复制上面的预览地址。'));
    child.unref();
  }
});
process.once('SIGINT', () => { console.log('\n已停止本地预览。'); server.close(); });
process.once('SIGTERM', () => server.close());
