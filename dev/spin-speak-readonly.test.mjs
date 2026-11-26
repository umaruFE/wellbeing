import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const sourceRoot = new URL('../workbench-ui/spin-speak-v1/', import.meta.url);
const modelSource = readFileSync(new URL('model.js', sourceRoot), 'utf8');
const appSource = readFileSync(new URL('app.js', sourceRoot), 'utf8');
const artSource = readFileSync(new URL('../public/workbench-v6/spin-speak-v1/art.js', import.meta.url), 'utf8');

async function openActivityLibrary({ readOnly, storedActivity = false, rejectWrites = false }) {
  const listeners = new Map();
  const writes = [];
  const title = { matches: () => true };
  const checkbox = { matches: () => false };
  const warning = { hidden: true, querySelector: () => ({}) };
  const app = {
    get innerHTML() { return this.html; },
    set innerHTML(html) {
      this.html = html;
      this.actions = [...html.matchAll(/<button[^>]*\bdata-action="([^"]+)"/g)]
        .map(([, action]) => ({ dataset: { action }, disabled: false }));
    },
    addEventListener(name, callback) { listeners.set(name, callback); },
    querySelectorAll(selector) {
      if (selector === 'button[data-action]') return this.actions;
      if (this.html.includes('speak-authoring')) return [title, checkbox];
      return [];
    },
  };
  const nodes = new Map([
    ['#app', app],
    ['#player', { open: false, addEventListener() {} }],
    ['#player-close', {}],
    ['#storage-warning', warning],
    ['#toast', { classList: { add() {}, remove() {} } }],
  ]);
  const context = vm.createContext({
    document: {
      querySelector: selector => nodes.get(selector),
      querySelectorAll: () => [],
      addEventListener() {},
    },
    WBPlatform: { navigation: () => '' },
    setTimeout: () => 1,
    clearTimeout() {},
    addEventListener() {},
  });
  context.window = context;
  vm.runInContext(modelSource, context);
  vm.runInContext(artSource, context);
  const saved = {
    ...context.SpeakModel.initial(), id: 'stored-draft',
    title: '后台口语草稿', input: 'We speak English.',
  };
  let snapshot = storedActivity ? JSON.stringify({ draft: saved, items: [] }) : null;
  context.WBWorkbenchApi = {
    readOnly,
    activityStore: () => ({
      readOnly,
      load: async () => {},
      importLocal() {},
      flush: async () => true,
      storage: {
        getItem: () => snapshot,
        setItem(_key, value) {
          writes.push(JSON.parse(value));
          if (readOnly || rejectWrites) throw Error('Storage is not writable');
          snapshot = value;
        },
      },
    }),
  };
  vm.runInContext(appSource, context);
  await new Promise(resolve => setImmediate(resolve));
  return {
    app, title, checkbox, warning, writes,
    canLeave: () => context.WBPrepareModuleSwitch(),
    control: action => app.actions.find(button => button.dataset.action === action),
    click: (action, attrs = {}) => listeners.get('click')({
      target: { closest: () => ({ dataset: { action, ...attrs } }) },
      preventDefault() {},
    }),
  };
}

test('an empty read-only activity library prevents a new draft and releases menu navigation', async () => {
  const page = await openActivityLibrary({ readOnly: true });
  assert.equal(page.control('case-preview').disabled, false);
  assert.equal(page.control('use-case').disabled, true);
  assert.equal(page.control('new').disabled, true);
  await page.click('new');
  await page.click('tab', { tab: 'mine' });
  assert.match(page.app.innerHTML, /暂无我制作的活动/);
  assert.equal(page.control('case-preview'), undefined);
  assert.equal(page.warning.hidden, true);
  assert.equal(await page.canLeave(), true);
  assert.deepEqual(page.writes, []);
});

test('an existing backend draft can be viewed and left without a save in read-only mode', async () => {
  const page = await openActivityLibrary({ readOnly: true, storedActivity: true });
  assert.doesNotMatch(page.app.innerHTML, /后台口语草稿/);
  await page.click('tab', { tab: 'mine' });
  assert.equal(page.control('resume').disabled, false);
  await page.click('resume');
  assert.match(page.app.innerHTML, /后台口语草稿/);
  assert.match(page.app.innerHTML, /We speak English\./);
  assert.equal(page.title.readOnly, true);
  assert.equal(page.checkbox.disabled, true);
  assert.equal(page.control('generate').disabled, true);
  assert.equal(await page.canLeave(), true);
  await page.click('home');
  assert.match(page.app.innerHTML, /查看备课/);
  assert.deepEqual(page.writes, []);
});

test('a real save failure in an editable activity still protects the draft on navigation', async () => {
  const page = await openActivityLibrary({ readOnly: false, rejectWrites: true });
  assert.equal(page.control('new').disabled, false);
  await page.click('new');
  assert.match(page.app.innerHTML, /speak-authoring/);
  assert.equal(page.writes.length, 1);
  assert.equal(await page.canLeave(), false);
});
