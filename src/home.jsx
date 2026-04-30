import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Layout, 
  Settings2, 
  Download,
  Table as TableIcon, 
  MonitorPlay,
  RefreshCw,
  BookOpen,
  FileText,
  History,
  X,
  Clock
} from 'lucide-react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CanvasView } from './modules/course-management/ppt-canvas/CanvasView';
import { TableView } from './modules/course-management/table-view/TableView';
// import { ReadingMaterialView } from './components/ReadingMaterialView';
import { ReadingMaterialCanvasView } from './modules/course-management/reading-material/ReadingMaterialCanvasView';

// --- Main App Component ---

export default function App() {
  const [appState, setAppState] = useState('welcome'); // 'welcome' | 'app'
  const [currentView, setCurrentView] = useState('table'); // 'canvas' | 'table' | 'reading'
  const [canvasMode, setCanvasMode] = useState('ppt'); // 'ppt' | 'reading-material'
  const [appConfig, setAppConfig] = useState(null);
  const canvasViewRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [canvasNavigation, setCanvasNavigation] = useState(null); // { phaseId, slideId }
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const handleStartApp = (config) => {
    setAppConfig(config);
    setAppState('app');
  };

  const handleReset = () => {
    setAppState('welcome');
  };

  const handleOpenPreview = () => {
    if (canvasViewRef.current) {
      canvasViewRef.current.openPreview();
    }
  };

  const handleExportPPT = () => {
    if (canvasViewRef.current) {
      setIsExporting(true);
      canvasViewRef.current.exportPPT();
      // 同步导出状态（2秒后重置）
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  const handleExportPDF = () => {
    if (canvasViewRef.current && canvasViewRef.current.exportPDF) {
      setIsExporting(true);
      canvasViewRef.current.exportPDF();
      // 同步导出状态（2秒后重置）
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  const handleOpenHistory = () => {
    setShowHistoryModal(true);
  };

  if (appState === 'welcome') {
    return <WelcomeScreen onStart={handleStartApp} />;
  }

    return (
    <div className="h-screen flex flex-col font-sans bg-surface">
      {/* Universal Header */}
      <header className="h-14 bg-white border-b-2 border-stroke-light flex items-center justify-between px-4 z-30 shrink-0">
        <div className="flex items-center gap-3">
           <div className="bg-info p-1.5 rounded text-white shadow-sm">
             <Sparkles className="w-4 h-4" />
              </div>
           <div className="flex flex-col">
              <h1 className="font-bold text-sm text-primary">CourseGen AI</h1>
              <span className="text-[10px] text-primary-muted">Interactive Course Creator</span>
            </div>
          </div>
        
        {/* View Switcher - 三个视图按钮平铺 */}
        <div className="flex items-center bg-surface p-1 rounded-xl border-2 border-stroke-light">
           <button 
             onClick={() => setCurrentView('table')} 
             className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
               currentView === 'table' ? 'bg-white text-info shadow-sm' : 'text-primary-muted hover:text-primary-secondary'
             }`}
           >
             <TableIcon className="w-3.5 h-3.5" /> 
             表格视图
           </button>
           
           <button
             onClick={() => {
               setCanvasNavigation(null);
               setCanvasMode('ppt');
               setCurrentView('canvas');
             }}
             className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
               currentView === 'canvas' && canvasMode === 'ppt' ? 'bg-white text-info shadow-sm' : 'text-primary-muted hover:text-primary-secondary'
             }`}
           >
             <Layout className="w-3.5 h-3.5" />
             PPT画布模式
           </button>
           
           <button
             onClick={() => {
               setCanvasNavigation(null);
               setCanvasMode('reading-material');
               setCurrentView('canvas');
             }}
             className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
               currentView === 'canvas' && canvasMode === 'reading-material' ? 'bg-white text-info shadow-sm' : 'text-primary-muted hover:text-primary-secondary'
             }`}
           >
             <FileText className="w-3.5 h-3.5" />
             阅读材料画布模式
           </button>
        </div>

        <div className="flex items-center gap-4">
          {appConfig && (
             <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-[10px] text-primary-placeholder font-bold uppercase">当前单元</span>
                <span className="text-xs font-medium text-primary-secondary max-w-[150px] truncate">{appConfig.unit || 'Custom Unit'}</span>
                  </div>
                )}
          <button onClick={handleReset} className="p-2 hover:bg-surface-alt rounded text-primary-placeholder hover:text-info transition-colors" title="重设参数">
             <Settings2 className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-stroke"></div>
              {/* <button onClick={handleOpenPreview} className="px-3 py-1.5 hover:bg-surface-alt rounded text-primary-secondary flex items-center gap-1 text-xs font-medium" title="单张预览">
                <MonitorPlay className="w-4 h-4" /> 单张预览
              </button> */}
              {/* <div className="h-4 w-px bg-stroke"></div> */}
              <button onClick={handleOpenHistory} className="px-3 py-1.5 bg-surface-alt hover:bg-stroke text-primary-secondary text-xs font-bold rounded flex items-center gap-2 shadow-sm whitespace-nowrap transition-colors" title="历史版本">
                <History className="w-3 h-3" />
                历史版本
              </button>
              <div className="h-4 w-px bg-stroke"></div>
              <button onClick={handleExportPPT} disabled={isExporting} className="px-3 py-1.5 bg-info hover:bg-info-active text-white text-xs font-bold rounded flex items-center gap-2 shadow-sm whitespace-nowrap disabled:bg-info-hover" title="导出 PPT">
                {isExporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                {isExporting ? '导出中...' : '导出 PPT'}
              </button>
              <button onClick={handleExportPDF} disabled={isExporting} className="px-3 py-1.5 bg-info hover:bg-info-active text-white text-xs font-bold rounded flex items-center gap-2 shadow-sm whitespace-nowrap disabled:bg-info-hover" title="导出 PDF">
                {isExporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                {isExporting ? '导出中...' : '导出 PDF'}
              </button>
              <div className="h-4 w-px bg-stroke"></div>
          
          <button className="px-3 py-1.5 bg-info-light text-info rounded text-xs font-medium hover:bg-info-light flex items-center gap-1 border border-blue-100">
             <Download className="w-3 h-3" /> 导出课件包
          </button>
        </div>
      </header>

      {/* View Content */}
      <div className="flex-1 flex overflow-hidden relative">
         {currentView === 'canvas' && (
           <>
             {canvasMode === 'ppt' && <CanvasView ref={canvasViewRef} navigation={canvasNavigation} />}
             {canvasMode === 'reading-material' && <ReadingMaterialCanvasView ref={canvasViewRef} navigation={canvasNavigation} />}
           </>
         )}
         {currentView === 'table' && (
           <TableView 
             initialConfig={appConfig} 
             onReset={handleReset}
             onNavigateToCanvas={(nav) => {
               setCanvasNavigation(nav);
               // 根据导航类型设置画布模式
               if (nav.type === 'reading-material') {
                 setCanvasMode('reading-material');
               } else {
                 setCanvasMode('ppt');
               }
               setCurrentView('canvas');
             }}
           />
         )}
         {/* {currentView === 'reading' && <ReadingMaterialView />} */}
      </div>

      {/* 历史版本窗口 - 在新窗口打开，不关闭当前版本 */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-white border-l-4 border-info shadow-2xl" style={{ right: 0, width: '50%', minWidth: '600px' }}>
          <div className="h-full flex flex-col">
            <div className="p-6 border-b-2 border-stroke-light flex items-center justify-between bg-surface">
              <div className="flex items-center gap-3">
                <div className="bg-info p-2 rounded-lg text-white">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-primary">历史版本</h3>
                  <p className="text-xs text-primary-muted mt-0.5">在新窗口查看历史版本，当前版本保持不变</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)} 
                className="text-primary-placeholder hover:text-primary-secondary transition-colors p-1 hover:bg-surface-alt rounded"
                title="关闭"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {/* 示例历史版本项 - 实际应该从数据源获取 */}
                {[
                  { id: 1, version: 'v1.2.3', time: '2024-01-15 14:30', author: '系统自动保存', description: '最新版本' },
                  { id: 2, version: 'v1.2.2', time: '2024-01-15 10:20', author: '用户保存', description: '修改了第三章节' },
                  { id: 3, version: 'v1.2.1', time: '2024-01-14 16:45', author: '用户保存', description: '添加了新的练习' },
                  { id: 4, version: 'v1.2.0', time: '2024-01-13 09:15', author: '系统自动保存', description: '初始版本' },
                ].map((item) => (
                  <div 
                    key={item.id} 
                    className="border-2 border-stroke-light rounded-xl p-4 hover:border-primary hover:shadow-[4px_4px_0px_0px_var(--color-dark)] transition-all cursor-pointer group"
                    onClick={() => {
                      // 在新窗口打开历史版本，不关闭当前窗口
                      // 这里可以添加打开新窗口的逻辑
                      alert(`将在新窗口打开版本 ${item.version}，当前窗口保持不变`);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-primary">{item.version}</span>
                          {item.id === 1 && (
                            <span className="px-2 py-0.5 bg-info-light text-info-active text-xs font-medium rounded">当前版本</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-primary-muted mb-2">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{item.time}</span>
                          </div>
                          <span>•</span>
                          <span>{item.author}</span>
                        </div>
                        <p className="text-sm text-primary-secondary">{item.description}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                        <button 
                          className="px-3 py-1.5 text-xs bg-info text-white rounded-lg hover:bg-info-active transition-colors"
                          onClick={() => {
                            // 在新窗口打开历史版本，不关闭当前窗口
                            alert(`将在新窗口打开版本 ${item.version}，当前窗口保持不变`);
                          }}
                        >
                          在新窗口打开
                        </button>
                        <button className="px-3 py-1.5 text-xs bg-surface-alt text-primary-secondary rounded-lg hover:bg-stroke transition-colors">
                          导出
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
