import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const adapter = readFileSync(new URL('../public/workbench-v6/embed-adapter.js', import.meta.url), 'utf8');

// These doubles exercise the host contract, not browser rendering or playback.
function eventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, callback, options = {}) {
      const capture = typeof options === 'boolean' ? options : !!options.capture;
      const entries = listeners.get(type) || [];
      entries.push({ callback, capture, once: !!options.once });
      listeners.set(type, entries);
    },
    removeEventListener(type, callback, options = {}) {
      const capture = typeof options === 'boolean' ? options : !!options.capture;
      listeners.set(type, (listeners.get(type) || []).filter(entry => entry.callback !== callback || entry.capture !== capture));
    },
    emit(type, event = {}) {
      let stopped = false;
      const previousStop = event.stopImmediatePropagation;
      event.stopImmediatePropagation = function () { stopped = true; previousStop?.call(this); };
      for (const entry of [...(listeners.get(type) || [])]) {
        entry.callback.call(this, event);
        if (entry.once) this.removeEventListener(type, entry.callback, entry.capture);
        if (stopped) break;
      }
    },
    listenerCount(type) { return (listeners.get(type) || []).length; },
  };
}

function element() {
  const attributes = new Map();
  return {
    ...eventTarget(), children: [], parentNode: null,
    setAttribute(key, value) { attributes.set(key, value); },
    getAttribute(key) { return attributes.get(key) ?? null; },
    appendChild(child) { child.remove?.(); this.children.push(child); child.parentNode = this; },
    append(...children) { for (const child of children) this.appendChild(child); },
    remove() {
      if (this.parentNode) this.parentNode.children = this.parentNode.children.filter(child => child !== this);
      this.parentNode = null;
    },
  };
}

function fixture({ moduleId = 'music', scope = 'teacher_42-abc', loading = false, origin = 'http://localhost:5198' } = {}) {
  const calls = { guards: 0, persists: 0, musicPauses: 0, mediaPauses: 0, mediaPlays: 0, speechCancels: 0, tracksStopped: 0, previewDisposals: 0, musicReleases: 0 };
  const messages = [];
  const warnings = [];
  const media = {
    paused: false,
    pause() { this.paused = true; calls.mediaPauses++; },
    play() { this.paused = false; calls.mediaPlays++; },
    srcObject: { getTracks: () => [{ stop() { calls.tracksStopped++; } }] },
  };
  const frames = [];
  const app = { childElementCount: loading ? 0 : 1, querySelector: () => ({}) };
  const elements = new Map([['app', app]]);
  const observers = [];
  const doc = {
    ...eventTarget(),
    documentElement: { dataset: { hostModule: moduleId } },
    readyState: loading ? 'loading' : 'complete',
    hidden: false,
    body: element(),
    createElement: element,
    getElementById: id => elements.get(id) || null,
    querySelectorAll: selector => selector === 'audio, video' ? [media] : selector === 'iframe' ? frames : [],
  };
  const root = {
    ...eventTarget(),
    document: doc,
    location: { search: scope === null ? '' : `?scope=${encodeURIComponent(scope)}`, origin },
    parent: { postMessage(data, targetOrigin) { messages.push({ data, targetOrigin }); } },
    speechSynthesis: { cancel() { calls.speechCancels++; } },
    persistClassSession() { calls.persists++; return true; },
    WBPauseForModuleSwitch() { calls.musicPauses++; },
    YogaMusicFiles: { release() { calls.musicReleases++; } },
    MutationObserver: class {
      constructor(callback) { this.callback = callback; observers.push(this); }
      observe() { this.connected = true; }
      disconnect() { this.connected = false; }
    },
  };
  const installGuard = (implementation = () => true) => {
    root.WBPrepareModuleSwitch = function () {
      assert.equal(this, root, 'guard must retain its module window as receiver');
      calls.guards++;
      return implementation();
    };
  };
  if (!loading) installGuard();
  vm.runInNewContext(adapter, { window: root, document: doc, URLSearchParams, console: { warn: (...args) => warnings.push(args) } }, { filename: 'embed-adapter.js' });
  return { root, doc, app, elements, observers, mutate: () => observers.filter(observer => observer.connected).forEach(observer => observer.callback()), api: root.WBWebModule, calls, messages, warnings, frames, media, installGuard };
}

test('head bootstrap publishes a safe scope synchronously and waits for rendered business code', async () => {
  const f = fixture({ moduleId: 'song', loading: true });
  assert.equal(f.root.WB_WEB_SCOPE, 'teacher_42-abc');
  assert.equal(f.api.module, 'song');
  assert.equal(f.api.ready(), false);
  assert.equal(await f.api.prepareLeave(), false);
  f.installGuard();
  f.app.childElementCount = 1;
  assert.equal(f.api.ready(), false, 'business render alone must not bypass DOM readiness');
  f.doc.readyState = 'interactive';
  f.doc.emit('DOMContentLoaded');
  assert.equal(f.api.ready(), true);
  assert.equal(f.doc.listenerCount('DOMContentLoaded'), 0);
  f.app.childElementCount = 0;
  assert.equal(f.api.ready(), false);
  assert.equal(fixture({ moduleId: 'unknown' }).api.ready(), false);
});

