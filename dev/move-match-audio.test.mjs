import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../workbench-ui/move-match-v1/classroom/audio-controller.js', import.meta.url), 'utf8');
const settle = async () => { for (let i = 0; i < 16; i++) await Promise.resolve(); };
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
};
function eventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, handler) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(handler); },
    removeEventListener(type, handler) { listeners.get(type)?.delete(handler); },
    dispatch(type) { for (const handler of listeners.get(type) || []) handler(); },
    count() { return [...listeners.values()].reduce((sum, set) => sum + set.size, 0); },
  };
}
function fixture({ enabled = true, delayedDecode = false, strictGesture = false, manualPlaying = false } = {}) {
  const document = { ...eventTarget(), hidden: false, currentScript: { src: 'http://localhost/classroom/audio-controller.js?v=test' } };
  const root = eventTarget(), media = [], contexts = [], sources = [], errors = [], decodes = [], states = [], resumes = [];
  let now = 0, deferPlay = false, failure = null, resumeFailure = null, gestureDepth = 0, resumeMode = 'normal';
  class Audio {
    constructor(src) { Object.assign(this, eventTarget(), { src, currentTime: 0, paused: true, playCalls: [], waits: [], audibleUnlocked: false }); media.push(this); }
    play() {
      this.playCalls.push({ volume: this.volume, time: this.currentTime, userGesture: gestureDepth > 0 });
      if (failure) return Promise.reject(failure);
      if (strictGesture && this.volume > 0 && !gestureDepth && !this.audibleUnlocked)
        return Promise.reject(Object.assign(new Error('audible playback needs a click'), { name: 'NotAllowedError' }));
      if (gestureDepth && this.volume > 0) this.audibleUnlocked = true;
      this.paused = false;
      if (!deferPlay) {
        if (!manualPlaying) void Promise.resolve().then(() => { if (!this.paused) this.dispatch('playing'); });
        return Promise.resolve();
      }
      const wait = deferred(); this.waits.push(wait); return wait.promise;
    }
    pause() {
      const changed = !this.paused;
      this.paused = true;
      for (const wait of this.waits.splice(0)) wait.reject(Object.assign(new Error('interrupted'), { name: 'AbortError' }));
      if (changed) this.dispatch('pause');
    }
    removeAttribute(name) { if (name === 'src') this.src = ''; }
    load() { this.loaded = true; }
  }
  class AudioContext {
    constructor() { Object.assign(this, eventTarget()); this.state = 'suspended'; this.destination = {}; this.resumeCalls = 0; contexts.push(this); }
    resume() {
      this.resumeCalls++;
      if (resumeFailure) return Promise.reject(resumeFailure);
      if (resumeMode === 'hang-next') { resumeMode = 'normal'; const wait = deferred(); resumes.push(wait); return wait.promise; }
      if (resumeMode === 'stay-suspended') return Promise.resolve();
      this.state = 'running'; this.dispatch('statechange'); return Promise.resolve();
    }
    close() { this.state = 'closed'; this.dispatch('statechange'); return Promise.resolve(); }
    decodeAudioData(data) {
      if (!delayedDecode) return Promise.resolve({ data });
      const wait = deferred(); decodes.push(wait); return wait.promise;
    }
    createBufferSource() {
      const source = { started: false, stopped: false, disconnected: false, connect() {},
        start() { this.started = true; }, stop() { this.stopped = true; this.onended?.(); },
        disconnect() { this.disconnected = true; } };
      sources.push(source); return source;
    }
    createGain() { return { gain: { value: 0 }, connect() {}, disconnect() {} }; }
  }
  root.AudioContext = AudioContext;
  const context = vm.createContext({ window: root, document, location: { href: 'http://localhost/classroom/index.html' },
    URL, Audio, setTimeout, clearTimeout, performance: { now: () => now },
    fetch: async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }),
  });
  vm.runInContext(source, context);
  const audio = root.MMClassroomAudio.create({ enabled, onError: error => errors.push(error), onState: value => states.push({ status: value.status, volume: value.volume }) });
  return { audio, music: media[0], root, document, contexts, sources, errors, decodes, states, resumes,
    rate: root.MMClassroomAudio.rateForSeconds,
    time(value) { now = value; }, defer(value = true) { deferPlay = value; }, fail(value) { failure = value; },
    failResume(value) { resumeFailure = value; },
    resumeMode(value) { resumeMode = value; },
    gesture(action) { gestureDepth++; try { return action(); } finally { gestureDepth--; } },
    interrupt(state = 'interrupted') { contexts[0].state = state; contexts[0].dispatch('statechange'); },
    finishDecode() { for (const wait of decodes.splice(0)) wait.resolve({}); },
  };
}

