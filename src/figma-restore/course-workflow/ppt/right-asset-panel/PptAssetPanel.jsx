import React from 'react';
import { AssetPanelShell } from './AssetPanelShell';
import { AssetTypeSelector } from './AssetTypeSelector';
import { buildGeneratedPatch } from './assetPanelData';
import { AudioAssetWizard } from './AudioAssetWizard';
import { ImageAssetWizard } from './ImageAssetWizard';
import { VideoAssetWizard } from './VideoAssetWizard';
import '../css/PptAssetPanel.css';

const titleByType = {
  image: '插入图文素材',
  video: '插入视频素材',
  audio: '插入素材',
};

export function PptAssetPanel({ type, onClose, onInsert }) {
  const [asset, setAsset] = React.useState(null);
  const [panelTitle, setPanelTitle] = React.useState(titleByType[type] || '插入素材');

  const handleInsert = (kind, selectedAsset) => {
    onInsert(kind, buildGeneratedPatch(kind, selectedAsset));
  };

  const chooseAsset = (item) => {
    setAsset(item);
    setPanelTitle(item.title);
  };

  let content = <AssetTypeSelector type={type} onSelect={chooseAsset} />;
  if (asset && type === 'image') {
    content = <ImageAssetWizard asset={asset} onBack={() => { setAsset(null); setPanelTitle(titleByType[type] || '插入素材'); }} onInsert={handleInsert} onTitleChange={setPanelTitle} />;
  }
  if (asset && type === 'video') {
    content = <VideoAssetWizard asset={asset} onBack={() => { setAsset(null); setPanelTitle(titleByType[type] || '插入素材'); }} onInsert={handleInsert} onTitleChange={setPanelTitle} />;
  }
  if (asset && type === 'audio') {
    content = <AudioAssetWizard asset={asset} onBack={() => { setAsset(null); setPanelTitle(titleByType[type] || '插入素材'); }} onInsert={handleInsert} onTitleChange={setPanelTitle} />;
  }

  return (
    <AssetPanelShell
      title={panelTitle}
      onBack={asset ? () => { setAsset(null); setPanelTitle(titleByType[type] || '插入素材'); } : null}
      onClose={onClose}
      className={`ppt-asset-panel-${type || 'all'}`}
    >
      {content}
    </AssetPanelShell>
  );
}
