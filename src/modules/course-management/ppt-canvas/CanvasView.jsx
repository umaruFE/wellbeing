/**
 * CanvasView 组件 - 课程编辑画布主组件
 * 功能：
 * 1. 提供课程编辑的主界面，包括左侧导航、中央画布和右侧属性面板
 * 2. 支持资产的添加、编辑、删除、复制等操作
 * 3. 支持撤销/重做功能
 * 4. 支持资产的拖拽、缩放和旋转
 * 5. 集成AI资产生成功能
 */
import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Image as ImageIcon, 
  Type, 
  Video, 
  Music, 
  ChevronLeft,
  ChevronRight,
  Plus,
  Wand2,
  Undo2,
  Redo2,
  Copy,
  RotateCw,
  X,
  History,
  RefreshCw,
  Edit3,
  Layout,
  BookOpen,
  FileCheck,
  MessageSquare,
  Check
} from 'lucide-react';
import { SlideRenderer } from '../../../components/SlideRenderer';
import { getAssetIcon } from '../../../utils';
import { AssetEditorPanel } from '../../../components/AssetEditorPanel';
import { CanvasViewLeftSidebar } from './CanvasView.LeftSidebar';
import { CanvasViewModals } from './CanvasView.Modals';
import { aiAssetService } from '../../../services/aiAssetService';
import { promptHistoryService, promptOptimizationService } from '../../../services/promptService';
import { optimizePrompt } from '../../../services/dashscope';
import { useAuth } from '../../../contexts/AuthContext';
import { handleAssetChange, handleDeleteAsset, handleCopyAsset, handleCopyPage, handleLayerChange, handleReferenceUpload } from './CanvasView.assets';
import { handleConfirmAddAsset, handleConfirmAddVideoAsset, handleCardSelectionConfirm, handleRegenerateAsset } from './CanvasView.asset-generation';
import { useCourseLayout } from '../../../components/CourseLayout';
import { saveToHistory, handleUndo, handleRedo } from './CanvasView.history';

const colors = {
  neutral: {
    white: '#FFFFFF',
    text: {
      1: '#333E4E',
      2: '#575F6E',
      3: '#818997',
      disabled: '#A4ABB8',
    },
    border: {
      DEFAULT: '#E6E3DE',
      secondary: '#EFECE8',
    },
    bg: {
      layout: '#F7F5F1',
    },
  },
  brand: {
    DEFAULT: '#F4785E',
    light: '#FDECE8',
  },
};

