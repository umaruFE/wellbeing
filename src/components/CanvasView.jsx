import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
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
  RotateCw
} from 'lucide-react';
import { SlideRenderer } from './SlideRenderer';
import { getAssetIcon } from '../utils';
import { AssetEditorPanel } from './AssetEditorPanel';
import { CanvasViewLeftSidebar } from './CanvasView.LeftSidebar';
import { CanvasViewModals } from './CanvasView.Modals';
import { History, RefreshCw } from 'lucide-react';
import { aiAssetService } from '../services/aiAssetService';
import { promptHistoryService, promptOptimizationService } from '../services/promptService';
import { optimizePrompt } from '../services/dashscope';
import { useAuth } from '../contexts/AuthContext';

export const CanvasView = forwardRef(({ navigation, initialConfig }, ref) => {
  const { user } = useAuth();
  
  // 支持 courseData 的两种格式：对象格式（欢迎页生成）和数组格式（从数据库加载）
  const isCourseDataArray = Array.isArray(initialConfig?.courseData);
  
  const [courseData, setCourseData] = useState(initialConfig?.courseData || {});
  
  // 辅助函数：获取 phase 数据
  const getPhaseData = (phaseKey) => {
    if (isCourseDataArray) {
      return courseData.find(phase => phase.id === phaseKey);
    }
    return courseData[phaseKey];
  };
  
  // 辅助函数：获取所有 phase keys
  const getPhaseKeys = () => {
    if (isCourseDataArray) {
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
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') || ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAssetId && !e.target.tagName.match(/INPUT|TEXTAREA/)) {
        e.preventDefault();
        handleDeleteAsset(selectedAssetId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAssetId, historyIndex, history]);

  // Derived State
  const currentPhaseData = getPhaseData(activePhase);
  const currentStep = currentPhaseData?.slides?.find(s => s.id === activeStepId) || currentPhaseData?.slides?.[0];
  const selectedAsset = selectedAssetId && currentStep ? currentStep.elements?.find(a => a.id === selectedAssetId) : null;

  const allSteps = getPhaseKeys().flatMap(phaseKey => {
    const phase = getPhaseData(phaseKey);
    if (!phase) return [];
    return (phase.slides || []).map(slide => ({...slide, phaseKey}));
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
    if (!confirm('确定要删除这个环节吗？此操作无法撤销。')) return;
    
    const newCourseData = isCourseDataArray ? [...courseData] : { ...courseData };
    const phase = isCourseDataArray 
      ? newCourseData.find(p => p.id === phaseKey)
      : newCourseData[phaseKey];
    if (!phase) return;
    
    phase.slides = phase.slides.filter(s => s.id !== stepId);
    
    if (activeStepId === stepId) {
      if (phase.slides.length > 0) {
        setActiveStepId(phase.slides[0].id);
      } else {
        const otherPhase = isCourseDataArray
          ? newCourseData.find(p => p.id !== phaseKey && p.slides.length > 0)
          : Object.entries(newCourseData).find(([key, p]) => 
              key !== phaseKey && p.slides.length > 0
            );
        if (otherPhase) {
          setActivePhase(isCourseDataArray ? otherPhase.id : otherPhase[0]);
          setActiveStepId(isCourseDataArray ? otherPhase.slides[0].id : otherPhase[1].slides[0].id);
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
    setPromptModalConfig({ type: 'element', assetType: type, phaseKey: activePhase });
    setShowPromptModal(true);
  };

  const handleConfirmAddAsset = async (prompt, inputMode = 'ai', videoStyle = null) => {
    console.log('handleConfirmAddAsset called:', { prompt, inputMode, videoStyle, promptModalConfig });
    
    const type = promptModalConfig.assetType;
    const phase = getPhaseData(activePhase);
    const step = phase?.slides?.find(s => s.id === activeStepId);
    if (!step) {
      console.log('No step found, returning');
      return;
    }

    // 直接输入文本的场景：不走 AI 接口，只本地创建元素
    if (type === 'text' && inputMode === 'direct') {
      console.log('Direct text input mode');
      const newCourseData = { ...courseData };
      const currentStep = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
      const w = 300, h = 100;

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

    console.log('AI generation mode, setting isGenerating to true');
    setIsGenerating(true);

    const userId = user?.id;
    const organizationId = user?.organizationId;
    const promptStart = performance.now();

    // 根据元素类型准备一个默认提示词
    const basePrompt =
      prompt ||
      (type === 'image'
        ? '生成一张适合小学英语教学的图片'
        : type === 'video'
          ? '生成一个适合小学英语教学的视频封面'
          : type === 'audio'
            ? '生成一段适合作为课堂背景音乐的音频'
            : '生成一段教学文本内容');

    try {
      let effectivePrompt = basePrompt;

      // 1) 先做提示词优化（调用大模型与优化服务）
      try {
        const optimized = await optimizePrompt(basePrompt, type === 'text' ? 'script' : type, userId);
        if (optimized && typeof optimized === 'string') {
          effectivePrompt = optimized;
          await promptOptimizationService.saveOptimization({
            user_id: userId,
            element_type: type,
            original_prompt: basePrompt,
            optimized_prompt: optimized,
            improvement_score: 5
          });
        }
      } catch (optError) {
        console.error('提示词优化失败，将使用原始提示词:', optError);
      }

      const newCourseData = { ...courseData };
      const currentStep = newCourseData[activePhase].steps.find(s => s.id === activeStepId);

      let w = 300;
      let h = 200;
      if (type === 'audio') { w = 300; h = 100; }
      if (type === 'text') { w = 300; h = 100; }

      let generatedUrl = '';
      let generatedContent = '';

      // 2) 调用 AI 生成接口（/prompt）
      if (type === 'image' || type === 'video') {
        console.log('开始生成图片，调用API...');
        
        try {
          const result = await aiAssetService.generateMultipleImages(
            effectivePrompt,
            {
              count: 4,
              width: w,
              height: h,
              user_id: userId,
              organization_id: organizationId
            }
          );

          console.log('API返回结果:', result);

          if (!result.success || !result.tasks) {
            console.log('API返回失败，抛出错误');
            throw new Error('生成图片失败');
          }

          console.log('已提交任务，准备显示抽卡界面（loading状态）');
          
          // 立即显示抽卡界面（loading状态）
          const loadingImages = result.tasks.map((task, index) => ({
            url: null,
            prompt: `${effectivePrompt} - 教学场景 ${index + 1}`,
            loading: true,
            index
          }));

          console.log('设置卡片选择图片:', loadingImages);
          setCardSelectionImages(loadingImages);
          
          // 保存所有 promptId 到状态中
          const allPromptIds = result.tasks.map(task => task.promptId);
          console.log('保存所有 promptId:', allPromptIds);
          setSavedPromptIds(allPromptIds);
          
          const pendingConfig = {
            type,
            effectivePrompt,
            w,
            h,
            generatedTitle: basePrompt
              ? `AI生成：${basePrompt.substring(0, 15)}...`
              : `New ${type}`
          };
          console.log('设置待确认配置:', pendingConfig);
          setPendingAssetConfig(pendingConfig);
          
          console.log('显示抽卡模态框，调用 setShowCardSelectionModal(true)');
          setShowCardSelectionModal(true);
          
          console.log('关闭提示词模态框');
          setShowPromptModal(false);
          setPromptModalConfig({ type: null, assetType: null, phaseKey: null });

          // 使用保存的 promptId 列表查询任务状态
          console.log('开始轮询任务状态...');
          console.log('allPromptIds:', allPromptIds);
          console.log('allPromptIds 长度:', allPromptIds.length);
          
          if (!allPromptIds || allPromptIds.length === 0) {
            console.log('allPromptIds 为空，跳过轮询');
            setIsGenerating(false);
            return;
          }
          
          // 轮询每个任务，完成后立即更新抽卡界面
          const pollPromises = allPromptIds.map(async (promptId, index) => {
            console.log(`开始轮询任务 ${index + 1}, promptId: ${promptId}`);
            try {
              const imageResult = await aiAssetService.pollTaskAndUpload(
                promptId,
                index,
                effectivePrompt,
                60,
                2000,
                (progress) => {
                  console.log(`任务 ${index + 1} 进度:`, progress);
                  
                  if (progress.status === 'completed') {
                    // 任务完成，更新抽卡界面
                    setCardSelectionImages(prevImages => {
                      const newImages = [...prevImages];
                      newImages[index] = {
                        url: progress.url,
                        prompt: `${effectivePrompt} - 教学场景 ${index + 1}`,
                        loading: false,
                        completed: true,
                        index
                      };
                      console.log(`更新图片 ${index + 1}:`, newImages[index]);
                      return newImages;
                    });
                  }
                }
              );
              
              return imageResult;
            } catch (error) {
              console.error(`任务 ${index + 1} 失败:`, error);
              
              // 任务失败，更新抽卡界面显示占位图
              setCardSelectionImages(prevImages => {
                const newImages = [...prevImages];
                const randomColor = Math.floor(Math.random() * 16777215).toString(16);
                newImages[index] = {
                  url: `https://placehold.co/${w}x${h}/${randomColor}/FFF?text=Gen+Failed+${index + 1}`,
                  prompt: `${effectivePrompt} - 教学场景 ${index + 1} (生成失败)`,
                  loading: false,
                  error: error?.message || '生成失败',
                  index
                };
                console.log(`更新失败图片 ${index + 1}:`, newImages[index]);
                return newImages;
              });
              
              throw error;
            }
          });

          // 等待所有任务完成
          await Promise.allSettled(pollPromises);
          
          console.log('所有任务轮询完成');
          setIsGenerating(false);
          return;
        } catch (error) {
          console.error('生成图片失败:', error);
          console.log('准备显示抽卡界面（使用占位图）');

          // 失败时也记录提示词历史，标记为失败
          try {
            await promptHistoryService.saveHistory({
              user_id: userId,
              organization_id: organizationId,
              prompt_type: type,
              original_prompt: basePrompt,
              generated_result: null,
              execution_time: Math.round(performance.now() - promptStart),
              success: false,
              error_message: error?.message || '生成失败'
            });
          } catch (historyError) {
            console.error('保存失败提示词历史失败:', historyError);
          }

          // 即使生成失败，也显示抽卡界面（使用占位图）
          const generatedImages = [];
          for (let i = 0; i < 4; i++) {
            const randomColor = Math.floor(Math.random() * 16777215).toString(16);
            generatedImages.push({
              url: `https://placehold.co/${w}x${h}/${randomColor}/FFF?text=Gen+Failed+${i + 1}`,
              prompt: `${effectivePrompt} - 教学场景 ${i + 1} (生成失败)`,
              error: error?.message || '生成失败'
            });
          }

          console.log('设置卡片选择图片:', generatedImages);
          setCardSelectionImages(generatedImages);
          
          const pendingConfig = {
            type,
            effectivePrompt,
            w,
            h,
            generatedTitle: basePrompt
              ? `AI生成：${basePrompt.substring(0, 15)}...`
              : `New ${type}`
          };
          console.log('设置待确认配置:', pendingConfig);
          setPendingAssetConfig(pendingConfig);
          
          console.log('显示抽卡模态框');
          setShowCardSelectionModal(true);
          setIsGenerating(false);
          setShowPromptModal(false);
          setPromptModalConfig({ type: null, assetType: null, phaseKey: null });
        }
      } else if (type === 'text') {
        generatedContent = `根据提示词"${effectivePrompt}"生成的文本内容`;
      } else if (type === 'audio') {
        // 目前暂时没有音频生成服务，这里先占位
        const randomColor = Math.floor(Math.random() * 16777215).toString(16);
        generatedUrl = `https://placehold.co/${w}x${h}/${randomColor}/FFF?text=AI+Audio`;
      }

      const generatedTitle = basePrompt
        ? `AI生成：${basePrompt.substring(0, 15)}...`
        : `New ${type}`;

      const newAsset = {
        id: Date.now().toString(),
        type,
        title: generatedTitle,
        url: generatedUrl,
        content: type === 'text' ? generatedContent : '',
        prompt: effectivePrompt,
        referenceImage: null,
        videoStyle: type === 'video' ? (videoStyle || 'realistic') : null,
        x: 100,
        y: 100,
        width: w,
        height: h,
        rotation: 0
      };

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

      const execTime = Math.round(performance.now() - promptStart);

      // 3) 记录提示词使用历史
      try {
        await promptHistoryService.saveHistory({
          user_id: userId,
          organization_id: organizationId,
          prompt_type: type,
          original_prompt: basePrompt,
          generated_result: JSON.stringify({
            type,
            url: generatedUrl,
            content: generatedContent
          }),
          execution_time: execTime,
          success: true,
          error_message: null
        });
      } catch (historyError) {
        console.error('保存提示词历史失败:', historyError);
      }

      setIsGenerating(false);
      setShowPromptModal(false);
      setPromptModalConfig({ type: null, assetType: null, phaseKey: null });
    } catch (error) {
      console.error('生成素材失败:', error);
      console.log('准备显示抽卡界面（使用占位图）');

      // 失败时也记录提示词历史，标记为失败
      try {
        await promptHistoryService.saveHistory({
          user_id: userId,
          organization_id: organizationId,
          prompt_type: type,
          original_prompt: basePrompt,
          generated_result: null,
          execution_time: Math.round(performance.now() - promptStart),
          success: false,
          error_message: error?.message || '生成失败'
        });
      } catch (historyError) {
        console.error('保存失败提示词历史失败:', historyError);
      }

      // 即使生成失败，也显示抽卡界面（使用占位图）
      const generatedImages = [];
      for (let i = 0; i < 4; i++) {
        const randomColor = Math.floor(Math.random() * 16777215).toString(16);
        generatedImages.push({
          url: `https://placehold.co/${w}x${h}/${randomColor}/FFF?text=Gen+Failed+${i + 1}`,
          prompt: `${effectivePrompt} - 教学场景 ${i + 1} (生成失败)`,
          error: error?.message || '生成失败'
        });
      }

      console.log('设置卡片选择图片:', generatedImages);
      setCardSelectionImages(generatedImages);
      
      const pendingConfig = {
        type,
        effectivePrompt,
        w,
        h,
        generatedTitle: basePrompt
          ? `AI生成：${basePrompt.substring(0, 15)}...`
          : `New ${type}`
      };
      console.log('设置待确认配置:', pendingConfig);
      setPendingAssetConfig(pendingConfig);
      
      console.log('显示抽卡模态框');
      setShowCardSelectionModal(true);
      setIsGenerating(false);
      setShowPromptModal(false);
      setPromptModalConfig({ type: null, assetType: null, phaseKey: null });
    }
  };

  const handleCardSelectionConfirm = (selectedImage) => {
    if (!pendingAssetConfig) return;
    const { type, effectivePrompt, w, h, generatedTitle } = pendingAssetConfig;
    
    const newCourseData = { ...courseData };
    const currentStep = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
    
    if (!currentStep) return;
    
    const newAsset = {
      id: Date.now().toString(),
      type,
      title: generatedTitle,
      url: selectedImage.url,
      content: '',
      prompt: effectivePrompt,
      referenceImage: null,
      videoStyle: type === 'video' ? 'realistic' : null,
      x: 100,
      y: 100,
      width: w,
      height: h,
      rotation: 0
    };

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
    setShowCardSelectionModal(false);
    setCardSelectionImages([]);
    setPendingAssetConfig(null);
  };

  const handleDeleteAsset = (assetId) => {
    const newCourseData = { ...courseData };
    const step = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
    step.assets = step.assets.filter(a => a.id !== assetId);
    setCourseData(newCourseData);
    saveToHistory(newCourseData);
    setSelectedAssetId(null);
  };

  const handleCopyAsset = (assetId) => {
    const phase = getPhaseData(activePhase);
    const step = phase?.slides?.find(s => s.id === activeStepId);
    const assetToCopy = step?.elements?.find(a => a.id === assetId);
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
    const newCourseData = { ...courseData };
    const step = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
    const asset = step.assets.find(a => a.id === historyItem.assetId);
    if (asset && (asset.type === 'image' || asset.type === 'video' || asset.type === 'audio')) {
      asset.url = historyItem.url;
      if (historyItem.prompt) asset.prompt = historyItem.prompt;
      setCourseData(newCourseData);
      saveToHistory(newCourseData);
    }
    setShowHistoryModal(null);
  };

  const [generatingAssetId, setGeneratingAssetId] = useState(null);

  const handleRegenerateAsset = async (assetId) => {
    const phase = getPhaseData(activePhase);
    const step = phase?.slides?.find(s => s.id === activeStepId);
    const asset = step?.elements?.find(a => a.id === assetId);
    if (!asset) return;
    
    if (asset.type === 'text' && asset.content) {
      saveGenerationHistory(assetId, asset.type, asset.content, asset.prompt);
    } else if ((asset.type === 'image' || asset.type === 'video' || asset.type === 'audio') && asset.url) {
      saveGenerationHistory(assetId, asset.type, asset.url, asset.prompt);
    }
    
    setGeneratingAssetId(assetId);
    
    try {
      const newCourseData = { ...courseData };
      const step = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
      const asset = step.assets.find(a => a.id === assetId);
      
      if (asset.type === 'text') {
        asset.content = asset.prompt 
          ? `根据提示词"${asset.prompt}"重新生成的文本内容 (v${Date.now().toString().slice(-4)})`
          : `重新生成的文本内容 (v${Date.now().toString().slice(-4)})`;
      } else if (asset.type === 'image') {
        const prompt = asset.prompt || asset.title || '教学场景';
        const result = await aiAssetService.generateImageWithPolling(
          prompt,
          {
            width: asset.width || 300,
            height: asset.height || 200,
            seed: Date.now(),
            maxAttempts: 60,
            interval: 2000
          }
        );
        asset.url = result.url;
      } else if (asset.type === 'video') {
        const prompt = asset.prompt || asset.title || '教学视频';
        const result = await aiAssetService.generateImageWithPolling(
          prompt,
          {
            width: asset.width || 300,
            height: asset.height || 200,
            seed: Date.now(),
            maxAttempts: 60,
            interval: 2000
          }
        );
        asset.url = result.url;
      } else if (asset.type === 'audio') {
        const randomColor = Math.floor(Math.random()*16777215).toString(16);
        asset.url = `https://placehold.co/300x100/${randomColor}/FFF?text=AI+Audio+v${Math.floor(Math.random() * 10)}`;
      }
      
      setCourseData(newCourseData);
      saveToHistory(newCourseData);
      setGeneratingAssetId(null);
    } catch (error) {
      console.error('重新生成素材失败:', error);
      setGeneratingAssetId(null);
      alert('生成素材失败，请稍后重试');
    }
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

  const handleMouseDown = (e, assetId, mode = 'dragging', handleType = null) => {
    e.stopPropagation(); 
    if (!canvasRef.current) return;
    setSelectedAssetId(assetId);
    setIsRightOpen(true);
    setInteractionMode(mode);
    const phase = getPhaseData(activePhase);
    const step = phase?.slides?.find(s => s.id === activeStepId);
    const asset = step?.elements?.find(a => a.id === assetId);
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
      saveToHistory(courseData);
    }
    setInteractionMode('idle'); 
    setInteractionStart(null); 
  };

  const handleCanvasClick = () => { 
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
    getCourseData: () => courseData,
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
      <CanvasViewLeftSidebar
        courseData={courseData}
        expandedPhases={expandedPhases}
        activeStepId={activeStepId}
        onTogglePhase={togglePhase}
        onStepClick={handleStepClick}
        onAddStep={handleAddStep}
        onDeleteStep={handleDeleteStep}
        isLeftOpen={isLeftOpen}
        onLeftToggle={() => setIsLeftOpen(false)}
      />
      {!isLeftOpen && (
        <button 
          onClick={() => setIsLeftOpen(true)} 
          className="absolute top-4 left-0 bg-white p-2 rounded-r-md border border-l-0 border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 z-50"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

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
                 <div className="font-bold text-slate-700 flex items-center gap-2 mr-4">
                   <Wand2 className="w-4 h-4" />
                   <span className="text-xs">PPT</span>
                 </div>
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
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px]" onClick={(e) => e.stopPropagation()}></div>
          <div ref={canvasRef} className="w-[960px] h-[540px] bg-white shadow-2xl rounded-sm relative overflow-hidden ring-1 ring-slate-900/5 group transition-transform duration-200">
             <SlideRenderer
               assets={currentStep?.assets || []}
               isEditable={true}
               onMouseDown={handleMouseDown}
               onClick={(assetId) => {
                 setSelectedAssetId(assetId);
                 setIsRightOpen(true);
               }}
               selectedAssetId={selectedAssetId}
               onCopyAsset={handleCopyAsset}
               onDeleteAsset={handleDeleteAsset}
               onAssetChange={handleAssetChange}
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
      </main>

      {/* 3. RIGHT SIDEBAR */}
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
                       <Wand2 className="w-4 h-4 text-purple-600" />环节详情编辑
                     </h3>
                     <button onClick={() => setIsRightOpen(false)} className="text-slate-400 hover:text-slate-600" title="收起面板">
                       <ChevronRight className="w-4 h-4" />
                     </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 space-y-6">
                     <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">时间 / Time</label>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <input 
                              type="text" 
                              value={currentStep?.time || ''} 
                              onChange={(e) => handleInputChange('time', e.target.value)} 
                              className="flex-1 text-sm border border-slate-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none" 
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">教学环节 / Step Title</label>
                          <input 
                            type="text" 
                            value={currentStep?.title || ''} 
                            onChange={(e) => handleInputChange('title', e.target.value)} 
                            className="w-full text-sm font-bold border border-slate-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none" 
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">教学目标 / Objectives</label>
                          <textarea 
                            value={currentStep?.objective || ''} 
                            onChange={(e) => handleInputChange('objective', e.target.value)} 
                            className="w-full text-sm border border-slate-200 rounded px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none resize-none h-16 bg-slate-50" 
                          />
                        </div>
                     </div>
                     <hr className="border-slate-100" />
                     <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-500 uppercase">本页素材 ({currentStep?.assets?.length || 0})</label>
                          <div className="flex gap-1">
                            <button onClick={() => handleAddAsset('image')} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-purple-600">
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {currentStep?.assets?.map((asset) => (
                            <div 
                              key={asset.id} 
                              onClick={() => setSelectedAssetId(asset.id)} 
                              className="flex items-start gap-2 p-2 border border-slate-200 rounded bg-white hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all group"
                            >
                              <div className="mt-1 text-slate-400">{getAssetIcon(asset.type)}</div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-slate-700 truncate">{asset.title}</div>
                                <div className="text-[10px] text-slate-400">{asset.type} • 点击编辑</div>
                              </div>
                            </div>
                          ))}
                        </div>
                     </div>
                     <div className="pt-6 mt-6 border-t border-slate-100 flex gap-2">
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
                          className="flex-1 py-2 bg-slate-100 text-slate-600 rounded text-sm font-bold hover:bg-slate-200 flex items-center justify-center gap-2 transition-all"
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
        onConfirmAddAsset={handleConfirmAddAsset}
        showCardSelectionModal={showCardSelectionModal}
        setShowCardSelectionModal={setShowCardSelectionModal}
        cardSelectionImages={cardSelectionImages}
        isGenerating={isGenerating}
        onCardSelectionConfirm={handleCardSelectionConfirm}
        showRegeneratePageModal={showRegeneratePageModal}
        setShowRegeneratePageModal={setShowRegeneratePageModal}
        isRegeneratingPage={isRegeneratingPage}
        onConfirmRegeneratePage={(prompt) => {
          setIsRegeneratingPage(true);
          setTimeout(() => {
            const newCourseData = { ...courseData };
            const step = newCourseData[activePhase].steps.find(s => s.id === activeStepId);
            if (step) {
              if (prompt) step.title = `重新生成：${prompt.substring(0, 20)}...`;
            }
            setCourseData(newCourseData);
            saveToHistory(newCourseData);
            setIsRegeneratingPage(false);
            setShowRegeneratePageModal(false);
          }, 1500);
        }}
        showHistoryModal={showHistoryModal}
        setShowHistoryModal={setShowHistoryModal}
        generationHistory={generationHistory}
        activePhase={activePhase}
        activeStepId={activeStepId}
        onRestoreHistory={handleRestoreHistory}
      />

      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
           <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
              <div className="text-white font-bold">{currentStep?.title}</div>
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
           <div className="flex-1 flex items-center justify-center bg-black overflow-hidden relative">
              <div style={{ width: 960, height: 540, transform: 'scale(1.2)' }} className="relative bg-white shadow-2xl overflow-hidden">
                <SlideRenderer assets={currentStep?.assets || []} isEditable={false} />
              </div>
           </div>
        </div>
      )}

      {showPageHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">历史生成列表 - 环节内容</h3>
                  <p className="text-xs text-slate-500 mt-1">{currentStep?.title || '当前环节'}</p>
                </div>
              </div>
              <button onClick={() => setShowPageHistoryModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {pageHistory.filter(h => h.stepId === activeStepId).length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无历史生成记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pageHistory.filter(h => h.stepId === activeStepId).map((historyItem) => (
                    <div key={historyItem.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-slate-500">{historyItem.displayTime}</span>
                          </div>
                          <div className="text-sm text-slate-700 mb-2">
                            <div className="font-semibold">{historyItem.data.title}</div>
                            {historyItem.data.time && <div className="text-xs text-slate-500 mt-1">时间: {historyItem.data.time}</div>}
                            {historyItem.data.objective && <div className="text-xs text-slate-500 mt-1">目标: {historyItem.data.objective}</div>}
                            <div className="text-xs text-slate-500 mt-1">素材数量: {historyItem.data.assets?.length || 0}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
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
