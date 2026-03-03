import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Wand2, Image, Type, Video, Volume2, Upload, ChevronDown, ChevronRight, BookOpen, FileText, Plus, Play, Pause, Volume2 as VolumeIcon, VolumeX, RotateCw, History, RefreshCw } from 'lucide-react';

/**
 * PromptInputModal - 提示词输入模态框
 */
export const PromptInputModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = '生成内容', 
  description = '请输入提示词', 
  placeholder = '请输入提示词...', 
  type = 'session', // 'session' | 'element'
  assetType, // 'text' | 'image' | 'video' | 'audio'
  isLoading = false
}) => {
  const [prompt, setPrompt] = useState('');
  const [inputMode, setInputMode] = useState('ai'); // 'ai' | 'direct' | 'upload'
  const [videoStyle, setVideoStyle] = useState('realistic');
  const [imageSize, setImageSize] = useState('1024x1024');
  const [referenceImage, setReferenceImage] = useState(null);
  const [lyrics, setLyrics] = useState('');
  const [audioConfig, setAudioConfig] = useState({ style: 'male', language: 'zh' });
  const [videoReferenceImages, setVideoReferenceImages] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setInputMode('ai');
      setVideoStyle('realistic');
      setImageSize('1024x1024');
      setReferenceImage(null);
      setLyrics('');
      setAudioConfig({ style: 'male', language: 'zh' });
      setVideoReferenceImages([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (isLoading) return;
    onConfirm(prompt, inputMode, videoStyle, imageSize, referenceImage, lyrics, audioConfig, videoReferenceImages);
  };

  const handleReferenceImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setReferenceImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoReferenceImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImages = [];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          newImages.push(event.target.result);
          if (newImages.length === files.length) {
            setVideoReferenceImages([...videoReferenceImages, ...newImages].slice(0, 4)); // 最多4张
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeVideoReferenceImage = (index) => {
    setVideoReferenceImages(videoReferenceImages.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><Wand2 className="w-5 h-5" /></div>
            <h3 className="font-bold text-lg text-slate-800">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-sm text-slate-600 mb-4">{description}</p>
          
          {/* 输入模式选择 */}
          {assetType && (
            <div className="mb-4">
              <div className="flex items-center gap-4 mb-3">
                <button 
                  onClick={() => setInputMode('ai')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${inputMode === 'ai' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  AI生成
                </button>
                {assetType === 'text' && (
                  <button 
                    onClick={() => setInputMode('direct')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${inputMode === 'direct' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    直接输入
                  </button>
                )}
                {(assetType === 'image' || assetType === 'video') && (
                  <button 
                    onClick={() => setInputMode('upload')}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${inputMode === 'upload' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    上传文件
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* 提示词输入 */}
          {(inputMode === 'ai' || inputMode === 'direct') && (
            <div className="mb-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={placeholder}
                className="w-full p-4 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                rows={4}
                disabled={isLoading}
              />
            </div>
          )}
          
          {/* 上传文件 */}
          {inputMode === 'upload' && (
            <div className="mb-4">
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm text-slate-500 mb-3">点击或拖拽文件到此处上传</p>
                <input 
                  type="file" 
                  accept={assetType === 'image' ? 'image/*' : assetType === 'video' ? 'video/*' : '*'}
                  className="hidden"
                  id="file-upload"
                  onChange={handleReferenceImageUpload}
                />
                <label 
                  htmlFor="file-upload"
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium cursor-pointer hover:bg-slate-200 transition-colors"
                >
                  选择文件
                </label>
                {referenceImage && (
                  <div className="mt-3 relative inline-block">
                    <img src={referenceImage} alt="预览" className="w-24 h-24 object-cover rounded border border-slate-200" />
                    <button 
                      onClick={() => setReferenceImage(null)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 图片尺寸选择 */}
          {assetType === 'image' && inputMode === 'ai' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">图片尺寸</label>
              <select 
                value={imageSize}
                onChange={(e) => setImageSize(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isLoading}
              >
                <option value="1024x1024">1024x1024</option>
                <option value="1024x1792">1024x1792 (竖版)</option>
                <option value="1792x1024">1792x1024 (横版)</option>
              </select>
            </div>
          )}
          
          {/* 视频风格选择 */}
          {assetType === 'video' && inputMode === 'ai' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">视频风格</label>
              <select 
                value={videoStyle}
                onChange={(e) => setVideoStyle(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                disabled={isLoading}
              >
                <option value="realistic">写实风格</option>
                <option value="cartoon">卡通风格</option>
                <option value="anime">动漫风格</option>
                <option value="3d">3D风格</option>
              </select>
            </div>
          )}
          
          {/* 视频参考图片上传 */}
          {assetType === 'video' && inputMode === 'ai' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">参考图片 (最多4张)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {videoReferenceImages.map((img, index) => (
                  <div key={index} className="relative">
                    <img src={img} alt="参考" className="w-16 h-16 object-cover rounded border border-slate-200" />
                    <button 
                      onClick={() => removeVideoReferenceImage(index)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {videoReferenceImages.length < 4 && (
                  <div className="w-16 h-16 border-2 border-dashed border-slate-200 rounded flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      className="hidden"
                      id="video-reference-upload"
                      onChange={handleVideoReferenceImageUpload}
                    />
                    <label 
                      htmlFor="video-reference-upload"
                      className="cursor-pointer flex flex-col items-center justify-center"
                    >
                      <Plus className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] text-slate-500">添加</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* 音频配置 */}
          {assetType === 'audio' && inputMode === 'ai' && (
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">语音风格</label>
                <select 
                  value={audioConfig.style}
                  onChange={(e) => setAudioConfig({ ...audioConfig, style: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                >
                  <option value="male">男声</option>
                  <option value="female">女声</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">语言</label>
                <select 
                  value={audioConfig.language}
                  onChange={(e) => setAudioConfig({ ...audioConfig, language: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={isLoading}
                >
                  <option value="zh">中文</option>
                  <option value="en">英文</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">歌词/文本</label>
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="请输入要转换为音频的文本..."
                  className="w-full p-4 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  rows={3}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}
        </div>
        <div className="p-6 border-t border-slate-200 flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            disabled={isLoading}
          >
            取消
          </button>
          <button 
            onClick={handleConfirm} 
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> 生成中...
              </>
            ) : (
              '确认'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * VideoStoryboardModal - 视频分镜模态框
 */
export const VideoStoryboardModal = ({ 
  isOpen, 
  onClose, 
  initialDescription = '', 
  initialReferenceImages = [], 
  userId, 
  organizationId, 
  onConfirm 
}) => {
  const [description, setDescription] = useState(initialDescription);
  const [scenes, setScenes] = useState([
    { id: 1, description: '开场场景', duration: 3 },
    { id: 2, description: '中间场景', duration: 5 },
    { id: 3, description: '结尾场景', duration: 3 }
  ]);
  const [referenceImages, setReferenceImages] = useState(initialReferenceImages);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDescription(initialDescription);
      setScenes([
        { id: 1, description: '开场场景', duration: 3 },
        { id: 2, description: '中间场景', duration: 5 },
        { id: 3, description: '结尾场景', duration: 3 }
      ]);
      setReferenceImages(initialReferenceImages);
    }
  }, [isOpen, initialDescription, initialReferenceImages]);

  if (!isOpen) return null;

  const addScene = () => {
    const newId = Math.max(...scenes.map(s => s.id)) + 1;
    setScenes([...scenes, { id: newId, description: `场景 ${newId}`, duration: 3 }]);
  };

  const removeScene = (id) => {
    if (scenes.length > 1) {
      setScenes(scenes.filter(s => s.id !== id));
    }
  };

  const updateScene = (id, field, value) => {
    setScenes(scenes.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleConfirm = () => {
    setIsGenerating(true);
    // 模拟生成过程
    setTimeout(() => {
      const videoData = {
        title: description.substring(0, 20) + '...',
        description,
        scenes,
        referenceImages,
        videoUrl: 'https://example.com/video.mp4' // 模拟视频URL
      };
      onConfirm(videoData);
      setIsGenerating(false);
    }, 2000);
  };

  const handleReferenceImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImages = [];
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          newImages.push(event.target.result);
          if (newImages.length === files.length) {
            setReferenceImages([...referenceImages, ...newImages].slice(0, 4)); // 最多4张
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeReferenceImage = (index) => {
    setReferenceImages(referenceImages.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg text-white"><Video className="w-5 h-5" /></div>
            <h3 className="font-bold text-lg text-slate-800">视频分镜设置</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">视频描述</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="请输入视频内容描述..."
                className="w-full p-4 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                rows={3}
                disabled={isGenerating}
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-slate-700">分镜设置</label>
                <button 
                  onClick={addScene}
                  className="text-sm text-purple-600 hover:text-purple-700 transition-colors flex items-center gap-1"
                  disabled={isGenerating}
                >
                  <Plus className="w-3 h-3" /> 添加场景
                </button>
              </div>
              <div className="space-y-3">
                {scenes.map((scene, index) => (
                  <div key={scene.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">场景 {index + 1}</span>
                      <button 
                        onClick={() => removeScene(scene.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
                        disabled={isGenerating || scenes.length <= 1}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">场景描述</label>
                        <input
                          value={scene.description}
                          onChange={(e) => updateScene(scene.id, 'description', e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          disabled={isGenerating}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">时长 (秒)</label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={scene.duration}
                          onChange={(e) => updateScene(scene.id, 'duration', parseInt(e.target.value) || 1)}
                          className="w-full p-2 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                          disabled={isGenerating}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">参考图片 (最多4张)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {referenceImages.map((img, index) => (
                  <div key={index} className="relative">
                    <img src={img} alt="参考" className="w-20 h-20 object-cover rounded border border-slate-200" />
                    <button 
                      onClick={() => removeReferenceImage(index)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {referenceImages.length < 4 && (
                  <div className="w-20 h-20 border-2 border-dashed border-slate-200 rounded flex items-center justify-center cursor-pointer hover:border-purple-400 transition-colors">
                    <input 
                      type="file" 
                      accept="image/*"
                      multiple
                      className="hidden"
                      id="video-storyboard-upload"
                      onChange={handleReferenceImageUpload}
                    />
                    <label 
                      htmlFor="video-storyboard-upload"
                      className="cursor-pointer flex flex-col items-center justify-center"
                    >
                      <Plus className="w-4 h-4 text-slate-400" />
                      <span className="text-[10px] text-slate-500">添加</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-200 flex gap-3">
          <button 
            onClick={onClose} 
            className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
            disabled={isGenerating}
          >
            取消
          </button>
          <button 
            onClick={handleConfirm} 
            className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> 生成中...
              </>
            ) : (
              '生成视频'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};