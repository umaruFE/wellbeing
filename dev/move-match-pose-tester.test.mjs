import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const cameraSource = readFileSync(new URL('../workbench-ui/move-match-v1/classroom/camera-controller.js', import.meta.url), 'utf8');
const testerSource = readFileSync(new URL('../workbench-ui/move-match-v1/classroom/pose-tester.js', import.meta.url), 'utf8');
const settle = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}
function events() {
  const listeners = new Map();
  return {
    addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); },
    removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
    dispatch(type) { for (const fn of [...(listeners.get(type) || [])]) fn(); },
    listenerCount() { return [...listeners.values()].reduce((sum, set) => sum + set.size, 0); },
  };
}
function stream() {
  const track = { ...events(), readyState: 'live', stops: 0, stop() { this.stops++; this.readyState = 'ended'; } };
  return { track, getTracks: () => [track], getVideoTracks: () => [track] };
}
function fixture({ acquireStream, detectorFactory } = {}) {
  const states = [], landmarks = [], requests = [], models = [], evaluated = [], frames = new Map(), timers = new Map();
  let next = 0, match = true, people = 1;
  const document = { ...events(), hidden: false, currentScript: { src: 'http://localhost/classroom/pose-tester.js' } };
  const video = { ...events(), isConnected: true, readyState: 2, videoWidth: 640, videoHeight: 360, currentTime: 0,
    srcObject: null, play: () => Promise.resolve(), pause() {} };
  const root = { ...events(), location: { href: 'http://localhost/classroom/index.html' }, isSecureContext: true,
    navigator: { mediaDevices: { getUserMedia(constraints) { const request = { ...deferred(), constraints }; requests.push(request); return request.promise; } } },
    requestAnimationFrame(fn) { const id = ++next; frames.set(id, fn); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout(fn, ms) { const id = ++next; timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
    MMClassroomPoseClassifier: { evaluate(points, options) { evaluated.push(options); return { matched: !!points?.[0]?.match, message: points ? '请调整动作。' : '请进入画面。' }; } },
  };
  const context = vm.createContext({ window: root, document, URL });
  vm.runInContext(cameraSource, context);
  vm.runInContext(testerSource, context);
  function makeDetector() {
    const detector = { closes: 0, samples: [], close() { this.closes++; },
      detectForVideo(element, now) { this.samples.push({ element, now }); return { landmarks: Array.from({ length: people }, () => [{ match }]) }; } };
    models.push(detector);
    return detector;
  }
  const controller = root.MMClassroomPoseTest.create({
    onState: s => states.push(s), onLandmarks: p => landmarks.push(p), acquireStream,
    createDetector: detectorFactory || (() => makeDetector()),
  });
  return { root, document, video, controller, states, landmarks, requests, models, evaluated, frames, timers, makeDetector,
    setMatch(value) { match = value; }, setPeople(value) { people = value; },
    frame(now, fresh = true) { if (fresh) video.currentTime = now / 1000; const queued = [...frames.values()]; frames.clear(); queued.forEach(fn => fn(now)); },
    expireModel() { for (const { fn } of [...timers.values()]) fn(); },
    async open(target = { gesture: 'left' }) { const started = controller.start(video, target); const captured = stream(); requests.at(-1)?.resolve(captured); await settle(); return { started, captured }; },
  };
}

test('testing is explicit, uses video only and loads the detector after permission', async () => {
  const model = deferred();
  let loads = 0;
  const f = fixture({ detectorFactory: () => { loads++; return model.promise; } });
  assert.equal(f.requests.length, 0); assert.equal(loads, 0);
  const started = f.controller.start(f.video, { gesture: 'both', seated: true });
  assert.equal(f.controller.getState().status, 'opening');
  assert.equal(f.requests.length, 1); assert.equal(f.requests[0].constraints.audio, false); assert.equal(loads, 0);
  const captured = stream(); f.requests[0].resolve(captured); await settle();
  assert.equal(f.controller.getState().status, 'loading'); assert.equal(loads, 1);
  model.resolve(f.makeDetector()); await settle();
  assert.equal(await started, true); assert.equal(f.controller.getState().status, 'tracking');
  f.frame(0);
  assert.equal(f.evaluated[0].gesture, 'both'); assert.equal(f.evaluated[0].seated, true); assert.equal(f.evaluated[0].aspectRatio, 640 / 360);
  f.controller.dispose(); assert.equal(captured.track.stops, 1);
});

test('success requires a continuous hold and releases capture/model without submitting an answer', async () => {
  const f = fixture(); const { started, captured } = await f.open(); assert.equal(await started, true);
  for (const time of [0, 100, 200, 300, 400, 500]) f.frame(time);
  assert.equal(f.controller.getState().status, 'holding'); assert.equal(captured.track.stops, 0);
  f.frame(600);
  assert.equal(f.controller.getState().status, 'success'); assert.equal(f.controller.getState().progress, 1);
  assert.equal(f.controller.getState().cameraLive, false); assert.equal(f.video.srcObject, null);
  assert.equal(captured.track.stops, 1); assert.equal(f.models[0].closes, 1); assert.equal(f.frames.size, 0);
  const count = f.states.length; f.frame(1000); assert.equal(f.states.length, count);
  f.controller.dispose(); assert.equal(f.models[0].closes, 1);
});

test('wrong pose and multiple people reset the hold instead of accumulating success', async () => {
  for (const interruption of ['wrong', 'multiple', 'missing']) {
    const f = fixture(); await f.open();
    for (const time of [0, 100, 200]) f.frame(time);
    if (interruption === 'wrong') f.setMatch(false); else f.setPeople(interruption === 'multiple' ? 2 : 0);
    f.frame(300); assert.equal(f.controller.getState().status, 'tracking'); assert.equal(f.controller.getState().progress, 0);
    if (interruption === 'multiple') assert.match(f.controller.getState().message, /一位/);
    f.setMatch(true); f.setPeople(1);
    for (const time of [400, 500, 600, 700, 800, 900]) f.frame(time);
    assert.equal(f.controller.getState().status, 'holding');
    f.frame(1000); assert.equal(f.controller.getState().status, 'success'); f.controller.dispose();
  }
});

test('stale video frames are never counted, and a decoding gap restarts the hold', async () => {
  const f = fixture(); await f.open(); f.frame(0); f.frame(100);
  f.frame(200, false); f.frame(800, false);
  assert.equal(f.models[0].samples.length, 2); assert.equal(f.controller.getState().status, 'tracking');
  for (const time of [900, 1000, 1100, 1200, 1300, 1400]) f.frame(time);
  assert.equal(f.controller.getState().status, 'holding');
  f.frame(1500); assert.equal(f.controller.getState().status, 'success'); f.controller.dispose();
});

test('frame throttling processes fresh frames at most ten times per second', async () => {
  const f = fixture(); await f.open();
  for (const time of [0, 16, 32, 48, 64, 80, 96, 112]) f.frame(time);
  assert.equal(f.models[0].samples.length, 2); f.controller.dispose();
});

test('cancel during camera permission settles immediately and stops a late stream', async () => {
  const f = fixture(); const started = f.controller.start(f.video, { gesture: 'left' });
  f.controller.stop(); assert.equal(await started, false);
  const captured = stream(); f.requests[0].resolve(captured); await settle();
  assert.equal(captured.track.stops, 1); assert.equal(f.models.length, 0); assert.equal(f.video.srcObject, null);
  assert.equal(f.controller.getState().status, 'stopped'); f.controller.dispose();
});

test('cancel or timeout while loading closes a late detector and keeps capture off', async () => {
  for (const action of ['cancel', 'timeout', 'dispose']) {
    const model = deferred(); const f = fixture({ detectorFactory: () => model.promise });
    const { started, captured } = await f.open();
    assert.equal(f.controller.getState().status, 'loading');
    if (action === 'timeout') f.expireModel(); else if (action === 'dispose') f.controller.dispose(); else f.controller.stop();
    assert.equal(await started, false); assert.equal(captured.track.stops, 1);
    if (action === 'timeout') { assert.equal(f.controller.getState().status, 'error'); assert.match(f.controller.getState().message, /超时/); }
    const count = f.states.length, late = f.makeDetector(); model.resolve(late); await settle();
    assert.equal(late.closes, 1); assert.equal(f.states.length, count); assert.equal(f.frames.size, 0);
    f.controller.dispose();
  }
});

test('switching target invalidates old loading work without releasing the new stream', async () => {
  const oldModel = deferred(); let loads = 0;
  const f = fixture({ detectorFactory: () => ++loads === 1 ? oldModel.promise : f.makeDetector() });
  const first = await f.open({ gesture: 'left' });
  const second = await f.open({ gesture: 'right' });
  assert.equal(await first.started, false); assert.equal(await second.started, true); assert.equal(first.captured.track.stops, 1);
  const late = f.makeDetector(); oldModel.resolve(late); await settle();
  assert.equal(late.closes, 1); assert.equal(second.captured.track.stops, 0); assert.equal(f.video.srcObject, second.captured);
  f.frame(0); assert.equal(f.evaluated[0].gesture, 'right'); f.controller.dispose();
});

test('camera denial and model failure show actionable errors and do not leak tracks', async () => {
  const denied = fixture(); const p = denied.controller.start(denied.video, { gesture: 'left' });
  denied.requests[0].reject(Object.assign(new Error('Denied'), { name: 'NotAllowedError' }));
  assert.equal(await p, false); assert.equal(denied.controller.getState().status, 'error');
  assert.match(denied.controller.getState().message, /权限/); assert.equal(denied.models.length, 0); denied.controller.dispose();
  const broken = fixture({ detectorFactory: () => Promise.reject(new Error('bad model')) });
  const { started, captured } = await broken.open(); assert.equal(await started, false);
  assert.equal(broken.controller.getState().status, 'error'); assert.equal(captured.track.stops, 1); assert.equal(broken.frames.size, 0); broken.controller.dispose();
});

test('hiding, pagehide and disposal stop inference, release devices and never auto-restart', async () => {
  for (const action of ['hide', 'pagehide', 'dispose']) {
    const f = fixture(); const { captured } = await f.open(); f.frame(0);
    if (action === 'hide') { f.document.hidden = true; f.document.dispatch('visibilitychange'); }
    else if (action === 'pagehide') f.root.dispatch('pagehide'); else f.controller.dispose();
    assert.equal(captured.track.stops, 1); assert.equal(f.models[0].closes, 1); assert.equal(f.frames.size, 0);
    f.document.hidden = false; f.document.dispatch('visibilitychange'); await settle();
    assert.equal(f.requests.length, 1); f.controller.dispose();
    assert.equal(f.document.listenerCount(), 0); assert.equal(f.root.listenerCount(), 0);
  }
});

test('cloned observation capture is owned by the test and leaves the original stream live', async () => {
  const original = stream(), clone = stream(); let acquisitions = 0, requestedConstraints;
  const f = fixture({ acquireStream: constraints => { acquisitions++; requestedConstraints = constraints; return clone; } });
  assert.equal(await f.controller.start(f.video, { gesture: 'squat' }), true);
  assert.equal(acquisitions, 1); assert.equal(f.requests.length, 0);
  assert.equal(requestedConstraints.audio, false);
  assert.equal(requestedConstraints.video.facingMode.ideal, 'user');
  assert.equal(requestedConstraints.video.width.ideal, 640);
  assert.equal(requestedConstraints.video.height.ideal, 360);
  f.controller.stop(); assert.equal(clone.track.stops, 1); assert.equal(original.track.stops, 0);
  assert.equal(original.track.readyState, 'live'); f.controller.dispose();
});

test('disconnected test video and inference errors terminate testing and close the model', async () => {
  for (const fault of ['detached', 'inference']) {
    const f = fixture(); const { captured } = await f.open();
    if (fault === 'detached') f.video.isConnected = false;
    else f.models[0].detectForVideo = () => { throw new Error('lost context'); };
    f.frame(0); assert.equal(captured.track.stops, 1); assert.equal(f.models[0].closes, 1); assert.equal(f.frames.size, 0);
    assert.equal(f.controller.getState().status, fault === 'detached' ? 'stopped' : 'error'); f.controller.dispose();
  }
});
