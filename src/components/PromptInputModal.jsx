import React, { useState } from 'react';
import { Wand2, X, Sparkles, RefreshCw, Type, Edit, Zap } from 'lucide-react';

/**
 * PromptInputModal - 提示词输入模态框
 * 用于添加元素或环节时输入AI生成提示词
 * 对于文本类型，支持直接输入和AI生成两种模式
 */
export const PromptInputModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = '输入提示词',
  description = '请输入你的需求，AI将根据提示词生成内容',
  placeholder = '例如：生成一个关于动物的图片...',
  initialPrompt = '',
  type = 'element', // 'element' | 'session'
  assetType = null, // 'text' | 'image' | 'video' - 仅当type为'element'时使用
  isLoading = false,
  videoStyle = null, // 视频风格选择，仅当assetType为'video'时使用
  onVideoStyleChange = null // 视频风格变化回调
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  // 对于文本类型，添加输入模式选择: 'direct' | 'ai'
  const [textInputMode, setTextInputMode] = useState(assetType === 'text' ? 'direct' : 'ai');
  const [selectedVideoStyle, setSelectedVideoStyle] = useState(videoStyle || 'realistic');
  const [isOptimizing, setIsOptimizing] = useState(false);

  // 当模态框打开时，如果是文本类型，重置模式
  React.useEffect(() => {
    if (isOpen && assetType === 'text') {
      setTextInputMode('direct');
      setPrompt('');
    } else if (isOpen) {
      setTextInputMode('ai');
    }
    if (isOpen && assetType === 'video' && videoStyle) {
      setSelectedVideoStyle(videoStyle);
    }
  }, [isOpen, assetType, videoStyle]);

  // 提示词优化功能
  const handleOptimizePrompt = async () => {
    if (!prompt.trim()) return;
    setIsOptimizing(true);
    // 模拟AI优化提示词
    setTimeout(() => {
      const optimized = `优化后的提示词：${prompt}（更详细、更专业、更符合AI生成要求）`;
      setPrompt(optimized);
      setIsOptimizing(false);
    }, 1000);
  };

  if (!isOpen) return null;

  const handleConfirm = () => {
    // 对于文本类型，如果选择直接输入模式，prompt就是文本内容；如果是AI生成模式，prompt是提示词
    // 对于视频类型，传递风格信息
    if (assetType === 'video' && onVideoStyleChange) {
      onVideoStyleChange(selectedVideoStyle);
    }
    onConfirm(prompt, assetType === 'text' ? textInputMode : 'ai', assetType === 'video' ? selectedVideoStyle : null);
    setPrompt('');
  };

  const handleClose = () => {
    setPrompt('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg text-white">
              <Wand2 className="w-5 h-5" />
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
          {/* 文本类型显示输入模式选择 */}
          {assetType === 'text' && type === 'element' && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">输入模式</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setTextInputMode('direct')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                    textInputMode === 'direct'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Edit className="w-4 h-4" />
                  <span className="font-medium">直接输入</span>
                </button>
                <button
                  onClick={() => setTextInputMode('ai')}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                    textInputMode === 'ai'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="font-medium">AI生成</span>
                </button>
              </div>
            </div>
          )}

          {/* 视频风格选择 */}
          {assetType === 'video' && (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">视频风格</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'realistic', label: '写实风格', desc: '真实场景' },
                  { value: 'cartoon', label: '卡通风格', desc: '动画效果' },
                  { value: '3d', label: '3D风格', desc: '立体效果' },
                  { value: 'minimalist', label: '简约风格', desc: '简洁设计' }
                ].map(style => (
                  <button
                    key={style.value}
                    onClick={() => setSelectedVideoStyle(style.value)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      selectedVideoStyle === style.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-medium text-sm text-slate-700">{style.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                {assetType === 'text' && textInputMode === 'direct' ? (
                  <>
                    <Type className="w-4 h-4 text-blue-500" />
                    文本内容
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    {assetType === 'text' ? 'AI 生成提示词' : 'AI 生成提示词'}
                  </>
                )}
              </label>
              {/* 提示词优化按钮 - 仅在AI生成模式且不是文本直接输入时显示 */}
              {assetType !== 'text' || textInputMode !== 'direct' ? (
                <button
                  onClick={handleOptimizePrompt}
                  disabled={!prompt.trim() || isOptimizing}
                  className="text-xs px-2 py-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  {isOptimizing ? '优化中...' : '优化提示词'}
                </button>
              ) : null}
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={assetType === 'text' && textInputMode === 'direct' 
                ? '请输入文本内容...' 
                : placeholder}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none h-32"
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-2">
              {assetType === 'text' && textInputMode === 'direct'
                ? '提示：直接输入文本内容，将立即添加到画布'
                : type === 'element' 
                  ? '提示：描述你想要生成的元素，例如图片内容、视频主题等' 
                  : '提示：描述你想要生成的教学环节，包括活动内容、教学目标等'}
            </p>
          </div>
          
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
              disabled={isLoading || (assetType !== 'text' || textInputMode !== 'direct' ? !prompt.trim() : false)}
              className={`flex-1 px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 ${
                assetType === 'text' && textInputMode === 'direct'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  生成中...
                </>
              ) : assetType === 'text' && textInputMode === 'direct' ? (
                <>
                  <Type className="w-4 h-4" />
                  确认并添加
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  确认并生成
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

