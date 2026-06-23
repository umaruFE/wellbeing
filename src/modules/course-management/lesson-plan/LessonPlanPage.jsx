import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  RefreshCw,
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
  Trash2,
  Loader2,
  BookOpen,
  Edit3,
  X,
} from 'lucide-react';
import { useCourseLayout } from '../../../components/CourseLayout';
import { useAuth } from '../../../contexts/AuthContext';
import apiService from '../../../services/api';
import { AdjustStepModal } from '../../../figma-restore/course-workflow/lesson-design/AdjustStepModal';
import { EditStepModal } from '../../../figma-restore/course-workflow/lesson-design/EditStepModal';
import { StepDetailModal } from '../../../figma-restore/course-workflow/lesson-design/StepDetailModal';
import '../../../figma-restore/course-workflow/CourseWorkflow.css';
import bgCourseMap from '../../../assets/course-map/bg-map.png';
import stepOneImage from '../../../assets/course-map/step-1.png';
import stepTwoImage from '../../../assets/course-map/step-2.png';
import stepThreeImage from '../../../assets/course-map/step-3.png';
import stepFourImage from '../../../assets/course-map/step-4.png';
import iconStepOne from '../../../assets/course-map/icon-step-1.png';
import iconStepTwo from '../../../assets/course-map/icon-step-2.png';
import iconStepThree from '../../../assets/course-map/icon-step-3.png';
import iconStepFour from '../../../assets/course-map/icon-step-4.png';

const colors = {
  neutral: {
    white: '#FFFFFF',
    text: { 1: '#333E4E', 2: '#575F6E', 3: '#818997', disabled: '#A4ABB8' },
    border: { DEFAULT: '#E6E3DE', secondary: '#EFECE8' },
    bg: { layout: '#F7F5F1' },
    fill: { gray1: '#FCFBF9' },
  },
  brand: { DEFAULT: '#F4785E', light: '#FDECE8' },
  info: { DEFAULT: '#4482E5' },
  success: { DEFAULT: '#509F69' },
  purple: { DEFAULT: '#9E64E8' },
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
  engage: { labelKey: 'lesson.phaseEngage', color: colors.purple.DEFAULT, lightBg: '#F5F0FF' },
  empower: { labelKey: 'lesson.phaseEmpower', color: colors.info.DEFAULT, lightBg: '#F0F8FF' },
  execute: { labelKey: 'lesson.phaseExecute', color: colors.success.DEFAULT, lightBg: '#EBF7EE' },
  elevate: { labelKey: 'lesson.phaseElevate', color: colors.brand.DEFAULT, lightBg: '#FDECE8' },
};

const PHASE_ORDER = ['engage', 'empower', 'execute', 'elevate'];
const PHASE_DURATION_LIMIT = 15;

const MAP_PHASE_META = {
  engage: {
    number: '1',
    className: 'engage',
    stepImage: stepOneImage,
    iconImage: iconStepOne,
    icon: 'sparkle',
    tone: '#e8d2df',
    shortTitle: 'E-ENGAGE 引入',
    summary: '通过沉浸式情境激发学习兴趣，建立学习动机',
    position: { left: '20.59%', top: '25.63%' },
  },
  empower: {
    number: '2',
    className: 'empower',
    stepImage: stepTwoImage,
    iconImage: iconStepTwo,
    icon: 'book',
    tone: '#d8ca8d',
    shortTitle: 'E-EMPOWER 赋能',
    summary: '高频互动输入目标词汇，建立听觉-视觉-动觉三重联结',
    position: { left: '49.07%', top: '34.65%' },
  },
  execute: {
    number: '3',
    className: 'execute',
    stepImage: stepThreeImage,
    iconImage: iconStepThree,
    icon: 'checklist',
    tone: '#d9dde9',
    shortTitle: 'E-EXECUTE 实践',
    summary: '在真实任务驱动下综合运用方位介词与句型进行表达',
    position: { left: '34.97%', top: '63.15%' },
  },
  elevate: {
    number: '4',
    className: 'elevate',
    stepImage: stepFourImage,
    iconImage: iconStepFour,
    icon: 'trophy',
    tone: '#cbb8a8',
    shortTitle: 'E-ELEVATE 升华',
    summary: '分享学习成果，反思收获，培养跨文化意识',
    position: { left: '66.00%', top: '68.00%' },
  },
};

