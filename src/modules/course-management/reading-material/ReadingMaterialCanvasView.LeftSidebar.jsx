import React from 'react';
import { 
  BookOpen, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2,
  FileText 
} from 'lucide-react';

/**
 * ReadingMaterialCanvasViewLeftSidebar - 阅读材料画布视图左侧边栏
 * 包含环节列表和阅读材料管理
 */
export const ReadingMaterialCanvasViewLeftSidebar = ({ 
  courseData,
  expandedPhases,
  activeStepId,
  selectedMaterialId,
  pages,
  onTogglePhase,
  onStepClick,
  onAddStep,
  onDeleteStep,
  onSelectMaterial,
  onAddReadingMaterial,
  onAddPageToMaterial,
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
                  {expandedPhases.includes(phaseKey) ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                  {phaseLabel}
                </span>
              </button>
              {expandedPhases.includes(phaseKey) && (
                <div className="bg-surface border-t-2 border-stroke-light">
                  {phaseSteps.map((step) => {
                    // 获取该环节的所有页面
                    const stepPages = pages.filter(p => p.slideId === step.id);
                    // 按materialId分组
                    const materialsMap = new Map();
                    stepPages.forEach(page => {
                      const materialId = page.materialId || 'default';
                      if (!materialsMap.has(materialId)) {
                        materialsMap.set(materialId, []);
                      }
                      materialsMap.get(materialId).push(page);
                    });
                    const materials = Array.from(materialsMap.entries());

                    return (
                      <div key={step.id} className="border-b-2 border-stroke-light last:border-0">
                        {/* 环节标题 */}
                        <div
                          className={`group/step hover:bg-info-light transition-all flex items-center ${
                            activeStepId === step.id && !selectedMaterialId ? 'bg-info-light' : ''
                          }`}
                        >
                          <button
                            onClick={() => {
                              onStepClick(phaseKey, step.id);
                              onSelectMaterial(null);
                            }}
                            className={`flex-1 text-left p-2 pl-4 text-xs transition-all flex items-start gap-2 ${
                              activeStepId === step.id && !selectedMaterialId
                                ? 'text-info-active font-semibold border-l-4 border-l-blue-600'
                                : 'text-primary-secondary'
                            }`}
                          >
                            <span className="shrink-0 mt-0.5"><FileText className="w-3 h-3" /></span>
                            <span className="line-clamp-2">{step.title}</span>
                            {stepPages.length > 0 && (
                              <span className="text-[10px] text-primary-placeholder ml-auto">
                                {materials.length}个材料
                              </span>
                            )}
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

                        {/* 阅读材料列表 */}
                        <div className="bg-surface/50 pl-4 border-t-2 border-stroke-light">
                          <div className="px-2 py-1 flex items-center justify-between group/material-header">
                            <div className="text-[10px] font-medium text-primary-muted uppercase">
                              阅读材料 ({materials.length})
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddReadingMaterial({ stepId: step.id, phaseKey });
                              }}
                              className="opacity-0 group-hover/material-header:opacity-100 p-1 hover:bg-indigo-100 rounded text-indigo-600 transition-all"
                              title="新增阅读材料"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          {materials.length > 0 && materials.map(([materialId, materialPages]) => {
                            const isDefault = materialId === 'default';
                            const materialTitle = isDefault
                              ? '默认阅读材料'
                              : materialPages[0]?.title || `阅读材料 ${materialId.slice(-4)}`;
                            const isSelected = selectedMaterialId === materialId && activeStepId === step.id;

                            return (
                              <div key={materialId} className="border-b-2 border-stroke-light last:border-0 group/material-row">
                                <div className="flex items-center">
                                  <button
                                    onClick={() => {
                                      onStepClick(phaseKey, step.id);
                                      onSelectMaterial(materialId);
                                    }}
                                    className={`flex-1 text-left p-2 pl-6 text-xs transition-all flex items-center gap-2 group/material-item ${
                                      isSelected
                                        ? 'text-indigo-700 font-semibold bg-indigo-50 border-l-2 border-l-indigo-500'
                                        : 'text-primary-muted hover:text-primary-secondary hover:bg-surface-alt'
                                    }`}
                                    title={materialTitle}
                                  >
                                    <BookOpen className={`w-3 h-3 shrink-0 ${isSelected ? 'text-indigo-600' : 'text-primary-placeholder'}`} />
                                    <span className="line-clamp-1 flex-1 text-left">{materialTitle}</span>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <span className="text-[10px] text-primary-placeholder">{materialPages.length}页</span>
                                      {isSelected && (
                                        <ChevronRight className="w-3 h-3 text-indigo-600" />
                                      )}
                                    </div>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onAddPageToMaterial({ stepId: step.id, materialId });
                                    }}
                                    className="opacity-0 group-hover/material-row:opacity-100 p-1 mr-2 hover:bg-indigo-100 rounded text-indigo-600 transition-all"
                                    title="新增页面"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
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

export default ReadingMaterialCanvasViewLeftSidebar;