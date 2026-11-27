import React from 'react';
import { parseJsonSafely } from '../../utils/responseUtils';
import { Button, Drawer, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Check, CircleAlert, Clock3, Download, ListTodo, Loader2, Save } from 'lucide-react';
import pptxgen from 'pptxgenjs';
import apiService from '../../services/api';
import { getDisplayCourseTitle } from '../courseImages';
import { TaskCenter } from '../TaskCenter';
import { AuthoringSteps } from '../../components/AuthoringSteps';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { CourseMapView } from './CourseMapView';
import { resolveLessonPhases } from './lesson-design/lessonDesignUtils';
import { LessonPlanView } from './LessonPlanView';
import { PptCoursewareView } from './PptCoursewareView';
import { ReadingMaterialView } from './ReadingMaterialView';
import { phaseTemplates, readingTemplates, workflowSteps } from './workflowData';
import '../Header.css';
import './CourseWorkflow.css';

function hasMeaningfulPptContent(data) {
  let source = data;
  if (typeof source === 'string') {
    try {
      source = JSON.parse(source);
    } catch {
      return false;
    }
  }
  if (!Array.isArray(source)) return false;
  return source.some((phase) => (phase.steps || []).some((step) => (
    Array.isArray(step.slides) && step.slides.some((slide) => (
      (Array.isArray(slide.layers) && slide.layers.length > 0)
      || Boolean(slide.backgroundImage || slide.background_image)
    ))
  )));
}

