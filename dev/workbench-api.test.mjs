import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../workbench-ui/workbench-api.js', import.meta.url), 'utf8');
const state = name => JSON.stringify({ draft: { name }, items: [] });
const response = (status, body) => ({ ok: status < 400, status, json: async () => body });

function fixture(fetch, { existing, live = true, readOnly = false, activityWrites = false } = {}) {
  const values = new Map([['token', 'test-token']]);
  const session = new Map([['wellbeing-workbench-tab', 'test-tab']]);
  if (existing) values.set('speak', existing);
  const storage = map => ({
    getItem: key => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, value),
    removeItem: key => map.delete(key),
  });
  function open(moduleId = 'spin-speak') {
    const html = { dataset: {} };
    const panels = [];
    const window = {
      top: { WB_WORKBENCH_LIVE: live, WB_WORKBENCH_READ_ONLY: readOnly, WB_WORKBENCH_ACTIVITY_WRITES: activityWrites },
      addEventListener() {},
      confirm: () => true,
    };
    vm.runInNewContext(source, {
      window, localStorage: storage(values), sessionStorage: storage(session), crypto: webcrypto,
      document: {
        documentElement: html, body: { append: node => panels.push(node) }, createTextNode: text => text,
        createElement: () => ({ setAttribute() {}, append() {}, remove() {}, style: {} }),
      },
      fetch, AbortSignal, FormData, URLSearchParams,
      setTimeout: (callback, delay) => { if (delay === 2000) queueMicrotask(callback); return 1; }, clearTimeout() {},
    });
    const api = window.WBWorkbenchApi;
    return { api, store: api.activityStore(moduleId, 'speak'), status: html.dataset, panels };
  }
  return { open, values };
}

test('the online case library reports backend errors without showing local examples', async () => {
  const { open } = fixture(async (path) => {
    assert.equal(path, '/api/workbench-cases/move-match');
    return response(503, { error: 'Unavailable' });
  });
  const library = open().api.caseLibrary('move-match');
  await library.load();
  assert.equal(library.items.length, 0);
  assert.match(library.message, /暂时无法读取平台案例/);
  await assert.rejects(library.publish('private-work'), /平台管理员/);
});

test('publishing sends only the work identity and refreshes the matching case', async () => {
  const { open } = fixture(async (path, options) => {
    assert.equal(path, '/api/workbench-cases/song');
    if (options.method === 'GET') return response(200, { data: [{ id: 'shared', title: 'Version 1' }], canPublish: true });
    assert.deepEqual(JSON.parse(options.body), { sourceId: 'own-work' });
    return response(201, { data: { id: 'shared', title: 'Version 2' } });
  });
  const library = open().api.caseLibrary('song');
  await library.load();
  assert.equal(library.canPublish, true);
  assert.equal(await library.publish('own-work'), true);
  assert.equal(library.items.length, 1);
  assert.equal(library.find('shared').title, 'Version 2');
});

test('read-only production uses only the backend snapshot and preserves local drafts without importing them', async () => {
  const methods = [];
  const { open, values } = fixture(async (_path, options) => {
    methods.push(options.method);
    return response(200, { data: { version: 0, snapshot: null } });
  }, { existing: state('original'), readOnly: true });
  const { store, status, panels } = open();
  await store.load();
  assert.equal(status.workbenchSaveState, 'readonly');
  assert.equal(store.storage.getItem('speak'), null);
  store.importLocal();
  assert.equal(store.readOnly, true);
  assert.deepEqual(panels, []);
  assert.throws(() => store.storage.setItem('speak', state('preview edit')), /无法保存活动/);
  assert.equal(await store.flush(), true);
  assert.equal(values.get('speak'), state('original'));
  assert.deepEqual(methods, ['GET']);
});

test('approved preview modules save only newly made changes without importing earlier browser data', async () => {
  const writes = [];
  const { open, values } = fixture(async (path, options) => {
    assert.equal(path, '/api/workbench-activities/doodle');
    if (options.method === 'GET') return response(200, { data: { version: 0, snapshot: null } });
    writes.push(JSON.parse(options.body));
    return response(200, { data: { version: 1 } });
  }, { readOnly: true, activityWrites: true, existing: state('legacy') });
  values.set('speak:sync:test-tab', JSON.stringify({ version: 0, queued: { id: 'legacy', raw: state('old queue') } }));
  const { api, store } = open('doodle');
  assert.equal(api.readOnly, true);
  assert.equal(store.readOnly, false);
  assert.equal(open('unapproved').store.readOnly, true);
  await store.load();
  store.importLocal();
  assert.equal(store.storage.getItem('speak'), null);
  assert.equal(writes.length, 0);
  store.storage.setItem('speak', state('actual edit'));
  assert.equal(await store.flush(), true);
  assert.deepEqual(writes.map(write => write.snapshot), [{ draft: { name: 'actual edit' }, items: [] }]);
  assert.equal(values.get('speak'), state('legacy'));
});

test('production mode still reports activity service failures and read-only preview does not mask authentication errors', async () => {
  const unavailable = fixture(async () => response(503, { error: '活动服务暂不可用' }));
  await assert.rejects(unavailable.open().store.load(), { status: 503 });
  const readonly = fixture(async () => response(503, { error: '活动服务暂不可用' }), { readOnly: true });
  await assert.rejects(readonly.open().store.load(), { status: 503 });
  const signedOut = fixture(async () => response(401, { error: '请重新登录' }), { readOnly: true });
  await assert.rejects(signedOut.open().store.load(), { status: 401 });
});

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
