import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkles,
  BookOpen,
  FileText,
  Music,
  Building2,
  LogOut,
  ChevronLeft,
  Layout,
  Table as TableIcon,
  FileText as FileTextIcon,
  Plus,
  Home,
  Layers
} from 'lucide-react';
import { WelcomeScreen } from './WelcomeScreen';
import { CanvasView } from './CanvasView';
import { TableView } from './TableView';
import { ReadingMaterialCanvasView } from './ReadingMaterialCanvasView';
import { AdminDashboard } from './AdminDashboard';

export const MainLayout = () => {
  const { user, logout, ROLE_NAMES } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 课程编辑状态
  const [appState, setAppState] = useState('welcome');
  const [currentView, setCurrentView] = useState('table');
  const [canvasMode, setCanvasMode] = useState('ppt');
  const [appConfig, setAppConfig] = useState(null);
  const canvasViewRef = React.useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [canvasNavigation, setCanvasNavigation] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 开始创建课程
  const handleStartApp = (config) => {
    setAppConfig(config);
    setAppState('app');
  };

  // 重置回到欢迎页
  const handleReset = () => {
    setAppState('welcome');
  };

  // 导出PPT
  const handleExportPPT = () => {
    if (canvasViewRef.current) {
      setIsExporting(true);
      canvasViewRef.current.exportPPT();
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  // 导出PDF
  const handleExportPDF = () => {
    if (canvasViewRef.current && canvasViewRef.current.exportPDF) {
      setIsExporting(true);
      canvasViewRef.current.exportPDF();
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  // 导航菜单项
  const navItems = [
    { path: '/', label: '首页', icon: Home, description: '工作台首页' },
    { path: '/courses', label: '课程管理', icon: BookOpen, description: '管理我的课程', roles: ['super_admin', 'org_admin', 'research_leader', 'creator'] },
    { path: '/course-square', label: '课程广场', icon: FileText, description: '公共课程资源' },
    { path: '/knowledge-base', label: '知识库', icon: Layers, description: '教材课本维护', roles: ['super_admin', 'org_admin', 'research_leader', 'creator'] },
    { path: '/voices', label: '声音管理', icon: Music, description: '语音配置', roles: ['super_admin', 'org_admin', 'research_leader', 'creator'] },
  ];

  // 如果是超级管理员，添加管理端入口
  if (user?.role === 'super_admin') {
    navItems.push({ path: '/super-admin', label: '超级管理端', icon: Building2, description: '系统管理' });
  }

  // 过滤用户有权限访问的菜单项
  const accessibleNavItems = navItems.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  // 判断当前页面类型
  const isDashboard = location.pathname === '/';
  const isCreatePage = location.pathname === '/create';
  const isInCourseEditor = isCreatePage && appState === 'app';

  return (
    <div className="h-screen flex font-sans bg-slate-50">
      {/* 左侧边栏 */}
      <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-30`}>
        {/* Logo区域 */}
        <div className="h-14 flex items-center px-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded text-white shadow-sm shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm text-slate-800">CourseGen AI</span>
                <span className="text-[10px] text-slate-500">管理控制台</span>
              </div>
            )}
          </div>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {accessibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && (
                  <div className="text-left">
                    <div className="font-medium text-sm">{item.label}</div>
                    {item.description && (
                      <div className="text-xs text-slate-400">{item.description}</div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* 收起按钮 */}
        <div className="p-3 border-t border-slate-200">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            {!sidebarCollapsed && <span className="text-xs">收起</span>}
          </button>
        </div>

        {/* 用户信息 */}
        <div className="p-3 border-t border-slate-200">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">{user?.name || '用户'}</div>
                <div className="text-xs text-slate-500 truncate">
                  {user?.role && ROLE_NAMES[user?.role] ? ROLE_NAMES[user.role] : '未知角色'}
                </div>
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                title="退出登录"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 右侧主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部栏 - 仅在课程编辑时显示 */}
        {isInCourseEditor && (
          <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-700">
                {appConfig?.unit || '自定义课程'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* 视图切换 */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 mr-4">
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
                  PPT画布
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
                  <FileTextIcon className="w-3.5 h-3.5" />
                  阅读材料
                </button>
              </div>

              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
              >
                新建课程
              </button>

              <button
                onClick={handleExportPPT}
                disabled={isExporting}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:bg-blue-400 transition-colors"
              >
                {isExporting ? '导出中...' : '导出PPT'}
              </button>

              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:bg-blue-400 transition-colors"
              >
                导出PDF
              </button>
            </div>
          </header>
        )}

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
          {/* 首页 Dashboard */}
          {isDashboard && (
            <AdminDashboard />
          )}

          {/* 创建课程页面 */}
          {isCreatePage && (
            <>
              {appState === 'welcome' && (
                <WelcomeScreen onStart={handleStartApp} />
              )}

              {isInCourseEditor && (
                <div className="h-full flex">
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
              )}
            </>
          )}

          {/* 其他页面通过 Outlet 渲染 */}
          {!isDashboard && !isCreatePage && (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
};
