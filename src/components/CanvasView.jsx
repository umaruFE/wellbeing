import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
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
  RotateCw,
  Copy,
  RotateCcw,
  History,
  Undo2,
  Redo2
} from 'lucide-react';
import { INITIAL_COURSE_DATA } from '../constants';
import { SlideRenderer } from './SlideRenderer';
import { getAssetIcon } from '../utils';
import { PromptInputModal } from './PromptInputModal';
import { AssetEditorPanel } from './AssetEditorPanel';

export const CanvasView = forwardRef((props, ref) => {
  const { navigation } = props;
  const [courseData, setCourseData] = useState(INITIAL_COURSE_DATA);
  const [activePhase, setActivePhase] = useState(Object.keys(INITIAL_COURSE_DATA)[0]);
  const [activeStepId, setActiveStepId] = useState(INITIAL_COURSE_DATA[Object.keys(INITIAL_COURSE_DATA)[0]]?.steps[0]?.id);
  const [expandedPhases, setExpandedPhases] = useState(Object.keys(INITIAL_COURSE_DATA));
  
  // UI State
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false); 
  const [isExporting, setIsExporting] = useState(false);     
  
  // Selection State
  const [selectedAssetId, setSelectedAssetId] = useState(null);

  // Text Editing State
  const [editingTextAssetId, setEditingTextAssetId] = useState(null);
  const [editingTextContent, setEditingTextContent] = useState('');

  // Interaction State
  const [interactionMode, setInteractionMode] = useState('idle');
  const [interactionStart, setInteractionStart] = useState(null); 
  const canvasRef = useRef(null);

  // 撤销/重做功能
  const [history, setHistory] = useState([JSON.parse(JSON.stringify(INITIAL_COURSE_DATA))]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // 当navigation变化时，重置数据：统一使用INITIAL_COURSE_DATA（与表格视图一致）
  useEffect(() => {
    if (!navigation) {
      // 直接点击进入：使用INITIAL_COURSE_DATA（与表格视图一致）
      setCourseData(INITIAL_COURSE_DATA);
      const firstPhase = Object.keys(INITIAL_COURSE_DATA)[0];
      const firstStepId = INITIAL_COURSE_DATA[firstPhase]?.steps[0]?.id;
      setActivePhase(firstPhase);
      setActiveStepId(firstStepId);
      setExpandedPhases(Object.keys(INITIAL_COURSE_DATA));
      setSelectedAssetId(null);
      setGenerationHistory([]);
      setShowHistoryModal(null);
      setShowPromptModal(false);
      setPromptModalConfig({ type: null, assetType: null, phaseKey: null, addAtEnd: false });
      setHistory([JSON.parse(JSON.stringify(INITIAL_COURSE_DATA))]);
      setHistoryIndex(0);
    } else {
      // 从表格跳转：使用INITIAL_COURSE_DATA（与表格数据一致）
      setCourseData(INITIAL_COURSE_DATA);
      // 映射表格的phaseId到画布的phaseKey
      const phaseMap = {
        'Engage': 'engage',
        'Empower': 'empower',
        'Execute': 'execute',
        'Elevate': 'elevate'
      };
      const phaseKey = phaseMap[navigation.phaseId] || 'engage';
      // 确保 stepId 是字符串类型，与数据中的 ID 类型一致
      const stepId = navigation.slideId ? String(navigation.slideId) : null;
      // 确保对应的环节是展开的
      setExpandedPhases(Object.keys(INITIAL_COURSE_DATA));
      setActivePhase(phaseKey);
      if (stepId) {
        setActiveStepId(stepId);
      } else {
        const firstStepId = INITIAL_COURSE_DATA[phaseKey]?.steps[0]?.id;
        if (firstStepId) setActiveStepId(String(firstStepId));
      }
      setSelectedAssetId(null);
      setHistory([JSON.parse(JSON.stringify(INITIAL_COURSE_DATA))]);
      setHistoryIndex(0);
    }
  }, [navigation]);

  // 提示词输入模态框状态
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptModalConfig, setPromptModalConfig] = useState({ type: null, assetType: null, phaseKey: null, addAtEnd: false });
  const [isGenerating, setIsGenerating] = useState(false);

  // 历史生成记录
  const [generationHistory, setGenerationHistory] = useState([]); // [{ phaseId, stepId, assetId, type, url, prompt, timestamp }]
  const [showHistoryModal, setShowHistoryModal] = useState(null); // { assetId, assetType }
  
  // 页面历史记录（整个环节的内容）
  const [pageHistory, setPageHistory] = useState([]); // [{ stepId, data: { title, time, objective, assets }, timestamp }]
  const [showPageHistoryModal, setShowPageHistoryModal] = useState(false);

  // 保存历史记录
  const saveToHistory = (newData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newData)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // 撤销
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCourseData(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };

  // 重做
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCourseData(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z 撤销
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Ctrl+Shift+Z 或 Ctrl+Y 重做
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
      // Delete 或 Backspace 删除选中的元素
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAssetId && !e.target.tagName.match(/INPUT|TEXTAREA/)) {
        e.preventDefault();
        handleDeleteAsset(selectedAssetId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAssetId, historyIndex, history]);

  // 处理导航（从表格视图跳转过来）
  useEffect(() => {
    if (navigation) {
      // 这里可以根据navigation信息跳转到对应的环节
      // 简化处理：如果有navigation，可以高亮显示或跳转
      console.log('Navigation received:', navigation);
    }
  }, [navigation]);

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

  const handleAddStep = (phaseKey) => {
    // 显示提示词输入模态框
    setPromptModalConfig({ type: 'session', phaseKey });
    setShowPromptModal(true);
  };

  // 在当前环节末尾添加新环节
  const handleAddStepAtEnd = () => {
    if (!activePhase) {
      alert('请先选择一个环节');
      return;
    }
    // 显示提示词输入模态框，添加在当前环节所在阶段的末尾
    setPromptModalConfig({ type: 'session', phaseKey: activePhase, addAtEnd: true });
    setShowPromptModal(true);
  };

  const handleConfirmAddStep = (prompt) => {
    setIsGenerating(true);
    const phaseKey = promptModalConfig.phaseKey;
    
    // 模拟AI生成（实际应该调用API）
    setTimeout(() => {
      const newCourseData = { ...courseData };
      const phase = newCourseData[phaseKey];
      if (!phase) return;
      
      const generatedTitle = prompt ? `AI生成：${prompt.substring(0, 20)}...` : '新环节';
      const generatedObjective = prompt ? `根据提示词"${prompt}"生成的教学目标` : '';
      
      const newStep = {
        id: `${phaseKey}-${Date.now()}`,
        title: generatedTitle,
        time: '00:00',
        objective: generatedObjective,
        assets: []
      };
      
      // 如果是addAtEnd，添加到当前环节之后；否则添加到末尾
      if (promptModalConfig.addAtEnd && activeStepId) {
        const currentIndex = phase.steps.findIndex(s => s.id === activeStepId);
        if (currentIndex >= 0) {
          phase.steps.splice(currentIndex + 1, 0, newStep);
        } else {
          phase.steps.push(newStep);
        }
      } else {
        phase.steps.push(newStep);
      }
      
      setCourseData(newCourseData);
      saveToHistory(newCourseData);
      setActivePhase(phaseKey);
      setActiveStepId(newStep.id);
      setSelectedAssetId(null);
      setIsGenerating(false);
      setShowPromptModal(false);
      setPromptModalConfig({ type: null, assetType: null, phaseKey: null, addAtEnd: false });
    }, 1500);
  };

  const handleDeleteStep = (phaseKey, stepId) => {
    if (!confirm('确定要删除这个环节吗？此操作无法撤销。')) {
      return;
    }
    
    const newCourseData = { ...courseData };
    const phase = newCourseData[phaseKey];
    if (!phase) return;
    
    phase.steps = phase.steps.filter(s => s.id !== stepId);
    
    // 如果删除的是当前环节，切换到第一个环节
    if (activeStepId === stepId) {
      if (phase.steps.length > 0) {
        setActiveStepId(phase.steps[0].id);
      } else {
        // 如果这个阶段没有环节了，切换到其他阶段
        const otherPhase = Object.entries(newCourseData).find(([key, p]) => 
          key !== phaseKey && p.steps.length > 0
        );
        if (otherPhase) {
          setActivePhase(otherPhase[0]);
          setActiveStepId(otherPhase[1].steps[0].id);
        }
      }
    }
    
    setCourseData(newCourseData);
    saveToHistory(newCourseData);
    setSelectedAssetId(null);
  };

  const handleInputChange = (field, value) => {
    const newCourseData = { ...courseData };
    const step = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
    if(step) step[field] = value;
    setCourseData(newCourseData);
    saveToHistory(newCourseData);
  };

  const handleAssetChange = (assetId, field, value) => {
    const newCourseData = { ...courseData };
    const step = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
    const asset = step.assets.find(a => a.id === assetId);
    if (asset) {
      asset[field] = value;
      setCourseData(newCourseData);
      saveToHistory(newCourseData);
    }
  };

  const handleAddAsset = (type) => {
    // 显示提示词输入模态框
    setPromptModalConfig({ type: 'element', assetType: type, phaseKey: activePhase });
    setShowPromptModal(true);
  };

  const handleConfirmAddAsset = (prompt, inputMode = 'ai') => {
    const type = promptModalConfig.assetType;
    const step = courseData[activePhase].steps.find(s => s.id === activeStepId);
    if (!step) return;

    // 如果是文本类型且是直接输入模式，不需要生成时间，直接添加
    if (type === 'text' && inputMode === 'direct') {
      const newCourseData = { ...courseData };
      const currentStep = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
      
      let w = 300, h = 100;

      const newAsset = {
        id: Date.now().toString(),
        type,
        title: '文本',
        url: '',
        content: prompt || '双击编辑文本',
        prompt: '',
        referenceImage: null,
        x: 100, y: 100, width: w, height: h, rotation: 0,
        fontSize: 24,
        fontWeight: 'normal',
        color: '#1e293b',
        textAlign: 'center'
      };
      
      currentStep.assets.push(newAsset);
      setCourseData(newCourseData);
      saveToHistory(newCourseData);
      setSelectedAssetId(newAsset.id); 
      setIsRightOpen(true);
      setShowPromptModal(false);
      setPromptModalConfig({ type: null, assetType: null, phaseKey: null });
      return;
    }

    // AI生成模式
    setIsGenerating(true);

    // 模拟AI生成（实际应该调用API）
    setTimeout(() => {
      const newCourseData = { ...courseData };
      const currentStep = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
      
      let w = 300, h = 200;
      if (type === 'audio') { w = 300; h = 100; }
      if (type === 'text') { w = 300; h = 100; }

      const generatedTitle = prompt ? `AI生成：${prompt.substring(0, 15)}...` : `New ${type}`;
      const generatedUrl = type === 'text' 
        ? '' 
        : `https://placehold.co/${w}x${h}/${Math.floor(Math.random()*16777215).toString(16)}/FFF?text=AI+Gen+${Date.now().toString().slice(-4)}`;

      const newAsset = {
        id: Date.now().toString(),
        type,
        title: generatedTitle,
        url: generatedUrl,
        content: type === 'text' ? (prompt ? `根据提示词"${prompt}"生成的文本内容` : '双击编辑文本') : '',
        prompt: prompt || 'Describe what you want AI to generate...',
        referenceImage: null,
        x: 100, y: 100, width: w, height: h, rotation: 0
      };
      
      // 如果是文本类型，添加文本相关属性
      if (type === 'text') {
        newAsset.fontSize = 24;
        newAsset.fontWeight = 'normal';
        newAsset.color = '#1e293b';
        newAsset.textAlign = 'center';
      }
      
      currentStep.assets.push(newAsset);
      setCourseData(newCourseData);
      saveToHistory(newCourseData);
      setSelectedAssetId(newAsset.id); 
      setIsRightOpen(true);
      setIsGenerating(false);
      setShowPromptModal(false);
      setPromptModalConfig({ type: null, assetType: null, phaseKey: null });
    }, 1500);
  };

  const handleDeleteAsset = (assetId) => {
    const newCourseData = { ...courseData };
    const step = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
    step.assets = step.assets.filter(a => a.id !== assetId);
    setCourseData(newCourseData);
    saveToHistory(newCourseData);
    setSelectedAssetId(null);
  };

  // 复制元素
  const handleCopyAsset = (assetId) => {
    const step = courseData[activePhase].steps.find(s => s.id === activeStepId);
    const assetToCopy = step.assets.find(a => a.id === assetId);
    if (!assetToCopy) return;

    const newCourseData = { ...courseData };
    const currentStep = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
    const newAsset = {
      ...JSON.parse(JSON.stringify(assetToCopy)),
      id: Date.now().toString(),
      x: assetToCopy.x + 20,
      y: assetToCopy.y + 20,
      title: assetToCopy.title + ' (副本)'
    };
    currentStep.assets.push(newAsset);
    setCourseData(newCourseData);
    saveToHistory(newCourseData);
    setSelectedAssetId(newAsset.id);
  };

  // 复制整个页面
  const handleCopyPage = () => {
    const newCourseData = { ...courseData };
    const phase = newCourseData[activePhase];
    const currentStep = phase.steps.find(s => s.id === activeStepId);
    if (!currentStep) return;

    const newStep = {
      ...JSON.parse(JSON.stringify(currentStep)),
      id: `${activePhase}-${Date.now()}`,
      title: currentStep.title + ' (副本)',
      assets: currentStep.assets.map(asset => ({
        ...JSON.parse(JSON.stringify(asset)),
        id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x: asset.x + 20,
        y: asset.y + 20
      }))
    };
    phase.steps.push(newStep);
    setCourseData(newCourseData);
    saveToHistory(newCourseData);
    setActiveStepId(newStep.id);
  };

  // 保存生成历史
  const saveGenerationHistory = (assetId, assetType, url, prompt) => {
    const historyItem = {
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      phaseId: activePhase,
      stepId: activeStepId,
      assetId,
      type: assetType,
      url,
      prompt: prompt || '',
      timestamp: new Date().toISOString(),
      displayTime: new Date().toLocaleString('zh-CN')
    };
    setGenerationHistory(prev => [historyItem, ...prev].slice(0, 100)); // 最多保存100条
  };

  // 恢复历史生成内容
  const handleRestoreHistory = (historyItem) => {
    const newCourseData = { ...courseData };
    const step = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
    const asset = step.assets.find(a => a.id === historyItem.assetId);
    if (asset && (asset.type === 'image' || asset.type === 'video' || asset.type === 'audio')) {
      asset.url = historyItem.url;
      if (historyItem.prompt) {
        asset.prompt = historyItem.prompt;
      }
      setCourseData(newCourseData);
      saveToHistory(newCourseData);
    }
    setShowHistoryModal(null);
  };

  const [generatingAssetId, setGeneratingAssetId] = useState(null);

  const handleRegenerateAsset = (assetId) => {
    const step = courseData[activePhase].steps.find(s => s.id === activeStepId);
    const asset = step?.assets.find(a => a.id === assetId);
    if (!asset) return;
    
    // 保存当前内容到历史
    if (asset.type === 'text' && asset.content) {
      saveGenerationHistory(assetId, asset.type, asset.content, asset.prompt);
    } else if ((asset.type === 'image' || asset.type === 'video' || asset.type === 'audio') && asset.url) {
      saveGenerationHistory(assetId, asset.type, asset.url, asset.prompt);
    }
    
    setGeneratingAssetId(assetId);
    
    setTimeout(() => {
      const newCourseData = { ...courseData };
      const step = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
      const asset = step.assets.find(a => a.id === assetId);
      const randomColor = Math.floor(Math.random()*16777215).toString(16);
      
      if (asset.type === 'text') {
        const generatedText = asset.prompt 
          ? `根据提示词"${asset.prompt}"重新生成的文本内容 (v${Date.now().toString().slice(-4)})`
          : `重新生成的文本内容 (v${Date.now().toString().slice(-4)})`;
        asset.content = generatedText;
      } else if (asset.type === 'image' || asset.type === 'video') {
         const text = asset.referenceImage ? 'AI+Ref+Gen' : 'AI+Gen';
         const w = asset.width || 300;
         const h = asset.height || 200;
         asset.url = `https://placehold.co/${Math.round(w)}x${Math.round(h)}/${randomColor}/FFF?text=${text}+v${Math.floor(Math.random() * 10)}`;
      } else if (asset.type === 'audio') {
         asset.url = `https://placehold.co/300x100/${randomColor}/FFF?text=AI+Audio+v${Math.floor(Math.random() * 10)}`;
      }
      setCourseData(newCourseData);
      saveToHistory(newCourseData);
      setGeneratingAssetId(null);
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
    saveToHistory(newCourseData);
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
          saveToHistory(newCourseData);
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

  const handleMouseUp = () => { 
    if (interactionMode !== 'idle' && selectedAssetId) {
      // 在拖拽/调整大小/旋转结束时保存历史
      saveToHistory(courseData);
    }
    setInteractionMode('idle'); 
    setInteractionStart(null); 
  };
  const handleCanvasClick = () => { 
    // 如果正在编辑文本，保存并退出编辑模式
    if (editingTextAssetId) {
      const asset = currentStep?.assets?.find(a => a.id === editingTextAssetId);
      if (asset && editingTextContent !== undefined) {
        handleAssetChange(editingTextAssetId, 'content', editingTextContent);
      }
      setEditingTextAssetId(null);
      setEditingTextContent('');
    }
    setSelectedAssetId(null); 
  };

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
                    <div key={step.id} className={`group/step border-b border-slate-100 last:border-0 hover:bg-blue-50 transition-all flex items-center ${activeStepId === step.id ? 'bg-blue-100' : ''}`}>
                      <button 
                        onClick={() => handleStepClick(key, step.id)} 
                        className={`flex-1 text-left p-2 pl-8 text-xs transition-all flex items-start gap-2 ${activeStepId === step.id ? 'text-blue-800 font-semibold border-l-4 border-l-blue-600' : 'text-slate-600'}`}
                      >
                        <span className="shrink-0 mt-0.5"><FileText className="w-3 h-3" /></span><span className="line-clamp-2">{step.title}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStep(key, step.id);
                        }}
                        className="p-2 mr-2 opacity-0 group-hover/step:opacity-100 hover:bg-red-100 rounded text-red-500 transition-all shrink-0"
                        title="删除环节"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => handleAddStep(key)}
                    className="w-full text-center py-2 text-xs text-slate-400 hover:text-blue-500 flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> 新增环节
                  </button>
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
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="向后回滚 (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
              className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="向前回滚 (Ctrl+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
            <div className="text-xs text-slate-400 px-2">
              {historyIndex + 1} / {history.length}
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <button
              onClick={handleCopyPage}
              className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
              title="复制整个页面"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div style={{left: '65%'}}className="absolute top-20 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur shadow-lg rounded-full px-4 py-2 flex gap-3 border border-slate-200 z-20 transition-all">
           <button onClick={() => handleAddAsset('text')} className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-blue-600 transition-colors"><Type className="w-5 h-5" /><span className="text-[9px] font-bold">文本</span></button>
           <div className="w-px bg-slate-200 h-8"></div>
           <button onClick={() => handleAddAsset('image')} className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-purple-600 transition-colors"><ImageIcon className="w-5 h-5" /><span className="text-[9px] font-bold">图片</span></button>
           <button onClick={() => handleAddAsset('audio')} className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-green-600 transition-colors"><Music className="w-5 h-5" /><span className="text-[9px] font-bold">音频</span></button>
           <button onClick={() => handleAddAsset('video')} className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-red-600 transition-colors"><Video className="w-5 h-5" /><span className="text-[9px] font-bold">视频</span></button>
        </div>

        <div className="flex-1 overflow-auto p-8 flex items-center justify-center relative" onClick={handleCanvasClick}>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px]"></div>
          <div ref={canvasRef} className="w-[960px] h-[540px] bg-white shadow-2xl rounded-sm relative overflow-hidden ring-1 ring-slate-900/5 group transition-transform duration-200" onClick={(e) => e.stopPropagation()}>
             <SlideRenderer 
               assets={currentStep?.assets || []} 
               isEditable={true} 
               onMouseDown={handleMouseDown} 
               selectedAssetId={selectedAssetId}
               onCopyAsset={handleCopyAsset}
               onDeleteAsset={handleDeleteAsset}
               onAssetChange={handleAssetChange}
               editingTextAssetId={editingTextAssetId}
               onEditingTextAssetIdChange={setEditingTextAssetId}
               editingTextContent={editingTextContent}
               onEditingTextContentChange={setEditingTextContent}
             />
          </div>
          
          {/* 在末尾新增PPT按钮 - 只在有选中环节时显示 */}
          {activeStepId && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30"
                style={{left: '58%'}}>
              <button
                onClick={handleAddStepAtEnd}
                className="px-6 py-3 bg-white border-2 border-indigo-300 text-indigo-600 rounded-full shadow-lg hover:bg-indigo-50 hover:border-indigo-400 transition-all flex items-center gap-2 font-bold text-sm"
                title="在当前环节末尾添加新PPT页面"
              >
                <Plus className="w-5 h-5" />
                在末尾新增PPT
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 3. RIGHT SIDEBAR */}
      <aside className={`${isRightOpen ? 'w-96' : 'w-0'} bg-white border-l border-slate-200 flex flex-col shrink-0 z-10 shadow-[0_0_15px_rgba(0,0,0,0.05)] transition-all duration-300 relative`}>
         {!isRightOpen && <button onClick={() => setIsRightOpen(true)} className="absolute top-4 right-0 bg-white p-2 rounded-l-md border border-r-0 border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 z-50 transform -translate-x-full" title="展开面板"><ChevronLeft className="w-4 h-4" /></button>}
         <div className={`flex flex-col h-full ${!isRightOpen && 'hidden'}`}>
             {selectedAsset ? (
                <AssetEditorPanel
                  selectedAsset={selectedAsset}
                  onClose={() => setSelectedAssetId(null)}
                  onAssetChange={handleAssetChange}
                  onLayerChange={handleLayerChange}
                  onCopyAsset={handleCopyAsset}
                  onDeleteAsset={handleDeleteAsset}
                  onShowHistoryModal={setShowHistoryModal}
                  onRegenerateAsset={handleRegenerateAsset}
                  generatingAssetId={generatingAssetId}
                  onReferenceUpload={handleReferenceUpload}
                  isRightOpen={isRightOpen}
                  onToggleRightOpen={() => setIsRightOpen(false)}
                />
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
                     <div className="pt-6 mt-6 border-t border-slate-100 flex gap-2">
                        <button 
                          onClick={() => {
                            // 保存当前页面内容到历史
                            if (currentStep) {
                              const historyItem = {
                                id: `page-history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                stepId: activeStepId,
                                data: JSON.parse(JSON.stringify({
                                  title: currentStep.title,
                                  time: currentStep.time,
                                  objective: currentStep.objective,
                                  assets: currentStep.assets || []
                                })),
                                timestamp: new Date().toISOString(),
                                displayTime: new Date().toLocaleString('zh-CN')
                              };
                              setPageHistory(prev => [historyItem, ...prev].slice(0, 50)); // 最多保存50条
                              setShowPageHistoryModal(true);
                            }
                          }}
                          className="flex-1 py-2 bg-slate-100 text-slate-600 rounded text-sm font-bold hover:bg-slate-200 flex items-center justify-center gap-2 transition-all"
                        >
                          <History className="w-4 h-4" />
                          历史生成
                        </button>
                        <button 
                          onClick={() => {
                            // 重新生成整个页面（保存当前版本到历史，然后可以重新生成）
                            if (currentStep) {
                              const historyItem = {
                                id: `page-history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                stepId: activeStepId,
                                data: JSON.parse(JSON.stringify({
                                  title: currentStep.title,
                                  time: currentStep.time,
                                  objective: currentStep.objective,
                                  assets: currentStep.assets || []
                                })),
                                timestamp: new Date().toISOString(),
                                displayTime: new Date().toLocaleString('zh-CN')
                              };
                              setPageHistory(prev => [historyItem, ...prev].slice(0, 50));
                              // 这里可以触发AI重新生成，暂时只是保存历史
                              alert('已保存当前版本到历史记录，可以点击"历史生成"查看和恢复');
                            }
                          }}
                          className="flex-1 py-2 bg-purple-600 text-white rounded text-sm font-bold shadow hover:bg-purple-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                          <RefreshCw className="w-4 h-4" />
                          重新生成
                        </button>
                     </div>
                  </div>
                </>
             )}
         </div>
      </aside>

      {/* Prompt Input Modal */}
      <PromptInputModal
        isOpen={showPromptModal}
        onClose={() => {
          setShowPromptModal(false);
          setPromptModalConfig({ type: null, assetType: null, phaseKey: null, addAtEnd: false });
        }}
        onConfirm={(prompt, inputMode) => {
          if (promptModalConfig.type === 'element') {
            handleConfirmAddAsset(prompt, inputMode);
          } else {
            handleConfirmAddStep(prompt);
          }
        }}
        title={promptModalConfig.type === 'element' 
          ? `添加${promptModalConfig.assetType === 'image' ? '图片' : promptModalConfig.assetType === 'video' ? '视频' : promptModalConfig.assetType === 'audio' ? '音频' : '文本'}元素`
          : promptModalConfig.addAtEnd
          ? '在末尾新增PPT'
          : '添加教学环节'}
        description={promptModalConfig.type === 'element'
          ? promptModalConfig.assetType === 'text'
            ? '选择直接输入文本内容或使用AI生成文本'
            : '请输入AI生成提示词，描述你想要创建的元素（可选，留空将使用默认生成）'
          : '请输入AI生成提示词，描述你想要创建的教学环节（可选，留空将使用默认标题）'}
        placeholder={promptModalConfig.type === 'element'
          ? `例如：${promptModalConfig.assetType === 'image' ? '生成一张关于动物的图片' : promptModalConfig.assetType === 'video' ? '生成一个教学视频' : promptModalConfig.assetType === 'audio' ? '生成背景音乐' : '输入文本内容或AI生成提示词'}...`
          : '例如：设计一个互动游戏环节，让学生学习颜色词汇...'}
        type={promptModalConfig.type}
        assetType={promptModalConfig.assetType}
        isLoading={isGenerating}
      />

      {/* 历史生成列表模态框 */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">
                    历史生成列表 - {showHistoryModal.assetType === 'image' ? '图片' : showHistoryModal.assetType === 'video' ? '视频' : showHistoryModal.assetType === 'text' ? '文本' : showHistoryModal.assetType === 'audio' ? '音频' : ''}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setShowHistoryModal(null)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {generationHistory
                .filter(h => 
                  h.phaseId === activePhase && 
                  h.stepId === activeStepId && 
                  h.assetId === showHistoryModal.assetId &&
                  h.type === showHistoryModal.assetType
                )
                .length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无历史生成记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {generationHistory
                    .filter(h => 
                      h.phaseId === activePhase && 
                      h.stepId === activeStepId && 
                      h.assetId === showHistoryModal.assetId &&
                      h.type === showHistoryModal.assetType
                    )
                    .map((historyItem) => (
                      <div 
                        key={historyItem.id} 
                        className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-slate-500">
                                {historyItem.displayTime}
                              </span>
                            </div>
                            {historyItem.type === 'image' || historyItem.type === 'video' ? (
                              <img 
                                src={historyItem.url} 
                                alt="历史生成" 
                                className="w-full h-32 object-cover rounded border border-slate-200 mb-2"
                              />
                            ) : (
                              <div className="w-full h-16 bg-slate-100 rounded border border-slate-200 flex items-center justify-center mb-2">
                                <Music className="w-6 h-6 text-slate-400" />
                              </div>
                            )}
                            {historyItem.prompt && (
                              <p className="text-xs text-slate-600 bg-slate-50 rounded p-2 mt-2">
                                {historyItem.prompt}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleRestoreHistory(historyItem)}
                            className="ml-4 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            恢复
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* 页面历史生成列表模态框 */}
      {showPageHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">
                    历史生成列表 - 环节内容
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {currentStep?.title || '当前环节'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowPageHistoryModal(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {pageHistory
                .filter(h => h.stepId === activeStepId)
                .length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无历史生成记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pageHistory
                    .filter(h => h.stepId === activeStepId)
                    .map((historyItem) => (
                      <div 
                        key={historyItem.id} 
                        className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-slate-500">
                                {historyItem.displayTime}
                              </span>
                            </div>
                            <div className="text-sm text-slate-700 mb-2">
                              <div className="font-semibold">{historyItem.data.title}</div>
                              {historyItem.data.time && (
                                <div className="text-xs text-slate-500 mt-1">时间: {historyItem.data.time}</div>
                              )}
                              {historyItem.data.objective && (
                                <div className="text-xs text-slate-500 mt-1">目标: {historyItem.data.objective}</div>
                              )}
                              <div className="text-xs text-slate-500 mt-1">素材数量: {historyItem.data.assets?.length || 0}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              // 恢复历史版本
                              const newCourseData = { ...courseData };
                              const step = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
                              if (step) {
                                step.title = historyItem.data.title;
                                step.time = historyItem.data.time;
                                step.objective = historyItem.data.objective;
                                step.assets = JSON.parse(JSON.stringify(historyItem.data.assets || []));
                                setCourseData(newCourseData);
                                saveToHistory(newCourseData);
                                setShowPageHistoryModal(false);
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 transition-colors"
                          >
                            恢复此版本
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
