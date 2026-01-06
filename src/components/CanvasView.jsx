import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { 
  BookOpen, 
  Clock, 
  Image as ImageIcon, 
  Type, 
  RefreshCw, 
  Video, 
  Music, 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  Plus, 
  Trash2, 
  Download, 
  MonitorPlay,
  Wand2,
  X,
  Upload,
  Layers,       
  ArrowUp,      
  ArrowDown,    
  ChevronsUp,   
  ChevronsDown, 
  Sliders,
  RotateCw
} from 'lucide-react';
import { INITIAL_COURSE_DATA } from '../constants';
import { SlideRenderer } from './SlideRenderer';
import { getAssetIcon } from '../utils';

export const CanvasView = forwardRef((props, ref) => {
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

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    openPreview: () => setIsPreviewOpen(true),
    exportPPT: () => {
      setIsExporting(true);
      setTimeout(() => {
        setIsExporting(false);
        alert("PPT 导出成功！");
      }, 2000);
    },
    isExporting
  }));

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
             {!isLeftOpen && (
               <>
                 <button 
                   onClick={() => setIsLeftOpen(true)} 
                   className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded transition-colors"
                   title="展开课程编排"
                 >
                   <ChevronRight className="w-4 h-4" />
                 </button>
                 <div className="font-bold text-slate-700 flex items-center gap-2 mr-4"><BookOpen className="w-4 h-4" /> <span className="text-xs">U1</span></div>
               </>
             )}
             <span className="text-sm font-medium text-slate-500 whitespace-nowrap">当前预览:</span>
             <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold whitespace-nowrap">{currentStep?.time}</span>
             <h2 className="text-sm font-bold text-slate-800 truncate" title={currentStep?.title}>{currentStep?.title}</h2>
          </div>
        </div>

        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur shadow-lg rounded-full px-4 py-2 flex gap-3 border border-slate-200 z-20 transition-all">
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
         {!isRightOpen && <button onClick={() => setIsRightOpen(true)} className="absolute top-4 right-0 bg-white p-2 rounded-l-md border border-r-0 border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 z-50 transform -translate-x-full" title="展开面板"><ChevronLeft className="w-4 h-4" /></button>}
         <div className={`flex flex-col h-full ${!isRightOpen && 'hidden'}`}>
             {selectedAsset ? (
                <>
                  <div className="p-4 border-b border-slate-100 bg-blue-50 flex items-center justify-between">
                     <div className="flex items-center gap-2">{getAssetIcon(selectedAsset.type)}<h3 className="font-bold text-blue-800">编辑元素</h3></div>
                     <div className="flex items-center gap-2">
                        <button onClick={() => setIsRightOpen(false)} className="text-slate-400 hover:text-slate-600" title="收起面板"><ChevronRight className="w-4 h-4" /></button>
                        <button onClick={() => setSelectedAssetId(null)} className="text-slate-500 hover:text-slate-700"><X className="w-4 h-4" /></button>
                     </div>
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
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                     <h3 className="font-bold text-slate-800 flex items-center gap-2"><Wand2 className="w-4 h-4 text-purple-600" />环节详情编辑</h3>
                     <button onClick={() => setIsRightOpen(false)} className="text-slate-400 hover:text-slate-600" title="收起面板"><ChevronRight className="w-4 h-4" /></button>
                  </div>
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
});
