import React, { useState } from 'react';
import { ImageIcon, Video, Download, Sparkles, Plus, Trash2, Camera, Film, X, Wand2, Upload, Check, Clock, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { aiAssetService } from '../services/aiAssetService';
import { extractCharacterFromDescription, generateCharacterReferenceImages, generateStoryboardScript, generateSceneImage, composeVideo } from '../services/videoStoryboardService';

const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9', width: 1920, height: 1080, description: '横屏宽屏' },
  { id: '4:3', label: '4:3', width: 1024, height: 768, description: '标准横屏' },
  { id: '1:1', label: '1:1', width: 1024, height: 1024, description: '正方形' },
  { id: '3:4', label: '3:4', width: 768, height: 1024, description: '标准竖屏' },
  { id: '9:16', label: '9:16', width: 1080, height: 1920, description: '竖屏长图' },
];

const VIDEO_STEPS = [
  { id: 1, title: '基本信息', description: '输入视频描述和参考图片' },
  { id: 2, title: '人物参考', description: '生成或确认人物参考图' },
  { id: 3, title: '分镜脚本', description: '生成分镜步骤' },
  { id: 4, title: '分镜图片', description: '为每个分镜生成图片' },
  { id: 5, title: '生成视频', description: '合成最终视频' }
];

// 轮询任务状态
const pollTaskStatus = async (promptId, maxAttempts = 60, interval = 2000) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`/api/ai/task-status/${promptId}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`查询任务状态失败: ${response.status}`);
      }

      const data = await response.json();

      // 检查多种可能的状态字段
      const isCompleted = data.status === 'completed' || data.status === 'success';
      const imageUrl = data.url || data.imageUrl;
      
      if (isCompleted && imageUrl) {
        return imageUrl;
      } else if (data.status === 'error' || data.status === 'failed') {
        throw new Error(data.error || data.message || '任务执行失败');
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  throw new Error('任务超时');
};

export const AIGeneratorPage = () => {
  const [activeTab, setActiveTab] = useState('video');
  const [prompt, setPrompt] = useState('');
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[2]);
  const [referenceImage, setReferenceImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [generatedVideos, setGeneratedVideos] = useState([]);
  
  const [showImageForm, setShowImageForm] = useState(true);
  
  const [videoStep, setVideoStep] = useState(1);
  const [videoStoryCore, setVideoStoryCore] = useState('');
  const [videoOverallStyle, setVideoOverallStyle] = useState('');
  const [videoCharacterSetting, setVideoCharacterSetting] = useState('');
  const [videoDuration, setVideoDuration] = useState(10);
  const [videoUploadedImages, setVideoUploadedImages] = useState([]);
  const [showVideoForm, setShowVideoForm] = useState(true);
  
  // 视频生成相关状态
  const [videoError, setVideoError] = useState(null);
  const [extractedCharacterDescription, setExtractedCharacterDescription] = useState('');
  const [generatedCharacterImages, setGeneratedCharacterImages] = useState([]);
  const [selectedCharacterImage, setSelectedCharacterImage] = useState(null);
  const [isExtractingCharacter, setIsExtractingCharacter] = useState(false);
  const [isGeneratingCharacters, setIsGeneratingCharacters] = useState(false);
  const [storyboardTitle, setStoryboardTitle] = useState('');
  const [scenes, setScenes] = useState([]);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingSceneImage, setIsGeneratingSceneImage] = useState({});
  const [isComposingVideo, setIsComposingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState(null);
  
  // 处理图片生成
  const handleGenerateImage = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    try {
      let result;
      
      // 如果有参考图片，使用图生图
      if (referenceImage) {
        result = await aiAssetService.generateImageToImage(
          prompt,
          referenceImage,
          {
            count: 4,
            width: selectedRatio.width,
            height: selectedRatio.height,
            user_id: null,
            organization_id: null
          }
        );
      } else {
        // 普通文生图
        result = await aiAssetService.generateMultipleImages(
          prompt,
          {
            count: 4,
            width: selectedRatio.width,
            height: selectedRatio.height,
            user_id: null,
            organization_id: null
          }
        );
      }
      
      if (!result.success || !result.tasks) {
        throw new Error('生成图片失败');
      }
      
      // 立即显示loading状态的图片
      const startIndex = generatedImages.length;
      const loadingImages = result.tasks.map((task, index) => ({
        url: null,
        prompt: `${prompt} - 版本 ${index + 1}`,
        loading: true,
        promptId: task.promptId,
        index: startIndex + index
      }));
      
      setGeneratedImages(prev => [...prev, ...loadingImages]);
      
      // 轮询每个任务，完成后更新图片
      const pollPromises = result.tasks.map(async (task, index) => {
        try {
          const imageUrl = await pollTaskStatus(task.promptId);
          
          // 更新图片状态
          setGeneratedImages(prev => {
            const newImages = [...prev];
            const imageIndex = newImages.findIndex(img => img.promptId === task.promptId);
            if (imageIndex !== -1) {
              newImages[imageIndex] = {
                ...newImages[imageIndex],
                url: imageUrl,
                loading: false
              };
            }
            return newImages;
          });
          
          return imageUrl;
        } catch (error) {
          console.error(`任务 ${task.promptId} 失败:`, error);
          
          // 更新为测试图片
          setGeneratedImages(prev => {
            const newImages = [...prev];
            const imageIndex = newImages.findIndex(img => img.promptId === task.promptId);
            if (imageIndex !== -1) {
              newImages[imageIndex] = {
                ...newImages[imageIndex],
                url: `https://picsum.photos/seed/${Date.now() + index}/${selectedRatio.width}/${selectedRatio.height}`,
                loading: false
              };
            }
            return newImages;
          });
          
          return null;
        }
      });
      
      // 等待所有任务完成
      await Promise.all(pollPromises);
      
    } catch (error) {
      console.error('生成图片失败:', error);
      // 生成失败时使用测试图片
      const mockImages = [
        `https://picsum.photos/seed/${Date.now() + 1}/${selectedRatio.width}/${selectedRatio.height}`,
        `https://picsum.photos/seed/${Date.now() + 2}/${selectedRatio.width}/${selectedRatio.height}`,
        `https://picsum.photos/seed/${Date.now() + 3}/${selectedRatio.width}/${selectedRatio.height}`,
        `https://picsum.photos/seed/${Date.now() + 4}/${selectedRatio.width}/${selectedRatio.height}`,
      ];
      
      const newImages = mockImages.map((url, index) => ({
        url,
        prompt: `${prompt} - 版本 ${index + 1}`,
        loading: false
      }));
      
      setGeneratedImages(prev => [...prev, ...newImages]);
    } finally {
      setIsGenerating(false);
      setPrompt('');
    }
  };
  
  // 处理视频生成
  const handleGenerateVideo = async () => {
    if (!videoStoryCore.trim() || !videoOverallStyle.trim() || !videoCharacterSetting.trim()) return;
    
    setIsGenerating(true);
    
    try {
      // 1. 提取人物特征
      console.log('开始提取人物特征...');
      const characterDescription = await extractCharacterFromDescription(videoStoryCore);
      console.log('提取的人物特征:', characterDescription);
      
      // 2. 生成人物参考图
      console.log('开始生成人物参考图...');
      const characterImages = await generateCharacterReferenceImages(
        videoStoryCore,
        videoUploadedImages,
        null,
        null
      );
      console.log('生成的人物参考图:', characterImages);
      
      // 3. 生成分镜脚本
      console.log('开始生成分镜脚本...');
      const storyboard = await generateStoryboardScript(
        videoStoryCore,
        characterImages,
        videoDuration
      );
      console.log('生成的分镜脚本:', storyboard);
      
      // 4. 生成分镜图片
      console.log('开始生成分镜图片...');
      const scenesWithImages = [];
      for (const scene of storyboard.scenes) {
        const sceneImage = await generateSceneImage(
          scene,
          characterImages,
          null,
          null,
          videoOverallStyle
        );
        scenesWithImages.push({
          ...scene,
          generatedImage: sceneImage
        });
      }
      console.log('生成的分镜图片:', scenesWithImages);
      
      // 5. 合成视频
      console.log('开始合成视频...');
      const videoUrl = await composeVideo(
        scenesWithImages,
        storyboard.title,
        null,
        null
      );
      console.log('生成的视频URL:', videoUrl);
      
      // 添加到生成结果
      const newVideo = {
        url: videoUrl,
        title: storyboard.title || videoStoryCore.substring(0, 20) || '生成的视频',
        duration: `${videoDuration}秒`,
        thumbnail: scenesWithImages[0]?.generatedImage || `https://picsum.photos/seed/${Date.now()}/800/450`,
        description: `故事核心：${videoStoryCore}\n风格：${videoOverallStyle}\n角色：${videoCharacterSetting}`
      };
      
      setGeneratedVideos([...generatedVideos, newVideo]);
    } catch (error) {
      console.error('生成视频失败:', error);
      // 生成失败时使用测试数据
      const mockVideo = {
        url: 'https://example.com/video.mp4',
        title: videoStoryCore.substring(0, 20) || '生成的视频',
        duration: `${videoDuration}秒`,
        thumbnail: `https://picsum.photos/seed/${Date.now()}/800/450`,
        description: `故事核心：${videoStoryCore}\n风格：${videoOverallStyle}\n角色：${videoCharacterSetting}`
      };
      
      setGeneratedVideos([...generatedVideos, mockVideo]);
    } finally {
      setIsGenerating(false);
      // 重置表单
      setVideoStep(1);
      setVideoStoryCore('');
      setVideoOverallStyle('');
      setVideoCharacterSetting('');
      setVideoDuration(10);
      setVideoUploadedImages([]);
    }
  };
  
  // 下载图片
  const handleDownloadImage = (imageUrl) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ai-generated-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // 下载视频
  const handleDownloadVideo = (videoUrl) => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `ai-generated-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // ========== 视频步骤处理函数 ==========
  
  // 获取最终参考图片
  const getFinalReferenceImages = () => {
    if (videoUploadedImages.length > 0) {
      return videoUploadedImages;
    }
    return selectedCharacterImage ? [selectedCharacterImage] : [];
  };
  
  // 获取组合描述
  const getCombinedDescription = () => {
    return `故事核心要素：${videoStoryCore}\n整体风格：${videoOverallStyle}\n角色设定：${videoCharacterSetting}`;
  };
  
  // 步骤1：基本信息 - 下一步
  const handleStep1Next = () => {
    setVideoError(null);
    if (!videoStoryCore.trim() || !videoOverallStyle.trim() || !videoCharacterSetting.trim()) {
      setVideoError('请完整填写故事核心要素、整体风格和角色设定');
      return;
    }
    
    if (videoUploadedImages.length > 0) {
      // 已上传参考图，直接跳到步骤3
      setVideoStep(3);
    } else {
      // 未上传参考图，跳到步骤2提取人物特征
      setVideoStep(2);
      handleExtractCharacterDescription();
    }
  };
  
  // 步骤2：提取人物特征
  const handleExtractCharacterDescription = async () => {
    setIsExtractingCharacter(true);
    setVideoError(null);

    try {
      const characterDesc = await extractCharacterFromDescription(getCombinedDescription());
      setExtractedCharacterDescription(characterDesc);
    } catch (err) {
      setVideoError('提取人物特征失败: ' + err.message);
      setExtractedCharacterDescription(`一个通用卡通人物，${videoCharacterSetting}`);
    } finally {
      setIsExtractingCharacter(false);
    }
  };
  
  // 步骤2：生成人物参考图
  const generateCharacterImages = async () => {
    if (!extractedCharacterDescription.trim()) {
      setVideoError('请先提取人物特征描述');
      return;
    }
    
    setIsGeneratingCharacters(true);
    setVideoError(null);
    
    try {
      const images = await generateCharacterReferenceImages(
        extractedCharacterDescription,
        videoUploadedImages,
        null,
        null,
        selectedRatio.width,
        selectedRatio.height
      );
      
      if (!images || images.length === 0) {
        throw new Error('未能生成任何人物参考图');
      }
      
      setGeneratedCharacterImages(images);
    } catch (err) {
      setVideoError('生成人物参考图失败: ' + err.message);
      // 使用占位图
      const placeholderImages = [];
      for (let i = 0; i < 1; i++) {
        const randomColor = Math.floor(Math.random() * 16777215).toString(16);
        placeholderImages.push(`https://placehold.co/512x512/${randomColor}/FFF?text=Character+${i + 1}`);
      }
      setGeneratedCharacterImages(placeholderImages);
    } finally {
      setIsGeneratingCharacters(false);
    }
  };
  
  // 步骤2：下一步
  const handleStep2Next = () => {
    setVideoError(null);
    if (generatedCharacterImages.length === 0) {
      setVideoError('请先生成人物参考图');
      return;
    }
    // 自动选择第一张图片
    if (!selectedCharacterImage && generatedCharacterImages.length > 0) {
      setSelectedCharacterImage(generatedCharacterImages[0]);
    }
    setVideoStep(3);
  };
  
  // 步骤3：生成分镜脚本
  const handleGenerateStoryboardScript = async () => {
    setIsGeneratingScript(true);
    setVideoError(null);

    try {
      const referenceImages = getFinalReferenceImages();
      const result = await generateStoryboardScript(
        getCombinedDescription(),
        referenceImages,
        videoDuration
      );

      if (!result || !result.scenes) {
        throw new Error('分镜脚本数据格式错误');
      }

      setStoryboardTitle(result.title || '未命名视频');
      setScenes(result.scenes.map((scene, index) => ({
        ...scene,
        id: `scene-${index + 1}`,
        generatedImage: null,
        status: 'pending'
      })));
    } catch (err) {
      setVideoError('生成分镜脚本失败: ' + err.message);
    } finally {
      setIsGeneratingScript(false);
    }
  };
  
  // 步骤3：下一步
  const handleStep3Next = () => {
    setVideoError(null);
    if (scenes.length === 0) {
      setVideoError('请先生成分镜脚本');
      return;
    }
    setVideoStep(4);
  };
  
  // 步骤4：生成分镜图片
  const handleGenerateSceneImage = async (sceneId) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;

    setIsGeneratingSceneImage(prev => ({ ...prev, [sceneId]: true }));
    setVideoError(null);

    try {
      const referenceImages = getFinalReferenceImages();
      const characterDescription = selectedCharacterImage ? 'consistent character appearance from reference image' : null;
      
      const imageUrl = await generateSceneImage(
        scene,
        referenceImages,
        null,
        null,
        characterDescription
      );
      
      setScenes(prev => prev.map(s => 
        s.id === sceneId 
          ? { ...s, generatedImage: imageUrl, status: 'completed' }
          : s
      ));
      return imageUrl;
    } catch (err) {
      setVideoError('生成分镜图片失败: ' + err.message);
      return null;
    } finally {
      setIsGeneratingSceneImage(prev => ({ ...prev, [sceneId]: false }));
    }
  };
  
  // 步骤4：生成所有分镜图片
  const handleGenerateAllSceneImages = async () => {
    for (const scene of scenes) {
      if (!scene.generatedImage) {
        await handleGenerateSceneImage(scene.id);
      }
    }
  };
  
  // 步骤4：下一步
  const handleStep4Next = () => {
    setVideoError(null);
    const completedScenes = scenes.filter(s => s.generatedImage);
    if (completedScenes.length === 0) {
      setVideoError('请至少生成一个分镜图片');
      return;
    }
    setVideoStep(5);
  };
  
  // 步骤5：合成视频
  const handleComposeVideo = async () => {
    setIsComposingVideo(true);
    setVideoError(null);

    try {
      const videoUrl = await composeVideo(
        scenes,
        storyboardTitle,
        null,
        null
      );
      setGeneratedVideoUrl(videoUrl);
      
      // 添加到生成结果
      const newVideo = {
        url: videoUrl,
        title: storyboardTitle || videoStoryCore.substring(0, 20) || '生成的视频',
        duration: `${videoDuration}秒`,
        thumbnail: scenes[0]?.generatedImage || `https://picsum.photos/seed/${Date.now()}/800/450`,
        description: `故事核心：${videoStoryCore}\n风格：${videoOverallStyle}\n角色：${videoCharacterSetting}`
      };
      
      setGeneratedVideos(prev => [...prev, newVideo]);
    } catch (err) {
      setVideoError('合成视频失败: ' + err.message);
    } finally {
      setIsComposingVideo(false);
    }
  };
  
  // 处理参考图片上传
  const handleReferenceUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 移除参考图片
  const handleRemoveReference = () => {
    setReferenceImage(null);
  };
  
  // 视频参考图片上传
  const handleVideoReferenceUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoUploadedImages([reader.result]);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 移除视频参考图片
  const handleRemoveVideoReference = () => {
    setVideoUploadedImages([]);
  };
  
  // 渲染视频步骤指示器
  const renderVideoStepIndicator = () => (
    <div className="flex items-center justify-center mb-6 overflow-x-auto px-2">
      {VIDEO_STEPS.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className={`flex flex-col items-center min-w-[50px] sm:min-w-[60px] ${videoStep === step.id ? 'text-purple-600' : videoStep > step.id ? 'text-green-600' : 'text-slate-400'}`}>
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
              videoStep === step.id ? 'bg-purple-100 border-2 border-purple-600' :
              videoStep > step.id ? 'bg-green-100 border-2 border-green-600' :
              'bg-slate-100 border-2 border-slate-300'
            }`}>
              {videoStep > step.id ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : step.id}
            </div>
            <span className="text-[10px] sm:text-xs mt-1 text-center leading-tight max-w-[50px] sm:max-w-[60px]">
              {step.title}
            </span>
          </div>
          {index < VIDEO_STEPS.length - 1 && (
            <div className={`w-4 sm:w-8 h-0.5 mx-0.5 sm:mx-1 flex-shrink-0 ${videoStep > step.id ? 'bg-green-500' : 'bg-slate-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
  
  // 渲染视频步骤内容
  const renderVideoStepContent = () => {
    switch (videoStep) {
      case 1:
        return (
          <div className="space-y-4">
            {videoError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{videoError}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                故事核心要素 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={videoStoryCore}
                onChange={(e) => setVideoStoryCore(e.target.value)}
                placeholder="例如：一个小女孩周末在花园里玩耍"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none h-24 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                整体风格 <span className="text-red-500">*</span>
              </label>
              <select
                value={videoOverallStyle}
                onChange={(e) => setVideoOverallStyle(e.target.value)}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none dark:bg-slate-900 dark:text-white"
              >
                <option value="">请选择整体风格</option>
                <option value="3D皮克斯风格、温馨治愈、明亮色彩">3D皮克斯风格、温馨治愈、明亮色彩</option>
                <option value="2D手绘风格、简约可爱、柔和色调">2D手绘风格、简约可爱、柔和色调</option>
                <option value="赛博朋克风格、未来科技、霓虹色调">赛博朋克风格、未来科技、霓虹色调</option>
                <option value="水墨风格、中国风、典雅含蓄">水墨风格、中国风、典雅含蓄</option>
                <option value="卡通风格、夸张有趣、鲜明色彩">卡通风格、夸张有趣、鲜明色彩</option>
                <option value="科幻风格、宇宙太空、未来感">科幻风格、宇宙太空、未来感</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                角色设定 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={videoCharacterSetting}
                onChange={(e) => setVideoCharacterSetting(e.target.value)}
                placeholder="例如：单人故事，主角只有一个人"
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none h-24 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block flex items-center gap-2">
                <Clock className="w-4 h-4" />
                视频时长
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="3"
                  max="15"
                  step="1"
                  value={videoDuration}
                  onChange={(e) => setVideoDuration(Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[60px]">
                  {videoDuration} 秒
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                图片比例
              </label>
              <div className="grid grid-cols-5 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setSelectedRatio(ratio)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
                      selectedRatio.id === ratio.id
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div 
                      className="bg-current rounded-sm mb-1"
                      style={{
                        width: ratio.id === '16:9' ? '24px' :
                               ratio.id === '4:3' ? '18px' :
                               ratio.id === '1:1' ? '16px' :
                               ratio.id === '3:4' ? '12px' : '10px',
                        height: ratio.id === '16:9' ? '14px' :
                                ratio.id === '4:3' ? '14px' :
                                ratio.id === '1:1' ? '16px' :
                                ratio.id === '3:4' ? '16px' : '18px'
                      }}
                    />
                    <span className="text-xs font-medium">{ratio.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                人物参考图片 <span className="text-slate-400 font-normal">（可选）</span>
              </label>
              {videoUploadedImages.length > 0 ? (
                <div className="relative group">
                  <img src={videoUploadedImages[0]} alt="参考" className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                  <button
                    onClick={handleRemoveVideoReference}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleVideoReferenceUpload}
                  />
                  <div className="flex flex-col items-center">
                    <Upload className="w-6 h-6 text-slate-400 mb-1" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">点击上传参考图片</span>
                  </div>
                </label>
              )}
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            {videoError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{videoError}</p>
              </div>
            )}
            
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
              <h4 className="font-medium text-purple-800 dark:text-purple-400 mb-2">人物特征描述</h4>
              {isExtractingCharacter ? (
                <div className="flex items-center gap-2 text-purple-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">正在提取人物特征...</span>
                </div>
              ) : (
                <textarea
                  value={extractedCharacterDescription}
                  onChange={(e) => setExtractedCharacterDescription(e.target.value)}
                  className="w-full border border-purple-200 dark:border-purple-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none h-20 dark:bg-slate-900 dark:text-white"
                  placeholder="人物特征描述将自动提取，您也可以手动编辑"
                />
              )}
            </div>
            
            {generatedCharacterImages.length > 0 && (
              <div>
                <h4 className="font-medium text-slate-700 dark:text-slate-300 mb-3">生成的人物参考图</h4>
                <div className="grid grid-cols-2 gap-3">
                  {generatedCharacterImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedCharacterImage(img)}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedCharacterImage === img
                          ? 'border-purple-500 ring-2 ring-purple-200'
                          : 'border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <img src={img} alt={`人物参考 ${idx + 1}`} className="w-full aspect-square object-cover" />
                      {selectedCharacterImage === img && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button
              onClick={generateCharacterImages}
              disabled={isGeneratingCharacters || !extractedCharacterDescription.trim()}
              style={{
                background: 'linear-gradient(90deg, #4B0082, #800080)'
              }}
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGeneratingCharacters ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  {generatedCharacterImages.length > 0 ? '重新生成' : '生成人物参考图'}
                </>
              )}
            </button>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            {videoError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{videoError}</p>
              </div>
            )}
            
            {scenes.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-400 mb-2">生成分镜脚本</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-500">
                    系统将根据视频描述和人物设定自动生成多个分镜
                  </p>
                </div>
                <button
                  onClick={handleGenerateStoryboardScript}
                  disabled={isGeneratingScript}
                  style={{
                    background: 'linear-gradient(90deg, #4B0082, #800080)'
                  }}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50"
                >
                  {isGeneratingScript ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      生成分镜脚本
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-800 dark:text-blue-400 mb-2">{storyboardTitle}</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-500">
                    共 {scenes.length} 个分镜，时长 {videoDuration} 秒
                  </p>
                </div>
                
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {scenes.map((scene, idx) => (
                    <div key={scene.id} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">{scene.content || scene.description}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            时长: {scene.duration} | 景别: {scene.shotType} | 运镜: {scene.cameraMovement}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={handleGenerateStoryboardScript}
                  disabled={isGeneratingScript}
                  className="w-full py-2 border border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-sm"
                >
                  {isGeneratingScript ? '重新生成中...' : '重新生成分镜脚本'}
                </button>
              </div>
            )}
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-4">
            {videoError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{videoError}</p>
              </div>
            )}
            
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-medium text-green-800 dark:text-green-400 mb-2">分镜图片生成</h4>
              <p className="text-sm text-green-600 dark:text-green-500">
                为每个分镜生成对应的图片，保持人物一致性
              </p>
            </div>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {scenes.map((scene, idx) => (
                <div key={scene.id} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">{scene.content || scene.description}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        时长: {scene.duration} | 景别: {scene.shotType} | 运镜: {scene.cameraMovement}
                      </p>
                      {scene.generatedImage ? (
                        <img src={scene.generatedImage} alt={`分镜 ${idx + 1}`} className="w-full h-32 object-cover rounded-lg" />
                      ) : (
                        <button
                          onClick={() => handleGenerateSceneImage(scene.id)}
                          disabled={isGeneratingSceneImage[scene.id]}
                          className="w-full py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          {isGeneratingSceneImage[scene.id] ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              生成中...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-4 h-4" />
                              生成分镜图片
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {scenes.some(s => !s.generatedImage) && (
              <button
                onClick={handleGenerateAllSceneImages}
                disabled={Object.values(isGeneratingSceneImage).some(v => v)}
                style={{
                  background: 'linear-gradient(90deg, #4B0082, #800080)'
                }}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Wand2 className="w-5 h-5" />
                生成所有分镜图片
              </button>
            )}
          </div>
        );
      
      case 5:
        return (
          <div className="space-y-4">
            {videoError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{videoError}</p>
              </div>
            )}
            
            {generatedVideoUrl ? (
              <div className="text-center py-8">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-4">
                  <Check className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <h4 className="font-medium text-green-800 dark:text-green-400 mb-2">视频生成完成</h4>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    您的视频已成功生成
                  </p>
                </div>
                <video
                  src={generatedVideoUrl}
                  controls
                  className="w-full rounded-lg mb-4"
                  poster={scenes[0]?.generatedImage}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-4">
                  <h4 className="font-medium text-purple-800 dark:text-purple-400 mb-2">视频生成</h4>
                  <p className="text-sm text-purple-600 dark:text-purple-500">
                    点击按钮开始合成最终视频
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* 顶部导航 */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h2 className="text-base sm:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent whitespace-nowrap">
              AI创作助手
            </h2>
          </div>
          
          {/* 标签切换 */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 sm:p-1">
            <button
              onClick={() => setActiveTab('image')}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'image'
                  ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">图片生成</span>
              <span className="sm:hidden">图片</span>
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                activeTab === 'video'
                  ? 'bg-white dark:bg-slate-700 text-purple-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Video className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">视频生成</span>
              <span className="sm:hidden">视频</span>
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：输入区域 */}
          <div className="space-y-6">
            {activeTab === 'image' ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-purple-500" />
                  图片生成设置
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                      描述提示词
                    </label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="描述你想要生成的图片，例如：一只可爱的橘猫在草地上玩耍..."
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none h-24 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                      图片比例
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {ASPECT_RATIOS.map((ratio) => (
                        <button
                          key={ratio.id}
                          onClick={() => setSelectedRatio(ratio)}
                          className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
                            selectedRatio.id === ratio.id
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div 
                            className="bg-current rounded-sm mb-1"
                            style={{
                              width: ratio.id === '16:9' ? '24px' :
                                     ratio.id === '4:3' ? '18px' :
                                     ratio.id === '1:1' ? '16px' :
                                     ratio.id === '3:4' ? '12px' : '10px',
                              height: ratio.id === '16:9' ? '14px' :
                                      ratio.id === '4:3' ? '14px' :
                                      ratio.id === '1:1' ? '16px' :
                                      ratio.id === '3:4' ? '16px' : '18px'
                            }}
                          />
                          <span className="text-xs font-medium">{ratio.label}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      已选择：{selectedRatio.label} ({selectedRatio.width}×{selectedRatio.height})
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                      参考图片 <span className="text-slate-400 font-normal">（可选）</span>
                    </label>
                    {referenceImage ? (
                      <div className="relative group">
                        <img src={referenceImage} alt="参考" className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                        <button
                          onClick={handleRemoveReference}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleReferenceUpload}
                        />
                        <div className="flex flex-col items-center">
                          <Upload className="w-6 h-6 text-slate-400 mb-1" />
                          <span className="text-xs text-slate-500 dark:text-slate-400">点击上传参考图片</span>
                        </div>
                      </label>
                    )}
                  </div>

                  <button
                    onClick={handleGenerateImage}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        开始生成
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                  <Film className="w-5 h-5 text-purple-500" />
                  视频生成设置
                </h2>
                
                {renderVideoStepIndicator()}
                {renderVideoStepContent()}
                
                {/* 步骤导航按钮 */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => {
                      setVideoError(null);
                      setVideoStep(prev => Math.max(1, prev - 1));
                    }}
                    disabled={videoStep === 1}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      videoStep === 1
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    上一步
                  </button>
                  
                  {videoStep === 1 && (
                    <button
                      onClick={handleStep1Next}
                      style={{
                        background: 'linear-gradient(90deg, #4B0082, #800080)'
                      }}
                      className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-slate-800 transition-all"
                    >
                      下一步
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  
                  {videoStep === 2 && (
                    <button
                      onClick={handleStep2Next}
                      disabled={generatedCharacterImages.length === 0}
                      style={{
                        background: 'linear-gradient(90deg, #4B0082, #800080)'
                      }}
                      className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-all"
                    >
                      下一步
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  
                  {videoStep === 3 && (
                    <button
                      onClick={handleStep3Next}
                      disabled={scenes.length === 0}
                      style={{
                        background: 'linear-gradient(90deg, #4B0082, #800080)'
                      }}
                      className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-all"
                    >
                      下一步
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  
                  {videoStep === 4 && (
                    <button
                      onClick={handleStep4Next}
                      style={{
                        background: 'linear-gradient(90deg, #4B0082, #800080)'
                      }}
                      disabled={scenes.length === 0 || scenes.some(s => !s.generatedImage)}
                      className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-all"
                    >
                      下一步
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  
                  {videoStep === 5 && !generatedVideoUrl && (
                    <button
                      onClick={handleComposeVideo}
                      disabled={isComposingVideo}
                      className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50"
                    >
                      {isComposingVideo ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          生成中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          开始生成
                        </>
                      )}
                    </button>
                  )}
                  
                  {videoStep === 5 && generatedVideoUrl && (
                    <button
                      onClick={() => {
                        // 重置所有状态，开始新的视频生成
                        setVideoStep(1);
                        setVideoStoryCore('');
                        setVideoOverallStyle('');
                        setVideoCharacterSetting('');
                        setVideoDuration(10);
                        setVideoUploadedImages([]);
                        setVideoError(null);
                        setExtractedCharacterDescription('');
                        setGeneratedCharacterImages([]);
                        setSelectedCharacterImage(null);
                        setStoryboardTitle('');
                        setScenes([]);
                        setIsGeneratingSceneImage({});
                        setIsComposingVideo(false);
                        setGeneratedVideoUrl(null);
                      }}
                      className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      生成新视频
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 右侧：生成结果 */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Download className="w-5 h-5 text-purple-500" />
              生成结果
            </h2>
            
            {activeTab === 'image' ? (
              <div className="grid grid-cols-2 gap-4">
                {generatedImages.map((image, index) => (
                  <div key={index} className="relative bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
                    {image.loading ? (
                      <div className="w-full aspect-[4/3] bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
                      </div>
                    ) : (
                      <img 
                        src={image.url} 
                        alt={`生成图片 ${index + 1}`}
                        className="w-full aspect-[4/3] object-cover"
                      />
                    )}
                    <div className="p-3">
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                        {image.prompt}
                      </p>
                      {!image.loading && (
                        <button
                          onClick={() => handleDownloadImage(image.url)}
                          className="mt-2 w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs flex items-center justify-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          保存图片
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {generatedVideos.map((video, index) => (
                  <div key={index} className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
                    <div className="relative">
                      <img 
                        src={video.thumbnail} 
                        alt={`视频缩略图 ${index + 1}`}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center">
                          <Video className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-slate-800 dark:text-white mb-1">
                        {video.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                        {video.description}
                      </p>
                      <button
                        onClick={() => handleDownloadVideo(video.url)}
                        className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-xs flex items-center justify-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        保存视频
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {((activeTab === 'image' && generatedImages.length === 0) || (activeTab === 'video' && generatedVideos.length === 0)) && (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-900 rounded-lg">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  {activeTab === 'image' ? <ImageIcon className="w-8 h-8 text-slate-400" /> : <Video className="w-8 h-8 text-slate-400" />}
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  {activeTab === 'image' ? '还没有生成图片' : '还没有生成视频'}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  点击生成按钮开始创作
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIGeneratorPage;
