import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { 
  BookOpen,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  Copy,
  RefreshCw,
  Wand2,
  History,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { ReadingMaterialEditor } from './ReadingMaterialEditor';
import { INITIAL_COURSE_DATA, READING_TEST_DATA } from '../constants';
import { getAssetIcon } from '../utils';
import { PromptInputModal } from './PromptInputModal';
import { AssetEditorPanel } from './AssetEditorPanel';
import { ReadingMaterialCanvasViewLeftSidebar } from './ReadingMaterialCanvasView.LeftSidebar';

/**
 * ReadingMaterialCanvasView - 阅读材料画布模式视图
 * 独立的画布视图，专门用于编辑阅读材料
 */
export const ReadingMaterialCanvasView = forwardRef((props, ref) => {
  const { navigation } = props;
  const [courseData, setCourseData] = useState(READING_TEST_DATA);
  const [activePhase, setActivePhase] = useState(Object.keys(READING_TEST_DATA)[0]);
  const [activeStepId, setActiveStepId] = useState(READING_TEST_DATA[Object.keys(READING_TEST_DATA)[0]]?.steps[0]?.id);
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState(Object.keys(READING_TEST_DATA));
  const [canvasAspectRatio, setCanvasAspectRatio] = useState('A4');
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [generatingAssetId, setGeneratingAssetId] = useState(null);
  
  // 提示词输入模态框状态
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptModalConfig, setPromptModalConfig] = useState({ type: null, phaseKey: null, pageId: null, assetType: null });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAsset, setIsGeneratingAsset] = useState(false);
  const [showRegeneratePageModal, setShowRegeneratePageModal] = useState(false);
  const [isRegeneratingPage, setIsRegeneratingPage] = useState(false);
  const [showAddReadingMaterialModal, setShowAddReadingMaterialModal] = useState(null);
  const [isGeneratingReadingMaterial, setIsGeneratingReadingMaterial] = useState(false);
  const [showAddPageToMaterialModal, setShowAddPageToMaterialModal] = useState(null);
  const [isGeneratingPageToMaterial, setIsGeneratingPageToMaterial] = useState(false);
  
  // 历史生成记录
  const [generationHistory, setGenerationHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(null);
  const [pageHistory, setPageHistory] = useState([]);
  const [showPageHistoryModal, setShowPageHistoryModal] = useState(false);
  
  // 撤销/重做功能
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // 当navigation变化时，重置数据
  useEffect(() => {
    if (!navigation) {
      setCourseData(READING_TEST_DATA);
      const firstPhase = Object.keys(READING_TEST_DATA)[0];
      const firstStepId = READING_TEST_DATA[firstPhase]?.steps[0]?.id;
      setActivePhase(firstPhase);
      setActiveStepId(firstStepId);
      setExpandedPhases(Object.keys(READING_TEST_DATA));
      setSelectedAssetId(null);
      setGenerationHistory([]);
      setShowHistoryModal(null);
      setShowPromptModal(false);
      setPromptModalConfig({ type: null, phaseKey: null, pageId: null, assetType: null });
    } else {
      setCourseData(INITIAL_COURSE_DATA);
      const phaseMap = { 'Engage': 'engage', 'Empower': 'empower', 'Execute': 'execute', 'Elevate': 'elevate' };
      const phaseKey = phaseMap[navigation.phaseId] || 'engage';
      const stepId = navigation.slideId ? String(navigation.slideId) : null;
      setExpandedPhases(Object.keys(INITIAL_COURSE_DATA));
      setActivePhase(phaseKey);
      if (stepId) {
        setActiveStepId(stepId);
      } else {
        const firstStepId = INITIAL_COURSE_DATA[phaseKey]?.steps[0]?.id;
        if (firstStepId) setActiveStepId(String(firstStepId));
      }
      setSelectedAssetId(null);
    }
  }, [navigation]);

  // 初始化pages
  const initializePages = (dataSource) => {
    const allSteps = Object.values(dataSource).flatMap(phase => 
      phase.steps.map(step => ({ ...step, phaseKey: Object.keys(dataSource).find(k => dataSource[k].steps.includes(step)) }))
    );
    
    return allSteps.map((step, index) => {
      const rawAssets = step.assets || [];
      
      if (rawAssets.length <= 1 && !rawAssets.some(a => a.type === 'text')) {
        return {
          id: `page-${step.id}`,
          slideId: step.id,
          pageNumber: index + 1,
          title: step.title,
          width: 680,
          height: 960,
          canvasAssets: [
            { id: `asset-title-${step.id}`, type: 'text', title: '标题', content: step.title, x: 50, y: 40, width: 580, height: 70, rotation: 0, fontSize: 28, fontWeight: 'bold', textAlign: 'center', prompt: '' },
            { id: `asset-image-${step.id}`, type: 'image', title: '插图', url: rawAssets.find(a => a.type === 'image')?.url || `https://placehold.co/400x250/6366f1/FFF?text=${encodeURIComponent(step.title.substring(0, 10))}`, x: 140, y: 120, width: 400, height: 250, rotation: 0, prompt: '' },
            { id: `asset-content-${step.id}`, type: 'text', title: '正文', content: `【${step.title}】\n\n${step.objective || '本环节核心教学内容...'}\n\n• 活动：${step.activity || '暂无活动描述'}\n• 目标：${step.objective || '暂无目标描述'}`, x: 50, y: 390, width: 580, height: 520, rotation: 0, fontSize: 16, lineHeight: 1.6, prompt: '' },
            ...rawAssets.filter(a => a.type !== 'image' && a.type !== 'text')
          ],
          blocks: []
        };
      }
      
      return {
        id: `page-${step.id}`,
        slideId: step.id,
        pageNumber: index + 1,
        title: step.title,
        width: 680,
        height: 960,
        canvasAssets: rawAssets.map(asset => ({ ...asset, prompt: asset.prompt || '', referenceImage: asset.referenceImage || null })),
        blocks: []
      };
    });
  };

  const [pages, setPages] = useState(() => initializePages(INITIAL_COURSE_DATA));
  const [editingPageIndex, setEditingPageIndex] = useState(0);
  const [selectedStepId, setSelectedStepId] = useState(null);
  const [selectedMaterialId, setSelectedMaterialId] = useState(null);
  
  const filteredPages = selectedMaterialId
    ? pages.filter(page => page.materialId === selectedMaterialId)
    : selectedStepId 
    ? pages.filter(page => page.slideId === selectedStepId)
    : pages;

  // 初始化历史记录
  useEffect(() => {
    if (pages.length > 0 && history.length === 0) {
      setHistory([JSON.parse(JSON.stringify(pages))]);
      setHistoryIndex(0);
    }
    if (!selectedStepId && pages.length > 0) {
      const firstPage = pages[0];
      if (firstPage.slideId) {
        setSelectedStepId(firstPage.slideId);
        setActiveStepId(firstPage.slideId);
      }
    }
  }, [pages.length, selectedStepId]);

  // 当navigation或courseData变化时，重新初始化pages
  useEffect(() => {
    const allSteps = Object.values(courseData).flatMap(phase => 
      phase.steps.map(step => ({ ...step, phaseKey: Object.keys(courseData).find(k => courseData[k].steps.includes(step)) }))
    );
    
    let newPages = allSteps.map((step, index) => {
      const rawAssets = step.assets || [];
      if (rawAssets.length <= 1 && !rawAssets.some(a => a.type === 'text')) {
        const titleAsset = { id: `asset-title-${step.id}`, type: 'text', title: '标题', content: step.title, x: 50, y: 40, width: 580, height: 70, rotation: 0, fontSize: 28, fontWeight: 'bold', textAlign: 'center', prompt: '' };
        const imageAsset = { id: `asset-image-${step.id}`, type: 'image', title: '插图', url: rawAssets.find(a => a.type === 'image')?.url || `https://placehold.co/400x250/6366f1/FFF?text=${encodeURIComponent(step.title.substring(0, 10))}`, x: 140, y: 120, width: 400, height: 250, rotation: 0, prompt: '' };
        const contentAsset = { id: `asset-content-${step.id}`, type: 'text', title: '正文', content: `【${step.title}】\n\n${step.objective || '本环节核心教学内容...'}\n\n• 活动：${step.activity || '暂无活动描述'}\n• 目标：${step.objective || '暂无目标描述'}`, x: 50, y: 390, width: 580, height: 520, rotation: 0, fontSize: 16, lineHeight: 1.6, prompt: '' };
        const extraAssets = rawAssets.filter(a => a.type !== 'image' && a.type !== 'text');
        return { id: `page-${step.id}`, slideId: step.id, pageNumber: index + 1, title: step.title, width: 680, height: 960, canvasAssets: [titleAsset, imageAsset, contentAsset, ...extraAssets], blocks: [] };
      }
      return { id: `page-${step.id}`, slideId: step.id, pageNumber: index + 1, title: step.title, width: 680, height: 960, canvasAssets: rawAssets.map(a => ({ ...a, prompt: a.prompt || '', referenceImage: a.referenceImage || null })), blocks: [] };
    });
    
    if (navigation && navigation.slideId) {
      const slideIdStr = typeof navigation.slideId === 'string' ? navigation.slideId : String(navigation.slideId);
      if (navigation.material && navigation.material.pages) {
        newPages = newPages.filter(p => !(p.slideId === slideIdStr && !p.materialId));
        const materialPages = navigation.material.pages.map((p, idx) => ({ ...p, slideId: slideIdStr, materialId: navigation.materialId || navigation.material.id }));
        newPages = [...newPages, ...materialPages];
        setSelectedMaterialId(navigation.materialId || navigation.material.id);
      } else {
        setSelectedMaterialId(null);
      }
      setPages(newPages);
      setSelectedStepId(slideIdStr);
      setActiveStepId(slideIdStr);
      const stepPages = newPages.filter(p => p.slideId === slideIdStr);
      if (stepPages.length > 0) {
        const pageIndex = newPages.findIndex(p => p.id === stepPages[0].id);
        if (pageIndex >= 0) setEditingPageIndex(pageIndex);
        else {
          const fallbackIndex = newPages.findIndex(p => p.slideId === slideIdStr);
          if (fallbackIndex >= 0) setEditingPageIndex(fallbackIndex);
          else setEditingPageIndex(0);
        }
      } else {
        setEditingPageIndex(0);
      }
    } else {
      setPages(newPages);
      if (newPages.length > 0) {
        const firstPage = newPages[0];
        if (firstPage.slideId) {
          setSelectedStepId(firstPage.slideId);
          setActiveStepId(firstPage.slideId);
        }
        setEditingPageIndex(0);
      }
    }
    
    setHistory([JSON.parse(JSON.stringify(newPages))]);
    setHistoryIndex(0);
  }, [navigation, courseData]);

  // 保存历史记录
  const saveToHistory = (newPages) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newPages)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // 撤销/重做
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setPages(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setPages(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };

  // 切换阶段展开/收起
  const togglePhase = (phaseKey) => {
    if (expandedPhases.includes(phaseKey)) {
      setExpandedPhases(expandedPhases.filter(p => p !== phaseKey));
    } else {
      setExpandedPhases([...expandedPhases, phaseKey]);
    }
  };

  // 处理步骤点击
  const handleStepClick = (phaseKey, stepId) => {
    setActivePhase(phaseKey);
    setActiveStepId(stepId);
    setSelectedStepId(stepId);
    setSelectedMaterialId(null);
    const stepPages = pages.filter(p => p.slideId === stepId);
    if (stepPages.length > 0) {
      const pageIndex = pages.findIndex(p => p.id === stepPages[0].id);
      if (pageIndex >= 0) setEditingPageIndex(pageIndex);
    } else {
      setEditingPageIndex(0);
    }
  };

  // 在选中环节的末尾添加新页面
  const handleAddPageToStep = () => {
    if (!selectedStepId) {
      alert('请先选择一个环节');
      return;
    }
    setPromptModalConfig({ type: 'page', phaseKey: null, stepId: selectedStepId });
    setShowPromptModal(true);
  };

  // 确认在环节末尾添加新页面
  const handleConfirmAddPageToStep = (prompt) => {
    if (!selectedStepId) return;
    setIsGenerating(true);
    const getCanvasSize = () => canvasAspectRatio === 'A4' ? { width: 680, height: 960 } : { width: 960, height: 680 };
    const canvasSize = getCanvasSize();
    
    setTimeout(() => {
      const generatedTitle = prompt ? `AI生成：${prompt.substring(0, 20)}...` : '新页面';
      const stepPages = pages.filter(p => p.slideId === selectedStepId);
      const lastPageNumber = stepPages.length > 0 ? Math.max(...stepPages.map(p => p.pageNumber || 0)) : 0;
      
      const newPage = { id: `page-${selectedStepId}-${Date.now()}`, slideId: selectedStepId, pageNumber: lastPageNumber + 1, title: generatedTitle, width: canvasSize.width, height: canvasSize.height, canvasAssets: [], blocks: [], prompt: prompt || '' };
      
      const stepPageIds = stepPages.map(p => p.id);
      const lastStepPageIndex = pages.findIndex(p => stepPageIds.includes(p.id) && (p.pageNumber || 0) === lastPageNumber);
      let newPages;
      if (lastStepPageIndex >= 0 && lastStepPageIndex < pages.length - 1) {
        newPages = [...pages];
        newPages.splice(lastStepPageIndex + 1, 0, newPage);
      } else {
        newPages = [...pages, newPage];
      }
      
      setPages(newPages);
      saveToHistory(newPages);
      const newPageIndex = newPages.findIndex(p => p.id === newPage.id);
      if (newPageIndex >= 0) setEditingPageIndex(newPageIndex);
      setIsGenerating(false);
      setShowPromptModal(false);
      setPromptModalConfig({ type: null, phaseKey: null, stepId: null });
      const newCourseData = { ...courseData };
      Object.values(newCourseData).forEach(phase => { const step = phase.steps.find(s => s.id === selectedStepId); });
      setCourseData(newCourseData);
    }, 1500);
  };

  // 确认添加页面到特定阅读材料
  const handleConfirmAddPageToMaterial = (prompt) => {
    if (!showAddPageToMaterialModal) return;
    const { stepId, materialId } = showAddPageToMaterialModal;
    setIsGeneratingPageToMaterial(true);
    const getCanvasSize = () => canvasAspectRatio === 'A4' ? { width: 680, height: 960 } : { width: 960, height: 680 };
    const canvasSize = getCanvasSize();
    
    setTimeout(() => {
      const generatedTitle = prompt ? `AI生成：${prompt.substring(0, 20)}...` : '新页面';
      const materialPages = pages.filter(p => p.materialId === materialId && p.slideId === stepId);
      const lastPageNumber = materialPages.length > 0 ? Math.max(...materialPages.map(p => p.pageNumber || 0)) : 0;
      
      const newPage = { id: `page-${materialId}-${Date.now()}`, slideId: stepId, materialId, pageNumber: lastPageNumber + 1, title: generatedTitle, width: canvasSize.width, height: canvasSize.height, canvasAssets: [], blocks: [], prompt: prompt || '' };
      
      const materialPageIds = materialPages.map(p => p.id);
      const lastMaterialPageIndex = pages.findIndex(p => materialPageIds.includes(p.id) && (p.pageNumber || 0) === lastPageNumber);
      let newPages;
      if (lastMaterialPageIndex >= 0 && lastMaterialPageIndex < pages.length - 1) {
        newPages = [...pages];
        newPages.splice(lastMaterialPageIndex + 1, 0, newPage);
      } else {
        newPages = [...pages, newPage];
      }
      
      setPages(newPages);
      saveToHistory(newPages);
      const newPageIndex = newPages.findIndex(p => p.id === newPage.id);
      if (newPageIndex >= 0) {
        setEditingPageIndex(newPageIndex);
        setActiveStepId(stepId);
        setSelectedStepId(stepId);
        setSelectedMaterialId(materialId);
      }
      setIsGeneratingPageToMaterial(false);
      setShowAddPageToMaterialModal(null);
      const newCourseData = { ...courseData };
      Object.values(newCourseData).forEach(phase => { const step = phase.steps.find(s => s.id === stepId); });
      setCourseData(newCourseData);
    }, 1500);
  };

  // 确认添加新阅读材料
  const handleConfirmAddReadingMaterial = (prompt) => {
    if (!showAddReadingMaterialModal) return;
    const { stepId } = showAddReadingMaterialModal;
    setIsGeneratingReadingMaterial(true);
    const getCanvasSize = () => canvasAspectRatio === 'A4' ? { width: 680, height: 960 } : { width: 960, height: 680 };
    const canvasSize = getCanvasSize();
    
    setTimeout(() => {
      const generatedTitle = prompt ? `AI生成：${prompt.substring(0, 20)}...` : '新阅读材料';
      const newMaterialId = `material-${stepId}-${Date.now()}`;
      const newPage = { id: `page-${newMaterialId}-1`, slideId: stepId, materialId: newMaterialId, pageNumber: 1, title: generatedTitle, width: canvasSize.width, height: canvasSize.height, canvasAssets: [], blocks: [], prompt: prompt || '' };
      
      const newPages = [...pages, newPage];
      setPages(newPages);
      saveToHistory(newPages);
      setActiveStepId(stepId);
      setSelectedStepId(stepId);
      setSelectedMaterialId(newMaterialId);
      const newPageIndex = newPages.findIndex(p => p.id === newPage.id);
      if (newPageIndex >= 0) setEditingPageIndex(newPageIndex);
      setIsGeneratingReadingMaterial(false);
      setShowAddReadingMaterialModal(null);
      const newCourseData = { ...courseData };
      Object.values(newCourseData).forEach(phase => { const step = phase.steps.find(s => s.id === stepId); });
      setCourseData(newCourseData);
    }, 1500);
  };

  // 添加新环节
  const handleAddStep = (phaseKey) => {
    setPromptModalConfig({ type: 'session', phaseKey });
    setShowPromptModal(true);
  };

  // 确认添加新环节
  const handleConfirmAddStep = (prompt) => {
    setIsGenerating(true);
    const phaseKey = promptModalConfig.phaseKey;
    
    setTimeout(() => {
      const generatedTitle = prompt ? `AI生成：${prompt.substring(0, 20)}...` : '新页面';
      const newPage = { id: `page-${phaseKey}-${Date.now()}`, slideId: `${phaseKey}-${Date.now()}`, pageNumber: pages.length + 1, title: generatedTitle, width: 680, height: 960, canvasAssets: [], blocks: [], prompt: prompt || '' };
      
      const newPages = [...pages, newPage];
      setPages(newPages);
      saveToHistory(newPages);
      setEditingPageIndex(newPages.length - 1);
      setActiveStepId(newPage.slideId);
      setSelectedAssetId(null);
      setIsGenerating(false);
      setShowPromptModal(false);
      setPromptModalConfig({ type: null, phaseKey: null });
      
      const newCourseData = { ...courseData };
      const phase = newCourseData[phaseKey];
      if (phase) {
        const newStep = { id: newPage.slideId, title: generatedTitle, time: '00:00', objective: prompt ? `根据提示词"${prompt}"生成的内容` : '', assets: [] };
        phase.steps.push(newStep);
        setCourseData(newCourseData);
      }
    }, 1500);
  };

  // 删除环节
  const handleDeleteStep = (phaseKey, stepId) => {
    if (!confirm('确定要删除这个页面吗？此操作无法撤销。')) return;
    const pageIndex = pages.findIndex(p => p.slideId === stepId);
    if (pageIndex === -1) return;
    
    const newPages = pages.filter((p, index) => index !== pageIndex);
    const renumberedPages = newPages.map((page, index) => ({ ...page, pageNumber: index + 1 }));
    
    setPages(renumberedPages);
    saveToHistory(renumberedPages);
    
    if (pageIndex === editingPageIndex) {
      if (renumberedPages.length > 0) {
        const newIndex = pageIndex >= renumberedPages.length ? renumberedPages.length - 1 : pageIndex;
        setEditingPageIndex(newIndex);
        if (renumberedPages[newIndex]?.slideId) setActiveStepId(renumberedPages[newIndex].slideId);
      } else {
        setEditingPageIndex(null);
      }
    } else if (pageIndex < editingPageIndex) {
      setEditingPageIndex(editingPageIndex - 1);
    }
    
    setSelectedAssetId(null);
    const newCourseData = { ...courseData };
    const phase = newCourseData[phaseKey];
    if (phase) {
      phase.steps = phase.steps.filter(s => s.id !== stepId);
      setCourseData(newCourseData);
    }
  };

  // 导出PDF
  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => { setIsExporting(false); alert("PDF 导出成功！"); }, 2000);
  };

  // 删除当前页面
  const handleDeleteCurrentPage = () => {
    if (pages.length <= 1) { alert('至少需要保留一个页面！'); return; }
    const currentPage = pages[editingPageIndex];
    if (!currentPage) return;
    if (!confirm(`确定要删除当前页面吗？此操作无法撤销。`)) return;

    const newPages = pages.filter((p, index) => index !== editingPageIndex);
    const renumberedPages = newPages.map((page, index) => ({ ...page, pageNumber: index + 1 }));
    setPages(renumberedPages);
    saveToHistory(renumberedPages);
    
    if (editingPageIndex >= renumberedPages.length) setEditingPageIndex(renumberedPages.length - 1);
    else if (editingPageIndex > 0) setEditingPageIndex(editingPageIndex - 1);
    else setEditingPageIndex(0);
    
    const newCourseData = { ...courseData };
    Object.values(newCourseData).forEach(phase => { phase.steps = phase.steps.filter(step => step.id !== currentPage.slideId); });
    setCourseData(newCourseData);
  };

  // 添加资产
  const handleAddAsset = (assetType) => {
    if (editingPageIndex === null || editingPageIndex < 0 || editingPageIndex >= pages.length) {
      alert('请先选择一个页面进行编辑');
      return;
    }
    const currentPage = pages[editingPageIndex];
    if (!currentPage) { alert('当前页面不存在'); return; }
    setPromptModalConfig({ type: 'asset', pageId: currentPage.id, assetType });
    setShowPromptModal(true);
  };

  // 确认添加资产
  const handleConfirmAddAsset = (prompt, inputMode = 'ai', videoStyle = null) => {
    const { pageId, assetType: type } = promptModalConfig;
    if (!pageId || !type) return;
    
    if (type === 'text' && inputMode === 'direct') {
      const getCanvasSize = () => canvasAspectRatio === 'A4' ? { width: 680, height: 960 } : { width: 960, height: 680 };
      const canvasSize = getCanvasSize();
      const w = 400, h = 150;
      const newAsset = { id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, type, title: '文本', url: '', content: prompt || '双击编辑文本', prompt: '', referenceImage: null, x: (canvasSize.width - w) / 2, y: (canvasSize.height - h) / 2, width: w, height: h, rotation: 0, fontSize: 24, fontWeight: 'normal', color: '#1e293b', textAlign: 'center' };
      
      const newPages = pages.map(page => {
        if (page.id === pageId) return { ...page, canvasAssets: [...(page.canvasAssets || []), newAsset] };
        return page;
      });
      
      setPages(newPages);
      saveToHistory(newPages);
      setSelectedAssetId(newAsset.id);
      setShowPromptModal(false);
      setPromptModalConfig({ type: null, phaseKey: null, pageId: null, assetType: null });
      
      const updatedPage = newPages.find(p => p.id === pageId);
      if (updatedPage && updatedPage.slideId) {
        const newCourseData = { ...courseData };
        Object.values(newCourseData).forEach(phase => {
          const step = phase.steps.find(s => s.id === updatedPage.slideId);
          if (step) step.assets = updatedPage.canvasAssets || [];
        });
        setCourseData(newCourseData);
      }
      return;
    }
    
    setIsGeneratingAsset(true);
    const getCanvasSize = () => canvasAspectRatio === 'A4' ? { width: 680, height: 960 } : { width: 960, height: 680 };
    const canvasSize = getCanvasSize();
    
    setTimeout(() => {
      let w = 300, h = 200;
      if (type === 'text') { w = 400; h = 150; } else if (type === 'image') { w = 400; h = 250; }
      const generatedTitle = prompt ? `AI生成：${prompt.substring(0, 15)}...` : (type === 'text' ? '文本' : type === 'image' ? '图片' : '');
      const generatedUrl = type === 'text' ? '' : `https://placehold.co/${w}x${h}/${Math.floor(Math.random()*16777215).toString(16)}/FFF?text=AI+Gen+${Date.now().toString().slice(-4)}`;
      const generatedContent = type === 'text' ? (prompt ? `根据提示词"${prompt}"生成的文本内容` : '双击编辑文本') : '';
      const newAsset = { id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, type, title: generatedTitle, url: generatedUrl, content: generatedContent, prompt: prompt || '', referenceImage: null, videoStyle: type === 'video' ? (videoStyle || 'realistic') : null, x: (canvasSize.width - w) / 2, y: (canvasSize.height - h) / 2, width: w, height: h, rotation: 0 };
      
      if (type === 'text') { newAsset.fontSize = 24; newAsset.fontWeight = 'normal'; newAsset.color = '#1e293b'; newAsset.textAlign = 'center'; }
      
      const newPages = pages.map(page => {
        if (page.id === pageId) return { ...page, canvasAssets: [...(page.canvasAssets || []), newAsset] };
        return page;
      });
      
      setPages(newPages);
      saveToHistory(newPages);
      if (type === 'text' || type === 'image' || type === 'video') saveGenerationHistory(newAsset.id, type, generatedUrl || generatedContent, prompt);
      setSelectedAssetId(newAsset.id);
      setIsGeneratingAsset(false);
      setShowPromptModal(false);
      setPromptModalConfig({ type: null, phaseKey: null, pageId: null, assetType: null });
      
      const updatedPage = newPages.find(p => p.id === pageId);
      if (updatedPage && updatedPage.slideId) {
        const newCourseData = { ...courseData };
        Object.values(newCourseData).forEach(phase => {
          const step = phase.steps.find(s => s.id === updatedPage.slideId);
          if (step) step.assets = updatedPage.canvasAssets || [];
        });
        setCourseData(newCourseData);
      }
    }, 1500);
  };

  // 获取当前编辑页面的资产
  const currentPage = pages[editingPageIndex];
  const currentAssets = currentPage?.canvasAssets || [];
  const selectedAsset = selectedAssetId ? currentAssets.find(a => a.id === selectedAssetId) : null;

  // 处理资产变更
  const handleAssetChange = (assetId, field, value) => {
    const pageId = currentPage?.id;
    if (!pageId || !Array.isArray(pages)) return;
    const newPages = pages.map(page => {
      if (page.id === pageId) return { ...page, canvasAssets: (page.canvasAssets || []).map(asset => asset.id === assetId ? { ...asset, [field]: value } : asset) };
      return page;
    });
    setPages(newPages);
    const newCourseData = { ...courseData };
    const updatedPage = newPages.find(p => p.id === pageId);
    if (updatedPage && updatedPage.slideId) {
      Object.values(newCourseData).forEach(phase => {
        const step = phase.steps.find(s => s.id === updatedPage.slideId);
        if (step) step.assets = updatedPage.canvasAssets || [];
      });
    }
    setCourseData(newCourseData);
    saveToHistory(newPages);
  };

  // 删除资产
  const handleDeleteAsset = (assetId) => {
    if (!currentPage || !Array.isArray(pages)) return;
    const newPages = pages.map(page => {
      if (page.id === currentPage.id) return { ...page, canvasAssets: (page.canvasAssets || []).filter(a => a.id !== assetId) };
      return page;
    });
    setPages(newPages);
    setSelectedAssetId(null);
    saveToHistory(newPages);
    const newCourseData = { ...courseData };
    if (currentPage.slideId) {
      Object.values(newCourseData).forEach(phase => {
        const step = phase.steps.find(s => s.id === currentPage.slideId);
        if (step) step.assets = newPages.find(p => p.id === currentPage.id)?.canvasAssets || [];
      });
    }
    setCourseData(newCourseData);
  };

  // 复制元素
  const handleCopyAsset = (assetId) => {
    if (!currentPage || !Array.isArray(pages)) return;
    const assetToCopy = currentAssets.find(a => a.id === assetId);
    if (!assetToCopy) return;
    
    const newPages = pages.map(page => {
      if (page.id === currentPage.id) {
        const newAsset = { ...JSON.parse(JSON.stringify(assetToCopy)), id: Date.now().toString(), x: assetToCopy.x + 20, y: assetToCopy.y + 20, title: assetToCopy.title + ' (副本)' };
        return { ...page, canvasAssets: [...(page.canvasAssets || []), newAsset] };
      }
      return page;
    });
    setPages(newPages);
    const newCourseData = { ...courseData };
    if (currentPage.slideId) {
      Object.values(newCourseData).forEach(phase => {
        const step = phase.steps.find(s => s.id === currentPage.slideId);
        if (step) step.assets = newPages.find(p => p.id === currentPage.id)?.canvasAssets || [];
      });
    }
    setCourseData(newCourseData);
    saveToHistory(newPages);
    
    const newAssetId = newPages.find(p => p.id === currentPage.id)?.canvasAssets?.slice(-1)[0]?.id;
    if (newAssetId) setSelectedAssetId(newAssetId);
  };

  // 保存生成历史
  const saveGenerationHistory = (assetId, assetType, url, prompt) => {
    const historyItem = { id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, pageId: currentPage?.id, assetId, type: assetType, url, prompt: prompt || '', timestamp: new Date().toISOString(), displayTime: new Date().toLocaleString('zh-CN') };
    setGenerationHistory(prev => [historyItem, ...prev].slice(0, 100));
  };

  // 恢复历史生成内容
  const handleRestoreHistory = (historyItem) => {
    if (!currentPage || !Array.isArray(pages)) return;
    const newPages = pages.map(page => {
      if (page.id === currentPage.id) {
        return { ...page, canvasAssets: (page.canvasAssets || []).map(asset => {
          if (asset.id === historyItem.assetId) {
            if (asset.type === 'text') return { ...asset, content: historyItem.url, prompt: historyItem.prompt || asset.prompt };
            else if (asset.type === 'image' || asset.type === 'video') return { ...asset, url: historyItem.url, prompt: historyItem.prompt || asset.prompt };
          }
          return asset;
        }) };
      }
      return page;
    });
    setPages(newPages);
    saveToHistory(newPages);
    setShowHistoryModal(null);
    const newCourseData = { ...courseData };
    if (currentPage.slideId) {
      Object.values(newCourseData).forEach(phase => {
        const step = phase.steps.find(s => s.id === currentPage.slideId);
        if (step) step.assets = newPages.find(p => p.id === currentPage.id)?.canvasAssets || [];
      });
    }
    setCourseData(newCourseData);
  };

  // 重新生成资产
  const handleRegenerateAsset = (assetId) => {
    if (!currentPage || !Array.isArray(pages)) return;
    const asset = currentAssets.find(a => a.id === assetId);
    if (!asset) return;
    
    if (asset.type === 'text' && asset.content) saveGenerationHistory(assetId, asset.type, asset.content, asset.prompt);
    else if ((asset.type === 'image' || asset.type === 'video' || asset.type === 'audio') && asset.url) saveGenerationHistory(assetId, asset.type, asset.url, asset.prompt);
    
    setGeneratingAssetId(assetId);
    
    setTimeout(() => {
      const newPages = pages.map(page => {
        if (page.id === currentPage.id) {
          const assets = (page.canvasAssets || []).map(a => {
            if (a.id === assetId) {
              if (a.type === 'text') {
                const generatedText = a.prompt ? `根据提示词"${a.prompt}"重新生成的文本内容 (v${Date.now().toString().slice(-4)})` : `重新生成的文本内容 (v${Date.now().toString().slice(-4)})`;
                return { ...a, content: generatedText };
              } else if (a.type === 'image' || a.type === 'video') {
                const randomColor = Math.floor(Math.random()*16777215).toString(16);
                const text = a.referenceImage ? 'AI+Ref+Gen' : 'AI+Gen';
                const w = a.width || 300;
                const h = a.height || 200;
                return { ...a, url: `https://placehold.co/${Math.round(w)}x${Math.round(h)}/${randomColor}/FFF?text=${text}+v${Math.floor(Math.random() * 10)}` };
              } else if (a.type === 'audio') {
                const randomColor = Math.floor(Math.random()*16777215).toString(16);
                return { ...a, url: `https://placehold.co/300x100/${randomColor}/FFF?text=AI+Audio+v${Math.floor(Math.random() * 10)}` };
              }
            }
            return a;
          });
          return { ...page, canvasAssets: assets };
        }
        return page;
      });
      setPages(newPages);
      saveToHistory(newPages);
      setGeneratingAssetId(null);
      
      const newCourseData = { ...courseData };
      const updatedPage = newPages.find(p => p.id === currentPage.id);
      if (updatedPage && updatedPage.slideId) {
        Object.values(newCourseData).forEach(phase => {
          const step = phase.steps.find(s => s.id === updatedPage.slideId);
          if (step) step.assets = updatedPage.canvasAssets || [];
        });
      }
      setCourseData(newCourseData);
    }, 2000);
  };

  // 处理参考图片上传
  const handleReferenceUpload = (e, assetId) => {
    const file = e.target.files[0];
    if (file && currentPage) {
      const reader = new FileReader();
      reader.onloadend = () => { handleAssetChange(assetId, 'referenceImage', reader.result); };
      reader.readAsDataURL(file);
    }
  };

  // 图层操作
  const handleLayerChange = (assetId, action) => {
    if (!currentPage || !Array.isArray(pages)) return;
    const newPages = pages.map(page => {
      if (page.id === currentPage.id) {
        const assets = [...(page.canvasAssets || [])];
        const index = assets.findIndex(a => a.id === assetId);
        if (index === -1) return page;
        if (action === 'front') assets.push(assets.splice(index, 1)[0]);
        else if (action === 'back') assets.unshift(assets.splice(index, 1)[0]);
        else if (action === 'forward' && index < assets.length - 1) [assets[index], assets[index + 1]] = [assets[index + 1], assets[index]];
        else if (action === 'backward' && index > 0) [assets[index], assets[index - 1]] = [assets[index - 1], assets[index]];
        return { ...page, canvasAssets: assets };
      }
      return page;
    });
    setPages(newPages);
    saveToHistory(newPages);
    const newCourseData = { ...courseData };
    if (currentPage.slideId) {
      Object.values(newCourseData).forEach(phase => {
        const step = phase.steps.find(s => s.id === currentPage.slideId);
        if (step) step.assets = newPages.find(p => p.id === currentPage.id)?.canvasAssets || [];
      });
    }
    setCourseData(newCourseData);
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({ exportPDF: handleExportPDF, isExporting }));

  // 保存到页面历史
  const saveCurrentToPageHistory = () => {
    if (!currentPage) return;
    const historyItem = {
      id: `page-history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pageId: currentPage.id,
      data: JSON.parse(JSON.stringify({ title: currentPage.title, canvasAssets: currentPage.canvasAssets || [] })),
      timestamp: new Date().toISOString(),
      displayTime: new Date().toLocaleString('zh-CN')
    };
    setPageHistory(prev => [historyItem, ...prev].slice(0, 50));
    setShowPageHistoryModal(true);
  };

  // 准备重新生成
  const prepareForRegenerate = () => {
    if (!currentPage) return;
    const historyItem = {
      id: `page-history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pageId: currentPage.id,
      data: JSON.parse(JSON.stringify({ title: currentPage.title, canvasAssets: currentPage.canvasAssets || [] })),
      timestamp: new Date().toISOString(),
      displayTime: new Date().toLocaleString('zh-CN')
    };
    setPageHistory(prev => [historyItem, ...prev].slice(0, 50));
    setShowRegeneratePageModal(true);
  };

  // 恢复页面历史版本
  const restorePageHistoryVersion = (historyItem) => {
    if (!currentPage) return;
    const newPages = pages.map(page => {
      if (page.id === currentPage.id) {
        return {
          ...page,
          title: historyItem.data.title,
          canvasAssets: JSON.parse(JSON.stringify(historyItem.data.canvasAssets || []))
        };
      }
      return page;
    });
    setPages(newPages);
    saveToHistory(newPages);
    const newCourseData = { ...courseData };
    const updatedPage = newPages.find(p => p.id === currentPage.id);
    if (updatedPage && updatedPage.slideId) {
      Object.values(newCourseData).forEach(phase => {
        const step = phase.steps.find(s => s.id === updatedPage.slideId);
        if (step) step.assets = updatedPage.canvasAssets || [];
      });
    }
    setCourseData(newCourseData);
    setShowPageHistoryModal(false);
  };

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* LEFT SIDEBAR */}
      <ReadingMaterialCanvasViewLeftSidebar
        courseData={courseData}
        expandedPhases={expandedPhases}
        activeStepId={activeStepId}
        selectedMaterialId={selectedMaterialId}
        pages={pages}
        onTogglePhase={togglePhase}
        onStepClick={handleStepClick}
        onAddStep={handleAddStep}
        onDeleteStep={handleDeleteStep}
        onSelectMaterial={setSelectedMaterialId}
        onAddReadingMaterial={setShowAddReadingMaterialModal}
        onAddPageToMaterial={setShowAddPageToMaterialModal}
        isLeftOpen={isLeftOpen}
        onLeftToggle={() => setIsLeftOpen(false)}
      />
      {!isLeftOpen && (
        <button onClick={() => setIsLeftOpen(true)} className="absolute top-4 left-0 bg-white p-2 rounded-r-md border border-l-0 border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 z-50">
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* MAIN CONTENT - 画布编辑器 */}
      <main className="flex-1 flex flex-col bg-slate-100 relative overflow-hidden">
        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center gap-4 min-w-0">
            {!isLeftOpen && (
              <>
                <button onClick={() => setIsLeftOpen(true)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded transition-colors" title="展开页面列表">
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="font-bold text-slate-700 flex items-center gap-2 mr-4">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs">阅读材料</span>
                </div>
              </>
            )}
            <span className="text-sm font-medium text-slate-500 whitespace-nowrap">当前编辑:</span>
            {selectedMaterialId && pages[editingPageIndex] && (
              <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-medium whitespace-nowrap">阅读材料</span>
            )}
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold whitespace-nowrap">
              页面 {(() => { if (!pages[editingPageIndex]) return 1; const filteredIndex = filteredPages.findIndex(p => p.id === pages[editingPageIndex].id); return filteredIndex >= 0 ? filteredIndex + 1 : 1; })()} / {filteredPages.length || 1}
            </span>
            {pages[editingPageIndex] && (
              <h2 className="text-sm font-bold text-slate-800 truncate" title={pages[editingPageIndex].title}>{pages[editingPageIndex].title || `页面 ${editingPageIndex + 1}`}</h2>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={handleUndo} disabled={historyIndex === 0} className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="撤销 (Ctrl+Z)">
              <RotateCcw className="w-4 h-4" />
            </button>
            <button onClick={handleRedo} disabled={historyIndex === history.length - 1} className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="重做 (Ctrl+Shift+Z)">
              <RotateCw className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-slate-200"></div>
            {editingPageIndex !== null && (
              <>
                <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                  <button onClick={() => setCanvasAspectRatio('A4')} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${canvasAspectRatio === 'A4' ? 'bg-white text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} title="A4 竖版">A4 竖版</button>
                  <button onClick={() => setCanvasAspectRatio('A4横向')} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${canvasAspectRatio === 'A4横向' ? 'bg-white text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`} title="A4 横版">A4 横版</button>
                </div>
              </>
            )}
          </div>
        </div>
        
        {editingPageIndex !== null && (
          <div style={{left: '65%'}} className="absolute top-20 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur shadow-lg rounded-full px-4 py-2 flex gap-3 border border-slate-200 z-20 transition-all">
            <button onClick={() => handleAddAsset('text')} className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-blue-600 transition-colors" title="添加文本">
              <Wand2 className="w-5 h-5" />
              <span className="text-[9px] font-bold">文本</span>
            </button>
            <div className="w-px bg-slate-200 h-8"></div>
            <button onClick={() => handleAddAsset('image')} className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-purple-600 transition-colors" title="添加图片">
              <ImageIcon className="w-5 h-5" />
              <span className="text-[9px] font-bold">图片</span>
            </button>
          </div>
        )}
        
        {/* Canvas Editor */}
        <div className="flex-1 overflow-auto relative">
          {filteredPages.length > 0 ? (
            <ReadingMaterialEditor
              pages={filteredPages}
              onPagesChange={(updater) => {
                const updatedFilteredPages = typeof updater === 'function' ? updater(filteredPages) : updater;
                if (!Array.isArray(updatedFilteredPages)) { console.error('onPagesChange must return an array'); return; }
                const updatedPages = pages.map(page => { const updatedPage = updatedFilteredPages.find(p => p.id === page.id); return updatedPage || page; });
                updatedFilteredPages.forEach(updatedPage => { if (!pages.find(p => p.id === updatedPage.id)) updatedPages.push(updatedPage); });
                setPages(updatedPages);
                saveToHistory(updatedPages);
                const newCourseData = { ...courseData };
                updatedPages.forEach(page => { if (page.slideId) { Object.values(newCourseData).forEach(phase => { const step = phase.steps.find(s => s.id === page.slideId); if (step) step.assets = page.canvasAssets || []; }); } });
                setCourseData(newCourseData);
              }}
              editingPageIndex={(() => { if (!pages[editingPageIndex]) return 0; const filteredIndex = filteredPages.findIndex(p => p.id === pages[editingPageIndex].id); return filteredIndex >= 0 ? filteredIndex : 0; })()}
              onEditingPageIndexChange={(newIndex) => {
                if (newIndex >= 0 && newIndex < filteredPages.length) {
                  const targetPage = filteredPages[newIndex];
                  const actualIndex = pages.findIndex(p => p.id === targetPage.id);
                  if (actualIndex >= 0) setEditingPageIndex(actualIndex);
                  else if (filteredPages.length > 0) { const firstIndex = pages.findIndex(p => p.id === filteredPages[0].id); if (firstIndex >= 0) setEditingPageIndex(firstIndex); }
                }
              }}
              canvasAspectRatio={canvasAspectRatio}
              onCanvasAspectRatioChange={setCanvasAspectRatio}
              selectedAssetId={selectedAssetId}
              onSelectedAssetIdChange={setSelectedAssetId}
              onCopyAsset={handleCopyAsset}
              onDeleteAsset={handleDeleteAsset}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">暂无页面</p>
                <p className="text-sm mt-2">请在左侧目录中选择页面进行编辑</p>
              </div>
            </div>
          )}
          
          {selectedStepId && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30" style={{left: '67%'}}>
              <button onClick={handleAddPageToStep} className="px-6 py-3 bg-white border-2 border-indigo-300 text-indigo-600 rounded-full shadow-lg hover:bg-indigo-50 hover:border-indigo-400 transition-all flex items-center gap-2 font-bold text-sm" title="在此环节末尾添加新页面">
                <Copy className="w-5 h-5" />
                在末尾添加新页面
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 右侧编辑面板 */}
      {editingPageIndex !== null && (
        <aside className={`${isRightOpen ? 'w-96' : 'w-0'} bg-white border-l border-slate-200 flex flex-col shrink-0 z-10 shadow-[0_0_15px_rgba(0,0,0,0.05)] transition-all duration-300 relative`}>
          {!isRightOpen && (
            <button onClick={() => setIsRightOpen(true)} className="absolute top-4 right-0 bg-white p-2 rounded-l-md border border-r-0 border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 z-50 transform -translate-x-full" title="展开面板">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
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
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-purple-600" />页面详情编辑
                  </h3>
                  <button onClick={() => setIsRightOpen(false)} className="text-slate-400 hover:text-slate-600" title="收起面板">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-500 uppercase">画板元素 ({(currentPage?.canvasAssets || []).length})</label>
                  </div>
                  <div className="space-y-2">
                    {(currentPage?.canvasAssets || []).map((asset) => (
                      <div key={asset.id} onClick={() => setSelectedAssetId(asset.id)} className="flex items-start gap-2 p-2 border border-slate-200 rounded bg-white hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all group">
                        <div className="mt-1 text-slate-400">{getAssetIcon(asset.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-700 truncate">{asset.title || asset.type}</div>
                          <div className="text-[10px] text-slate-400">{asset.type} • 点击编辑</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="pt-6 mt-6 border-t border-slate-100 flex gap-2">
                    <button onClick={saveCurrentToPageHistory} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded text-sm font-bold hover:bg-slate-200 flex items-center justify-center gap-2 transition-all">
                      <History className="w-4 h-4" />历史生成
                    </button>
                    <button onClick={prepareForRegenerate} className="flex-1 py-2 bg-purple-600 text-white rounded text-sm font-bold shadow hover:bg-purple-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                      <RefreshCw className="w-4 h-4" />重新生成
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>
      )}

      {/* 页面历史生成列表模态框 */}
      {showPageHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white"><History className="w-5 h-5" /></div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">历史生成列表 - 页面内容</h3>
                  <p className="text-xs text-slate-500 mt-1">{currentPage?.title || '当前页面'}</p>
                </div>
              </div>
              <button onClick={() => setShowPageHistoryModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {pageHistory.filter(h => h.pageId === currentPage?.id).length === 0 ? (
                <div className="text-center py-12 text-slate-400"><History className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>暂无历史生成记录</p></div>
              ) : (
                <div className="space-y-3">
                  {pageHistory.filter(h => h.pageId === currentPage?.id).map((historyItem) => (
                    <div key={historyItem.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2"><span className="text-xs font-medium text-slate-500">{historyItem.displayTime}</span></div>
                          <div className="text-sm text-slate-700 mb-2">
                            <div className="font-semibold">{historyItem.data.title}</div>
                            <div className="text-xs text-slate-500 mt-1">素材数量: {historyItem.data.canvasAssets?.length || 0}</div>
                          </div>
                        </div>
                        <button onClick={() => restorePageHistoryVersion(historyItem)} className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 transition-colors">恢复此版本</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Prompt Input Modal */}
      <PromptInputModal
        isOpen={showPromptModal}
        onClose={() => { setShowPromptModal(false); setPromptModalConfig({ type: null, phaseKey: null, pageId: null, assetType: null }); }}
        onConfirm={(prompt, inputMode, videoStyle) => {
          if (promptModalConfig.type === 'asset') handleConfirmAddAsset(prompt, inputMode, videoStyle);
          else if (promptModalConfig.type === 'page' && promptModalConfig.stepId) handleConfirmAddPageToStep(prompt);
          else handleConfirmAddStep(prompt);
        }}
        title={promptModalConfig.type === 'asset' ? `添加${promptModalConfig.assetType === 'image' ? '图片' : '文本'}元素` : promptModalConfig.stepId ? '在末尾添加新页面' : '添加新页面'}
        description={promptModalConfig.type === 'asset' ? (promptModalConfig.assetType === 'text' ? '选择直接输入文本内容或使用AI生成文本' : '请输入AI生成提示词，描述你想要创建的元素（可选，留空将使用默认生成）') : '请输入AI生成提示词，描述你想要创建的页面内容（可选，留空将使用默认标题）'}
        placeholder={promptModalConfig.type === 'asset' ? `例如：${promptModalConfig.assetType === 'image' ? '生成一张关于动物的图片' : '输入文本内容或AI生成提示词'}...` : '例如：创建一个关于颜色词汇的阅读页面，包含图片和文字...'}
        type={promptModalConfig.type === 'asset' ? 'element' : 'session'}
        assetType={promptModalConfig.assetType}
        isLoading={promptModalConfig.type === 'asset' ? isGeneratingAsset : isGenerating}
      />

      <PromptInputModal
        isOpen={showRegeneratePageModal}
        onClose={() => setShowRegeneratePageModal(false)}
        onConfirm={(prompt) => {
          setIsRegeneratingPage(true);
          setTimeout(() => {
            const currentPageData = pages.find(p => p.id === activeStepId);
            if (currentPageData) {
              const newPages = pages.map(page => page.id === currentPageData.id ? { ...page, title: prompt ? `重新生成：${prompt.substring(0, 20)}...` : page.title } : page);
              setPages(newPages);
              saveToHistory(newPages);
            }
            setIsRegeneratingPage(false);
            setShowRegeneratePageModal(false);
          }, 1500);
        }}
        title="重新生成页面"
        description="请输入AI生成提示词，描述你想要重新生成的页面内容（可选，留空将使用默认生成）"
        placeholder="例如：重新生成一个关于颜色词汇的阅读页面，包含图片和文字..."
        type="session"
        isLoading={isRegeneratingPage}
      />

      {showAddReadingMaterialModal && (
        <PromptInputModal
          isOpen={!!showAddReadingMaterialModal}
          onClose={() => setShowAddReadingMaterialModal(null)}
          onConfirm={handleConfirmAddReadingMaterial}
          title="新增阅读材料"
          description="请输入AI生成提示词，描述你想要创建的阅读材料内容"
          placeholder="例如：创建一份关于动物主题的阅读材料，包含图片和练习题..."
          type="session"
          isLoading={isGeneratingReadingMaterial}
        />
      )}

      {showAddPageToMaterialModal && (
        <PromptInputModal
          isOpen={!!showAddPageToMaterialModal}
          onClose={() => setShowAddPageToMaterialModal(null)}
          onConfirm={handleConfirmAddPageToMaterial}
          title="新增页面"
          description="请输入AI生成提示词，描述你想要创建的页面内容"
          placeholder="例如：创建一个关于颜色词汇的阅读页面，包含图片和文字..."
          type="session"
          isLoading={isGeneratingPageToMaterial}
        />
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white"><History className="w-5 h-5" /></div>
                <div><h3 className="font-bold text-lg text-slate-800">历史生成列表 - {showHistoryModal.assetType === 'image' ? '图片' : showHistoryModal.assetType === 'video' ? '视频' : showHistoryModal.assetType === 'text' ? '文本' : ''}</h3></div>
              </div>
              <button onClick={() => setShowHistoryModal(null)} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {generationHistory.filter(h => h.pageId === currentPage?.id && h.assetId === showHistoryModal.assetId && h.type === showHistoryModal.assetType).length === 0 ? (
                <div className="text-center py-12 text-slate-400"><History className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>暂无历史生成记录</p></div>
              ) : (
                <div className="space-y-3">
                  {generationHistory.filter(h => h.pageId === currentPage?.id && h.assetId === showHistoryModal.assetId && h.type === showHistoryModal.assetType).map((historyItem) => (
                    <div key={historyItem.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2"><span className="text-xs font-medium text-slate-500">{historyItem.displayTime}</span></div>
                          {(historyItem.type === 'image' || historyItem.type === 'video') && <img src={historyItem.url} alt="历史生成" className="w-full h-32 object-cover rounded border border-slate-200 mb-2" />}
                          {historyItem.type === 'text' && <div className="bg-slate-50 rounded border border-slate-200 p-3 mb-2"><p className="text-sm text-slate-700 whitespace-pre-wrap">{historyItem.url || historyItem.content || '(空内容)'}</p></div>}
                          {historyItem.prompt && <p className="text-xs text-slate-600 bg-slate-50 rounded p-2 mt-2">提示词: {historyItem.prompt}</p>}
                        </div>
                        <button onClick={() => handleRestoreHistory(historyItem)} className="ml-4 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"><RefreshCw className="w-3 h-3" />恢复</button>
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
