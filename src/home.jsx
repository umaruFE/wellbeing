import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  Clock, 
  GraduationCap, 
  Layout, 
  Image as ImageIcon, 
  Type, 
  RefreshCw, 
  Download, 
  ChevronRight, 
  Play,
  CheckCircle2,
  Wand2,
  Settings2,
  BrainCircuit,
  Lightbulb,
  User,
  FileText,
  Tags,
  Baby,
  Library
} from 'lucide-react';

// --- Data Constants ---

// Age Group to Course Unit Mapping
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

const MOCK_GENERATED_SLIDES = [
  {
    id: 1,
    phase: "Engage (引入)",
    title: "深空信号接收",
    layout: "immersive",
    thumbnail: "https://placehold.co/150x100/1a1a2e/FFF?text=Radar",
    elements: [
      {
        id: 'bg-1',
        type: 'image',
        label: '环境背景',
        prompt: '浩瀚宇宙星空，远处有旋转星云，深邃神秘，高分辨率 3D 渲染',
        content: 'https://images.unsplash.com/photo-1506318137071-a8bcbf67ccca?q=80&w=1000&auto=format&fit=crop',
        status: 'ready',
        rationale: '情境认知理论 (Situated Cognition)：通过构建高保真的“宇宙”宏观场景，快速切断学生与现实环境（教室）的联系，建立“星际救援”的沉浸式心理场。'
      },
      {
        id: 'img-1',
        type: 'image',
        label: '视觉焦点',
        prompt: '高科技雷达屏幕，深色界面，中间有一个急促闪烁的红色光点，科幻 UI 风格',
        content: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1000&auto=format&fit=crop',
        status: 'ready',
        rationale: '视觉显著性 (Visual Salience)：该年龄段儿童的注意力容易分散，利用“深色背景+高频闪烁红点”形成强烈的视觉反差，强制锁定视觉注意力。'
      },
      {
        id: 'script-1',
        type: 'script',
        label: '教师指令',
        content: 'Rescue cadets, quiet! Look at the main screen! Our deep-space radar has detected something!',
        status: 'ready',
        rationale: '角色扮演法 (Role-Play)：教师使用“指挥官”而非“老师”的身份指令，利用权威型角色建立游戏契约，降低学生对英语学习的焦虑感 (Affective Filter)。'
      }
    ]
  },
  {
    id: 2,
    phase: "Empower (赋能)",
    title: "情感连接与解码",
    layout: "video-focus",
    thumbnail: "https://placehold.co/150x100/333/FFF?text=Monster",
    elements: [
      {
        id: 'bg-2',
        type: 'image',
        label: '背景氛围',
        prompt: '模糊的数码干扰背景，带有解码中的进度条，赛博朋克风格',
        content: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1000&auto=format&fit=crop',
        status: 'ready',
        rationale: '蔡格尼克效应 (Zeigarnik Effect)：利用“解码中”和“模糊画面”制造未完成感，激发儿童天生的好奇心和探索欲，为下一个清晰画面的出现蓄势。'
      },
      {
        id: 'img-2',
        type: 'image',
        label: '角色特写',
        prompt: '皮克斯风格，一只可爱的毛茸茸怪兽，颜色灰暗，表情惊恐，双手合十恳求，大眼睛含泪',
        content: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=1000&auto=format&fit=crop',
        status: 'ready',
        rationale: '镜像神经元 (Mirror Neurons)：使用具有“婴儿图式”特征（大眼睛、圆脸）的受害者形象，能瞬间激活儿童大脑中的镜像神经元系统，诱发强烈的同情心和救援动机。'
      },
      {
        id: 'txt-2',
        type: 'text',
        label: '核心句型',
        content: 'Help us! Our color is gone!',
        style: 'subtitle',
        status: 'ready',
        rationale: '可理解性输入 (i+1)：将抽象的“求救”概念与具体的“颜色消失”视觉现象绑定，确保语言输入略高于学生现有水平但可被语境理解。'
      }
    ]
  }
];

