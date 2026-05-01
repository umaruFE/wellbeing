import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  RefreshCw,
  Edit3,
  Star,
  Users,
  Clock,
  Target,
  Compass,
  MessageSquare,
  FileCheck,
  Layout,
  BookOpen,
  Smile,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Plus,
  FileText,
  Settings,
  AlertCircle
} from 'lucide-react';
import { useCourseLayout } from '../../../components/CourseLayout';
import apiService from '../../../services/api';

const colors = {
  neutral: {
    white: '#FFFFFF',
    text: {
      1: '#333E4E',
      2: '#575F6E',
      3: '#818997',
      disabled: '#A4ABB8',
    },
    border: {
      DEFAULT: '#E6E3DE',
      secondary: '#EFECE8',
    },
    bg: {
      layout: '#F7F5F1',
    },
    fill: {
      gray1: '#FCFBF9',
    }
  },
  brand: {
    DEFAULT: '#F4785E',
    light: '#FDECE8',
  },
  info: { DEFAULT: '#4482E5' },
  success: { DEFAULT: '#509F69' },
  purple: { DEFAULT: '#9E64E8' }
};

// 安全渲染函数
const safeRender = (data) => {
  if (data === null || data === undefined) return '';
  if (typeof data === 'string' || typeof data === 'number') return data;
  if (typeof data === 'object') {
    if (Array.isArray(data)) return data.join('；');
    if (data.$$typeof) return '';
    try {
      return JSON.stringify(data);
    } catch (e) {
      return '[Object]';
    }
  }
  return String(data);
};

