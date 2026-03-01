import React, { useState } from 'react';
import { X, Type, Edit, Wand2, RectangleHorizontal, Upload, Image as ImageIcon } from 'lucide-react';
import PromptOptimizer from './PromptOptimizer';

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
  isLoading = false
}) => {
  const [content, setContent] = useState(initialContent);
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0]);
  const [referenceImage, setReferenceImage] = useState(null);

  React.useEffect(() => {
    if (isOpen) {
      setContent(initialContent || '');
      setSelectedRatio(ASPECT_RATIOS[0]);
      setReferenceImage(null);
    }
  }, [isOpen, initialContent]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!content.trim()) return;
    const inputMode = (assetType === 'image' || assetType === 'video' || assetType === 'audio') ? 'ai' : 'direct';
    const videoStyle = null;
    const imageSize = (assetType === 'image') ? { width: selectedRatio.width, height: selectedRatio.height } : null;
    onConfirm(content, inputMode, videoStyle, imageSize, referenceImage);
    setContent('');
    setReferenceImage(null);
  };

  const handleClose = () => {
    setContent('');
    setReferenceImage(null);
    onClose();
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
              disabled={isLoading || !content.trim()}
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
