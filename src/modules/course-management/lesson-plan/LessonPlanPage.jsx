import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  RefreshCw,
  Edit3,
  Clock,
  Target,
  Compass,
  MessageSquare,
  Layout,
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

const safeRender = (data) => {
  if (data === null || data === undefined) return '';
  if (typeof data === 'string' || typeof data === 'number') return data;
  if (typeof data === 'object') {
    if (Array.isArray(data)) return data.join('；');
    if (data.$$typeof) return '';
    try { return JSON.stringify(data); } catch { return '[Object]'; }
  }
  return String(data);
};

const PHASE_CONFIG = {
  engage: {
    label: 'E-ENGAGE 引入',
    color: colors.purple.DEFAULT,
    lightBg: '#F5F0FF',
  },
  empower: {
    label: 'E-EMPOWER 赋能',
    color: colors.info.DEFAULT,
    lightBg: '#F0F8FF',
  },
  execute: {
    label: 'E-EXECUTE 实践',
    color: colors.success.DEFAULT,
    lightBg: '#EBF7EE',
  },
  elevate: {
    label: 'E-ELEVATE 升华',
    color: colors.brand.DEFAULT,
    lightBg: '#FDECE8',
  },
};

const PHASE_ORDER = ['engage', 'empower', 'execute', 'elevate'];

const LessonPlanBoard = ({ courseData }) => {
  const [expandedItems, setExpandedItems] = useState({});

  const boardColumns = useMemo(() => {
    let inner = courseData?.course_data;
    if (typeof inner === 'string') {
      try { inner = JSON.parse(inner); } catch { inner = null; }
    }

    let coursePhases = null;
    if (inner?.text?.courseData) {
      coursePhases = inner.text.courseData;
    } else if (inner?.courseData) {
      coursePhases = inner.courseData;
    } else if (inner?.engage || inner?.empower || inner?.execute || inner?.elevate) {
      coursePhases = inner;
    }

    if (!coursePhases) return [];

    return PHASE_ORDER.map(phaseKey => {
      const phase = coursePhases[phaseKey];
      const config = PHASE_CONFIG[phaseKey];
      const steps = Array.isArray(phase?.steps) ? phase.steps : [];

      return {
        id: phaseKey,
        title: phase?.title || config.label,
        color: config.color,
        lightBg: config.lightBg,
        count: steps.length,
        time: steps.length > 0
          ? steps.reduce((acc, s) => {
              const m = s.time?.match(/(\d+)/);
              return acc + (m ? parseInt(m[1]) : 0);
            }, 0) + '分钟'
          : '',
        items: steps.map(step => ({
          id: step.id,
          title: step.title,
          time: step.time,
          objective: step.objective,
          activity: step.activity,
          script: step.script,
          assets: step.assets || [],
        })),
      };
    });
  }, [courseData]);

  const toggleCard = (itemId) => {
    setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  if (boardColumns.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-gray-400">
        暂无教案数据
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-140px)] min-h-[600px]">
      {boardColumns.map(col => (
        <div key={col.id} className="flex flex-col bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">

          <div className="p-4 flex items-start justify-between text-white shrink-0" style={{ backgroundColor: col.color }}>
            <div>
              <h3 className="font-bold text-[15px] uppercase tracking-wide">{safeRender(col.title)}</h3>
              <p className="text-[11px] opacity-80 mt-1">{col.count}个环节</p>
            </div>
            <div className="flex items-center gap-2">
              {col.time && (
                <div className="flex items-center gap-1 text-[11px] opacity-90">
                  <Clock size={13} /> {col.time}
                </div>
              )}
              <MoreVertical size={16} className="opacity-80 cursor-pointer" />
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto bg-white flex flex-col gap-3">

            <button className="w-full py-3 border-[1.5px] border-dashed border-gray-200 text-gray-400 rounded-xl text-[13px] font-medium flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors">
              <Plus size={16} /> 添加环节
            </button>

            {col.items.map(item => {
              const isExpanded = !!expandedItems[item.id];
              return (
                <div key={item.id}
                     className={`bg-white rounded-xl transition-all ${isExpanded ? 'border-[1.5px] shadow-sm' : 'border border-gray-100 hover:border-gray-200'}`}
                     style={{ borderColor: isExpanded ? col.color : undefined }}>

                  <div className="p-3.5 flex items-center justify-between cursor-pointer" onClick={() => toggleCard(item.id)}>
                    <div className="flex items-center gap-2 min-w-0">
                      {isExpanded ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />}
                      <div className="w-6 h-6 rounded flex items-center justify-center text-white shrink-0" style={{ backgroundColor: col.color }}>
                        <Layout size={12} strokeWidth={2.5} />
                      </div>
                      <span className="text-[13px] font-bold text-gray-800 truncate">{safeRender(item.title)}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.time && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold"
                              style={{ color: col.color, backgroundColor: col.lightBg, border: `1px solid ${col.color}30` }}>
                          {safeRender(item.time)}
                        </span>
                      )}
                      <MoreVertical size={14} className="text-gray-300" />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <div className="border-t border-gray-100 mb-4"></div>

                      {item.objective && (
                        <div className="mb-4">
                          <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
                            <Target size={14} />
                            <span className="text-xs font-bold">教学目标</span>
                          </div>
                          <p className="text-[12px] text-gray-600 pl-5">{safeRender(item.objective)}</p>
                        </div>
                      )}

                      {item.activity && (
                        <div className="mb-4">
                          <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
                            <FileText size={14} />
                            <span className="text-xs font-bold">活动概述</span>
                          </div>
                          <p className="text-[12px] text-gray-600 pl-5 mb-2">{safeRender(item.activity)}</p>

                          <div className="pl-5 grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[11px] font-bold text-gray-500 block mb-1">活动流程</span>
                              <span className="text-[12px] text-gray-600">{safeRender(item.activity)}</span>
                            </div>
                            <div>
                              <span className="text-[11px] font-bold text-gray-500 block mb-1">教学资源</span>
                              <span className="text-[12px] text-gray-600">
                                {item.assets && item.assets.length > 0
                                  ? item.assets.map(a => safeRender(a.title)).join('、')
                                  : '暂无'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {item.script && (
                        <div className="mb-4">
                          <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
                            <Compass size={14} />
                            <span className="text-xs font-bold">情境创设</span>
                          </div>
                          <p className="text-[12px] text-gray-600 pl-5">{safeRender(item.script)}</p>
                        </div>
                      )}

                      {item.script && (
                        <div className="relative p-3.5 rounded-xl mt-2 overflow-hidden" style={{ backgroundColor: col.lightBg }}>
                          <span className="absolute right-2 bottom-[-10px] text-[70px] font-serif leading-none" style={{ color: `${col.color}15` }}>"</span>
                          <div className="flex items-center gap-1.5 mb-2" style={{ color: col.color }}>
                            <MessageSquare size={14} />
                            <span className="text-xs font-bold">教师语言与引导 (Script)</span>
                          </div>
                          <p className="text-[13px] relative z-10 font-bold" style={{ color: col.color }}>
                            {safeRender(item.script)}
                          </p>
                        </div>
                      )}

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
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

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
    const displayTitle = courseData?.title || '';
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
          <LessonPlanBoard courseData={courseData} />
        </div>
      </main>
    </div>
  );
};

export default LessonPlanPage;
