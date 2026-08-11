export interface CourseJourneyPromptInput {
  courseTitle?: string;
  age?: string;
  duration?: string;
  classSize?: string;
  vocabulary?: string | string[];
  grammar?: string | string[];
  skills?: string | string[];
  experiencePath?: string;
  taskName?: string;
  theme?: string;
  storyContext?: string;
  keyOutcome?: string;
  growth?: string;
  atmosphere?: string;
  specialRequirements?: string;
}

export function buildCourseJourneyPrompt(input: CourseJourneyPromptInput) {
  return [
    '你是一名儿童英语课程设计专家，请为 CourseGen AI 的课程地图生成“课堂旅程 Class Journey”。',
    '必须基于课程主题、故事情境、语言目标、最终成果和成长目标生成，不能使用通用模板句。',
    '请严格输出 JSON，不要 Markdown，不要解释。',
    'JSON 格式：{"journey":{"engage":"...","empower":"...","execute":"...","elevate":"..."}}',
    '四个字段要求：每项 35-70 个中文字符；必须出现本课程的具体任务、语言工具或成果物；elevate 必须体现迁移/反思/成长。',
    '课程信息：',
    `课程标题：${input.courseTitle || ''}`,
    `年龄：${input.age || ''}`,
    `时长：${input.duration || ''}`,
    `班级规模：${input.classSize || ''}`,
    `任务主题：${input.taskName || input.theme || ''}`,
    `故事情境：${input.storyContext || ''}`,
    `最终成果：${input.keyOutcome || ''}`,
    `词汇：${Array.isArray(input.vocabulary) ? input.vocabulary.join(', ') : input.vocabulary || ''}`,
    `句型/语法：${Array.isArray(input.grammar) ? input.grammar.join('\n') : input.grammar || ''}`,
    `能力侧重：${Array.isArray(input.skills) ? input.skills.join('、') : input.skills || ''}`,
    `体验路径：${input.experiencePath || ''}`,
    `课堂氛围：${input.atmosphere || ''}`,
    `成长目标：${input.growth || ''}`,
    `特殊要求：${input.specialRequirements || ''}`,
  ].join('\n');
}

