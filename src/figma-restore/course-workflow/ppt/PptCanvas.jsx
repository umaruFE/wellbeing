import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDown, ArrowUp, Copy, Image, Maximize2, Minus, Music, Palette, Plus, Redo2, RotateCw, Trash2, Type, Undo2, Video } from 'lucide-react';
import { PptDemoScene } from './PptDemoScene';
import './css/PptCanvas.css';

const SLIDE_WIDTH = 940;
const SLIDE_HEIGHT = 529;
const MIN_LAYER_SIZE = 28;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function LayerContent({ layer, t }) {
  if (layer.type === 'text') {
    return (
      <div
        className="ppt-layer-text"
        style={{
          fontSize: layer.fontSize,
          fontFamily: layer.fontFamily,
          fontWeight: layer.fontWeight,
          fontStyle: layer.fontStyle,
          textDecoration: layer.textDecoration,
          color: layer.color,
          textAlign: layer.textAlign,
          WebkitTextStroke: layer.strokeWidth ? `${layer.strokeWidth}px ${layer.strokeColor}` : undefined,
        }}
      >
        {layer.content || t('ppt.doubleClickText')}
      </div>
    );
  }

  if (layer.type === 'video') {
    if (layer.url) {
      return (
        <video
          className="ppt-video-layer"
          src={layer.url}
          controls
          muted={layer.videoMeta?.muted}
          loop={layer.videoMeta?.loop}
        />
      );
    }

    return (
      <div className="ppt-video-layer">
        <PptDemoScene />
        <div className="ppt-video-play">▶</div>
        {layer.duration && <div className="ppt-video-duration">{layer.duration}</div>}
      </div>
    );
  }

  if (layer.type === 'audio') {
    return (
      <div className="ppt-audio-layer">
        {layer.url ? <audio src={layer.url} controls /> : <span className="ppt-audio-play">▶</span>}
        <strong>{layer.title}</strong>
        {!layer.url && <span className="ppt-audio-progress" />}
      </div>
    );
  }

  if (layer.url) {
    return <img className="ppt-image-layer" src={layer.url} alt={layer.title || t('ppt.imageAsset')} />;
  }

  return (
    <div className="ppt-image-layer">
      <PptDemoScene />
    </div>
  );
}

