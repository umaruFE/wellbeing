(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./word-images.js') : root.DoodleWordImages);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DoodleModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (wordImages) {
  'use strict';

  const STORAGE_KEY = 'wellbeing-doodle-v1-activities';
  const SCHEMA_VERSION = 1;
  const WORD = /^[a-z]+(?:[-'][a-z]+)*$/;
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  const text = value => typeof value === 'string' ? value : '';
  // Keep the same tag normalization as the shared WBLanguageGoals parser.
  function normalizeGoals(value) {
    if (!Array.isArray(value)) return [];
    const seen = new Set();
    return value.filter(goal => typeof goal === 'string').map(goal => goal.trim().replace(/\s+/g, ' ')).filter(goal => {
      const key = goal.toLocaleLowerCase();
      if (!goal || seen.has(key)) return false;
      seen.add(key); return true;
    });
  }
  const now = () => new Date().toISOString();
  const newId = () => 'doodle-' + (typeof globalThis.crypto?.randomUUID === 'function'
    ? globalThis.crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2));

  function parseWords(raw) {
    const tokens = String(raw ?? '').split(/[\s,，]+/u).map(word => word.trim().toLowerCase()).filter(Boolean);
    const words = [...new Set(tokens)];
    return { words, duplicates: tokens.length - words.length, invalid: words.filter(word => !WORD.test(word)) };
  }

  function wordCountFor(value) {
    if (!Number.isFinite(value) || value <= 0) return 10;
    return [10, 20, 30, 50].find(count => count >= value) || 50;
  }

  function content(value = {}) {
    const rawWords = own(value, 'rawWords') ? text(value.rawWords)
      : Array.isArray(value.words) ? value.words.map(word => String(word)).join('\n') : '';
    const age = own(value, 'age') ? text(value.age) : '4–6岁';
    const words = parseWords(rawWords).words;
    return {
      id: text(value.id), title: text(value.title), age, wordCount: wordCountFor(value.wordCount),
      description: text(value.description), theme: text(value.theme), requirements: text(value.requirements),
      languageGoals: normalizeGoals(value.languageGoals),
      languageGoalInput: text(value.languageGoalInput), rawWords, words,
      wordImages: wordImages.normalize(value.wordImages, words),
      mode: value.mode === 'pk' ? 'pk' : 'solo',
      practiceSeconds: [0, 60, 120].includes(Number(value.practiceSeconds)) ? Number(value.practiceSeconds) : 0,
      level: ['word', 'sentence', 'describe'].includes(value.level) ? value.level : 'sentence',
      quiet: value.quiet === true,
      rounds: value.rounds === 'all' ? 'all' : [1, 3, 5].includes(Number(value.rounds)) ? Number(value.rounds) : 3
    };
  }

  function normalize(value = {}) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) value = {};
    const item = content(value);
    for (const key of ['createdAt', 'updatedAt', 'sourceCaseId']) {
      if (typeof value[key] === 'string') item[key] = value[key];
    }
    const publication = value._publication;
    if (publication && typeof publication === 'object' && Number.isInteger(publication.version)
      && publication.version > 0 && publication.draft && typeof publication.draft === 'object') {
      item._publication = {
        version: publication.version,
        confirmedAt: text(publication.confirmedAt),
        draft: content(publication.draft)
      };
    }
    return item;
  }

  function blank() {
    const time = now();
    return Object.assign(content({ id: newId() }), { createdAt: time, updatedAt: time });
  }

  function freeze(value) {
    Object.values(value).forEach(child => { if (child && typeof child === 'object') freeze(child); });
    return Object.freeze(value);
  }
  const CASES = freeze([
    content({ id: 'animals', title: '小动物猜猜看', description: '把熟悉的小动物画出来，和伙伴一起说出英文名字。',
      theme: '小动物', requirements: '把熟悉的小动物画出来，和伙伴一起说出英文名字。', languageGoals: ['I can see a cat.', 'fish', 'bird', 'dog', 'rabbit'],
      words: ['cat', 'fish', 'bird', 'dog', 'rabbit'], mode: 'solo', level: 'word' }),
    content({ id: 'food', title: '美味画出来', description: '从水果和点心开始，轮流画画猜词。',
      theme: '水果和点心', requirements: '从水果和点心开始，轮流画画猜词。', languageGoals: ['I like apples.', 'banana', 'pear', 'orange', 'cake'],
      words: ['apple', 'banana', 'pear', 'orange', 'cake'], mode: 'pk', level: 'sentence', rounds: 3 }),
    content({ id: 'everyday', title: '生活小画家', description: '用简单线条画出身边的事物。',
      theme: '生活中的事物', requirements: '用简单线条画出身边的事物。', languageGoals: ['house', 'tree', 'sun', 'car', 'rocket', 'umbrella'],
      words: ['house', 'tree', 'sun', 'car', 'rocket', 'umbrella'], mode: 'solo', level: 'sentence' })
  ]);

  function fromCase(caseId) {
    const source = CASES.find(item => item.id === caseId);
    if (!source) throw new Error('没有找到这个涂鸦案例。');
    const time = now();
    return Object.assign(clone(source), { id: newId(), sourceCaseId: source.id, createdAt: time, updatedAt: time });
  }

  function validate(value) {
    const item = normalize(value), errors = {};
    const parsed = parseWords(item.rawWords);
    if (!item.title.trim()) errors.title = '请填写活动名称。';
    if (!parsed.words.length) errors.words = '请至少添加一个英文单词。';
    else if (parsed.invalid.length) errors.words = '单词只支持英文字母、连字符和英文撇号，请检查：' + parsed.invalid.join('、');
    return errors;
  }

  function signature(value) {
    const item = content(value);
    const { id, rawWords, ...fields } = item;
    fields.title = fields.title.trim();
    return JSON.stringify(fields);
  }

  function hasChanges(value) {
    return !value?._publication || signature(value) !== signature(value._publication.draft);
  }

  function publish(value) {
    const errors = validate(value);
    if (Object.keys(errors).length) {
      const error = new Error('请先补全配置，再确认授课版。');
      error.errors = errors;
      throw error;
    }
    const item = normalize(value);
    if (item._publication && !hasChanges(item)) return item;
    const time = now();
    item.title = item.title.trim();
    item.updatedAt = time;
    item._publication = {
      version: (item._publication?.version || 0) + 1,
      confirmedAt: time,
      draft: content(item)
    };
    return item;
  }

  function decode(raw) {
    if (raw === null) return [];
    const value = JSON.parse(raw);
    if (!value || value.schemaVersion !== SCHEMA_VERSION || !Array.isArray(value.items)) {
      throw new Error('活动记录格式不受支持');
    }
    const ids = new Set();
    return value.items.map(item => {
      if (!item || typeof item !== 'object' || Array.isArray(item) || !text(item.id) || ids.has(item.id)) {
        throw new Error('活动记录缺少唯一标识');
      }
      if (own(item, '_publication')) {
        const publication = item._publication;
        if (!publication || !Number.isInteger(publication.version) || publication.version < 1
          || !publication.draft || typeof publication.draft !== 'object' || Array.isArray(publication.draft)
          || Object.keys(validate(publication.draft)).length) throw new Error('授课版记录不完整');
      }
      ids.add(item.id);
      return normalize(item);
    });
  }

  function read(storage) {
    let baseline;
    try {
      baseline = storage.getItem(STORAGE_KEY);
      return { items: decode(baseline), error: '', baseline };
    } catch (error) {
      return { items: [], error: '未能读取涂鸦活动，原记录已保留。' + (error?.message || ''), baseline };
    }
  }

  function write(storage, items, baseline) {
    try {
      if (baseline === undefined) return { ok: false, error: '尚未成功读取活动记录，请重新载入后再保存。', baseline, conflict: false };
      const current = storage.getItem(STORAGE_KEY);
      if (current !== baseline) return { ok: false, error: '另一个页面已更新涂鸦活动，请先重新载入最新记录。', baseline, conflict: true };
      // Never replace damaged or future-format records merely because their bytes match.
      decode(current);
      if (!Array.isArray(items)) throw new Error('待保存的活动不是列表');
      decode(JSON.stringify({ schemaVersion: SCHEMA_VERSION, items }));
      const serialized = JSON.stringify({ schemaVersion: SCHEMA_VERSION, items: items.map(normalize) });
      decode(serialized);
      storage.setItem(STORAGE_KEY, serialized);
      return { ok: true, error: '', baseline: serialized, conflict: false };
    } catch (error) {
      return { ok: false, error: '保存失败，当前修改仍保留在页面中。' + (error?.message || ''), baseline, conflict: false };
    }
  }

  return { STORAGE_KEY, SCHEMA_VERSION, CASES, clone, blank, fromCase, normalize, parseWords,
    validate, signature, publish, hasChanges, read, write };
});
