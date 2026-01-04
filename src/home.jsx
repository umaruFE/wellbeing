import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Clock, 
  Image as ImageIcon, 
  Type, 
  RefreshCw, 
  Video, 
  Music, 
  FileText, 
  Box, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  Plus, 
  Trash2, 
  Save, 
  Play, 
  Move,
  Wand2,
  Maximize2,
  Minimize2,
  LayoutTemplate,
  X,
  Upload,
  Layers,       
  ArrowUp,      
  ArrowDown,    
  ChevronsUp,   
  ChevronsDown, 
  Sliders,
  RotateCw,
  Scaling,
  Download,     
  MonitorPlay,
  Sparkles, 
  GraduationCap, 
  Layout, 
  CheckCircle2, 
  Settings2, 
  BrainCircuit, 
  Lightbulb, 
  User, 
  Tags, 
  Baby, 
  Library, 
  List, 
  Palette, 
  MousePointer2, 
  FileUp, 
  MoreVertical, 
  Table as TableIcon, 
  FileAudio, 
  FileVideo, 
  Film, 
  Pencil,
  Edit3,
  Rocket
} from 'lucide-react';

// --- Global Helper Functions ---

// Get icon component based on asset type
const getAssetIcon = (type) => {
  switch(type) {
    case 'image': return <ImageIcon className="w-4 h-4" />;
    case 'video': return <Video className="w-4 h-4" />;
    case 'audio': return <Music className="w-4 h-4" />;
    case 'text': return <Type className="w-4 h-4" />;
    default: return <Box className="w-4 h-4" />;
  }
};

// --- Data Constants ---

const INITIAL_COURSE_DATA = {
  engage: {
    title: 'Engage (引入)',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    steps: [
      {
        id: 'e1-1',
        time: '0-2分钟',
        title: '1. 氛围营造，引出神秘任务',
        objective: '快速吸引学生注意力，激发好奇心；建立“特工”角色身份。',
        activity: '教师活动：教室灯光调暗，播放神秘背景音乐。假装接收信号。',
        script: '“Shhh... Everyone, quiet, please. I’m receiving a strange signal...”',
        pptContent: '无 (依靠光影、音乐氛围)',
        worksheets: '无',
        materials: '无',
        assets: [
          { id: 'a1', type: 'audio', title: 'Mystery Background Music', url: 'https://placehold.co/audio.mp3', x: 50, y: 50, width: 300, height: 60, rotation: 0, prompt: 'Suspenseful cinematic background music' }
        ]
      },
      {
        id: 'e1-2',
        time: '2-5分钟',
        title: '2. 发布神秘任务',
        objective: '清晰理解任务规则；发布具有挑战性的行动指令。',
        activity: '教师展示找到的线索卡片(Eye, No.3)，发布搜寻任务。',
        script: '“Class, I have a top-secret mission for you... Find all the 14 hidden clues!”',
        pptContent: 'Top Secret Mission! FIND all the 14 hidden clues!',
        worksheets: '无',
        materials: '14张身体部位卡片',
        assets: [
          { id: 'a2', type: 'image', title: 'Magnifying Glass Icon', url: 'https://placehold.co/400x300/1a1a2e/FFF?text=Mission+Top+Secret', x: 100, y: 80, width: 400, height: 300, rotation: -5, prompt: 'Secret agent magnifying glass finding clues', referenceImage: null }
        ]
      },
      {
        id: 'e1-3',
        time: '5-12分钟',
        title: '3. 学生搜寻与收集线索',
        objective: '在真实空间活动，感知身体部位词汇。',
        activity: '学生搜寻卡片，教师引导。',
        script: '“Is there something under the table? Check near the door!”',
        pptContent: 'Let’s put all the clues together!',
        worksheets: '无',
        materials: '无',
        assets: [
          { id: 'a3', type: 'image', title: 'Puzzle Background', url: 'https://placehold.co/400x300/EEE/333?text=Gathering+Clues', x: 200, y: 100, width: 350, height: 250, rotation: 10, prompt: 'Kids putting puzzle pieces together', referenceImage: null }
        ]
      },
      {
        id: 'e1-4',
        time: '12-15分钟',
        title: '4. 拼合线索，揭示全貌',
        objective: '集体协作拼图，引出Monster主题。',
        activity: '学生上台贴卡片，拼出怪兽轮廓。',
        script: '“Look! It’s a... MONSTER! A funny, funky monster!”',
        pptContent: 'Mission: Funky Monster Rescue Adventure',
        worksheets: '无',
        materials: '白板，卡片',
        assets: [
          { id: 'a4', type: 'image', title: 'Funky Monster Reveal', url: 'https://placehold.co/600x400/FF5733/FFF?text=Funky+Monster', x: 50, y: 50, width: 500, height: 350, rotation: 0, prompt: 'Cute colorful monster jumping out', referenceImage: null }
        ]
      },
      {
        id: 'e1-5',
        time: '16-18分钟',
        title: '6. 播放求救视频',
        objective: '强力引入故事背景，激发同情心。',
        activity: '观看视频，教师表现同情。',
        script: '“Oh no! The Funky Monsters are in trouble! We must save them!”',
        pptContent: 'Video: SOS from Planet Monster',
        worksheets: '无',
        materials: '无',
        assets: [
          { id: 'a5', type: 'video', title: 'SOS Video', url: 'https://placehold.co/video-placeholder', x: 80, y: 80, width: 400, height: 240, rotation: 0, prompt: 'Cute monster sending SOS signal', referenceImage: null }
        ]
      }
    ]
  },
  empower: {
    title: 'Empower (赋能)',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    steps: [
      {
        id: 'em-1',
        time: '20-22分钟',
        title: '1. 明确 Mission 1',
        objective: '建立学习框架，明确核心目标。',
        activity: '宣布任务：Find Your Monster Buddy。',
        script: '“Mission 1: Find Your Monster Buddy. Let’s open the Guidebook!”',
        pptContent: 'Mission 1: Find Your Monster Buddy',
        worksheets: '无',
        materials: '无',
        assets: [
          { id: 'a6', type: 'image', title: 'Mission 1 Badge', url: 'https://placehold.co/300x300/3498db/FFF?text=Mission+1', x: 150, y: 100, width: 200, height: 200, rotation: 0, prompt: 'Golden badge with number 1', referenceImage: null }
        ]
      },
      {
        id: 'em-2',
        time: '25-55分钟',
        title: '3. 共读与探索图鉴',
        objective: '系统学习身体部位、数量、形容词。',
        activity: '逐页引导阅读，完成填字、连线、绘画任务。',
        script: '“Look at Zuzu. How many eyes? Yes, two eyes.”',
        pptContent: '无 (依托纸质材料)',
        worksheets: 'Funky Monster Guidebook',
        materials: '彩笔',
        assets: []
      },
      {
        id: 'em-3',
        time: '57-62分钟',
        title: '5. 小组侦探探索',
        objective: '多感官探究，深度强化语言关联。',
        activity: '用“玻璃杯放大镜”观察黑水中的怪兽局部并记录。',
        script: '“You have 5 minutes. Find at least 3 different body parts.”',
        pptContent: 'Investigation Time! 5:00 Timer',
        worksheets: 'Monster Detective Report',
        materials: '托盘、黑水、玻璃杯',
        assets: [
          { id: 'a7', type: 'image', title: 'Timer Interface', url: 'https://placehold.co/400x200/000/F00?text=05:00', x: 200, y: 20, width: 300, height: 150, rotation: 0, prompt: 'Digital countdown timer 5 minutes', referenceImage: null }
        ]
      }
    ]
  },
  execute: {
    title: 'Execute (实践)',
    color: 'bg-green-100 text-green-700 border-green-200',
    steps: [
      {
        id: 'ex-1',
        time: '86-101分钟',
        title: '4. 绘画共创 (Magic Dice)',
        objective: '通过随机性激发创造力，协作绘画。',
        activity: '轮流掷骰子(部位/数量/特征)，根据指令绘画。',
        script: '“Roll dice A! What body part? Roll dice B! How many?”',
        pptContent: 'Let’s Create! Dice Instructions',
        worksheets: '海报纸',
        materials: 'A/B/C骰子, 彩笔',
        assets: [
          { id: 'a8', type: 'image', title: 'Magic Dice Visual', url: 'https://placehold.co/400x300/2ecc71/FFF?text=Dice+Instructions', x: 100, y: 50, width: 350, height: 260, rotation: 15, prompt: 'Three magical glowing dice', referenceImage: null }
        ]
      },
      {
        id: 'ex-2',
        time: '101-110分钟',
        title: '5. 添加文字介绍',
        objective: '图文结合，完成个性化怪兽档案。',
        activity: '参考词汇库，书写怪兽介绍。',
        script: '“Write your monster’s profile on the poster. You have 10 minutes.”',
        pptContent: 'Add Your Monster’s Profile! Word Bank',
        worksheets: '无',
        materials: '无',
        assets: [
          { id: 'a9', type: 'text', title: 'Word Bank', content: 'Big, Small, Long, Short...', x: 300, y: 100, width: 400, height: 100, rotation: 0, prompt: '' }
        ]
      }
    ]
  },
  elevate: {
    title: 'Elevate (升华)',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    steps: [
      {
        id: 'el-1',
        time: '110-120分钟',
        title: '1. 奇趣兽发布会',
        objective: '展示成果，提升成就感和自信心。',
        activity: '小组轮流上台展示海报，教师点评。',
        script: '“Welcome to the Grand Monster Reveal! Group 1, please!”',
        pptContent: 'Let’s See Our Monsters! The Grand Reveal!',
        worksheets: '无',
        materials: '完成的海报',
        assets: [
          { id: 'a10', type: 'image', title: 'Stage Curtains', url: 'https://placehold.co/800x600/f1c40f/000?text=Grand+Reveal+Stage', x: 0, y: 0, width: 960, height: 540, rotation: 0, prompt: 'Grand stage with red curtains', referenceImage: null }
        ]
      }
    ]
  }
};