export function PptCanvas({
  step,
  slide,
  slideIndex,
  slideCount,
  selectedLayerId,
  onSelectLayer,
  onClearSelection,
  onAddLayer,
  onOpenAssetPanel,
  activeAssetPanelType,
  onUpdateLayer,
  onDuplicateLayer,
  onDeleteLayer,
  saveStatus = 'saved',
  saveText = '',
  onChangeStyle,
}) {
  const { t } = useTranslation();
  const slideRef = React.useRef(null);
  const dragRef = React.useRef(null);
  const [zoom, setZoom] = React.useState(68);

  const getPoint = React.useCallback((event) => {
    const rect = slideRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: ((event.clientX - rect.left) / rect.width) * SLIDE_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * SLIDE_HEIGHT,
    };
  }, []);

  const beginMove = (event, layer) => {
    event.preventDefault();
    event.stopPropagation();
    onSelectLayer(layer.id);
    const point = getPoint(event);
    dragRef.current = {
      type: 'move',
      layer,
      startX: point.x,
      startY: point.y,
      origin: { x: layer.x || 0, y: layer.y || 0 },
    };
  };

  const beginResize = (event, layer, handle) => {
    event.preventDefault();
    event.stopPropagation();
    onSelectLayer(layer.id);
    const point = getPoint(event);
    dragRef.current = {
      type: 'resize',
      handle,
      layer,
      startX: point.x,
      startY: point.y,
      origin: {
        x: layer.x || 0,
        y: layer.y || 0,
        width: layer.width || MIN_LAYER_SIZE,
        height: layer.height || MIN_LAYER_SIZE,
      },
    };
  };

  const beginRotate = (event, layer) => {
    event.preventDefault();
    event.stopPropagation();
    onSelectLayer(layer.id);
    const rect = slideRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.left + ((layer.x || 0) + (layer.width || 0) / 2) * (rect.width / SLIDE_WIDTH);
    const centerY = rect.top + ((layer.y || 0) + (layer.height || 0) / 2) * (rect.height / SLIDE_HEIGHT);
    dragRef.current = { type: 'rotate', layer, centerX, centerY };
  };

  React.useEffect(() => {
    const handlePointerMove = (event) => {
      const drag = dragRef.current;
      if (!drag) return;

      if (drag.type === 'rotate') {
        const angle = Math.atan2(event.clientY - drag.centerY, event.clientX - drag.centerX) * (180 / Math.PI) + 90;
        onUpdateLayer(drag.layer.id, { rotation: Math.round(angle) });
        return;
      }

      const point = getPoint(event);
      const dx = point.x - drag.startX;
      const dy = point.y - drag.startY;

      if (drag.type === 'move') {
        onUpdateLayer(drag.layer.id, {
          x: Math.round(clamp(drag.origin.x + dx, 0, SLIDE_WIDTH - (drag.layer.width || MIN_LAYER_SIZE))),
          y: Math.round(clamp(drag.origin.y + dy, 0, SLIDE_HEIGHT - (drag.layer.height || MIN_LAYER_SIZE))),
        });
        return;
      }

      const next = { ...drag.origin };
      if (drag.handle.includes('e')) next.width = drag.origin.width + dx;
      if (drag.handle.includes('s')) next.height = drag.origin.height + dy;
      if (drag.handle.includes('w')) {
        next.x = drag.origin.x + dx;
        next.width = drag.origin.width - dx;
      }
      if (drag.handle.includes('n')) {
        next.y = drag.origin.y + dy;
        next.height = drag.origin.height - dy;
      }

      next.width = Math.round(clamp(next.width, MIN_LAYER_SIZE, SLIDE_WIDTH - next.x));
      next.height = Math.round(clamp(next.height, MIN_LAYER_SIZE, SLIDE_HEIGHT - next.y));
      next.x = Math.round(clamp(next.x, 0, SLIDE_WIDTH - next.width));
      next.y = Math.round(clamp(next.y, 0, SLIDE_HEIGHT - next.height));
      onUpdateLayer(drag.layer.id, next);
    };

    const handlePointerUp = () => {
      dragRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [getPoint, onUpdateLayer]);

  const setZoomClamped = (value) => setZoom(clamp(value, 35, 120));

  return (
    <main className="ppt-canvas">
      <div className="ppt-canvas-bar">
        <div className="ppt-canvas-info">
          {t('ppt.currentStep')}<strong>{step?.title || t('ppt.notSelected')}</strong>
          <span />
          {t('ppt.slide')} <b>{slideIndex + 1}</b>/{slideCount}
        </div>

        <div className="ppt-editor-actions">
          <div className="ppt-history-actions">
            <button type="button" aria-label={t('common.undo')} title={t('common.undo')}>
              <Undo2 size={15} />
            </button>
            <button type="button" aria-label={t('common.redo')} title={t('common.redo')}>
              <Redo2 size={15} />
            </button>
          </div>
          <div className={`ppt-autosave ${saveStatus === 'saving' ? 'is-saving' : ''} ${saveStatus === 'error' ? 'is-error' : ''}`}>
            <span />
            {saveText || t('workflow.toolbar.saved')}
          </div>
          <button type="button" className="ppt-style-action" onClick={onChangeStyle}>
            <Palette size={15} />
            重新生成风格
          </button>
        </div>

        <div className="ppt-tool-group">
          <button type="button" onClick={() => onAddLayer('text')} title={t('ppt.text')} aria-label={t('ppt.insertText')}>
            <Type size={15} />
          </button>
          <button type="button" className={activeAssetPanelType === 'image' ? 'on' : ''} onClick={() => onOpenAssetPanel('image')} title={t('ppt.image')} aria-label={t('ppt.insertImage')}>
            <Image size={15} />
          </button>
          <button type="button" className={activeAssetPanelType === 'video' ? 'on' : ''} onClick={() => onOpenAssetPanel('video')} title={t('ppt.video')} aria-label={t('ppt.insertVideo')}>
            <Video size={15} />
          </button>
          <button type="button" className={activeAssetPanelType === 'audio' ? 'on' : ''} onClick={() => onOpenAssetPanel('audio')} title={t('ppt.audio')} aria-label={t('ppt.insertAudio')}>
            <Music size={15} />
          </button>
        </div>
      </div>

      <div className="ppt-canvas-scroll">
        <div
          ref={slideRef}
          className="ppt-slide"
          style={{
            backgroundColor: slide?.background || '#ffffff',
            backgroundImage: slide?.backgroundImage ? `url("${slide.backgroundImage}")` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transform: `scale(${zoom / 100})`,
          }}
          onPointerDown={onClearSelection}
        >
          {(!slide?.layers || slide.layers.length === 0) && (
            <div className="ppt-empty">
              <div className="ppt-canvas-design-image" aria-hidden="true" />
            </div>
          )}

          {slide?.layers?.filter((layer) => !layer.hidden).map((layer, index) => {
            const selected = selectedLayerId === layer.id;
            return (
              <div
                role="button"
                tabIndex={0}
                key={layer.id}
                className={`ppt-layer ${selected ? 'sel' : ''}`}
                data-layer-type={layer.type}
                style={{
                  left: layer.x,
                  top: layer.y,
                  width: layer.width,
                  height: layer.height,
                  transform: `rotate(${layer.rotation || 0}deg)`,
                  zIndex: index + 1,
                }}
                onPointerDown={(event) => beginMove(event, layer)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') onSelectLayer(layer.id);
                }}
              >
                <div className="ppt-layer-frame" />
                <LayerContent layer={layer} t={t} />

                {selected && (
                  <>
                    {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((handle) => (
                      <span
                        key={handle}
                        className={`ppt-resize-handle ${handle}`}
                        onPointerDown={(event) => beginResize(event, layer, handle)}
                      />
                    ))}
                    <button type="button" className="ppt-rotate-handle" onPointerDown={(event) => beginRotate(event, layer)} aria-label={t('ppt.rotate')}>
                      <RotateCw size={12} />
                    </button>
                    <div className="ppt-layer-actions">
                      <button type="button" onPointerDown={(event) => event.stopPropagation()} title={t('ppt.moveUp')}>
                        <ArrowUp size={13} />
                      </button>
                      <button type="button" onPointerDown={(event) => event.stopPropagation()} title={t('ppt.moveDown')}>
                        <ArrowDown size={13} />
                      </button>
                      <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={onDuplicateLayer} title={t('common.copy')}>
                        <Copy size={13} />
                      </button>
                      <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={onDeleteLayer} title={t('common.delete')}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div className="ppt-zoom-bar">
          <button type="button" aria-label={t('ppt.zoomOut')} onClick={() => setZoomClamped(zoom - 8)}>
            <Minus size={14} />
          </button>
          <span>{zoom}%</span>
          <button type="button" aria-label={t('ppt.zoomIn')} onClick={() => setZoomClamped(zoom + 8)}>
            <Plus size={14} />
          </button>
          <button type="button" aria-label={t('ppt.fitWindow')} onClick={() => setZoom(68)}>
            <Maximize2 size={13} />
          </button>
        </div>
      </div>
    </main>
  );
}
