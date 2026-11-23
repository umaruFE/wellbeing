import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';

// Execute the maintained modules and the generated account-scoped package.
// No prototype files, browser storage, network or additional dependencies are used.
const sourceRoot = new URL('../workbench-ui/doodle-guess-v1/', import.meta.url);
const publicSource = new URL('../public/workbench-v6/doodle-guess-v1/', import.meta.url);
const publicRoot = existsSync(publicSource) ? publicSource : new URL('../dist/workbench-v6/doodle-guess-v1/', import.meta.url);
const plain = value => JSON.parse(JSON.stringify(value));
const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=';
const flush = async () => { for (let count = 0; count < 8; count++) await Promise.resolve(); };

function modules({ packaged = false, scope = 'teacher_A' } = {}) {
  const root = packaged ? publicRoot : sourceRoot;
  const context = vm.createContext({ URL, URLSearchParams, AbortController, WB_WEB_SCOPE: scope });
  context.window = context;
  const cache = new Map();
  function load(name) {
    name = name.replace(/^\.\//, '');
    if (cache.has(name)) return cache.get(name).exports;
    // Word tools retain their existing packaged bytes; all changed logic must
    // exist in the maintained source, so a missing copy cannot silently pass.
    const url = !packaged && name === 'word-tools.js' ? new URL(name, publicRoot) : new URL(name, root);
    assert.ok(existsSync(url), `Missing module: ${url.pathname}`);
    const entry = { exports: {} };
    cache.set(name, entry);
    const run = vm.runInContext(`(function(module,exports,require){\n${readFileSync(url, 'utf8')}\n})`, context, { filename: url.pathname });
    run(entry, entry.exports, load);
    return entry.exports;
  }
  return { M: load('model.js'), I: load('word-images.js'), W: load('word-tools.js'),
    C: load('classroom-wordbank.js'), R: load('runtime.js') };
}

function storageFixture(entries = []) {
  const data = new Map(entries);
  return { data, getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)) };
}

function legacyRecord() {
  // Existing schema-1 data deliberately lacks wordImages in both snapshots.
  const draft = { id: 'existing-activity', title: '已有动物活动', age: '7–10岁', wordCount: 20,
    theme: '动物', requirements: '保留已有教学要求', description: '旧活动',
    languageGoals: ['I can see a cat.'], languageGoalInput: '', rawWords: 'cat\nfish', words: ['cat', 'fish'],
    mode: 'solo', practiceSeconds: 60, level: 'sentence', quiet: true, rounds: 3 };
  return { ...draft, createdAt: '2026-11-18T01:00:00.000Z', updatedAt: '2026-11-18T02:00:00.000Z',
    _publication: { version: 4, confirmedAt: '2026-11-18T02:00:00.000Z', draft: plain(draft) } };
}

test('source: existing activity key and image-free publications remain compatible without becoming dirty', () => {
  const { M } = modules();
  assert.equal(M.STORAGE_KEY, 'wellbeing-doodle-v1-activities');
  const old = legacyRecord();
  const raw = JSON.stringify({ schemaVersion: 1, items: [old] });
  const storage = storageFixture([[M.STORAGE_KEY, raw]]);
  const loaded = M.read(storage);
  assert.equal(loaded.error, '');
  assert.equal(loaded.items.length, 1);
  const item = loaded.items[0];
  assert.deepEqual(plain(item.wordImages), {});
  assert.deepEqual(plain(item._publication.draft.wordImages), {});
  for (const key of ['id', 'title', 'age', 'wordCount', 'theme', 'requirements', 'createdAt', 'updatedAt']) {
    assert.equal(item[key], old[key], `Existing ${key} must survive normalization`);
  }
  assert.equal(M.hasChanges(item), false);
  assert.equal(M.publish(item)._publication.version, 4);
  assert.equal(storage.getItem(M.STORAGE_KEY), raw, 'Reading must not migrate or rewrite existing bytes');
  assert.equal(M.write(storage, loaded.items, loaded.baseline).ok, true);
  assert.equal(M.read(storage).items[0]._publication.version, 4);
});

