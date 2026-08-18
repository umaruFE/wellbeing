export const SONG_WRITING_SYSTEM_PROMPTS = [
  'For the Word Bank, return a wordEmojis object in addition to words. Each key must exactly match one item in words, and each value must be one emoji that directly represents that word or phrase. Keep words as plain English text only: do not put emojis inside words, because the words are inserted into lyric blanks.',
  '你是儿童英语歌曲创编与幸福力教学专家。仅返回合法 JSON。歌词必须严格适配指定旋律的节奏、句长和副歌结构；词库只提供能够填入歌词 ______ 的单词或短语，不能使用无关词。',
] as const;

// 各旋律的详细歌词规范（来源于 api/src/md/audio/歌词规范*.md）
export const MELODY_RULES: Record<string, string> = {
  Edelweiss: `【旋律：Edelweiss · 硬约束】
- 固定 8 行结构
- L1: 3+3 对仗结构（如 "Feelings come, feelings go"），短促轻盈，定调
- L2: 6-8 音节（含填空词），流动舒展
- L3: 3+3 对仗，与 L1 平行或呼应
- L4: 6-8 音节（含填空词），与 L2 平行
- L5: 7-8 音节（含填空词），全曲最长行，★旋律最高点，情感峰
- L6: 6-8 音节（含填空词），从 L5 回落
- L7: 3+3，回归 L1 结构，点题句位置（承载核心隐喻）
- L8: 7-8 音节，最终落定，收束句位置（不设空格）
- 空格规则：每行最多 1 个空格（______），空格总行数 ≤ 4 行；空格不放在行末（保证尾词可押韵）
- 建议空格位置：L2/L4/L5/L6，L7/L8 固定不设空
- Word Bank 词汇量 = 空格数 + 2-3 个干扰词
- 句式策略：避免同一句式重复，每行句式应有变化
- 设计流程：先定歌名和 L7 点题句 → 再定 L8 收束句 → 定 L5 高潮行 → 定 L1+L3 对仗策略 → 分配空格 → 逐行验算音节`,

  "You Are My Sunshine": `【旋律：You Are My Sunshine · 硬约束】
- 2 段 × 4 行 = 8 行段落式结构，有明显段落感
- 每行中间有逗号分隔，形成"前半句—停顿—后半句"的节奏
- L1: 7-9 音节（含填空词），第一段起句
- L2: 7-9 音节（含填空词），承接 L1
- L3: 7-9 音节（含填空词），第一段情感高点
- L4: 7-8 音节，第一段点题句，固定不设空
- L5: 7-9 音节（含填空词），第二段起句
- L6: 7-9 音节（含填空词），承接 L5
- L7: 7-9 音节（含填空词），全曲情感最高点
- L8: 7-8 音节，第二段收束句，固定不设空
- 空格规则：每行最多 1 个空格（______）；空格放在前半句（逗号前），后半句固定保证尾词押韵
- 默认每段 3 个空格，共 6 个（L1/L2/L3 + L5/L6/L7）；若用户明确要求减少填空，可改为每段 2 个，共 4 个
- 前半句句型：两段使用统一句型模板（如 "When I am ___" / "In the ___"）
- 后半句句型：每行不同，动作/感受各不重复
- Word Bank 词汇量 = 空格数 + 2-3 个干扰词
- 设计流程：先定 L4 点题句 → 再定 L8 收束句 → 定前半句统一句型 → 定后半句动作 → 分配空格 → 逐行验算`,

  'Twinkle, Twinkle, Little Star': `【旋律：Twinkle Twinkle Little Star · 硬约束】
- 6 行 A-B-C-D-A-B 循环式结构
- 每行 ~7 音节（含填空词），全曲节奏均匀，无高峰低谷
- 每行是一个完整短语，无行内逗号停顿
- L1: 起句，通常包含歌名/核心意象
- L2: 上扬疑问或号召，呼应 L1
- L3: 展开画面，描述性或叙事性
- L4: 回落收束，完成第一轮画面
- L5: ★完全重复 L1（逐字相同）
- L6: ★完全重复 L2（逐字相同）
- 空格规则：每行最多 1 个空格（______），空格总行数 2-4 行；空格不放在行末
- L1/L2 通常固定（因为 L5/L6 要完全重复），但如果 L1 设空则 L5 对应位置也设空
- 句式策略：L1/L2 用不同句式，L3/L4 用不同句式，避免重复
- Word Bank 词汇量 = 空格数 + 2-3 个干扰词
- 设计流程：先定歌名和 L1 核心意象 → 再定 L2 号召/疑问 → 定 L3-L4 展开画面 → 分配空格 → 逐行验算`,

  "If You're Happy and You Know It": `【旋律：If You're Happy and You Know It · 硬约束】
- 8 行条件-动作交替结构
- L1/L3/L5/L7: 条件句，★完全相同（逐字一致），~8-9 音节，按主题重写，不设空格
- L2/L4/L8: 动作句，~3 音节，固定 2 音节 + 空 ≤ 1 音节 = 3 音节，★含一个空格
- L6: 桥接句，~8 音节，可设空（可选）
- 旋律呼吸：条件句舒展，动作句短促有力，形成"呼—吸—呼—吸"节奏
- 空格规则：动作句必设空（L2/L4/L8 各 1 个），桥接句 L6 可选
- 空格总行数 3-4 行，每行最多 1 个空格（______），空格不放在行末
- L2/L4/L8 句式可以不同（如展示/补充/收尾），但都必须 = 2 固定音节 + 1 空 ≤1 音节
- Word Bank 词汇量 = 空格数 + 2-3 个干扰词
- 设计流程：先定主题和歌名 → 定 L1 条件句（四行完全相同）→ 定 L2/L4/L8 动作句 → 定 L6 桥接句 → 分配空格 → 逐行验算`,
};

