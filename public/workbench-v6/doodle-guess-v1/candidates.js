(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DoodleCandidates = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // Explicit local vocabulary, not a language model or image-recognition service.
  // Plurals are listed individually: there is deliberately no generic stemming.
  const rows = [
    ['cat', ['cats'], ['猫', '小猫'], ['animals']],
    ['dog', ['dogs'], ['狗', '小狗'], ['animals']],
    ['fish', ['fishes'], ['鱼', '小鱼'], ['animals', 'sea']],
    ['bird', ['birds'], ['鸟', '小鸟'], ['animals']],
    ['rabbit', ['rabbits', 'bunny', 'bunnies'], ['兔子', '小兔'], ['animals']],
    ['duck', ['ducks'], ['鸭子', '小鸭'], ['animals', 'farm']],
    ['cow', ['cows'], ['奶牛'], ['animals', 'farm']],
    ['sheep', [], ['绵羊'], ['animals', 'farm']],
    ['pig', ['pigs'], ['猪', '小猪'], ['animals', 'farm']],
    ['horse', ['horses'], ['马', '小马'], ['animals', 'farm']],
    ['elephant', ['elephants'], ['大象'], ['animals']],
    ['tiger', ['tigers'], ['老虎'], ['animals']],
    ['lion', ['lions'], ['狮子'], ['animals']],
    ['monkey', ['monkeys'], ['猴子'], ['animals']],
    ['panda', ['pandas'], ['熊猫', '大熊猫'], ['animals']],
    ['turtle', ['turtles'], ['乌龟', '海龟'], ['animals', 'sea']],
    ['butterfly', ['butterflies'], ['蝴蝶'], ['animals', 'nature']],
    ['crab', ['crabs'], ['螃蟹'], ['animals', 'sea']],
    ['whale', ['whales'], ['鲸鱼'], ['animals', 'sea']],
    ['octopus', ['octopuses'], ['章鱼'], ['animals', 'sea']],
    ['apple', ['apples'], ['苹果'], ['fruit', 'food']],
    ['banana', ['bananas'], ['香蕉'], ['fruit', 'food']],
    ['pear', ['pears'], ['梨', '梨子'], ['fruit', 'food']],
    ['orange', ['oranges'], ['橙子', '橘子'], ['fruit', 'food']],
    ['strawberry', ['strawberries'], ['草莓'], ['fruit', 'food']],
    ['grape', ['grapes'], ['葡萄'], ['fruit', 'food']],
    ['watermelon', ['watermelons'], ['西瓜'], ['fruit', 'food']],
    ['lemon', ['lemons'], ['柠檬'], ['fruit', 'food']],
    ['cake', ['cakes'], ['蛋糕'], ['food']],
    ['bread', ['loaf', 'loaves'], ['面包'], ['food']],
    ['egg', ['eggs'], ['鸡蛋'], ['food']],
    ['carrot', ['carrots'], ['胡萝卜'], ['food', 'vegetables']],
    ['tomato', ['tomatoes'], ['番茄', '西红柿'], ['food', 'vegetables']],
    ['potato', ['potatoes'], ['土豆'], ['food', 'vegetables']],
    ['pumpkin', ['pumpkins'], ['南瓜'], ['food', 'vegetables']],
    ['ice-cream', ['ice cream', 'ice creams', 'ice-creams'], ['冰淇淋', '冰激凌'], ['food']],
    ['pizza', ['pizzas'], ['披萨'], ['food']],
    ['book', ['books'], ['书本', '图书', '书'], ['school']],
    ['pencil', ['pencils'], ['铅笔'], ['school']],
    ['pen', ['pens'], ['钢笔'], ['school']],
    ['ruler', ['rulers'], ['尺子', '直尺'], ['school']],
    ['eraser', ['erasers'], ['橡皮擦', '橡皮'], ['school']],
    ['bag', ['bags', 'schoolbag', 'schoolbags'], ['书包', '背包'], ['school']],
    ['scissors', [], ['剪刀'], ['school']],
    ['crayon', ['crayons'], ['蜡笔'], ['school']],
    ['desk', ['desks'], ['课桌', '书桌'], ['school', 'home']],
    ['chair', ['chairs'], ['椅子'], ['school', 'home']],
    ['clock', ['clocks'], ['时钟', '钟表'], ['school', 'home']],
    ['car', ['cars'], ['汽车', '小汽车'], ['transport']],
    ['bus', ['buses'], ['公交车', '公共汽车', '巴士'], ['transport']],
    ['train', ['trains'], ['火车'], ['transport']],
    ['plane', ['planes', 'airplane', 'airplanes'], ['飞机'], ['transport']],
    ['boat', ['boats'], ['小船', '船'], ['transport', 'sea']],
    ['bike', ['bikes', 'bicycle', 'bicycles'], ['自行车', '单车'], ['transport']],
    ['rocket', ['rockets'], ['火箭'], ['transport', 'space']],
    ['truck', ['trucks'], ['卡车', '货车'], ['transport']],
    ['sun', ['suns'], ['太阳'], ['nature', 'space']],
    ['moon', ['moons'], ['月亮'], ['nature', 'space']],
    ['star', ['stars'], ['星星'], ['nature', 'space']],
    ['cloud', ['clouds'], ['云朵', '白云'], ['nature']],
    ['tree', ['trees'], ['大树', '树木', '树'], ['nature', 'everyday']],
    ['flower', ['flowers'], ['花朵', '鲜花'], ['nature']],
    ['mountain', ['mountains'], ['山峰', '大山'], ['nature']],
    ['rainbow', ['rainbows'], ['彩虹'], ['nature']],
    ['leaf', ['leaves'], ['树叶', '叶子'], ['nature']],
    ['snowman', ['snowmen'], ['雪人'], ['nature']],
    ['house', ['houses'], ['房子', '房屋'], ['home', 'everyday']],
    ['door', ['doors'], ['房门', '门'], ['home']],
    ['window', ['windows'], ['窗户'], ['home']],
    ['table', ['tables'], ['桌子'], ['home']],
    ['cup', ['cups'], ['杯子', '水杯'], ['home']],
    ['bottle', ['bottles'], ['瓶子', '水瓶'], ['home']],
    ['umbrella', ['umbrellas'], ['雨伞', '伞'], ['everyday']],
    ['ball', ['balls'], ['球', '皮球'], ['toys']],
    ['kite', ['kites'], ['风筝'], ['toys']],
    ['balloon', ['balloons'], ['气球'], ['toys']],
    ['teddy-bear', ['teddy bear', 'teddy bears', 'teddy-bears'], ['泰迪熊', '玩具熊'], ['toys']],
    ['doll', ['dolls'], ['娃娃', '玩偶'], ['toys']],
    ['hat', ['hats'], ['帽子'], ['clothes']],
    ['shoe', ['shoes'], ['鞋子', '鞋'], ['clothes']],
    ['sock', ['socks'], ['袜子'], ['clothes']],
    ['t-shirt', ['t-shirts', 't shirt', 't shirts'], ['T恤', 't恤'], ['clothes']],
    ['hand', ['hands'], ['手掌', '小手'], ['body']],
    ['eye', ['eyes'], ['眼睛'], ['body']],
    ['nose', ['noses'], ['鼻子'], ['body']],
    ['ear', ['ears'], ['耳朵'], ['body']],
    ['mouth', ['mouths'], ['嘴巴'], ['body']]
  ];
  const topicRows = [
    ['animals', '动物', ['animal', 'animals', 'pets', 'pet', '动物', '宠物']],
    ['fruit', '水果', ['fruit', 'fruits', '水果']],
    ['food', '食物', ['food', 'foods', 'snack', 'snacks', '食物', '美食', '点心', '食物']],
    ['vegetables', '蔬菜', ['vegetable', 'vegetables', '蔬菜']],
    ['school', '学校用品', ['school', 'classroom', 'stationery', 'school supplies', '学校', '文具', '教室', '学习用品']],
    ['transport', '交通工具', ['transport', 'transportation', 'vehicle', 'vehicles', '交通', '交通工具']],
    ['nature', '自然', ['nature', 'weather', 'garden', '自然', '天气', '花园']],
    ['home', '家居', ['home', 'furniture', 'household', '家居', '家具', '家里']],
    ['everyday', '日常事物', ['everyday', 'daily life', '生活', '日常']],
    ['toys', '玩具', ['toy', 'toys', '玩具']],
    ['clothes', '衣物', ['clothes', 'clothing', '衣服', '衣物', '服装']],
    ['body', '身体部位', ['body', 'body parts', '身体', '五官']],
    ['sea', '海洋', ['sea', 'ocean', '海洋', '海底']],
    ['farm', '农场', ['farm', '农场']],
    ['space', '太空', ['space', '太空', '宇宙']]
  ];

  const safeText = value => typeof value === 'string' ? value : '';
  const escapeRE = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const entries = rows.map(([word, aliases, chinese, topics]) => ({word, aliases: [word, ...aliases, ...chinese], topics}));
  const byWord = new Map(entries.map(entry => [entry.word, entry]));
  const topics = topicRows.map(([id, label, aliases]) => ({id, label, aliases}));
  const byTopic = new Map(topics.map(topic => [topic.id, topic]));

  function context(config = {}) {
    if (!config || typeof config !== 'object') config = {};
    const age = safeText(config.age);
    const wordCount = normalizeCount(config.wordCount);
    return { requirements: safeText(config.requirements), age, wordCount,
      languageGoals: Array.isArray(config.languageGoals) ? config.languageGoals.filter(goal => typeof goal === 'string') : [],
      languageGoalInput: safeText(config.languageGoalInput) };
  }
  const signature = config => JSON.stringify(context(config));

  function occurrences(source, alias) {
    const input = source.toLowerCase(), term = alias.toLowerCase(), found = [];
    // English matches need complete words; a substring inside "bus" or
    // "category" must never turn into a candidate or be singularized.
    if (/^[a-z\s'-]+$/.test(term)) {
      const expression = new RegExp('(^|[^a-z\'-])(' + escapeRE(term) + ')(?=$|[^a-z\'-])', 'g');
      for (const match of input.matchAll(expression)) found.push({start: match.index + match[1].length, length: term.length});
    } else {
      let start = input.indexOf(term);
      while (start !== -1) { found.push({start, length: term.length}); start = input.indexOf(term, start + term.length); }
    }
    return found;
  }

  function scan(source, list, identity) {
    const found = [];
    for (const entry of list) for (const alias of entry.aliases) {
      for (const occurrence of occurrences(source, alias)) found.push({...occurrence, entry});
    }
    found.sort((a, b) => a.start - b.start || b.length - a.length);
    const accepted = [], seen = new Set();
    let previousEnd = -1;
    for (const match of found) {
      if (match.start < previousEnd) continue;
      previousEnd = match.start + match.length;
      if (seen.has(match.entry[identity])) continue;
      seen.add(match.entry[identity]); accepted.push(match);
    }
    return accepted;
  }

  function excluded(source, position) {
    const before = source.slice(0, position).split(/[,，。;；!！?？\n]/).pop().toLowerCase();
    return /(?:不要|不含|不使用|排除|避免|不选|不能|勿|别|\bwithout\b|\bavoid\b|\bexclude\b|\bno\b)/.test(before);
  }

  function normalizeCount(value) {
    if (!Number.isFinite(value) || value <= 0) return 10;
    return [10, 20, 30, 50].find(count => count >= value) || 50;
  }

  function generate(config) {
    const input = context(config), sourceSignature = signature(config);
    const requestedCount = input.wordCount;
    const candidates = [], selected = new Set(), unmatched = [], omittedGoals = [], omitted = new Set();
    const bannedWords = new Set(), bannedTopics = new Set(), expansion = [], relatedExpansion = [];
    const requirementWords = scan(input.requirements, entries, 'word');
    const requirementTopics = scan(input.requirements, topics, 'id');
    for (const match of requirementWords) if (excluded(input.requirements, match.start)) bannedWords.add(match.entry.word);
    for (const match of requirementTopics) if (excluded(input.requirements, match.start)) bannedTopics.add(match.entry.id);
    const allowed = entry => !bannedWords.has(entry.word) && !entry.topics.some(topic => bannedTopics.has(topic));
    const add = (entry, reason) => {
      if (!entry || selected.has(entry.word) || !allowed(entry) || candidates.length >= requestedCount) return;
      selected.add(entry.word); candidates.push({word: entry.word, reason});
    };
    const expand = (list, id, reason) => {
      if (!bannedTopics.has(id) && ![...expansion, ...relatedExpansion].some(item => item.id === id)) list.push({id, reason});
    };

    const goals = [...input.languageGoals, ...input.languageGoalInput.split(/[\r\n]+/)]
      .map(goal => goal.trim().replace(/\s+/g, ' ')).filter(Boolean);
    const goalSeen = new Set();
    for (const goal of goals) {
      if (goalSeen.has(goal.toLocaleLowerCase())) continue;
      goalSeen.add(goal.toLocaleLowerCase());
      const matches = scan(goal, entries, 'word').filter(match => allowed(match.entry));
      if (!matches.length) { unmatched.push(goal); continue; }
      for (const {entry} of matches) {
        const reason = '语言目标中的实体：' + goal + '（本地词库匹配）';
        if (selected.has(entry.word) || omitted.has(entry.word)) continue;
        if (candidates.length < requestedCount) add(entry, reason);
        else { omitted.add(entry.word); omittedGoals.push({word: entry.word, reason}); }
      }
    }
    for (const match of requirementWords) {
      if (!excluded(input.requirements, match.start)) {
        add(match.entry, '补充要求中提到：' + input.requirements.trim() + '（本地词库匹配）');
      }
    }
    for (const match of requirementTopics) if (!excluded(input.requirements, match.start)) {
      expand(expansion, match.entry.id, '补充要求建议：' + match.entry.label + '（本地词库）');
    }
    // Only explicit word matches seed related topics. Suggestions do not seed
    // another expansion, so a short fruit pool cannot drift into unrelated food.
    for (const candidate of candidates) for (const topic of byWord.get(candidate.word).topics) {
      expand(relatedExpansion, topic, '相关主题扩展：' + byTopic.get(topic).label + '（本地词库）');
    }
    const fill = list => {
      const pools = list.map(topic => ({...topic, words: entries.filter(entry => entry.topics.includes(topic.id) && allowed(entry))}));
      let progressed = true;
      while (candidates.length < requestedCount && progressed) {
        progressed = false;
        for (const pool of pools) {
          const entry = pool.words.find(word => !selected.has(word.word));
          if (entry) { add(entry, pool.reason); progressed = true; }
          if (candidates.length >= requestedCount) break;
        }
      }
    };
    fill(expansion);
    fill(relatedExpansion);
    if (!goals.length && !input.requirements.trim()) {
      const examples = ['apple', 'cat', 'house', 'sun', 'dog', 'tree', 'ball', 'car', 'fish', 'bird',
        'banana', 'flower', 'book', 'cup', 'star', 'moon', 'boat', 'hat', 'kite', 'cake',
        'rabbit', 'duck', 'cow', 'sheep', 'pig', 'horse', 'elephant', 'tiger', 'lion', 'monkey',
        'panda', 'turtle', 'butterfly', 'crab', 'whale', 'octopus', 'pear', 'orange', 'strawberry', 'grape',
        'watermelon', 'lemon', 'bread', 'egg', 'carrot', 'tomato', 'potato', 'pizza', 'pencil', 'pen'];
      for (const word of examples) add(byWord.get(word), '未填写活动要求或语言目标，提供常见画词示例（本地词库）');
    }
    return {candidates, unmatched, omittedGoals, requestedCount, shortfall: requestedCount - candidates.length, sourceSignature};
  }

  return Object.freeze({generate, signature});
});
