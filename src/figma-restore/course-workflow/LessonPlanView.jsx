import React from 'react';
import { Button, Form, Input, InputNumber } from 'antd';
import { useTranslation } from 'react-i18next';
import { buildCourseMap, phaseTemplates } from './workflowData';
import apiService from '../../services/api';
import {
  ChevronRight,
  ClipboardList,
  Copy,
  Heart,
  Image as ImageIcon,
  ListChecks,
  MoreVertical,
  Plus,
  RefreshCw,
  RotateCcw,
  RotateCw,
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
import { buildStepFlowItems } from './lesson-design/lessonDesignUtils';
import planeIcon from '../../assets/create-course/plane.png';
import bgCourseMap from '../../assets/course-map/bg-map.png';
import bgCourseMapEn from '../../assets/course-map/bg-map-en.png';
import stepOneImage from '../../assets/course-map/step-1.png';
import stepTwoImage from '../../assets/course-map/step-2.png';
import stepThreeImage from '../../assets/course-map/step-3.png';
import stepFourImage from '../../assets/course-map/step-4.png';
import iconStepOne from '../../assets/course-map/icon-step-1.png';
import iconStepTwo from '../../assets/course-map/icon-step-2.png';
import iconStepThree from '../../assets/course-map/icon-step-3.png';
import iconStepFour from '../../assets/course-map/icon-step-4.png';

const { TextArea } = Input;

const quickIdeas = [
  { label: '角色扮演', labelEn: 'Role Play', text: '设计一个让学生通过角色扮演来练习目标句型的活动', textEn: 'Design an activity where students practice the target sentence pattern through role play.' },
  { label: '小组合作', labelEn: 'Teamwork', text: '设计一个通过小组合作完成任务的活动', textEn: 'Design an activity where students complete a task through group collaboration.' },
  { label: '游戏化', labelEn: 'Gamified', text: '设计一个利用游戏机制激发学生参与的活动', textEn: 'Design a gamified activity that increases student participation.' },
  { label: '真实情境', labelEn: 'Real Context', text: '设计一个结合真实情境让学生运用目标语言的活动', textEn: 'Design an authentic-context activity for students to use the target language.' },
  { label: '动手操作', labelEn: 'Hands-on', text: '设计一个需要学生动手操作的活动', textEn: 'Design a hands-on activity that lets students manipulate materials while using English.' },
];

const classicActivities = [
  { icon: '🎱', name: 'Bingo 游戏', nameEn: 'Bingo Game', meta: '词汇复习', metaEn: 'Vocabulary Review' },
  { icon: '🤔', name: '猜单词', nameEn: 'Guess the Word', meta: '听说练习', metaEn: 'Listening & Speaking' },
  { icon: '🎭', name: '情景对话', nameEn: 'Role Dialogue', meta: '口语输出', metaEn: 'Oral Output' },
  { icon: '🃏', name: '闪卡翻转', nameEn: 'Flashcard Flip', meta: '词汇记忆', metaEn: 'Vocabulary Memory' },
  { icon: '🧩', name: '拼图阅读', nameEn: 'Puzzle Reading', meta: '阅读理解', metaEn: 'Reading Comprehension' },
  { icon: '🎨', name: '我画你猜', nameEn: 'Draw and Guess', meta: '词汇运用', metaEn: 'Vocabulary Use' },
];

const defaultFlowSteps = [
  { title: '创设悬念', desc: '', teacher: '', cue: '' },
  { title: '朗读来信', desc: '', teacher: '', cue: '' },
  { title: '情绪感知', desc: '', teacher: '', cue: '' },
  { title: '发布任务', desc: '', teacher: '', cue: '' },
];

const defaultDraft = {
  title: '',
  time: 8,
  goal: '',
  activity: '',
  flowSteps: defaultFlowSteps,
  resources: '',
  scenario: '',
};

const PHASE_DURATION_LIMIT = 15;

const lessonMapMeta = {
  eng: {
    number: '1',
    className: 'engage',
    stepImage: stepOneImage,
    iconImage: iconStepOne,
    icon: 'sparkle',
    tone: '#e8d2df',
    summary: '通过沉浸式情境激发学生对动物星球的好奇心，建立学习动机',
    summaryEn: 'Spark curiosity through an immersive scenario and build learning motivation.',
    position: { left: '20.59%', top: '25.63%' },
  },
  emp: {
    number: '2',
    className: 'empower',
    stepImage: stepTwoImage,
    iconImage: iconStepTwo,
    icon: 'book',
    tone: '#d8ca8d',
    summary: '高频互动输入目标词汇，建立听觉-视觉-动觉三重联结',
    summaryEn: 'Build target language through frequent listening, visual, and movement input.',
    position: { left: '49.07%', top: '34.65%' },
  },
  exc: {
    number: '3',
    className: 'execute',
    stepImage: stepThreeImage,
    iconImage: iconStepThree,
    icon: 'checklist',
    tone: '#d7e5f7',
    summary: '在真实任务驱动下综合运用方位介词与句型进行表达',
    summaryEn: 'Use the target language in an authentic task and express ideas clearly.',
    position: { left: '34.97%', top: '63.15%' },
  },
  elv: {
    number: '4',
    className: 'elevate',
    stepImage: stepFourImage,
    iconImage: iconStepFour,
    icon: 'trophy',
    tone: '#cbb8a8',
    summary: '分享学习成果，反思收获，培养跨文化意识',
    summaryEn: 'Share outcomes, reflect on learning, and extend cultural awareness.',
    position: { left: '66.00%', top: '68.00%' },
  },
};

const parseMinutes = (value) => {
  const match = String(value || '').match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

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

const phaseDetailData = {
  Engage: {
    key: 'eng',
    title: 'Engage · 引入',
    goal: '通过沉浸式情境激发学生对动物星球的好奇心，建立学习动机',
    lang: "核心词汇：animal, where, in, on, under; 核心句型：Where is the...? It's...",
    sel: '社会情感学习：好奇心、探索欲、团队协作意识',
    perma: 'Positive Emotion（积极情绪）：通过情境创设激发兴奋和期待感',
    narrative: '学生们化身为宇飞船控制台员，接收到来自动物星球的求救信号，需要前往救援。在旅途中，他们将学习如何用英语描述动物的位置。',
    color: 'var(--eng)',
  },
  Empower: {
    key: 'emp',
    title: 'Empower · 赋能',
    goal: '高频互动输入目标词汇，建立听觉-视觉-动觉三重联结',
    lang: '强化目标词汇发音和理解，通过TPR全身反应法巩固记忆',
    sel: '专注力、听觉辨识能力、动作协调与表达',
    perma: 'Engagement（投入）：全身心参与互动，建立学习心流体验',
    narrative: '控制台收到动物星球的地图解码任务，学生们需要学会用英语理解指令才能解锁前进路线。',
    color: 'var(--emp)',
  },
  Execute: {
    key: 'exc',
    title: 'Execute · 实践',
    goal: '在真实任务驱动下综合运用方位介词与句型进行表达',
    lang: '在实际情境中运用目标语言进行交际，完成任务',
    sel: '合作学习、问题解决、创造性思维、团队协作',
    perma: 'Accomplishment（成就感）：完成任务获得成就感，建立自信',
    narrative: '终于到达动物星球！学生们分组建造动物家园，需要用英语描述每个动物的位置，帮助它们安家。',
    color: 'var(--exc)',
  },
  Elevate: {
    key: 'elv',
    title: 'Elevate · 升华',
    goal: '分享学习成果，反思收获，培养跨文化意识',
    lang: '展示学习成果，自信表达，完成学习闭环',
    sel: '自我反思、自信表达、感恩之心、分享精神',
    perma: 'Relationships（人际关系）：与同伴分享快乐，建立友谊',
    narrative: '任务完成！学生们展示自己的动物家园，向星际联盟汇报救援成果，带着满满的收获返回地球。',
    color: 'var(--elv)',
  },
};

const phaseDetailKeyMap = {
  eng: 'Engage',
  engage: 'Engage',
  emp: 'Empower',
  empower: 'Empower',
  exc: 'Execute',
  execute: 'Execute',
  elv: 'Elevate',
  elevate: 'Elevate',
};

const emptyPhases = [
  { key: 'eng', phase: 'Engage', title: 'Engage', name: '引入', duration: '15 分钟', steps: [] },
  { key: 'emp', phase: 'Empower', title: 'Empower', name: '赋能', duration: '15 分钟', steps: [] },
  { key: 'exc', phase: 'Execute', title: 'Execute', name: '实践', duration: '15 分钟', steps: [] },
  { key: 'elv', phase: 'Elevate', title: 'Elevate', name: '升华', duration: '15 分钟', steps: [] },
];

function normalizePhaseCollection(rawPhases) {
  if (!rawPhases) return null;
  if (typeof rawPhases === 'string') {
    try { return normalizePhaseCollection(JSON.parse(rawPhases)); } catch { return null; }
  }
  if (!Array.isArray(rawPhases)) return rawPhases;

  return rawPhases.reduce((acc, phase) => {
    const rawKey = phase?.key || phase?.id || phase?.phase || '';
    const key = String(rawKey).toLowerCase();
    if (key) acc[key] = phase;
    return acc;
  }, {});
}

function resolvePhasesFromCourse(course) {
  let courseData = course?.courseData || course?.course_data || course;
  if (typeof courseData === 'string') {
    try { courseData = JSON.parse(courseData); } catch { courseData = null; }
  }
  if (!courseData) return null;

  let phases = null;
  if (Array.isArray(courseData)) {
    phases = normalizePhaseCollection(courseData);
  } else if (typeof courseData?.text === 'string') {
    try {
      const parsed = JSON.parse(courseData.text);
      phases = normalizePhaseCollection(parsed.courseData || parsed.parsedCourseData || parsed);
    } catch {
      phases = null;
    }
  } else if (courseData?.text?.courseData) {
    try { phases = normalizePhaseCollection(courseData.text.courseData); } catch { phases = null; }
  } else if (courseData?.courseData) {
    phases = normalizePhaseCollection(courseData.courseData);
  } else if (courseData?.parsedCourseData) {
    phases = normalizePhaseCollection(courseData.parsedCourseData);
  } else if (courseData?.engage || courseData?.empower || courseData?.execute || courseData?.elevate) {
    phases = courseData;
  } else if (courseData?.eng || courseData?.emp || courseData?.exc || courseData?.elv) {
    phases = courseData;
  }
  if (!phases) return null;

  const phaseMapping = { engage: 'eng', empower: 'emp', execute: 'exc', elevate: 'elv' };
  const nameMapping = { engage: '引入', empower: '赋能', execute: '实践', elevate: '升华' };

  return Object.entries(phaseMapping).map(([longKey, shortKey]) => {
    const phase = phases[longKey] || phases[shortKey];
    const steps = Array.isArray(phase?.steps) ? phase.steps : [];
    return {
      key: shortKey,
      phase: longKey.charAt(0).toUpperCase() + longKey.slice(1),
      title: phase?.title || `E-${longKey.charAt(0).toUpperCase() + longKey.slice(1)}`,
      name: nameMapping[longKey],
      duration: steps.length > 0
        ? steps.reduce((acc, s) => { const m = (s.time || s.duration || '').match(/(\d+)/); return acc + (m ? parseInt(m[1]) : 0); }, 0) + ' 分钟'
        : '15 分钟',
      steps: steps.map((step) => ({
        id: step.id,
        title: step.title || '',
        duration: step.time || step.duration || '',
        goal: step.objective || step.goal || '',
        activity: step.activity || '',
        flow: step.activitySteps || step.flow || '',
        resources: step.resources || '',
        scenario: step.scenario || '',
        teacherScript: step.script || step.teacherScript || '',
      })),
    };
  });
}

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
  const map = buildCourseMap(course);

  let parsedOverview = course.courseOverview || null;
  if (parsedOverview?.text && typeof parsedOverview.text === 'string') {
    try { parsedOverview = JSON.parse(parsedOverview.text); } catch {}
  }
  if (parsedOverview?.courseOverview) parsedOverview = parsedOverview.courseOverview;

  return {
    courseTitle: course.courseTitle || course.title || map.title || '',
    age: (course.ageGroup || course.age || '').replace(/--/g, '') || '7-9',
    duration: (course.duration || '').replace(/--/g, '').replace('分钟', '') || '60',
    scale: (course.classSize || course.unit || '').replace(/--/g, '') || '',
    vocabulary: ensureArray(course.vocabularies || course.keywords),
    grammar: ensureArray(course.grammars),
    skills: ensureArray(course.languageSkills),
    paths: ensureArray(course.experiencePaths || course.experiencePath),
    theme: course.theme || map.path || '',
    taskName: course.taskName || '',
    storyContext: course.storyContext || map.storyline || '',
    keyOutcome: course.keyOutcome || map.keyOutcome || '',
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
  const [data, setData] = React.useState(emptyPhases);
  const [loading, setLoading] = React.useState(true);
  const [viewMode, setViewMode] = React.useState('map');
  const [activeMapPhase, setActiveMapPhase] = React.useState(null);
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
  const [selectedClassic, setSelectedClassic] = React.useState(null);
  const [ideaText, setIdeaText] = React.useState('');
  const [regenPhase, setRegenPhase] = React.useState(null);
  const [regenPhaseConfirm, setRegenPhaseConfirm] = React.useState(null);
  const [regenAllLoading, setRegenAllLoading] = React.useState(false);
  const [regenStep, setRegenStep] = React.useState(null);
  const [addingStep, setAddingStep] = React.useState(null);
  const [generateDraftLoading, setGenerateDraftLoading] = React.useState(false);
  const [savedSteps, setSavedSteps] = React.useState(() => {
    try { return JSON.parse(localStorage.getItem('saved-wellbeing-steps') || '[]'); }
    catch { return []; }
  });
  const [toast, setToast] = React.useState('');

  const { user } = useAuth();

  const generateCalledRef = React.useRef(false);

  const formatDuration = React.useCallback((value, fallback = 15) => {
    const minutes = parseMinutes(value) || fallback;
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

  const getClassicDisplayName = React.useCallback((name) => {
    const activity = classicActivities.find((item) => item.name === name);
    return isChinese ? name : (activity?.nameEn || name);
  }, [isChinese]);

  React.useEffect(() => {
    const fromCourse = resolvePhasesFromCourse(course);
    const fromRuntimePhases = phases === phaseTemplates ? null : resolvePhasesFromCourse(phases);
    const existing = hasLessonSteps(fromCourse)
      ? fromCourse
      : hasLessonSteps(fromRuntimePhases)
        ? fromRuntimePhases
        : null;

    if (existing) {
      setData(existing);
      setLoading(false);
      return;
    }

    if (generateCalledRef.current) return;
    generateCalledRef.current = true;

    const generateLesson = async () => {
      try {
        const response = await fetch('/api/ai/generate-course', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ...buildLessonN8nPayload(course),
            language: aiLanguage,
            outputLanguage,
          }),
        });
        const result = await response.json();

        if (result.success && result.data) {
          const courseDataRaw = result.data.courseData || result.data;
          const resolved = resolvePhasesFromCourse({ courseData: courseDataRaw });
          if (resolved) {
            setData(resolved);
            onPhasesChange?.(resolved);
          }
        }
      } catch (err) {
        console.error('生成教案失败:', err);
      } finally {
        setLoading(false);
      }
    };

    generateLesson();
  }, []);

  const updateData = async (next) => {
    const updated = next.map((phase) => {
      const totalMin = phase.steps.reduce((acc, s) => {
        const m = (s.duration || '').match(/(\d+)/);
        return acc + (m ? parseInt(m[1]) : 0);
      }, 0);
      return {
        ...phase,
        duration: totalMin > 0 ? `${totalMin} 分钟` : phase.duration,
      };
    });

    setData(updated);
    onPhasesChange?.(updated);
    const nextCourseData = buildLessonCourseData(updated, course?.courseData || course?.course_data || {});
    onCourseChange?.({
      ...course,
      courseData: nextCourseData,
    }, { source: 'lesson' });

    if (course?.id && !String(course.id).startsWith('created-')) {
      try {
        await apiService.updateCourse(course.id, { courseData: nextCourseData });
      } catch (err) {
        console.warn('自动保存教案失败:', err);
      }
    }
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
    setAddPhase(phase);
    setGenMode('ai');
    setSelectedClassic(null);
    setIdeaText('');
    setInsertTarget(options.insertIndex != null ? { phaseKey: phase.key, insertIndex: options.insertIndex } : null);
    if (step) {
      const timeMatch = String(step.duration || '').match(/(\d+)/);
      setRegenTarget({ phaseKey: phase.key, step });
      addForm.setFieldsValue({
        title: step.title || '',
        time: timeMatch ? parseInt(timeMatch[1]) : 8,
        goal: step.goal || '',
        activity: step.activity || '',
        resources: step.resources || '',
        scenario: step.scenario || '',
      });
    } else {
      setRegenTarget(null);
      addForm.setFieldsValue(defaultDraft);
    }
    setAddOpen(true);
  };

  const openInsertStepBefore = (phase, stepIndex) => {
    setMenuKey(null);
    openAddStep(phase, null, { insertIndex: stepIndex });
  };

  const openPhaseDetail = (phase) => {
    setMenuKey(null);
    const detailKey = phaseDetailKeyMap[String(phase.phase || phase.key || '').toLowerCase()] || phase.phase;
    setPhaseDetail(phaseDetailData[detailKey] || null);
  };

  const fillIdea = (text) => {
    setIdeaText((current) => (current ? `${current}，${text}` : text));
  };

  const fillDraftFromIdea = (source = ideaText, classicName = '') => {
    const theme = classicName || source || '小组合作挑战';
    addForm.setFieldsValue({
      title: classicName || '星球任务挑战',
      time: 8,
      goal: '在真实任务中理解并运用目标词汇与句型，提升听说表达的自信。',
      activity: `学生围绕“${theme}”完成分组互动，并在过程中使用目标语言进行沟通。`,
      flowSteps: [
        {
          title: '创设悬念',
          desc: '教师展示任务线索，快速建立活动情境和角色身份。',
          teacher: 'Shhh... Listen, everyone. A new mission is coming.',
          cue: '神秘地展示任务线索；停顿等待学生自然回应',
        },
        {
          title: '朗读来信',
          desc: '教师示范目标表达，学生跟读并理解关键语言。',
          teacher: 'Let me read the message. Please listen for the key words.',
          cue: '放慢语速朗读；指向关键词图片或板书',
        },
        {
          title: '情绪感知',
          desc: '学生分组完成互动任务，教师巡视并提供语言支持。',
          teacher: 'How do they feel? Can you show me with your face?',
          cue: '用表情和手势示范；鼓励学生用短句回应',
        },
        {
          title: '发布任务',
          desc: '小组展示结果，教师总结语言亮点并给出下一步挑战。',
          teacher: "Now let's try it together. Work with your team.",
          cue: '指向任务卡；确认每组知道要完成的产出',
        },
      ],
      resources: '任务卡、图片卡、计时器、奖励贴纸',
      scenario: '课堂变成任务现场，学生以小队身份完成阶段挑战。',
    });
  };

  const parseFlowStepsForForm = (flow, teacherScript) => {
    const flowLines = (flow || '').split('\n').filter(Boolean);
    const scriptLines = (teacherScript || '').split('\n').filter(Boolean);

    const distributeScript = scriptLines.length <= 1 && teacherScript;
    const scriptChunks = distributeScript
      ? chunkArray(teacherScript.split(/[。！？]+/).filter((s) => s.trim()), Math.max(1, flowLines.length || defaultFlowSteps.length))
      : [];

    const defaultCues = [
      '用神秘、轻声的语气开场，展示关键道具或画面，引发学生好奇心。',
      '朗读或展示核心内容，放慢语速，配合表情和手势帮助理解。',
      '引导学生观察、体会角色感受，用面部表情或肢体模仿情绪。',
      '明确任务身份和最终挑战，推动学生进入下一环节。',
    ];

    const steps = flowLines.map((line, i) => {
      const colonIndex = line.indexOf('：');
      const title = colonIndex > -1 ? line.slice(0, colonIndex) : line;
      const desc = colonIndex > -1 ? line.slice(colonIndex + 1) : '';
      let teacher = '';
      let cue = '';

      if (distributeScript) {
        teacher = scriptChunks[i].length > 0 ? scriptChunks[i].join('。') + '。' : '';
        cue = defaultCues[i] || '';
      } else if (scriptLines[i]) {
        const cueMatch = scriptLines[i].match(/【动作\/引导】(.*)$/);
        if (cueMatch) {
          cue = cueMatch[1].trim();
          teacher = scriptLines[i].replace(/【动作\/引导】.*$/, '').trim();
        } else {
          teacher = scriptLines[i].trim();
          cue = defaultCues[i] || '';
        }
      }

      return { title, desc, teacher, cue };
    });

    if (steps.length > 0) return steps;

    return defaultFlowSteps.map((s, i) => ({
      title: s.title,
      desc: s.desc,
      teacher: scriptChunks[i] && scriptChunks[i].length > 0 ? scriptChunks[i].join('。') + '。' : '',
      cue: s.cue,
    }));
  };

  const chunkArray = (arr, count) => {
    const size = Math.max(1, Math.ceil(arr.length / count));
    return Array.from({ length: count }, (_, i) => arr.slice(i * size, (i + 1) * size));
  };

  const handleGenerateDraft = async (isClassic = false) => {
    const phase = addPhase;
    if (!phase) return;

    setGenerateDraftLoading(true);
    try {
      const targetPhase = data.find((p) => p.key === phase.key);
      const currentSteps = targetPhase?.steps || [];
      const insertIndex = insertTarget?.phaseKey === phase.key ? insertTarget.insertIndex : currentSteps.length;

      const otherPhases = {};
      data.forEach((p) => {
        if (p.key !== phase.key) {
          otherPhases[longPhaseKey(p.key)] = { title: p.title, steps: p.steps };
        }
      });

      const response = await fetch('/api/ai/generate-step', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          phaseKey: longPhaseKey(phase.key),
          language: aiLanguage,
          outputLanguage,
          stepId: `${longPhaseKey(phase.key)}-draft`,
          title: course?.courseTitle || course?.title || '',
          age: course?.ageGroup || course?.age || '7-9',
          duration: course?.duration || '60',
          scale: course?.classSize || '',
          vocabulary: ensureArray(course?.vocabularies || course?.keywords),
          grammar: ensureArray(course?.grammars),
          theme: course?.theme || '',
          userId: user?.id || null,
          organizationId: user?.organizationId || null,
          requirements: isClassic ? `经典活动：${selectedClassic}` : (ideaText || ''),
          currentStep: null,
          siblingSteps: currentSteps.map((s) => ({ title: s.title, time: s.duration })),
          otherPhases,
          insertIndex,
          prevStep: insertIndex > 0 ? currentSteps[insertIndex - 1] : null,
          nextStep: insertIndex < currentSteps.length ? currentSteps[insertIndex] : null,
        }),
      });
      const result = await response.json();

      if (result.success && result.data?.step) {
        const step = normalizeStep(result.data.step);
        const timeMatch = String(step.duration || '').match(/(\d+)/);

        addForm.setFieldsValue({
          title: step.title || '',
          time: timeMatch ? parseInt(timeMatch[1]) : 8,
          goal: step.goal || '',
          activity: step.activity || '',
          flowSteps: parseFlowStepsForForm(step.flow, step.teacherScript),
          resources: step.resources || '',
          scenario: step.scenario || '',
        });
      }
    } catch (err) {
      console.error('生成草案失败:', err);
    } finally {
      setGenerateDraftLoading(false);
    }
  };

  const addDraftStep = async () => {
    const values = await addForm.validateFields();
    const target = addPhase || data[0];
    const flowSteps = (values.flowSteps?.length ? values.flowSteps : defaultFlowSteps)
      .map((item, index) => ({
        title: item?.title || defaultFlowSteps[index]?.title || `步骤${index + 1}`,
        desc: item?.desc || '',
        teacher: item?.teacher || '',
        cue: item?.cue || '',
      }));
    const flow = flowSteps.map((item) => `${item.title}：${item.desc}`).join('\n');
    const teacherScript = flowSteps
      .map((item) => [item.teacher, item.cue ? `【动作/引导】${item.cue}` : ''].filter(Boolean).join(' '))
      .filter(Boolean)
      .join('\n');
    const nextStep = {
      title: values.title || '新活动环节',
      duration: `${values.time || 8}分钟`,
      goal: values.goal || '',
      activity: values.activity || '',
      flow,
      resources: values.resources || '',
      scenario: values.scenario || '',
      teacherScript: teacherScript || 'Let\u2019s try this mission together. Listen, speak, and help your team.',
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
    await handleRegenerateStep(adjustTarget.phaseKey, adjustTarget.stepIndex, requirements);
    setAdjustLoading(false);
    setAdjustTarget(null);
  };

  const longPhaseKey = (shortKey) => {
    const map = { eng: 'engage', emp: 'empower', exc: 'execute', elv: 'elevate' };
    return map[shortKey] || shortKey;
  };

  const handleRegeneratePhase = async (phaseKey, sourceData = data, options = {}) => {
    if (!options.silent) setRegenPhase(phaseKey);
    try {
      const response = await fetch('/api/ai/regenerate-phase', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          phaseKey: longPhaseKey(phaseKey),
          language: aiLanguage,
          outputLanguage,
          title: course?.courseTitle || course?.title || '',
          age: course?.ageGroup || course?.age || '7-9',
          duration: course?.duration || '60',
          scale: course?.classSize || '',
          vocabulary: ensureArray(course?.vocabularies || course?.keywords),
          grammar: ensureArray(course?.grammars),
          theme: course?.theme || '',
          userId: user?.id || null,
          organizationId: user?.organizationId || null,
          currentCourseData: dataToCoursePhases(sourceData),
        }),
      });
      const result = await response.json();
      if (result.success && result.data?.steps) {
        const newSteps = result.data.steps.map(normalizeStep);
        const nextData = sourceData.map((phase) =>
          phase.key === phaseKey ? { ...phase, steps: newSteps } : phase
        );
        if (!options.deferUpdate) await updateData(nextData);
        return nextData;
      }
      return sourceData;
    } catch (err) {
      console.error('重新生成阶段失败:', err);
      return sourceData;
    } finally {
      if (!options.silent) setRegenPhase(null);
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
          regenerate: true,
          currentCourseData: dataToCoursePhases(data),
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success || !result.data) {
        throw new Error(result?.error || '教案重新生成失败');
      }

      const courseDataRaw = result.data.courseData || result.data;
      const resolved = resolvePhasesFromCourse({ courseData: courseDataRaw });
      if (!resolved) {
        throw new Error('N8N 未返回有效教案数据');
      }

      await updateData(resolved);
      toastMessage(t('workflow.lesson.regenerateDone'));
    } catch (err) {
      console.error('重新生成完整教案失败:', err);
      toastMessage(err?.message || '教案重新生成失败，请重试');
    } finally {
      setRegenPhase(null);
      setRegenAllLoading(false);
    }
  };

  const handleAddStep = async (phaseKey, insertIndex) => {
    setAddingStep(phaseKey);
    try {
      const phase = data.find((p) => p.key === phaseKey);
      const currentSteps = phase?.steps || [];
      const idx = insertIndex != null ? insertIndex : currentSteps.length;

      const otherPhases = {};
      data.forEach((p) => {
        if (p.key !== phaseKey) {
          otherPhases[longPhaseKey(p.key)] = { title: p.title, steps: p.steps };
        }
      });

      const response = await fetch('/api/ai/generate-step', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          phaseKey: longPhaseKey(phaseKey),
          language: aiLanguage,
          outputLanguage,
          title: course?.courseTitle || course?.title || '',
          age: course?.ageGroup || course?.age || '7-9',
          duration: course?.duration || '60',
          scale: course?.classSize || '',
          vocabulary: ensureArray(course?.vocabularies || course?.keywords),
          grammar: ensureArray(course?.grammars),
          theme: course?.theme || '',
          userId: user?.id || null,
          organizationId: user?.organizationId || null,
          existingStepCount: currentSteps.length,
          currentSteps: currentSteps.map((s) => ({ title: s.title, time: s.duration, objective: s.goal })),
          otherPhases,
          insertIndex: idx,
          prevStep: idx > 0 ? currentSteps[idx - 1] : null,
          nextStep: idx < currentSteps.length ? currentSteps[idx] : null,
        }),
      });
      const result = await response.json();
      if (result.success && result.data?.step) {
        const newStep = normalizeStep(result.data.step);
        const newSteps = [...currentSteps];
        newSteps.splice(idx, 0, newStep);
        updateData(data.map((p) =>
          p.key === phaseKey ? { ...p, steps: newSteps } : p
        ));
        setOpenCards((prev) => new Set(prev).add(`${phaseKey}-${idx}`));
      }
    } catch (err) {
      console.error('添加环节失败:', err);
    } finally {
      setAddingStep(null);
    }
  };

  const handleRegenerateStep = async (phaseKey, stepIndex, requirements = '') => {
    const phase = data.find((p) => p.key === phaseKey);
    const currentSteps = phase?.steps || [];
    const currentStep = currentSteps[stepIndex];
    const cardKey = `${phaseKey}-${stepIndex}`;
    setRegenStep(cardKey);
    try {
      const siblingSteps = currentSteps.filter((_, i) => i !== stepIndex);
      const otherPhases = {};
      data.forEach((p) => {
        if (p.key !== phaseKey) {
          otherPhases[longPhaseKey(p.key)] = { title: p.title, steps: p.steps };
        }
      });

      const response = await fetch('/api/ai/generate-step', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          phaseKey: longPhaseKey(phaseKey),
          language: aiLanguage,
          outputLanguage,
          stepId: currentStep?.id,
          title: course?.courseTitle || course?.title || '',
          age: course?.ageGroup || course?.age || '7-9',
          duration: course?.duration || '60',
          scale: course?.classSize || '',
          vocabulary: ensureArray(course?.vocabularies || course?.keywords),
          grammar: ensureArray(course?.grammars),
          theme: course?.theme || '',
          requirements,
          userId: user?.id || null,
          organizationId: user?.organizationId || null,
          currentStep: currentStep ? { id: currentStep.id, title: currentStep.title, time: currentStep.duration, objective: currentStep.goal } : null,
          siblingSteps: siblingSteps.map((s) => ({ title: s.title, time: s.duration })),
          otherPhases,
        }),
      });
      const result = await response.json();
      if (result.success && result.data?.step) {
        const newStep = normalizeStep(result.data.step);
        updateData(data.map((p) =>
          p.key === phaseKey
            ? { ...p, steps: p.steps.map((s, i) => (i === stepIndex ? newStep : s)) }
            : p
        ));
      }
    } catch (err) {
      console.error('重新生成环节失败:', err);
    } finally {
      setRegenStep(null);
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

  const handleSaveStep = (phaseKey, stepIndex) => {
    const phase = data.find((p) => p.key === phaseKey);
    const step = phase?.steps?.[stepIndex];
    if (!step) {
      console.warn('[saveStep] 未找到环节:', { phaseKey, stepIndex });
      return;
    }
    const record = {
      savedAt: Date.now(),
      title: step.title,
      goal: step.goal,
      activity: step.activity,
      flow: step.flow,
      duration: step.duration,
      resources: step.resources,
      scenario: step.scenario,
      teacherScript: step.teacherScript,
    };
    const updated = [record, ...savedSteps.filter((s) => s.title !== record.title)];
    setSavedSteps(updated);
    localStorage.setItem('saved-wellbeing-steps', JSON.stringify(updated));
    setMenuKey(null);
    toastMessage(isChinese ? `已收藏「${record.title}」` : `Saved "${getDisplayText(record.title)}"`);
  };

  const handleUnsaveStep = (phaseKey, stepIndex) => {
    const phase = data.find((p) => p.key === phaseKey);
    const step = phase?.steps?.[stepIndex];
    if (!step) return;
    const updated = savedSteps.filter((s) => s.title !== step.title);
    setSavedSteps(updated);
    localStorage.setItem('saved-wellbeing-steps', JSON.stringify(updated));
    setMenuKey(null);
    toastMessage(isChinese ? `已取消收藏「${step.title}」` : `Removed "${getDisplayText(step.title)}" from favorites`);
  };

  const isStepSaved = (phaseKey, stepIndex) => {
    const phase = data.find((p) => p.key === phaseKey);
    const step = phase?.steps?.[stepIndex];
    if (!step) return false;
    return savedSteps.some((s) => s.title === step.title);
  };

  const handlePinStep = (phaseKey, stepIndex) => {
    const phase = data.find((p) => p.key === phaseKey);
    if (!phase || stepIndex <= 0) return;
    const steps = [...phase.steps];
    const [pinned] = steps.splice(stepIndex, 1);
    steps.unshift(pinned);
    updateData(data.map((p) => (p.key === phaseKey ? { ...p, steps } : p)));
    setMenuKey(null);
    toastMessage(isChinese ? '已置顶到该阶段首位' : 'Pinned to the top of this phase');
  };

  const handleSelectSavedStep = (record) => {
    const timeMatch = (record.duration || '').match(/(\d+)/);
    addForm.setFieldsValue({
      title: record.title || '',
      time: timeMatch ? parseInt(timeMatch[1]) : 8,
      goal: record.goal || '',
      activity: record.activity || '',
      flowSteps: parseFlowStepsForForm(record.flow, record.teacherScript),
      resources: record.resources || '',
      scenario: record.scenario || '',
    });
  };

  const handleDeleteSavedStep = (record) => {
    const updated = savedSteps.filter((s) => s.savedAt !== record.savedAt);
    setSavedSteps(updated);
    localStorage.setItem('saved-wellbeing-steps', JSON.stringify(updated));
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

  const normalizeStep = (step) => ({
    id: step.id,
    title: step.title || '',
    duration: step.time || step.duration || '',
    goal: step.objective || step.goal || '',
    activity: step.activity || '',
    flow: step.activitySteps || step.flow || '',
    resources: step.resources || '',
    scenario: step.scenario || '',
    teacherScript: step.script || step.teacherScript || '',
  });

  const renderMapIcon = (icon) => {
    if (icon === 'book') return <ClipboardList size={28} />;
    if (icon === 'checklist') return <ListChecks size={28} />;
    if (icon === 'trophy') return <Star size={30} />;
    return <Sparkles size={28} />;
  };

  const renderOverviewStepCard = (phase, step, index, keyPrefix = '') => {
    const cardKey = `${keyPrefix}${phase.key}-${index}`;
    const isOpen = openCards.has(cardKey);

    return (
      <article
        className={`step-card ${isOpen ? 'open' : ''}`}
        key={cardKey}
        onClick={() => toggleCard(cardKey)}
      >
        <div className="step-summary">
          <div className="step-chevron"><ChevronRight size={12} /></div>
          <button type="button" className="step-thumb-placeholder" title="点击生成图片" onClick={(event) => event.stopPropagation()}>
            <ImageIcon size={20} />
          </button>
          <div className="step-main">
            <div className="step-name">
              <span className="step-title-text">{getDisplayText(step.title)}</span>
              <span className="step-dur-badge">{formatDuration(step.duration, 8)}</span>
            </div>
            <div className="step-lo-preview">{compactOverviewText(getDisplayText(step.goal), 76)}</div>
          </div>
          <div className="step-right-ctrl" onClick={(event) => event.stopPropagation()}>
            <button
              className={`step-menu-btn ${menuKey === cardKey ? 'active' : ''}`}
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
                onSave={() => handleSaveStep(phase.key, index)}
                onUnsave={() => handleUnsaveStep(phase.key, index)}
                isSaved={isStepSaved(phase.key, index)}
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
                {compactOverviewText(getDisplayText(step.goal))}
              </div>
            </div>
            <div className="step-brief-item">
              <div className="step-detail-label"><ClipboardList size={13} />{t('lesson.activitySummary')}</div>
              <div className="step-detail-body">
                {compactOverviewText(getDisplayText(step.activity), 132)}
              </div>
            </div>
            <div className="step-brief-item">
              <div className="step-detail-label"><ListChecks size={13} />{t('lesson.activityFlow')}</div>
              <div className="step-flow-card">
                <div className="step-flow-list">
                  {buildStepFlowItems(step, !isChinese).map((item) => (
                    <div className="step-flow-item" key={`${cardKey}-${item.title}`}>
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
                onSave={() => handleSaveStep(phase.key, index)}
                onUnsave={() => handleUnsaveStep(phase.key, index)}
                isSaved={isStepSaved(phase.key, index)}
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
    const overflowMinutes = Math.max(0, phaseMinutes - PHASE_DURATION_LIMIT);
    const phaseMapMeta = lessonMapMeta[phase.key] || lessonMapMeta.eng;

    return (
      <section className={`tbl-phase-card ${phase.key}`} data-fixed="true" data-duration="15" key={`${keyPrefix}${phase.key}`}>
        <div className="tbl-phase-hd">
          <img className="tbl-phase-number-img" src={phaseMapMeta.stepImage} alt="" />
          <div className="tbl-phase-hd-left">
            <div className="tbl-phase-title-row">
              <span className="tbl-phase-title">{getPhaseTitle(phase)}</span>
              {getPhaseName(phase) && <span className="tbl-phase-cn">{getPhaseName(phase)}</span>}
            </div>
            <div className="tbl-phase-second-row">
              <span className="tbl-phase-sub">{t('workflow.lesson.stepCount', { count: phase.steps.length })}</span>
              <span className={`tbl-phase-meta-dur${phaseMinutes > PHASE_DURATION_LIMIT ? ' is-over-limit' : ''}`}>
                {formatDuration(phase.duration)}
              </span>
            </div>
          </div>
          <div className="tbl-phase-menu-wrap">
            <button
              className="tbl-phase-edit-btn"
              title={t('lesson.viewPhaseDetail')}
              aria-label={t('lesson.viewPhaseDetail')}
              onClick={(event) => {
                event.stopPropagation();
                openPhaseDetail(phase);
              }}
            >
              <MoreVertical size={16} />
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
            <span className="tbl-phase-duration-warning-icon">!</span>
            <span>{t('lesson.phaseDurationSuggestion', { defaultValue: isChinese ? '建议调整阶段内活动时长在15分钟以内' : 'Keep activities in this phase within 15 minutes' })}</span>
          </div>
        )}

        <div className="tbl-steps-list">
          <div className="tbl-add-step-top">
            <button type="button" className="tbl-add-step-btn" onClick={() => openAddStep(phase)} disabled={addingStep === phase.key}>
              {addingStep === phase.key ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
              {addingStep === phase.key ? t('workflow.lesson.generatingShort') : t('workflow.lesson.addStep')}
            </button>
          </div>

          {phase.steps.map((step, index) => renderOverviewStepCard(phase, step, index, keyPrefix))}
        </div>
      </section>
    );
  };

  const renderLessonMap = () => {
    const selected = activeMapPhase ? data.find((phase) => phase.key === activeMapPhase.key) : null;
    const selectedMeta = selected ? lessonMapMeta[selected.key] : null;

    return (
      <div className={`lesson-map-shell ${selected ? 'drawer-open' : ''}`}>
        <div className="lesson-map-canvas" style={{ backgroundImage: `url(${isChinese ? bgCourseMap : bgCourseMapEn})` }}>
          <div className="lesson-map-art">
            {data.map((phase) => {
              const meta = lessonMapMeta[phase.key] || lessonMapMeta.eng;
              const phaseMinutes = parseMinutes(phase.duration);
              const summary = isChinese
                ? (phase.steps.map((step) => step.goal).filter(Boolean).join('；') || meta.summary)
                : meta.summaryEn;
              return (
                <article
                  key={phase.key}
                  className={`lesson-map-card ${meta.className}`}
                  style={{ left: meta.position.left, top: meta.position.top, '--map-card-bg': meta.tone }}
                >
                  <img className="lesson-map-step-num" src={meta.stepImage} alt="" />
                  <div className="lesson-map-card-main">
                    <div className="lesson-map-card-head">
                      <h3>{getPhaseTitle(phase)} {getPhaseName(phase)}</h3>
                      <span className="lesson-map-card-icon">
                        {meta.iconImage ? <img src={meta.iconImage} alt="" /> : renderMapIcon(meta.icon)}
                      </span>
                    </div>
                    <p>{getDisplayText(summary)}</p>
                    <div className="lesson-map-card-meta">
                      <strong>{t('workflow.lesson.stepCount', { count: phase.steps.length })}</strong>
                      <span>{formatDuration(phaseMinutes > 0 ? phase.duration : '', 15)}</span>
                    </div>
                    <button type="button" className="lesson-map-detail-btn" onClick={() => setActiveMapPhase(phase)}>
                      {t('lesson.detail')} <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {selected && selectedMeta && (
          <aside className={`lesson-map-drawer ${selectedMeta.className}`} style={{ '--map-card-bg': selectedMeta.tone }}>
            <button type="button" className="lesson-map-drawer-close floating" onClick={() => setActiveMapPhase(null)} aria-label={t('common.close')}>
              <X size={22} />
            </button>
            {renderOverviewPhaseCard(selected, 'map-')}
          </aside>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div id="ed-tbl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div className="tbl-loading-spinner" />
          <p style={{ color: '#818997', marginTop: 12 }}>{t('workflow.lesson.generating')}</p>
        </div>
      </div>
    );
  }

  return (
    <div id="ed-tbl" className={`${viewMode === 'map' ? 'lesson-map-mode' : ''} ${isChinese ? 'lesson-lang-zh' : 'lesson-lang-en'}`}>
      {toast && <div className="tbl-toast">{toast}</div>}
      <div className="lesson-design-page-header">
        <div className="lesson-design-title-row">
          <h2 className="lesson-design-page-title">{isChinese ? `${t('workflow.lesson.title')}|Lesson Plan` : t('workflow.lesson.title')}</h2>
          <div className="lesson-design-view-switch" role="group" aria-label={t('workflow.lesson.title')}>
            <button type="button" className={viewMode === 'map' ? 'active' : ''} onClick={() => setViewMode('map')}>{t('workflow.lesson.mapMode')}</button>
            <button type="button" className={viewMode === 'overview' ? 'active' : ''} onClick={() => setViewMode('overview')}>{t('workflow.lesson.overviewMode')}</button>
          </div>
          <img src={planeIcon} alt="" className="lesson-design-plane" />
        </div>
        <div className="lesson-design-actions">
          <Button className="btn-ghost" icon={<RefreshCw size={16} />} loading={regenAllLoading} onClick={handleRegenerateAll}>
            {regenAllLoading ? t('workflow.lesson.generatingShort') : t('workflow.lesson.regenerate')}
          </Button>
          <Button className="btn-next-step" onClick={onNext}>
            {t('workflow.nextStep')}
          </Button>
        </div>
      </div>
      <div className="tbl-inner-toolbar">
        <div className="tbl-ib-left">
          <button type="button" className="tbl-ib-btn" disabled title="撤回 (Ctrl+Z)"><RotateCcw size={14} /></button>
          <button type="button" className="tbl-ib-btn" disabled title="恢复 (Ctrl+Y)"><RotateCw size={14} /></button>
          <span className="tbl-ib-sep" />
          <span className="tbl-ib-label">{t('workflow.lesson.title')}</span>
        </div>
        <div className="tbl-ib-right">
          <div className="asi-dot-sm" />
          <span className="asi-label-sm">{t('workflow.lesson.saved')}</span>
        </div>
      </div>

      {viewMode === 'map' ? renderLessonMap() : (
        <div className="tbl-kanban">
          {data.map((phase) => renderOverviewPhaseCard(phase))}
        </div>
      )}
      {regenPhaseConfirm && (
        <div className="mo on" onMouseDown={(event) => event.target === event.currentTarget && setRegenPhaseConfirm(null)}>
          <div className="modal" style={{ width: 'min(420px, 90vw)', background: '#fff', borderRadius: 16, border: '2px solid #253142', boxShadow: '6px 6px 0 rgba(37,49,66,.24)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="modal-hd">
              <div className="modal-t">{t('lesson.regeneratePhase')}</div>
              <button type="button" className="modal-x" onClick={() => setRegenPhaseConfirm(null)}>×</button>
            </div>
            <div className="modal-body" style={{ padding: '18px 24px' }}>
              <p style={{ fontSize: 14, color: '#575F6E', lineHeight: 1.6 }}>
                {t('lesson.confirmRegeneratePhase')}
              </p>
            </div>
            <div className="modal-ft">
              <button type="button" className="mo-btn-cancel" onClick={() => setRegenPhaseConfirm(null)}>{t('common.cancel')}</button>
              <button type="button" className="mo-btn-primary" onClick={() => { const pk = regenPhaseConfirm; setRegenPhaseConfirm(null); handleRegeneratePhase(pk); }}>
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
              <button type="button" className="modal-x" onClick={() => setPhaseDetail(null)} aria-label={t('common.close')}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div className="pem-wrap" style={{ '--pem-accent': phaseDetail.color }}>
                <div className="pem-summary">
                  <div className="pem-summary-label">{t('lesson.phasePosition')}</div>
                  <div className="pem-summary-text">{getDisplayText(phaseDetail.goal)}</div>
                </div>
                <div className="pem-grid">
                  <div className="pem-section">
                    <div className="pem-label">{t('lesson.languageGoal')}</div>
                    <div className="pem-content">{getDisplayText(phaseDetail.lang)}</div>
                  </div>
                  <div className="pem-section">
                    <div className="pem-label">{t('lesson.selFocus')}</div>
                    <div className="pem-content">{getDisplayText(phaseDetail.sel)}</div>
                  </div>
                  <div className="pem-section">
                    <div className="pem-label">{t('lesson.permaFocus')}</div>
                    <div className="pem-content">{getDisplayText(phaseDetail.perma)}</div>
                  </div>
                  <div className="pem-section pem-section-narrative">
                    <div className="pem-label">{t('lesson.phaseNarrative')}</div>
                    <div className="pem-content pem-narrative">{getDisplayText(phaseDetail.narrative)}</div>
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

      {addOpen && (
        <div className="mo on" id="mo-add-step" onMouseDown={(event) => event.target === event.currentTarget && (setAddOpen(false), setRegenTarget(null), setInsertTarget(null))}>
          <div className="modal modal-add-step">
            <div className="modal-hd">
              <div>
                <div className="modal-t" id="addStepTitle">
                  {regenTarget ? t('lesson.regenerateStep') : insertTarget ? t('lesson.insertStep') : t('lesson.addStep')} <strong className={`as-phase-${addPhase?.key || 'eng'}`}>{addPhase?.phase || 'Engage'}</strong>
                </div>
                <div id="asPhaseTag">
                  {course?.courseTitle || course?.title || 'Unit 3: Animals（神奇的动物）'} · {course?.ageGroup || course?.age || '8-9岁'} / {course?.grade || '三年级 G3'}
                </div>
              </div>
              <button type="button" className="modal-x" onClick={() => { setAddOpen(false); setRegenTarget(null); setInsertTarget(null); }} aria-label={t('common.close')}><X size={22} /></button>
            </div>

            <div className="modal-body as-modal-body">
              <div className="as-left-panel">
                <div className="as-gen-tabs">
                  <button className={`as-gen-tab ${genMode === 'ai' ? 'active' : ''}`} type="button" onClick={() => setGenMode('ai')}>
                    <Sparkles size={13} /> {t('lesson.aiGenerate')}
                  </button>
                  <button className={`as-gen-tab ${genMode === 'classic' ? 'active' : ''}`} type="button" onClick={() => setGenMode('classic')}>
                    <Star size={13} /> {t('lesson.classicActivities')}
                  </button>
                  <button className={`as-gen-tab ${genMode === 'mine' ? 'active' : ''}`} type="button" onClick={() => setGenMode('mine')}>
                    <Heart size={13} /> {t('lesson.myFavorites')}
                  </button>
                </div>

                <div className={`as-gen-panel ${genMode === 'ai' ? 'active' : ''}`} id="asPanel-ai">
                  <div className="as-quick-hint">
                    <div className="as-qh-label">{t('lesson.promptHint', { defaultValue: isChinese ? '💡 提示词（点击直接填入）' : 'Prompt ideas (click to fill)' })}</div>
                    <div className="as-qh-chips">
                      {quickIdeas.map((item) => (
                        <button className="as-qh-chip" type="button" key={item.label} onClick={() => fillIdea(isChinese ? item.text : item.textEn)}>
                          {isChinese ? item.label : item.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="as-panel-label">{t('lesson.activityIdea')}</div>
                  <TextArea
                    className="as-gen-textarea"
                    value={ideaText}
                    onChange={(event) => setIdeaText(event.target.value)}
                    placeholder={t('lesson.activityIdeaPlaceholder')}
                  />
                  <button type="button" className="as-gen-btn" onClick={() => handleGenerateDraft()} disabled={generateDraftLoading}>
                    <Sparkles size={14} />
                    {generateDraftLoading ? t('workflow.lesson.generatingShort') : t('lesson.generateDraft')}
                  </button>
                </div>

                <div className={`as-gen-panel ${genMode === 'classic' ? 'active' : ''}`} id="asPanel-classic">
                  <div className="as-panel-label classic-label">{t('lesson.chooseClassicActivity', { defaultValue: isChinese ? '选择一种经典活动' : 'Choose a classic activity' })}</div>
                  <div className="as-classic-grid" id="asClassicGrid">
                    {classicActivities.map((activity) => (
                      <button
                        type="button"
                        className={`as-classic-card ${selectedClassic === activity.name ? 'selected' : ''}`}
                        key={activity.name}
                        onClick={() => {
                          setSelectedClassic(activity.name);
                        }}
                      >
                        <div className="as-classic-icon">{activity.icon}</div>
                        <div className="as-classic-name">{isChinese ? activity.name : activity.nameEn}</div>
                        <div className="as-classic-meta">{isChinese ? activity.meta : activity.metaEn}</div>
                      </button>
                    ))}
                  </div>
                  {selectedClassic && <div className="as-selected-hint">{t('lesson.selected')}<strong>{getClassicDisplayName(selectedClassic)}</strong></div>}
                  {selectedClassic && (
                    <button type="button" className="as-gen-btn classic-gen" onClick={() => handleGenerateDraft(true)} disabled={generateDraftLoading}>
                      <Sparkles size={14} />
                      {generateDraftLoading ? t('workflow.lesson.generatingShort') : t('lesson.generateDraft')}
                    </button>
                  )}
                </div>

                <div className={`as-gen-panel ${genMode === 'mine' ? 'active' : ''}`} id="asPanel-mine">
                  {savedSteps.length === 0 ? (
                    <div id="asSavedList" className="as-saved-empty">
                      {t('lesson.noFavorites', { defaultValue: isChinese ? '暂无收藏环节或保存的活动' : 'No saved steps or favorite activities yet' })}<br />
                      <span>{t('lesson.favoriteTip', { defaultValue: isChinese ? '在环节卡片右上角菜单中点击「收藏此环节」存入此处' : 'Use the step card menu to save favorites here.' })}</span>
                    </div>
                  ) : (
                    <div id="asSavedList" className="as-saved-list">
                      {savedSteps.map((record) => (
                        <div
                          className="as-saved-item"
                          key={record.savedAt}
                          onClick={() => handleSelectSavedStep(record)}
                        >
                          <div className="as-saved-item-main">
                            <div className="as-saved-item-title">{record.title}</div>
                            <div className="as-saved-item-meta">{record.duration} · {record.goal?.slice(0, 50)}{(record.goal?.length || 0) > 50 ? '...' : ''}</div>
                          </div>
                          <button
                            type="button"
                            className="as-saved-item-del"
                            onClick={(e) => { e.stopPropagation(); handleDeleteSavedStep(record); }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="as-right-panel">
                <div className="as-right-hd">
                  <span className="as-right-title">{t('lesson.activityDraft', { defaultValue: isChinese ? '活动草案' : 'Activity Draft' })}</span>
                  <span className={`as-right-tag ${generateDraftLoading ? 'ai' : genMode === 'ai' ? 'ai' : genMode === 'mine' ? 'mine' : ''}`}>
                    {generateDraftLoading ? t('lesson.generating') : genMode === 'ai' ? t('workflow.stepState.pending') : genMode === 'classic' ? t('workflow.stepState.pending') : t('lesson.myFavorites')}
                  </span>
                </div>

                <Form form={addForm} className="as-draft-form" layout="vertical">
                  <div className="as-draft-row">
	                    <Form.Item className="as-draft-field as-draft-name" label={t('lesson.stepName')} name="title">
                      <Input className="as-draft-input" placeholder={t('lesson.stepNamePlaceholder', { defaultValue: isChinese ? '起一个吸引人的名字' : 'Give it an engaging name' })} />
                    </Form.Item>
	                    <Form.Item className="as-draft-field as-draft-time" label={t('lesson.stepDuration')} name="time">
                      <InputNumber className="as-draft-input" min={1} max={40} controls={false} />
                    </Form.Item>
                  </div>
	                  <Form.Item className="as-draft-field" label={t('lesson.languageGoal')} name="goal">
                    <TextArea className="as-draft-textarea" placeholder={t('lesson.languageGoalPlaceholder', { defaultValue: isChinese ? '例如：听力输入：核心情绪词（sad, happy, lonely, bored），核心句型 Let’s help…' : 'Example: Listening input for key emotion words and the sentence pattern “Let’s help...”' })} />
                  </Form.Item>
	                  <Form.Item className="as-draft-field" label={t('lesson.activitySummary')} name="activity">
                    <TextArea className="as-draft-textarea" placeholder={t('lesson.activitySummaryPlaceholder', { defaultValue: isChinese ? '简要描述活动内容...' : 'Briefly describe the activity...' })} />
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
                                {t('lesson.flowEditorTip', { defaultValue: isChinese ? '按真实上课顺序填写：先设计活动内容，再补充教师语言与引导动作。' : 'Write in real classroom order: design the activity first, then add teacher language and cues.' })}
                              </div>
                            </div>
                            <div className="flow-step-editor-badge">{t('lesson.flowStepCount', { count: fields.length, defaultValue: isChinese ? `${fields.length} 个步骤` : `${fields.length} steps` })}</div>
                          </div>

                          {fields.map((field, index) => (
                            <div className="flow-step-row" key={field.key}>
                              <div className="flow-step-rail">
                                <div className="flow-step-index">{index + 1}</div>
                                <div className="flow-step-line" />
                              </div>
                              <div className="flow-step-fields">
                                <div className="flow-step-card-head">
                                  <div className="flow-step-mini-label">{t('lesson.flowStepName', { defaultValue: isChinese ? '步骤名称' : 'Step Name' })}</div>
                                  <Form.Item name={[field.name, 'title']} noStyle>
                                    <Input className="flow-step-input flow-step-title" placeholder={t('lesson.flowStepNamePlaceholder', { defaultValue: isChinese ? '例如：创设悬念' : 'Example: Create suspense' })} />
                                  </Form.Item>
                                </div>
                                <div className="flow-step-body-grid">
                                  <div className="flow-step-section">
                                    <div className="flow-step-section-title">{t('lesson.activityContent', { defaultValue: isChinese ? '活动内容' : 'Activity Content' })}</div>
                                    <Form.Item name={[field.name, 'desc']} noStyle>
                                      <TextArea
                                        className="flow-step-input flow-step-desc"
                                        placeholder={t('lesson.activityContentPlaceholder', { defaultValue: isChinese ? '这一步学生会看到什么、做什么、完成什么？' : 'What will students see, do, and complete in this step?' })}
                                      />
                                    </Form.Item>
                                  </div>
                                  <div className="flow-step-section guidance teacher-script">
                                    <div className="flow-step-section-title">{t('lesson.teacherGuidance', { defaultValue: isChinese ? '教师引导 / 教师语言' : 'Teacher Guidance / Language' })}</div>
                                    <Form.Item name={[field.name, 'teacher']} noStyle>
                                      <TextArea
                                        className="flow-step-input flow-step-script"
                                        placeholder="例如：Shhh... Listen, everyone."
                                      />
                                    </Form.Item>
                                  </div>
                                  <div className="flow-step-section guidance action-cue">
                                    <div className="flow-step-section-title">{t('lesson.actionCue', { defaultValue: isChinese ? '动作 / 引导提示' : 'Action / Cue' })}</div>
                                    <Form.Item name={[field.name, 'cue']} noStyle>
                                      <TextArea
                                        className="flow-step-input flow-step-cue"
                                        placeholder={t('lesson.actionCuePlaceholder', { defaultValue: isChinese ? '例如：神秘地举起信封；停顿等待学生自然回应' : 'Example: Hold up the envelope mysteriously; pause for responses' })}
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
                              title: isChinese ? '新步骤' : 'New Step',
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
                      <TextArea className="as-draft-textarea" placeholder={t('lesson.resourcesPlaceholder', { defaultValue: isChinese ? '用顿号、逗号或换行分隔，例如：装饰信封、求救信、动物轮廓表情图' : 'Separate with commas or line breaks, e.g., mission cards, image cards, timer' })} />
                    </Form.Item>
	                    <Form.Item className="as-draft-field" label={t('lesson.sceneSetup')} name="scenario">
                      <TextArea className="as-draft-textarea" placeholder={t('lesson.scenarioPlaceholder', { defaultValue: isChinese ? '创设的情境背景...' : 'Describe the classroom scenario...' })} />
                    </Form.Item>
                  </div>
                </Form>

                <div className="as-right-ft">
                  <button className="as-regen-btn" type="button" onClick={() => handleGenerateDraft()} disabled={generateDraftLoading}>
                    <RefreshCw size={11} />
	                    {generateDraftLoading ? t('workflow.lesson.generatingShort') : t('workflow.lesson.regenerate')}
                  </button>
                </div>
              </div>
            </div>

            <div className="modal-ft">
	              <button type="button" className="as-ft-cancel" onClick={() => { setAddOpen(false); setRegenTarget(null); setInsertTarget(null); }}>{t('common.cancel')}</button>
              <div className="as-ft-spacer" />
              <button type="button" className="as-ft-confirm" id="asConfirmBtn" onClick={addDraftStep}>
                <span className="add-plus" aria-hidden="true">+</span>
	                {regenTarget ? t('lesson.confirmRegenerate') : insertTarget ? t('lesson.insertBefore') : t('lesson.addToOutline')}
              </button>
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
        onClose={() => setEditing(null)}
        onSave={saveEdit}
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

function StepMenu({ open, onRegen, onInsertBefore, onAdjust, onSave, onUnsave, isSaved, onPin, onDelete, placement }) {
  const { t } = useTranslation();
  return (
    <div className={`step-menu-dropdown ${placement === 'footer' ? 'footer-menu' : ''} ${open ? 'open' : ''}`}>
      <button type="button" className="step-menu-item" onClick={onRegen}><RefreshCw size={12} />{t('workflow.lesson.regenerate')}</button>
      <button type="button" className="step-menu-item" onClick={onAdjust}><SlidersHorizontal size={12} />{t('lesson.adjustTitle')}</button>
      <button type="button" className="step-menu-item" onClick={onInsertBefore}><Plus size={12} />{t('lesson.insertBefore')}</button>
      <button type="button" className="step-menu-item" onClick={isSaved ? onUnsave : onSave}>
        <Heart size={12} fill={isSaved ? '#ff705f' : 'none'} />
        {isSaved ? t('common.cancel') : t('lesson.myFavorites')}
      </button>
      <button type="button" className="step-menu-item" onClick={onPin}><Copy size={12} />{t('lesson.pinToTop', { defaultValue: 'Pin to Top' })}</button>
      <div className="step-menu-sep" />
      <button type="button" className="step-menu-item danger" onClick={onDelete}><Trash2 size={12} />{t('lesson.deleteStep')}</button>
    </div>
  );
}
