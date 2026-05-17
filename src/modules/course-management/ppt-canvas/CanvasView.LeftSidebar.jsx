import React, { useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Layout
} from 'lucide-react';

const COLOR_MAP = {
  purple: '#8B5CF6',
  blue: '#3B82F6',
  green: '#10B981',
  yellow: '#F59E0B',
  gray: '#6B7280'
};

const PHASE_ORDER = ['engage', 'empower', 'execute', 'elevate'];

const parsePhaseColor = (colorStr) => {
  const m = colorStr?.match(/text-(\w+)-\d+/);
  return COLOR_MAP[m?.[1]] || COLOR_MAP.gray;
};

const getPhaseList = (courseData) => {
  if (!courseData) return [];
  if (Array.isArray(courseData)) return courseData;
  return PHASE_ORDER
    .filter(k => courseData[k])
    .map(k => ({ key: k, ...courseData[k] }));
};

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

  const phases = getPhaseList(courseData);
  const isArr = Array.isArray(courseData);

  const totalSteps = useMemo(() => {
    return phases.reduce((sum, p) => sum + (p.steps || p.slides || []).length, 0);
  }, [phases]);

  const getPhaseKey = (p) => isArr ? p.id : p.key;
  const getSteps = (p) => p.steps || p.slides || [];
  const getLabel = (p) => isArr ? p.label : p.title;
  const getColor = (p) => p.color;

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0 z-10 h-full">
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="font-bold text-[15px] text-gray-800">课程大纲</div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-orange-50 text-orange-500 rounded-full text-[11px] font-medium">
              幻灯片 {totalSteps}
            </span>
            <button onClick={onLeftToggle} className="text-gray-400 hover:text-gray-600 p-0.5">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {phases.map((phase) => {
          const phaseKey = getPhaseKey(phase);
          const steps = getSteps(phase);
          const label = getLabel(phase);
          const dotColor = parsePhaseColor(getColor(phase));

          return (
            <div key={phaseKey} className="mb-1">
              <button
                onClick={() => onTogglePhase(phaseKey)}
                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                <span className="text-[13px] font-bold text-gray-700 uppercase tracking-wide">
                  {label}
                </span>
              </button>

              {expandedPhases.includes(phaseKey) && (
                <div className="px-2">
                  {steps.map((step) => {
                    const isActive = activeStepId === step.id;
                    const firstImage = (step.assets || []).find(a => a.type === 'image' && a.url);

                    return (
                      <div key={step.id} className="mb-1">
                        <div
                          onClick={() => onStepClick(phaseKey, step.id)}
                          className={`group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all cursor-pointer ${
                            isActive ? 'bg-orange-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="w-14 h-9 rounded-md overflow-hidden border border-gray-200 shrink-0">
                            {firstImage ? (
                              <img src={firstImage.url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <Layout className="w-4 h-4 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <span className={`flex-1 text-[12px] font-medium truncate ${isActive ? 'text-orange-600' : 'text-gray-600'}`}>
                            {step.title}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteStep(phaseKey, step.id); }}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded text-red-400 hover:text-red-600 transition-all shrink-0"
                            title="删除幻灯片"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={() => onAddStep(phaseKey)}
                    className="w-full mt-1 mb-2 py-2 border-2 border-dashed border-orange-200 rounded-lg text-orange-500 text-[11px] font-medium flex items-center justify-center gap-1 hover:bg-orange-50 hover:border-orange-300 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    添加幻灯片
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
