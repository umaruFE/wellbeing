import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const [goals, modelScript, libraryScript, appScript, backendScript] = [
  '../public/workbench-v6/prep-workbench-six-modules-v1/language-goals.js',
  ...['model', 'library', 'app', 'existing-backend'].map(name => `../workbench-ui/yoga/${name}.js`),
].map(file => {
  const path = new URL(file, import.meta.url);
  return new vm.Script(readFileSync(path, 'utf8'), { filename: path.pathname });
});

async function openYoga({ readOnly = false, rejectWrites = false } = {}) {
  const events = new Map();
  const windowEvents = new Map();
  const app = { innerHTML: '', querySelectorAll: () => [] };
  const dialog = { open: false, classList: { remove() {} } };
  const toast = { classList: { add() {}, remove() {} } };
  const nodes = new Map([['#app', app], ['#dialog', dialog], ['#toast', toast]]);
  const context = vm.createContext({
    document: {
      querySelector: selector => nodes.get(selector) || null,
      querySelectorAll: () => [],
      addEventListener: (name, fn) => events.set(name, fn),
    },
    addEventListener: (name, fn) => windowEvents.set(name, fn),
    scrollTo() {}, clearTimeout() {}, setTimeout() {},
    YogaScene: { render: () => '', renderCharacter: () => '<span></span>', renderReference: () => '' },
    WBPlatform: { navigation: () => '' },
  });
  context.window = context;
  goals.runInContext(context);
  modelScript.runInContext(context);
  libraryScript.runInContext(context);
  const { YogaLibrary: library, YogaModel: model } = context;
  const ocean = { ...library.CASES.find(item => item.id === 'ocean'), state: library.getCase('ocean') };
  context.WBWorkbenchApi = { caseLibrary: () => ({
    items: [ocean], find: id => id === ocean.id ? ocean : null, load: async () => {},
  }) };
  const record = library.createRecord(model.createState(), { id: 'existing' });
  let stored = JSON.stringify(library.upsert(library.createLibrary(), record));
  let writes = 0;
  const storage = {
    getItem: key => key === library.KEY ? stored : null,
    setItem(_key, value) {
      writes++;
      if (readOnly || rejectWrites) throw Error('Write failed');
      stored = value;
    },
  };
  context.YogaExistingBackend = { createStore: () => ({ readOnly, storage, load: async () => {}, flush: async () => true }) };
  appScript.runInContext(context);
  await new Promise(resolve => setImmediate(resolve));
  assert.match(app.innerHTML, /yoga-home/);
  return {
    app,
    toast,
    get writes() { return writes; },
    click(action, attrs = {}) {
      const button = { dataset: { action, ...attrs } };
      events.get('click')({ target: { closest: () => button } });
    },
    edit(value) {
      events.get('input')({ target: { dataset: { setting: 'context' }, value } });
    },
    leave: () => context.WBPrepareModuleSwitch(),
    unloadBlocked() {
      let blocked = false;
      windowEvents.get('beforeunload')({ preventDefault: () => { blocked = true; } });
      return blocked;
    },
  };
}

for (const readOnly of [true, false]) {
  test(`browsing the yoga library and viewing a saved course never writes (readOnly=${readOnly})`, async () => {
    const page = await openYoga({ readOnly, rejectWrites: true });
    assert.equal(await page.leave(), true);
    page.click('open-course', { id: 'existing' });
    assert.match(page.app.innerHTML, /unified-prep-main/);
    assert.equal(await page.leave(), true);
    page.click('home');
    assert.match(page.app.innerHTML, /yoga-home/);
    assert.equal(await page.leave(), true);
    assert.equal(page.unloadBlocked(), false);
    assert.equal(page.writes, 0);
  });
}

test('read-only create, copy, and form events cannot create a draft or block leaving', async () => {
  const page = await openYoga({ readOnly: true });
  page.click('setup');
  page.click('copy-case', { id: 'ocean' });
  assert.match(page.app.innerHTML, /yoga-home/);
  page.click('open-course', { id: 'existing' });
  page.edit('new text');
  assert.equal(await page.leave(), true);
  assert.equal(page.writes, 0);
});

test('an actual writable yoga edit is saved once and a failed edit stays protected', async () => {
  const page = await openYoga();
  page.click('open-course', { id: 'existing' });
  page.edit('new text');
  assert.equal(page.writes, 1);
  assert.equal(await page.leave(), true);
  assert.equal(page.writes, 1);

  const failed = await openYoga({ rejectWrites: true });
  failed.click('open-course', { id: 'existing' });
  failed.edit('unsaved text');
  assert.equal(await failed.leave(), false);
  assert.equal(failed.unloadBlocked(), true);
});

