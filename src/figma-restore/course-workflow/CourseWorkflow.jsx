import React from 'react';
import { Button } from 'antd';
import { ArrowLeft, Download, Redo2, Undo2 } from 'lucide-react';
import { CourseMapView } from './CourseMapView';
import { LessonPlanView } from './LessonPlanView';
import { PptCoursewareView } from './PptCoursewareView';
import { ReadingMaterialView } from './ReadingMaterialView';
import { phaseTemplates, readingTemplates, workflowSteps } from './workflowData';
import './CourseWorkflow.css';

export function CourseWorkflow({ initialCourse, onBack }) {
  const [current, setCurrent] = React.useState(0);
  const [course, setCourse] = React.useState(initialCourse || {});
  const [phases, setPhases] = React.useState(phaseTemplates);
  const [materials, setMaterials] = React.useState(readingTemplates);

  React.useEffect(() => {
    document.body.classList.add('fr-workflow-route-active');
    return () => {
      document.body.classList.remove('fr-workflow-route-active');
    };
  }, []);

  const content = [
    <CourseMapView key="map" course={course} onCourseChange={setCourse} onNext={() => setCurrent(1)} />,
    <LessonPlanView key="lesson" phases={phases} onPhasesChange={setPhases} onNext={() => setCurrent(2)} />,
    <PptCoursewareView key="ppt" onNext={() => setCurrent(3)} />,
    <ReadingMaterialView key="reading" course={course} materials={materials} onMaterialsChange={setMaterials} />,
  ];

  return (
    <section className={`fr-workflow view-${workflowSteps[current].key}-active`}>
      <header className="fr-editor-tb">
        <Button icon={<ArrowLeft size={16} />} onClick={onBack}>返回课程列表</Button>
        <span className="fr-tb-course">{course.courseTitle || course.title || '新课程'}</span>
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
        <div className="fr-autosave"><span />所有更改已保存</div>
        <div className="fr-task-pill"><span />后台任务 <b>2</b></div>
        <Button className="fr-export-btn" icon={<Download size={15} />}>导出</Button>
        <Button className="fr-publish-btn">发布</Button>
      </header>

      {content[current]}
    </section>
  );
}
