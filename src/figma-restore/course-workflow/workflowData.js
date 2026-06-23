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

function translatePath(pathValue, isEn) {
  const pathMap = {
    'art': isEn ? 'Artistic Expression' : '艺术表达',
    'body': isEn ? 'Physical Exploration' : '体感探索',
    'music': isEn ? 'Musical Rhythm' : '音乐律动',
    'AI Auto Match': isEn ? 'AI Auto Match' : 'AI 自动匹配',
    '艺术表达': isEn ? 'Artistic Expression' : '艺术表达',
    '体感探索': isEn ? 'Physical Exploration' : '体感探索',
    '音乐律动': isEn ? 'Musical Rhythm' : '音乐律动',
    'AI 自动匹配': isEn ? 'AI Auto Match' : 'AI 自动匹配',
  };
  return pathMap[pathValue] || (isEn ? 'Artistic Expression' : '艺术表达');
}

function translateLanguageSkill(skill, isEn) {
  const skillMap = {
    'listening': isEn ? 'Listening' : '听力理解',
    'speaking': isEn ? 'Speaking' : '口语表达',
    'reading': isEn ? 'Reading' : '阅读理解',
    'writing': isEn ? 'Writing' : '书面表达',
    'integrated': isEn ? 'Integrated Skills' : '综合能力',
    '听力理解': isEn ? 'Listening' : '听力理解',
    '口语表达': isEn ? 'Speaking' : '口语表达',
    '阅读理解': isEn ? 'Reading' : '阅读理解',
    '书面表达': isEn ? 'Writing' : '书面表达',
    '综合能力': isEn ? 'Integrated Skills' : '综合能力',
  };
  return skillMap[skill] || skill;
}

function translateLanguageSkills(skills, isEn) {
  if (!skills || !Array.isArray(skills)) {
    return isEn ? ['Listening', 'Speaking'] : ['听力理解', '口语表达'];
  }
  return skills.map(skill => translateLanguageSkill(skill, isEn));
}

function translateAge(ageValue, isEn) {
  const ageMap = {
    '3-6': '3-6',
    '3-6岁': '3-6',
    '7-9': '7-9',
    '7-9岁': '7-9',
    '9-12': '9-12',
    '9-12岁': '9-12',
  };
  return ageMap[ageValue] || '7-9';
}

function translateDuration(durationValue, isEn) {
  const durationMap = {
    '40': '40 min',
    '40分钟': '40 min',
    '40 min': '40 min',
    '60': '60 min',
    '60分钟': '60 min',
    '60 min': '60 min',
    '120': '120 min',
    '120分钟': '120 min',
    '120 min': '120 min',
  };
  return durationMap[durationValue] || '60 min';
}

function translateClassSize(classSizeValue, isEn) {
  const sizeMap = {
    '<=8': '<=8',
    '≤8': '<=8',
    '≤ 8人': '<=8',
    '9-15': '9-15',
    '9-15人': '9-15',
    '>=16': '>=16',
    '≥16': '>=16',
    '≥ 16人': '>=16',
  };
  return sizeMap[classSizeValue] || '9-15';
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
  const isEn = (course.language === 'en' || course.outputLanguage === 'English');
  const title = overview.courseTitle || course.courseTitle || course.title || (isEn ? 'New Course' : 'New Course');
  const taskName = course.taskName || course.theme || 'Scenario Task';
  const rawPath = course.experiencePath || overview.theme;
  const path = translatePath(rawPath, isEn);
  const vocabularies = course.vocabularies || [];
  const grammars = course.grammars || [];
  const languageSkills = translateLanguageSkills(course.languageSkills, isEn);

  return {
    title,
    path,
    age: translateAge(course.age, isEn),
    duration: translateDuration(course.duration, isEn),
    classSize: translateClassSize(course.classSize, isEn),
    storyline: overview.overallContext || course.storyContext || (isEn
      ? `Kids enter the "${taskName}" scenario, completing challenges through observation, communication and collaboration.`
      : `孩子们进入"${taskName}"的任务情境，通过观察、交流与合作创作完成挑战。`),
    toolkit: overview.languageGoals
      ? [
          overview.languageGoals.vocabulary || '',
          overview.languageGoals.grammar || '',
        ].filter(Boolean).join('\n')
      : [
          vocabularies.length ? `Core Vocabulary: ${vocabularies.join(', ')}` : '',
          grammars.length ? `Core Sentence:\n${grammars.join('\n')}` : '',
          languageSkills.length ? (isEn ? `Skill Focus: ${languageSkills.join(', ')}` : `能力侧重：${languageSkills.join('、')}`) : '',
        ].filter(Boolean).join('\n') || 'Integrate target vocabulary, core sentence patterns and authentic expression tasks.',
    keyOutcome: overview.finalTask || course.keyOutcome || (isEn
      ? `Each group completes a creative piece around "${taskName}" and presents it using target language.`
      : `每个小组完成一份围绕"${taskName}"的创意作品，并用目标语言展示。`),
    growth: [overview.selGoals, overview.permaGoals].filter(Boolean).join('\n') || (isEn
      ? `Develop expression, collaboration and creative problem-solving in "${taskName}".`
      : `在"${taskName}"中发展表达、协作和创造性解决问题能力。`),
    experience: overview.experience || overview.experiencePath || `Explore, express and create outputs through ${path}.`,
    themeImageUrl: course.themeImageUrl || null,
    themeImagePrompt: overview.themeImagePrompt || null,
  };
}
