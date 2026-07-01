import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Sparkles } from 'lucide-react';
import {
  PPT_TEMPLATES,
  buildInitialPptCourse,
  createGeneratedPptCourse,
  createMediaLayer,
  createTextLayer,
  ensurePptCoverAndInnerPages,
  fitLayerToSlide,
  hasGeneratedPptContent,
  PPT_SLIDE_HEIGHT,
  PPT_SLIDE_WIDTH,
} from './pptData';
import { cloneData, findActiveSlide } from './pptUtils';
import { PptOutline } from './PptOutline';
import { PptCanvas } from './PptCanvas';
import { PptRightPanel } from './right-panel/PptRightPanel';
import './css/PptCoursewareView.css';

function getFirstSelection(course) {
  const firstPhase = course[0];
  const firstStep = firstPhase?.steps[0];
  const firstSlide = firstStep?.slides[0] || firstStep?.slides[1];

  return {
    phaseKey: firstPhase?.key || 'engage',
    stepId: firstStep?.id || null,
    slideId: firstSlide?.id || null,
    layerId: firstSlide?.layers?.find((layer) => layer.type === 'text')?.id
      || firstSlide?.layers?.find((layer) => layer.type === 'video')?.id
      || null,
  };
}

function findSelectionAfterSlideDelete(course, phaseKey, stepId, deletedIndex) {
  const phase = course.find((item) => item.key === phaseKey);
  const step = phase?.steps.find((item) => item.id === stepId);
  const nearbySlide = step?.slides?.[Math.min(deletedIndex, Math.max(0, (step.slides?.length || 1) - 1))]
    || step?.slides?.[deletedIndex - 1];

  if (nearbySlide) {
    return { phaseKey, stepId, slideId: nearbySlide.id };
  }

  return getFirstSelection(course);
}