test('source: image edits and removal change only the draft until a new teaching snapshot is confirmed', () => {
  const { M } = modules();
  const input = { ...M.fromCase('animals'), wordImages: { cat: { kind: 'upload', src: png }, fish: { kind: 'demo', variant: 0 } } };
  const published = M.publish(input);
  input.wordImages.fish.variant = 1;
  assert.equal(published.wordImages.fish.variant, 0);
  const snapshot = plain(published._publication);
  published.wordImages.fish.variant = 2;
  assert.equal(M.hasChanges(published), true);
  assert.deepEqual(plain(published._publication), snapshot);
  const storage = storageFixture();
  assert.equal(M.write(storage, [published], null).ok, true);
  const restored = M.read(storage).items[0];
  assert.equal(restored.wordImages.fish.variant, 2);
  assert.equal(restored._publication.draft.wordImages.fish.variant, 0);
  const next = M.publish(restored);
  assert.equal(next._publication.version, 2);
  assert.equal(next._publication.draft.wordImages.fish.variant, 2);
  assert.deepEqual(plain(restored._publication), snapshot);
  const removed = M.normalize({ ...restored, rawWords: 'fish' });
  assert.equal(removed.wordImages.cat, undefined);
  assert.equal(removed._publication.draft.wordImages.cat.src, png);
  next.wordImages.fish.variant = 1;
  assert.equal(next._publication.draft.wordImages.fish.variant, 2);
});

test('source: image normalization rejects unsafe/orphan values and stable key order does not dirty a snapshot', () => {
  const { I, M } = modules();
  const map = { ' CAT ': { kind: 'demo', variant: 2 }, fish: { kind: 'upload', src: png }, orphan: { kind: 'demo', variant: 0 } };
  assert.deepEqual(plain(I.normalize(map, ['cat', 'fish'])), { cat: { kind: 'demo', variant: 2 }, fish: { kind: 'upload', src: png } });
  const generated = { kind: 'ai', src: 'https://example.invalid/image.png' };
  assert.deepEqual(plain(I.normalize({ cat: generated }, ['cat'])), { cat: generated });
  for (const src of ['//example.invalid/image.png', 'javascript:alert(1)', 'data:image/svg+xml;base64,PHN2Zz4=',
    'data:image/png;base64,', 'data:image/png;base64,???=', 'data:image/png;base64,' + 'A'.repeat(I.MAX_SOURCE_LENGTH)]) {
    assert.deepEqual(plain(I.normalize({ cat: { kind: 'upload', src } }, ['cat'])), {});
  }
  assert.deepEqual(plain(I.normalize(Object.create({ cat: { kind: 'demo', variant: 0 } }), ['cat'])), {});
  const published = M.publish({ ...M.fromCase('animals'), wordImages: map });
  published.wordImages = { fish: published.wordImages.fish, cat: published.wordImages.cat };
  assert.equal(M.hasChanges(published), false);
});

function fileFixture(I) {
  const state = { width: 1600, height: 800, output: 'data:image/webp;base64,UklGRg==', revoked: [], calls: [], broken: false };
  const canvas = { getContext: () => ({ drawImage() {} }), toDataURL(...args) { state.calls.push(args); return state.output; } };
  const context = vm.createContext({
    Image: class { get naturalWidth() { return state.width; } get naturalHeight() { return state.height; }
      set src(value) { if (state.broken) this.onerror(); else this.onload(); } },
    URL: { createObjectURL: () => 'blob:test-image', revokeObjectURL: url => state.revoked.push(url) },
    document: { createElement: () => canvas },
  });
  return { api: vm.runInContext(`(${I.factory.toString()})()`, context), state, canvas };
}

