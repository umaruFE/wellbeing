import React from 'react';
import { ChevronDown, ChevronRight, FileText, Plus } from 'lucide-react';

const phaseLabels = {
  engage: 'E-ENGAGE 引入',
  empower: 'E-EMPOWER 赋能',
  execute: 'E-EXECUTE 实践',
  elevate: 'E-ELEVATE 升华',
};

const phaseColors = {
  engage: { color: '#a866e8', bg: '#f3e8ff', border: '#a866e8', shadow: '#d8b8f4' },
  empower: { color: '#4f8ff7', bg: '#eff6ff', border: '#4f8ff7', shadow: '#b7d3ff' },
  execute: { color: '#54bd76', bg: '#ecfdf5', border: '#54bd76', shadow: '#b5e7c4' },
  elevate: { color: '#ff7a61', bg: '#fff0eb', border: '#ff7a61', shadow: '#ffc0b2' },
};

export function PptOutline({
  course,
  activePhaseKey,
  activeStepId,
  activeSlideId,
  onSelectStep,
  onAddSlide,
}) {
  const [expandedStepIds, setExpandedStepIds] = React.useState(() => (
    activeStepId ? new Set([activeStepId]) : new Set()
  ));

  const toggleStep = React.useCallback((stepId) => {
    setExpandedStepIds((current) => {
      const next = new Set(current);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  }, []);

  const renderSlidePreview = (phase, step) => {
    if (!expandedStepIds.has(step.id) || !step.slides?.length) return null;

    return (
      <div className="ppt-slide-preview-wrapper">
        <div className="ppt-slide-connector-line" />
        {step.slides.map((slide, slideIndex) => {
          const isSlideActive = activeSlideId === slide.id;
          return (
            <div key={slide.id} className="ppt-slide-row">
              <span className="ppt-slide-number">{slideIndex + 1}</span>
              <div className="ppt-slide-thumb-wrapper">
                <div className="ppt-slide-indicator-box">
                  <div className={`ppt-slide-dot ${isSlideActive ? 'active' : ''}`} />
                  <div className="ppt-slide-line" />
                </div>
                <button
                  type="button"
                  className={`ppt-slide-thumb ${isSlideActive ? 'active' : ''}`}
                  onClick={() => onSelectStep(phase.key, step.id, slide.id)}
                >
                  <PptOutlineThumb slideIndex={slideIndex} />
                </button>
              </div>
            </div>
          );
        })}
        <div className="ppt-slide-row ppt-slide-add-row">
          <span className="ppt-slide-number" />
          <div className="ppt-slide-thumb-wrapper">
            <div className="ppt-slide-indicator-box">
              <div className="ppt-slide-dot" />
            </div>
            <button
              type="button"
              className="ppt-add-slide-btn"
              onClick={() => onAddSlide(phase.key, step.id)}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <aside className="ppt-left">
      <div className="ppt-left-head">课程大纲</div>

      <div className="ppt-left-scroll">
        {course.map((phase) => {
          const colors = phaseColors[phase.key] || phaseColors.engage;
          return (
            <section className="ppt-phase" key={phase.key}>
              <div className="ppt-phase-header">
                <span className="ppt-phase-dot" style={{ backgroundColor: colors.color }} />
                <span className="ppt-phase-title">{phaseLabels[phase.key] || phase.title}</span>
              </div>

              <div className="ppt-step-list">
                {phase.steps.map((step, stepIndex) => {
                  const isStepActive = activePhaseKey === phase.key && activeStepId === step.id;
                  const isExpanded = expandedStepIds.has(step.id);
                  const slideCount = step.slides?.length || 0;
                  const isFirstEngageStep = stepIndex === 0 && phase.key === 'engage';
                  const cardStyle = {
                    '--phase-color': colors.color,
                    '--phase-bg': colors.bg,
                    '--phase-border': colors.border,
                    '--phase-shadow': colors.shadow,
                  };

                  const card = (
                    <button
                      type="button"
                      className={`${isFirstEngageStep ? 'ppt-first-step-card' : 'ppt-step-card'} ${isStepActive ? 'active' : ''}`}
                      style={cardStyle}
                      onClick={() => toggleStep(step.id)}
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span className="ppt-step-icon" style={{ backgroundColor: colors.color }}>
                        <FileText size={12} />
                      </span>
                      <span className="ppt-step-name">{step.title}</span>
                      <span className="ppt-step-count">{slideCount}</span>
                    </button>
                  );

                  return (
                    <div className="ppt-step-container" key={step.id}>
                      {isFirstEngageStep ? (
                        <div className="ppt-first-step-wrapper">
                          {card}
                          {renderSlidePreview(phase, step)}
                        </div>
                      ) : (
                        <div className="ppt-step-container-inner">
                          <div className="ppt-step-connector">
                            <span
                              className="ppt-step-dot"
                              style={{ backgroundColor: isStepActive ? colors.color : '#77808f' }}
                            />
                            {stepIndex < phase.steps.length - 1 && <span className="ppt-step-line" />}
                          </div>
                          {card}
                          {renderSlidePreview(phase, step)}
                        </div>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  className="ppt-add-step"
                  onClick={() => {
                    const firstStep = phase.steps[0];
                    if (firstStep) onAddSlide(phase.key, firstStep.id);
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </aside>
  );
}

function PptOutlineThumb({ slideIndex }) {
  return <div className={`ppt-design-thumb thumb-${Math.min(slideIndex, 1)}`} aria-hidden="true" />;
}
