/**
 * CanvasView.asset-generation.js - 资产生成相关处理函数
 * 功能：
 * 1. 处理AI资产的生成、选择和管理
 * 2. 支持图片、视频、音频、文本等多种资产类型
 * 3. 集成提示词优化和历史记录功能
 */

import { aiAssetService } from '../../../services/aiAssetService';
import { promptHistoryService, promptOptimizationService } from '../../../services/promptService';
import { optimizePrompt } from '../../../services/dashscope';

/**
 * 处理确认添加资产
 * @param {string} prompt - 提示词
 * @param {string} inputMode - 输入模式：direct或ai
 * @param {string} videoStyle - 视频风格
 * @param {Object} imageSize - 图片尺寸
 * @param {string} referenceImage - 参考图片
 * @param {string} lyrics - 歌词（用于音频生成）
 * @param {Object} audioConfig - 音频配置
 * @param {Object} promptModalConfig - 提示词模态框配置
 * @param {string} activePhase - 当前活跃的阶段
 * @param {string} activeStepId - 当前活跃的步骤ID
 * @param {Object} courseData - 课程数据
 * @param {Function} setCourseData - 更新课程数据的函数
 * @param {Function} setIsGenerating - 更新生成状态的函数
 * @param {Function} setShowPromptModal - 显示/隐藏提示词模态框的函数
 * @param {Function} setPromptModalConfig - 更新提示词模态框配置的函数
 * @param {Function} setCardSelectionImages - 更新卡片选择图片的函数
 * @param {Function} setSavedPromptIds - 更新保存的提示词ID的函数
 * @param {Function} setPendingAssetConfig - 更新待处理资产配置的函数
 * @param {Function} setShowCardSelectionModal - 显示/隐藏卡片选择模态框的函数
 * @param {Object} user - 用户信息
 * @param {Function} saveToHistory - 保存历史记录的函数
 * @param {Array} history - 历史记录数组
 * @param {number} historyIndex - 当前历史记录索引
 * @param {Function} setHistory - 更新历史记录的函数
 * @param {Function} setHistoryIndex - 更新历史记录索引的函数
 * @param {Function} setSelectedAssetId - 更新选中资产ID的函数
 * @param {Function} setIsRightOpen - 显示/隐藏右侧面板的函数
 */
