import React, { useState } from 'react';
import { X, Type, Edit, Wand2, RectangleHorizontal, Upload, Image as ImageIcon, Clock, Music, Video, Plus, Trash2 } from 'lucide-react';
import PromptOptimizer from './PromptOptimizer';
import { VideoStoryboardModal } from './VideoStoryboardModal';

const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9', width: 1920, height: 1080, description: '横屏宽屏' },
  { id: '4:3', label: '4:3', width: 1024, height: 768, description: '标准横屏' },
  { id: '1:1', label: '1:1', width: 1024, height: 1024, description: '正方形' },
  { id: '3:4', label: '3:4', width: 768, height: 1024, description: '标准竖屏' },
  { id: '9:16', label: '9:16', width: 1080, height: 1920, description: '竖屏长图' },
];

export const PromptInputModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = '输入内容',
  description = '请输入您的内容',
  placeholder = '请输入内容...',
  initialContent = '',
  type = 'text',
  assetType = null,
  isLoading = false,
  userId = null,
  organizationId = null,
  onVideoConfirm = null
}) => {
  const [content, setContent] = useState(initialContent);
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);
  const [referenceImage, setReferenceImage] = useState(null);
  const [referenceImages, setReferenceImages] = useState([]); // 视频支持多张参考图
  const [lyrics, setLyrics] = useState('');
  const [audioDuration, setAudioDuration] = useState(30);
  const [audioStyle, setAudioStyle] = useState('');

  // HeartMuLa 要求最小 10 秒
  const MIN_AUDIO_DURATION = 10;

  // HeartMuLa 音乐风格选项
  const AUDIO_STYLES = [
    { id: '', label: '自动选择', tags: '' },
    { id: 'pop', label: '流行 Pop', tags: 'pop, catchy, upbeat' },
    { id: 'rnb', label: 'R&B', tags: 'R&B, smooth, soulful' },
    { id: 'rock', label: '摇滚 Rock', tags: 'rock, electric guitar, energetic' },
    { id: 'electronic', label: '电子 Electronic', tags: 'electronic, synthesizer, modern' },
    { id: 'jazz', label: '爵士 Jazz', tags: 'jazz, improvisation, sophisticated' },
    { id: 'classical', label: '古典 Classical', tags: 'classical, orchestral, elegant' },
    { id: 'folk', label: '民谣 Folk', tags: 'folk, acoustic, storytelling' },
    { id: 'cafe', label: '咖啡厅 Cafe', tags: 'cafe, warm, reflection, relaxed' },
    { id: 'piano', label: '钢琴 Piano', tags: 'piano, keyboard, melodic' },
    { id: 'guitar', label: '吉他 Guitar', tags: 'guitar, strings, acoustic' },
    { id: 'soft', label: '轻柔 Soft', tags: 'soft, gentle, calming' },
    { id: 'upbeat', label: '欢快 Upbeat', tags: 'upbeat, happy, energetic' },
    { id: 'emotional', label: '情感 Emotional', tags: 'emotional, heartfelt, moving' },
    { id: 'ambient', label: '氛围 Ambient', tags: 'ambient, atmospheric, ethereal' }
  ];

  React.useEffect(() => {
    if (isOpen) {
      setContent(initialContent || '');
      setSelectedRatio(ASPECT_RATIOS[0]);
      setReferenceImage(null);
      setReferenceImages([]);
      setLyrics('');
      setAudioDuration(30);
      setAudioStyle('');
    }
  }, [isOpen, initialContent]);

  // 如果是视频类型，直接显示 VideoStoryboardModal
  if (assetType === 'video' && isOpen) {
    return (
      <VideoStoryboardModal
        isOpen={isOpen}
        onClose={onClose}
        initialDescription={initialContent}
        initialReferenceImages={[]}
        userId={userId}
        organizationId={organizationId}
        onConfirm={(videoData) => {
          if (onVideoConfirm) {
            onVideoConfirm(videoData);
          } else {
            // 如果没有提供 onVideoConfirm，调用默认的 onConfirm
            // 传递视频数据，但保持兼容性
            onConfirm(
              videoData.description || '',
              'ai',
              null,
              null,
              null,
              null,
              null,
              videoData.referenceImages || []
            );
          }
          onClose();
        }}
      />
    );
  }

  if (!isOpen) return null;

  const handleConfirm = () => {
    const inputMode = (assetType === 'image' || assetType === 'video' || assetType === 'audio') ? 'ai' : 'direct';
    const videoStyle = null;
    const imageSize = (assetType === 'image') ? { width: selectedRatio.width, height: selectedRatio.height } : null;
    const selectedStyle = AUDIO_STYLES.find(s => s.id === audioStyle);
    const audioConfig = assetType === 'audio' ? { 
      duration: audioDuration,
      style: selectedStyle?.tags || ''
    } : null;
    const videoReferenceImages = assetType === 'video' ? referenceImages : null;
    onConfirm(content, inputMode, videoStyle, imageSize, referenceImage, lyrics, audioConfig, videoReferenceImages);
    setContent('');
    setReferenceImage(null);
    setReferenceImages([]);
    setLyrics('');
    setAudioDuration(30);
    setAudioStyle('');
  };

  const handleClose = () => {
    setContent('');
    setReferenceImage(null);
    setReferenceImages([]);
    setLyrics('');
    onClose();
  };

  // 视频类型：上传多张参考图片
  const handleVideoReferenceUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // 删除视频参考图片
  const handleRemoveVideoReferenceImage = (index) => {
    setReferenceImages(prev => prev.filter((_, i) => i !== index));
  };

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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">{title}</h3>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-32"
              autoFocus
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-400">
                {assetType === 'audio'
                  ? '提示：输入歌词或音频描述，AI将生成背景音乐'
                  : '提示：直接输入文本内容，将立即添加到画布'}
              </p>
              {(type === 'image' || type === 'script' || type === 'activity' || type === 'ppt' ||
                assetType === 'image' || assetType === 'script' || assetType === 'activity' || assetType === 'ppt' ||
                assetType === 'audio') && (
                <button
                  onClick={() => setShowOptimizer(true)}
                  disabled={isLoading}
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50"
                >
                  <Wand2 className="w-3 h-3" />
                  优化提示词
                </button>
              )}
            </div>
          </div>

          {assetType === 'image' && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                图片比例
              </label>
              <div className="grid grid-cols-5 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => setSelectedRatio(ratio)}
                    disabled={isLoading}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
                      selectedRatio.id === ratio.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
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
                已选择：{selectedRatio.label} ({selectedRatio.width}×{selectedRatio.height}) - {selectedRatio.description}
              </p>
            </div>
          )}

          {(assetType === 'image' || assetType === 'video') && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                参考图片 (可选)
              </label>
              {!referenceImage ? (
                <div className="border border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative group/upload">
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={handleReferenceUpload}
                    disabled={isLoading}
                  />
                  <div className="p-2 bg-white rounded-full shadow-sm mb-2 group-hover/upload:scale-110 transition-transform">
                    <Upload className="w-5 h-5 text-slate-400" />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">点击上传参考图片</span>
                  <span className="text-[10px] text-slate-400 mt-1">用于图生图功能</span>
                </div>
              ) : (
                <div className="relative group/ref">
                  <img src={referenceImage} alt="Reference" className="w-full h-32 object-cover rounded border border-slate-200 opacity-90" />
                  <div className="absolute inset-0 bg-black/0 group-hover/ref:bg-black/10 transition-colors rounded"></div>
                  <button
                    onClick={() => setReferenceImage(null)}
                    disabled={isLoading}
                    className="absolute top-2 right-2 bg-white text-slate-600 hover:text-red-500 p-1.5 rounded-full shadow-sm opacity-0 group-hover/ref:opacity-100 transition-opacity disabled:opacity-50"
                    title="移除参考图"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {assetType === 'audio' && (
            <>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  音乐风格
                </label>
                <select
                  value={audioStyle}
                  onChange={(e) => setAudioStyle(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  disabled={isLoading}
                >
                  {AUDIO_STYLES.map((style) => (
                    <option key={style.id} value={style.id}>
                      {style.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                  选择音乐风格，将自动添加到生成提示中
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  音频时长
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="240"
                    step="10"
                    value={audioDuration}
                    onChange={(e) => setAudioDuration(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    disabled={isLoading}
                  />
                  <span className="text-sm font-medium text-slate-700 min-w-[60px]">
                    {audioDuration} 秒
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  拖动滑块调整音频时长（10-240秒）
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Wand2 className="w-4 h-4" />
                  歌词 (可选)
                </label>
                <textarea
                  value={lyrics}
                  onChange={(e) => setLyrics(e.target.value)}
                  placeholder="输入歌词内容，留空则生成纯音乐..."
                  className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-24"
                  disabled={isLoading}
                />
                <p className="text-xs text-slate-400 mt-1">
                  提示：输入歌词后，AI会根据歌词生成歌曲；留空则生成纯音乐
                </p>
              </div>
            </>
          )}

          {assetType === 'video' && (
            <>
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  人物参考图片（可选）
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  上传人物参考图片，AI会保持人物形象一致性生成分镜
                </p>
                <div className="space-y-2">
                  {referenceImages.map((img, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={img} 
                        alt={`参考${index + 1}`}
                        className="w-full h-20 object-cover rounded border border-slate-200"
                      />
                      <button
                        onClick={() => handleRemoveVideoReferenceImage(index)}
                        disabled={isLoading}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleVideoReferenceUpload}
                      disabled={isLoading}
                    />
                    <div className="flex flex-col items-center">
                      <Plus className="w-5 h-5 text-slate-400 mb-1" />
                      <span className="text-xs text-slate-500">点击上传参考图片</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Video className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-purple-800">视频生成流程</h4>
                    <ol className="text-xs text-purple-600 mt-1 space-y-1 list-decimal list-inside">
                      <li>输入视频描述</li>
                      <li>上传人物参考图片（可选）</li>
                      <li>AI生成分镜脚本</li>
                      <li>为每个分镜生成图片</li>
                      <li>合成最终视频</li>
                    </ol>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || (assetType === 'text' && !content.trim())}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  处理中...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4" />
                  确认添加
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {showOptimizer && (
        <PromptOptimizer
          elementType={assetType || type}
          onOptimize={(optimizedPrompt) => {
            setContent(optimizedPrompt);
            setShowOptimizer(false);
          }}
          onClose={() => setShowOptimizer(false)}
        />
      )}
    </div>
  );
};
