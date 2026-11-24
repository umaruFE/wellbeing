/* Real, local pose checks for the Moves dialog only. Never submits game answers. */
(function (root) {
  'use strict';

  const scriptURL = document.currentScript?.src || new URL('pose-tester.js', root.location.href).href;
  const localURL = path => new URL(path, scriptURL).href;
  const HOLD_MS = 600, FRAME_INTERVAL = 100, MAX_FRAME_GAP = 350;

  async function createLocalDetector() {
    const vision = await import(localURL('./vendor/tasks-vision/vision_bundle.mjs'));
    const files = await vision.FilesetResolver.forVisionTasks(localURL('./vendor/tasks-vision/wasm'));
    return vision.PoseLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetPath: localURL('./models/pose_landmarker_lite.task'), delegate: 'CPU' },
      runningMode: 'VIDEO', numPoses: 2,
      minPoseDetectionConfidence: 0.6, minPosePresenceConfidence: 0.6,
      minTrackingConfidence: 0.6, outputSegmentationMasks: false,
    });
  }

  function create({ onState = () => {}, onLandmarks = () => {}, acquireStream,
    createDetector = createLocalDetector, modelTimeoutMs = 25000 } = {}) {
    let state = { status: 'idle', message: '点击测试，跟随示意图做动作。', progress: 0, cameraLive: false };
    let active = null, disposed = false;
    const publish = (status, message, progress = 0, cameraLive = false) => {
      const next = { status, message, progress, cameraLive };
      const changed = Object.keys(next).some(key => next[key] !== state[key]);
      state = next;
      if (!disposed && changed) onState({ ...state });
    };
    const closeDetector = detector => { try { detector?.close?.(); } catch {} };
    function release() {
      const previous = active;
      active = null;
      if (previous) {
        root.cancelAnimationFrame(previous.frame);
        root.clearTimeout(previous.timeout);
        previous.resolveStart?.(false);
        previous.resolveStart = null;
        closeDetector(previous.detector);
      }
      camera?.stop();
      if (!disposed) onLandmarks(null);
    }
    function finish(status, message) {
      release();
      publish(status, message, status === 'success' ? 1 : 0, false);
    }
    const camera = root.MMClassroomCamera?.create({
      acquireStream,
      onState(value) {
        if (!active) return;
        if (value.status === 'error') finish('error', value.message);
        else if (value.status === 'off') finish('stopped', value.message || '测试已停止。');
      },
    });
    function resetHold(run) {
      run.holdSince = null;
      run.matches = 0;
    }
    function schedule(run) {
      run.frame = root.requestAnimationFrame(now => inspectFrame(run, now));
    }
    function inspectFrame(run, now) {
      if (disposed || active !== run) return;
      const video = run.video;
      if (document.hidden || video.isConnected === false) {
        finish('stopped', '页面已离开，动作测试已停止。');
        return;
      }
      if (now - run.lastAttempt < FRAME_INTERVAL) { schedule(run); return; }
      run.lastAttempt = now;
      if (video.readyState < 2 || !video.videoWidth || !video.videoHeight || video.currentTime === run.lastVideoTime) {
        if (run.lastSample !== null && now - run.lastSample > MAX_FRAME_GAP) {
          resetHold(run);
          publish('tracking', '等待新的摄像头画面，请保持在画面内。', 0, true);
        }
        schedule(run);
        return;
      }
      if (run.lastSample !== null && now - run.lastSample > MAX_FRAME_GAP) resetHold(run);
      run.lastVideoTime = video.currentTime;
      run.lastSample = now;
      try {
        // detectForVideo is synchronous; never overlap inferences or count a frame twice.
        const result = run.detector.detectForVideo(video, now);
        if (active !== run || disposed) return;
        const people = result?.landmarks || [];
        const landmarks = people.length === 1 ? people[0] : null;
        onLandmarks(landmarks);
        const answer = people.length > 1
          ? { matched: false, message: '画面中请只保留一位同学。' }
          : root.MMClassroomPoseClassifier.evaluate(landmarks, {
            ...run.target, aspectRatio: video.videoWidth / video.videoHeight,
          });
        if (!answer.matched) {
          resetHold(run);
          publish('tracking', answer.message, 0, true);
        } else {
          if (run.holdSince === null) run.holdSince = now;
          run.matches++;
          const progress = Math.min(1, (now - run.holdSince) / HOLD_MS);
          if (progress >= 1 && run.matches >= 3) {
            finish('success', '动作正确，测试通过！');
            return;
          }
          publish('holding', '动作正确，请保持片刻…', progress, true);
        }
      } catch {
        if (active === run) finish('error', '动作识别暂时中断，请重新测试。');
        return;
      }
      if (active === run) schedule(run);
    }
    function start(video, target = {}) {
      if (disposed) return Promise.resolve(false);
      release();
      if (!camera || !root.MMClassroomPoseClassifier?.evaluate) {
        publish('error', '动作测试组件未载入，请重新进入课堂。');
        return Promise.resolve(false);
      }
      if (!['left', 'right', 'both', 'squat', 'clap', 'balance'].includes(target.gesture)) {
        publish('error', '当前动作暂不支持测试。');
        return Promise.resolve(false);
      }
      if (document.hidden) {
        publish('stopped', '页面已离开，动作测试已停止。');
        return Promise.resolve(false);
      }
      const run = { video, target: { gesture: target.gesture, seated: !!target.seated },
        frame: 0, timeout: 0, detector: null, lastAttempt: -Infinity,
        lastVideoTime: null, lastSample: null, holdSince: null, matches: 0, resolveStart: null };
      const pending = new Promise(resolve => { run.resolveStart = resolve; });
      active = run;
      publish('opening', '正在开启摄像头，请允许浏览器访问。');
      camera.start(video).then(opened => {
        if (active !== run || disposed) return;
        if (!opened) { finish('error', camera.getState().message || '摄像头未能开启，请重试。'); return; }
        publish('loading', '正在载入动作识别，请稍候…', 0, true);
        run.timeout = root.setTimeout(() => {
          if (active === run) finish('error', '动作识别载入超时，请重新测试。');
        }, modelTimeoutMs);
        Promise.resolve().then(() => createDetector()).then(detector => {
          if (active !== run || disposed) { closeDetector(detector); return; }
          root.clearTimeout(run.timeout);
          if (!detector || typeof detector.detectForVideo !== 'function') {
            closeDetector(detector);
            finish('error', '动作识别组件未能启动，请重新测试。');
            return;
          }
          run.detector = detector;
          publish('tracking', '请面向摄像头，让身体完整进入画面。', 0, true);
          run.resolveStart?.(true);
          run.resolveStart = null;
          schedule(run);
        }).catch(() => {
          if (active === run && !disposed) finish('error', '动作识别组件未能载入，请重新进入课堂后重试。');
        });
      }).catch(() => {
        if (active === run && !disposed) finish('error', '摄像头未能开启，请重试。');
      });
      return pending;
    }
    const stop = () => { if (!disposed) finish('stopped', '动作测试已停止。'); };
    const onHidden = () => { if (document.hidden && active) finish('stopped', '页面已离开，动作测试已停止。'); };
    const onPageHide = () => { if (active) finish('stopped', '页面已离开，动作测试已停止。'); };
    document.addEventListener('visibilitychange', onHidden);
    root.addEventListener('pagehide', onPageHide);
    function dispose() {
      if (disposed) return;
      disposed = true;
      release();
      camera?.dispose();
      document.removeEventListener('visibilitychange', onHidden);
      root.removeEventListener('pagehide', onPageHide);
    }
    onState({ ...state });
    return { start, stop, dispose, getState: () => ({ ...state }) };
  }
  root.MMClassroomPoseTest = { create };
})(window);
