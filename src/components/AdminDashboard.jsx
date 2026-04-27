import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkles,
  BookOpen,
  Music,
  ChevronRight,
  Clock,
  Image,
  Video,
  Activity,
  Zap,
  RefreshCw
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user, ROLE_NAMES } = useAuth();
  const navigate = useNavigate();

  // 获取用户角色对应的显示名称
  const roleDisplayName = user?.role && ROLE_NAMES[user?.role] ? ROLE_NAMES[user.role] : '用户';

  // 判断是否有课程编辑权限
  const canEditCourse = ['super_admin', 'org_admin', 'research_leader', 'creator'].includes(user?.role);

  // 模拟统计数据
  const stats = [
    { label: '课程总数', value: '156', icon: BookOpen, color: 'bg-blue-500' },
    { label: 'AI 生成素材', value: '2.4k', icon: Image, color: 'bg-purple-500', sub: '图片 1.8k / 视频 0.6k' },
    // { label: '待审记录', value: '23', icon: AlertCircle, color: 'bg-orange-500' },
  ];

  // 模拟最近课程数据 - 增加缩略图和音视频标签
  const recentCourses = [
    {
      id: 1,
      title: '心理健康基础知识',
      status: '已完成',
      time: '2小时前',
      slides: 24,
      thumbnail: null,
      hasAudio: true,
      hasVideo: true
    },
    {
      id: 2,
      title: '情绪管理技巧',
      status: '进行中',
      time: '1天前',
      slides: 12,
      thumbnail: null,
      hasAudio: true,
      hasVideo: false
    },
    {
      id: 3,
      title: '压力应对策略',
      status: '已完成',
      time: '3天前',
      slides: 18,
      thumbnail: null,
      hasAudio: false,
      hasVideo: true
    },
    {
      id: 4,
      title: '人际关系沟通',
      status: '待审核',
      time: '5天前',
      slides: 16,
      thumbnail: null,
      hasAudio: true,
      hasVideo: true
    },
  ];

  // 模拟任务队列数据
  const [queueTasks, setQueueTasks] = useState([
    { id: 1, name: '生成课程封面', progress: 75, status: '进行中' },
    { id: 2, name: '转录音频内容', progress: 100, status: '已完成' },
    { id: 3, name: '生成教学视频', progress: 32, status: '进行中' },
  ]);

  // 模拟算力消耗
  const [computeUsage, setComputeUsage] = useState({
    used: 2847,
    total: 40000,
    syncProgress: 68
  });

  // 浮动窗口显示状态
  const [showQueuePanel, setShowQueuePanel] = useState(true);

  // 定时刷新数据
  useEffect(() => {
    const interval = setInterval(() => {
      setQueueTasks(prev => prev.map(task =>
        task.status === '进行中' && task.progress < 100
          ? { ...task, progress: Math.min(100, task.progress + Math.random() * 5) }
          : task
      ));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-8 h-full overflow-y-auto relative mx-auto pb-20">
      {/* 欢迎区域 */}
      <div className="mb-8">
        <div className="flex items-center gap-6 mb-2">
          <div className="transform scale-150 origin-left flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-[#f4b886] border border-gray-800 flex items-center justify-center">
              <span className="text-sm font-bold text-[#2d2d2d]">{user?.name?.charAt(0) || 'U'}</span>
            </div>
          </div>
          <div className="ml-4">
            <h1 className="text-3xl font-bold mb-1 flex items-center gap-2 text-[#2d2d2d]">
              欢迎回来，{user?.name || '用户'}
            </h1>
            <p className="text-gray-500 text-sm">
              您的角色是：<span className="font-medium text-blue-600">{roleDisplayName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 第一行：统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* 课程总数 */}
        <div className="bg-white rounded-[24px] p-6 border border-[#e5e3db] shadow-sm flex justify-between items-center relative overflow-hidden group hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/courses')}>
          <div className="z-10">
            <div className="bg-[#a5c29b] text-white p-2 rounded-xl inline-block mb-3 border border-[#2d2d2d]">
              <BookOpen size={20} />
            </div>
          </div>
        </div>

        {/* AI 生成素材 */}
        <div className="bg-white rounded-[24px] p-6 border border-[#e5e3db] shadow-sm flex justify-between items-center relative overflow-hidden">
          <div className="z-10">
            <div className="bg-[#f0ad4e] text-white p-2 rounded-xl inline-block mb-3 border border-[#2d2d2d]">
              <Image size={20} />
            </div>
            <div className="text-3xl font-bold font-mono tracking-tight mb-1 text-[#2d2d2d]">{stats[1].value}</div>
            <div className="text-sm font-semibold text-gray-700">{stats[1].label}</div>
            {stats[1].sub && (
              <div className="text-xs text-gray-400 mt-1">{stats[1].sub}</div>
            )}
          </div>
        </div>

        {/* 创建新课程 */}
        {canEditCourse && (
          <div className="bg-[#f47d64] rounded-[24px] p-6 border-2 border-[#2d2d2d] shadow-[4px_4px_0px_0px_rgba(45,45,45,1)] relative overflow-hidden flex flex-col justify-between group cursor-pointer hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(45,45,45,1)] transition-all" onClick={() => navigate('/create')}>
            <div className="relative z-10 text-white">
              <h2 className="text-xl font-bold mb-2 tracking-wide">创建新课程</h2>
              <p className="text-white/90 text-sm mb-6 max-w-[160px] leading-relaxed">基于 AI 快速生成专业的课件内容</p>
              <button className="bg-[#fbdf9b] text-[#2d2d2d] font-bold py-2.5 px-5 rounded-full border-2 border-[#2d2d2d] text-sm flex items-center gap-1 hover:bg-[#fce5b1] transition-colors shadow-[2px_2px_0px_0px_rgba(45,45,45,1)]">
                + 开始创建 <ChevronRight size={16} strokeWidth={3} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 第二行：AI 算力资源监控 */}
      <div className="bg-white rounded-[24px] p-6 border border-[#e5e3db] shadow-sm mb-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#f0ad4e]" size={20} fill="#f0ad4e" />
            <h3 className="font-bold text-lg text-[#2d2d2d]">AI 算力资源</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 py-1 px-3 rounded-full border border-gray-200">
            <RefreshCw size={12} className="animate-spin-slow" /> 实时同步中
          </div>
        </div>
        <div className="mb-2"><span className="text-sm text-gray-600 font-medium">已消耗算力</span></div>

        <div className="relative w-full h-8 mt-4 flex items-center">
          <div className="absolute w-full h-1 bg-gray-200 rounded-full"></div>
          <div className="absolute h-1 bg-green-800 rounded-full z-10" style={{ width: `${(computeUsage.used / computeUsage.total) * 100}%` }}></div>
        </div>

        <div className="flex justify-between mt-4 text-sm">
          <span className="text-gray-500 font-medium">剩余算力: <strong className="text-gray-800">{(computeUsage.total - computeUsage.used).toLocaleString()}</strong></span>
          <div className="text-right">
            <span className="font-bold font-mono text-lg block leading-none mb-1">{computeUsage.used.toLocaleString()} / {computeUsage.total.toLocaleString()}</span>
            <span className="text-xs text-gray-400">同步进度: {computeUsage.syncProgress}%</span>
          </div>
        </div>
      </div>

      {/* 最近课程 */}
      <div className="bg-white rounded-2xl p-5 border border-[#e5e3db] shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-xl text-[#2d2d2d]">最近课程</h3>
          <button
            onClick={() => navigate('/courses')}
            className="text-sm text-gray-500 hover:text-gray-800 font-medium"
          >
            查看全部
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentCourses.map((course) => (
            <div
              key={course.id}
              className="min-w-[280px] bg-white rounded-[20px] border border-[#e5e3db] shadow-sm overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer"
            >
              {/* 缩略图预览 */}
              <div className={`h-24 bg-gradient-to-br flex items-center justify-center border-b border-[#e5e3db]/50 ${
                course.id === 1 ? 'from-[#ffe2e2] to-[#f3e5f5]' :
                course.id === 2 ? 'from-[#e3f2fd] to-[#f3e5f5]' :
                course.id === 3 ? 'from-[#fff3e0] to-[#fce4ec]' :
                'from-[#e8f5e9] to-[#e0f7fa]'
              }`}>
                <div className="bg-white/40 p-3 rounded-2xl backdrop-blur-sm border border-white/50">
                  {course.id === 1 && <Sparkles className="w-7 h-7 text-gray-600" />}
                  {course.id === 2 && <BookOpen className="w-7 h-7 text-gray-600" />}
                  {course.id === 3 && <Activity className="w-7 h-7 text-gray-600" />}
                  {course.id === 4 && <Video className="w-7 h-7 text-gray-600" />}
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-bold text-[#2d2d2d] mb-3 truncate">{course.title}</h4>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 text-gray-400">
                    {course.hasAudio && <Music size={14} />}
                    {course.hasVideo && <Video size={14} />}
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    course.status === '已完成'
                      ? 'bg-green-100 text-green-700'
                      : course.status === '进行中'
                      ? 'bg-purple-100 text-purple-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {course.status}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mt-4 flex items-center gap-1">
                  <Clock size={10} /> {course.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer className="mt-8 text-xs text-gray-400">© 2024 CourseGen AI</footer>

      {/* 全局反馈 - 浮动悬窗显示 Redis 队列任务进度 */}
      {showQueuePanel && (
        <div className="fixed bottom-6 right-6 w-80 bg-[#f4fae8] rounded-2xl border-2 border-[#2d2d2d] shadow-[4px_4px_0px_0px_rgba(45,45,45,1)] z-50 overflow-hidden flex flex-col">
          {/* 头部 */}
          <div className="bg-[#b4d2a6] px-4 py-3 border-b-2 border-[#2d2d2d] flex justify-between items-center">
            <div className="flex items-center gap-2 font-bold text-gray-800">
              <Zap size={16} fill="currentColor" /> 任务队列监控
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowQueuePanel(false)}
                className="text-gray-600 hover:text-black"
              >
                <ChevronRight className="w-4 h-4 rotate-45" />
              </button>
            </div>
          </div>
          <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
            {queueTasks.map((task) => (
              <div key={task.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-gray-800">{task.name}</span>
                  <span className={`text-xs ${
                    task.status === '已完成' ? 'text-green-600' : 'text-[#f0ad4e]'
                  }`}>
                    {task.status === '已完成' ? '完成' : `${Math.round(task.progress)}%`}
                  </span>
                </div>
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden border border-gray-300">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      task.status === '已完成'
                        ? 'bg-green-500'
                        : task.id === 1 ? 'bg-[#f0ad4e]'
                        : 'bg-[#f47d64]'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 恢复悬浮窗按钮 */}
      {!showQueuePanel && (
        <button
          onClick={() => setShowQueuePanel(true)}
          className="fixed bottom-6 right-6 bg-[#b4d2a6] text-gray-800 p-3 rounded-full shadow-lg hover:bg-[#a3c193] transition-colors z-50 border-2 border-[#2d2d2d]"
        >
          <Zap className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
