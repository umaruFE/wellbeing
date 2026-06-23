import React from 'react';
import { useTranslation } from 'react-i18next';
import { AssetPanelShell } from './AssetPanelShell';
import { AssetTypeSelector } from './AssetTypeSelector';
import { buildGeneratedPatch } from './assetPanelData';
import { AudioAssetWizard } from './AudioAssetWizard';
import { ImageAssetWizard } from './ImageAssetWizard';
import { VideoAssetWizard } from './VideoAssetWizard';
import { PptLibraryPickerModal } from './PptLibraryPickerModal';
import '../css/PptAssetPanel.css';

const titleByTypeKey = {
  image: 'assetPanel.insertImage',
  video: 'assetPanel.insertVideo',
  audio: 'assetPanel.insertAudio',
};

function isAssetForType(asset, type) {
  if (!asset || !type) return false;
  if (type === 'image') return asset.code?.startsWith('B');
  if (type === 'audio') return asset.code?.startsWith('C');
  if (type === 'video') return asset.code?.startsWith('V');
  return true;
}

export function PptAssetPanel({ type, onClose, onInsert }) {
  const { t } = useTranslation();
  const getResetTitle = () => t(titleByTypeKey[type]) || t('assetPanel.insertImage');
  const fallbackTitle = t('assetPanel.insertImage');
  const [asset, setAsset] = React.useState(null);
  const [libraryPickerOpen, setLibraryPickerOpen] = React.useState(false);
  const [panelTitle, setPanelTitle] = React.useState(t(titleByTypeKey[type]) || fallbackTitle);

  React.useEffect(() => {
    setAsset(null);
    setLibraryPickerOpen(false);
    setPanelTitle(getResetTitle());
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
    setLibraryPickerOpen(true);
  };

  const insertLibraryAsset = (payload) => {
    if (!payload) return;
    onInsert(payload.type, payload.patch || {});
    onClose?.();
  };

  const validAsset = isAssetForType(asset, type) ? asset : null;

  let content = <AssetTypeSelector type={type} onSelect={chooseAsset} onOpenLibrary={openLibrary} />;
  if (validAsset && type === 'image') {
    content = <ImageAssetWizard asset={validAsset} onBack={() => { setAsset(null); setPanelTitle(getResetTitle()); }} onInsert={handleInsert} onTitleChange={setPanelTitle} />;
  }
  if (validAsset && type === 'video') {
    content = <VideoAssetWizard asset={validAsset} onBack={() => { setAsset(null); setPanelTitle(getResetTitle()); }} onInsert={handleInsert} onTitleChange={setPanelTitle} />;
  }
  if (validAsset && type === 'audio') {
    content = <AudioAssetWizard asset={validAsset} onBack={() => { setAsset(null); setPanelTitle(getResetTitle()); }} onClose={onClose} onInsert={handleInsert} onTitleChange={setPanelTitle} />;
  }

  return (
    <>
      <AssetPanelShell
        title={panelTitle}
        onBack={validAsset ? () => { setAsset(null); setPanelTitle(getResetTitle()); } : null}
        onClose={onClose}
        className={`ppt-asset-panel-${type || 'all'}`}
      >
        {content}
      </AssetPanelShell>
      <PptLibraryPickerModal
        type={type}
        open={libraryPickerOpen}
        onClose={() => setLibraryPickerOpen(false)}
        onInsert={insertLibraryAsset}
      />
    </>
  );
}
