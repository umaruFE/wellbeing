import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import {
  Sparkles,
  BookOpen,
  FileText,
  Music,
  Building2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Layout,
  Table as TableIcon,
  FileText as FileTextIcon,
  Plus,
  Home,
  Layers,
  ChevronDown,
  Image,
  User,
  Users,
  Settings,
  Video,
  RefreshCw
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
  const [expandedMenus, setExpandedMenus] = useState(['materials']); // 默认展开素材管理

  // 课程编辑状态
  const [appState, setAppState] = useState('welcome');
  const [currentView, setCurrentView] = useState('table');
  const [canvasMode, setCanvasMode] = useState('ppt');
  const [appConfig, setAppConfig] = useState(null);
  const canvasViewRef = React.useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [canvasNavigation, setCanvasNavigation] = useState(null);
  
  // 保存状态
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle'); // idle, saving, saved, error
  const [currentCourseId, setCurrentCourseId] = useState(null);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const autoSaveTimerRef = React.useRef(null);
  const [isComponentReady, setIsComponentReady] = useState(false);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // 开始创建课程
  const handleStartApp = async (config) => {
    try {
      setIsSaving(true);
      setAutoSaveStatus('saving');

      const requestBody = {
        userId: user?.id || 1,
        organizationId: user?.organizationId || null,
        title: config.unit || '自定义课程',
        description: config.theme || '',
        ageGroup: config.age || '',
        unit: config.unit || '',
        duration: config.duration || 40,
        theme: config.theme || '',
        keywords: config.keywords ? config.keywords.split(',').map(k => k.trim()) : [],
        isPublic: false,
        courseData: config.courseData
      };

      console.log('Saving new course:', requestBody);

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Save response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '保存课程失败');
      }

      const result = await response.json();
      const newCourse = result.data;

      console.log('Course saved successfully:', newCourse);

      setCurrentCourseId(newCourse.id);
      setAppConfig(config);
      setAppState('app');
      setAutoSaveStatus('success');
    } catch (error) {
      console.error('Error saving course:', error);
      setAutoSaveStatus('error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    }
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

  // 获取当前课程数据
  const getCurrentCourseData = () => {
    console.log('getCurrentCourseData called:', { 
      hasRef: !!canvasViewRef.current, 
      currentView,
      canvasMode,
      refMethods: canvasViewRef.current ? Object.keys(canvasViewRef.current) : null 
    });
    
    if (!canvasViewRef.current) {
      console.log('No ref available, returning null');
      return null;
    }
    
    const refMethods = Object.keys(canvasViewRef.current);
    console.log('Available ref methods:', refMethods);
    
    if (currentView === 'table') {
      if (refMethods.includes('getSlides')) {
        const slides = canvasViewRef.current.getSlides();
        console.log('getSlides() returned:', slides);
        return slides;
      } else {
        console.log('getSlides method not found in ref');
        return null;
      }
    } else if (currentView === 'canvas') {
      if (refMethods.includes('getCourseData')) {
        const courseData = canvasViewRef.current.getCourseData();
        console.log('getCourseData() returned:', courseData);
        return courseData;
      } else {
        console.log('getCourseData method not found in ref');
        return null;
      }
    }
    
    console.log('Unknown view:', currentView);
    return null;
  };

  // 保存课程
  const handleSaveCourse = async () => {
    console.log('handleSaveCourse called:', { appState, isComponentReady, currentView, hasRef: !!canvasViewRef.current });
    
    // 检查是否在课程编辑器中且 ref 存在
    if (appState !== 'app' || !canvasViewRef.current) {
      console.log('Skipping save: appState or ref not ready');
      return;
    }
    
    try {
      setIsSaving(true);
      setAutoSaveStatus('saving');
      
      const courseData = getCurrentCourseData();
      console.log('Course data:', courseData);
      
      if (!courseData) {
        console.log('No course data available');
        setAutoSaveStatus('idle');
        return;
      }

      const requestBody = {
        userId: user?.id || 1,
        organizationId: user?.organizationId || null,
        title: appConfig?.unit || '自定义课程',
        description: appConfig?.theme || '',
        ageGroup: appConfig?.ageGroup || '',
        unit: appConfig?.unit || '',
        duration: appConfig?.duration || 40,
        theme: appConfig?.theme || '',
        keywords: appConfig?.keywords || [],
        isPublic: false,
        // 把当前表格/画布结构一并保存到后端
        courseData
      };
      
      const isUpdate = !!currentCourseId;
      const url = isUpdate ? `/api/courses/${currentCourseId}` : '/api/courses';
      const method = isUpdate ? 'PUT' : 'POST';

      console.log('Saving course with request body:', { method, url, body: requestBody });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Save response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save failed response:', errorText);
        throw new Error('保存失败');
      }

      const result = await response.json();
      console.log('Save result:', result);

      const savedCourse = result?.data || result;
      if (savedCourse?.id) {
        setCurrentCourseId(savedCourse.id);
      }
      setLastSavedTime(new Date());
      setAutoSaveStatus('saved');
      
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('保存课程失败:', error);
      setAutoSaveStatus('error');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // 自动保存
  const triggerAutoSave = React.useCallback(() => {
    // 只在课程编辑器中且 ref 存在时才触发自动保存
    if (appState !== 'app' || !canvasViewRef.current) {
      return;
    }

    // 节流：距离上次保存不足 30s 就不再自动保存，避免过于频繁
    const now = Date.now();
    if (lastSavedTime && now - lastSavedTime.getTime() < 30000) {
      return;
    }
    
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // 只在真正调用保存时才展示"自动保存中"状态，避免频繁闪烁
    autoSaveTimerRef.current = setTimeout(async () => {
      await handleSaveCourse();
    }, 2000);
  }, [appState, lastSavedTime]);

  // 监听数据变化触发自动保存
  React.useEffect(() => {
    if (appState === 'app' && appConfig && canvasViewRef.current) {
      triggerAutoSave();
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [appState, appConfig, currentView, canvasMode, triggerAutoSave]);

  // 切换菜单展开/收起
  const toggleMenu = (menuId) => {
    setExpandedMenus(prev =>
      prev.includes(menuId)
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  // 一级菜单配置
  const menuItems = [
    { 
      id: 'dashboard', 
      path: '/', 
      label: '工作看板', 
      icon: Home, 
      description: '工作台驾驶舱' 
    },
    { 
      id: 'courses', 
      path: '/courses', 
      label: '课程管理', 
      icon: BookOpen, 
      description: '管理我的课程',
      roles: ['super_admin', 'org_admin', 'research_leader', 'creator']
    },
    { 
      id: 'course-square', 
      path: '/course-square', 
      label: '课程广场', 
      icon: FileText, 
      description: '公共课程资源' 
    },
    { 
      id: 'knowledge', 
      label: '素材管理', 
      icon: Image, 
      description: '管理素材资源',
      roles: ['super_admin', 'org_admin', 'research_leader', 'creator'],
      children: [
        { path: '/knowledge-base', label: '教材', icon: BookOpen },
        { path: '/ppt-images', label: '图片', icon: Image },
        // { path: '/ip-characters', label: 'IP人物素材', icon: User },
        { path: '/video-materials', label: '视频', icon: Video },
        { path: '/voices', label: '声音', icon: Music },
      ]
    },
    // 超级管理端（带二级菜单）
    // { 
    //   id: 'super-admin', 
    //   label: '超级管理端', 
    //   icon: Settings, 
    //   description: '系统管理',
    //   roles: ['super_admin'],
    //   children: [
    //     { path: '/super-admin', label: '机构管理', icon: Building2 },
    //     { path: '/account-management', label: '账号管理', icon: Users },
    //   ]
    // },
  ];

  // 过滤用户有权限访问的菜单项
  const accessibleMenuItems = menuItems.filter(item =>
    !item.roles || item.roles.includes(user?.role)
  );

  // 判断当前页面类型
  const isDashboard = location.pathname === '/';
  const isCreatePage = location.pathname === '/create';
  const isInCourseEditor = isCreatePage && appState === 'app';

  // 如果通过 ?courseId=xxx 进入创建页，则加载已有课程并直接进入表格编辑模式
  // 如果没有 courseId，则回到欢迎页，避免直接跳过 WelcomeScreen
  // 注意：依赖只监听路由变化，避免在保存/生成课程时被意外重置回欢迎页
  React.useEffect(() => {
    if (!isCreatePage) return;

    const searchParams = new URLSearchParams(location.search || '');
    const editingCourseId = searchParams.get('courseId');

    // 没有传 courseId：认为是“新建课程”，重置到欢迎页（仅在刚进入 /create 时生效）
    if (!editingCourseId) {
      setAppState('welcome');
      setAppConfig(null);
      setCurrentCourseId(null);
      setCurrentView('table');
      setCanvasNavigation(null);
      setIsComponentReady(false);
      return;
    }

    // 避免重复加载同一门课
    if (currentCourseId && String(currentCourseId) === String(editingCourseId)) {
      return;
    }

    const loadCourse = async () => {
      try {
        setIsLoadingCourse(true);
        const result = await apiService.getCourse(editingCourseId);
        const course = result?.data || result;

        console.log('API返回的完整结果:', result);
        console.log('解析后的课程对象:', course);
        console.log('course.courseData:', course.courseData);
        console.log('course.data:', course.data);
        console.log('course.course_data:', course.course_data);

        const initialConfig = {
          grade: course.grade || '',
          age: course.age_group || '',
          unit: course.unit || course.title || '自定义课程',
          duration: course.duration || (appConfig?.duration || '40分钟'),
          theme: course.theme || '',
          // 关键字数组转成逗号分隔字符串，方便表格里显示
          keywords: Array.isArray(course.keywords)
            ? course.keywords.join(',')
            : (course.keywords || ''),
          // TableView 会用到的课程结构数据（字段名不确定时做兼容）
          courseData: course.courseData || course.data || course.course_data || null,
        };

        console.log('设置的 initialConfig:', initialConfig);

        setAppConfig(initialConfig);
        setAppState('app');
        setCurrentView('table');
        setIsComponentReady(false);
        setCurrentCourseId(course.id);
      } catch (error) {
        console.error('加载课程详情失败:', error);
      } finally {
        setIsLoadingCourse(false);
      }
    };

    loadCourse();
  }, [isCreatePage, location.search]);

  // 判断是否为子菜单
  const isChildMenu = (path) => {
    for (const item of menuItems) {
      if (item.children) {
        const found = item.children.find(child => child.path === path);
        if (found) return true;
      }
    }
    return false;
  };

  // 判断父菜单是否展开
  const isParentExpanded = (path) => {
    for (const item of menuItems) {
      if (item.children) {
        const found = item.children.find(child => child.path === path);
        if (found) return expandedMenus.includes(item.id);
      }
    }
    return false;
  };

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
          {accessibleMenuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isExpanded = expandedMenus.includes(item.id);
            const hasChildren = item.children && item.children.length > 0;

            // 过滤子菜单权限
            const accessibleChildren = item.children?.filter(child =>
              !child.roles || child.roles.includes(user?.role)
            ) || [];

            if (hasChildren && accessibleChildren.length === 0) return null;

            return (
              <div key={item.id}>
                {hasChildren ? (
                  // 一级菜单（带展开/收起）
                  <>
                    <button
                      onClick={() => toggleMenu(item.id)}
                      className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors ${
                        isActive || isParentExpanded(location.pathname)
                          ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!sidebarCollapsed && (
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{item.label}</div>
                          {item.description && (
                            <div className="text-xs text-slate-400">{item.description}</div>
                          )}
                        </div>
                      )}
                      {!sidebarCollapsed && (
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </button>

                    {/* 二级菜单 */}
                    {!sidebarCollapsed && isExpanded && (
                      <div className="bg-slate-50">
                        {accessibleChildren.map(child => {
                          const ChildIcon = child.icon;
                          const childIsActive = location.pathname === child.path;
                          return (
                            <button
                              key={child.path}
                              onClick={() => navigate(child.path)}
                              className={`w-full pl-12 pr-4 py-2 flex items-center gap-2 transition-colors ${
                                childIsActive
                                  ? 'bg-blue-100/50 text-blue-600 border-r-2 border-blue-600'
                                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                              }`}
                            >
                              <ChildIcon className="w-3.5 h-3.5" />
                              <span className="text-sm">{child.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  // 普通一级菜单
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
                )}
              </div>
            );
          })}
        </nav>

        {/* 收起/展开按钮 */}
        <div className="p-3 border-t border-slate-200">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            title={sidebarCollapsed ? "展开菜单" : "收起菜单"}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
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
                  onClick={() => {
                    setIsComponentReady(false);
                    setCurrentView('table');
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
                    currentView === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  表格视图
                </button>

                <button
                  onClick={() => {
                    setIsComponentReady(false);
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
                    setIsComponentReady(false);
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
                onClick={handleSaveCourse}
                disabled={isSaving}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:bg-green-400 transition-colors"
              >
                {isSaving ? '保存中...' : '保存'}
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

              <div className="flex items-center gap-2 ml-4 text-xs text-slate-500 w-32 justify-end">
                {autoSaveStatus === 'saving' && (
                  <div className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>自动保存中...</span>
                  </div>
                )}
                {autoSaveStatus === 'saved' && lastSavedTime && (
                  <div className="flex items-center gap-1 text-green-600">
                    <span>已保存</span>
                    <span>{lastSavedTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
                {autoSaveStatus === 'error' && (
                  <div className="flex items-center gap-1 text-red-600">
                    <span>保存失败</span>
                  </div>
                )}
              </div>
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
                      {canvasMode === 'ppt' && <CanvasView ref={canvasViewRef} navigation={canvasNavigation} initialConfig={appConfig} />}
                      {canvasMode === 'reading-material' && <ReadingMaterialCanvasView ref={canvasViewRef} navigation={canvasNavigation} initialConfig={appConfig} />}
                    </>
                  )}
                  {currentView === 'table' && (
                    <>
                      {console.log('Rendering TableView with appConfig:', appConfig)}
                      <TableView
                        ref={canvasViewRef}
                        initialConfig={appConfig}
                        onReset={handleReset}
                        onReady={() => setIsComponentReady(true)}
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
                    </>
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
