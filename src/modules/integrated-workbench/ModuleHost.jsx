import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useBlocker, useLocation, useNavigate } from 'react-router-dom';
import { PageLoading } from '../../components/PageLoading';
import { useAuth } from '../../contexts/AuthContext';
import {
  INTEGRATED_MODULES, isModuleResumeMessage, mayOpenModule, moduleAtPath, moduleFromMessage,
  prepareModuleLeave, setModuleVisible, storageScope, userStorageIdentity,
} from './bridge.mjs';
import './ModuleHost.css';

// Route authorization stays in App. The persistent host is owned by Layout.
export function IntegratedModuleRoute() {
  return null;
}

export function IntegratedModuleHost() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const requested = moduleAtPath(location.pathname);
  const active = mayOpenModule(requested, user?.role) ? requested : null;
  const identity = userStorageIdentity(user);
  const [scope, setScope] = useState('');
  const [scopeError, setScopeError] = useState(false);
  const [visited, setVisited] = useState(() => active ? [active] : []);
  const [status, setStatus] = useState({});
  const [attempt, setAttempt] = useState({});
  const [notice, setNotice] = useState('');
  const frames = useRef({});
  const timers = useRef({});
  const lastModule = useRef(null);
  const returnTargets = useRef({});
  // Remember a visited route while retaining the existing frame instances.
  if (active && !visited.includes(active)) setVisited([...visited, active]);

  useEffect(() => {
    let alive = true;
    storageScope(identity).then(value => { if (alive) setScope(value); }, () => { if (alive) setScopeError(true); });
    return () => { alive = false; };
  }, [identity]);

  const blocker = useBlocker(useCallback(({ nextLocation }) => (
    !!active && active !== moduleAtPath(nextLocation.pathname)
  ), [active]));

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    let cancelled = false;
    prepareModuleLeave(frames.current[active]).then(ok => {
      if (cancelled) return;
      if (ok) {
        setNotice('');
        setModuleVisible(frames.current[active], false, window.location.origin);
        blocker.proceed();
      } else {
        setNotice('当前内容尚未允许离开，请先处理模块中的提示，再重试。');
        blocker.reset();
      }
    });
    return () => { cancelled = true; };
  }, [blocker, active]);

  useEffect(() => {
    for (const [id, frame] of Object.entries(frames.current)) {
      setModuleVisible(frame, id === active && !document.hidden, window.location.origin);
    }
    const visibility = () => setModuleVisible(frames.current[active], !document.hidden, window.location.origin);
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, [active]);

  useLayoutEffect(() => {
    if (!active || active === lastModule.current) return;
    if (lastModule.current) returnTargets.current[active] = lastModule.current;
    lastModule.current = active;
  }, [active]);

  useEffect(() => {
    const receive = event => {
      if (!document.hidden && isModuleResumeMessage(event, frames.current, window.location.origin, active)) {
        setModuleVisible(frames.current.speak, true, window.location.origin);
        return;
      }
      const id = moduleFromMessage(event, frames.current, window.location.origin, active, user?.role, returnTargets.current[active] || 'music');
      if (id) navigate(INTEGRATED_MODULES[id].path);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [active, navigate, user?.role]);

  useLayoutEffect(() => {
    const mountedFrames = frames.current;
    const pendingTimers = timers.current;
    return () => {
      for (const timer of Object.values(pendingTimers)) clearTimeout(timer);
      for (const frame of Object.values(mountedFrames)) {
        try {
          setModuleVisible(frame, false, window.location.origin);
          frame?.contentWindow?.WBWebModule?.dispose();
        } catch { /* The frame may already have been removed during logout. */ }
      }
    };
  }, []);

  const attach = (id, node) => {
    // Retain the old window for cleanup after React starts removing its DOM.
    if (!node || frames.current[id] === node) return;
    frames.current[id] = node;
    clearTimeout(timers.current[id]);
    timers.current[id] = setTimeout(() => setStatus(previous => ({ ...previous, [id]: 'error' })), 20000);
  };

  const loaded = id => {
    clearTimeout(timers.current[id]);
    const frame = frames.current[id];
    const deadline = Date.now() + 15000;
    // An iframe can finish loading its scripts before the activity API responds.
    const check = () => {
      if (frames.current[id] !== frame) return;
      try {
        const api = frame?.contentWindow?.WBWebModule;
        if (api?.module === id) {
          if (api.ready() || frame.contentDocument?.querySelector('[data-workbench-load-error]')) {
            setModuleVisible(frame, !frame.parentElement.hidden && !document.hidden, window.location.origin);
            setStatus(previous => ({ ...previous, [id]: 'ready' }));
            return;
          }
          if (Date.now() < deadline) {
            timers.current[id] = setTimeout(check, 100);
            return;
          }
        }
      } catch { /* Leave the recovery controls visible if the frame failed. */ }
      setStatus(previous => ({ ...previous, [id]: 'error' }));
    };
    check();
  };

  const retry = id => {
    clearTimeout(timers.current[id]);
    setModuleVisible(frames.current[id], false, window.location.origin);
    try { frames.current[id]?.contentWindow?.WBWebModule?.dispose(); } catch { /* Failed frame recovery. */ }
    setStatus(previous => ({ ...previous, [id]: 'loading' }));
    setAttempt(previous => ({ ...previous, [id]: (previous[id] || 0) + 1 }));
  };

  return (
    <section className="integrated-workbench" hidden={!active} aria-label={active ? INTEGRATED_MODULES[active].title : '活动工作台'}>
      {scope && visited.filter(id => mayOpenModule(id, user?.role)).map(id => (
        <div key={id} className="integrated-module-pane" hidden={active !== id}>
          <iframe
            key={`${id}-${attempt[id] || 0}`}
            ref={node => attach(id, node)}
            src={`/workbench-v6/${INTEGRATED_MODULES[id].entry}?embedded=1&scope=${scope}`}
            title={INTEGRATED_MODULES[id].title}
            allow="fullscreen"
            onLoad={() => loaded(id)}
          />
          {status[id] !== 'ready' && (
            <div className="integrated-module-status" role={status[id] === 'error' ? 'alert' : undefined}>
              {status[id] === 'error' ? (
                <>
                  <h2>暂时无法打开{INTEGRATED_MODULES[id].title}</h2>
                  <p>请重试，或返回工作看板。已有活动保留在当前浏览器。</p>
                  <button type="button" onClick={() => retry(id)}>重新载入</button>
                </>
              ) : (
                <PageLoading label={`正在打开${INTEGRATED_MODULES[id].title}`} />
              )}
              <button type="button" className="secondary" onClick={() => navigate('/')}>返回工作看板</button>
            </div>
          )}
        </div>
      ))}
      {!scope && active && (
        <div className="integrated-module-status" role={scopeError ? 'alert' : undefined}>
          {scopeError ? (
            <>
              <h2>无法初始化本地活动库</h2>
              <p>请使用支持安全存储的浏览器，并从本地预览或 HTTPS 地址打开。</p>
            </>
          ) : (
            <PageLoading label={`正在打开${INTEGRATED_MODULES[active].title}`} />
          )}
          <button type="button" className="secondary" onClick={() => navigate('/')}>返回工作看板</button>
        </div>
      )}
      {notice && active && <div className="integrated-module-notice" role="alert"><span>{notice}</span><button type="button" aria-label="关闭提示" onClick={() => setNotice('')}>×</button></div>}
    </section>
  );
}
