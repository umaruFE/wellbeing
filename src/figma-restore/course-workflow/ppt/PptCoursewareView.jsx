import React from 'react';
import { buildInitialPptCourse, createMediaLayer, createTextLayer } from './pptData';
import { cloneData, findActiveSlide } from './pptUtils';
import { PptOutline } from './PptOutline';
import { PptCanvas } from './PptCanvas';
import { PptRightPanel } from './right-panel/PptRightPanel';
import './css/PptCoursewareView.css';

export function PptCoursewareView({ onNext, initialCourseData, pendingTaskAsset, onConsumeTaskAsset }) {
  const [course, setCourse] = React.useState(() => buildInitialPptCourse(initialCourseData));
  const firstPhase = course[0];
  const firstStep = firstPhase?.steps[0];
  const firstSlide = firstStep?.slides[1] || firstStep?.slides[0];

  const [activePhaseKey, setActivePhaseKey] = React.useState(firstPhase?.key || 'engage');
  const [activeStepId, setActiveStepId] = React.useState(firstStep?.id || null);
  const [activeSlideId, setActiveSlideId] = React.useState(firstSlide?.id || null);
  const [selectedLayerId, setSelectedLayerId] = React.useState(
    firstSlide?.layers?.find((layer) => layer.type === 'text')?.id
      || firstSlide?.layers?.find((layer) => layer.type === 'video')?.id
      || null
  );
  const [assetPanelType, setAssetPanelType] = React.useState(null);

  const { step, slide } = findActiveSlide(course, activePhaseKey, activeStepId, activeSlideId);
  const slideIndex = Math.max(0, step?.slides.findIndex((item) => item.id === slide?.id) ?? 0);
  const selectedLayer = slide?.layers.find((layer) => layer.id === selectedLayerId) || null;

  const updateCourse = React.useCallback((recipe) => {
    setCourse((current) => {
      const next = cloneData(current);
      recipe(next);
      return next;
    });
  }, []);

  const selectStep = (phaseKey, stepId, slideId) => {
    setActivePhaseKey(phaseKey);
    setActiveStepId(stepId);
    setActiveSlideId(slideId);
    setSelectedLayerId(null);
  };

  const addSlide = (phaseKey, stepId) => {
    let newSlideId = null;
    updateCourse((draft) => {
      const targetPhase = draft.find((phase) => phase.key === phaseKey);
      const targetStep = targetPhase?.steps.find((item) => item.id === stepId);
      if (!targetStep) return;
      const newSlide = {
        id: `slide-${Date.now()}`,
        title: `${targetStep.title} ${targetStep.slides.length + 1}`,
        background: '#ffffff',
        layers: [],
      };
      targetStep.slides.push(newSlide);
      newSlideId = newSlide.id;
    });
    setActivePhaseKey(phaseKey);
    setActiveStepId(stepId);
    setActiveSlideId(newSlideId);
    setSelectedLayerId(null);
  };

  const addLayer = (type) => {
    const count = slide?.layers.length || 0;
    const nextLayer = type === 'text'
      ? createTextLayer({ x: 70 + count * 18, y: 70 + count * 18 })
      : createMediaLayer(type, { x: 88 + count * 18, y: 130 + count * 18 });

    updateCourse((draft) => {
      const active = findActiveSlide(draft, activePhaseKey, activeStepId, activeSlideId);
      active.slide?.layers.push(nextLayer);
    });
    setSelectedLayerId(nextLayer.id);
  };

  const openAssetPanel = (type) => {
    setAssetPanelType(type);
    setSelectedLayerId(null);
  };

  const insertGeneratedAsset = React.useCallback((type, patch = {}) => {
    const count = slide?.layers.length || 0;
    const nextLayer = createMediaLayer(type, {
      x: 88 + count * 18,
      y: 130 + count * 18,
      ...patch,
    });

    updateCourse((draft) => {
      const active = findActiveSlide(draft, activePhaseKey, activeStepId, activeSlideId);
      active.slide?.layers.push(nextLayer);
    });
    setAssetPanelType(null);
    setSelectedLayerId(nextLayer.id);
  }, [activePhaseKey, activeStepId, activeSlideId, slide?.layers.length, updateCourse]);

  const consumedTaskAssetRef = React.useRef(null);

  React.useEffect(() => {
    if (!pendingTaskAsset?.requestId || consumedTaskAssetRef.current === pendingTaskAsset.requestId) return;
    consumedTaskAssetRef.current = pendingTaskAsset.requestId;
    insertGeneratedAsset(pendingTaskAsset.type, pendingTaskAsset.patch || {});
    onConsumeTaskAsset?.();
  }, [insertGeneratedAsset, onConsumeTaskAsset, pendingTaskAsset]);

  const updateSlide = (patch) => {
    updateCourse((draft) => {
      const active = findActiveSlide(draft, activePhaseKey, activeStepId, activeSlideId);
      if (active.slide) Object.assign(active.slide, patch);
    });
  };

  const updateLayerById = React.useCallback((layerId, patch) => {
    updateCourse((draft) => {
      const active = findActiveSlide(draft, activePhaseKey, activeStepId, activeSlideId);
      const layer = active.slide?.layers.find((item) => item.id === layerId);
      if (layer) Object.assign(layer, patch);
    });
  }, [activePhaseKey, activeStepId, activeSlideId, updateCourse]);

  const updateSelectedLayer = (patch) => {
    if (selectedLayerId) updateLayerById(selectedLayerId, patch);
  };

  const toggleLayerHidden = (layerId) => {
    updateCourse((draft) => {
      const active = findActiveSlide(draft, activePhaseKey, activeStepId, activeSlideId);
      const layer = active.slide?.layers.find((item) => item.id === layerId);
      if (layer) layer.hidden = !layer.hidden;
    });
    if (selectedLayerId === layerId) setSelectedLayerId(null);
  };

  const duplicateLayer = () => {
    updateCourse((draft) => {
      const active = findActiveSlide(draft, activePhaseKey, activeStepId, activeSlideId);
      const layer = active.slide?.layers.find((item) => item.id === selectedLayerId);
      if (!layer) return;
      const copy = {
        ...cloneData(layer),
        id: `layer-${Date.now()}`,
        title: `${layer.title || '元素'} 副本`,
        x: (layer.x || 0) + 18,
        y: (layer.y || 0) + 18,
      };
      active.slide.layers.push(copy);
      setSelectedLayerId(copy.id);
    });
  };

  const deleteLayer = () => {
    updateCourse((draft) => {
      const active = findActiveSlide(draft, activePhaseKey, activeStepId, activeSlideId);
      if (!active.slide) return;
      active.slide.layers = active.slide.layers.filter((layer) => layer.id !== selectedLayerId);
    });
    setSelectedLayerId(null);
  };

  return (
    <div className="ppt-courseware" id="ed-ppt">
      <PptOutline
        course={course}
        activePhaseKey={activePhaseKey}
        activeStepId={activeStepId}
        activeSlideId={activeSlideId}
        onSelectStep={selectStep}
        onSelectSlide={(slideId) => {
          setActiveSlideId(slideId);
          setSelectedLayerId(null);
        }}
        onAddSlide={addSlide}
      />

      <PptCanvas
        step={step}
        slide={slide}
        slideIndex={slideIndex}
        slideCount={step?.slides.length || 0}
        selectedLayerId={selectedLayerId}
        onSelectLayer={setSelectedLayerId}
        onClearSelection={() => setSelectedLayerId(null)}
        onAddLayer={addLayer}
        onOpenAssetPanel={openAssetPanel}
        activeAssetPanelType={assetPanelType}
        onUpdateLayer={updateLayerById}
        onDuplicateLayer={duplicateLayer}
        onDeleteLayer={deleteLayer}
      />

      <PptRightPanel
        slide={slide}
        selectedLayer={selectedLayer}
        selectedLayerId={selectedLayerId}
        onSelectLayer={setSelectedLayerId}
        onUpdateSlide={updateSlide}
        onUpdateLayer={updateSelectedLayer}
        onToggleLayerHidden={toggleLayerHidden}
        onDuplicateLayer={duplicateLayer}
        onDeleteLayer={deleteLayer}
        onNext={onNext}
        assetPanelType={assetPanelType}
        onCloseAssetPanel={() => setAssetPanelType(null)}
        onInsertGeneratedAsset={insertGeneratedAsset}
      />
    </div>
  );
}