test('source: upload validation, compression and temporary URL cleanup run the real image implementation', async () => {
  const { I } = modules();
  for (const file of [{ type: 'image/svg+xml', size: 10 }, { type: 'image/gif', size: 10 },
    { type: 'image/png', size: 0 }, { type: 'image/jpeg', size: I.MAX_FILE_BYTES + 1 }]) {
    await assert.rejects(I.fromFile(file), /请选择|为空|5 MB/);
  }
  const good = fileFixture(I);
  assert.equal((await good.api.fromFile({ type: 'image/png', size: I.MAX_FILE_BYTES })).src, good.state.output);
  assert.equal(good.canvas.width, 512);
  assert.equal(good.canvas.height, 256);
  assert.deepEqual(good.state.calls, [['image/webp', 0.8]]);
  assert.deepEqual(good.state.revoked, ['blob:test-image']);
  for (const mode of ['broken', 'invalid-size', 'oversize', 'encoder']) {
    const bad = fileFixture(I);
    if (mode === 'broken') bad.state.broken = true;
    if (mode === 'invalid-size') bad.state.width = 0;
    if (mode === 'oversize') bad.state.output = 'data:image/webp;base64,' + 'A'.repeat(I.MAX_SOURCE_LENGTH);
    if (mode === 'encoder') bad.state.output = 'data:,';
    await assert.rejects(bad.api.fromFile({ type: 'image/webp', size: 20 }), /损坏|尺寸|过大|压缩失败/);
    assert.deepEqual(bad.state.revoked, ['blob:test-image']);
  }
});

test('source: classroom word cards preserve image safety and deletion undo stays within its editing session', () => {
  const { C, W } = modules();
  const icon = name => `<svg data-icon="${name}"></svg>`;
  assert.match(C.cardMarkup('cat', 0, W.picture('cat'), icon, { kind: 'upload', src: png }), /<img src="data:image\/png;base64,/);
  assert.match(C.cardMarkup('cat', 0, W.picture('cat'), icon, { kind: 'demo', variant: 2 }), /data-image-variant="2"/);
  assert.doesNotMatch(C.cardMarkup('cat', 0, W.picture('cat'), icon, { kind: 'upload', src: 'javascript:alert(1)' }), /javascript:|<img/);
  const current = { session: {}, id: 'first', raw: 'cat\nfish' };
  const editor = C.createEditorController(W, () => current, raw => { current.raw = raw; });
  assert.equal(editor.remove(0).ok, true);
  assert.equal(current.raw, 'fish');
  assert.equal(editor.canUndo(), true);
  assert.equal(editor.undo().ok, true);
  assert.equal(current.raw, 'cat\nfish');
  editor.setAdd(' CAT ');
  assert.equal(editor.commit().ok, false);
  editor.cancel();
  assert.equal(editor.remove(0).ok, true);
  current.session = {};
  assert.equal(editor.canUndo(), false, 'A fresh classroom Word Bank session cannot undo an earlier session');
});

function eventTarget() {
  const listeners = new Map();
  return { addEventListener(type, fn) { const group = listeners.get(type) || new Set(); group.add(fn); listeners.set(type, group); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    emit(type, event) { return [...(listeners.get(type) || [])].map(fn => fn(event)); } };
}

function classroomFixture(prefix) {
  return `<html><head></head><body><script>
    const loaded = JSON.parse(localStorage.getItem(${JSON.stringify(prefix + 'lessons')}));
    function curLesson(){ return loaded[0]; }
    function openDuelSetup(){} function paintDuelSetupSource(){} function createDuelMatch(){}
    localStorage.setItem(${JSON.stringify(prefix + 'stats')}, 'classroom-only');
    sessionStorage.setItem('temporary', 'classroom-only');
  </script></body></html>`;
}

function bootClassroom(R, input, prefix = 'dg_english_v13_', kind = 'preview') {
  const messages = [];
  let realReads = 0;
  const context = vm.createContext({ ...eventTarget(), document: { ...eventTarget(), getElementById: () => null },
    parent: { WB_WEB_SCOPE: 'untrusted-parent-value', postMessage: value => messages.push(value) }, speechSynthesis: { cancel() {} } });
  context.window = context;
  for (const key of ['localStorage', 'sessionStorage']) {
    Object.defineProperty(context, key, { configurable: true, get() { realReads++; throw Error('Real storage must stay untouched'); } });
  }
  const html = R.buildSrcdoc(classroomFixture(prefix), input, kind, 'image-test');
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)) vm.runInContext(match[1], context);
  assert.equal(messages.at(-1)?.status, 'ready');
  assert.equal(realReads, 0);
  assert.match(html, /default-src 'none'/);
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /form-action 'none'/);
  return { html, context, read: expression => vm.runInContext(expression, context) };
}

