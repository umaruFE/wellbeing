import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from '@babel/parser';

// Execute the actual component closures with controlled services and setters.
// Keeping the implementation in the JSX makes these checks catch regressions
// in the production handlers rather than a second implementation in the test.
const pageUrl = new URL('../src/modules/picture-book/PictureBookStudioPage.jsx', import.meta.url);
const source = fs.readFileSync(pageUrl, 'utf8');
const functionNames = new Set(['saveBook', 'backToList', 'goToStep', 'enterMaking']);
const implementations = new Map();

function collectFunctions(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'VariableDeclarator' && functionNames.has(node.id.name)) {
    assert.equal(implementations.has(node.id.name), false, `Duplicate handler: ${node.id.name}`);
    implementations.set(node.id.name, source.slice(node.init.start, node.init.end));
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(collectFunctions);
    else if (value && typeof value === 'object') collectFunctions(value);
  }
}

collectFunctions(parse(source, { sourceType: 'module', plugins: ['jsx'] }));

function actualHandler(name, environment) {
  assert.ok(implementations.has(name), `Missing production handler: ${name}`);
  return vm.runInNewContext(`(${implementations.get(name)})`, environment, {
    filename: `${pageUrl.pathname}#${name}`,
  });
}

function saveFixture({ existing = false, failure = false } = {}) {
  const requests = [];
  const saving = [];
  const statuses = [];
  const createdIds = [];
  const editingBookIdRef = { current: existing ? 'existing-book' : null };
  const save = actualHandler('saveBook', {
    basicInfo: { age: '7-9' },
    activityPlan: { storyTitleEn: 'My Book' },
    pages: [{ id: 'page-1', imageUrl: 'local-cover.png' }],
    backgroundMusic: null,
    step: 2,
    user: { id: 'teacher-1' },
    editingBookId: null,
    editingBookIdRef,
    t: key => key,
    setSaving: value => saving.push(value),
    setSaveState: value => statuses.push(value),
    setEditingBookId: value => createdIds.push(value),
    apiService: {
      async request(path, options) {
        requests.push({ path, method: options.method, body: JSON.parse(options.body) });
        if (failure) throw new Error('Storage unavailable');
        return { data: { id: 'created-book' } };
      },
    },
    console: { error() {} },
  });
  return { save, requests, saving, statuses, createdIds, editingBookIdRef };
}

test('saveBook creates a draft and returns true after the API succeeds', async () => {
  const fixture = saveFixture();
  assert.equal(await fixture.save(), true);
  assert.equal(fixture.requests[0].path, '/api/picture-books');
  assert.equal(fixture.requests[0].method, 'POST');
  assert.equal(fixture.requests[0].body.bookData.step, 2);
  assert.equal(fixture.requests[0].body.coverUrl, 'local-cover.png');
  assert.equal(fixture.editingBookIdRef.current, 'created-book');
  assert.deepEqual(fixture.createdIds, ['created-book']);
  assert.deepEqual(fixture.saving, [true, false]);
  assert.deepEqual(fixture.statuses, ['', 'pictureBook.saved']);
});

test('saveBook updates the existing draft and preserves the requested step', async () => {
  const fixture = saveFixture({ existing: true });
  assert.equal(await fixture.save({ step: 3 }), true);
  assert.equal(fixture.requests[0].path, '/api/picture-books/existing-book');
  assert.equal(fixture.requests[0].method, 'PUT');
  assert.equal(fixture.requests[0].body.bookData.step, 3);
  assert.deepEqual(fixture.createdIds, []);
  assert.deepEqual(fixture.saving, [true, false]);
  assert.equal(fixture.statuses.at(-1), 'pictureBook.saved');
});

test('saveBook converts an API exception to false and exposes the save failure', async () => {
  const fixture = saveFixture({ failure: true });
  assert.equal(await fixture.save(), false);
  assert.equal(fixture.editingBookIdRef.current, null);
  assert.deepEqual(fixture.createdIds, []);
  assert.deepEqual(fixture.saving, [true, false]);
  assert.deepEqual(fixture.statuses, ['', 'pictureBook.saveFailed']);
});

const navigationCases = [
  { name: 'backToList', args: [], saveArgs: undefined, success: [['view', 'list']] },
  { name: 'goToStep', args: [2], saveArgs: { step: 2 }, success: [['step', 2]] },
  { name: 'enterMaking', args: ['all'], saveArgs: { step: 3 }, success: [['step', 3], ['generate']] },
];

for (const { name, args, saveArgs, success } of navigationCases) {
  for (const accepted of [false, true]) {
    test(`${name} waits for save and ${accepted ? 'continues after success' : 'stays in place after failure'}`, async () => {
      const actions = [];
      const saveCalls = [];
      let finishSave;
      const handler = actualHandler(name, {
        saveBook(extraData) {
          saveCalls.push(extraData === undefined ? undefined : JSON.parse(JSON.stringify(extraData)));
          return new Promise(resolve => { finishSave = resolve; });
        },
        setView: value => actions.push(['view', value]),
        setStep: value => actions.push(['step', value]),
        generateAllImages: async () => actions.push(['generate']),
      });

      const pending = handler(...args);
      assert.deepEqual(saveCalls, [saveArgs]);
      assert.deepEqual(actions, [], 'No navigation or image generation while save is pending');
      finishSave(accepted);
      await pending;
      assert.deepEqual(actions, accepted ? success : []);
    });
  }
}
