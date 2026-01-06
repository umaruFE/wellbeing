import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Layout, 
  Settings2, 
  Download,
  Table as TableIcon, 
  MonitorPlay,
  RefreshCw
} from 'lucide-react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { CanvasView } from './components/CanvasView';
import { TableView } from './components/TableView';

// --- Main App Component ---

export default function App() {
  const [appState, setAppState] = useState('welcome'); // 'welcome' | 'app'
  const [currentView, setCurrentView] = useState('canvas'); // 'canvas' or 'table'
  const [appConfig, setAppConfig] = useState(null);
  const canvasViewRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);

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
        
        {/* View Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
           <button onClick={() => setCurrentView('canvas')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${currentView === 'canvas' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Layout className="w-3.5 h-3.5" /> 画布视图
           </button>
           <button onClick={() => setCurrentView('table')} className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${currentView === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <TableIcon className="w-3.5 h-3.5" /> 表格视图
           </button>
        </div>

        <div className="flex items-center gap-4">
          {appConfig && (
             <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase">当前单元</span>
                <span className="text-xs font-medium text-slate-700 max-w-[150px] truncate">{appConfig.unit || 'Custom Unit'}</span>
             </div>
          )}
          {currentView === 'canvas' && (
            <>
              <button onClick={handleOpenPreview} className="px-3 py-1.5 hover:bg-slate-100 rounded text-slate-600 flex items-center gap-1 text-xs font-medium" title="单张预览">
                <MonitorPlay className="w-4 h-4" /> 单张预览
              </button>
              <div className="h-4 w-px bg-slate-200"></div>
              <button onClick={handleExportPPT} disabled={isExporting} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded flex items-center gap-2 shadow-sm whitespace-nowrap disabled:bg-blue-400" title="导出 PPT">
                {isExporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                {isExporting ? '导出中...' : '导出 PPT'}
              </button>
              <div className="h-4 w-px bg-slate-200"></div>
            </>
          )}
          <button onClick={handleReset} className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors" title="重设参数">
             <Settings2 className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-slate-200"></div>
          <button className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-xs font-medium hover:bg-blue-100 flex items-center gap-1 border border-blue-100">
             <Download className="w-3 h-3" /> 导出课件包
          </button>
        </div>
      </header>

      {/* View Content */}
      <div className="flex-1 flex overflow-hidden relative">
         {currentView === 'canvas' ? <CanvasView ref={canvasViewRef} /> : <TableView initialConfig={appConfig} onReset={handleReset} />}
      </div>
    </div>
  );
}
