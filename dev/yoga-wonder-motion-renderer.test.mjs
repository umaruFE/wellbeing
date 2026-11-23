import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';

const sourceRoot = new URL('../workbench-ui/yoga/', import.meta.url);
function load(name) {
  const module = { exports: {} };
  vm.runInNewContext(readFileSync(new URL(name, sourceRoot), 'utf8'), { module }, { filename: name });
  return module.exports;
}
const factory = load('wonder-motion-renderer.js');
const sceneFactory = load('wonder-scene.js');
const W = load('wonder-case.js');

// These doubles test lifecycle and WebGL upload contracts, not GPU pixels.
function events() {
  const listeners = new Map();
  return {
    addEventListener(type, callback) {
      const callbacks = listeners.get(type) || new Set();
      callbacks.add(callback); listeners.set(type, callbacks);
    },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
    emit(type, event = {}) { for (const callback of [...(listeners.get(type) || [])]) callback(event); },
    dispatchEvent(event) { this.emit(event.type, event); return true; },
    listenerCount(type) { return listeners.get(type)?.size || 0; },
  };
}

function graphics(options = {}) {
  const calls = [], resources = { shaders: new Set(), buffers: new Set(), textures: new Set(), programs: new Set() };
  let serial = 0;
  const create = type => { const item = { type, id: ++serial }; resources[type].add(item); return item; };
  const gl = { calls, resources, loses: 0,
    createShader(type) { return Object.assign(create('shaders'), { shaderType: type }); },
    createBuffer() { return create('buffers'); }, createTexture() { return create('textures'); }, createProgram() { return create('programs'); },
    deleteShader(value) { resources.shaders.delete(value); }, deleteBuffer(value) { resources.buffers.delete(value); },
    deleteTexture(value) { resources.textures.delete(value); }, deleteProgram(value) { resources.programs.delete(value); },
    getShaderParameter(shader) { return options.failShader !== shader.shaderType; },
    getShaderInfoLog() { return 'Test shader failure'; },
    getProgramParameter() { return !options.failLink; }, getProgramInfoLog() { return 'Test link failure'; },
    getAttribLocation(_program, name) { return name === 'a_position' ? 0 : 1; },
    getUniformLocation(_program, name) { return name; },
    getExtension(name) { return name === 'WEBGL_lose_context' ? { loseContext() { gl.loses++; } } : null; },
    texImage2D(...args) { calls.push(['texImage2D', ...args]); if (options.failUpload) throw new Error('Test texture failure'); },
    drawElements(...args) { calls.push(['drawElements', ...args]); if (options.failDraw) throw new Error('Test draw failure'); },
  };
  for (const name of ['VERTEX_SHADER', 'FRAGMENT_SHADER', 'COMPILE_STATUS', 'LINK_STATUS', 'ARRAY_BUFFER', 'ELEMENT_ARRAY_BUFFER', 'FLOAT', 'DYNAMIC_DRAW', 'STATIC_DRAW', 'TEXTURE0', 'TEXTURE_2D', 'UNPACK_FLIP_Y_WEBGL', 'UNPACK_PREMULTIPLY_ALPHA_WEBGL', 'RGBA', 'UNSIGNED_BYTE', 'TEXTURE_MIN_FILTER', 'TEXTURE_MAG_FILTER', 'LINEAR', 'TEXTURE_WRAP_S', 'TEXTURE_WRAP_T', 'CLAMP_TO_EDGE', 'COLOR_BUFFER_BIT', 'TRIANGLES', 'UNSIGNED_SHORT']) gl[name] = name;
  for (const name of ['shaderSource', 'compileShader', 'attachShader', 'linkProgram', 'useProgram', 'bindBuffer', 'bufferData', 'enableVertexAttribArray', 'vertexAttribPointer', 'activeTexture', 'bindTexture', 'pixelStorei', 'texParameteri', 'uniform1i', 'uniform4fv', 'clearColor', 'viewport', 'clear', 'bufferSubData']) gl[name] = (...args) => calls.push([name, ...args]);
  return gl;
}

