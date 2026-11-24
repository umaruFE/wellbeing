/* Local live view only: video capture is never recorded, uploaded or used for answers. */
(function (root) {
  'use strict';

  function cameraError(error) {
    switch (error?.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
      case 'SecurityError':
        return '未获摄像头权限，请在浏览器中允许后重试。';
      case 'NotFoundError':
      case 'DevicesNotFoundError':
        return '未找到摄像头，请连接摄像头后重试。';
      case 'NotReadableError':
      case 'TrackStartError':
      case 'AbortError':
        return '摄像头暂时无法使用，请关闭其他占用摄像头的应用后重试。';
      case 'OverconstrainedError':
        return '当前摄像头无法提供画面，请尝试其他摄像头。';
      default:
        return '摄像头未能开启，请检查设备后重试。';
    }
  }

  function create({ onState = () => {}, acquireStream = null } = {}) {
    let state = { status: 'off', message: '摄像头未开启' };
    let stream = null, video = null, pending = null, generation = 0, disposed = false;
    let removeMediaListeners = () => {};
    const publish = (status, message) => {
      const changed = status !== state.status || message !== state.message;
      state = { status, message };
      if (!disposed && changed) onState({ ...state });
    };
    const stopTracks = value => {
      for (const track of value?.getTracks?.() || []) {
        try { if (track.readyState !== 'ended') track.stop(); } catch {}
      }
    };
    function detach() {
      if (video) {
        try { video.pause(); } catch {}
        try { video.srcObject = null; } catch {}
      }
      video = null;
    }
    function release() {
      removeMediaListeners();
      removeMediaListeners = () => {};
      detach();
      stopTracks(stream);
      stream = null;
    }
    function finish(status = 'off', message = '摄像头已关闭') {
      generation++;
      pending?.cancel();
      pending = null;
      release();
      publish(status, message);
    }
    const stop = () => finish();

    function start(element) {
      if (disposed) return Promise.resolve(false);
      if (document.hidden) {
        finish('off', '页面已离开，摄像头已关闭。');
        return Promise.resolve(false);
      }
      if (!element || typeof element.play !== 'function' || element.isConnected === false) {
        finish('error', '摄像头预览尚未就绪，请重试。');
        return Promise.resolve(false);
      }
      if (root.isSecureContext === false) {
        finish('error', '请通过 HTTPS 或本机地址打开页面后使用摄像头。');
        return Promise.resolve(false);
      }
      const media = root.navigator?.mediaDevices;
      if (typeof acquireStream !== 'function' && (!media || typeof media.getUserMedia !== 'function')) {
        finish('error', '当前浏览器不支持摄像头，请换用支持摄像头的浏览器。');
        return Promise.resolve(false);
      }
      if (pending) {
        if (pending.element === element) return pending.promise;
        const requestedGeneration = generation;
        return pending.promise.then(opened => opened && generation === requestedGeneration ? start(element) : false);
      }
      if (stream && video === element && state.status === 'live') return Promise.resolve(true);

      const revision = ++generation;
      let resolveResult;
      const operation = { element, promise: new Promise(resolve => { resolveResult = resolve; }), cancel: () => resolveResult(false) };
      pending = operation;
      publish('requesting', '正在开启摄像头，请允许浏览器访问。');
      const current = () => !disposed && revision === generation && !document.hidden && element.isConnected !== false;
      let playback = false, acquisition;
      try {
        // This call stays in the explicit start action. Neither creation nor visibility requests access.
        // A caller may provide its own independently owned clone of a live stream.
        // This controller always releases every track it acquires.
        const constraints = {
          audio: false,
          video: { facingMode: { ideal: 'user' }, width: { ideal: 640 }, height: { ideal: 360 } },
        };
        acquisition = stream || (typeof acquireStream === 'function' ? acquireStream(constraints) : media.getUserMedia(constraints));
      } catch (error) { acquisition = Promise.reject(error); }

      Promise.resolve(acquisition).then(async candidate => {
        if (!current()) {
          stopTracks(candidate);
          if (revision === generation && !disposed) finish();
          return false;
        }
        if (!candidate?.getVideoTracks?.().some(track => track.readyState !== 'ended')) {
          stopTracks(candidate);
          throw Object.assign(new Error('No live video track'), { name: 'NotFoundError' });
        }
        removeMediaListeners();
        detach();
        stream = candidate;
        video = element;
        const interrupted = () => {
          if (stream === candidate && revision === generation) finish('error', '摄像头已断开，请重新连接后开启。');
        };
        const playbackError = () => {
          if (stream === candidate && revision === generation) finish('error', '画面播放中断，请重新开启摄像头。');
        };
        const tracks = candidate.getVideoTracks();
        for (const track of tracks) track.addEventListener('ended', interrupted);
        element.addEventListener('error', playbackError);
        removeMediaListeners = () => {
          for (const track of tracks) track.removeEventListener('ended', interrupted);
          element.removeEventListener('error', playbackError);
        };
        element.muted = true;
        element.defaultMuted = true;
        element.playsInline = true;
        element.autoplay = true;
        element.srcObject = candidate;
        playback = true;
        await element.play();
        if (!current() || stream !== candidate || video !== element) {
          if (stream === candidate && revision === generation && !disposed) finish();
          else stopTracks(candidate);
          return false;
        }
        publish('live', '摄像头已开启');
        return true;
      }).catch(error => {
        if (revision === generation && !disposed) {
          release();
          publish('error', playback ? '画面播放未能开始，请重新开启摄像头。' : cameraError(error));
        }
        return false;
      }).then(result => {
        if (pending === operation) pending = null;
        resolveResult(result);
      });
      return operation.promise;
    }

    const onHidden = () => { if (document.hidden) finish('off', '页面已离开，摄像头已关闭。'); };
    const onPageHide = () => finish('off', '页面已离开，摄像头已关闭。');
    document.addEventListener('visibilitychange', onHidden);
    root.addEventListener('pagehide', onPageHide);
    const dispose = () => {
      if (disposed) return;
      disposed = true;
      finish();
      document.removeEventListener('visibilitychange', onHidden);
      root.removeEventListener('pagehide', onPageHide);
    };
    onState({ ...state });
    return { start, stop, dispose, getState: () => ({ ...state }) };
  }
  root.MMClassroomCamera = { create };
})(window);
