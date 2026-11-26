/* Host boundary for the frozen V6 documents. Business controllers remain owners
 * of drafts, publication, classroom sessions, and their leave checks. */
(function () {
  'use strict';

  const root = window;
  const doc = document;
  const allowedModules = new Set(['song', 'music', 'yoga', 'speak', 'doodle', 'move-match']);
  const readySelectors = { speak: '.shell', doodle: '.doodle-shell', 'move-match': '.mm-shell' };
  const moduleId = doc.documentElement.dataset.hostModule;
  const requestedScope = new URLSearchParams(root.location.search).get('scope');
  root.WB_WEB_SCOPE = /^[a-z0-9_-]{1,128}$/.test(requestedScope || '') ? requestedScope : 'local';

  function onLibraryKeyDown(event) {
    const tab = event.target.closest?.('.wb-library-tabs [role="tab"]');
    if (!tab || event.isComposing || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = Array.from(tab.closest('.wb-library-tabs').querySelectorAll('[role="tab"]:not(:disabled)'));
    const current = tabs.indexOf(tab);
    if (current < 0) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1
      : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    const control = tabs[next];
    control.click();
    (doc.getElementById(control.id) || control).focus({ preventScroll: true });
  }

  let hostVisible = true;
  let disposed = false;
  let loaded = false;
  let leavePromise = null;
  let speakNeedsResume = false;
  let resumeRequested = false;
  let resumePanel = null;
  let resumeObserver = null;
  const origin = root.location.origin;
  const visible = () => hostVisible && !doc.hidden && !disposed;

  function ready() {
    const app = doc.getElementById('app');
    return !disposed && loaded && allowedModules.has(moduleId)
      && !!app?.childElementCount
      && (!readySelectors[moduleId] || !!app.querySelector(readySelectors[moduleId]))
      && typeof root.WBPrepareModuleSwitch === 'function';
  }

  function requestModule(nextModule) {
    if (nextModule === 'classification') nextModule = 'move-match';
    if (disposed || !allowedModules.has(nextModule)) return Promise.resolve(false);
    if (nextModule === moduleId) return Promise.resolve(true);
    if (root.parent === root || !origin || origin === 'null') return Promise.resolve(false);
    root.parent.postMessage({ type: 'wellbeing:module', module: nextModule }, origin);
    // This only acknowledges the request. The React host owns permission checks,
    // the current module's leave check, and the actual route change.
    return Promise.resolve(true);
  }

  // The original music recorder checks this before advancing its demonstration
  // timer. A hidden host must therefore behave like another module being open.
  root.WBModules = {
    isModuleOpen: () => !visible(),
    getActiveModule: () => moduleId,
    requestModule,
    openSong: () => requestModule('song'),
    openYoga: () => requestModule('yoga'),
    showMusic: () => requestModule('music'),
    openSpeak: () => requestModule('speak'),
    openDoodle: () => requestModule('doodle'),
    openMoveMatch: () => requestModule('move-match'),
    openClassification: () => requestModule('move-match'),
  };

  function persistMusicClassroom() {
    if (moduleId !== 'music' || typeof root.persistClassSession !== 'function') return true;
    try {
      return root.persistClassSession() === true;
    } catch (error) {
      console.warn('音乐棚课堂进度未能保存，当前页面应继续保留。', error);
      return false;
    }
  }

  function prepareLeave() {
    if (disposed || !ready()) return Promise.resolve(false);
    if (leavePromise) return leavePromise;
    leavePromise = Promise.resolve().then(async () => {
      try {
        const accepted = await root.WBPrepareModuleSwitch.call(root);
        if (accepted !== true) return false;
        // V6's music guard saves drafts, while its classroom is normally kept
        // alive by the original bridge. Persist that session before host leave.
        return persistMusicClassroom();
      } catch (error) {
        console.warn('模块离开检查未完成，当前页面应继续保留。', error);
        return false;
      } finally {
        leavePromise = null;
      }
    });
    return leavePromise;
  }

  function pauseMedia(target, release) {
    try {
      for (const media of target.document.querySelectorAll('audio, video')) {
        media.pause();
        if (release && media.srcObject?.getTracks) {
          for (const track of media.srcObject.getTracks()) track.stop();
        }
      }
      target.speechSynthesis?.cancel();
      for (const frame of target.document.querySelectorAll('iframe')) {
        try {
          const child = frame.contentWindow;
          if (!child) continue;
          if (release) child.StarlightPreview?.dispose();
          pauseMedia(child, release);
        } catch (_) {
          // Only same-origin module previews are part of this adapter's scope.
        }
      }
    } catch (_) {
      // A navigating document may become unavailable while its host is leaving.
    }
  }

  function pause() {
    if (typeof root.WBPauseForModuleSwitch === 'function') {
      try { root.WBPauseForModuleSwitch(); }
      catch (error) { console.warn('模块暂停接口未完成，将继续停止可访问的媒体。', error); }
    }
    pauseMedia(root, false);
  }

  function hasSpeakGame() {
    if (moduleId !== 'speak') return false;
    const hasSource = frame => {
      const source = frame?.getAttribute('src');
      return !!source && source !== 'about:blank';
    };
    return hasSource(doc.getElementById('inline-game'))
      || (doc.getElementById('player')?.open && hasSource(doc.getElementById('player-frame')));
  }

  function requestSpeakResume() {
    if (disposed || !visible() || root.parent === root || !origin || origin === 'null') return;
    resumeRequested = true;
    root.parent.postMessage({ type: 'wellbeing:resume', module: 'speak' }, origin);
  }

  function removeResumePanel() {
    resumePanel?.remove();
    resumePanel = null;
  }

  function syncSpeakResume() {
    if (moduleId !== 'speak' || disposed) return;
    if (speakNeedsResume && !hasSpeakGame()) {
      speakNeedsResume = false;
      resumeRequested = false;
      // The teacher may close the paused game instead. Restore the module's
      // visibility via its real parent before another game is opened.
      if (visible()) requestSpeakResume();
    }
    if (!speakNeedsResume || !visible() || !doc.body) {
      removeResumePanel();
      return;
    }
    const player = doc.getElementById('player');
    const panelHost = player?.open ? player : doc.body;
    if (resumePanel) {
      if (resumePanel.parentNode !== panelHost) panelHost.appendChild(resumePanel);
      return;
    }
    resumePanel = doc.createElement('div');
    resumePanel.id = 'wb-host-resume';
    resumePanel.className = 'wb-host-resume';
    resumePanel.setAttribute('role', 'status');
    const copy = doc.createElement('span');
    copy.textContent = '活动已暂停';
    const button = doc.createElement('button');
    button.type = 'button';
    button.textContent = '继续活动';
    button.addEventListener('click', requestSpeakResume);
    resumePanel.append(copy, button);
    panelHost.appendChild(resumePanel);
  }

  function rememberSpeakPause() {
    if (hasSpeakGame()) speakNeedsResume = true;
    resumeRequested = false;
  }

  function setVisible(nextVisible) {
    if (disposed) return;
    if (nextVisible !== true) rememberSpeakPause();
    hostVisible = nextVisible === true;
    doc.documentElement.dataset.hostVisible = String(hostVisible);
    if (!visible()) pause();
    syncSpeakResume();
    // Deliberately do not resume any media when the module becomes visible.
    // React also posts wellbeing:visibility to the iframe, with the real parent
    // as event.source, so the unchanged song/yoga controllers pause their audio.
  }

  function onHostMessage(event) {
    if (root.parent === root || event.source !== root.parent || event.origin !== origin) return;
    const data = event.data;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return;
    if (data.type !== 'wellbeing:visibility' || typeof data.visible !== 'boolean') return;
    if (moduleId === 'speak' && data.visible && speakNeedsResume && hasSpeakGame()) {
      if (!resumeRequested) {
        // Registered before the original module listener. Keep its classroom
        // timers frozen until the teacher requests a real-parent resume reply.
        event.stopImmediatePropagation();
        setVisible(true);
        return;
      }
      speakNeedsResume = false;
      resumeRequested = false;
    }
    if (moduleId === 'speak' && data.visible && !speakNeedsResume) resumeRequested = false;
    setVisible(data.visible);
  }

  function onModuleClick(event) {
    const clear = event.target?.closest?.('[data-wb-clear-search]');
    const input = clear?.closest?.('.library-home')?.querySelector('.wb-library-search input');
    if (input) {
      input.value = '';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus({ preventScroll: true });
      return;
    }
    const trigger = event.target?.closest?.('[data-action]');
    if (!trigger) return;
    const action = trigger.dataset.action;
    const match = /^(?:open|switch)-(song|music|yoga|speak|doodle|move-match|classification)$/.exec(action);
    if (action !== 'module' && !match) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (trigger.disabled || trigger.getAttribute('aria-disabled') === 'true') return;
    void requestModule(action === 'module' ? trigger.dataset.module : match[1]);
  }

  function onVisibilityChange() {
    if (!visible()) { rememberSpeakPause(); pause(); }
    syncSpeakResume();
  }

  function onPageHide() {
    persistMusicClassroom();
    pause();
  }

  function dispose() {
    if (disposed) return;
    persistMusicClassroom();
    hostVisible = false;
    disposed = true;
    resumeObserver?.disconnect();
    removeResumePanel();
    pause();
    pauseMedia(root, true);
    root.YogaMusicFiles?.release();
    doc.removeEventListener('click', onModuleClick, true);
    doc.removeEventListener('keydown', onLibraryKeyDown);
    doc.removeEventListener('visibilitychange', onVisibilityChange);
    root.removeEventListener('message', onHostMessage);
    root.removeEventListener('pagehide', onPageHide);
  }

  root.WBWebModule = { module: moduleId, ready, prepareLeave, setVisible, dispose };
  doc.addEventListener('click', onModuleClick, true);
  doc.addEventListener('keydown', onLibraryKeyDown);
  doc.addEventListener('visibilitychange', onVisibilityChange);
  root.addEventListener('message', onHostMessage);
  root.addEventListener('pagehide', onPageHide);
  const onReady = () => {
    if (disposed) return;
    loaded = true;
    if (!visible()) pause();
    if (moduleId === 'speak' && typeof root.MutationObserver === 'function' && doc.body) {
      resumeObserver = new root.MutationObserver(syncSpeakResume);
      resumeObserver.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['open', 'src'] });
    }
    syncSpeakResume();
  };
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', onReady, { once: true });
  else onReady();
})();
