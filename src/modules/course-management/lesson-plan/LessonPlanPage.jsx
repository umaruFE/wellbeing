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
  AlertCircle,
  Check,
  X
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

const LessonPlanBoard = ({ courseData, onCourseDataUpdate }) => {
  const [expandedItems, setExpandedItems] = useState({});
  const [openMenuPhase, setOpenMenuPhase] = useState(null);
  const [regeneratingPhase, setRegeneratingPhase] = useState(null);
  const [openMenuStep, setOpenMenuStep] = useState(null);
  const [regeneratingStep, setRegeneratingStep] = useState(null);
  const [editingStep, setEditingStep] = useState(null);
  const [editForm, setEditForm] = useState({});

  const startEdit = (item) => {
    setEditingStep(item.id);
    setEditForm({
      title: item.title || '',
      time: item.time || '',
      objective: item.objective || '',
      activity: item.activity || '',
      script: item.script || '',
    });
  };

  const cancelEdit = () => {
    setEditingStep(null);
    setEditForm({});
  };

  const saveEdit = (phaseKey, stepId) => {
    const coursePhases = resolveCoursePhases();
    const phase = coursePhases?.[phaseKey];
    if (!phase?.steps) return;
    const newSteps = phase.steps.map(s => {
      if (s.id !== stepId) return s;
      return { ...s, ...editForm };
    });
    updatePhaseSteps(phaseKey, newSteps);
    setEditingStep(null);
    setEditForm({});
  };

  useEffect(() => {
    if (!openMenuPhase && !openMenuStep) return;
    const close = () => { setOpenMenuPhase(null); setOpenMenuStep(null); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenuPhase, openMenuStep]);

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

  const resolveCoursePhases = () => {
    let inner = courseData?.course_data;
    if (typeof inner === 'string') {
      try { inner = JSON.parse(inner); } catch { inner = null; }
    }
    if (inner?.text?.courseData) return inner.text.courseData;
    if (inner?.courseData) return inner.courseData;
    if (inner?.engage || inner?.empower || inner?.execute || inner?.elevate) return inner;
    return null;
  };

  const updatePhaseSteps = (phaseKey, newSteps) => {
    const newCourseData = { ...courseData };
    let innerData = newCourseData.course_data;
    if (typeof innerData === 'string') {
      try { innerData = JSON.parse(innerData); } catch { innerData = {}; }
    }
    let target = innerData;
    if (target?.text?.courseData) target = target.text.courseData;
    else if (target?.courseData) target = target.courseData;

    if (target && target[phaseKey]) {
      target[phaseKey].steps = newSteps;
      if (typeof newCourseData.course_data === 'string') {
        newCourseData.course_data = JSON.stringify(innerData);
      } else {
        newCourseData.course_data = innerData;
      }
      if (onCourseDataUpdate) onCourseDataUpdate(newCourseData);
    }
  };

  const handleRegeneratePhase = async (phaseKey) => {
    setOpenMenuPhase(null);
    setRegeneratingPhase(phaseKey);

    try {
      const coursePhases = resolveCoursePhases();

      const response = await fetch('/api/ai/regenerate-phase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phaseKey,
          title: courseData?.title || '',
          age: courseData?.age_group || '7-9岁',
          duration: courseData?.duration || '60分钟',
          scale: courseData?.unit || '',
          vocabulary: courseData?.keywords || [],
          grammar: [],
          theme: courseData?.theme || '',
          currentCourseData: coursePhases,
        })
      });

      const result = await response.json();

      if (result.success && result.data?.steps) {
        updatePhaseSteps(phaseKey, result.data.steps);
      }
    } catch (err) {
      console.error('重新生成失败:', err);
    } finally {
      setRegeneratingPhase(null);
    }
  };

  const [addingStepPhase, setAddingStepPhase] = useState(null);

  const handleAddStep = async (phaseKey) => {
    setAddingStepPhase(phaseKey);

    try {
      const coursePhases = resolveCoursePhases();
      const phase = coursePhases?.[phaseKey];
      const currentSteps = phase?.steps || [];

      const otherPhases = {};
      if (coursePhases) {
        for (const [key, value] of Object.entries(coursePhases)) {
          if (key !== phaseKey && key !== 'courseOverview' && value?.steps) {
            otherPhases[key] = { title: value.title, steps: value.steps };
          }
        }
      }

      const response = await fetch('/api/ai/generate-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phaseKey,
          title: courseData?.title || '',
          age: courseData?.age_group || '7-9岁',
          duration: courseData?.duration || '60分钟',
          scale: courseData?.unit || '',
          vocabulary: courseData?.keywords || [],
          grammar: [],
          theme: courseData?.theme || '',
          existingStepCount: currentSteps.length,
          currentSteps: currentSteps.map(s => ({ title: s.title, time: s.time })),
          otherPhases,
        })
      });

      const result = await response.json();

      if (result.success && result.data?.step) {
        updatePhaseSteps(phaseKey, [...currentSteps, result.data.step]);
      }
    } catch (err) {
      console.error('添加环节失败:', err);
    } finally {
      setAddingStepPhase(null);
    }
  };

  const handleRegenerateStep = async (phaseKey, stepId) => {
    setOpenMenuStep(null);
    setRegeneratingStep(stepId);

    try {
      const coursePhases = resolveCoursePhases();
      const phase = coursePhases?.[phaseKey];
      const currentSteps = phase?.steps || [];

      const currentStep = currentSteps.find(s => s.id === stepId);
      const siblingSteps = currentSteps.filter(s => s.id !== stepId);

      const otherPhases = {};
      if (coursePhases) {
        for (const [key, value] of Object.entries(coursePhases)) {
          if (key !== phaseKey && key !== 'courseOverview' && value?.steps) {
            otherPhases[key] = { title: value.title, steps: value.steps };
          }
        }
      }

      const response = await fetch('/api/ai/regenerate-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phaseKey,
          stepId,
          title: courseData?.title || '',
          age: courseData?.age_group || '7-9岁',
          duration: courseData?.duration || '60分钟',
          scale: courseData?.unit || '',
          vocabulary: courseData?.keywords || [],
          grammar: [],
          theme: courseData?.theme || '',
          currentStep: currentStep ? { id: currentStep.id, title: currentStep.title, time: currentStep.time, objective: currentStep.objective } : null,
          siblingSteps: siblingSteps.map(s => ({ title: s.title, time: s.time })),
          otherPhases,
        })
      });

      const result = await response.json();

      if (result.success && result.data?.step) {
        const newSteps = currentSteps.map(s => s.id === stepId ? result.data.step : s);
        updatePhaseSteps(phaseKey, newSteps);
      }
    } catch (err) {
      console.error('重新生成步骤失败:', err);
    } finally {
      setRegeneratingStep(null);
    }
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
            <div className="flex items-center gap-2 relative">
              {col.time && (
                <div className="flex items-center gap-1 text-[11px] opacity-90">
                  <Clock size={13} /> {col.time}
                </div>
              )}
              {regeneratingPhase === col.id ? (
                <div className="flex items-center gap-1 text-[11px] opacity-90">
                  <RefreshCw size={14} className="animate-spin" /> 生成中...
                </div>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuPhase(openMenuPhase === col.id ? null : col.id);
                  }}
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                >
                  <MoreVertical size={16} className="opacity-80" />
                </button>
              )}
              {openMenuPhase === col.id && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 min-w-[140px]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRegeneratePhase(col.id);
                    }}
                    className="w-full px-3 py-2 text-left text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <RefreshCw size={13} className="text-gray-400" />
                    重新生成
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto bg-white flex flex-col gap-3">

            <button
              onClick={() => handleAddStep(col.id)}
              disabled={addingStepPhase === col.id}
              className="w-full py-3 border-[1.5px] border-dashed border-gray-200 text-gray-400 rounded-xl text-[13px] font-medium flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addingStepPhase === col.id ? (
                <><RefreshCw size={16} className="animate-spin" /> AI 生成中...</>
              ) : (
                <><Plus size={16} /> 添加环节</>
              )}
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
                      {regeneratingStep === item.id ? (
                        <RefreshCw size={14} className="text-gray-400 animate-spin" />
                      ) : (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuStep(openMenuStep === item.id ? null : item.id);
                            }}
                            className="p-0.5 rounded hover:bg-gray-100 transition-colors"
                          >
                            <MoreVertical size={14} className="text-gray-300" />
                          </button>
                          {openMenuStep === item.id && (
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 min-w-[140px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRegenerateStep(col.id, item.id);
                                }}
                                className="w-full px-3 py-2 text-left text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                              >
                                <RefreshCw size={13} className="text-gray-400" />
                                重新生成
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <div className="border-t border-gray-100 mb-4"></div>

                      {editingStep === item.id ? (
                        <div className="flex flex-col gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 block mb-1">环节标题</label>
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 block mb-1">时长</label>
                            <input
                              type="text"
                              value={editForm.time}
                              onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-blue-400"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 block mb-1">教学目标</label>
                            <textarea
                              rows={2}
                              value={editForm.objective}
                              onChange={e => setEditForm(f => ({ ...f, objective: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-blue-400 resize-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 block mb-1">活动概述</label>
                            <textarea
                              rows={3}
                              value={editForm.activity}
                              onChange={e => setEditForm(f => ({ ...f, activity: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-blue-400 resize-none"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-gray-500 block mb-1">教师讲稿 (Script)</label>
                            <textarea
                              rows={5}
                              value={editForm.script}
                              onChange={e => setEditForm(f => ({ ...f, script: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[12px] focus:outline-none focus:border-blue-400 resize-none"
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={() => saveEdit(col.id, item.id)}
                              className="flex-1 py-1.5 rounded-lg text-white text-[12px] font-bold flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
                              style={{ backgroundColor: col.color }}
                            >
                              <Check size={13} /> 保存
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="flex-1 py-1.5 border border-gray-200 rounded-lg text-gray-600 text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50"
                            >
                              <X size={13} /> 取消
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
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
                            <button
                              onClick={() => startEdit(item)}
                              className="flex-1 py-1.5 border border-gray-200 rounded-lg text-gray-600 text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50"
                            >
                              <Edit3 size={13} /> 编辑
                            </button>
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuStep(openMenuStep === item.id ? null : item.id);
                                }}
                                className="py-1.5 px-2 border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-50 transition-colors"
                              >
                                {regeneratingStep === item.id ? (
                                  <RefreshCw size={13} className="animate-spin" />
                                ) : (
                                  <MoreVertical size={13} />
                                )}
                              </button>
                              {openMenuStep === item.id && (
                                <div className="absolute right-0 bottom-full mb-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 min-w-[140px]">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRegenerateStep(col.id, item.id);
                                    }}
                                    className="w-full px-3 py-2 text-left text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                  >
                                    <RefreshCw size={13} className="text-gray-400" />
                                    重新生成
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
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
          <LessonPlanBoard courseData={courseData} onCourseDataUpdate={setCourseData} />
        </div>
      </main>
    </div>
  );
};

export default LessonPlanPage;