test('source: preview and teaching runtimes clone images into separate memory stores without changing drafts', async () => {
  const { M, R } = modules();
  const record = M.publish({ ...M.fromCase('animals'), wordImages: { cat: { kind: 'upload', src: png }, fish: { kind: 'demo', variant: 0 } } });
  record.wordImages.fish.variant = 2;
  const before = plain(record);
  const frozen = R.normalizeConfig(record);
  assert.equal(Object.isFrozen(frozen.wordImages), true);
  assert.equal(Object.isFrozen(frozen.wordImages.cat), true);
  const preview = bootClassroom(R, record);
  const teaching = bootClassroom(R, record._publication.draft, 'dg_english_v13_', 'classroom');
  assert.equal(preview.read('curLesson().wordImages.fish.variant'), 2);
  assert.equal(teaching.read('curLesson().wordImages.fish.variant'), 0);
  preview.read('curLesson().wordImages.fish.variant = 1; localStorage.setItem("preview-only", "yes")');
  assert.equal(teaching.context.localStorage.getItem('preview-only'), null);
  assert.equal(teaching.context.sessionStorage.getItem('temporary'), 'classroom-only');
  assert.deepEqual(plain(record), before);

  // Inspect the iframe actually created by createRuntime, not just its constant.
  const frames = [], errors = [], ready = [], env = eventTarget();
  const host = { hidden: false, appendChild: frame => frames.push(frame), closest: () => null, getClientRects: () => [{}] };
  const doc = { ...eventTarget(), hidden: false, baseURI: 'http://test.invalid/doodle/index.html',
    createElement(tag) { assert.equal(tag, 'iframe'); return { attributes: {}, style: {}, contentWindow: { postMessage() {} },
      setAttribute(key, value) { this.attributes[key] = value; }, remove() { this.removed = true; } }; } };
  Object.assign(env, { document: doc, AbortController, queueMicrotask, crypto: { randomUUID: () => 'sandbox-channel' },
    setTimeout: () => 1, clearTimeout() {}, fetch: async () => ({ ok: true, text: async () => classroomFixture('dg_english_v13_') }) });
  const handle = R.createRuntime(env).open({ host, config: record, kind: 'preview', onReady: value => ready.push(value), onError: error => errors.push(error) });
  await flush();
  assert.deepEqual(errors, []);
  assert.equal(frames.length, 1);
  assert.equal(frames[0].attributes.sandbox, 'allow-scripts allow-modals allow-forms');
  assert.equal(frames[0].attributes.sandbox.includes('allow-same-origin'), false);
  const message = { type: 'doodle-runtime-v1', channel: 'sandbox-channel', status: 'ready' };
  env.emit('message', { source: {}, data: message });
  assert.equal(ready.length, 0);
  env.emit('message', { source: frames[0].contentWindow, data: message });
  assert.equal(ready.length, 1);
  handle.destroy();
  assert.equal(frames[0].removed, true);
});

