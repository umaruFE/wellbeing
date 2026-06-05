import { Eye, EyeOff, Image, Music, Type, Video } from 'lucide-react';
import { PptAssetPanel } from '../right-asset-panel';
import { PptAudioConfigPanel } from './PptAudioConfigPanel';
import { PptImageConfigPanel } from './PptImageConfigPanel';
import { PptTextConfigPanel } from './PptTextConfigPanel';
import { PptVideoConfigPanel } from './PptVideoConfigPanel';
import '../css/PptRightPanel.css';

const swatches = ['#253142', '#ffffff', '#fff1ed', '#eaf4ff', '#f0e7ff'];

function LayerGlyph({ type }) {
  if (type === 'text') return <Type size={15} />;
  if (type === 'audio') return <Music size={16} />;
  if (type === 'video') return <Video size={15} />;
  return <Image size={15} />;
}

function CanvasLayerPanel({
  slide,
  selectedLayerId,
  onSelectLayer,
  onUpdateSlide,
  onToggleLayerHidden,
}) {
  const layers = slide?.layers || [];

  return (
    <aside className="ppt-right ppt-right-canvas-panel">
      <div className="ppt-right-head">画布与图层</div>
      <div className="ppt-right-body">
        <section className="ppt-bg-section">
          <div className="ppt-panel-label">页面背景</div>
          <div className="ppt-bg-card">
            <span className="ppt-bg-title">背景色</span>
            <div className="ppt-bg-row">
              {swatches.map((color, index) => (
                <button
                  type="button"
                  key={color}
                  className={`${(slide?.background || '#ffffff') === color ? 'on' : ''} swatch-${index}`}
                  style={{ background: color }}
                  onClick={() => onUpdateSlide({ background: color })}
                  aria-label={`背景色 ${color}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="ppt-layer-section">
          <div className="ppt-panel-label">元素列表</div>
          <div className="ppt-layer-list">
            {layers.map((layer) => {
              const active = selectedLayerId === layer.id;
              return (
                <div
                  role="button"
                  tabIndex={0}
                  key={layer.id}
                  className={`ppt-layer-row ${active ? 'is-selected' : ''} ${layer.hidden ? 'is-muted' : ''} type-${layer.type}`}
                  onClick={() => onSelectLayer(layer.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') onSelectLayer(layer.id);
                  }}
                >
                  <span className="ppt-layer-icon"><LayerGlyph type={layer.type} /></span>
                  <strong>{layer.title || layer.type}</strong>
                  <button
                    type="button"
                    className="ppt-layer-eye"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleLayerHidden(layer.id);
                    }}
                    aria-label={layer.hidden ? '显示图层' : '隐藏图层'}
                    title={layer.hidden ? '显示图层' : '隐藏图层'}
                  >
                    {layer.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

      </div>
    </aside>
  );
}

export function PptRightPanel({
  slide,
  selectedLayer,
  selectedLayerId,
  onSelectLayer,
  onUpdateSlide,
  onUpdateLayer,
  onToggleLayerHidden,
  onDuplicateLayer,
  onDeleteLayer,
  assetPanelType,
  onCloseAssetPanel,
  onInsertGeneratedAsset,
}) {
  if (assetPanelType) {
    return (
      <PptAssetPanel
        type={assetPanelType}
        onClose={onCloseAssetPanel}
        onInsert={onInsertGeneratedAsset}
      />
    );
  }

  if (selectedLayer?.type === 'video') {
    return (
      <PptVideoConfigPanel
        selectedLayer={selectedLayer}
        onUpdateLayer={onUpdateLayer}
        onSelectLayer={onSelectLayer}
      />
    );
  }

  if (selectedLayer?.type === 'text') {
    return (
      <PptTextConfigPanel
        selectedLayer={selectedLayer}
        onUpdateLayer={onUpdateLayer}
        onSelectLayer={onSelectLayer}
      />
    );
  }

  if (selectedLayer?.type === 'image') {
    return (
      <PptImageConfigPanel
        selectedLayer={selectedLayer}
        onSelectLayer={onSelectLayer}
        onUpdateLayer={onUpdateLayer}
        onDuplicateLayer={onDuplicateLayer}
        onDeleteLayer={onDeleteLayer}
      />
    );
  }

  if (selectedLayer?.type === 'audio') {
    return (
      <PptAudioConfigPanel
        selectedLayer={selectedLayer}
        onSelectLayer={onSelectLayer}
        onUpdateLayer={onUpdateLayer}
        onDuplicateLayer={onDuplicateLayer}
        onDeleteLayer={onDeleteLayer}
      />
    );
  }

  return (
    <CanvasLayerPanel
      slide={slide}
      selectedLayerId={selectedLayerId}
      onSelectLayer={onSelectLayer}
      onUpdateSlide={onUpdateSlide}
      onToggleLayerHidden={onToggleLayerHidden}
    />
  );
}
