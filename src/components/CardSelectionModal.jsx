import React, { useState } from 'react';
import { X, RefreshCw, Check } from 'lucide-react';

/**
 * CardSelectionModal - 图片抽卡选择模态框
 * 用于从多张图片中选择一张
 */
export const CardSelectionModal = ({
  isOpen,
  onClose,
  title = '选择图片',
  images = [],
  isLoading = false,
  onSelect,
  onConfirm,
  maxSelect = 1
}) => {
  const [selectedIndex, setSelectedIndex] = useState(null);

  console.log('CardSelectionModal rendered:', { isOpen, images: images.length, isLoading });

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
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-xl">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-slate-800">{title}</h3>
              <p className="text-sm text-slate-500">共 {images.length} 张图片，选择你喜欢的一张</p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedIndex(null);
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
                <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-purple-600 animate-spin" />
                </div>
              </div>
              <p className="text-slate-500 animate-pulse">正在生成图片...</p>
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-10 h-10" />
              </div>
              <p>暂无可选择的图片</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {images.map((image, index) => (
                <div
                  key={index}
                  onClick={() => !image.loading && handleSelect(index)}
                  className={`
                    relative cursor-pointer rounded-lg overflow-hidden transition-all duration-200
                    ${selectedIndex === index
                      ? 'ring-2 ring-purple-500 ring-offset-1'
                      : 'hover:ring-1 hover:ring-purple-300 hover:ring-offset-1'
                    }
                    ${image.loading ? 'cursor-wait' : ''}
                  `}
                  style={{ aspectRatio: '4/3' }}
                >
                  {/* 图片 */}
                  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200">
                    {image.loading ? (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <div className="relative mb-3">
                          <div className="w-12 h-12 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 animate-pulse">生成中...</p>
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
                        <RefreshCw className="w-12 h-12" />
                      </div>
                    )}
                  </div>

                  {/* 悬停遮罩 - 显示提示词 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      {image.prompt && (
                        <p className="text-white text-[10px] line-clamp-2">
                          {image.prompt}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 选中标记 */}
                  {selectedIndex === index && (
                    <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
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
        <div className="p-6 border-t border-slate-200 bg-slate-50 shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              {selectedIndex !== null
                ? `已选择第 ${selectedIndex + 1} 张图片`
                : '请选择一张图片'
              }
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedIndex(null);
                  onClose();
                }}
                className="px-6 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={selectedIndex === null}
                className={`
                  px-8 py-2.5 rounded-xl font-medium transition-all duration-200 flex items-center gap-2
                  ${selectedIndex !== null
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-black hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25'
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

