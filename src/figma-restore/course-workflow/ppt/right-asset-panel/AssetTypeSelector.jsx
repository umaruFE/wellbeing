import { Library } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAssetGroups } from './assetPanelData';

export function AssetTypeSelector({ type, onSelect, onOpenLibrary }) {
  const { t } = useTranslation();
  return (
    <div className="ppt-asset-selector">
      {getAssetGroups(type, t).map((group) => (
        <section className="ppt-asset-type-section" key={group.title}>
          <div className="ppt-asset-sec-title">{group.title}</div>
          <div className={`ppt-asset-type-grid type-${type || 'all'}`}>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  key={item.code}
                  className={`ppt-asset-card tone-${item.tone} ${item.disabled ? 'is-disabled' : ''}`}
                  onClick={() => !item.disabled && onSelect(item)}
                  disabled={item.disabled}
                >
                  <span className="ppt-asset-card-icon"><Icon size={20} /></span>
                  <span className="ppt-asset-card-copy">
                    <strong>{item.title}</strong>
                    <span>{item.desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <section className="ppt-asset-type-section">
        <div className="ppt-asset-sec-title">{t('assetPanel.assetLibrary')}</div>
        <button type="button" className="ppt-asset-library-btn" onClick={onOpenLibrary}>
          {type === 'audio' ? null : <Library size={15} />}
          {t('assetPanel.selectFromLibrary')}
        </button>
      </section>
    </div>
  );
}