test('missing or unsafe storage scopes cannot become key prefixes', () => {
  for (const scope of [null, '', '../teacher', 'UPPERCASE', 'teacher.name', 'teacher name', 'a'.repeat(129)]) {
    assert.equal(fixture({ scope }).root.WB_WEB_SCOPE, 'local');
  }
  for (const scope of ['teacher_1-abc', '0', 'a'.repeat(128)]) {
    assert.equal(fixture({ scope }).root.WB_WEB_SCOPE, scope);
  }
});

test('a false or non-boolean original leave result preserves the module and can be retried', async () => {
  const f = fixture();
  for (const result of [false, undefined, 'true']) {
    f.installGuard(() => result);
    assert.equal(await f.api.prepareLeave(), false);
  }
  assert.equal(f.calls.persists, 0);
  assert.equal(f.calls.musicPauses, 0);
  assert.equal(f.root.WBModules.isModuleOpen(), false);
  f.installGuard(() => true);
  assert.equal(await f.api.prepareLeave(), true);
  assert.equal(f.calls.persists, 1);
});

test('synchronous throws and rejected guards do not poison the next leave attempt', async () => {
  const f = fixture();
  f.installGuard(() => { throw new Error('save failed'); });
  assert.equal(await f.api.prepareLeave(), false);
  f.installGuard(() => Promise.reject(new Error('write lock failed')));
  assert.equal(await f.api.prepareLeave(), false);
  f.installGuard(() => true);
  assert.equal(await f.api.prepareLeave(), true);
  assert.equal(f.calls.guards, 3);
  assert.equal(f.warnings.length, 2);
});

test('concurrent leave requests share one pending original guard', async () => {
  const f = fixture();
  let resolve;
  f.installGuard(() => new Promise(done => { resolve = done; }));
  const first = f.api.prepareLeave();
  const second = f.api.prepareLeave();
  assert.equal(first, second);
  await Promise.resolve();
  assert.equal(f.calls.guards, 1);
  resolve(true);
  assert.equal(await first, true);
  assert.equal(f.calls.persists, 1);
});

test('music classroom persistence failure refuses leave even after its original guard passes', async () => {
  const f = fixture();
  f.root.persistClassSession = () => false;
  assert.equal(await f.api.prepareLeave(), false);
  f.root.persistClassSession = () => { throw new Error('storage quota'); };
  assert.equal(await f.api.prepareLeave(), false);
  assert.equal(f.calls.musicPauses, 0);
  f.root.persistClassSession = () => true;
  assert.equal(await f.api.prepareLeave(), true);
});

test('non-music modules keep their own classroom persistence inside the original guard', async () => {
  for (const moduleId of ['song', 'yoga', 'speak', 'doodle', 'move-match']) {
    const f = fixture({ moduleId });
    f.root.persistClassSession = () => { throw new Error('music-only function must not run'); };
    assert.equal(await f.api.prepareLeave(), true);
    assert.equal(f.calls.guards, 1);
  }
});

test('host hiding gates the music recorder timer and showing never restarts media', () => {
  const f = fixture();
  let recordingSeconds = 0;
  const tick = () => { if (!f.root.WBModules.isModuleOpen()) recordingSeconds++; };
  tick();
  f.api.setVisible(false);
  tick();
  assert.equal(recordingSeconds, 1);
  assert.equal(f.calls.musicPauses, 1);
  assert.equal(f.media.paused, true);
  assert.equal(f.calls.speechCancels, 1);
  f.api.setVisible(true);
  assert.equal(f.root.WBModules.isModuleOpen(), false);
  assert.equal(f.media.paused, true);
  assert.equal(f.calls.mediaPlays, 0);
  assert.equal(f.calls.musicPauses, 1);
});

test('document visibility also gates the timer without resuming audio on return', () => {
  const f = fixture();
  f.doc.hidden = true;
  f.doc.emit('visibilitychange');
  assert.equal(f.root.WBModules.isModuleOpen(), true);
  assert.equal(f.media.paused, true);
  f.doc.hidden = false;
  f.doc.emit('visibilitychange');
  assert.equal(f.root.WBModules.isModuleOpen(), false);
  assert.equal(f.calls.mediaPlays, 0);
});

