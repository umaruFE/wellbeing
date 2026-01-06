import React, { useState, useRef, useEffect } from 'react';
import { 
  Image as ImageIcon,
  Type,
  Trash2,
  Wand2,
  RefreshCw,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  Link as LinkIcon,
  Upload,
  X
} from 'lucide-react';

/**
 * ReadingMaterialEditor - 富文本图文混排编辑器组件
 * 支持类似Word的富文本编辑体验，图文混排，AI生成等功能
 */
export const ReadingMaterialEditor = ({ 
  pages, 
  onPagesChange,
  editingPageIndex,
  onEditingPageIndexChange 
}) => {
  const [generatingBlockId, setGeneratingBlockId] = useState(null);
  const [generatingType, setGeneratingType] = useState(null);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [showImageInsert, setShowImageInsert] = useState(null); // 显示图片插入界面的块ID
  const editorRefs = useRef({});
  const contentCache = useRef({}); // 缓存内容，避免不必要的更新

  // 更新块内容
  const handleUpdateBlock = (pageId, blockId, field, value) => {
    onPagesChange(prev => prev.map(page => {
      if (page.id === pageId) {
        return {
          ...page,
          blocks: page.blocks.map(block => 
            block.id === blockId ? { ...block, [field]: value } : block
          )
        };
      }
      return page;
    }));
  };

  // 获取当前选中文本的格式状态
  const getFormatState = (blockId) => {
    const editor = editorRefs.current[blockId];
    if (!editor) return {};
    
    return {
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      alignLeft: document.queryCommandValue('justifyLeft') === 'true',
      alignCenter: document.queryCommandValue('justifyCenter') === 'true',
      alignRight: document.queryCommandValue('justifyRight') === 'true',
    };
  };

  // 执行格式化命令
  const execCommand = (blockId, command, value = null) => {
    const editor = editorRefs.current[blockId];
    if (!editor) return;
    
    editor.focus();
    document.execCommand(command, false, value);
    
    // 更新内容
    const html = editor.innerHTML;
    handleUpdateBlock(
      pages.find(p => p.blocks.some(b => b.id === blockId))?.id || '',
      blockId,
      'content',
      html
    );
  };

  // 插入图片到光标位置
  const insertImageAtCursor = (blockId, imageUrl, align = 'inline') => {
    const editor = editorRefs.current[blockId];
    if (!editor) return;
    
    editor.focus();
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    
    const img = document.createElement('img');
    img.src = imageUrl;
    img.className = 'inline-image max-w-full h-auto rounded-lg my-2';
    img.style.maxWidth = align === 'full' ? '100%' : '400px';
    img.style.display = align === 'full' ? 'block' : 'inline-block';
    img.style.margin = align === 'left' ? '0 1rem 0.5rem 0' : 
                       align === 'right' ? '0 0 0.5rem 1rem' : 
                       align === 'center' ? '0.5rem auto' : '0.5rem 0.5rem';
    img.contentEditable = 'false';
    img.draggable = true;
    
    // 如果是左对齐或右对齐，需要包装在div中
    if (align === 'left' || align === 'right') {
      const wrapper = document.createElement('div');
      wrapper.style.float = align;
      wrapper.style.margin = align === 'left' ? '0 1rem 0.5rem 0' : '0 0 0.5rem 1rem';
      wrapper.style.maxWidth = '45%';
      wrapper.appendChild(img);
      range.insertNode(wrapper);
    } else {
      range.insertNode(img);
    }
    
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // 更新内容
    const html = editor.innerHTML;
    handleUpdateBlock(
      pages.find(p => p.blocks.some(b => b.id === blockId))?.id || '',
      blockId,
      'content',
      html
    );
    
    setShowImageInsert(null);
  };

  // 添加新块
  const handleAddBlock = (pageId, type, insertAfterId = null) => {
    onPagesChange(prev => prev.map(page => {
      if (page.id === pageId) {
        const newBlock = {
          id: `block-${Date.now()}`,
          type,
          content: type === 'image' ? 'https://placehold.co/800x400/4f46e5/FFF?text=New+Image' : '<p><br></p>',
          caption: type === 'image' ? '图片说明' : '',
          order: insertAfterId 
            ? page.blocks.findIndex(b => b.id === insertAfterId) + 1
            : page.blocks.length,
          align: type === 'image' ? 'center' : 'left',
          prompt: ''
        };
        
        const blocks = [...page.blocks];
        if (insertAfterId) {
          const index = blocks.findIndex(b => b.id === insertAfterId);
          blocks.splice(index + 1, 0, newBlock);
        } else {
          blocks.push(newBlock);
        }
        
        // 重新排序
        blocks.forEach((block, index) => {
          block.order = index;
        });
        
        return { ...page, blocks };
      }
      return page;
    }));
  };

  // 删除块
  const handleDeleteBlock = (pageId, blockId) => {
    onPagesChange(prev => prev.map(page => {
      if (page.id === pageId) {
        const filtered = page.blocks.filter(b => b.id !== blockId);
        // 重新排序
        filtered.forEach((block, index) => {
          block.order = index;
        });
        return { ...page, blocks: filtered };
      }
      return page;
    }));
  };

  // 图片上传
  const handleImageUpload = (pageId, blockId, e, isInline = false) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isInline) {
          insertImageAtCursor(blockId, reader.result);
        } else {
          handleUpdateBlock(pageId, blockId, 'content', reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // AI生成文本
  const handleGenerateText = async (pageId, blockId, prompt) => {
    setGeneratingBlockId(blockId);
    setGeneratingType('text');
    
    setTimeout(() => {
      const generatedText = `<p><strong>【AI生成内容】</strong></p><p>基于提示词"${prompt || '默认提示'}"，AI生成了以下文本内容：</p><p>这是一段由AI生成的阅读材料文本。它可以根据上下文和教学目标自动生成适合的内容。你可以继续编辑这段文本，使其更符合你的需求。</p><p><em>生成时间：${new Date().toLocaleString()}</em></p>`;
      
      handleUpdateBlock(pageId, blockId, 'content', generatedText);
      setGeneratingBlockId(null);
      setGeneratingType(null);
    }, 2000);
  };

  // AI生成图片
  const handleGenerateImage = async (pageId, blockId, prompt) => {
    setGeneratingBlockId(blockId);
    setGeneratingType('image');
    
    setTimeout(() => {
      const randomColor = Math.floor(Math.random()*16777215).toString(16);
      const generatedImageUrl = `https://placehold.co/800x400/${randomColor}/FFF?text=AI+Generated+${encodeURIComponent(prompt || 'Image')}+${Date.now().toString().slice(-4)}`;
      
      handleUpdateBlock(pageId, blockId, 'content', generatedImageUrl);
      setGeneratingBlockId(null);
      setGeneratingType(null);
    }, 2500);
  };

  // 处理内容变化
  const handleContentChange = (pageId, blockId, html) => {
    contentCache.current[blockId] = html;
    handleUpdateBlock(pageId, blockId, 'content', html);
  };

  if (!pages || pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <p>暂无阅读材料页面</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {pages.map((page, pageIndex) => {
        const isEditing = editingPageIndex === pageIndex;
        
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
                  <button
                    onClick={() => onEditingPageIndexChange(isEditing ? null : pageIndex)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
                      isEditing
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {isEditing ? '完成编辑' : '编辑此页'}
                  </button>
                </div>
              </div>
            </div>

            {/* Page Content - Rich Text Editor */}
            <div className="p-6">
              <div className="space-y-4">
                {page.blocks
                  .sort((a, b) => a.order - b.order)
                  .map((block) => {
                    const isGenerating = generatingBlockId === block.id;
                    const isSelected = selectedBlockId === block.id;
                    const formatState = isSelected && block.type === 'text' ? getFormatState(block.id) : {};

                    return (
                      <div
                        key={block.id}
                        className={`group/block relative ${
                          isEditing ? 'border-2 border-dashed border-indigo-300 rounded-lg p-4 bg-indigo-50/10' : ''
                        }`}
                      >
                        {/* 富文本工具栏 */}
                        {isEditing && block.type === 'text' && isSelected && (
                          <div className="absolute -top-12 left-0 bg-white border border-slate-300 rounded-lg shadow-lg p-1 flex items-center gap-1 z-30">
                            {/* 格式化按钮 */}
                            <button
                              onClick={() => execCommand(block.id, 'bold')}
                              className={`p-1.5 rounded hover:bg-slate-100 ${formatState.bold ? 'bg-indigo-100 text-indigo-600' : 'text-slate-600'}`}
                              title="粗体"
                            >
                              <Bold className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => execCommand(block.id, 'italic')}
                              className={`p-1.5 rounded hover:bg-slate-100 ${formatState.italic ? 'bg-indigo-100 text-indigo-600' : 'text-slate-600'}`}
                              title="斜体"
                            >
                              <Italic className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => execCommand(block.id, 'underline')}
                              className={`p-1.5 rounded hover:bg-slate-100 ${formatState.underline ? 'bg-indigo-100 text-indigo-600' : 'text-slate-600'}`}
                              title="下划线"
                            >
                              <Underline className="w-4 h-4" />
                            </button>
                            <div className="w-px h-6 bg-slate-200 mx-1"></div>
                            <button
                              onClick={() => execCommand(block.id, 'justifyLeft')}
                              className={`p-1.5 rounded hover:bg-slate-100 ${formatState.alignLeft ? 'bg-indigo-100 text-indigo-600' : 'text-slate-600'}`}
                              title="左对齐"
                            >
                              <AlignLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => execCommand(block.id, 'justifyCenter')}
                              className={`p-1.5 rounded hover:bg-slate-100 ${formatState.alignCenter ? 'bg-indigo-100 text-indigo-600' : 'text-slate-600'}`}
                              title="居中"
                            >
                              <AlignCenter className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => execCommand(block.id, 'justifyRight')}
                              className={`p-1.5 rounded hover:bg-slate-100 ${formatState.alignRight ? 'bg-indigo-100 text-indigo-600' : 'text-slate-600'}`}
                              title="右对齐"
                            >
                              <AlignRight className="w-4 h-4" />
                            </button>
                            <div className="w-px h-6 bg-slate-200 mx-1"></div>
                            <button
                              onClick={() => setShowImageInsert(showImageInsert === block.id ? null : block.id)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
                              title="插入图片"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleAddBlock(page.id, 'text', block.id)}
                              className="p-1.5 rounded hover:bg-slate-100 text-slate-600"
                              title="插入新段落"
                            >
                              <Type className="w-4 h-4" />
                            </button>
                            <div className="w-px h-6 bg-slate-200 mx-1"></div>
                            <button
                              onClick={() => handleDeleteBlock(page.id, block.id)}
                              className="p-1.5 rounded hover:bg-red-50 text-red-500"
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {/* 图片插入界面 */}
                        {showImageInsert === block.id && (
                          <div className="absolute top-0 left-0 bg-white border border-slate-300 rounded-lg shadow-lg p-3 z-40 w-96">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-slate-700">插入图片到文本中</span>
                              <button
                                onClick={() => setShowImageInsert(null)}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="space-y-3">
                              {/* 对齐方式选择 */}
                              <div>
                                <label className="text-xs text-slate-500 mb-1 block">对齐方式</label>
                                <div className="flex gap-2">
                                  {['inline', 'left', 'center', 'right', 'full'].map((align) => (
                                    <button
                                      key={align}
                                      onClick={() => {
                                        const alignMap = {
                                          'inline': '内联',
                                          'left': '左对齐',
                                          'center': '居中',
                                          'right': '右对齐',
                                          'full': '全宽'
                                        };
                                        // 这里可以保存对齐方式到block中
                                        const currentAlign = block.imageAlign || 'inline';
                                        if (currentAlign !== align) {
                                          handleUpdateBlock(page.id, block.id, 'imageAlign', align);
                                        }
                                      }}
                                      className={`px-2 py-1 text-xs rounded border ${
                                        (block.imageAlign || 'inline') === align
                                          ? 'bg-indigo-100 border-indigo-500 text-indigo-700'
                                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                                      }`}
                                    >
                                      {align === 'inline' ? '内联' : 
                                       align === 'left' ? '左' : 
                                       align === 'center' ? '中' : 
                                       align === 'right' ? '右' : '全'}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              
                              <label className="block">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        insertImageAtCursor(block.id, reader.result, block.imageAlign || 'inline');
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                                <div className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded hover:bg-slate-50 cursor-pointer">
                                  <Upload className="w-4 h-4 text-slate-500" />
                                  <span className="text-sm text-slate-600">上传图片</span>
                                </div>
                              </label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={block.prompt || ''}
                                  onChange={(e) => handleUpdateBlock(page.id, block.id, 'prompt', e.target.value)}
                                  className="flex-1 text-xs border border-slate-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                  placeholder="AI生成提示词..."
                                />
                                <button
                                  onClick={async () => {
                                    setGeneratingBlockId(block.id);
                                    setGeneratingType('image');
                                    
                                    setTimeout(() => {
                                      const randomColor = Math.floor(Math.random()*16777215).toString(16);
                                      const generatedImageUrl = `https://placehold.co/800x400/${randomColor}/FFF?text=AI+Generated+${encodeURIComponent(block.prompt || 'Image')}+${Date.now().toString().slice(-4)}`;
                                      insertImageAtCursor(block.id, generatedImageUrl, block.imageAlign || 'inline');
                                      setGeneratingBlockId(null);
                                      setGeneratingType(null);
                                    }, 2500);
                                  }}
                                  disabled={isGenerating}
                                  className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
                                >
                                  {isGenerating && generatingType === 'image' ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Wand2 className="w-3 h-3" />
                                  )}
                                  AI生成
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 文本块 - 富文本编辑器 */}
                        {block.type === 'text' && (
                          <div className="relative">
                            {isGenerating ? (
                              <div className="w-full min-h-[200px] bg-slate-100 rounded-lg border-2 border-dashed border-indigo-300 flex items-center justify-center">
                                <div className="text-center">
                                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                                  <p className="text-sm text-slate-600">AI 正在生成文本...</p>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="relative">
                                  {/* 内联图片样式 */}
                                  <style>{`
                                    .rich-text-editor .inline-image {
                                      max-width: 100%;
                                      height: auto;
                                      border-radius: 0.5rem;
                                      margin: 0.5rem;
                                      cursor: pointer;
                                    }
                                    .rich-text-editor .inline-image:hover {
                                      outline: 2px solid #6366f1;
                                      outline-offset: 2px;
                                    }
                                    .rich-text-editor[contenteditable="true"] img {
                                      display: inline-block;
                                      vertical-align: middle;
                                    }
                                    .rich-text-editor[contenteditable="true"] div[style*="float"] {
                                      clear: both;
                                    }
                                  `}</style>
                                  <div
                                    ref={(el) => {
                                      if (el) {
                                        editorRefs.current[block.id] = el;
                                        // 只在内容变化且不在编辑状态时更新，避免覆盖用户正在编辑的内容
                                        if (contentCache.current[block.id] !== block.content && !isEditing) {
                                          el.innerHTML = block.content;
                                          contentCache.current[block.id] = block.content;
                                        } else if (!contentCache.current[block.id]) {
                                          el.innerHTML = block.content;
                                          contentCache.current[block.id] = block.content;
                                        }
                                      }
                                    }}
                                    contentEditable={isEditing}
                                    onFocus={() => setSelectedBlockId(block.id)}
                                    onBlur={() => {
                                      // 延迟清除选中状态，以便工具栏按钮可以点击
                                      setTimeout(() => {
                                        if (document.activeElement !== editorRefs.current[block.id]) {
                                          setSelectedBlockId(null);
                                        }
                                      }, 200);
                                    }}
                                    onInput={(e) => {
                                      handleContentChange(page.id, block.id, e.target.innerHTML);
                                    }}
                                    onPaste={(e) => {
                                      // 处理粘贴事件，支持粘贴图片
                                      e.preventDefault();
                                      const clipboardData = e.clipboardData || window.clipboardData;
                                      const items = clipboardData.items;
                                      
                                      for (let i = 0; i < items.length; i++) {
                                        if (items[i].type.indexOf('image') !== -1) {
                                          const blob = items[i].getAsFile();
                                          const reader = new FileReader();
                                          reader.onloadend = () => {
                                            insertImageAtCursor(block.id, reader.result, 'inline');
                                          };
                                          reader.readAsDataURL(blob);
                                          return;
                                        }
                                      }
                                      
                                      // 如果没有图片，使用默认粘贴行为
                                      const text = clipboardData.getData('text/plain');
                                      document.execCommand('insertText', false, text);
                                    }}
                                    className={`rich-text-editor min-h-[200px] p-4 text-base leading-relaxed outline-none prose prose-slate max-w-none ${
                                      isEditing
                                        ? 'border-2 border-slate-300 rounded-lg bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                                        : 'text-slate-700'
                                    }`}
                                    style={{
                                      wordWrap: 'break-word',
                                      overflowWrap: 'break-word'
                                    }}
                                  />
                                </div>
                                {/* AI生成文本按钮（在编辑模式下显示在底部） */}
                                {isEditing && (
                                  <div className="mt-2 flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={block.prompt || ''}
                                      onChange={(e) => handleUpdateBlock(page.id, block.id, 'prompt', e.target.value)}
                                      className="flex-1 text-xs border border-slate-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                      placeholder="输入AI生成提示词（例如：解释光合作用的过程）..."
                                    />
                                    <button
                                      onClick={() => handleGenerateText(page.id, block.id, block.prompt)}
                                      disabled={isGenerating}
                                      className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                      {isGenerating && generatingType === 'text' ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                      ) : (
                                        <Wand2 className="w-3 h-3" />
                                      )}
                                      AI生成文本
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}

                        {/* 图片块 */}
                        {block.type === 'image' && (
                          <div className="relative">
                            {isGenerating ? (
                              <div className="w-full h-64 bg-slate-100 rounded-lg border-2 border-dashed border-indigo-300 flex items-center justify-center">
                                <div className="text-center">
                                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                                  <p className="text-sm text-slate-600">AI 正在生成图片...</p>
                                </div>
                              </div>
                            ) : (
                              <div className={`space-y-2 ${block.align === 'center' ? 'text-center' : block.align === 'right' ? 'text-right' : 'text-left'}`}>
                                <div className="relative inline-block group/img">
                                  <img
                                    src={block.content}
                                    alt={block.caption}
                                    className="rounded-lg border-2 border-slate-300 object-cover max-w-full"
                                    style={{ maxHeight: '500px' }}
                                  />
                                  {isEditing && (
                                    <>
                                      <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                                        <label className="px-4 py-2 bg-white/90 hover:bg-white text-slate-700 rounded-lg cursor-pointer font-medium text-sm opacity-0 group-hover/img:opacity-100 transition-opacity">
                                          <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                              const file = e.target.files[0];
                                              if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                  handleUpdateBlock(page.id, block.id, 'content', reader.result);
                                                };
                                                reader.readAsDataURL(file);
                                              }
                                            }}
                                          />
                                          <Upload className="w-4 h-4 inline mr-2" />
                                          更换图片
                                        </label>
                                      </div>
                                      <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-white border border-slate-300 rounded-lg shadow-lg p-1 opacity-0 group-hover/img:opacity-100 transition-opacity z-20">
                                        <button
                                          onClick={() => {
                                            // 将图片插入到上一个文本块，然后删除图片块
                                            const textBlocks = page.blocks.filter(b => b.type === 'text');
                                            if (textBlocks.length > 0) {
                                              const lastTextBlock = textBlocks[textBlocks.length - 1];
                                              const editor = editorRefs.current[lastTextBlock.id];
                                              if (editor) {
                                                editor.focus();
                                                // 移动到末尾
                                                const range = document.createRange();
                                                range.selectNodeContents(editor);
                                                range.collapse(false);
                                                const selection = window.getSelection();
                                                selection.removeAllRanges();
                                                selection.addRange(range);
                                                insertImageAtCursor(lastTextBlock.id, block.content, block.align || 'inline');
                                              }
                                            }
                                            handleDeleteBlock(page.id, block.id);
                                          }}
                                          className="p-1.5 hover:bg-blue-50 text-blue-500 rounded transition-colors"
                                          title="转换为内联图片"
                                        >
                                          <ImageIcon className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleUpdateBlock(page.id, block.id, 'align', 'left')}
                                          className={`p-1 rounded ${block.align === 'left' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                                          title="左对齐"
                                        >
                                          <AlignLeft className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => handleUpdateBlock(page.id, block.id, 'align', 'center')}
                                          className={`p-1 rounded ${block.align === 'center' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                                          title="居中"
                                        >
                                          <AlignCenter className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => handleUpdateBlock(page.id, block.id, 'align', 'right')}
                                          className={`p-1 rounded ${block.align === 'right' ? 'bg-indigo-100 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
                                          title="右对齐"
                                        >
                                          <AlignRight className="w-3 h-3" />
                                        </button>
                                        <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                        <button
                                          onClick={() => handleDeleteBlock(page.id, block.id)}
                                          className="p-1.5 hover:bg-red-50 text-red-500 rounded transition-colors"
                                          title="删除"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                                {isEditing && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={block.prompt || ''}
                                        onChange={(e) => handleUpdateBlock(page.id, block.id, 'prompt', e.target.value)}
                                        className="flex-1 text-xs border border-slate-300 rounded px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="输入AI生成提示词..."
                                      />
                                      <button
                                        onClick={() => handleGenerateImage(page.id, block.id, block.prompt)}
                                        disabled={isGenerating}
                                        className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
                                      >
                                        {isGenerating && generatingType === 'image' ? (
                                          <RefreshCw className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <Wand2 className="w-3 h-3" />
                                        )}
                                        AI生成
                                      </button>
                                    </div>
                                    <input
                                      type="text"
                                      value={block.caption || ''}
                                      onChange={(e) => handleUpdateBlock(page.id, block.id, 'caption', e.target.value)}
                                      className="w-full text-xs border border-slate-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none"
                                      placeholder="图片说明..."
                                    />
                                  </div>
                                )}
                                {!isEditing && block.caption && (
                                  <p className={`text-xs text-slate-500 italic ${block.align === 'center' ? 'text-center' : ''}`}>
                                    {block.caption}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    );
                  })}

                {/* 添加块按钮 */}
                {isEditing && (
                  <div className="flex items-center gap-2 pt-4 border-t-2 border-dashed border-slate-300">
                    <button
                      onClick={() => handleAddBlock(page.id, 'text')}
                      className="flex-1 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-indigo-400 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 text-slate-600 hover:text-indigo-600"
                    >
                      <Type className="w-4 h-4" />
                      <span className="text-sm font-medium">添加新段落</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