const CURRICULUM_DATA = {
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

const WORD_DOC_DATA = [
  {
    id: 1,
    phase: "Engage (引入)",
    duration: "2分钟",
    title: "氛围营造：神秘信号",
    objectives: "快速吸引注意力，激发好奇心，建立“特工”身份。",
    activities: "1. 教室灯光调暗，播放神秘音乐。\n2. 教师假装捕捉空气中的信号。",
    materials: "神秘背景音乐，调光设备",
    worksheets: "无",
    ppt_content: "黑色背景，中央显示微弱的绿色声波信号波动动画。",
    image: "https://placehold.co/1000x600/000/0F0?text=Waveform+Signal",
    audio: "https://placehold.co/audio.mp3",
    video: null,
    elements: []
  },
  {
    id: 2,
    phase: "Engage (引入)",
    duration: "3分钟",
    title: "发布神秘任务 (PPT 1)",
    objectives: "清晰理解任务规则，发布行动指令。",
    activities: "1. 教师发现“线索1”：身体部位卡片。\n2. 发布搜寻任务：找到教室内隐藏的14个线索。",
    materials: "14张身体部位卡片（隐藏在教室内）",
    worksheets: "无",
    ppt_content: "标题：TOP SECRET MISSION\n副标题：Find 14 Hidden Clues!",
    image: "https://placehold.co/1000x600/1a1a2e/FFF?text=Mission+File",
    audio: null,
    video: "https://placehold.co/video-placeholder",
    elements: []
  },
  {
    id: 6,
    phase: "Empower (赋能)",
    duration: "30分钟",
    title: "图鉴共读与探索 (Guidebook)",
    objectives: "学习身体部位、数量、形容词 (long/short, big/small)。",
    activities: "1. 师生共读《Funky Monster Guidebook》。\n2. 完成填字、找不同、画尾巴等练习。",
    materials: "每人一本纸质图鉴, 彩笔",
    worksheets: "Funky Monster Guidebook",
    ppt_content: "电子版图鉴页面投影，重点词汇高亮显示。",
    image: "https://placehold.co/400x500/fcd34d/FFF?text=Monster+Guidebook",
    audio: null,
    video: null,
    elements: []
  },
  {
    id: 8,
    phase: "Execute (产出)",
    duration: "15分钟",
    title: "绘画共创：魔法骰子 (PPT 15)",
    objectives: "运用随机性激发创造力，协作完成海报。",
    activities: "1. 掷骰子A(部位)、B(数量)、C(特征)。\n2. 根据结果作画。",
    materials: "3种骰子, 大海报纸, 彩笔",
    worksheets: "无",
    ppt_content: "三个骰子的动态GIF展示。\n左侧：Part，中间：Number，右侧：Adjective",
    image: "https://placehold.co/800x450/f3e8ff/6b21a8?text=Art+Studio",
    audio: null,
    video: null,
    elements: []
  },
  {
    id: 10,
    phase: "Elevate (升华)",
    duration: "10分钟",
    title: "奇趣兽发布会 (PPT 17)",
    objectives: "公开演讲，展示成果，获得成就感。",
    activities: "1. 模拟盛大发布会。\n2. 小组上台展示海报并介绍。",
    materials: "聚光灯音效, 海报",
    worksheets: "无",
    ppt_content: "盛大的舞台背景，聚光灯效果动画。",
    image: "https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=1000&auto=format&fit=crop",
    audio: null,
    video: null,
    elements: []
  }
];

// --- Helper Components ---

const ImagePreviewModal = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
        <img src={src} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
        <button className="mt-4 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-sm transition-colors">
          <X className="w-4 h-4" /> 关闭预览
        </button>
      </div>
    </div>
  );
};

