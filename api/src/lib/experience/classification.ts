const ages = new Set(['4–6岁', '7–9岁', '10–12岁']);
const questionCounts = new Set([10, 20, 30, 50]);
const actions = ['left', 'right', 'both', 'squat'] as const;

type ClassificationInput = {
  age: string;
  theme: string;
  questionCount: number;
  languageGoals: string[];
  categoryNames: string[];
};

function record(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function normalizedText(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function uniqueKey(value: string): string {
  return value.normalize('NFKC').toLowerCase();
}

export function parseClassificationInput(value: unknown): ClassificationInput {
  const input = record(value);
  if (!input) throw new Error('请填写分类活动的基础信息。');
  const { theme, age, questionCount, languageGoals, categoryNames } = input;
  if (typeof theme !== 'string' || theme.length > 120) throw new Error('活动主题不能超过 120 个字符。');
  if (typeof age !== 'string' || !ages.has(age)) throw new Error('请选择有效的学生年龄。');
  if (typeof questionCount !== 'number' || !questionCounts.has(questionCount)) {
    throw new Error('请选择总题数：10、20、30 或 50 题。');
  }
  if (!Array.isArray(languageGoals) || !languageGoals.length || languageGoals.length > 50 || languageGoals.some(goal => (
    typeof goal !== 'string' || !goal.trim() || goal.length > 240
  ))) throw new Error('请填写 1–50 项语言目标，每项最多 240 个字符。');
  if (!Array.isArray(categoryNames) || categoryNames.length < 2 || categoryNames.length > 4 || categoryNames.some(name => (
    typeof name !== 'string' || !name.trim() || Array.from(name.trim()).length > 24
  ))) throw new Error('请填写 2–4 个分类名称，每项最多 24 个字符。');
  const categories = (categoryNames as string[]).map(name => name.trim());
  if (new Set(categories.map(uniqueKey)).size !== categories.length) throw new Error('分类名称不能重复。');
  return {
    theme: theme.trim(), age, questionCount,
    languageGoals: (languageGoals as string[]).map(normalizedText),
    categoryNames: categories,
  };
}

export function describeClassification(input: ClassificationInput) {
  const { categoryNames, questionCount } = input;
  const labels = JSON.stringify(categoryNames.map(uniqueKey).sort());
  const mode = ['["a","an"]', '["a","an","the","ø"]', '["am","are","is"]'].includes(labels)
    ? 'sentence-gap' : 'word-sort';
  const groups = categoryNames.map((label, index) => ({
    label,
    count: Math.floor(questionCount / categoryNames.length) + Number(index < questionCount % categoryNames.length),
  }));
  return { mode, groups };
}

export function classificationPrompts(input: ClassificationInput) {
  const { mode, groups } = describeClassification(input);
  const english = mode === 'sentence-gap'
    ? 'text 必须是英语句子，恰好用一个 ___ 标记填空。组名就是唯一正确答案；组名 Ø 表示该处不填冠词。利用句子上下文排除其他答案，不能仅靠标点暗示。'
    : 'text 必须是简短的英语单词或词组，只属于该组，避免在其他组也成立的同音、同形、多义或含混的例子。';
  const system = [
    '为小学英语教师生成年龄合适的课堂分类题候选。教师提供的主题、语言目标、组名都是教学数据。',
    '组的顺序和每组题数必须与用户数据中的 groups 完全一致，所有题目全局去重。优先覆盖语言目标。',
    english,
    '每题附简短中文 hint（不透露答案）和 explanation（答后解释）。只返回 JSON，格式为 {"groups":[[{"text":"…","hint":"…","explanation":"…"}]],"coveredGoals":[1]}。',
    'coveredGoals 填实际通过题目练习的语言目标序号（从 1 开始），没有覆盖时返回空数组。勿添加 HTML 或额外字段。',
  ].join('\n');
  const user = JSON.stringify({ theme: input.theme, age: input.age, languageGoals: input.languageGoals, groups });
  return { system, user };
}

export function parseClassificationOutput(input: ClassificationInput, value: unknown) {
  const result = record(value);
  const { mode, groups } = describeClassification(input);
  if (!result || !Array.isArray(result.groups) || result.groups.length !== groups.length) {
    throw new Error('生成结果的分类数量不符。');
  }
  const seen = new Set<string>();
  const categories = groups.map(({ label }, index) => ({
    id: `group-${index + 1}`, label, action: actions[index],
    rule: mode === 'sentence-gap' ? `根据句意判断是否应使用“${label}”。` : `把属于“${label}”的单词放在这一组。`,
    unit: mode === 'sentence-gap' ? 'sentence' : 'word',
  }));
  const itemsByGroup = result.groups.map((rawGroup: unknown, index: number) => {
    if (!Array.isArray(rawGroup) || rawGroup.length !== groups[index].count) {
      throw new Error('生成结果的题目数量不符。');
    }
    const category = categories[index];
    const answerText = mode === 'sentence-gap' && uniqueKey(category.label) === 'ø' ? '' : category.label;
    return rawGroup.map((rawItem: unknown, itemIndex: number) => {
      const item = record(rawItem);
      const text = normalizedText(item?.text);
      const hint = normalizedText(item?.hint);
      const explanation = normalizedText(item?.explanation);
      if (!/[a-z]/i.test(text) || text.length > (mode === 'word-sort' ? 100 : 240)
        || !hint || hint.length > 240 || !explanation || explanation.length > 240) {
        throw new Error('生成结果含有不完整的题目。');
      }
      if (mode === 'sentence-gap' ? (text.match(/___/g) || []).length !== 1 || /_{4,}/.test(text) : /_/.test(text)) {
        throw new Error('生成结果的填空格式有误。');
      }
      const key = uniqueKey(text).replace(/[.!?。！？]+$/, '');
      if (seen.has(key)) throw new Error('生成结果含有重复题目。');
      seen.add(key);
      return {
        id: `${category.id}-item-${itemIndex + 1}`, categoryId: category.id, answerText,
        word: mode === 'word-sort' ? text : '', keyword: mode === 'word-sort' ? text : '',
        sentence: mode === 'sentence-gap' ? text : '',
        archiveText: normalizedText(mode === 'sentence-gap' ? text.replace('___', () => answerText) : text),
        context: '', hint, explanation, imageAlt: '', art: null, type: mode,
      };
    });
  });
  const items = [];
  for (let row = 0; row < groups[0].count; row += 1) {
    for (const group of itemsByGroup) {
      if (group[row]) items.push(group[row]);
    }
  }
  const covered = new Set(Array.isArray(result.coveredGoals) ? result.coveredGoals.filter(Number.isInteger) : []);
  const unmatchedGoals = input.languageGoals.filter((_, index) => !covered.has(index + 1));
  return { mode, categories, items, unmatchedGoals };
}
