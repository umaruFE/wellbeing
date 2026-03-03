
// 将WORD_DOC_DATA转换为画布需要的格式（用于PPT和阅读材料画布）
export const convertWordDocToCourseData = () => {
  // 使用函数来匹配phase，支持多种变体
  const getPhaseKey = (phaseString) => {
    if (phaseString.includes('Engage')) return 'engage';
    if (phaseString.includes('Empower')) return 'empower';
    if (phaseString.includes('Execute')) return 'execute';
    if (phaseString.includes('Elevate')) return 'elevate';
    return 'engage'; // 默认
  };

  const colorMap = {
    'engage': 'bg-purple-100 text-purple-700 border-purple-200',
    'empower': 'bg-blue-100 text-blue-700 border-blue-200',
    'execute': 'bg-green-100 text-green-700 border-green-200',
    'elevate': 'bg-yellow-100 text-yellow-700 border-yellow-200'
  };

  const titleMap = {
    'engage': 'Engage (引入)',
    'empower': 'Empower (赋能)',
    'execute': 'Execute (实践)',
    'elevate': 'Elevate (升华)'
  };

  const result = {
    engage: { title: titleMap.engage, color: colorMap.engage, steps: [] },
    empower: { title: titleMap.empower, color: colorMap.empower, steps: [] },
    execute: { title: titleMap.execute, color: colorMap.execute, steps: [] },
    elevate: { title: titleMap.elevate, color: colorMap.elevate, steps: [] }
  };

  WORD_DOC_DATA.forEach(slide => {
    const phaseKey = getPhaseKey(slide.phase);
    const assets = [];
    
    // 转换图片
    if (slide.image) {
      assets.push({
        id: `asset-${slide.id}-img`,
        type: 'image',
        title: slide.title,
        url: slide.image,
        x: 100,
        y: 100,
        width: 400,
        height: 300,
        rotation: 0,
        prompt: slide.ppt_content || ''
      });
    }
    
    // 转换音频
    if (slide.audio) {
      assets.push({
        id: `asset-${slide.id}-audio`,
        type: 'audio',
        title: '音频',
        url: slide.audio,
        x: 50,
        y: 50,
        width: 300,
        height: 60,
        rotation: 0,
        prompt: ''
      });
    }
    
    // 转换视频
    if (slide.video) {
      assets.push({
        id: `asset-${slide.id}-video`,
        type: 'video',
        title: '视频',
        url: slide.video,
        x: 100,
        y: 100,
        width: 400,
        height: 240,
        rotation: 0,
        prompt: ''
      });
    }

    result[phaseKey].steps.push({
      id: slide.id,
      time: slide.duration || '0分钟',
      title: slide.title,
      objective: slide.objectives || '',
      activity: slide.activities || '',
      script: slide.script || '',
      assets: assets
    });
  });

  return result;
};

export const CURRICULUM_DATA = {
  '3-4岁 (小班/Nursery)': [
    'Theme: My Family (我的家庭)', 
    'Theme: Colors & Shapes (颜色与形状)', 
    'Theme: My Body (我的身体)', 
    'Theme: Fruits (水果)', 
    'Theme: Toys (玩具)'
  ],
  '4-5岁 (中班/K1)': [
    'Theme: Farm Animals (农场动物)', 
    'Theme: My Feelings (我的情绪)', 
    'Theme: Weather (天气)', 
    'Theme: Clothes (衣服)', 
    'Theme: Food & Drink (饮食)'
  ],
  '5-6岁 (大班/K2)': [
    'Theme: Transportation (交通工具)', 
    'Theme: Community Helpers (社区职业)', 
    'Theme: Solar System (太阳系)', 
    'Theme: Insects (昆虫)', 
    'Theme: Seasons (四季)'
  ],
  '6-7岁 (一年级/G1)': [
    'Unit 1: Hello! (问候)',
    'Unit 2: School Things (文具)',
    'Unit 3: Animals (动物)',
    'Unit 4: Numbers 1-10 (数字)',
    'Unit 5: My Face (五官)'
  ],
  '7-8岁 (二年级/G2)': [
    'Unit 1: My Day (我的日常)',
    'Unit 2: The Zoo (动物园)',
    'Unit 3: My Room (我的房间)',
    'Unit 4: Family Activities (家庭活动)',
    'Unit 5: Time (时间)'
  ],
  '8-9岁 (三年级/G3)': [
    'Unit 3: Animals (神奇的动物)',
    'Unit 1: Welcome Back (欢迎回来)',
    'Unit 2: My Schoolbag (我的书包)',
    'Unit 4: We Love Animals (我们爱动物)',
    'Unit 5: Food and Drink (饮食)'
  ],
  '9-10岁 (四年级/G4)': [
    'Unit 1: My Classroom (我的教室)',
    'Unit 2: My Friends (我的朋友)',
    'Unit 3: Weather (天气)',
    'Unit 4: Shopping (购物)',
    'Unit 5: Hobbies (爱好)'
  ],
  '10-12岁 (高年级/Upper Primary)': [
    'Unit 1: Future Plans (未来计划)',
    'Unit 2: Past Experiences (过去经历)',
    'Unit 3: Holidays (假期)',
    'Unit 4: Environment (环境保护)',
    'Unit 5: Technology (科技)'
  ]
};