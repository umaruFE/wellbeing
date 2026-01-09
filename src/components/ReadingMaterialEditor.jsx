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
import { CanvasAssetRenderer } from './CanvasAssetRenderer';

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
  const [editingTextAssetId, setEditingTextAssetId] = useState(null); // 正在编辑的文本资产ID
  const [editingTextContent, setEditingTextContent] = useState(''); // 正在编辑的文本内容
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
  const handleConfirmAddAsset = (prompt, inputMode = 'ai') => {
    const { pageId, assetType: type } = promptModalConfig;
    if (!pageId || !type) return;

    // 如果是文本类型且是直接输入模式，不需要生成时间，直接添加
    if (type === 'text' && inputMode === 'direct') {
      const w = 400;
      const h = 150;

      const newAsset = {
        id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        title: '文本',
        url: '',
        content: prompt || '双击编辑文本',
        prompt: '',
        referenceImage: null,
        x: (canvasSize.width - w) / 2,
        y: (canvasSize.height - h) / 2,
        width: w,
        height: h,
        rotation: 0,
        fontSize: 24,
        fontWeight: 'normal',
        color: '#1e293b',
        textAlign: 'center'
      };

      onPagesChange(prev => {
        if (!Array.isArray(prev)) return prev;
        return prev.map(page => {
          if (page.id === pageId) {
            return {
              ...page,
              canvasAssets: [...(page.canvasAssets || []), newAsset]
            };
          }
          return page;
        });
      });

      setShowPromptModal(false);
      setPromptModalConfig({ pageId: null, assetType: null });
      return;
    }

    setIsGeneratingAsset(true);
    
    // 模拟AI生成
    setTimeout(() => {
      let w = 300, h = 200;
      if (type === 'text') { w = 300; h = 100; }
      // ... rest of the logic ...

      const generatedTitle = prompt 
        ? `AI生成：${prompt.substring(0, 15)}...` 
        : (type === 'text' ? '文本' : type === 'image' ? '图片' : type === 'video' ? '视频' : '');
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
            { (
              <div className="flex relative">
                {/* Main Canvas Area */}
                <div className="flex-1">
                  <div className="flex-1 flex flex-col bg-slate-100 relative" style={{ minHeight: '600px' }}>

                    {/* 画布区域 */}
                    <div 
                      className="flex-1 overflow-auto p-8 flex items-center justify-center relative" 
                      onClick={() => {
                        setSelectedAssetId(null);
                        // 如果正在编辑文本，保存并退出编辑模式
                        if (editingTextAssetId) {
                          const editingAsset = assets.find(a => a.id === editingTextAssetId);
                          if (editingAsset) {
                            handleAssetChange(page.id, editingTextAssetId, 'content', editingTextContent);
                          }
                          setEditingTextAssetId(null);
                        }
                      }}
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
                        <CanvasAssetRenderer
                          assets={assets}
                          isEditable={true}
                          onMouseDown={handleMouseDown}
                          selectedAssetId={selectedAssetId}
                          onCopyAsset={onCopyAsset}
                          onDeleteAsset={(assetId) => {
                            if (onDeleteAsset) {
                              onDeleteAsset(assetId);
                            } else {
                              handleDeleteAsset(page.id, assetId);
                            }
                          }}
                          onAssetChange={(assetId, field, value) => {
                            handleAssetChange(page.id, assetId, field, value);
                          }}
                          editingTextAssetId={editingTextAssetId}
                          onEditingTextAssetIdChange={setEditingTextAssetId}
                          editingTextContent={editingTextContent}
                          onEditingTextContentChange={setEditingTextContent}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) }
          </div>
        );
      })}

         
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
          : `添加${promptModalConfig.assetType === 'image' ? '图片' : promptModalConfig.assetType === 'video' ? '视频' : '文本'}元素`}
        description={promptModalConfig.type === 'page'
          ? '请输入AI生成提示词，描述你想要创建的页面内容（可选，留空将使用默认标题）'
          : '请输入AI生成提示词，描述你想要创建的元素'}
        placeholder={promptModalConfig.type === 'page'
          ? '例如：创建一个关于颜色词汇的阅读页面，包含图片和文字...'
          : `例如：${promptModalConfig.assetType === 'image' ? '生成一张关于动物的图片' : promptModalConfig.assetType === 'video' ? '生成一个教学视频' : '输入文本内容'}...`}
        type={promptModalConfig.type === 'page' ? 'session' : 'element'}
        isLoading={promptModalConfig.type === 'page' ? false : isGeneratingAsset}
      />
    </div>
  );
};
