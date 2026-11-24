/* Classroom-only suspension. Native browser timers and input behaviour stay intact. */
(() => {
  'use strict';
  if (window.SS_LIFECYCLE) return;
  const nativeTimeout = window.setTimeout.bind(window);
  const nativeClear = window.clearTimeout.bind(window);
  const nativeFrame = window.requestAnimationFrame.bind(window);
  const nativeCancelFrame = window.cancelAnimationFrame.bind(window);
  const tasks = new Map(), animations = new Set(), listeners = new Set();
  let nextId = 0, parentVisible = true, pageGone = false;
  let paused = Boolean(document.hidden), epoch = paused ? 1 : 0;
  const now = () => performance.now();

  function arm(task) {
    if (paused || !tasks.has(task.id) || task.nativeId !== null) return;
    task.started = now();
    if (task.frame) {
      task.nativeId = nativeFrame(time => {
        task.nativeId = null;
        if (paused) return;
        tasks.delete(task.id); task.callback(time);
      });
    } else {
      task.nativeId = nativeTimeout(() => {
        task.nativeId = null;
        if (paused) return;
        if (!task.interval) tasks.delete(task.id);
        else task.remaining = task.delay;
        try { task.callback(...task.args); }
        finally { if (task.interval && tasks.has(task.id)) arm(task); }
      }, task.remaining);
    }
  }
  function schedule(callback, delay, args, interval = false, frame = false) {
    if (typeof callback !== 'function') throw new TypeError('Classroom timer requires a function');
    const task = { id: ++nextId, callback, args, interval, frame,
      delay: Math.max(interval ? 1 : 0, Number(delay) || 0), nativeId: null };
    task.remaining = task.delay; tasks.set(task.id, task); arm(task); return task.id;
  }
  function clear(id) {
    const task = tasks.get(id); if (!task) return;
    if (task.nativeId !== null) (task.frame ? nativeCancelFrame : nativeClear)(task.nativeId);
    tasks.delete(id);
  }
  function freezeAnimation(animation) {
    if (animation.playState === 'running' || animation.pending) {
      animations.add(animation); animation.pause();
    }
    return animation;
  }
  function freezeAnimations() {
    if (!paused) return;
    for (const animation of document.getAnimations?.() || []) freezeAnimation(animation);
  }
  function signal() {
    const state = { paused, epoch };
    for (const listener of listeners) listener(state);
  }
  function reconcile() {
    const next = !parentVisible || document.hidden || pageGone;
    if (next === paused) return;
    paused = next;
    if (paused) {
      epoch++;
      for (const task of tasks.values()) {
        if (task.nativeId === null) continue;
        (task.frame ? nativeCancelFrame : nativeClear)(task.nativeId);
        task.nativeId = null;
        if (!task.frame) task.remaining = Math.max(0, task.remaining - (now() - task.started));
      }
      // Read running animations before the CSS pause rule changes their state.
      freezeAnimations();
      document.documentElement.dataset.ssPaused = 'true';
      signal();
    } else {
      document.documentElement.dataset.ssPaused = 'false';
      for (const animation of animations) {
        if (animation.playState === 'paused') animation.play();
      }
      animations.clear();
      signal();
      for (const task of tasks.values()) arm(task);
    }
  }
  const style = document.createElement('style');
  style.textContent = 'html[data-ss-paused="true"] *,html[data-ss-paused="true"] *::before,html[data-ss-paused="true"] *::after{animation-play-state:paused!important}';
  document.head.append(style);
  document.documentElement.dataset.ssPaused = String(paused);
  new MutationObserver(freezeAnimations).observe(document.documentElement, { childList: true, subtree: true, attributes: true });
  document.addEventListener('DOMContentLoaded', freezeAnimations);
  document.addEventListener('visibilitychange', reconcile);
  addEventListener('pagehide', () => { pageGone = true; reconcile(); });
  addEventListener('pageshow', () => { pageGone = false; reconcile(); });
  addEventListener('message', event => {
    if (event.source !== window.parent || event.origin !== location.origin) return;
    if (event.data?.type !== 'wellbeing:visibility' || typeof event.data.visible !== 'boolean') return;
    parentVisible = event.data.visible; reconcile();
  });
  // A hidden classroom must not consume shortcuts still focused inside its iframe.
  for (const type of ['click', 'keydown', 'pointerdown']) {
    document.addEventListener(type, event => {
      if (paused) { event.preventDefault(); event.stopImmediatePropagation(); }
    }, true);
  }
  window.SS_LIFECYCLE = Object.freeze({
    get paused() { return paused; },
    get epoch() { return epoch; },
    canAutoplay: token => !paused && token === epoch,
    subscribe(listener) { listeners.add(listener); listener({ paused, epoch }); return () => listeners.delete(listener); },
    setTimeout: (callback, delay, ...args) => schedule(callback, delay, args),
    setInterval: (callback, delay, ...args) => schedule(callback, delay, args, true),
    clearTimeout: clear, clearInterval: clear,
    requestAnimationFrame: callback => schedule(callback, 0, [], false, true),
    cancelAnimationFrame: clear,
    trackAnimation: animation => paused ? freezeAnimation(animation) : animation
  });
})();
