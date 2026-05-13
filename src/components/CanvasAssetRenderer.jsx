import React, { useState, useRef, useCallback } from 'react';
import { RotateCw, Play, Pause, Music, Copy, Trash2, Type } from 'lucide-react';

/**
 * CanvasAssetRenderer - 共用的画布资产渲染组件
 * 支持文本、图片、视频、音频的渲染和编辑
 * 支持文本双击编辑功能
 */
export const CanvasAssetRenderer = ({
  assets,
  isEditable,
  onMouseDown,
  onClick, // 添加点击回调
  selectedAssetId,
  onCopyAsset,
  onDeleteAsset,
  onAssetChange, // (assetId, field, value) => void - 用于更新资产属性
  editingTextAssetId, // 正在编辑的文本资产ID
  onEditingTextAssetIdChange, // (assetId) => void
  editingTextContent, // 正在编辑的文本内容
  onEditingTextContentChange, // (content) => void
  onCanvasClick // 点击画布时的回调，用于取消选择或保存编辑
}) => {
  const [localEditingTextContent, setLocalEditingTextContent] = useState('');
  const [localEditingTextAssetId, setLocalEditingTextAssetId] = useState(null);

  // 使用外部传入的编辑状态，如果没有则使用本地状态
  const currentEditingAssetId = editingTextAssetId !== undefined ? editingTextAssetId : localEditingTextAssetId;
  const currentEditingContent = editingTextContent !== undefined ? editingTextContent : localEditingTextContent;

  const handleStartEditing = (assetId, content) => {
    if (onEditingTextAssetIdChange) {
      onEditingTextAssetIdChange(assetId);
    } else {
      setLocalEditingTextAssetId(assetId);
    }
    if (onEditingTextContentChange) {
      onEditingTextContentChange(content);
    } else {
      setLocalEditingTextContent(content);
    }
  };

  const handleSaveEditing = (assetId) => {
    if (onAssetChange && currentEditingContent !== undefined) {
      onAssetChange(assetId, 'content', currentEditingContent);
    }
    handleCancelEditing();
  };

  const handleCancelEditing = () => {
    if (onEditingTextAssetIdChange) {
      onEditingTextAssetIdChange(null);
    } else {
      setLocalEditingTextAssetId(null);
    }
  };

  if (assets.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0" onClick={(e) => {
      e.stopPropagation();
      onCanvasClick?.();
    }}>
      {assets.map((asset, index) => {
        const isEditing = currentEditingAssetId === asset.id;

        if (asset.type !== 'text' && !asset.url) return null;

        return (
          <div
            key={asset.id}
            onClick={(e) => {
              // 点击元素时选中它，并阻止事件冒泡到画布
              if (isEditable && !isEditing) {
                e.stopPropagation();
                onAssetSelect?.(asset.id);
              }
            }}
            onMouseDown={(e) => {
              if (isEditable && !isEditing) {
                e.stopPropagation();
                onMouseDown?.(e, asset.id, 'dragging');
              }
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (isEditable && !isEditing && onClick) {
                onClick(asset.id);
              }
            }}
            style={{ 
              left: asset.x, 
              top: asset.y, 
              width: asset.width || 300, 
              height: asset.height || 200,
              zIndex: index,
              transform: `rotate(${asset.rotation || 0}deg)`,
              position: 'absolute'
            }}
            className={`${isEditable && !isEditing ? 'cursor-move select-none' : ''} group/asset 
              ${selectedAssetId === asset.id && isEditable && !isEditing ? 'ring-2 ring-blue-500 z-50 shadow-2xl' : ''}
              ${isEditable && selectedAssetId !== asset.id && !isEditing ? 'hover:ring-1 hover:ring-info-border' : ''}
              transition-shadow duration-75`}
          >
            {/* 右上角复制和删除按钮 - 仅在可编辑模式下显示 */}
            {isEditable && !isEditing && (
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/asset:opacity-100 transition-opacity z-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyAsset?.(asset.id);
                  }}
                  className="p-1.5 bg-info-light0 text-white rounded shadow-sm hover:bg-info transition-colors"
                  title="复制"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAsset?.(asset.id);
                  }}
                  className="p-1.5 bg-error text-white rounded shadow-sm hover:bg-error transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
            
            {/* Editor Controls (Handles) - Only in Editable Mode and Not Editing */}
            {isEditable && selectedAssetId === asset.id && !isEditing && (
              <>
                {/* Resize Handles */}
                <div onMouseDown={(e) => onMouseDown?.(e, asset.id, 'resizing', 'nw')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-info rounded-full cursor-nw-resize z-50"></div>
                <div onMouseDown={(e) => onMouseDown?.(e, asset.id, 'resizing', 'ne')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-info rounded-full cursor-ne-resize z-50"></div>
                <div onMouseDown={(e) => onMouseDown?.(e, asset.id, 'resizing', 'sw')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-info rounded-full cursor-sw-resize z-50"></div>
                <div onMouseDown={(e) => onMouseDown?.(e, asset.id, 'resizing', 'se')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-info rounded-full cursor-se-resize z-50"></div>
                
                {/* Rotation Handle */}
                <div 
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing z-50"
                  onMouseDown={(e) => onMouseDown?.(e, asset.id, 'rotating')}
                >
                  <div className="w-px h-4 bg-info-light0"></div>
                  <div className="w-5 h-5 bg-white border border-info rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                    <RotateCw className="w-3 h-3 text-info-hover" />
                  </div>
                </div>
              </>
            )}

            {/* Content */}
            {asset.type === 'text' ? (
              isEditing ? (
                <textarea
                  className="w-full h-full bg-white/95 border-2 border-info rounded p-2 font-sans resize-none outline-none"
                  style={{ 
                    fontSize: asset.fontSize ? `${asset.fontSize}px` : '24px',
                    fontWeight: asset.fontWeight || 'normal',
                    color: asset.color || '#1e293b',
                    textAlign: asset.textAlign || 'center',
                    ...(asset.strokeWidth ? {
                      WebkitTextStroke: `${asset.strokeWidth}px ${asset.strokeColor || '#000000'}`,
                      WebkitTextFillColor: asset.color || '#1e293b'
                    } : {})
                  }}
                  value={currentEditingContent || ''}
                  onChange={(e) => {
                    if (onEditingTextContentChange) {
                      onEditingTextContentChange(e.target.value);
                    } else {
                      setLocalEditingTextContent(e.target.value);
                    }
                  }}
                  onBlur={() => {
                    handleSaveEditing(asset.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      handleCancelEditing();
                    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleSaveEditing(asset.id);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <div 
                  className="w-full h-full bg-transparent p-2 font-sans whitespace-pre-wrap overflow-hidden flex items-center cursor-text"
                  style={{ 
                    fontSize: asset.fontSize ? `${asset.fontSize}px` : '24px',
                    fontWeight: asset.fontWeight || 'normal',
                    color: asset.color || '#1e293b',
                    textAlign: asset.textAlign || 'center',
                    ...(asset.strokeWidth ? {
                      WebkitTextStroke: `${asset.strokeWidth}px ${asset.strokeColor || '#000000'}`,
                      WebkitTextFillColor: asset.color || '#1e293b',
                      textShadow: [
                        `-${asset.strokeWidth}px -${asset.strokeWidth}px 0 ${asset.strokeColor || '#000000'}`,
                        `${asset.strokeWidth}px -${asset.strokeWidth}px 0 ${asset.strokeColor || '#000000'}`,
                        `-${asset.strokeWidth}px ${asset.strokeWidth}px 0 ${asset.strokeColor || '#000000'}`,
                        `${asset.strokeWidth}px ${asset.strokeWidth}px 0 ${asset.strokeColor || '#000000'}`
                      ].join(', ')
                    } : {}),
                    justifyContent: asset.textAlign === 'left' ? 'flex-start' : asset.textAlign === 'right' ? 'flex-end' : 'center'
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleStartEditing(asset.id, asset.content || '');
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  title="双击编辑文本"
                >
                  {asset.content || "双击编辑文本"}
                </div>
              )
            ) : asset.url ? (
              <div className="w-full h-full relative bg-black rounded overflow-hidden shadow-sm">
                {asset.type === 'video' ? (
                  <VideoPlayer url={asset.url} title={asset.title} />
                ) : asset.type === 'audio' ? (
                  <AudioPlayer url={asset.url} title={asset.title} />
                ) : (
                  <img 
                    src={asset.url} 
                    alt={asset.title} 
                    className="w-full h-full object-cover block select-none pointer-events-none" 
                  />
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

const VideoPlayer = ({ url, title }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const togglePlay = useCallback((e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    if (video.duration) {
      setProgress((video.currentTime / video.duration) * 100);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video && video.duration) {
      setDuration(video.duration);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setShowControls(true);
  }, []);

  const handleSeek = useCallback((e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    video.currentTime = ratio * video.duration;
  }, []);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="absolute inset-0 group/video"
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => { if (isPlaying) setShowControls(false); }}
    >
      <video
        ref={videoRef}
        src={url}
        className="w-full h-full object-cover block select-none"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
        playsInline
      />

      {!isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
          onClick={togglePlay}
        >
          <div className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center hover:bg-white/35 transition-colors">
            <Play className="w-7 h-7 text-white ml-1" fill="white" />
          </div>
        </div>
      )}

      {isPlaying && (
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={togglePlay}
        />
      )}

      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 transition-opacity duration-200 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlay}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 text-white" fill="white" />
            ) : (
              <Play className="w-3.5 h-3.5 text-white ml-0.5" fill="white" />
            )}
          </button>

          <div className="flex-1 flex flex-col gap-0.5 min-w-0">
            <div
              className="w-full h-1 bg-white/20 rounded-full cursor-pointer overflow-hidden"
              onClick={handleSeek}
            >
              <div
                className="h-full bg-white/80 rounded-full transition-[width] duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-white/60 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AudioPlayer = ({ url, title }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = useCallback((e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    if (audio.duration) {
      setProgress((audio.currentTime / audio.duration) * 100);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      setDuration(audio.duration);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  }, []);

  const handleSeek = useCallback((e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    audio.currentTime = ratio * audio.duration;
  }, []);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex flex-col items-center justify-center gap-2 p-3 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
    >
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      <div className="flex items-center gap-2 w-full">
        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors shrink-0"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 text-white" fill="white" />
          ) : (
            <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
          )}
        </button>

        <div className="flex-1 flex flex-col gap-0.5 min-w-0">
          <div
            className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer overflow-hidden"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-white/80 rounded-full transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/60 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-white/70">
        <Music className="w-3 h-3" />
        <span className="text-[11px] truncate max-w-[200px]">{title || 'Audio'}</span>
      </div>
    </div>
  );
};