test('music uses the question pace and changing speed preserves its position', () => {
  const f = fixture();
  assert.deepEqual([3, 6, 12].map(f.rate), [2, 1, 0.5]);
  assert.equal(f.rate(0), 1); assert.equal(f.rate(100), 0.5);
  f.music.currentTime = 17;
  f.audio.setPace(3); assert.equal(f.music.playbackRate, 2);
  f.audio.setPace(12); assert.equal(f.music.playbackRate, 0.5);
  assert.equal(f.music.currentTime, 17); assert.equal(f.music.loop, true); assert.equal(f.music.preservesPitch, true);
  f.audio.dispose();
});

test('strict browser starts audible music inside the Start gesture, without a silent prime', async () => {
  const f = fixture({ strictGesture: true });
  f.audio.setRunning(true); f.audio.play('drop'); await settle();
  assert.equal(f.music.playCalls.length, 0); assert.equal(f.sources.length, 0);
  f.audio.setRunning(false); await f.gesture(() => f.audio.unlock()); await settle();
  assert.equal(f.music.playCalls.length, 0); assert.equal(f.music.paused, true);
  const started = f.gesture(() => { f.audio.restart(); f.audio.setPace(6); f.audio.setRunning(true); return f.audio.unlock(); });
  assert.ok(f.music.playCalls.some(call => call.userGesture && call.volume === 0.5), 'audible play must happen synchronously, before awaiting unlock');
  await started; await settle();
  assert.ok(f.music.playCalls.every(call => call.volume > 0));
  assert.equal(f.music.paused, false); assert.equal(f.music.volume, 0.5);
  f.audio.play('drop'); await settle(); assert.equal(f.sources.filter(s => s.started).length, 1);
  f.audio.dispose();
});

test('pausing, speech/dialog blocking and muting preserve music position', async () => {
  const f = fixture(); await f.audio.unlock(); f.audio.setRunning(true); await settle();
  f.music.currentTime = 12.5;
  for (const reason of ['pause', 'speech', 'dialog']) {
    f.audio.setRunning(false); f.audio.play('incorrect'); await settle();
    assert.equal(f.music.paused, true, reason); assert.equal(f.sources.length, 0);
    f.audio.setRunning(true); await settle();
    assert.equal(f.music.paused, false, reason); assert.equal(f.music.currentTime, 12.5);
  }
  f.audio.setEnabled(false); await settle(); assert.equal(f.music.paused, true);
  f.audio.play('drop'); await settle(); assert.equal(f.sources.length, 0);
  f.audio.setEnabled(true); await f.audio.unlock(); await settle();
  assert.equal(f.music.paused, false); assert.equal(f.music.currentTime, 12.5);
  f.audio.restart(); assert.equal(f.music.currentTime, 0);
  f.audio.dispose();
});

test('a late decode cannot play effects after pause, mute or disposal', async () => {
  for (const action of ['pause', 'mute', 'dispose']) {
    const f = fixture({ delayedDecode: true }); await f.audio.unlock();
    f.audio.setRunning(true); f.audio.play('incorrect'); await settle();
    if (action === 'pause') f.audio.setRunning(false);
    if (action === 'mute') f.audio.setEnabled(false);
    if (action === 'dispose') f.audio.dispose();
    f.finishDecode(); await settle();
    assert.equal(f.sources.length, 0, action); f.audio.dispose();
  }
});