const PHASE_DETAIL_DATA = {
  engage: {
    title: 'E-Engage · 引入',
    goal: '通过沉浸式情境激发学生对动物星球的好奇心，建立学习动机',
    lang: "核心词汇：animal, where, in, on, under; 核心句型：Where is the...? It's...",
    sel: '社会情感学习：好奇心、探索欲、团队协作意识',
    perma: 'Positive Emotion（积极情绪）：通过情境创设激发兴奋和期待感',
    narrative: '学生们化身为宇飞船控制台员，接收到来自动物星球的求救信号，需要前往救援。在旅途中，他们将学习如何用英语描述动物的位置。',
    color: 'var(--eng)',
  },
  empower: {
    title: 'E-Empower · 赋能',
    goal: '高频互动输入目标词汇，建立听觉-视觉-动觉三重联结',
    lang: '强化目标词汇发音和理解，通过TPR全身反应法巩固记忆',
    sel: '专注力、听觉辨识能力、动作协调与表达',
    perma: 'Engagement（投入）：全身心参与互动，建立学习心流体验',
    narrative: '控制台收到动物星球的地图解码任务，学生们需要学会用英语理解指令才能解锁前进路线。',
    color: 'var(--emp)',
  },
  execute: {
    title: 'E-Execute · 实践',
    goal: '在真实任务驱动下综合运用方位介词与句型进行表达',
    lang: '在实际情境中运用目标语言进行交际，完成任务',
    sel: '合作学习、问题解决、创造性思维、团队协作',
    perma: 'Accomplishment（成就感）：完成任务获得成就感，建立自信',
    narrative: '终于到达动物星球！学生们分组建造动物家园，需要用英语描述每个动物的位置，帮助它们安家。',
    color: 'var(--exc)',
  },
  elevate: {
    title: 'E-Elevate · 升华',
    goal: '分享学习成果，反思收获，培养跨文化意识',
    lang: '展示学习成果，自信表达，完成学习闭环',
    sel: '自我反思、自信表达、感恩之心、分享精神',
    perma: 'Relationships（人际关系）：与同伴分享快乐，建立友谊',
    narrative: '任务完成！学生们展示自己的动物家园，向星际联盟汇报救援成果，带着满满的收获返回地球。',
    color: 'var(--elv)',
  },
};

