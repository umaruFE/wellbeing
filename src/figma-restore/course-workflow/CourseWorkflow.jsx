import React from 'react';
import { Button, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Download } from 'lucide-react';
import pptxgen from 'pptxgenjs';
import apiService from '../../services/api';
import { getDisplayCourseTitle } from '../courseImages';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { CourseMapView } from './CourseMapView';
import { LessonPlanView } from './LessonPlanView';
import { PptCoursewareView } from './PptCoursewareView';
import { ReadingMaterialView } from './ReadingMaterialView';
import { phaseTemplates, readingTemplates, workflowSteps } from './workflowData';
import '../Header.css';
import './CourseWorkflow.css';

function phasesToCourseDataObject(nextPhases = []) {
  const phaseKeyMap = { eng: 'engage', emp: 'empower', exc: 'execute', elv: 'elevate' };
  return nextPhases.reduce((acc, phase) => {
    const longKey = phaseKeyMap[phase.key] || phase.key;
    if (!longKey) return acc;
    acc[longKey] = {
      title: phase.title,
      steps: (phase.steps || []).map((step) => ({
        id: step.id,
        title: step.title,
        time: step.duration,
        duration: step.duration,
        objective: step.goal,
        goal: step.goal,
        activity: step.activity,
        activitySteps: step.flow,
        flow: step.flow,
        resources: step.resources,
        scenario: step.scenario,
        script: step.teacherScript,
        teacherScript: step.teacherScript,
      })),
    };
    return acc;
  }, {});
}