export function PptCoursewareView({
  onNext,
  courseMeta,
  initialCourseData,
  pendingTaskAsset,
  onConsumeTaskAsset,
  onCourseChange,
  saveStatus = 'saved',
  saveText = '',
}) {
  const { t, i18n } = useTranslation();
  const isChinese = !i18n.language?.startsWith('en');
  const hasInitialPptContent = React.useMemo(() => hasGeneratedPptContent(initialCourseData), [initialCourseData]);
  const [mode, setMode] = React.useState(() => (hasInitialPptContent ? 'editor' : 'template'));
  const [canCancelTemplatePicker, setCanCancelTemplatePicker] = React.useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState(PPT_TEMPLATES[0].id);
  const [course, setCourse] = React.useState(() => (
    ensurePptCoverAndInnerPages(buildInitialPptCourse(initialCourseData), courseMeta)
  ));
  const courseRef = React.useRef(course);
  const undoStackRef = React.useRef([]);
  const redoStackRef = React.useRef([]);
  const interactionSnapshotRef = React.useRef(null);
  const [historyAvailability, setHistoryAvailability] = React.useState({ canUndo: false, canRedo: false });
  const hasReportedInitialRef = React.useRef(false);
  const firstSelection = React.useMemo(() => getFirstSelection(course), [course]);

  const [activePhaseKey, setActivePhaseKey] = React.useState(firstSelection.phaseKey);
  const [activeStepId, setActiveStepId] = React.useState(firstSelection.stepId);
  const [activeSlideId, setActiveSlideId] = React.useState(firstSelection.slideId);
  const [selectedLayerId, setSelectedLayerId] = React.useState(firstSelection.layerId);
  const [assetPanelType, setAssetPanelType] = React.useState(null);

  const { step, slide } = findActiveSlide(course, activePhaseKey, activeStepId, activeSlideId);
  const slideIndex = Math.max(0, step?.slides.findIndex((item) => item.id === slide?.id) ?? 0);
  const selectedLayer = slide?.layers.find((layer) => layer.id === selectedLayerId) || null;

  React.useEffect(() => {
    if (mode !== 'editor') return;
    if (hasReportedInitialRef.current) return;
    hasReportedInitialRef.current = true;
    onCourseChange?.(course, { source: 'initial' });
  }, [course, mode, onCourseChange]);

  const applySelection = React.useCallback((nextCourse) => {
    const selection = getFirstSelection(nextCourse);
    setActivePhaseKey(selection.phaseKey);
    setActiveStepId(selection.stepId);
    setActiveSlideId(selection.slideId);
    setSelectedLayerId(selection.layerId);
    setAssetPanelType(null);
  }, []);

  const generateCourseware = () => {
    const nextCourse = createGeneratedPptCourse(
      initialCourseData,
      selectedTemplateId,
      courseMeta,
      { language: isChinese ? 'zh' : 'en' }
    );
    hasReportedInitialRef.current = true;
    courseRef.current = nextCourse;
    undoStackRef.current = [];
    redoStackRef.current = [];
    setHistoryAvailability({ canUndo: false, canRedo: false });
    setCourse(nextCourse);
    applySelection(nextCourse);
    setCanCancelTemplatePicker(false);
    setMode('editor');
    onCourseChange?.(nextCourse, { source: 'edit', templateId: selectedTemplateId });
  };

  const returnToTemplatePicker = () => {
    setSelectedLayerId(null);
    setAssetPanelType(null);
    setCanCancelTemplatePicker(true);
    setMode('template');
  };

  const cancelTemplatePicker = () => {
    applySelection(course);
    setCanCancelTemplatePicker(false);
    setMode('editor');
  };

  const updateCourse = React.useCallback((recipe) => {
    const current = courseRef.current;
    if (!interactionSnapshotRef.current) {
      undoStackRef.current = [...undoStackRef.current.slice(-49), cloneData(current)];
      redoStackRef.current = [];
      setHistoryAvailability({ canUndo: true, canRedo: false });
    }
    const next = cloneData(current);
    recipe(next);
    courseRef.current = next;
    setCourse(next);
    onCourseChange?.(next, { source: 'edit' });
  }, [onCourseChange]);

  const beginCanvasInteraction = React.useCallback(() => {
    if (!interactionSnapshotRef.current) {
      interactionSnapshotRef.current = cloneData(courseRef.current);
    }
  }, []);

  const endCanvasInteraction = React.useCallback(() => {
    if (!interactionSnapshotRef.current) return;
    undoStackRef.current = [...undoStackRef.current.slice(-49), interactionSnapshotRef.current];
    redoStackRef.current = [];
    interactionSnapshotRef.current = null;
    setHistoryAvailability({ canUndo: true, canRedo: false });
  }, []);

  const undoCourse = React.useCallback(() => {
    const previous = undoStackRef.current.pop();
    if (!previous) return;
    redoStackRef.current.push(cloneData(courseRef.current));
    courseRef.current = previous;
    setCourse(previous);
    onCourseChange?.(previous, { source: 'edit' });
    setHistoryAvailability({
      canUndo: undoStackRef.current.length > 0,
      canRedo: true,
    });
  }, [onCourseChange]);

  const redoCourse = React.useCallback(() => {
    const next = redoStackRef.current.pop();
    if (!next) return;
    undoStackRef.current.push(cloneData(courseRef.current));
    courseRef.current = next;
    setCourse(next);
    onCourseChange?.(next, { source: 'edit' });
    setHistoryAvailability({
      canUndo: true,
      canRedo: redoStackRef.current.length > 0,
    });
  }, [onCourseChange]);

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

  const deleteSlide = (phaseKey, stepId, slideId) => {
    if (!slideId) return;
    if (!window.confirm(t('ppt.confirmDeleteSlide'))) return;

    let nextSelection = null;
    updateCourse((draft) => {
      const targetPhase = draft.find((phase) => phase.key === phaseKey);
      const targetStep = targetPhase?.steps.find((item) => item.id === stepId);
      if (!targetStep?.slides?.length) return;
      const targetIndex = targetStep.slides.findIndex((item) => item.id === slideId);
      if (targetIndex < 0) return;
      targetStep.slides.splice(targetIndex, 1);
      nextSelection = findSelectionAfterSlideDelete(draft, phaseKey, stepId, targetIndex);
    });

    setActivePhaseKey(nextSelection?.phaseKey || phaseKey);
    setActiveStepId(nextSelection?.stepId || stepId);
    setActiveSlideId(nextSelection?.slideId || null);
    setSelectedLayerId(null);
    setAssetPanelType(null);
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
    const items = type === 'image' && Array.isArray(patch.items)
      ? patch.items.filter((item) => item?.url)
      : [];

    if (items.length > 1) {
      const cardWidth = 190;
      const cardHeight = 142;
      const gap = 18;
      const startX = 88;
      const startY = 96 + count * 8;
      const nextLayers = items.map((item, index) => createMediaLayer(type, {
        ...patch,
        items: undefined,
        title: item.title || `${patch.title || '词汇闪卡'} ${index + 1}`,
        url: item.url,
        taskId: item.taskId,
        statusUrl: item.statusUrl,
        generationStatus: item.status,
        prompt: item.prompt || patch.prompt,
        raw: item.raw,
        width: cardWidth,
        height: cardHeight,
        x: startX + (index % 2) * (cardWidth + gap),
        y: startY + Math.floor(index / 2) * (cardHeight + gap),
      }));

      updateCourse((draft) => {
        const active = findActiveSlide(draft, activePhaseKey, activeStepId, activeSlideId);
        active.slide?.layers.push(...nextLayers);
      });
      setAssetPanelType(null);
      setSelectedLayerId(nextLayers[0]?.id || null);
      return;
    }

    const nextLayer = fitLayerToSlide(createMediaLayer(type, {
      x: 88 + count * 18,
      y: 130 + count * 18,
      ...(items[0] ? {
        ...patch,
        items: undefined,
        title: items[0].title || patch.title,
        url: items[0].url,
        taskId: items[0].taskId,
        statusUrl: items[0].statusUrl,
        generationStatus: items[0].status,
        prompt: items[0].prompt || patch.prompt,
        raw: items[0].raw,
      } : patch),
    }), { center: type === 'image' || type === 'video' });

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
    if (!selectedLayerId) return;
    if (
      selectedLayer
      && ['x', 'y', 'width', 'height'].some((field) => Object.prototype.hasOwnProperty.call(patch, field))
    ) {
      updateLayerById(selectedLayerId, fitLayerToSlide({ ...selectedLayer, ...patch }));
      return;
    }
    updateLayerById(selectedLayerId, patch);
  };

  const fitSelectedLayer = () => {
    if (!selectedLayerId || !selectedLayer) return;
    updateLayerById(selectedLayerId, fitLayerToSlide(selectedLayer, { center: true }));
  };

  const centerSelectedLayer = (axis) => {
    if (!selectedLayerId || !selectedLayer) return;
    const width = Number(selectedLayer.width) || 300;
    const height = Number(selectedLayer.height) || 100;
    const patch = axis === 'horizontal'
      ? { x: Math.round((PPT_SLIDE_WIDTH - width) / 2) }
      : { y: Math.round((PPT_SLIDE_HEIGHT - height) / 2) };
    updateLayerById(selectedLayerId, patch);
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
      const copy = fitLayerToSlide({
        ...cloneData(layer),
        id: `layer-${Date.now()}`,
        title: `${layer.title || '元素'} 副本`,
        x: (layer.x || 0) + 18,
        y: (layer.y || 0) + 18,
      });
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

  const moveLayer = (direction) => {
    updateCourse((draft) => {
      const active = findActiveSlide(draft, activePhaseKey, activeStepId, activeSlideId);
      const layers = active.slide?.layers;
      if (!layers?.length) return;
      const index = layers.findIndex((layer) => layer.id === selectedLayerId);
      const nextIndex = direction === 'up' ? index + 1 : index - 1;
      if (index < 0 || nextIndex < 0 || nextIndex >= layers.length) return;
      [layers[index], layers[nextIndex]] = [layers[nextIndex], layers[index]];
    });
  };

  React.useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
        || target?.isContentEditable
      ) return;

      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === 'z') {
        event.preventDefault();
        if (event.shiftKey) redoCourse();
        else undoCourse();
        return;
      }
      if ((event.metaKey || event.ctrlKey) && key === 'y') {
        event.preventDefault();
        redoCourse();
        return;
      }
      if (!selectedLayerId || !selectedLayer) return;

      if ((event.metaKey || event.ctrlKey) && key === 'd') {
        event.preventDefault();
        updateCourse((draft) => {
          const active = findActiveSlide(draft, activePhaseKey, activeStepId, activeSlideId);
          const layer = active.slide?.layers.find((item) => item.id === selectedLayerId);
          if (!layer) return;
          const copy = fitLayerToSlide({
            ...cloneData(layer),
            id: `layer-${Date.now()}`,
            title: `${layer.title || '元素'} 副本`,
            x: (layer.x || 0) + 18,
            y: (layer.y || 0) + 18,
          });
          active.slide.layers.push(copy);
          setSelectedLayerId(copy.id);
        });
        return;
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        event.preventDefault();
        updateCourse((draft) => {
          const active = findActiveSlide(draft, activePhaseKey, activeStepId, activeSlideId);
          if (active.slide) {
            active.slide.layers = active.slide.layers.filter((layer) => layer.id !== selectedLayerId);
          }
        });
        setSelectedLayerId(null);
        return;
      }

      if (event.key === 'Escape') {
        setSelectedLayerId(null);
        return;
      }

      const directions = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, -1],
        ArrowDown: [0, 1],
      };
      const direction = directions[event.key];
      if (direction) {
        event.preventDefault();
        const distance = event.shiftKey ? 10 : 1;
        const x = Math.min(Math.max((selectedLayer.x || 0) + direction[0] * distance, 0), PPT_SLIDE_WIDTH - selectedLayer.width);
        const y = Math.min(Math.max((selectedLayer.y || 0) + direction[1] * distance, 0), PPT_SLIDE_HEIGHT - selectedLayer.height);
        updateLayerById(selectedLayerId, { x: Math.round(x), y: Math.round(y) });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activePhaseKey,
    activeSlideId,
    activeStepId,
    redoCourse,
    selectedLayer,
    selectedLayerId,
    undoCourse,
    updateCourse,
    updateLayerById,
  ]);

  if (mode === 'template') {
    const stepCount = course.reduce((sum, phase) => sum + (phase.steps?.length || 0), 0);
    const slideCount = stepCount * 2;

    return (
      <div className="ppt-courseware ppt-template-mode" id="ed-ppt">
        <section className="ppt-template-setup">
          <div className="ppt-template-head">
            <div>
              <span className="ppt-template-kicker">{t('ppt.templateKicker')}</span>
              <h2>{t('ppt.templateTitle')}</h2>
              <p>{t('ppt.templateDescription')}</p>
            </div>
            <div className="ppt-template-stats">
              <span>{stepCount}</span>
              <b>{t('ppt.lessonSteps')}</b>
              <span>{slideCount}</span>
              <b>{t('ppt.estimatedSlides')}</b>
            </div>
          </div>

          <div className="ppt-template-grid">
            {PPT_TEMPLATES.map((template) => {
              const active = selectedTemplateId === template.id;
              const templateName = isChinese ? template.name : template.nameEn;
              const templateDescription = isChinese ? template.description : template.descriptionEn;
              return (
                <button
                  type="button"
                  key={template.id}
                  className={`ppt-template-card ${active ? 'active' : ''}`}
                  onClick={() => setSelectedTemplateId(template.id)}
                  style={{
                    '--template-bg': template.background,
                    '--template-panel': template.panel,
                    '--template-accent': template.accent,
                    '--template-soft': template.accentSoft,
                    '--template-preview': `url("${template.coverImage}")`,
                  }}
                >
                  <span className="ppt-template-check">{active && <Check size={16} />}</span>
                  <span className="ppt-template-preview">
                    <i />
                    <strong />
                    <em />
                    <small />
                  </span>
                  <span className="ppt-template-name">{templateName}</span>
                  <span className="ppt-template-desc">{templateDescription}</span>
                </button>
              );
            })}
          </div>

          <div className="ppt-template-actions">
            {canCancelTemplatePicker && (
              <button type="button" className="ppt-template-cancel-btn" onClick={cancelTemplatePicker}>
                {t('common.cancel')}
              </button>
            )}
            <button type="button" className="ppt-generate-btn" onClick={generateCourseware}>
              <Sparkles size={18} />
              {t('ppt.generateCourseware')}
            </button>
          </div>
        </section>
      </div>
    );
  }

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
        onDeleteSlide={deleteSlide}
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
        onMoveLayer={moveLayer}
        onUndo={undoCourse}
        onRedo={redoCourse}
        canUndo={historyAvailability.canUndo}
        canRedo={historyAvailability.canRedo}
        onInteractionStart={beginCanvasInteraction}
        onInteractionEnd={endCanvasInteraction}
        saveStatus={saveStatus}
        saveText={saveText}
        onChangeStyle={returnToTemplatePicker}
      />

      <PptRightPanel
        slide={slide}
        selectedLayer={selectedLayer}
        selectedLayerId={selectedLayerId}
        onSelectLayer={setSelectedLayerId}
        onUpdateSlide={updateSlide}
        onUpdateLayer={updateSelectedLayer}
        onFitLayer={fitSelectedLayer}
        onCenterLayer={centerSelectedLayer}
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