test('module requests allow the six modules and use an explicit parent origin', async () => {
  const f = fixture();
  for (const id of ['unknown', '../other', '__proto__', null]) {
    assert.equal(await f.root.WBModules.requestModule(id), false);
  }
  assert.equal(f.messages.length, 0);
  assert.equal(await f.root.WBModules.requestModule('music'), true);
  assert.equal(f.messages.length, 0, 'current module needs no host navigation');
  for (const id of ['song', 'yoga', 'speak', 'doodle', 'move-match']) {
    assert.equal(await f.root.WBModules.requestModule(id), true);
    assert.equal(f.messages.at(-1).data.type, 'wellbeing:module');
    assert.equal(f.messages.at(-1).data.module, id);
    assert.equal(f.messages.at(-1).targetOrigin, f.root.location.origin);
  }
  assert.equal(await f.root.WBModules.requestModule('classification'), true);
  assert.equal(f.messages.at(-1).data.module, 'move-match');
  f.root.parent = f.root;
  assert.equal(await f.root.WBModules.openSong(), false);
  assert.equal(await fixture({ origin: 'null' }).root.WBModules.openSong(), false);
});

test('cross-module clicks are captured once while task controls remain untouched', () => {
  const f = fixture();
  const click = (action, moduleId, disabled = false) => {
    const event = {
      prevented: false, stopped: false,
      target: { closest: () => ({ dataset: { action, module: moduleId }, disabled, getAttribute: () => null }) },
      preventDefault() { this.prevented = true; },
      stopImmediatePropagation() { this.stopped = true; },
    };
    f.doc.emit('click', event);
    return event;
  };
  assert.equal(click('open-song').stopped, true);
  assert.equal(f.messages.at(-1).data.module, 'song');
  assert.equal(click('module', 'yoga').prevented, true);
  assert.equal(f.messages.at(-1).data.module, 'yoga');
  assert.equal(click('open-doodle').stopped, true);
  assert.equal(f.messages.at(-1).data.module, 'doodle');
  const count = f.messages.length;
  assert.equal(click('module', 'unknown').stopped, true);
  assert.equal(click('switch-yoga', undefined, true).stopped, true);
  assert.equal(f.messages.length, count);
  assert.equal(click('home').prevented, false);
  assert.equal(click('save').stopped, false);
  assert.equal(click('platform-return').stopped, false, 'the original return protocol remains owned by the module');
});

test('visibility messages require the real parent, same origin, and a boolean value', () => {
  const f = fixture();
  const valid = { source: f.root.parent, origin: f.root.location.origin, data: { type: 'wellbeing:visibility', visible: false } };
  for (const event of [
    { ...valid, source: {} },
    { ...valid, origin: 'https://example.invalid' },
    { ...valid, data: { type: 'wellbeing:visibility', visible: 'false' } },
    { ...valid, data: { type: 'another-event', visible: false } },
    { ...valid, data: [] },
  ]) {
    f.root.emit('message', event);
    assert.equal(f.root.WBModules.isModuleOpen(), false);
  }
  f.root.emit('message', valid);
  assert.equal(f.root.WBModules.isModuleOpen(), true);
  f.root.emit('message', { ...valid, data: { type: 'wellbeing:visibility', visible: true } });
  assert.equal(f.root.WBModules.isModuleOpen(), false);
  assert.equal(f.calls.mediaPlays, 0);
});

test('pagehide persists music classroom state and stops playback', () => {
  const f = fixture();
  f.root.emit('pagehide');
  assert.equal(f.calls.persists, 1);
  assert.equal(f.calls.musicPauses, 1);
  assert.equal(f.media.paused, true);
});

test('dispose releases media and previews, removes host listeners, and is idempotent', async () => {
  const f = fixture();
  f.frames.push({ contentWindow: {
    document: { querySelectorAll: () => [] },
    StarlightPreview: { dispose() { f.calls.previewDisposals++; } },
  } });
  f.api.dispose();
  assert.equal(f.calls.persists, 1);
  assert.equal(f.calls.previewDisposals, 1);
  assert.equal(f.calls.tracksStopped, 1);
  assert.equal(f.calls.musicReleases, 1);
  assert.equal(f.api.ready(), false);
  assert.equal(f.root.WBModules.isModuleOpen(), true);
  assert.equal(await f.api.prepareLeave(), false);
  assert.equal(await f.root.WBModules.openSong(), false);
  for (const type of ['message', 'pagehide']) assert.equal(f.root.listenerCount(type), 0);
  for (const type of ['click', 'visibilitychange']) assert.equal(f.doc.listenerCount(type), 0);
  const before = { ...f.calls };
  f.api.dispose();
  f.api.setVisible(true);
  assert.deepEqual(f.calls, before);
  assert.equal(f.root.WBModules.isModuleOpen(), true);
});

