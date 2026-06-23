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
  RefreshCw,
  Wand2,
  Clapperboard,
  Mic
} from 'lucide-react';
import { CanvasView } from '../modules/course-management/ppt-canvas/CanvasView';
import { TableView } from '../modules/course-management/table-view/TableView';
import { ReadingMaterialCanvasView } from '../modules/course-management/reading-material/ReadingMaterialCanvasView';
import AdminDashboard from './AdminDashboard';

export const MainLayout = () => {
  const { user, logout, ROLE_NAMES } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState(['knowledge']); // 默认展开素材管理

  // 课程编辑状态
  const [appState, setAppState] = useState('welcome');
  const [currentView, setCurrentView] = useState('table');
  const [canvasMode, setCanvasMode] = useState('ppt');
  const [appConfig, setAppConfig] = useState(null);
  const [pptCanvasConfig, setPptCanvasConfig] = useState(null);
  const [readingMaterialCanvasConfig, setReadingMaterialCanvasConfig] = useState(null);
  const canvasViewRef = React.useRef(null);
  const pptCanvasRef = React.useRef(null);
  const readingMaterialCanvasRef = React.useRef(null);
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

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '保存课程失败');
      }

      const result = await response.json();
      const newCourse = result.data;

      setCurrentCourseId(newCourse.id);
      
      // 为新建课程创建独立配置
      const baseConfig = config;
      const pptConfig = {
        ...baseConfig,
        canvasData: null,
        readingMaterialsData: null,
      };
      const readingMaterialConfig = {
        ...baseConfig,
        canvasData: null,
        readingMaterialsData: null,
      };
      
      setAppConfig(baseConfig);
      setPptCanvasConfig(pptConfig);
      setReadingMaterialCanvasConfig(readingMaterialConfig);
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

  // 重置 - 跳转到课程列表页
  const handleReset = () => {
    navigate('/courses');
  };

  // 导出PPT
  const handleExportPPT = () => {
    if (pptCanvasRef.current) {
      setIsExporting(true);
      pptCanvasRef.current.exportPPT();
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  // 导出PDF
  const handleExportPDF = () => {
    if (pptCanvasRef.current && pptCanvasRef.current.exportPDF) {
      setIsExporting(true);
      pptCanvasRef.current.exportPDF();
      setTimeout(() => setIsExporting(false), 2000);
    }
  };

  // 获取当前课程数据
  const getCurrentCourseData = () => {
    // 根据当前视图类型选择合适的 ref
    let currentRef = null;
    if (currentView === 'table') {
      currentRef = canvasViewRef;
    } else if (currentView === 'canvas') {
      if (canvasMode === 'ppt') {
        currentRef = pptCanvasRef;
      } else if (canvasMode === 'reading-material') {
        currentRef = readingMaterialCanvasRef;
      }
    }
    
    if (!currentRef?.current) {
      return appConfig?.courseData || null;
    }
    
    const refMethods = Object.keys(currentRef.current);
    
    let courseData = null;
    
    if (currentView === 'table') {
      if (refMethods.includes('getSlides')) {
        const slides = currentRef.current.getSlides();
        
        if (!slides || slides.length === 0) {
          courseData = appConfig?.courseData;
        } else {
          courseData = slides;
        }
      } else {
        courseData = appConfig?.courseData;
      }
    } else if (currentView === 'canvas') {
      if (refMethods.includes('getCourseData')) {
        const data = currentRef.current.getCourseData();
        
        if (!data || Object.keys(data).length === 0) {
          courseData = appConfig?.courseData;
        } else {
          courseData = data;
        }
      } else {
        courseData = appConfig?.courseData;
      }
    }
    
    if (!courseData) {
      courseData = appConfig?.courseData;
    }
    
    return courseData;
  };

  // 保存课程
  const handleSaveCourse = async () => {
    // 检查是否在课程编辑器中
    if (appState !== 'app') {
      return;
    }

    // 自动保存/手动保存只能更新已落库课程，不能因为临时编辑器状态创建空课程。
    if (!currentCourseId) {
      setAutoSaveStatus('idle');
      return;
    }
    
    try {
      setIsSaving(true);
      setAutoSaveStatus('saving');
      
      const courseData = getCurrentCourseData();
      
      if (!courseData) {
        setAutoSaveStatus('idle');
        return;
      }
      
      // 获取 canvasData 和 readingMaterialsData
      let canvasData = null;
      let readingMaterialsData = null;
      
      // 从 PPT 画布获取 canvasData
      if (pptCanvasRef.current && typeof pptCanvasRef.current.getCanvasData === 'function') {
        canvasData = pptCanvasRef.current.getCanvasData();
      }
      
      // 从阅读材料画布获取 readingMaterialsData
      if (readingMaterialCanvasRef.current && typeof readingMaterialCanvasRef.current.getReadingMaterialsData === 'function') {
        readingMaterialsData = readingMaterialCanvasRef.current.getReadingMaterialsData();
      }

      const slimCourseData = JSON.parse(JSON.stringify(courseData));
      const stripStep = (step) => {
        if (step.canvasAssets) delete step.canvasAssets;
        if (step.readingMaterials) delete step.readingMaterials;
        if (step.blocks) delete step.blocks;
        if (step.assets && Array.isArray(step.assets)) {
          step.assets = step.assets.map(a => {
            const { referenceImage, ...rest } = a;
            return rest;
          });
        }
        return step;
      };
      if (Array.isArray(slimCourseData)) {
        slimCourseData.forEach(phase => (phase.slides || []).forEach(stripStep));
      } else {
        Object.values(slimCourseData).forEach(phase => (phase.steps || []).forEach(stripStep));
      }

      if (canvasData) {
        Object.keys(canvasData).forEach(slideId => {
          const entry = canvasData[slideId];
          if (entry.canvasAssets && Array.isArray(entry.canvasAssets)) {
            entry.canvasAssets = entry.canvasAssets.map(a => {
              const { referenceImage, ...rest } = a;
              return rest;
            });
          }
        });
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
        courseData: slimCourseData,
        ...(canvasData && Object.keys(canvasData).length > 0 ? { canvasData } : {}),
        ...(readingMaterialsData && Object.keys(readingMaterialsData).length > 0 ? { readingMaterialsData } : {}),
      };
      
      const url = `/api/courses/${currentCourseId}`;
      const method = 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save failed response:', errorText);
        throw new Error('保存失败');
      }

      const result = await response.json();

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
    if (appState === 'app' && appConfig) {
      // 检查是否有任何画布组件可用
      const hasAnyCanvas = canvasViewRef.current || pptCanvasRef.current || readingMaterialCanvasRef.current;
      if (hasAnyCanvas) {
        triggerAutoSave();
      }
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
    // {
    //   id: 'ai-tools',
    //   label: 'AI工具',
    //   icon: Wand2,
    //   description: 'AI智能生成',
    //   roles: ['super_admin', 'org_admin', 'research_leader', 'creator'],
    //   children: [
    //     { path: '/test/ip-scene', label: 'IP场景生成', icon: Wand2 },
    //     { path: '/test/video-generator', label: '视频生成', icon: Clapperboard },
    //     { path: '/test/voice-generator', label: '声音生成', icon: Mic },
    //     { path: '/audio-generator', label: '音频生成', icon: Music },
    //   ]
    // },
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

    // 没有传 courseId：保持空态，不进入编辑器，避免自动保存创建 Untitled 草稿。
    const stateData = location.state;
    if (stateData?.courseData) {
      const config = stateData.courseConfig || {};
      const baseConfig = {
        unit: config.title || 'AI生成课程',
        theme: config.theme || '',
        age: config.age || '',
        duration: config.duration || 40,
        keywords: '',
        courseData: stateData.courseData,
      };
      setAppConfig(baseConfig);
      setPptCanvasConfig({ ...baseConfig, canvasData: null, readingMaterialsData: null });
      setReadingMaterialCanvasConfig({ ...baseConfig, canvasData: null, readingMaterialsData: null });
      setAppState('app');
      setCurrentView('table');
      setCurrentCourseId(null);
      setIsComponentReady(true);
      return;
    }

    if (!editingCourseId) {
      setAppState('welcome');
      setAppConfig(null);
      setPptCanvasConfig(null);
      setReadingMaterialCanvasConfig(null);
      setCurrentCourseId(null);
      setCurrentView('table');
      setCanvasNavigation(null);
      setIsComponentReady(true);
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

        const baseConfig = {
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
          courseData: (() => {
            let raw = course.courseData || course.data || course.course_data || null;
            if (typeof raw === 'string') {
              try { raw = JSON.parse(raw); } catch { raw = null; }
            }
            if (raw && raw.courseData && typeof raw.courseData === 'object' && !Array.isArray(raw.courseData)) {
              if (raw.courseData.engage || raw.courseData.empower || raw.courseData.execute || raw.courseData.elevate) {
                return raw.courseData;
              }
            }
            return raw;
          })(),
        };

        // 为 PPT 画布创建独立配置（只包含 canvasData）
        const pptConfig = {
          ...baseConfig,
          canvasData: course.canvas_data || null,
          readingMaterialsData: null,
        };

        // 为阅读材料画布创建独立配置（只包含 readingMaterialsData）
        const readingMaterialConfig = {
          ...baseConfig,
          canvasData: null,
          readingMaterialsData: course.reading_materials_data || null,
        };

        setAppConfig(baseConfig);
        setPptCanvasConfig(pptConfig);
        setReadingMaterialCanvasConfig(readingMaterialConfig);
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
  }, [isCreatePage, location.search, location.state]);

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

  // 展开状态直接用 isExpanded 变量，不需要额外函数

  return (
    <div className="h-screen flex font-sans bg-surface">
      {/* 左侧边栏 */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} bg-surface border-r border-stroke-light flex flex-col transition-all duration-300 z-30`}>
        {/* Logo区域 */}
        <div className="flex items-center p-6 border-b border-stroke-light gap-3">
          <div className="bg-warning text-white p-1.5 rounded-lg border-2 border-primary shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-wide text-dark">CourseGen AI</span>
              <span className="text-xs text-primary-muted font-medium">管理控制台</span>
            </div>
          )}
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
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
                      className={`w-full flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors group ${
                        isActive || isExpanded
                          ? 'bg-success-light text-dark border-2 border-primary shadow-neo'
                          : 'text-primary-secondary hover:bg-surface-alt border-2 border-transparent'
                      } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    >
                      <div className={isActive || isExpanded ? 'text-success-active' : 'text-primary-muted group-hover:text-dark'}>
                        <Icon className="w-5 h-5 shrink-0" />
                      </div>
                      {!sidebarCollapsed && (
                        <div className="flex-1">
                          <div className="font-bold text-[15px] leading-tight">{item.label}</div>
                          {item.description && (
                            <div className="text-[11px] mt-0.5 text-primary-placeholder">{item.description}</div>
                          )}
                        </div>
                      )}
                      {!sidebarCollapsed && (
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </button>

                    {/* 二级菜单 */}
                    {!sidebarCollapsed && isExpanded && (
                      <div className="ml-9 mt-1 space-y-1 relative before:absolute before:left-[-12px] before:top-0 before:bottom-4 before:w-px before:bg-stroke">
                        {accessibleChildren.map(child => {
                          const ChildIcon = child.icon;
                          const childIsActive = location.pathname === child.path;
                          return (
                            <button
                              key={child.path}
                              onClick={() => navigate(child.path)}
                              className={`w-full flex items-center gap-3 py-2 px-4 rounded-lg cursor-pointer transition-colors text-sm border-2 ${
                                childIsActive
                                  ? 'bg-success-light text-almost-black border-success-border font-semibold shadow-none'
                                  : 'text-primary-secondary border-transparent hover:text-primary hover:bg-surface-alt font-medium'
                              }`}
                            >
                              <ChildIcon className={`w-4 h-4 shrink-0 ${childIsActive ? 'text-green-deep' : ''}`} />
                              <span className="text-left">{child.label}</span>
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
                    className={`w-full flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors group ${
                      isActive
                        ? 'bg-success-light text-dark border-2 border-primary shadow-neo'
                        : 'text-primary-secondary hover:bg-surface-alt border-2 border-transparent'
                    } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  >
                    <div className={isActive ? 'text-success-active' : 'text-primary-muted group-hover:text-dark'}>
                      <Icon className="w-5 h-5 shrink-0" />
                    </div>
                    {!sidebarCollapsed && (
                      <div className="flex-1">
                        <div className="font-bold text-[15px] leading-tight">{item.label}</div>
                        {item.description && (
                          <div className="text-[11px] mt-0.5 text-primary-placeholder">{item.description}</div>
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
        <div className="p-4 border-t border-stroke-light">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center gap-2 text-sm text-primary-muted hover:text-dark px-2 w-full"
            title={sidebarCollapsed ? "展开菜单" : "收起菜单"}
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            {!sidebarCollapsed && <span>收起</span>}
          </button>
        </div>

        {/* 用户信息 */}
        <div className="p-4 border-t border-stroke-light">
          <div className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 bg-brand rounded-full border border-dark flex items-center justify-center text-sm font-bold shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-dark truncate">{user?.name || '用户'}</div>
                <div className="text-xs text-primary-muted truncate">
                  {user?.role && ROLE_NAMES[user?.role] ? ROLE_NAMES[user.role] : '未知角色'}
                </div>
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 text-primary-placeholder hover:text-primary-secondary rounded transition-colors"
                title="退出登录"
              >
                <LogOut className="w-[18px] h-[18px]" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* 右侧主内容区 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部栏 - 仅在课程编辑时显示 */}
        {isInCourseEditor && (
          <header className="h-14 bg-surface border-b-2 border-stroke-light flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-primary-secondary">
                {appConfig?.unit || '自定义课程'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* 视图切换 */}
              <div className="flex items-center bg-surface p-1 rounded-xl border-2 border-stroke-light mr-4">
                <button
                  onClick={() => {
                    setIsComponentReady(false);
                    setCurrentView('table');
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${
                    currentView === 'table' ? 'bg-white text-info shadow-sm' : 'text-primary-muted hover:text-primary-secondary'
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
                    currentView === 'canvas' && canvasMode === 'ppt' ? 'bg-white text-info shadow-sm' : 'text-primary-muted hover:text-primary-secondary'
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
                    currentView === 'canvas' && canvasMode === 'reading-material' ? 'bg-white text-info shadow-sm' : 'text-primary-muted hover:text-primary-secondary'
                  }`}
                >
                  <FileTextIcon className="w-3.5 h-3.5" />
                  阅读材料
                </button>
              </div>

              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-primary-secondary hover:bg-surface-alt rounded-lg text-sm font-medium transition-colors"
              >
                新建课程
              </button>

              <button
                onClick={handleSaveCourse}
                disabled={isSaving}
                className="px-3 py-1.5 bg-success hover:bg-success-active text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:bg-success-hover transition-colors"
              >
                {isSaving ? '保存中...' : '保存'}
              </button>

              {/* <button
                onClick={handleExportPPT}
                disabled={isExporting}
                className="px-3 py-1.5 bg-info hover:bg-info-active text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:bg-info-hover transition-colors"
              >
                {isExporting ? '导出中...' : '导出PPT'}
              </button>

              <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="px-3 py-1.5 bg-info hover:bg-info-active text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:bg-info-hover transition-colors"
              >
                导出PDF
              </button> */}

              <div className="flex items-center gap-2 ml-4 text-xs text-primary-muted w-32 justify-end">
                {autoSaveStatus === 'saving' && (
                  <div className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>自动保存中...</span>
                  </div>
                )}
                {autoSaveStatus === 'saved' && lastSavedTime && (
                  <div className="flex items-center gap-1 text-success">
                    <span>已保存</span>
                    <span>{lastSavedTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
                {autoSaveStatus === 'error' && (
                  <div className="flex items-center gap-1 text-error">
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
              {isLoadingCourse && (
                <div className="flex-1 flex items-center justify-center bg-surface">
                  <div className="text-center space-y-4">
                    <div className="relative w-16 h-16 mx-auto">
                      <div className="absolute inset-0 border-4 border-info/30 rounded-full animate-ping"></div>
                      <div className="absolute inset-2 border-4 border-t-blue-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
                    </div>
                    <p className="text-primary-secondary">正在加载课程...</p>
                  </div>
                </div>
              )}
              
              {!isLoadingCourse && isInCourseEditor && (
                <div className="h-full flex">
                  {currentView === 'canvas' && (
                    <>
                      {canvasMode === 'ppt' && <CanvasView ref={pptCanvasRef} navigation={canvasNavigation} initialConfig={pptCanvasConfig || appConfig} />}
                      {canvasMode === 'reading-material' && <ReadingMaterialCanvasView ref={readingMaterialCanvasRef} navigation={canvasNavigation} initialConfig={readingMaterialCanvasConfig || appConfig} />}
                    </>
                  )}
                  {currentView === 'table' && (
                    <>
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

              {!isLoadingCourse && !isInCourseEditor && (
                <div className="h-full flex items-center justify-center bg-surface">
                  <div className="text-center max-w-md px-6">
                    <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-warning-light border-2 border-primary flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-primary mb-2">请先创建课程</h2>
                    <p className="text-primary-muted mb-6">课程生成完成并保存后，才会进入课件编辑器。</p>
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="px-5 py-2.5 rounded-xl bg-dark text-white border-2 border-primary font-bold hover:bg-warning hover:text-primary transition-colors"
                    >
                      返回工作台
                    </button>
                  </div>
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
