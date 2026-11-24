/* Local examples for the teacher generation flow. No network or AI service. */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./model.js'), require('./catalog.js'), require('./word-bank.js'), require('./grammar-bank.js'));
  else root.MMGeneration = factory(root.MMModel, root.MMCatalog, root.MMWordBank, root.MMGrammarBank);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Model, catalog, wordBank, grammarBank) {
  'use strict';

  const ACTIONS = ['left', 'right', 'both', 'squat'];
  const owns = (value, field) => Object.prototype.hasOwnProperty.call(value, field);
  const BASE_NOTE = '当前使用本地词库与既有案例，未接入真实 AI；主题与年龄作为设定保存，不代表已完成 AI 适龄创作。';
  const key = value => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  const word = (english, aliases = '') => ({ word: english, aliases: [english, ...aliases.split('|').filter(Boolean)].map(key) });
  const LEXICON = [
    { id: 'animals', name: '动物', aliases: ['动物', '动物类', 'animal', 'animals'], words: [
      word('cat', '猫|小猫|cats'), word('dog', '狗|小狗|dogs'), word('bird', '鸟|小鸟|birds'),
      word('rabbit', '兔子|兔|rabbits'), word('elephant', '大象|elephants'), word('lion', '狮子|lions'),
      word('tiger', '老虎|tigers'), word('monkey', '猴子|monkeys'), word('duck', '鸭子|ducks')
    ] },
    { id: 'fruit', name: '水果', aliases: ['水果', '水果类', 'fruit', 'fruits'], words: [
      word('apple', '苹果|apples'), word('banana', '香蕉|bananas'), word('orange', '橙子|oranges'),
      word('pear', '梨|梨子|pears'), word('grape', '葡萄|grapes'), word('strawberry', '草莓|strawberries'),
      word('watermelon', '西瓜|watermelons'), word('pineapple', '菠萝|pineapples'), word('lemon', '柠檬|lemons')
    ] },
    { id: 'vegetables', name: '蔬菜', aliases: ['蔬菜', '蔬菜类', 'vegetable', 'vegetables', 'veggie', 'veggies'], words: [
      word('carrot', '胡萝卜|carrots'), word('potato', '土豆|马铃薯|potatoes'), word('broccoli', '西兰花'),
      word('cabbage', '卷心菜|洋白菜|cabbages'), word('spinach', '菠菜'), word('lettuce', '生菜'),
      word('onion', '洋葱|onions'), word('celery', '芹菜'), word('pea', '豌豆|peas')
    ] },
    { id: 'colors', name: '颜色', aliases: ['颜色', '色彩', '颜色类', 'color', 'colors', 'colour', 'colours'], words: [
      word('red', '红色|红'), word('blue', '蓝色|蓝'), word('yellow', '黄色|黄'),
      word('green', '绿色|绿'), word('purple', '紫色|紫'), word('pink', '粉色|粉红色'),
      word('black', '黑色|黑'), word('white', '白色|白'), word('brown', '棕色|褐色')
    ] },
    { id: 'transport', name: '交通工具', aliases: ['交通工具', '交通', '交通工具类', 'transport', 'transportation', 'vehicle', 'vehicles'], words: [
      word('car', '汽车|小汽车|cars'), word('bus', '公交车|公共汽车|巴士|buses'), word('train', '火车|trains'),
      word('bike', '自行车|bicycle|bicycles|bikes'), word('plane', '飞机|airplane|aeroplane|planes'), word('boat', '小船|船|boats'),
      word('truck', '卡车|trucks'), word('taxi', '出租车|taxis'), word('helicopter', '直升机|helicopters')
    ] },
    { id: 'clothes', name: '衣服', aliases: ['衣服', '服装', '衣物', 'clothes', 'clothing', 'clothing items'], words: [
      word('shirt', '衬衫|shirts'), word('hat', '帽子|hats'), word('shoes', '鞋子|鞋|shoe'),
      word('dress', '连衣裙|dresses'), word('socks', '袜子|sock'), word('coat', '外套|大衣|coats'),
      word('skirt', '裙子|半身裙|skirts'), word('T-shirt', 't恤|t恤衫|t shirt|t-shirts'), word('trousers', '裤子|pants')
    ] },
    { id: 'stationery', name: '文具', aliases: ['文具', '学习用品', '文具类', 'stationery', 'school supplies', 'school things'], words: [
      word('pencil', '铅笔|pencils'), word('pen', '钢笔|笔|pens'), word('ruler', '尺子|直尺|rulers'),
      word('eraser', '橡皮|橡皮擦|erasers'), word('notebook', '笔记本|notebooks'), word('crayon', '蜡笔|crayons'),
      word('marker', '马克笔|记号笔|markers'), word('glue stick', '固体胶|glue sticks'), word('scissors', '剪刀')
    ] },
    { id: 'toys', name: '玩具', aliases: ['玩具', '玩具类', 'toy', 'toys'], words: [
      word('ball', '球|皮球|balls'), word('doll', '娃娃|洋娃娃|dolls'), word('kite', '风筝|kites'),
      word('teddy bear', '泰迪熊|玩具熊|teddy bears'), word('puzzle', '拼图|puzzles'), word('yo-yo', '悠悠球|yoyo|yo yo'),
      word('blocks', '积木|building blocks'), word('spinning top', '陀螺|spinning tops'), word('toy robot', '玩具机器人|toy robots')
    ] },
    { id: 'food', name: '食物', aliases: ['食物', '食品', '食物类', 'food', 'foods'], words: [
      word('bread', '面包'), word('rice', '米饭'), word('noodles', '面条|noodle'),
      word('pizza', '披萨|比萨|pizzas'), word('cake', '蛋糕|cakes'), word('sandwich', '三明治|sandwiches'),
      word('cookie', '饼干|cookies'), word('dumpling', '饺子|dumplings'), word('cheese', '奶酪|芝士')
    ] },
    { id: 'drinks', name: '饮料', aliases: ['饮料', '饮品', '饮料类', 'drink', 'drinks', 'beverage', 'beverages'], words: [
      word('water', '水'), word('milk', '牛奶'), word('juice', '果汁'),
      word('tea', '茶'), word('lemonade', '柠檬水'), word('hot chocolate', '热巧克力'),
      word('apple juice', '苹果汁'), word('orange juice', '橙汁'), word('coconut water', '椰子水')
    ] }
  ];
  const supportedCategories = Object.freeze(LEXICON.map(group => group.name));
  const grammarId = names => {
    const values = names.map(key).sort().join('|');
    return values === ['a', 'an', 'the', 'ø'].sort().join('|') ? 'articles-four'
      : values === ['a', 'an'].sort().join('|') ? 'articles-two'
        : values === ['am', 'is', 'are'].sort().join('|') ? 'be-three' : null;
  };

  function fail(code, message, details) {
    const error = new Error(message);
    error.name = 'MoveMatchGenerationError';
    error.code = code;
    if (details) error.details = details;
    throw error;
  }

  function validate(preparation) { return Model.validatePreparation(preparation); }
  function signature(preparation) { return Model.preparationSignature(preparation); }

  function defaults(lesson) {
    if (lesson?.preparation) return Model.clone(Model.normalizePreparation(lesson.preparation));
    if (!lesson) return { theme: '', age: '4–6 岁', languageGoals: [], categoryNames: ['', ''] };
    const themes = { 'articles-four': '冠词分类', 'articles-two': 'a 还是 an', 'be-three': 'be 动词分类' };
    const names = (lesson.categories || []).map(category => category.label);
    return Model.normalizePreparation({
      theme: themes[lesson.id] || lesson.title || '', age: '7–9 岁',
      languageGoals: lesson.mode === 'word-sort'
        ? [...new Set((lesson.items || []).map(item => item.word).filter(Boolean))].slice(0, 6)
        : names,
      categoryNames: names,
      ...(Array.isArray(lesson.items) && lesson.items.length >= 2 ? { questionCount: lesson.items.length } : {})
    });
  }

  function rotate(values, amount) {
    const offset = values.length ? amount % values.length : 0;
    return [...values.slice(offset), ...values.slice(0, offset)];
  }

  function wordPools(names, expanded = true) {
    const groups = names.map(label => ({ label, vocabulary: LEXICON.find(group => group.aliases.some(alias => key(alias) === key(label))) }));
    const unknown = groups.filter(group => !group.vocabulary).map(group => group.label);
    if (unknown.length) fail('UNSUPPORTED_CATEGORY',
      `本地示例暂不支持分类“${unknown.join('、')}”。可用分类：${supportedCategories.join('、')}；也支持 a/an/the/Ø、a/an、am/is/are。未生成或替换内容。`,
      { unsupportedCategories: unknown, supportedCategories: [...supportedCategories] });
    const identities = groups.map(group => group.vocabulary.id);
    if (new Set(identities).size !== identities.length) fail('DUPLICATE_CATEGORY', '这些分类名称指向同一类别，请使用不同分类，例如“动物”和“水果”。');
    if (identities.includes('food') && identities.some(id => ['fruit', 'vegetables'].includes(id))) {
      fail('OVERLAPPING_CATEGORIES', '“食物”包含水果和蔬菜，单选分类会出现重叠。请改用能明确区分的分类，例如“水果、蔬菜、饮料”。');
    }
    const omitOrange = identities.includes('fruit') && identities.includes('colors');
    return { omitOrange, groups: groups.map(group => {
      const seen=new Set();
      const words=[...group.vocabulary.words,...(expanded?wordBank[group.vocabulary.id]:[])];
      const pool=words.filter(item=>{const term=key(item.word);if(seen.has(term)||(omitOrange&&term==='orange'))return false;seen.add(term);return true;});
      return {...group,pool};
    }) };
  }

  function grammarItems(template) {
    const seen=new Set(template.items.map(item=>key(item.sentence)));
    const extra=template.categories.flatMap(category=>(grammarBank[template.id][category.label]||[]).map(item=>({...Model.clone(item),categoryId:category.id})));
    return [...Model.clone(template.items),...extra.filter(item=>{const sentence=key(item.sentence);if(seen.has(sentence))return false;seen.add(sentence);return true;})];
  }

  function questionCountLimits(input) {
    const fallback = message => ({ min: 2, max: 50, defaultCount: 10, supported: false, message });
    const names = Model.normalizePreparation(input).categoryNames;
    if (names.length < 2 || names.length > 4 || names.some(name => !name || Array.from(name).length > 24)
      || new Set(names.map(key)).size !== names.length) return fallback('请先填写 2–4 个不同的分类名称，再设置总题数。');
    try {
      const templateId = grammarId(names);
      if (templateId) {
        const template = catalog.find(lesson => lesson.id === templateId);
        if (!template) return fallback('原 V39 案例尚未加载，暂时无法确定题数。');
        const max = grammarItems(template).length;
        return { min: names.length, max: Math.min(50, max), defaultCount: 10, supported: true };
      }
      const { groups } = wordPools(names);
      const max = groups.reduce((sum, group) => sum + new Set(group.pool.map(item => key(item.word))).size, 0);
      return { min: names.length, max: Math.min(50, max), defaultCount: 10, supported: true };
    } catch (error) { return fallback(error.message); }
  }

  function balancedCounts(total, capacities) {
    const minimum = capacities.length, maximum = capacities.reduce((sum, size) => sum + size, 0);
    if (!Number.isInteger(total) || total < minimum || total > maximum || capacities.some(size => size < 1)) {
      fail('QUESTION_COUNT_CAPACITY', `当前分类可提供 ${minimum}–${maximum} 道不重复题目，请调整总题数。`, { min: minimum, max: maximum, questionCount: total });
    }
    const counts = capacities.map(() => 1);
    for (let remaining = total - minimum; remaining > 0; remaining -= 1) {
      let next = -1;
      capacities.forEach((capacity, index) => { if (counts[index] < capacity && (next < 0 || counts[index] < counts[next])) next = index; });
      counts[next] += 1;
    }
    return counts;
  }

  function itemGoalValues(item) {
    return [item.word, item.keyword, item.sentence, item.archiveText, item.answerText,
      item.sentence.replace('___', item.answerText).replace(/\s+/g, ' ')].filter(Boolean).map(key);
  }

  function grammarExample(preparation, templateId, round) {
    const template = catalog.find(lesson => lesson.id === templateId);
    if (!template) fail('MISSING_TEMPLATE', '原 V39 案例尚未加载，请重新加载后再生成。');
    const lesson = Model.clone(template);
    lesson.categories = preparation.categoryNames.map((label, index) => {
      const category = template.categories.find(item => key(item.label) === key(label));
      return { ...Model.clone(category), label, action: ACTIONS[index] };
    });
    const expanded=owns(preparation,'questionCount')&&preparation.questionCount>template.items.length;
    lesson.items = rotate(expanded?grammarItems(template):lesson.items, round);
    if (owns(preparation, 'questionCount')) {
      const pools = lesson.categories.map(category => lesson.items.filter(item => item.categoryId === category.id));
      const counts = balancedCounts(preparation.questionCount, pools.map(pool => pool.length));
      const genericGoals = new Set(lesson.categories.map(category => key(category.label)));
      const selectedIds = new Set();
      pools.forEach((pool, index) => {
        const preferred = [];
        for (const goal of preparation.languageGoals) {
          if (genericGoals.has(key(goal))) continue;
          pool.forEach(item => { if (itemGoalValues(item).includes(key(goal)) && !preferred.includes(item)) preferred.push(item); });
        }
        [...preferred, ...pool.filter(item => !preferred.includes(item))].slice(0, counts[index]).forEach(item => selectedIds.add(item.id));
      });
      lesson.items = lesson.items.filter(item => selectedIds.has(item.id));
    }
    const known = new Set(lesson.categories.map(category => key(category.label)));
    for (const item of lesson.items) {
      for (const value of itemGoalValues(item)) known.add(value);
    }
    const unmatchedGoals = preparation.languageGoals.filter(goal => {
      if (known.has(key(goal))) return false;
      const parts = String(goal).split(/[\/·,，|]/).map(key).filter(Boolean);
      return parts.length < 2 || !parts.every(part => lesson.categories.some(category => key(category.label) === part));
    });
    const notes = [BASE_NOTE, expanded?'语法内容来自 V39 原题及扩充的本地例题，分类按输入顺序分配动作。':'语法内容沿用 V39 既有案例；分类按输入顺序分配动作，句子、正确答案和配图保留原案例。'];
    if (owns(preparation, 'questionCount')) notes.push(`从${expanded?'本地扩展':'原'}题池选出 ${lesson.items.length} 道题，按分类尽量均分，不重复题目。`);
    if (round) notes.push('本次仅在本地题池中调整选题和题序，没有调用实时生成服务。');
    return { lesson, notes, unmatchedGoals };
  }

  function wordExample(preparation, round) {
    const explicitCount = owns(preparation, 'questionCount');
    const { groups, omitOrange } = wordPools(preparation.categoryNames, explicitCount);
    const counts = explicitCount ? balancedCounts(preparation.questionCount, groups.map(group => group.pool.length)) : groups.map(() => 3);
    const covered = new Set(), selections = groups.map((group, index) => {
      // Without a picture/context, “orange” can mean a fruit or a colour.
      const vocabulary = group.pool;
      const preferred = [];
      for (const goal of preparation.languageGoals) {
        const match = vocabulary.find(item => item.aliases.includes(key(goal)));
        if (match && !preferred.includes(match)) preferred.push(match);
      }
      const selected = [...preferred, ...rotate(vocabulary, (round % vocabulary.length) * 3).filter(item => !preferred.includes(item))].slice(0, counts[index]);
      preparation.languageGoals.forEach(goal => {
        if (selected.some(item => item.aliases.includes(key(goal)))) covered.add(goal);
      });
      return { ...group, id: 'group-' + (index + 1), action: ACTIONS[index], selected };
    });
    const categories = selections.map(group => ({
      id: group.id, label: group.label, action: group.action,
      rule: `把属于“${group.label}”的单词放在这一组。`, unit: 'word'
    }));
    // Interleave the groups so each has a turn before its next example.
    const items = [];
    for (let roundIndex = 0; roundIndex < Math.max(...counts); roundIndex += 1) {
      selections.forEach(group => {
        if (!group.selected[roundIndex]) return;
        const term = group.selected[roundIndex].word;
        items.push({
          id: group.id + '-item-' + (roundIndex + 1), word: term, keyword: term,
          categoryId: group.id, answerText: group.label, archiveText: term,
          sentence: '', context: '', hint: `想一想这个词是否属于“${group.label}”。`,
          explanation: `${term} 属于“${group.label}”。`, imageAlt: '', art: null, type: 'word-sort'
        });
      });
    }
    const notes = [BASE_NOTE, explicitCount
      ? `共 ${items.length} 道题，按分类尽量均分（${counts.join(' / ')}）；优先采用可匹配的语言目标，不重复题目。`
      : '每类提供 3 个词；优先采用可匹配的语言目标，其余由本地示例词补齐。'];
    if (omitOrange) notes.push('同时包含水果与颜色时，纯文字 orange 存在歧义，本地示例不使用该词。');
    if (preparation.languageGoals.some(goal => !covered.has(goal))) notes.push('未进入本次题目的目标会单独列出，不表示这些目标已被生成或覆盖。');
    if (round) notes.push('本次更换的是本地词库示例，已选入的目标词仍优先保留。');
    return {
      lesson: { title: preparation.theme || preparation.categoryNames.join(' / ') + '分类', subtitle: preparation.categoryNames.join(' · '), mode: 'word-sort', categories, items },
      notes, unmatchedGoals: preparation.languageGoals.filter(goal => !covered.has(goal))
    };
  }

  function generate(input, { lessonId = 'custom', round = 0 } = {}) {
    const errors = validate(input);
    if (errors.length) fail('INVALID_PREPARATION', errors.find(error => error.field === 'questionCount')?.message || '请先补齐基础信息和 2–4 个不同的分类名称。', errors);
    if (typeof lessonId !== 'string' || !lessonId.trim()) fail('INVALID_LESSON_ID', '活动标识不能为空。');
    if (!Number.isSafeInteger(round) || round < 0) fail('INVALID_ROUND', '本地示例轮次应为非负整数。');
    const preparation = Model.normalizePreparation(input), inputSignature = signature(preparation);
    const templateId = grammarId(preparation.categoryNames);
    const result = templateId ? grammarExample(preparation, templateId, round) : wordExample(preparation, round);
    if (result.unmatchedGoals.length && !result.notes.some(note => note.includes('未进入本次题目'))) {
      result.notes.push('未进入本次题目的语言目标未作自动改写，请核对未覆盖目标列表。');
    }
    const lesson = result.lesson;
    lesson.id = lessonId.trim();
    lesson.preparation = Model.clone(preparation);
    lesson.generation = {
      source: 'local-example', inputSignature, notes: [...result.notes],
      unmatchedGoals: [...result.unmatchedGoals], createdAt: new Date().toISOString()
    };
    return { lesson, settings: Model.clone(Model.DEFAULT_SETTINGS), notes: [...result.notes], unmatchedGoals: [...result.unmatchedGoals], inputSignature };
  }

  return Object.freeze({ defaults, generate, signature, validate, questionCountLimits, supportedCategories });
});
