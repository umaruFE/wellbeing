export const workflowSteps = [
  { key: 'map', title: '课程地图' },
  { key: 'lesson', title: '教案设计' },
  { key: 'ppt', title: 'PPT 课件' },
  // { key: 'reading', title: '阅读材料' },
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
        prompt: 'Write your partner\u2019s answer.',
      },
    ],
  },
];

function extractFieldFromText(text, fieldName) {
  const regex = new RegExp(`"${fieldName}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`, 's');
  const match = text.match(regex);
  if (!match) return null;
  try {
    return JSON.parse('"' + match[1] + '"');
  } catch {
    return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
}

export function buildCourseMap(course = {}) {
  let overview = course.courseOverview || {};
  const rawText = overview.text && typeof overview.text === 'string' ? overview.text : null;

  if (rawText) {
    try {
      overview = JSON.parse(rawText);
      overview = overview.courseOverview || overview;
    } catch {
      overview = {
        courseTitle: extractFieldFromText(rawText, 'courseTitle'),
        theme: extractFieldFromText(rawText, 'theme'),
        overallContext: extractFieldFromText(rawText, 'overallContext'),
        themeImagePrompt: extractFieldFromText(rawText, 'themeImagePrompt'),
        selGoals: extractFieldFromText(rawText, 'selGoals'),
        permaGoals: extractFieldFromText(rawText, 'permaGoals'),
        finalTask: extractFieldFromText(rawText, 'finalTask'),
        languageGoals: (() => {
          const vocab = extractFieldFromText(rawText, 'vocabulary');
          const gram = extractFieldFromText(rawText, 'grammar');
          return (vocab || gram) ? { vocabulary: vocab, grammar: gram } : null;
        })(),
      };
    }
  }
  const title = overview.courseTitle || course.courseTitle || course.title || '\u65B0\u8BFE\u7A0B';
  const taskName = course.taskName || course.theme || '\u60C5\u5883\u4EFB\u52A1';
  const path = course.experiencePath || overview.theme || '\u827A\u672F\u8868\u8FBE';
  const vocabularies = course.vocabularies || [];
  const grammars = course.grammars || [];
  const languageSkills = course.languageSkills || ['\u542C\u529B\u7406\u89E3', '\u53E3\u8BED\u8868\u8FBE'];

  return {
    title,
    path,
    age: course.age || '7-9\u5C81',
    duration: course.duration || '60\u5206\u949F',
    classSize: course.classSize || '9-15\u4EBA',
    storyline: overview.overallContext || course.storyContext || `\u5B69\u5B50\u4EEC\u8FDB\u5165\u201C${taskName}\u201D\u7684\u4EFB\u52A1\u60C5\u5883\uFF0C\u901A\u8FC7\u89C2\u5BDF\u3001\u4EA4\u6D41\u4E0E\u5408\u4F5C\u521B\u4F5C\u5B8C\u6210\u6311\u6218\u3002`,
    toolkit: overview.languageGoals
      ? [
          overview.languageGoals.vocabulary || '',
          overview.languageGoals.grammar || '',
        ].filter(Boolean).join('\n')
      : [
          vocabularies.length ? `\u6838\u5FC3\u8BCD\u6C47\uFF1A${vocabularies.join('\u3001')}` : '',
          grammars.length ? `\u6838\u5FC3\u53E5\u578B\uFF1A${grammars.join('\u3001')}` : '',
          languageSkills.length ? `\u80FD\u529B\u4FA7\u91CD\uFF1A${languageSkills.join('\u3001')}` : '',
        ].filter(Boolean).join(' | ') || '\u56F4\u7ED5\u76EE\u6807\u8BCD\u6C47\u3001\u6838\u5FC3\u53E5\u578B\u4E0E\u771F\u5B9E\u8868\u8FBE\u4EFB\u52A1\u8FDB\u884C\u7EFC\u5408\u8FD0\u7528\u3002',
    keyOutcome: overview.finalTask || course.keyOutcome || `\u6BCF\u4E2A\u5C0F\u7EC4\u5B8C\u6210\u4E00\u4EFD\u56F4\u7ED5\u201C${taskName}\u201D\u7684\u521B\u610F\u4F5C\u54C1\uFF0C\u5E76\u7528\u76EE\u6807\u8BED\u8A00\u5C55\u793A\u3002`,
    growth: [overview.selGoals, overview.permaGoals].filter(Boolean).join('\n') || `\u5728\u201C${taskName}\u201D\u4E2D\u53D1\u5C55\u8868\u8FBE\u3001\u534F\u4F5C\u548C\u521B\u9020\u6027\u89E3\u51B3\u95EE\u9898\u80FD\u529B\u3002`,
    experience: `\u901A\u8FC7${path}\u5B8C\u6210\u63A2\u7D22\u3001\u8868\u8FBE\u4E0E\u4F5C\u54C1\u4EA7\u51FA\u3002`,
    themeImageUrl: course.themeImageUrl || null,
    themeImagePrompt: overview.themeImagePrompt || null,
  };
}
