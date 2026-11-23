import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { parse } from '@babel/parser';
import { pictureBookCases, createPictureBookCaseDraft } from '../src/modules/picture-book/pictureBookCases.js';

const plain = value => JSON.parse(JSON.stringify(value));
const pageUrl = new URL('../src/modules/picture-book/PictureBookStudioPage.jsx', import.meta.url);
const source = fs.readFileSync(pageUrl, 'utf8');
const names = new Set(['useBookCase', 'saveBook', 'initialBasicInfo', 'initialActivityPlan']);
const implementations = new Map();

// Read the actual JSX closures and defaults; no second copy of their behavior.
function collect(node) {
  if (!node || typeof node !== 'object') return;
  if (node.type === 'VariableDeclarator' && names.has(node.id.name)) {
    assert.equal(implementations.has(node.id.name), false, `Duplicate declaration: ${node.id.name}`);
    implementations.set(node.id.name, source.slice(node.init.start, node.init.end));
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(collect);
    else if (value && typeof value === 'object') collect(value);
  }
}
collect(parse(source, { sourceType: 'module', plugins: ['jsx'] }));

function actual(name, environment = {}) {
  assert.ok(implementations.has(name), `Missing production declaration: ${name}`);
  return vm.runInNewContext(`(${implementations.get(name)})`, environment, { filename: `${pageUrl.pathname}#${name}` });
}

function assertFrozenTree(value, path = 'cases') {
  if (!value || typeof value !== 'object') return;
  assert.equal(Object.isFrozen(value), true, `${path} must be immutable`);
  for (const [key, child] of Object.entries(value)) assertFrozenTree(child, `${path}.${key}`);
}

function assertIndependentTree(first, second, path = 'draft') {
  if (!first || typeof first !== 'object') return;
  assert.notStrictEqual(first, second, `${path} must not share an object or array`);
  for (const [key, value] of Object.entries(first)) {
    if (value && typeof value === 'object') assertIndependentTree(value, second[key], `${path}.${key}`);
  }
}

test('the built-in picture-book case and every nested object remain immutable', () => {
  assert.equal(pictureBookCases.length, 1);
  assertFrozenTree(pictureBookCases);
  const book = pictureBookCases[0];
  const before = plain(book);
  assert.throws(() => { book.book_data.pages[0].text = 'Changed'; }, TypeError);
  assert.throws(() => { book.book_data.basicInfo.themes.push('Changed'); }, TypeError);
  assert.throws(() => { pictureBookCases.push({}); }, TypeError);
  assert.deepEqual(plain(book), before);
});

test('two case drafts have independent nested pages, settings and plans', () => {
  const book = pictureBookCases[0];
  const before = plain(book.book_data);
  const first = createPictureBookCaseDraft(book);
  const second = createPictureBookCaseDraft(book);
  assert.deepEqual(first, second);
  assertIndependentTree(first, second);
  assertIndependentTree(first, book.book_data);
  first.basicInfo.themes.push('New theme');
  first.basicInfo.materials[0] = 'Different material';
  first.activityPlan.storyTitleEn = 'My own book';
  first.pages[0].text = 'My own page';
  first.pages[0].imageUrl = '/local-replacement.png';
  first.pages.pop();
  assert.deepEqual(second, before);
  assert.deepEqual(plain(book.book_data), before);
});

test('copying takes only book_data, resets the step and never inherits activity identity or ownership', () => {
  const original = { ...pictureBookCases[0], id: 'another-users-book', owner: 'another-user', user_id: 'another-user',
    created_at: '2026-11-18T00:00:00Z', updated_at: '2026-11-19T00:00:00Z', status: 'published',
    book_data: { ...plain(pictureBookCases[0].book_data), step: 3,
      backgroundMusic: { id: 'music', url: '/local.mp3', metadata: { name: 'My music' } } } };
  const draft = createPictureBookCaseDraft(original);
  assert.deepEqual(Object.keys(draft).sort(), Object.keys(original.book_data).sort());
  for (const field of ['id', 'owner', 'user_id', 'created_at', 'updated_at', 'status', 'cover_url']) {
    assert.equal(Object.hasOwn(draft, field), false, `Must not inherit ${field}`);
  }
  assert.equal(draft.step, 0);
  assert.equal(original.book_data.step, 3);
  assertIndependentTree(draft, original.book_data);
  draft.backgroundMusic.metadata.name = 'Changed copy';
  assert.equal(original.book_data.backgroundMusic.metadata.name, 'My music');
});

