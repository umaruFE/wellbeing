import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { 
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  RotateCcw,
  RotateCw,
  Copy,
  Download,
  RefreshCw,
  FileText,
  FileX,
  Check,
  X,
  Layers,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Wand2,
  Upload,
  Sliders,
  Trash2,
  Image as ImageIcon,
  Type,
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  History
} from 'lucide-react';
import { ReadingMaterialEditor } from './ReadingMaterialEditor';
import { INITIAL_COURSE_DATA, READING_TEST_DATA } from '../constants';
import { getAssetIcon } from '../utils';
import { PromptInputModal } from './PromptInputModal';

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
  const [canvasAspectRatio, setCanvasAspectRatio] = useState('A4'); // 'A4' | 'A4横向'
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [generatingAssetId, setGeneratingAssetId] = useState(null);
  
  // 提示词输入模态框状态
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptModalConfig, setPromptModalConfig] = useState({ type: null, phaseKey: null, pageId: null, assetType: null });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingAsset, setIsGeneratingAsset] = useState(false);
  
  // 历史生成记录
  const [generationHistory, setGenerationHistory] = useState([]); // [{ pageId, assetId, type, url, prompt, timestamp }]
  const [showHistoryModal, setShowHistoryModal] = useState(null); // { assetId, assetType }
  
  // 撤销/重做功能 - 存储pages数据
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // 当navigation变化时，重置数据：如果navigation为null，清空并加载测试数据；如果有navigation，使用INITIAL_COURSE_DATA
  useEffect(() => {
    if (!navigation) {
      // 直接点击进入：清空所有状态，加载测试数据
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
      // pages 会在下面的 useEffect 中重新初始化
    } else {
      // 从表格跳转：使用INITIAL_COURSE_DATA
      setCourseData(INITIAL_COURSE_DATA);
      setExpandedPhases(Object.keys(INITIAL_COURSE_DATA));
    }
  }, [navigation]);

  // 初始化pages - 根据是否有navigation决定使用哪个数据源
  const initializePages = (dataSource) => {
    const allSteps = Object.values(dataSource).flatMap(phase => 
      phase.steps.map(step => ({ ...step, phaseKey: Object.keys(dataSource).find(k => dataSource[k].steps.includes(step)) }))
    );
    
    return allSteps.map((step, index) => {
      const rawAssets = step.assets || [];
      
      // 如果是原始 PPT 数据（没有文本排版），为其生成阅读材料模板
      if (rawAssets.length <= 1 && !rawAssets.some(a => a.type === 'text')) {
        return {
          id: `page-${step.id}`,
          slideId: step.id,
          pageNumber: index + 1,
          title: step.title,
          width: 680,
          height: 960,
          canvasAssets: [
            {
              id: `asset-title-${step.id}`,
              type: 'text',
              title: '标题',
              content: step.title,
              x: 50, y: 40, width: 580, height: 70,
              rotation: 0, fontSize: 28, fontWeight: 'bold', textAlign: 'center'
            },
            {
              id: `asset-image-${step.id}`,
              type: 'image',
              title: '插图',
              url: rawAssets.find(a => a.type === 'image')?.url || `https://placehold.co/400x250/6366f1/FFF?text=${encodeURIComponent(step.title.substring(0, 10))}`,
              x: 140, y: 120, width: 400, height: 250,
              rotation: 0
            },
            {
              id: `asset-content-${step.id}`,
              type: 'text',
              title: '正文',
              content: `【${step.title}】\n\n${step.objective || '本环节核心教学内容...'}\n\n• 活动：${step.activity || '暂无活动描述'}\n• 目标：${step.objective || '暂无目标描述'}`,
              x: 50, y: 390, width: 580, height: 520,
              rotation: 0, fontSize: 16, lineHeight: 1.6
            },
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
        canvasAssets: rawAssets.map(asset => ({
          ...asset,
          prompt: asset.prompt || '',
          referenceImage: asset.referenceImage || null
        })),
        blocks: []
      };
    });
  };

  const [pages, setPages] = useState(() => initializePages(READING_TEST_DATA));
  const [editingPageIndex, setEditingPageIndex] = useState(0);
  
  const [selectedStepId, setSelectedStepId] = useState(null); // 当前选中的环节ID，用于过滤pages
  
  // 根据selectedStepId过滤显示的pages
  const filteredPages = selectedStepId 
    ? pages.filter(page => page.slideId === selectedStepId)
    : pages;

  // 初始化历史记录和selectedStepId
  useEffect(() => {
    if (pages.length > 0 && history.length === 0) {
      setHistory([JSON.parse(JSON.stringify(pages))]);
      setHistoryIndex(0);
    }
    
    // 如果没有选中环节，默认选中第一个页面对应的环节
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
    // 使用courseData作为数据源
    const allSteps = Object.values(courseData).flatMap(phase => 
      phase.steps.map(step => ({ ...step, phaseKey: Object.keys(courseData).find(k => courseData[k].steps.includes(step)) }))
    );
    
    let newPages = allSteps.map((step, index) => {
      // 检查是否已经有了排版好的资产（通过检查是否有特定的ID前缀或多个资产）
      const rawAssets = step.assets || [];
      const hasReadingLayout = rawAssets.some(a => a.id && (a.id.includes('title') || a.id.includes('content') || a.id.includes('asset-')));

      // 如果是原始 PPT 数据（通常只有一个 asset 且没有文本排版），为其生成阅读材料模板
      if (rawAssets.length <= 1 && !rawAssets.some(a => a.type === 'text')) {
        const titleAsset = {
          id: `asset-title-${step.id}`,
          type: 'text',
          title: '标题',
          content: step.title,
          x: 50,
          y: 40,
          width: 580,
          height: 70,
          rotation: 0,
          fontSize: 28,
          fontWeight: 'bold',
          textAlign: 'center',
          prompt: ''
        };

        const imageAsset = {
          id: `asset-image-${step.id}`,
          type: 'image',
          title: '插图',
          // 优先使用原始数据中的图片，如果没有则用占位图
          url: rawAssets.find(a => a.type === 'image')?.url || `https://placehold.co/400x250/6366f1/FFF?text=${encodeURIComponent(step.title.substring(0, 10))}`,
          x: 140,
          y: 120,
          width: 400,
          height: 250,
          rotation: 0,
          prompt: ''
        };

        const contentAsset = {
          id: `asset-content-${step.id}`,
          type: 'text',
          title: '正文',
          content: `【${step.title}】\n\n${step.objective || '本环节核心教学内容...'}\n\n• 活动：${step.activity || '暂无活动描述'}\n• 目标：${step.objective || '暂无目标描述'}`,
          x: 50,
          y: 390,
          width: 580,
          height: 520,
          rotation: 0,
          fontSize: 16,
          lineHeight: 1.6,
          prompt: ''
        };

        // 保留非图片非文字的资产（如音频/视频）
        const extraAssets = rawAssets.filter(a => a.type !== 'image' && a.type !== 'text');

        return {
          id: `page-${step.id}`,
          slideId: step.id,
          pageNumber: index + 1,
          title: step.title,
          width: 680,
          height: 960,
          canvasAssets: [titleAsset, imageAsset, contentAsset, ...extraAssets],
          blocks: []
        };
      }

      // 如果已经是阅读材料格式，则保持原样
      return {
        id: `page-${step.id}`,
        slideId: step.id,
        pageNumber: index + 1,
        title: step.title,
        width: 680,
        height: 960,
        canvasAssets: rawAssets.map(a => ({
          ...a,
          prompt: a.prompt || '',
          referenceImage: a.referenceImage || null
        })),
        blocks: []
      };
    });
    
    // 如果从表格视图跳转，且有navigation.slideId，定位到该环节
    if (navigation?.type === 'reading-material' && navigation?.slideId) {
      const slideIdStr = typeof navigation.slideId === 'string' ? navigation.slideId : String(navigation.slideId);
      
      // 如果导航中携带了具体的材料数据，使用该数据替换默认生成的页面
      if (navigation.material && navigation.material.pages) {
        // 移除原有的该环节页面
        newPages = newPages.filter(p => p.slideId !== slideIdStr);
        // 添加材料中的实际页面
        const materialPages = navigation.material.pages.map(p => ({
          ...p,
          slideId: slideIdStr
        }));
        // 插入到原本的位置
        newPages = [...newPages, ...materialPages];
      }

      setPages(newPages);
      setSelectedStepId(slideIdStr);
      setActiveStepId(slideIdStr);
      
      // 找到该环节的第一个页面
      const stepPages = newPages.filter(p => p.slideId === slideIdStr);
      if (stepPages.length > 0) {
        const pageIndex = newPages.findIndex(p => p.id === stepPages[0].id);
        if (pageIndex >= 0) {
          setEditingPageIndex(pageIndex);
        } else {
          setEditingPageIndex(0);
        }
      } else {
        setEditingPageIndex(0);
      }
    } else {
      // 直接点击进入：显示所有页面，默认选中第一个
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
    
    // 重置历史记录
    setHistory([JSON.parse(JSON.stringify(newPages))]);
    setHistoryIndex(0);
  }, [navigation, courseData]);


  // 保存历史记录 - 保存pages数据而不是courseData
  const saveToHistory = (newPages) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newPages)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // 撤销
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setPages(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };

  // 重做
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
    setSelectedStepId(stepId); // 设置选中的环节ID，用于过滤pages
    
    // 找到该环节对应的第一个页面索引并切换到该页面
    const stepPages = pages.filter(p => p.slideId === stepId);
    if (stepPages.length > 0) {
      const pageIndex = pages.findIndex(p => p.id === stepPages[0].id);
      if (pageIndex >= 0) {
        setEditingPageIndex(pageIndex);
      }
    } else {
      // 如果该环节没有页面，重置编辑索引
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
    
    // 计算画布尺寸
    const getCanvasSize = () => {
      if (canvasAspectRatio === 'A4') {
        return { width: 680, height: 960 };
      } else {
        return { width: 960, height: 680 };
      }
    };
    const canvasSize = getCanvasSize();
    
    setTimeout(() => {
      const generatedTitle = prompt 
        ? `AI生成：${prompt.substring(0, 20)}...` 
        : '新页面';
      
      // 找到该环节的最后一个页面，确定新页面的编号
      const stepPages = pages.filter(p => p.slideId === selectedStepId);
      const lastPageNumber = stepPages.length > 0 
        ? Math.max(...stepPages.map(p => p.pageNumber || 0))
        : 0;
      
      const newPage = {
        id: `page-${selectedStepId}-${Date.now()}`,
        slideId: selectedStepId,
        pageNumber: lastPageNumber + 1,
        title: generatedTitle,
        width: canvasSize.width,
        height: canvasSize.height,
        canvasAssets: [],
        blocks: [],
        prompt: prompt || ''
      };
      
      // 将新页面添加到pages数组的末尾（或者插入到该环节的最后一个页面之后）
      const stepPageIds = stepPages.map(p => p.id);
      const lastStepPageIndex = pages.findIndex(p => stepPageIds.includes(p.id) && 
        (p.pageNumber || 0) === lastPageNumber);
      
      let newPages;
      if (lastStepPageIndex >= 0 && lastStepPageIndex < pages.length - 1) {
        // 插入到该环节最后一个页面之后
        newPages = [...pages];
        newPages.splice(lastStepPageIndex + 1, 0, newPage);
      } else {
        // 添加到末尾
        newPages = [...pages, newPage];
      }
      
      setPages(newPages);
      saveToHistory(newPages);
      
      // 切换到新添加的页面
      const newPageIndex = newPages.findIndex(p => p.id === newPage.id);
      if (newPageIndex >= 0) {
        setEditingPageIndex(newPageIndex);
      }
      
      setIsGenerating(false);
      setShowPromptModal(false);
      setPromptModalConfig({ type: null, phaseKey: null, stepId: null });
      
      // 同步更新courseData
      const newCourseData = { ...courseData };
      Object.values(newCourseData).forEach(phase => {
        const step = phase.steps.find(s => s.id === selectedStepId);
        if (step) {
          // 更新step的assets（如果需要）
          // 这里可以根据需要同步数据
        }
      });
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
    
    // 模拟AI生成（实际应该调用API）
    setTimeout(() => {
      const generatedTitle = prompt ? `AI生成：${prompt.substring(0, 20)}...` : '新页面';
      
      // 创建新页面，格式与TableView一致
    const newPage = {
        id: `page-${phaseKey}-${Date.now()}`,
        slideId: `${phaseKey}-${Date.now()}`,
      pageNumber: pages.length + 1,
        title: generatedTitle,
        width: 680, // 使用TableView的格式
      height: 960,
        canvasAssets: [],
        blocks: [],
        prompt: prompt || ''
    };
      
    const newPages = [...pages, newPage];
    setPages(newPages);
    saveToHistory(newPages);
      setEditingPageIndex(newPages.length - 1);
      setActiveStepId(newPage.slideId);
      setSelectedAssetId(null);
      setIsGenerating(false);
      setShowPromptModal(false);
      setPromptModalConfig({ type: null, phaseKey: null });
      
      // 同时更新courseData（向后兼容）
      const newCourseData = { ...courseData };
      const phase = newCourseData[phaseKey];
      if (phase) {
        const newStep = {
          id: newPage.slideId,
          title: generatedTitle,
          time: '00:00',
          objective: prompt ? `根据提示词"${prompt}"生成的内容` : '',
          assets: []
        };
        phase.steps.push(newStep);
        setCourseData(newCourseData);
      }
    }, 1500);
  };

  // 删除环节
  const handleDeleteStep = (phaseKey, stepId) => {
    if (!confirm('确定要删除这个页面吗？此操作无法撤销。')) {
      return;
    }
    
    // 找到要删除的页面索引
    const pageIndex = pages.findIndex(p => p.slideId === stepId);
    if (pageIndex === -1) return;
    
    // 从pages中删除
    const newPages = pages.filter((p, index) => index !== pageIndex);
    const renumberedPages = newPages.map((page, index) => ({
      ...page,
      pageNumber: index + 1
    }));
    
    setPages(renumberedPages);
    saveToHistory(renumberedPages);
    
    // 如果删除的是当前页面，切换到其他页面
    if (pageIndex === editingPageIndex) {
      if (renumberedPages.length > 0) {
        const newIndex = pageIndex >= renumberedPages.length ? renumberedPages.length - 1 : pageIndex;
        setEditingPageIndex(newIndex);
        if (renumberedPages[newIndex]?.slideId) {
          setActiveStepId(renumberedPages[newIndex].slideId);
        }
      } else {
        setEditingPageIndex(null);
      }
    } else if (pageIndex < editingPageIndex) {
      // 如果删除的页面在当前页面之前，需要调整编辑索引
      setEditingPageIndex(editingPageIndex - 1);
    }
    
    setSelectedAssetId(null);
    
    // 同步更新courseData
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
    setTimeout(() => {
      setIsExporting(false);
      alert("PDF 导出成功！");
    }, 2000);
  };

  // 删除当前页面
  const handleDeleteCurrentPage = () => {
    if (pages.length <= 1) {
      alert('至少需要保留一个页面！');
      return;
    }
    
    const currentPage = pages[editingPageIndex];
    if (!currentPage) return;
    
    if (!confirm(`确定要删除当前页面吗？此操作无法撤销。`)) {
      return;
    }

    const newPages = pages.filter((p, index) => index !== editingPageIndex);
    // 重新编号
    const renumberedPages = newPages.map((page, index) => ({
      ...page,
      pageNumber: index + 1
    }));

    setPages(renumberedPages);
    saveToHistory(renumberedPages);
    
    // 调整编辑索引
    if (editingPageIndex >= renumberedPages.length) {
      setEditingPageIndex(renumberedPages.length - 1);
    } else if (editingPageIndex > 0) {
      setEditingPageIndex(editingPageIndex - 1);
    } else {
      setEditingPageIndex(0);
    }
    
    // 同步更新courseData
    const newCourseData = { ...courseData };
    Object.values(newCourseData).forEach(phase => {
      phase.steps = phase.steps.filter(step => step.id !== currentPage.slideId);
    });
    setCourseData(newCourseData);
  };

  // 完成编辑
  const handleFinishEditing = () => {
    setEditingPageIndex(null);
  };

  // 添加资产 - 显示提示词输入模态框
  const handleAddAsset = (assetType) => {
    if (editingPageIndex === null || editingPageIndex < 0 || editingPageIndex >= pages.length) {
      alert('请先选择一个页面进行编辑');
      return;
    }
    const currentPage = pages[editingPageIndex];
    if (!currentPage) {
      alert('当前页面不存在');
      return;
    }
    setPromptModalConfig({ type: 'asset', pageId: currentPage.id, assetType });
    setShowPromptModal(true);
  };

  // 确认添加资产
  const handleConfirmAddAsset = (prompt) => {
    const { pageId, assetType: type } = promptModalConfig;
    if (!pageId || !type) return;

    setIsGeneratingAsset(true);

    // 计算画布尺寸（用于居中放置新资产）
    const getCanvasSize = () => {
      if (canvasAspectRatio === 'A4') {
        return { width: 680, height: 960 };
      } else {
        return { width: 960, height: 680 };
      }
    };
    const canvasSize = getCanvasSize();

    // 模拟AI生成
    setTimeout(() => {
      let w = 300, h = 200;
      if (type === 'text') { 
        w = 400; 
        h = 150; 
      } else if (type === 'image') {
        w = 400;
        h = 250;
      }

      const generatedTitle = prompt 
        ? `AI生成：${prompt.substring(0, 15)}...` 
        : (type === 'text' ? '文本' : type === 'image' ? '图片' : '');
      
      const generatedUrl = type === 'text' 
        ? '' 
        : `https://placehold.co/${w}x${h}/${Math.floor(Math.random()*16777215).toString(16)}/FFF?text=AI+Gen+${Date.now().toString().slice(-4)}`;

      const newAsset = {
        id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        title: generatedTitle,
        url: generatedUrl,
        content: type === 'text' ? (prompt || '双击编辑文本') : '',
        prompt: prompt || '',
        referenceImage: null,
        x: (canvasSize.width - w) / 2,
        y: (canvasSize.height - h) / 2,
        width: w,
        height: h,
        rotation: 0
      };

      // 如果是文本类型，添加文本相关属性
      if (type === 'text') {
        newAsset.fontSize = 24;
        newAsset.fontWeight = 'normal';
        newAsset.color = '#1e293b';
        newAsset.textAlign = 'center';
      }

      const newPages = pages.map(page => {
        if (page.id === pageId) {
          return {
            ...page,
            canvasAssets: [...(page.canvasAssets || []), newAsset]
          };
        }
        return page;
      });

      setPages(newPages);
      saveToHistory(newPages);
      
      // 选中新添加的资产
      setSelectedAssetId(newAsset.id);
      
      setIsGeneratingAsset(false);
      setShowPromptModal(false);
      setPromptModalConfig({ type: null, phaseKey: null, pageId: null, assetType: null });
      
      // 同步更新courseData
      const updatedPage = newPages.find(p => p.id === pageId);
      if (updatedPage && updatedPage.slideId) {
        const newCourseData = { ...courseData };
        Object.values(newCourseData).forEach(phase => {
          const step = phase.steps.find(s => s.id === updatedPage.slideId);
          if (step) {
            step.assets = updatedPage.canvasAssets || [];
          }
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
    if (!Array.isArray(pages)) return;
    const newPages = pages.map(page => {
      if (page.id === pageId) {
        return {
          ...page,
          canvasAssets: (page.canvasAssets || []).map(asset => 
            asset.id === assetId ? { ...asset, [field]: value } : asset
          )
        };
      }
      return page;
    });
    setPages(newPages);
    // 同步更新courseData
    const newCourseData = { ...courseData };
    const updatedPage = newPages.find(p => p.id === pageId);
    if (updatedPage && updatedPage.slideId) {
      Object.values(newCourseData).forEach(phase => {
        const step = phase.steps.find(s => s.id === updatedPage.slideId);
        if (step) {
          step.assets = updatedPage.canvasAssets || [];
        }
      });
    }
    setCourseData(newCourseData);
    saveToHistory(newCourseData);
  };

  // 删除资产
  const handleDeleteAsset = (assetId) => {
    if (!currentPage || !Array.isArray(pages)) return;
    const newPages = pages.map(page => {
      if (page.id === currentPage.id) {
        return {
          ...page,
          canvasAssets: (page.canvasAssets || []).filter(a => a.id !== assetId)
        };
      }
      return page;
    });
    setPages(newPages);
    setSelectedAssetId(null);
    saveToHistory(newPages);
    // 同步更新courseData
    const newCourseData = { ...courseData };
    if (currentPage.slideId) {
      Object.values(newCourseData).forEach(phase => {
        const step = phase.steps.find(s => s.id === currentPage.slideId);
        if (step) {
          step.assets = newPages.find(p => p.id === currentPage.id)?.canvasAssets || [];
        }
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
        const newAsset = {
          ...JSON.parse(JSON.stringify(assetToCopy)),
          id: Date.now().toString(),
          x: assetToCopy.x + 20,
          y: assetToCopy.y + 20,
          title: assetToCopy.title + ' (副本)'
        };
        return {
          ...page,
          canvasAssets: [...(page.canvasAssets || []), newAsset]
        };
      }
      return page;
    });
    setPages(newPages);
    // 同步更新courseData
    const newCourseData = { ...courseData };
    if (currentPage.slideId) {
      Object.values(newCourseData).forEach(phase => {
        const step = phase.steps.find(s => s.id === currentPage.slideId);
        if (step) {
          step.assets = newPages.find(p => p.id === currentPage.id)?.canvasAssets || [];
        }
      });
    }
    setCourseData(newCourseData);
    saveToHistory(newCourseData);
    
    // 选中新复制的元素
    const newAssetId = newPages.find(p => p.id === currentPage.id)?.canvasAssets?.slice(-1)[0]?.id;
    if (newAssetId) {
      setSelectedAssetId(newAssetId);
    }
  };

  // 保存生成历史
  const saveGenerationHistory = (assetId, assetType, url, prompt) => {
    const historyItem = {
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pageId: currentPage?.id,
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
    if (!currentPage || !Array.isArray(pages)) return;
    const newPages = pages.map(page => {
      if (page.id === currentPage.id) {
        return {
          ...page,
          canvasAssets: (page.canvasAssets || []).map(asset => {
            if (asset.id === historyItem.assetId && (asset.type === 'image' || asset.type === 'video')) {
              return {
                ...asset,
                url: historyItem.url,
                prompt: historyItem.prompt || asset.prompt
              };
            }
            return asset;
          })
        };
      }
      return page;
    });
    setPages(newPages);
    saveToHistory(newPages);
    setShowHistoryModal(null);
    // 同步更新courseData
    const newCourseData = { ...courseData };
    if (currentPage.slideId) {
      Object.values(newCourseData).forEach(phase => {
        const step = phase.steps.find(s => s.id === currentPage.slideId);
        if (step) {
          step.assets = newPages.find(p => p.id === currentPage.id)?.canvasAssets || [];
        }
      });
    }
    setCourseData(newCourseData);
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
        else if (action === 'forward' && index < assets.length - 1) {
          [assets[index], assets[index + 1]] = [assets[index + 1], assets[index]];
        } else if (action === 'backward' && index > 0) {
          [assets[index], assets[index - 1]] = [assets[index - 1], assets[index]];
        }
        return { ...page, canvasAssets: assets };
      }
      return page;
    });
    setPages(newPages);
    saveToHistory(newPages);
    // 同步更新courseData
    const newCourseData = { ...courseData };
    if (currentPage.slideId) {
      Object.values(newCourseData).forEach(phase => {
        const step = phase.steps.find(s => s.id === currentPage.slideId);
        if (step) {
          step.assets = newPages.find(p => p.id === currentPage.id)?.canvasAssets || [];
        }
      });
    }
    setCourseData(newCourseData);
  };


  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    exportPDF: handleExportPDF,
    isExporting
  }));

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* LEFT SIDEBAR - 目录树 */}
      <aside className={`${isLeftOpen ? 'w-64' : 'w-0'} bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 transition-all duration-300 relative`}>
        <div className={`p-4 border-b border-slate-100 bg-slate-50 ${!isLeftOpen && 'hidden'}`}>
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-lg text-slate-800 flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-600" /> 课程编排</h1>
            <button onClick={() => setIsLeftOpen(false)} className="text-slate-400 hover:text-slate-600"><ChevronLeft className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-slate-500 mt-1 truncate">Unit 1: Funky Monster Rescue</p>
        </div>
        <div className={`flex-1 overflow-y-auto p-2 space-y-2 ${!isLeftOpen && 'hidden'}`}>
          {/* 统一使用courseData显示目录树 */}
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
                    {phase.steps.map((step) => {
                      const pageIndex = pages.findIndex(p => p.slideId === step.id);
                      return (
                        <div 
                          key={step.id} 
                          className={`group/step border-b border-slate-100 last:border-0 hover:bg-blue-50 transition-all flex items-center ${
                            activeStepId === step.id ? 'bg-blue-100' : ''
                          }`}
                        >
            <button
                            onClick={() => handleStepClick(key, step.id)} 
                            className={`flex-1 text-left p-2 pl-8 text-xs transition-all flex items-start gap-2 ${
                              activeStepId === step.id 
                                ? 'text-blue-800 font-semibold border-l-4 border-l-blue-600' 
                                : 'text-slate-600'
                            }`}
                          >
                            <span className="shrink-0 mt-0.5"><FileText className="w-3 h-3" /></span>
                            <span className="line-clamp-2">{step.title}</span>
            </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStep(key, step.id);
                            }}
                            className="p-2 mr-2 opacity-0 group-hover/step:opacity-100 hover:bg-red-100 rounded text-red-500 transition-all shrink-0"
                            title="删除页面"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                    <button 
                      onClick={() => handleAddStep(key)}
                      className="w-full text-center py-2 text-xs text-slate-400 hover:text-blue-500 flex items-center justify-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> 新增页面
                    </button>
                  </div>
                )}
              </div>
            ))
          }
        </div>
        {!isLeftOpen && (
          <button 
            onClick={() => setIsLeftOpen(true)} 
            className="absolute top-4 left-0 bg-white p-2 rounded-r-md border border-l-0 border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 z-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </aside>

      {/* MAIN CONTENT - 画布编辑器 */}
      <main className="flex-1 flex flex-col bg-slate-100 relative overflow-hidden">
        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center gap-4 min-w-0">
            {!isLeftOpen && (
              <>
                <button 
                  onClick={() => setIsLeftOpen(true)} 
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded transition-colors"
                  title="展开页面列表"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="font-bold text-slate-700 flex items-center gap-2 mr-4">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs">阅读材料</span>
                </div>
              </>
            )}
            <span className="text-sm font-medium text-slate-500 whitespace-nowrap">当前编辑:</span>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold whitespace-nowrap">
              页面 {(() => {
                if (!pages[editingPageIndex]) return 1;
                const filteredIndex = filteredPages.findIndex(p => p.id === pages[editingPageIndex].id);
                return filteredIndex >= 0 ? filteredIndex + 1 : 1;
              })()} / {filteredPages.length || 1}
            </span>
            {pages[editingPageIndex] && (
              <h2 className="text-sm font-bold text-slate-800 truncate" title={pages[editingPageIndex].title}>
                {pages[editingPageIndex].title || `页面 ${editingPageIndex + 1}`}
              </h2>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="撤销 (Ctrl+Z)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
              className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="重做 (Ctrl+Shift+Z)"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-slate-200"></div>
            {/* A4 竖版/横版切换 */}
            {editingPageIndex !== null && (
              <>
                <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
                    onClick={() => setCanvasAspectRatio('A4')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      canvasAspectRatio === 'A4' ? 'bg-white text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                    }`}
                    title="A4 竖版"
                  >
                    A4 竖版
                  </button>
                  <button
                    onClick={() => setCanvasAspectRatio('A4横向')}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      canvasAspectRatio === 'A4横向' ? 'bg-white text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                    }`}
                    title="A4 横版"
                  >
                    A4 横版
            </button>
          </div>
              </>
            )}
        </div>
        </div>
        {editingPageIndex !== null && (
          <div style={{left: '65%'}} className="absolute top-20 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur shadow-lg rounded-full px-4 py-2 flex gap-3 border border-slate-200 z-20 transition-all">
            <button 
              onClick={() => handleAddAsset('text')} 
              className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-blue-600 transition-colors"
              title="添加文本"
            >
              <Type className="w-5 h-5" />
              <span className="text-[9px] font-bold">文本</span>
            </button>
            <div className="w-px bg-slate-200 h-8"></div>
            <button 
              onClick={() => handleAddAsset('image')} 
              className="flex flex-col items-center gap-0.5 text-slate-600 hover:text-purple-600 transition-colors"
              title="添加图片"
            >
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
                // 确保 updater 是函数，且 prev 是数组
                // 使用filteredPages作为prev，但更新所有pages
                const updatedFilteredPages = typeof updater === 'function' 
                  ? updater(filteredPages) 
                  : updater;
                
                if (!Array.isArray(updatedFilteredPages)) {
                  console.error('onPagesChange must return an array');
                  return;
                }
                
                // 更新pages：将filteredPages的更新同步回完整的pages数组
                const updatedPages = pages.map(page => {
                  const updatedPage = updatedFilteredPages.find(p => p.id === page.id);
                  return updatedPage || page;
                });
                
                // 如果有新页面（在filteredPages中但不在pages中），添加到pages
                updatedFilteredPages.forEach(updatedPage => {
                  if (!pages.find(p => p.id === updatedPage.id)) {
                    updatedPages.push(updatedPage);
                  }
                });
                
                setPages(updatedPages);
                saveToHistory(updatedPages);
                // 同步更新courseData
                const newCourseData = { ...courseData };
                updatedPages.forEach(page => {
                  if (page.slideId) {
                    Object.values(newCourseData).forEach(phase => {
                      const step = phase.steps.find(s => s.id === page.slideId);
                      if (step) {
                        step.assets = page.canvasAssets || [];
                      }
                    });
                  }
                });
                setCourseData(newCourseData);
              }}
              editingPageIndex={(() => {
                if (!pages[editingPageIndex]) return 0;
                const filteredIndex = filteredPages.findIndex(p => p.id === pages[editingPageIndex].id);
                return filteredIndex >= 0 ? filteredIndex : 0;
              })()}
              onEditingPageIndexChange={(newIndex) => {
                // 将filteredPages的索引转换为pages的索引
                if (newIndex >= 0 && newIndex < filteredPages.length) {
                  const targetPage = filteredPages[newIndex];
                  const actualIndex = pages.findIndex(p => p.id === targetPage.id);
                  if (actualIndex >= 0) {
                    setEditingPageIndex(actualIndex);
                  } else {
                    // 如果找不到，更新到filteredPages的第一个页面
                    if (filteredPages.length > 0) {
                      const firstIndex = pages.findIndex(p => p.id === filteredPages[0].id);
                      if (firstIndex >= 0) {
                        setEditingPageIndex(firstIndex);
                      }
                    }
                  }
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
          
          {/* 在末尾添加新页面按钮 - 只在选中环节时显示 */}
          {selectedStepId && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30"
                style={{left: '67%'}}>
              <button
                onClick={handleAddPageToStep}

                className="px-6 py-3 bg-white border-2 border-indigo-300 text-indigo-600 rounded-full shadow-lg hover:bg-indigo-50 hover:border-indigo-400 transition-all flex items-center gap-2 font-bold text-sm"
                title="在此环节末尾添加新页面"
              >
                <Plus className="w-5 h-5" />
                在末尾添加新页面
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 右侧编辑面板 - 与 main 同级 */}
      {editingPageIndex !== null && (
        <aside className={`${isRightOpen ? 'w-96' : 'w-0'} bg-white border-l border-slate-200 flex flex-col shrink-0 z-10 shadow-[0_0_15px_rgba(0,0,0,0.05)] transition-all duration-300 relative`}>
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
                          <div className="flex items-center gap-2">
                            {getAssetIcon(selectedAsset.type)}
                            <h3 className="font-bold text-blue-800">编辑元素</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setIsRightOpen(false)} className="text-slate-400 hover:text-slate-600" title="收起面板">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <button onClick={() => setSelectedAssetId(null)} className="text-slate-500 hover:text-slate-700">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Layers className="w-3 h-3" /> 图层
                          </span>
                          <div className="flex gap-1">
                            <button onClick={() => handleLayerChange(selectedAsset.id, 'front')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="置顶">
                              <ChevronsUp className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleLayerChange(selectedAsset.id, 'forward')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="上移">
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleLayerChange(selectedAsset.id, 'backward')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="下移">
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleLayerChange(selectedAsset.id, 'back')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="置底">
                              <ChevronsDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-6">
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
                                value={selectedAsset.title || ''} 
                                onChange={(e) => handleAssetChange(selectedAsset.id, 'title', e.target.value)} 
                                className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            {selectedAsset.type === 'text' ? (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">文本内容 / Content</label>
                                  <textarea 
                                    value={selectedAsset.content || ''} 
                                    onChange={(e) => handleAssetChange(selectedAsset.id, 'content', e.target.value)} 
                                    className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                                  />
                                </div>
                                
                                {/* 文本样式选项 */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-500 uppercase">文本样式</label>
                                  </div>
                                  
                                  {/* 字号 */}
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">字号 Font Size</label>
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="number" 
                                        min="8" 
                                        max="200" 
                                        value={selectedAsset.fontSize || 24} 
                                        onChange={(e) => handleAssetChange(selectedAsset.id, 'fontSize', parseInt(e.target.value) || 24)} 
                                        className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-slate-50 outline-none"
                                      />
                                      <span className="text-[10px] text-slate-400">px</span>
                                    </div>
                                  </div>

                                  {/* 加粗 */}
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">字重 Font Weight</label>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleAssetChange(selectedAsset.id, 'fontWeight', 'normal')}
                                        className={`flex-1 px-3 py-2 rounded border text-xs transition-colors ${
                                          (selectedAsset.fontWeight || 'normal') === 'normal' 
                                            ? 'bg-blue-50 border-blue-300 text-blue-700' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                      >
                                        正常
                                      </button>
                                      <button
                                        onClick={() => handleAssetChange(selectedAsset.id, 'fontWeight', 'bold')}
                                        className={`flex-1 px-3 py-2 rounded border text-xs transition-colors flex items-center justify-center gap-1 ${
                                          selectedAsset.fontWeight === 'bold' 
                                            ? 'bg-blue-50 border-blue-300 text-blue-700' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                      >
                                        <Bold className="w-3 h-3" />
                                        加粗
                                      </button>
                                    </div>
                                  </div>

                                  {/* 文本颜色 */}
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block flex items-center gap-1">
                                      <Palette className="w-3 h-3" /> 文本颜色 Color
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="color" 
                                        value={selectedAsset.color || '#1e293b'} 
                                        onChange={(e) => handleAssetChange(selectedAsset.id, 'color', e.target.value)} 
                                        className="w-12 h-10 rounded border border-slate-200 cursor-pointer"
                                      />
                                      <input 
                                        type="text" 
                                        value={selectedAsset.color || '#1e293b'} 
                                        onChange={(e) => handleAssetChange(selectedAsset.id, 'color', e.target.value)} 
                                        className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-slate-50 outline-none font-mono"
                                        placeholder="#000000"
                                      />
                                    </div>
                                  </div>

                                  {/* 文本对齐 */}
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">对齐方式 Align</label>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleAssetChange(selectedAsset.id, 'textAlign', 'left')}
                                        className={`flex-1 px-2 py-2 rounded border text-xs transition-colors flex items-center justify-center ${
                                          (selectedAsset.textAlign || 'center') === 'left' 
                                            ? 'bg-blue-50 border-blue-300 text-blue-700' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                        title="左对齐"
                                      >
                                        <AlignLeft className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleAssetChange(selectedAsset.id, 'textAlign', 'center')}
                                        className={`flex-1 px-2 py-2 rounded border text-xs transition-colors flex items-center justify-center ${
                                          (selectedAsset.textAlign || 'center') === 'center' 
                                            ? 'bg-blue-50 border-blue-300 text-blue-700' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                        title="居中"
                                      >
                                        <AlignCenter className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleAssetChange(selectedAsset.id, 'textAlign', 'right')}
                                        className={`flex-1 px-2 py-2 rounded border text-xs transition-colors flex items-center justify-center ${
                                          selectedAsset.textAlign === 'right' 
                                            ? 'bg-blue-50 border-blue-300 text-blue-700' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                        title="右对齐"
                                      >
                                        <AlignRight className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* 描边 */}
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">描边 Stroke</label>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <input 
                                          type="checkbox" 
                                          checked={!!selectedAsset.strokeWidth && selectedAsset.strokeWidth > 0} 
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              handleAssetChange(selectedAsset.id, 'strokeWidth', 2);
                                            } else {
                                              handleAssetChange(selectedAsset.id, 'strokeWidth', null);
                                              handleAssetChange(selectedAsset.id, 'strokeColor', null);
                                            }
                                          }} 
                                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-xs text-slate-600">启用描边</span>
                                      </div>
                                      {selectedAsset.strokeWidth && selectedAsset.strokeWidth > 0 && (
                                        <div className="space-y-2 pl-6">
                                          <div>
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-[10px] text-slate-500">描边宽度</span>
                                              <span className="text-[10px] text-slate-400">{selectedAsset.strokeWidth}px</span>
                                            </div>
                                            <input 
                                              type="range" 
                                              min="1" 
                                              max="10" 
                                              value={selectedAsset.strokeWidth || 2} 
                                              onChange={(e) => {
                                                const value = parseInt(e.target.value);
                                                if (value > 0) {
                                                  handleAssetChange(selectedAsset.id, 'strokeWidth', value);
                                                }
                                              }} 
                                              className="w-full"
                                            />
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <label className="text-[10px] text-slate-500">描边颜色</label>
                                            <input 
                                              type="color" 
                                              value={selectedAsset.strokeColor || '#000000'} 
                                              onChange={(e) => handleAssetChange(selectedAsset.id, 'strokeColor', e.target.value)} 
                                              className="w-10 h-8 rounded border border-slate-200 cursor-pointer"
                                            />
                                            <input 
                                              type="text" 
                                              value={selectedAsset.strokeColor || '#000000'} 
                                              onChange={(e) => handleAssetChange(selectedAsset.id, 'strokeColor', e.target.value)} 
                                              className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50 outline-none font-mono"
                                            />
                                          </div>
            </div>
          )}
        </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
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
                                          onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                              const reader = new FileReader();
                                              reader.onloadend = () => {
                                                handleAssetChange(selectedAsset.id, 'referenceImage', reader.result);
                                              };
                                              reader.readAsDataURL(file);
                                            }
                                          }}
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
                                <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-2">
                                    <Wand2 className="w-3 h-3 text-purple-500" /> AI 生成提示词 / Prompt
                                  </label>
                                  <textarea 
                                    value={selectedAsset.prompt || ''} 
                                    onChange={(e) => handleAssetChange(selectedAsset.id, 'prompt', e.target.value)} 
                                    placeholder="描述你想要生成的画面..." 
                                    className="w-full text-sm border border-purple-200 bg-purple-50 rounded px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none h-24 resize-none mb-2"
                                  />
                                  <div className="flex gap-2 mb-2">
                                    <button 
                                      onClick={() => setShowHistoryModal({ assetId: selectedAsset.id, assetType: selectedAsset.type })}
                                      className="flex-1 py-2 bg-slate-100 text-slate-600 rounded text-sm font-bold hover:bg-slate-200 flex items-center justify-center gap-2 transition-all"
                                    >
                                      <History className="w-4 h-4" />
                                      历史生成
                                    </button>
                                    <button 
                                      onClick={() => {
                                        // 保存当前内容到历史
                                        if (selectedAsset.type === 'image' || selectedAsset.type === 'video') {
                                          if (selectedAsset.url) {
                                            saveGenerationHistory(selectedAsset.id, selectedAsset.type, selectedAsset.url, selectedAsset.prompt);
                                          }
                                        }
                                        setGeneratingAssetId(selectedAsset.id);
                                        setTimeout(() => {
                                          const randomColor = Math.floor(Math.random()*16777215).toString(16);
                                          const generatedUrl = `https://placehold.co/${selectedAsset.width || 300}x${selectedAsset.height || 200}/${randomColor}/FFF?text=AI+Gen+${Date.now().toString().slice(-4)}`;
                                          handleAssetChange(selectedAsset.id, 'url', generatedUrl);
                                          setGeneratingAssetId(null);
                                        }, 2000);
                                      }}
                                      className="flex-1 py-2 bg-purple-600 text-white rounded text-sm font-bold shadow hover:bg-purple-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                    >
                                      <RefreshCw className={`w-4 h-4 ${generatingAssetId === selectedAsset.id ? 'animate-spin' : ''}`} /> 
                                      {selectedAsset.referenceImage ? '参考图 + 文本生成' : '立即生成'}
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                          <div className="pt-6 mt-6 border-t border-slate-100 space-y-2">
                            <button 
                              onClick={() => handleCopyAsset(selectedAsset.id)} 
                              className="w-full py-2 text-blue-500 border border-blue-200 rounded text-sm font-bold hover:bg-blue-50 flex items-center justify-center gap-2"
                            >
                              <Copy className="w-4 h-4" /> 复制此元素
                            </button>
                            <button 
                              onClick={() => handleDeleteAsset(selectedAsset.id)} 
                              className="w-full py-2 text-red-500 border border-red-200 rounded text-sm font-bold hover:bg-red-50 flex items-center justify-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> 删除此元素 (Del)
                            </button>
                          </div>
                        </div>
                      </>
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
                            <label className="text-xs font-bold text-slate-500 uppercase">
                              画板元素 ({(currentPage?.canvasAssets || []).length})
                            </label>
                            <div className="flex gap-1">
                              <button 
                                onClick={() => {
                                  // 这里需要调用ReadingMaterialEditor的handleAddAsset
                                  // 暂时留空，后续可以通过ref或回调实现
                                }} 
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-purple-600"
                              >
                                <ImageIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {(currentPage?.canvasAssets || []).map((asset) => (
                              <div 
                                key={asset.id} 
                                onClick={() => setSelectedAssetId(asset.id)} 
                                className="flex items-start gap-2 p-2 border border-slate-200 rounded bg-white hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all group"
                              >
                                <div className="mt-1 text-slate-400">{getAssetIcon(asset.type)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold text-slate-700 truncate">{asset.title || asset.type}</div>
                                  <div className="text-[10px] text-slate-400">{asset.type} • 点击编辑</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </aside>
              )}

      {/* Prompt Input Modal */}
      <PromptInputModal
        isOpen={showPromptModal}
        onClose={() => {
          setShowPromptModal(false);
          setPromptModalConfig({ type: null, phaseKey: null, pageId: null, assetType: null });
        }}
        onConfirm={(prompt) => {
          if (promptModalConfig.type === 'asset') {
            handleConfirmAddAsset(prompt);
          } else if (promptModalConfig.type === 'page' && promptModalConfig.stepId) {
            handleConfirmAddPageToStep(prompt);
          } else {
            handleConfirmAddStep(prompt);
          }
        }}
        title={promptModalConfig.type === 'asset' 
          ? `添加${promptModalConfig.assetType === 'image' ? '图片' : '文本'}元素`
          : promptModalConfig.stepId
          ? '在末尾添加新页面'
          : '添加新页面'}
        description={promptModalConfig.type === 'asset'
          ? '请输入AI生成提示词，描述你想要创建的元素（可选，留空将使用默认生成）'
          : '请输入AI生成提示词，描述你想要创建的页面内容（可选，留空将使用默认标题）'}
        placeholder={promptModalConfig.type === 'asset'
          ? `例如：${promptModalConfig.assetType === 'image' ? '生成一张关于动物的图片' : '输入文本内容'}...`
          : '例如：创建一个关于颜色词汇的阅读页面，包含图片和文字...'}
        type={promptModalConfig.type === 'asset' ? 'element' : 'session'}
        isLoading={promptModalConfig.type === 'asset' ? isGeneratingAsset : isGenerating}
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
                    历史生成列表 - {showHistoryModal.assetType === 'image' ? '图片' : showHistoryModal.assetType === 'video' ? '视频' : ''}
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
                  h.pageId === currentPage?.id && 
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
                      h.pageId === currentPage?.id && 
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
                            {(historyItem.type === 'image' || historyItem.type === 'video') && (
                              <img 
                                src={historyItem.url} 
                                alt="历史生成" 
                                className="w-full h-32 object-cover rounded border border-slate-200 mb-2"
                              />
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
    </div>
  );
});

