import React from 'react';
import { Button, Checkbox, Form, Input, message, Radio, Select, Upload } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  Clock,
  Heart,
  MessageSquare,
  Paperclip,
  PencilLine,
  RefreshCw,
  ShieldCheck,
  Star,
  Target,
  Users,
  X,
} from 'lucide-react';
import { buildCourseMap } from './workflowData';
import apiService from '../../services/api';
import compassIcon from '../../assets/create-course/compass.svg';
import lightIcon from '../../assets/create-course/light.svg';
import planeIcon from '../../assets/create-course/plane.png';
import starIcon from '../../assets/create-course/star.svg';
import toolkitIcon from '../../assets/create-course/toolkit.svg';

const { TextArea } = Input;

const ageOptionValues = ['3-6岁', '7-9岁', '9-12岁'];
const durationOptionValues = ['40分钟', '60分钟', '120分钟'];
const classSizeOptionValues = ['≤ 8人', '9-15人', '≥ 16人'];
const languageSkillOptionValues = ['听力理解', '口语表达', '阅读理解', '书面表达', '综合能力'];
const pathOptionValues = ['艺术表达', '体感探索', '音乐律动', 'AI 自动匹配'];
const atmosphereOptionValues = ['神秘探险感', '戏剧表演感', '温馨治愈感', '团队协作感', 'AI 自动匹配'];
const AUTO_MATCH_VALUES = new Set(['AI 自动匹配', 'AI Auto Match']);
const fallbackRegenTips = [
  '希望在Execute创作运用阶段能有一个小组竞赛游戏，让产出更有挑战性。',
  '情境可以更科幻一些，比如在外星球完成这个任务。',
  '希望Engage情境启动更有悬念，像收到一封神秘任务信。',
  '希望成长罗盘更突出团队协作和解决问题的成就感。',
];

const journeyItems = [
  { title: 'Engage', titleKey: 'lesson.phaseEngage', color: '#ff705f', key: 'engage' },
  { title: 'Empower', titleKey: 'lesson.phaseEmpower', color: '#3b82f6', key: 'empower' },
  { title: 'Execute', titleKey: 'lesson.phaseExecute', color: '#4f9f69', key: 'execute' },
  { title: 'Elevate', titleKey: 'lesson.phaseElevate', color: '#9b62d1', key: 'elevate' },
];

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch {
    return {};
  }
}

function toArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function normalizeExperiencePaths(course = {}, fallback = '') {
  const values = [
    ...toArray(course.experiencePaths),
    ...toArray(course.courseData?.experiencePaths),
    ...toArray(course.paths),
    ...toArray(course.courseData?.paths),
    course.experiencePath,
    course.courseData?.experiencePath,
  ];
  const list = [...new Set(values.map((item) => String(item || '').trim()).filter(Boolean))];
  return list.length ? list : toArray(fallback).map((item) => String(item || '').trim()).filter(Boolean);
}

function primaryExperiencePath(paths) {
  return toArray(paths).find(Boolean) || '';
}

function formatExperiencePaths(paths, fallback = '') {
  const list = normalizeExperiencePaths({ experiencePaths: paths }, fallback);
  return list.join('、');
}

function updateExperiencePaths(values) {
  const next = toArray(values).filter(Boolean);
  const last = next[next.length - 1];
  if (AUTO_MATCH_VALUES.has(last)) return [last];
  return next.filter((item) => !AUTO_MATCH_VALUES.has(item));
}

function splitPastedTagLines(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((item) => item.replace(/[\u200B-\u200D\uFEFF]/g, '').trim())
    .filter(Boolean);
}

function handleTagPaste(event, form, field) {
  const lines = splitPastedTagLines(event.clipboardData?.getData('text'));
  if (lines.length < 2) return;

  event.preventDefault();
  const current = toArray(form.getFieldValue(field)).map((item) => String(item || '').trim()).filter(Boolean);
  const next = [...current];
  lines.forEach((line) => {
    if (!next.includes(line)) next.push(line);
  });
  form.setFieldsValue({ [field]: next });
}

