(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./model.js'));
  else root.YogaLibrary = factory(root.YogaModel);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (M) {
  'use strict';
  if (!M) throw new Error('请先加载瑜伽课程模型。');

  const KEY = 'wellbeing-prep-six-modules-v1-unified-yoga-v1';
  const PREVIOUS_KEY = 'wellbeing-prep-six-modules-v1-yoga-library-v3';
  const OLDER_KEY = 'wellbeing-prep-six-modules-v1-yoga-library-v2';
  const LEGACY_KEY = 'wellbeing-prep-six-modules-v1-yoga-prototype-v1';
  // Historical records retain their own six-page snapshots and source id.
  const LEGACY_FOREST_CASE = Object.freeze({ id: 'forest', title: '森林里的身体探险', description: '从森林入口出发，跟随四个样例动作，观察树、飞鸟、星光和蝴蝶。', theme: '森林探险', age: '5–7 岁', pages: 6, duration: 8, characterId: 'poppy' });
  const CASES = Object.freeze([
    Object.freeze({ id: 'wonder', title: 'A Walk in Wonder', description: '跟随蓝色伙伴穿过草地与森林，经过岩石、湖河和山顶，在自然中伸展、平衡与休息。', theme: '自然漫步', age: '5–7 岁', pages: 11, duration: 8, characterId: 'wonder-blue' }),
    Object.freeze({ id: 'ocean', title: '海底的身体探险', description: '走进海底情境，结合鱼、海草、海星和贝壳的英语表达，完成四个样例动作。', theme: '海底探险', age: '5–7 岁', pages: 6, duration: 8, characterId: 'edi' })
  ]);
  const STATE_FIELDS = Object.keys(M.createState());
  const FORM_FIELDS = Object.keys(M.createState().settings);
  const WORKSPACE_FIELDS = ['form', 'prompt', 'backgroundPrompt', 'pageId', 'step', 'scope', 'adjustment', 'backgroundAdjustment'];
  const ADJUSTMENT_KINDS = ['page', 'course', 'english', 'action'];
  const fail = message => { throw new Error(message); };
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const jsonClone = value => JSON.parse(JSON.stringify(value));
  let serial = 0;

  function identifier(value) {
    return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value);
  }
  function timestamp(value) {
    return typeof value === 'string' && /^\d{4}-\d\d-\d\dT/.test(value) && Number.isFinite(Date.parse(value));
  }
  function nowString(now) {
    const date = now === undefined ? new Date() : new Date(now);
    if (!Number.isFinite(date.getTime())) fail('课程记录时间无效。');
    return date.toISOString();
  }
  function newId(now) {
    // No crypto or browser globals required; the counter also separates same-tick creations.
    serial += 1;
    return `yoga-${Date.parse(now).toString(36)}-${Math.random().toString(36).slice(2, 10) || '0'}-${serial.toString(36)}`;
  }
  function fingerprint(value) {
    const canonical = item => Array.isArray(item) ? item.map(canonical) : object(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key, canonical(item[key])])) : item;
    const text = JSON.stringify(canonical(value));
    let first = 2166136261, second = 2246822507;
    for (let i = 0; i < text.length; i++) {
      first = Math.imul(first ^ text.charCodeAt(i), 16777619);
      second = Math.imul(second ^ text.charCodeAt(i), 3266489909);
    }
    return `legacy-${(first >>> 0).toString(36)}-${(second >>> 0).toString(36)}-${text.length.toString(36)}`;
  }
  function conflict() {
    const error = new Error('这套课程已在其他标签页保存。请重新读取较新的保存记录，或把当前内容另存为副本。');
    error.code = 'COURSE_CONFLICT';
    throw error;
  }
  function validModel(state) {
    if (!object(state) || STATE_FIELDS.some(field => !own(state, field))) fail('课程记录缺少完整状态，不能只保存页面或草稿。');
    if (!object(state.settings) || FORM_FIELDS.some(field => !own(state.settings, field))) fail('课程记录缺少完整基础设定，未完成输入请保存在表单中。');
    for (const field of ['draft', 'published', 'candidate', 'job', 'lastJob']) {
      if (state[field] !== null && !object(state[field])) fail('课程记录的草稿、授课版本或任务状态无效。');
    }
    return M.validateState(state);
  }
  function validAdjustment(raw, state) {
    if (!state.draft) fail('尚未生成课程，不能保存内容调整面板。');
    if (!object(raw) || Object.keys(raw).some(key => !['open', 'kind', 'pageId', 'drafts'].includes(key)) || typeof raw.open !== 'boolean' || !Array.isArray(raw.drafts)) fail('内容调整面板的格式无效。');
    function validTarget(target) {
      if (!ADJUSTMENT_KINDS.includes(target.kind)) fail('内容调整对象无效。');
      if (target.kind === 'course') {
        if (target.pageId !== null) fail('整课调整不能绑定单页。');
      } else {
        const page = state.draft.pages.find(item => item.id === target.pageId);
        if (!page) fail('内容调整的目标页面不属于这套课程。');
        if (target.kind === 'action' && page.kind !== 'action') fail('封面和结尾不能保存主动作调整。');
      }
    }
    validTarget(raw);
    if (raw.drafts.length > 1 + 3 * state.draft.pages.length) fail('保存的调整输入数量超过课程范围。');
    const targets = new Set();
    for (const draft of raw.drafts) {
      if (!object(draft) || Object.keys(draft).some(key => !['kind', 'pageId', 'prompt'].includes(key)) || typeof draft.prompt !== 'string' || draft.prompt.length > 600) fail('调整输入格式无效，提示词最多保留 600 个字符。');
      validTarget(draft);
      const key = JSON.stringify([draft.kind, draft.pageId]);
      if (targets.has(key)) fail('同一个调整对象不能保存重复输入。');
      targets.add(key);
    }
  }
  function validWorkspace(raw, state) {
    if (!object(raw)) fail('课程编辑位置的格式无效。');
    if (Object.keys(raw).some(key => !WORKSPACE_FIELDS.includes(key))) fail('课程编辑位置含有不支持的字段。');
    const result = jsonClone(raw);
    for (const field of ['prompt', 'backgroundPrompt']) {
      if (own(raw, field) && (typeof raw[field] !== 'string' || raw[field].length > 600)) fail('修改提示词最多保留 600 个字符。');
    }
    if (own(raw, 'step') && (!Number.isInteger(raw.step) || raw.step < 1 || raw.step > 4)) fail('课程制作步骤必须在 1–4 之间。');
    if (own(raw, 'scope') && !['page', 'course'].includes(raw.scope)) fail('课程修改范围无效。');
    if (own(raw, 'adjustment')) validAdjustment(raw.adjustment, state);
    if (own(raw, 'backgroundAdjustment')) {
      const value = raw.backgroundAdjustment;
      if (!state.draft) fail('尚未生成课程，不能保存背景调整对象。');
      if (!object(value) || Object.keys(value).some(key => !['pageId', 'drafts'].includes(key)) || !Array.isArray(value.drafts)) fail('背景调整对象格式无效。');
      const pageExists = id => typeof id === 'string' && state.draft.pages.some(page => page.id === id);
      if (!pageExists(value.pageId)) fail('背景调整的目标页面不属于这套课程。');
      if (value.drafts.length > state.draft.pages.length) fail('背景调整输入数量超过课程范围。');
      const targets = new Set();
      for (const draft of value.drafts) {
        if (!object(draft) || Object.keys(draft).some(key => !['pageId', 'prompt'].includes(key)) || typeof draft.prompt !== 'string' || draft.prompt.length > 600) fail('背景调整输入格式无效，提示词最多保留 600 个字符。');
        if (!pageExists(draft.pageId)) fail('背景调整的目标页面不属于这套课程。');
        if (targets.has(draft.pageId)) fail('同一页面不能保存重复背景调整输入。');
        targets.add(draft.pageId);
      }
    }
    if (own(raw, 'pageId') && raw.pageId !== null) {
      if (typeof raw.pageId !== 'string' || !state.draft || !state.draft.pages.some(page => page.id === raw.pageId)) fail('保存的当前页面不属于这套课程。');
    }
    if (own(raw, 'form')) {
      if (state.draft) fail('已有课程使用正式设定，未完成表单仅用于尚未生成的课程。');
      if (!object(raw.form) || Object.keys(raw.form).some(key => ![...FORM_FIELDS,'languageGoals','pendingLanguageGoal'].includes(key))) fail('未完成课程表单格式无效。');
      for (const [key, value] of Object.entries(raw.form)) {
        if(key === 'languageGoals'){
          if(!Array.isArray(value)||value.some(item=>typeof item!=='string'||item.length>1000))fail('语言目标格式无效。');
        } else if (key === 'words' && Array.isArray(value)) {
          if (value.length > 50 || value.some(word => typeof word !== 'string' || word.length > 180)) fail('未完成表单的目标词汇过长。');
        } else if (key === 'duration') {
          if (!['number', 'string'].includes(typeof value) || typeof value === 'number' && !Number.isFinite(value) || String(value).length > 20) fail('未完成表单的课程时长格式无效。');
        } else if (typeof value !== 'string' || value.length > ({ title: 70, context: 500, goal: 220, sentence: 220, words: 180, age: 40, theme: 100, characterId: 40 }[key] || 600)) {
          fail('未完成课程表单包含无效或过长内容。');
        }
      }
    }
    return result;
  }
  function validRecord(raw) {
    if (!object(raw) || !identifier(raw.id)) fail('课程记录编号无效。');
    if (!timestamp(raw.createdAt) || !timestamp(raw.updatedAt) || Date.parse(raw.updatedAt) < Date.parse(raw.createdAt)) fail('课程记录的创建或更新时间无效。');
    if (raw.sourceCaseId !== null && raw.sourceCaseId !== LEGACY_FOREST_CASE.id && !CASES.some(item => item.id === raw.sourceCaseId)) fail('课程案例来源无效。');
    const state = validModel(raw.state);
    const workspace = validWorkspace(raw.workspace === undefined ? {} : raw.workspace, state);
    if (own(raw, 'saveRevision') && (!Number.isSafeInteger(raw.saveRevision) || raw.saveRevision < 0)) fail('课程保存版本无效。');
    if (own(raw, 'saveToken') && (typeof raw.saveToken !== 'string' || !identifier(raw.saveToken))) fail('课程保存标识无效。');
    if (own(raw, 'saveRevision') !== own(raw, 'saveToken')) fail('课程保存版本与标识必须同时提供。');
    if (own(raw, 'archived') && typeof raw.archived !== 'boolean') fail('课程归档状态无效。');
    if (own(raw, 'displayTitle') && (typeof raw.displayTitle !== 'string' || !raw.displayTitle.trim() || raw.displayTitle.trim().length > 70)) fail('课程名称需填写 1–70 个字符。');
    return { ...jsonClone(raw), id: raw.id, state, workspace, createdAt: raw.createdAt, updatedAt: raw.updatedAt, sourceCaseId: raw.sourceCaseId,
      archived: own(raw, 'archived') ? raw.archived : false, ...(own(raw, 'displayTitle') ? { displayTitle: raw.displayTitle.trim() } : {}),
      saveRevision: own(raw, 'saveRevision') ? raw.saveRevision : 0, saveToken: own(raw, 'saveToken') ? raw.saveToken : fingerprint(raw) };
  }
  function recordToken(record) { return record === null || record === undefined ? null : validRecord(record).saveToken; }
  function createLibrary() { return { schema: 1, activeId: null, items: [] }; }
  function validate(raw) {
    try {
      const value = typeof raw === 'string' ? JSON.parse(raw) : jsonClone(raw);
      if (!object(value) || value.schema !== 1 || !Array.isArray(value.items) || !own(value, 'activeId')) fail('课程集合版本或结构无效。');
      const items = value.items.map(validRecord);
      if (new Set(items.map(item => item.id)).size !== items.length) fail('课程集合存在重复编号。');
      if (value.activeId !== null && (!identifier(value.activeId) || !items.some(item => item.id === value.activeId))) fail('当前课程编号不在课程集合中。');
      return { ...value, schema: 1, activeId: value.activeId, items };
    } catch (error) {
      if (error && /[\u3400-\u9fff]/.test(error.message)) throw error;
      fail('课程集合无法读取，请保留原记录后再恢复。');
    }
  }
  function createRecord(state, options) {
    const opts = options || {}, time = nowString(opts.now);
    return validRecord({ id: opts.id === undefined ? newId(time) : opts.id, state: validModel(state),
      createdAt: time, updatedAt: time, sourceCaseId: opts.sourceCaseId === undefined ? null : opts.sourceCaseId,
      saveRevision: 0, saveToken: `save-${newId(time)}`,
      ...(own(opts, 'displayTitle') ? { displayTitle: opts.displayTitle } : {}), ...(own(opts, 'archived') ? { archived: opts.archived } : {}),
      workspace: opts.workspace === undefined ? {} : opts.workspace });
  }
  function displayTitle(record) { return record.displayTitle || record.workspace.form && record.workspace.form.title || record.state.settings.title; }
  function renameRecord(record, title) {
    const result = validRecord(record);
    return validRecord({ ...result, displayTitle: title });
  }
  function duplicateRecord(record, options) {
    const source = validRecord(record), opts = options || {}, state = jsonClone(source.state);
    if (state.job) Object.assign(state, M.cancelJob(state));
    state.published = null; state.versions = []; state.candidate = null; state.job = null; state.lastJob = null; state.nextJobId = 1;
    delete state.undo;
    if (state.draft) { state.draft.locked = false; state.draft.revision = 1; }
    const workspace = jsonClone(source.workspace);
    if (workspace.adjustment) workspace.adjustment.open = false;
    const title = own(opts, 'displayTitle') ? opts.displayTitle : `副本 · ${displayTitle(source)}`.slice(0, 70);
    return createRecord(state, { id: opts.id, now: opts.now, sourceCaseId: source.sourceCaseId, workspace, displayTitle: title });
  }
  function importCollection(existing, raw, options) {
    const current = validate(existing), imported = validate(raw), opts = options || {};
    const records = imported.items.map(item => {
      const state = item.state.job ? M.cancelJob(item.state) : jsonClone(item.state);
      delete state.undo;
      return createRecord(state, { now: opts.now, sourceCaseId: item.sourceCaseId, workspace: item.workspace, displayTitle: `导入 · ${displayTitle(item)}`.slice(0, 70) });
    });
    let collection = current;
    for (const item of records) collection = upsert(collection, item);
    return { collection, records };
  }
  function upsert(collection, record) {
    const result = validate(collection), incoming = validRecord(record);
    const index = result.items.findIndex(item => item.id === incoming.id);
    if (index < 0) result.items.push(incoming);
    else {
      const previous = result.items[index];
      result.items[index] = { ...incoming, createdAt: previous.createdAt, sourceCaseId: incoming.sourceCaseId === null ? previous.sourceCaseId : incoming.sourceCaseId };
    }
    result.activeId = incoming.id;
    return validate(result);
  }
  function get(collection, id) {
    const record = validate(collection).items.find(item => item.id === id);
    return record ? jsonClone(record) : null;
  }
  function read(storage, key) {
    if (!storage || typeof storage.getItem !== 'function') fail('当前环境无法读取本地课程记录。');
    try { return storage.getItem(key); }
    catch (_) { fail('无法读取本地课程记录，尚未覆盖任何保存内容。'); }
  }
  function readCollection(storage, options) {
    for (const key of [KEY, PREVIOUS_KEY, OLDER_KEY, 'wellbeing-prep-six-modules-v1-yoga-library-v1']) {
      const raw = read(storage, key);
      if (raw !== null && raw !== undefined) return validate(raw);
    }
    const legacy = read(storage, LEGACY_KEY);
    let collection = createLibrary();
    if (legacy !== null && legacy !== undefined) {
      let old;
      try { old = validModel(JSON.parse(legacy)); }
      catch (error) { fail(`旧版课程记录无法迁移，原记录仍保留。${error && /[\u3400-\u9fff]/.test(error.message) ? error.message : ''}`); }
      const item = createRecord(old, { id: 'legacy-course-v1', now: options && options.now });
      item.saveToken = fingerprint(old);
      collection = upsert(collection, item);
    }
    return collection;
  }
  function load(storage, options) {
    const collection = readCollection(storage, options);
    // A reload cannot resume the old page's timer. Cancel in memory only; save remains explicit.
    return { ...collection, items: collection.items.map(record => record.state.job ? { ...record, state: M.cancelJob(record.state) } : record) };
  }
  function persist(storage, collection, record, options) {
    const local = validate(collection), incoming = validRecord(record);
    const legacyRecord = local.items.find(item => item.id === 'legacy-course-v1');
    const disk = readCollection(storage, legacyRecord ? { now: legacyRecord.createdAt } : undefined);
    const previous = disk.items.find(item => item.id === incoming.id);
    const expected = options && own(options, 'expectedToken') ? options.expectedToken : null;
    if (previous ? expected !== recordToken(previous) : expected !== null) conflict();
    // Disk wins for all other existing records; do not overwrite another tab's newer course.
    const existingIds = new Set(disk.items.map(item => item.id));
    const merged = { ...disk, items: disk.items.concat(local.items.filter(item => !existingIds.has(item.id))) };
    const time = nowString();
    const result = upsert(merged, { ...incoming, saveRevision: previous ? previous.saveRevision + 1 : 1, saveToken: `save-${newId(time)}` });
    if (!storage || typeof storage.setItem !== 'function') fail('当前环境无法保存本地课程记录。');
    try { storage.setItem(KEY, JSON.stringify(result)); }
    catch (_) { fail('课程保存失败，当前编辑内容仍保留，请重试或导出备份。'); }
    return result;
  }
  const cases = new Map();
  function getCase(caseId) {
    const meta = CASES.find(item => item.id === caseId) || (caseId === LEGACY_FOREST_CASE.id ? LEGACY_FOREST_CASE : null);
    if (!meta) fail('找不到这个瑜伽案例。');
    if (!cases.has(caseId)) {
      const initial = M.createState();
      let state = caseId === 'wonder' ? M.createWonderState() : M.generateCourse(initial, { ...initial.settings, title: meta.title, theme: meta.theme, characterId: meta.characterId });
      state = M.confirmContent(state);
      state = M.startAssets(state);
      state = M.finishAssets(state, state.job.id);
      state = M.publish(state);
      cases.set(caseId, M.validateState(state));
    }
    return jsonClone(cases.get(caseId));
  }
  function cloneCase(caseId) {
    const result = M.forkDraft(getCase(caseId));
    result.published = null; result.versions = []; result.candidate = null; result.job = null; result.lastJob = null;
    result.draft.revision = 1; result.nextJobId = 1;
    return M.validateState(result);
  }
  return { KEY, PREVIOUS_KEY, OLDER_KEY, LEGACY_KEY, CASES, createLibrary, load, validate, createRecord, upsert, persist, recordToken, renameRecord, duplicateRecord, importCollection, get, getCase, cloneCase };
});
