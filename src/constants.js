// --- Data Constants ---

// PPT 专用测试数据
export const PPT_TEST_DATA = {
  engage: {
    title: 'Engage (引入)',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    steps: [
      {
        id: 'ppt-e1',
        time: '2分钟',
        title: 'PPT 封面：氛围营造',
        objective: '快速吸引注意力',
        activity: '展示神秘信号动效',
        script: '"Hello everyone! Are you ready for a mission?"',
        assets: [
          { id: 'ppt-a1', type: 'image', title: 'PPT背景', url: 'https://placehold.co/960x540/1a1a2e/00FF00?text=PPT+MODE+TEST+DATA', x: 0, y: 0, width: 960, height: 540, rotation: 0 }
        ]
      }
    ]
  },
  empower: {
    title: 'Empower (赋能)',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    steps: [
      {
        id: 'ppt-em1',
        time: '10分钟',
        title: 'PPT：核心知识讲解',
        objective: '掌握新单词',
        activity: '互动讲解',
        script: '"Look at these words..."',
        assets: [
          { id: 'ppt-a2', type: 'text', title: '标题', content: 'Key Words', x: 330, y: 50, width: 300, height: 60, rotation: 0 }
        ]
      }
    ]
  }
};

// 阅读材料专用测试数据
export const READING_TEST_DATA = {
  engage: {
    title: 'Engage (引入)',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    steps: [
      {
        id: 'read-e1',
        time: '5分钟',
        title: '阅读：神秘任务说明书',
        objective: '通过阅读理解任务背景',
        activity: '自主阅读',
        script: '"Please read this mission guidebook carefully."',
        assets: [
          { id: 'read-t1', type: 'text', title: '大标题', content: 'READING MODE TEST DATA', x: 50, y: 40, width: 580, height: 70, fontSize: 28, fontWeight: 'bold', textAlign: 'center' },
          { id: 'read-i1', type: 'image', title: '配图', url: 'https://placehold.co/400x250/6366f1/FFFFFF?text=Reading+Material+Layout', x: 140, y: 120, width: 400, height: 250, rotation: 0 },
          { id: 'read-t2', type: 'text', title: '正文', content: '这是阅读模式的独立测试数据，确保不与PPT模式冲突。', x: 50, y: 390, width: 580, height: 520, fontSize: 16, lineHeight: 1.6 }
        ]
      }
    ]
  }
};

export const INITIAL_COURSE_DATA = PPT_TEST_DATA;

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