test('a teacher can open visuals and voice from a copied case, switch pages, and return from music', async () => {
  const page = await openYoga();
  page.click('copy-case', { id: 'ocean' });
  page.click('step', { step: '2' });
  assert.match(page.app.innerHTML, /进入画面与配音/);
  page.click('step', { step: '3' });
  assert.ok(page.app.innerHTML.includes('id="yoga-voice"'), page.toast.textContent);
  const pageIds = [...page.app.innerHTML.matchAll(/data-action="select-page" data-id="([^"]+)"/g)].map(match => match[1]);
  assert.ok(pageIds.length > 1);
  page.click('select-page', { id: pageIds[1] });
  assert.ok(page.app.innerHTML.includes('第 2 页'), page.toast.textContent);
  page.click('step', { step: '4' });
  assert.match(page.app.innerHTML, /music-arrangement/);
  page.click('step', { step: '3' });
  assert.ok(page.app.innerHTML.includes('id="yoga-voice"'), page.toast.textContent);
});

test('a case preview does not retry or discard an unrelated failed editor save', async () => {
  const page = await openYoga({ rejectWrites: true });
  page.click('open-course', { id: 'existing' });
  page.edit('unsaved text');
  page.click('home');
  page.click('library-tab', { tab: 'cases' });
  const writes = page.writes;
  page.click('case-preview', { id: 'ocean' });
  assert.match(page.app.innerHTML, /aria-label="案例预览"/);
  assert.equal(page.writes, writes);
  assert.equal(page.unloadBlocked(), true);
});

function previewStore(request) {
  const values = new Map([['token', 'session'], ['wellbeing-workbench-tab', 'tab']]);
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
  const context = vm.createContext({
    localStorage: storage, sessionStorage: storage,
    addEventListener() {}, clearTimeout() {}, setTimeout() {},
    WBWorkbenchApi: { readOnly: true, request },
  });
  context.window = context;
  for (const script of [goals, modelScript, libraryScript, backendScript]) script.runInContext(context);
  return { library: context.YogaLibrary, model: context.YogaModel, open: context.YogaExistingBackend.createStore, values };
}

test('the yoga production preview waits for its backend write capability and leaves earlier local drafts alone', async () => {
  let canWrite = false;
  const { library, model, open, values } = previewStore(async (url, options) => {
    assert.equal(url, '/api/creative-works?moduleId=interactive-yoga');
    assert.equal(options.method, undefined);
    return { data: [], canWrite };
  });
  const record = library.createRecord(model.createState());
  const local = JSON.stringify(library.upsert(library.createLibrary(), record));
  values.set(library.KEY, local);
  values.set(library.KEY + ':creative-sync:tab', JSON.stringify([{ record, expected: null }]));
  const store = open();
  await store.load();
  assert.ok(store.readOnly);
  assert.throws(() => store.storage.setItem(library.KEY, local), /无法保存/);
  canWrite = true;
  await store.load();
  assert.equal(store.readOnly, false);
  assert.equal(store.dirty, false);
  assert.equal(library.load(store.storage).items.length, 0);
  assert.equal(values.get(library.KEY), local);
});

test('a copied yoga case sends its pages on creation and recovers a lost response without a duplicate', async () => {
  let row;
  const methods = [];
  const { library, open } = previewStore(async (url, { method = 'GET', body }) => {
    methods.push(method);
    if (method === 'GET') return { data: row ? [row] : [], canWrite: true };
    assert.equal(url, '/api/creative-works');
    assert.equal(method, 'POST');
    assert.equal(body.moduleId, 'interactive-yoga');
    assert.equal(body.pages.length, body.parameters.workbenchYoga.state.draft.pages.length);
    row = { id: 1, parameters: body.parameters, result: { pages: body.pages }, updated_at: new Date().toISOString() };
    throw new Error('Response lost after commit');
  });
  const store = open();
  await store.load();
  const record = library.createRecord(library.cloneCase('ocean'), { sourceCaseId: 'ocean' });
  library.persist(store.storage, library.load(store.storage), record, { expectedToken: null });
  assert.equal(await store.flush(), true);
  assert.equal(store.dirty, false);
  const reopened = open();
  await reopened.load();
  const saved = library.get(library.load(reopened.storage), record.id);
  assert.equal(saved.sourceCaseId, 'ocean');
  assert.equal(saved.state.published, null);
  assert.equal(saved.state.draft.pages.length, 6);
  assert.deepEqual(methods, ['GET', 'POST', 'GET', 'GET']);
});
