import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';

const sourceRoot = new URL('../workbench-ui/yoga/', import.meta.url);
const publicSource = new URL('../public/workbench-v6/yoga.html', import.meta.url);
const publicDocument = fs.existsSync(publicSource) ? publicSource : new URL('../dist/workbench-v6/yoga.html', import.meta.url);
const cdnAssets = JSON.parse(fs.readFileSync(new URL('./workbench-cdn-assets.json', import.meta.url), 'utf8')).files;
const stamp = '2026-11-19T08:00:00.000Z';
const plain = value => JSON.parse(JSON.stringify(value));
const sha256 = value => createHash('sha256').update(value).digest('hex');
// Recorded from the frozen V6 model/library before replacement. These full-state
// checks keep the regression self-contained; tests never load a mutable prototype.
const legacyHashes = {
  forest: 'd541dd15a9b47837b28f2d92e8e844ba250acd6cdef15361906763f395ca0fba',
  ocean: 'cd75961dcf980c7040a03dff7149d776fcc77cc6400ae28aad49bee70c852744',
};

class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : [stamp])); }
  static now() { return Date.parse(stamp); }
}

function embeddedScripts(html) {
  const scripts = new Map();
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const name = match[1].match(/\bdata-build-source=["']([^"']+)["']/i)?.[1];
    if (!name) continue;
    assert.equal(scripts.has(name), false, `Duplicate embedded script: ${name}`);
    scripts.set(name, match[2]);
  }
  return scripts;
}

function loadModules(target) {
  const scripts = embeddedScripts(fs.readFileSync(publicDocument, 'utf8'));
  if (target === 'packaged') {
    const order = [...scripts.keys()];
    assert.ok(order.indexOf('yoga/wonder-case.js') >= 0, 'The packaged document must include the case fixture');
    assert.ok(order.indexOf('yoga/wonder-case.js') < order.indexOf('yoga/model.js'), 'Load the case before the model');
    assert.ok(order.indexOf('yoga/model.js') < order.indexOf('yoga/library.js'), 'Load the model before the library');
  }
  const context = vm.createContext({ Date: FixedDate, WB_WEB_SCOPE: 'wonder-case-teacher' });
  context.window = context;
  function execute(name, code) {
    assert.equal(typeof code, 'string', `Missing actual UMD script: ${name}`);
    vm.runInContext(code, context, { filename: `${target}/${name}` });
  }
  execute('language-goals.js', scripts.get('yoga/../language-goals.js'));
  for (const name of ['wonder-case.js', 'model.js', 'library.js']) {
    execute(name, target === 'source' ? fs.readFileSync(new URL(name, sourceRoot), 'utf8') : scripts.get(`yoga/${name}`));
  }
  const sceneSource = target === 'source' ? fs.readFileSync(new URL('wonder-scene.js', sourceRoot), 'utf8') : scripts.get('yoga/wonder-scene.js');
  assert.equal(typeof sceneSource, 'string', 'Missing actual scene adapter');
  const sceneModule = { exports: {} };
  vm.runInNewContext(sceneSource, { module: sceneModule }, { filename: `${target}/wonder-scene.js` });
  assert.ok(context.YogaWonderCase, 'The wonder fixture must load before the model');
  return { M: context.YogaModel, L: context.YogaLibrary, W: context.YogaWonderCase, sceneFactory: sceneModule.exports };
}

function storage(seed = {}) {
  const data = new Map(Object.entries(seed));
  return { data, writes: 0, getItem: key => data.get(key) ?? null,
    setItem(key, value) { this.writes++; data.set(key, String(value)); } };
}

function frozenTree(value) {
  if (!value || typeof value !== 'object') return;
  assert.equal(Object.isFrozen(value), true, 'Source fixture objects must remain read-only');
  Object.values(value).forEach(frozenTree);
}

function ready(M, state) {
  let result = M.confirmContent(state);
  if (M.readiness(result).missing.length || M.readiness(result).stale.length) {
    result = M.startAssets(result);
    result = M.finishAssets(result, result.job.id);
  }
  assert.equal(M.readiness(result).canPublish, true);
  return result;
}

function assertUndo(M, changed, before) {
  const restored = M.undoLastChange(M.validateState(JSON.stringify(changed)));
  assert.deepEqual(plain(restored.draft.pages), plain(before.draft.pages));
  assert.deepEqual(plain(restored.settings), plain(before.settings));
  assert.equal(restored.draft.templateId, before.draft.templateId);
  assert.deepEqual(plain(restored.published), plain(before.published));
  assert.deepEqual(plain(restored.versions), plain(before.versions));
  assert.equal(M.canUndo(restored), false);
  assert.ok(restored.draft.revision > changed.draft.revision);
}

