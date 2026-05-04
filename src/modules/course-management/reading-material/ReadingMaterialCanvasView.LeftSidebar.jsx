import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Layout,
  FileText
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

export const ReadingMaterialCanvasViewLeftSidebar = ({
  courseData,
  expandedPhases,
  activeStepId,
  selectedMaterialId,
  onTogglePhase,
  onStepClick,
  onAddStep,
  onDeleteStep,
  onSelectMaterial,
  onAddReadingMaterial,
  onAddPageToMaterial,
  onDeletePage,
  isLeftOpen,
  onLeftToggle
}) => {
  if (!isLeftOpen) return null;

  const phases = getPhaseList(courseData);
  const isArr = Array.isArray(courseData);

  const [expandedSteps, setExpandedSteps] = useState(() => {
    const init = {};
    phases.forEach(p => {
      (p.steps || p.slides || []).forEach(s => { init[s.id] = true; });
    });
    return init;
  });

  const [expandedMaterials, setExpandedMaterials] = useState({});

  const toggleStep = (id) => setExpandedSteps(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleMaterial = (id) => setExpandedMaterials(prev => ({ ...prev, [id]: !prev[id] }));

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
            <span className="px-2 py-0.5 bg-blue-50 text-blue-500 rounded-full text-[11px] font-medium">
              材料 {totalSteps}
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
                    const isExpanded = expandedSteps[step.id];
                    const isActive = activeStepId === step.id;
                    const assets = (step.assets || []).filter(a => a.type === 'image');

                    return (
                      <div key={step.id} className="mb-1">
                        <div
                          className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 transition-all cursor-pointer ${
                            isActive && !selectedMaterialId ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <button
                            onClick={() => toggleStep(step.id)}
                            className="p-0.5 text-gray-400 hover:text-gray-600 shrink-0"
                          >
                            {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => onStepClick(phaseKey, step.id)}
                            className={`flex-1 text-left text-[12px] font-medium truncate ${
                              isActive && !selectedMaterialId ? 'text-blue-600' : 'text-gray-600'
                            }`}
                          >
                            {step.title}
                          </button>

                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                              {assets.length}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); onDeleteStep(phaseKey, step.id); }}
                              className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded text-red-400 hover:text-red-600 transition-all shrink-0"
                              title="删除环节"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="ml-5 pl-2 border-l-2 border-gray-100">
                            {assets.map((asset, index) => {
                              const isAssetActive = isActive;
                              return (
                                <div
                                  key={asset.id}
                                  onClick={() => {
                                    onStepClick(phaseKey, step.id);
                                    onSelectMaterial(asset.id);
                                  }}
                                  className={`group/page flex items-center gap-2 py-1 px-2 rounded-lg cursor-pointer transition-all mb-0.5 ${
                                    isAssetActive ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-gray-50'
                                  }`}
                                >
                                  <span className={`text-[10px] font-medium w-3 text-center shrink-0 ${
                                    isAssetActive ? 'text-blue-500' : 'text-gray-400'
                                  }`}>
                                    {index + 1}
                                  </span>

                                  <div className={`w-12 h-8 rounded overflow-hidden border shrink-0 ${
                                    isAssetActive ? 'border-blue-300' : 'border-gray-200'
                                  }`}>
                                    {asset.url ? (
                                      <img src={asset.url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                        <Layout className="w-3 h-3 text-gray-300" />
                                      </div>
                                    )}
                                  </div>

                                  <span className="text-[10px] text-gray-500 truncate flex-1">{asset.title}</span>

                                  <button
                                    onClick={(e) => { e.stopPropagation(); onDeletePage(asset.id); }}
                                    className="p-0.5 opacity-0 group-hover/page:opacity-100 hover:bg-red-50 rounded text-red-400 hover:text-red-600 transition-all shrink-0"
                                    title="删除页面"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              );
                            })}

                            <button
                              onClick={() => onAddReadingMaterial({ stepId: step.id, phaseKey })}
                              className="w-full mt-1 mb-2 py-2 border-2 border-dashed border-blue-200 rounded-lg text-blue-500 text-[11px] font-medium flex items-center justify-center gap-1 hover:bg-blue-50 hover:border-blue-300 transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              添加阅读材料
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* <button
                    onClick={() => onAddStep(phaseKey)}
                    className="w-full text-center py-2 text-[11px] text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 transition-colors mt-1"
                  >
                    <Plus className="w-3 h-3" /> 新增环节
                  </button> */}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default ReadingMaterialCanvasViewLeftSidebar;