test('all four case pages contain readable content and resolve to the existing local PNG resource', () => {
  const book = pictureBookCases[0];
  assert.equal(book.book_data.pages.length, 4);
  assert.equal(book.book_data.activityPlan.recommendedPageCount, 4);
  assert.equal(new Set(book.book_data.pages.map(page => page.id)).size, 4);
  const assets = new Set([book.cover_url]);
  book.book_data.pages.forEach((page, index) => {
    assert.equal(page.page, index + 1);
    assert.equal(page.pageNumber, index + 1);
    assert.ok(page.text.trim(), `Page ${index + 1} needs text`);
    assert.equal(page.englishText, page.text);
    assert.ok(page.imageDescription.trim());
    assets.add(page.imageUrl);
  });
  for (const path of assets) {
    assert.match(path, /^\/ppt\/backgrounds\/[\w-]+\.png$/);
    const bytes = fs.readFileSync(new URL(`../public${path}`, import.meta.url));
    assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    assert.ok(bytes.readUInt32BE(16) > 0, 'PNG width must be nonzero');
    assert.ok(bytes.readUInt32BE(20) > 0, 'PNG height must be nonzero');
    assert.equal(bytes.subarray(-8, -4).toString('ascii'), 'IEND', 'PNG must contain its final chunk');
  }
});

function caseFixture() {
  const state = { editingBookId: 'previous-book', basicInfo: { age: 'previous-age' }, activityPlan: { storyTitleEn: 'Previous' },
    pages: [{ id: 'previous-page' }], backgroundMusic: { id: 'previous-music' }, step: 3,
    libraryTab: 'cases', listNotice: 'previous preview failure', searchTerm: 'previous search', message: 'previous error', saveState: 'previous saved', view: 'list' };
  const editingBookIdRef = { current: 'previous-book' };
  const requests = [];
  const initialBasicInfo = actual('initialBasicInfo');
  const initialActivityPlan = actual('initialActivityPlan');
  const setters = {};
  for (const key of [...Object.keys(state), 'saving']) {
    setters[`set${key[0].toUpperCase()}${key.slice(1)}`] = value => { state[key] = value; };
  }
  const apiService = { async request(path, options) {
    requests.push({ path, method: options.method, body: JSON.parse(options.body) });
    return { data: { id: 'new-case-copy' } };
  } };
  const useCase = actual('useBookCase', { createPictureBookCaseDraft, initialBasicInfo, initialActivityPlan,
    editingBookIdRef, apiService, ...setters });
  return { state, editingBookIdRef, requests, useCase,
    save() {
      // Build the closure after the setters, as React does on the next render.
      return actual('saveBook', { ...state, ...setters, editingBookIdRef, apiService,
        user: { id: 'current-teacher' }, t: key => key, console: { error() {} } })();
    } };
}

test('useBookCase clears both previous IDs, enters the first step and opens an independent draft without an API call', () => {
  const h = caseFixture();
  const book = pictureBookCases[0];
  const before = plain(book);
  h.useCase(book);
  assert.equal(h.editingBookIdRef.current, null);
  assert.equal(h.state.editingBookId, null);
  assert.equal(h.state.step, 0);
  assert.equal(h.state.libraryTab, 'mine');
  assert.equal(h.state.searchTerm, '');
  assert.equal(h.state.listNotice, '');
  assert.equal(h.state.message, '');
  assert.equal(h.state.saveState, '');
  assert.equal(h.state.view, 'studio');
  assert.equal(h.state.backgroundMusic, null);
  assert.deepEqual(h.requests, [], 'Choosing a case must not create or update a user book');
  assert.deepEqual(plain(h.state.basicInfo), plain({ ...actual('initialBasicInfo'), ...book.book_data.basicInfo }));
  assert.deepEqual(plain(h.state.activityPlan), plain({ ...actual('initialActivityPlan'), ...book.book_data.activityPlan }));
  assert.deepEqual(plain(h.state.pages), plain(book.book_data.pages));
  h.state.basicInfo.themes.push('Changed in editor');
  h.state.activityPlan.storyTitleEn = 'Changed in editor';
  h.state.pages[0].text = 'Changed in editor';
  assert.deepEqual(plain(book), before);
  const other = caseFixture();
  other.useCase(book);
  assert.deepEqual(plain(other.state.pages), before.book_data.pages);
  assert.notStrictEqual(other.state.pages, h.state.pages);
});

test('the first explicit save after choosing a case creates a new book for the current user', async () => {
  const h = caseFixture();
  const original = plain(pictureBookCases[0]);
  h.useCase(pictureBookCases[0]);
  assert.deepEqual(h.requests, []);
  h.state.activityPlan.storyTitleEn = 'My edited case';
  assert.equal(await h.save(), true);
  assert.equal(h.requests.length, 1);
  const request = h.requests[0];
  assert.equal(request.path, '/api/picture-books');
  assert.equal(request.method, 'POST');
  assert.equal(request.body.userId, 'current-teacher');
  assert.equal(request.body.title, 'My edited case');
  assert.equal(request.body.status, 'draft');
  assert.equal(request.body.bookData.step, 0);
  assert.equal(request.body.bookData.pages.length, 4);
  assert.equal(request.body.coverUrl, original.cover_url);
  assert.equal(Object.hasOwn(request.body, 'id'), false);
  assert.equal(h.editingBookIdRef.current, 'new-case-copy');
  assert.equal(h.state.editingBookId, 'new-case-copy');
  assert.deepEqual(plain(pictureBookCases[0]), original);
});
