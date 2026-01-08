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
  ChevronDown,
  Monitor,
  Smartphone,
  Play,
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Plus,
  FileX,
  FileDown,
  List,
  FileText,
  BookOpen,
  Copy
} from 'lucide-react';
import { getAssetIcon } from '../utils';
import { PromptInputModal } from './PromptInputModal';
import { WORD_DOC_DATA } from '../constants';

/**
 * ReadingMaterialEditor - 阅读材料画板编辑器
 * 独立的画板编辑器，支持16:9和9:16模式
 */
export const ReadingMaterialEditor = ({ 
  pages, 
  onPagesChange,
  editingPageIndex,
  onEditingPageIndexChange,
  canvasAspectRatio: externalCanvasAspectRatio,
  onCanvasAspectRatioChange,
  selectedAssetId: externalSelectedAssetId,
  onSelectedAssetIdChange,
  onCopyAsset,
  onDeleteAsset
}) => {
  const [internalCanvasAspectRatio, setInternalCanvasAspectRatio] = useState('A4'); // 'A4' | 'A4横向'
  const canvasAspectRatio = externalCanvasAspectRatio !== undefined ? externalCanvasAspectRatio : internalCanvasAspectRatio;
  const setCanvasAspectRatio = onCanvasAspectRatioChange || setInternalCanvasAspectRatio;
  const [internalSelectedAssetId, setInternalSelectedAssetId] = useState(null);
  const selectedAssetId = externalSelectedAssetId !== undefined ? externalSelectedAssetId : internalSelectedAssetId;
  const setSelectedAssetId = onSelectedAssetIdChange || setInternalSelectedAssetId;
  const [interactionMode, setInteractionMode] = useState('idle');
  const [interactionStart, setInteractionStart] = useState(null);
  const [isLeftOpen, setIsLeftOpen] = useState(true); // 左侧目录树
  const [generatingAssetId, setGeneratingAssetId] = useState(null);
  const canvasRef = useRef(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptModalConfig, setPromptModalConfig] = useState({ pageId: null, assetType: null, type: null, insertAfterIndex: null });
  const [isGeneratingAsset, setIsGeneratingAsset] = useState(false);
  const [addPageInsertIndex, setAddPageInsertIndex] = useState(null);
  const [expandedPhases, setExpandedPhases] = useState(['engage', 'empower', 'execute', 'elevate']);

  // 按阶段组织页面 - 使用与CanvasView相同的结构
  const organizePagesByPhase = () => {
    const phaseConfig = {
      engage: { title: 'Engage (引入)', color: 'bg-purple-100 text-purple-700 border-purple-200' },
      empower: { title: 'Empower (赋能)', color: 'bg-blue-100 text-blue-700 border-blue-200' },
      execute: { title: 'Execute (实践)', color: 'bg-green-100 text-green-700 border-green-200' },
      elevate: { title: 'Elevate (升华)', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' }
    };

    return Object.entries(phaseConfig).map(([key, config]) => {
      const phasePages = pages.filter(page => {
        if (!page.slideId) return false;
        const slide = WORD_DOC_DATA.find(s => s.id === page.slideId);
        if (!slide) return false;
        // 匹配阶段：Engage, Empower, Execute, Elevate
        const phaseName = key.charAt(0).toUpperCase() + key.slice(1);
        return slide.phase.includes(phaseName);
      }).map((page) => ({
        ...page,
        indexInPages: pages.findIndex(p => p.id === page.id)
      }));

      return {
        key,
        title: config.title,
        color: config.color,
        pages: phasePages
      };
    });
  };

  const phasesWithPages = organizePagesByPhase();

  // 切换阶段展开/收起 - 使用key而不是id
  const togglePhase = (phaseKey) => {
    if (expandedPhases.includes(phaseKey)) {
      setExpandedPhases(expandedPhases.filter(p => p !== phaseKey));
    } else {
      setExpandedPhases([...expandedPhases, phaseKey]);
    }
  };

  // 计算画布尺寸 (A4比例: 210mm × 297mm ≈ 0.707:1)
  const getCanvasSize = () => {
    if (canvasAspectRatio === 'A4') {
      // A4竖版：宽度800px，高度1131px (800/1131 ≈ 0.707)
      return { width: 565, height: 800 };
    } else {
      // A4横版：宽度1131px，高度800px
      return { width: 800, height: 565 };
    }
  };

  const canvasSize = getCanvasSize();

  // 更新资产
  const handleAssetChange = (pageId, assetId, field, value) => {
    onPagesChange(prev => {
      if (!Array.isArray(prev)) return prev;
      return prev.map(page => {
        if (page.id === pageId) {
          return {
            ...page,
            canvasAssets: (page.canvasAssets || []).map(asset => 
              asset.id === assetId ? { ...asset, [field]: value } : asset
            )
          };
        }
        return page;
      });
    });
  };

  // 添加资产 - 显示提示词输入模态框
  const handleAddAsset = (pageId, type) => {
    setPromptModalConfig({ pageId, assetType: type });
    setShowPromptModal(true);
  };

  // 确认添加资产
  const handleConfirmAddAsset = (prompt) => {
    setIsGeneratingAsset(true);
    const { pageId, assetType: type } = promptModalConfig;
    
    // 模拟AI生成
    setTimeout(() => {
      let w = 300, h = 200;
      if (type === 'audio') { w = 300; h = 100; }
      if (type === 'text') { w = 300; h = 100; }

      const generatedTitle = prompt 
        ? `AI生成：${prompt.substring(0, 15)}...` 
        : (type === 'text' ? '文本' : type === 'image' ? '图片' : type === 'video' ? '视频' : '音频');
      const generatedUrl = type === 'text' 
        ? '' 
        : `https://placehold.co/${w}x${h}/${Math.floor(Math.random()*16777215).toString(16)}/FFF?text=AI+Gen+${Date.now().toString().slice(-4)}`;

      onPagesChange(prev => prev.map(page => {
        if (page.id === pageId) {
          const newAsset = {
            id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            title: generatedTitle,
            url: generatedUrl,
            content: type === 'text' ? (prompt || '双击编辑文本') : '',
            prompt: prompt || '',
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
      
      setIsGeneratingAsset(false);
      setShowPromptModal(false);
      setPromptModalConfig({ pageId: null, assetType: null });
    }, 1500);
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

  // 显示添加页面提示词输入模态框
  const handleAddPage = (insertAfterIndex = null) => {
    setAddPageInsertIndex(insertAfterIndex);
    setPromptModalConfig({ type: 'page', insertAfterIndex, pageId: null, assetType: null });
    setShowPromptModal(true);
  };

  // 确认添加页面（带提示词）
  const handleConfirmAddPage = (prompt) => {
    const canvasSize = getCanvasSize();
    const insertAfterIndex = addPageInsertIndex;
    const generatedTitle = prompt 
      ? `AI生成：${prompt.substring(0, 20)}...` 
      : `新页面 ${insertAfterIndex !== null ? insertAfterIndex + 2 : pages.length + 1}`;
    
    const newPage = {
      id: `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      slideId: null,
      pageNumber: insertAfterIndex !== null ? insertAfterIndex + 2 : pages.length + 1,
      title: generatedTitle,
      width: canvasSize.width,
      height: canvasSize.height,
      canvasAssets: [],
      blocks: [],
      prompt: prompt || ''
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

    setShowPromptModal(false);
    setPromptModalConfig({ pageId: null, assetType: null, type: null, insertAfterIndex: null });
    setAddPageInsertIndex(null);
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

  // 导出阅读材料PDF
  const handleExportPDF = () => {
    // 模拟导出PDF
    alert('导出阅读材料PDF功能（待实现）');
  };

  return (
    <div className="flex flex-col h-full">
      {/* 顶部工具栏 */}

      {/* 主内容区域 */}
        {/* 左侧目录树 */}
        {/* 中间内容区域 */}
        <div className="flex-1 overflow-auto">
          <div className="space-y-8">
            {pages.map((page, pageIndex) => {
              const isEditing = editingPageIndex === pageIndex;
              const assets = page.canvasAssets || [];
              const selectedAsset = selectedAssetId ? assets.find(a => a.id === selectedAssetId) : null;

              return (
                <div key={page.id} className="bg-white overflow-hidden">
            {/* Page Header */}
            

            {/* Content Area */}
            {isEditing ? (
              <div className="flex relative">
                {/* Main Canvas Area */}
                <div className="flex-1 transition-all duration-300">
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
                              {/* 右上角复制和删除按钮 */}
                              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/asset:opacity-100 transition-opacity z-50">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onCopyAsset) onCopyAsset(asset.id);
                                  }}
                                  className="p-1.5 bg-blue-500 text-white rounded shadow-sm hover:bg-blue-600 transition-colors"
                                  title="复制"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onDeleteAsset) onDeleteAsset(asset.id);
                                  }}
                                  className="p-1.5 bg-red-500 text-white rounded shadow-sm hover:bg-red-600 transition-colors"
                                  title="删除"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              
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
        </div>

      {/* Prompt Input Modal */}
      <PromptInputModal
        isOpen={showPromptModal}
        onClose={() => {
          setShowPromptModal(false);
          setPromptModalConfig({ pageId: null, assetType: null, type: null, insertAfterIndex: null });
          setAddPageInsertIndex(null);
        }}
        onConfirm={promptModalConfig.type === 'page' ? handleConfirmAddPage : handleConfirmAddAsset}
        title={promptModalConfig.type === 'page' 
          ? '添加新页面'
          : `添加${promptModalConfig.assetType === 'image' ? '图片' : promptModalConfig.assetType === 'video' ? '视频' : promptModalConfig.assetType === 'audio' ? '音频' : '文本'}元素`}
        description={promptModalConfig.type === 'page'
          ? '请输入AI生成提示词，描述你想要创建的页面内容（可选，留空将使用默认标题）'
          : '请输入AI生成提示词，描述你想要创建的元素'}
        placeholder={promptModalConfig.type === 'page'
          ? '例如：创建一个关于颜色词汇的阅读页面，包含图片和文字...'
          : `例如：${promptModalConfig.assetType === 'image' ? '生成一张关于动物的图片' : promptModalConfig.assetType === 'video' ? '生成一个教学视频' : promptModalConfig.assetType === 'audio' ? '生成背景音乐' : '输入文本内容'}...`}
        type={promptModalConfig.type === 'page' ? 'session' : 'element'}
        isLoading={promptModalConfig.type === 'page' ? false : isGeneratingAsset}
      />
    </div>
  );
};