const parseMinutes = (value) => {
  const match = String(value || '').match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

const normalizeStep = (step) => ({
  ...step,
  goal: step.goal ?? '',
  flow: step.flow ?? '',
  teacherScript: step.teacherScript ?? '',
  resources: step.resources ?? '',
});

const LessonPlanBoard = ({ courseData, courseId, onCourseDataUpdate }) => {
  const { t, i18n } = useTranslation();
  const isChinese = !i18n.language?.startsWith('en');
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('map');
  const [activeMapPhase, setActiveMapPhase] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});
  const [openMenuPhase, setOpenMenuPhase] = useState(null);
  const [regeneratingPhase, setRegeneratingPhase] = useState(null);
  const [openMenuStep, setOpenMenuStep] = useState(null);
  const [regeneratingStep, setRegeneratingStep] = useState(null);
  const [addingStepPhase, setAddingStepPhase] = useState(null);

  const [editTarget, setEditTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [phaseDetail, setPhaseDetail] = useState(null);
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [adjustText, setAdjustText] = useState('');
  const [adjustChips, setAdjustChips] = useState([]);

  useEffect(() => {
    if (!openMenuPhase && !openMenuStep) return;
    const close = () => { setOpenMenuPhase(null); setOpenMenuStep(null); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMenuPhase, openMenuStep]);

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

  const boardColumns = useMemo(() => {
    const coursePhases = resolveCoursePhases();
    if (!coursePhases) return [];

    return PHASE_ORDER.map((phaseKey) => {
      const phase = coursePhases[phaseKey];
      const config = PHASE_CONFIG[phaseKey];
      const steps = Array.isArray(phase?.steps) ? phase.steps.map(normalizeStep) : [];
      const totalMinutes = steps.reduce((acc, s) => acc + parseMinutes(s.duration), 0);
      const overflowMinutes = Math.max(0, totalMinutes - PHASE_DURATION_LIMIT);

      return {
        id: phaseKey,
        title: phase?.title || t(config.labelKey),
        color: config.color,
        lightBg: config.lightBg,
        goalSummary: steps.map((s) => s.goal).filter(Boolean).join('；') || '',
        count: steps.length,
        minutes: totalMinutes,
        overflowMinutes,
        time: steps.length > 0 ? totalMinutes + t('course.minutes') : '',
        items: steps.map((step) => ({
          id: step.id,
          title: step.title,
          duration: step.duration,
          goal: step.goal,
          activity: step.activity,
          flow: step.flow,
          resources: step.resources,
          scenario: step.scenario,
          teacherScript: step.teacherScript,
        })),
      };
    });
  }, [courseData]);

  const toggleCard = (itemId) => {
    setExpandedItems((prev) => ({ ...prev, [itemId]: !prev[itemId] }));
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
      onCourseDataUpdate?.(newCourseData);

      if (courseId) {
        apiService.updateCourse(courseId, {
          courseData: newCourseData.course_data,
          userId: user?.id || courseData?.user_id || null,
          organizationId: user?.organizationId || user?.organization_id || courseData?.organization_id || null,
        }).catch((err) => console.error('自动保存失败:', err));
      }
    }
  };

  const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    const token = localStorage.getItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const buildBasePayload = () => ({
    language: isChinese ? 'zh' : 'en',
    outputLanguage: isChinese ? 'Chinese' : 'English',
    title: courseData?.title || '',
    age: courseData?.age_group || '7-9',
    duration: courseData?.duration || '60',
    scale: courseData?.unit || '',
    vocabulary: courseData?.keywords || [],
    grammar: [],
    theme: courseData?.theme || '',
    userId: user?.id || courseData?.user_id || null,
    organizationId: user?.organizationId || user?.organization_id || courseData?.organization_id || null,
  });

  const handleRegeneratePhase = async (phaseKey) => {
    setOpenMenuPhase(null);
    setRegeneratingPhase(phaseKey);
    try {
      const coursePhases = resolveCoursePhases();
      const response = await fetch('/api/ai/regenerate-phase', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...buildBasePayload(),
          phaseKey,
          currentCourseData: coursePhases,
        }),
      });
      const result = await response.json();
      if (result.success && result.data?.steps) {
        updatePhaseSteps(phaseKey, result.data.steps);
      }
    } catch (err) {
      console.error('重新生成阶段失败:', err);
    } finally {
      setRegeneratingPhase(null);
    }
  };

  const handleAddStep = async (phaseKey, insertIndex) => {
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
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...buildBasePayload(),
          phaseKey,
          existingStepCount: currentSteps.length,
          currentSteps: currentSteps.map((s) => ({ title: s.title, duration: s.duration, goal: s.goal })),
          otherPhases,
          insertIndex: insertIndex != null ? insertIndex : currentSteps.length,
          prevStep: insertIndex != null && insertIndex > 0 ? currentSteps[insertIndex - 1] : null,
          nextStep: insertIndex != null && insertIndex < currentSteps.length ? currentSteps[insertIndex] : null,
        }),
      });
      const result = await response.json();

      if (result.success && result.data?.step) {
        const idx = insertIndex != null ? insertIndex : currentSteps.length;
        const newSteps = [...currentSteps];
        newSteps.splice(idx, 0, result.data.step);
        updatePhaseSteps(phaseKey, newSteps);
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
      const currentStep = currentSteps.find((s) => s.id === stepId);
      const siblingSteps = currentSteps.filter((s) => s.id !== stepId);

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
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...buildBasePayload(),
          phaseKey,
          stepId,
          currentStep: currentStep
            ? { id: currentStep.id, title: currentStep.title, duration: currentStep.duration, goal: currentStep.goal }
            : null,
          siblingSteps: siblingSteps.map((s) => ({ title: s.title, duration: s.duration })),
          otherPhases,
        }),
      });
      const result = await response.json();

      if (result.success && result.data?.step) {
        const newSteps = currentSteps.map((s) => (s.id === stepId ? result.data.step : s));
        updatePhaseSteps(phaseKey, newSteps);
      }
    } catch (err) {
      console.error('重新生成步骤失败:', err);
    } finally {
      setRegeneratingStep(null);
    }
  };

  const handleDeleteStep = (phaseKey, stepId) => {
    const coursePhases = resolveCoursePhases();
    const phase = coursePhases?.[phaseKey];
    if (!phase) return;
    const newSteps = (phase.steps || []).filter((s) => s.id !== stepId);
    updatePhaseSteps(phaseKey, newSteps);
    setOpenMenuStep(null);
  };

  const openAdjust = (phaseKey, stepIndex, step) => {
    const phase = boardColumns.find((c) => c.id === phaseKey);
    setAdjustTarget({ phaseKey, stepIndex, step, phase });
    setAdjustText('');
    setAdjustChips([]);
    setOpenMenuStep(null);
  };

  const confirmAdjust = async () => {
    if (!adjustTarget || !adjustText.trim()) return;
    const { phaseKey, stepIndex, step } = adjustTarget;
    setAdjustTarget(null);

    const coursePhases = resolveCoursePhases();
    const phase = coursePhases?.[phaseKey];
    const currentSteps = phase?.steps || [];

    setRegeneratingStep(step.id);
    try {
      const response = await fetch('/api/ai/adjust-step', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...buildBasePayload(),
          phaseKey,
          stepId: step.id,
          currentStep: normalizeStep(step),
          adjustment: adjustText.trim(),
          adjustmentTags: adjustChips,
          siblingSteps: currentSteps.map((s) => ({ title: s.title, duration: s.duration })),
        }),
      });
      const result = await response.json();

      if (result.success && result.data?.step) {
        const newSteps = currentSteps.map((s, i) => (i === stepIndex ? result.data.step : s));
        updatePhaseSteps(phaseKey, newSteps);
      }
    } catch (err) {
      console.error('调整环节失败:', err);
    } finally {
      setRegeneratingStep(null);
      setAdjustText('');
      setAdjustChips([]);
    }
  };

  const openEdit = (phaseKey, stepIndex, step) => {
    setEditTarget({ phaseKey, stepIndex, step: normalizeStep(step) });
    setOpenMenuStep(null);
  };

  const saveEdit = (updatedStep) => {
    if (!editTarget) return;
    const { phaseKey, stepIndex } = editTarget;
    const coursePhases = resolveCoursePhases();
    const phase = coursePhases?.[phaseKey];
    if (!phase?.steps) return;
    const newSteps = phase.steps.map((s, i) => (i === stepIndex ? updatedStep : s));
    updatePhaseSteps(phaseKey, newSteps);
    setEditTarget(null);
  };

  const openDetail = (phaseKey, stepIndex, step) => {
    const phase = boardColumns.find((c) => c.id === phaseKey);
    setDetailTarget({ phaseKey, stepIndex, step: normalizeStep(step), phase });
    setOpenMenuStep(null);
  };

  const openPhaseDetail = (phaseKey) => {
    setOpenMenuPhase(null);
    setPhaseDetail(PHASE_DETAIL_DATA[phaseKey] || null);
  };

  const getPhaseDisplay = (col) => {
    const meta = MAP_PHASE_META[col.id] || {};
    const title = safeRender(col.title || meta.shortTitle);
    const match = String(title).match(/^(E-[A-Z]+)\s*(.*)$/);
    return {
      code: match?.[1] || title,
      name: match?.[2] || '',
      title: title || meta.shortTitle,
      summary: safeRender(col.goalSummary || meta.summary),
    };
  };

  const renderMapIcon = (icon) => {
    if (icon === 'book') return <BookOpen size={28} />;
    if (icon === 'checklist') return <FileText size={28} />;
    if (icon === 'trophy') return <span className="lesson-map-card-emoji" aria-hidden="true">☆</span>;
    return <span className="lesson-map-card-emoji" aria-hidden="true">✦</span>;
  };

  const renderHeader = () => (
    <div className="lesson-design-page-header lesson-plan-mode-header">
      <div className="lesson-design-title-row">
        <h2 className="lesson-design-page-title">{t('lesson.title')}|Course Map</h2>
        <div className="lesson-design-view-switch" role="group" aria-label={t('lesson.title')}>
          <button type="button" className={viewMode === 'map' ? 'active' : ''} onClick={() => setViewMode('map')}>
            {t('workflow.lesson.mapMode')}
          </button>
          <button type="button" className={viewMode === 'overview' ? 'active' : ''} onClick={() => setViewMode('overview')}>
            {t('workflow.lesson.overviewMode')}
          </button>
        </div>
        <span className="lesson-design-plane" aria-hidden="true">✈</span>
      </div>
    </div>
  );

  const renderOverviewBoard = () => (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-140px)] min-h-[600px]">
      {boardColumns.map((col) => (
        <div key={col.id} className="flex flex-col bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">

          <div className="p-4 flex items-start justify-between text-white shrink-0" style={{ backgroundColor: col.color }}>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[15px] uppercase tracking-wide">{safeRender(col.title)}</h3>
              <p className="text-[11px] opacity-80 mt-1">{t('lesson.stepsCount', { count: col.count })}</p>
            </div>
            <div className="flex items-center gap-2 relative">
              {col.time && (
                <div className={`flex items-center gap-1 text-[11px] ${col.minutes > PHASE_DURATION_LIMIT ? 'text-red-500 opacity-100' : 'opacity-90'}`}>
                  <Clock size={13} /> {col.time}
                </div>
              )}
              {regeneratingPhase === col.id ? (
                <div className="flex items-center gap-1 text-[11px] opacity-90">
                  <RefreshCw size={14} className="animate-spin" /> {t('common.generating')}
                </div>
              ) : (
                <button
                  title={t('lesson.viewPhaseDetail')}
                  aria-label={t('lesson.viewPhaseDetail')}
                  onClick={(e) => { e.stopPropagation(); openPhaseDetail(col.id); }}
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                >
                  <BookOpen size={16} className="opacity-90" />
                </button>
              )}
              {openMenuPhase === col.id && (
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 min-w-[140px]">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRegeneratePhase(col.id); }}
                    className="w-full px-3 py-2 text-left text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <RefreshCw size={13} className="text-gray-400" />
                    {t('common.regenerate')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {col.overflowMinutes > 0 && (
            <div className="mx-4 mt-3 px-3 py-2 rounded-lg border-2 border-[#f6bd60] bg-[#fff9e8] text-[#a95518] text-[12px] font-normal leading-[18px] flex items-center gap-2 shrink-0 whitespace-normal">
              <span className="w-4 h-4 rounded-full border-2 border-current inline-flex items-center justify-center text-[11px] leading-none shrink-0">!</span>
              <span className="min-w-0">
                {t('lesson.overflowWarn', { current: col.minutes, limit: PHASE_DURATION_LIMIT, overflow: col.overflowMinutes })}
              </span>
            </div>
          )}

          {col.goalSummary && (
            <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 shrink-0 h-24 overflow-y-auto">
              <p className="text-[11px] text-gray-600 leading-relaxed">{col.goalSummary}</p>
            </div>
          )}

          <div className="p-4 flex-1 overflow-y-auto bg-white flex flex-col gap-1">
            {col.items.map((item, index) => {
              const isExpanded = !!expandedItems[item.id];
              return (
                <React.Fragment key={item.id}>
                  <button
                    onClick={() => handleAddStep(col.id, index)}
                    disabled={addingStepPhase === col.id}
                    className="w-full py-1 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group/insert"
                  >
                    <div className="flex items-center gap-2 opacity-0 group-hover/insert:opacity-100 transition-opacity">
                      <div className="flex-1 h-px bg-gray-200" />
                      <Plus size={12} />
                      <span className="text-[10px] font-medium">{t('lesson.insertStep')}</span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  </button>
                  <div
                    className={`bg-white rounded-xl transition-all ${isExpanded ? 'border-[1.5px] shadow-sm' : 'border border-gray-100 hover:border-gray-200'}`}
                    style={{ borderColor: isExpanded ? col.color : undefined }}
                  >
                    <div className="p-3.5 flex items-center justify-between cursor-pointer" onClick={() => toggleCard(item.id)}>
                      <div className="flex items-center gap-2 min-w-0">
                        {isExpanded
                          ? <ChevronDown size={16} className="text-gray-400 shrink-0" />
                          : <ChevronRight size={16} className="text-gray-400 shrink-0" />}
                        <div className="w-6 h-6 rounded flex items-center justify-center text-white shrink-0" style={{ backgroundColor: col.color }}>
                          <Layout size={12} strokeWidth={2.5} />
                        </div>
                        <span className="text-[13px] font-bold text-gray-800 truncate">{safeRender(item.title)}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {item.duration && (
                          <span
                            className="px-2 py-0.5 rounded text-[11px] font-bold"
                            style={{ color: col.color, backgroundColor: col.lightBg, border: `1px solid ${col.color}30` }}
                          >
                            {safeRender(item.duration)}
                          </span>
                        )}
                        {regeneratingStep === item.id ? (
                          <RefreshCw size={14} className="text-gray-400 animate-spin" />
                        ) : (
                          <div className="relative">
                            <button
                              onClick={(e) => { e.stopPropagation(); setOpenMenuStep(openMenuStep === item.id ? null : item.id); }}
                              className="p-0.5 rounded hover:bg-gray-100 transition-colors"
                            >
                              <MoreVertical size={14} className="text-gray-300" />
                            </button>
                            {openMenuStep === item.id && (
                              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 min-w-[220px]">
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRegenerateStep(col.id, item.id); }}
                                  className="w-full px-3 py-2 text-left text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors whitespace-nowrap"
                                >
                                  <RefreshCw size={13} className="text-gray-400" /> {t('common.regenerate')}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setOpenMenuStep(null); handleAddStep(col.id, index); }}
                                  className="w-full px-3 py-2 text-left text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors whitespace-nowrap"
                                >
                                  <Plus size={13} className="text-gray-400" /> {t('lesson.insertBefore')}
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteStep(col.id, item.id); }}
                                  className="w-full px-3 py-2 text-left text-[12px] text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors whitespace-nowrap"
                                >
                                  <Trash2 size={13} /> {t('common.delete')}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-4 pb-4">
                        <div className="border-t border-gray-100 mb-4" />

                        {item.goal && (
                          <div className="mb-4">
                            <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
                              <Target size={14} />
                              <span className="text-xs font-bold">{t('lesson.stepGoal')}</span>
                            </div>
                            <p className="text-[12px] text-gray-600 pl-5">{safeRender(item.goal)}</p>
                          </div>
                        )}

                        {item.activity && (
                          <div className="mb-4">
                            <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
                              <FileText size={14} />
                              <span className="text-xs font-bold">{t('lesson.activitySummary')}</span>
                            </div>
                            <p className="text-[12px] text-gray-600 pl-5 mb-2">{safeRender(item.activity)}</p>
                            <div className="pl-5 grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-[11px] font-bold text-gray-500 block mb-1">{t('lesson.activityFlow')}</span>
                                <span className="text-[12px] text-gray-600">{safeRender(item.flow || item.activity)}</span>
                              </div>
                              <div>
                                <span className="text-[11px] font-bold text-gray-500 block mb-1">{t('lesson.teachingResource')}</span>
                                <span className="text-[12px] text-gray-600">
                                  {item.resources || t('common.none')}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {(item.scenario || item.teacherScript) && (
                          <div className="mb-4">
                            <div className="flex items-center gap-1.5 text-gray-500 mb-1.5">
                              <Compass size={14} />
                              <span className="text-xs font-bold">{t('lesson.scenario')}</span>
                            </div>
                            <p className="text-[12px] text-gray-600 pl-5">{safeRender(item.scenario || item.teacherScript)}</p>
                          </div>
                        )}

                        {item.teacherScript && (
                          <div className="relative p-3.5 rounded-xl mt-2 overflow-hidden" style={{ backgroundColor: col.lightBg }}>
                            <span className="absolute right-2 bottom-[-10px] text-[70px] font-serif leading-none" style={{ color: `${col.color}15` }}>"</span>
                            <div className="flex items-center gap-1.5 mb-2" style={{ color: col.color }}>
                              <MessageSquare size={14} />
                              <span className="text-xs font-bold">{t('lesson.teacherScript')}</span>
                            </div>
                            <p className="text-[13px] relative z-10 font-bold" style={{ color: col.color }}>
                              {safeRender(item.teacherScript)}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                          <button
                            onClick={() => openDetail(col.id, index, item)}
                            className="flex-1 py-1.5 border border-gray-200 rounded-lg text-gray-600 text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50"
                          >
                            <BookOpen size={13} /> {t('lesson.detail')}
                          </button>
                          <button
                            onClick={() => openEdit(col.id, index, item)}
                            className="flex-1 py-1.5 border border-gray-200 rounded-lg text-gray-600 text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50"
                          >
                            <Edit3 size={13} /> {t('common.edit')}
                          </button>
                          <button
                            onClick={() => openAdjust(col.id, index, item)}
                            className="flex-1 py-1.5 border border-gray-200 rounded-lg text-gray-600 text-[12px] font-bold flex items-center justify-center gap-1.5 hover:bg-gray-50"
                          >
                            {t('lesson.adjustParams')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  {index === col.items.length - 1 && (
                    <button
                      onClick={() => handleAddStep(col.id)}
                      disabled={addingStepPhase === col.id}
                      className="w-full py-2.5 mt-1 border-[1.5px] border-dashed border-gray-200 text-gray-400 rounded-xl text-[12px] font-medium flex items-center justify-center gap-1 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {addingStepPhase === col.id ? (
                        <><RefreshCw size={14} className="animate-spin" /> {t('lesson.generating')}</>
                      ) : (
                        <><Plus size={14} /> {t('lesson.addStep')}</>
                      )}
                    </button>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const renderMapMode = () => {
    const selected = activeMapPhase || boardColumns[0];
    const selectedMeta = MAP_PHASE_META[selected?.id] || MAP_PHASE_META.engage;
    const selectedDisplay = selected ? getPhaseDisplay(selected) : getPhaseDisplay(boardColumns[0]);

    return (
      <div className={`lesson-map-shell ${activeMapPhase ? 'drawer-open' : ''}`}>
        <div className="lesson-map-canvas" style={{ backgroundImage: `url(${bgCourseMap})` }}>
          <div className="lesson-map-art">
            {boardColumns.map((col) => {
              const meta = MAP_PHASE_META[col.id] || {};
              const display = getPhaseDisplay(col);
              return (
                <article
                  key={col.id}
                  className={`lesson-map-card ${meta.className || col.id}`}
                  style={{ left: meta.position?.left, top: meta.position?.top, '--map-card-bg': meta.tone }}
                >
                  {meta.stepImage && <img className="lesson-map-step-num" src={meta.stepImage} alt="" />}
                  <div className="lesson-map-card-main">
                    <div className="lesson-map-card-head">
                      <h3>{display.title}</h3>
                      <span className="lesson-map-card-icon">
                        {meta.iconImage ? <img src={meta.iconImage} alt="" /> : renderMapIcon(meta.icon)}
                      </span>
                    </div>
                    <p>{display.summary}</p>
                    <div className="lesson-map-card-meta">
                      <strong>{t('lesson.stepsCount', { count: col.count })}</strong>
                      {col.time && <span>{col.time}</span>}
                    </div>
                    <button type="button" className="lesson-map-detail-btn" onClick={() => setActiveMapPhase(col)}>
                      {t('imageLib.viewDetail')} <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {activeMapPhase && (
          <aside className={`lesson-map-drawer ${selectedMeta.className || selected.id}`} style={{ '--map-card-bg': selectedMeta.tone }}>
            <div className="lesson-map-drawer-head">
              <div className="lesson-map-drawer-num">{selectedMeta.number}</div>
              <div>
                <h3>{selectedDisplay.title}</h3>
                <p>{t('lesson.stepsCount', { count: selected.count })}</p>
              </div>
              {selected.time && <span className="lesson-map-time-badge">{selected.time}</span>}
              <button type="button" className="lesson-map-drawer-close" onClick={() => setActiveMapPhase(null)} aria-label={t('common.close')}>
                <X size={22} />
              </button>
            </div>
            <div className="lesson-map-drawer-add">
              <button type="button" onClick={() => handleAddStep(selected.id)} disabled={addingStepPhase === selected.id}>
                {addingStepPhase === selected.id ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                {addingStepPhase === selected.id ? t('lesson.generating') : t('lesson.addStep')}
              </button>
            </div>
            <div className="lesson-map-drawer-list">
              {selected.items.map((item, index) => {
                const isOpen = expandedItems[`drawer-${item.id}`] ?? index === 0;
                return (
                  <article className={`lesson-map-step-panel ${isOpen ? 'open' : ''}`} key={item.id}>
                    <button
                      type="button"
                      className="lesson-map-step-summary"
                      onClick={() => setExpandedItems((prev) => ({ ...prev, [`drawer-${item.id}`]: !isOpen }))}
                    >
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className="lesson-map-thumb"><Layout size={15} /></span>
                      <strong>{safeRender(item.title)}</strong>
                      {item.duration && <span className="lesson-map-time-badge">{safeRender(item.duration)}</span>}
                    </button>
                    {isOpen && (
                      <div className="lesson-map-step-body">
                        {item.goal && (
                          <section>
                            <h4><Target size={14} />{t('lesson.stepGoal')}</h4>
                            <p>{safeRender(item.goal)}</p>
                          </section>
                        )}
                        {item.activity && (
                          <section>
                            <h4><FileText size={14} />{t('lesson.activitySummary')}</h4>
                            <p>{safeRender(item.activity)}</p>
                          </section>
                        )}
                        {(item.flow || item.activity) && (
                          <section>
                            <h4><Layout size={14} />{t('lesson.activityFlow')}</h4>
                            <div className="lesson-map-flow-card">
                              {String(safeRender(item.flow || item.activity)).split(/\n|[;；]/).filter(Boolean).slice(0, 4).map((flowItem, flowIndex) => (
                                <div className="lesson-map-flow-item" key={`${item.id}-flow-${flowIndex}`}>
                                  <span />
                                  <p>{flowItem.trim()}</p>
                                </div>
                              ))}
                            </div>
                          </section>
                        )}
                        <div className="lesson-map-step-actions">
                          <button type="button" onClick={() => openDetail(selected.id, index, item)}><BookOpen size={14} />{t('lesson.detail')}</button>
                          <button type="button" onClick={() => openEdit(selected.id, index, item)}><Edit3 size={14} />{t('common.edit')}</button>
                          <button type="button" onClick={() => openAdjust(selected.id, index, item)}>{t('lesson.adjustParams')}</button>
                          <button type="button" className="icon" onClick={() => handleDeleteStep(selected.id, item.id)} aria-label={t('common.delete')}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
            <div className="lesson-map-drawer-foot">
              <button type="button" onClick={() => openPhaseDetail(selected.id)}><BookOpen size={14} />{t('lesson.viewPhaseDetail')}</button>
              <button type="button" onClick={() => handleRegeneratePhase(selected.id)} disabled={regeneratingPhase === selected.id}>
                {regeneratingPhase === selected.id ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {t('common.regenerate')}
              </button>
            </div>
          </aside>
        )}
      </div>
    );
  };

  if (boardColumns.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-gray-400">
        {t('lesson.noData')}
      </div>
    );
  }

  return (
    <>
    {renderHeader()}
    {viewMode === 'map' ? renderMapMode() : renderOverviewBoard()}
    {phaseDetail && (
      <div className="mo on" id="mo-edit-phase" onMouseDown={(event) => event.target === event.currentTarget && setPhaseDetail(null)}>
        <div className="modal phase-detail-modal">
          <div className="modal-hd">
            <div className="modal-t pem-title-wrap">
              {phaseDetail.title}
              <span className="pem-readonly-badge">{t('lesson.readonlyNote')}</span>
            </div>
            <button type="button" className="modal-x" onClick={() => setPhaseDetail(null)} aria-label={t('common.close')}>×</button>
          </div>
          <div className="modal-body">
            <div className="pem-wrap" style={{ '--pem-accent': phaseDetail.color }}>
              <div className="pem-summary">
                <div className="pem-summary-label">{t('lesson.phasePosition')}</div>
                <div className="pem-summary-text">{phaseDetail.goal}</div>
              </div>
              <div className="pem-grid">
                <div className="pem-section">
                  <div className="pem-label">{t('lesson.languageGoal')}</div>
                  <div className="pem-content">{phaseDetail.lang}</div>
                </div>
                <div className="pem-section">
                  <div className="pem-label">{t('lesson.selFocus')}</div>
                  <div className="pem-content">{phaseDetail.sel}</div>
                </div>
                <div className="pem-section">
                  <div className="pem-label">{t('lesson.permaFocus')}</div>
                  <div className="pem-content">{phaseDetail.perma}</div>
                </div>
                <div className="pem-section pem-section-narrative">
                  <div className="pem-label">{t('lesson.phaseNarrative')}</div>
                  <div className="pem-content pem-narrative">{phaseDetail.narrative}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-ft">
            <button type="button" className="mo-btn-cancel" onClick={() => setPhaseDetail(null)}>{t('common.close')}</button>
          </div>
        </div>
      </div>
    )}

    <EditStepModal
      open={!!editTarget}
      step={editTarget?.step}
      onClose={() => setEditTarget(null)}
      onSave={saveEdit}
    />

    <StepDetailModal
      open={!!detailTarget}
      step={detailTarget?.step}
      phase={detailTarget?.phase}
      onClose={() => setDetailTarget(null)}
      onEdit={() => {
        if (detailTarget) {
          openEdit(detailTarget.phaseKey, detailTarget.stepIndex, detailTarget.step);
          setDetailTarget(null);
        }
      }}
    />

    <AdjustStepModal
      open={!!adjustTarget}
      value={adjustText}
      selected={adjustChips}
      onChange={setAdjustText}
      onToggle={(chip) => setAdjustChips((prev) => prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip])}
      onClose={() => setAdjustTarget(null)}
      onConfirm={confirmAdjust}
    />
    </>
  );
};

const LessonPlanPage = () => {
  const { t } = useTranslation();
  const { courseId } = useParams();
  const { user } = useAuth();
  const { setTitle, setActions } = useCourseLayout();
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) { setLoading(false); return; }
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

    const handleSave = async () => {
      if (!courseId) return;
      setIsSaving(true);
      try {
        await apiService.updateCourse(courseId, {
          courseData,
          userId: user?.id || courseData?.user_id || null,
          organizationId: user?.organizationId || user?.organization_id || courseData?.organization_id || null,
        });
      } catch (err) {
        console.error('保存失败:', err);
      } finally {
        setIsSaving(false);
      }
    };

    const handlePublish = async () => {
      if (!courseId) return;
      setIsPublishing(true);
      try {
        await apiService.updateCourse(courseId, {
          courseData,
          status: 'published',
          userId: user?.id || courseData?.user_id || null,
          organizationId: user?.organizationId || user?.organization_id || courseData?.organization_id || null,
        });
      } catch (err) {
        console.error('发布失败:', err);
      } finally {
        setIsPublishing(false);
      }
    };

    setActions(
      <>
        <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5 mr-2">
          {isSaving ? <><Loader2 size={12} className="animate-spin" /> {t('common.saving')}</> : <><RefreshCw size={12} /> {t('common.saved')}</>}
        </span>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-1.5 rounded-lg text-[13px] font-bold border transition-colors text-white disabled:opacity-50"
          style={{ backgroundColor: '#4C5866' }}
        >
          {isSaving ? <><Loader2 size={14} className="inline animate-spin mr-1" />{t('common.saving')}</> : t('common.save')}
        </button>
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className="px-5 py-1.5 rounded-lg text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: colors.brand.DEFAULT }}
        >
          {isPublishing ? <><Loader2 size={14} className="inline animate-spin mr-1" />{t('common.publishing')}</> : t('common.publish')}
        </button>
      </>
    );
    return () => { setTitle(null); setActions(null); };
  }, [courseData, courseId, isSaving, isPublishing, setTitle, setActions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: colors.neutral.bg.layout }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: `${colors.brand.DEFAULT} transparent ${colors.brand.DEFAULT} ${colors.brand.DEFAULT}` }} />
          <p style={{ color: colors.neutral.text[2] }}>{t('common.loading')}</p>
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
          <LessonPlanBoard courseData={courseData} courseId={courseId} onCourseDataUpdate={setCourseData} />
        </div>
      </main>
    </div>
  );
};

export default LessonPlanPage;
