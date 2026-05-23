export const createCourseSteps = [
  { title: '设定课程起点', subtitle: 'Set the Course' },
  { title: '构思情境任务', subtitle: 'Design the Adventure' },
  { title: '选择体验路径', subtitle: 'Choose the Path' },
  { title: '添加个性魔法', subtitle: 'Add Your Magic' },
];

export const ageOptions = ['3-6岁', '7-9岁', '9-12岁'];

export const durationOptions = ['40分钟', '60分钟', '120分钟'];

export const classSizeOptions = ['≤8人', '9-15人', '≥16人'];

export const languageSkillOptions = [
  { label: '听力理解', value: '听力理解' },
  { label: '口语表达', value: '口语表达' },
  { label: '阅读理解', value: '阅读理解' },
  { label: '书面表达', value: '书面表达' },
  { label: '综合能力', value: '综合能力' },
];

export const atmosphereOptions = [
  '神秘探险感',
  '戏剧表演感',
  '温馨治愈感',
  '团队协作感',
];

export const experiencePaths = [
  {
    value: '艺术表达',
    title: '艺术表达',
    tone: 'art',
    description: '通过绘画、手工、戏剧、故事创作等可视化方式内化语言，适合安静创作、动手表达。',
  },
  {
    value: '体感探索',
    title: '体感探索',
    tone: 'body',
    description: '通过游戏、运动、感官体验等身体动作绑定语言，适合活泼好动、身体智能突出的学习者。',
  },
  {
    value: '音乐律动',
    title: '音乐律动',
    tone: 'music',
    description: '通过歌谣、节奏、乐器、声音剧场等音乐元素自然习得语言，适合喜欢旋律和节奏的课堂。',
  },
];

export const adventureIdeas = [
  {
    taskName: '森林星光音乐会策划案',
    storyContext: '孩子们化身森林音乐会策划师，发现今晚的星光舞台还缺少一份能让动物们听懂的节目单。大家需要用目标语言介绍表演顺序、邀请伙伴加入，并一起完成一张会发光的音乐会计划。',
    keyOutcome: '每个小组完成一份图文并茂的《森林星光音乐会节目单》，并进行一分钟英文节目推荐。',
  },
  {
    taskName: '情绪怪兽安抚行动',
    storyContext: '孩子们化身小小情绪观察员，在彩虹教室里遇到一只把心情颜色弄乱的情绪怪兽。大家需要识别它的感受、提出安抚办法，并设计一份温柔的情绪急救包。',
    keyOutcome: '每个学生制作一张“情绪急救卡”，用图像和目标句型说明一种情绪与安抚方法。',
  },
  {
    taskName: '月亮邮局紧急派送',
    storyContext: '孩子们成为月亮邮局的夜班投递员，发现几封星星来信没有写清楚收件人和地址。大家需要询问信息、匹配线索，并把每封信送到正确的星球居民手中。',
    keyOutcome: '每个小组完成一张“星球派送路线图”，并用英文说明至少两封信的正确去向。',
  },
];

export const defaultCreateCourseValues = {
  courseTitle: '',
  age: '7-9岁',
  duration: '60分钟',
  classSize: '9-15人',
  vocabularies: ['Dennis', 'James', 'Ricky'],
  grammars: ['Dennis', 'James', 'Ricky'],
  languageSkills: ['听力理解', '口语表达'],
  taskName: '',
  storyContext: '',
  keyOutcome: '',
  experiencePath: '艺术表达',
  specialRequirements: '',
  attachments: [],
  atmosphere: '神秘探险感',
};
