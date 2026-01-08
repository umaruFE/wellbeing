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
import { CanvasView } from './components/CanvasView';
import { TableView } from './components/TableView';
// import { ReadingMaterialView } from './components/ReadingMaterialView';
import { ReadingMaterialCanvasView } from './components/ReadingMaterialCanvasView';

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
    <div className="h-screen flex flex-col font-sans bg-slate-50">
      {/* Universal Header */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-30 shrink-0">
        <div className="flex items-center gap-3">
           <div className="bg-blue-600 p-1.5 rounded text-white shadow-sm">
             <Sparkles className="w-4 h-4" />
              </div>
           <div className="flex flex-col">
              <h1 className="font-bold text-sm text-slate-800">CourseGen AI</h1>
              <span className="text-[10px] text-slate-500">Interactive Course Creator</span>
            </div>
          </div>
        
        {/* View Switcher - 三个视图按钮平铺 */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
           <button 
             onClick={() => setCurrentView('table')} 
             className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
               currentView === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
             }`}
           >
             <TableIcon className="w-3.5 h-3.5" /> 
             表格视图
           </button>
           
           <button
             onClick={() => {
               setCanvasMode('ppt');
               setCurrentView('canvas');
             }}
             className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
               currentView === 'canvas' && canvasMode === 'ppt' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
             }`}
           >
             <Layout className="w-3.5 h-3.5" />
             PPT画布模式
           </button>
           
           <button
             onClick={() => {
               setCanvasMode('reading-material');
               setCurrentView('canvas');
             }}
             className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
               currentView === 'canvas' && canvasMode === 'reading-material' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
             }`}
           >
             <FileText className="w-3.5 h-3.5" />
             阅读材料画布模式
           </button>
        </div>

        <div className="flex items-center gap-4">
          {appConfig && (
             <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">当前单元</span>
                <span className="text-xs font-medium text-slate-700 max-w-[150px] truncate">{appConfig.unit || 'Custom Unit'}</span>
                  </div>
                )}
          <button onClick={handleReset} className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors" title="重设参数">
             <Settings2 className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-200"></div>
              {/* <button onClick={handleOpenPreview} className="px-3 py-1.5 hover:bg-slate-100 rounded text-slate-600 flex items-center gap-1 text-xs font-medium" title="单张预览">
                <MonitorPlay className="w-4 h-4" /> 单张预览
              </button> */}
              {/* <div className="h-4 w-px bg-slate-200"></div> */}
              <button onClick={handleOpenHistory} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded flex items-center gap-2 shadow-sm whitespace-nowrap transition-colors" title="历史版本">
                <History className="w-3 h-3" />
                历史版本
              </button>
              <div className="h-4 w-px bg-slate-200"></div>
              <button onClick={handleExportPPT} disabled={isExporting} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded flex items-center gap-2 shadow-sm whitespace-nowrap disabled:bg-blue-400" title="导出 PPT">
                {isExporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                {isExporting ? '导出中...' : '导出 PPT'}
              </button>
              <button onClick={handleExportPDF} disabled={isExporting} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded flex items-center gap-2 shadow-sm whitespace-nowrap disabled:bg-blue-400" title="导出 PDF">
                {isExporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                {isExporting ? '导出中...' : '导出 PDF'}
              </button>
              <div className="h-4 w-px bg-slate-200"></div>
          
          <button className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-xs font-medium hover:bg-blue-100 flex items-center gap-1 border border-blue-100">
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

      {/* 历史版本模态框 */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">历史版本</h3>
                  <p className="text-xs text-slate-500 mt-0.5">查看和管理课程的历史版本</p>
                </div>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded"
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
                    className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-slate-800">{item.version}</span>
                          {item.id === 1 && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">当前版本</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{item.time}</span>
                          </div>
                          <span>•</span>
                          <span>{item.author}</span>
                        </div>
                        <p className="text-sm text-slate-600">{item.description}</p>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                          恢复到此版本
                        </button>
                        <button className="px-3 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
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
