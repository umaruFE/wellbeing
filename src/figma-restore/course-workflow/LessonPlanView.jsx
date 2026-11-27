import React from 'react';
import { Button, Form, Input, InputNumber } from 'antd';
import { useTranslation } from 'react-i18next';
import { ContentTabPanel, ContentTabs, CreateButton, DialogCloseButton, MetadataTag } from '../../components/LibraryControls';
import { PageLoading } from '../../components/PageLoading';
import { getCourseOverview, getDisplayCourseTitle } from '../courseImages';
import apiService from '../../services/api';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Clock,
  ClipboardList,
  Route,
  Copy,
  Heart,
  Info,
  ListChecks,
  MoreVertical,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  SlidersHorizontal,
  Star,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AdjustStepModal } from './lesson-design/AdjustStepModal';
import { EditStepModal } from './lesson-design/EditStepModal';
import { StepCardActions } from './lesson-design/StepCardActions';
import { StepDetailModal } from './lesson-design/StepDetailModal';
import { matchesFavorite, useLessonCollection } from './lesson-design/useLessonCollection';
import { coursePhasePalette, phaseTemplates } from './workflowData';
import { buildStepFlowItems, composeFlowFromSteps, composeScriptFromSteps, createFlowStepsForForm, lessonText, normalizeLessonStep, parseMinutes, phaseDuration, resolveLessonPhases } from './lesson-design/lessonDesignUtils';
import { gardenHeight, gardenStops, LessonGardenMap } from './LessonGardenMap';
import './LessonMap.css';
import './LessonOverview.css';

const { TextArea } = Input;

const emptyDraft = { title: '', time: null, goal: '', activity: '', flowSteps: [], resources: '', scenario: '' };

const PHASE_DURATION_RATIO = {
  eng: 0.15,
  emp: 0.4,
  exc: 0.3,
  elv: 0.15,
};

const lessonMapMeta = {
  eng: {
    number: '1',
    className: 'engage',
    Icon: Sparkles,
    ...coursePhasePalette.engage,
  },
  emp: {
    number: '2',
    className: 'empower',
    Icon: BookOpen,
    ...coursePhasePalette.empower,
  },
  exc: {
    number: '3',
    className: 'execute',
    Icon: ListChecks,
    ...coursePhasePalette.execute,
  },
  elv: {
    number: '4',
    className: 'elevate',
    Icon: Star,
    ...coursePhasePalette.elevate,
  },
};

function frameGardenStation(viewport, station) {
  const box = station.getBoundingClientRect();
  const frame = viewport.getBoundingClientRect();
  const symbol = viewport.querySelector(`use[href="#lesson-garden-${gardenStops[station.dataset.phase].symbol}"]`).getBoundingClientRect();
  const left = Math.min(box.left, symbol.left);
  const right = Math.max(box.right, symbol.right);
  // Keep the landmark alongside its card whenever both fit; on a phone keep the whole card readable.
  const focusLeft = Math.min(Math.max((left + right - viewport.clientWidth) / 2, box.right - viewport.clientWidth + 12), box.left - 12);
  viewport.scrollTo({
    left: viewport.scrollLeft + focusLeft - frame.left,
    top: viewport.scrollTop + (Math.min(box.top, symbol.top) + Math.max(box.bottom, symbol.bottom) - viewport.clientHeight) / 2 - frame.top,
  });
}

const phaseTranslationKeys = {
  eng: 'lesson.phaseEngage',
  emp: 'lesson.phaseEmpower',
  exc: 'lesson.phaseExecute',
  elv: 'lesson.phaseElevate',
};

const lessonDisplayReplacements = [
  ['语言目标：', 'Language Goal: '],
  ['语言目标:', 'Language Goal: '],
  ['核心词汇：', 'Core Vocabulary: '],
  ['核心句型：', 'Core Sentence Pattern: '],
  ['社会情感学习：', 'SEL: '],
  ['教学资源', 'Teaching Resources'],
  ['情境创设', 'Scenario Setup'],
  ['活动流程原文', 'Original Activity Flow'],
  ['教师语言与引导', 'Teacher Language & Guidance'],
  ['活动概述', 'Overview'],
  ['活动流程', 'Procedure'],
  ['查看详情', 'View Details'],
  ['查看活动', 'View Activity'],
  ['步骤', 'Step'],
  ['个环节', ' steps'],
  ['环节', 'steps'],
  ['分钟', 'min'],
  ['引入', 'Engage'],
  ['赋能', 'Empower'],
  ['实践', 'Execute'],
  ['升华', 'Elevate'],
];

const formatLessonText = (value, isChinese) => {
  if (value == null) return '';
  let text = String(value);
  if (isChinese) return text;
  lessonDisplayReplacements.forEach(([from, to]) => {
    text = text.split(from).join(to);
  });
  return text;
};