test('the final landing effect can finish while music stops, but explicit pause stops it', async () => {
  const f = fixture({ delayedDecode: true }); await f.audio.unlock();
  f.audio.setRunning(true); f.audio.play('drop');
  f.audio.setRunning(false, { finishEffect: true });
  await settle(); assert.equal(f.decodes.length, 2);
  f.finishDecode(); await settle();
  assert.equal(f.music.paused, true); assert.equal(f.sources.length, 1);
  assert.equal(f.sources[0].started, true); assert.equal(f.sources[0].stopped, false);
  f.audio.stop(); assert.equal(f.sources[0].stopped, true);
  f.audio.dispose();
});

test('incorrect alerts are rate limited without swallowing landing effects', async () => {
  const f = fixture(); await f.audio.unlock(); f.audio.setRunning(true); await settle();
  f.audio.play('incorrect'); f.audio.play('incorrect'); await settle();
  assert.equal(f.sources.length, 1);
  f.audio.play('drop'); await settle(); assert.equal(f.sources.length, 2);
  f.time(600); f.audio.play('incorrect'); await settle(); assert.equal(f.sources.length, 3);
  f.audio.dispose();
});

test('hidden/pagehide suspend audio and disposal releases media and listeners', async () => {
  const f = fixture(); await f.audio.unlock(); f.audio.setRunning(true); await settle();
  f.audio.play('drop'); await settle();
  f.document.hidden = true; f.document.dispatch('visibilitychange');
  assert.equal(f.music.paused, true); assert.equal(f.sources[0].stopped, true);
  f.document.hidden = false; f.document.dispatch('visibilitychange'); await settle();
  assert.equal(f.music.paused, true);
  f.audio.setRunning(true); await settle(); f.root.dispatch('pagehide'); assert.equal(f.music.paused, true);
  f.audio.dispose(); await settle();
  assert.equal(f.contexts[0].state, 'closed'); assert.equal(f.music.src, '');
  assert.equal(f.document.count(), 0); assert.equal(f.root.count(), 0); assert.equal(f.music.count(), 0);
  await f.audio.unlock(); f.audio.setRunning(true); f.audio.play('drop'); await settle();
  assert.equal(f.music.paused, true); assert.equal(f.sources.length, 1);
});

test('stop before a pending play starts cannot schedule audible music afterward', async () => {
  const f = fixture(); await f.audio.unlock();
  f.audio.setRunning(true); f.audio.stop();
  const callsAtStop = f.music.playCalls.length;
  await settle();
  assert.equal(f.music.playCalls.length, callsAtStop);
  assert.equal(f.music.paused, true); f.audio.dispose();
});

test('a rapid pause and resume recovers an interrupted play promise', async () => {
  const f = fixture(); await f.audio.unlock(); f.defer();
  f.audio.setRunning(true); await settle();
  assert.equal(f.music.paused, false);
  f.audio.setRunning(false); f.audio.setRunning(true); await settle();
  assert.equal(f.music.paused, false, 'an aborted old play must not strand the active music');
  f.audio.dispose(); await settle();
});

test('explicit muted preference remains silent through unlock and running changes', async () => {
  const f = fixture({ enabled: false });
  assert.equal(await f.audio.unlock(), 'disabled');
  f.audio.setRunning(true); f.audio.play('drop'); await settle();
  assert.equal(f.music.playCalls.length, 0); assert.equal(f.contexts.length, 0); assert.equal(f.sources.length, 0);
  f.audio.dispose();
});

test('a failed media load reports once and can be explicitly retried', async () => {
  const f = fixture();
  f.fail(Object.assign(new Error('unavailable'), { name: 'NotSupportedError' }));
  f.audio.setRunning(true);
  assert.equal(await f.audio.unlock(), 'unavailable'); await settle();
  f.music.dispatch('error'); assert.equal(f.errors.length, 1);
  f.fail(null); f.audio.setEnabled(true);
  assert.equal(await f.audio.unlock(), 'enabled'); await settle();
  assert.equal(f.music.paused, false); assert.equal(f.errors.length, 1);
  f.audio.dispose();
});

