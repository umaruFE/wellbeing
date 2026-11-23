(function (root, factory) {
  'use strict';
  const commonJS = typeof module === 'object' && module.exports;
  const api = factory(commonJS ? require('./word-tools.js') : root.DoodleWordTools,
    commonJS ? require('./classroom-wordbank.js') : root.DoodleClassroomWordBank,
    commonJS ? require('./word-images.js') : root.DoodleWordImages);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DoodleRuntime = api.createRuntime(root);
})(typeof window === 'object' ? window : globalThis, function (wordTools, wordBankCards, imageTools) {
  'use strict';

  const MESSAGE_TYPE = 'doodle-runtime-v1';
  // Original Word Bank/settings dialogs use form submit handlers. Allow their
  // events, while CSP form-action 'none' still blocks actual form navigation.
  // Omitting allow-same-origin keeps the classroom's opaque storage boundary.
  const SANDBOX = 'allow-scripts allow-modals allow-forms';
  const KINDS = ['case', 'preview', 'classroom'];

  function runtimeError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function normalizeConfig(input) {
    if (!input || typeof input !== 'object') throw runtimeError('INVALID_CONFIG', '没有可启动的涂鸦活动配置。');
    const text = (value, name) => {
      if (typeof value !== 'string' || !value.trim()) throw runtimeError('INVALID_CONFIG', name + '不能为空。');
      return value.trim();
    };
    const id = text(input.id, '活动标识');
    const title = text(input.title, '活动名称');
    if (!Array.isArray(input.words) || !input.words.length) throw runtimeError('INVALID_CONFIG', '请先添加至少一个目标词。');
    const words = input.words.map(word => text(word, '目标词'));
    if (!['solo', 'pk'].includes(input.mode)) throw runtimeError('INVALID_CONFIG', '请选择单人或 PK 模式。');
    if (![0, 60, 120].includes(input.practiceSeconds)) throw runtimeError('INVALID_CONFIG', '单人练习时长无效。');
    if (!['word', 'sentence', 'describe'].includes(input.level)) throw runtimeError('INVALID_CONFIG', '语言练习层级无效。');
    if (typeof input.quiet !== 'boolean') throw runtimeError('INVALID_CONFIG', '安静模式设置无效。');
    if (![1, 3, 5, 'all'].includes(input.rounds)) throw runtimeError('INVALID_CONFIG', 'PK 回合数无效。');
    const wordImages = imageTools.normalize(input.wordImages, words);
    Object.values(wordImages).forEach(Object.freeze);
    return Object.freeze({id, title, words: Object.freeze(words), mode: input.mode,
      wordImages: Object.freeze(wordImages),
      practiceSeconds: input.practiceSeconds, level: input.level, quiet: input.quiet, rounds: input.rounds});
  }

  function serializeForScript(value) {
    return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, character => ({
      '<': '\\u003c', '>': '\\u003e', '&': '\\u0026', '\u2028': '\\u2028', '\u2029': '\\u2029'
    })[character]);
  }

  // Deliberately does not read a browser Storage object, even to copy old data.
  function createMemoryStorage(seed) {
    const values = new Map(Object.entries(seed || {}).map(([key, value]) => [String(key), String(value)]));
    return Object.freeze({
      get length() { return values.size; },
      key(index) { return Array.from(values.keys())[Number(index)] ?? null; },
      getItem(key) { return values.has(String(key)) ? values.get(String(key)) : null; },
      setItem(key, value) { values.set(String(key), String(value)); },
      removeItem(key) { values.delete(String(key)); },
      clear() { values.clear(); }
    });
  }

  // Runs before every original game script, inside an opaque sandboxed iframe.
  function classroomBootstrap(config, kind, channel, makeStorage) {
    'use strict';
    const messageType = 'doodle-runtime-v1';
    const state = {ready: false, failed: false, stopped: false, hidden: false, previousSound: null};
    const send = (status, detail) => window.parent.postMessage({type: messageType, channel, status, ...detail}, '*');
    const cancelSpeech = () => { try { window.speechSynthesis?.cancel(); } catch (_) {} };
    const fail = message => {
      if (state.failed || state.stopped) return;
      state.failed = true;
      cancelSpeech();
      send('error', {message: String(message || '课堂初始化失败。').slice(0, 300)});
    };
    function pause() {
      if (!state.ready || state.failed || state.stopped) return;
      try {
        if (typeof duel !== 'undefined' && duel && typeof pauseDuel === 'function') pauseDuel('The activity is hidden. Press Resume to continue.');
        else if (typeof pausePractice === 'function') pausePractice();
      } catch (error) { fail(error.message); }
      cancelSpeech();
    }
    function setVisible(visible) {
      const hidden = !visible;
      if (hidden && !state.hidden && state.ready && typeof soundOn !== 'undefined') {
        state.previousSound = soundOn;
        soundOn = false;
      }
      if (!hidden && state.hidden && state.previousSound !== null && typeof soundOn !== 'undefined') {
        soundOn = state.previousSound;
        state.previousSound = null;
      }
      state.hidden = hidden;
      if (hidden) pause(); // Showing the frame never resumes a round or speaks.
    }
    function stop() {
      if (state.stopped) return;
      pause();
      cancelSpeech();
      state.stopped = true;
    }
    window.addEventListener('error', event => fail(event.message));
    window.addEventListener('unhandledrejection', event => fail(event.reason?.message || '课堂异步操作失败。'));
    window.addEventListener('pagehide', stop);
    window.addEventListener('message', event => {
      const data = event.data;
      if (event.source !== window.parent || !data || data.type !== messageType || data.channel !== channel) return;
      if (data.command === 'visibility') setVisible(data.visible === true);
      if (data.command === 'destroy') stop();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) setVisible(false); });
    try {
      Object.values(config.wordImages).forEach(Object.freeze);
      Object.defineProperty(window, '__doodleWordImageSet', {value: Object.freeze({
        id: config.id, images: Object.freeze(config.wordImages)
      }), configurable: false});
      const prefix = 'dg_english_v13_';
      const memory = makeStorage({
        [prefix + 'lessons']: JSON.stringify([{id: config.id, name: config.title, words: config.words, wordImages: config.wordImages}]),
        [prefix + 'activeLesson']: config.id,
        [prefix + 'stats']: '{}',
        [prefix + 'buddy']: '0',
        [prefix + 'classroom_preferences_v1']: JSON.stringify({practiceSeconds: config.practiceSeconds,
          level: config.level, quiet: config.quiet, scenario: 'success'})
      });
      Object.defineProperty(window, 'localStorage', {value: memory, configurable: false});
      Object.defineProperty(window, 'sessionStorage', {value: makeStorage(), configurable: false});
      if (window.localStorage !== memory) throw new Error('无法建立课堂存储隔离。');
    } catch (error) { fail(error.message); }
    Object.defineProperty(window, '__doodleRuntimeBridge', {value: Object.freeze({
      boot() {
        if (state.failed || state.stopped || state.ready) return;
        try {
          if (typeof curLesson !== 'function' || typeof openDuelSetup !== 'function' ||
              typeof paintDuelSetupSource !== 'function' || typeof createDuelMatch !== 'function') {
            throw new Error('课堂文件不包含所需的 V1.7.2 启动接口。');
          }
          const lesson = curLesson();
          if (!lesson || lesson.id !== config.id || JSON.stringify(lesson.words) !== JSON.stringify(config.words)) {
            throw new Error('课堂目标词未正确载入，请返回重试。');
          }
          const effectiveRounds = config.rounds === 'all' ? config.words.length : Math.min(config.rounds, config.words.length);
          if (config.mode === 'pk') {
            const preset = {words: config.words.slice(), lesson: config.title, previewWords: false};
            openDuelSetup(preset, false, false);
            paintDuelSetupSource(preset, effectiveRounds);
            createDuelMatch();
            if (typeof duel === 'undefined' || !duel || duel.order.length !== effectiveRounds) {
              throw new Error('PK 回合未正确载入，请返回重试。');
            }
          }
          state.ready = true;
          if (state.hidden) {
            state.hidden = false;
            setVisible(false);
          }
          send('ready', {kind, mode: config.mode, wordCount: config.words.length, effectiveRounds});
        } catch (error) { fail(error.message); }
      }
    }), configurable: false});
  }

  function buildSrcdoc(source, input, kind, channel, baseURL) {
    const config = normalizeConfig(input);
    if (!KINDS.includes(kind)) throw runtimeError('INVALID_KIND', '课堂启动类型无效。');
    if (typeof source !== 'string' || !/<head(?:\s[^>]*)?>/i.test(source) || !/<\/body\s*>/i.test(source) || !/<script\b/i.test(source)) {
      throw runtimeError('INVALID_SOURCE', '课堂文件不完整，请重新加载。');
    }
    const imageOrigins = new Set();
    for (const asset of Object.values(config.wordImages)) {
      if (!asset.src || asset.src.startsWith('data:')) continue;
      try {
        const url = new URL(asset.src, baseURL);
        if (/^https?:\/\/[\w.:[\]-]+$/.test(url.origin)) imageOrigins.add(url.origin);
      } catch (_) { /* Invalid or unavailable image sources fall back to their alt text. */ }
    }
    const imageSources = [...imageOrigins].map(origin => ` ${origin}`).join('');
    const csp = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:${imageSources}; font-src data:; media-src data: blob:; connect-src 'none'; base-uri 'none'; form-action 'none'">`;
    const bootstrap = '<script>(' + classroomBootstrap.toString() + ')(' +
      [serializeForScript(config), serializeForScript(kind), serializeForScript(channel), createMemoryStorage.toString()].join(',') + ');</script>';
    if (typeof wordTools?.factory !== 'function' || typeof wordBankCards?.factory !== 'function' || typeof imageTools?.factory !== 'function') {
      throw runtimeError('MISSING_WORD_CARDS', '课堂词卡组件未加载，请刷新后重试。');
    }
    const enhancements = 'window.DoodleWordTools=(' + wordTools.factory.toString() + ')();' +
      'window.DoodleWordImages=(' + imageTools.factory.toString() + ')();' +
      'window.DoodleClassroomWordBank=(' + wordBankCards.factory.toString() + ')(window.DoodleWordImages);' +
      'window.DoodleClassroomWordBank.install(window.DoodleWordTools);';
    return source.replace(/<head(?:\s[^>]*)?>/i, match => match + csp + bootstrap)
      .replace(/<\/body\s*>/i, '<script>' + enhancements + 'window.__doodleRuntimeBridge.boot();</script></body>');
  }

  function createRuntime(environment) {
    const env = environment;
    const doc = env.document;
    const scriptURL = doc?.currentScript?.src || doc?.baseURI;
    const sourceURL = scriptURL ? new URL('classroom-v1.7.2.html', scriptURL).href : 'classroom-v1.7.2.html';
    const defer = env.queueMicrotask ? callback => env.queueMicrotask(callback) : callback => Promise.resolve().then(callback);
    function open(options) {
      if (!options || !options.host || typeof options.host.appendChild !== 'function') {
        throw runtimeError('INVALID_HOST', '缺少课堂挂载容器。');
      }
      const {host, onReady, onError} = options;
      const kind = options.kind;
      const controller = new (env.AbortController || AbortController)();
      const channel = env.crypto?.randomUUID?.() || 'doodle-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
      let destroyed = false, ready = false, failed = false, frame = null, timer = null, observer = null, visible = true;
      let config, configError;
      try { config = normalizeConfig(options.config); } catch (error) { configError = error; }
      const cleanups = [];
      function post(command, extra) {
        try { frame?.contentWindow?.postMessage({type: MESSAGE_TYPE, channel, command, ...extra}, '*'); } catch (_) {}
      }
      function cleanup() {
        controller.abort();
        if (timer !== null) env.clearTimeout(timer);
        timer = null;
        observer?.disconnect(); observer = null;
        while (cleanups.length) cleanups.pop()();
      }
      function removeFrame() {
        if (!frame) return;
        post('destroy');
        // Speech queues can outlive their iframe in browsers. Cancel from both
        // sides; pagehide in the child also cancels and pauses the current round.
        try { env.speechSynthesis?.cancel(); } catch (_) {}
        frame?.remove();
        frame = null;
      }
      function fail(error) {
        if (destroyed || failed) return;
        failed = true;
        cleanup(); removeFrame();
        if (typeof onError === 'function') onError(error);
      }
      function setVisible(next) {
        if (destroyed) return;
        visible = next === true;
        checkVisibility();
      }
      const handle = Object.freeze({
        destroy() {
          if (destroyed) return;
          destroyed = true;
          cleanup(); removeFrame();
        },
        setVisible,
        pause() { setVisible(false); }
      });
      function listen(target, name, listener) {
        target.addEventListener(name, listener);
        cleanups.push(() => target.removeEventListener(name, listener));
      }
      function checkVisibility() {
        const hidden = doc.hidden || host.hidden || !!host.closest?.('[hidden], [aria-hidden="true"]') ||
          (typeof host.getClientRects === 'function' && host.getClientRects().length === 0);
        post('visibility', {visible: visible && !hidden});
      }
      defer(async () => {
        if (destroyed) return;
        try {
          if (configError) throw configError;
          if (!KINDS.includes(kind)) throw runtimeError('INVALID_KIND', '课堂启动类型无效。');
          const fetcher = env.fetch?.bind(env);
          if (!fetcher) throw runtimeError('FETCH_UNAVAILABLE', '当前浏览器无法加载课堂文件。');
          const response = await fetcher(sourceURL, {signal: controller.signal, credentials: 'same-origin', cache: 'no-cache'});
          if (destroyed) return;
          if (!response.ok) throw runtimeError('FETCH_FAILED', '课堂文件加载失败（' + response.status + '），请重试。');
          const source = await response.text();
          if (destroyed) return;
          const srcdoc = buildSrcdoc(source, config, kind, channel, sourceURL);
          frame = doc.createElement('iframe');
          frame.className = 'doodle-runtime-frame';
          frame.title = config.title + (kind === 'classroom' ? ' · 涂鸦课堂' : ' · 涂鸦预览');
          frame.setAttribute('sandbox', SANDBOX);
          frame.setAttribute('referrerpolicy', 'no-referrer');
          frame.setAttribute('allow', 'fullscreen');
          frame.setAttribute('allowfullscreen', '');
          frame.style.cssText = 'display:block;width:100%;height:100%;min-height:0;border:0;background:#fffdf4;';
          listen(env, 'message', event => {
            const data = event.data;
            if (destroyed || !frame || event.source !== frame.contentWindow || !data ||
                data.type !== MESSAGE_TYPE || data.channel !== channel) return;
            if (data.status === 'error') {
              fail(runtimeError('CLASSROOM_ERROR', data.message || '课堂启动失败，请重试。'));
            } else if (data.status === 'ready' && !ready && !failed) {
              ready = true;
              if (timer !== null) env.clearTimeout(timer);
              timer = null;
              checkVisibility();
              if (typeof onReady === 'function') onReady(Object.freeze({kind, mode: config.mode,
                wordCount: config.words.length,
                effectiveRounds: config.rounds === 'all' ? config.words.length : Math.min(config.rounds, config.words.length)}));
            }
          });
          listen(doc, 'visibilitychange', checkVisibility);
          if (env.MutationObserver) {
            observer = new env.MutationObserver(checkVisibility);
            for (let node = host; node; node = node.parentElement) {
              observer.observe(node, {attributes: true, attributeFilter: ['hidden', 'class', 'style', 'aria-hidden']});
            }
          }
          timer = env.setTimeout(() => fail(runtimeError('START_TIMEOUT', '课堂启动超时，请重试。')), 15000);
          frame.srcdoc = srcdoc;
          host.appendChild(frame);
          checkVisibility();
        } catch (error) {
          if (destroyed || error?.name === 'AbortError') return;
          fail(error?.code ? error : runtimeError('FETCH_FAILED', '课堂无法加载，请检查本地服务后重试。'));
        }
      });
      return handle;
    }
    return Object.freeze({open});
  }

  return Object.freeze({createRuntime, normalizeConfig, serializeForScript, createMemoryStorage, buildSrcdoc, SANDBOX});
});