function fixture(options = {}) {
  const canvases = [], contexts = [], observers = [], samples = [], warnings = [], eventLog = [];
  const media = Object.assign(events(), { matches: !!options.reduced });
  const document = { hidden: false, body: {},
    createElement(tag) {
      assert.equal(tag, 'canvas');
      const gl = graphics(options);
      const canvas = Object.assign(events(), { width: 300, height: 150, parent: null, attributes: {},
        setAttribute(name, value) { this.attributes[name] = value; },
        getContext(type, attributes) { contexts.push({ type, attributes, gl }); return options.noGL ? null : gl; },
        remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); this.parent = null; },
      });
      canvases.push(canvas); return canvas;
    },
  };
  const environment = Object.assign(events(), {
    devicePixelRatio: 2, matchMedia: () => media, console: { warn: (...args) => warnings.push(args) },
    CustomEvent: class { constructor(type, init) { Object.assign(this, { type }, init); } },
    MutationObserver: class { constructor(callback) { this.callback = callback; observers.push(this); } observe() {} disconnect() {} },
    setTimeout() { assert.fail('The renderer must not schedule a clock'); },
    setInterval() { assert.fail('The renderer must not schedule a clock'); },
    requestAnimationFrame() { assert.fail('The renderer must not schedule a clock'); },
  });
  const motion = { sample(kind, progress, settings) {
    samples.push({ kind, progress, settings });
    return { positions: new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), uvs: new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), indices: new Uint16Array([0, 1, 2, 1, 3, 2]), phase: progress === 1 ? 'complete' : 'moving' };
  } };
  const renderer = factory(motion, W, environment);
  function actor(kind = 'tall', ready = true) {
    const classes = new Set();
    const image = Object.assign(events(), { complete: ready, naturalWidth: ready ? 600 : 0 });
    const result = Object.assign(events(), { ownerDocument: document, dataset: { ywMotion: kind }, isConnected: true, children: [], image,
      rect: { width: 180, height: 320 },
      classList: { add: value => classes.add(value), remove: value => classes.delete(value), contains: value => classes.has(value) },
      querySelector(selector) { assert.equal(selector, '.yw-sprite img'); return image; },
      getBoundingClientRect() { return this.rect; },
      appendChild(child) { this.children.push(child); child.parent = this; },
    });
    result.addEventListener('yoga:motion-error', event => eventLog.push(event));
    return result;
  }
  const container = (...actors) => ({ querySelectorAll(selector) { assert.equal(selector, '[data-yw-motion]'); return actors; } });
  return { renderer, actor, container, document, environment, media, canvases, contexts, observers, samples, warnings, eventLog,
    drawCount: () => contexts.reduce((n, c) => n + c.gl.calls.filter(call => call[0] === 'drawElements').length, 0),
    load(item) { item.image.complete = true; item.image.naturalWidth = 600; item.image.emit('load'); },
  };
}

function released(gl) {
  for (const [type, values] of Object.entries(gl.resources)) assert.equal(values.size, 0, `${type} must be released`);
}

test('source crop preserves alpha bounds and the exact blue-only rest viewport', () => {
  const f = fixture();
  const tall = f.renderer.sourceCrop(W.pages[2].character);
  assert.deepEqual(Array.from(tall), [172 / 600, 45 / 600, 265 / 600, 508 / 600]);
  const rest = f.renderer.sourceCrop(W.pages[9].character);
  assert.deepEqual(Array.from(rest), [822.6737485488902 / 1265, 0, (1265 - 822.6737485488902) / 1265, 1]);
  assert.ok(rest[0] > .65, 'Rest must exclude the pink and yellow characters');
});

test('transparent PNG upload uses top-down UVs without a second flip or premultiplication', () => {
  const f = fixture(), a = f.actor('rest'); f.renderer.setProgress(f.container(a), .4);
  const { attributes, gl } = f.contexts[0];
  assert.equal(attributes.alpha, true); assert.equal(attributes.premultipliedAlpha, false);
  assert.ok(gl.calls.some(c => c[0] === 'pixelStorei' && c[1] === gl.UNPACK_FLIP_Y_WEBGL && c[2] === false));
  assert.ok(gl.calls.some(c => c[0] === 'pixelStorei' && c[1] === gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL && c[2] === false));
  assert.equal(gl.calls.find(c => c[0] === 'texImage2D').at(-1), a.image);
  assert.deepEqual(gl.calls.find(c => c[0] === 'clearColor').slice(1), [0, 0, 0, 0]);
  const crop = gl.calls.find(c => c[0] === 'uniform4fv' && c[1] === 'u_crop')[2];
  assert.deepEqual(Array.from(crop), Array.from(f.renderer.sourceCrop(W.pages[9].character)));
  assert.equal(f.canvases[0].attributes['aria-hidden'], 'true');
  assert.equal(a.classList.contains('yw-motion-ready'), true);
});

test('late image load draws only the most recent paused progress and schedules no clock', () => {
  const f = fixture(), a = f.actor('side', false), c = f.container(a);
  f.renderer.setProgress(c, .1); f.renderer.setProgress(c, .37);
  assert.equal(f.drawCount(), 0); f.load(a);
  assert.equal(f.drawCount(), 1); assert.equal(f.samples[0].progress, .37);
  a.image.emit('load'); f.renderer.setProgress(c, .37);
  assert.equal(f.drawCount(), 1, 'An unchanged paused pose must remain unchanged');
  f.renderer.setProgress(c, .7); assert.equal(f.drawCount(), 2);
});