export function getMelodyRules(melody: string): string {
  return MELODY_RULES[melody] || '';
}

export interface SongWritingPromptInput {
  age: string;
  level: string;
  participants: string;
  themeText: string;
  vocabulary: string;
  grammar: string;
  melody: string;
  melodyReference: string;
  adjustmentRequest?: string;
  currentLines?: string[];
  currentWords?: string[];
}

export function buildSongWritingUserPrompt(input: SongWritingPromptInput) {
  const conditions = [
    `学生年龄=${input.age || '7-9岁'}`,
    `英文水平=${input.level || '初级（会字母和简单词）'}`,
    `参与人数=${input.participants || '未指定'}`,
    `幸福力主题=${input.themeText}`,
    `核心词汇=${input.vocabulary || '未指定，请根据主题和年龄自选适合的词汇'}`,
    `核心句型/语法=${input.grammar || '未指定，请根据主题和水平自选适合的句型'}`,
    `旋律=${input.melody}`,
    `本次具体调整需求=${input.adjustmentRequest || '无额外要求'}`,
  ];

  const rules = getMelodyRules(input.melody);
  const isRevision = Boolean(input.adjustmentRequest?.trim() && input.currentLines?.length);
  const currentBlankCount = (input.currentLines || []).reduce((total, line) => total + (line.match(/______/g) || []).length, 0);
  const requestedBlankTarget = input.adjustmentRequest?.includes('填空太多')
    ? Math.max(0, currentBlankCount - 2)
    : input.adjustmentRequest?.includes('填空太少')
      ? currentBlankCount + 1
      : null;
  const currentVersion = isRevision
    ? `\n当前版本（必须以此为基础做出可见修改）：\n歌词：\n${input.currentLines!.map((line, index) => `L${index + 1}: ${line}`).join('\n')}\nWord Bank：${(input.currentWords || []).join(', ') || '无'}\n`
    : '';
  const revisionRules = isRevision
    ? `\n本次是定向修订，不是重新随机创作。调整需求的优先级高于“建议空格位置/建议空格数量”，但仍须满足旋律、行数和音节硬约束。逐项落实用户要求：
- “核心语言点丢失”：必须让核心词汇和核心句型真实出现在固定歌词或可由 Word Bank 填入的空格中；如果核心词汇未填写，则优先保留当前 Word Bank 的关键词。
- “填空太多”：空格总数必须少于当前版本，并把被移除的空格补成完整歌词。本次当前版本有 ${currentBlankCount} 个空格，返回结果必须恰好有 ${requestedBlankTarget} 个。
- “填空太少”：空格总数必须多于当前版本。本次应返回 ${requestedBlankTarget ?? currentBlankCount + 1} 个空格。
- “词汇太难/太简单”：同步改写歌词与 Word Bank，而不只是替换词库。
- 指定某一行时，必须重点修改该行。
不要原样返回当前歌词；返回前自行核对调整是否产生可见变化。`
    : '';

  return `根据以下条件生成一首可课堂互动的英文歌曲：\n${conditions.join('；\n')}。

${rules}
${currentVersion}${revisionRules}

旋律案例参考（仅用于借鉴节奏、句式和词库方向，绝不是必须照抄的内容要求；请优先匹配本次语言目标与主题）：${input.melodyReference}

关键要求：
1. 歌词的律动（音节数、句长）必须严格适配上方旋律硬约束
2. 目标语言（核心词汇、句型）必须自然嵌入歌词
3. 空格（______）标记需要填空的位置，空格处放 Word Bank 中的词汇
4. 每行的固定部分 + 空格预留音节 ≤ 旋律约束的音节数

返回严格 JSON：{ "title":"英文歌名", "words":["能填入歌词空格的英文词或短语，数量=空格数+2-3个干扰词"], "wordEmojis":{"每个 words 中的原始单词":"与该词语义直接对应的单个 emoji，禁止统一使用 💬"}, "lines":["歌词行，含 ______ 标记空格位置；行数和音节严格遵循旋律硬约束"], "activityPlan":{"englishGoal":"可观察的语言目标", "wellbeingGoal":"可观察的幸福力目标", "materials":["材料"], "steps":[{"title":"环节名称", "duration":"分钟", "teacherGuide":"教师可直接说的引导语与学生动作"}]}}。wordEmojis 必须覆盖 words 的每一项，键名与 words 完全一致。活动方案按导入、学唱填词、合作表演、回顾四步输出，具体、可执行。`;
}

