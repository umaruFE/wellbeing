import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  Clock,
  LogOut,
  User,
  Music,
  Building2,
  Menu,
  X as XIcon
} from 'lucide-react';
import { WelcomeScreen } from './WelcomeScreen';
import { CanvasView } from './CanvasView';
import { TableView } from './TableView';
import { ReadingMaterialCanvasView } from './ReadingMaterialCanvasView';

export const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [appState, setAppState] = useState('welcome');
  const [currentView, setCurrentView] = useState('table');
  const [canvasMode, setCanvasMode] = useState('ppt');
  const [appConfig, setAppConfig] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const canvasViewRef = React.useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [canvasNavigation, setCanvasNavigation] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const handleStartApp = (config) => {
    setAppConfig(config);
    setAppState('app');
  };

  const handleReset = () => {
    setAppState('welcome');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  const handleExportPDF = () => {
    if (canvasViewRef.current && canvasViewRef.current.exportPDF) {
      setIsExporting(true);
      canvasViewRef.current.exportPDF();
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  const handleOpenHistory = () => {
    setShowHistoryModal(true);
  };

  // 导航菜单项
  const navItems = [
    { path: '/', label: '课程编辑', icon: TableIcon, view: 'table' },
    { path: '/courses', label: '课程管理', icon: BookOpen },
    { path: '/course-square', label: '课程广场', icon: FileText },
    { path: '/voices', label: '声音管理', icon: Music },
  ];

  // 如果是超级管理员，添加管理端入口
  if (user?.role === 'super_admin') {
    navItems.push({ path: '/super-admin', label: '超级管理端', icon: Building2 });
  }

  // 如果不在课程编辑页面，显示导航菜单
  const isCourseEditorPage = location.pathname === '/' && appState === 'app';

  // 只在根路径显示欢迎页面
  if (location.pathname === '/' && appState === 'welcome') {
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

        {/* Navigation Menu */}
        {!isCourseEditorPage && (
          <nav className="flex-1 flex items-center justify-center gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    if (item.view) {
                      setCurrentView(item.view);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
                    isActive
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Course Editor View Switcher */}
        {isCourseEditorPage && (
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
                setCanvasNavigation(null);
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
                setCanvasNavigation(null);
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
        )}

        <div className="flex items-center gap-4">
          {isCourseEditorPage && appConfig && (
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase">当前单元</span>
              <span className="text-xs font-medium text-slate-700 max-w-[150px] truncate">{appConfig.unit || 'Custom Unit'}</span>
            </div>
          )}

          {isCourseEditorPage && (
            <>
              <button onClick={handleReset} className="p-2 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors" title="重设参数">
                <Settings2 className="w-4 h-4" />
              </button>
              <div className="h-4 w-px bg-slate-200"></div>
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
            </>
          )}

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <span className="hidden md:block text-sm text-slate-700">{user?.name || '用户'}</span>
            </button>
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <div className="text-sm font-medium text-slate-800">{user?.name}</div>
                  <div className="text-xs text-slate-500">
                    {user?.role === 'super_admin' ? '超级管理员' : 
                     user?.role === 'org_admin' ? '机构管理员' : 
                     user?.role === 'research_leader' ? '教研组长' : 
                     user?.role === 'creator' ? '课件制作人' : 
                     user?.role === 'viewer' ? '普通老师' : '未知角色'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* View Content */}
      {location.pathname === '/' && appState === 'app' ? (
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
                if (nav.type === 'reading-material') {
                  setCanvasMode('reading-material');
                } else {
                  setCanvasMode('ppt');
                }
                setCurrentView('canvas');
              }}
            />
          )}
        </div>
      ) : location.pathname === '/' && appState === 'welcome' ? (
        <WelcomeScreen onStart={handleStartApp} />
      ) : (
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      )}

      {/* 历史版本窗口 */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-white border-l-4 border-blue-500 shadow-2xl" style={{ right: 0, width: '50%', minWidth: '600px' }}>
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">历史版本</h3>
                  <p className="text-xs text-slate-500 mt-0.5">在新窗口查看历史版本，当前版本保持不变</p>
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
};

