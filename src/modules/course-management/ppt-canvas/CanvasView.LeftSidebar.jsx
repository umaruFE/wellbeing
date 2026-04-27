import React from 'react';
import { 
  BookOpen, 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2 
} from 'lucide-react';

/**
 * CanvasViewLeftSidebar - 课程编排左侧边栏
 */
export const CanvasViewLeftSidebar = ({ 
  courseData, 
  expandedPhases, 
  activeStepId, 
  onTogglePhase, 
  onStepClick, 
  onAddStep,
  onDeleteStep,
  isLeftOpen,
  onLeftToggle 
}) => {
  if (!isLeftOpen) return null;

  const isCourseDataArray = Array.isArray(courseData);
  
  const phases = isCourseDataArray ? courseData : Object.entries(courseData).map(([key, phase]) => ({ key, ...phase }));
  
  const getPhaseKey = (phase) => isCourseDataArray ? phase.id : phase.key;
  const getPhaseSteps = (phase) => isCourseDataArray ? phase.slides : phase.steps;
  const getPhaseLabel = (phase) => isCourseDataArray ? phase.label : phase.title;
  const getPhaseColor = (phase) => isCourseDataArray ? phase.color : phase.color;

  return (
    <aside className="w-64 bg-white border-r-2 border-stroke-light flex flex-col shrink-0 z-10">
      <div className="p-4 border-b-2 border-stroke-light bg-surface">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-lg text-primary flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-info" /> 课程编排
          </h1>
          <button onClick={onLeftToggle} className="text-primary-placeholder hover:text-primary-secondary">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-primary-muted mt-1 truncate">
          {isCourseDataArray && courseData[0]?.slides?.[0]?.phase 
            ? courseData[0].slides[0].phase 
            : '课程编排'}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {phases.map((phase) => {
          const phaseKey = getPhaseKey(phase);
          const phaseSteps = getPhaseSteps(phase);
          const phaseLabel = getPhaseLabel(phase);
          const phaseColor = getPhaseColor(phase);
          
          return (
            <div key={phaseKey} className="rounded-xl overflow-hidden border-2 border-stroke-light bg-white">
              <button 
                onClick={() => onTogglePhase(phaseKey)} 
                className={`w-full flex items-center justify-between p-3 text-left font-bold text-sm transition-colors ${phaseColor.replace('text-', 'bg-opacity-10 ')} hover:bg-opacity-20`}
              >
                <span className="flex items-center gap-2">
                  {expandedPhases.includes(phaseKey) 
                    ? <ChevronDown className="w-4 h-4"/> 
                    : <ChevronRight className="w-4 h-4"/>
                  }{phaseLabel}
                </span>
              </button>
              {expandedPhases.includes(phaseKey) && (
                <div className="bg-surface border-t-2 border-stroke-light">
                  {phaseSteps.map((step) => (
                    <div 
                      key={step.id} 
                      className={`group/step border-b-2 border-stroke-light last:border-0 hover:bg-surface transition-all flex items-center ${activeStepId === step.id ? 'bg-surface' : ''}`}
                    >
                      <button 
                        onClick={() => onStepClick(phaseKey, step.id)} 
                        className={`flex-1 text-left p-2 pl-8 text-xs transition-all flex items-start gap-2 ${
                          activeStepId === step.id 
                            ? 'text-info-active font-semibold border-l-4 border-l-blue-600' 
                            : 'text-primary-secondary'
                        }`}
                      >
                        <span className="shrink-0 mt-0.5"><FileText className="w-3 h-3" /></span>
                        <span className="line-clamp-2">{step.title}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteStep(phaseKey, step.id);
                        }}
                        className="p-2 mr-2 opacity-0 group-hover/step:opacity-100 hover:bg-error-light rounded text-error transition-all shrink-0"
                        title="删除环节"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => onAddStep(phaseKey)}
                    className="w-full text-center py-2 text-xs text-primary-placeholder hover:text-info-hover flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> 新增环节
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default CanvasViewLeftSidebar;