const SlideRenderer = ({ assets, isEditable, onMouseDown, selectedAssetId }) => {
  
  if (assets.length === 0 && isEditable) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none">
         <LayoutTemplate className="w-16 h-16 mb-4" />
         <p className="text-sm font-medium">画布为空，请使用上方工具栏添加素材</p>
      </div>
    );
  }

  return (
    <>
      {assets.map(asset => (
        <div
          key={asset.id}
          onMouseDown={(e) => isEditable ? onMouseDown(e, asset.id, 'dragging') : null}
          style={{ 
             left: asset.x, 
             top: asset.y, 
             width: asset.width || 300, 
             height: asset.height || 200,
             zIndex: assets.indexOf(asset),
             transform: `rotate(${asset.rotation || 0}deg)`,
             position: 'absolute'
          }}
          className={`${isEditable ? 'cursor-move select-none' : 'pointer-events-none'} group/asset 
            ${selectedAssetId === asset.id && isEditable ? 'ring-2 ring-blue-500 z-50 shadow-2xl' : ''}
            ${isEditable && selectedAssetId !== asset.id ? 'hover:ring-1 hover:ring-blue-300' : ''}
            transition-shadow duration-75`}
        >
           {/* Editor Controls (Handles) - Only in Editable Mode */}
           {isEditable && selectedAssetId === asset.id && (
             <>
               {/* Resize Handles */}
               <div onMouseDown={(e) => onMouseDown(e, asset.id, 'resizing', 'nw')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-nw-resize z-50"></div>
               <div onMouseDown={(e) => onMouseDown(e, asset.id, 'resizing', 'ne')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-ne-resize z-50"></div>
               <div onMouseDown={(e) => onMouseDown(e, asset.id, 'resizing', 'sw')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-sw-resize z-50"></div>
               <div onMouseDown={(e) => onMouseDown(e, asset.id, 'resizing', 'se')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-se-resize z-50"></div>
               
               {/* Rotation Handle */}
               <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing z-50"
                    onMouseDown={(e) => onMouseDown(e, asset.id, 'rotating')}>
                  <div className="w-px h-4 bg-blue-500"></div>
                  <div className="w-5 h-5 bg-white border border-blue-500 rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                     <RotateCw className="w-3 h-3 text-blue-500" />
                  </div>
               </div>
             </>
           )}

           {/* Content */}
           {asset.type === 'text' ? (
              <div className="w-full h-full bg-white/80 backdrop-blur p-2 text-xl font-bold font-sans text-slate-800 whitespace-pre-wrap border border-dashed border-slate-300 rounded shadow-sm overflow-hidden flex items-center justify-center text-center">
                 {asset.content || "请输入文本..."}
              </div>
           ) : (
              <div className="w-full h-full relative bg-black rounded overflow-hidden shadow-sm">
                 <img 
                   src={asset.url} 
                   alt={asset.title} 
                   className="w-full h-full object-cover block select-none pointer-events-none" 
                 />
                 {asset.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                       <Play className="w-12 h-12 text-white opacity-80" />
                    </div>
                 )}
                 {asset.type === 'audio' && (
                    <div className="absolute bottom-0 left-0 right-0 h-full bg-slate-900/80 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                       <Music className="w-8 h-8 text-white/80" />
                       <div className="text-white text-xs font-mono">Audio Track</div>
                    </div>
                 )}
              </div>
           )}
        </div>
      ))}
    </>
  );
};

// --- Welcome/Config Screen Component ---
const WelcomeScreen = ({ onStart }) => {
  const [step, setStep] = useState('input'); // input, generating
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('');
  
  const [config, setConfig] = useState({
    grade: '小学三年级',
    age: '8-9岁 (三年级/G3)',
    unit: 'Unit 3: Animals (神奇的动物)',
    duration: '40分钟',
    theme: '星际救援冒险',
    sourceText: '',
    keywords: '',
    isCustomUnit: false,
    customUnit: ''
  });

  const availableUnits = CURRICULUM_DATA[config.age] || [];

  const handleAgeChange = (e) => {
    const newAge = e.target.value;
    const newUnits = CURRICULUM_DATA[newAge] || [];
    setConfig({
      ...config,
      age: newAge,
      unit: newUnits.length > 0 ? newUnits[0] : '',
      isCustomUnit: false,
      customUnit: ''
    });
  };

  const handleUnitChange = (e) => {
    const value = e.target.value;
    if (value === 'custom_input_option') {
      setConfig({ ...config, isCustomUnit: true, unit: '' });
    } else {
      setConfig({ ...config, isCustomUnit: false, unit: value });
    }
  };

  const handleGenerate = () => {
    setStep('generating');
    
    const stages = [
      { p: 10, t: `正在加载 ${config.age} 认知心理学模型...` },
      { p: 30, t: `正在分析 核心知识点图谱...` },
      { p: 50, t: 'AI 引擎正在设计“最近发展区(ZPD)”教学支架...' },
      { p: 70, t: '正在生成多模态(Visual-Auditory)教学素材...' },
      { p: 90, t: '正在进行教育学原理一致性校验...' },
      { p: 100, t: '课件组装完成！' }
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage >= stages.length) {
        clearInterval(interval);
        onStart(config); // Finished generation, start app
        return;
      }
      setLoadingProgress(stages[currentStage].p);
      setLoadingText(stages[currentStage].t);
      currentStage++;
    }, 800);
  };

  if (step === 'generating') {
    return (
      <div className="flex-1 bg-slate-900 flex flex-col items-center justify-center text-white p-8 h-screen w-full absolute inset-0 z-50">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="relative w-32 h-32 mx-auto">
            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-ping"></div>
            <div className="absolute inset-2 border-4 border-t-blue-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
               <span className="text-2xl font-bold">{loadingProgress}%</span>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-bold animate-pulse text-blue-200">AI 正在深度思考...</h2>
            <p className="text-slate-400 text-lg flex items-center justify-center gap-2">
              <BrainCircuit className="w-4 h-4" /> {loadingText}
            </p>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-slate-50 flex items-center justify-center p-4 h-screen w-full absolute inset-0 z-50">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 md:p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
               <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
                 <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-yellow-300" />
                 AI 教育课件大师
               </h1>
               <p className="text-blue-100 opacity-90 text-sm md:text-base">基于年龄发展阶段的智能课程设计引擎</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <User className="w-4 h-4 text-purple-500" /> 学生年龄 / Age
              </label>
              <div className="relative">
                <select 
                  value={config.age}
                  onChange={handleAgeChange}
                  className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none text-sm md:text-base"
                >
                  {Object.keys(CURRICULUM_DATA).map(age => (
                    <option key={age} value={age}>{age}</option>
                  ))}
                </select>
                <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Library className="w-4 h-4 text-green-500" /> 
                {parseInt(config.age) < 6 ? "核心主题 / Theme" : "教材单元 / Unit"}
              </label>
              {!config.isCustomUnit ? (
                <div className="relative">
                  <select 
                    value={config.unit}
                    onChange={handleUnitChange}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none text-sm md:text-base"
                  >
                    {availableUnits.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                    <option disabled>──────────</option>
                    <option value="custom_input_option">✎ 手动输入其他...</option>
                  </select>
                  <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">
                    <ChevronRight className="w-4 h-4 rotate-90" />
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 animate-in fade-in slide-in-from-left-2">
                  <input 
                    type="text"
                    value={config.customUnit}
                    onChange={(e) => setConfig({...config, customUnit: e.target.value})}
                    placeholder="请输入自定义单元名称..."
                    className="flex-1 p-3 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base"
                    autoFocus
                  />
                  <button 
                    onClick={() => setConfig({...config, isCustomUnit: false, unit: availableUnits[0]})}
                    className="px-3 text-slate-400 hover:text-slate-600 text-sm whitespace-nowrap"
                  >
                    取消
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" /> 上课时长 / Duration
              </label>
              <div className="relative">
                <select 
                  value={config.duration}
                  onChange={(e) => setConfig({...config, duration: e.target.value})}
                  className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none text-sm md:text-base"
                >
                  <option>15分钟 (微课/学前)</option>
                  <option>30分钟 (标准课时)</option>
                  <option>40分钟 (小学常用)</option>
                  <option>45分钟 (公开课)</option>
                  <option>60分钟 (综合实践)</option>
                </select>
                <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
               <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-pink-500" /> 
                  剧情主题 / Story Theme
                </label>
                <input 
                  type="text" 
                  value={config.theme}
                  onChange={(e) => setConfig({...config, theme: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base"
                  placeholder="例如：星际救援、海底探险、魔法森林"
                />
            </div>
          </div>

          <div className="space-y-2">
             <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Tags className="w-4 h-4 text-indigo-500" /> 
                重点关键词 / Key Words (可选)
              </label>
              <input 
                type="text" 
                value={config.keywords}
                onChange={(e) => setConfig({...config, keywords: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm md:text-base"
                placeholder="例如：Red, Blue, Yellow (若不填则由AI自动从单元提取)"
              />
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button 
              onClick={handleGenerate}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg transform transition active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <BrainCircuit className="w-5 h-5" /> 生成自适应互动课件
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Simple Icon Helper for Phase Headers ---
const BookmarkIcon = ({ phase }) => {
  let colorClass = "text-slate-400";
  if (phase === 'Engage') colorClass = "text-purple-500";
  if (phase === 'Empower') colorClass = "text-blue-500";
  if (phase === 'Execute') colorClass = "text-green-500";
  if (phase === 'Elevate') colorClass = "text-yellow-500";
  
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={colorClass} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
    </svg>
  );
};

// ... (CanvasView and TableView remain largely the same, updated props if needed)

// --- Sub-Views ---

// ... CanvasView component code ...
// (Retaining existing CanvasView logic but simplifying its default config state since it receives context from parent if needed, 
//  but for this specific request, I will keep CanvasView self-contained for data but controlled by App for visibility)

const CanvasView = () => {
  const [courseData, setCourseData] = useState(INITIAL_COURSE_DATA);
  const [activePhase, setActivePhase] = useState('engage');
  const [activeStepId, setActiveStepId] = useState('e1-1');
  const [expandedPhases, setExpandedPhases] = useState(['engage', 'empower', 'execute', 'elevate']);
  
  // UI State
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); 
  const [isExporting, setIsExporting] = useState(false);     
  
  // Selection State
  const [selectedAssetId, setSelectedAssetId] = useState(null);

  // Interaction State
  const [interactionMode, setInteractionMode] = useState('idle');
  const [interactionStart, setInteractionStart] = useState(null); 
  const canvasRef = useRef(null);

  // Derived State
  const currentPhaseData = courseData[activePhase];
  // Safely find current step data
  const currentStep = currentPhaseData?.steps.find(s => s.id === activeStepId) || currentPhaseData?.steps[0];
  const selectedAsset = selectedAssetId && currentStep ? currentStep.assets.find(a => a.id === selectedAssetId) : null;

  // Flatten steps for sequential navigation in preview
  const allSteps = Object.values(courseData).flatMap(phase => phase.steps.map(step => ({...step, phaseKey: Object.keys(courseData).find(k => courseData[k].steps.includes(step))})));
  const currentGlobalIndex = allSteps.findIndex(s => s.id === activeStepId);

  // --- Handlers (Same as before) ---
  const togglePhase = (phaseKey) => {
    if (expandedPhases.includes(phaseKey)) {
      setExpandedPhases(expandedPhases.filter(p => p !== phaseKey));
    } else {
      setExpandedPhases([...expandedPhases, phaseKey]);
    }
  };

  const handleStepClick = (phaseKey, stepId) => {
    setActivePhase(phaseKey);
    setActiveStepId(stepId);
    setSelectedAssetId(null); 
  };

  const handleInputChange = (field, value) => {
    const newCourseData = { ...courseData };
    const step = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
    if(step) step[field] = value;
    setCourseData(newCourseData);
  };

  const handleAssetChange = (assetId, field, value) => {
    const newCourseData = { ...courseData };
    const step = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
    const asset = step.assets.find(a => a.id === assetId);
    if (asset) {
      asset[field] = value;
      setCourseData(newCourseData);
    }
  };

  // ... (Other handlers: handleReferenceUpload, handleLayerChange, handleAddAsset, handleDeleteAsset, handleRegenerateAsset, handleExportPPT, handleNavigatePreview, interaction handlers)
  // Re-implementing necessary handlers briefly for context completeness
  const handleAddAsset = (type) => {
    const newCourseData = { ...courseData };
    const step = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
    
    let w = 300, h = 200;
    if (type === 'audio') { w = 300; h = 100; }
    if (type === 'text') { w = 300; h = 100; }

    const newAsset = {
      id: Date.now().toString(),
      type,
      title: `New ${type}`,
      url: type === 'text' ? '' : `https://placehold.co/${w}x${h}?text=New+${type}`,
      content: type === 'text' ? '双击编辑文本' : '',
      prompt: 'Describe what you want AI to generate...',
      referenceImage: null,
      x: 100, y: 100, width: w, height: h, rotation: 0
    };
    step.assets.push(newAsset);
    setCourseData(newCourseData);
    setSelectedAssetId(newAsset.id); 
    setIsRightOpen(true); 
  };

  const handleDeleteAsset = (assetId) => {
    const newCourseData = { ...courseData };
    const step = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
    step.assets = step.assets.filter(a => a.id !== assetId);
    setCourseData(newCourseData);
    setSelectedAssetId(null);
  };

  const handleRegenerateAsset = (assetId) => {
    const btn = document.getElementById(`regen-btn-${assetId}`);
    if(btn) btn.classList.add('animate-spin');
    setTimeout(() => {
      const newCourseData = { ...courseData };
      const step = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
      const asset = step.assets.find(a => a.id === assetId);
      const randomColor = Math.floor(Math.random()*16777215).toString(16);
      if (asset.type === 'image' || asset.type === 'video') {
         const text = asset.referenceImage ? 'AI+Ref+Gen' : 'AI+Gen';
         const w = asset.width || 300;
         const h = asset.height || 200;
         asset.url = `https://placehold.co/${Math.round(w)}x${Math.round(h)}/${randomColor}/FFF?text=${text}+v${Math.floor(Math.random() * 10)}`;
      }
      setCourseData(newCourseData);
      if(btn) btn.classList.remove('animate-spin');
    }, 1500);
  };

  const handleLayerChange = (assetId, action) => {
    const newCourseData = { ...courseData };
    const step = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
    const currentAssets = [...step.assets];
    const index = currentAssets.findIndex(a => a.id === assetId);
    if (index === -1) return;
    if (action === 'front') currentAssets.push(currentAssets.splice(index, 1)[0]);
    else if (action === 'back') currentAssets.unshift(currentAssets.splice(index, 1)[0]);
    else if (action === 'forward' && index < currentAssets.length - 1) [currentAssets[index], currentAssets[index + 1]] = [currentAssets[index + 1], currentAssets[index]];
    else if (action === 'backward' && index > 0) [currentAssets[index], currentAssets[index - 1]] = [currentAssets[index - 1], currentAssets[index]];
    step.assets = currentAssets;
    setCourseData(newCourseData);
  };

  const handleReferenceUpload = (e, assetId) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newCourseData = { ...courseData };
        const step = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
        const asset = step.assets.find(a => a.id === assetId);
        if (asset) {
          asset.referenceImage = reader.result;
          setCourseData(newCourseData);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExportPPT = () => {
    setIsExporting(true);
    setTimeout(() => { setIsExporting(false); alert("PPT 导出成功！"); }, 2000);
  };

  const handleNavigatePreview = (direction) => {
    const newIndex = direction === 'next' ? currentGlobalIndex + 1 : currentGlobalIndex - 1;
    if (newIndex >= 0 && newIndex < allSteps.length) {
      const targetStep = allSteps[newIndex];
      if (targetStep.phaseKey) setActivePhase(targetStep.phaseKey);
      setActiveStepId(targetStep.id);
    }
  };

  // Interaction handlers
  const handleMouseDown = (e, assetId, mode = 'dragging', handleType = null) => {
    e.stopPropagation(); 
    if (!canvasRef.current) return;
    setSelectedAssetId(assetId);
    setIsRightOpen(true);
    setInteractionMode(mode);
    const step = courseData[activePhase].steps.find(s => s.id === activeStepId);
    const asset = step.assets.find(a => a.id === assetId);
    const rect = canvasRef.current.getBoundingClientRect();
    setInteractionStart({
      startX: e.clientX, startY: e.clientY,
      initialX: asset.x, initialY: asset.y,
      initialW: asset.width || 300, initialH: asset.height || 200,
      initialRotation: asset.rotation || 0,
      handleType, rect 
    });
  };

  const handleMouseMove = (e) => {
    if (interactionMode === 'idle' || !interactionStart) return;
    const newCourseData = { ...courseData };
    const activeAsset = newCourseData[activePhase].steps.find(s => s.id === activeStepId).assets.find(a => a.id === selectedAssetId);
    if (!activeAsset) return;
    const deltaX = e.clientX - interactionStart.startX;
    const deltaY = e.clientY - interactionStart.startY;

    if (interactionMode === 'dragging') {
        activeAsset.x = interactionStart.initialX + deltaX;
        activeAsset.y = interactionStart.initialY + deltaY;
    } else if (interactionMode === 'resizing') {
        const { handleType, initialW, initialH, initialX, initialY } = interactionStart;
        if (handleType === 'se') { activeAsset.width = Math.max(50, initialW + deltaX); activeAsset.height = Math.max(50, initialH + deltaY); }
        else if (handleType === 'sw') { activeAsset.width = Math.max(50, initialW - deltaX); activeAsset.x = initialX + deltaX; activeAsset.height = Math.max(50, initialH + deltaY); }
        else if (handleType === 'ne') { activeAsset.width = Math.max(50, initialW + deltaX); activeAsset.height = Math.max(50, initialH - deltaY); activeAsset.y = initialY + deltaY; }
        else if (handleType === 'nw') { activeAsset.width = Math.max(50, initialW - deltaX); activeAsset.x = initialX + deltaX; activeAsset.height = Math.max(50, initialH - deltaY); activeAsset.y = initialY + deltaY; }
    } else if (interactionMode === 'rotating') {
        const rect = interactionStart.rect;
        const centerX = rect.left + interactionStart.initialX + interactionStart.initialW / 2;
        const centerY = rect.top + interactionStart.initialY + interactionStart.initialH / 2;
        const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        activeAsset.rotation = (angleRad * 180 / Math.PI) + 90;
    }
    setCourseData(newCourseData);
  };

  const handleMouseUp = () => { setInteractionMode('idle'); setInteractionStart(null); };
  const handleCanvasClick = () => { setSelectedAssetId(null); };

  // Phase management handlers
  const handleAddPhase = () => {
    // CanvasView uses a different data structure (object) than TableView (array) in this specific implementation history.
    // For simplicity, sticking to read-only phase structure in CanvasView or simple toggle.
    // Ideally these should share state, but for this specific "view switching" demo, they are separate.
    alert("Phase management is primarily available in Table View for detailed structuring.");
  };

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* 1. LEFT SIDEBAR */}
      <aside className={`${isLeftOpen ? 'w-64' : 'w-0'} bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 transition-all duration-300 relative`}>
        <div className={`p-4 border-b border-slate-100 bg-slate-50 ${!isLeftOpen && 'hidden'}`}>
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-lg text-slate-800 flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-600" /> 课程编排</h1>
            <button onClick={() => setIsLeftOpen(false)} className="text-slate-400 hover:text-slate-600"><ChevronLeft className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-slate-500 mt-1 truncate">Unit 1: Funky Monster Rescue</p>
        </div>
        <div className={`flex-1 overflow-y-auto p-2 space-y-2 ${!isLeftOpen && 'hidden'}`}>
          {Object.entries(courseData).map(([key, phase]) => (
            <div key={key} className="rounded-lg overflow-hidden border border-slate-100 bg-white">
              <button onClick={() => togglePhase(key)} className={`w-full flex items-center justify-between p-3 text-left font-bold text-sm transition-colors ${phase.color.replace('text-', 'bg-opacity-10 ')} hover:bg-opacity-20`}>
                <span className="flex items-center gap-2">{expandedPhases.includes(key) ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}{phase.title}</span>
              </button>
              {expandedPhases.includes(key) && (
                <div className="bg-slate-50 border-t border-slate-100">
                  {phase.steps.map((step) => (
                    <button key={step.id} onClick={() => handleStepClick(key, step.id)} className={`w-full text-left p-2 pl-8 text-xs border-b border-slate-100 last:border-0 hover:bg-blue-50 transition-all flex items-start gap-2 ${activeStepId === step.id ? 'bg-blue-100 text-blue-800 font-semibold border-l-4 border-l-blue-600' : 'text-slate-600'}`}>
                      <span className="shrink-0 mt-0.5"><FileText className="w-3 h-3" /></span><span className="line-clamp-2">{step.title}</span>
                    </button>
                  ))}
                  <button className="w-full text-center py-2 text-xs text-slate-400 hover:text-blue-500 flex items-center justify-center gap-1"><Plus className="w-3 h-3" /> 新增环节</button>
                </div>
              )}
            </div>
          ))}
        </div>
        {!isLeftOpen && <button onClick={() => setIsLeftOpen(true)} className="absolute top-4 left-0 bg-white p-2 rounded-r-md border border-l-0 border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 z-50"><ChevronRight className="w-4 h-4" /></button>}
      </aside>

      {/* 2. MIDDLE SECTION: Canvas */}
      <main className="flex-1 flex flex-col bg-slate-100 relative overflow-hidden transition-all duration-300" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
        <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center gap-4 min-w-0">
             {!isLeftOpen && <div className="font-bold text-slate-700 flex items-center gap-2 mr-4"><BookOpen className="w-4 h-4" /> <span className="text-xs">U1</span></div>}
             <span className="text-sm font-medium text-slate-500 whitespace-nowrap">当前预览:</span>
             <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold whitespace-nowrap">{currentStep?.time}</span>
             <h2 className="text-sm font-bold text-slate-800 truncate" title={currentStep?.title}>{currentStep?.title}</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsPreviewOpen(true)} className="px-3 py-2 hover:bg-slate-100 rounded text-slate-600 flex items-center gap-1 text-xs font-medium"><MonitorPlay className="w-4 h-4" /> 单张预览</button>
            <div className="w-px h-6 bg-slate-300 my-auto mx-1"></div>
            <button onClick={handleExportPPT} disabled={isExporting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded flex items-center gap-2 shadow-sm whitespace-nowrap disabled:bg-blue-400">{isExporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}{isExporting ? '导出中...' : '导出 PPT'}</button>
          </div>
        </div>

        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur shadow-lg rounded-full px-4 py-2 flex gap-3 border border-slate-200 z-20 transition-all hover:scale-105">
           <button onClick={() => handleAddAsset('text')} className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-blue-600 transition-colors"><Type className="w-5 h-5" /><span className="text-[9px] font-bold">文本</span></button>
           <div className="w-px bg-slate-200 h-8"></div>
           <button onClick={() => handleAddAsset('image')} className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-purple-600 transition-colors"><ImageIcon className="w-5 h-5" /><span className="text-[9px] font-bold">图片</span></button>
           <button onClick={() => handleAddAsset('audio')} className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-green-600 transition-colors"><Music className="w-5 h-5" /><span className="text-[9px] font-bold">音频</span></button>
           <button onClick={() => handleAddAsset('video')} className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-red-600 transition-colors"><Video className="w-5 h-5" /><span className="text-[9px] font-bold">视频</span></button>
        </div>

        <div className="flex-1 overflow-auto p-8 flex items-center justify-center relative" onClick={handleCanvasClick}>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px]"></div>
          <div ref={canvasRef} className="w-[960px] h-[540px] bg-white shadow-2xl rounded-sm relative overflow-hidden ring-1 ring-slate-900/5 group transition-transform duration-200" onClick={(e) => e.stopPropagation()}>
             <SlideRenderer assets={currentStep?.assets || []} isEditable={true} onMouseDown={handleMouseDown} selectedAssetId={selectedAssetId} />
          </div>
        </div>
      </main>

      {/* 3. RIGHT SIDEBAR */}
      <aside className={`${isRightOpen ? 'w-96' : 'w-0'} bg-white border-l border-slate-200 flex flex-col shrink-0 z-10 shadow-[0_0_15px_rgba(0,0,0,0.05)] transition-all duration-300 relative`}>
         {isRightOpen && <button onClick={() => setIsRightOpen(false)} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 z-20" title="收起面板"><ChevronRight className="w-4 h-4" /></button>}
         {!isRightOpen && <button onClick={() => setIsRightOpen(true)} className="absolute top-4 right-0 bg-white p-2 rounded-l-md border border-r-0 border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 z-50 transform -translate-x-full" title="展开面板"><ChevronLeft className="w-4 h-4" /></button>}
         <div className={`flex flex-col h-full ${!isRightOpen && 'hidden'}`}>
             {selectedAsset ? (
                <>
                  <div className="p-4 border-b border-slate-100 bg-blue-50 flex items-center justify-between">
                     <div className="flex items-center gap-2 pl-6">{getAssetIcon(selectedAsset.type)}<h3 className="font-bold text-blue-800">编辑元素</h3></div>
                     <button onClick={() => setSelectedAssetId(null)} className="text-slate-500 hover:text-slate-700"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center justify-between">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Layers className="w-3 h-3" /> 图层</span>
                     <div className="flex gap-1">
                        <button onClick={() => handleLayerChange(selectedAsset.id, 'front')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="置顶"><ChevronsUp className="w-4 h-4" /></button>
                        <button onClick={() => handleLayerChange(selectedAsset.id, 'forward')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="上移"><ArrowUp className="w-4 h-4" /></button>
                        <button onClick={() => handleLayerChange(selectedAsset.id, 'backward')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="下移"><ArrowDown className="w-4 h-4" /></button>
                        <button onClick={() => handleLayerChange(selectedAsset.id, 'back')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="置底"><ChevronsDown className="w-4 h-4" /></button>
                     </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 space-y-6">
                     <div className="grid grid-cols-3 gap-2">
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">宽 Width</label><div className="flex items-center border border-slate-200 rounded px-2 bg-slate-50"><input type="number" value={Math.round(selectedAsset.width || 300)} onChange={(e) => handleAssetChange(selectedAsset.id, 'width', parseInt(e.target.value))} className="w-full text-xs bg-transparent py-1.5 outline-none"/><span className="text-[10px] text-slate-400">px</span></div></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">高 Height</label><div className="flex items-center border border-slate-200 rounded px-2 bg-slate-50"><input type="number" value={Math.round(selectedAsset.height || 200)} onChange={(e) => handleAssetChange(selectedAsset.id, 'height', parseInt(e.target.value))} className="w-full text-xs bg-transparent py-1.5 outline-none"/><span className="text-[10px] text-slate-400">px</span></div></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">旋转 Rotate</label><div className="flex items-center border border-slate-200 rounded px-2 bg-slate-50"><input type="number" value={Math.round(selectedAsset.rotation || 0)} onChange={(e) => handleAssetChange(selectedAsset.id, 'rotation', parseInt(e.target.value))} className="w-full text-xs bg-transparent py-1.5 outline-none"/><span className="text-[10px] text-slate-400">°</span></div></div>
                     </div>
                     <div className="space-y-4">
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">标题 / Name</label><input type="text" value={selectedAsset.title} onChange={(e) => handleAssetChange(selectedAsset.id, 'title', e.target.value)} className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"/></div>
                        {selectedAsset.type === 'text' ? (
                           <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">文本内容 / Content</label><textarea value={selectedAsset.content} onChange={(e) => handleAssetChange(selectedAsset.id, 'content', e.target.value)} className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"/></div>
                        ) : (
                           <>
                              {(selectedAsset.type === 'image' || selectedAsset.type === 'video') && (
                                 <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2"><label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Upload className="w-3 h-3" /> 参考图片 (可选)</label><span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">Optional</span></div>
                                    {!selectedAsset.referenceImage ? (
                                       <div className="border border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative group/upload">
                                          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={(e) => handleReferenceUpload(e, selectedAsset.id)} />
                                          <div className="p-2 bg-white rounded-full shadow-sm mb-2 group-hover/upload:scale-110 transition-transform"><Upload className="w-5 h-5 text-slate-400" /></div>
                                          <span className="text-xs text-slate-500 font-medium">点击上传参考图片</span>
                                          <span className="text-[10px] text-slate-400 mt-1">仅用于风格辅助，非必传</span>
                                       </div>
                                    ) : (
                                       <div className="space-y-2">
                                          <div className="relative group/ref"><img src={selectedAsset.referenceImage} alt="Reference" className="w-full h-32 object-cover rounded border border-slate-200 opacity-90" /><div className="absolute inset-0 bg-black/0 group-hover/ref:bg-black/10 transition-colors rounded"></div><button onClick={() => handleAssetChange(selectedAsset.id, 'referenceImage', null)} className="absolute top-2 right-2 bg-white text-slate-600 hover:text-red-500 p-1.5 rounded-full shadow-sm opacity-0 group-hover/ref:opacity-100 transition-opacity" title="移除参考图"><X className="w-3.5 h-3.5" /></button></div>
                                          <div className="flex items-center gap-2"><Sliders className="w-3 h-3 text-slate-400" /><div className="flex-1 h-1 bg-slate-200 rounded overflow-hidden"><div className="w-1/3 h-full bg-blue-400"></div></div><span className="text-[10px] text-slate-400">参考权重: 低</span></div>
                                       </div>
                                    )}
                                 </div>
                              )}
                              <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-2"><Wand2 className="w-3 h-3 text-purple-500" /> AI 生成提示词 / Prompt</label>
                                 <textarea value={selectedAsset.prompt} onChange={(e) => handleAssetChange(selectedAsset.id, 'prompt', e.target.value)} placeholder="描述你想要生成的画面..." className="w-full text-sm border border-purple-200 bg-purple-50 rounded px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none h-24 resize-none mb-2"/>
                                 <button onClick={() => handleRegenerateAsset(selectedAsset.id)} className="w-full py-2 bg-purple-600 text-white rounded text-sm font-bold shadow hover:bg-purple-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"><RefreshCw className="w-4 h-4" /> {selectedAsset.referenceImage ? '参考图 + 文本生成' : '立即生成'}</button>
                              </div>
                           </>
                        )}
                     </div>
                     <div className="pt-6 mt-6 border-t border-slate-100">
                        <button onClick={() => handleDeleteAsset(selectedAsset.id)} className="w-full py-2 text-red-500 border border-red-200 rounded text-sm font-bold hover:bg-red-50 flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" /> 删除此元素</button>
                     </div>
                  </div>
                </>
             ) : (
                <>
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between"><h3 className="font-bold text-slate-800 flex items-center gap-2 pl-6"><Wand2 className="w-4 h-4 text-purple-600" />环节详情编辑</h3></div>
                  <div className="flex-1 overflow-y-auto p-5 space-y-6">
                     <div className="space-y-4">
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">时间 / Time</label><div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /><input type="text" value={currentStep?.time || ''} onChange={(e) => handleInputChange('time', e.target.value)} className="flex-1 text-sm border border-slate-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none" /></div></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">教学环节 / Step Title</label><input type="text" value={currentStep?.title || ''} onChange={(e) => handleInputChange('title', e.target.value)} className="w-full text-sm font-bold border border-slate-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                        <div><label className="text-xs font-bold text-slate-500 uppercase mb-1 block">教学目标 / Objectives</label><textarea value={currentStep?.objective || ''} onChange={(e) => handleInputChange('objective', e.target.value)} className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-16 bg-slate-50" /></div>
                     </div>
                     <hr className="border-slate-100" />
                     <div className="space-y-3">
                        <div className="flex items-center justify-between"><label className="text-xs font-bold text-slate-500 uppercase">本页素材 ({currentStep?.assets?.length || 0})</label><div className="flex gap-1"><button onClick={() => handleAddAsset('image')} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-purple-600"><Plus className="w-4 h-4" /></button></div></div>
                        <div className="space-y-2">{currentStep?.assets?.map((asset, idx) => (<div key={asset.id} onClick={() => setSelectedAssetId(asset.id)} className="flex items-start gap-2 p-2 border border-slate-200 rounded bg-white hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all group"><div className="mt-1 text-slate-400">{getAssetIcon(asset.type)}</div><div className="flex-1 min-w-0"><div className="text-xs font-bold text-slate-700 truncate">{asset.title}</div><div className="text-[10px] text-slate-400">{asset.type} • 点击编辑</div></div></div>))}</div>
                     </div>
                  </div>
                </>
             )}
         </div>
      </aside>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
           <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
              <div className="text-white font-bold">{currentStep?.title}</div>
              <div className="flex gap-4">
                 <button onClick={() => handleNavigatePreview('prev')} disabled={currentGlobalIndex <= 0} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 disabled:opacity-50 text-white"><ChevronLeft className="w-5 h-5" /></button>
                 <button onClick={() => handleNavigatePreview('next')} disabled={currentGlobalIndex >= allSteps.length - 1} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 disabled:opacity-50 text-white"><ChevronRight className="w-5 h-5" /></button>
                 <button onClick={() => setIsPreviewOpen(false)} className="p-2 bg-red-900/50 hover:bg-red-700 text-white rounded-full ml-4"><X className="w-5 h-5" /></button>
              </div>
           </div>
           <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative">
              <div style={{ width: 960, height: 540, transform: 'scale(1.2)' }} className="relative bg-white shadow-2xl overflow-hidden"><SlideRenderer assets={currentStep?.assets || []} isEditable={false} /></div>
           </div>
        </div>
      )}
    </div>
  );
};

const TableView = ({ initialConfig, onReset }) => {
  const [slides, setSlides] = useState(WORD_DOC_DATA);
  const [previewImage, setPreviewImage] = useState(null);
  const [generatingMedia, setGeneratingMedia] = useState({});

  const [phases, setPhases] = useState([
    { id: 'Engage', label: 'Engage (引入)', color: 'bg-purple-50 border-purple-200 text-purple-800', slides: WORD_DOC_DATA.filter(s => s.phase.includes('Engage')) },
    { id: 'Empower', label: 'Empower (赋能)', color: 'bg-blue-50 border-blue-200 text-blue-800', slides: WORD_DOC_DATA.filter(s => s.phase.includes('Empower')) },
    { id: 'Execute', label: 'Execute (实践/产出)', color: 'bg-green-50 border-green-200 text-green-800', slides: WORD_DOC_DATA.filter(s => s.phase.includes('Execute')) },
    { id: 'Elevate', label: 'Elevate (升华)', color: 'bg-yellow-50 border-yellow-200 text-yellow-800', slides: WORD_DOC_DATA.filter(s => s.phase.includes('Elevate')) }
  ]);

  const updateSlideField = (phaseId, slideId, field, value) => {
    setPhases(prevPhases => prevPhases.map(phase => {
        if (phase.id !== phaseId) return phase;
        return { ...phase, slides: phase.slides.map(slide => slide.id === slideId ? { ...slide, [field]: value } : slide) };
    }));
  };

  const handleAddPhase = () => {
    const newId = `Phase-${Date.now()}`;
    setPhases([...phases, { id: newId, label: 'New Phase (新阶段)', color: 'bg-gray-50 border-gray-200 text-gray-800', slides: [] }]);
  };

  const handleDeletePhase = (phaseId) => {
    if (confirm('确定要删除这个阶段及其所有内容吗？')) {
        setPhases(phases.filter(p => p.id !== phaseId));
    }
  };

  const handleEditPhaseLabel = (phaseId, newLabel) => {
    setPhases(phases.map(p => p.id === phaseId ? { ...p, label: newLabel } : p));
  };

  const handleAddRow = (phaseId) => {
    const newId = Date.now();
    setPhases(prevPhases => prevPhases.map(phase => {
        if (phase.id !== phaseId) return phase;
        let defaultPhaseStr = phase.label;
        return {
            ...phase,
            slides: [...phase.slides, {
                id: newId, phase: defaultPhaseStr, duration: "5分钟", title: "New Activity", objectives: "", activities: "", materials: "", worksheets: "无", ppt_content: "", image: null, audio: null, video: null, elements: []
            }]
        };
    }));
  };

  const handleDeleteRow = (phaseId, slideId) => {
    setPhases(prevPhases => prevPhases.map(phase => {
        if (phase.id !== phaseId) return phase;
        return { ...phase, slides: phase.slides.filter(s => s.id !== slideId) };
    }));
  };

  const handleRegenerateMedia = (phaseId, slideId, type) => {
    const key = `${slideId}-${type}`;
    setGeneratingMedia(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setPhases(prevPhases => prevPhases.map(phase => {
        if (phase.id !== phaseId) return phase;
        return {
            ...phase,
            slides: phase.slides.map(slide => {
                if (slide.id !== slideId) return slide;
                let newContent = null;
                if (type === 'image') newContent = `https://placehold.co/600x400/${Math.floor(Math.random()*16777215).toString(16)}/FFF?text=AI+Gen+Image+${Date.now().toString().slice(-4)}`;
                else if (type === 'audio') newContent = "https://placehold.co/audio.mp3"; 
                else if (type === 'video') newContent = "https://placehold.co/video-placeholder"; 
                return { ...slide, [type]: newContent };
            })
        };
      }));
      setGeneratingMedia(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[1600px] mx-auto space-y-8">
           {phases.map((phase) => {
             return (
               <div key={phase.id} className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden group/phase">
                 <div className={`p-4 border-b border-slate-100 flex justify-between items-center ${phase.color.replace('text-', 'bg-opacity-10 ')}`}>
                    <div className="flex items-center gap-2 flex-1">
                        <BookmarkIcon phase={phase.id.split('-')[0]} />
                        <input type="text" value={phase.label} onChange={(e) => handleEditPhaseLabel(phase.id, e.target.value)} className={`text-lg font-bold bg-transparent outline-none w-full ${phase.color}`} />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-xs font-medium px-2 py-1 bg-white/50 rounded-full text-slate-500">{phase.slides.length} 个环节</div>
                        <button onClick={() => handleDeletePhase(phase.id)} className="p-1.5 hover:bg-white/50 text-red-400 hover:text-red-600 rounded transition-colors opacity-0 group-hover/phase:opacity-100" title="删除整个阶段"><Trash2 className="w-4 h-4" /></button>
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                     <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                       <tr><th className="p-4 w-20">时长</th><th className="p-4 w-28">环节</th><th className="p-4 w-40">教学活动 & 讲稿</th><th className="p-4 w-40">PPT内容</th><th className="p-4 w-32">图片</th><th className="p-4 w-32">音频</th><th className="p-4 w-32">视频</th><th className="p-4 w-24">材料/练习</th><th className="p-4 w-12 text-center">操作</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {phase.slides.length > 0 ? (
                         phase.slides.map((slide) => (
                           <tr key={slide.id} className="hover:bg-slate-50 group transition-colors">
                             <td className="p-4 align-top"><input value={slide.duration} onChange={(e) => updateSlideField(phase.id, slide.id, 'duration', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-blue-400 outline-none font-medium text-blue-600 transition-colors" placeholder="时长"/></td>
                             <td className="p-4 align-top"><textarea value={slide.title} onChange={(e) => updateSlideField(phase.id, slide.id, 'title', e.target.value)} className="w-full bg-transparent text-xs font-bold text-slate-700 resize-none outline-none focus:bg-white rounded" rows={2} placeholder="小标题..."/></td>
                             <td className="p-4 align-top"><div className="space-y-2"><textarea value={slide.activities} onChange={(e) => updateSlideField(phase.id, slide.id, 'activities', e.target.value)} className="w-full bg-transparent border border-transparent focus:border-blue-200 focus:bg-white rounded p-1 resize-none text-slate-700 leading-relaxed whitespace-pre-wrap transition-colors text-xs" rows={6} placeholder="详细的活动步骤和教师讲稿..."/><div className="pt-1 border-t border-slate-100"><label className="text-[10px] text-slate-400 font-bold uppercase">教学目标</label><textarea value={slide.objectives} onChange={(e) => updateSlideField(phase.id, slide.id, 'objectives', e.target.value)} className="w-full bg-transparent text-xs text-slate-500 resize-none outline-none focus:bg-white rounded" rows={3} placeholder="输入教学目标..."/></div></div></td>
                             <td className="p-4 align-top"><textarea value={slide.ppt_content} onChange={(e) => updateSlideField(phase.id, slide.id, 'ppt_content', e.target.value)} className="w-full bg-slate-100/50 border border-slate-200 focus:border-blue-300 focus:bg-white rounded p-2 resize-none text-xs text-slate-600 leading-relaxed transition-colors h-full min-h-[120px]" placeholder="描述PPT画面内容..."/></td>
                             <td className="p-4 align-top"><div className="relative group/media w-full aspect-video bg-slate-100 rounded-md border border-slate-200 overflow-hidden flex items-center justify-center">{generatingMedia[`${slide.id}-image`] ? (<div className="flex flex-col items-center gap-1 text-blue-500"><RefreshCw className="w-5 h-5 animate-spin" /><span className="text-[10px]">生成中...</span></div>) : slide.image ? (<><img src={slide.image} alt="PPT Slide" className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setPreviewImage(slide.image)}/><div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center gap-2"><button onClick={() => setPreviewImage(slide.image)} title="预览" className="p-1.5 bg-white/20 text-white rounded hover:bg-white/40 backdrop-blur-sm"><Maximize2 className="w-3 h-3" /></button><button onClick={() => handleRegenerateMedia(phase.id, slide.id, 'image')} title="重新生成" className="p-1.5 bg-white/20 text-white rounded hover:bg-white/40 backdrop-blur-sm"><RefreshCw className="w-3 h-3" /></button></div></>) : (<button onClick={() => handleRegenerateMedia(phase.id, slide.id, 'image')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-500 transition-colors"><ImageIcon className="w-6 h-6" /><span className="text-[10px]">生成图片</span></button>)}</div></td>
                             <td className="p-4 align-top"><div className="flex flex-col gap-2">{generatingMedia[`${slide.id}-audio`] ? (<div className="flex items-center gap-2 text-purple-500 p-2 bg-purple-50 rounded"><RefreshCw className="w-3 h-3 animate-spin" /><span className="text-[10px]">生成音频...</span></div>) : slide.audio ? (<div className="p-2 bg-slate-50 border border-slate-200 rounded flex flex-col gap-2"><div className="flex items-center justify-between"><div className="flex items-center gap-1 text-slate-600"><Music className="w-3 h-3" /><span className="text-[10px] font-mono">AUDIO.mp3</span></div><button onClick={() => handleRegenerateMedia(phase.id, slide.id, 'audio')} className="text-slate-400 hover:text-purple-500"><RefreshCw className="w-3 h-3" /></button></div><audio controls src={slide.audio} className="w-full h-6 text-[10px]" /></div>) : (<button onClick={() => handleRegenerateMedia(phase.id, slide.id, 'audio')} className="w-full py-2 border border-dashed border-slate-300 rounded text-slate-400 text-[10px] hover:border-purple-400 hover:text-purple-500 flex items-center justify-center gap-1"><FileAudio className="w-3 h-3" /> 生成音频</button>)}</div></td>
                             <td className="p-4 align-top"><div className="flex flex-col gap-2">{generatingMedia[`${slide.id}-video`] ? (<div className="flex items-center gap-2 text-pink-500 p-2 bg-pink-50 rounded"><RefreshCw className="w-3 h-3 animate-spin" /><span className="text-[10px]">生成视频...</span></div>) : slide.video ? (<div className="space-y-1"><div className="relative group/video w-full aspect-video bg-black rounded overflow-hidden"><video src={slide.video} className="w-full h-full object-cover" controls /></div><div className="flex justify-end"><button onClick={() => handleRegenerateMedia(phase.id, slide.id, 'video')} className="text-[10px] text-slate-400 hover:text-pink-500 flex items-center gap-1"><RefreshCw className="w-3 h-3" /> 重新生成</button></div></div>) : (<button onClick={() => handleRegenerateMedia(phase.id, slide.id, 'video')} className="w-full py-2 border border-dashed border-slate-300 rounded text-slate-400 text-[10px] hover:border-pink-400 hover:text-pink-500 flex items-center justify-center gap-1"><Film className="w-3 h-3" /> 生成视频</button>)}</div></td>
                             <td className="p-4 align-top"><textarea value={slide.materials} onChange={(e) => updateSlideField(phase.id, slide.id, 'materials', e.target.value)} className="w-full bg-transparent border border-transparent focus:border-blue-200 focus:bg-white rounded p-1 text-xs text-amber-600 resize-none transition-colors" rows={3} placeholder="所需物料..."/>{slide.worksheets && slide.worksheets !== '无' && (<div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded w-fit border border-slate-200"><FileText className="w-3 h-3" /> {slide.worksheets}</div>)}</td>
                             <td className="p-4 align-top text-center"><button onClick={() => handleDeleteRow(phase.id, slide.id)} className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-colors" title="删除此行"><Trash2 className="w-4 h-4" /></button></td>
                           </tr>
                         ))
                       ) : (
                         <tr><td colSpan="9" className="p-8 text-center text-slate-400 text-sm">此阶段暂无教学环节，请点击下方按钮添加。</td></tr>
                       )}
                     </tbody>
                   </table>
                 </div>
                 <div className="p-3 border-t border-slate-100 bg-slate-50">
                    <button onClick={() => handleAddRow(phase.id)} className="w-full py-2 border border-dashed border-slate-300 rounded-md text-slate-400 text-xs font-bold hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"><Plus className="w-3 h-3" /> 添加 {phase.label.split(' ')[0]} 环节</button>
                 </div>
               </div>
             );
           })}
           <button onClick={handleAddPhase} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 font-bold hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> 添加新的课程阶段 (New Phase)</button>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [appState, setAppState] = useState('welcome'); // 'welcome' | 'app'
  const [currentView, setCurrentView] = useState('canvas'); // 'canvas' or 'table'
  const [appConfig, setAppConfig] = useState(null);

  const handleStartApp = (config) => {
    setAppConfig(config);
    setAppState('app');
  };

  const handleReset = () => {
    setAppState('welcome');
  };

  if (appState === 'welcome') {
    return <WelcomeScreen onStart={handleStartApp} />;
  }

  return (
    <div className="h-screen flex flex-col font-sans bg-slate-50">
      {/* Universal Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30 shrink-0">
        <div className="flex items-center gap-3">
           <div className="bg-blue-600 p-1.5 rounded text-white shadow-sm">
             <Sparkles className="w-4 h-4" />
           </div>
           <div className="flex flex-col">
              <h1 className="font-bold text-sm text-slate-800">CourseGen AI</h1>
              <span className="text-[10px] text-slate-500">Interactive Course Creator</span>
           </div>
        </div>
        
        {/* View Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
           <button onClick={() => setCurrentView('canvas')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${currentView === 'canvas' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Layout className="w-3.5 h-3.5" /> 画布视图
           </button>
           <button onClick={() => setCurrentView('table')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${currentView === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <TableIcon className="w-3.5 h-3.5" /> 表格视图
           </button>
        </div>

        <div className="flex items-center gap-4">
          {appConfig && (
             <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">当前单元</span>
                <span className="text-xs font-medium text-slate-700 max-w-[150px] truncate">{appConfig.unit || 'Custom Unit'}</span>
             </div>
          )}
          <button onClick={handleReset} className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors" title="重设参数">
             <Settings2 className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-200"></div>
          <button className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-xs font-medium hover:bg-blue-100 flex items-center gap-1 border border-blue-100">
             <Download className="w-3 h-3" /> 导出课件包
          </button>
        </div>
      </header>

      {/* View Content */}
      <div className="flex-1 flex overflow-hidden relative">
         {currentView === 'canvas' ? <CanvasView /> : <TableView initialConfig={appConfig} onReset={handleReset} />}
      </div>
    </div>
  );
}