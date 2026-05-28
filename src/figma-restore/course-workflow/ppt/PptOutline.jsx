import { ChevronDown, ChevronRight, FileText, Plus } from 'lucide-react';
import { PptDemoScene } from './PptDemoScene';

const phaseLabels = {
  engage: 'E-ENGAGE 引入',
  empower: 'E-EMPOWER 赋能',
  execute: 'E-EXECUTE 实践',
  elevate: 'E-ELEVATE 升华',
};

export function PptOutline({
  course,
  activePhaseKey,
  activeStepId,
  activeSlideId,
  onSelectStep,
  onSelectSlide,
  onAddSlide,
}) {
  return (
    <aside className="ppt-left">
      <div className="ppt-left-head">课程大纲</div>

      <div className="ppt-left-scroll">
        {course.map((phase) => (
          <section className={`ppt-phase ppt-phase-${phase.tone}`} key={phase.key}>
            <div className="ppt-phase-label">{phaseLabels[phase.key] || phase.title}</div>
            {phase.steps.map((step) => {
              const isStepActive = activePhaseKey === phase.key && activeStepId === step.id;
              return (
                <div className="ppt-step-block" key={step.id}>
                  <button
                    type="button"
                    className={`ppt-step-item ${isStepActive ? 'on' : ''}`}
                    onClick={() => onSelectStep(phase.key, step.id, step.slides[0]?.id)}
                  >
                    {isStepActive ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                    <span className="ppt-step-icon"><FileText size={12} /></span>
                    <span className="ppt-step-title">{step.title}</span>
                    <b>{step.slides.length}</b>
                  </button>

                  {isStepActive && (
                    <div className="ppt-thumb-wrap">
                      {step.slides.map((slide, index) => (
                        <button
                          type="button"
                          key={slide.id}
                          className={`ppt-thumb ${activeSlideId === slide.id ? 'on' : ''}`}
                          onClick={() => onSelectSlide(slide.id)}
                        >
                          <span className="ppt-thumb-index">{index + 1}</span>
                          <PptDemoScene />
                        </button>
                      ))}
                      <button
                        type="button"
                        className="ppt-thumb ppt-thumb-add"
                        onClick={() => onAddSlide(phase.key, step.id)}
                        aria-label="新增幻灯片"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </aside>
  );
}
