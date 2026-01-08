import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { 
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  RotateCw,
  Copy,
  Download,
  RefreshCw
} from 'lucide-react';
import { ReadingMaterialEditor } from './ReadingMaterialEditor';

/**
 * ReadingMaterialCanvasView - 阅读材料画布模式视图
 * 独立的画布视图，专门用于编辑阅读材料
 */
export const ReadingMaterialCanvasView = forwardRef((props, ref) => {
  const { navigation } = props;
  const [pages, setPages] = useState([]);
  const [editingPageIndex, setEditingPageIndex] = useState(0);
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  // 撤销/重做功能
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // 从导航参数加载阅读材料数据
  useEffect(() => {
    if (navigation && navigation.type === 'reading-material' && navigation.materialId) {
      try {
        // 如果navigation中有material数据，直接使用
        if (navigation.material && navigation.material.pages && Array.isArray(navigation.material.pages) && navigation.material.pages.length > 0) {
          const materialPages = JSON.parse(JSON.stringify(navigation.material.pages));
          setPages(materialPages);
          setEditingPageIndex(0);
          setHistory([materialPages]);
          setHistoryIndex(0);
        } else if (navigation.pages && Array.isArray(navigation.pages) && navigation.pages.length > 0) {
          const navPages = JSON.parse(JSON.stringify(navigation.pages));
          setPages(navPages);
          setEditingPageIndex(0);
          setHistory([navPages]);
          setHistoryIndex(0);
        } else {
          // 如果没有数据，创建一个默认页面
          console.warn('No pages data found in navigation, creating default page');
          const defaultPage = {
            id: `page-default-${Date.now()}`,
            pageNumber: 1,
            title: '新阅读材料',
            width: 680,
            height: 960,
            canvasAssets: []
          };
          setPages([defaultPage]);
          setEditingPageIndex(0);
          setHistory([[defaultPage]]);
          setHistoryIndex(0);
        }
      } catch (error) {
        console.error('Error loading reading material:', error);
        // 创建默认页面作为后备
        const defaultPage = {
          id: `page-error-${Date.now()}`,
          pageNumber: 1,
          title: '新阅读材料',
          width: 680,
          height: 960,
          canvasAssets: []
        };
        setPages([defaultPage]);
        setEditingPageIndex(0);
        setHistory([[defaultPage]]);
        setHistoryIndex(0);
      }
    }
  }, [navigation]);

  // 保存历史记录
  const saveToHistory = (newPages) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newPages)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // 撤销
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setPages(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };

  // 重做
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setPages(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };

  // 添加新页面
  const handleAddPage = () => {
    const newPage = {
      id: `page-${Date.now()}`,
      pageNumber: pages.length + 1,
      title: `页面 ${pages.length + 1}`,
      width: 680,
      height: 960,
      canvasAssets: []
    };
    const newPages = [...pages, newPage];
    setPages(newPages);
    setEditingPageIndex(newPages.length - 1);
    saveToHistory(newPages);
  };

  // 导出PDF
  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert("PDF 导出成功！");
    }, 2000);
  };

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    exportPDF: handleExportPDF,
    isExporting
  }));

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* LEFT SIDEBAR - 页面列表 */}
      <aside className={`${isLeftOpen ? 'w-64' : 'w-0'} bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 transition-all duration-300 relative`}>
        <div className={`p-4 border-b border-slate-100 bg-slate-50 ${!isLeftOpen && 'hidden'}`}>
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-lg text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" /> 阅读材料页面
            </h1>
            <button onClick={() => setIsLeftOpen(false)} className="text-slate-400 hover:text-slate-600">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">共 {pages.length} 页</p>
        </div>
        
        <div className={`flex-1 overflow-y-auto p-2 space-y-2 ${!isLeftOpen && 'hidden'}`}>
          {pages.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <p>暂无页面</p>
              <button
                onClick={handleAddPage}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs flex items-center gap-2 mx-auto"
              >
                <Plus className="w-3 h-3" />
                添加第一页
              </button>
            </div>
          ) : (
            pages.map((page, index) => (
              <button
                key={page.id}
                onClick={() => setEditingPageIndex(index)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  editingPageIndex === index
                    ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200 shadow-sm'
                    : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    editingPageIndex === index ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${
                      editingPageIndex === index ? 'text-indigo-900' : 'text-slate-700'
                    }`}>
                      {page.title || `页面 ${index + 1}`}
                    </div>
                    <div className="text-xs text-slate-400">
                      {(page.canvasAssets || []).length} 个元素
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
          
          {pages.length > 0 && (
            <button
              onClick={handleAddPage}
              className="w-full mt-2 py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all flex items-center justify-center gap-2 text-xs font-medium"
            >
              <Plus className="w-3 h-3" />
              添加新页面
            </button>
          )}
        </div>
        
        {!isLeftOpen && (
          <button 
            onClick={() => setIsLeftOpen(true)} 
            className="absolute top-4 left-0 bg-white p-2 rounded-r-md border border-l-0 border-slate-200 shadow-sm text-slate-500 hover:text-indigo-600 z-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </aside>

      {/* MAIN CONTENT - 画布编辑器 */}
      <main className="flex-1 flex flex-col bg-slate-100 relative overflow-hidden">
        {/* Top Bar */}
        <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center gap-4 min-w-0">
            {!isLeftOpen && (
              <>
                <button 
                  onClick={() => setIsLeftOpen(true)} 
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded transition-colors"
                  title="展开页面列表"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="font-bold text-slate-700 flex items-center gap-2 mr-4">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs">阅读材料</span>
                </div>
              </>
            )}
            <span className="text-sm font-medium text-slate-500 whitespace-nowrap">当前编辑:</span>
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold whitespace-nowrap">
              页面 {editingPageIndex + 1} / {pages.length || 1}
            </span>
            {pages[editingPageIndex] && (
              <h2 className="text-sm font-bold text-slate-800 truncate" title={pages[editingPageIndex].title}>
                {pages[editingPageIndex].title || `页面 ${editingPageIndex + 1}`}
              </h2>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex === 0}
              className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="撤销 (Ctrl+Z)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex === history.length - 1}
              className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="重做 (Ctrl+Shift+Z)"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-slate-200"></div>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded flex items-center gap-2 shadow-sm whitespace-nowrap disabled:opacity-50"
              title="导出 PDF"
            >
              {isExporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              {isExporting ? '导出中...' : '导出 PDF'}
            </button>
          </div>
        </div>

        {/* Canvas Editor */}
        <div className="flex-1 overflow-auto p-6">
          {pages.length > 0 ? (
            <ReadingMaterialEditor
              pages={pages}
              onPagesChange={(newPages) => {
                setPages(newPages);
                saveToHistory(newPages);
              }}
              editingPageIndex={editingPageIndex}
              onEditingPageIndexChange={setEditingPageIndex}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
              <BookOpen className="w-16 h-16 opacity-50" />
              <p className="text-lg font-medium">开始创建你的阅读材料</p>
              <p className="text-sm">点击左侧按钮添加第一页</p>
              <button
                onClick={handleAddPage}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                添加第一页
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
});

