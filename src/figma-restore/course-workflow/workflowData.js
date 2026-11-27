export const workflowSteps = [
  { key: 'map', title: '课程地图' },
  { key: 'lesson', title: '教案设计' },
  { key: 'ppt', title: 'PPT 课件' },
  // { key: 'reading', title: '阅读材料' },
];

export const phaseTemplates = [
  { key: 'engage', title: 'Engage', name: '引入' },
  { key: 'empower', title: 'Empower', name: '赋能' },
  { key: 'execute', title: 'Execute', name: '实践' },
  { key: 'elevate', title: 'Elevate', name: '升华' },
].map(phase => ({ ...phase, tone: phase.key, duration: '0分钟', steps: [] }));

export const coursePhasePalette = {
  engage: { tint: '#fae5dd', accent: '#9e5034' },
  empower: { tint: '#f6edcc', accent: '#806210' },
  execute: { tint: '#e2eef2', accent: '#326c81' },
  elevate: { tint: '#e5eddf', accent: '#506d39' },
};

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
    themeImageUrl: course.themeImageUrl || course.courseData?.themeImageUrl || course.course_data?.themeImageUrl || null,
    themeImagePrompt: overview.themeImagePrompt || null,
  };
}
