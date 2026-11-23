import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { createPreviewHandler, visualPreviewPlugin } from './visual-preview.mjs';

async function request(handler, url, method = 'GET', body) {
  const req = Readable.from(body === undefined ? [] : [JSON.stringify(body)]);
  req.url = url; req.method = method;
  let next = false;
  const res = { headers: {}, statusCode: 200, setHeader(k, v) { this.headers[k] = v; }, end(value) { this.body = value; } };
  await handler(req, res, () => { next = true; });
  return { ...res, next, json: res.headers['Content-Type']?.includes('application/json') ? JSON.parse(res.body) : null };
}

test('preview endpoint serves explicitly marked demo identity without credentials', async () => {
  const handler = createPreviewHandler();
  const start = await request(handler, '/__preview/start');
  assert.match(start.body, /local-style-preview-only/);
  const me = await request(handler, '/api/auth/me');
  assert.equal(me.json.user.id, 'preview-teacher');
  assert.equal(me.json.user.name, '示例教师');
});

test('writes persist only in this preview instance and reset restores examples', async () => {
  const handler = createPreviewHandler();
  const initial = (await request(handler, '/api/picture-books')).json.data;
  await request(handler, `/api/picture-books/${initial[0].id}`, 'PUT', { title: '本地编辑验证', bookData: { step: 3 } });
  const saved = (await request(handler, `/api/picture-books/${initial[0].id}`)).json.data;
  assert.equal(saved.title, '本地编辑验证'); assert.equal(saved.book_data.step, 3);
  const isolated = (await request(createPreviewHandler(), `/api/picture-books/${initial[0].id}`)).json.data;
  assert.equal(isolated.title, initial[0].title);
  await request(handler, '/__preview/reset');
  assert.equal((await request(handler, `/api/picture-books/${initial[0].id}`)).json.data.title, initial[0].title);
});

test('unimplemented APIs and generation cannot fall through to a proxy', async () => {
  const handler = createPreviewHandler();
  for (const url of ['/api/ai/generate-image', '/api/rag/generate', '/api/unknown', '/api/__proto__', '/api/constructor', '/ai/prompt', '/ai-video/prompt']) {
    const r = await request(handler, url, 'POST', {});
    assert.equal(r.statusCode, 503); assert.equal(r.next, false); assert.match(r.json.error, /本地样式预览/);
  }
  assert.equal((await request(handler, '/api/auth/me', 'PUT', { newPassword: 'example' })).statusCode, 503);
});

test('preview workshop draft uses the production response shape', async () => {
  const handler = createPreviewHandler();
  const created = (await request(handler, '/api/creative-works', 'POST', { moduleId: 'fun-practice', moduleName: '趣味练习', title: '布局检查', parameters: { age: '7–10 岁' } })).json.data;
  const list = (await request(handler, '/api/creative-works?moduleId=fun-practice')).json.data;
  assert.equal(list.length, 1); assert.equal(list[0].id, created.id); assert.equal(list[0].module_name, '趣味练习');
});

test('preview is development-only; static app requests are not intercepted', async () => {
  assert.equal(visualPreviewPlugin().apply, 'serve');
  assert.equal((await request(createPreviewHandler(), '/src/main.jsx')).next, true);
});
