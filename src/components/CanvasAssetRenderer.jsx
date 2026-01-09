import React, { useState } from 'react';
import { RotateCw, Play, Music, Copy, Trash2, Type } from 'lucide-react';

/**
 * CanvasAssetRenderer - 共用的画布资产渲染组件
 * 支持文本、图片、视频、音频的渲染和编辑
 * 支持文本双击编辑功能
 */
export const CanvasAssetRenderer = ({ 
  assets, 
  isEditable, 
  onMouseDown, 
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

  if (assets.length === 0 && isEditable) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none">
        <Type className="w-16 h-16 mb-4" />
        <p className="text-sm font-medium">画布为空，请使用上方工具栏添加素材</p>
      </div>
    );
  }

  return (
    <>
      {assets.map((asset, index) => {
        const isEditing = currentEditingAssetId === asset.id;

        return (
          <div
            key={asset.id}
            onMouseDown={(e) => {
              if (isEditable && !isEditing) {
                onMouseDown?.(e, asset.id, 'dragging');
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
              ${isEditable && selectedAssetId !== asset.id && !isEditing ? 'hover:ring-1 hover:ring-blue-300' : ''}
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
                  className="p-1.5 bg-blue-500 text-white rounded shadow-sm hover:bg-blue-600 transition-colors"
                  title="复制"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteAsset?.(asset.id);
                  }}
                  className="p-1.5 bg-red-500 text-white rounded shadow-sm hover:bg-red-600 transition-colors"
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
                <div onMouseDown={(e) => onMouseDown?.(e, asset.id, 'resizing', 'nw')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-nw-resize z-50"></div>
                <div onMouseDown={(e) => onMouseDown?.(e, asset.id, 'resizing', 'ne')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-ne-resize z-50"></div>
                <div onMouseDown={(e) => onMouseDown?.(e, asset.id, 'resizing', 'sw')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-sw-resize z-50"></div>
                <div onMouseDown={(e) => onMouseDown?.(e, asset.id, 'resizing', 'se')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-se-resize z-50"></div>
                
                {/* Rotation Handle */}
                <div 
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing z-50"
                  onMouseDown={(e) => onMouseDown?.(e, asset.id, 'rotating')}
                >
                  <div className="w-px h-4 bg-blue-500"></div>
                  <div className="w-5 h-5 bg-white border border-blue-500 rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                    <RotateCw className="w-3 h-3 text-blue-500" />
                  </div>
                </div>
              </>
            )}

            {/* Content */}
            {asset.type === 'text' ? (
              isEditing ? (
                <textarea
                  className="w-full h-full bg-white/95 border-2 border-blue-500 rounded p-2 font-sans resize-none outline-none"
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
            ) : (
              <div className="w-full h-full relative bg-black rounded overflow-hidden shadow-sm">
                {asset.url ? (
                  <img 
                    src={asset.url} 
                    alt={asset.title} 
                    className="w-full h-full object-cover block select-none pointer-events-none" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                    {asset.type === 'image' ? 'No Image' : asset.type === 'video' ? 'No Video' : 'No Audio'}
                  </div>
                )}
                {asset.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                    <Play className="w-12 h-12 text-white opacity-80" />
                  </div>
                )}
                {asset.type === 'audio' && (
                  <div className="absolute bottom-0 left-0 right-0 h-full bg-slate-900/80 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                    <Music className="w-8 h-8 text-white/80" />
                    <div className="text-white text-xs font-mono">Audio Track</div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

