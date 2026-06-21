import React from 'react';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import apiService from '../../services/api';
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

  const content = [
    <CourseMapView key="map" course={course} onCourseChange={handleCourseChange} onNext={() => setCurrent(1)} />,
    <LessonPlanView key="lesson" course={course} phases={phases} onPhasesChange={setPhases} onNext={() => setCurrent(2)} />,
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
        <span className="fr-tb-course">{course.courseTitle || course.title || t('course.newCourse')}</span>
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
        <LanguageSwitcher className="fr-workflow-language" dropdownClassName="fr-workflow-language-menu" />
        <Button className="fr-publish-btn">{t('workflow.toolbar.publish')}</Button>
      </header>

      {content[current]}
    </section>
  );
}
