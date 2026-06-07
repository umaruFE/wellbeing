import React from 'react';
import { CirclePlus, X } from 'lucide-react';
import { Button, Modal, Tag } from 'antd';

function imageAssetPrompt(asset) {
  if (asset.source !== 'AI生成') return '';
  if (asset.type === '闪卡') return '生成儿童友好的英文词汇闪卡，画面清晰、背景简洁，适合课堂展示和打印。';
  if (asset.type === '故事配图') return '生成神奇动物主题故事配图，童趣线条插画，角色友好，适合阅读材料与课堂讲述。';
  if (asset.type === 'PPT素材') return '生成适合 PPT 画布使用的课堂背景图，保留主体留白，画面温暖明亮。';
  return '生成神奇动物世界主题意境图，卡通插画风格，温暖色调，适合课程封面和课堂导入。';
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

export function AssetPreviewModal({ asset, open, onClose, onViewTask, onInsertCanvas }) {
  if (!asset) return null;
  const isAi = asset.source === 'AI生成';

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
            <h3>基础信息</h3>
            <InfoRows rows={[
              ['来源', asset.source],
              ['格式', 'PNG'],
              ['图片尺寸', asset.size],
              ['创建时间', asset.created],
            ]} />
          </section>
          <section>
            <h3>{isAi ? '生成信息' : '上传信息'}</h3>
            <InfoRows rows={isAi ? [
              ['生成提示词', imageAssetPrompt(asset)],
            ] : [
              ['上传者', 'Admin'],
              ['原文件名', `${asset.name.replace(/\s+/g, '_')}.png`],
              ['文件大小', '1.8 MB'],
            ]} />
          </section>
        </aside>
      </div>
      <div className="fr-img-modal-footer">
        {onViewTask && (
          <Button onClick={() => onViewTask(asset)}>查看生成任务</Button>
        )}
        <Button onClick={onClose}>关闭</Button>
        {onInsertCanvas && (
          <Button className="tdm-action-primary" type="primary" icon={<CirclePlus size={15} />} onClick={() => onInsertCanvas(asset)}>
            插入画布
          </Button>
        )}
      </div>
    </Modal>
  );
}
