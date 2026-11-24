/* Local classroom audio. Music follows thinking pace; effects follow game events. */
(function (root) {
  'use strict';
  const base = document.currentScript?.src || location.href;
  const assets = {
    music: new URL('audio/classroom-loop.wav', base).href,
    drop: new URL('audio/card-drop.wav', base).href,
    incorrect: new URL('audio/incorrect.wav', base).href,
  };
  const rateForSeconds = seconds => 6 / Math.min(12, Math.max(3, Number(seconds) || 6));

  function create({ enabled = true, onError = () => {}, onState = () => {} } = {}) {
    const music = new Audio(assets.music);
    music.preload = 'auto';
    music.loop = true;
    music.preservesPitch = true;
    let volume = 0.5;
    music.volume = volume;
    let active = false, unlocked = false, disposed = false, context = null;
    let generation = 0, musicRevision = 0, playPending = null, effectsPending = null, unlockAttempt = 0;
    let lastIncorrect = -Infinity, reported = false, blocked = false, playing = false, lastState = '';
    const buffers = new Map(), voices = new Set();
    function publish() {
      if (disposed) return;
      const status = !enabled || volume === 0 ? 'muted' : blocked ? 'blocked' : !active ?
        (unlocked ? 'paused' : 'ready') : playing ? 'playing' : unlocked ? 'loading' : 'ready';
      const next = { status, volume }, signature = JSON.stringify(next);
      if (signature !== lastState) { lastState = signature; onState(next); }
    }
    const report = () => {
      blocked = true; publish();
      if (!disposed && !reported) { reported = true; onError('Sound could not load. Use the sound button to retry.'); }
    };
    const stopEffects = () => {
      generation++;
      for (const source of voices) { try { source.stop(); } catch {} }
      voices.clear();
    };
    const mayPlay = () => enabled && active && unlocked && !disposed && !document.hidden;
    function syncMusic() {
      if (!mayPlay()) { music.pause(); playing = false; publish(); return Promise.resolve(); }
      music.volume = volume;
      if (playPending) return playPending;
      const revision = musicRevision;
      let result, interrupted = false;
      try { result = music.play(); } catch { report(); return Promise.resolve(); }
      playPending = Promise.resolve(result).then(() => {
        if (!mayPlay()) music.pause();
        else music.volume = volume;
      }).catch(error => {
        interrupted = error?.name === 'AbortError';
        if (error?.name !== 'AbortError' && !disposed && enabled) report();
      }).finally(() => {
        playPending = null;
        publish();
        // A quick pause/resume may abort the previous play promise. Only retry
        // for a newer user/state request, never loop on an autoplay/load failure.
        if ((interrupted || music.paused) && revision !== musicRevision && mayPlay()) void syncMusic();
      });
      publish();
      return playPending;
    }
    function prepareEffects() {
      if (buffers.size === 2) return Promise.resolve();
      if (effectsPending) return effectsPending;
      effectsPending = Promise.all(['drop', 'incorrect'].map(async kind => {
        if (buffers.has(kind)) return;
        const response = await fetch(assets[kind]);
        if (!response.ok) throw new Error('Audio file unavailable');
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        if (!disposed) buffers.set(kind, buffer);
      })).finally(() => { effectsPending = null; });
      return effectsPending;
    }
    function unlock() {
      if (disposed || !enabled) return Promise.resolve('disabled');
      // Every explicit user action may resume a previously suspended context.
      // Do not let an old unresolved resume promise swallow the new gesture.
      const attempt = ++unlockAttempt;
      return (async () => {
        try {
          const AudioContext = root.AudioContext || root.webkitAudioContext;
          if (!AudioContext) throw new Error('Audio unavailable');
          if (!context) { context = new AudioContext(); context.addEventListener?.('statechange', contextChanged); }
          const resume = context.state === 'running' ? Promise.resolve() : context.resume();
          unlocked = true; blocked = false; reported = false;
          // Start audible media in this user-action call stack, never via a
          // muted prime followed by a later React effect.
          const start = syncMusic();
          await resume;
          if (disposed || attempt !== unlockAttempt) return 'disabled';
          if (context.state !== 'running') throw new Error('Audio context is suspended');
          void prepareEffects().catch(report);
          await start;
          publish();
          return reported ? 'unavailable' : 'enabled';
        } catch {
          if (!disposed && attempt === unlockAttempt) { unlocked = false; music.pause(); playing = false; stopEffects(); report(); }
          return 'unavailable';
        }
      })();
    }
    function contextChanged() {
      if (!disposed && enabled && active && context.state !== 'running') {
        unlocked = false; music.pause(); playing = false; stopEffects(); report();
      }
    }
    function play(kind) {
      if (!['drop', 'incorrect'].includes(kind) || !mayPlay() || !context) return;
      const now = performance.now();
      if (kind === 'incorrect' && now - lastIncorrect < 500) return;
      if (kind === 'incorrect') lastIncorrect = now;
      const request = generation;
      void prepareEffects().then(() => {
        if (disposed || !enabled || document.hidden || request !== generation || context.state !== 'running') return;
        const source = context.createBufferSource(), gain = context.createGain();
        source.buffer = buffers.get(kind);
        gain.gain.value = kind === 'drop' ? 0.55 : 0.45;
        source.connect(gain); gain.connect(context.destination);
        source.onended = () => { voices.delete(source); source.disconnect(); gain.disconnect(); };
        voices.add(source); source.start();
      }).catch(report);
    }
    const stop = () => { musicRevision++; active = false; music.pause(); playing = false; stopEffects(); publish(); };
    const hidden = () => { if (document.hidden) stop(); };
    const pagehide = () => stop();
    const mediaError = () => { if (enabled) report(); };
    const mediaPlaying = () => { playing = true; publish(); };
    const mediaPaused = () => { playing = false; publish(); };
    music.addEventListener('error', mediaError);
    music.addEventListener('playing', mediaPlaying);
    music.addEventListener('pause', mediaPaused);
    music.addEventListener('waiting', mediaPaused);
    document.addEventListener('visibilitychange', hidden);
    root.addEventListener('pagehide', pagehide);
    return {
      unlock, play, stop,
      setPace(seconds) { music.playbackRate = rateForSeconds(seconds); },
      setVolume(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return;
        volume = Math.max(0, Math.min(1, number)); music.volume = volume; publish();
      },
      setRunning(value, { finishEffect = false } = {}) {
        if (active !== (value === true)) musicRevision++;
        active = value === true;
        if (!active && !finishEffect) stopEffects();
        void syncMusic();
      },
      setEnabled(value) {
        if (enabled !== (value === true)) musicRevision++;
        enabled = value === true;
        if (!enabled) { music.pause(); playing = false; stopEffects(); }
        else { reported = false; blocked = false; void syncMusic(); }
        publish();
      },
      restart() { musicRevision++; stopEffects(); music.pause(); music.currentTime = 0; lastIncorrect = -Infinity; },
      dispose() {
        if (disposed) return;
        disposed = true; stop();
        document.removeEventListener('visibilitychange', hidden);
        root.removeEventListener('pagehide', pagehide);
        music.removeEventListener('error', mediaError);
        music.removeEventListener('playing', mediaPlaying);
        music.removeEventListener('pause', mediaPaused);
        music.removeEventListener('waiting', mediaPaused);
        music.removeAttribute('src'); music.load(); buffers.clear();
        if (context) { context.removeEventListener?.('statechange', contextChanged); void context.close().catch(() => {}); }
      },
    };
  }
  root.MMClassroomAudio = { create, rateForSeconds };
})(window);
