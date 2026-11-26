import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer, request as httpRequest } from 'node:http';
import next from 'next';
import { signSessionToken } from '../src/lib/session-token.mjs';

const host = '127.0.0.1';
const [appDirectory, keyFile, listenPort = '4016', existingApiPort = '4015', databasePort = '15432'] = process.argv.slice(2);
const port = Number(listenPort);
const upstreamPort = Number(existingApiPort);
const dbPort = Number(databasePort);
const validPort = value => Number.isInteger(value) && value > 0 && value <= 65535;
if (!appDirectory || !keyFile || ![port, upstreamPort, dbPort].every(validPort) || port === upstreamPort) {
  throw new Error('Usage: node activity-preview.mjs app-directory proxy-key-file [port] [existing-api-port] [database-port]');
}

const proxyKey = readFileSync(keyFile, 'utf8');
if (!proxyKey.trim()) throw new Error('The preview proxy key is empty');
const keyHeader = 'x-wellbeing-local-preview';
const sessionSecret = randomBytes(32).toString('hex');

Object.assign(process.env, {
  NODE_ENV: 'development',
  NEXT_TELEMETRY_DISABLED: '1',
  DB_HOST: host,
  DB_PORT: String(dbPort),
  PGOPTIONS: '-c default_transaction_read_only=on -c statement_timeout=10000',
  PGAPPNAME: 'wellbeing-activity-preview',
  JWT_SECRET: sessionSecret,
  WELLBEING_PREVIEW_ACTIVITY_WRITES: 'true',
});

const activityPaths = new Set([
  '/api/workbench-activities/spin-speak',
  '/api/workbench-activities/doodle',
  '/api/workbench-activities/move-match',
]);
const generationPaths = new Set([
  '/api/ai/generate-speaking-language',
  '/api/ai/generate-classification',
]);

const app = next({ dev: true, dir: appDirectory, hostname: host, port });
const handle = app.getRequestHandler();
await app.prepare();

function reply(response, statusCode, error) {
  if (response.writableEnded || response.destroyed) return;
  response.writeHead(statusCode, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify({ error }));
}

function forwardToExistingApi(request, response) {
  const upstream = httpRequest({
    hostname: host,
    port: upstreamPort,
    path: request.url,
    method: request.method,
    headers: { ...request.headers, host: `${host}:${upstreamPort}` },
  }, result => {
    response.writeHead(result.statusCode, result.headers);
    result.on('error', () => response.destroy());
    result.pipe(response);
  });
  upstream.on('error', () => {
    if (response.headersSent) response.destroy();
    else reply(response, 502, '后台暂时无法连接，请稍后再试。');
  });
  request.on('aborted', () => upstream.destroy());
  response.on('close', () => upstream.destroy());
  request.pipe(upstream);
}

async function signedInUser(authorization) {
  if (!authorization?.startsWith('Bearer ')) return null;
  // Keep existing sessions valid by verifying them with the server that issued them.
  const result = await fetch(`http://${host}:${upstreamPort}/api/auth/me`, {
    headers: { Authorization: authorization, [keyHeader]: proxyKey },
    signal: AbortSignal.timeout(10000),
  });
  if (result.status === 401) return null;
  if (!result.ok) throw new Error('The existing authentication server did not respond');
  const { success, user } = await result.json();
  return success && typeof user?.id === 'string' && typeof user.role === 'string' ? user : null;
}

async function dispatch(request, response) {
  if (request.headers[keyHeader] !== proxyKey) {
    return reply(response, 403, '请通过本地平台访问服务。');
  }

  const { method, url } = request;
  const activityWrite = method === 'PUT' && activityPaths.has(url);
  const textGeneration = method === 'POST' && generationPaths.has(url);
  const caseRequest = (method === 'GET' || method === 'POST') && /^\/api\/workbench-cases\/[a-z-]+$/.test(url);
  if (activityWrite || textGeneration || caseRequest) {
    const user = await signedInUser(request.headers.authorization);
    if (!user) return reply(response, 401, '请重新登录后继续。');
    // The newly signed token is used only inside this loopback worker.
    request.headers.authorization = `Bearer ${signSessionToken(user, sessionSecret)}`;
    delete request.headers[keyHeader];
    return handle(request, response);
  }

  if (method === 'GET' || method === 'HEAD' || (method === 'POST' && url === '/api/auth/login')) {
    return forwardToExistingApi(request, response);
  }
  return reply(response, 403, '当前操作暂不可用。');
}

const server = createServer((request, response) => {
  dispatch(request, response).catch(error => {
    console.error('Activity preview request failed:', error.name);
    if (response.headersSent) response.destroy();
    else reply(response, 503, '后台暂时无法处理请求，请稍后重试。');
  });
});
server.listen(port, host, () => console.log(`Activity preview listening on http://${host}:${port}`));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(() => process.exit(0)));
}
