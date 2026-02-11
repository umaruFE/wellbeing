import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkles,
  BookOpen,
  FileText,
  Music,
  Building2,
  Plus,
  Layout,
  ChevronRight,
  Clock,
  CheckCircle,
  Image,
  Video,
  AlertCircle,
  Activity,
  Database,
  Zap,
  RefreshCw,
  FolderOpen,
  BarChart3
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
    <div className="p-8 h-full overflow-y-auto relative">
      {/* 欢迎区域 */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div className="bg-blue-600 p-3 rounded-xl">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              欢迎回来，{user?.name || '用户'}
            </h1>
            <p className="text-slate-500">
              您的角色是：<span className="font-medium text-blue-600">{roleDisplayName}</span>
            </p>
          </div>
        </div>
      </div>

      {/* 第一行：统计卡片 + 资源监控 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 顶部统计卡片 - 细化 */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`${stat.color} p-2 rounded-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-slate-800">{stat.value}</div>
                  <div className="text-sm text-slate-500">{stat.label}</div>
                  {stat.sub && (
                    <div className="text-xs text-slate-400 mt-1">{stat.sub}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>


      {/* 第二行：创建新课程 + 快捷入口 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 创建新课程 */}
        {canEditCourse && (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm h-full">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">创建新课程</h2>
                  <p className="text-slate-500 text-sm">基于 AI 快速生成专业的课件内容</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-xl">
                  <Plus className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <button
                onClick={() => navigate('/create')}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                开始创建
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

        {/* 资源监控 - 算力消耗进度条 */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold text-slate-800">AI 算力资源</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <RefreshCw className="w-3 h-3 animate-spin" />
              定时同步中
            </div>
          </div>
          <div className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">已消耗算力</span>
              <span className="font-medium text-slate-800">{computeUsage.used.toLocaleString()} / {computeUsage.total.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(computeUsage.used / computeUsage.total) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>剩余算力: {(computeUsage.total - computeUsage.used).toLocaleString()}</span>
            <span>同步进度: {computeUsage.syncProgress}%</span>
          </div>
        </div>
      </div>
      {/* 最近课程 - 增加缩略图预览、音视频标签 */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">最近课程</h3>
          <button
            onClick={() => navigate('/courses')}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            查看全部
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentCourses.map((course) => (
            <div
              key={course.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-slate-50"
            >
              {/* 缩略图预览 */}
              <div className="h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-3 flex items-center justify-center">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Layout className="w-8 h-8 text-blue-300" />
                )}
              </div>
              <div className="font-medium text-slate-800 text-sm mb-1 truncate">{course.title}</div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* 音频标签 */}
                  {course.hasAudio && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                      <Music className="w-3 h-3" />
                    </span>
                  )}
                  {/* 视频标签 */}
                  {course.hasVideo && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                      <Video className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded-lg text-xs font-medium ${
                  course.status === '已完成'
                    ? 'bg-green-100 text-green-700'
                    : course.status === '进行中'
                    ? 'bg-blue-100 text-blue-700'
                    : course.status === '待审核'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {course.status}
                </span>
              </div>
              <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {course.time}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 全局反馈 - 浮动悬窗显示 Redis 队列任务进度 */}
      {showQueuePanel && (
        <div className="fixed bottom-6 right-6 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Activity className="w-4 h-4" />
              <span className="font-medium text-sm">任务队列监控</span>
            </div>
            <button
              onClick={() => setShowQueuePanel(false)}
              className="text-white/80 hover:text-white"
            >
              <ChevronRight className="w-4 h-4 rotate-45" />
            </button>
          </div>
          {/* 任务列表 */}
          <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
            {queueTasks.map((task) => (
              <div key={task.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{task.name}</span>
                  <span className={`text-xs ${
                    task.status === '已完成' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {task.status === '已完成' ? '完成' : `${Math.round(task.progress)}%`}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      task.status === '已完成'
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {/* 底部统计 */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-slate-500">
              <Database className="w-3 h-3" />
              Redis 队列
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600">运行中 3</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">等待 1</span>
            </div>
          </div>
        </div>
      )}

      {/* 恢复悬浮窗按钮 */}
      {!showQueuePanel && (
        <button
          onClick={() => setShowQueuePanel(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        >
          <Activity className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
