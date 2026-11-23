import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../workbench-ui/move-match-v1/classroom/camera-controller.js', import.meta.url), 'utf8');
const settle = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}
function eventTarget() {
  const listeners = new Map();
  return {
    addEventListener(type, handler) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(handler); },
    removeEventListener(type, handler) { listeners.get(type)?.delete(handler); },
    dispatch(type) { for (const handler of [...(listeners.get(type) || [])]) handler(); },
    listenerCount() { return [...listeners.values()].reduce((sum, list) => sum + list.size, 0); },
  };
}
function makeStream() {
  const track = { ...eventTarget(), kind: 'video', readyState: 'live', stops: 0,
    stop() { this.stops++; this.readyState = 'ended'; },
    disconnect() { this.readyState = 'ended'; this.dispatch('ended'); },
  };
  return { track, getTracks: () => [track], getVideoTracks: () => [track] };
}
function makeVideo(play = () => Promise.resolve()) {
  return { ...eventTarget(), isConnected: true, srcObject: null, plays: 0, pauses: 0,
    play() { this.plays++; return play(); }, pause() { this.pauses++; },
  };
}
function fixture({ secure = true, supported = true } = {}) {
  const requests = [], states = [];
  const document = { ...eventTarget(), hidden: false };
  const root = { ...eventTarget(), isSecureContext: secure, navigator: {} };
  if (supported) root.navigator.mediaDevices = {
    getUserMedia(constraints) {
      const request = { ...deferred(), constraints };
      requests.push(request);
      return request.promise;
    },
  };
  vm.runInContext(source, vm.createContext({ window: root, document }));
  const controller = root.MMClassroomCamera.create({ onState: value => states.push(value) });
  return { controller, requests, states, root, document,
    hide() { document.hidden = true; document.dispatch('visibilitychange'); },
    show() { document.hidden = false; document.dispatch('visibilitychange'); },
  };
}

test('capture begins only on explicit start, requests no microphone, and stop fully releases it', async () => {
  const f = fixture(), video = makeVideo(), stream = makeStream();
  assert.equal(f.requests.length, 0);
  assert.equal(f.controller.getState().status, 'off');
  const opening = f.controller.start(video);
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0].constraints.audio, false);
  assert.equal(f.requests[0].constraints.video.facingMode.ideal, 'user');
  assert.equal(f.controller.getState().status, 'requesting');
  f.requests[0].resolve(stream);
  assert.equal(await opening, true);
  assert.equal(video.srcObject, stream);
  assert.ok(video.muted && video.defaultMuted && video.playsInline && video.autoplay);
  assert.equal(f.controller.getState().status, 'live');
  f.controller.stop();
  assert.equal(stream.track.stops, 1);
  assert.equal(video.srcObject, null);
  assert.equal(video.listenerCount(), 0);
  assert.equal(stream.track.listenerCount(), 0);
  f.controller.dispose();
});

test('duplicate starts share one permission request; cancellation settles and stops its late stream', async () => {
  const f = fixture(), video = makeVideo(), stream = makeStream();
  const first = f.controller.start(video), second = f.controller.start(video);
  assert.equal(first, second);
  assert.equal(f.requests.length, 1);
  f.controller.stop();
  assert.equal(await first, false);
  f.requests[0].resolve(stream);
  await settle();
  assert.equal(stream.track.stops, 1);
  assert.equal(video.plays, 0);
  assert.equal(video.srcObject, null);
  assert.equal(f.controller.getState().status, 'off');
  f.controller.dispose();
});

test('a late cancelled permission result cannot replace or stop a newer camera session', async () => {
  const f = fixture(), video = makeVideo(), oldStream = makeStream(), newStream = makeStream();
  const oldRequest = f.controller.start(video);
  f.controller.stop();
  const newRequest = f.controller.start(video);
  f.requests[1].resolve(newStream);
  assert.equal(await newRequest, true);
  f.requests[0].resolve(oldStream);
  await settle();
  assert.equal(await oldRequest, false);
  assert.equal(oldStream.track.stops, 1);
  assert.equal(newStream.track.stops, 0);
  assert.equal(video.srcObject, newStream);
  assert.equal(f.controller.getState().status, 'live');
  f.controller.dispose();
});

test('a late cancelled playback cannot resume the camera or detach a newer session', async () => {
  const firstPlay = deferred();
  let calls = 0;
  const f = fixture(), video = makeVideo(() => calls++ === 0 ? firstPlay.promise : Promise.resolve());
  const firstStream = makeStream(), secondStream = makeStream();
  const first = f.controller.start(video);
  f.requests[0].resolve(firstStream); await settle();
  assert.equal(video.srcObject, firstStream);
  f.controller.stop();
  assert.equal(await first, false);
  const second = f.controller.start(video);
  f.requests[1].resolve(secondStream);
  assert.equal(await second, true);
  firstPlay.resolve(); await settle();
  assert.equal(video.srcObject, secondStream);
  assert.equal(firstStream.track.stops, 1);
  assert.equal(secondStream.track.stops, 0);
  assert.equal(f.controller.getState().status, 'live');
  f.controller.dispose();
});