export const CanvasView = forwardRef(({ navigation, initialConfig }, ref) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { setTitle, setActions } = useCourseLayout();
  
  const courseId = initialConfig?.courseId;

  useEffect(() => {
    setTitle(null);
    setActions(
      <>
        <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5 mr-2">
          <RefreshCw size={12} /> 所有更改已保存
        </span>
        <div className="px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5"
             style={{ backgroundColor: colors.brand.light, color: colors.brand.DEFAULT }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.brand.DEFAULT }}></span>
          后台任务 2
        </div>
        <button className="px-5 py-1.5 rounded-lg text-[13px] font-bold border transition-colors text-white"
                style={{ backgroundColor: '#4C5866' }}>
          导出
        </button>
        <button className="px-5 py-1.5 rounded-lg text-[13px] font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: colors.brand.DEFAULT }}>
          发布
        </button>
      </>
    );
    return () => { setTitle(null); setActions(null); };
  }, [setTitle, setActions]);

  const isCourseDataArray = Array.isArray(initialConfig?.courseData);
  
  // 合并 courseData、canvasData 和 readingMaterialsData
  const mergeData = (courseData, canvasData, readingMaterialsData) => {
    if (!courseData) return courseData;
    
    const isArray = Array.isArray(courseData);
    
    // 深拷贝数据
    const mergedData = JSON.parse(JSON.stringify(courseData));
    
    if (isArray) {
      // 数组格式
      mergedData.forEach(phase => {
        (phase.slides || []).forEach(slide => {
          // 清空原有的 canvasAssets 和 readingMaterials（不使用 course_data 中的数据）
          slide.canvasAssets = [];
          slide.blocks = [];
          slide.readingMaterials = [];
          
          // 只使用 canvasData 和 readingMaterialsData 中的数据
          if (canvasData && canvasData[slide.id]) {
            slide.canvasAssets = canvasData[slide.id].canvasAssets || [];
            slide.blocks = canvasData[slide.id].blocks || [];
          }
          if (readingMaterialsData && readingMaterialsData[slide.id]) {
            slide.readingMaterials = readingMaterialsData[slide.id];
          }
        });
      });
    } else {
      // 对象格式
      Object.entries(mergedData).forEach(([phaseKey, phase]) => {
        (phase.steps || []).forEach(step => {
          // 清空原有的 canvasAssets 和 readingMaterials（不使用 course_data 中的数据）
          step.canvasAssets = [];
          step.blocks = [];
          step.readingMaterials = [];
          
          // 只使用 canvasData 和 readingMaterialsData 中的数据
          if (canvasData && canvasData[step.id]) {
            step.canvasAssets = canvasData[step.id].canvasAssets || [];
            step.blocks = canvasData[step.id].blocks || [];
          }
          if (readingMaterialsData && readingMaterialsData[step.id]) {
            step.readingMaterials = readingMaterialsData[step.id];
          }
        });
      });
    }
    
    return mergedData;
  };
  
  const [courseData, setCourseData] = useState(() => {
    const initialCourseData = initialConfig?.courseData || {};
    const canvasData = initialConfig?.canvasData || null;
    const readingMaterialsData = initialConfig?.readingMaterialsData || null;
    
    return mergeData(initialCourseData, canvasData, readingMaterialsData);
  });
  
  // 辅助函数：获取 phase 数据
  const getPhaseData = (phaseKey) => {
    const isArray = Array.isArray(courseData);
    if (isArray) {
      return courseData.find(phase => phase.id === phaseKey);
    }
    return courseData[phaseKey];
  };
  
  // 辅助函数：获取所有 phase keys
  const getPhaseKeys = () => {
    const isArray = Array.isArray(courseData);
    if (isArray) {
      return courseData.map(phase => phase.id);
    }
    return Object.keys(courseData);
  };
  
  // 如果 courseData 是数组格式，使用第一个 phase 的 id
  const [activePhase, setActivePhase] = useState(
    isCourseDataArray 
      ? initialConfig?.courseData?.[0]?.id || 'engage'
      : (initialConfig?.courseData ? Object.keys(initialConfig.courseData)[0] : 'engage')
  );
  
  // 如果 courseData 是数组格式，使用第一个 phase 的第一个 slide 的 id
  const [activeStepId, setActiveStepId] = useState(
    isCourseDataArray
      ? initialConfig?.courseData?.[0]?.slides?.[0]?.id || null
      : (initialConfig?.courseData ? initialConfig.courseData[Object.keys(initialConfig.courseData)[0]]?.steps[0]?.id : null)
  );
  
  const [expandedPhases, setExpandedPhases] = useState(
    isCourseDataArray
      ? initialConfig?.courseData?.map(phase => phase.id) || []
      : (initialConfig?.courseData ? Object.keys(initialConfig.courseData) : [])
  );
  
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
  const [history, setHistory] = useState([JSON.parse(JSON.stringify(initialConfig?.courseData || {}))]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // 当navigation变化时，重置数据
  useEffect(() => {
    if (!navigation) {
      const initialData = initialConfig?.courseData || {};
      setCourseData(initialData);
      
      const firstPhase = isCourseDataArray 
        ? initialData?.[0]?.id || 'engage'
        : Object.keys(initialData)[0];
      const firstStepId = isCourseDataArray
        ? initialData?.[0]?.slides?.[0]?.id
        : initialData[firstPhase]?.steps[0]?.id;
      
      setActivePhase(firstPhase);
      setActiveStepId(firstStepId);
      setExpandedPhases(isCourseDataArray ? initialData?.map(p => p.id) : Object.keys(initialData));
      setSelectedAssetId(null);
      setHistory([JSON.parse(JSON.stringify(initialData))]);
      setHistoryIndex(0);
    } else {
      const initialData = initialConfig?.courseData || {};
      setCourseData(initialData);
      
      const phaseMap = {
        'Engage': 'engage',
        'Empower': 'empower',
        'Execute': 'execute',
        'Elevate': 'elevate'
      };
      const phaseKey = phaseMap[navigation.phaseId] || (isCourseDataArray ? initialData?.[0]?.id : 'engage');
      const stepId = navigation.slideId ? String(navigation.slideId) : null;
      
      setExpandedPhases(isCourseDataArray ? initialData?.map(p => p.id) : Object.keys(initialData));
      setActivePhase(phaseKey);
      if (stepId) {
        setActiveStepId(stepId);
      } else {
        const firstStepId = isCourseDataArray
          ? initialData?.find(p => p.id === phaseKey)?.slides?.[0]?.id
          : initialData[phaseKey]?.steps[0]?.id;
        if (firstStepId) setActiveStepId(String(firstStepId));
      }
      setSelectedAssetId(null);
      setHistory([JSON.parse(JSON.stringify(initialData))]);
      setHistoryIndex(0);
    }
  }, [navigation, initialConfig]);

  // 提示词输入模态框状态
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptModalConfig, setPromptModalConfig] = useState({ type: null, assetType: null, phaseKey: null, addAtEnd: false });
  const [showRegeneratePageModal, setShowRegeneratePageModal] = useState(false);
  const [isRegeneratingPage, setIsRegeneratingPage] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // 历史生成记录
  const [generationHistory, setGenerationHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(null);
  
  // 页面历史记录
  const [pageHistory, setPageHistory] = useState([]);
  const [showPageHistoryModal, setShowPageHistoryModal] = useState(false);

  // 图片抽卡选择模态框状态
  const [showCardSelectionModal, setShowCardSelectionModal] = useState(false);
  const [cardSelectionImages, setCardSelectionImages] = useState([]);
  const [pendingAssetConfig, setPendingAssetConfig] = useState(null);
  const [savedPromptIds, setSavedPromptIds] = useState([]);

  // 生成中资产ID
  const [generatingAssetId, setGeneratingAssetId] = useState(null);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo(history, historyIndex, setHistoryIndex, setCourseData);
      }
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        handleRedo(history, historyIndex, setHistoryIndex, setCourseData);
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAssetId && !e.target.tagName.match(/INPUT|TEXTAREA/)) {
        e.preventDefault();
        handleDeleteAsset(selectedAssetId, activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex), setSelectedAssetId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAssetId, historyIndex, history, activePhase, activeStepId, courseData]);

  // 鼠标事件处理 - 拖拽、缩放、旋转
  useEffect(() => {
    const handleGlobalMouseMove = (e) => handleMouseMove(e);
    const handleGlobalMouseUp = () => handleMouseUp();
    
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [interactionMode, interactionStart, selectedAssetId, activePhase, activeStepId, courseData, history, historyIndex]);

  // Derived State
  const currentPhaseData = getPhaseData(activePhase);
  const currentStep = (currentPhaseData?.steps || currentPhaseData?.slides)?.find(s => s.id === activeStepId) || (currentPhaseData?.steps || currentPhaseData?.slides)?.[0];
  const selectedAsset = selectedAssetId && currentStep ? (currentStep.assets || currentStep.canvasAssets || []).find(a => a.id === selectedAssetId) : null;

  const allSteps = getPhaseKeys().flatMap(phaseKey => {
    const phase = getPhaseData(phaseKey);
    if (!phase) return [];
    return (phase.steps || phase.slides || []).map(slide => ({...slide, phaseKey}));
  });
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
    setPromptModalConfig({ type: 'session', phaseKey });
    setShowPromptModal(true);
  };

  const handleAddStepAtEnd = () => {
    if (!activePhase) {
      alert('请先选择一个环节');
      return;
    }
    setPromptModalConfig({ type: 'session', phaseKey: activePhase, addAtEnd: true });
    setShowPromptModal(true);
  };

  const handleConfirmAddStep = (prompt) => {
    setIsGenerating(true);
    const phaseKey = promptModalConfig.phaseKey;
    
    setTimeout(() => {
      const newCourseData = JSON.parse(JSON.stringify(courseData));
      const phase = newCourseData[phaseKey];
      if (!phase) return;
      
      const generatedTitle = prompt ? `AI生成：${prompt.substring(0, 20)}...` : '新环节';
      const generatedObjective = prompt ? `根据提示词"${prompt}"生成的教学目标` : '';
      
      const newStep = {
        id: `${phaseKey}-${Date.now()}`,
        title: generatedTitle,
        time: '00:00',
        objective: generatedObjective,
        assets: [],
        canvasAssets: []
      };
      
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
      saveToHistory(newCourseData, history, historyIndex, setHistory, setHistoryIndex);
      setActivePhase(phaseKey);
      setActiveStepId(newStep.id);
      setSelectedAssetId(null);
      setIsGenerating(false);
      setShowPromptModal(false);
      setPromptModalConfig({ type: null, assetType: null, phaseKey: null, addAtEnd: false });
    }, 1500);
  };

  const handleInputChange = (field, value) => {
    const newCourseData = JSON.parse(JSON.stringify(courseData));
    
    // 处理数组和对象两种格式
    const phase = Array.isArray(newCourseData) 
      ? newCourseData.find(p => p.id === activePhase)
      : newCourseData[activePhase];
    
    if (!phase) return;
    
    const stepsOrSlides = phase.steps || phase.slides;
    if (!stepsOrSlides) return;
    
    const step = stepsOrSlides.find(s => s.id === activeStepId);
    if(step) step[field] = value;
    setCourseData(newCourseData);
    saveToHistory(newCourseData, history, historyIndex, setHistory, setHistoryIndex);
  };

  const handleAddAsset = (type) => {
    setPromptModalConfig({ type: 'element', assetType: type, phaseKey: activePhase });
    setShowPromptModal(true);
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

  const handleMouseDown = (e, assetId, mode = 'dragging', handleType = null) => {
    e.stopPropagation(); 
    if (!canvasRef.current) return;
    setSelectedAssetId(assetId);
    setIsRightOpen(true);
    setInteractionMode(mode);
    const phaseData = getPhaseData(activePhase);
    const stepsOrSlides = phaseData?.steps || phaseData?.slides;
    const step = stepsOrSlides?.find(s => s.id === activeStepId);
    const asset = step?.assets?.find(a => a.id === assetId) || step?.canvasAssets?.find(a => a.id === assetId) || step?.elements?.find(a => a.id === assetId);
    if (!asset) return;
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
    const newCourseData = JSON.parse(JSON.stringify(courseData));
    
    // 处理数组和对象两种格式
    const phase = Array.isArray(newCourseData) 
      ? newCourseData.find(p => p.id === activePhase)
      : newCourseData[activePhase];
    
    if (!phase) return;
    
    const stepsOrSlides = phase.steps || phase.slides;
    if (!stepsOrSlides) return;
    
    const step = stepsOrSlides.find(s => s.id === activeStepId);
    if (!step) return;
    const activeAsset = step.assets?.find(a => a.id === selectedAssetId) || step.canvasAssets?.find(a => a.id === selectedAssetId) || step.elements?.find(a => a.id === selectedAssetId);
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
      saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex);
    }
    setInteractionMode('idle'); 
    setInteractionStart(null); 
  };

  const handleCanvasClick = () => { 
    if (editingTextAssetId) {
      const asset = currentStep?.assets?.find(a => a.id === editingTextAssetId) || currentStep?.canvasAssets?.find(a => a.id === editingTextAssetId) || currentStep?.elements?.find(a => a.id === editingTextAssetId);
      if (asset && editingTextContent !== undefined) {
        handleAssetChange(editingTextAssetId, 'content', editingTextContent, activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex));
      }
      setEditingTextAssetId(null);
      setEditingTextContent('');
    }
    setSelectedAssetId(null); 
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getCourseData: () => courseData,
    getCanvasData: () => {
      const isArray = Array.isArray(courseData);
      const canvasData = {};
      
      if (isArray) {
        courseData.forEach(phase => {
          (phase.slides || []).forEach(slide => {
            canvasData[slide.id] = {
              canvasAssets: slide.canvasAssets || [],
              blocks: slide.blocks || []
            };
          });
        });
      } else {
        Object.entries(courseData).forEach(([phaseKey, phase]) => {
          (phase.steps || []).forEach(step => {
            canvasData[step.id] = {
              canvasAssets: step.canvasAssets || [],
              blocks: step.blocks || []
            };
          });
        });
      }
      return canvasData;
    },
    getReadingMaterialsData: () => {
      const isArray = Array.isArray(courseData);
      const readingMaterialsData = {};
      
      if (isArray) {
        courseData.forEach(phase => {
          (phase.slides || []).forEach(slide => {
            readingMaterialsData[slide.id] = slide.readingMaterials || [];
          });
        });
      } else {
        Object.entries(courseData).forEach(([phaseKey, phase]) => {
          (phase.steps || []).forEach(step => {
            readingMaterialsData[step.id] = step.readingMaterials || [];
          });
        });
      }
      return readingMaterialsData;
    }
  }));

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
    setGenerationHistory(prev => [historyItem, ...prev].slice(0, 100));
  };

  const handleRestoreHistory = (historyItem) => {
    const newCourseData = JSON.parse(JSON.stringify(courseData));
    
    // 处理数组和对象两种格式
    const phase = Array.isArray(newCourseData) 
      ? newCourseData.find(p => p.id === activePhase)
      : newCourseData[activePhase];
    
    if (!phase) return;
    
    const stepsOrSlides = phase.steps || phase.slides;
    if (!stepsOrSlides) return;
    
    const step = stepsOrSlides.find(s => s.id === activeStepId);
    if (!step) return;
    const asset = step.assets?.find(a => a.id === historyItem.assetId) || step.elements?.find(a => a.id === historyItem.assetId);
    if (asset && (asset.type === 'image' || asset.type === 'video' || asset.type === 'audio')) {
      asset.url = historyItem.url;
      if (historyItem.prompt) asset.prompt = historyItem.prompt;
      setCourseData(newCourseData);
      saveToHistory(newCourseData, history, historyIndex, setHistory, setHistoryIndex);
    }
    setShowHistoryModal(null);
  };

  const handleConfirmRegeneratePage = (prompt) => {
    setIsRegeneratingPage(true);
    
    setTimeout(() => {
      const newCourseData = JSON.parse(JSON.stringify(courseData));
      
      // 处理数组和对象两种格式
      const phase = Array.isArray(newCourseData) 
        ? newCourseData.find(p => p.id === activePhase)
        : newCourseData[activePhase];
      
      if (!phase) return;
      
      const stepsOrSlides = phase.steps || phase.slides;
      if (!stepsOrSlides) return;
      
      const step = stepsOrSlides.find(s => s.id === activeStepId);
      if (!step) return;
      
      step.title = prompt ? `AI生成：${prompt.substring(0, 20)}...` : '重新生成的页面';
      step.objective = prompt ? `根据提示词"${prompt}"重新生成的教学目标` : '';
      
      setCourseData(newCourseData);
      saveToHistory(newCourseData, history, historyIndex, setHistory, setHistoryIndex);
      setIsRegeneratingPage(false);
      setShowRegeneratePageModal(false);
    }, 2000);
  };

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-surface">
        {/* Left Sidebar */}
        <CanvasViewLeftSidebar
        courseData={courseData}
        expandedPhases={expandedPhases}
        activeStepId={activeStepId}
        onTogglePhase={togglePhase}
        onStepClick={handleStepClick}
        onAddStep={handleAddStep}
        onDeleteStep={(phaseKey, stepId) => {
          if (!confirm('确定要删除这个环节吗？此操作无法撤销。')) return;
          
          const newCourseData = JSON.parse(JSON.stringify(courseData));
          const isArray = Array.isArray(newCourseData);
          const phase = isArray 
            ? newCourseData.find(p => p.id === phaseKey)
            : newCourseData[phaseKey];
          if (!phase) return;
          
          phase.slides = phase.slides.filter(s => s.id !== stepId);
          
          if (activeStepId === stepId) {
            if (phase.slides.length > 0) {
              setActiveStepId(phase.slides[0].id);
            } else {
              const otherPhase = isArray
                ? newCourseData.find(p => p.id !== phaseKey && p.slides.length > 0)
                : Object.entries(newCourseData).find(([key, p]) => 
                    key !== phaseKey && p.slides.length > 0
                  );
              if (otherPhase) {
                setActivePhase(isArray ? otherPhase.id : otherPhase[0]);
                setActiveStepId(isArray ? otherPhase.slides[0].id : otherPhase[1].slides[0].id);
              }
            }
          }
          
          setCourseData(newCourseData);
          saveToHistory(newCourseData, history, historyIndex, setHistory, setHistoryIndex);
          setSelectedAssetId(null);
        }}
        isLeftOpen={isLeftOpen}
        onLeftToggle={() => setIsLeftOpen(!isLeftOpen)}
      />

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b-2 border-stroke-light px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLeftOpen(!isLeftOpen)}
              className="p-2 hover:bg-surface-alt rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-primary-secondary" />
            </button>
            <h2 className="text-lg font-semibold text-primary">
              {currentStep?.title || '选择环节'}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleUndo(history, historyIndex, setHistoryIndex, setCourseData)}
              className="p-2 hover:bg-surface-alt rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={historyIndex <= 0}
            >
              <Undo2 className="w-5 h-5 text-primary-secondary" />
            </button>
            <button
              onClick={() => handleRedo(history, historyIndex, setHistoryIndex, setCourseData)}
              className="p-2 hover:bg-surface-alt rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={historyIndex >= history.length - 1}
            >
              <Redo2 className="w-5 h-5 text-primary-secondary" />
            </button>
            <div className="h-6 w-px bg-stroke mx-1"></div>
            <button
              onClick={handleCopyPage}
              className="p-2 hover:bg-surface-alt rounded-lg transition-colors"
            >
              <Copy className="w-5 h-5 text-primary-secondary" />
            </button>
            {/* <button
              onClick={handleExportPPT}
              className="p-2 hover:bg-surface-alt rounded-lg transition-colors relative"
              disabled={isExporting}
            >
              {isExporting && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                  <div className="w-4 h-4 border-2 border-info border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <RefreshCw className="w-5 h-5 text-primary-secondary" />
            </button>*/}
          </div>
        </div>

        {/* Canvas */}
        <div 
          className="flex-1 overflow-auto p-8 flex items-center justify-center relative"
          onClick={handleCanvasClick}
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px]" onClick={(e) => e.stopPropagation()}></div>
          <div ref={canvasRef} className="w-[960px] h-[540px] bg-white shadow-2xl rounded-sm relative overflow-hidden ring-1 ring-slate-900/5 group transition-transform duration-200">
            <SlideRenderer
              assets={currentStep?.assets || currentStep?.canvasAssets || []}
              isEditable={true}
              onMouseDown={handleMouseDown}
              onClick={(assetId) => {
                setSelectedAssetId(assetId);
                setIsRightOpen(true);
              }}
              selectedAssetId={selectedAssetId}
              onCopyAsset={(assetId) => handleCopyAsset(assetId, activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex), setSelectedAssetId)}
              onDeleteAsset={(assetId) => handleDeleteAsset(assetId, activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex), setSelectedAssetId)}
              onAssetChange={(assetId, field, value) => handleAssetChange(assetId, field, value, activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex))}
              editingTextAssetId={editingTextAssetId}
              onEditingTextAssetIdChange={setEditingTextAssetId}
              editingTextContent={editingTextContent}
              onEditingTextContentChange={setEditingTextContent}
              onCanvasClick={handleCanvasClick}
            />
          </div>
          
          {activeStepId && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30" style={{left: '58%'}}>
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

        {/* Bottom Bar */}
        <div className="bg-white border-t-2 border-stroke-light px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAddAsset('text')}
              className="flex items-center gap-1 px-3 py-2 bg-surface-alt text-primary-secondary rounded-lg hover:bg-stroke transition-colors text-sm"
            >
              <Type className="w-4 h-4" />
              文本
            </button>
            <button
              onClick={() => handleAddAsset('image')}
              className="flex items-center gap-1 px-3 py-2 bg-surface-alt text-primary-secondary rounded-lg hover:bg-stroke transition-colors text-sm"
            >
              <ImageIcon className="w-4 h-4" />
              图片
            </button>
            <button
              onClick={() => handleAddAsset('video')}
              className="flex items-center gap-1 px-3 py-2 bg-surface-alt text-primary-secondary rounded-lg hover:bg-stroke transition-colors text-sm"
            >
              <Video className="w-4 h-4" />
              视频
            </button>
            <button
              onClick={() => handleAddAsset('audio')}
              className="flex items-center gap-1 px-3 py-2 bg-surface-alt text-primary-secondary rounded-lg hover:bg-stroke transition-colors text-sm"
            >
              <Music className="w-4 h-4" />
              音频
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            {/*<button
              onClick={() => handleAddAsset('text')}
              className="p-2 hover:bg-surface-alt rounded-lg transition-colors"
            >
              <Wand2 className="w-5 h-5 text-info" />
            </button> */}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className={`${isRightOpen ? 'w-96' : 'w-0'} bg-white border-l-2 border-stroke-light flex flex-col shrink-0 z-10 shadow-[4px_0_15px_rgba(0,0,0,0.05)] transition-all duration-300 relative`}>
         {!isRightOpen && (
           <button 
             onClick={() => setIsRightOpen(true)} 
             className="absolute top-4 right-0 bg-white p-2 rounded-l-md border-2 border-r-0 border-stroke-light shadow-sm text-dark hover:text-dark hover:border-primary z-50 transform -translate-x-full transition-all"
             title="展开面板"
           >
             <ChevronLeft className="w-4 h-4" />
           </button>
         )}
         <div className={`flex flex-col h-full ${!isRightOpen && 'hidden'}`}>
            {selectedAsset ? (
               <AssetEditorPanel
                 selectedAsset={selectedAsset}
                 onClose={() => setSelectedAssetId(null)}
                 onAssetChange={(assetId, field, value) => handleAssetChange(assetId, field, value, activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex))}
                 onLayerChange={(assetId, direction) => handleLayerChange(assetId, direction, activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex))}
                 onCopyAsset={(assetId) => handleCopyAsset(assetId, activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex))}
                 onDeleteAsset={(assetId) => handleDeleteAsset(assetId, activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex), setSelectedAssetId)}
                 onShowHistoryModal={setShowHistoryModal}
                 onRegenerateAsset={(assetId) => handleRegenerateAsset(assetId, activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex), setGeneratingAssetId, user, saveGenerationHistory)}
                 generatingAssetId={generatingAssetId}
                 onReferenceUpload={(e, assetId) => handleReferenceUpload(e, assetId, activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex))}
                 isRightOpen={isRightOpen}
                 onToggleRightOpen={() => setIsRightOpen(false)}
               />
            ) : (
               <>
                  <div className="p-4 border-b-2 border-stroke-light bg-surface flex items-center justify-between">
                     <h3 className="font-bold text-primary flex items-center gap-2">
                       <Wand2 className="w-4 h-4 text-purple" />环节详情编辑
                     </h3>
                     <button onClick={() => setIsRightOpen(false)} className="text-primary-placeholder hover:text-primary-secondary" title="收起面板">
                       <ChevronRight className="w-4 h-4" />
                     </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 space-y-6">
                     <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-primary-muted uppercase mb-1 block">时间 / Time</label>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-primary-placeholder" />
                            <input 
                              type="text" 
                              value={currentStep?.time || ''} 
                              onChange={(e) => handleInputChange('time', e.target.value)} 
                              className="flex-1 text-sm border-2 border-stroke-light rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-[#2d2d2d] focus:border-primary outline-none transition-all" 
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-primary-muted uppercase mb-1 block">教学环节 / Step Title</label>
                          <input 
                            type="text" 
                            value={currentStep?.title || ''} 
                            onChange={(e) => handleInputChange('title', e.target.value)} 
                            className="w-full text-sm border-2 border-stroke-light rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#2d2d2d] focus:border-primary outline-none transition-all" 
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-primary-muted uppercase mb-1 block">教学目标 / Objective</label>
                          <textarea 
                            value={currentStep?.objective || ''} 
                            onChange={(e) => handleInputChange('objective', e.target.value)} 
                            className="w-full text-sm border-2 border-stroke-light rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#2d2d2d] focus:border-primary outline-none resize-none transition-all" 
                            rows={4}
                          />
                        </div>
                     </div>
                     <hr className="border-stroke-light" />
                     <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-primary-muted uppercase">本页素材 ({currentStep?.assets?.length || 0})</label>
                          <div className="flex gap-1">
                            <button onClick={() => handleAddAsset('image')} className="p-1 hover:bg-surface-alt rounded text-primary-placeholder hover:text-purple">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {currentStep?.assets?.map((asset) => (
                            <div 
                              key={asset.id} 
                              onClick={() => setSelectedAssetId(asset.id)} 
                              className="flex items-start gap-2 p-2 border-2 border-stroke-light rounded-xl bg-white hover:border-primary hover:shadow-[4px_4px_0px_0px_var(--color-dark)] cursor-pointer transition-all group"
                            >
                              <div className="mt-1 text-primary-placeholder">{getAssetIcon(asset.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-primary-secondary truncate">{asset.title}</div>
                                <div className="text-[10px] text-primary-placeholder">{asset.type} • 点击编辑</div>
                              </div>
                            </div>
                          ))}
                        </div>
                     </div>
                     <div className="pt-6 mt-6 border-t-2 border-stroke-light flex gap-2">
                        <button 
                          onClick={() => {
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
                              setShowPageHistoryModal(true);
                            }
                          }}
                          className="flex-1 py-2 bg-surface-alt text-primary-secondary rounded text-sm font-bold hover:bg-stroke flex items-center justify-center gap-2 transition-all"
                        >
                          <History className="w-4 h-4" />
                          历史生成
                        </button>
                        <button 
                          onClick={() => {
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
                              setShowRegeneratePageModal(true);
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

      {/* Modals */}
      <CanvasViewModals
        showPromptModal={showPromptModal}
        setShowPromptModal={setShowPromptModal}
        promptModalConfig={promptModalConfig}
        setPromptModalConfig={setPromptModalConfig}
        onConfirmAddStep={handleConfirmAddStep}
        onConfirmAddAsset={(prompt, inputMode, videoStyle, imageSize, referenceImage, lyrics, audioConfig, videoReferenceImages) => handleConfirmAddAsset(
          prompt, inputMode, videoStyle, imageSize, referenceImage, lyrics, audioConfig, videoReferenceImages,
          promptModalConfig, activePhase, activeStepId, courseData, setCourseData, setIsGenerating,
          setShowPromptModal, setPromptModalConfig, setCardSelectionImages, setSavedPromptIds,
          setPendingAssetConfig, setShowCardSelectionModal, user, saveToHistory, history, historyIndex, setHistory, setHistoryIndex,
          setSelectedAssetId, setIsRightOpen
        )}
        onConfirmAddVideoAsset={(videoData) => handleConfirmAddVideoAsset(
          videoData, activePhase, activeStepId, courseData, setCourseData, saveToHistory, history, historyIndex, setHistory, setHistoryIndex, setSelectedAssetId, setIsRightOpen, setShowPromptModal, setPromptModalConfig
        )}
        showCardSelectionModal={showCardSelectionModal}
        setShowCardSelectionModal={setShowCardSelectionModal}
        cardSelectionImages={cardSelectionImages}
        setCardSelectionImages={setCardSelectionImages}
        pendingAssetConfig={pendingAssetConfig}
        setPendingAssetConfig={setPendingAssetConfig}
        isGenerating={isGenerating}
        onCardSelectionConfirm={(selectedImage, selectedIndex) => handleCardSelectionConfirm(
          selectedImage, pendingAssetConfig, activePhase, activeStepId, courseData, setCourseData,
          setShowCardSelectionModal, setCardSelectionImages, setPendingAssetConfig, setSelectedAssetId, setIsRightOpen,
          saveToHistory, history, historyIndex, setHistory, setHistoryIndex
        )}
        showRegeneratePageModal={showRegeneratePageModal}
        setShowRegeneratePageModal={setShowRegeneratePageModal}
        isRegeneratingPage={isRegeneratingPage}
        onConfirmRegeneratePage={handleConfirmRegeneratePage}
        showHistoryModal={showHistoryModal}
        setShowHistoryModal={setShowHistoryModal}
        generationHistory={generationHistory}
        activePhase={activePhase}
        activeStepId={activeStepId}
        onRestoreHistory={handleRestoreHistory}
        userId={user?.id}
        organizationId={user?.organizationId}
      />

      {showPageHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b-2 border-stroke-light flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-info p-2 rounded-lg text-white">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-primary">历史生成列表 - 环节内容</h3>
                  <p className="text-xs text-primary-muted mt-1">{currentStep?.title || '当前环节'}</p>
                </div>
              </div>
              <button onClick={() => setShowPageHistoryModal(false)} className="text-primary-placeholder hover:text-primary-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {pageHistory.filter(h => h.stepId === activeStepId).length === 0 ? (
                <div className="text-center py-12 text-primary-placeholder">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无历史生成记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pageHistory.filter(h => h.stepId === activeStepId).map((historyItem) => (
                    <div key={historyItem.id} className="border-2 border-stroke-light rounded-xl p-4 hover:border-primary hover:shadow-[4px_4px_0px_0px_var(--color-dark)] transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-primary-muted">{historyItem.displayTime}</span>
                          </div>
                          <div className="text-sm text-primary-secondary mb-2">
                            <div className="font-semibold">{historyItem.data.title}</div>
                            {historyItem.data.time && <div className="text-xs text-primary-muted mt-1">时间: {historyItem.data.time}</div>}
                            {historyItem.data.objective && <div className="text-xs text-primary-muted mt-1">目标: {historyItem.data.objective}</div>}
                            <div className="text-xs text-primary-muted mt-1">素材数量: {historyItem.data.assets?.length || 0}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const newCourseData = JSON.parse(JSON.stringify(courseData));
                            
                            // 处理数组和对象两种格式
                            const phase = Array.isArray(newCourseData) 
                              ? newCourseData.find(p => p.id === activePhase)
                              : newCourseData[activePhase];
                            
                            if (!phase) return;
                            
                            const stepsOrSlides = phase.steps || phase.slides;
                            if (!stepsOrSlides) return;
                            
                            const step = stepsOrSlides.find(s => s.id === activeStepId);
                            if (step) {
                              step.title = historyItem.data.title;
                              step.time = historyItem.data.time;
                              step.objective = historyItem.data.objective;
                              step.assets = JSON.parse(JSON.stringify(historyItem.data.assets || []));
                              setCourseData(newCourseData);
                              saveToHistory(newCourseData, history, historyIndex, setHistory, setHistoryIndex);
                              setShowPageHistoryModal(false);
                            }
                          }}
                          className="px-4 py-2 bg-info text-white rounded text-sm font-bold hover:bg-info-active transition-colors"
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