export function CourseWorkflow({ initialCourse, onBack }) {
  const { t } = useTranslation();
  const [current, setCurrent] = React.useState(0);
  const [course, setCourse] = React.useState(initialCourse || {});
  const initialLessonPhases = React.useMemo(
    () => resolveLessonPhases(initialCourse) || phaseTemplates,
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
  const pptSaveQueueRef = React.useRef(Promise.resolve());
  const [publishing, setPublishing] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [taskDrawerOpen, setTaskDrawerOpen] = React.useState(false);
  const [taskCount, setTaskCount] = React.useState(0);
  const [pendingTaskAsset, setPendingTaskAsset] = React.useState(null);
  const displayCourseTitle = getDisplayCourseTitle(course, t('course.newCourse'));

  const loadTaskCount = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/background-tasks?scope=active', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const result = await parseJsonSafely(response);
      if (response.ok && result?.success) {
        setTaskCount(result.data?.tasks?.length || 0);
      }
    } catch {
      setTaskCount(0);
    }
  }, []);

  React.useEffect(() => {
    document.body.classList.add('fr-workflow-route-active');
    return () => {
      document.body.classList.remove('fr-workflow-route-active');
    };
  }, []);

  React.useEffect(() => {
    loadTaskCount();
    const timer = window.setInterval(loadTaskCount, 5000);
    return () => window.clearInterval(timer);
  }, [loadTaskCount]);

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

    const queuedSave = pptSaveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
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
            setPptSaveError(error?.message || t('workflow.toolbar.error'));
          }
          throw error;
        }
      });

    pptSaveQueueRef.current = queuedSave;
    try {
      await queuedSave;
    } catch {
      // The queued operation has already updated the visible save error state.
    }
  }, [course?.id, getDraftSaveKey, t]);

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
          setCourseSaveError(error?.message || t('workflow.toolbar.error'));
      }
    }
  }, [getCourseDraftSaveKey, t]);

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

  const handlePptCanvasChange = React.useCallback((nextData, meta = {}) => {
    latestPptCanvasRef.current = nextData;
    setPptCanvasData(nextData);
    if (meta.source === 'initial') return;
    pptDirtyVersionRef.current += 1;
    setPptSaveStatus('dirty');
    setPptSaveError('');
    if (meta.saveNow) {
      savePptCanvas(nextData);
    }
  }, [savePptCanvas]);

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
      message.warning(t('workflow.toolbar.saveBeforePublish'));
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
          content: t('course.publishSuccess'),
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
      message.warning(t('workflow.toolbar.nothingToExport'));
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
      const exportMediaPath = (value) => {
        const url = String(value || '').trim();
        if (!url || /^(?:data:|blob:)/i.test(url)) return url;
        return `/api/media/export?url=${encodeURIComponent(url)}`;
      };
      const mediaExtension = (value, fallback) => {
        try {
          const url = new URL(String(value || ''), window.location.origin);
          const filename = url.searchParams.get('filename')
            || url.searchParams.get('path')
            || url.pathname;
          const extension = filename.split('.').pop()?.toLowerCase();
          return extension && /^[a-z0-9]{2,5}$/.test(extension) ? extension : fallback;
        } catch {
          return fallback;
        }
      };
      const mediaDataCache = new Map();
      const loadMediaForExport = async (url, type) => {
        const cacheKey = `${type}:${url}`;
        if (mediaDataCache.has(cacheKey)) return mediaDataCache.get(cacheKey);

        const token = localStorage.getItem('token');
        const response = await fetch(exportMediaPath(url), {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.error || t('workflow.toolbar.mediaReadFailed', { type: t(`workflow.toolbar.mediaType${type === 'video' ? 'Video' : 'Audio'}`), status: response.status }));
        }

        const blob = await response.blob();
        const contentType = String(blob.type || response.headers.get('content-type') || '').toLowerCase();
        if (!blob.size || !contentType.startsWith(`${type}/`)) {
          throw new Error(t('workflow.toolbar.mediaInvalid', { type: t(`workflow.toolbar.mediaType${type === 'video' ? 'Video' : 'Audio'}`), format: contentType || 'unknown' }));
        }

        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error(t('workflow.toolbar.mediaReadFailed', { type: t(`workflow.toolbar.mediaType${type === 'video' ? 'Video' : 'Audio'}`), status: 'network' })));
          reader.readAsDataURL(blob);
        });
        const mimeExtension = {
          'video/mp4': 'mp4',
          'video/webm': 'webm',
          'video/quicktime': 'mov',
          'audio/mpeg': 'mp3',
          'audio/mp3': 'mp3',
          'audio/mp4': 'm4a',
          'audio/wav': 'wav',
          'audio/x-wav': 'wav',
        }[contentType.split(';')[0]];
        const result = {
          data,
          extn: mimeExtension || mediaExtension(url, type === 'video' ? 'mp4' : 'mp3'),
        };
        mediaDataCache.set(cacheKey, result);
        return result;
      };

      for (const phase of pptData) {
        for (const step of (phase.steps || [])) {
          for (const slideData of (step.slides || [])) {
            const slide = pres.addSlide();
            slide.background = { color: asHex(slideData.background, 'FFFFFF') };
            if (slideData.backgroundImage) {
              slide.addImage({ path: slideData.backgroundImage, x: 0, y: 0, w: 13.333, h: 7.5 });
            }

            for (const layer of (slideData.layers || []).filter((item) => !item.hidden)) {
              const x = (Number(layer.x) || 0) * scaleX;
              const y = (Number(layer.y) || 0) * scaleY;
              const w = (Number(layer.width) || 120) * scaleX;
              const h = (Number(layer.height) || 40) * scaleY;

              if (layer.type === 'image' && layer.url) {
                slide.addImage({ path: layer.url, x, y, w, h, rotate: Number(layer.rotation) || 0 });
                continue;
              }

              if (layer.type === 'video' && layer.url) {
                const media = await loadMediaForExport(layer.url, 'video');
                slide.addMedia({
                  type: 'video',
                  data: media.data,
                  extn: media.extn,
                  x,
                  y,
                  w,
                  h,
                });
                continue;
              }

              if (layer.type === 'audio' && layer.url) {
                const media = await loadMediaForExport(layer.url, 'audio');
                slide.addMedia({
                  type: 'audio',
                  data: media.data,
                  extn: media.extn,
                  x,
                  y,
                  w,
                  h,
                });
                continue;
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
            }
          }
        }
      }

      const title = (latestCourseRef.current?.courseTitle || latestCourseRef.current?.title || 'Lesson Slides')
        .replace(/[\\/:*?"<>|]/g, '_');
      await pres.writeFile({ fileName: `${title}.pptx` });
      message.success(t('workflow.toolbar.exportStarted'));
    } catch (error) {
      console.error('PPT 导出失败:', error);
      message.error(error?.message || t('workflow.toolbar.exportFailed'));
    } finally {
      setExporting(false);
    }
  }, [t]);

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
      onPhasesChange={setPhases}
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
      pendingTaskAsset={pendingTaskAsset}
      onConsumeTaskAsset={() => setPendingTaskAsset(null)}
    />,
    <ReadingMaterialView key="reading" course={course} materials={materials} onMaterialsChange={setMaterials} />,
  ];

  return (
    <section className={`fr-workflow view-${workflowSteps[current].key}-active`}>
      <header className="fr-editor-tb">
        <div className="fr-wf-toolbar">
          <div className="fr-wf-context">
            <button
              type="button"
              data-wb-button="quiet"
              data-wb-size="sm"
              data-wb-icon
              aria-label={t('createCourse.backToList')}
              title={t('createCourse.backToList')}
              onClick={onBack}
            >
              <ArrowLeft size={16} aria-hidden="true" />
            </button>
            <h1 className="fr-tb-course" title={displayCourseTitle}>{displayCourseTitle}</h1>
          </div>
          <div className="fr-wf-actions">
            <div className={`fr-autosave is-${activeSaveStatus}`} title={activeSaveText} role="status" aria-label={activeSaveText}>
              {activeSaveStatus === 'saving' && <Loader2 className="fr-autosave-spinner" size={16} aria-hidden="true" />}
              {activeSaveStatus === 'error' && <CircleAlert size={16} aria-hidden="true" />}
              {activeSaveStatus === 'dirty' && <Clock3 size={16} aria-hidden="true" />}
              {activeSaveStatus === 'saved' && <Check size={16} aria-hidden="true" />}
            </div>
            <Button
              data-wb-button="secondary" data-wb-size="sm" className="fr-wf-utility"
              icon={<Save size={16} aria-hidden="true" />}
              aria-label={t('workflow.toolbar.save')} title={t('workflow.toolbar.save')}
              loading={activeSaveStatus === 'saving'} onClick={handleToolbarSave}
            >
              <span className="fr-wf-action-label">{t('workflow.toolbar.save')}</span>
            </Button>
            {workflowSteps[current].key === 'ppt' && (
              <Button
                data-wb-button="secondary" data-wb-size="sm" className="fr-wf-utility"
                icon={<Download size={16} aria-hidden="true" />}
                aria-label={t('workflow.toolbar.export')} title={t('workflow.toolbar.export')}
                loading={exporting} onClick={exportPpt}
              >
                <span className="fr-wf-action-label">{t('workflow.toolbar.export')}</span>
              </Button>
            )}
            <button
              type="button"
              className="fr-wf-utility"
              data-wb-button="secondary" data-wb-size="sm"
              aria-label={t('workflow.toolbar.taskCenter', { count: taskCount })} title={t('header.taskCenter')}
              aria-haspopup="dialog" aria-expanded={taskDrawerOpen}
              onClick={() => {
                loadTaskCount();
                setTaskDrawerOpen(true);
              }}
            >
              <ListTodo size={16} aria-hidden="true" />
              <span className="fr-wf-action-label">{t('header.taskCenter')} {taskCount}</span>
            </button>
            <LanguageSwitcher className="fr-workflow-language" />
            <Button
              type="primary" data-wb-button="primary" data-wb-size="sm" autoInsertSpace={false}
              loading={publishing} onClick={handlePublish}
            >
              {t('workflow.toolbar.publish')}
            </Button>
          </div>
        </div>
        <AuthoringSteps
          className="fr-course-steps"
          label={t('workflow.stepNavigation')}
          steps={workflowSteps.map(step => t(`workflow.steps.${step.key}`))}
          current={current}
          onChange={setCurrent}
        />
      </header>

      <div className="fr-workflow-stage">{content[current]}</div>
      <Drawer
        placement="right"
        onClose={() => {
          setTaskDrawerOpen(false);
          loadTaskCount();
        }}
        open={taskDrawerOpen}
        width={420}
        styles={{ body: { padding: 0 }, header: { display: 'none' } }}
      >
        <TaskCenter
          onClose={() => {
            setTaskDrawerOpen(false);
            loadTaskCount();
          }}
          onInsertTaskAsset={(payload) => {
            setCurrent(2);
            setPendingTaskAsset({
              ...payload,
              requestId: `${Date.now()}-${Math.random()}`,
            });
            setTaskDrawerOpen(false);
            loadTaskCount();
          }}
        />
      </Drawer>
    </section>
  );
}