test('hidden pages release the camera, and becoming visible never restarts it automatically', async () => {
  const f = fixture(), video = makeVideo(), stream = makeStream();
  const opening = f.controller.start(video); f.requests[0].resolve(stream); await opening;
  f.hide();
  assert.equal(stream.track.stops, 1);
  assert.equal(video.srcObject, null);
  assert.equal(f.controller.getState().status, 'off');
  f.show(); await settle();
  assert.equal(f.requests.length, 1);
  assert.equal(f.controller.getState().status, 'off');
  f.controller.dispose();
});

test('pagehide and disposal cancel pending capture and dispose removes all lifecycle listeners', async () => {
  for (const action of ['pagehide', 'dispose']) {
    const f = fixture(), video = makeVideo(), stream = makeStream();
    const opening = f.controller.start(video);
    if (action === 'pagehide') f.root.dispatch('pagehide');
    else f.controller.dispose();
    assert.equal(await opening, false);
    const stateCount = f.states.length;
    f.requests[0].resolve(stream); await settle();
    assert.equal(stream.track.stops, 1);
    assert.equal(video.srcObject, null);
    if (action === 'dispose') {
      assert.equal(f.states.length, stateCount);
      assert.equal(await f.controller.start(video), false);
    }
    f.controller.dispose();
    assert.equal(f.root.listenerCount(), 0);
    assert.equal(f.document.listenerCount(), 0);
  }
});

test('disconnected hardware or a media playback error releases capture and offers a retry', async () => {
  for (const type of ['ended', 'error']) {
    const f = fixture(), video = makeVideo(), stream = makeStream();
    const opening = f.controller.start(video); f.requests[0].resolve(stream); await opening;
    if (type === 'ended') stream.track.disconnect();
    else video.dispatch('error');
    assert.equal(video.srcObject, null);
    assert.equal(stream.track.readyState, 'ended');
    assert.equal(f.controller.getState().status, 'error');
    assert.match(f.controller.getState().message, /重新/);
    assert.equal(stream.track.listenerCount(), 0);
    assert.equal(video.listenerCount(), 0);
    f.controller.dispose();
  }
});

test('permission, device and playback failures surface actionable states without leaking tracks', async () => {
  for (const [name, expected] of [['NotAllowedError', /权限/], ['NotFoundError', /未找到/], ['NotReadableError', /占用/]]) {
    const f = fixture(), video = makeVideo();
    const opening = f.controller.start(video);
    f.requests[0].reject(Object.assign(new Error(name), { name }));
    assert.equal(await opening, false);
    assert.equal(f.controller.getState().status, 'error');
    assert.match(f.controller.getState().message, expected);
    assert.equal(video.srcObject, null);
    f.controller.dispose();
  }
  const f = fixture(), stream = makeStream(), video = makeVideo(() => Promise.reject(new Error('playback blocked')));
  const opening = f.controller.start(video); f.requests[0].resolve(stream);
  assert.equal(await opening, false);
  assert.equal(stream.track.stops, 1);
  assert.equal(video.srcObject, null);
  assert.match(f.controller.getState().message, /画面播放/);
  f.controller.dispose();
});

test('unsupported or insecure contexts and hidden or detached previews cannot request capture', async () => {
  for (const options of [{ secure: false }, { supported: false }, { hidden: true }, { detached: true }]) {
    const f = fixture(options), video = makeVideo();
    f.document.hidden = !!options.hidden;
    video.isConnected = !options.detached;
    assert.equal(await f.controller.start(video), false);
    assert.equal(f.requests.length, 0);
    assert.notEqual(f.controller.getState().status, 'requesting');
    f.controller.dispose();
  }
  const f = fixture(), video = makeVideo(), stream = makeStream();
  const opening = f.controller.start(video); video.isConnected = false;
  f.requests[0].resolve(stream);
  assert.equal(await opening, false);
  assert.equal(stream.track.stops, 1);
  assert.equal(f.controller.getState().status, 'off');
  f.controller.dispose();
});

test('reattaching a mounted preview reuses the stream without a second permission request', async () => {
  const f = fixture(), firstVideo = makeVideo(), nextVideo = makeVideo(), stream = makeStream();
  const first = f.controller.start(firstVideo), next = f.controller.start(nextVideo);
  assert.equal(f.requests.length, 1);
  f.requests[0].resolve(stream);
  assert.equal(await first, true);
  assert.equal(await next, true);
  assert.equal(f.requests.length, 1);
  assert.equal(firstVideo.srcObject, null);
  assert.equal(firstVideo.listenerCount(), 0);
  assert.equal(nextVideo.srcObject, stream);
  assert.equal(stream.track.stops, 0);
  f.controller.dispose();
});
