import { Check, Download, RefreshCw } from 'lucide-react';
import { getAssetIconFallback } from './assetPanelData';

export function GeneratedAssetResults({ kind, asset, selectedIndex, onSelect, onRegenerate, onInsert, onSaveOnly }) {
  const Icon = asset?.icon || getAssetIconFallback(kind);
  const resultItems = asset?.results || [];
  const cards = resultItems.length
    ? resultItems
    : kind === 'audio'
      ? ['原声版', '伴奏版'].map((title) => ({ title }))
      : kind === 'video'
        ? [{ title: '成片预览' }]
        : [];

  return (
    <div className={`ppt-result-panel kind-${kind}`}>
      <div className="ppt-result-body">
        <div className="ppt-result-desc">{kind === 'image' ? '选择候选图 · 已提交生成任务' : '选择候选结果 · 已自动保存到素材库'}</div>
        <div className="ppt-result-grid">
          {cards.map((item, index) => {
            const label = typeof item === 'string' ? item : item.title || `候选 ${index + 1}`;
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
              <strong>{kind === 'image' ? (item.status === 'completed' ? '生成完成' : '任务已提交') : label}</strong>
              <span>{kind === 'image' ? (item.taskId || item.filename || asset?.title) : asset?.title}</span>
            </button>
            );
          })}
        </div>
        {kind === 'image' ? (
          <button type="button" className="ppt-result-regen" onClick={onRegenerate}><RefreshCw size={14} />重新生成</button>
        ) : null}
      </div>
      <div className="ppt-result-actions">
        {kind === 'image' ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={onSaveOnly}><Download size={14} />仅存库</button>
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
