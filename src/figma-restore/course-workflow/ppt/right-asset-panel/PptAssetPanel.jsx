import React from 'react';
import { AssetPanelShell } from './AssetPanelShell';
import { AssetTypeSelector } from './AssetTypeSelector';
import { buildGeneratedPatch } from './assetPanelData';
import { AudioAssetWizard } from './AudioAssetWizard';
import { ImageAssetWizard } from './ImageAssetWizard';
import { VideoAssetWizard } from './VideoAssetWizard';
import { ImageLibrary } from '../../../image-library';
import { VideoLibrary } from '../../../video-library';
import { AudioLibrary } from '../../../audio-library';
import '../css/PptAssetPanel.css';

const titleByType = {
  image: '插入图文素材',
  video: '插入视频素材',
  audio: '插入音频素材',
};

const fallbackTitle = '插入素材';

const libraryTitleByType = {
  image: '图片库',
  video: '视频库',
  audio: '音频库',
};

function isAssetForType(asset, type) {
  if (!asset || !type) return false;
  if (type === 'image') return asset.code?.startsWith('B');
  if (type === 'audio') return asset.code?.startsWith('C');
  if (type === 'video') return asset.code?.startsWith('V');
  return true;
}

export function PptAssetPanel({ type, onClose, onInsert }) {
  const [asset, setAsset] = React.useState(null);
  const [libraryOpen, setLibraryOpen] = React.useState(false);
  const [panelTitle, setPanelTitle] = React.useState(titleByType[type] || fallbackTitle);

  React.useEffect(() => {
    setAsset(null);
    setLibraryOpen(false);
    setPanelTitle(titleByType[type] || fallbackTitle);
  }, [type]);

  const handleInsert = (kind, selectedAsset) => {
    onInsert(kind, buildGeneratedPatch(kind, selectedAsset));
  };

  const chooseAsset = (item) => {
    setAsset(item);
    setPanelTitle(item.title);
  };

  const openLibrary = () => {
    setAsset(null);
    setLibraryOpen(true);
    setPanelTitle(libraryTitleByType[type] || '素材库');
  };

  const closeLibrary = () => {
    setLibraryOpen(false);
    setPanelTitle(titleByType[type] || fallbackTitle);
  };

  const insertLibraryAsset = (payload) => {
    if (!payload) return;
    onInsert(payload.type, payload.patch || {});
    onClose?.();
  };

  const validAsset = isAssetForType(asset, type) ? asset : null;

  let content = <AssetTypeSelector type={type} onSelect={chooseAsset} onOpenLibrary={openLibrary} />;
  if (libraryOpen && type === 'image') {
    content = <ImageLibrary variant="ppt-picker" onInsertTaskAsset={insertLibraryAsset} />;
  }
  if (libraryOpen && type === 'video') {
    content = <VideoLibrary variant="ppt-picker" onInsertTaskAsset={insertLibraryAsset} />;
  }
  if (libraryOpen && type === 'audio') {
    content = <AudioLibrary variant="ppt-picker" onInsertTaskAsset={insertLibraryAsset} />;
  }
  if (validAsset && type === 'image') {
    content = <ImageAssetWizard asset={validAsset} onBack={() => { setAsset(null); setPanelTitle(titleByType[type] || fallbackTitle); }} onInsert={handleInsert} onTitleChange={setPanelTitle} />;
  }
  if (validAsset && type === 'video') {
    content = <VideoAssetWizard asset={validAsset} onBack={() => { setAsset(null); setPanelTitle(titleByType[type] || fallbackTitle); }} onInsert={handleInsert} onTitleChange={setPanelTitle} />;
  }
  if (validAsset && type === 'audio') {
    content = <AudioAssetWizard asset={validAsset} onBack={() => { setAsset(null); setPanelTitle(titleByType[type] || fallbackTitle); }} onClose={onClose} onInsert={handleInsert} onTitleChange={setPanelTitle} />;
  }

  return (
    <AssetPanelShell
      title={panelTitle}
      onBack={libraryOpen ? closeLibrary : validAsset ? () => { setAsset(null); setPanelTitle(titleByType[type] || fallbackTitle); } : null}
      onClose={onClose}
      className={`ppt-asset-panel-${type || 'all'}`}
    >
      {content}
    </AssetPanelShell>
  );
}
