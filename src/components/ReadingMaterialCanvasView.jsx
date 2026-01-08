import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { 
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  RotateCcw,
  RotateCw,
  Copy,
  Download,
  RefreshCw,
  FileText,
  FileX,
  Check
} from 'lucide-react';
import { ReadingMaterialEditor } from './ReadingMaterialEditor';
import { INITIAL_COURSE_DATA } from '../constants';

/**
 * ReadingMaterialCanvasView - 阅读材料画布模式视图
 * 独立的画布视图，专门用于编辑阅读材料
 */
export const ReadingMaterialCanvasView = forwardRef((props, ref) => {
  const { navigation } = props;
  const [courseData, setCourseData] = useState(INITIAL_COURSE_DATA);
  const [activePhase, setActivePhase] = useState('engage');
  const [activeStepId, setActiveStepId] = useState('e1-1');
  const [isLeftOpen, setIsLeftOpen] = useState(true);
  const [isRightOpen, setIsRightOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState(['engage', 'empower', 'execute', 'elevate']);
  const [canvasAspectRatio, setCanvasAspectRatio] = useState('A4'); // 'A4' | 'A4横向'
  
  // 撤销/重做功能
  const [history, setHistory] = useState([JSON.parse(JSON.stringify(INITIAL_COURSE_DATA))]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // 将courseData的steps转换为pages格式
  const convertStepsToPages = (data) => {
    const allSteps = Object.values(data).flatMap(phase => 
      phase.steps.map(step => ({ ...step, phaseKey: Object.keys(data).find(k => data[k].steps.includes(step)) }))
    );
    
    return allSteps.map((step, index) => ({
      id: `page-${step.id}`,
      slideId: step.id,
      pageNumber: index + 1,
      title: step.title,
      width: 800,
      height: 1131,
      canvasAssets: step.assets || [],
      blocks: []
    }));
  };

  const [pages, setPages] = useState(() => convertStepsToPages(INITIAL_COURSE_DATA));
  const [editingPageIndex, setEditingPageIndex] = useState(0);

  // 当courseData变化时，更新pages
  useEffect(() => {
    const newPages = convertStepsToPages(courseData);
    setPages(newPages);
    // 找到当前activeStepId对应的页面索引
    const currentIndex = newPages.findIndex(p => p.slideId === activeStepId);
    if (currentIndex >= 0) {
      setEditingPageIndex(currentIndex);
    }
  }, [courseData, activeStepId]);

  // 保存历史记录
  const saveToHistory = (newData) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(newData)));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // 撤销
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCourseData(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };

  // 重做
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCourseData(JSON.parse(JSON.stringify(history[newIndex])));
    }
  };

  // 切换阶段展开/收起
  const togglePhase = (phaseKey) => {
    if (expandedPhases.includes(phaseKey)) {
      setExpandedPhases(expandedPhases.filter(p => p !== phaseKey));
    } else {
      setExpandedPhases([...expandedPhases, phaseKey]);
    }
  };

  // 处理步骤点击
  const handleStepClick = (phaseKey, stepId) => {
    setActivePhase(phaseKey);
    setActiveStepId(stepId);
  };

  // 导出PDF
  const handleExportPDF = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert("PDF 导出成功！");
    }, 2000);
  };

  // 删除当前页面
  const handleDeleteCurrentPage = () => {
    if (pages.length <= 1) {
      alert('至少需要保留一个页面！');
      return;
    }
    
    const currentPage = pages[editingPageIndex];
    if (!currentPage) return;
    
    if (!confirm(`确定要删除当前页面吗？此操作无法撤销。`)) {
      return;
    }

    const newPages = pages.filter((p, index) => index !== editingPageIndex);
    // 重新编号
    const renumberedPages = newPages.map((page, index) => ({
      ...page,
      pageNumber: index + 1
    }));

    // 更新courseData
    const newCourseData = { ...courseData };
    Object.values(newCourseData).forEach(phase => {
      phase.steps = phase.steps.filter(step => step.id !== currentPage.slideId);
    });

    setCourseData(newCourseData);
    setPages(renumberedPages);
    
    // 调整编辑索引
    if (editingPageIndex >= renumberedPages.length) {
      setEditingPageIndex(renumberedPages.length - 1);
    } else if (editingPageIndex > 0) {
      setEditingPageIndex(editingPageIndex - 1);
    } else {
      setEditingPageIndex(0);
    }
    
    saveToHistory(newCourseData);
  };

  // 完成编辑
  const handleFinishEditing = () => {
    setEditingPageIndex(null);
  };


  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    exportPDF: handleExportPDF,
    isExporting
  }));

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* LEFT SIDEBAR - 目录树 */}
      <aside className={`${isLeftOpen ? 'w-64' : 'w-0'} bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 transition-all duration-300 relative`}>
        <div className={`p-4 border-b border-slate-100 bg-slate-50 ${!isLeftOpen && 'hidden'}`}>
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-lg text-slate-800 flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-600" /> 课程编排</h1>
            <button onClick={() => setIsLeftOpen(false)} className="text-slate-400 hover:text-slate-600"><ChevronLeft className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-slate-500 mt-1 truncate">Unit 1: Funky Monster Rescue</p>
        </div>
        <div className={`flex-1 overflow-y-auto p-2 space-y-2 ${!isLeftOpen && 'hidden'}`}>
          {Object.entries(courseData).map(([key, phase]) => (
            <div key={key} className="rounded-lg overflow-hidden border border-slate-100 bg-white">
              <button 
                onClick={() => togglePhase(key)} 
                className={`w-full flex items-center justify-between p-3 text-left font-bold text-sm transition-colors ${phase.color.replace('text-', 'bg-opacity-10 ')} hover:bg-opacity-20`}
              >
                <span className="flex items-center gap-2">
                  {expandedPhases.includes(key) ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                  {phase.title}
                </span>
              </button>
              {expandedPhases.includes(key) && (
                <div className="bg-slate-50 border-t border-slate-100">
                  {phase.steps.map((step) => {
                    const pageIndex = pages.findIndex(p => p.slideId === step.id);
                    return (
                      <div 
                        key={step.id} 
                        className={`group/step border-b border-slate-100 last:border-0 hover:bg-blue-50 transition-all flex items-center ${
                          activeStepId === step.id ? 'bg-blue-100' : ''
                        }`}
                      >
                        <button 
                          onClick={() => handleStepClick(key, step.id)} 
                          className={`flex-1 text-left p-2 pl-8 text-xs transition-all flex items-start gap-2 ${
                            activeStepId === step.id 
                              ? 'text-blue-800 font-semibold border-l-4 border-l-blue-600' 
                              : 'text-slate-600'
                          }`}
                        >
                          <span className="shrink-0 mt-0.5"><FileText className="w-3 h-3" /></span>
                          <span className="line-clamp-2">{step.title}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
        {!isLeftOpen && (
          <button 
            onClick={() => setIsLeftOpen(true)} 
            className="absolute top-4 left-0 bg-white p-2 rounded-r-md border border-l-0 border-slate-200 shadow-sm text-slate-500 hover:text-blue-600 z-50"
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
            {/* A4 竖版/横版切换 */}
            {editingPageIndex !== null && (
              <>
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
                <div className="w-px h-6 bg-slate-200"></div>
                {/* 删除页面按钮 */}
                <button
                  onClick={handleDeleteCurrentPage}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                  title="删除当前页"
                >
                  <FileX className="w-3 h-3" />
                  删除
                </button>
                {/* 完成编辑按钮 */}
                <button
                  onClick={handleFinishEditing}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <Check className="w-3 h-3" />
                  完成编辑
                </button>
                <div className="w-px h-6 bg-slate-200"></div>
              </>
            )}
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
        <div className="flex-1 overflow-auto">
          {pages.length > 0 ? (
            <ReadingMaterialEditor
              pages={pages}
              onPagesChange={(newPages) => {
                // 更新pages
                setPages(newPages);
                // 同步更新courseData
                const newCourseData = { ...courseData };
                newPages.forEach(page => {
                  if (page.slideId) {
                    Object.values(newCourseData).forEach(phase => {
                      const step = phase.steps.find(s => s.id === page.slideId);
                      if (step) {
                        step.assets = page.canvasAssets || [];
                      }
                    });
                  }
                });
                setCourseData(newCourseData);
                saveToHistory(newCourseData);
              }}
              editingPageIndex={editingPageIndex}
              onEditingPageIndexChange={setEditingPageIndex}
              canvasAspectRatio={canvasAspectRatio}
              onCanvasAspectRatioChange={setCanvasAspectRatio}
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

