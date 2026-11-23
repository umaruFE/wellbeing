import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../workbench-ui/workbench-api.js', import.meta.url), 'utf8');
const state = name => JSON.stringify({ draft: { name }, items: [] });
const response = (status, body) => ({ ok: status < 400, status, json: async () => body });

function fixture(fetch, { existing, live = true } = {}) {
  const values = new Map([['token', 'test-token']]);
  const session = new Map();
  if (existing) values.set('speak', existing);
  const storage = map => ({
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    removeItem: key => map.delete(key),
  });
  function open() {
    const html = { dataset: {} };
    const window = { top: { WB_WORKBENCH_LIVE: live }, addEventListener() {} };
    vm.runInNewContext(source, {
      window, localStorage: storage(values), sessionStorage: storage(session), crypto: webcrypto,
      document: {
        documentElement: html, body: { append() {} }, createTextNode: text => text,
        createElement: () => ({ setAttribute() {}, append() {}, remove() {}, style: {} }),
      },
      fetch, AbortSignal, FormData, URLSearchParams,
      setTimeout: (callback, delay) => { if (delay === 2000) queueMicrotask(callback); return 1; }, clearTimeout() {},
    });
    const api = window.WBWorkbenchApi;
    return { api, store: api.activityStore('spin-speak', 'speak'), status: html.dataset };
  }
  return { open, values };
}

test('imports a legacy draft only after validating an empty backend and keeps the original', async () => {
  const writes = [];
  const { open, values } = fixture(async (path, options) => {
    assert.equal(path, '/api/workbench-activities/spin-speak');
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    if (options.method === 'GET') return response(200, { data: { version: 0, snapshot: null } });
    writes.push(JSON.parse(options.body));
    return response(200, { data: { version: 1 } });
  }, { existing: state('legacy') });
  const { store } = open();
  await store.load();
  assert.equal(store.storage.getItem('speak'), state('legacy'));
  assert.equal(writes.length, 0);
  store.importLocal();
  assert.equal(await store.flush(), true);
  assert.equal(writes[0].snapshot.draft.name, 'legacy');
  assert.equal(values.get('speak'), state('legacy'));
});

test('replays an interrupted write after reload before persisting newer edits', async () => {
  const writes = [];
  let rejectFirst;
  const { open } = fixture(async (_path, options) => {
    if (options.method === 'GET') return response(200, { data: { version: 0, snapshot: null } });
    writes.push(JSON.parse(options.body));
    if (writes.length === 1) return new Promise((_, reject) => { rejectFirst = reject; });
    return response(200, { data: { version: writes.length - 1 } });
  });
  const { store } = open();
  await store.load();
  store.storage.setItem('speak', state('first'));
  const attempt = store.flush();
  await Promise.resolve();
  store.storage.setItem('speak', state('latest'));
  rejectFirst(new Error('Lost response'));
  assert.equal(await attempt, false);

  const { store: reloaded } = open();
  await reloaded.load();
  assert.equal(reloaded.storage.getItem('speak'), state('latest'));
  assert.equal(await reloaded.flush(), true);
  assert.deepEqual(writes[0], writes[1]);
  assert.equal(writes[2].version, 1);
  assert.equal(writes[2].snapshot.draft.name, 'latest');
  assert.equal(reloaded.dirty, false);
});

test('a backend conflict keeps the unsynced draft and blocks overwrite', async () => {
  let writes = 0;
  const { open } = fixture(async (_path, options) => {
    if (options.method === 'GET') return response(200, { data: { version: 1, snapshot: JSON.parse(state('server')) } });
    writes += 1;
    return response(409, { error: '更新冲突' });
  }, { existing: state('legacy') });
  const { store, status } = open();
  await store.load();
  store.importLocal();
  assert.equal(store.storage.getItem('speak'), state('server'));
  store.storage.setItem('speak', state('local'));
  assert.equal(await store.flush(), false);
  assert.equal(await store.flush(), false);
  assert.equal(writes, 1);
  assert.equal(status.workbenchSaveState, 'conflict');
  assert.equal(store.storage.getItem('speak'), state('local'));
  assert.equal(store.dirty, true);
});

test('uploads through the existing multipart API and keeps its returned URL', async () => {
  const { open } = fixture(async (path, options) => {
    assert.equal(path, '/api/upload');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], undefined);
    assert.equal(options.body.get('file').name, 'image.png');
    assert.equal(options.body.get('folder'), 'question-images');
    return response(200, { success: true, url: '/uploads/question-images/image.png' });
  });
  const { api } = open();
  const image = new Blob(['fixture'], { type: 'image/png' });
  assert.equal(await api.upload(image, 'question-images', { filename: 'image.png' }), '/uploads/question-images/image.png');
});

test('starts and polls the original image workflow until it returns an asset', async () => {
  const requests = [];
  const { open } = fixture(async (path, options) => {
    requests.push(path);
    if (options.method === 'POST') {
      assert.deepEqual(JSON.parse(options.body), { workflow_type: 'scene', width: 768, height: 768, count: 1, prompt: 'A cat' });
      return response(200, { tasks: [{ promptId: 'image/job' }] });
    }
    return response(200, requests.length === 2 ? { status: 'pending' } : { status: 'completed', url: '/uploads/generated/cat.png' });
  });
  assert.equal(await open().api.generateImage({ prompt: 'A cat' }), '/uploads/generated/cat.png');
  assert.deepEqual(requests, [
    '/api/ai/generate-images',
    '/api/ai/task-status/image%2Fjob?workflowType=image&useComfyUI=true',
    '/api/ai/task-status/image%2Fjob?workflowType=image&useComfyUI=true',
  ]);
});
