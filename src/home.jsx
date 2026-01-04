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
  Download,     // Icon for Export
  MonitorPlay   // Icon for Presentation
} from 'lucide-react';

// --- Initial Data Loaded from Document ---
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

// --- Helper Functions (Moved to global scope) ---

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

// --- Reusable Component: Slide Renderer ---
// Shared logic for rendering the slide content in both Editor and Preview
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

export default function CourseEditor() {
  const [courseData, setCourseData] = useState(INITIAL_COURSE_DATA);
  const [activePhase, setActivePhase] = useState('engage');
  const [activeStepId, setActiveStepId] = useState('e1-1');
  const [expandedPhases, setExpandedPhases] = useState(['engage', 'empower', 'execute', 'elevate']);
  
  // UI State
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); // Preview Modal State
  const [isExporting, setIsExporting] = useState(false);     // Export Loading State
  
  // Selection State
  const [selectedAssetId, setSelectedAssetId] = useState(null);

  // Interaction State
  const [interactionMode, setInteractionMode] = useState('idle');
  const [interactionStart, setInteractionStart] = useState(null); 
  const canvasRef = useRef(null);

  // Derived State
  const currentPhaseData = courseData[activePhase];
  const currentStepIndex = currentPhaseData.steps.findIndex(s => s.id === activeStepId);
  const currentStep = currentPhaseData.steps[currentStepIndex] || currentPhaseData.steps[0];
  const selectedAsset = selectedAssetId ? currentStep.assets.find(a => a.id === selectedAssetId) : null;

  // Flatten steps for sequential navigation in preview
  const allSteps = Object.values(courseData).flatMap(phase => phase.steps.map(step => ({...step, phaseKey: Object.keys(courseData).find(k => courseData[k].steps.includes(step))})));
  const currentGlobalIndex = allSteps.findIndex(s => s.id === activeStepId);

  // --- Handlers ---

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
    step[field] = value;
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

  const handleLayerChange = (assetId, action) => {
    const newCourseData = { ...courseData };
    const step = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
    const currentAssets = [...step.assets];
    const index = currentAssets.findIndex(a => a.id === assetId);
    
    if (index === -1) return;

    if (action === 'front') {
        currentAssets.push(currentAssets.splice(index, 1)[0]);
    } else if (action === 'back') {
        currentAssets.unshift(currentAssets.splice(index, 1)[0]);
    } else if (action === 'forward') {
        if (index < currentAssets.length - 1) {
            [currentAssets[index], currentAssets[index + 1]] = [currentAssets[index + 1], currentAssets[index]];
        }
    } else if (action === 'backward') {
        if (index > 0) {
            [currentAssets[index], currentAssets[index - 1]] = [currentAssets[index - 1], currentAssets[index]];
        }
    }

    step.assets = currentAssets;
    setCourseData(newCourseData);
  };

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
      x: 100, 
      y: 100,
      width: w,
      height: h,
      rotation: 0
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
    if (selectedAssetId === assetId) {
      setSelectedAssetId(null);
    }
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

  // --- Export & Preview Logic ---
  const handleExportPPT = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert("PPT 导出成功！文件已生成至下载文件夹。");
    }, 2000);
  };

  const handleNavigatePreview = (direction) => {
    const newIndex = direction === 'next' ? currentGlobalIndex + 1 : currentGlobalIndex - 1;
    if (newIndex >= 0 && newIndex < allSteps.length) {
      const targetStep = allSteps[newIndex];
      // Keep phase sync
      if (targetStep.phaseKey) setActivePhase(targetStep.phaseKey);
      setActiveStepId(targetStep.id);
    }
  };

  // --- Canvas Interaction Logic (Drag, Resize, Rotate) ---

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
      startX: e.clientX,
      startY: e.clientY,
      initialX: asset.x,
      initialY: asset.y,
      initialW: asset.width || 300,
      initialH: asset.height || 200,
      initialRotation: asset.rotation || 0,
      handleType,
      rect 
    });
  };

  const handleMouseMove = (e) => {
    if (interactionMode === 'idle' || !interactionStart) return;
    
    const newCourseData = { ...courseData };
    const activeAsset = newCourseData[activePhase].steps
      .find(s => s.id === activeStepId).assets
      .find(a => a.id === selectedAssetId);

    if (!activeAsset) return;

    const deltaX = e.clientX - interactionStart.startX;
    const deltaY = e.clientY - interactionStart.startY;

    if (interactionMode === 'dragging') {
        activeAsset.x = interactionStart.initialX + deltaX;
        activeAsset.y = interactionStart.initialY + deltaY;
    } 
    else if (interactionMode === 'resizing') {
        const { handleType, initialW, initialH, initialX, initialY } = interactionStart;
        if (handleType === 'se') { 
            activeAsset.width = Math.max(50, initialW + deltaX);
            activeAsset.height = Math.max(50, initialH + deltaY);
        } else if (handleType === 'sw') { 
            activeAsset.width = Math.max(50, initialW - deltaX);
            activeAsset.x = initialX + deltaX;
            activeAsset.height = Math.max(50, initialH + deltaY);
        } else if (handleType === 'ne') { 
            activeAsset.width = Math.max(50, initialW + deltaX);
            activeAsset.height = Math.max(50, initialH - deltaY);
            activeAsset.y = initialY + deltaY;
        } else if (handleType === 'nw') {
            activeAsset.width = Math.max(50, initialW - deltaX);
            activeAsset.x = initialX + deltaX;
            activeAsset.height = Math.max(50, initialH - deltaY);
            activeAsset.y = initialY + deltaY;
        }
    } 
    else if (interactionMode === 'rotating') {
        const rect = interactionStart.rect;
        const centerX = rect.left + interactionStart.initialX + interactionStart.initialW / 2;
        const centerY = rect.top + interactionStart.initialY + interactionStart.initialH / 2;
        const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        let angleDeg = (angleRad * 180 / Math.PI) + 90;
        activeAsset.rotation = angleDeg;
    }

    setCourseData(newCourseData);
  };

  const handleMouseUp = () => {
    setInteractionMode('idle');
    setInteractionStart(null);
  };

  const handleCanvasClick = () => {
    setSelectedAssetId(null); 
  };


  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 font-sans overflow-hidden">
      
      {/* 1. LEFT SIDEBAR */}
      <aside 
        className={`${isLeftOpen ? 'w-64' : 'w-0'} bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 transition-all duration-300 relative`}
      >
        <div className={`p-4 border-b border-slate-100 bg-slate-50 ${!isLeftOpen && 'hidden'}`}>
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" /> 
              课程编排
            </h1>
            <button onClick={() => setIsLeftOpen(false)} className="text-slate-400 hover:text-slate-600">
               <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1 truncate">Unit 1: Funky Monster Rescue</p>
        </div>

        <div className={`flex-1 overflow-y-auto p-2 space-y-2 ${!isLeftOpen && 'hidden'}`}>
          {Object.entries(courseData).map(([key, phase]) => (
            <div key={key} className="rounded-lg overflow-hidden border border-slate-100 bg-white">
              <button 
                onClick={() => togglePhase(key)}
                className={`w-full flex items-center justify-between p-3 text-left font-bold text-sm transition-colors ${phase.color.replace('text-', 'bg-opacity-10 ')} hover:bg-opacity-20`}
              >
                <span className="flex items-center gap-2">
                   {expandedPhases.includes(key) ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                   {phase.title}
                </span>
              </button>

              {expandedPhases.includes(key) && (
                <div className="bg-slate-50 border-t border-slate-100">
                  {phase.steps.map((step) => (
                    <button
                      key={step.id}
                      onClick={() => handleStepClick(key, step.id)}
                      className={`w-full text-left p-2 pl-8 text-xs border-b border-slate-100 last:border-0 hover:bg-blue-50 transition-all flex items-start gap-2 ${
                        activeStepId === step.id 
                          ? 'bg-blue-100 text-blue-800 font-semibold border-l-4 border-l-blue-600' 
                          : 'text-slate-600'
                      }`}
                    >
                      <span className="shrink-0 mt-0.5"><FileText className="w-3 h-3" /></span>
                      <span className="line-clamp-2">{step.title}</span>
                    </button>
                  ))}
                  <button className="w-full text-center py-2 text-xs text-slate-400 hover:text-blue-500 flex items-center justify-center gap-1">
                    <Plus className="w-3 h-3" /> 新增环节
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {!isLeftOpen && (
           <button 
             onClick={() => setIsLeftOpen(true)}
             className="absolute top-4 left-0 bg-white p-2 rounded-r-md border border-l-0 border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 z-50"
             title="展开导航"
           >
              <ChevronRight className="w-4 h-4" />
           </button>
        )}
      </aside>

      {/* 2. MIDDLE SECTION: Canvas */}
      <main 
        className="flex-1 flex flex-col bg-slate-100 relative overflow-hidden transition-all duration-300"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center gap-4 min-w-0">
             {!isLeftOpen && (
                <div className="font-bold text-slate-700 flex items-center gap-2 mr-4">
                   <BookOpen className="w-4 h-4" /> <span className="text-xs">U1</span>
                </div>
             )}
             <span className="text-sm font-medium text-slate-500 whitespace-nowrap">当前预览:</span>
             <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold whitespace-nowrap">
               {currentStep.time}
             </span>
             <h2 className="text-sm font-bold text-slate-800 truncate" title={currentStep.title}>{currentStep.title}</h2>
          </div>
          <div className="flex gap-2">
            <button 
               onClick={() => setIsPreviewOpen(true)}
               className="px-3 py-2 hover:bg-slate-100 rounded text-slate-600 flex items-center gap-1 text-xs font-medium"
            >
               <MonitorPlay className="w-4 h-4" /> 单张预览
            </button>
            <div className="w-px h-6 bg-slate-300 my-auto mx-1"></div>
            <button 
               onClick={handleExportPPT}
               disabled={isExporting}
               className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded flex items-center gap-2 shadow-sm whitespace-nowrap disabled:bg-blue-400"
            >
               {isExporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
               {isExporting ? '导出中...' : '导出 PPT'}
            </button>
          </div>
        </div>

        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur shadow-lg rounded-full px-4 py-2 flex gap-3 border border-slate-200 z-20 transition-all hover:scale-105">
           <button onClick={() => handleAddAsset('text')} className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-blue-600 transition-colors">
              <Type className="w-5 h-5" />
              <span className="text-[9px] font-bold">文本</span>
           </button>
           <div className="w-px bg-slate-200 h-8"></div>
           <button onClick={() => handleAddAsset('image')} className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-purple-600 transition-colors">
              <ImageIcon className="w-5 h-5" />
              <span className="text-[9px] font-bold">图片</span>
           </button>
           <button onClick={() => handleAddAsset('audio')} className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-green-600 transition-colors">
              <Music className="w-5 h-5" />
              <span className="text-[9px] font-bold">音频</span>
           </button>
           <button onClick={() => handleAddAsset('video')} className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-red-600 transition-colors">
              <Video className="w-5 h-5" />
              <span className="text-[9px] font-bold">视频</span>
           </button>
        </div>

        <div className="flex-1 overflow-auto p-8 flex items-center justify-center relative" onClick={handleCanvasClick}>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px]"></div>
          
          <div 
             ref={canvasRef}
             className="w-[960px] h-[540px] bg-white shadow-2xl rounded-sm relative overflow-hidden ring-1 ring-slate-900/5 group transition-transform duration-200"
             onClick={(e) => e.stopPropagation()} 
          >
             <SlideRenderer 
                assets={currentStep.assets} 
                isEditable={true}
                onMouseDown={handleMouseDown}
                selectedAssetId={selectedAssetId}
             />
          </div>
        </div>
      </main>

      {/* 3. RIGHT SIDEBAR */}
      <aside 
        className={`${isRightOpen ? 'w-96' : 'w-0'} bg-white border-l border-slate-200 flex flex-col shrink-0 z-10 shadow-[0_0_15px_rgba(0,0,0,0.05)] transition-all duration-300 relative`}
      >
         {isRightOpen && (
           <button 
             onClick={() => setIsRightOpen(false)}
             className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 z-20"
             title="收起面板"
           >
              <ChevronRight className="w-4 h-4" />
           </button>
         )}

         {!isRightOpen && (
           <button 
             onClick={() => setIsRightOpen(true)}
             className="absolute top-4 right-0 bg-white p-2 rounded-l-md border border-r-0 border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 z-50 transform -translate-x-full"
             title="展开面板"
           >
              <ChevronLeft className="w-4 h-4" />
           </button>
         )}

         <div className={`flex flex-col h-full ${!isRightOpen && 'hidden'}`}>
             
             {selectedAsset ? (
                <>
                  <div className="p-4 border-b border-slate-100 bg-blue-50 flex items-center justify-between">
                     <div className="flex items-center gap-2 pl-6">
                        {getAssetIcon(selectedAsset.type)}
                        <h3 className="font-bold text-blue-800">编辑元素</h3>
                     </div>
                     <button onClick={() => setSelectedAssetId(null)} className="text-slate-500 hover:text-slate-700">
                        <X className="w-4 h-4" />
                     </button>
                  </div>

                  {/* Layer Control Bar */}
                  <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center justify-between">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Layers className="w-3 h-3" /> 图层
                     </span>
                     <div className="flex gap-1">
                        <button onClick={() => handleLayerChange(selectedAsset.id, 'front')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="置顶"><ChevronsUp className="w-4 h-4" /></button>
                        <button onClick={() => handleLayerChange(selectedAsset.id, 'forward')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="上移"><ArrowUp className="w-4 h-4" /></button>
                        <button onClick={() => handleLayerChange(selectedAsset.id, 'backward')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="下移"><ArrowDown className="w-4 h-4" /></button>
                        <button onClick={() => handleLayerChange(selectedAsset.id, 'back')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="置底"><ChevronsDown className="w-4 h-4" /></button>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 space-y-6">
                     
                     {/* Dimensions & Rotation Inputs */}
                     <div className="grid grid-cols-3 gap-2">
                        <div>
                           <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">宽 Width</label>
                           <div className="flex items-center border border-slate-200 rounded px-2 bg-slate-50">
                              <input 
                                 type="number" 
                                 value={Math.round(selectedAsset.width || 300)}
                                 onChange={(e) => handleAssetChange(selectedAsset.id, 'width', parseInt(e.target.value))}
                                 className="w-full text-xs bg-transparent py-1.5 outline-none"
                              />
                              <span className="text-[10px] text-slate-400">px</span>
                           </div>
                        </div>
                        <div>
                           <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">高 Height</label>
                           <div className="flex items-center border border-slate-200 rounded px-2 bg-slate-50">
                              <input 
                                 type="number" 
                                 value={Math.round(selectedAsset.height || 200)}
                                 onChange={(e) => handleAssetChange(selectedAsset.id, 'height', parseInt(e.target.value))}
                                 className="w-full text-xs bg-transparent py-1.5 outline-none"
                              />
                              <span className="text-[10px] text-slate-400">px</span>
                           </div>
                        </div>
                        <div>
                           <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">旋转 Rotate</label>
                           <div className="flex items-center border border-slate-200 rounded px-2 bg-slate-50">
                              <input 
                                 type="number" 
                                 value={Math.round(selectedAsset.rotation || 0)}
                                 onChange={(e) => handleAssetChange(selectedAsset.id, 'rotation', parseInt(e.target.value))}
                                 className="w-full text-xs bg-transparent py-1.5 outline-none"
                              />
                              <span className="text-[10px] text-slate-400">°</span>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div>
                           <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">标题 / Name</label>
                           <input 
                              type="text" 
                              value={selectedAsset.title}
                              onChange={(e) => handleAssetChange(selectedAsset.id, 'title', e.target.value)}
                              className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                           />
                        </div>

                        {selectedAsset.type === 'text' ? (
                           <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">文本内容 / Content</label>
                              <textarea 
                                 value={selectedAsset.content}
                                 onChange={(e) => handleAssetChange(selectedAsset.id, 'content', e.target.value)}
                                 className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                              />
                           </div>
                        ) : (
                           <>
                              {/* Reference Image Upload Section */}
                              {(selectedAsset.type === 'image' || selectedAsset.type === 'video') && (
                                 <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                       <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                          <Upload className="w-3 h-3" /> 参考图片 (可选)
                                       </label>
                                       <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">Optional</span>
                                    </div>
                                    
                                    {!selectedAsset.referenceImage ? (
                                       <div className="border border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative group/upload">
                                          <input 
                                             type="file" 
                                             accept="image/*" 
                                             className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                             onChange={(e) => handleReferenceUpload(e, selectedAsset.id)}
                                          />
                                          <div className="p-2 bg-white rounded-full shadow-sm mb-2 group-hover/upload:scale-110 transition-transform">
                                             <Upload className="w-5 h-5 text-slate-400" />
                                          </div>
                                          <span className="text-xs text-slate-500 font-medium">点击上传参考图片</span>
                                          <span className="text-[10px] text-slate-400 mt-1">仅用于风格辅助，非必传</span>
                                       </div>
                                    ) : (
                                       <div className="space-y-2">
                                          <div className="relative group/ref">
                                             <img src={selectedAsset.referenceImage} alt="Reference" className="w-full h-32 object-cover rounded border border-slate-200 opacity-90" />
                                             <div className="absolute inset-0 bg-black/0 group-hover/ref:bg-black/10 transition-colors rounded"></div>
                                             <button 
                                                onClick={() => handleAssetChange(selectedAsset.id, 'referenceImage', null)}
                                                className="absolute top-2 right-2 bg-white text-slate-600 hover:text-red-500 p-1.5 rounded-full shadow-sm opacity-0 group-hover/ref:opacity-100 transition-opacity"
                                                title="移除参考图"
                                             >
                                                <X className="w-3.5 h-3.5" />
                                             </button>
                                          </div>
                                          
                                          {/* Simulated Weight Slider */}
                                          <div className="flex items-center gap-2">
                                             <Sliders className="w-3 h-3 text-slate-400" />
                                             <div className="flex-1 h-1 bg-slate-200 rounded overflow-hidden">
                                                <div className="w-1/3 h-full bg-blue-400"></div>
                                             </div>
                                             <span className="text-[10px] text-slate-400">参考权重: 低</span>
                                          </div>
                                       </div>
                                    )}
                                 </div>
                              )}

                              {/* Prompt Section */}
                              <div>
                                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-2">
                                    <Wand2 className="w-3 h-3 text-purple-500" /> 
                                    AI 生成提示词 / Prompt
                                 </label>
                                 <textarea 
                                    value={selectedAsset.prompt}
                                    onChange={(e) => handleAssetChange(selectedAsset.id, 'prompt', e.target.value)}
                                    placeholder="描述你想要生成的画面..."
                                    className="w-full text-sm border border-purple-200 bg-purple-50 rounded px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none h-24 resize-none mb-2"
                                 />
                                 <button 
                                    onClick={() => handleRegenerateAsset(selectedAsset.id)}
                                    className="w-full py-2 bg-purple-600 text-white rounded text-sm font-bold shadow hover:bg-purple-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                 >
                                    <RefreshCw className="w-4 h-4" /> 
                                    {selectedAsset.referenceImage ? '参考图 + 文本生成' : '立即生成'}
                                 </button>
                              </div>
                           </>
                        )}
                     </div>

                     <div className="pt-6 mt-6 border-t border-slate-100">
                        <button 
                           onClick={() => handleDeleteAsset(selectedAsset.id)}
                           className="w-full py-2 text-red-500 border border-red-200 rounded text-sm font-bold hover:bg-red-50 flex items-center justify-center gap-2"
                        >
                           <Trash2 className="w-4 h-4" /> 删除此元素
                        </button>
                     </div>
                  </div>
                </>
             ) : (
                /* --- DEFAULT VIEW --- */
                <>
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                     <h3 className="font-bold text-slate-800 flex items-center gap-2 pl-6">
                        <Wand2 className="w-4 h-4 text-purple-600" />
                        环节详情编辑
                     </h3>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-5 space-y-6">
                     <div className="space-y-4">
                        <div>
                           <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">时间 / Time</label>
                           <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-slate-400" />
                              <input 
                                 type="text" 
                                 value={currentStep.time}
                                 onChange={(e) => handleInputChange('time', e.target.value)}
                                 className="flex-1 text-sm border border-slate-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none" 
                              />
                           </div>
                        </div>

                        <div>
                           <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">教学环节 / Step Title</label>
                           <input 
                              type="text" 
                              value={currentStep.title}
                              onChange={(e) => handleInputChange('title', e.target.value)}
                              className="w-full text-sm font-bold border border-slate-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none" 
                           />
                        </div>

                        <div>
                           <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">教学目标 / Objectives</label>
                           <textarea 
                              value={currentStep.objective}
                              onChange={(e) => handleInputChange('objective', e.target.value)}
                              className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-16 bg-slate-50" 
                           />
                        </div>
                     </div>

                     <hr className="border-slate-100" />

                     <div className="space-y-3">
                        <div className="flex items-center justify-between">
                           <label className="text-xs font-bold text-slate-500 uppercase">本页素材 ({currentStep.assets.length})</label>
                           <div className="flex gap-1">
                              <button onClick={() => handleAddAsset('image')} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-purple-600"><Plus className="w-4 h-4" /></button>
                           </div>
                        </div>

                        <div className="space-y-2">
                           {currentStep.assets.map((asset, idx) => (
                              <div 
                                 key={asset.id} 
                                 onClick={() => setSelectedAssetId(asset.id)}
                                 className="flex items-start gap-2 p-2 border border-slate-200 rounded bg-white hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all group"
                              >
                                 <div className="mt-1 text-slate-400">
                                    {getAssetIcon(asset.type)}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-slate-700 truncate">{asset.title}</div>
                                    <div className="text-[10px] text-slate-400">{asset.type} • 点击编辑</div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
                </>
             )}
         </div>
      </aside>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
           {/* Preview Toolbar */}
           <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
              <div className="text-white font-bold">{currentStep.title}</div>
              <div className="flex gap-4">
                 <button onClick={() => handleNavigatePreview('prev')} disabled={currentGlobalIndex <= 0} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 disabled:opacity-50 text-white">
                    <ChevronLeft className="w-5 h-5" />
                 </button>
                 <button onClick={() => handleNavigatePreview('next')} disabled={currentGlobalIndex >= allSteps.length - 1} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 disabled:opacity-50 text-white">
                    <ChevronRight className="w-5 h-5" />
                 </button>
                 <button onClick={() => setIsPreviewOpen(false)} className="p-2 bg-red-900/50 hover:bg-red-700 text-white rounded-full ml-4">
                    <X className="w-5 h-5" />
                 </button>
              </div>
           </div>
           
           {/* Preview Canvas */}
           <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative">
              {/* Scale container to fit screen roughly */}
              <div style={{ width: 960, height: 540, transform: 'scale(1.2)' }} className="relative bg-white shadow-2xl overflow-hidden">
                 <SlideRenderer assets={currentStep.assets} isEditable={false} />
              </div>
           </div>
        </div>
      )}
    </div>
  );
}