test('audio-context resume failure does not leave music playing behind an error', async () => {
  const f = fixture(); f.failResume(new Error('device unavailable'));
  f.audio.setRunning(true);
  assert.equal(await f.audio.unlock(), 'unavailable'); await settle();
  assert.equal(f.music.paused, true); assert.equal(f.errors.length, 1);
  f.failResume(null); f.audio.setEnabled(true);
  assert.equal(await f.audio.unlock(), 'enabled'); await settle();
  assert.equal(f.music.paused, false); f.audio.dispose();
});

test('playing state requires the media playing event rather than a fulfilled play promise', async () => {
  const f = fixture({ manualPlaying: true });
  f.audio.setRunning(true); await f.gesture(() => f.audio.unlock()); await settle();
  assert.ok(!f.states.some(state => state.status === 'playing'));
  f.music.dispatch('playing');
  assert.equal(f.states.at(-1).status, 'playing'); assert.equal(f.states.at(-1).volume, 0.5);
  f.audio.setRunning(false); await settle(); assert.equal(f.states.at(-1).status, 'paused');
  f.audio.dispose();
});

test('volume changes retain playback position and zero is reported as muted', async () => {
  const f = fixture(); f.audio.setRunning(true); await f.gesture(() => f.audio.unlock()); await settle();
  f.music.currentTime = 8;
  f.audio.setVolume(0.75); await settle();
  assert.equal(f.music.volume, 0.75); assert.equal(f.states.at(-1).volume, 0.75);
  assert.equal(f.music.currentTime, 8);
  f.audio.setVolume(0); await settle(); assert.equal(f.states.at(-1).status, 'muted');
  f.audio.setVolume(0.5); await f.gesture(() => f.audio.unlock()); await settle();
  assert.equal(f.music.volume, 0.5); assert.equal(f.states.at(-1).status, 'playing');
  assert.equal(f.music.currentTime, 8); f.audio.dispose();
});

test('interrupted audio context is visible and an explicit gesture retries its resume', async () => {
  const f = fixture(); f.audio.setRunning(true); await f.gesture(() => f.audio.unlock()); await settle();
  f.interrupt(); await settle();
  assert.equal(f.states.at(-1).status, 'blocked');
  const before = f.contexts[0].resumeCalls;
  await f.gesture(() => f.audio.unlock()); await settle();
  assert.equal(f.contexts[0].resumeCalls, before + 1);
  assert.equal(f.contexts[0].state, 'running'); assert.equal(f.states.at(-1).status, 'playing');
  f.audio.dispose();
});

test('a fulfilled resume that leaves the context suspended is not reported as successful', async () => {
  const f = fixture(); f.resumeMode('stay-suspended'); f.audio.setRunning(true);
  assert.equal(await f.gesture(() => f.audio.unlock()), 'unavailable'); await settle();
  assert.equal(f.states.at(-1).status, 'blocked'); assert.equal(f.music.paused, true);
  f.resumeMode('normal'); await f.gesture(() => f.audio.unlock()); await settle();
  assert.equal(f.states.at(-1).status, 'playing'); f.audio.dispose();
});

test('a hanging first resume cannot prevent a fresh user gesture from unlocking audio', async () => {
  const f = fixture(); f.resumeMode('hang-next'); f.audio.setRunning(true);
  const first = f.gesture(() => f.audio.unlock()); await settle();
  assert.equal(f.contexts[0].resumeCalls, 1);
  const second = f.gesture(() => f.audio.unlock()); await settle();
  assert.equal(f.contexts[0].resumeCalls, 2, 'do not reuse the hanging unlock promise');
  assert.equal(f.contexts[0].state, 'running');
  f.resumes[0].resolve(); await first; await second; await settle();
  assert.equal(f.states.at(-1).status, 'playing'); f.audio.dispose();
});
