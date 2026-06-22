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

export function CourseWorkflow({ initialCourse, onBack }) {
  const { t } = useTranslation();
  const [current, setCurrent] = React.useState(0);
  const [course, setCourse] = React.useState(initialCourse || {});
  const [phases, setPhases] = React.useState(phaseTemplates);
  const [materials, setMaterials] = React.useState(readingTemplates);
  const initialPptData = React.useMemo(
    () => course?.canvasData || course?.canvas_data || null,
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
    latestCourseRef.current = course;
    latestPptCanvasRef.current = initialPptData;
    setPptCanvasData(initialPptData);
    setCourseSaveStatus('saved');
    setCourseSaveError('');
    setPptSaveStatus('saved');
    setPptSaveError('');
    courseDirtyVersionRef.current = 0;
    pptDirtyVersionRef.current = 0;
  }, [course?.id, initialPptData]);

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
  }, []);

  const mergePhasesIntoCourse = React.useCallback((nextPhases) => {
    setPhases(nextPhases);
    setCourse((currentCourse) => ({
      ...currentCourse,
      courseData: {
        ...(currentCourse.courseData || currentCourse.course_data || {}),
        courseData: nextPhases,
      },
    }));
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
      await apiService.updateCourse(courseId, { status: 'published' });
      setCourse((currentCourse) => ({ ...currentCourse, status: 'published' }));
      message.success(t('course.publishSuccess'));
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