// 单行歌词重新生成
export interface SongWritingLinePromptInput {
  melody: string;
  themeText: string;
  vocabulary: string;
  grammar: string;
  lines: string[];
  regenerateIndex: number;
  melodyReference: string;
  adjustmentRequest?: string;
}

export function buildSongWritingLinePrompt(input: SongWritingLinePromptInput) {
  const rules = getMelodyRules(input.melody);
  const currentLines = input.lines.map((line, i) => `L${i + 1}: ${line}`).join('\n');

  return `你是儿童英语歌曲创编专家。以下是一首基于「${input.melody}」旋律的英文歌曲，请仅重新生成第 L${input.regenerateIndex + 1} 行歌词，其余行保持不变。

主题：${input.themeText}
核心词汇：${input.vocabulary || '未指定'}
核心句型：${input.grammar || '未指定'}
本次具体调整需求：${input.adjustmentRequest || '无额外要求'}

${rules}

当前完整歌词：
${currentLines}

请重新生成 L${input.regenerateIndex + 1}，要求：
1. 严格遵循该行在旋律约束中的音节数和结构要求
2. 保持与其他行的语义连贯和押韵
3. 如果该行原本含 ______ 填空标记，新歌词也必须保留空格
4. 如果该行原本不含空格，新歌词也不应添加空格

返回严格 JSON：{ "line": "重新生成的歌词行" }`;
}
