export const SONG_WRITING_SYSTEM_PROMPTS = [
  'For the Word Bank, return a wordEmojis object in addition to words. Each key must exactly match one item in words, and each value must be one emoji that directly represents that word or phrase. Keep words as plain English text only: do not put emojis inside words, because the words are inserted into lyric blanks.',
  '你是儿童英语歌曲创编与幸福力教学专家。仅返回合法 JSON。歌词必须严格适配指定旋律的节奏、句长和副歌结构；词库只提供能够填入歌词 ______ 的单词或短语，不能使用无关词。',
] as const;

export interface SongWritingPromptInput {
  age: string;
  level: string;
  participants: string;
  duration: string;
  themeText: string;
  vocabulary: string;
  grammar: string;
  melody: string;
  melodyReference: string;
}

export function buildSongWritingUserPrompt(input: SongWritingPromptInput) {
  const conditions = [
    `学生年龄=${input.age || '7-9岁'}`,
    `英文水平=${input.level || '初级（会字母和简单词）'}`,
    `参与人数=${input.participants || '未指定'}`,
    `活动时长=${input.duration || '未指定'}`,
    `幸福力主题=${input.themeText}`,
    `核心词汇=${input.vocabulary || '未指定，请根据主题和年龄自选适合的词汇'}`,
    `核心句型/语法=${input.grammar || '未指定，请根据主题和水平自选适合的句型'}`,
    `旋律=${input.melody}`,
  ];

  return `根据以下条件生成一首可课堂互动的英文歌曲：\n${conditions.join('；\n')}。

旋律案例参考（仅用于借鉴节奏、句式和词库方向，绝不是必须照抄的内容要求；请优先匹配本次语言目标与主题）：${input.melodyReference}

返回严格 JSON：{ "title":"英文歌名", "words":["8-12个能填入歌词空格的英文词或短语"], "lines":["8句英文歌词，其中4-6句含 ______ 填空；歌词句式与所选旋律匹配"], "activityPlan":{"englishGoal":"可观察的语言目标", "wellbeingGoal":"可观察的幸福力目标", "materials":["材料"], "steps":[{"title":"环节名称", "duration":"分钟", "teacherGuide":"教师可直接说的引导语与学生动作"}]}}。活动方案按导入、学唱填词、合作表演、回顾四步输出，具体、可执行。`;
}
