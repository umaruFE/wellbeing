import React, { useState, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon,
  Type,
  Trash2,
  Wand2,
  RefreshCw,
  Upload,
  X,
  Video,
  Music,
  Layers,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  RotateCw,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Monitor,
  Smartphone,
  Play,
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Plus,
  FileX
} from 'lucide-react';
import { getAssetIcon } from '../utils';

/**
 * ReadingMaterialEditor - 阅读材料画板编辑器
 * 独立的画板编辑器，支持16:9和9:16模式
 */
export const ReadingMaterialEditor = ({ 
  pages, 
  onPagesChange,
  editingPageIndex,
  onEditingPageIndexChange 
}) => {
  const [canvasAspectRatio, setCanvasAspectRatio] = useState('A4'); // 'A4' | 'A4横向'
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [interactionMode, setInteractionMode] = useState('idle');
  const [interactionStart, setInteractionStart] = useState(null);
  const [isRightOpen, setIsRightOpen] = useState(true);
  const [generatingAssetId, setGeneratingAssetId] = useState(null);
  const canvasRef = useRef(null);

  // 计算画布尺寸 (A4比例: 210mm × 297mm ≈ 0.707:1)
  const getCanvasSize = () => {
    if (canvasAspectRatio === 'A4') {
      // A4竖版：宽度800px，高度1131px (800/1131 ≈ 0.707)
      return { width: 680, height: 960 };
    } else {
      // A4横版：宽度1131px，高度800px
      return { width: 960, height: 680 };
    }
  };

  const canvasSize = getCanvasSize();

  // 更新资产
  const handleAssetChange = (pageId, assetId, field, value) => {
    onPagesChange(prev => prev.map(page => {
      if (page.id === pageId) {
        return {
          ...page,
          canvasAssets: (page.canvasAssets || []).map(asset => 
            asset.id === assetId ? { ...asset, [field]: value } : asset
          )
        };
      }
      return page;
    }));
  };

  // 添加资产
  const handleAddAsset = (pageId, type) => {
    let w = 300, h = 200;
    if (type === 'audio') { w = 300; h = 100; }
    if (type === 'text') { w = 300; h = 100; }

    onPagesChange(prev => prev.map(page => {
      if (page.id === pageId) {
        const newAsset = {
          id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          title: type === 'text' ? '文本' : type === 'image' ? '图片' : type === 'video' ? '视频' : '音频',
          url: type === 'text' ? '' : `https://placehold.co/${w}x${h}?text=New+${type}`,
          content: type === 'text' ? '双击编辑文本' : '',
          prompt: '',
          referenceImage: null,
          x: (canvasSize.width - w) / 2,
          y: (canvasSize.height - h) / 2,
          width: w,
          height: h,
          rotation: 0
        };
        return {
          ...page,
          canvasAssets: [...(page.canvasAssets || []), newAsset]
        };
      }
      return page;
    }));
  };

  // 删除资产
  const handleDeleteAsset = (pageId, assetId) => {
    onPagesChange(prev => prev.map(page => {
      if (page.id === pageId) {
        return {
          ...page,
          canvasAssets: (page.canvasAssets || []).filter(a => a.id !== assetId)
        };
      }
      return page;
    }));
    setSelectedAssetId(null);
  };

  // 添加新页面
  const handleAddPage = (insertAfterIndex = null) => {
    const canvasSize = getCanvasSize();
    const newPage = {
      id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      slideId: null,
      pageNumber: insertAfterIndex !== null ? insertAfterIndex + 2 : pages.length + 1,
      title: `新页面 ${insertAfterIndex !== null ? insertAfterIndex + 2 : pages.length + 1}`,
      width: canvasSize.width,
      height: canvasSize.height,
      canvasAssets: [],
      blocks: []
    };
    
    onPagesChange(prev => {
      if (insertAfterIndex !== null) {
        // 在指定位置插入
        const newPages = [...prev];
        newPages.splice(insertAfterIndex + 1, 0, newPage);
        // 重新编号
        return newPages.map((page, index) => ({
          ...page,
          pageNumber: index + 1
        }));
      } else {
        // 添加到末尾
        return [...prev, newPage];
      }
    });
  };

  // 删除页面
  const handleDeletePage = (pageId, pageIndex) => {
    if (pages.length <= 1) {
      alert('至少需要保留一个页面！');
      return;
    }
    
    if (!confirm(`确定要删除第 ${pageIndex + 1} 页吗？此操作无法撤销。`)) {
      return;
    }

    onPagesChange(prev => {
      const newPages = prev.filter(p => p.id !== pageId);
      // 重新编号
      return newPages.map((page, index) => ({
        ...page,
        pageNumber: index + 1
      }));
    });

    // 如果删除的是当前编辑的页面，切换到第一页或上一页
    if (editingPageIndex === pageIndex) {
      if (pageIndex > 0) {
        onEditingPageIndexChange(pageIndex - 1);
      } else if (pages.length > 1) {
        onEditingPageIndexChange(0);
      } else {
        onEditingPageIndexChange(null);
      }
    } else if (editingPageIndex > pageIndex) {
      // 如果删除的页面在当前编辑页面之前，需要调整编辑索引
      onEditingPageIndexChange(editingPageIndex - 1);
    }
  };

  // 图层操作
  const handleLayerChange = (pageId, assetId, action) => {
    onPagesChange(prev => prev.map(page => {
      if (page.id === pageId) {
        const assets = [...(page.canvasAssets || [])];
        const index = assets.findIndex(a => a.id === assetId);
        if (index === -1) return page;

        if (action === 'front') assets.push(assets.splice(index, 1)[0]);
        else if (action === 'back') assets.unshift(assets.splice(index, 1)[0]);
        else if (action === 'forward' && index < assets.length - 1) {
          [assets[index], assets[index + 1]] = [assets[index + 1], assets[index]];
        } else if (action === 'backward' && index > 0) {
          [assets[index], assets[index - 1]] = [assets[index - 1], assets[index]];
        }
        return { ...page, canvasAssets: assets };
      }
      return page;
    }));
  };

  // 鼠标交互处理
  const handleMouseDown = (e, assetId, mode, handleType = null) => {
    e.stopPropagation();
    setSelectedAssetId(assetId);
    setInteractionMode(mode);
    
    const currentPage = pages.find(p => p.id === pages[editingPageIndex]?.id);
    if (!currentPage) return;
    const asset = (currentPage.canvasAssets || []).find(a => a.id === assetId);
    if (!asset) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setInteractionStart({
      startX: e.clientX,
      startY: e.clientY,
      initialX: asset.x,
      initialY: asset.y,
      initialW: asset.width || 300,
      initialH: asset.height || 200,
      initialRotation: asset.rotation || 0,
      handleType,
      rect
    });
  };

  const handleMouseMove = (e) => {
    if (interactionMode === 'idle' || !interactionStart) return;
    const currentPage = pages[editingPageIndex];
    if (!currentPage) return;
    const asset = (currentPage.canvasAssets || []).find(a => a.id === selectedAssetId);
    if (!asset) return;

    const deltaX = e.clientX - interactionStart.startX;
    const deltaY = e.clientY - interactionStart.startY;

    if (interactionMode === 'dragging') {
      handleAssetChange(currentPage.id, asset.id, 'x', interactionStart.initialX + deltaX);
      handleAssetChange(currentPage.id, asset.id, 'y', interactionStart.initialY + deltaY);
    } else if (interactionMode === 'resizing') {
      const { handleType, initialW, initialH, initialX, initialY } = interactionStart;
      if (handleType === 'se') {
        handleAssetChange(currentPage.id, asset.id, 'width', Math.max(50, initialW + deltaX));
        handleAssetChange(currentPage.id, asset.id, 'height', Math.max(50, initialH + deltaY));
      } else if (handleType === 'sw') {
        handleAssetChange(currentPage.id, asset.id, 'width', Math.max(50, initialW - deltaX));
        handleAssetChange(currentPage.id, asset.id, 'x', initialX + deltaX);
        handleAssetChange(currentPage.id, asset.id, 'height', Math.max(50, initialH + deltaY));
      } else if (handleType === 'ne') {
        handleAssetChange(currentPage.id, asset.id, 'width', Math.max(50, initialW + deltaX));
        handleAssetChange(currentPage.id, asset.id, 'height', Math.max(50, initialH - deltaY));
        handleAssetChange(currentPage.id, asset.id, 'y', initialY + deltaY);
      } else if (handleType === 'nw') {
        handleAssetChange(currentPage.id, asset.id, 'width', Math.max(50, initialW - deltaX));
        handleAssetChange(currentPage.id, asset.id, 'x', initialX + deltaX);
        handleAssetChange(currentPage.id, asset.id, 'height', Math.max(50, initialH - deltaY));
        handleAssetChange(currentPage.id, asset.id, 'y', initialY + deltaY);
      }
    } else if (interactionMode === 'rotating') {
      const rect = interactionStart.rect;
      const centerX = rect.left + interactionStart.initialX + interactionStart.initialW / 2;
      const centerY = rect.top + interactionStart.initialY + interactionStart.initialH / 2;
      const angleRad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      handleAssetChange(currentPage.id, asset.id, 'rotation', (angleRad * 180 / Math.PI) + 90);
    }
  };

  const handleMouseUp = () => {
    setInteractionMode('idle');
    setInteractionStart(null);
  };

  useEffect(() => {
    if (interactionMode !== 'idle') {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [interactionMode, interactionStart, selectedAssetId, editingPageIndex]);

  if (!pages || pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-4">
        <p>暂无阅读材料页面</p>
        <button
          onClick={() => handleAddPage()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          添加新页面
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 添加页面按钮 - 顶部 */}
      <div className="flex justify-end">
        <button
          onClick={() => handleAddPage()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          添加新页面
        </button>
      </div>

      {pages.map((page, pageIndex) => {
        const isEditing = editingPageIndex === pageIndex;
        const assets = page.canvasAssets || [];
        const selectedAsset = selectedAssetId ? assets.find(a => a.id === selectedAssetId) : null;

        return (
          <div key={page.id} className="bg-white rounded-lg border-2 border-slate-200 shadow-lg overflow-hidden">
            {/* Page Header */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {page.pageNumber}
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-slate-800">{page.title}</h2>
                    <p className="text-xs text-slate-500">页面 {page.pageNumber} / {pages.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* 画板比例切换 */}
                  {isEditing && (
                    <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                      <button
                        onClick={() => setCanvasAspectRatio('A4')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          canvasAspectRatio === 'A4' ? 'bg-white text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                        }`}
                        title="A4 竖版"
                      >
                        A4 竖版
                      </button>
                      <button
                        onClick={() => setCanvasAspectRatio('A4横向')}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          canvasAspectRatio === 'A4横向' ? 'bg-white text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                        }`}
                        title="A4 横版"
                      >
                        A4 横版
                      </button>
                    </div>
                  )}
                  {/* 删除页面按钮 */}
                  <button
                    onClick={() => handleDeletePage(page.id, pageIndex)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                    title="删除此页"
                  >
                    <FileX className="w-4 h-4" />
                    删除
                  </button>
                  {isEditing ? (
                    <button
                      onClick={() => onEditingPageIndexChange(null)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors bg-indigo-600 text-white"
                    >
                      完成编辑
                    </button>
                  ) : (
                    <button
                      onClick={() => onEditingPageIndexChange(pageIndex)}
                      className="px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
                    >
                      编辑此页
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Content Area */}
            {isEditing ? (
              <div className="flex relative">
                {/* Main Canvas Area */}
                <div className={`flex-1 ${isRightOpen ? '' : ''} transition-all duration-300`}>
                  <div className="flex-1 flex flex-col bg-slate-100 relative" style={{ minHeight: '600px' }}>
                    {/* 工具栏 - 固定在顶部 */}
                    <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-center gap-4 shrink-0">
                      <button 
                        onClick={() => handleAddAsset(page.id, 'text')} 
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-slate-200"
                      >
                        <Type className="w-5 h-5" />
                        <span className="text-sm font-medium">文本</span>
                      </button>
                      <button 
                        onClick={() => handleAddAsset(page.id, 'image')} 
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:text-purple-600 hover:bg-purple-50 transition-colors border border-slate-200"
                      >
                        <ImageIcon className="w-5 h-5" />
                        <span className="text-sm font-medium">图片</span>
                      </button>
                    </div>

                    {/* 画布区域 */}
                    <div 
                      className="flex-1 overflow-auto p-8 flex items-center justify-center relative" 
                      onClick={() => setSelectedAssetId(null)}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                    >
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px]"></div>
                      <div 
                        ref={canvasRef}
                        className="bg-white shadow-2xl rounded-sm relative overflow-hidden ring-1 ring-slate-900/5 transition-all duration-200"
                        style={{ width: canvasSize.width, height: canvasSize.height }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* 渲染资产 */}
                        {assets.length === 0 ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none">
                            <div className="w-16 h-16 mb-4 flex items-center justify-center">
                              <Type className="w-16 h-16" />
                            </div>
                            <p className="text-sm font-medium">画布为空，请使用上方工具栏添加素材</p>
                          </div>
                        ) : (
                          assets.map((asset, index) => (
                            <div
                              key={asset.id}
                              onMouseDown={(e) => handleMouseDown(e, asset.id, 'dragging')}
                              style={{ 
                                left: asset.x, 
                                top: asset.y, 
                                width: asset.width || 300, 
                                height: asset.height || 200,
                                zIndex: index,
                                transform: `rotate(${asset.rotation || 0}deg)`,
                                position: 'absolute'
                              }}
                              className={`cursor-move select-none group/asset ${
                                selectedAssetId === asset.id ? 'ring-2 ring-blue-500 z-50 shadow-2xl' : 'hover:ring-1 hover:ring-blue-300'
                              } transition-shadow duration-75`}
                            >
                              {/* 编辑控制手柄 */}
                              {selectedAssetId === asset.id && (
                                <>
                                  {/* 调整大小手柄 */}
                                  <div onMouseDown={(e) => handleMouseDown(e, asset.id, 'resizing', 'nw')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-nw-resize z-50"></div>
                                  <div onMouseDown={(e) => handleMouseDown(e, asset.id, 'resizing', 'ne')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-ne-resize z-50"></div>
                                  <div onMouseDown={(e) => handleMouseDown(e, asset.id, 'resizing', 'sw')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-sw-resize z-50"></div>
                                  <div onMouseDown={(e) => handleMouseDown(e, asset.id, 'resizing', 'se')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-se-resize z-50"></div>
                                  
                                  {/* 旋转手柄 */}
                                  <div 
                                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing z-50"
                                    onMouseDown={(e) => handleMouseDown(e, asset.id, 'rotating')}
                                  >
                                    <div className="w-px h-4 bg-blue-500"></div>
                                    <div className="w-5 h-5 bg-white border border-blue-500 rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                                      <RotateCw className="w-3 h-3 text-blue-500" />
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* 资产内容 */}
                              {asset.type === 'text' ? (
                                <div 
                                  className="w-full h-full bg-transparent p-2 font-sans whitespace-pre-wrap overflow-hidden flex items-center"
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
                                >
                                  {asset.content || "请输入文本..."}
                                </div>
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
                                      No Image
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
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 右侧编辑面板 */}
                <aside className={`${isRightOpen ? 'w-96' : 'w-0'} bg-white border-l border-slate-200 flex flex-col shrink-0 z-10 shadow-[0_0_15px_rgba(0,0,0,0.05)] transition-all duration-300 relative`}>
                  {!isRightOpen && (
                    <button 
                      onClick={() => setIsRightOpen(true)} 
                      className="absolute top-4 right-0 bg-white p-2 rounded-l-md border border-r-0 border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 z-50 transform -translate-x-full"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  <div className={`flex flex-col h-full ${!isRightOpen && 'hidden'}`}>
                    {selectedAsset ? (
                      <>
                        <div className="p-4 border-b border-slate-100 bg-blue-50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getAssetIcon(selectedAsset.type)}
                            <h3 className="font-bold text-blue-800">编辑元素</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => setIsRightOpen(false)} className="text-slate-400 hover:text-slate-600">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <button onClick={() => setSelectedAssetId(null)} className="text-slate-500 hover:text-slate-700">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Layers className="w-3 h-3" /> 图层
                          </span>
                          <div className="flex gap-1">
                            <button onClick={() => handleLayerChange(page.id, selectedAsset.id, 'front')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="置顶">
                              <ChevronsUp className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleLayerChange(page.id, selectedAsset.id, 'forward')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="上移">
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleLayerChange(page.id, selectedAsset.id, 'backward')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="下移">
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleLayerChange(page.id, selectedAsset.id, 'back')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="置底">
                              <ChevronsDown className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-6">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">宽 Width</label>
                              <div className="flex items-center border border-slate-200 rounded px-2 bg-slate-50">
                                <input 
                                  type="number" 
                                  value={Math.round(selectedAsset.width || 300)} 
                                  onChange={(e) => handleAssetChange(page.id, selectedAsset.id, 'width', parseInt(e.target.value))} 
                                  className="w-full text-xs bg-transparent py-1.5 outline-none"
                                />
                                <span className="text-[10px] text-slate-400">px</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">高 Height</label>
                              <div className="flex items-center border border-slate-200 rounded px-2 bg-slate-50">
                                <input 
                                  type="number" 
                                  value={Math.round(selectedAsset.height || 200)} 
                                  onChange={(e) => handleAssetChange(page.id, selectedAsset.id, 'height', parseInt(e.target.value))} 
                                  className="w-full text-xs bg-transparent py-1.5 outline-none"
                                />
                                <span className="text-[10px] text-slate-400">px</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">旋转 Rotate</label>
                              <div className="flex items-center border border-slate-200 rounded px-2 bg-slate-50">
                                <input 
                                  type="number" 
                                  value={Math.round(selectedAsset.rotation || 0)} 
                                  onChange={(e) => handleAssetChange(page.id, selectedAsset.id, 'rotation', parseInt(e.target.value))} 
                                  className="w-full text-xs bg-transparent py-1.5 outline-none"
                                />
                                <span className="text-[10px] text-slate-400">°</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">标题 / Name</label>
                              <input 
                                type="text" 
                                value={selectedAsset.title || ''} 
                                onChange={(e) => handleAssetChange(page.id, selectedAsset.id, 'title', e.target.value)} 
                                className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </div>
                            {selectedAsset.type === 'text' ? (
                              <div className="space-y-4">
                                <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">文本内容 / Content</label>
                                  <textarea 
                                    value={selectedAsset.content || ''} 
                                    onChange={(e) => handleAssetChange(page.id, selectedAsset.id, 'content', e.target.value)} 
                                    className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
                                  />
                                </div>
                                
                                {/* 文本样式选项 */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-500 uppercase">文本样式</label>
                                  </div>
                                  
                                  {/* 字号 */}
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">字号 Font Size</label>
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="number" 
                                        min="8" 
                                        max="200" 
                                        value={selectedAsset.fontSize || 24} 
                                        onChange={(e) => handleAssetChange(page.id, selectedAsset.id, 'fontSize', parseInt(e.target.value) || 24)} 
                                        className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-slate-50 outline-none"
                                      />
                                      <span className="text-[10px] text-slate-400">px</span>
                                    </div>
                                  </div>

                                  {/* 加粗 */}
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">字重 Font Weight</label>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleAssetChange(page.id, selectedAsset.id, 'fontWeight', 'normal')}
                                        className={`flex-1 px-3 py-2 rounded border text-xs transition-colors ${
                                          (selectedAsset.fontWeight || 'normal') === 'normal' 
                                            ? 'bg-blue-50 border-blue-300 text-blue-700' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                      >
                                        正常
                                      </button>
                                      <button
                                        onClick={() => handleAssetChange(page.id, selectedAsset.id, 'fontWeight', 'bold')}
                                        className={`flex-1 px-3 py-2 rounded border text-xs transition-colors flex items-center justify-center gap-1 ${
                                          selectedAsset.fontWeight === 'bold' 
                                            ? 'bg-blue-50 border-blue-300 text-blue-700' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                      >
                                        <Bold className="w-3 h-3" />
                                        加粗
                                      </button>
                                    </div>
                                  </div>

                                  {/* 文本颜色 */}
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block flex items-center gap-1">
                                      <Palette className="w-3 h-3" /> 文本颜色 Color
                                    </label>
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="color" 
                                        value={selectedAsset.color || '#1e293b'} 
                                        onChange={(e) => handleAssetChange(page.id, selectedAsset.id, 'color', e.target.value)} 
                                        className="w-12 h-10 rounded border border-slate-200 cursor-pointer"
                                      />
                                      <input 
                                        type="text" 
                                        value={selectedAsset.color || '#1e293b'} 
                                        onChange={(e) => handleAssetChange(page.id, selectedAsset.id, 'color', e.target.value)} 
                                        className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-slate-50 outline-none font-mono"
                                        placeholder="#000000"
                                      />
                                    </div>
                                  </div>

                                  {/* 文本对齐 */}
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">对齐方式 Align</label>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleAssetChange(page.id, selectedAsset.id, 'textAlign', 'left')}
                                        className={`flex-1 px-2 py-2 rounded border text-xs transition-colors flex items-center justify-center ${
                                          (selectedAsset.textAlign || 'center') === 'left' 
                                            ? 'bg-blue-50 border-blue-300 text-blue-700' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                        title="左对齐"
                                      >
                                        <AlignLeft className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleAssetChange(page.id, selectedAsset.id, 'textAlign', 'center')}
                                        className={`flex-1 px-2 py-2 rounded border text-xs transition-colors flex items-center justify-center ${
                                          (selectedAsset.textAlign || 'center') === 'center' 
                                            ? 'bg-blue-50 border-blue-300 text-blue-700' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                        title="居中"
                                      >
                                        <AlignCenter className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleAssetChange(page.id, selectedAsset.id, 'textAlign', 'right')}
                                        className={`flex-1 px-2 py-2 rounded border text-xs transition-colors flex items-center justify-center ${
                                          selectedAsset.textAlign === 'right' 
                                            ? 'bg-blue-50 border-blue-300 text-blue-700' 
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                        title="右对齐"
                                      >
                                        <AlignRight className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* 描边 */}
                                  <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">描边 Stroke</label>
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <input 
                                          type="checkbox" 
                                          checked={!!selectedAsset.strokeWidth} 
                                          onChange={(e) => handleAssetChange(page.id, selectedAsset.id, 'strokeWidth', e.target.checked ? 2 : 0)} 
                                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-xs text-slate-600">启用描边</span>
                                      </div>
                                      {selectedAsset.strokeWidth && selectedAsset.strokeWidth > 0 && (
                                        <div className="space-y-2 pl-6">
                                          <div>
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-[10px] text-slate-500">描边宽度</span>
                                              <span className="text-[10px] text-slate-400">{selectedAsset.strokeWidth || 0}px</span>
                                            </div>
                                            <input 
                                              type="range" 
                                              min="0" 
                                              max="10" 
                                              value={selectedAsset.strokeWidth || 2} 
                                              onChange={(e) => handleAssetChange(page.id, selectedAsset.id, 'strokeWidth', parseInt(e.target.value))} 
                                              className="w-full"
                                            />
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <label className="text-[10px] text-slate-500">描边颜色</label>
                                            <input 
                                              type="color" 
                                              value={selectedAsset.strokeColor || '#000000'} 
                                              onChange={(e) => handleAssetChange(page.id, selectedAsset.id, 'strokeColor', e.target.value)} 
                                              className="w-10 h-8 rounded border border-slate-200 cursor-pointer"
                                            />
                                            <input 
                                              type="text" 
                                              value={selectedAsset.strokeColor || '#000000'} 
                                              onChange={(e) => handleAssetChange(page.id, selectedAsset.id, 'strokeColor', e.target.value)} 
                                              className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50 outline-none font-mono"
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
                                {(selectedAsset.type === 'image' || selectedAsset.type === 'video') && (
                                  <div className="mb-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                                        <Upload className="w-3 h-3" /> 参考图片 (可选)
                                      </label>
                                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">Optional</span>
                                    </div>
                                    {!selectedAsset.referenceImage ? (
                                      <div className="border border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative group/upload">
                                        <input 
                                          type="file" 
                                          accept="image/*" 
                                          className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                                          onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                              const reader = new FileReader();
                                              reader.onloadend = () => {
                                                handleAssetChange(page.id, selectedAsset.id, 'referenceImage', reader.result);
                                              };
                                              reader.readAsDataURL(file);
                                            }
                                          }}
                                        />
                                        <div className="p-2 bg-white rounded-full shadow-sm mb-2 group-hover/upload:scale-110 transition-transform">
                                          <Upload className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <span className="text-xs text-slate-500 font-medium">点击上传参考图片</span>
                                        <span className="text-[10px] text-slate-400 mt-1">仅用于风格辅助，非必传</span>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <div className="relative group/ref">
                                          <img src={selectedAsset.referenceImage} alt="Reference" className="w-full h-32 object-cover rounded border border-slate-200 opacity-90" />
                                          <div className="absolute inset-0 bg-black/0 group-hover/ref:bg-black/10 transition-colors rounded"></div>
                                          <button 
                                            onClick={() => handleAssetChange(page.id, selectedAsset.id, 'referenceImage', null)} 
                                            className="absolute top-2 right-2 bg-white text-slate-600 hover:text-red-500 p-1.5 rounded-full shadow-sm opacity-0 group-hover/ref:opacity-100 transition-opacity"
                                            title="移除参考图"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Sliders className="w-3 h-3 text-slate-400" />
                                          <div className="flex-1 h-1 bg-slate-200 rounded overflow-hidden">
                                            <div className="w-1/3 h-full bg-blue-400"></div>
                                          </div>
                                          <span className="text-[10px] text-slate-400">参考权重: 低</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div>
                                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-2">
                                    <Wand2 className="w-3 h-3 text-purple-500" /> AI 生成提示词 / Prompt
                                  </label>
                                  <textarea 
                                    value={selectedAsset.prompt || ''} 
                                    onChange={(e) => handleAssetChange(page.id, selectedAsset.id, 'prompt', e.target.value)} 
                                    placeholder="描述你想要生成的画面..." 
                                    className="w-full text-sm border border-purple-200 bg-purple-50 rounded px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none h-24 resize-none mb-2"
                                  />
                                  <button 
                                    onClick={() => {
                                      setGeneratingAssetId(selectedAsset.id);
                                      setTimeout(() => {
                                        const randomColor = Math.floor(Math.random()*16777215).toString(16);
                                        const generatedUrl = `https://placehold.co/${selectedAsset.width || 300}x${selectedAsset.height || 200}/${randomColor}/FFF?text=AI+Gen+${Date.now().toString().slice(-4)}`;
                                        handleAssetChange(page.id, selectedAsset.id, 'url', generatedUrl);
                                        setGeneratingAssetId(null);
                                      }, 2000);
                                    }}
                                    className="w-full py-2 bg-purple-600 text-white rounded text-sm font-bold shadow hover:bg-purple-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                  >
                                    <RefreshCw className={`w-4 h-4 ${generatingAssetId === selectedAsset.id ? 'animate-spin' : ''}`} />
                                    {selectedAsset.referenceImage ? '参考图 + 文本生成' : '立即生成'}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                          <div className="pt-6 mt-6 border-t border-slate-100">
                            <button 
                              onClick={() => handleDeleteAsset(page.id, selectedAsset.id)} 
                              className="w-full py-2 text-red-500 border border-red-200 rounded text-sm font-bold hover:bg-red-50 flex items-center justify-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" /> 删除此元素
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                          <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Wand2 className="w-4 h-4 text-purple-600" />画板编辑
                          </h3>
                          <button onClick={() => setIsRightOpen(false)} className="text-slate-400 hover:text-slate-600">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-500 uppercase">
                              画板元素 ({(page.canvasAssets || []).length})
                            </label>
                            <div className="flex gap-1">
                              <button onClick={() => handleAddAsset(page.id, 'image')} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-purple-600">
                                <ImageIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {(page.canvasAssets || []).map((asset) => (
                              <div 
                                key={asset.id} 
                                onClick={() => setSelectedAssetId(asset.id)} 
                                className="flex items-start gap-2 p-2 border border-slate-200 rounded bg-white hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all group"
                              >
                                <div className="mt-1 text-slate-400">{getAssetIcon(asset.type)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-bold text-slate-700 truncate">{asset.title || asset.type}</div>
                                  <div className="text-[10px] text-slate-400">{asset.type} • 点击编辑</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </aside>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-center justify-center bg-slate-100 rounded-lg overflow-hidden" style={{ minHeight: '400px' }}>
                  <div className="relative bg-white shadow-lg rounded-sm overflow-hidden ring-1 ring-slate-900/5" style={{ width: canvasSize.width, height: canvasSize.height }}>
                    {/* 预览模式：显示所有元素，但不可编辑 */}
                    {assets.length === 0 ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none">
                        <div className="w-16 h-16 mb-4 flex items-center justify-center">
                          <Type className="w-16 h-16" />
                        </div>
                        <p className="text-sm font-medium">暂无内容</p>
                        <p className="text-xs mt-2 text-slate-400">点击"编辑此页"开始添加素材</p>
                      </div>
                    ) : (
                      assets.map((asset, index) => (
                        <div
                          key={asset.id}
                          style={{ 
                            left: asset.x, 
                            top: asset.y, 
                            width: asset.width || 300, 
                            height: asset.height || 200,
                            zIndex: index,
                            transform: `rotate(${asset.rotation || 0}deg)`,
                            position: 'absolute'
                          }}
                          className="select-none"
                        >
                          {/* 资产内容 */}
                          {asset.type === 'text' ? (
                            <div 
                              className="w-full h-full bg-transparent p-2 font-sans whitespace-pre-wrap overflow-hidden flex items-center"
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
                            >
                              {asset.content || ""}
                            </div>
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
                                  No Image
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
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* 底部添加页面按钮 */}
      <div className="flex justify-center pt-4">
        <button
          onClick={() => handleAddPage(pages.length - 1)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          在末尾添加新页面
        </button>
      </div>
    </div>
  );
};
