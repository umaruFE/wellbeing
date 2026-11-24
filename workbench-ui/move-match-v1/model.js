(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MMModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const STORAGE_KEY = 'wellbeing-move-match-v1-data';
  const DEFAULT_SETTINGS = Object.freeze({ seconds: 6, seated: false, sound: true });
  const RENDERER_VERSION = 'v39-adapter-v1';
  const TEMPLATE_GROUPS = Object.freeze({
    'articles-four': [['a', 'a', 'left'], ['an', 'an', 'right'], ['the', 'the', 'both'], ['zero', 'Ø', 'squat']],
    'articles-two': [['a', 'a', 'left'], ['an', 'an', 'right']],
    'be-three': [['am', 'am', 'left'], ['is', 'is', 'right'], ['are', 'are', 'both']]
  });
  const TEMPLATE_IDS = new Set([...Object.keys(TEMPLATE_GROUPS), 'custom']);
  const ACTION_ORDER = ['left', 'right', 'both', 'squat'];
  const PREPARATION_AGES = new Set(['4–6岁', '7–9岁', '10–12岁']);
  const PHASES = new Set(['ready', 'answering', 'revealed', 'flying', 'complete']);
  const SCENARIOS = new Set(['smooth', 'retry', 'away', 'wait']);
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const string = value => typeof value === 'string';
  const integer = value => Number.isSafeInteger(value) && value >= 0;
  const now = () => new Date().toISOString();
  let sequence = 0;
  const uid = prefix => prefix + '-' + (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
    ? globalThis.crypto.randomUUID() : Date.now().toString(36) + '-' + (++sequence).toString(36) + '-' + Math.random().toString(36).slice(2));

  function fault(code, message, details) {
    const error = new Error(message);
    error.name = 'MoveMatchError';
    error.code = code;
    if (details) error.details = details;
    return error;
  }

  function safeData(value) {
    if (value === null || ['string', 'boolean'].includes(typeof value)) return true;
    if (typeof value === 'number') return Number.isFinite(value);
    if (Array.isArray(value)) return value.every(safeData);
    if (!object(value)) return false;
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) return false;
    return Object.keys(value).every(key => !['__proto__', 'prototype', 'constructor'].includes(key) && safeData(value[key]));
  }

  function clone(value) {
    if (value === undefined) return undefined;
    if (!safeData(value)) throw fault('VALIDATION', '内容含有无法保存的数据。');
    return JSON.parse(JSON.stringify(value));
  }

  // Reorder the complete lesson, even when the source and target are shown in a
  // filtered view. Hidden cards and their relative order must remain intact.
  function reorderItems(items, sourceId, targetId, after = false) {
    if (!Array.isArray(items) || sourceId === targetId) return items;
    const from = items.findIndex(item => item.id === sourceId);
    const target = items.findIndex(item => item.id === targetId);
    if (from < 0 || target < 0) return items;
    let to = target + (after ? 1 : 0);
    if (from < to) to -= 1;
    if (from === to) return items;
    const next = items.slice();
    next.splice(from, 1);
    next.splice(to, 0, items[from]);
    return next;
  }

  function settingsOf(settings) {
    if (!object(settings)) throw fault('VALIDATION', '课堂设置格式不正确。');
    return {
      seconds: own(settings, 'seconds') ? settings.seconds : DEFAULT_SETTINGS.seconds,
      seated: own(settings, 'seated') ? settings.seated : DEFAULT_SETTINGS.seated,
      sound: own(settings, 'sound') ? settings.sound : DEFAULT_SETTINGS.sound
    };
  }

  function normalizePreparation(preparation) {
    const source = object(preparation) ? preparation : {};
    const text = value => string(value) ? value.trim() : '';
    const seen = new Set();
    const languageGoals = (Array.isArray(source.languageGoals) ? source.languageGoals : [])
      .map(value => text(value).replace(/\s+/g, ' '))
      .filter(value => {
        const key = value.toLocaleLowerCase();
        if (!value || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    const result = {
      theme: text(source.theme),
      age: text(source.age).replace(/\s+/g, '').replace(/[-—]/g, '–'),
      languageGoals,
      categoryNames: (Array.isArray(source.categoryNames) ? source.categoryNames : []).map(text)
    };
    // Do not add a quantity to historical signatures when reading old records.
    if (own(source, 'questionCount')) result.questionCount = source.questionCount;
    return result;
  }

  function preparationSignature(preparation) { return JSON.stringify(normalizePreparation(preparation)); }

  function validatePreparation(preparation) {
    const errors = [];
    const add = (field, message, index) => errors.push(index === undefined ? { field, message } : { field, message, index });
    if (!object(preparation) || !safeData(preparation)) {
      add('preparation', '基础信息格式不正确。');
      return errors;
    }
    const prep = normalizePreparation(preparation);
    if (own(preparation, 'theme') && !string(preparation.theme)) add('theme', '主题请使用文字。');
    if (!PREPARATION_AGES.has(prep.age)) add('age', '请选择适用年龄：4–6岁、7–9岁或10–12岁。');
    if (!Array.isArray(preparation.languageGoals) || preparation.languageGoals.some(value => !string(value))) add('languageGoals', '核心词汇或句型请使用文字标签。');
    else if (!prep.languageGoals.length) add('languageGoals', '请至少添加一个核心词汇或句型。');
    if (!Array.isArray(preparation.categoryNames) || prep.categoryNames.length < 2 || prep.categoryNames.length > 4) add('categoryNames', '请选择 2–4 个分类。');
    const names = new Set();
    prep.categoryNames.forEach((name, index) => {
      if (!name) add('categoryNames', '请填写分类名称。', index);
      else if (Array.from(name).length > 24) add('categoryNames', '分类名称不能超过 24 个字符。', index);
      const key = name.toLocaleLowerCase();
      if (name && names.has(key)) add('categoryNames', '分类名称不能重复。', index);
      names.add(key);
    });
    if (own(preparation, 'questionCount')) {
      if (!Number.isInteger(preparation.questionCount) || preparation.questionCount < 2 || preparation.questionCount > 50) add('questionCount', '总题数应为 2–50 的整数。');
      else if (preparation.questionCount < prep.categoryNames.length) add('questionCount', `总题数至少为 ${prep.categoryNames.length}，确保每个分类至少有一道题。`);
    }
    return errors;
  }

  function validate(lesson, settings) {
    const errors = [];
    const add = (field, message, itemId) => errors.push(itemId === undefined ? { field, message } : { field, itemId, message });
    if (!object(lesson) || !safeData(lesson)) {
      add('lesson', '活动内容格式不正确。');
      return errors;
    }
    if (!string(lesson.title) || !lesson.title.trim()) add('title', '请填写活动名称。');
    if (!['sentence-gap', 'word-sort'].includes(lesson.mode)) add('mode', '当前支持句子单空或词语分类。');
    const hasPreparation = own(lesson, 'preparation');
    const preparation = hasPreparation ? normalizePreparation(lesson.preparation) : null;
    if (hasPreparation) {
      errors.push(...validatePreparation(lesson.preparation));
      const generation = lesson.generation;
      if (!object(generation) || !['local-example', 'backend-ai'].includes(generation.source) || !string(generation.inputSignature)
        || !Array.isArray(generation.notes) || generation.notes.some(note => !string(note))
        || !string(generation.createdAt) || !Number.isFinite(Date.parse(generation.createdAt))) {
        add('generation', '请先生成并采用分类内容。');
      } else if (generation.inputSignature !== preparationSignature(lesson.preparation)) {
        add('generation', '基础信息已修改，请重新生成并采用内容。');
      }
    } else if (lesson.id === 'custom') add('preparation', '请填写基础信息并生成分类内容。');
    else if (lesson.mode !== 'sentence-gap') add('mode', '原案例请保留句子单空分类，或先填写基础信息重新生成。');
    const expected = own(TEMPLATE_GROUPS, lesson.id) ? TEMPLATE_GROUPS[lesson.id] : null;
    if (!TEMPLATE_IDS.has(lesson.id)) add('categories', '活动来源不受支持，请重新创建活动。');
    const categories = Array.isArray(lesson.categories) ? lesson.categories : [];
    if (!categories.length) add('categories', '活动需要分类。');
    if (hasPreparation && (categories.length < 2 || categories.length > 4)) add('categories', '生成内容需要 2–4 个分类。');
    if (hasPreparation && categories.length !== preparation.categoryNames.length) add('categories', '生成分类与基础信息不一致，请重新生成。');
    const categoryIds = new Set(), actions = new Set();
    categories.forEach((category, index) => {
      if (!object(category) || !string(category.id) || !string(category.label) || !string(category.action)) {
        add('categories', '分类信息不完整。');
        return;
      }
      if (!category.id.trim()) add('categories', '分类标识不能为空。');
      if (categoryIds.has(category.id)) add('categories', '分类标识不能重复。');
      if (actions.has(category.action)) add('categories', '每个分类必须对应不同动作。');
      categoryIds.add(category.id);
      actions.add(category.action);
      if (!category.label.trim()) add('categories', '分类名称不能为空。');
      if (hasPreparation) {
        if (Array.from(category.label.trim()).length > 24) add('categories', '分类名称不能超过 24 个字符。');
        if (category.label.trim() !== preparation.categoryNames[index]) add('categories', '生成分类名称与基础信息不一致，请重新生成。');
        if (category.action !== ACTION_ORDER[index]) add('categories', '分类动作应依次为左臂、右臂、双臂和下蹲。');
      } else if (expected && (!expected[index] || expected[index].some((value, part) => value !== [category.id, category.label, category.action][part]))) {
        add('categories', '请保留当前案例的分类顺序与动作对应。');
      }
    });
    if (!hasPreparation && expected && categories.length !== expected.length) add('categories', '请保留当前案例的分类数量。');
    const items = Array.isArray(lesson.items) ? lesson.items : [];
    if (!items.length) add('items', '请至少添加一道题目。');
    const itemIds = new Set();
    items.forEach(item => {
      if (!object(item)) { add('items', '题目格式不正确。'); return; }
      const itemId = string(item.id) ? item.id : undefined;
      if (!itemId || itemIds.has(itemId)) add('id', '题目标识缺失或重复，请重新添加该题。', itemId);
      itemIds.add(itemId);
      if (own(item, 'contentSync')) {
        const status = object(item.contentSync) ? item.contentSync.status : null;
        if (!['pending', 'review', 'synced'].includes(status)) add('contentSync', '图文同步状态不正确，请重新完成本题修改。', itemId);
        else if (status === 'pending') add('contentSync', '题目已修改，请先完成图文同步。', itemId);
        else if (status === 'review') add('contentSync', '请先核对并采用这道题的同步内容。', itemId);
      }
      if (lesson.mode === 'word-sort') {
        if (!string(item.word) || !item.word.trim()) add('word', '请填写分类题词。', itemId);
        if (own(item, 'sentence') && !string(item.sentence)) add('sentence', '题目文字格式不正确。', itemId);
      } else {
        if (!string(item.sentence) || !item.sentence.trim()) add('sentence', '请填写题目句子。', itemId);
        else if ((item.sentence.match(/___/g) || []).length !== 1 || /_{4,}/.test(item.sentence)) add('sentence', '每道题需要且只能有一个 ___ 填空。', itemId);
      }
      if (!string(item.categoryId) || !categoryIds.has(item.categoryId)) add('categoryId', '请选择有效的正确分类。', itemId);
      else {
        const category = categories.find(value => value && value.id === item.categoryId);
        const isEmptyArticle = lesson.mode === 'sentence-gap' && (hasPreparation ? category.label.toLocaleLowerCase() === 'ø' : category.label === 'Ø');
        const answer = isEmptyArticle ? '' : category.label;
        const matches = hasPreparation && lesson.mode === 'sentence-gap' && string(item.answerText)
          ? item.answerText.toLocaleLowerCase() === answer.toLocaleLowerCase() : item.answerText === answer;
        if (!matches) add('answerText', isEmptyArticle ? '不填（Ø）的答案应为空，不填写 Ø 字符。' : '答案文字应与正确分类一致。', itemId);
      }
      ['context', 'hint', 'explanation', 'archiveText', 'word', 'keyword', 'imageAlt'].forEach(field => {
        if (own(item, field) && !string(item[field])) add(field, '题目文字格式不正确。', itemId);
      });
      if (!string(item.archiveText) || !item.archiveText.trim()) add('archiveText', '请填写收集卡短语。', itemId);
      if (own(item, 'imageUrl') && !string(item.imageUrl)) add('imageUrl', '配图信息格式不正确。', itemId);
      if (own(item, 'art') && item.art !== null && !string(item.art)) add('art', '配图信息格式不正确。', itemId);
    });
    if (!object(settings) || !safeData(settings)) add('settings', '课堂设置格式不正确。');
    else {
      if (!Number.isInteger(settings.seconds) || settings.seconds < 3 || settings.seconds > 12) add('seconds', '思考时间应为 3–12 秒的整数。');
      if (typeof settings.seated !== 'boolean') add('seated', '请选择站姿或坐姿。');
      if (typeof settings.sound !== 'boolean') add('sound', '请设置课堂音效。');
    }
    return errors;
  }

  function equal(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
  function isDirty(activity) {
    if (!activity || !Array.isArray(activity.releases)) return true;
    const release = activity.releases.find(item => item.id === activity.activeReleaseId);
    return !release || !equal(activity.draft, { lesson: release.lesson, settings: release.settings });
  }

  function draftOf(draft, templateId) {
    if (!object(draft) || !object(draft.lesson) || !Array.isArray(draft.lesson.items) || !Array.isArray(draft.lesson.categories)) {
      throw fault('VALIDATION', '草稿结构不完整，未覆盖已保存内容。');
    }
    const result = { lesson: clone(draft.lesson), settings: clone(settingsOf(draft.settings)) };
    if (result.lesson.id !== templateId) throw fault('VALIDATION', '不能用其他案例覆盖当前活动。');
    return result;
  }

  function editorOf(editor, lesson) {
    const source = object(editor) ? editor : {};
    return {
      step: source.step === 2 ? 2 : 1,
      selectedItemId: lesson.items.some(item => item && item.id === source.selectedItemId) ? source.selectedItemId : (lesson.items[0]?.id || null),
      scrollY: Number.isFinite(source.scrollY) && source.scrollY > 0 ? source.scrollY : 0
    };
  }

  function checkedProgress(progress, lesson) {
    const invalid = message => { throw fault('VALIDATION', message); };
    if (!object(progress) || !safeData(progress) || progress.schemaVersion !== 1 || progress.lessonId !== lesson.id || !object(progress.game)) invalid('课堂进度与当前活动不匹配。');
    const game = progress.game;
    const items = lesson.items;
    if (!PHASES.has(game.phase) || !integer(game.index) || game.index >= items.length || !integer(game.attempts) || !integer(game.epoch)) invalid('课堂进度格式不正确。');
    if (!Array.isArray(game.collected) || !Array.isArray(game.records) || game.collected.length !== game.records.length) invalid('收集记录不完整。');
    const length = game.phase === 'complete' ? items.length : game.index;
    if (game.collected.length !== length || (game.phase === 'ready' && game.index !== 0) || (game.phase === 'complete' && game.index !== items.length - 1)) invalid('课堂题序与收集记录不匹配。');
    if (typeof progress.paused !== 'boolean') invalid('课堂暂停状态不正确。');
    const settings = settingsOf(progress.settings);
    if (validate(lesson, settings).length) invalid('课堂临时设置不正确。');
    const records = game.records.map((record, index) => {
      if (!object(record) || !object(record.item) || record.item.id !== items[index].id || game.collected[index] !== items[index].id || !integer(record.attempts) || typeof record.independent !== 'boolean') invalid('收集记录含有其他活动的题目。');
      const outcome=own(record,'outcome')?record.outcome:'success';
      const failureReason=own(record,'failureReason')?record.failureReason:outcome==='unsuccessful'?(record.attempts>0?'incorrect':'timeout'):null;
      if (!['success','unsuccessful'].includes(outcome) || record.independent !== (outcome==='success'&&record.attempts===0) || (outcome==='success'&&failureReason!==null) || (outcome==='unsuccessful'&&!['incorrect','timeout'].includes(failureReason)) || (!own(record,'outcome')&&record.independent!==(record.attempts===0))) invalid('收集记录结果不正确。');
      return { item: clone(items[index]), attempts: record.attempts, independent: record.independent, outcome, failureReason };
    });
    const simulation = progress.simulation || { enabled: true, scenario: 'smooth' };
    if (!object(simulation) || typeof simulation.enabled !== 'boolean' || !SCENARIOS.has(simulation.scenario)) invalid('模拟场景格式不正确。');
    if (own(progress, 'timedOut') && typeof progress.timedOut !== 'boolean') invalid('计时状态格式不正确。');
    if (own(progress, 'hint') && !string(progress.hint)) invalid('提示文字格式不正确。');
    const outcome=own(game,'outcome')?game.outcome:game.phase==='ready'?null:game.phase==='answering'?null:game.phase==='complete'?(records.at(-1)?.outcome||null):'success';
    const failureReason=own(game,'failureReason')?game.failureReason:outcome==='unsuccessful'?(game.phase==='complete'?records.at(-1)?.failureReason:game.attempts>0?'incorrect':'timeout'):null;
    if (![null,'success','unsuccessful'].includes(outcome) || (['ready','answering'].includes(game.phase)&&outcome!==null) || (['revealed','flying','complete'].includes(game.phase)&&outcome===null) || (outcome!=='unsuccessful'&&failureReason!==null) || (outcome==='unsuccessful'&&!['incorrect','timeout'].includes(failureReason)) || (game.phase==='complete'&&(outcome!==records.at(-1)?.outcome||failureReason!==records.at(-1)?.failureReason))) invalid('当前题目结果不正确。');
    const duration=game.phase==='answering'?settings.seconds*1000:game.phase==='revealed'?2300:game.phase==='flying'?820:0;
    if (own(game,'remainingMs')&&(!Number.isFinite(game.remainingMs)||game.remainingMs<0||game.remainingMs>duration)) invalid('倒计时进度不正确。');

    return {
      schemaVersion: 1, lessonId: lesson.id,
      game: { phase: game.phase, index: game.index, collected: [...game.collected], records, attempts: game.attempts, epoch: game.epoch, outcome, failureReason, ...(own(game,'remainingMs')?{remainingMs:game.remainingMs}:{}) },
      paused: progress.paused, settings,
      simulation: { enabled: simulation.enabled, scenario: simulation.scenario },
      timedOut: progress.timedOut || false, hint: progress.hint || ''
    };
  }

  function emptyState() { return { schemaVersion: 1, revision: 0, activities: [], sessions: [] }; }
  function inspectState(state) {
    if (!object(state) || !safeData(state) || state.schemaVersion !== 1 || !integer(state.revision) || !Array.isArray(state.activities) || !Array.isArray(state.sessions)) throw new Error('数据版本或结构不正确。');
    const activityIds = new Set(), sessionIds = new Set(), releaseIds = new Set();
    for (const activity of state.activities) {
      if (!object(activity) || !string(activity.id) || !activity.id || activityIds.has(activity.id) || !TEMPLATE_IDS.has(activity.templateId) || !integer(activity.revision) || !object(activity.draft) || !object(activity.editor) || !Array.isArray(activity.releases) || !string(activity.createdAt) || !string(activity.updatedAt)) throw new Error('活动记录不完整。');
      activityIds.add(activity.id);
      draftOf(activity.draft, activity.templateId);
      if (![1, 2].includes(activity.editor.step) || !Number.isFinite(activity.editor.scrollY) || activity.editor.scrollY < 0) throw new Error('编辑位置无效。');
      let previousNumber = 0;
      for (const release of activity.releases) {
        if (!object(release) || !string(release.id) || releaseIds.has(release.id) || !integer(release.number) || release.number <= previousNumber || release.lesson?.id !== activity.templateId || validate(release.lesson, release.settings).length || !string(release.createdAt) || release.rendererVersion !== RENDERER_VERSION) throw new Error('授课版记录不完整。');
        releaseIds.add(release.id);
        previousNumber = release.number;
      }
      if (activity.activeReleaseId !== null && !activity.releases.some(release => release.id === activity.activeReleaseId)) throw new Error('当前授课版不存在。');
    }
    for (const session of state.sessions) {
      // Early sessions created during this module's first build have no revision.
      // Give only that absent field an in-memory baseline; reads never rewrite storage.
      if (object(session) && !own(session, 'revision')) session.revision = 1;
      const activity = state.activities.find(item => item.id === session?.activityId);
      const release = activity?.releases.find(item => item.id === session?.releaseId);
      if (!object(session) || !string(session.id) || sessionIds.has(session.id) || !integer(session.revision) || session.revision < 1 || !release || !['ready', 'active', 'paused', 'complete', 'ended'].includes(session.status) || !equal(session.lesson, release.lesson) || !equal(session.settings, release.settings) || session.rendererVersion !== release.rendererVersion || !string(session.createdAt) || !string(session.updatedAt)) throw new Error('课堂会话记录不完整。');
      sessionIds.add(session.id);
      if (session.progress !== null) checkedProgress(session.progress, session.lesson);
    }
    return state;
  }

  class Repository {
    constructor(storage) {
      if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') throw fault('CORRUPT_STORAGE', '当前浏览器不支持本地保存。');
      this.storage = storage;
      this.key = STORAGE_KEY;
      this._read();
    }

    _read() {
      let raw;
      try { raw = this.storage.getItem(this.key); }
      catch (error) { throw fault('CORRUPT_STORAGE', '无法读取本地数据，请检查浏览器存储权限。'); }
      if (raw === null) return emptyState();
      try { return inspectState(JSON.parse(raw)); }
      catch (error) { throw fault('CORRUPT_STORAGE', '本地记录无法安全读取。原始内容已保留，请先导出备份后恢复。', { reason: error.message }); }
    }

    _write(state) {
      state.revision += 1;
      let raw;
      try { inspectState(state); raw = JSON.stringify(state); }
      catch (error) { throw fault('VALIDATION', '本次内容未通过完整性检查，已保留原记录。', { reason: error.message }); }
      try { this.storage.setItem(this.key, raw); }
      catch (error) { throw fault('STORAGE_WRITE_FAILED', '保存失败，本地空间不足或存储被阻止。已保存记录未被清空，请重试或另存备份。'); }
    }

    _activity(state, id, expectedRevision) {
      const activity = state.activities.find(item => item.id === id);
      if (!activity) throw fault('VALIDATION', '找不到该活动，请返回案例库重新打开。');
      if (expectedRevision !== undefined && activity.revision !== expectedRevision) throw fault('CONFLICT', '该活动已在其他页面更新。请载入最新版本，或将当前修改另存为副本。', { expectedRevision, actualRevision: activity.revision });
      return activity;
    }

    list() { return clone(this._read().activities).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); }
    get(id) { return clone(this._read().activities.find(item => item.id === id) || null); }

    create(template) {
      const lesson = clone(template), settings = clone(DEFAULT_SETTINGS);
      if (lesson?.id === 'custom') draftOf({ lesson, settings }, 'custom');
      else {
        const errors = validate(lesson, settings);
        if (errors.length) throw fault('VALIDATION', '案例内容不完整，无法创建活动。', errors);
      }
      const state = this._read(), stamp = now();
      const activity = {
        id: uid('activity'), templateId: lesson.id, revision: 0,
        draft: { lesson, settings }, editor: editorOf({}, lesson),
        releases: [], activeReleaseId: null, createdAt: stamp, updatedAt: stamp
      };
      state.activities.push(activity);
      this._write(state);
      return clone(activity);
    }

    saveDraft(id, draft, editor, expectedRevision) {
      const state = this._read(), activity = this._activity(state, id, expectedRevision);
      const next = draftOf(draft, activity.templateId);
      if (!equal(activity.draft, next)) {
        activity.draft = next;
        activity.revision += 1;
        activity.updatedAt = now();
      }
      activity.editor = editorOf(editor === undefined ? activity.editor : editor, next.lesson);
      this._write(state);
      return clone(activity);
    }

    saveEditor(id, editor) {
      const state = this._read(), activity = this._activity(state, id);
      const next = editorOf(editor, activity.draft.lesson);
      if (!equal(activity.editor, next)) {
        activity.editor = next;
        this._write(state);
      }
      return clone(activity);
    }

    confirm(id, expectedRevision) {
      const state = this._read(), activity = this._activity(state, id, expectedRevision);
      const errors = validate(activity.draft.lesson, activity.draft.settings);
      if (errors.length) throw fault('VALIDATION', '请先补齐活动内容，再确认授课版。', errors);
      if (!isDirty(activity)) return clone(activity);
      const release = {
        id: uid('release'), number: (activity.releases.at(-1)?.number || 0) + 1,
        lesson: clone(activity.draft.lesson), settings: clone(activity.draft.settings),
        createdAt: now(), rendererVersion: RENDERER_VERSION
      };
      activity.releases.push(release);
      activity.activeReleaseId = release.id;
      activity.revision += 1;
      activity.updatedAt = release.createdAt;
      this._write(state);
      return clone(activity);
    }

    fork(id, draft) {
      const state = this._read(), source = this._activity(state, id);
      const copy = draftOf(draft || source.draft, source.templateId), stamp = now();
      const activity = {
        id: uid('activity'), templateId: source.templateId, revision: 0,
        draft: copy, editor: editorOf(source.editor, copy.lesson), releases: [],
        activeReleaseId: null, createdAt: stamp, updatedAt: stamp
      };
      state.activities.push(activity);
      this._write(state);
      return clone(activity);
    }

    startSession(activityId, releaseId) {
      const state = this._read(), activity = this._activity(state, activityId);
      const release = activity.releases.find(item => item.id === (releaseId || activity.activeReleaseId));
      if (!release) throw fault('VALIDATION', '请先确认授课版，再进入课堂。');
      const stamp = now();
      const session = {
        id: uid('session'), activityId, releaseId: release.id, releaseNumber: release.number, revision: 1,
        rendererVersion: release.rendererVersion, lesson: clone(release.lesson), settings: clone(release.settings),
        progress: null, status: 'ready', createdAt: stamp, updatedAt: stamp
      };
      state.sessions.push(session);
      this._write(state);
      return clone(session);
    }

    sessions(activityId) {
      return clone(this._read().sessions.filter(item => activityId === undefined || item.activityId === activityId)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    getSession(id) { return clone(this._read().sessions.find(item => item.id === id) || null); }

    saveProgress(sessionId, progress, expectedRevision) {
      const state = this._read(), session = state.sessions.find(item => item.id === sessionId);
      if (!session) throw fault('VALIDATION', '找不到该课堂记录。');
      if (expectedRevision !== undefined && session.revision !== expectedRevision) throw fault('CONFLICT', '这次课堂已在其他页面更新。请保留当前页面，并载入最新进度或开始新的一轮。', { expectedRevision, actualRevision: session.revision });
      if (session.status === 'ended') throw fault('CONFLICT', '本次课堂已经结束，不能再覆盖进度。');
      session.progress = checkedProgress(progress, session.lesson);
      session.status = session.progress.game.phase === 'complete' ? 'complete' : session.progress.game.phase === 'ready' ? 'ready' : session.progress.paused ? 'paused' : 'active';
      session.revision += 1;
      session.updatedAt = now();
      this._write(state);
      return clone(session);
    }

    endSession(id, expectedRevision) {
      const state = this._read(), session = state.sessions.find(item => item.id === id);
      if (!session) throw fault('VALIDATION', '找不到该课堂记录。');
      if (expectedRevision !== undefined && session.revision !== expectedRevision) throw fault('CONFLICT', '这次课堂已在其他页面更新，不能结束旧进度。请先载入最新课堂。', { expectedRevision, actualRevision: session.revision });
      session.status = 'ended';
      if (session.progress) session.progress.paused = true;
      session.revision += 1;
      session.updatedAt = now();
      this._write(state);
      return clone(session);
    }
  }

  return Object.freeze({ clone, reorderItems, validate, normalizePreparation, preparationSignature, validatePreparation, isDirty, Repository, DEFAULT_SETTINGS, STORAGE_KEY, RENDERER_VERSION });
});
