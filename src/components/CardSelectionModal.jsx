import React, { useState, useRef } from 'react';
import { X, RefreshCw, Check, Music, Volume2 } from 'lucide-react';

/**
 * CardSelectionModal - 图片/音频抽卡选择模态框
 * 用于从多张图片或音频中选择一张/一个
 */
export const CardSelectionModal = ({
  isOpen,
  onClose,
  title = '选择图片',
  images = [],
  isLoading = false,
  onSelect,
  onConfirm,
  maxSelect = 1,
  type = 'image' // 'image' | 'audio'
}) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [playingIndex, setPlayingIndex] = useState(null);
  const audioRefs = useRef({});

  if (!isOpen) return null;

  const handleSelect = (index) => {
    if (maxSelect === 1) {
      setSelectedIndex(index);
    }
  };

  const handleConfirm = () => {
    if (selectedIndex !== null && onConfirm) {
      onConfirm(images[selectedIndex], selectedIndex);
    } else if (onSelect) {
      onSelect(images[selectedIndex], selectedIndex);
    }
    setSelectedIndex(null);
    setPlayingIndex(null);
  };

  const handlePlayAudio = (index, e) => {
    e.stopPropagation();
    const audio = audioRefs.current[index];
    if (audio) {
      if (playingIndex === index) {
        audio.pause();
        setPlayingIndex(null);
      } else {
        // 暂停其他正在播放的音频
        if (playingIndex !== null && audioRefs.current[playingIndex]) {
          audioRefs.current[playingIndex].pause();
        }
        audio.play();
        setPlayingIndex(index);
      }
    }
  };

  const handleAudioEnded = (index) => {
    if (playingIndex === index) {
      setPlayingIndex(null);
    }
  };

  const isAudioType = type === 'audio' || images.some(img => img.isAudio);
  const itemType = isAudioType ? 'audio' : 'image';
  const itemCount = images.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b-2 border-[#e5e3db] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isAudioType ? 'bg-gradient-to-br from-blue-500 to-cyan-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'}`}>
              {isAudioType ? <Music className="w-5 h-5 text-white" /> : <RefreshCw className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className="font-bold text-xl text-slate-800">{isAudioType ? '选择音频' : title}</h3>
              <p className="text-sm text-slate-500">
                共 {itemCount} 个{itemType === 'audio' ? '音频' : '图片'}，选择你喜欢的一个
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedIndex(null);
              setPlayingIndex(null);
              onClose();
            }}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content - Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="relative">
                <div className={`w-16 h-16 border-4 rounded-full animate-spin ${isAudioType ? 'border-blue-200 border-t-blue-600' : 'border-purple-200 border-t-purple-600'}`}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  {isAudioType ? <Music className="w-6 h-6 text-blue-600 animate-pulse" /> : <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />}
                </div>
              </div>
              <p className="text-slate-500 animate-pulse">
                {isAudioType ? '正在生成音频...' : '正在生成图片...'}
              </p>
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                {isAudioType ? <Music className="w-10 h-10" /> : <RefreshCw className="w-10 h-10" />}
              </div>
              <p>暂无可选择的{itemType === 'audio' ? '音频' : '图片'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {images.map((image, index) => (
                <div
                  key={index}
                  onClick={() => !image.loading && handleSelect(index)}
                  className={`
                    relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200 group
                    ${selectedIndex === index
                      ? isAudioType
                        ? 'ring-2 ring-blue-500 ring-offset-1'
                        : 'ring-2 ring-purple-500 ring-offset-1'
                      : isAudioType
                        ? 'hover:ring-1 hover:ring-blue-300 hover:ring-offset-1'
                        : 'hover:ring-1 hover:ring-purple-300 hover:ring-offset-1'
                    }
                    ${image.loading ? 'cursor-wait' : ''}
                  `}
                  style={{ aspectRatio: '4/3' }}
                >
                  {/* 内容区域 */}
                  <div className={`w-full h-full ${isAudioType ? 'bg-gradient-to-br from-blue-50 to-cyan-50' : 'bg-gradient-to-br from-slate-100 to-slate-200'}`}>
                    {image.loading ? (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <div className="relative mb-3">
                          <div className={`w-12 h-12 border-4 rounded-full animate-spin ${isAudioType ? 'border-blue-200 border-t-blue-600' : 'border-purple-200 border-t-purple-600'}`}></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            {isAudioType ? <Music className="w-5 h-5 text-blue-600 animate-pulse" /> : <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />}
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 animate-pulse">生成中...</p>
                      </div>
                    ) : image.isAudio || (image.url && image.url.includes('audio')) ? (
                      // 音频卡片
                      <div className="w-full h-full flex flex-col items-center justify-center p-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center mb-3">
                          <Music className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-xs text-slate-500 text-center line-clamp-2">
                          {image.prompt || `音频 ${index + 1}`}
                        </p>
                        {/* 音频播放按钮 */}
                        {image.url && !image.loading && (
                          <button
                            onClick={(e) => handlePlayAudio(index, e)}
                            className={`mt-3 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors ${
                              playingIndex === index
                                ? 'bg-blue-500 text-white'
                                : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                            }`}
                          >
                            <Volume2 className="w-3 h-3" />
                            {playingIndex === index ? '暂停' : '播放'}
                          </button>
                        )}
                        {/* 隐藏音频元素 */}
                        {image.url && (
                          <audio
                            ref={(el) => { audioRefs.current[index] = el; }}
                            src={image.url}
                            onEnded={() => handleAudioEnded(index)}
                            className="hidden"
                          />
                        )}
                      </div>
                    ) : image.url ? (
                      <img
                        src={image.url}
                        alt={`图片 ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://placehold.co/400x400/f1f5f9/94a3b8?text=Image+Error';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        {isAudioType ? <Music className="w-12 h-12" /> : <RefreshCw className="w-12 h-12" />}
                      </div>
                    )}
                  </div>

                  {/* 悬停遮罩 - 显示提示词 */}
                  {!image.isAudio && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        {image.prompt && (
                          <p className="text-white text-[10px] line-clamp-2">
                            {image.prompt}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 选中标记 */}
                  {selectedIndex === index && (
                    <div className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center ${isAudioType ? 'bg-blue-500' : 'bg-purple-500'}`}>
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {/* 序号标记 */}
                  <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t-2 border-[#e5e3db] bg-[#fcfbf9] shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              {selectedIndex !== null
                ? `已选择第 ${selectedIndex + 1} 个${itemType === 'audio' ? '音频' : '图片'}`
                : `请选择一个${itemType === 'audio' ? '音频' : '图片'}`
              }
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedIndex(null);
                  setPlayingIndex(null);
                  onClose();
                }}
                className="px-6 py-2.5 border-2 border-[#e5e3db] rounded-xl text-[#2d2d2d] hover:bg-[#fffbe6] hover:border-[#2d2d2d] transition-all font-medium"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedIndex === null}
                className={`
                  px-8 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2
                  ${selectedIndex !== null
                    ? isAudioType
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-black hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-blue-500/25'
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-black hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }
                `}
              >
                <Check className="w-4 h-4" />
                确认选择
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardSelectionModal;

