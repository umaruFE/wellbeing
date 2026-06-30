import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const layers = slide?.layers || [];

  return (
    <aside className="ppt-right ppt-right-canvas-panel">
      <div className="ppt-right-head">{t('ppt.canvasAndLayers')}</div>
      <div className="ppt-right-body">
        <section className="ppt-bg-section">
          <div className="ppt-panel-label">{t('ppt.pageBackground')}</div>
          <div className="ppt-bg-card">
            <span className="ppt-bg-title">{t('ppt.backgroundColor')}</span>
            <div className="ppt-bg-row">
              {swatches.map((color, index) => (
                <button
                  type="button"
                  key={color}
                  className={`${(slide?.background || '#ffffff') === color ? 'on' : ''} swatch-${index}`}
                  style={{ background: color }}
                  onClick={() => onUpdateSlide({ background: color })}
                  aria-label={`${t('ppt.backgroundColor')} ${color}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="ppt-layer-section">
          <div className="ppt-panel-label">{t('ppt.layerList')}</div>
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
                    aria-label={layer.hidden ? t('ppt.showLayer') : t('ppt.hideLayer')}
                    title={layer.hidden ? t('ppt.showLayer') : t('ppt.hideLayer')}
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
  onFitLayer,
  onCenterLayer,
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
        onFitLayer={onFitLayer}
      />
    );
  }

  if (selectedLayer?.type === 'text') {
    return (
      <PptTextConfigPanel
        selectedLayer={selectedLayer}
        onUpdateLayer={onUpdateLayer}
        onSelectLayer={onSelectLayer}
        onCenterLayer={onCenterLayer}
        onDuplicateLayer={onDuplicateLayer}
        onDeleteLayer={onDeleteLayer}
      />
    );
  }

  if (selectedLayer?.type === 'image') {
    return (
      <PptImageConfigPanel
        selectedLayer={selectedLayer}
        onSelectLayer={onSelectLayer}
        onUpdateLayer={onUpdateLayer}
        onFitLayer={onFitLayer}
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