function appFixture(fromFile = async () => ({ kind: 'upload', src: png })) {
  const { M, I, W } = modules();
  const seed = M.publish({ ...legacyRecord(), wordImages: { cat: { kind: 'demo', variant: 0 }, fish: { kind: 'demo', variant: 1 } } });
  const storage = storageFixture([[M.STORAGE_KEY, JSON.stringify({ schemaVersion: 1, items: [seed] })]]);
  const node = () => ({ ...eventTarget(), innerHTML: '', textContent: '', dataset: {}, value: '', classList: { add() {}, remove() {}, toggle() {} },
    close() { this.open = false; }, showModal() { this.open = true; }, focus() {}, setAttribute() {}, removeAttribute() {} });
  const nodes = new Map(['app', 'dialog', 'toast', 'save-status', 'storage-alert', 'word-summary', 'word-editor-feedback', 'word-add-input', 'error-words', 'activity-title'].map(id => [id, node()]));
  const files = [];
  const document = { ...eventTarget(), getElementById: id => nodes.get(id) || null,
    querySelector: () => null, querySelectorAll: () => [],
    createElement(tag) { assert.equal(tag, 'input'); const input = { ...node(), files: [], click() {} }; files.push(input); return input; } };
  const window = { ...eventTarget(), DoodleModel: M, DoodleWordTools: W, DoodleWordImages: { ...I, fromFile },
    localStorage: storage, scrollTo() {} };
  window.parent = window;
  const location = { search: '', origin: 'http://doodle.test', href: '/doodle/index.html' };
  vm.runInNewContext(readFileSync(new URL('app.js', sourceRoot), 'utf8'), {
    window, document, location, URLSearchParams, setTimeout: () => 1, clearTimeout() {},
  }, { filename: 'workbench-ui/doodle-guess-v1/app.js' });
  function click(action, data = {}) {
    const button = { dataset: { action, ...data }, closest: () => null };
    document.emit('click', { target: { closest: () => button } });
  }
  click('edit', { id: seed.id });
  return { click, window, nodes, seed, saved: () => plain(M.read(storage).items[0]),
    choose(file) { const input = files.at(-1); assert.ok(input, 'Upload must open a file input'); input.files = file ? [file] : []; return Promise.all(input.emit('change', {})); } };
}

test('app: deleting and undoing a word restores its image without touching the confirmed version', async () => {
  const h = appFixture();
  const before = h.saved();
  h.click('word-remove', { index: '0' });
  assert.equal(await h.window.WBPrepareModuleSwitch(), true);
  assert.deepEqual(h.saved().words, ['fish']);
  assert.equal(h.saved().wordImages.cat, undefined);
  assert.deepEqual(h.saved()._publication, before._publication);
  h.click('word-undo');
  assert.equal(await h.window.WBPrepareModuleSwitch(), true);
  assert.deepEqual(h.saved().words, before.words);
  assert.deepEqual(h.saved().wordImages, before.wordImages);
  assert.deepEqual(h.saved()._publication, before._publication);
});

test('app: cancelling file selection or choosing a file after leaving does not create an image job', async () => {
  let conversions = 0;
  const h = appFixture(async () => { conversions++; return { kind: 'upload', src: png }; });
  const before = h.saved();
  h.click('image-upload', { word: 'cat' });
  await h.choose(null);
  assert.equal(await h.window.WBPrepareModuleSwitch(), true);
  assert.deepEqual(h.saved(), before);
  h.click('image-upload', { word: 'cat' });
  h.click('home');
  await h.choose({ type: 'image/png', size: 10 });
  assert.equal(conversions, 0);
  assert.deepEqual(h.saved(), before);
});

test('app: pending upload blocks departure; deleting then undoing ignores its late result', async () => {
  let resolve;
  const h = appFixture(() => new Promise(done => { resolve = done; }));
  const before = h.saved();
  h.click('image-upload', { word: 'cat' });
  const pending = h.choose({ type: 'image/png', size: 10 });
  assert.equal(await h.window.WBPrepareModuleSwitch(), false);
  h.click('home');
  assert.match(h.nodes.get('app').innerHTML, /word-add-input/);
  h.click('word-remove', { index: '0' });
  h.click('word-undo');
  resolve({ kind: 'upload', src: png });
  await pending;
  assert.equal(await h.window.WBPrepareModuleSwitch(), true);
  assert.deepEqual(h.saved().wordImages, before.wordImages);
  assert.deepEqual(h.saved()._publication, before._publication);
});