function normalizePhaseCollection(rawPhases) {
  if (!rawPhases) return null;
  if (typeof rawPhases === 'string') {
    try {
      return normalizePhaseCollection(JSON.parse(rawPhases));
    } catch {
      return null;
    }
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
    try {
      courseData = JSON.parse(courseData);
    } catch {
      courseData = null;
    }
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
    phases = normalizePhaseCollection(courseData.text.courseData);
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

  const resolved = Object.entries(phaseMapping).map(([longKey, shortKey]) => {
    const phase = phases[longKey] || phases[shortKey];
    const steps = Array.isArray(phase?.steps) ? phase.steps : [];
    return {
      key: shortKey,
      phase: longKey.charAt(0).toUpperCase() + longKey.slice(1),
      title: phase?.title || `E-${longKey.charAt(0).toUpperCase() + longKey.slice(1)}`,
      name: nameMapping[longKey],
      duration: steps.length > 0
        ? `${steps.reduce((acc, step) => {
            const match = String(step.time || step.duration || '').match(/(\d+)/);
            return acc + (match ? parseInt(match[1], 10) : 0);
          }, 0)} 分钟`
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

  return resolved.some((phase) => phase.steps.length > 0) ? resolved : null;
}

function hasMeaningfulPptContent(data) {
  if (!Array.isArray(data)) return false;
  return data.some((phase) => phase?.key !== 'cover' && (phase.steps || []).some((step) => (
    Array.isArray(step.slides) && step.slides.some((slide) => Array.isArray(slide.layers) && slide.layers.length > 0)
  )));
}

export function CourseWorkflow({ initialCourse, onBack }) {
  const { t } = useTranslation();
  const [current, setCurrent] = React.useState(0);
  const [course, setCourse] = React.useState(initialCourse || {});
  const initialLessonPhases = React.useMemo(
    () => resolvePhasesFromCourse(initialCourse) || phaseTemplates,
    [initialCourse]
  );
  const [phases, setPhases] = React.useState(initialLessonPhases);
  const [materials, setMaterials] = React.useState(readingTemplates);
  const initialPptData = React.useMemo(
    () => {
      const canvasData = course?.canvasData || course?.canvas_data || null;
      return hasMeaningfulPptContent(canvasData) ? canvasData : null;
    },
    [course?.canvasData, course?.canvas_data]
  );
  const [pptCanvasData, setPptCanvasData] = React.useState(initialPptData);
  const [courseSaveStatus, setCourseSaveStatus] = React.useState('saved');
  const [courseSaveError, setCourseSaveError] = React.useState('');
  const [pptSaveStatus, setPptSaveStatus] = React.useState('saved');
  const [pptSaveError, setPptSaveError] = React.useState('');
  const latestPptCanvasRef = React.useRef(initialPptData);
  const latestCourseRef = React.useRef(initialCourse || {});
  const courseSaveSequenceRef = React.useRef(0);
  const courseDirtyVersionRef = React.useRef(0);
  const pptSaveSequenceRef = React.useRef(0);
  const pptDirtyVersionRef = React.useRef(0);
  const [publishing, setPublishing] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const displayCourseTitle = getDisplayCourseTitle(course, t('course.newCourse'));

  React.useEffect(() => {
    document.body.classList.add('fr-workflow-route-active');
    return () => {
      document.body.classList.remove('fr-workflow-route-active');
    };
  }, []);

  React.useEffect(() => {
    latestPptCanvasRef.current = initialPptData;
    setPptCanvasData(initialPptData);
    setCourseSaveStatus('saved');
    setCourseSaveError('');
    setPptSaveStatus('saved');
    setPptSaveError('');
    courseDirtyVersionRef.current = 0;
    pptDirtyVersionRef.current = 0;
    setPhases(initialLessonPhases);
  }, [course?.id, initialLessonPhases, initialPptData]);

  React.useEffect(() => {
    latestCourseRef.current = course;
  }, [course]);

  const getCourseDraftSaveKey = React.useCallback(() => (
    `coursegen:course-map:${course?.id || course?.courseTitle || course?.title || 'draft'}`
  ), [course?.courseTitle, course?.id, course?.title]);

  const getDraftSaveKey = React.useCallback(() => (
    `coursegen:ppt-canvas:${course?.id || course?.courseTitle || course?.title || 'draft'}`
  ), [course?.courseTitle, course?.id, course?.title]);

  const savePptCanvas = React.useCallback(async (data = latestPptCanvasRef.current) => {
    if (!data) return;

    const saveId = pptSaveSequenceRef.current + 1;
    const savingVersion = pptDirtyVersionRef.current;
    pptSaveSequenceRef.current = saveId;
    setPptSaveStatus('saving');
    setPptSaveError('');

    try {
      const courseId = course?.id;
      const isPersistedCourse = courseId && !String(courseId).startsWith('created-');

      if (isPersistedCourse) {
        await apiService.updateCourse(courseId, { canvasData: data });
      } else {
        localStorage.setItem(getDraftSaveKey(), JSON.stringify(data));
      }

      if (pptSaveSequenceRef.current === saveId && pptDirtyVersionRef.current === savingVersion) {
        setPptSaveStatus('saved');
      }
    } catch (error) {
      console.error('保存 PPT 课件失败:', error);
      if (pptSaveSequenceRef.current === saveId) {
        setPptSaveStatus('error');
        setPptSaveError(error?.message || '保存失败');
      }
    }
  }, [course?.id, getDraftSaveKey]);

  const saveCourseMap = React.useCallback(async (data = latestCourseRef.current) => {
    if (!data) return;

    const saveId = courseSaveSequenceRef.current + 1;
    const savingVersion = courseDirtyVersionRef.current;
    courseSaveSequenceRef.current = saveId;
    setCourseSaveStatus('saving');
    setCourseSaveError('');

    try {
      const courseId = data?.id;
      const isPersistedCourse = courseId && !String(courseId).startsWith('created-');
      const courseData = {
        ...(data.courseData || data.course_data || {}),
        courseOverview: data.courseOverview || data.courseData?.courseOverview || data.course_data?.courseOverview || null,
        themeImageUrl: data.themeImageUrl || data.courseData?.themeImageUrl || data.course_data?.themeImageUrl || null,
        experiencePaths: data.experiencePaths || data.courseData?.experiencePaths || data.course_data?.experiencePaths || [],
        experiencePath: data.experiencePath || data.courseData?.experiencePath || data.course_data?.experiencePath || '',
        ...(data.language ? { language: data.language } : {}),
        ...(data.outputLanguage ? { outputLanguage: data.outputLanguage } : {}),
        ...(data.journey ? { journey: data.journey } : {}),
      };

      if (isPersistedCourse) {
        await apiService.updateCourse(courseId, {
          title: data.courseTitle || data.title,
          description: data.storyContext || data.description || '',
          theme: data.theme || data.taskName || '',
          ageGroup: data.age,
          duration: data.duration,
          unit: data.classSize,
          courseData,
        });
      } else {
        localStorage.setItem(getCourseDraftSaveKey(), JSON.stringify(data));
      }

      if (courseSaveSequenceRef.current === saveId && courseDirtyVersionRef.current === savingVersion) {
        setCourseSaveStatus('saved');
      }
    } catch (error) {
      console.error('保存课程地图失败:', error);
      if (courseSaveSequenceRef.current === saveId) {
        setCourseSaveStatus('error');
        setCourseSaveError(error?.message || '保存失败');
      }
    }
  }, [getCourseDraftSaveKey]);

  const handleCourseChange = React.useCallback((nextCourse, meta = {}) => {
    latestCourseRef.current = nextCourse;
    setCourse(nextCourse);
    if (meta.source === 'initial') return;
    courseDirtyVersionRef.current += 1;
    setCourseSaveStatus('dirty');
    setCourseSaveError('');
    if (meta.saveNow) {
      saveCourseMap(nextCourse);
    }
  }, [saveCourseMap]);

  const mergePhasesIntoCourse = React.useCallback((nextPhases) => {
    const phaseObject = phasesToCourseDataObject(nextPhases);
    setPhases(nextPhases);
    setCourse((currentCourse) => {
      const nextCourse = {
        ...currentCourse,
        courseData: {
          ...(currentCourse.courseData || currentCourse.course_data || {}),
          courseData: nextPhases,
          ...phaseObject,
        },
      };
      latestCourseRef.current = nextCourse;
      return nextCourse;
    });
    courseDirtyVersionRef.current += 1;
    setCourseSaveStatus('dirty');
    setCourseSaveError('');
  }, []);

  const handlePptCanvasChange = React.useCallback((nextData, meta = {}) => {
    latestPptCanvasRef.current = nextData;
    setPptCanvasData(nextData);
    if (meta.source === 'initial') return;
    pptDirtyVersionRef.current += 1;
    setPptSaveStatus('dirty');
    setPptSaveError('');
  }, []);

  React.useEffect(() => {
    if (courseSaveStatus !== 'dirty' || !course) return undefined;

    const timer = window.setTimeout(() => {
      saveCourseMap(course);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [course, courseSaveStatus, saveCourseMap]);

  React.useEffect(() => {
    if (pptSaveStatus !== 'dirty' || !pptCanvasData) return undefined;

    const timer = window.setTimeout(() => {
      savePptCanvas(pptCanvasData);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [pptCanvasData, pptSaveStatus, savePptCanvas]);

  const pptSaveText = {
    dirty: t('workflow.toolbar.dirty'),
    saving: t('workflow.toolbar.saving'),
    error: pptSaveError || t('workflow.toolbar.error'),
    saved: t('workflow.toolbar.saved'),
  }[pptSaveStatus] || t('workflow.toolbar.saved');

  const courseSaveText = {
    dirty: t('workflow.toolbar.dirty'),
    saving: t('workflow.toolbar.saving'),
    error: courseSaveError || t('workflow.toolbar.error'),
    saved: t('workflow.toolbar.saved'),
  }[courseSaveStatus] || t('workflow.toolbar.saved');

  const activeSaveStatus = workflowSteps[current].key === 'ppt' ? pptSaveStatus : courseSaveStatus;
  const activeSaveText = workflowSteps[current].key === 'ppt' ? pptSaveText : courseSaveText;
  const handleToolbarSave = React.useCallback(() => {
    if (workflowSteps[current].key === 'ppt') {
      savePptCanvas();
      return;
    }
    saveCourseMap();
  }, [current, saveCourseMap, savePptCanvas]);

  const handlePublish = React.useCallback(async () => {
    if (publishing) return;
    const courseId = latestCourseRef.current?.id;
    if (!courseId || String(courseId).startsWith('created-')) {
      message.warning('请先保存课程后再发布');
      return;
    }

    setPublishing(true);
    try {
      await Promise.all([
        saveCourseMap(latestCourseRef.current),
        latestPptCanvasRef.current ? savePptCanvas(latestPptCanvasRef.current) : Promise.resolve(),
      ]);
      await apiService.updateCourse(courseId, { status: 'published', isPublic: true });
      setCourse((currentCourse) => ({
        ...currentCourse,
        status: 'published',
        isPublic: true,
        is_public: true,
      }));
      window.setTimeout(() => {
        message.open({
          key: 'course-publish-success',
          type: 'success',
          content: t('course.publishSuccess') || '发布成功！',
          duration: 2.5,
        });
      }, 0);
    } catch (error) {
      console.error('发布课程失败:', error);
      message.error(error?.message || t('course.publishFailed'));
    } finally {
      setPublishing(false);
    }
  }, [publishing, saveCourseMap, savePptCanvas, t]);

  const exportPpt = React.useCallback(async () => {
    const pptData = latestPptCanvasRef.current;
    if (!Array.isArray(pptData) || pptData.length === 0) {
      message.warning('暂无可导出的 PPT 内容');
      return;
    }

    setExporting(true);
    try {
      const pres = new pptxgen();
      pres.layout = 'LAYOUT_WIDE';
      pres.author = 'CourseGen AI';
      pres.subject = latestCourseRef.current?.title || latestCourseRef.current?.courseTitle || 'Courseware';
      pres.title = latestCourseRef.current?.title || latestCourseRef.current?.courseTitle || 'Courseware';
      pres.defineLayout({ name: 'COURSEGEN_WIDE', width: 13.333, height: 7.5 });
      pres.layout = 'COURSEGEN_WIDE';

      const scaleX = 13.333 / 940;
      const scaleY = 7.5 / 529;
      const asHex = (value, fallback = 'FFFFFF') => String(value || fallback).replace('#', '').slice(0, 6);

      pptData.forEach((phase) => {
        (phase.steps || []).forEach((step) => {
          (step.slides || []).forEach((slideData) => {
            const slide = pres.addSlide();
            slide.background = { color: asHex(slideData.background, 'FFFFFF') };
            if (slideData.backgroundImage) {
              slide.addImage({ path: slideData.backgroundImage, x: 0, y: 0, w: 13.333, h: 7.5 });
            }

            (slideData.layers || []).filter((layer) => !layer.hidden).forEach((layer) => {
              const x = (Number(layer.x) || 0) * scaleX;
              const y = (Number(layer.y) || 0) * scaleY;
              const w = (Number(layer.width) || 120) * scaleX;
              const h = (Number(layer.height) || 40) * scaleY;

              if (layer.type === 'image' && layer.url) {
                slide.addImage({ path: layer.url, x, y, w, h, rotate: Number(layer.rotation) || 0 });
                return;
              }

              const text = layer.type === 'text'
                ? (layer.content || '')
                : `[${layer.type || 'media'}] ${layer.title || ''}`;
              slide.addText(text, {
                x,
                y,
                w,
                h,
                rotate: Number(layer.rotation) || 0,
                color: asHex(layer.color || '#253142', '253142'),
                fontSize: Math.max(8, Math.round((Number(layer.fontSize) || 18) * 0.75)),
                bold: layer.fontWeight === 'bold' || Number(layer.fontWeight) >= 600,
                italic: layer.fontStyle === 'italic',
                align: layer.textAlign || 'left',
                valign: 'mid',
                margin: 0.04,
                fit: 'shrink',
              });
            });
          });
        });
      });

      const title = (latestCourseRef.current?.courseTitle || latestCourseRef.current?.title || 'Lesson Slides')
        .replace(/[\\/:*?"<>|]/g, '_');
      await pres.writeFile({ fileName: `${title}.pptx` });
      message.success('PPT 已开始导出');
    } catch (error) {
      console.error('PPT 导出失败:', error);
      message.error(error?.message || 'PPT 导出失败，请稍后重试');
    } finally {
      setExporting(false);
    }
  }, []);

  const content = [
    <CourseMapView
      key="map"
      course={course}
      onCourseChange={handleCourseChange}
      onNext={() => setCurrent(1)}
    />,
    <LessonPlanView
      key="lesson"
      course={course}
      phases={phases}
      onCourseChange={handleCourseChange}
      onPhasesChange={mergePhasesIntoCourse}
      onNext={() => setCurrent(2)}
    />,
    <PptCoursewareView
      key="ppt"
      onNext={() => setCurrent(3)}
      courseMeta={course}
      initialCourseData={pptCanvasData || phases}
      onCourseChange={handlePptCanvasChange}
      saveStatus={pptSaveStatus}
      saveText={pptSaveText}
    />,
    <ReadingMaterialView key="reading" course={course} materials={materials} onMaterialsChange={setMaterials} />,
  ];

  return (
    <section className={`fr-workflow view-${workflowSteps[current].key}-active`}>
      <header className="fr-editor-tb">
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>{t('createCourse.backToList')}</Button>
        <span className="fr-tb-course">{displayCourseTitle}</span>
        <span className="fr-tb-divider">|</span>
        <div className="fr-wf-bridge">
          {workflowSteps.map((step, index) => (
            <React.Fragment key={step.key}>
              <button
                type="button"
                className={`fr-wf-step ${index < current ? 'done' : index === current ? 'active' : 'pending'}`}
                onClick={() => setCurrent(index)}
              >
                <span className="fr-wf-n">{index + 1}</span>
                <span>
                  <b>{t(`workflow.steps.${step.key}`)}</b>
                  <small>
                    {index < current
                      ? t('workflow.stepState.done')
                      : index === current
                        ? t('workflow.stepState.active')
                        : t('workflow.stepState.pending')}
                  </small>
                </span>
              </button>
              {index < workflowSteps.length - 1 && <span className="fr-wf-arrow">→</span>}
            </React.Fragment>
          ))}
        </div>
        <div className="fr-tb-spacer" />
        <div className={`fr-autosave is-${activeSaveStatus}`} title={activeSaveText}>
          <span aria-hidden="true" />
          <b>{activeSaveText}</b>
        </div>
        <Button
          className="fr-save-btn"
          loading={activeSaveStatus === 'saving'}
          onClick={handleToolbarSave}
        >
          {t('workflow.toolbar.save')}
        </Button>
        {workflowSteps[current].key === 'ppt' && (
          <Button
            className="fr-export-btn"
            icon={<Download size={15} />}
            loading={exporting}
            onClick={exportPpt}
          >
            {t('workflow.toolbar.export')}
          </Button>
        )}
        <LanguageSwitcher className="fr-workflow-language" dropdownClassName="fr-workflow-language-menu" />
        <Button className="fr-publish-btn" loading={publishing} onClick={handlePublish}>{t('workflow.toolbar.publish')}</Button>
      </header>

      {content[current]}
    </section>
  );
}
