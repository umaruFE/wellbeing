import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, RefreshCw, Image as ImageIcon, Video, Wand2, ChevronLeft, ChevronRight, Check, Clock, AlertCircle } from 'lucide-react';
import videoStoryboardService from '../services/videoStoryboardService';
import { aiAssetService } from '../services/aiAssetService';
import { uploadService } from '../services/uploadService';

// 步骤定义
const STEPS = [
  { id: 1, title: '基本信息', description: '输入视频描述和参考图片' },
  { id: 2, title: '分镜生成', description: '生成脚本和图片' },
  { id: 3, title: '生成视频', description: '合成最终视频' }
];

// 图片比例选项
const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9', width: 1920, height: 1080, description: '横屏宽屏' },
  { id: '4:3', label: '4:3', width: 1024, height: 768, description: '标准横屏' },
  { id: '1:1', label: '1:1', width: 1024, height: 1024, description: '正方形' },
  { id: '3:4', label: '3:4', width: 768, height: 1024, description: '标准竖屏' },
  { id: '9:16', label: '9:16', width: 1080, height: 1920, description: '竖屏长图' },
];

// IP占位图片数据
const IP_PLACEHOLDERS = [
  { id: 1, name: 'IP角色1', image: 'https://placehold.co/200x200/6366F96/FFF?text=IP+1' },
  { id: 2, name: 'IP角色2', image: 'https://placehold.co/200x200/6366F96/FFF?text=IP+2' },
  { id: 3, name: 'IP角色3', image: 'https://placehold.co/200x200/6366F96/FFF?text=IP+3' },
  { id: 4, name: 'IP角色4', image: 'https://placehold.co/200x200/6366F96/FFF?text=IP+4' },
  { id: 5, name: 'IP角色5', image: 'https://placehold.co/200x200/6366F96/FFF?text=IP+5' },
];

/**
 * VideoStoryboardModal - 视频分镜向导式编辑模态框
 * 分步骤完成视频生成：基本信息 → 人物参考 → 分镜脚本 → 分镜图片 → 生成视频
 */
