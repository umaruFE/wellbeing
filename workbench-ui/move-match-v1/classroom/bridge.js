/* Module-only classroom transport. Never writes a draft or localStorage. */
(function () {
  'use strict';
  const token = new URLSearchParams(location.search).get('launch') || '';
  const origin = location.origin;
  const clone = value => JSON.parse(JSON.stringify(value));
  const send = (type, details = {}) => {
    if (window.parent !== window) window.parent.postMessage({type, token, ...details}, origin);
  };
  let payload = null;
  let error = '';
  try {
    if (!/^[A-Za-z0-9_-]{8,160}$/.test(token)) throw new Error('课堂入口已失效，请返回活动重新打开。');
    payload = JSON.parse(sessionStorage.getItem('move-match-v1:launch:' + token) || 'null');
    if (!payload || payload.token !== token || payload.schemaVersion !== 1 || !['example', 'preview', 'classroom'].includes(payload.mode)) throw new Error('无法读取本次课堂内容，请返回活动重新打开。');
    const lesson = payload.lesson;
    if (!lesson || !Array.isArray(lesson.categories) || !Array.isArray(lesson.items) || !lesson.items.length || ![2,3,4].includes(lesson.categories.length)) throw new Error('课堂内容不完整，请返回编辑页核对。');
    const wordMode = lesson.mode === 'word-sort';
    if (!wordMode && lesson.mode !== 'sentence-gap') throw new Error('课堂题型不支持，请返回编辑页核对。');
    const actions = ['left', 'right', 'both', 'squat'];
    if (lesson.categories.some((c,index) => !c || typeof c.id !== 'string' || !c.id.trim() || typeof c.label !== 'string' || !c.label.trim() || !actions.includes(c.action) || (wordMode && (Array.from(c.label.trim()).length > 24 || c.action !== actions[index])))) throw new Error('分类名称或动作不正确，请返回编辑页核对。');
    const groups = new Set(lesson.categories.map(c => c.id));
    if (groups.size !== lesson.categories.length || new Set(lesson.categories.map(c => c.action)).size !== lesson.categories.length) throw new Error('分类或动作重复，请返回编辑页核对。');
    if (new Set(lesson.items.map(i => i?.id)).size !== lesson.items.length || lesson.items.some(i => {
      if (!i || typeof i.id !== 'string' || !i.id.trim() || !groups.has(i.categoryId)) return true;
      if (wordMode) {
        const category = lesson.categories.find(c => c.id === i.categoryId);
        return typeof i.word !== 'string' || !i.word.trim() || i.answerText !== category.label || typeof i.archiveText !== 'string' || !i.archiveText.trim() || ['context','hint','explanation'].some(key => i[key] !== undefined && typeof i[key] !== 'string');
      }
      return typeof i.sentence !== 'string' || i.sentence.split('___').length !== 2;
    })) throw new Error('题目或正确分类缺失，请返回编辑页核对。');
    payload = clone(payload);
  } catch (err) {
    payload = null;
    error = err.message || '课堂内容加载失败，请返回活动后重试。';
  }
  const normalizeSettings = settings => ({
    seconds: Number.isInteger(settings?.seconds) && settings.seconds >= 3 && settings.seconds <= 12 ? settings.seconds : 6,
    seated: settings?.seated === true,
    sound: settings?.sound === true
  });
  let progress = null;
  if (payload?.progress != null) {
    try {
      const incoming = payload.progress;
      const g = incoming.game;
      const items = payload.lesson.items;
      const ids = items.map(i => i.id);
      if (incoming.lessonId !== payload.lesson.id || !g || !['ready','answering','revealed','flying','complete'].includes(g.phase) || !Number.isInteger(g.index) || g.index < 0 || g.index >= items.length || !Array.isArray(g.collected) || !Array.isArray(g.records)) throw new Error();
      if (g.collected.length !== g.records.length || g.collected.some((id,index) => id !== ids[index]) || g.records.some((r,index) => r?.item?.id !== g.collected[index])) throw new Error();
      if ((g.phase === 'complete' && (g.collected.length !== items.length || g.index !== items.length - 1)) || (g.phase !== 'complete' && g.index !== g.collected.length) || (g.phase === 'ready' && (g.index !== 0 || g.collected.length))) throw new Error();
      if (!Number.isInteger(g.attempts) || g.attempts < 0 || !Number.isInteger(g.epoch) || g.epoch < 0) throw new Error();
      progress = clone(incoming);
      progress.game.records = g.records.map(r => {
        if(!Number.isInteger(r.attempts)||r.attempts<0||typeof r.independent!=='boolean')throw new Error();
        const outcome=Object.prototype.hasOwnProperty.call(r,'outcome')?r.outcome:'success',failureReason=Object.prototype.hasOwnProperty.call(r,'failureReason')?r.failureReason:outcome==='unsuccessful'?(r.attempts>0?'incorrect':'timeout'):null;
        if(!['success','unsuccessful'].includes(outcome)||r.independent!==(outcome==='success'&&r.attempts===0)||(outcome==='success'&&failureReason!==null)||(outcome==='unsuccessful'&&!['incorrect','timeout'].includes(failureReason)))throw new Error();
        return {item: clone(items.find(i => i.id === r.item.id)), attempts:r.attempts, independent:r.independent, outcome, failureReason};
      });
      const outcome=Object.prototype.hasOwnProperty.call(g,'outcome')?g.outcome:g.phase==='ready'?null:g.phase==='answering'?null:g.phase==='complete'?(progress.game.records.at(-1)?.outcome||null):'success';
      const failureReason=Object.prototype.hasOwnProperty.call(g,'failureReason')?g.failureReason:outcome==='unsuccessful'?(g.phase==='complete'?progress.game.records.at(-1)?.failureReason:g.attempts>0?'incorrect':'timeout'):null;
      if(![null,'success','unsuccessful'].includes(outcome)||(['ready','answering'].includes(g.phase)&&outcome!==null)||(['revealed','flying','complete'].includes(g.phase)&&outcome===null)||(outcome!=='unsuccessful'&&failureReason!==null)||(outcome==='unsuccessful'&&!['incorrect','timeout'].includes(failureReason))||(g.phase==='complete'&&(outcome!==progress.game.records.at(-1)?.outcome||failureReason!==progress.game.records.at(-1)?.failureReason)))throw new Error();
      const duration=g.phase==='answering'?normalizeSettings(incoming.settings||payload.settings).seconds*1000:g.phase==='revealed'?2300:g.phase==='flying'?820:0;
      if(Object.prototype.hasOwnProperty.call(g,'remainingMs')&&(!Number.isFinite(g.remainingMs)||g.remainingMs<0||g.remainingMs>duration))throw new Error();
      progress.game.outcome=outcome;progress.game.failureReason=failureReason;
    } catch {
      payload = null;
      error = '已保存的课堂进度无法恢复。请返回活动核对，原进度未被覆盖。';
    }
  }
  const settings = normalizeSettings(progress?.settings || payload?.settings);
  const api = window.MMClassroom = {
    token, valid: !!payload, error, mode: payload?.mode,
    lesson: payload?.lesson, settings, progress,
    latest: null,
    initialGame: () => progress ? clone(progress.game) : {phase:'ready',index:0,collected:[],records:[],attempts:0,epoch:0},
    send,
    accepts: event => event.origin === origin && event.source === window.parent && event.data?.token === token,
    report: next => { api.latest = clone(next); send('move-match:progress', {progress: api.latest}); },
    requestCase: lessonId => send('move-match:case-request', {lessonId})
  };
  const fail = message => send('move-match:error', {message});
  window.addEventListener('error', e => fail(e.message || '课堂加载失败。'));
  window.addEventListener('unhandledrejection', e => fail(e.reason?.message || '课堂操作失败。'));
  if (!payload) fail(error);
})();
