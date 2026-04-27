import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Menu,
  Sparkles,
  Image as ImageIcon,
  Video,
  Music,
  FolderOpen,
  RefreshCw,
  ClipboardList,
  User,
  Users,
  Clock,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Zap,
  CheckCircle2,
  X
} from 'lucide-react';
import {
  fetchDashboardStats,
  fetchRecentCourses,
  fetchRecentTasks
} from '../services/dashboardService';

export default function AdminDashboard() {
  // 从后端获取的统计数据
  const [stats, setStats] = useState({
    courses: { total: 0 },
    media: { images: 0, videos: 0, audios: 0 },
    tasks: { running: 0, completed: 0, queued: 0 },
    todayCompleted: 0,
    compute: { used: 2847, total: 40000, remaining: 37153 }
  });

  // 从后端获取的最近课程列表
  const [recentCourses, setRecentCourses] = useState([]);

  // 从后端获取的最近任务列表
  const [recentTasks, setRecentTasks] = useState([]);

  // 加载状态
  const [loading, setLoading] = useState(true);

  // 任务队列（从后端获取或实时更新）
  const [queueTasks, setQueueTasks] = useState([]);

  // 浮动窗口显示状态 - 默认显示后台服务面板
  const [showQueuePanel, setShowQueuePanel] = useState(true);

  // 当前激活的 Tab
  const [activeTab, setActiveTab] = useState('课程');

  // 背景色数组
  const imgBgList = [
    'bg-[#fceae0]', 'bg-[#e2edf3]', 'bg-[#fef3dd]', 'bg-[#eae3f3]',
    'bg-[#fdebe0]', 'bg-[#e9ecf4]', 'bg-[#f8e2e4]', 'bg-[#e4efe8]'
  ];

  // 获取当前用户ID
  const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || '1';
  };

  // 获取当前用户信息
  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  };

  const currentUser = getUser();

  // 获取用户角色对应的显示名称
  const getRoleDisplayName = (role) => {
    const roleNames = {
      super_admin: '超级管理员',
      org_admin: '机构管理员',
      research_leader: '研究组长',
      creator: '创作者',
      viewer: '查看者'
    };
    return roleNames[role] || '用户';
  };

  // 判断是否有课程编辑权限
  const canEditCourse = ['super_admin', 'org_admin', 'research_leader', 'creator'].includes(currentUser.role);

  // 计算任务统计
  const runningCount = stats.tasks.running;
  const completedCount = stats.tasks.completed;
  const queuedCount = stats.tasks.queued;

  // 累计生成素材数
  const totalMediaCount = stats.media.images + stats.media.videos + stats.media.audios;

  // 获取任务显示名称
  const getTaskDisplayName = (promptType) => {
    const names = {
      image: '生成图片',
      video: '生成视频',
      audio: '生成音频',
      voice: '生成配音',
      character: '提取人物',
      storyboard: '生成分镜',
      scene: '生成场景',
      optimize_prompt: '优化提示词',
      generate_images: '生成图片',
      generate_video: '生成视频'
    };
    return names[promptType] || '处理任务';
  };

  // 转换任务状态
  const getTaskStatus = (status) => {
    if (status === 'completed' || status === 'success') return '已完成';
    if (status === 'processing' || status === 'running') return '运行中';
    if (status === 'queued' || status === 'pending') return '排队中';
    return '等待中';
  };

  // 获取任务进度
  const getTaskProgress = (task) => {
    if (task.status === 'completed' || task.status === 'success') return 100;
    if (task.status === 'processing' || task.status === 'running') return 50;
    return 0;
  };

  // 从后端加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      // 并行加载多个数据源
      const [statsData, coursesData, tasksData] = await Promise.all([
        fetchDashboardStats(),
        fetchRecentCourses(8),
        fetchRecentTasks(getUserId(), null, 20)
      ]);

      // 更新统计数据
      if (statsData) {
        setStats(statsData);
      }

      // 处理课程数据
      if (coursesData && coursesData.length > 0) {
        const processedCourses = coursesData.map((course, index) => ({
          id: course.id,
          title: course.title || '未命名课程',
          status: course.status === 'published' ? '已发布' : '草稿',
          age: course.age_group || '7-9岁',
          duration: course.duration || '40分钟',
          capacity: '9-15人',
          date: new Date(course.updated_at || course.created_at).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          imgBg: imgBgList[index % imgBgList.length]
        }));
        setRecentCourses(processedCourses);
      } else {
        // 如果没有数据，使用默认空数据
        setRecentCourses([]);
      }

      // 处理任务数据，转换为队列任务格式
      if (tasksData && tasksData.length > 0) {
        const taskMap = tasksData.slice(0, 5).map((task, index) => ({
          id: task.id || index + 1,
          name: getTaskDisplayName(task.prompt_type),
          progress: getTaskProgress(task),
          status: getTaskStatus(task.status)
        }));
        setQueueTasks(taskMap);
        setRecentTasks(tasksData.slice(0, 10));
      } else {
        setQueueTasks([]);
      }

    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    loadData();
  }, []);

  // 定时刷新任务状态（每30秒）
  useEffect(() => {
    const interval = setInterval(() => {
      // 只刷新任务队列
      fetchRecentTasks(getUserId(), null, 20).then(tasksData => {
        if (tasksData && tasksData.length > 0) {
          const taskMap = tasksData.slice(0, 5).map((task, index) => ({
            id: task.id || index + 1,
            name: getTaskDisplayName(task.prompt_type),
            progress: getTaskProgress(task),
            status: getTaskStatus(task.status)
          }));
          setQueueTasks(taskMap);
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // 根据当前 Tab 过滤显示的数据
  const getFilteredItems = () => {
    switch (activeTab) {
      case '课程':
        return recentCourses;
      case '图片':
        return recentTasks.filter(t => t.prompt_type === 'image').slice(0, 8).map((t, i) => ({
          id: t.id || i,
          title: t.original_prompt?.slice(0, 20) || '图片任务',
          status: t.status === 'completed' ? '已完成' : '处理中',
          imgBg: imgBgList[i % imgBgList.length]
        }));
      case '视频':
        return recentTasks.filter(t => t.prompt_type === 'video').slice(0, 8).map((t, i) => ({
          id: t.id || i,
          title: t.original_prompt?.slice(0, 20) || '视频任务',
          status: t.status === 'completed' ? '已完成' : '处理中',
          imgBg: imgBgList[i % imgBgList.length]
        }));
      case '音频':
        return recentTasks.filter(t => t.prompt_type === 'audio' || t.prompt_type === 'voice').slice(0, 8).map((t, i) => ({
          id: t.id || i,
          title: t.original_prompt?.slice(0, 20) || '音频任务',
          status: t.status === 'completed' ? '已完成' : '处理中',
          imgBg: imgBgList[i % imgBgList.length]
        }));
      default:
        return recentCourses;
    }
  };

  const displayItems = getFilteredItems();

  return (
    // 1. 修正背景颜色：使用您指定的 #f5f3ef (偏暖的浅灰/燕麦色)
    <div className="min-h-screen bg-[#f5f3ef] font-sans text-[#333333]">
      {/* 顶部导航栏 */}
      <header className="bg-white h-[60px] flex items-center justify-between px-6 border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button className="text-gray-600 hover:text-gray-900 transition-colors">
            <Menu size={20} strokeWidth={2} />
          </button>
          <h1 className="text-[15px] font-medium text-gray-800">工作看板</h1>
        </div>

        <div className="flex items-center gap-5">
          {/* 搜索框 */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={14} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Input"
              className="bg-[#f5f6f8] border border-transparent rounded-full py-1.5 pl-9 pr-4 text-xs w-[280px] focus:outline-none focus:border-gray-200 focus:bg-white transition-all text-gray-600 placeholder-gray-400"
            />
          </div>

          {/* 2. 修正后台任务颜色：使用浅橙色底和亮橙色字 */}
          <button 
            onClick={() => setShowQueuePanel(!showQueuePanel)}
            className="flex items-center gap-1.5 bg-[#fff0e6] text-[#ff5c38] px-3 py-1 rounded-full text-[12px] font-normal hover:bg-[#ffe4d1] transition-all"
          >
            <span className="w-1.5 h-1.5 bg-[#ff5c38] rounded-full"></span>
            后台任务 {runningCount + queuedCount}
          </button>

          {/* 通知图标 */}
          <button className="text-gray-500 hover:text-gray-800 transition-colors relative">
            <Bell size={18} strokeWidth={2} />
          </button>

          {/* 用户信息 */}
          <div className="flex items-center gap-2 cursor-pointer ml-2">
            <img 
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin&backgroundColor=f0f0f0" 
              alt="Admin" 
              className="w-7 h-7 rounded-full border border-gray-100"
            />
            <span className="text-sm font-normal text-gray-700">Admin</span>
            <ChevronDown size={14} className="text-gray-400" />
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="p-6 max-w-[1440px] mx-auto">
        
        {/* 顶部三卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
          
          {/* 卡片 1: 开始创作 */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={16} className="text-[#f0624d]" />
              <h2 className="text-[15px] font-medium text-gray-800">开始创作</h2>
            </div>
            
            <div className="flex justify-center mb-6">
              <button className="bg-[#f0624d] text-white px-8 py-2.5 rounded-full text-sm font-normal flex items-center gap-1.5 border border-[#2d2d2d] shadow-[2px_2px_0px_0px_rgba(45,45,45,1)] hover:bg-[#e05440] hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_rgba(45,45,45,1)] active:translate-y-0 active:shadow-[1px_1px_0px_0px_rgba(45,45,45,1)] transition-all">
                <span className="text-lg font-light leading-none mb-[2px]">+</span> 创建新课程
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button className="flex items-center justify-center gap-1.5 py-2 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 transition-colors">
                <ImageIcon size={14} className="text-[#5b8ff9]" /> 创建图片
              </button>
              <button className="flex items-center justify-center gap-1.5 py-2 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 transition-colors">
                <Video size={14} className="text-[#8543e0]" /> 创建视频
              </button>
              <button className="flex items-center justify-center gap-1.5 py-2 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-600 hover:bg-gray-50 transition-colors">
                <Music size={14} className="text-[#43a047]" /> 创建音频
              </button>
            </div>
          </div>

          {/* 卡片 2: 素材与资产 */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderOpen size={16} className="text-[#f0624d]" />
                <h2 className="text-[15px] font-medium text-gray-800">素材与资产</h2>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-gray-500 bg-[#f7f8fa] border border-gray-100 px-2 py-1 rounded-md">
                {loading ? (
                  <RefreshCw size={10} className="animate-spin" />
                ) : (
                  <RefreshCw size={10} className="animate-spin-slow" />
                )} 累计同步中
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-400 mb-2 font-normal">累计生成素材</div>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-normal text-gray-800 leading-none">{loading ? '-' : totalMediaCount}</span>
                <ArrowUp size={14} className="text-gray-400 mb-1" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1.5">
                <span className="flex items-center gap-1 text-gray-500"><Zap size={10} className="text-[#f4a13f] fill-current"/> 剩余算力</span>
                <span className="text-gray-800">{loading ? '-' : (stats.compute.total - stats.compute.used).toLocaleString()} / {loading ? '-' : stats.compute.total / 1000}k</span>
              </div>
              <div className="w-full bg-[#f0f0f0] rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-[#f4a13f] h-full rounded-full transition-all" 
                  style={{ width: `${loading ? 0 : ((stats.compute.total - stats.compute.used) / stats.compute.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* 卡片 3: 今日任务概览 */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList size={16} className="text-[#f0624d]" />
              <h2 className="text-[15px] font-medium text-gray-800">今日任务概览</h2>
            </div>

            <div>
              <div className="text-xs text-gray-400 mb-2 font-normal">今日累计完成</div>
              <div className="flex items-end gap-1 mb-6">
                <span className="text-4xl font-normal text-gray-800 leading-none">{loading ? '-' : stats.todayCompleted}</span>
                <ArrowUp size={14} className="text-gray-400 mb-1" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#f4f8ff] border border-[#e0efff] rounded-lg p-2 text-center flex flex-col justify-center">
                <div className="text-[#3b82f6] text-[11px] font-normal mb-1">运行中</div>
                <div className="text-lg font-normal text-[#1d4ed8]">{loading ? '-' : runningCount}</div>
              </div>
              <div className="bg-[#f6ffed] border border-[#d9f7be] rounded-lg p-2 text-center flex flex-col justify-center">
                <div className="text-[#52c41a] text-[11px] font-normal mb-1">已完成</div>
                <div className="text-lg font-normal text-[#389e0d]">{loading ? '-' : completedCount}</div>
              </div>
              <div className="bg-[#fffbe6] border border-[#ffe58f] rounded-lg p-2 text-center flex flex-col justify-center">
                <div className="text-[#faad14] text-[11px] font-normal mb-1">排队中</div>
                <div className="text-lg font-normal text-[#d48806]">{loading ? '-' : queuedCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 最近创建列表区 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <h3 className="text-[15px] font-medium text-gray-800 mr-2">最近创建</h3>
              {/* 3. 修正 Tab 区域：使用统一的背景色容器，并且带有内边距包裹白色的选中项 */}
              <div className="flex items-center bg-[#f5f3ef] p-1 rounded-lg">
                {['课程', '图片', '视频', '音频'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center px-4 py-1.5 rounded-md text-[13px] transition-all ${
                      activeTab === tab 
                        ? 'bg-white text-gray-800 font-medium shadow-[0_1px_3px_rgba(0,0,0,0.08)]' 
                        : 'text-gray-500 hover:text-gray-700 font-normal'
                    }`}
                  >
                    {tab === '课程' && <FileText size={14} className={`inline mr-1.5 mb-0.5 ${activeTab === tab ? 'text-gray-700' : 'text-gray-400'}`}/>}
                    {tab === '图片' && <ImageIcon size={14} className={`inline mr-1.5 mb-0.5 ${activeTab === tab ? 'text-gray-700' : 'text-gray-400'}`}/>}
                    {tab === '视频' && <Video size={14} className={`inline mr-1.5 mb-0.5 ${activeTab === tab ? 'text-gray-700' : 'text-gray-400'}`}/>}
                    {tab === '音频' && <Music size={14} className={`inline mr-1.5 mb-0.5 ${activeTab === tab ? 'text-gray-700' : 'text-gray-400'}`}/>}
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            
            <button className="flex items-center gap-1 text-[13px] text-[#f0624d] font-normal hover:text-[#d94f3b] transition-colors">
              按更新时间 <ArrowDown size={12} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              // 加载状态显示骨架屏
              Array(4).fill(null).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))
            ) : displayItems.length > 0 ? (
              displayItems.map((item) => (
                <div key={item.id} className="group cursor-pointer bg-white rounded-xl border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all overflow-hidden flex flex-col">
                  
                  <div className={`w-full h-32 ${item.imgBg} flex items-center justify-center relative border-b border-gray-50`}>
                    <div className="opacity-40 transform group-hover:scale-105 transition-transform duration-300">
                      {activeTab === '课程' && <FileText size={40} strokeWidth={1.5} className="text-gray-800" />}
                      {activeTab === '图片' && <ImageIcon size={40} strokeWidth={1.5} className="text-gray-800" />}
                      {activeTab === '视频' && <Video size={40} strokeWidth={1.5} className="text-gray-800" />}
                      {activeTab === '音频' && <Music size={40} strokeWidth={1.5} className="text-gray-800" />}
                    </div>
                  </div>
                  
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-[14px] text-gray-800 line-clamp-1 flex-1">{item.title}</h4>
                      
                      <span className={`text-[10px] px-2 py-0.5 rounded flex-shrink-0 ml-2 border ${
                        item.status === '已发布' || item.status === '已完成'
                          ? 'bg-[#f6ffed] text-[#52c41a] border-[#b7eb8f]' 
                          : 'bg-[#fafafa] text-gray-500 border-gray-200'
                      }`}>
                        {item.status === '已发布' || item.status === '已完成' ? <CheckCircle2 size={9} className="inline mr-1 mb-[2px]"/> : <FileText size={9} className="inline mr-1 mb-[2px]"/>}
                        {item.status}
                      </span>
                    </div>

                    {/* 4. 修正元数据图标颜色：前面的 3 个图标统一使用主色橙红 */}
                    <div className="flex items-center gap-2 text-[11px] font-normal text-gray-500 mb-4">
                      <span className="flex items-center gap-1"><User size={12} className="text-[#ef624d]"/> {item.age || '-'}</span>
                      <span className="w-0.5 h-0.5 bg-gray-300 rounded-full"></span>
                      <span className="flex items-center gap-1"><Clock size={12} className="text-[#ef624d]"/> {item.duration || '-'}</span>
                      <span className="w-0.5 h-0.5 bg-gray-300 rounded-full"></span>
                      <span className="flex items-center gap-1"><Users size={12} className="text-[#ef624d]"/> {item.capacity || '-'}</span>
                    </div>

                    {/* 底部的日期时钟图标保留灰色不变 */}
                    <div className="text-[10px] font-normal text-gray-400 flex items-center gap-1 mt-auto">
                      <Clock size={10} className="text-gray-400" />
                      {item.date || '-'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              // 无数据状态
              <div className="col-span-4 text-center py-12 text-gray-400">
                <FileText size={48} className="mx-auto mb-4 opacity-50" />
                <p>暂无{activeTab === '课程' ? '课程' : activeTab === '图片' ? '图片' : activeTab === '视频' ? '视频' : '音频'}数据</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 浮动任务队列窗口 */}
      {showQueuePanel && (
        <div className="fixed bottom-6 right-6 w-80 bg-white rounded-xl border border-gray-100 shadow-xl z-50 overflow-hidden flex flex-col">
          <div className="bg-[#f8f9fa] px-4 py-2.5 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-1.5 font-medium text-[13px] text-gray-700">
              <Zap size={14} className="text-[#3b82f6] fill-current" /> 后台任务监控
            </div>
            <button onClick={() => setShowQueuePanel(false)} className="text-gray-400 hover:text-gray-600 transition-all">
              <X size={14} />
            </button>
          </div>
          <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
            {queueTasks.map((task) => (
              <div key={task.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-normal">
                  <span className="text-gray-600">{task.name}</span>
                  <span className={`${
                    task.status === '已完成' ? 'text-[#52c41a]' : task.status === '排队中' ? 'text-[#faad14]' : 'text-[#3b82f6]'
                  }`}>
                    {task.status === '运行中' ? `${Math.round(task.progress)}%` : task.status}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      task.status === '已完成' ? 'bg-[#52c41a]' : task.status === '排队中' ? 'bg-gray-200' : 'bg-[#3b82f6]'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}