test('external modules require their actual shell and delegate hiding to the original pause hook', () => {
  for (const moduleId of ['speak', 'doodle', 'move-match']) {
    const f = fixture({ moduleId });
    assert.equal(f.api.ready(), true);
    f.app.querySelector = () => null;
    assert.equal(f.api.ready(), false, 'initial loading text alone is not a ready module');
    f.api.setVisible(false);
    assert.equal(f.calls.musicPauses, 1, 'all modules must receive their own pause hook');
    f.api.setVisible(true);
    assert.equal(f.calls.musicPauses, 1);
    assert.equal(f.calls.mediaPlays, 0);
  }
});

function speakFrame() {
  const frame = element();
  frame.setAttribute('src', 'games/tempo.html?session=example');
  return frame;
}

function parentVisibility(f, visible, overrides = {}) {
  f.root.emit('message', {
    source: f.root.parent, origin: f.root.location.origin,
    data: { type: 'wellbeing:visibility', visible }, ...overrides,
  });
}

test('speaking library and first game entry do not acquire a resume barrier', () => {
  const f = fixture({ moduleId: 'speak' });
  const originalMessages = [];
  f.root.addEventListener('message', event => originalMessages.push(event.data.visible));
  f.api.setVisible(false);
  parentVisibility(f, false);
  f.api.setVisible(true);
  parentVisibility(f, true);
  assert.deepEqual(originalMessages, [false, true]);
  assert.equal(f.doc.body.children.length, 0);
  f.elements.set('inline-game', speakFrame());
  f.mutate();
  assert.equal(f.doc.body.children.length, 0);
  assert.equal(f.messages.length, 0);
});

test('an open speaking game waits for a teacher request and a real-parent resume reply', () => {
  const f = fixture({ moduleId: 'speak' });
  f.elements.set('inline-game', speakFrame());
  const originalMessages = [];
  f.root.addEventListener('message', event => originalMessages.push(event.data.visible));
  f.api.setVisible(false);
  parentVisibility(f, false);
  f.api.setVisible(true);
  parentVisibility(f, true);
  assert.deepEqual(originalMessages, [false], 'ordinary host show must not restart the classroom timer');
  const panel = f.doc.body.children[0];
  assert.equal(panel.id, 'wb-host-resume');
  panel.children[1].emit('click');
  assert.equal(f.messages.at(-1).data.type, 'wellbeing:resume');
  assert.equal(f.messages.at(-1).data.module, 'speak');
  assert.equal(f.messages.at(-1).targetOrigin, f.root.location.origin);
  assert.deepEqual(originalMessages, [false], 'the button must not synthesize a parent message');
  parentVisibility(f, true, { source: {} });
  parentVisibility(f, true, { origin: 'https://example.invalid' });
  assert.equal(f.doc.body.children[0], panel);
  // The host calls setVisible before posting its authenticated reply.
  f.api.setVisible(true);
  const beforeReply = originalMessages.length;
  parentVisibility(f, true);
  assert.equal(originalMessages.length, beforeReply + 1);
  assert.equal(originalMessages.at(-1), true);
  assert.equal(f.doc.body.children.length, 0);
  assert.equal(f.calls.mediaPlays, 0);
});

test('speaking resume stays inside an open dialog and follows the active game surface', () => {
  const f = fixture({ moduleId: 'speak' });
  const player = element();
  player.open = true;
  f.elements.set('player', player);
  f.elements.set('player-frame', speakFrame());
  f.api.setVisible(false);
  f.api.setVisible(true);
  const panel = player.children[0];
  assert.equal(panel.id, 'wb-host-resume', 'a body overlay cannot cross a native dialog top layer');
  assert.equal(f.doc.body.children.length, 0);
  f.elements.set('inline-game', speakFrame());
  player.open = false;
  f.mutate();
  assert.equal(f.doc.body.children[0], panel);
  assert.equal(player.children.length, 0);
  f.elements.delete('inline-game');
  f.mutate();
  assert.equal(f.doc.body.children.length, 0);
  assert.equal(f.messages.at(-1).data.type, 'wellbeing:resume', 'closing the game releases only the idle module');
});

test('speaking dispose removes its resume control and observer without restarting anything', () => {
  const f = fixture({ moduleId: 'speak' });
  f.elements.set('inline-game', speakFrame());
  f.api.setVisible(false);
  f.api.setVisible(true);
  assert.equal(f.doc.body.children.length, 1);
  f.api.dispose();
  assert.equal(f.doc.body.children.length, 0);
  assert.equal(f.observers.every(observer => !observer.connected), true);
  assert.equal(f.calls.mediaPlays, 0);
  const loading = fixture({ moduleId: 'speak', loading: true });
  loading.api.dispose();
  loading.doc.emit('DOMContentLoaded');
  assert.equal(loading.observers.length, 0, 'late readiness must not create a disposed observer');
  assert.equal(loading.api.ready(), false);
});