function ClearableButtonGroup({ value, onChange, options, className = '' }) {
  return (
    <div className={className}>
      {options.map((option) => {
        const optionValue = typeof option === 'string' ? option : option.value;
        const optionLabel = typeof option === 'string' ? option : option.label;
        const selected = value === optionValue;
        return (
          <button
            key={optionValue}
            type="button"
            className={`ant-radio-button-wrapper ${selected ? 'ant-radio-button-wrapper-checked' : ''}`}
            onClick={() => onChange?.(selected ? '' : optionValue)}
          >
            {optionLabel}
          </button>
        );
      })}
    </div>
  );
}

function compactText(value, max = 34) {
  const text = String(value || '').replace(/\s+/g, '').replace(/[。；;]+$/g, '');
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function pickListText(value, fallback = '核心表达') {
  const list = toArray(value).map((item) => String(item || '').trim()).filter(Boolean);
  if (!list.length) return fallback;
  return list.slice(0, 3).join('、');
}

function buildFallbackJourney(course, map, taskName) {
  const story = compactText(course.storyContext || map.storyline || taskName, 32);
  const outcome = compactText(course.keyOutcome || map.keyOutcome || `围绕“${taskName}”完成创意作品`, 32);
  const growth = compactText(map.growth || course.specialRequirements || '表达、协作与创造性解决问题', 30);
  const toolkit = compactText(map.toolkit, 36);
  const vocab = pickListText(course.vocabularies, toolkit || '关键词和任务句型');
  const grammar = pickListText(course.grammars, '核心句型');
  const skills = pickListText(course.languageSkills, '听说表达');
  const path = formatExperiencePaths(normalizeExperiencePaths(course, map.path), '艺术表达');
  const atmosphere = course.atmosphere && course.atmosphere !== 'AI 自动匹配' ? course.atmosphere : '';

  return {
    engage: `${atmosphere ? `以${atmosphere}开启，` : ''}学生进入“${taskName}”情境，观察${story || '任务线索'}，提出本节课要破解的真实问题。`,
    empower: `围绕“${vocab}”和“${grammar}”搭建语言工具箱，通过${skills}示范与短练，让学生马上能为任务开口表达。`,
    execute: `小组沿着“${path}”路径完成${outcome}，在创作、排练或展示准备中反复使用目标语言并互相调整。`,
    elevate: `展示${outcome}，用同伴反馈回看${growth}，把本节课的表达方法迁移到新的生活或学习场景。`,
  };
}

function hasCompleteJourney(journey) {
  return Boolean(journey?.engage && journey?.empower && journey?.execute && journey?.elevate);
}

export function CourseMapView({ course, onCourseChange, onNext }) {
  const { t, i18n } = useTranslation();
  const isChinese = !i18n.language?.startsWith('en');
  const aiLanguage = isChinese ? 'zh' : 'en';
  const outputLanguage = isChinese ? 'Chinese' : 'English';
  const [editForm] = Form.useForm();
  const [regenForm] = Form.useForm();
  const [editOpen, setEditOpen] = React.useState(false);
  const [regenOpen, setRegenOpen] = React.useState(false);
  const [regenerating, setRegenerating] = React.useState(false);
  const [regenImage, setRegenImage] = React.useState(false);
  const [regenTips, setRegenTips] = React.useState(fallbackRegenTips);
  const [loadingRegenTips, setLoadingRegenTips] = React.useState(false);
  const map = buildCourseMap(course);
  const editOptions = React.useMemo(() => ({
    age: [
      { value: '3-6岁', label: t('createCourse.age36') },
      { value: '7-9岁', label: t('createCourse.age79') },
      { value: '9-12岁', label: t('createCourse.age912') },
    ],
    duration: [
      { value: '40分钟', label: t('createCourse.dur40') },
      { value: '60分钟', label: t('createCourse.dur60') },
      { value: '120分钟', label: t('createCourse.dur120') },
    ],
    classSize: [
      { value: '≤ 8人', label: t('createCourse.size8') },
      { value: '9-15人', label: t('createCourse.size915') },
      { value: '≥ 16人', label: t('createCourse.size16') },
    ],
    languageSkills: languageSkillOptionValues.map((value, index) => ({
      value,
      label: [
        t('createCourse.skillListening'),
        t('createCourse.skillSpeaking'),
        t('createCourse.skillReading'),
        t('createCourse.skillWriting'),
        t('createCourse.skillIntegrated'),
      ][index],
    })),
    paths: pathOptionValues.map((value, index) => ({
      value,
      label: [
        t('createCourse.pathArt'),
        t('createCourse.pathBody'),
        t('createCourse.pathMusic'),
        t('createCourse.autoMatch'),
      ][index],
    })),
    atmosphere: atmosphereOptionValues.map((value, index) => ({
      value,
      label: [
        t('createCourse.atmoMystery'),
        t('createCourse.atmoDrama'),
        t('createCourse.atmoWarmth'),
        t('createCourse.atmoTeamwork'),
        t('createCourse.autoMatch'),
      ][index],
    })),
  }), [t]);

  const taskName = course.taskName || course.theme || '情境任务';
  const fallbackJourney = buildFallbackJourney(course, map, taskName);
  const savedJourney = course.journey || course.courseData?.journey || {};
  const journey = {
    engage: savedJourney.engage || fallbackJourney.engage,
    empower: savedJourney.empower || fallbackJourney.empower,
    execute: savedJourney.execute || fallbackJourney.execute,
    elevate: savedJourney.elevate || fallbackJourney.elevate,
  };

  const openEdit = () => {
    editForm.setFieldsValue({
      courseTitle: map.title,
      age: course.age || map.age,
      duration: course.duration || map.duration,
      classSize: course.classSize || map.classSize,
      vocabularies: course.vocabularies || [],
      grammars: course.grammars || [],
      languageSkills: course.languageSkills || ['听力理解', '口语表达'],
      taskName,
      storyContext: course.storyContext || map.storyline,
      keyOutcome: course.keyOutcome || map.keyOutcome,
      experiencePaths: normalizeExperiencePaths(course, map.path),
      specialRequirements: course.specialRequirements || '',
      atmosphere: course.atmosphere || '',
      attachments: [],
    });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    const values = await editForm.validateFields();
    const attachments = (values.attachments || []).map((file) => file.name).filter(Boolean);
    const user = getUser();

    const n8nPayload = {
      language: aiLanguage,
      outputLanguage,
      courseTitle: values.courseTitle,
      age: values.age,
      duration: values.duration,
      scale: values.classSize,
      vocabulary: values.vocabularies || [],
      grammar: values.grammars || [],
      skills: values.languageSkills || [],
      paths: normalizeExperiencePaths({ experiencePaths: values.experiencePaths }),
      theme: values.taskName || '',
      taskName: values.taskName || '',
      storyContext: values.storyContext || '',
      keyOutcome: values.keyOutcome || '',
      atmosphere: values.atmosphere || '',
      specialRequirements: values.specialRequirements || '',
      attachments,
    };

    setRegenImage(true);

    let overview = null;
    let themeImageUrl = null;

    try {
      const response = await fetch('/api/ai/generate-course-overview', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(n8nPayload),
      });
      const result = await response.json();

      if (result.success && result.data) {
        overview = result.data.courseOverview || result.data;
        themeImageUrl = result.data.themeImageUrl || null;
      }
    } catch (err) {
      console.error('生成课程概览失败:', err);
    } finally {
      setRegenImage(false);
    }

    const courseTitle = overview?.courseTitle || values.courseTitle || '未命名课程';
    const theme = overview?.theme || values.taskName || '';

    const nextCourseBase = {
      ...course,
      title: courseTitle,
      theme,
      courseOverview: overview ? { text: JSON.stringify(overview) } : course.courseOverview,
      themeImageUrl: themeImageUrl || course.themeImageUrl,
      age: values.age,
      duration: values.duration,
      classSize: values.classSize,
      vocabularies: values.vocabularies || [],
      grammars: values.grammars || [],
      languageSkills: values.languageSkills || ['听力理解', '口语表达'],
      taskName: values.taskName,
      storyContext: values.storyContext,
      keyOutcome: values.keyOutcome,
      experiencePaths: normalizeExperiencePaths({ experiencePaths: values.experiencePaths }),
      experiencePath: primaryExperiencePath(values.experiencePaths),
      specialRequirements: values.specialRequirements,
      atmosphere: values.atmosphere,
      attachments: attachments.length ? attachments : course.attachments,
    };
    const nextJourney = hasCompleteJourney(overview?.journey) ? overview.journey : null;

    onCourseChange?.({
      ...nextCourseBase,
      ...(nextJourney ? { journey: nextJourney } : {}),
      courseData: {
        ...(course.courseData || {}),
        courseOverview: overview || course.courseData?.courseOverview,
        themeImageUrl: themeImageUrl || course.themeImageUrl,
        experiencePaths: nextCourseBase.experiencePaths,
        experiencePath: nextCourseBase.experiencePath,
        ...(nextJourney ? { journey: nextJourney } : {}),
      },
    });

    setEditOpen(false);
  };

  const handleRegenImage = async () => {
    const themeImagePrompt = map.themeImagePrompt;
    if (!themeImagePrompt) {
      return;
    }
    setRegenImage(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/ai/regenerate-theme-image', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          courseId: course.id,
          themeImagePrompt,
          language: aiLanguage,
          outputLanguage,
        }),
      });
      const result = await response.json();

      if (result.success && result.themeImageUrl) {
        onCourseChange?.({ ...course, themeImageUrl: result.themeImageUrl });
      }
    } catch (err) {
      console.error('重新生成图片失败:', err);
    } finally {
      setRegenImage(false);
    }
  };

  const fillRegenTip = (tip) => {
    const current = regenForm.getFieldValue('request')?.trim();
    regenForm.setFieldValue('request', current ? `${current}；${tip}` : tip);
  };

  const loadRegenTips = async () => {
    const user = getUser();
    setLoadingRegenTips(true);

    try {
      const response = await fetch('/api/ai/generate-course-overview-adjustment-tips', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          courseOverview: course.courseOverview || null,
          language: aiLanguage,
          outputLanguage,
          courseTitle: course.courseTitle || course.title || map.title,
          age: course.age || map.age,
          duration: course.duration || map.duration,
          scale: course.classSize || map.classSize,
          vocabulary: toArray(course.vocabularies),
          grammar: toArray(course.grammars),
          skills: toArray(course.languageSkills),
          paths: normalizeExperiencePaths(course),
          theme: course.theme || course.taskName || map.path,
          storyContext: course.storyContext || map.storyline,
          keyOutcome: course.keyOutcome || map.keyOutcome,
          userId: user?.id || course.userId || null,
          organizationId: user?.organizationId || user?.organization_id || course.organizationId || null,
        }),
      });

      const result = await response.json();
      const tips = result?.data?.tips;

      if (!response.ok || !result.success || !Array.isArray(tips) || tips.length === 0) {
        throw new Error(result.error || '调整建议生成失败');
      }

      setRegenTips(tips);
    } catch (err) {
      console.warn('生成课程地图调整建议失败，使用默认建议:', err);
      setRegenTips(fallbackRegenTips);
    } finally {
      setLoadingRegenTips(false);
    }
  };

  const openRegen = () => {
    setRegenOpen(true);
    loadRegenTips();
  };

  const submitRegen = async () => {
    const values = await regenForm.validateFields();
    const request = values.request?.trim();
    const user = getUser();

    setRegenOpen(false);
    setRegenerating(true);

    try {
      const response = await fetch('/api/ai/generate-course-overview', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          courseTitle: course.courseTitle || course.title || map.title,
          age: course.age || map.age,
          duration: course.duration || map.duration,
          scale: course.classSize || map.classSize,
          vocabulary: toArray(course.vocabularies),
          grammar: toArray(course.grammars),
          skills: toArray(course.languageSkills),
          paths: normalizeExperiencePaths(course),
          theme: course.theme || course.taskName || map.path,
          taskName: course.taskName || course.theme || '',
          storyContext: course.storyContext || map.storyline,
          keyOutcome: course.keyOutcome || map.keyOutcome,
          atmosphere: course.atmosphere || '',
          requirements: course.specialRequirements || '',
          attachments: toArray(course.attachments),
          adjustments: request || '',
          language: aiLanguage,
          outputLanguage,
          existingOverview: course.courseOverview || null,
          userId: user?.id || course.userId || null,
          organizationId: user?.organizationId || user?.organization_id || course.organizationId || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.data?.courseOverview) {
        throw new Error(result.error || '课程概览生成失败');
      }

      const overview = result.data.courseOverview;
      const themeImageUrl = result.data.themeImageUrl || course.themeImageUrl || null;
      const nextCourseBase = {
        ...course,
        title: overview.courseTitle || course.title,
        courseTitle: overview.courseTitle || course.courseTitle,
        theme: overview.theme || course.theme,
        courseOverview: overview,
        courseData: {
          ...(course.courseData || {}),
          courseOverview: overview,
          themeImageUrl,
        },
        themeImageUrl,
      };
      const nextJourney = hasCompleteJourney(overview?.journey) ? overview.journey : null;
      const nextCourse = {
        ...nextCourseBase,
        ...(nextJourney ? { journey: nextJourney } : {}),
        courseData: {
          ...(nextCourseBase.courseData || {}),
          ...(nextJourney ? { journey: nextJourney } : {}),
        },
      };

      onCourseChange?.(nextCourse);

      if (course.id && !String(course.id).startsWith('created-')) {
        try {
          await apiService.updateCourse(course.id, {
            title: nextCourse.title,
            description: overview.overallContext || course.description || '',
            theme: nextCourse.theme,
            ageGroup: nextCourse.age,
            duration: nextCourse.duration,
            unit: nextCourse.classSize,
            courseData: nextCourse.courseData,
          });
        } catch (err) {
          console.warn('保存重新生成课程概览失败:', err);
        }
      }

      message.success('课程地图已重新生成');
      regenForm.resetFields();
    } catch (err) {
      console.error('重新生成课程概览失败:', err);
      message.error(err?.message || '课程概览生成失败，请稍后重试');
      onCourseChange?.({
        ...course,
        storyContext: request ? `${map.storyline} 根据调整需求：${request}` : map.storyline,
      });
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <div className="fr-workflow-map-step view-overview-active">
      <div className="overview-panel-header">
        <h2 className="overview-panel-title">
          {isChinese ? `${t('workflow.map.title')}|Course Map` : t('workflow.map.title')}
          <img src={planeIcon} alt="" className="overview-panel-title-icon" />
        </h2>
        <div className="overview-panel-actions">
          <Button className="btn-ghost" icon={<RefreshCw size={16} />} onClick={openRegen}>
            {t('workflow.map.regenerate')}
          </Button>
          <Button className="btn-ghost primary" icon={<PencilLine size={16} />} onClick={openEdit}>{t('workflow.map.edit')}</Button>
          <Button className="btn-next-step" onClick={onNext}>
            {t('workflow.nextStep')}
          </Button>
        </div>
      </div>

      {regenerating ? (
        <div className="overview-regen-loading">
          <div className="spinner" />
          <span>{t('workflow.map.regenerating')}</span>
        </div>
      ) : (
        <div className="course-map-v2">
          <section className="course-map-v2-card">
            <div className="course-map-v2-tag">{map.path}</div>
            <h2 className="course-map-v2-title">{map.title}</h2>
            <div className="course-map-v2-meta">
              <span><Users />{map.age}</span>
              <span><Clock />{map.duration}</span>
              <span><ShieldCheck />{map.classSize}</span>
            </div>

            <div className="course-map-v2-core">
              <div className="course-map-v2-core-title">
                <Star size={18} />
                {t('workflow.map.storyline')}
                {isChinese && <span>Storyline</span>}
              </div>
              <div className="course-map-v2-core-text">{map.storyline}</div>
            </div>

            <div className="course-map-v2-cover">
              <div className="overview-hero-img">
                {map.themeImageUrl ? (
                  <img
                    className="course-map-theme-image"
                    src={map.themeImageUrl}
                    alt={map.title}
                  />
                ) : (
                  <div className="course-map-cover-art" aria-hidden="true">
                    <div className="cm-kitchen-wall">
                      <span className="cm-cabinet left" />
                      <span className="cm-hood" />
                      <span className="cm-cabinet right" />
                      <span className="cm-stove" />
                      <span className="cm-counter" />
                    </div>
                    <div className="cm-character pear"><span className="cm-eye one" /><span className="cm-eye two" /><span className="cm-mouth" /></div>
                    <div className="cm-character brain"><span className="cm-eye one" /><span className="cm-eye two" /><span className="cm-mouth" /></div>
                    <div className="cm-character orange"><span className="cm-eye one" /><span className="cm-eye two" /><span className="cm-mouth" /></div>
                    <div className="cm-floor" />
                  </div>
                )}
                <div className="img-overlay">
                  <Button
                    icon={<RefreshCw size={16} />}
                    loading={regenImage}
                    disabled={regenImage || !map.themeImagePrompt}
                    onClick={handleRegenImage}
                  >
                    {regenImage ? t('workflow.map.generating') : t('workflow.map.regenerate')}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="course-map-v2-panel">
            <div className="course-map-v2-grid">
              <CourseGoal icon={MessageSquare} image={toolkitIcon} title={t('workflow.map.languageToolkit')} en="Language Toolkit" showEn={isChinese} tone="toolkit" color="#d8ca8d">
                {map.toolkit}
              </CourseGoal>
              <CourseGoal icon={Target} image={starIcon} title={t('workflow.map.keyOutcome')} en="Key Outcome" showEn={isChinese} tone="outcome" color="#f6e6cc">
                {map.keyOutcome}
              </CourseGoal>
              <CourseGoal icon={Heart} image={compassIcon} title={t('workflow.map.growthCompass')} en="Growth Compass" showEn={isChinese} tone="growth" color="#d9dde9">
                {map.growth}
              </CourseGoal>
              <CourseGoal icon={Users} image={lightIcon} title={t('workflow.map.howWeLearn')} en="How We Learn" showEn={isChinese} tone="learn" color="#dfe2bb">
                {map.experience}
              </CourseGoal>

              <article className="course-map-v2-goal wide">
                <div className="course-map-v2-goal-title">
                  <span className="course-map-v2-icon" style={{ '--goal-color': '#ff705f' }}>
                    <img src={planeIcon} alt="" />
                  </span>
                  {t('workflow.map.classJourney')}
                  {isChinese && <span className="course-map-v2-title-en">Class Journey</span>}
                </div>
                <div className="course-map-v2-journey">
                  {journeyItems.map((item, index) => (
                    <div className="course-map-v2-journey-step" style={{ '--phase-color': item.color }} key={item.key}>
                      <div className="course-map-v2-journey-body">
                        <strong>
                          <span className="course-map-v2-journey-node">{index + 1}</span>
                          {t(item.titleKey, item.title)}
                        </strong>
                        <div>{journey[item.key]}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>
        </div>
      )}

      {regenOpen && (
        <div className="modal-overlay overview-modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && setRegenOpen(false)}>
          <div className="modal overview-regen-modal">
            <div className="modal-hd">
              <div className="modal-t">{t('workflow.map.regenModalTitle')}</div>
              <button type="button" className="modal-x" onClick={() => setRegenOpen(false)}><X size={22} /></button>
            </div>
            <div className="modal-body">
              <Form form={regenForm} layout="vertical" className="overview-ant-form">
                <Form.Item label={t('workflow.map.regenQuestion')} name="request">
                  <TextArea
                    className="fi textarea"
                    rows={5}
                    placeholder={t('workflow.map.regenPlaceholder')}
                  />
                </Form.Item>
              </Form>
              <div className="regen-tips">
                <span className="regen-tip-label">{t('workflow.map.regenTips')}</span>
                {loadingRegenTips ? (
                  <span className="regen-tip-chip">{t('lesson.generating')}</span>
                ) : (
                  regenTips.map((tip) => (
                    <button type="button" className="regen-tip-chip" key={tip} onClick={() => fillRegenTip(tip)}>
                      {tip}
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="modal-ft">
              <button type="button" className="mo-btn-cancel" onClick={() => setRegenOpen(false)}>{t('common.cancel')}</button>
              <button type="button" className="mo-btn-primary" onClick={submitRegen}>
                <RefreshCw size={14} />
                {t('workflow.map.regenerate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && (
        <div className="modal-overlay overview-modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && setEditOpen(false)}>
          <div className="modal overview-adjust-modal">
            <div className="modal-hd">
              <div>
                <div className="modal-t">{t('workflow.map.editModalTitle')}</div>
                <div className="modal-sub">
                  {t('workflow.map.editModalSubtitle')}
                </div>
              </div>
              <button type="button" className="modal-x" onClick={() => setEditOpen(false)}><X size={22} /></button>
            </div>
            <div className="modal-body overview-adjust-body">
              <Form form={editForm} layout="vertical" className="overview-ant-form">
                <ModalSection title={t('createCourse.step1Title')} desc={t('createCourse.step1Subtitle')}>
                  <Form.Item label={t('createCourse.courseName')} name="courseTitle" rules={[{ required: true, message: t('createCourse.courseNameRequired') }]}>
                    <Input className="fi" placeholder={t('workflow.map.editCourseNamePlaceholder')} autoComplete="off" />
                  </Form.Item>
                  <div className="overview-adjust-three">
                    <Form.Item label={t('createCourse.ageLabel')} name="age">
                      <Radio.Group optionType="button" buttonStyle="solid" options={editOptions.age} />
                    </Form.Item>
                    <Form.Item label={t('createCourse.durationLabel')} name="duration">
                      <Radio.Group optionType="button" buttonStyle="solid" options={editOptions.duration} />
                    </Form.Item>
                    <Form.Item label={t('createCourse.classSizeLabel')} name="classSize">
                      <Radio.Group optionType="button" buttonStyle="solid" options={editOptions.classSize} />
                    </Form.Item>
                  </div>
                  <div className="overview-adjust-two">
                    <Form.Item label={t('createCourse.vocabLabel')} name="vocabularies">
                      <Select
                        mode="tags"
                        className="overview-tag-select"
                        placeholder={t('createCourse.vocabPlaceholder')}
                        onPasteCapture={(event) => handleTagPaste(event, editForm, 'vocabularies')}
                      />
                    </Form.Item>
                    <Form.Item label={t('createCourse.grammarLabel')} name="grammars">
                      <Select
                        mode="tags"
                        className="overview-tag-select"
                        placeholder={t('createCourse.grammarPlaceholder')}
                        onPasteCapture={(event) => handleTagPaste(event, editForm, 'grammars')}
                      />
                    </Form.Item>
                  </div>
                  <Form.Item label={`${t('createCourse.skillLabel')} (${t('createCourse.multiSelect')})`} name="languageSkills">
                    <Checkbox.Group options={editOptions.languageSkills} />
                  </Form.Item>
                </ModalSection>

                <ModalSection title={t('createCourse.step2Title')} desc={t('createCourse.step2Subtitle')}>
                  <Form.Item label={t('createCourse.taskNameLabel')} name="taskName" rules={[{ required: true, message: t('createCourse.taskNameRequired') }]}>
                    <Input className="fi" placeholder={t('createCourse.taskNamePlaceholder')} autoComplete="off" />
                  </Form.Item>
                  <Form.Item label={t('createCourse.storyLabel')} name="storyContext">
                    <TextArea className="fi textarea" rows={4} placeholder={t('createCourse.storyPlaceholder')} />
                  </Form.Item>
                  <Form.Item label={t('createCourse.outcomeLabel')} name="keyOutcome">
                    <TextArea className="fi textarea" rows={3} placeholder={t('createCourse.outcomePlaceholder')} />
                  </Form.Item>
                </ModalSection>

                <ModalSection title={t('createCourse.step3Title')} desc={t('createCourse.step3Subtitle')}>
                  <Form.Item name="experiencePaths">
                    <Checkbox.Group
                      options={editOptions.paths}
                      onChange={(values) => editForm.setFieldsValue({ experiencePaths: updateExperiencePaths(values) })}
                    />
                  </Form.Item>
                </ModalSection>

                <ModalSection title={t('createCourse.step4Title')} desc={t('createCourse.step4Subtitle')}>
                  <Form.Item label={t('createCourse.requirementsLabel')} name="specialRequirements">
                    <TextArea
                      className="fi textarea"
                      rows={4}
                      placeholder={t('createCourse.requirementsPlaceholder')}
                    />
                  </Form.Item>
                  <Form.Item name="attachments" valuePropName="fileList" getValueFromEvent={(event) => event?.fileList || []}>
                    <Upload beforeUpload={() => false} multiple>
                      <button type="button" className="attachment-btn">
                        <Paperclip size={13} />
                        {t('createCourse.attachment')}
                      </button>
                    </Upload>
                  </Form.Item>
                  <Form.Item label={t('createCourse.atmosphereLabel')} name="atmosphere">
                    <ClearableButtonGroup options={editOptions.atmosphere} className="overview-clearable-radio-group" />
                  </Form.Item>
                </ModalSection>
              </Form>
            </div>
            <div className="modal-ft">
              <button type="button" className="mo-btn-cancel" onClick={() => setEditOpen(false)}>{t('common.cancel')}</button>
              <button type="button" className="mo-btn-primary" onClick={saveEdit} disabled={regenImage}>
                {regenImage ? t('workflow.map.generating') : t('workflow.map.saveAndRefresh')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModalSection({ title, desc, children }) {
  return (
    <section className="overview-adjust-section">
      <div className="overview-adjust-section-title">
        {title}
      </div>
      <div className="overview-adjust-section-desc">{desc}</div>
      {children}
    </section>
  );
}

function CourseGoal({ icon: Icon, image, title, en, showEn, color, tone, children }) {
  return (
    <article className={`course-map-v2-goal ${tone ? `is-${tone}` : ''}`}>
      <div className="course-map-v2-goal-title">
        <span className="course-map-v2-icon" style={{ '--goal-color': color }}>
          {image ? <img src={image} alt="" /> : React.createElement(Icon, { size: 18 })}
        </span>
        {title}
        {showEn && <span className="course-map-v2-title-en">{en}</span>}
      </div>
      <div className="course-map-v2-text">{children}</div>
    </article>
  );
}
