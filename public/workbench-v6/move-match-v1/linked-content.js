/* Deterministic content links for verified local examples. No storage or AI calls. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./model.js'), require('./catalog.js'), require('./question-art.js'), require('./generation.js'));
  else root.MMLinkedContent = factory(root.MMModel, root.MMCatalog, root.MMQuestionArt, root.MMGeneration);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Model, catalog, Art, Generation) {
  'use strict';

  const text = value => typeof value === 'string' ? value : '';
  const key = value => text(value).trim().toLowerCase().replace(/\s+/g, ' ');
  // Only terminal punctuation/capitalization is ignored. Internal punctuation,
  // negation, extra clauses and changed word order are never guessed away.
  const sentenceKey = value => key(value).replace(/[.!?。！？]+$/u, '').trim();
  const FIELDS = ['sentence', 'word', 'keyword', 'categoryId', 'answerText', 'art', 'imageUrl', 'imageAlt', 'context', 'hint', 'explanation', 'archiveText', 'type'];
  const imageByWord = new Map();
  for (const option of Art.options) imageByWord.set(key(option.label.split('（')[0]), { art: option.id });
  imageByWord.set('grape', { art: 'grapes' });
  for (const lesson of catalog) for (const item of lesson.items) {
    if (item.imageUrl && !imageByWord.has(key(item.word))) imageByWord.set(key(item.word), { imageUrl: item.imageUrl });
  }
  // Explicit reviewed forms, not an s-suffix rule. The article belongs to the
  // recorded pronunciation, not the first spelling character.
  const FORMS = [
    ['flowers', 'flower', 'a'], ['cars', 'car', 'a'], ['cats', 'cat', 'a'], ['dogs', 'dog', 'a'], ['books', 'book', 'a'],
    ['birds', 'bird', 'a'], ['rabbits', 'rabbit', 'a'], ['trains', 'train', 'a'], ['buses', 'bus', 'a'], ['bikes', 'bike', 'a'],
    ['hats', 'hat', 'a'], ['balls', 'ball', 'a'], ['pencils', 'pencil', 'a'], ['apples', 'apple', 'an'], ['oranges', 'orange', 'an'],
    ['eggs', 'egg', 'an'], ['bananas', 'banana', 'a'], ['pears', 'pear', 'a'], ['carrots', 'carrot', 'a']
  ];
  const pluralForms = new Map(FORMS.map(([plural, singular, article]) => [plural, { plural, singular, article }]));
  const singularForms = new Map(FORMS.map(([plural, singular, article]) => [singular, { plural, singular, article }]));

  function clean(item) {
    const result = Model.clone(item);
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new TypeError('题目必须是对象。');
    delete result.contentSync;
    return result;
  }

  function baselineOf(item) {
    const metadata = item?.contentSync;
    return metadata && ['pending', 'review'].includes(metadata.status) && metadata.baseline && typeof metadata.baseline === 'object'
      ? clean(metadata.baseline) : clean(item);
  }

  function begin(item) {
    const result = clean(item);
    result.contentSync = { status: 'pending', baseline: baselineOf(item) };
    return result;
  }

  function visibleImage(item) {
    if (!Art.source(item)) return false;
    const metadata = item?.contentSync;
    if (!metadata || !['pending', 'review'].includes(metadata.status)) return true;
    if (!metadata.baseline || typeof metadata.baseline !== 'object') return false;
    const before = metadata.baseline;
    const wordMode = item.type === 'word-sort' || (!text(item.sentence).trim() && text(item.word).trim());
    return wordMode ? key(item.word) === key(before.word) : sentenceKey(item.sentence) === sentenceKey(before.sentence);
  }

  function result(kind, item, before, message) {
    const next = clean(item);
    const changes = FIELDS.filter(field => JSON.stringify(before[field] ?? null) !== JSON.stringify(next[field] ?? null))
      .map(field => ({ field, before: before[field] === undefined ? null : Model.clone(before[field]), after: next[field] === undefined ? null : Model.clone(next[field]) }));
    return { kind, item: next, message, changes };
  }

  function withoutTeaching(item, wordMode) {
    const next = clean(item);
    delete next.imageUrl;
    next.art = null;
    next.imageAlt = '';
    for (const field of ['categoryId', 'answerText', 'context', 'hint', 'explanation', 'archiveText']) next[field] = '';
    next.word = wordMode ? text(item.word) : '';
    next.keyword = wordMode ? text(item.word) : '';
    next.type = wordMode ? 'word-sort' : 'sentence-gap';
    return next;
  }

  function manual(item, before, wordMode, message) {
    return result('manual', withoutTeaching(item, wordMode), before,
      message || '本地规则无法可靠判断这次修改。已移除旧配图和教学说明，请核对分类、语境、提示、解释与收集卡后再继续。');
  }

  function applyImage(item, word, imageAlt = word) {
    delete item.imageUrl;
    delete item.art;
    const source = imageByWord.get(key(word));
    if (source) Object.assign(item, source);
    else item.art = null;
    item.imageAlt = source ? imageAlt : '';
  }

  function categoryFor(lesson, label) {
    return (lesson.categories || []).find(category => key(category.label) === key(label));
  }

  function analyzeSentence(item, lesson, before, preserveTeaching) {
    const sentence = text(item.sentence), normalized = sentenceKey(sentence);
    const classificationEdited = item.categoryId !== before.categoryId || item.answerText !== before.answerText;
    if (preserveTeaching && !classificationEdited && normalized === sentenceKey(before.sentence)) {
      const next = clean(item);
      const known = catalog.flatMap(template => template.items).find(entry => sentenceKey(entry.sentence) === normalized);
      if (known) {
        delete next.art;
        delete next.imageUrl;
        if (known.art) next.art = known.art;
        else next.art = null;
        if (known.imageUrl) next.imageUrl = known.imageUrl;
        next.imageAlt = known.imageAlt || '';
        next.word = known.word;
        next.keyword = known.keyword;
      }
      return result('auto', next, before, '题意未改变，保留已有分类和教学说明；已知例题的配图按题目内容匹配。');
    }
    // Restore complete known teaching bundles, including their authoritative
    // picture. This also repairs legacy flowers + car-image mismatches.
    for (const template of catalog) {
      const known = template.items.find(entry => sentenceKey(entry.sentence) === normalized);
      if (!known) continue;
      const originalCategory = template.categories.find(category => category.id === known.categoryId);
      const category = categoryFor(lesson, originalCategory.label);
      if (!category) return manual(item, before, false, `这句已验证例题需要“${originalCategory.label}”分类，当前活动没有该分类。请核对题目或返回调整分类。`);
      const next = clean(item);
      for (const field of FIELDS) delete next[field];
      Object.assign(next, clean(known), { id: item.id, sentence, categoryId: category.id });
      const categoryChanged = classificationEdited || (!!before.categoryId && before.categoryId !== category.id);
      return result(categoryChanged ? 'review' : 'auto', next, classificationEdited ? item : before, classificationEdited
        ? `这道本地已验证例题仍对应“${category.label}”分类，请核对当前分类与配套说明后采用。`
        : categoryChanged ? `已找到 V39 已验证整题；正确分类将改为“${category.label}”，请核对后采用。`
        : '已按 V39 已验证例题同步配图、答案与教学说明。');
    }
    const match = normalized.match(/^i love ___ ([a-z]+)$/);
    if (match && pluralForms.has(match[1])) {
      const form = pluralForms.get(match[1]), category = categoryFor(lesson, 'Ø');
      if (!category) return manual(item, before, false, '这句本地模板表达复数泛指，需要不填（Ø）分类；当前活动没有该分类，请核对。');
      const next = clean(item);
      Object.assign(next, {
        word: form.plural, keyword: form.plural, categoryId: category.id, answerText: '', type: 'sentence-gap',
        context: `All ${form.plural} in general.`,
        hint: `Do we mean some particular ${form.plural}, or ${form.plural} in general?`,
        explanation: `${form.plural[0].toUpperCase() + form.plural.slice(1)} is plural and we mean ${form.plural} in general. No article is needed.`,
        archiveText: form.plural
      });
      applyImage(next, form.singular, form.plural);
      const categoryChanged = classificationEdited || (!!before.categoryId && before.categoryId !== category.id);
      return result(categoryChanged ? 'review' : 'auto', next, classificationEdited ? item : before, categoryChanged
        ? '这句已验证模板表达复数泛指，正确分类需要改为不填（Ø）；请核对新的语境、答案与说明后采用。'
        : '已按已验证的“复数泛指”模板同步；不填（Ø），配图与教学说明已更新。');
    }
    if (match && singularForms.has(match[1])) {
      const form = singularForms.get(match[1]), definite = categoryFor(lesson, 'the'), indefinite = categoryFor(lesson, form.article);
      const category = definite || indefinite;
      if (!category) return manual(item, before, false, `单数 ${form.singular} 不能沿用复数泛指的空答案；当前分类也没有适用的已验证建议，请核对。`);
      const next = clean(item);
      Object.assign(next, {
        sentence: definite ? sentence : `I see ___ ${form.singular}.`,
        word: form.singular, keyword: form.singular, categoryId: category.id,
        answerText: definite ? 'the' : form.article, archiveText: `${definite ? 'the' : form.article} ${form.singular}`, type: 'sentence-gap',
        context: definite ? `We are pointing to one particular ${form.singular} that we both can identify.` : `One ${form.singular}, mentioned for the first time.`,
        hint: definite ? `Can we both identify which ${form.singular} is meant?` : `We are introducing one ${form.singular}. Listen to its first sound.`,
        explanation: definite ? `We mean one particular ${form.singular} that we can identify. Use the.` : `We are introducing one ${form.singular}. Use ${form.article}.`
      });
      applyImage(next, form.singular);
      return result('review', next, before, definite
        ? `“${form.singular}”是单数，不能直接沿用 Ø。这里建议“指双方都认得的某一个${form.singular}”，使用 the；请确认这是否符合你的句意。`
        : `“${form.singular}”是单数，不能直接沿用 Ø。这里建议改为“I see ___ ${form.singular}.”，表示第一次提到一个事物，使用 ${form.article}；请核对句子和语境。`);
    }
    if (!classificationEdited && sentence !== text(before.sentence) && normalized === sentenceKey(before.sentence)) {
      return result('auto', { ...clean(before), id: item.id, sentence }, before, '仅调整了大小写、空白或句末标点，保留原有分类、配图和教学说明。');
    }
    return manual(item, before, false);
  }

  const wordCache = new Map();
  function knownWordInCategory(input, label) {
    const cacheKey = JSON.stringify([key(input), key(label)]);
    if (wordCache.has(cacheKey)) return wordCache.get(cacheKey);
    // The public generator owns the aliases. Two disjoint filler categories
    // ensure a goal covered by the filler is not misattributed to the target.
    const probes = [];
    for (const filler of ['文具', '玩具', '交通工具']) {
      try {
        const generated = Generation.generate({ theme: '', age: '7–9岁', languageGoals: [input], categoryNames: [label, filler], questionCount: 2 });
        probes.push(generated.unmatchedGoals.length ? null : generated.lesson.items.find(entry => entry.categoryId === generated.lesson.categories[0].id).word);
        if (probes.length === 2) break;
      } catch (error) {
        // A filler equivalent to the target is rejected by the generator.
        // Other unsupported category combinations also cannot prove a match.
      }
    }
    const canonical = probes.length === 2 && probes[0] && probes[0] === probes[1] ? probes[0] : null;
    wordCache.set(cacheKey, canonical);
    return canonical;
  }

  function analyzeWord(item, lesson, before, preserveTeaching) {
    const input = text(item.word).trim();
    const classificationEdited = item.categoryId !== before.categoryId || item.answerText !== before.answerText;
    if (!input) return manual(item, before, true, '请先填写题目词卡；旧配图与教学说明已移除。');
    if (preserveTeaching && !classificationEdited && key(input) === key(before.word)) {
      const next = clean(item), category = (lesson.categories || []).find(entry => entry.id === item.categoryId);
      const canonical = category && knownWordInCategory(input, category.label);
      if (canonical) applyImage(next, canonical, item.word);
      next.keyword = item.word;
      if (before.archiveText === before.word) next.archiveText = item.word;
      return result('auto', next, before, '词义未改变，保留已有分类和教学说明；已知词条的配图按内容匹配。');
    }
    // Keep the generator's whole-activity ambiguity checks (such as orange
    // when fruit and colour categories coexist) rather than bypassing them.
    try {
      const generated = Generation.generate({ theme: '', age: '7–9岁', languageGoals: [input], categoryNames: lesson.categories.map(category => category.label), questionCount: lesson.categories.length });
      if (generated.unmatchedGoals.length) return manual(item, before, true, '这个词未被当前分类的本地规则覆盖，或存在分类歧义。已移除旧配图和说明，请核对后再继续。');
    } catch (error) {
      return manual(item, before, true, '当前分类组合无法由本地词库可靠判断。已移除旧配图和说明，请核对后再继续。');
    }
    const matches = lesson.categories.map(category => ({ category, word: knownWordInCategory(input, category.label) })).filter(entry => entry.word);
    if (matches.length !== 1) return manual(item, before, true);
    const { category, word } = matches[0], next = clean(item);
    Object.assign(next, {
      word, keyword: word, sentence: '', categoryId: category.id, answerText: category.label, archiveText: word,
      context: '', hint: `想一想这个词是否属于“${category.label}”。`, explanation: `${word} 属于“${category.label}”。`, type: 'word-sort'
    });
    applyImage(next, word);
    const categoryChanged = classificationEdited || (!!before.categoryId && before.categoryId !== category.id);
    return result(categoryChanged ? 'review' : 'auto', next, classificationEdited ? item : before, classificationEdited
      ? `本地词库中“${word}”对应“${category.label}”，请核对当前分类；采用后将同步分类与教学说明。`
      : categoryChanged ? `本地词库将“${input}”对应为 ${word}，正确分类需要改为“${category.label}”；请核对后采用。`
      : `已按本地词库同步“${word}”的分类与教学说明${Art.source(next) ? '，并匹配配图。' : '；没有对应配图，使用纯文字。'}`);
  }

  function analyze(item, lesson) {
    const current = clean(item), before = baselineOf(item);
    // begin() is the explicit entry to a new text edit. Re-finishing an already
    // reviewed item must not replace the teacher's completed manual decisions.
    if (item.contentSync?.status === 'synced') return result('auto', current, current, '本题已完成核对，保留当前内容。');
    return lesson.mode === 'word-sort' ? analyzeWord(current, lesson, before, ['pending', 'review'].includes(item.contentSync?.status))
      : analyzeSentence(current, lesson, before, ['pending', 'review'].includes(item.contentSync?.status));
  }

  return Object.freeze({ clean, begin, analyze, visibleImage });
});