const compactOverviewText = (value, max = 96) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}...` : text;
};

const stripChinesePhaseParentheses = (value) => (
  String(value || '')
    .replace(/\s*[（(]\s*(引入|赋能|实践|升华)\s*[）)]/g, '')
    .trim()
);

function hasLessonSteps(resolvedPhases) {
  return Array.isArray(resolvedPhases) && resolvedPhases.some((phase) => phase.steps?.length > 0);
}

function buildLessonCourseData(updated, baseCourseData = {}) {
  const phaseKeyMap = { eng: 'engage', emp: 'empower', exc: 'execute', elv: 'elevate' };
  const courseData = {
    ...baseCourseData,
    courseData: updated,
  };

  updated.forEach((phase) => {
    courseData[phaseKeyMap[phase.key]] = {
      ...baseCourseData[phaseKeyMap[phase.key]],
      title: phase.title,
      steps: phase.steps.map((s) => ({
        id: s.id,
        title: s.title,
        time: s.duration,
        duration: s.duration,
        objective: s.goal,
        goal: s.goal,
        activity: s.activity,
        activitySteps: s.flow,
        flow: s.flow,
        resources: s.resources,
        scenario: s.scenario,
        script: s.teacherScript,
        teacherScript: s.teacherScript,
      })),
    };
  });

  return courseData;
}

function buildLessonN8nPayload(course = {}) {
  const parsedOverview = getCourseOverview(course);

  return {
    courseTitle: course.courseTitle || course.title || parsedOverview.courseTitle || '',
    age: String(course.rawAge || course.ageGroup || course.age || '').replace(/--/g, ''),
    duration: String(course.rawDuration || course.duration || '').replace(/--|分钟|\s*min(?:utes?)?$/gi, '').trim(),
    scale: String(course.rawClassSize || course.classSize || '').replace(/--/g, ''),
    vocabulary: ensureArray(course.vocabularies || course.keywords),
    grammar: ensureArray(course.grammars),
    skills: ensureArray(course.languageSkills),
    paths: ensureArray(course.experiencePaths || course.experiencePath),
    theme: course.theme || parsedOverview.theme || '',
    taskName: course.taskName || '',
    storyContext: course.storyContext || parsedOverview.overallContext || '',
    keyOutcome: course.keyOutcome || parsedOverview.finalTask || '',
    atmosphere: course.atmosphere || '',
    specialRequirements: course.specialRequirements || '',
    courseOverview: parsedOverview,
  };
}

function ensureArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean);
  if (typeof value === 'object') return Object.values(value).map((item) => String(item || '').trim()).filter(Boolean);
  return String(value)
    .split(/[,，、;；/|]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export function LessonPlanView({ course, phases, onCourseChange, onPhasesChange, onNext }) {
  const { t, i18n } = useTranslation();
  const isChinese = !i18n.language?.startsWith('en');
  const aiLanguage = isChinese ? 'zh' : 'en';
  const outputLanguage = isChinese ? 'Chinese' : 'English';
  const [addForm] = Form.useForm();
  const [data, setData] = React.useState(() => resolveLessonPhases(course) || resolveLessonPhases(phases || phaseTemplates));
  const [viewMode, setViewMode] = React.useState('map');
  const [activeMapPhase, setActiveMapPhase] = React.useState(null);
  const mapViewportRef = React.useRef(null);
  const [openCards, setOpenCards] = React.useState(() => new Set());
  const [menuKey, setMenuKey] = React.useState(null);
  const [editing, setEditing] = React.useState(null);
  const [detailTarget, setDetailTarget] = React.useState(null);
  const [adjustTarget, setAdjustTarget] = React.useState(null);
  const [adjustText, setAdjustText] = React.useState('');
  const [adjustChips, setAdjustChips] = React.useState([]);
  const [adjustLoading, setAdjustLoading] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [addPhase, setAddPhase] = React.useState(null);
  const [regenTarget, setRegenTarget] = React.useState(null);
  const [insertTarget, setInsertTarget] = React.useState(null);
  const [phaseDetail, setPhaseDetail] = React.useState(null);
  const [genMode, setGenMode] = React.useState('ai');
  const [classicKey, setClassicKey] = React.useState('');
  const [ideaText, setIdeaText] = React.useState('');
  const [regenPhase, setRegenPhase] = React.useState(null);
  const [regenPhaseConfirm, setRegenPhaseConfirm] = React.useState(null);
  const [regenAllLoading, setRegenAllLoading] = React.useState(false);
  const [generateDraftLoading, setGenerateDraftLoading] = React.useState(false);
  const [mapSummaryModal, setMapSummaryModal] = React.useState(null);
  const [favoriteBusy, setFavoriteBusy] = React.useState(false);
  const [draftError, setDraftError] = React.useState('');
  const draftRequest = React.useRef(0);
  const [toast, setToast] = React.useState('');

  const { user } = useAuth();
  const favorites = useLessonCollection('/api/lesson-step-favorites', user?.id);
  const classics = useLessonCollection('/api/workbench-cases', addOpen && genMode === 'classic' ? user?.id : null);
  const selectedClassic = classics.items.find(item => `${item.moduleId}/${item.id}` === classicKey);
  const courseRef = String(course?.id ?? '');
  const overview = getCourseOverview(course);
  const quickIdeas = [...new Set([...ensureArray(course?.vocabularies), ...ensureArray(course?.grammars)])].slice(0, 5);

  React.useLayoutEffect(() => {
    const viewport = mapViewportRef.current;
    const station = viewport?.querySelector('.lesson-roadmap-stage');
    if (station && viewport.scrollWidth > viewport.clientWidth) {
      frameGardenStation(viewport, station);
    }
  }, [viewMode]);

  const formatDuration = React.useCallback((value) => {
    if (value == null || !/\d/.test(String(value))) return '—';
    const minutes = parseMinutes(value);
    return isChinese ? `${minutes} 分钟` : `${minutes} min`;
  }, [isChinese]);

  const getPhaseTitle = React.useCallback((phase) => (
    isChinese
      ? stripChinesePhaseParentheses(phase.title)
      : t(phaseTranslationKeys[phase.key] || 'lesson.phaseEngage')
  ), [isChinese, t]);

  const getPhaseName = React.useCallback((phase) => (
    isChinese ? phase.name : ''
  ), [isChinese]);

  const getDisplayText = React.useCallback((value) => (
    formatLessonText(value, isChinese)
  ), [isChinese]);

  const updateData = async (next) => {
    const updated = next.map((phase) => ({
      ...phase,
      duration: phaseDuration(phase.steps),
    }));

    setData(updated);
    onPhasesChange?.(updated);
    const nextCourseData = buildLessonCourseData(updated, course?.courseData || course?.course_data || {});
    onCourseChange?.({
      ...course,
      courseData: nextCourseData,
    }, { source: 'lesson' });
  };

  const toastMessage = (text) => {
    setToast(text);
    setTimeout(() => setToast(''), 2000);
  };

  const toggleCard = (cardKey) => {
    setOpenCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardKey)) next.delete(cardKey);
      else next.add(cardKey);
      return next;
    });
  };

  const openEdit = (phaseKey, stepIndex, step) => {
    const phase = data.find((item) => item.key === phaseKey);
    setEditing({ phaseKey, stepIndex, step, phase });
    setMenuKey(null);
  };

  const openDetail = (phaseKey, stepIndex, step) => {
    const phase = data.find((item) => item.key === phaseKey);
    setDetailTarget({ phaseKey, stepIndex, step, phase });
    setMenuKey(null);
  };

  const openAdjust = (phaseKey, stepIndex, step) => {
    const phase = data.find((item) => item.key === phaseKey);
    setAdjustTarget({ phaseKey, stepIndex, step, phase });
    setAdjustText('');
    setAdjustChips([]);
    setMenuKey(null);
  };

  const openAddStep = (phase, step, options = {}) => {
    draftRequest.current++;
    setGenerateDraftLoading(false);
    setDraftError('');
    setAddPhase(phase);
    setGenMode('ai');
    setClassicKey('');
    setIdeaText('');
    setInsertTarget(options.insertIndex != null ? { phaseKey: phase.key, insertIndex: options.insertIndex } : null);
    if (step) {
      const timeMatch = String(step.duration || '').match(/(\d+)/);
      setRegenTarget({ phaseKey: phase.key, step });
      addForm.setFieldsValue({
        title: step.title || '',
        time: timeMatch ? Number(timeMatch[1]) : null,
        goal: step.goal || '',
        activity: step.activity || '',
        resources: step.resources || '',
        scenario: step.scenario || '',
        flowSteps: createFlowStepsForForm(step),
      });
    } else {
      setRegenTarget(null);
      addForm.setFieldsValue(emptyDraft);
    }
    setAddOpen(true);
  };

  const openInsertStepBefore = (phase, stepIndex) => {
    setMenuKey(null);
    openAddStep(phase, null, { insertIndex: stepIndex });
  };

  const openPhaseDetail = (phase) => {
    setMenuKey(null);
    const key = longPhaseKey(phase.key);
    const language = phase.steps.map(step => step.goal).filter(Boolean).join('\n');
    const scenarios = [...new Set(phase.steps.map(step => step.scenario).filter(Boolean))].join('\n');
    setPhaseDetail({
      key: phase.key, title: [getPhaseTitle(phase), getPhaseName(phase)].filter(Boolean).join(' · '),
      color: lessonMapMeta[phase.key].tint,
      goal: lessonText(phase.goal || phase.summary || overview.journey?.[key] || course?.journey?.[key]),
      lang: lessonText(phase.languageGoals) || language || lessonText(overview.languageGoals),
      hasPhaseLanguage: Boolean(phase.languageGoals || language),
      sel: lessonText(overview.selGoals), perma: lessonText(overview.permaGoals),
      narrative: lessonText(phase.narrative) || scenarios || lessonText(overview.overallContext || course?.storyContext),
      hasPhaseNarrative: Boolean(phase.narrative || scenarios),
    });
  };

  const fillIdea = (text) => {
    setIdeaText((current) => (current ? `${current}，${text}` : text));
  };

  const requestStep = async (phaseKey, index, currentStep, requirements) => {
    const phase = data.find(item => item.key === phaseKey);
    const steps = phase?.steps || [];
    const siblings = steps.filter((_, i) => !currentStep || i !== index);
    const otherPhases = Object.fromEntries(data.filter(item => item.key !== phaseKey).map(item =>
      [longPhaseKey(item.key), { title: item.title, steps: item.steps }]));
    const result = await apiService.request('/api/ai/generate-step', {
      method: 'POST',
      body: JSON.stringify({
        ...buildLessonN8nPayload(course), title: getDisplayCourseTitle(course),
        phaseKey: longPhaseKey(phaseKey), language: aiLanguage, outputLanguage,
        stepId: currentStep ? currentStep.id ?? `${phaseKey}-${index + 1}` : undefined,
        requirements, currentStep, currentSteps: siblings, siblingSteps: siblings,
        otherPhases, insertIndex: index, existingStepCount: steps.length,
        prevStep: steps[index - 1], nextStep: steps[currentStep ? index + 1 : index],
        userId: user?.id, organizationId: user?.organizationId,
      }),
    });
    if (!result.success || !result.data?.step?.title?.trim()) throw new Error(result.error || t('lessonPlanUi.noValidData'));
    return normalizeLessonStep(result.data.step);
  };

  const fillStepForm = step => {
    const minutes = parseMinutes(step.duration);
    addForm.setFieldsValue({
      title: step.title, time: minutes || null, goal: step.goal, activity: step.activity,
      flowSteps: createFlowStepsForForm(step), resources: step.resources, scenario: step.scenario,
    });
  };

  const handleGenerateDraft = async (isClassic = false) => {
    if (!addPhase || generateDraftLoading || (isClassic && !selectedClassic)) return;
    const request = ++draftRequest.current;
    setGenerateDraftLoading(true);
    setDraftError('');
    try {
      const index = regenTarget ? addPhase.steps.indexOf(regenTarget.step) : insertTarget?.insertIndex ?? addPhase.steps.length;
      const requirements = isClassic && selectedClassic ? [selectedClassic.title, selectedClassic.description].filter(Boolean).join('\n') : ideaText;
      const step = await requestStep(addPhase.key, index, regenTarget?.step, requirements);
      if (request === draftRequest.current) fillStepForm(step);
    } catch (error) {
      if (request === draftRequest.current) setDraftError(error.message);
    } finally {
      if (request === draftRequest.current) setGenerateDraftLoading(false);
    }
  };

  const addDraftStep = async () => {
    const values = await addForm.validateFields().catch(() => null);
    if (!values?.title?.trim()) return;
    const target = addPhase || data[0];
    const nextStep = {
      id: regenTarget?.step.id || crypto.randomUUID(),
      title: values.title.trim(), duration: values.time ? `${values.time}分钟` : '',
      goal: values.goal || '', activity: values.activity || '',
      flow: composeFlowFromSteps(values.flowSteps), teacherScript: composeScriptFromSteps(values.flowSteps),
      resources: values.resources || '', scenario: values.scenario || '',
    };

    if (regenTarget) {
      updateData(data.map((phase) => {
        if (phase.key !== regenTarget.phaseKey) return phase;
        return {
          ...phase,
          steps: phase.steps.map((s) => (s === regenTarget.step ? nextStep : s)),
        };
      }));
    } else {
      const insertIndex = insertTarget?.phaseKey === target.key ? insertTarget.insertIndex : target.steps.length;
      updateData(data.map((phase) => {
        if (phase.key !== target.key) return phase;
        const nextSteps = [...phase.steps];
        nextSteps.splice(insertIndex, 0, nextStep);
        return { ...phase, steps: nextSteps };
      }));
      setOpenCards((prev) => new Set(prev).add(`${target.key}-${insertIndex}`));
    }
    setAddOpen(false);
    setRegenTarget(null);
    setInsertTarget(null);
  };

  const saveEdit = (values) => {
    updateData(data.map((phase) => {
      if (phase.key !== editing.phaseKey) return phase;
      return {
        ...phase,
        steps: phase.steps.map((step, index) => (index === editing.stepIndex ? values : step)),
      };
    }));
    setEditing(null);
    setDetailTarget(null);
  };

  const confirmAdjust = async () => {
    if (!adjustTarget || !adjustText.trim() || adjustLoading) return;
    const requirements = adjustChips.length > 0
      ? `${adjustText.trim()}（调整方向：${adjustChips.join('、')}）`
      : adjustText.trim();
    setAdjustLoading(true);
    const saved = await handleRegenerateStep(adjustTarget.phaseKey, adjustTarget.stepIndex, requirements);
    setAdjustLoading(false);
    if (saved) setAdjustTarget(null);
  };

  const longPhaseKey = (shortKey) => {
    const map = { eng: 'engage', emp: 'empower', exc: 'execute', elv: 'elevate' };
    return map[shortKey] || shortKey;
  };

  const handleRegeneratePhase = async (phaseKey) => {
    if (regenPhase || regenAllLoading) return;
    setRegenPhase(phaseKey);
    try {
      const response = await fetch('/api/ai/regenerate-phase', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          phaseKey: longPhaseKey(phaseKey),
          language: aiLanguage,
          outputLanguage,
          ...buildLessonN8nPayload(course),
          title: getDisplayCourseTitle(course),
          userId: user?.id || null,
          organizationId: user?.organizationId || null,
          currentCourseData: dataToCoursePhases(data),
        }),
      });
      const result = await response.json();
      const steps = result.data?.steps;
      if (!response.ok || !result.success || !Array.isArray(steps) || !steps.length || steps.some(step => !step?.title?.trim())) {
        throw new Error(result.error || t('lessonPlanUi.noValidData'));
      }
      await updateData(data.map(phase => phase.key === phaseKey ? { ...phase, steps: steps.map(normalizeLessonStep) } : phase));
    } catch (error) {
      toastMessage(error.message || t('lessonPlanUi.regenFailedRetry'));
    } finally {
      setRegenPhase(null);
    }
  };

  const handleRegenerateAll = async () => {
    setRegenAllLoading(true);
    try {
      const response = await fetch('/api/ai/generate-course', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...buildLessonN8nPayload(course),
          language: aiLanguage,
          outputLanguage,
          regenerate: hasLessonSteps(data),
          currentCourseData: dataToCoursePhases(data),
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result?.error || t('lessonPlanUi.regenFailedShort'));
      }

      const courseDataRaw = result.data.courseData || result.data;
      const resolved = resolveLessonPhases({ courseData: courseDataRaw });
      if (!hasLessonSteps(resolved)) {
        throw new Error(t('lessonPlanUi.noValidData'));
      }

      await updateData(resolved);
      toastMessage(t('workflow.lesson.regenerateDone'));
    } catch (err) {
      console.error('重新生成完整教案失败:', err);
      toastMessage(err?.message || t('lessonPlanUi.regenFailedRetry'));
    } finally {
      setRegenPhase(null);
      setRegenAllLoading(false);
    }
  };

  const handleRegenerateStep = async (phaseKey, stepIndex, requirements) => {
    const phase = data.find(p => p.key === phaseKey);
    const original = phase?.steps[stepIndex];
    if (!original) return false;
    try {
      const revised = await requestStep(phaseKey, stepIndex, original, requirements);
      await updateData(data.map(p => p.key === phaseKey ? {
        ...p, steps: p.steps.map((s, i) => i === stepIndex ? { ...revised, id: original.id || revised.id } : s),
      } : p));
      return true;
    } catch (error) {
      toastMessage(error.message);
      return false;
    }
  };

  const handleDeleteStep = (phaseKey, stepIndex) => {
    updateData(data.map((p) =>
      p.key === phaseKey
        ? { ...p, steps: p.steps.filter((_, i) => i !== stepIndex) }
        : p
    ));
    setMenuKey(null);
  };

  const findFavorite = (phaseKey, stepIndex) => {
    const step = data.find(p => p.key === phaseKey)?.steps[stepIndex];
    return favorites.items.find(record => matchesFavorite(record, courseRef, phaseKey, step));
  };

  const changeFavorite = async (step, phaseKey, record) => {
    if (favoriteBusy) return;
    setFavoriteBusy(true);
    setMenuKey(null);
    try {
      await apiService.request('/api/lesson-step-favorites', {
        method: record ? 'DELETE' : 'PUT',
        body: JSON.stringify(record ? { id: record.id } : { courseRef, phaseKey, step }),
      });
      favorites.reload();
      toastMessage(t(record ? 'lessonPlanUi.unsavedToast' : 'lessonPlanUi.savedToast', { title: step.title }));
    } catch (error) {
      toastMessage(error.message);
    } finally {
      setFavoriteBusy(false);
    }
  };

  const handlePinStep = (phaseKey, stepIndex) => {
    const phase = data.find((p) => p.key === phaseKey);
    if (!phase || stepIndex <= 0) return;
    const steps = [...phase.steps];
    const [pinned] = steps.splice(stepIndex, 1);
    steps.unshift(pinned);
    updateData(data.map((p) => (p.key === phaseKey ? { ...p, steps } : p)));
    setMenuKey(null);
    toastMessage(t('lessonPlanUi.pinnedToast'));
  };

  const dataToCoursePhases = (sourceData = data) => {
    const result = {};
    sourceData.forEach((phase) => {
      result[longPhaseKey(phase.key)] = {
        title: phase.title,
        steps: phase.steps.map((s) => ({
          id: s.id,
          title: s.title,
          time: s.duration,
          objective: s.goal,
          activity: s.activity,
          activitySteps: s.flow,
          scenario: s.scenario,
          script: s.teacherScript,
        })),
      };
    });
    return result;
  };

  const renderOverviewStepCard = (phase, step, index, keyPrefix = '') => {
    const cardKey = `${keyPrefix}${phase.key}-${index}`;
    const isOpen = openCards.has(cardKey);
    const stepTitle = getDisplayText(step.title);
    const stepGoal = getDisplayText(step.goal);
    const stepActivity = getDisplayText(step.activity);
    const flowItems = buildStepFlowItems(step, !isChinese);
    const { Icon } = lessonMapMeta[phase.key] || lessonMapMeta.eng;

    return (
      <article
        className={`step-card ${isOpen ? 'open' : ''}`}
        key={cardKey}
      >
        <div className="step-summary">
          <button
            type="button"
            className="lesson-step-toggle"
            aria-expanded={isOpen}
            aria-label={`${t(isOpen ? 'common.collapse' : 'common.expand')} ${stepTitle}`}
            onClick={() => toggleCard(cardKey)}
          >
            <span className="step-chevron" aria-hidden="true"><ChevronRight size={14} /></span>
            <span className="lesson-phase-symbol" aria-hidden="true"><Icon size={18} /></span>
            <span className="step-main">
              <span className="step-name">
                <span className="step-title-text">{stepTitle}</span>
                <MetadataTag><Clock size={12} aria-hidden="true" />{formatDuration(step.duration)}</MetadataTag>
              </span>
              <span className="step-lo-preview">{compactOverviewText(stepGoal, 76)}</span>
            </span>
          </button>
          <div className="step-right-ctrl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="lesson-step-menu-button"
              data-wb-button="quiet"
              data-wb-icon=""
              data-wb-size="sm"
              aria-expanded={menuKey === cardKey}
              title={t('common.actions', { defaultValue: isChinese ? '操作' : 'Actions' })}
              onClick={() => setMenuKey(menuKey === cardKey ? null : cardKey)}
            >
              <MoreVertical size={14} />
            </button>
            {!isOpen && (
              <StepMenu
                open={menuKey === cardKey}
                onRegen={() => {
                  setMenuKey(null);
                  openAddStep(phase, step);
                }}
                onInsertBefore={() => openInsertStepBefore(phase, index)}
                onAdjust={() => openAdjust(phase.key, index, step)}
                onSave={() => changeFavorite(step, phase.key)}
                onUnsave={() => changeFavorite(step, phase.key, findFavorite(phase.key, index))}
                isSaved={Boolean(findFavorite(phase.key, index))}
                favoriteBusy={favoriteBusy || favorites.loading || favorites.error}
                onPin={() => handlePinStep(phase.key, index)}
                onDelete={() => handleDeleteStep(phase.key, index)}
              />
            )}
          </div>
        </div>

        <div className="step-detail" data-brief-enhanced="1" onClick={(event) => event.stopPropagation()}>
          <div className="step-brief-list">
            <div className="step-brief-item">
              <div className="step-detail-label"><Target size={13} />{t('lesson.languageGoal')}</div>
              <div className="step-detail-body tbl-lo">
                {compactOverviewText(stepGoal) || t('common.none')}
              </div>
            </div>
            <div className="step-brief-item">
              <div className="step-detail-label"><ClipboardList size={13} />{t('lesson.activitySummary')}</div>
              <div className="step-detail-body">
                {compactOverviewText(stepActivity, 132) || t('common.none')}
              </div>
            </div>
            <div className="step-brief-item">
              <div className="step-detail-label"><ListChecks size={13} />{t('lesson.activityFlow')}</div>
              <div className="step-flow-card">
                <div className="step-flow-list">
                  {!flowItems.length && <span>{t('common.none')}</span>}
                  {flowItems.map((item, flowIndex) => (
                    <div className="step-flow-item" key={`${cardKey}-${flowIndex}`}>
                      <span className="step-flow-dot" />
                      <div>
                        <div className="step-flow-title">{getDisplayText(item.title)}</div>
                        <div className="step-flow-desc">{compactOverviewText(getDisplayText(item.desc), 72)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="step-hidden-fields">
              <div className="step-detail-label">{t('lesson.executionFlow')}</div>
              <div className="step-detail-body">{getDisplayText(step.flow)}</div>
              <div className="step-detail-label">{t('lesson.teachingResources')}</div>
              <div className="step-detail-body">{getDisplayText(step.resources)}</div>
              <div className="step-detail-label">{t('lesson.sceneSetup')}</div>
              <div className="step-detail-body">{getDisplayText(step.scenario)}</div>
              <div className="step-detail-label">{t('lesson.teacherScript')}</div>
              <div className="step-script tbl-script">
                <span className="tbl-q">“</span>{getDisplayText(step.teacherScript)}
              </div>
            </div>
          </div>
          <StepCardActions
            onDetail={() => openDetail(phase.key, index, step)}
            onEdit={() => openEdit(phase.key, index, step)}
            onAdjust={() => openAdjust(phase.key, index, step)}
            onMore={() => setMenuKey(menuKey === cardKey ? null : cardKey)}
            menu={(
              <StepMenu
                open={isOpen && menuKey === cardKey}
                placement="footer"
                onRegen={() => {
                  setMenuKey(null);
                  openAddStep(phase, step);
                }}
                onInsertBefore={() => openInsertStepBefore(phase, index)}
                onAdjust={() => openAdjust(phase.key, index, step)}
                onSave={() => changeFavorite(step, phase.key)}
                onUnsave={() => changeFavorite(step, phase.key, findFavorite(phase.key, index))}
                isSaved={Boolean(findFavorite(phase.key, index))}
                favoriteBusy={favoriteBusy || favorites.loading || favorites.error}
                onPin={() => handlePinStep(phase.key, index)}
                onDelete={() => handleDeleteStep(phase.key, index)}
              />
            )}
          />
        </div>
      </article>
    );
  };

  const renderOverviewPhaseCard = (phase, keyPrefix = '') => {
    const phaseMinutes = parseMinutes(phase.duration);
    const courseMinutes = parseMinutes(course?.duration || course?.course_duration);
    const durationLimit = Math.max(1, Math.round(courseMinutes * (PHASE_DURATION_RATIO[phase.key] || 0.25)));
    const overflowMinutes = courseMinutes ? Math.max(0, phaseMinutes - durationLimit) : 0;
    const phaseMapMeta = lessonMapMeta[phase.key] || lessonMapMeta.eng;

    return (
      <section
        className={`tbl-phase-card ${phase.key}`}
        aria-busy={regenPhase === phase.key}
        style={{ '--phase-tint': phaseMapMeta.tint, '--phase-accent': phaseMapMeta.accent }}
        key={`${keyPrefix}${phase.key}`}
      >
        <div className="tbl-phase-hd">
          <span className="lesson-phase-number">{phaseMapMeta.number}</span>
          <div className="tbl-phase-hd-left">
            <div className="tbl-phase-title-row">
              <span className="tbl-phase-title">{getPhaseTitle(phase)}</span>
              {getPhaseName(phase) && <span className="tbl-phase-cn">{getPhaseName(phase)}</span>}
            </div>
            <div className="tbl-phase-second-row">
              <span className="tbl-phase-sub">{t('workflow.lesson.stepCount', { count: phase.steps.length })}</span>
              <MetadataTag className={overflowMinutes > 0 ? 'lesson-duration-warning' : undefined}>
                <Clock size={12} aria-hidden="true" />{formatDuration(phase.duration)}
              </MetadataTag>
            </div>
          </div>
          <div className="tbl-phase-menu-wrap">
            <button
              type="button"
              className="tbl-phase-edit-btn"
              data-wb-button="quiet"
              data-wb-icon=""
              data-wb-size="sm"
              title={t('lesson.viewPhaseDetail')}
              aria-label={t('lesson.viewPhaseDetail')}
              onClick={(event) => {
                event.stopPropagation();
                openPhaseDetail(phase);
              }}
            >
              <Info size={16} aria-hidden="true" />
            </button>
            {menuKey === `${keyPrefix}phase-${phase.key}` && (
              <div className="step-menu-dropdown open phase-menu">
                <button type="button" className="step-menu-item" onClick={() => { setMenuKey(null); setRegenPhaseConfirm(phase.key); }}>
                  <RefreshCw size={12} />{t('workflow.lesson.regenerate')}
                </button>
              </div>
            )}
          </div>
        </div>
        {overflowMinutes > 0 && (
          <div className="tbl-phase-duration-warning">
            <Info size={15} aria-hidden="true" />
            <span>{t("lesson.overflowWarn", { current: phaseMinutes, limit: durationLimit, overflow: overflowMinutes })}</span>
          </div>
        )}

        <div className="tbl-steps-list">
          <div className="tbl-add-step-top">
            <button type="button" className="tbl-add-step-btn" data-wb-button="secondary" data-wb-size="sm" onClick={() => openAddStep(phase)}>
              <Plus size={12} />
              {t('workflow.lesson.addStep')}
            </button>
          </div>

          {!phase.steps.length && <span className="tbl-phase-sub">{t('lesson.noSteps')}</span>}
          {phase.steps.map((step, index) => renderOverviewStepCard(phase, step, index, keyPrefix))}
        </div>
      </section>
    );
  };

  const renderLessonMap = () => {
    const selected = activeMapPhase ? data.find((phase) => phase.key === activeMapPhase.key) : null;
    const selectedMeta = selected ? lessonMapMeta[selected.key] : null;

    return (
      <ContentTabPanel group="lesson-view" value="map" className="lesson-roadmap-shell">
        <nav className="lesson-roadmap-jumps" aria-label={isChinese ? '地图站点' : 'Map stations'}>
          <span>{isChinese ? '定位站点' : 'Go to station'}</span>
          {data.map((phase) => {
            const meta = lessonMapMeta[phase.key] || lessonMapMeta.eng;
            return (
              <button
                key={phase.key}
                type="button"
                data-wb-button="secondary"
                data-wb-size="sm"
                className={`station-${meta.className}`}
                aria-label={`${meta.number} · ${getPhaseTitle(phase)}`}
                aria-controls={`lesson-station-${phase.key}`}
                onClick={(event) => {
                  const station = document.getElementById(event.currentTarget.getAttribute('aria-controls'));
                  const viewport = mapViewportRef.current;
                  if (!station || !viewport) return;
                  frameGardenStation(viewport, station);
                  station.focus({ preventScroll: true });
                }}
              >
                {meta.number}
              </button>
            );
          })}
        </nav>
        <section ref={mapViewportRef} className="lesson-roadmap" aria-labelledby="lesson-roadmap-title" tabIndex={0}>
          <div className="lesson-roadmap-scene">
            <header className="lesson-roadmap-copy">
              <span className="lesson-roadmap-emblem" aria-hidden="true"><Route size={27} /></span>
              <h3 id="lesson-roadmap-title">{isChinese ? '成长路线图' : 'Growth Roadmap'}</h3>
              <p>{isChinese ? '点击站点，查看教学活动。' : 'Select a stop to view its activities.'}</p>
            </header>
            <LessonGardenMap />
            <ol className="lesson-roadmap-stages">
              {data.map((phase) => {
                const meta = lessonMapMeta[phase.key] || lessonMapMeta.eng;
                const { Icon } = meta;
                const stop = gardenStops[phase.key];
                const phaseGoals = phase.steps.map((step) => step.goal).filter(Boolean);
                const summary = phaseGoals.join(isChinese ? '；' : ' · ') || lessonText(overview.journey?.[longPhaseKey(phase.key)]) || t('common.none');
                const phaseTitleText = [getPhaseTitle(phase), getPhaseName(phase)].filter(Boolean).join(' ');
                const summaryText = getDisplayText(summary);
                return (
                  <li
                    key={phase.key}
                    id={`lesson-station-${phase.key}`}
                    className={`lesson-roadmap-stage station-${meta.className}`}
                    data-phase={phase.key}
                    style={{ '--stop-x': `${stop.x / 10}%`, '--stop-y': `${stop.y / gardenHeight * 100}%`, '--phase-tint': meta.tint }}
                    tabIndex={-1}
                    aria-label={phaseTitleText}
                  >
                    <button
                      className="lesson-roadmap-waypoint"
                      type="button"
                      aria-label={`${meta.number} · ${phaseTitleText} · ${t('lesson.detail')}`}
                      onClick={() => setActiveMapPhase(phase)}
                    >{meta.number}</button>
                    <div className="lesson-roadmap-heading">
                      <span className="lesson-roadmap-stage-icon"><Icon size={18} aria-hidden="true" /></span>
                      <h4>{phaseTitleText}</h4>
                    </div>
                    <button
                      type="button"
                      className="lesson-roadmap-summary"
                      title={summaryText}
                      onClick={() => setMapSummaryModal({
                        title: phaseTitleText,
                        content: summaryText,
                        tone: meta.tint,
                        className: meta.className,
                      })}
                    >
                      {summaryText}
                    </button>
                    <div className="lesson-roadmap-meta">
                      <span className="lesson-roadmap-counts">
                        <span>{t('workflow.lesson.stepCount', { count: phase.steps.length })}</span>
                        <MetadataTag><Clock size={12} aria-hidden="true" />{formatDuration(phase.duration)}</MetadataTag>
                      </span>
                      <button type="button" data-wb-button="quiet" data-wb-size="sm" onClick={() => setActiveMapPhase(phase)}>
                        {t('lesson.detail')} <ArrowRight size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {selected && selectedMeta && (
          <aside className={`lesson-map-drawer ${selectedMeta.className}`} style={{ '--map-card-bg': selectedMeta.tint }}>
            <button type="button" className="lesson-map-drawer-close floating" onClick={() => setActiveMapPhase(null)} aria-label={t('common.close')}>
              <X size={22} />
            </button>
            {renderOverviewPhaseCard(selected, 'map-')}
          </aside>
        )}
      </ContentTabPanel>
    );
  };

  if (regenAllLoading && !hasLessonSteps(data)) {
    return (
      <div id="ed-tbl" className="lesson-loading-page">
        <PageLoading label={t('workflow.lesson.generating')} />
      </div>
    );
  }

  return (
    <div id="ed-tbl" className={`${viewMode === 'map' ? 'lesson-roadmap-mode' : ''} ${isChinese ? 'lesson-lang-zh' : 'lesson-lang-en'}`}>
      {toast && <div className="tbl-toast">{toast}</div>}
      <div className="lesson-design-page-header">
        <div className="lesson-design-title-row">
          <h2 className="lesson-design-page-title">{isChinese ? `${t('workflow.lesson.title')}|Lesson Plan` : t('workflow.lesson.title')}</h2>
          <Send className="lesson-title-symbol" size={20} aria-hidden="true" />
          <ContentTabs
            group="lesson-view" label={t('workflow.lesson.title')} value={viewMode} onChange={setViewMode}
            items={[
              { value: 'map', label: t('workflow.lesson.mapMode') },
              { value: 'overview', label: t('workflow.lesson.overviewMode') },
            ]}
          />
        </div>
        <div className="lesson-design-actions">
          <Button data-wb-button="secondary" icon={<RefreshCw size={16} />} disabled={Boolean(regenPhase)} loading={regenAllLoading} onClick={handleRegenerateAll}>
            {regenAllLoading ? t('workflow.lesson.generatingShort') : t(hasLessonSteps(data) ? 'workflow.lesson.regenerate' : 'lesson.generatePlan')}
          </Button>
          <Button className="btn-next-step" onClick={onNext}>
            {t('workflow.nextStep')}
          </Button>
        </div>
      </div>
      {viewMode === 'map' ? renderLessonMap() : (
        <ContentTabPanel group="lesson-view" value="overview" className="tbl-kanban">
          {data.map((phase) => renderOverviewPhaseCard(phase))}
        </ContentTabPanel>
      )}
      {mapSummaryModal && (
        <div className="mo on" id="lesson-map-summary-modal" onMouseDown={(event) => event.target === event.currentTarget && setMapSummaryModal(null)}>
          <div className={`modal lesson-map-summary-modal ${mapSummaryModal.className || ''}`} style={{ '--map-card-bg': mapSummaryModal.tone || '#e8d2df' }}>
            <div className="modal-hd">
              <div className="modal-t">{mapSummaryModal.title}</div>
              <DialogCloseButton onClick={() => setMapSummaryModal(null)} />
            </div>
            <div className="modal-body">
              <div className="lesson-map-summary-full">{mapSummaryModal.content}</div>
            </div>
            <div className="modal-ft">
              <button type="button" data-wb-button="primary" onClick={() => setMapSummaryModal(null)}>{t('common.close')}</button>
            </div>
          </div>
        </div>
      )}
      {regenPhaseConfirm && (
        <div className="mo on" onMouseDown={(event) => event.target === event.currentTarget && setRegenPhaseConfirm(null)}>
          <div className="modal" style={{ width: 'min(420px, 90vw)', background: 'var(--wb-surface)', borderRadius: 18, border: '1px solid var(--wb-border)', boxShadow: '0 20px 64px rgba(48,43,59,.16)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="modal-hd">
              <div className="modal-t">{t('lesson.regeneratePhase')}</div>
              <DialogCloseButton onClick={() => setRegenPhaseConfirm(null)} />
            </div>
            <div className="modal-body" style={{ padding: '18px 24px' }}>
              <p style={{ fontSize: 14, color: 'var(--wb-muted)', lineHeight: 1.6 }}>
                {t('lesson.confirmRegeneratePhase')}
              </p>
            </div>
            <div className="modal-ft">
              <button type="button" data-wb-button="secondary" onClick={() => setRegenPhaseConfirm(null)}>{t('common.cancel')}</button>
              <button type="button" data-wb-button="primary" onClick={() => { const pk = regenPhaseConfirm; setRegenPhaseConfirm(null); handleRegeneratePhase(pk); }}>
                <RefreshCw size={13} />
                {t('lesson.confirmRegenerate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {phaseDetail && (
        <div className="mo on" id="mo-edit-phase" onMouseDown={(event) => event.target === event.currentTarget && setPhaseDetail(null)}>
          <div className="modal phase-detail-modal">
            <div className="modal-hd">
              <div className="modal-t pem-title-wrap">
                {isChinese ? stripChinesePhaseParentheses(phaseDetail.title) : t(phaseTranslationKeys[phaseDetail.key] || 'lesson.phaseEngage')}
                <span className="pem-readonly-badge">{t('lesson.readonlyNote')}</span>
              </div>
              <DialogCloseButton onClick={() => setPhaseDetail(null)} />
            </div>
            <div className="modal-body">
              <div className="pem-wrap" style={{ '--pem-accent': phaseDetail.color }}>
                <div className="pem-summary">
                  <div className="pem-summary-label">{t('lesson.phasePosition')}</div>
                  <div className="pem-summary-text">{getDisplayText(phaseDetail.goal) || t('common.none')}</div>
                </div>
                <div className="pem-grid">
                  <div className="pem-section">
                    <div className="pem-label">{t(phaseDetail.hasPhaseLanguage ? 'lesson.languageGoal' : 'lesson.courseLanguage')}</div>
                    <div className="pem-content">{getDisplayText(phaseDetail.lang) || t('common.none')}</div>
                  </div>
                  <div className="pem-section">
                    <div className="pem-label">{t('lesson.courseSel')}</div>
                    <div className="pem-content">{getDisplayText(phaseDetail.sel) || t('common.none')}</div>
                  </div>
                  <div className="pem-section">
                    <div className="pem-label">{t('lesson.coursePerma')}</div>
                    <div className="pem-content">{getDisplayText(phaseDetail.perma) || t('common.none')}</div>
                  </div>
                  <div className="pem-section pem-section-narrative">
                    <div className="pem-label">{t(phaseDetail.hasPhaseNarrative ? 'lesson.phaseNarrative' : 'lesson.courseNarrative')}</div>
                    <div className="pem-content pem-narrative">{getDisplayText(phaseDetail.narrative) || t('common.none')}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-ft">
              <button type="button" data-wb-button="secondary" onClick={() => setPhaseDetail(null)}>{t('common.close')}</button>
            </div>
          </div>
        </div>
      )}

      {addOpen && (
        <div className="mo on" id="mo-add-step" onMouseDown={(event) => event.target === event.currentTarget && (setAddOpen(false), setRegenTarget(null), setInsertTarget(null))}>
          <div className="modal modal-add-step">
            <div className="modal-hd">
              <div>
                <div className="modal-t" id="addStepTitle">
                  {regenTarget ? t('lesson.regenerateStep') : insertTarget ? t('lesson.insertStep') : t('lesson.addStep')} <strong className={`as-phase-${addPhase?.key || 'eng'}`}>{addPhase?.phase || 'Engage'}</strong>
                </div>
                <div id="asPhaseTag">
                  {[course?.courseTitle || course?.title, course?.ageGroup || course?.age, course?.grade].filter(value => value && value !== '--').join(' · ')}
                </div>
              </div>
              <DialogCloseButton onClick={() => { setAddOpen(false); setRegenTarget(null); setInsertTarget(null); }} />
            </div>

            <div className="modal-body as-modal-body">
              <div className="as-left-panel">
                <ContentTabs
                  group="lesson-step-source" label={t('pictureBook.librarySource')} value={genMode} onChange={setGenMode} disabled={generateDraftLoading}
                  items={[
                    { value: 'ai', label: t('lesson.aiGenerate'), icon: Sparkles },
                    { value: 'classic', label: t('lesson.classicActivities'), icon: Star },
                    { value: 'mine', label: t('lesson.myFavorites'), icon: Heart },
                  ]}
                />
                <ContentTabPanel group="lesson-step-source" value={genMode}>
                  <div className={`as-gen-panel ${genMode === 'ai' ? 'active' : ''}`} id="asPanel-ai">
                    {quickIdeas.length > 0 && <div className="as-quick-hint">
                      <div className="as-qh-label">{t('lesson.promptHint')}</div>
                      <div className="as-qh-chips">
                        {quickIdeas.map((item) => (
                          <button data-wb-button="secondary" data-wb-size="sm" type="button" key={item} onClick={() => fillIdea(item)}>
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>}
                    <div className="as-panel-label">{t('lesson.activityIdea')}</div>
                    <TextArea
                      className="as-gen-textarea"
                      value={ideaText}
                      onChange={(event) => setIdeaText(event.target.value)}
                      placeholder={t('lesson.activityIdeaPlaceholder')}
                    />
                    <button type="button" data-wb-button="primary" onClick={() => handleGenerateDraft()} disabled={generateDraftLoading}>
                      <Sparkles size={14} />
                      {generateDraftLoading ? t('workflow.lesson.generatingShort') : t('lesson.generateDraft')}
                    </button>
                  </div>

                  <div className={`as-gen-panel ${genMode === 'classic' ? 'active' : ''}`} id="asPanel-classic">
                    <div className="as-panel-label classic-label">{t('lesson.chooseClassicActivity')}</div>
                    <div className="as-classic-grid" id="asClassicGrid">
                      {classics.loading && <PageLoading />}
                      {classics.error && <button type="button" data-wb-button="secondary" onClick={classics.reload}>{t('lesson.libraryRetry')}</button>}
                      {!classics.loading && !classics.error && !classics.items.length && <p>{t('lesson.noClassics')}</p>}
                      {classics.items.map(activity => (
                        <button
                          type="button" className={`as-classic-card ${selectedClassic === activity ? 'selected' : ''}`}
                          disabled={generateDraftLoading} key={`${activity.moduleId}/${activity.id}`} aria-pressed={selectedClassic === activity}
                          onClick={() => { setClassicKey(`${activity.moduleId}/${activity.id}`); setDraftError(''); }}
                        >
                          <BookOpen className="lesson-classic-symbol" size={18} aria-hidden="true" />
                          <span className="as-classic-name">{activity.title}</span>
                        </button>
                      ))}
                    </div>
                    {selectedClassic && <div className="as-selected-hint">{selectedClassic.description || selectedClassic.title}</div>}
                    {selectedClassic && (
                      <button type="button" data-wb-button="primary" onClick={() => handleGenerateDraft(true)} disabled={generateDraftLoading}>
                        <Sparkles size={14} />
                        {generateDraftLoading ? t('workflow.lesson.generatingShort') : t('lesson.generateDraft')}
                      </button>
                    )}
                  </div>

                  <div className={`as-gen-panel ${genMode === 'mine' ? 'active' : ''}`} id="asPanel-mine">
                    {favorites.loading ? <PageLoading /> : favorites.error ? (
                      <button type="button" data-wb-button="secondary" onClick={favorites.reload}>{t('lesson.libraryRetry')}</button>
                    ) : favorites.items.length === 0 ? (
                      <div id="asSavedList" className="as-saved-empty">
                        {t('lesson.noFavorites')}<br />
                        <span>{t('lesson.favoriteTip')}</span>
                      </div>
                    ) : (
                      <div id="asSavedList" className="as-saved-list">
                        {favorites.items.map((record) => (
                          <div className="as-saved-item" key={record.id}>
                            <button type="button" className="as-saved-item-main" onClick={() => fillStepForm(record.step)}>
                              <span className="as-saved-item-title">{record.step.title}</span>
                              <span className="as-saved-item-meta">{[record.step.duration, compactOverviewText(record.step.goal, 50)].filter(Boolean).join(' · ')}</span>
                            </button>
                            <button
                              type="button"
                              data-wb-button="danger" data-wb-size="sm" data-wb-icon="" aria-label={t('common.delete')}
                              disabled={favoriteBusy}
                              onClick={() => changeFavorite(record.step, record.phaseKey, record)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ContentTabPanel>
              </div>

              <div className="as-right-panel">
                <div className="as-right-hd">
                  <span className="as-right-title">{t('lesson.activityDraft')}</span>
                  <span className={`as-right-tag ${generateDraftLoading ? 'ai' : genMode === 'ai' ? 'ai' : genMode === 'mine' ? 'mine' : ''}`}>
                    {generateDraftLoading ? t('lesson.generating') : genMode === 'ai' ? t('workflow.stepState.pending') : genMode === 'classic' ? t('workflow.stepState.pending') : t('lesson.myFavorites')}
                  </span>
                </div>

                {draftError && <p role="alert">{draftError}</p>}
                <Form form={addForm} disabled={generateDraftLoading} className="as-draft-form" layout="vertical">
                  <div className="as-draft-row">
	                    <Form.Item className="as-draft-field as-draft-name" label={t('lesson.stepName')} name="title" rules={[{ required: true, whitespace: true, message: t('lesson.nameRequired') }]}>
                      <Input className="as-draft-input" placeholder={t('lesson.stepNamePlaceholder')} />
                    </Form.Item>
	                    <Form.Item className="as-draft-field as-draft-time" label={t('lesson.stepDuration')} name="time">
                      <InputNumber className="as-draft-input" min={1} max={40} controls={false} />
                    </Form.Item>
                  </div>
	                  <Form.Item className="as-draft-field" label={t('lesson.languageGoal')} name="goal">
                    <TextArea className="as-draft-textarea" placeholder={t('lesson.languageGoalPlaceholder')} />
                  </Form.Item>
	                  <Form.Item className="as-draft-field" label={t('lesson.activitySummary')} name="activity">
                    <TextArea className="as-draft-textarea" placeholder={t('lesson.activitySummaryPlaceholder')} />
                  </Form.Item>
                  <div className="as-draft-field">
	                    <label className="as-draft-lbl">{t('lesson.activityFlow')}</label>
                    <Form.List name="flowSteps">
                      {(fields, { add, remove }) => (
                        <div className="flow-step-editor" id="drFlowSteps">
                          <div className="flow-step-editor-head">
                            <div>
	                              <div className="flow-step-editor-title">{t('lesson.executionFlow')}</div>
                              <div className="flow-step-editor-tip">
                                {t('lesson.flowEditorTip')}
                              </div>
                            </div>
                            <div className="flow-step-editor-badge">{t('lesson.flowStepCount', { count: fields.length })}</div>
                          </div>

                          {fields.map((field, index) => (
                            <div className="flow-step-row" key={field.key}>
                              <div className="flow-step-rail">
                                <div className="flow-step-index">{index + 1}</div>
                                <div className="flow-step-line" />
                              </div>
                              <div className="flow-step-fields">
                                <div className="flow-step-card-head">
                                  <div className="flow-step-mini-label">{t('lesson.flowStepName')}</div>
                                  <Form.Item name={[field.name, 'title']} noStyle>
                                    <Input className="flow-step-input flow-step-title" placeholder={t('lesson.flowStepNamePlaceholder')} />
                                  </Form.Item>
                                </div>
                                <div className="flow-step-body-grid">
                                  <div className="flow-step-section">
                                    <div className="flow-step-section-title">{t('lesson.activityContent')}</div>
                                    <Form.Item name={[field.name, 'desc']} noStyle>
                                      <TextArea
                                        className="flow-step-input flow-step-desc"
                                        placeholder={t('lesson.activityContentPlaceholder')}
                                      />
                                    </Form.Item>
                                  </div>
                                  <div className="flow-step-section guidance teacher-script">
                                    <div className="flow-step-section-title">{t('lesson.teacherGuidance')}</div>
                                    <Form.Item name={[field.name, 'teacher']} noStyle>
                                      <TextArea
                                        className="flow-step-input flow-step-script"
                                        placeholder={t('lesson.teacherPlaceholder')}
                                      />
                                    </Form.Item>
                                  </div>
                                  <div className="flow-step-section guidance action-cue">
                                    <div className="flow-step-section-title">{t('lesson.actionCue')}</div>
                                    <Form.Item name={[field.name, 'cue']} noStyle>
                                      <TextArea
                                        className="flow-step-input flow-step-cue"
                                        placeholder={t('lesson.actionCuePlaceholder')}
                                      />
                                    </Form.Item>
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="flow-step-del"
                                aria-label={t('lesson.deleteStep')}
                                disabled={fields.length <= 1}
                                onClick={() => fields.length > 1 && remove(field.name)}
                              >
                                ×
                              </button>
                            </div>
                          ))}

                          <button
                            type="button"
                            className="flow-step-add"
                            onClick={() => add({
                              title: '',
                              desc: '',
                              teacher: '',
                              cue: '',
                            })}
                          >
	                            + {t('common.add')}
                          </button>
                        </div>
                      )}
                    </Form.List>
                  </div>
                  <div className="as-draft-row">
	                    <Form.Item className="as-draft-field" label={t('lesson.teachingResources')} name="resources">
                      <TextArea className="as-draft-textarea" placeholder={t('lesson.resourcesPlaceholder')} />
                    </Form.Item>
	                    <Form.Item className="as-draft-field" label={t('lesson.sceneSetup')} name="scenario">
                      <TextArea className="as-draft-textarea" placeholder={t('lesson.scenarioPlaceholder')} />
                    </Form.Item>
                  </div>
                </Form>

                <div className="as-right-ft">
                  <button className="as-regen-btn" type="button" onClick={() => handleGenerateDraft(genMode === 'classic')} disabled={generateDraftLoading || (genMode === 'classic' && !selectedClassic)}>
                    <RefreshCw size={11} />
	                    {generateDraftLoading ? t('workflow.lesson.generatingShort') : t('workflow.lesson.regenerate')}
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-ft">
	              <button type="button" data-wb-button="secondary" onClick={() => { setAddOpen(false); setRegenTarget(null); setInsertTarget(null); }}>{t('common.cancel')}</button>
              <div className="as-ft-spacer" />
              <CreateButton disabled={generateDraftLoading} id="asConfirmBtn" onClick={addDraftStep}>
	                {regenTarget ? t('lesson.confirmRegenerate') : insertTarget ? t('lesson.insertBefore') : t('lesson.addToOutline')}
              </CreateButton>
            </div>
          </div>
        </div>
      )}

      <StepDetailModal
        open={!!detailTarget}
        step={detailTarget?.step}
        phase={detailTarget?.phase}
        onClose={() => setDetailTarget(null)}
        onEdit={() => {
          if (!detailTarget) return;
          setEditing(detailTarget);
          setDetailTarget(null);
        }}
      />
      <EditStepModal
        open={!!editing}
        step={editing?.step}
        courseTitle={getDisplayCourseTitle(course)}
        onClose={() => setEditing(null)}
        onSave={saveEdit}
        onRewrite={(draft) => requestStep(editing.phaseKey, editing.stepIndex, draft, t('lesson.rewriteIntent'))}
      />
      <AdjustStepModal
        open={!!adjustTarget}
        loading={adjustLoading}
        value={adjustText}
        selected={adjustChips}
        onChange={setAdjustText}
        onToggle={(chip) => setAdjustChips((current) => (
          current.includes(chip) ? current.filter((item) => item !== chip) : [...current, chip]
        ))}
        onClose={() => setAdjustTarget(null)}
        onConfirm={confirmAdjust}
      />
    </div>
  );
}

function StepMenu({ open, onRegen, onInsertBefore, onAdjust, onSave, onUnsave, isSaved, favoriteBusy, onPin, onDelete, placement }) {
  const { t } = useTranslation();
  return (
    <div className={`step-menu-dropdown ${placement === 'footer' ? 'footer-menu' : ''} ${open ? 'open' : ''}`}>
      <button type="button" className="step-menu-item" onClick={onRegen}><RefreshCw size={12} />{t('workflow.lesson.regenerate')}</button>
      <button type="button" className="step-menu-item" onClick={onAdjust}><SlidersHorizontal size={12} />{t('lesson.adjustTitle')}</button>
      <button type="button" className="step-menu-item" onClick={onInsertBefore}><Plus size={12} />{t('lesson.insertBefore')}</button>
      <button type="button" className="step-menu-item" disabled={favoriteBusy} onClick={isSaved ? onUnsave : onSave}>
        <Heart size={12} fill={isSaved ? 'var(--wb-primary)' : 'none'} />
        {t(isSaved ? 'lesson.removeFavorite' : 'lesson.addFavorite')}
      </button>
      <button type="button" className="step-menu-item" onClick={onPin}><Copy size={12} />{t('lesson.pinToTop')}</button>
      <div className="step-menu-sep" />
      <button type="button" className="step-menu-item danger" onClick={onDelete}><Trash2 size={12} />{t('lesson.deleteStep')}</button>
    </div>
  );
}
