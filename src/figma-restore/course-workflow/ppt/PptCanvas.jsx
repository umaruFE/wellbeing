import React from 'react';
import { Copy, Image, Maximize2, Minus, Music, Plus, RotateCw, Trash2, Type, Video } from 'lucide-react';
import { PptDemoScene } from './PptDemoScene';

const SLIDE_WIDTH = 940;
const SLIDE_HEIGHT = 529;
const MIN_LAYER_SIZE = 28;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function LayerContent({ layer }) {
  if (layer.type === 'text') {
    return (
      <div
        className="ppt-layer-text"
        style={{
          fontSize: layer.fontSize,
          fontWeight: layer.fontWeight,
          fontStyle: layer.fontStyle,
          textDecoration: layer.textDecoration,
          color: layer.color,
          textAlign: layer.textAlign,
          WebkitTextStroke: layer.strokeWidth ? `${layer.strokeWidth}px ${layer.strokeColor}` : undefined,
        }}
      >
        {layer.content || '双击编辑文本'}
      </div>
    );
  }

  if (layer.type === 'video') {
    return (
      <div className="ppt-video-layer">
        <PptDemoScene />
        <div className="ppt-video-play">▶</div>
        <div className="ppt-video-duration">{layer.duration || '02:16'}</div>
      </div>
    );
  }

  if (layer.type === 'audio') {
    return (
      <div className="ppt-audio-layer">
        <Music size={18} />
        <span>{layer.title}</span>
        <b>{layer.duration || '02:16'}</b>
      </div>
    );
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
}) {
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
          当前环节：<strong>{step?.title || '未选择'}</strong>
          <span />
          幻灯片 <b>{slideIndex + 1}</b>/{slideCount}
        </div>

        <div className="ppt-tool-group">
          <button type="button" onClick={() => onAddLayer('text')} title="文本" aria-label="插入文本">
            <Type size={15} />
          </button>
          <button type="button" className={activeAssetPanelType === 'image' ? 'on' : ''} onClick={() => onOpenAssetPanel('image')} title="图片" aria-label="插入图片">
            <Image size={15} />
          </button>
          <button type="button" className={activeAssetPanelType === 'video' ? 'on' : ''} onClick={() => onOpenAssetPanel('video')} title="视频" aria-label="插入视频">
            <Video size={15} />
          </button>
          <button type="button" className={activeAssetPanelType === 'audio' ? 'on' : ''} onClick={() => onOpenAssetPanel('audio')} title="音频" aria-label="插入音频">
            <Music size={15} />
          </button>
        </div>
      </div>

      <div className="ppt-canvas-scroll">
        <div
          ref={slideRef}
          className="ppt-slide"
          style={{ background: slide?.background || '#ffffff', transform: `scale(${zoom / 100})` }}
          onPointerDown={onClearSelection}
        >
          {(!slide?.layers || slide.layers.length === 0) && (
            <div className="ppt-empty">
              <PptDemoScene />
            </div>
          )}

          {slide?.layers?.map((layer, index) => {
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
                <LayerContent layer={layer} />

                {selected && (
                  <>
                    {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map((handle) => (
                      <span
                        key={handle}
                        className={`ppt-resize-handle ${handle}`}
                        onPointerDown={(event) => beginResize(event, layer, handle)}
                      />
                    ))}
                    <button type="button" className="ppt-rotate-handle" onPointerDown={(event) => beginRotate(event, layer)} aria-label="旋转">
                      <RotateCw size={12} />
                    </button>
                    <div className="ppt-layer-actions">
                      <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={onDuplicateLayer} title="复制">
                        <Copy size={13} />
                      </button>
                      <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={onDeleteLayer} title="删除">
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
          <button type="button" aria-label="缩小" onClick={() => setZoomClamped(zoom - 8)}>
            <Minus size={14} />
          </button>
          <span>{zoom}%</span>
          <button type="button" aria-label="放大" onClick={() => setZoomClamped(zoom + 8)}>
            <Plus size={14} />
          </button>
          <button type="button" aria-label="适应窗口" onClick={() => setZoom(68)}>
            <Maximize2 size={13} />
          </button>
        </div>
      </div>
    </main>
  );
}