export const handleConfirmAddAsset = async (
  prompt, inputMode, videoStyle, imageSize, referenceImage, lyrics, audioConfig,
  promptModalConfig, activePhase, activeStepId, courseData, setCourseData, setIsGenerating,
  setShowPromptModal, setPromptModalConfig, setCardSelectionImages, setSavedPromptIds,
  setPendingAssetConfig, setShowCardSelectionModal, user, saveToHistory, history, historyIndex, setHistory, setHistoryIndex,
  setSelectedAssetId, setIsRightOpen
) => {
  const type = promptModalConfig.assetType;
  const phaseData = Array.isArray(courseData) 
    ? courseData.find(p => p.id === activePhase)
    : courseData[activePhase];
  const step = phaseData?.slides?.find(s => s.id === activeStepId);
  if (!step) {
    return;
  }

  // 直接输入文本的场景：不走 AI 接口，只本地创建元素
  if (type === 'text' && inputMode === 'direct') {
    const newCourseData = JSON.parse(JSON.stringify(courseData));
    
    // 处理数组和对象两种格式
    const phase = Array.isArray(newCourseData) 
      ? newCourseData.find(p => p.id === activePhase)
      : newCourseData[activePhase];
    
    if (!phase) return;
    
    const currentStep = phase.steps.find(s => s.id === activeStepId);
    if (!currentStep) return;
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

    if (!currentStep.assets) {
      currentStep.assets = [];
    }
    currentStep.assets.push(newAsset);
    if (!currentStep.canvasAssets) {
      currentStep.canvasAssets = [];
    }
    currentStep.canvasAssets.push(newAsset);
    setCourseData(newCourseData);
    saveToHistory(newCourseData, history, historyIndex, setHistory, setHistoryIndex);
    setSelectedAssetId(newAsset.id);
    setIsRightOpen(true);
    setShowPromptModal(false);
    setPromptModalConfig({ type: null, assetType: null, phaseKey: null });
    return;
  }

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
    // 注意：音频类型不使用优化后的提示词，因为HeartMuLa更适合简洁的tags
    const shouldOptimize = type !== 'audio';
    if (shouldOptimize) {
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
    } else {
      console.log('音频类型跳过提示词优化，使用原始提示词:', basePrompt);
    }

    const phaseData = Array.isArray(courseData) 
      ? courseData.find(p => p.id === activePhase)
      : courseData[activePhase];
    if (!phaseData) {
      console.error('Phase not found:', activePhase, 'courseData:', courseData);
      return;
    }

    const newCourseData = JSON.parse(JSON.stringify(courseData));
    const stepsOrSlides = phaseData.steps || phaseData.slides;
    const currentStep = stepsOrSlides?.find(s => s.id === activeStepId);
    if (!currentStep) {
      console.error('Step not found:', activeStepId, 'phaseData:', phaseData, 'stepsOrSlides:', stepsOrSlides);
      return;
    }
    
    // 初始化 assets 和 canvasAssets 数组
    if (!currentStep.assets) {
      currentStep.assets = [];
    }
    if (!currentStep.canvasAssets) {
      currentStep.canvasAssets = [];
    }

    // 使用用户选择的尺寸，如果没有则使用默认值
    let w = imageSize?.width || 300;
    let h = imageSize?.height || 200;
    if (type === 'audio') { w = 300; h = 100; }
    if (type === 'text') { w = 300; h = 100; }

    let generatedUrl = '';
    let generatedContent = '';

    // 2) 调用 AI 生成接口（/prompt）
    if (type === 'image' || type === 'video') {
      console.log('准备生成图片:', { type, effectivePrompt, w, h, userId, organizationId, referenceImage });
      try {
        let result;

        // 如果有参考图片，使用图生图
        if (referenceImage) {
          console.log('使用图生图功能，参考图片:', referenceImage);
          result = await aiAssetService.generateImageToImage(
            effectivePrompt,
            referenceImage,
            {
              count: 4,
              width: w,
              height: h,
              user_id: userId,
              organization_id: organizationId
            }
          );
        } else {
          // 普通文生图
          result = await aiAssetService.generateMultipleImages(
            effectivePrompt,
            {
              count: 4,
              width: w,
              height: h,
              user_id: userId,
              organization_id: organizationId
            }
          );
        }

        console.log('生成图片API返回结果:', result);

        if (!result.success || !result.tasks) {
          throw new Error('生成图片失败');
        }
        
        // 立即显示抽卡界面（loading状态）
        const loadingImages = result.tasks.map((task, index) => ({
          url: null,
          prompt: `${effectivePrompt} - 教学场景 ${index + 1}`,
          loading: true,
          index
        }));

        setCardSelectionImages(loadingImages);
        
        // 保存所有 promptId 到状态中
        const allPromptIds = result.tasks.map(task => task.promptId);
        setSavedPromptIds(allPromptIds);
        
        const pendingConfig = {
          type,
          effectivePrompt,
          w,
          h,
          generatedTitle: basePrompt
            ? `AI生成：${basePrompt.substring(0, 15)}...`
            : `New ${type}`,
          referenceImage,
          lyrics: lyrics
        };
        setPendingAssetConfig(pendingConfig);
        
        setShowCardSelectionModal(true);
        
        setShowPromptModal(false);
        setPromptModalConfig({ type: null, assetType: null, phaseKey: null });

        // 使用保存的 promptId 列表查询任务状态
        if (!allPromptIds || allPromptIds.length === 0) {
          setIsGenerating(false);
          return;
        }
        
        // 轮询每个任务，完成后立即更新抽卡界面
        const pollPromises = allPromptIds.map(async (promptId, index) => {
          try {
            const imageResult = await aiAssetService.pollTaskAndUpload(
              promptId,
              index,
              effectivePrompt,
              60,
              2000,
              (progress) => {
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
            : `New ${type}`,
          referenceImage
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
      // 音频生成 - 使用AI服务生成多个音频供选择
      const audioDuration = audioConfig?.duration || 30;
      const audioStyle = audioConfig?.style || '';
      // 合并风格标签和用户提示词（风格在前）
      const finalPrompt = audioStyle 
        ? `${audioStyle}, ${effectivePrompt}` 
        : effectivePrompt;
      console.log('准备生成音频:', { type, finalPrompt, lyrics, audioDuration, audioStyle, userId, organizationId });
      try {
        const result = await aiAssetService.generateMultipleAudio(
          finalPrompt,
          {
            count: 4,
            lyrics: lyrics,
            duration: audioDuration,
            user_id: userId,
            organization_id: organizationId
          }
        );

        console.log('生成音频API返回结果:', result);

        if (!result.success || !result.tasks) {
          throw new Error('生成音频失败');
        }

        // 立即显示抽卡界面（loading状态）
        const loadingAudios = result.tasks.map((task, index) => ({
          url: null,
          prompt: `${effectivePrompt} - 音频 ${index + 1}`,
          loading: true,
          index
        }));

        setCardSelectionImages(loadingAudios);

        // 保存所有 promptId 到状态中
        const allPromptIds = result.tasks.map(task => task.promptId);
        setSavedPromptIds(allPromptIds);

        const pendingConfig = {
          type,
          effectivePrompt,
          w,
          h,
          generatedTitle: basePrompt
            ? `AI生成：${basePrompt.substring(0, 15)}...`
            : `New ${type}`,
          referenceImage
        };
        setPendingAssetConfig(pendingConfig);

        setShowCardSelectionModal(true);

        setShowPromptModal(false);
        setPromptModalConfig({ type: null, assetType: null, phaseKey: null });

        // 使用保存的 promptId 列表查询任务状态
        if (!allPromptIds || allPromptIds.length === 0) {
          setIsGenerating(false);
          return;
        }

        // 轮询每个任务，完成后立即更新抽卡界面
        // 音频生成可能需要较长时间，增加轮询次数和间隔
        const pollPromises = allPromptIds.map(async (promptId, index) => {
          try {
            const audioResult = await aiAssetService.pollTaskAndUpload(
              promptId,
              index,
              effectivePrompt,
              180, // 增加到180次（6分钟）
              3000, // 增加到3秒间隔
              (progress) => {
                if (progress.status === 'completed') {
                  // 任务完成，更新抽卡界面
                  setCardSelectionImages(prevImages => {
                    const newImages = [...prevImages];
                    newImages[index] = {
                      url: progress.url,
                      prompt: `${effectivePrompt} - 音频 ${index + 1}`,
                      loading: false,
                      completed: true,
                      index,
                      isAudio: true
                    };
                    return newImages;
                  });
                }
              }
            );

            return audioResult;
          } catch (error) {
            console.error(`音频任务 ${index + 1} 失败:`, error);

            // 任务失败，更新抽卡界面显示占位图
            setCardSelectionImages(prevImages => {
              const newImages = [...prevImages];
              const randomColor = Math.floor(Math.random() * 16777215).toString(16);
              newImages[index] = {
                url: `https://placehold.co/${w}x${h}/${randomColor}/FFF?text=Audio+Failed+${index + 1}`,
                prompt: `${effectivePrompt} - 音频 ${index + 1} (生成失败)`,
                loading: false,
                error: error?.message || '生成失败',
                index,
                isAudio: true
              };
              console.log(`更新失败音频 ${index + 1}:`, newImages[index]);
              return newImages;
            });

            throw error;
          }
        });

        // 等待所有任务完成
        await Promise.allSettled(pollPromises);

        console.log('所有音频任务轮询完成');
        setIsGenerating(false);
        return;
      } catch (error) {
        console.error('生成音频失败:', error);
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
        const generatedAudios = [];
        for (let i = 0; i < 4; i++) {
          const randomColor = Math.floor(Math.random() * 16777215).toString(16);
          generatedAudios.push({
            url: `https://placehold.co/${w}x${h}/${randomColor}/FFF?text=Audio+Failed+${i + 1}`,
            prompt: `${effectivePrompt} - 音频 ${i + 1} (生成失败)`,
            error: error?.message || '生成失败',
            isAudio: true
          });
        }

        console.log('设置音频卡片选择:', generatedAudios);
        setCardSelectionImages(generatedAudios);

        const pendingConfig = {
          type,
          effectivePrompt,
          w,
          h,
          generatedTitle: basePrompt
            ? `AI生成：${basePrompt.substring(0, 15)}...`
            : `New ${type}`,
          lyrics
        };
        console.log('设置待确认配置:', pendingConfig);
        setPendingAssetConfig(pendingConfig);

        console.log('显示音频抽卡模态框');
        setShowCardSelectionModal(true);
        setIsGenerating(false);
        setShowPromptModal(false);
        setPromptModalConfig({ type: null, assetType: null, phaseKey: null });
      }
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

    // 同时添加到 assets 和 canvasAssets
    currentStep.assets.push(newAsset);
    currentStep.canvasAssets.push(newAsset);
    setCourseData(newCourseData);
    saveToHistory(newCourseData, history, historyIndex, setHistory, setHistoryIndex);
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
        : `New ${type}`,
      referenceImage
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

// 通过分镜向导（VideoStoryboardModal）确认并直接将视频添加到画布
export const handleConfirmAddVideoAsset = (videoData, activePhase, activeStepId, courseData, setCourseData, saveToHistory, history, historyIndex, setHistory, setHistoryIndex, setSelectedAssetId, setIsRightOpen, setShowPromptModal, setPromptModalConfig) => {
  const phaseData = Array.isArray(courseData) 
    ? courseData.find(p => p.id === activePhase)
    : courseData[activePhase];
  if (!phaseData) return;

  const newCourseData = JSON.parse(JSON.stringify(courseData));

  // 处理数组和对象两种格式
  const phase = Array.isArray(newCourseData) 
    ? newCourseData.find(p => p.id === activePhase)
    : newCourseData[activePhase];

  if (!phase) return;

  const stepsOrSlides = phase.steps || phase.slides;
  if (!stepsOrSlides) return;

  const currentStep = stepsOrSlides.find(s => s.id === activeStepId);
  if (!currentStep) return;

  if (!currentStep.assets) currentStep.assets = [];
  if (!currentStep.canvasAssets) currentStep.canvasAssets = [];

  const w = 400;
  const h = 225; // 16:9

  const newAsset = {
    id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: 'video',
    title: videoData.title || 'AI生成视频',
    url: videoData.videoUrl || '',
    content: '',
    prompt: videoData.description || '',
    referenceImage: null,
    videoStyle: 'realistic',
    x: 100,
    y: 100,
    width: w,
    height: h,
    rotation: 0,
    storyboardData: {
      scenes: videoData.scenes,
      referenceImages: videoData.referenceImages
    }
  };

  currentStep.assets.push(newAsset);
  currentStep.canvasAssets.push(newAsset);

  setCourseData(newCourseData);
  saveToHistory(newCourseData, history, historyIndex, setHistory, setHistoryIndex);
  setSelectedAssetId(newAsset.id);
  setIsRightOpen(true);
  setShowPromptModal(false);
  setPromptModalConfig({ type: null, assetType: null, phaseKey: null, addAtEnd: false });
};

// 处理卡片选择确认
export const handleCardSelectionConfirm = (selectedImage, pendingAssetConfig, activePhase, activeStepId, courseData, setCourseData, setShowCardSelectionModal, setCardSelectionImages, setPendingAssetConfig, setSelectedAssetId, setIsRightOpen, saveToHistory, history, historyIndex, setHistory, setHistoryIndex) => {
  if (!pendingAssetConfig) return;
  const { type, effectivePrompt, w, h, generatedTitle, referenceImage, lyrics, duration, style } = pendingAssetConfig;
  
  const phaseData = Array.isArray(courseData) 
    ? courseData.find(p => p.id === activePhase)
    : courseData[activePhase];
  if (!phaseData) {
    console.error('Phase not found:', activePhase);
    return;
  }
  
  const stepsOrSlides = phaseData.steps || phaseData.slides;
  const currentStep = stepsOrSlides?.find(s => s.id === activeStepId);
  
  if (!currentStep) {
    console.error('Step not found:', activeStepId, 'stepsOrSlides:', stepsOrSlides);
    return;
  }
  
  // 深拷贝 courseData
  const newCourseData = JSON.parse(JSON.stringify(courseData));
  
  // 获取新的 phase 和 step
  const newPhase = Array.isArray(newCourseData) 
    ? newCourseData.find(p => p.id === activePhase)
    : newCourseData[activePhase];
  
  if (!newPhase) {
    console.error('Phase not found in newCourseData:', activePhase);
    return;
  }
  
  const newStepsOrSlides = newPhase.steps || newPhase.slides;
  const newCurrentStep = newStepsOrSlides?.find(s => s.id === activeStepId);
  
  if (!newCurrentStep) {
    console.error('Step not found in newCourseData:', activeStepId);
    return;
  }
  
  // 初始化 assets 或 canvasAssets 数组
  if (!newCurrentStep.assets) {
    newCurrentStep.assets = [];
  }
  if (!newCurrentStep.canvasAssets) {
    newCurrentStep.canvasAssets = [];
  }
  
  const newAsset = {
    id: Date.now().toString(),
    type,
    title: generatedTitle,
    url: selectedImage.url,
    content: '',
    prompt: effectivePrompt,
    referenceImage: referenceImage || null,
    lyrics: lyrics || '',
    duration: duration || 30,
    style: style || '',
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

  // 同时添加到 assets 和 canvasAssets
  newCurrentStep.assets.push(newAsset);
  newCurrentStep.canvasAssets.push(newAsset);
  
  console.log('添加资产到画布:', newAsset);
  console.log('更新后的 courseData:', newCourseData);
  
  setCourseData(newCourseData);
  saveToHistory(newCourseData, history, historyIndex, setHistory, setHistoryIndex);
  setSelectedAssetId(newAsset.id);
  setIsRightOpen(true);
  setShowCardSelectionModal(false);
  setCardSelectionImages([]);
  setPendingAssetConfig(null);
};

// 处理重新生成资产
export const handleRegenerateAsset = async (assetId, activePhase, activeStepId, courseData, setCourseData, saveToHistory, setGeneratingAssetId, user, saveGenerationHistory) => {
  const phaseData = Array.isArray(courseData) 
    ? courseData.find(p => p.id === activePhase)
    : courseData[activePhase];
  const step = phaseData?.slides?.find(s => s.id === activeStepId);
  const asset = step?.assets?.find(a => a.id === assetId) || step?.elements?.find(a => a.id === assetId);
  if (!asset) return;
  
  if (asset.type === 'text' && asset.content) {
    saveGenerationHistory(assetId, asset.type, asset.content, asset.prompt);
  } else if ((asset.type === 'image' || asset.type === 'video' || asset.type === 'audio') && asset.url) {
    saveGenerationHistory(assetId, asset.type, asset.url, asset.prompt);
  }
  
  setGeneratingAssetId(assetId);
  
  try {
    const newCourseData = JSON.parse(JSON.stringify(courseData));
    
    // 处理数组和对象两种格式
    const phase = Array.isArray(newCourseData) 
      ? newCourseData.find(p => p.id === activePhase)
      : newCourseData[activePhase];
    
    if (!phase) {
      setGeneratingAssetId(null);
      return;
    }
    
    const stepsOrSlides = phase.steps || phase.slides;
    if (!stepsOrSlides) {
      setGeneratingAssetId(null);
      return;
    }
    
    const step = stepsOrSlides.find(s => s.id === activeStepId);
    if (!step) {
      setGeneratingAssetId(null);
      return;
    }
    const asset = step.assets?.find(a => a.id === assetId) || step.elements?.find(a => a.id === assetId);
    if (!asset) {
      setGeneratingAssetId(null);
      return;
    }
    
    if (asset.type === 'text') {
      asset.content = asset.prompt 
        ? `根据提示词"${asset.prompt}"重新生成的文本内容 (v${Date.now().toString().slice(-4)})`
        : `重新生成的文本内容 (v${Date.now().toString().slice(-4)})`;
    } else if (asset.type === 'image') {
      const prompt = asset.prompt || asset.title || '教学场景';
      
      // 如果有参考图片，使用图生图
      if (asset.referenceImage) {
        console.log('使用图生图功能，参考图片:', asset.referenceImage);
        const result = await aiAssetService.generateImageToImageWithPolling(
          prompt,
          asset.referenceImage,
          {
            count: 1,
            width: asset.width || 300,
            height: asset.height || 200,
            user_id: user?.id,
            organization_id: user?.organizationId
          }
        );
        if (result.success && result.images && result.images.length > 0) {
          asset.url = result.images[0].url;
        } else {
          throw new Error('图生图失败');
        }
      } else {
        // 普通文生图
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
      }
    } else if (asset.type === 'video') {
      const prompt = asset.prompt || asset.title || '教学视频';
      
      // 如果有参考图片，使用图生图
      if (asset.referenceImage) {
        console.log('使用图生图功能，参考图片:', asset.referenceImage);
        const result = await aiAssetService.generateImageToImageWithPolling(
          prompt,
          asset.referenceImage,
          {
            count: 1,
            width: asset.width || 300,
            height: asset.height || 200,
            user_id: user?.id,
            organization_id: user?.organizationId
          }
        );
        if (result.success && result.images && result.images.length > 0) {
          asset.url = result.images[0].url;
        } else {
          throw new Error('图生图失败');
        }
      } else {
        // 普通文生图
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
      }
    } else if (asset.type === 'audio') {
      const prompt = asset.prompt || asset.title || '教学音频';
      const lyrics = asset.lyrics || '';
      const duration = asset.duration || 30;
      const style = asset.style || '';
      // 合并风格标签和提示词（风格在前）
      const finalPrompt = style ? `${style}, ${prompt}` : prompt;
      
      // 使用AI服务生成音频
      const result = await aiAssetService.generateAudioWithPolling(
        finalPrompt,
        {
          count: 1,
          lyrics: lyrics,
          duration: duration,
          user_id: user?.id,
          organization_id: user?.organizationId
        }
      );
      
      if (result.success && result.audios && result.audios.length > 0) {
        asset.url = result.audios[0].url;
      } else {
        throw new Error('音频生成失败');
      }
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