// ============================================================
// 组件：教案设计看板
// ============================================================
const LessonPlanBoard = ({ courseId, onStepClick, currentStep }) => {
  const [boardData, setBoardData] = useState([
    {
      id: 'engage',
      title: 'E-ENGAGE 引入',
      color: colors.purple.DEFAULT,
      lightBg: '#F5F0FF',
      count: 2,
      time: '15分钟',
      items: [
        { id: 'en1', title: '星际信号接收站', time: '8分钟', expanded: true },
        { id: 'en2', title: '能量翻译器', time: '7分钟', expanded: false }
      ]
    },
    {
      id: 'empower',
      title: 'E-EMPOWER 赋能',
      color: colors.info.DEFAULT,
      lightBg: '#F0F8FF',
      count: 2,
      time: '15分钟',
      items: [
        { id: 'em1', title: '星球物种档案', time: '8分钟', expanded: false },
        { id: 'em2', title: '星际翻译挑战', time: '7分钟', expanded: false }
      ]
    },
    {
      id: 'execute',
      title: 'E-EXECUTE 实践',
      color: colors.success.DEFAULT,
      lightBg: '#EBF7EE',
      count: 3,
      time: '15分钟',
      hasWarning: true,
      items: [
        { id: 'ex1', title: '角色扮演任务', time: '8分钟', expanded: false },
        { id: 'ex2', title: '团队协作探险', time: '7分钟', expanded: false },
        { id: 'ex3', title: '即时反馈环节', time: '5分钟', expanded: false }
      ]
    },
    {
      id: 'elevate',
      title: 'E-ELEVATE 升华',
      color: colors.brand.DEFAULT,
      lightBg: '#FDECE8',
      count: 2,
      time: '15分钟',
      items: [
        { id: 'el1', title: '成果展示台', time: '8分钟', expanded: false },
        { id: 'el2', title: '星际徽章授予', time: '7分钟', expanded: false }
      ]
    }
  ]);

  const toggleCard = (colId, itemId) => {
    setBoardData(prev => prev.map(col =>
      col.id === colId ? {
        ...col,
        items: col.items.map(item => item.id === itemId ? { ...item, expanded: !item.expanded } : item)
      } : col
    ));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-140px)] min-h-[600px]">
      {boardData.map(col => (
        <div key={col.id} className="flex flex-col bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">

          {/* 列头部 */}
          <div className="p-4 flex items-start justify-between text-white shrink-0" style={{ backgroundColor: col.color }}>
            <div>
              <h3 className="font-bold text-[15px] uppercase tracking-wide">{col.title}</h3>
              <p className="text-[11px] opacity-80 mt-1">{col.count}个环节</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-[11px] opacity-90">
                <Clock size={13} /> {col.time}
              </div>
              <MoreVertical size={16} className="opacity-80 cursor-pointer" />
            </div>
          </div>

          {/* 列内容区 */}
          <div className="p-4 flex-1 overflow-y-auto bg-white flex flex-col gap-3">

            {/* 警告框 (仅实践列) */}
            {col.hasWarning && (
              <div className="bg-[#FFF9E6] border border-[#FFE1B8] rounded-xl p-3 flex items-start gap-2 text-[#D38F31]">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span className="text-[12px] font-medium leading-relaxed">建议调整阶段内活动时长在15分钟以内</span>
              </div>
            )}

            {/* 添加环节按钮 */}
            <button className="w-full py-3 border-[1.5px] border-dashed border-gray-200 text-gray-400 rounded-xl text-[13px] font-medium flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors">
              <Plus size={16} /> 添加环节
            </button>

            {/* 卡片列表 */}
            {col.items.map(item => (
              <div key={item.id}
                   className={`bg-white rounded-xl transition-all ${item.expanded ? 'border-[1.5px] shadow-sm' : 'border border-gray-100 hover:border-gray-200'}`}
                   style={{ borderColor: item.expanded ? col.color : undefined }}>

                {/* 卡片 Header (可点击切换) */}
                <div className="p-3.5 flex items-center justify-between cursor-pointer" onClick={() => toggleCard(col.id, item.id)}>
                  <div className="flex items-center gap-2">
                    {item.expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                    <div className="w-6 h-6 rounded flex items-center justify-center text-white" style={{ backgroundColor: col.color }}>
                      <Layout size={12} strokeWidth={2.5} />
                    </div>
                    <span className="text-[13px] font-bold text-gray-800">{item.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold"
                          style={{ color: col.color, backgroundColor: col.lightBg, border: `1px solid ${col.color}30` }}>
                      {item.time}
                    </span>
                    <MoreVertical size={14} className="text-gray-300" />
                  </div>
                </div>

                {/* 卡片展开的内容区 */}
                {item.expanded && (
                  <div className="px-4 pb-4">
                    <div className="border-t border-gray-100 mb-4"></div>

                    {/* 教学目标 */}
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
                        <Target size={14} />
                        <span className="text-xs font-bold">教学目标</span>
                      </div>
                      <p className="text-[12px] text-gray-600 pl-5">通过沉浸式情境激发好奇心，建立学习动机</p>
                    </div>

                    {/* 活动概述 */}
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
                        <FileText size={14} />
                        <span className="text-xs font-bold">活动概述</span>
                      </div>
                      <p className="text-[12px] text-gray-600 pl-5 mb-2">全班扮演飞船控制台员</p>

                      <div className="pl-5 grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[11px] font-bold text-gray-500 block mb-1">活动流程</span>
                          <span className="text-[12px] text-gray-600">教师激活AI生成图像，引入情境</span>
                        </div>
                        <div>
                          <span className="text-[11px] font-bold text-gray-500 block mb-1">教学资源</span>
                          <span className="text-[12px] text-gray-600">AI图像生成设备、投影仪</span>
                        </div>
                      </div>
                    </div>

                    {/* 情境创设 */}
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
                        <Compass size={14} />
                        <span className="text-xs font-bold">情境创设</span>
                      </div>
                      <p className="text-[12px] text-gray-600 pl-5">星际信号接收站场景</p>
                    </div>

                    {/* 教师语言与引导 */}
                    <div className="relative p-3.5 rounded-xl mt-2 overflow-hidden" style={{ backgroundColor: col.lightBg }}>
                      <span className="absolute right-2 bottom-[-10px] text-[70px] font-serif leading-none" style={{ color: `${col.color}15` }}>"</span>
                      <div className="flex items-center gap-1.5 mb-2" style={{ color: col.color }}>
                        <MessageSquare size={14} />
                        <span className="text-xs font-bold">教师语言与引导 (Script)</span>
                      </div>
                      <p className="text-[13px] relative z-10 font-bold" style={{ color: col.color }}>
                        "大家注意！激活频道1——动物星球信号已锁定！"
                      </p>
                    </div>

                    {/* 底部按钮 */}
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                      <button className="flex-1 py-1.5 border border-gray-200 rounded-lg text-gray-600 text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50">
                        <Edit3 size={13} /> 编辑
                      </button>
                      <button className="flex-1 py-1.5 border border-gray-200 rounded-lg text-gray-600 text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50">
                        <Settings size={13} /> 调整参数
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// ============================================================
// 主组件：教案设计页面
// ============================================================
const LessonPlanPage = () => {
  const { courseId } = useParams();
  const { setTitle, setActions } = useCourseLayout();
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setLoading(false);
        return;
      }
      try {
        const result = await apiService.getCourse(courseId);
        setCourseData(result.data || result);
      } catch (err) {
        console.error('获取课程失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  useEffect(() => {
    const displayTitle = courseData?.title || '未命名课程';
    setTitle(<span className="font-bold text-[15px]" style={{ color: colors.neutral.text[1] }}>{safeRender(displayTitle)}</span>);
    setActions(
      <>
        <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5 mr-2">
          <RefreshCw size={12} /> 所有更改已保存
        </span>
        <div className="px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5"
             style={{ backgroundColor: colors.brand.light, color: colors.brand.DEFAULT }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.brand.DEFAULT }}></span>
          后台任务 2
        </div>
        <button className="px-5 py-1.5 rounded-lg text-[13px] font-bold border transition-colors text-white"
                style={{ backgroundColor: '#4C5866' }}>
          导出
        </button>
        <button className="px-5 py-1.5 rounded-lg text-[13px] font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: colors.brand.DEFAULT }}>
          发布
        </button>
      </>
    );
    return () => { setTitle(null); setActions(null); };
  }, [courseData, setTitle, setActions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: colors.neutral.bg.layout }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-brand-coral border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: colors.neutral.text[2] }}>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col flex-1 min-w-0 h-full overflow-hidden font-sans"
      style={{ backgroundColor: colors.neutral.bg.layout, fontFamily: '"HarmonyOS Sans SC", system-ui, sans-serif' }}
    >
      <main className="flex-1 overflow-y-auto p-6 pt-6">
        <div className="max-w-[1600px] mx-auto">
          <LessonPlanBoard courseId={courseId} />
        </div>
      </main>
    </div>
  );
};

export default LessonPlanPage;
