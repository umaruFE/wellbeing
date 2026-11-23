import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INTEGRATED_MODULES, isModuleResumeMessage, moduleAtPath, mayOpenModule, storageScope, userStorageIdentity,
  prepareModuleLeave, setModuleVisible, moduleFromMessage,
} from '../src/modules/integrated-workbench/bridge.mjs';

test('only the six exact routes mount, with original viewer restriction', () => {
  assert.equal(moduleAtPath('/song-writing/'), 'song');
  assert.equal(moduleAtPath('/workshop/music-star-quest'), 'music');
  assert.equal(moduleAtPath('/workshop/interactive-yoga'), 'yoga');
  assert.equal(moduleAtPath('/workshop/music-star-quest/foreign'), null);
  assert.equal(mayOpenModule('song', 'viewer'), false);
  assert.equal(mayOpenModule('music', 'viewer'), true);
  assert.equal(mayOpenModule('yoga', 'picture_song_creator'), true);
  assert.equal(mayOpenModule('__proto__', 'super_admin'), false);
});

test('account and organization scopes are stable, distinct and URL-safe', async () => {
  const a = await storageScope(userStorageIdentity({ id: '12', organizationId: 4 }));
  assert.match(a, /^[a-f0-9]{64}$/);
  assert.equal(a, await storageScope(userStorageIdentity({ id: '12', organization_id: 4 })));
  assert.notEqual(a, await storageScope(userStorageIdentity({ id: '13', organizationId: 4 })));
  assert.notEqual(a, await storageScope(userStorageIdentity({ id: '12', organizationId: 5 })));
});

const frameWith = prepareLeave => ({ contentWindow: { WBWebModule: { ready: () => true, prepareLeave } } });
test('navigation waits for save and only accepts explicit true', async () => {
  let finish;
  const pending = prepareModuleLeave(frameWith(() => new Promise(resolve => { finish = resolve; })), 200);
  await Promise.resolve();
  finish(true);
  assert.equal(await pending, true);
  assert.equal(await prepareModuleLeave(frameWith(() => false)), false);
  assert.equal(await prepareModuleLeave(frameWith(() => undefined)), false);
  assert.equal(await prepareModuleLeave(frameWith(() => { throw Error('quota'); })), false);
  assert.equal(await prepareModuleLeave(frameWith(() => new Promise(() => {})), 5), false);
});

test('visibility is sent by the actual parent and never resumes media', () => {
  const calls = [];
  const frame = { contentWindow: { WBWebModule: { setVisible: value => calls.push(['visible', value]) }, postMessage: (message, origin) => calls.push(['message', message, origin]) } };
  setModuleVisible(frame, false, 'http://127.0.0.1:5198');
  assert.deepEqual(calls, [['visible', false], ['message', { type: 'wellbeing:visibility', visible: false }, 'http://127.0.0.1:5198']]);
});

test('cross-module messages require origin, active frame and allowed role', () => {
  const source = {};
  const frames = { music: { contentWindow: source }, yoga: { contentWindow: {} } };
  const event = { origin: 'http://local', source, data: { type: 'wellbeing:module', module: 'yoga' } };
  assert.equal(moduleFromMessage(event, frames, 'http://local', 'music', 'viewer'), 'yoga');
  assert.equal(moduleFromMessage({ ...event, origin: 'http://foreign' }, frames, 'http://local', 'music', 'viewer'), null);
  assert.equal(moduleFromMessage({ ...event, source: {} }, frames, 'http://local', 'music', 'viewer'), null);
  assert.equal(moduleFromMessage({ ...event, data: { type: 'wellbeing:module', module: 'song' } }, frames, 'http://local', 'music', 'viewer'), null);
  assert.equal(moduleFromMessage({ ...event, data: { type: 'wellbeing:module', module: 'unknown' } }, frames, 'http://local', 'music', 'super_admin'), null);
});


test('new modules resolve to real packaged entries for every existing workshop role', () => {
  const cases = [
    ['speak', '/workshop/spin-speak', 'spin-speak-v1/index.html'],
    ['doodle', '/workshop/doodle', 'doodle-guess-v1/index.html'],
    ['move-match', '/workshop/move-match', 'move-match-v1/index.html'],
  ];
  for (const [id, path, entry] of cases) {
    assert.equal(moduleAtPath(path), id);
    assert.equal(moduleAtPath(path + '/'), id);
    assert.equal(moduleAtPath(path + '/foreign'), null);
    assert.equal(INTEGRATED_MODULES[id].entry, entry);
    for (const role of INTEGRATED_MODULES.music.roles) assert.equal(mayOpenModule(id, role), true);
    assert.equal(mayOpenModule(id, 'anonymous'), false);
    const source = {};
    assert.equal(moduleFromMessage({ source, origin: 'http://local', data: { type: 'wellbeing:module', module: id } }, { song: { contentWindow: source } }, 'http://local', 'song', 'creator'), id);
  }
});


test('return and legacy classification requests retain source checks and destination permissions', () => {
  const source = {};
  const frames = { speak: { contentWindow: source } };
  const event = { source, origin: 'http://local', data: { type: 'wellbeing:return' } };
  assert.equal(moduleFromMessage(event, frames, 'http://local', 'speak', 'creator', 'doodle'), 'doodle');
  assert.equal(moduleFromMessage(event, frames, 'http://local', 'speak', 'creator'), 'music');
  assert.equal(moduleFromMessage(event, frames, 'http://local', 'speak', 'viewer', 'song'), null);
  assert.equal(moduleFromMessage({ ...event, source: {} }, frames, 'http://local', 'speak', 'creator', 'doodle'), null);
  assert.equal(moduleFromMessage({ ...event, data: { type: 'wellbeing:module', module: 'classification' } }, frames, 'http://local', 'speak', 'creator'), 'move-match');
});


test('manual resume only accepts the active speaking frame', () => {
  const source = {};
  const frames = { speak: { contentWindow: source } };
  const event = { source, origin: 'http://local', data: { type: 'wellbeing:resume', module: 'speak' } };
  assert.equal(isModuleResumeMessage(event, frames, 'http://local', 'speak'), true);
  assert.equal(isModuleResumeMessage(event, frames, 'http://local', 'music'), false);
  assert.equal(isModuleResumeMessage({ ...event, source: {} }, frames, 'http://local', 'speak'), false);
  assert.equal(isModuleResumeMessage({ ...event, origin: 'http://foreign' }, frames, 'http://local', 'speak'), false);
  assert.equal(isModuleResumeMessage({ ...event, data: { type: 'wellbeing:resume', module: 'doodle' } }, frames, 'http://local', 'speak'), false);
});