// --- Main Component ---
export default function AICoursewareTool() {
  const [step, setStep] = useState('input'); // input, generating, editor
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('');
  
  // Input State
  const [config, setConfig] = useState({
    grade: '小学三年级', // Keep for display, but logic is mainly age-driven now
    age: '8-9岁 (三年级/G3)',
    unit: 'Unit 3: Animals (神奇的动物)',
    duration: '40分钟',
    theme: '星际救援冒险',
    sourceText: '',
    keywords: '',
    isCustomUnit: false, // To toggle custom input
    customUnit: ''
  });

  // Editor State
  const [slides, setSlides] = useState([]);
  const [selectedSlideId, setSelectedSlideId] = useState(1);
  const [regeneratingId, setRegeneratingId] = useState(null);

  // Helper: Get units based on current age
  const availableUnits = CURRICULUM_DATA[config.age] || [];

  // --- Handlers ---

  const handleAgeChange = (e) => {
    const newAge = e.target.value;
    const newUnits = CURRICULUM_DATA[newAge] || [];
    
    // Auto-select the first unit when age changes
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

  // Simulate Generation Process
  const handleGenerate = () => {
    setStep('generating');
    const finalUnit = config.isCustomUnit ? config.customUnit : config.unit;
    
    const stages = [
      { p: 10, t: `正在加载 ${config.age} 认知心理学模型...` },
      { p: 30, t: `正在分析 "${finalUnit}" 的核心知识点图谱...` },
      { p: 50, t: 'AI 引擎正在设计“最近发展区(ZPD)”教学支架...' },
      { p: 70, t: '正在生成多模态(Visual-Auditory)教学素材...' },
      { p: 90, t: '正在进行教育学原理一致性校验...' },
      { p: 100, t: '课件组装完成！' }
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage >= stages.length) {
        clearInterval(interval);
        setSlides(MOCK_GENERATED_SLIDES);
        setStep('editor');
        return;
      }
      setLoadingProgress(stages[currentStage].p);
      setLoadingText(stages[currentStage].t);
      currentStage++;
    }, 800);
  };

  const handleRegenerateAsset = (slideId, elementId) => {
    setRegeneratingId(elementId);
    // Simulate API call delay
    setTimeout(() => {
      setSlides(prevSlides => {
        return prevSlides.map(slide => {
          if (slide.id !== slideId) return slide;
          return {
            ...slide,
            elements: slide.elements.map(el => {
              if (el.id !== elementId) return el;
              const newUrl = el.type === 'image' 
                ? `https://placehold.co/600x400/${Math.floor(Math.random()*16777215).toString(16)}/FFF?text=New+AI+Gen` 
                : el.content + " (Rewrite)";
              return { ...el, content: newUrl };
            })
          };
        });
      });
      setRegeneratingId(null);
    }, 1500);
  };

  const currentSlide = slides.find(s => s.id === selectedSlideId);

  // --- Render Functions ---

  if (step === 'input') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="max-w-3xl w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                 <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                   <Sparkles className="w-8 h-8 text-yellow-300" />
                   AI 教育课件大师
                 </h1>
                 <p className="text-blue-100 opacity-90">基于年龄发展阶段的智能课程设计引擎</p>
              </div>
            </div>
          </div>
          
          <div className="p-8 space-y-6">
            {/* Basic Info Row */}
            <div className="grid grid-cols-2 gap-6">
              
              {/* Age Selection (Driver) */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-500" /> 学生年龄 / Age
                </label>
                <div className="relative">
                  <select 
                    value={config.age}
                    onChange={handleAgeChange}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
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

              {/* Unit Selection (Dependent) */}
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
                      className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
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
                      className="flex-1 p-3 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      autoFocus
                    />
                    <button 
                      onClick={() => setConfig({...config, isCustomUnit: false, unit: availableUnits[0]})}
                      className="px-3 text-slate-400 hover:text-slate-600"
                      title="返回选择列表"
                    >
                      取消
                    </button>
                  </div>
                )}
                <p className="text-xs text-slate-400 pl-1">
                  * 已根据 {config.age.split(' ')[0]} 自动匹配推荐教材
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" /> 上课时长 / Duration
                </label>
                <div className="relative">
                  <select 
                    value={config.duration}
                    onChange={(e) => setConfig({...config, duration: e.target.value})}
                    className="w-full p-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
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

              {/* Theme Input */}
              <div className="space-y-2">
                 <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-pink-500" /> 
                    剧情主题 / Story Theme
                  </label>
                  <input 
                    type="text" 
                    value={config.theme}
                    onChange={(e) => setConfig({...config, theme: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="例如：星际救援、海底探险、魔法森林"
                  />
              </div>
            </div>

            {/* Content Input */}
            <div className="space-y-2">
               <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Tags className="w-4 h-4 text-indigo-500" /> 
                  重点关键词 / Key Words (可选)
                </label>
                <input 
                  type="text" 
                  value={config.keywords}
                  onChange={(e) => setConfig({...config, keywords: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="例如：Red, Blue, Yellow (若不填则由AI自动从单元提取)"
                />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" /> 
                补充教学目标 / Additional Goals
              </label>
              <textarea 
                value={config.sourceText}
                onChange={(e) => setConfig({...config, sourceText: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                placeholder="在此输入特殊的教学要求，例如：'重点训练学生的口语输出' 或 '包含一个TPR身体反应游戏'。"
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
  }

  if (step === 'generating') {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-8">
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
    <div className="h-screen flex flex-col bg-slate-100 text-slate-800 font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-800 tracking-tight">CourseGen AI</h1>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span className="bg-slate-100 px-1 rounded">{config.age.split(' ')[0]}</span>
              <span className="bg-slate-100 px-1 rounded truncate max-w-[200px]">
                {config.isCustomUnit ? config.customUnit : config.unit}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm transition-colors">
            <Play className="w-4 h-4" /> 预览模式
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow-md transition-colors">
            <Download className="w-4 h-4" /> 导出 PPTX
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT: Outline Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-10 shrink-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">教学流程大纲</h3>
            <p className="text-sm font-semibold text-slate-700">基于 {config.age.split(' ')[0]} 专注力模型</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                onClick={() => setSelectedSlideId(slide.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group ${
                  selectedSlideId === slide.id 
                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200 shadow-sm' 
                    : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    selectedSlideId === slide.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full mb-1 inline-block uppercase tracking-wide font-bold ${
                      slide.phase.includes('Engage') ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {slide.phase}
                    </span>
                    <h4 className={`text-sm font-medium leading-tight ${selectedSlideId === slide.id ? 'text-blue-900' : 'text-slate-700'}`}>
                      {slide.title}
                    </h4>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* CENTER: Canvas/Preview */}
        <main className="flex-1 bg-slate-100 p-8 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          {/* Slide Container */}
          <div className="w-full max-w-4xl aspect-video bg-white rounded-lg shadow-2xl overflow-hidden relative z-10 border border-slate-200 group transition-all duration-300">
             {/* Render Elements visually (Simulated) */}
             <div className="absolute inset-0">
                {currentSlide.elements.find(e => e.label.includes('背景')) && (
                  <img 
                    src={currentSlide.elements.find(e => e.label.includes('背景')).content} 
                    alt="Background" 
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-black/20"></div> {/* Overlay */}
                
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
                   {currentSlide.elements.filter(e => e.type !== 'script' && !e.label.includes('背景')).map(el => (
                     <div key={el.id} className="relative mb-4 last:mb-0 hover:ring-2 hover:ring-blue-400 rounded transition-all cursor-pointer">
                        {el.type === 'image' && (
                          <img src={el.content} alt={el.label} className="max-h-64 rounded-lg shadow-lg transform hover:scale-105 transition-transform" />
                        )}
                        {el.type === 'text' && (
                          <h2 className={`text-4xl font-bold text-white drop-shadow-md ${el.style === 'glitch' ? 'font-mono tracking-widest' : ''}`}>
                            {el.content}
                          </h2>
                        )}
                     </div>
                   ))}
                </div>
             </div>

             {/* Teacher Script Overlay */}
             <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md p-4 rounded-lg border border-white/10 text-white/90">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-600 p-1 rounded mt-1">
                     <Type className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-300 font-bold uppercase mb-1">Teacher Script (AI Generated)</p>
                    <p className="text-sm font-medium leading-relaxed font-serif italic">
                      "{currentSlide.elements.find(e => e.type === 'script')?.content}"
                    </p>
                  </div>
                </div>
             </div>
          </div>

          <div className="mt-6 flex items-center gap-4 text-slate-500 text-sm">
             <span className="flex items-center gap-1"><Layout className="w-4 h-4" /> 16:9 沉浸式宽屏</span>
             <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
             <span className="flex items-center gap-1 text-blue-600 font-medium"><BrainCircuit className="w-4 h-4" /> 心理学引擎已优化</span>
          </div>
        </main>

        {/* RIGHT: Asset Manager (The "Element" breakdown) */}
        <aside className="w-96 bg-white border-l border-slate-200 flex flex-col z-10 shadow-lg shrink-0">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-blue-600" />
              元素解析与理论依据
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {currentSlide.elements.map((element) => (
              <div key={element.id} className="group relative">
                {/* Element Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {element.type === 'image' ? (
                      <div className="p-1 bg-purple-100 rounded text-purple-600"><ImageIcon className="w-3 h-3" /></div>
                    ) : element.type === 'script' ? (
                      <div className="p-1 bg-green-100 rounded text-green-600"><BookOpen className="w-3 h-3" /></div>
                    ) : (
                      <div className="p-1 bg-blue-100 rounded text-blue-600"><Type className="w-3 h-3" /></div>
                    )}
                    <span className="text-sm font-bold text-slate-700">{element.label}</span>
                  </div>
                </div>

                {/* Element Content Box */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-blue-300 transition-all">
                  
                  {/* Pedagogical Rationale (New Feature) */}
                  <div className="bg-amber-50 border-b border-amber-100 p-3 flex items-start gap-3">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-[10px] font-bold text-amber-700 uppercase tracking-wide mb-1">AI 理论依据 / Rationale</h4>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {element.rationale}
                      </p>
                    </div>
                  </div>

                  {/* Prompt Display */}
                  {(element.type === 'image' || element.type === 'script') && (
                    <div className="p-3 bg-slate-50 border-b border-slate-100">
                      <p className="text-xs text-slate-500 font-mono leading-relaxed break-words">
                        <span className="font-bold text-slate-400 select-none">PROMPT: </span>
                        {element.prompt || "Based on context analysis..."}
                      </p>
                    </div>
                  )}

                  {/* Preview Area */}
                  <div className="p-3">
                    {element.type === 'image' && (
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-200 mb-3 border border-slate-200">
                         {regeneratingId === element.id ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                               <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                            </div>
                         ) : (
                            <img src={element.content} alt="Asset" className="w-full h-full object-cover" />
                         )}
                      </div>
                    )}
                    
                    {element.type !== 'image' && (
                       <div className="text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-200 mb-3 italic">
                          "{element.content}"
                       </div>
                    )}

                    {/* Action Buttons */}
                    <button 
                      onClick={() => handleRegenerateAsset(currentSlide.id, element.id)}
                      disabled={regeneratingId !== null}
                      className="w-full py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 flex items-center justify-center gap-2 transition-all"
                    >
                      {regeneratingId === element.id ? (
                        <>调整中...</>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3" /> 
                          更换元素 (Regenerate)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}