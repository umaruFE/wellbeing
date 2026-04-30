import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  X,
  Loader2,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { cardBgClasses } from '../theme/theme';
import CreateCourseModal from './CreateCourseModal';

const App = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('课程');
  const [showQueuePanel, setShowQueuePanel] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    courses: { total: 0 },
    media: { images: 0, videos: 0, audios: 0 },
    tasks: { running: 0, completed: 0, queued: 0 },
    todayCompleted: 0,
    compute: { used: 0, total: 40000, remaining: 40000 },
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const computeUsage = {
    used: 2847,
    total: 40000
  };

  const queueTasks = [
    { id: 1, name: 'AI视频生成-动物世界1', status: '运行中', progress: 45 },
    { id: 2, name: '素材同步-背景音乐', status: '排队中', progress: 0 },
    { id: 3, name: '课件导出-神奇大自然', status: '已完成', progress: 100 }
  ];

  // 获取用户信息
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
  const runningCount = stats.tasks?.running || 0;
  const completedCount = stats.todayCompleted || 0;

  // 累计生成素材数
  const totalMediaCount = (stats.media?.images || 0) + (stats.media?.videos || 0) + (stats.media?.audios || 0);

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
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 并行加载统计数据和课程列表
      const [statsResult] = await Promise.all([
        apiService.request('/api/stats')
      ]);

      // 更新统计数据
      if (statsResult?.data) {
        setStats(statsResult.data);
      }

      // 加载课程列表
      await fetchRecentCourses();
    } catch (error) {
      console.error('获取仪表盘数据失败:', error);
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }, []);

  const fetchRecentCourses = useCallback(async () => {
    try {
      setCoursesLoading(true);
      const result = await apiService.getCourses({ limit: '8', page: '1' });
      const list = result?.data || [];
      setCourses(list.map((course, i) => ({
        id: course.id,
        title: course.title || course.unit || '未命名课程',
        status: course.status === 'published' ? '已发布' : '草稿',
        age: course.age_group || '--',
        duration: course.duration ? `${course.duration}分钟` : '--',
        capacity: '--',
        date: course.created_at
          ? new Date(course.created_at).toLocaleString('zh-CN', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            }).replace(/\//g, '/')
          : '--',
        imgBg: cardBgClasses[i % 8],
      })));
    } catch (error) {
      console.error('获取最近课程失败:', error);
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateCourse = () => {
    setIsModalOpen(true);
  };

  const handleModalSubmit = (data) => {
    setIsModalOpen(false);

    // 如果有 courseData，说明是 N8N 同步返回的，直接跳转到编辑页面
    if (data.courseData) {
      console.log('[AdminDashboard] N8N同步返回courseData，准备跳转:', data.courseData);
      navigate('/create', { state: { courseData: data.courseData, courseConfig: data } });
      return;
    }

    // 否则直接跳转（旧的快速流程或异步流程）
    const n8nPayload = {
      age: data.age,
      duration: data.duration,
      scale: data.scale,
      title: data.title,
      vocabulary: data.vocabulary,
      grammar: data.grammar,
      skills: data.skills,
      paths: data.paths,
      theme: data.theme,
      requirements: data.requirements,
      userId: user?.id || null,
      organizationId: user?.organization_id || null,
      createdAt: new Date().toISOString(),
    };

    console.log('n8n Payload:', JSON.stringify(n8nPayload, null, 2));

    navigate('/create', { state: { courseConfig: n8nPayload } });
  };

  const handleCourseClick = (courseId) => {
    navigate(`/create?courseId=${courseId}`);
  };

  return (
    <div className="min-h-screen bg-page text-primary font-harmony">
      
      {/* 顶部导航栏 */}
      <header className="bg-surface h-[60px] flex items-center justify-between px-5 border-b border-stroke-subtle sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button className="text-primary-muted hover:text-primary transition-colors">
            <Menu size={20} strokeWidth={2} />
          </button>
          <h1 className="text-base font-semibold text-primary">工作看板</h1>
        </div>

        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-primary-muted" />
            </div>
            <input
              type="text"
              placeholder="Input"
              className="bg-white border border-stroke-light rounded-full h-8 pl-8 pr-4 text-sm w-[280px] focus:outline-none focus:border-primary-placeholder transition-all text-primary placeholder-primary-placeholder"
            />
          </div>

          <button 
            onClick={() => setShowQueuePanel(!showQueuePanel)}
            className="flex items-center gap-2 bg-brand-light border border-brand-border text-brand px-3 h-8 rounded-full text-sm font-normal hover:bg-brand-accent transition-all"
          >
            <span className="w-1.5 h-1.5 bg-brand rounded-full"></span>
            后台任务 {runningCount}
          </button>

          <div className="flex items-center gap-4">
            <button className="text-primary-muted hover:text-primary transition-colors relative">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-stroke border border-stroke-light overflow-hidden">
                <div className="w-full h-full bg-brand flex items-center justify-center text-white text-[10px]">
                  {user?.name?.charAt(0) || 'AD'}
                </div>
              </div>
              <span className="text-sm font-normal text-primary group-hover:text-primary">{user?.name || 'Admin'}</span>
              <ChevronDown size={14} className="text-primary-placeholder" />
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="p-5 max-w-[1440px] mx-auto">
        
        {/* 顶部三卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          
          {/* 卡片 1: 开始创作 */}
          <div className="bg-surface rounded-xl p-5 border border-stroke flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles size={16} className="text-brand" />
              <h2 className="text-base font-semibold text-primary">开始创作</h2>
            </div>
            
            <div className="flex justify-center mb-6">
              <button
                onClick={handleCreateCourse}
                className="bg-brand text-surface px-8 py-2.5 rounded-full text-sm font-normal flex items-center gap-1.5 border-2 border-primary shadow-neo hover:bg-brand-hover transition-all"
              >
                <span className="text-lg font-light leading-none mb-[2px]">+</span> 创建新课程
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['图片', '视频', '音频'].map((type, idx) => {
                const Icons = [ImageIcon, Video, Music];
                const Colors = ['text-info', 'text-purple', 'text-success'];
                const Routes = ['/test/ip-scene', '/test/video-generator', '/test/audio-generator'];
                const Icon = Icons[idx];
                return (
                  <button key={type} onClick={() => navigate(Routes[idx])} className="flex items-center justify-center gap-1.5 py-2 bg-surface border-2 border-stroke-light rounded-lg text-sm text-primary hover:bg-surface-alt shadow-[2px_2px_0px_0px_rgba(0,0,0,0.04)] cursor-pointer transition-colors">
                    <Icon size={14} className={Colors[idx]} /> 创建{type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 卡片 2: 素材与资产 */}
          <div className="bg-surface rounded-xl p-5 border border-stroke flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FolderOpen size={16} className="text-brand" />
                <h2 className="text-base font-semibold text-primary">素材与资产</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-primary bg-surface border border-stroke-light px-2 h-[22px] rounded">
                <RefreshCw size={12} className="animate-spin-slow text-info-icon" /> 实时同步中
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 mb-6">
              <div className="text-sm text-primary-secondary font-normal">累计生成素材</div>
              <div className="flex items-baseline gap-1">
                {statsLoading ? (
                  <Loader2 size={24} className="text-primary-placeholder animate-spin" />
                ) : (
                  <>
                    <span className="text-[30px] font-semibold text-primary leading-none">{totalMediaCount}</span>
                    <span className="text-sm text-primary-secondary">个</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between bg-surface-alt border border-stroke-subtle rounded-lg px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-sm text-primary-secondary whitespace-nowrap mr-4">
                <Zap size={14} className="text-warning fill-current"/> 剩余算力
              </div>
              <div className="flex items-center gap-3 flex-1 justify-end">
                <span className="text-sm font-medium text-primary whitespace-nowrap">
                  {(computeUsage.total - computeUsage.used).toLocaleString()} / {computeUsage.total / 1000}k
                </span>
                <div className="flex-1 max-w-[120px] min-w-[60px] bg-stroke rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-warning h-full rounded-full transition-all duration-500"
                    style={{ width: `${(1 - computeUsage.used/computeUsage.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 卡片 3: 今日任务概览 */}
          <div className="bg-surface rounded-xl p-5 border border-stroke flex flex-col justify-between">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList size={16} className="text-brand" />
              <h2 className="text-base font-semibold text-primary">今日任务概览</h2>
            </div>

            <div className="flex items-center justify-between mt-2 mb-6">
              <div className="text-sm text-primary-secondary font-normal">今日累计完成</div>
              <div className="flex items-baseline gap-1">
                {statsLoading ? (
                  <Loader2 size={24} className="text-primary-placeholder animate-spin" />
                ) : (
                  <>
                    <span className="text-[30px] font-semibold text-primary leading-none">{stats.tasks.completed}</span>
                    <span className="text-sm text-primary-secondary">个</span>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-info-light border border-info-border rounded-lg px-4 py-2 flex items-center justify-between">
                <div className="text-primary text-sm font-normal">运行中</div>
                <div className="text-sm font-medium text-info">{statsLoading ? '-' : stats.tasks.running}</div>
              </div>
              <div className="bg-success-light border border-success-border rounded-lg px-4 py-2 flex items-center justify-between">
                <div className="text-primary text-sm font-normal">已完成</div>
                <div className="text-sm font-medium text-success">{statsLoading ? '-' : stats.tasks.completed}</div>
              </div>
              <div className="bg-warning-light border border-warning-border rounded-lg px-4 py-2 flex items-center justify-between">
                <div className="text-primary text-sm font-normal">排队中</div>
                <div className="text-sm font-medium text-warning">{statsLoading ? '-' : stats.tasks.queued}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 最近创建列表区 */}
        <div className="bg-surface rounded-xl border border-stroke p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <h3 className="text-base font-semibold text-primary mr-2">最近创建</h3>
              <div className="flex items-center bg-surface-alt p-1 rounded-lg">
                {['课程', '图片', '视频', '音频'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center px-4 py-1.5 rounded-md text-sm transition-all ${
                      activeTab === tab 
                        ? 'bg-surface text-primary font-medium' 
                        : 'text-primary-secondary hover:text-primary font-normal bg-transparent'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            <button className="flex items-center gap-1 text-sm text-brand font-normal hover:text-brand-dark transition-colors">
              按更新时间 <ArrowDown size={14} />
            </button>
          </div>

          {activeTab === '课程' && (
            coursesLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={24} className="text-primary-placeholder animate-spin" />
                <span className="ml-2 text-sm text-primary-placeholder">加载中...</span>
              </div>
            ) : courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-primary-placeholder">
                <FileText size={40} strokeWidth={1.5} className="mb-3 opacity-40" />
                <p className="text-sm">暂无课程，点击上方按钮创建</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {courses.map((course) => (
                  <div 
                    key={course.id}
                    onClick={() => handleCourseClick(course.id)}
                    className="group cursor-pointer bg-surface rounded-xl border-2 border-transparent transition-all duration-200 overflow-hidden flex flex-col relative
                      shadow-[0_0_0_1px_#EFECE8]
                      hover:border-primary 
                      hover:shadow-neo"
                  >
                    <div className={`w-full h-32 ${course.imgBg} flex items-center justify-center relative border-b border-stroke-subtle`}>
                      <div className="opacity-40 transform group-hover:scale-105 transition-transform duration-300">
                        <ImageIcon size={40} strokeWidth={1.5} className="text-primary" />
                      </div>
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-sm text-primary line-clamp-1 flex-1">{course.title}</h4>
                        <span className={`text-xs px-2 h-[22px] rounded flex items-center justify-center flex-shrink-0 ml-2 border ${
                          course.status === '已发布' 
                            ? 'bg-success-light text-primary border-success-border' 
                            : 'bg-surface text-primary border-stroke-light'
                        }`}>
                          {course.status === '已发布' ? <CheckCircle2 size={12} className="mr-1 text-success" /> : <FileText size={12} className="mr-1 text-primary-secondary" />}
                          {course.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-sm font-normal text-primary-secondary mb-4">
                        <span className="flex items-center gap-1"><User size={14} className="text-brand"/> {course.age}</span>
                        <span className="w-0.5 h-0.5 bg-stroke rounded-full"></span>
                        <span className="flex items-center gap-1"><Clock size={14} className="text-brand"/> {course.duration}</span>
                      </div>

                      <div className="text-xs font-normal text-primary-placeholder flex items-center gap-1 mt-auto">
                        <Clock size={12} className="text-primary-placeholder" />
                        {course.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab !== '课程' && (
            <div className="flex flex-col items-center justify-center py-16 text-primary-placeholder">
              {activeTab === '图片' && <ImageIcon size={40} strokeWidth={1.5} className="mb-3 opacity-40" />}
              {activeTab === '视频' && <Video size={40} strokeWidth={1.5} className="mb-3 opacity-40" />}
              {activeTab === '音频' && <Music size={40} strokeWidth={1.5} className="mb-3 opacity-40" />}
              <p className="text-sm">暂无{activeTab}数据</p>
            </div>
          )}
        </div>
      </main>

      {/* 任务监控浮窗 */}
      {showQueuePanel && (
        <div className="fixed bottom-6 right-6 w-80 bg-surface rounded-xl border border-stroke z-50 overflow-hidden flex flex-col shadow-xl">
          <div className="bg-surface px-4 py-2.5 border-b border-stroke-subtle flex justify-between items-center">
            <div className="flex items-center gap-1.5 font-semibold text-sm text-primary">
              <Zap size={14} className="text-info fill-current" /> 后台任务监控
            </div>
            <button onClick={() => setShowQueuePanel(false)} className="text-primary-muted hover:text-primary">
              <X size={14} />
            </button>
          </div>
          <div className="p-4 space-y-4 max-h-64 overflow-y-auto">
            {queueTasks.map((task) => (
              <div key={task.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm text-primary">
                  <span>{task.name}</span>
                  <span className="text-xs text-primary-secondary">{task.status}</span>
                </div>
                <div className="w-full bg-stroke h-1 rounded-full overflow-hidden">
                  <div className="bg-info h-full" style={{ width: `${task.progress}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <CreateCourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onFinish={handleModalSubmit}
      />
    </div>
  );
};

export default App;
