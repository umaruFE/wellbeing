import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button, Modal, Tag } from 'antd';

function imageAssetPrompt(asset, t) {
  if (asset.source !== t('imageLib.sourceAi') && asset.source !== 'AI生成') return '';
  if (asset.type === t('imageLib.typeFlashcard') || asset.type === '闪卡') return t('imageLib.promptFlashcard');
  if (asset.type === t('imageLib.typeStory') || asset.type === '故事配图') return t('imageLib.promptStory');
  if (asset.type === t('imageLib.typePpt') || asset.type === 'PPT素材') return t('imageLib.promptPpt');
  return t('imageLib.promptTheme');
}

function SceneArt({ scene, src, alt }) {
  if (src) {
    return <img className="fr-img-real-image" src={src} alt={alt || ''} />;
  }

  return (
    <div className={`fr-img-scene scene-${scene}`}>
      <span className="shape orb a" />
      <span className="shape orb b" />
      <span className="shape orb c" />
      <span className="shape block d" />
    </div>
  );
}

function InfoRows({ rows }) {
  return (
    <div className="fr-img-info-list">
      {rows.map(([label, value]) => (
        <div className="fr-img-info-row" key={label}>
          <label>{label}</label>
          <span>{value}</span>
        </div>
      ))}
    </div>
  );
}

export function AssetPreviewModal({ asset, open, onClose, onViewTask }) {
  const { t } = useTranslation();
  if (!asset) return null;
  const isAi = asset.source === t('imageLib.sourceAi') || asset.source === 'AI生成';

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={1040}
      className="fr-img-modal fr-img-preview-modal"
      closeIcon={<X size={22} />}
      title={(
        <div className="fr-img-detail-head">
          <div className="fr-img-modal-title">{asset.name}</div>
          <div className="fr-img-modal-tags">
            <Tag color="error">{asset.type}</Tag>
            <Tag>{asset.source}</Tag>
            <Tag>PNG</Tag>
          </div>
        </div>
      )}
    >
      <div className="fr-img-preview-body">
        <div className="fr-img-preview-art">
          <SceneArt scene={asset.scene} src={asset.previewUrl} alt={asset.name} />
        </div>
        <aside className="fr-img-preview-panel">
          <section>
            <h3>{t('imageLib.basicInfo')}</h3>
            <InfoRows rows={[
              [t('imageLib.source'), asset.source],
              [t('imageLib.format'), 'PNG'],
              [t('imageLib.imageSize'), asset.size],
              [t('course.createdAt'), asset.created],
            ]} />
          </section>
          <section>
            <h3>{isAi ? t('imageLib.generationInfo') : t('imageLib.uploadInfo')}</h3>
            <InfoRows rows={isAi ? [
              [t('imageLib.prompt'), imageAssetPrompt(asset, t)],
            ] : [
              [t('imageLib.uploader'), 'Admin'],
              [t('imageLib.originalFilename'), `${asset.name.replace(/\s+/g, '_')}.png`],
              [t('imageLib.fileSize'), '1.8 MB'],
            ]} />
          </section>
        </aside>
      </div>
      <div className="fr-img-modal-footer">
        {onViewTask && (
          <Button onClick={() => onViewTask(asset)}>{t('imageLib.viewTask')}</Button>
        )}
        <Button onClick={onClose}>{t('common.close')}</Button>
      </div>
    </Modal>
  );
}
