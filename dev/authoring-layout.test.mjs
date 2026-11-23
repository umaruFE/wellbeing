import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../public/workbench-v6/authoring.js', import.meta.url), 'utf8');
function style() {
  const values = new Map();
  return { setProperty: (key, value) => values.set(key, value), getPropertyValue: key => values.get(key) || '' };
}
function element(bounds) { return { style: style(), bounds, getBoundingClientRect() { return this.bounds; } }; }
function fixture() {
  const pending = [];
  const listeners = {};
  const observers = [];
  const root = { style: style() };
  const state = {
    main: element({ left: 228, width: 1212 }),
    footer: element({ height: 64 }),
  };
  class Observer {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    disconnect() {}
  }
  vm.runInNewContext(source, {
    document: {
      body: {}, documentElement: root, readyState: 'complete',
      querySelector: selector => selector === '.wb-authoring' ? state.main : state.footer,
    },
    ResizeObserver: Observer, MutationObserver: Observer,
    requestAnimationFrame: callback => pending.push(callback),
    addEventListener: (event, callback) => { listeners[event] = callback; },
  });
  const flush = () => {
    let count = 0;
    while (pending.length) { pending.shift()(); assert.ok(++count < 10, 'layout must settle'); }
  };
  const mutate = () => { observers.forEach(observer => observer.callback()); flush(); };
  flush();
  return { state, root, flush, mutate, listeners };
}

test('action bar stays within the host content when sidebar width changes', () => {
  const f = fixture();
  assert.equal(f.state.footer.style.left, '228px');
  assert.equal(f.state.footer.style.width, '1212px');
  f.state.main.bounds = { left: 64, width: 1376 };
  f.mutate();
  assert.equal(f.state.footer.style.left, '64px');
  assert.equal(f.state.footer.style.width, '1376px');
});

test('wrapped mobile actions reserve their full height for content and toasts', () => {
  const f = fixture();
  f.state.main.bounds = { left: 0, width: 390 };
  f.state.footer.bounds.height = 129.25;
  f.listeners.resize(); f.flush();
  assert.equal(f.state.footer.style.width, '390px');
  assert.equal(f.state.main.style.getPropertyValue('--wb-authoring-footer-height'), '130px');
  assert.equal(f.root.style.getPropertyValue('--wb-authoring-footer-height'), '130px');
});

test('returning to a library clears reserved space and a remounted editor is measured', () => {
  const f = fixture();
  f.state.main = null; f.state.footer = null; f.mutate();
  assert.equal(f.root.style.getPropertyValue('--wb-authoring-footer-height'), '0px');
  f.state.main = element({ left: 228, width: 1000 });
  f.state.footer = element({ height: 72 }); f.mutate();
  assert.equal(f.state.main.style.getPropertyValue('--wb-authoring-footer-height'), '72px');
  f.state.footer = null; f.mutate();
  assert.equal(f.state.main.style.getPropertyValue('--wb-authoring-footer-height'), '0px');
});

test('a hidden retained iframe does not overwrite its useful width with zero', () => {
  const f = fixture();
  f.state.main.bounds = { left: 0, width: 0 }; f.mutate();
  assert.equal(f.state.footer.style.width, '1212px');
  f.state.main.bounds = { left: 0, width: 820 }; f.mutate();
  assert.equal(f.state.footer.style.width, '820px');
});
