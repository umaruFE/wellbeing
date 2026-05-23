export const workflowSteps = [
  { key: 'map', title: '课程地图' },
  { key: 'lesson', title: '教案设计' },
  { key: 'ppt', title: 'PPT 课件' },
  { key: 'reading', title: '阅读材料' },
];

export const phaseTemplates = [
  {
    key: 'engage',
    title: 'Engage',
    name: '情境启动',
    duration: '8分钟',
    tone: 'engage',
    steps: [
      {
        title: '任务信件导入',
        duration: '3分钟',
        goal: '激活兴趣，进入角色身份。',
        activity: '教师展示任务信件，引导学生预测今天要解决的问题。',
        teacherScript: 'Today we have a mission. What can you see? What do you think we need to do?',
        resources: '任务信件 / 封面图 / 关键词卡',
      },
      {
        title: '情境词汇热身',
        duration: '5分钟',
        goal: '唤醒已知词汇，建立任务语境。',
        activity: '学生用动作、图片或快速问答说出相关词汇。',
        teacherScript: 'Show me the word with your body. Say it with a feeling.',
        resources: '词汇卡 / 图片提示',
      },
    ],
  },
  {
    key: 'empower',
    title: 'Empower',
    name: '语言赋能',
    duration: '12分钟',
    tone: 'empower',
    steps: [
      {
        title: '语言工具箱示范',
        duration: '6分钟',
        goal: '理解目标句型的意义和使用场景。',
        activity: '教师通过示范对话展示核心句型，学生跟读并替换关键词。',
        teacherScript: 'I feel... because... Can you help me describe it?',
        resources: '句型条 / 例句卡',
      },
      {
        title: '同伴微练习',
        duration: '6分钟',
        goal: '在低压力情境中尝试输出。',
        activity: '两人一组抽卡问答，完成 3 轮替换表达。',
        teacherScript: 'Ask your partner. Listen carefully and respond.',
        resources: '抽卡任务 / 计时器',
      },
    ],
  },
  {
    key: 'execute',
    title: 'Execute',
    name: '创作运用',
    duration: '15分钟',
    tone: 'execute',
    steps: [
      {
        title: '小组任务创作',
        duration: '10分钟',
        goal: '在真实任务中整合语言工具。',
        activity: '小组完成最终作品草稿，并标出必须使用的目标语言。',
        teacherScript: 'Use at least two target sentences in your work. Make your idea clear.',
        resources: '任务单 / 彩笔 / 小组海报',
      },
      {
        title: '同伴巡展反馈',
        duration: '5分钟',
        goal: '通过反馈优化表达。',
        activity: '学生走访其他小组，留下一个 praise 和一个 suggestion。',
        teacherScript: 'Give one praise and one idea to make it even better.',
        resources: '反馈贴纸',
      },
    ],
  },
  {
    key: 'elevate',
    title: 'Elevate',
    name: '回顾升华',
    duration: '5分钟',
    tone: 'elevate',
    steps: [
      {
        title: '成果展示',
        duration: '3分钟',
        goal: '完成公开表达，获得成就感。',
        activity: '每组用目标语言进行简短展示。',
        teacherScript: 'Tell us your final idea. What language did you use?',
        resources: '展示区 / 作品卡',
      },
      {
        title: '成长复盘',
        duration: '2分钟',
        goal: '把课堂经验迁移到真实生活。',
        activity: '学生选择一句今天最有用的话，并说出下次使用场景。',
        teacherScript: 'Choose one sentence you want to use again.',
        resources: '出口票',
      },
    ],
  },
];

export const readingTemplates = [
  {
    id: 'story-reader',
    title: 'Mission Story Reader',
    type: '绘本阅读',
    level: 'A2',
    pages: [
      {
        title: 'A New Mission',
        text: 'Today, we receive a special mission. We look, listen, and ask questions. Everyone has an important idea.',
        prompt: 'What is the mission? Circle the words that show action.',
      },
      {
        title: 'The Language Toolbox',
        text: 'We use our words to explain feelings, objects, and choices. When we speak clearly, our team can work better.',
        prompt: 'Underline one sentence you can use in class.',
      },
      {
        title: 'Show and Share',
        text: 'At the end, each team shares a creative work. We celebrate good ideas and kind feedback.',
        prompt: 'Write one praise for another team.',
      },
    ],
  },
  {
    id: 'vocab-cards',
    title: 'Vocabulary Mission Cards',
    type: '词汇学习',
    level: 'Starter',
    pages: [
      {
        title: 'Look and Say',
        text: 'Read the word. Match it with a picture. Then say a sentence with your partner.',
        prompt: 'Choose three words and draw quick icons.',
      },
      {
        title: 'Ask and Answer',
        text: 'Use the target sentence to ask your partner. Listen and check the answer.',
        prompt: 'Write your partner’s answer.',
      },
    ],
  },
];

export function buildCourseMap(course = {}) {
  const title = course.courseTitle || course.title || '新课程';
  const taskName = course.taskName || course.theme || '情境任务';
  const path = course.experiencePath || '艺术表达';
  const vocabularies = course.vocabularies || [];
  const grammars = course.grammars || [];
  const languageSkills = course.languageSkills || ['听力理解', '口语表达'];
  const keyOutcome = course.keyOutcome || `每个小组完成一份围绕“${taskName}”的创意作品，并用目标语言展示。`;

  return {
    title,
    path,
    age: course.age || '7-9岁',
    duration: course.duration || '60分钟',
    classSize: course.classSize || '9-15人',
    storyline: course.storyContext || `孩子们进入“${taskName}”的任务情境，通过观察、交流与合作创作完成挑战。`,
    toolkit: [
      vocabularies.length ? `核心词汇：${vocabularies.join('、')}` : '',
      grammars.length ? `核心句型：${grammars.join('、')}` : '',
      languageSkills.length ? `能力侧重：${languageSkills.join('、')}` : '',
    ].filter(Boolean).join(' | ') || '围绕目标词汇、核心句型与真实表达任务进行综合运用。',
    keyOutcome,
    growth: `在“${taskName}”中发展表达、协作和创造性解决问题能力。`,
    experience: `通过${path}完成探索、表达与作品产出。`,
  };
}
