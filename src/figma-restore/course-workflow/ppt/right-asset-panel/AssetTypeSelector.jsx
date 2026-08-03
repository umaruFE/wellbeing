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
              const hasSprite = item.spriteCol !== undefined;
              const hasImage = Boolean(item.imageSrc);
              return (
                <button
                  type="button"
                  key={item.code}
                  className={`ppt-asset-card tone-${item.tone} ${hasImage ? 'has-art-icon' : ''} ${item.disabled ? 'is-disabled' : ''}`}
                  onClick={() => !item.disabled && onSelect(item)}
                  disabled={item.disabled}
                >
                  <span className="ppt-asset-card-icon">
                    {hasImage ? (
                      <img className="ppt-asset-card-image" src={item.imageSrc} alt="" />
                    ) : hasSprite ? (
                      <span
                        className="ppt-asset-sprite"
                        style={{
                          backgroundPosition: `${-item.spriteCol * 100}% ${-item.spriteRow * 100}%`,
                        }}
                      />
                    ) : (
                      <Icon size={20} />
                    )}
                  </span>
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
          <img className="ppt-asset-library-icon" src="/ppt/image/library-folder.png" alt="" />
          {t('assetPanel.selectFromLibrary')}
        </button>
      </section>
    </div>
  );
}
