import { Check, Download, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAssetIconFallback } from './assetPanelData';

export function GeneratedAssetResults({ kind, asset, selectedIndex, onSelect, onRegenerate, onInsert, onSaveOnly, onDownloadAll, insertLabel }) {
  const { t } = useTranslation();
  const Icon = asset?.icon || getAssetIconFallback(kind);
  const resultItems = asset?.results || [];
  const downloadableItems = resultItems.filter((item) => item?.url);
  const canDownloadAll = kind === 'image' && downloadableItems.length > 1 && typeof onDownloadAll === 'function';
  const cards = resultItems.length
    ? resultItems
    : kind === 'audio'
      ? [t('generatedResults.original'), t('generatedResults.instrumental')].map((title) => ({ title }))
      : kind === 'video'
        ? [{ title: t('generatedResults.videoPreview') }]
        : [];

  return (
    <div className={`ppt-result-panel kind-${kind}`}>
      <div className="ppt-result-body">
        <div className="ppt-result-desc">{t(kind === 'image' ? 'generatedResults.imageHint' : 'generatedResults.assetHint')}</div>
        <div className="ppt-result-grid">
          {cards.map((item, index) => {
            const label = typeof item === 'string' ? item : item.title || t('generatedResults.candidate', { count: index + 1 });
            return (
            <button
              type="button"
              key={item.taskId || item.url || label}
              className={`ppt-result-card ${selectedIndex === index ? 'is-active' : ''}`}
              onClick={() => onSelect(index)}
            >
              <span className="ppt-result-thumb">
                {kind === 'image' && item.url ? <img src={item.url} alt={label} /> : null}
                {kind === 'image' && !item.url ? <Icon size={32} /> : null}
                {kind !== 'image' ? <Icon size={kind === 'audio' ? 26 : 32} /> : null}
                {kind === 'video' ? <em>02:16</em> : null}
                {selectedIndex === index ? <i><Check size={15} /></i> : null}
                {kind === 'image' ? <small><RefreshCw size={13} /></small> : null}
              </span>
              <strong>{kind === 'image' ? t(item.status === 'completed' ? 'generatedResults.completed' : 'generatedResults.submitted') : label}</strong>
              <span>{kind === 'image' ? (item.taskId || item.filename || asset?.title) : asset?.title}</span>
            </button>
            );
          })}
        </div>
        {kind === 'image' ? (
          <button type="button" className="ppt-result-regen" onClick={onRegenerate}><RefreshCw size={14} />{t('common.regenerate')}</button>
        ) : null}
      </div>
      <div className="ppt-result-actions">
        {kind === 'image' ? (
          <>
            {/* <button type="button" className="ppt-ghost-btn" onClick={onSaveOnly}><Download size={14} />仅存库</button> */}
            {canDownloadAll ? (
              <button type="button" className="ppt-ghost-btn" onClick={onDownloadAll}><Download size={14} />{t('generatedResults.downloadAll')}</button>
            ) : null}
            <button type="button" className="ppt-primary-btn" onClick={onInsert}>{insertLabel || t('generatedResults.insertArrow')}</button>
          </>
        ) : (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={onRegenerate}><RefreshCw size={14} />{t('common.regenerate')}</button>
            <button type="button" className="ppt-ghost-btn"><Download size={14} />{t('common.download')}</button>
            <button type="button" className="ppt-primary-btn" onClick={onInsert}>{t('generatedResults.insert')}</button>
          </>
        )}
      </div>
    </div>
  );
}