export const VideoStoryboardModal = ({
  isOpen,
  onClose,
  initialDescription = '',
  initialReferenceImages = [],
  onConfirm,
  userId = null,
  organizationId = null
}) => {
  // 当前步骤
  const [currentStep, setCurrentStep] = useState(1);
  
  // 步骤1：基本信息
  const [storyCore, setStoryCore] = useState('');
  const [overallStyle, setOverallStyle] = useState('');
  const [videoDuration, setVideoDuration] = useState(10);
  const [uploadedReferenceImages, setUploadedReferenceImages] = useState(initialReferenceImages);
  const [uploadingImages, setUploadingImages] = useState({}); // file name -> boolean
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(ASPECT_RATIOS[0]); // 默认16:9
  const [selectedIPs, setSelectedIPs] = useState([]); // 选中的IP列表
  
  // 步骤2：分镜生成
  const [storyboardTitle, setStoryboardTitle] = useState('');
  const [scenes, setScenes] = useState([]);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [editingScene, setEditingScene] = useState(null); // { sceneId, field } 或 null
  const [isGeneratingSceneImage, setIsGeneratingSceneImage] = useState({}); // sceneId -> boolean
  
  // 步骤3：视频生成
  const [isComposingVideo, setIsComposingVideo] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState(null);
  
  // 全局状态
  const [error, setError] = useState(null);
  
  // 分镜图片预览（放大查看）
  const [previewImage, setPreviewImage] = useState(null); // { url: string, alt: string } | null

  const closePreviewImage = () => setPreviewImage(null);

  useEffect(() => {
    if (!previewImage) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') closePreviewImage();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewImage]);

  // 初始化
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setStoryCore('');
      setOverallStyle('');
      setVideoDuration(10);
      setUploadedReferenceImages(initialReferenceImages);
      setUploadingImages({});
      setSelectedAspectRatio(ASPECT_RATIOS[0]);
      setSelectedIPs([]);
      setStoryboardTitle('');
      setScenes([]);
      setIsGeneratingSceneImage({});
      setIsComposingVideo(false);
      setGeneratedVideoUrl(null);
      setError(null);
      setPreviewImage(null);
    }
  }, [isOpen, initialReferenceImages]);

  // 自动生成分镜脚本和图片（当进入第2步且还没有脚本时）
  useEffect(() => {
    if (currentStep === 2 && scenes.length === 0 && !isGeneratingScript) {
      generateStoryboardScript();
    }
  }, [currentStep, scenes.length]);

  // 获取最终参考图片（上传的或生成的）
  const getFinalReferenceImages = () => {
    if (uploadedReferenceImages.length > 0) {
      return uploadedReferenceImages;
    }
    return [];
  };

  // 获取组合的视频描述（三个维度）
  const getCombinedDescription = () => {
    const selectedIPNames = selectedIPs.map(id => {
      const ip = IP_PLACEHOLDERS.find(p => p.id === id);
      return ip ? ip.name : '';
    }).filter(name => name).join('、');
    
    let description = `故事核心要素：${storyCore}\n整体风格：${overallStyle}`;
    if (selectedIPNames) {
      description += `\nIP选择：${selectedIPNames}`;
    }
    return description;
  };

  // ========== 步骤1：基本信息 ==========
  
  // 上传参考图片（仅支持1张）
  const handleUploadReferenceImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError(null);

    const fileName = file.name;
    setUploadingImages(prev => ({ ...prev, [fileName]: true }));
    
    try {
      // 先验证文件
      const validation = uploadService.validateFile(file, ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], 10);
      if (!validation.valid) {
        setError(validation.error || '文件验证失败');
      return;
    }
    
      // 上传文件获取URL
      const uploadResult = await uploadService.uploadFile(file, 'reference-images');
      
      if (uploadResult.success && uploadResult.url) {
        // 仅保留一张参考图片，如已存在则替换
        setUploadedReferenceImages([uploadResult.url]);
      } else {
        setError(uploadResult.error || '上传失败');
      }
    } catch (err) {
      console.error('上传参考图片失败:', err);
      setError('上传失败: ' + err.message);
    } finally {
      setUploadingImages(prev => {
        const newState = { ...prev };
        delete newState[fileName];
        return newState;
      });
      // 清空文件输入，允许重复上传同一文件
      e.target.value = '';
    }
  };

  // 删除上传的参考图片
  const handleRemoveUploadedImage = (index) => {
    setUploadedReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

  // 步骤1下一步
  const handleStep1Next = () => {
    if (!storyCore.trim() || !overallStyle.trim()) {
      setError('请完整填写故事核心要素和整体风格');
      return;
    }
    // 直接跳到步骤2
    setCurrentStep(2);
  };

  // ========== 步骤2：分镜生成 ==========
  
  // 生成分镜脚本
  const generateStoryboardScript = async () => {
    setIsGeneratingScript(true);
    setError(null);
    
    try {
      const result = await videoStoryboardService.generateStoryboardScript(
        getCombinedDescription(),
        [],
        videoDuration
      );
      
      setStoryboardTitle(result.title);
      const newScenes = result.scenes.map((scene, index) => ({
        ...scene,
        id: `scene-${index + 1}`,
        generatedImage: null,
        status: 'pending'
      }));
      setScenes(newScenes);
      
      // 等待状态更新后再生成图片
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 自动生成所有分镜图片
      for (const scene of newScenes) {
        await handleGenerateSceneImage(scene.id, scene);
      }
    } catch (err) {
      setError('生成分镜脚本失败: ' + err.message);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  // 获取人物描述（用于分镜提示词优化）
  const getCharacterDescription = () => {
    if (uploadedReferenceImages.length > 0) {
      // 如果有上传的参考图片，返回人物描述
      return 'consistent character appearance from reference image';
    }
    return null;
  };
  
  // 生成分镜图片
  const handleGenerateSceneImage = async (sceneId, sceneOverride = null) => {
    const scene = sceneOverride || scenes.find(s => s.id === sceneId);
    if (!scene) return;

    setIsGeneratingSceneImage(prev => ({ ...prev, [sceneId]: true }));
    setError(null);

    try {
      const referenceImages = getFinalReferenceImages();
      const characterDescription = getCharacterDescription();
      
      const imageUrl = await videoStoryboardService.generateSceneImage(
        scene,
        referenceImages,
        userId,
        organizationId,
        characterDescription
      );
      
      setScenes(prev => prev.map(s => 
        s.id === sceneId 
          ? { ...s, generatedImage: imageUrl, status: 'completed' }
          : s
      ));
      return imageUrl;
    } catch (err) {
      setError('生成分镜图片失败: ' + err.message);
      return null;
    } finally {
      setIsGeneratingSceneImage(prev => ({ ...prev, [sceneId]: false }));
    }
  };

  // 生成所有分镜图片
  const handleGenerateAllSceneImages = async () => {
    for (const scene of scenes) {
      if (!scene.generatedImage) {
        await handleGenerateSceneImage(scene.id);
      }
    }
  };

  // 步骤3下一步
  const handleStep3Next = () => {
    const completedScenes = scenes.filter(s => s.generatedImage);
    if (completedScenes.length === 0) {
      setError('请先生成至少一张分镜图片');
      return;
    }
    setCurrentStep(3);
  };

  // ========== 步骤3：生成视频 ==========
  
  // 合成视频
  const handleComposeVideo = async () => {
    setIsComposingVideo(true);
    setError(null);

    try {
      const videoUrl = await videoStoryboardService.composeVideo(
        scenes,
        storyboardTitle,
        userId,
        organizationId
      );
      setGeneratedVideoUrl(videoUrl);
    } catch (err) {
      setError('合成视频失败: ' + err.message);
    } finally {
      setIsComposingVideo(false);
    }
  };

  // 确认完成
  const handleConfirm = () => {
    onConfirm({
      title: storyboardTitle,
      description: getCombinedDescription(),
      duration: videoDuration,
      referenceImages: getFinalReferenceImages(),
      scenes,
      videoUrl: generatedVideoUrl,
      style: overallStyle  // 单独传递风格字段
    });
  };

  // 渲染步骤指示器
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      {STEPS.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className={`flex flex-col items-center ${currentStep === step.id ? 'text-purple-600' : currentStep > step.id ? 'text-green-600' : 'text-slate-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              currentStep === step.id ? 'bg-purple-100 border-2 border-purple-600' :
              currentStep > step.id ? 'bg-green-100 border-2 border-green-600' :
              'bg-slate-100 border-2 border-slate-300'
            }`}>
              {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
            </div>
            <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
          </div>
          {index < STEPS.length - 1 && (
            <div className={`w-12 h-0.5 mx-2 ${currentStep > step.id ? 'bg-green-500' : 'bg-slate-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // 渲染步骤1：基本信息
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          故事核心要素 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={storyCore}
          onChange={(e) => setStoryCore(e.target.value)}
          placeholder="例如：一个小女孩周末在花园里玩耍"
          className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none h-24"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          整体风格 <span className="text-red-500">*</span>
        </label>
        <select
          value={overallStyle}
          onChange={(e) => setOverallStyle(e.target.value)}
          className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none h-15"
        >
          <option value="">请选择整体风格</option>
          <option value="3D皮克斯风格、温馨治愈、明亮色彩">3D皮克斯风格、温馨治愈、明亮色彩</option>
          <option value="2D手绘风格、简约可爱、柔和色调">2D手绘风格、简约可爱、柔和色调</option>
          <option value="赛博朋克风格、未来科技、霓虹色调">赛博朋克风格、未来科技、霓虹色调</option>
          <option value="水墨风格、中国风、典雅含蓄">水墨风格、中国风、典雅含蓄</option>
          <option value="写实风格、逼真细腻、自然光影">写实风格、逼真细腻、自然光影</option>
          <option value="卡通风格、夸张有趣、鲜明色彩">卡通风格、夸张有趣、鲜明色彩</option>
          <option value="科幻风格、宇宙太空、未来感">科幻风格、宇宙太空、未来感</option>
          <option value="奇幻风格、魔法元素、神秘氛围">奇幻风格、魔法元素、神秘氛围</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block flex items-center gap-2">
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
          <span className="text-sm font-medium text-slate-700 min-w-[60px]">
            {videoDuration} 秒
          </span>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          图片比例
        </label>
        <div className="grid grid-cols-5 gap-2">
          {ASPECT_RATIOS.map((ratio) => (
            <button
              key={ratio.id}
              onClick={() => setSelectedAspectRatio(ratio)}
              className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
                selectedAspectRatio.id === ratio.id
                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                  : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div 
                className="bg-current rounded-sm mb-1"
                style={{
                  width: ratio.id === '16:9' ? '32px' :
                         ratio.id === '4:3' ? '24px' :
                         ratio.id === '1:1' ? '20px' :
                         ratio.id === '3:4' ? '15px' : '12px',
                  height: ratio.id === '16:9' ? '18px' :
                          ratio.id === '4:3' ? '18px' :
                          ratio.id === '1:1' ? '20px' :
                          ratio.id === '3:4' ? '20px' : '21px'
                }}
              />
              <span className="text-xs font-medium">{ratio.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          已选择：{selectedAspectRatio.label} ({selectedAspectRatio.width}×{selectedAspectRatio.height}) - {selectedAspectRatio.description}
        </p>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 mb-2 block">
          IP选择
        </label>
        <div className="grid grid-cols-5 gap-2">
          {IP_PLACEHOLDERS.map((ip) => {
            const isSelected = selectedIPs.includes(ip.id);
            return (
              <button
                key={ip.id}
                onClick={() => {
                  if (isSelected) {
                    setSelectedIPs(prev => prev.filter(id => id !== ip.id));
                  } else {
                    setSelectedIPs(prev => [...prev, ip.id]);
                  }
                }}
                className={`relative flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-1 right-1 bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </div>
                )}
                <img 
                  src={ip.image} 
                  alt={ip.name}
                  className="w-full h-20 object-cover rounded-lg"
                />
                <span className="text-xs font-medium mt-1">{ip.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  // 渲染步骤3：分镜图片
  const renderStep3 = () => (
    <div className="space-y-6">
      {/* 分镜脚本部分 */}
      {scenes.length === 0 ? (
        <div className="text-center py-8">
          <button
            onClick={generateStoryboardScript}
            disabled={isGeneratingScript}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2 mx-auto"
          >
            {isGeneratingScript ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                生成分镜脚本和图片中...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                点击生成分镜脚本和图片
              </>
            )}
          </button>
          <p className="text-sm text-slate-400 mt-3">
            AI将根据视频描述生成分镜脚本和图片
          </p>
        </div>
      ) : (
        <>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-purple-800">{storyboardTitle}</h4>
                <p className="text-xs text-purple-600 mt-1">
                  共 {scenes.length} 个分镜，预计时长 {videoDuration} 秒
                </p>
              </div>
              <button
                onClick={generateStoryboardScript}
                disabled={isGeneratingScript}
                className="px-3 py-1.5 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-1 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                重新生成
              </button>
            </div>
          </div>

          {/* 分镜图片部分 */}
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-700">分镜图片生成</h4>
          </div>

          <div className="grid grid-cols-2 gap-4 overflow-y-auto">
            {scenes.map((scene) => (
              <div key={scene.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="aspect-video bg-slate-100 relative">
                  {scene.generatedImage ? (
                    <button
                      type="button"
                      onClick={() => setPreviewImage({ url: scene.generatedImage, alt: `分镜${scene.sequence}` })}
                      className="w-full h-full cursor-zoom-in"
                      title="点击放大查看"
                    >
                    <img
                      src={scene.generatedImage}
                      alt={`分镜${scene.sequence}`}
                      className="w-full h-full object-cover"
                    />
                    </button>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">分镜 {scene.sequence}</span>
                    <span className="text-xs text-slate-500">{scene.duration}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2 line-clamp-2">{scene.content}</p>
                  <button
                    onClick={() => handleGenerateSceneImage(scene.id)}
                    disabled={isGeneratingSceneImage[scene.id]}
                    className="w-full px-3 py-1.5 text-xs border border-purple-200 text-purple-600 rounded hover:bg-purple-50 disabled:opacity-50 transition-colors flex items-center justify-center gap-1"
                  >
                    {isGeneratingSceneImage[scene.id] ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        生成中...
                      </>
                    ) : scene.generatedImage ? (
                      <>
                        <RefreshCw className="w-3 h-3" />
                        重新生成
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3 h-3" />
                        生成图片
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // 渲染步骤4：生成视频
  const renderStep4 = () => (
    <div className="space-y-6">
      {!generatedVideoUrl ? (
        <div className="text-center py-8">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
            <h4 className="font-medium text-purple-800 mb-2">准备生成视频</h4>
            <p className="text-sm text-purple-600">
              已生成 {scenes.filter(s => s.generatedImage).length} 个分镜图片
            </p>
            <p className="text-xs text-slate-500 mt-2">
              点击下方按钮开始合成最终视频
            </p>
          </div>

          <button
            onClick={handleComposeVideo}
            disabled={isComposingVideo}
            className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2 mx-auto text-lg"
          >
            {isComposingVideo ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                视频生成中...
              </>
            ) : (
              <>
                <Video className="w-5 h-5" />
                生成视频
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-medium text-green-800 mb-2">视频生成成功！</h4>
            <p className="text-sm text-green-600">
              {storyboardTitle}
            </p>
          </div>

          <div className="aspect-video bg-slate-900 rounded-lg overflow-hidden mb-6">
            <video
              src={generatedVideoUrl}
              controls
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  );

  // 渲染当前步骤内容
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep3();
      case 3: return renderStep4();
      default: return null;
    }
  };

  // 渲染底部按钮
  const renderFooterButtons = () => {
    // 步骤3的特殊按钮逻辑
    if (currentStep === 3) {
      if (generatedVideoUrl) {
        // 视频已生成，显示确认按钮
        return (
          <div className="flex justify-center">
            <button
              onClick={handleConfirm}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 mx-auto"
            >
              <Check className="w-5 h-5" />
              确认并添加到画布
            </button>
          </div>
        );
      }
      return null; // 视频未生成，不显示按钮
    }

    return (
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(prev => prev - 1)}
          disabled={currentStep === 1}
          className="px-6 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          上一步
        </button>

        {currentStep === 1 && (
          <button
            onClick={handleStep1Next}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            下一步
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {currentStep === 2 && (
          <button
            onClick={handleStep3Next}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            下一步
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {currentStep === 3 && (
          <button
            onClick={handleStep3Next}
            disabled={scenes.length === 0}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            下一步
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {currentStep === 4 && (
          <button
            onClick={handleStep4Next}
            // 分镜图全部生成后才能进入下一步
            disabled={scenes.length === 0 || scenes.some(s => !s.generatedImage)}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            下一步
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[740px] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg text-white">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">AI视频生成</h3>
              <p className="text-xs text-slate-500">{STEPS.find(s => s.id === currentStep)?.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-6">
          {renderStepIndicator()}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: '480px' }}>
          {renderCurrentStep()}
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200">
          {renderFooterButtons()}
        </div>
      </div>

      {/* 分镜图片放大预览 */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={closePreviewImage}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={closePreviewImage}
              className="absolute -top-3 -right-3 bg-white/90 hover:bg-white text-slate-700 rounded-full p-2 shadow"
              aria-label="关闭预览"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage.url}
              alt={previewImage.alt}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoStoryboardModal;
