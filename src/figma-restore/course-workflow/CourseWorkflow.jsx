import React from 'react';
import { Button, Drawer } from 'antd';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Download, Redo2, Save, Undo2 } from 'lucide-react';
import apiService from '../../services/api';
import { TaskCenter } from '../TaskCenter';
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
  const [taskDrawerVisible, setTaskDrawerVisible] = React.useState(false);
  const [taskCount, setTaskCount] = React.useState(0);
  const [pendingPptAsset, setPendingPptAsset] = React.useState(null);
  const initialPptData = React.useMemo(
    () => course?.canvasData || course?.canvas_data || null,
    [course?.canvasData, course?.canvas_data]
  );
  const [pptCanvasData, setPptCanvasData] = React.useState(initialPptData);
  const [pptSaveStatus, setPptSaveStatus] = React.useState('saved');
  const [pptSaveError, setPptSaveError] = React.useState('');
  const latestPptCanvasRef = React.useRef(initialPptData);
  const saveSequenceRef = React.useRef(0);
  const dirtyVersionRef = React.useRef(0);

  React.useEffect(() => {
    document.body.classList.add('fr-workflow-route-active');
    return () => {
      document.body.classList.remove('fr-workflow-route-active');
    };
  }, []);

  const loadTaskCount = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/background-tasks?scope=active', {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const result = await response.json();
      if (response.ok && result.success) {
        setTaskCount(result.data?.tasks?.length || 0);
      }
    } catch {
      setTaskCount(0);
    }
  }, []);

  React.useEffect(() => {
    loadTaskCount();
    const timer = window.setInterval(loadTaskCount, 10000);
    return () => window.clearInterval(timer);
  }, [loadTaskCount]);

  React.useEffect(() => {
    latestPptCanvasRef.current = initialPptData;
    setPptCanvasData(initialPptData);
    setPptSaveStatus('saved');
    setPptSaveError('');
    dirtyVersionRef.current = 0;
  }, [course?.id, initialPptData]);

  const getDraftSaveKey = React.useCallback(() => (
    `coursegen:ppt-canvas:${course?.id || course?.courseTitle || course?.title || 'draft'}`
  ), [course?.courseTitle, course?.id, course?.title]);

  const savePptCanvas = React.useCallback(async (data = latestPptCanvasRef.current) => {
    if (!data) return;

    const saveId = saveSequenceRef.current + 1;
    const savingVersion = dirtyVersionRef.current;
    saveSequenceRef.current = saveId;
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

      if (saveSequenceRef.current === saveId && dirtyVersionRef.current === savingVersion) {
        setPptSaveStatus('saved');
      }
    } catch (error) {
      console.error('保存 PPT 课件失败:', error);
      if (saveSequenceRef.current === saveId) {
        setPptSaveStatus('error');
        setPptSaveError(error?.message || '保存失败');
      }
    }
  }, [course?.id, getDraftSaveKey]);

  const handlePptCanvasChange = React.useCallback((nextData, meta = {}) => {
    latestPptCanvasRef.current = nextData;
    setPptCanvasData(nextData);
    if (meta.source === 'initial') return;
    dirtyVersionRef.current += 1;
    setPptSaveStatus('dirty');
    setPptSaveError('');
  }, []);

  React.useEffect(() => {
    if (pptSaveStatus !== 'dirty' || !pptCanvasData) return undefined;

    const timer = window.setTimeout(() => {
      savePptCanvas(pptCanvasData);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [pptCanvasData, pptSaveStatus, savePptCanvas]);

  const pptSaveText = {
    dirty: '等待自动保存',
    saving: '正在保存...',
    error: pptSaveError || '保存失败',
    saved: '所有更改已保存',
  }[pptSaveStatus] || '所有更改已保存';

  const insertTaskAssetToPpt = React.useCallback((asset) => {
    setPendingPptAsset({
      ...asset,
      requestId: `task-asset-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });
    setCurrent(2);
    setTaskDrawerVisible(false);
  }, []);

  const content = [
    <CourseMapView key="map" course={course} onCourseChange={setCourse} onNext={() => setCurrent(1)} />,
    <LessonPlanView key="lesson" course={course} phases={phases} onPhasesChange={setPhases} onNext={() => setCurrent(2)} />,
    <PptCoursewareView
      key="ppt"
      onNext={() => setCurrent(3)}
      initialCourseData={pptCanvasData || phases}
      pendingTaskAsset={pendingPptAsset}
      onConsumeTaskAsset={() => setPendingPptAsset(null)}
      onCourseChange={handlePptCanvasChange}
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
                  <b>{step.title}</b>
                  <small>{index < current ? '已完成' : index === current ? '查看/编辑' : '待制作'}</small>
                </span>
              </button>
              {index < workflowSteps.length - 1 && <span className="fr-wf-arrow">→</span>}
            </React.Fragment>
          ))}
        </div>
        <div className="fr-tb-spacer" />
        <div className="fr-history-actions">
          <button type="button" aria-label="撤销"><Undo2 size={16} /></button>
          <button type="button" aria-label="重做"><Redo2 size={16} /></button>
        </div>
        <div className={`fr-autosave ${pptSaveStatus === 'saving' ? 'is-saving' : ''} ${pptSaveStatus === 'error' ? 'is-error' : ''}`}>
          <span />
          {pptSaveText}
        </div>
        <button
          className="task-button fr-task-button"
          type="button"
          onClick={() => {
            loadTaskCount();
            setTaskDrawerVisible(true);
          }}
        >
          <div className="task-dot" />
          <span className="task-text">后台任务 {taskCount}</span>
        </button>
        <Button
          className="fr-save-btn"
          icon={<Save size={15} />}
          disabled={pptSaveStatus === 'saving'}
          onClick={() => savePptCanvas()}
        >
          保存
        </Button>
        <Button className="fr-export-btn" icon={<Download size={15} />}>导出</Button>
        <Button className="fr-publish-btn">发布</Button>
      </header>

      {content[current]}

      <Drawer
        placement="right"
        onClose={() => {
          setTaskDrawerVisible(false);
          loadTaskCount();
        }}
        open={taskDrawerVisible}
        width={420}
        bodyStyle={{ padding: 0 }}
        headerStyle={{ display: 'none' }}
      >
        <TaskCenter
          onClose={() => {
            setTaskDrawerVisible(false);
            loadTaskCount();
          }}
          onInsertTaskAsset={insertTaskAssetToPpt}
        />
      </Drawer>
    </section>
  );
}