test('hidden documents and zero-sized actors do not create graphics or advance a pose', () => {
  const f = fixture(), a = f.actor('lake', false), c = f.container(a);
  f.renderer.setProgress(c, .43); f.document.hidden = true; f.load(a);
  assert.equal(f.contexts.length, 0);
  f.document.hidden = false; a.rect = { width: 0, height: 320 }; f.renderer.setProgress(c, .43);
  assert.equal(f.contexts.length, 0);
  a.rect.width = 180; f.renderer.setProgress(c, .43);
  assert.equal(f.drawCount(), 1); assert.equal(f.samples[0].progress, .43);
});

test('reduced motion holds one reference pose and restores only the saved progress on preference change', () => {
  const f = fixture({ reduced: true }), a = f.actor(), c = f.container(a);
  f.renderer.setProgress(c, .1); f.renderer.setProgress(c, .8);
  assert.equal(f.drawCount(), 1); assert.equal(f.samples[0].progress, .55);
  assert.equal(f.samples[0].settings.reducedMotion, true); assert.equal(a.dataset.motionState, 'reduced');
  f.media.matches = false; f.media.emit('change');
  assert.equal(f.samples.at(-1).progress, .8); assert.equal(f.samples.at(-1).settings.reducedMotion, false);
  f.media.matches = true; f.media.emit('change');
  assert.equal(f.samples.at(-1).progress, .55); assert.equal(f.drawCount(), 3);
});

test('progress clamps safely and repeated progress avoids redundant GPU work', () => {
  const f = fixture(), a = f.actor(), c = f.container(a);
  for (const value of [-5, -1, 3, 9, NaN, Infinity]) f.renderer.setProgress(c, value);
  assert.deepEqual(f.samples.map(s => s.progress), [0, 1, .55]);
  a.rect.width = 240; f.renderer.setProgress(c, .55);
  assert.equal(f.drawCount(), 4, 'A changed viewport must redraw the same pose');
  assert.ok(f.canvases[0].width <= 1024 && f.canvases[0].height <= 1024);
});

test('unknown pose nodes leave the original image untouched', () => {
  const f = fixture(), a = f.actor('unknown'); f.renderer.setProgress(f.container(a), .5);
  assert.equal(f.contexts.length, 0); assert.equal(a.image.listenerCount('load'), 0);
  assert.equal(a.classList.contains('yw-motion-ready'), false);
});

test('detached actors release GPU resources and image listeners immediately on mutation', () => {
  const f = fixture(), a = f.actor(), b = f.actor('lake', false);
  f.renderer.setProgress(f.container(a, b), .4); const gl = f.contexts[0].gl;
  a.isConnected = b.isConnected = false; f.observers[0].callback();
  released(gl); assert.equal(gl.loses, 1); assert.equal(a.children.length, 0);
  assert.equal(a.classList.contains('yw-motion-ready'), false);
  for (const item of [a, b]) { assert.equal(item.image.listenerCount('load'), 0); assert.equal(item.image.listenerCount('error'), 0); }
  f.load(b); assert.equal(f.contexts.length, 1, 'A detached late image must not create a context');
});

test('pagehide clears both ready and pending actors without later asynchronous resurrection', () => {
  const f = fixture(), a = f.actor(), b = f.actor('lake', false);
  f.renderer.setProgress(f.container(a, b), .4); f.environment.emit('pagehide');
  released(f.contexts[0].gl); assert.equal(a.children.length, 0);
  f.load(b); assert.equal(f.contexts.length, 1);
  f.environment.emit('pagehide'); assert.equal(f.contexts[0].gl.loses, 1, 'Cleanup must be idempotent');
});

test('missing WebGL and image errors preserve the original image without repeated retries', () => {
  const f = fixture({ noGL: true }), a = f.actor(), c = f.container(a);
  f.renderer.setProgress(c, .4); f.renderer.setProgress(c, .7);
  assert.equal(a.dataset.motionState, 'unavailable'); assert.equal(a.children.length, 0);
  assert.equal(a.classList.contains('yw-motion-ready'), false); assert.equal(f.contexts.length, 1);
  const b = f.actor('lake', false); f.renderer.setProgress(f.container(b), .5); b.image.emit('error');
  assert.equal(b.dataset.motionState, 'unavailable'); assert.equal(f.contexts.length, 1);
  assert.equal(f.warnings.length, 1, 'Repeated failures must not flood warnings');
});