export const WORD_DOC_DATA = [
  {
    id: 'e1-1',
    phase: "Engage (引入)",
    duration: "2分钟",
    title: "氛围营造：神秘信号",
    objectives: "快速吸引注意力，激发好奇心，建立\"特工\"身份。",
    activities: "1. 教室灯光调暗，播放神秘音乐。\n2. 教师假装捕捉空气中的信号。",
    script: "\"Shhh... Everyone, quiet, please. I'm receiving a strange signal... Can you hear it? Listen carefully... There's something mysterious happening today!\"\n\n（教师做出接收信号的手势，表情神秘）\n\n\"Class, I need your help. Something very special is about to happen...\"",
    materials: "神秘背景音乐，调光设备",
    worksheets: "无",
    ppt_content: "黑色背景，中央显示微弱的绿色声波信号波动动画。",
    image: "https://placehold.co/1000x600/000/0F0?text=Waveform+Signal",
    audio: "https://placehold.co/audio.mp3",
    video: null,
    elements: []
  },
  {
    id: 'e1-2',
    phase: "Engage (引入)",
    duration: "3分钟",
    title: "发布神秘任务 (PPT 1)",
    objectives: "清晰理解任务规则，发布行动指令。",
    activities: "1. 教师发现\"线索1\"：身体部位卡片。\n2. 发布搜寻任务：找到教室内隐藏的14个线索。",
    script: "\"Class, I have a top-secret mission for you! Look what I found...\"\n\n（教师展示线索卡片）\n\n\"This is clue number 1 - an EYE! But wait... there are more clues hidden in our classroom! Your mission is to find ALL 14 hidden clues. Can you help me?\"\n\n\"Let's work together like secret agents! Are you ready?\"",
    materials: "14张身体部位卡片（隐藏在教室内）",
    worksheets: "无",
    ppt_content: "标题：TOP SECRET MISSION\n副标题：Find 14 Hidden Clues!",
    image: "https://placehold.co/1000x600/1a1a2e/FFF?text=Mission+File",
    audio: null,
    video: "https://placehold.co/video-placeholder",
    elements: []
  },
  {
    id: 'em-2',
    phase: "Empower (赋能)",
    duration: "30分钟",
    title: "图鉴共读与探索 (Guidebook)",
    objectives: "学习身体部位、数量、形容词 (long/short, big/small)。",
    activities: "1. 师生共读《Funky Monster Guidebook》。\n2. 完成填字、找不同、画尾巴等练习。",
    script: "\"Now let's open our Funky Monster Guidebook! Look at this monster - his name is Zuzu.\"\n\n\"How many eyes does Zuzu have?\"\n（等待学生回答）\n\"Yes! Two eyes. Very good!\"\n\n\"Look at his tail. Is it long or short?\"\n\"It's a LONG tail! Can you draw a long tail like Zuzu's?\"\n\n\"Now let's find the words: E-Y-E-S. Can you circle it?\"",
    materials: "每人一本纸质图鉴, 彩笔",
    worksheets: "Funky Monster Guidebook",
    ppt_content: "电子版图鉴页面投影，重点词汇高亮显示。",
    image: "https://placehold.co/400x500/fcd34d/FFF?text=Monster+Guidebook",
    audio: null,
    video: null,
    elements: []
  },
  {
    id: 'ex-1',
    phase: "Execute (产出)",
    duration: "15分钟",
    title: "绘画共创：魔法骰子 (PPT 15)",
    objectives: "运用随机性激发创造力，协作完成海报。",
    activities: "1. 掷骰子A(部位)、B(数量)、C(特征)。\n2. 根据结果作画。",
    script: "\"It's time to create our own funky monster! We have three magic dice.\"\n\n\"Group 1, roll dice A! What body part did you get?\"\n（学生掷骰子）\n\"Eyes! Great! Now roll dice B - how many?\"\n\"Three eyes! Wow! And dice C - what adjective?\"\n\"BIG! So you need to draw... three BIG eyes!\"\n\n\"Let's start drawing! Use your colorful markers and make it fun!\"",
    materials: "3种骰子, 大海报纸, 彩笔",
    worksheets: "无",
    ppt_content: "三个骰子的动态GIF展示。\n左侧：Part，中间：Number，右侧：Adjective",
    image: "https://placehold.co/800x450/f3e8ff/6b21a8?text=Art+Studio",
    audio: null,
    video: null,
    elements: []
  },
  {
    id: 'el-1',
    phase: "Elevate (升华)",
    duration: "10分钟",
    title: "奇趣兽发布会 (PPT 17)",
    objectives: "公开演讲，展示成果，获得成就感。",
    activities: "1. 模拟盛大发布会。\n2. 小组上台展示海报并介绍。",
    script: "\"Welcome to the Grand Monster Reveal!\"\n\n（播放聚光灯音效）\n\n\"Group 1, please come to the stage! Show us your amazing monster!\"\n\n（学生上台展示）\n\n\"Wow! Tell us about your monster. How many eyes? What color?\"\n\n\"Excellent work! Let's give them a big round of applause!\"\n\n\"Next group, please!\"",
    materials: "聚光灯音效, 海报",
    worksheets: "无",
    ppt_content: "盛大的舞台背景，聚光灯效果动画。",
    image: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=1000&auto=format&fit=crop",
    audio: null,
    video: null,
    elements: []
  }
];