test('app: successful upload saves a draft image; failed upload keeps the old image and permits retry', async () => {
  let fail = true;
  const h = appFixture(async () => { if (fail) throw Error('图片已损坏，请重试。'); return { kind: 'upload', src: png }; });
  const snapshot = h.saved()._publication;
  h.click('image-upload', { word: 'cat' });
  await h.choose({ type: 'image/png', size: 10 });
  assert.match(h.nodes.get('word-summary').innerHTML, /图片已损坏/);
  assert.equal(await h.window.WBPrepareModuleSwitch(), true);
  assert.equal(h.saved().wordImages.cat.kind, 'demo');
  fail = false;
  h.click('image-upload', { word: 'cat' });
  await h.choose({ type: 'image/png', size: 10 });
  assert.equal(await h.window.WBPrepareModuleSwitch(), true);
  assert.equal(h.saved().wordImages.cat.src, png);
  assert.deepEqual(h.saved()._publication, snapshot);
});

test('packaged: existing account keys stay readable and image writes cannot cross accounts or use the development key', () => {
  const a = modules({ packaged: true, scope: 'teacher_A' });
  const b = modules({ packaged: true, scope: 'teacher_B' });
  const key = scope => `wellbeing-web-three-v1-${scope}-external-doodle-wellbeing-doodle-v1-activities`;
  assert.equal(a.M.STORAGE_KEY, key('teacher_A'));
  assert.equal(b.M.STORAGE_KEY, key('teacher_B'));
  const raw = JSON.stringify({ schemaVersion: 1, items: [legacyRecord()] });
  const storage = storageFixture([[key('teacher_A'), raw], [key('teacher_B'), raw], ['wellbeing-doodle-v1-activities', 'protected standalone data']]);
  const loaded = a.M.read(storage);
  assert.equal(loaded.error, '');
  assert.equal(a.M.hasChanges(loaded.items[0]), false);
  loaded.items[0].wordImages.cat = { kind: 'upload', src: png };
  assert.equal(a.M.write(storage, loaded.items, loaded.baseline).ok, true);
  assert.equal(a.M.read(storage).items[0].wordImages.cat.src, png);
  assert.equal(a.M.read(storage).items[0]._publication.version, 4);
  assert.deepEqual(plain(a.M.read(storage).items[0]._publication.draft.wordImages), {});
  assert.equal(storage.getItem(key('teacher_B')), raw);
  assert.deepEqual(plain(b.M.read(storage).items[0].wordImages), {});
  assert.equal(storage.getItem('wellbeing-doodle-v1-activities'), 'protected standalone data');
  assert.equal([...storage.data.keys()].some(value => value.includes('manual-words-dev')), false);
});

test('packaged: nested opaque classrooms inherit the launching account scope and keep images in separate memory', () => {
  const instances = ['teacher_A', 'teacher_B'].map((scope, variant) => {
    const { M, R } = modules({ packaged: true, scope });
    const record = M.publish({ ...M.fromCase('animals'), wordImages: { cat: { kind: 'upload', src: png }, fish: { kind: 'demo', variant } } });
    const prefix = `wellbeing-web-three-v1-${scope}-external-doodle-dg_english_v13_`;
    const classroom = bootClassroom(R, record._publication.draft, prefix, 'classroom');
    assert.equal(classroom.context.WB_WEB_SCOPE, scope);
    assert.equal(classroom.read('__doodleWordImageSet.images.cat.src'), png);
    assert.equal(classroom.read('curLesson().wordImages.fish.variant'), variant);
    const keys = Array.from({ length: classroom.context.localStorage.length }, (_, index) => classroom.context.localStorage.key(index));
    assert.ok(keys.every(value => value.startsWith(prefix)));
    assert.equal(classroom.context.localStorage.getItem('dg_english_v13_lessons'), null);
    return classroom;
  });
  instances[0].read('curLesson().wordImages.fish.variant = 2; localStorage.clear(); sessionStorage.clear()');
  assert.equal(instances[1].read('curLesson().wordImages.fish.variant'), 1);
  assert.ok(instances[1].context.localStorage.length > 0);
  assert.equal(instances[1].context.sessionStorage.getItem('temporary'), 'classroom-only');
});