for (const [name, options] of [
  ['fragment shader compilation', { failShader: 'FRAGMENT_SHADER' }],
  ['program linking', { failLink: true }],
  ['PNG texture upload', { failUpload: true }],
  ['drawing', { failDraw: true }],
]) {
  test(`${name} failure releases partial graphics immediately and keeps the static fallback`, () => {
    const f = fixture(options), a = f.actor(), c = f.container(a);
    f.renderer.setProgress(c, .4); const gl = f.contexts[0].gl;
    assert.equal(a.dataset.motionState, 'unavailable'); assert.equal(a.children.length, 0);
    assert.equal(a.classList.contains('yw-motion-ready'), false); released(gl);
    const contextsBefore = f.contexts.length; f.renderer.setProgress(c, .8);
    assert.equal(f.contexts.length, contextsBefore, 'A failed actor must not retry on every progress tick');
  });
}

test('context loss restores the PNG and releases resources without restarting after restoration', () => {
  const f = fixture(), a = f.actor(), c = f.container(a);
  f.renderer.setProgress(c, .4); const canvas = f.canvases[0], gl = f.contexts[0].gl;
  canvas.emit('webglcontextlost');
  assert.equal(a.classList.contains('yw-motion-ready'), false); assert.equal(a.dataset.motionState, 'unavailable');
  assert.equal(a.children.length, 0); released(gl);
  canvas.emit('webglcontextrestored'); a.image.emit('load'); f.renderer.setProgress(c, .7);
  assert.equal(f.contexts.length, 1); assert.equal(f.drawCount(), 1);
});

test('scene adapter animates only action actors and forwards existing progress without replacing legacy behavior', () => {
  const calls = [];
  const original = { setProgress: (...args) => calls.push(['legacy', ...args]), render: () => 'legacy', renderBackground: () => 'background', renderReference: () => 'reference' };
  const scene = sceneFactory(original, W, { setProgress: (...args) => calls.push(['wonder', ...args]) });
  function page(index) { const p = W.pages[index]; return { kind: index >= 2 && index <= 9 ? 'action' : index === 0 ? 'cover' : index === 10 ? 'ending' : 'intro', title: p.label, english: p.sourceText, scene: p.scene, actionId: p.actionId, wonder: { templateId: W.templateId, source: index } }; }
  for (const index of [0, 1, 10]) assert.doesNotMatch(scene.render(page(index), {}), /data-yw-motion/);
  assert.match(scene.render(page(2), {}), /data-yw-motion="tall"/);
  assert.match(scene.renderReference(page(9), {}), /data-yw-motion="rest"/);
  assert.equal(scene.render({ title: 'Old course' }, {}), 'legacy');
  const container = {}; scene.setProgress(container, .25);
  assert.deepEqual(calls, [['legacy', container, .25], ['wonder', container, .25]]);
});

test('the generated page loads the real motion modules before binding the scene adapter', () => {
  const source = new URL('../public/workbench-v6/yoga.html', import.meta.url);
  const html = readFileSync(existsSync(source) ? source : new URL('../dist/workbench-v6/yoga.html', import.meta.url), 'utf8');
  const entries = [...html.matchAll(/<script\b[^>]*data-build-source="([^"]+)"[^>]*>([\s\S]*?)<\/script>/g)];
  const names = entries.map(entry => entry[1]);
  const expected = ['yoga/wonder-case.js', 'yoga/wonder-motion.js', 'yoga/wonder-motion-renderer.js', 'yoga/wonder-scene.js'];
  assert.deepEqual(names.filter(name => expected.includes(name)), expected);
  assert.ok(names.indexOf('yoga/wonder-scene.js') < names.indexOf('yoga/app.js'));
  const forwarded = [];
  const context = vm.createContext({ YogaScene: { setProgress: (...args) => forwarded.push(args) } });
  context.window = context;
  for (const name of expected) {
    const embedded = entries.find(entry => entry[1] === name)?.[2];
    assert.equal(typeof embedded, 'string');
    vm.runInContext(embedded, context, { filename: name });
  }
  assert.equal(typeof context.YogaWonderMotion.sample, 'function');
  assert.equal(typeof context.YogaWonderMotionRenderer.setProgress, 'function');
  const container = { querySelectorAll: () => [] };
  context.YogaScene.setProgress(container, .4);
  assert.deepEqual(forwarded, [[container, .4]]);
  for (const kind of Object.keys(context.YogaWonderMotion.definitions)) {
    const frame = context.YogaWonderMotion.sample(kind, .55);
    assert.deepEqual(Array.from(frame.positions), Array.from(frame.uvs));
  }
});
