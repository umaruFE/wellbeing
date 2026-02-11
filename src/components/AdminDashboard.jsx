import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Sparkles,
  BookOpen,
  FileText,
  Music,
  Building2,
  Plus,
  Layout,
  Users,
  Settings,
  ChevronRight,
  Clock,
  CheckCircle
} from 'lucide-react';

export const AdminDashboard = () => {
  const { user, ROLE_NAMES } = useAuth();
  const navigate = useNavigate();

  // 获取用户角色对应的显示名称
  const roleDisplayName = user?.role && ROLE_NAMES[user?.role] ? ROLE_NAMES[user.role] : '用户';

  // 判断是否有课程编辑权限
  const canEditCourse = ['super_admin', 'org_admin', 'research_leader', 'creator'].includes(user?.role);

  // 模拟最近课程数据
  const recentCourses = [
    { id: 1, title: '心理健康基础知识', status: '已完成', time: '2小时前', slides: 24 },
    { id: 2, title: '情绪管理技巧', status: '进行中', time: '1天前', slides: 12 },
    { id: 3, title: '压力应对策略', status: '已完成', time: '3天前', slides: 18 },
  ];

  // 统计数据
  const stats = [
    { label: '课程总数', value: '12', icon: BookOpen, color: 'bg-blue-500' },
    { label: '本周新增', value: '3', icon: Plus, color: 'bg-green-500' },
    { label: '已发布', value: '8', icon: CheckCircle, color: 'bg-purple-500' },
  ];

  return (
    <div className="p-8 h-full overflow-y-auto">
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

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
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
            </div>
          );
        })}
      </div>

      {/* 主要操作区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 创建新课程 */}
        {canEditCourse && (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
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

        {/* 快捷入口 */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">快捷入口</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/courses')}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="bg-blue-100 p-2 rounded-lg">
                <BookOpen className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-sm text-slate-700">管理我的课程</span>
            </button>
            <button
              onClick={() => navigate('/course-square')}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="bg-green-100 p-2 rounded-lg">
                <FileText className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-sm text-slate-700">浏览课程广场</span>
            </button>
            {canEditCourse && (
              <button
                onClick={() => navigate('/voices')}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
              >
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Music className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm text-slate-700">声音配置</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 最近课程 */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-800">最近课程</h3>
          <button
            onClick={() => navigate('/courses')}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            查看全部
          </button>
        </div>
        <div className="space-y-3">
          {recentCourses.map((course) => (
            <div key={course.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Layout className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-slate-800">{course.title}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{course.slides} 页</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {course.time}
                    </span>
                  </div>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                course.status === '已完成'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {course.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 底部提示 */}
      {canEditCourse && (
        <div className="mt-6 p-4 bg-blue-50 rounded-xl flex items-start gap-3">
          <div className="bg-blue-100 p-1.5 rounded-lg mt-0.5">
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-blue-800 text-sm">AI 助手提示</div>
            <div className="text-xs text-blue-600 mt-1">
              您可以输入课程主题、目标受众和教学目标，AI 将自动为您生成完整的课件结构和内容。
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

