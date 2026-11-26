(function () {
  'use strict';

  function previewFlag(name) {
    try { return window.top[name]; } catch { return window[name]; }
  }
  const live = previewFlag('WB_WORKBENCH_LIVE');
  const readOnlyPreview = previewFlag('WB_WORKBENCH_READ_ONLY') === true;
  const previewWriteModules = previewFlag('WB_WORKBENCH_ACTIVITY_WRITES') === true
    ? new Set(['spin-speak', 'doodle', 'move-match']) : new Set();
  const offline = live === false || (live === undefined && localStorage.getItem('token') === 'local-style-preview-only');

  function newId() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
  }

  async function request(path, { method = 'GET', body, signal, timeout = 180000, token = localStorage.getItem('token') } = {}) {
    if (offline) throw new Error('当前为离线预览，后台服务不可用。');
    if (!path.startsWith('/api/')) throw new Error('后台接口地址无效。');
    const deadline = AbortSignal.timeout(timeout);
    const headers = { Accept: 'application/json' };
    const multipart = typeof FormData !== 'undefined' && body instanceof FormData;
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined && !multipart) headers['Content-Type'] = 'application/json';
    let response;
    try {
      response = await fetch(path, {
        method, headers, cache: 'no-store',
        signal: signal ? AbortSignal.any([signal, deadline]) : deadline,
        body: body === undefined || multipart ? body : JSON.stringify(body),
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new Error(deadline.aborted ? '后台响应超时，请重试。' : '无法连接后台服务，请重试。');
    }
    const data = await response.json().catch(() => null);
    if (!response.ok || !data || data.success === false) {
      throw Object.assign(new Error(data?.error || data?.message || '后台服务暂不可用，请重试。'), { status: response.status });
    }
    return data;
  }

  function caseLibrary(moduleId) {
    if (offline) return null;
    const path = '/api/workbench-cases/' + encodeURIComponent(moduleId);
    let items = [];
    let message = '';
    let canPublish = false;
    async function load() {
      try {
        const { data, canPublish: allowed } = await request(path, { timeout: 12000 });
        if (!Array.isArray(data)
          || data.some(item => !item || typeof item.id !== 'string')
          || new Set(data.map(item => item.id)).size !== data.length) {
          throw new Error('案例库数据无效。');
        }
        items = data;
        canPublish = allowed === true;
        message = items.length ? '' : '暂无已发布的案例。';
      } catch {
        message = '暂时无法读取平台案例，请稍后重试。';
      }
    }
    return {
      get items() { return items; },
      get message() { return message; },
      get canPublish() { return canPublish; },
      find(id) { return items.find(item => item.id === id); },
      load,
      async publish(sourceId) {
        if (!canPublish) throw new Error('只有平台管理员可以发布案例。');
        if (!window.confirm('将此作品已确认的授课版发布到平台案例库？')) return false;
        const { data } = await request(path, { method: 'POST', body: { sourceId }, timeout: 12000 });
        if (!data?.id) throw new Error('后台未确认案例发布。');
        const index = items.findIndex(item => item.id === data.id);
        if (index < 0) items = [...items, data];
        else items = items.map(item => item.id === data.id ? data : item);
        message = '';
        return true;
      },
    };
  }

  function mediaUrl(value) {
    return typeof value === 'string' && /^(?:https?:\/\/|\/[^/\\])/i.test(value) && !/[\\\x00-\x1f]/.test(value);
  }

  async function upload(file, folder, { signal, filename = file.name } = {}) {
    const body = new FormData();
    body.append('file', file, filename);
    body.append('folder', folder);
    const { url } = await request('/api/upload', { method: 'POST', body, signal });
    if (!mediaUrl(url)) throw new Error('上传服务未返回文件地址，请重试。');
    return url;
  }

  function waitForImage(signal) {
    return new Promise((resolve, reject) => {
      signal?.throwIfAborted();
      const abort = () => { clearTimeout(timer); reject(signal.reason); };
      const timer = setTimeout(() => {
        signal?.removeEventListener('abort', abort);
        resolve();
      }, 2000);
      signal?.addEventListener('abort', abort, { once: true });
    });
  }

  async function generateImage(body, { signal } = {}) {
    const submitted = await request('/api/ai/generate-images', {
      method: 'POST', body: { workflow_type: 'scene', width: 768, height: 768, count: 1, ...body }, signal,
    });
    if (mediaUrl(submitted.url)) return submitted.url;
    const task = submitted.tasks?.[0];
    if (!task?.promptId) throw new Error('配图服务未返回任务，请重试。');
    const query = new URLSearchParams({ workflowType: 'image', useComfyUI: 'true' });
    if (task.apiUrl) query.set('apiUrl', task.apiUrl);
    const statusUrl = task.statusUrl || `/api/ai/task-status/${encodeURIComponent(task.promptId)}?${query}`;
    for (let attempt = 0; attempt < 90; attempt++) {
      await waitForImage(signal);
      const status = await request(statusUrl, { signal, timeout: 30000 });
      if (status.status === 'error' || status.status === 'failed') throw new Error(status.error || '配图生成失败，请重试。');
      if (status.status === 'completed' && mediaUrl(status.url)) return status.url;
      if (status.status === 'completed') throw new Error('配图生成服务未返回图片，请重试。');
    }
    throw new Error('配图生成尚未完成，请稍后重试。');
  }

  function activityStore(moduleId, key, onStateChange = () => {}) {
    if (offline) return null;
    const scopedPreviewWrite = readOnlyPreview && previewWriteModules.has(moduleId);
    const readOnly = readOnlyPreview && !scopedPreviewWrite;
    const token = localStorage.getItem('token');
    const path = `/api/workbench-activities/${moduleId}`;
    const tabKey = 'wellbeing-workbench-tab';
    const tab = sessionStorage.getItem(tabKey) || newId();
    sessionStorage.setItem(tabKey, tab);
    // Queued writes from other environments must never be replayed into this preview's database.
    const pendingKey = `${key}:sync:${tab}${scopedPreviewWrite ? ':production-preview' : ''}`;
    let pending = readOnly ? null : JSON.parse(localStorage.getItem(pendingKey) || 'null');
    let raw = pending?.queued?.raw ?? pending?.sending?.raw ?? null;
    let version = pending?.version ?? 0;
    let running, timer, panel, legacy, status = 'loading';
    let failsWithConflict = false;
    let reloading = false;

    function record(next) {
      if (next?.queued || next?.sending) localStorage.setItem(pendingKey, JSON.stringify(next));
      else localStorage.removeItem(pendingKey);
      pending = next?.queued || next?.sending ? next : null;
    }

    function setStatus(next) {
      status = next;
      document.documentElement.dataset.workbenchSaveState = status;
      onStateChange();
    }

    function display(message = '', conflict = false) {
      setStatus(readOnly ? 'readonly' : message ? (conflict ? 'conflict' : 'unsynced') : 'synced');
      panel?.remove();
      if (!message) return;
      panel = document.createElement('aside');
      panel.setAttribute('role', 'status');
      panel.style.cssText = 'position:fixed;inset:auto 12px 12px auto;max-width:min(460px,calc(100vw - 24px));z-index:9000;padding:9px 12px;background:#fff6dd;color:#513a22;border:1px solid #dfba78;border-radius:8px;font:14px/1.4 system-ui;box-shadow:0 2px 10px #0002';
      panel.append(document.createTextNode(message));
      if (!readOnly && (conflict || pending && !running)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.style.marginInlineStart = '8px';
        button.textContent = conflict ? '导出修改并载入后台版本' : '重试';
        button.onclick = conflict ? backupAndReload : () => flush();
        panel.append(button);
      }
      document.body.append(panel);
    }

    function backupAndReload() {
      if (!raw) return;
      const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${moduleId}-未同步修改.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      try {
        localStorage.setItem(`${pendingKey}:backup`, raw);
        record(null);
      } catch {
        display('本地存储空间不足，当前修改仍保留。请检查已下载的备份后再处理。', true);
        return;
      }
      reloading = true;
      window.location.reload();
    }

    function change(value) {
      if (reloading || value === raw) return;
      if (readOnly) throw new Error('当前无法保存活动。');
      record({ version, sending: pending?.sending, queued: { raw: value, id: newId() } });
      raw = value;
      if (failsWithConflict) return;
      setStatus('pending');
      clearTimeout(timer);
      timer = setTimeout(flush, 350);
    }

    function flush() {
      if (readOnly) return Promise.resolve(true);
      if (running) return running;
      if (!pending || failsWithConflict) return Promise.resolve(!pending);
      clearTimeout(timer);
      running = Promise.resolve().then(async () => {
        while (pending) {
          const sending = pending.sending || pending.queued;
          if (!pending.sending) record({ version, sending });
          if (!token || token !== localStorage.getItem('token')) throw new Error('登录已变化；请使用原账号打开此页面以继续同步。');
          const result = await request(path, {
            method: 'PUT', token, timeout: 15000,
            body: { version, writeId: sending.id, snapshot: JSON.parse(sending.raw) },
          });
          if (!Number.isInteger(result.data?.version) || result.data.version !== version + 1) throw new Error('后台没有确认保存，请重试。');
          record({ version: result.data.version, queued: pending.queued });
          version = result.data.version;
        }
        display();
        return true;
      }).catch(error => {
        failsWithConflict = error.status === 409;
        running = null;
        display(error.message || '后台同步失败，修改已保留在此浏览器。', failsWithConflict);
        return false;
      }).finally(() => { running = null; });
      return running;
    }

    async function load() {
      if (pending && !readOnly) {
        setStatus('pending');
        void flush();
        return;
      }
      const { data } = await request(path, { token, timeout: 12000 });
      if (!Number.isInteger(data?.version) || data.version < 0 || (data.version > 0 && !data.snapshot)) {
        throw new Error('后台返回的活动数据无效，请重试。');
      }
      version = data.version;
      raw = data.snapshot ? JSON.stringify(data.snapshot) : null;
      if (version === 0 && !readOnlyPreview) {
        legacy = localStorage.getItem(key);
        raw = legacy;
      }
      display();
    }

    if (!readOnly) window.addEventListener('online', flush);
    return {
      load, flush, readOnly,
      importLocal() {
        if (readOnly || !legacy) return;
        const original = legacy;
        legacy = null;
        raw = null;
        change(original);
      },
      get status() { return status; },
      get dirty() { return !readOnly && Boolean(pending); },
      storage: {
        getItem: () => raw,
        setItem: (_key, value) => change(value),
      },
    };
  }

  window.WBWorkbenchApi = { offline, readOnly: readOnlyPreview, request, upload, generateImage, activityStore, caseLibrary };
})();
