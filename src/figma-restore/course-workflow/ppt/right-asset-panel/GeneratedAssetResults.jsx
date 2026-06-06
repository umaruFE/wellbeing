import { Check, Download, RefreshCw } from 'lucide-react';
import { getAssetIconFallback } from './assetPanelData';

export function GeneratedAssetResults({ kind, asset, selectedIndex, onSelect, onRegenerate, onInsert }) {
  const Icon = asset?.icon || getAssetIconFallback(kind);
  const cards = kind === 'audio'
    ? ['原声版', '伴奏版']
    : kind === 'video'
      ? ['成片预览']
      : ['🚀', '🌌', '⭐', '🛸'];

  return (
    <div className={`ppt-result-panel kind-${kind}`}>
      <div className="ppt-result-body">
        <div className="ppt-result-desc">{kind === 'image' ? '选择候选图 · 加载完成' : '选择候选结果 · 已自动保存到素材库'}</div>
        <div className="ppt-result-grid">
          {cards.map((label, index) => (
            <button
              type="button"
              key={label}
              className={`ppt-result-card ${selectedIndex === index ? 'is-active' : ''}`}
              onClick={() => onSelect(index)}
            >
              <span className="ppt-result-thumb">
                {kind === 'image' ? <b>{label}</b> : <Icon size={kind === 'audio' ? 26 : 32} />}
                {kind === 'video' ? <em>02:16</em> : null}
                {selectedIndex === index ? <i><Check size={15} /></i> : null}
                {kind === 'image' ? <small><RefreshCw size={13} /></small> : null}
              </span>
              {kind === 'image' ? null : <strong>{label}</strong>}
              {kind === 'image' ? null : <span>{asset?.title}</span>}
            </button>
          ))}
        </div>
        {kind === 'image' ? (
          <button type="button" className="ppt-result-regen" onClick={onRegenerate}><RefreshCw size={14} />重新生成</button>
        ) : null}
      </div>
      <div className="ppt-result-actions">
        {kind === 'image' ? (
          <>
            <button type="button" className="ppt-ghost-btn"><Download size={14} />仅存库</button>
            <button type="button" className="ppt-primary-btn" onClick={onInsert}>插入画布 →</button>
          </>
        ) : (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={onRegenerate}><RefreshCw size={14} />重新生成</button>
            <button type="button" className="ppt-ghost-btn"><Download size={14} />下载</button>
            <button type="button" className="ppt-primary-btn" onClick={onInsert}>插入画布</button>
          </>
        )}
      </div>
    </div>
  );
}