const requested = process.env.YOGA_CASE_TEST_TARGET;
assert.ok(!requested || ['source', 'packaged'].includes(requested), 'YOGA_CASE_TEST_TARGET must be source or packaged');
for (const target of requested ? [requested] : ['source', 'packaged']) {
  const { M, L, W, sceneFactory } = loadModules(target);
  const named = title => `${target}: ${title}`;
  function sceneFixture() {
    const calls = [];
    const original = Object.fromEntries(['render', 'renderBackground', 'renderReference'].map(method => [method, (...args) => {
      calls.push({ method, args });
      return `<div data-original="${method}"></div>`;
    }]));
    original.setProgress = () => {};
    return { scene: sceneFactory(original, W), original, calls };
  }

  test(named('the new preview uses all 11 source pages and keeps the built-in fixture immutable'), () => {
    frozenTree(W);
    assert.deepEqual(plain(L.CASES.map(item => item.id)), ['wonder', 'ocean']);
    assert.equal(L.CASES.find(item => item.id === 'wonder').pages, 11);
    const state = L.getCase('wonder');
    const before = plain(W);
    assert.equal(state.draft.templateId, 'wonder-v2-2');
    assert.equal(state.settings.templateId, 'wonder-v2-2');
    assert.equal(state.settings.characterId, W.character.id);
    assert.equal(state.draft.pages.length, 11);
    assert.equal(state.published.course.pages.length, 11);
    assert.equal(state.draft.locked, true);
    assert.equal(M.readiness(state).readyPages, 11);
    assert.deepEqual(plain(state.draft.pages.map(page => page.kind)), ['cover', 'intro', ...Array(8).fill('action'), 'ending']);
    state.draft.pages.forEach((page, index) => {
      assert.deepEqual(plain(page.wonder), { templateId: W.templateId, source: index });
      assert.equal(page.english, W.pages[index].sourceText, `Page ${index + 1} must use its source caption`);
      assert.equal(page.actionId, W.pages[index].actionId);
      assert.equal(page.assets.motion, page.kind === 'action' ? 'ready' : 'na');
    });
    state.draft.pages[0].english = 'Preview mutation';
    state.published.course.pages[10].wonder.source = 0;
    assert.notEqual(L.getCase('wonder').draft.pages[0].english, 'Preview mutation');
    assert.equal(L.getCase('wonder').published.course.pages[10].wonder.source, 10);
    assert.deepEqual(plain(W), before);
  });

  test(named('making the same case creates independent editable 11-page copies without publication history'), () => {
    const first = L.cloneCase('wonder');
    const second = L.cloneCase('wonder');
    const original = plain(L.getCase('wonder'));
    assert.equal(first.published, null);
    assert.deepEqual(plain(first.versions), []);
    assert.equal(first.candidate, null);
    assert.equal(first.job, null);
    assert.equal(first.lastJob, null);
    assert.equal(first.draft.locked, false);
    assert.equal(first.draft.revision, 1);
    assert.equal(first.draft.pages.length, 11);
    assert.deepEqual(plain(first.draft.pages), original.draft.pages);
    assert.deepEqual(plain(M.validateState(JSON.stringify(first))), plain(first));
    first.draft.pages[2].english = 'First copy only';
    first.draft.pages[2].wonder.source = 10;
    first.settings.words.push('copy-only');
    assert.notEqual(second.draft.pages[2].english, first.draft.pages[2].english);
    assert.equal(second.draft.pages[2].wonder.source, 2);
    assert.equal(second.settings.words.includes('copy-only'), false);
    assert.deepEqual(plain(L.getCase('wonder')), original);
  });

  test(named('saving and reloading retains the eleventh page, workspace, pending candidate and its original data'), () => {
    const state = M.proposeChange(L.cloneCase('wonder'), {
      pageId: L.cloneCase('wonder').draft.pages[10].id, scope: 'page', channel: 'background', prompt: '背景更明亮',
    });
    const record = L.createRecord(state, { id: 'wonder-draft', now: stamp, sourceCaseId: 'wonder',
      workspace: { step: 3, pageId: state.draft.pages[10].id, backgroundPrompt: '未提交的背景要求', scope: 'page' } });
    const store = storage();
    const saved = L.persist(store, L.createLibrary(), record);
    const bytes = store.getItem(L.KEY);
    const loaded = L.load(store);
    assert.deepEqual(plain(loaded), plain(saved));
    assert.equal(store.getItem(L.KEY), bytes);
    assert.equal(store.writes, 1, 'Reload must not rewrite saved records');
    const restored = L.get(loaded, record.id);
    assert.equal(restored.sourceCaseId, 'wonder');
    assert.deepEqual(plain(restored.workspace), plain(record.workspace));
    assert.deepEqual(plain(restored.state), plain(state));
    assert.equal(restored.state.candidate.pageId, state.draft.pages[10].id);
    restored.state.draft.pages[10].english = 'Restored copy only';
    assert.notEqual(L.get(L.load(store), record.id).state.draft.pages[10].english, 'Restored copy only');
  });

  test(named('confirmation, publication, fork and history preserve the complete case and prior teaching version'), () => {
    const first = M.publish(ready(M, L.cloneCase('wonder')), { createdAt: stamp });
    const oldPublication = plain(first.published);
    let revised = M.editContent(M.forkDraft(first), { target: 'page', pageId: first.draft.pages[9].id,
      values: { english: 'Rest quietly and feel the ground.' } });
    assert.equal(revised.draft.confirmed, false);
    assert.equal(M.readiness(revised).canPublish, false);
    assert.throws(() => M.publish(revised));
    revised = M.publish(ready(M, revised), { createdAt: stamp });
    assert.equal(revised.published.version, 2);
    assert.equal(revised.published.course.pages.length, 11);
    assert.deepEqual(plain(revised.versions[0]), oldPublication);
    assert.deepEqual(plain(first.published), oldPublication);
    const history = M.restoreVersion(revised, 1);
    assert.equal(history.draft.locked, false);
    assert.equal(history.draft.confirmed, false);
    assert.equal(history.draft.templateId, 'wonder-v2-2');
    assert.deepEqual(plain(history.draft.pages), oldPublication.course.pages);
    assert.deepEqual(plain(history.published), plain(revised.published));
    assert.deepEqual(plain(history.versions), plain(revised.versions));
    assert.deepEqual(plain(M.validateState(JSON.stringify(history))), plain(history));
    assert.equal(M.publish(ready(M, history)).published.version, 3);
  });

  test(named('manual title, subtitle and scene edits respect asset invalidation and undo all source metadata'), () => {
    const base = M.forkDraft(L.getCase('wonder'));
    const snapshot = plain(base);
    const title = M.editContent(base, { target: 'settings', values: { title: 'Our Wonder Walk' } });
    assert.equal(title.draft.title, 'Our Wonder Walk');
    assert.equal(title.draft.confirmed, base.draft.confirmed);
    assert.deepEqual(plain(title.draft.pages), plain(base.draft.pages));
    assertUndo(M, title, base);
    const intro = base.draft.pages[1];
    const subtitle = M.editContent(base, { target: 'page', pageId: intro.id,
      values: { title: 'A new welcome', english: 'Welcome. Let us begin our walk.' }, baseRevision: base.draft.revision });
    assert.equal(subtitle.draft.pages[1].title, 'A new welcome');
    assert.equal(subtitle.draft.pages[1].assets.voice, 'stale');
    assert.equal(subtitle.draft.pages[1].assets.motion, 'na');
    assert.equal(subtitle.draft.pages[1].assets.background, 'ready');
    assert.equal(subtitle.draft.confirmed, false);
    assertUndo(M, subtitle, base);
    const scene = M.editContent(base, { target: 'page', pageId: base.draft.pages[10].id,
      values: { scene: 'A calm garden at the end of our walk.' } });
    assert.equal(scene.draft.pages[10].assets.background, 'stale');
    assert.equal(scene.draft.pages[10].assets.voice, 'ready');
    assertUndo(M, scene, base);
    assert.deepEqual(plain(base), snapshot);
  });

  test(named('background candidates remain isolated until adoption and can restore the original look'), () => {
    const base = M.forkDraft(L.getCase('wonder'));
    const proposed = M.proposeChange(base, { scope: 'page', pageId: base.draft.pages[2].id, channel: 'background', prompt: '背景更明亮' });
    assert.deepEqual(plain(proposed.draft), plain(base.draft));
    const adopted = M.applyBackgroundCandidate(M.validateState(JSON.stringify(proposed)));
    assert.equal(adopted.draft.pages[2].look, 'bright');
    assert.equal(adopted.draft.pages[2].assets.background, 'ready');
    assert.equal(adopted.draft.confirmed, true);
    assert.deepEqual(plain(adopted.draft.pages[2].wonder), plain(base.draft.pages[2].wonder));
    assert.deepEqual(plain(adopted.published), plain(base.published));
    assertUndo(M, adopted, base);
  });

  test(named('action candidates stay in the eight-pose source set and undo restores the prior pose and subtitle'), () => {
    const base = M.forkDraft(L.getCase('wonder'));
    const page = base.draft.pages[2];
    const actions = M.getAvailableActions(base);
    assert.equal(actions.length, 8);
    assert.ok(actions.every(action => action.id.startsWith('wonder-')));
    const alternate = actions.find(action => action.id !== page.actionId);
    const proposed = M.proposeChange(base, { target: 'action', scope: 'page', pageId: page.id, channel: 'content', prompt: `动作换成${alternate.name}` });
    assert.equal(proposed.candidate.kind, 'action');
    assert.deepEqual(plain(proposed.draft), plain(base.draft));
    const changed = M.applyCandidate(M.validateState(JSON.stringify(proposed)));
    assert.equal(changed.draft.pages[2].actionId, alternate.id);
    assert.equal(changed.draft.pages[2].assets.motion, 'stale');
    assert.equal(changed.draft.pages[2].assets.background, 'ready');
    assert.equal(changed.draft.pages.length, 11);
    assert.deepEqual(plain(changed.draft.pages[3]), plain(base.draft.pages[3]));
    assertUndo(M, changed, base);
    assert.throws(() => M.proposeChange(base, { target: 'action', scope: 'page', pageId: base.draft.pages[1].id, prompt: `动作换成${alternate.name}` }));
  });

  test(named('unsupported character/theme changes and malformed 11-page sources cannot alter the case'), () => {
    const base = L.cloneCase('wonder');
    const before = plain(base);
    assert.deepEqual(plain(M.getAvailableCharacters(base).map(character => character.id)), [W.character.id]);
    assert.throws(() => M.proposeChange(base, { scope: 'course', target: 'course', prompt: '角色换成 Edi' }));
    assert.throws(() => M.proposeChange(base, { scope: 'course', target: 'course', prompt: '森林改海底' }));
    assert.throws(() => M.editContent(base, { target: 'settings', values: { characterId: 'poppy' } }));
    assert.deepEqual(plain(base), before);
    const missing = plain(base);
    missing.draft.pages.pop();
    assert.throws(() => M.validateState(missing));
    const badSource = plain(base);
    badSource.draft.pages[2].wonder.source = 11;
    assert.throws(() => M.validateState(badSource));
  });

  test(named('legacy forest and ocean snapshots stay byte-equivalent, including hidden forest source records'), () => {
    let collection = L.createLibrary();
    for (const caseId of ['forest', 'ocean']) {
      const state = L.getCase(caseId);
      assert.equal(state.draft.pages.length, 6);
      assert.equal(sha256(JSON.stringify(state)), legacyHashes[caseId], `${caseId} must retain its complete frozen V6 state`);
      const record = L.createRecord(state, { id: `old-${caseId}`, now: stamp, sourceCaseId: caseId,
        workspace: { step: 4, pageId: state.draft.pages[5].id } });
      collection = L.upsert(collection, record);
    }
    const original = JSON.stringify(collection, null, 2);
    const store = storage({ [L.KEY]: original });
    const loaded = L.load(store);
    assert.equal(store.writes, 0);
    assert.equal(store.getItem(L.KEY), original);
    assert.deepEqual(plain(loaded), plain(collection));
    const added = L.createRecord(L.cloneCase('wonder'), { id: 'new-wonder', now: stamp, sourceCaseId: 'wonder' });
    const saved = L.persist(store, loaded, added);
    for (const caseId of ['forest', 'ocean']) {
      assert.deepEqual(plain(L.get(saved, `old-${caseId}`)), plain(L.get(collection, `old-${caseId}`)));
      assert.equal(L.get(saved, `old-${caseId}`).sourceCaseId, caseId);
    }
    if (target === 'packaged') assert.equal(L.KEY, 'wellbeing-web-three-v1-wonder-case-teacher-unified-yoga-v1');
  });

  test(named('the illustration adapter delegates every legacy page operation to the existing renderer'), () => {
    const { scene, original, calls } = sceneFixture();
    for (const caseId of ['forest', 'ocean']) {
      const state = L.getCase(caseId);
      const page = state.draft.pages[2], options = { compact: true };
      for (const method of ['render', 'renderBackground', 'renderReference']) {
        assert.equal(scene[method](page, state.settings, options), `<div data-original="${method}"></div>`);
        assert.equal(calls.at(-1).method, method);
        assert.strictEqual(calls.at(-1).args[0], page);
        assert.strictEqual(calls.at(-1).args[1], state.settings);
      }
    }
    assert.strictEqual(scene.setProgress, original.setProgress);
  });

  test(named('all 11 scenes retain story text and images while action titles stay in teacher references'), () => {
    const { scene, calls } = sceneFixture();
    const state = L.getCase('wonder');
    state.draft.pages.forEach((page, index) => {
      const spec = W.pages[index];
      const html = scene.render(page, state.settings);
      assert.ok(html.includes(`data-wonder-source="${spec.source}"`));
      assert.ok(html.includes(`src="${spec.background}"`));
      assert.ok(html.includes(`src="${spec.character.path}"`));
      if (page.kind === 'action') {
        assert.doesNotMatch(html, /<h2\b[^>]*class=["'][^"']*\byw-headline\b/, `Page ${index + 1} must omit the action headline`);
        const visibleText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
        assert.equal(visibleText.includes(spec.pose), false, `Page ${index + 1} must not display its action name elsewhere`);
        const reference = scene.renderReference(page, state.settings);
        const label = reference.match(/<span class="yw-reference-caption">([\s\S]*?)<\/span>/)?.[1];
        assert.ok(label?.includes(spec.pose), `Teacher reference must retain ${spec.pose}`);
      } else {
        assert.match(html, /<h2\b[^>]*class=["'][^"']*\byw-headline\b/, `Page ${index + 1} must retain its story headline`);
        assert.ok(html.includes(spec.heading), `Page ${index + 1} heading`);
      }
      if (spec.caption) assert.ok(html.includes(spec.caption), `Page ${index + 1} caption`);
      assert.doesNotMatch(html, /undefined|NaN/);
      if (target === 'packaged') {
        for (const path of [spec.background, spec.character.path]) {
          assert.match(path, /^yoga-wonder-case\//);
          const localAsset = new URL(path, publicDocument);
          const available = fs.existsSync(localAsset)
            ? fs.statSync(localAsset).isFile()
            : publicDocument === publicSource && Object.hasOwn(cdnAssets, `workbench-v6/${path}`);
          assert.ok(available, `Missing scene resource: ${path}`);
        }
      }
    });
    const finalAction = scene.render(state.draft.pages[9], state.settings);
    assert.ok(finalAction.includes('width:285.988%'));
    assert.ok(finalAction.includes('left:-185.988%'));
    assert.deepEqual(calls, [], 'Unedited wonder pages must use original case images');
  });

  test(named('edited captions escape HTML, action swaps use the corresponding sprite and scene undo restores the image'), () => {
    const { scene, calls } = sceneFixture();
    const base = M.forkDraft(L.getCase('wonder'));
    const page = base.draft.pages[2];
    const caption = '<img src=x onerror="alert(1)"> & new words';
    const edited = M.editContent(base, { target: 'page', pageId: page.id, values: { english: caption } });
    const html = scene.render(edited.draft.pages[2], edited.settings);
    assert.doesNotMatch(html, /<h2\b[^>]*class=["'][^"']*\byw-headline\b/);
    assert.ok(html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt; &amp; new words'));
    assert.equal(html.includes(caption), false);
    const alternate = M.getAvailableActions(base).find(action => action.id !== page.actionId);
    const changed = M.applyCandidate(M.proposeChange(base, { target: 'action', scope: 'page', pageId: page.id,
      channel: 'content', prompt: `动作换成${alternate.name}` }));
    const alternateSpec = W.pages.find(spec => spec.actionId === alternate.id);
    const originalSpec = W.pages[page.wonder.source];
    const actionHtml = scene.render(changed.draft.pages[2], changed.settings);
    assert.doesNotMatch(actionHtml, /<h2\b[^>]*class=["'][^"']*\byw-headline\b/, 'Changing pose must not restore the classroom action title');
    assert.ok(actionHtml.includes(`src="${alternateSpec.character.path}"`));
    assert.ok(actionHtml.includes(`src="${originalSpec.background}"`), 'Changing pose must keep the page background');
    const actionReference = scene.renderReference(changed.draft.pages[2], changed.settings);
    const actionLabel = actionReference.match(/<span class="yw-reference-caption">([\s\S]*?)<\/span>/)?.[1];
    assert.ok(actionLabel?.includes(alternateSpec.pose), 'Teacher reference must show the newly selected action name');
    const newScene = M.editContent(base, { target: 'page', pageId: page.id, values: { scene: 'A different classroom garden.' } });
    assert.ok(scene.render(newScene.draft.pages[2], newScene.settings).includes('data-original="renderBackground"'));
    assert.equal(calls.at(-1).method, 'renderBackground');
    const undone = M.undoLastChange(newScene);
    const restored = scene.render(undone.draft.pages[2], undone.settings);
    assert.ok(restored.includes(`src="${originalSpec.background}"`));
    assert.equal(restored.includes('data-original="renderBackground"'), false);
  });
}
