import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Eye, FileText, Image, Monitor, MoreVertical, Plus, Search, Trash2, Upload as UploadIcon, X } from 'lucide-react';
import { Button, Dropdown, Input, Modal, Select, Tag, Upload, message } from 'antd';
import apiService from '../../services/api';
import './ImageLibrary.css';
import { AssetPreviewModal } from './AssetPreviewModal';
import { TaskDetailModal } from '../TaskDetailModal';

export const IMAGE_ASSETS = [];

function formatDateTime(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '/');
}

function normalizeSource(value, t) {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('ai') || raw.includes('generate')) return t('imageLib.sourceAi');
  if (raw.includes('upload') || raw.includes('manual')) return t('imageLib.sourceManual');
  if (raw.includes('course')) return t('imageLib.sourceCourse');
  return value || t('imageLib.sourceLibrary');
}

export function normalizeImageAsset(item = {}, t) {
  const categoryName = item.category?.name || item.category_name || item.type || item.image_type;
  const width = item.width || item.image_width;
  const height = item.height || item.image_height;
  return {
    id: item.id || item.image_url || `image-${Math.random().toString(36).slice(2, 10)}`,
    name: item.name || item.title || item.filename || t('imageLib.unnamed'),
    source: normalizeSource(item.source || item.source_type || item.origin, t),
    type: categoryName || t('imageLib.typePpt'),
    size: width && height ? `${width} × ${height}` : item.size || item.resolution || '--',
    created: formatDateTime(item.created_at || item.createdAt || item.created),
    scene: item.scene || 'manual',
    previewUrl: item.image_url || item.imageUrl || item.url || item.preview_url || item.thumbnail_url,
    raw: item,
  };
}

function mergeOptions(baseOptions, assets, field) {
  const existing = new Set(baseOptions.map((item) => item.value));
  const extra = assets
    .map((asset) => asset[field])
    .filter(Boolean)
    .filter((value) => !existing.has(value));
  return [
    ...baseOptions,
    ...Array.from(new Set(extra)).map((value) => ({ label: value, value })),
  ];
}

export const createImageTaskDetail = (asset, t) => ({
  type: 'image',
  title: asset.name,
  count: `x 1 ${t('imageLib.imageUnit')}`,
  course: t('imageLib.libraryAsset'),
  status: 'done',
  statusText: t('imageLib.statusDone'),
  submit: asset.created,
  engine: `${asset.type} · ${asset.source}`,
  progress: 100,
  prompt: asset.source === t('imageLib.sourceAi') || asset.source === 'AI生成'
    ? t('imageLib.taskPromptAi', { name: asset.name })
    : t('imageLib.taskPromptManual', { name: asset.name }),
  spec: `${asset.size} · PNG`,
  scenes: [asset.scene, asset.scene, asset.scene, asset.scene],
  result: {
    url: asset.previewUrl || asset.imageUrl || asset.image_url || asset.url,
  },
  config: [
    [t('imageLib.assetType'), asset.type],
    [t('imageLib.source'), asset.source],
    [t('imageLib.imageSize'), asset.size],
    [t('imageLib.format'), 'PNG'],
  ],
});

function getInsertConfigs(t) {
  return {
    cover: {
      name: t('imageLib.insertCover'),
      foot: t('imageLib.footCover'),
      helper: t('imageLib.helperCover'),
      icon: Image,
      desc: t('imageLib.descCover'),
    },
    ppt: {
      name: t('imageLib.insertPpt'),
      foot: t('imageLib.footPpt'),
      helper: t('imageLib.helperPpt'),
      icon: Monitor,
      desc: t('imageLib.descPpt'),
    },
    reading: {
      name: t('imageLib.insertReading'),
      foot: t('imageLib.footReading'),
      helper: t('imageLib.helperReading'),
      icon: BookOpen,
      desc: t('imageLib.descReading'),
    },
  };
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

function InsertModal({ asset, open, onClose, onConfirm }) {
  const { t } = useTranslation();
  const [target, setTarget] = React.useState('cover');
  const insertConfigs = React.useMemo(() => getInsertConfigs(t), [t]);

  React.useEffect(() => {
    if (open) setTarget('cover');
  }, [open]);

  if (!asset) return null;
  const cfg = insertConfigs[target];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={960}
      className="fr-img-modal fr-img-insert-modal"
      closeIcon={<X size={20} />}
      title={(
        <div>
          <div className="fr-img-modal-title">{t('imageLib.selectInsertLocation')}</div>
          <div className="fr-img-modal-sub">{t('imageLib.insertSubtitle')}</div>
        </div>
      )}
    >
      <div className="fr-img-insert-body">
        <aside className="fr-img-insert-preview">
          <div className="fr-img-insert-art"><SceneArt scene={asset.scene} src={asset.previewUrl} alt={asset.name} /></div>
          <div className="fr-img-insert-meta">
            <div className="fr-img-insert-name">{asset.name}</div>
            <div className="fr-img-insert-line">
              <Tag color="error">{asset.type}</Tag>
              <Tag>{asset.source}</Tag>
            </div>
          </div>
        </aside>
        <section className="fr-img-insert-panel">
          <div className="fr-img-insert-section">{t('imageLib.targetCourse')}</div>
          <label className="fr-img-field full">
            <span>{t('imageLib.selectCourse')}</span>
            <Select
              style={{ width: '100%' }}
              defaultValue="Unit 3: Animals"
              options={[
                { value: 'Unit 3: Animals', label: 'Unit 3: Animals' },
                { value: 'Unit 2: Greetings', label: 'Unit 2: Greetings' },
              ]}
            />
          </label>

          <div className="fr-img-insert-section">{t('imageLib.courseModule')}</div>
          <div className="fr-img-choice-grid">
            {Object.entries(insertConfigs).map(([key, item]) => {
              const Icon = item.icon;
              return (
                <button key={key} type="button" className={`fr-img-choice ${target === key ? 'active' : ''}`} onClick={() => setTarget(key)}>
                  <span className="fr-img-choice-ico"><Icon size={18} /></span>
                  <span>
                    <strong>{item.name}</strong>
                    <small>{item.desc}</small>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="fr-img-insert-section">{t('imageLib.modulePosition')}</div>
          <div className="fr-img-form-grid">
            {target === 'cover' && (
              <label className="fr-img-field full">
                <span>{t('imageLib.coverPosition')}</span>
                <Select
                  style={{ width: '100%' }}
                  defaultValue={t('imageLib.replaceCover')}
                  options={[
                    { value: t('imageLib.replaceCover'), label: t('imageLib.replaceCover') },
                    { value: t('imageLib.addCoverAlt'), label: t('imageLib.addCoverAlt') },
                  ]}
                />
              </label>
            )}
            {target === 'ppt' && (
              <>
                <label className="fr-img-field">
                  <span>{t('imageLib.targetPhase')}</span>
                  <Select
                    style={{ width: '100%' }}
                    defaultValue={t('imageLib.phase1')}
                    options={[
                      { value: t('imageLib.phase1'), label: t('imageLib.phase1') },
                      { value: t('imageLib.phase2'), label: t('imageLib.phase2') },
                    ]}
                  />
                </label>
                <label className="fr-img-field">
                  <span>{t('imageLib.targetPptPage')}</span>
                  <Select
                    style={{ width: '100%' }}
                    defaultValue={t('imageLib.slide1')}
                    options={[
                      { value: t('imageLib.slide1'), label: t('imageLib.slide1') },
                      { value: t('imageLib.newSlide'), label: t('imageLib.newSlide') },
                    ]}
                  />
                </label>
              </>
            )}
            {target === 'reading' && (
              <label className="fr-img-field full">
                <span>{t('imageLib.readingPage')}</span>
                <Select
                  style={{ width: '100%' }}
                  defaultValue={t('imageLib.readingPage1')}
                  options={[
                    { value: t('imageLib.readingPage1'), label: t('imageLib.readingPage1') },
                    { value: t('imageLib.newReadingPage'), label: t('imageLib.newReadingPage') },
                  ]}
                />
              </label>
            )}
            <div className="fr-img-insert-helper">{cfg.helper}</div>
          </div>
        </section>
      </div>
      <div className="fr-img-modal-footer split">
        <div className="fr-img-foot-note">{cfg.foot}</div>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button className="fr-img-action-primary" type="primary" onClick={() => onConfirm(asset, target)}>{t('imageLib.confirmInsert')}</Button>
      </div>
    </Modal>
  );
}

export function ImageLibrary({ variant, onInsertTaskAsset } = {}) {
  const { t } = useTranslation();
  const [assets, setAssets] = React.useState(IMAGE_ASSETS);
  const [search, setSearch] = React.useState('');
  const [source, setSource] = React.useState('');
  const [type, setType] = React.useState('');
  const [previewAsset, setPreviewAsset] = React.useState(null);
  const [insertAsset, setInsertAsset] = React.useState(null);
  const [deleteAsset, setDeleteAsset] = React.useState(null);
  const [taskDetail, setTaskDetail] = React.useState(null);

  const sourceOptions = React.useMemo(() => [
    { label: t('imageLib.sourceAll'), value: '' },
    { label: t('imageLib.sourceAi'), value: t('imageLib.sourceAi') },
    { label: t('imageLib.sourceManual'), value: t('imageLib.sourceManual') },
  ], [t]);

  const typeOptions = React.useMemo(() => [
    { label: t('imageLib.typeAll'), value: '' },
    { label: t('imageLib.typeTheme'), value: t('imageLib.typeTheme') },
    { label: t('imageLib.typePpt'), value: t('imageLib.typePpt') },
    { label: t('imageLib.typeFlashcard'), value: t('imageLib.typeFlashcard') },
    { label: t('imageLib.typeStory'), value: t('imageLib.typeStory') },
  ], [t]);

  React.useEffect(() => {
    let alive = true;
    apiService.getPptImages({ limit: 200 })
      .then((result) => {
        if (!alive) return;
        setAssets((result.data || []).map(item => normalizeImageAsset(item, t)));
      })
      .catch((error) => {
        console.error('fetch image library failed:', error);
        if (alive) {
          setAssets([]);
          message.error(t('imageLib.fetchFailed'));
        }
      });
    return () => {
      alive = false;
    };
  }, [t]);

  const sourceFilterOptions = React.useMemo(() => mergeOptions(sourceOptions, assets, 'source'), [assets]);
  const typeFilterOptions = React.useMemo(() => mergeOptions(typeOptions, assets, 'type'), [assets]);

  const filteredAssets = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return assets.filter(asset => {
      const haystack = `${asset.name} ${asset.type} ${asset.source}`.toLowerCase();
      return (!keyword || haystack.includes(keyword))
        && (!source || asset.source === source)
        && (!type || asset.type === type);
    });
  }, [assets, search, source, type]);

  const readImageSize = (previewUrl) => new Promise(resolve => {
    const image = new window.Image();
    image.onload = () => resolve(`${image.naturalWidth} × ${image.naturalHeight}`);
    image.onerror = () => resolve('本地图片');
    image.src = previewUrl;
  });

  const handleUpload = async (file) => {
    if (!file?.type?.startsWith('image/')) {
      message.warning(t('imageLib.selectImageFile'));
      return Upload.LIST_IGNORE;
    }

    const previewUrl = URL.createObjectURL(file);
    const imageSize = await readImageSize(previewUrl);
    const nextAsset = {
      id: `manual-${Date.now()}`,
      name: file.name?.replace(/\.[^/.]+$/, '') || t('imageLib.newUploadName'),
      source: t('imageLib.sourceManual'),
      type: t('imageLib.typePpt'),
      size: imageSize,
      created: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '/'),
      scene: 'manual',
      previewUrl,
    };
    setAssets(current => [nextAsset, ...current]);
    message.success(t('imageLib.uploadSuccess'));
    return false;
  };

  const handleConfirmInsert = (asset, target) => {
    const cfg = getInsertConfigs(t)[target] || getInsertConfigs(t).cover;
    setInsertAsset(null);
    message.success(t('imageLib.insertSuccess', { name: asset.name, target: cfg.name }));
  };

  const handleDeleteAsset = (asset) => {
    setAssets(current => current.filter(item => item.id !== asset.id));
    setPreviewAsset(current => (current?.id === asset.id ? null : current));
    setInsertAsset(current => (current?.id === asset.id ? null : current));
    setDeleteAsset(null);
    if (asset.previewUrl) URL.revokeObjectURL(asset.previewUrl);
    message.success(t('imageLib.deleteSuccess', { name: asset.name }));
  };

  const handleAssetMenuClick = ({ key, domEvent }, asset) => {
    domEvent?.stopPropagation();
    if (key === 'detail') {
      setPreviewAsset(asset);
      return;
    }
    if (key === 'delete') {
      setDeleteAsset(asset);
    }
  };

  return (
    <section className={`fr-img-lib ${variant === 'ppt-picker' ? 'ppt-library-picker' : ''}`}>
      <div className="fr-img-page">
        <header className="fr-img-hero">
          <div className="fr-img-hero-left">
            <div className="fr-img-hero-icon"><Image size={30} /></div>
            <div>
              <h1>{t('imageLib.title')}</h1>
              <p>{t('imageLib.subtitle')}</p>
            </div>
          </div>
          <Upload
            accept="image/*"
            beforeUpload={handleUpload}
            showUploadList={false}
          >
            <button className="fr-img-upload-btn" type="button">
              <UploadIcon size={16} />
              {t('imageLib.uploadImage')}
            </button>
          </Upload>
        </header>

        <section className="fr-img-panel">
          <div className="fr-img-toolbar">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('imageLib.searchPlaceholder')}
              prefix={<Search size={16} />}
              allowClear
            />
            <div className="fr-img-filter-group">
              <Select value={source} onChange={setSource} options={sourceFilterOptions} />
              <Select value={type} onChange={setType} options={typeFilterOptions} />
            </div>
          </div>

          {filteredAssets.length > 0 ? (
            <div className="fr-img-grid">
              {filteredAssets.map(asset => (
                <article className="fr-img-card" key={asset.id} onClick={() => setPreviewAsset(asset)}>
                  <div className="fr-img-thumb">
                    <SceneArt scene={asset.scene} src={asset.previewUrl} alt={asset.name} />
                    <Tag className="fr-img-source-tag">{asset.source}</Tag>
                  </div>
                  <div className="fr-img-meta">
                    <div className="fr-img-name">{asset.name}</div>
                    <div className="fr-img-chip-row">
                      <span className="fr-img-type-chip">{asset.type}</span>
                      <span className="fr-img-size">{asset.size}</span>
                    </div>
                    <div className="fr-img-footer">
                      <span>{asset.created}</span>
                      <Dropdown
                        trigger={['click']}
                        menu={{
                          items: [
                            { key: 'detail', icon: <Eye size={14} />, label: t('imageLib.viewDetail') },
                            { key: 'delete', icon: <Trash2 size={14} />, label: t('common.delete'), danger: true },
                          ],
                          onClick: (info) => handleAssetMenuClick(info, asset),
                        }}
                      >
                        <button
                          className="fr-img-card-menu-btn"
                          type="button"
                          aria-label="更多操作"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <MoreVertical size={18} />
                        </button>
                      </Dropdown>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="fr-img-empty">
              <FileText size={30} />
              <strong>{t('imageLib.noResults')}</strong>
              <span>{t('imageLib.noResultsHint')}</span>
            </div>
          )}
        </section>
      </div>

      <AssetPreviewModal
        asset={previewAsset}
        open={Boolean(previewAsset)}
        onClose={() => setPreviewAsset(null)}
        onViewTask={(asset) => {
          setTaskDetail(createImageTaskDetail(asset, t));
          setPreviewAsset(null);
        }}
      />

      <TaskDetailModal
        task={taskDetail}
        open={Boolean(taskDetail)}
        onClose={() => setTaskDetail(null)}
        onInsertTaskAsset={onInsertTaskAsset}
      />

      <InsertModal
        asset={insertAsset}
        open={Boolean(insertAsset)}
        onClose={() => setInsertAsset(null)}
        onConfirm={handleConfirmInsert}
      />
      <Modal
        open={Boolean(deleteAsset)}
        title={t('imageLib.deleteTitle')}
        className="fr-img-confirm-modal"
        okText={t('imageLib.confirmDeleteBtn')}
        cancelText={t('common.cancel')}
        okButtonProps={{ danger: true }}
        onOk={() => deleteAsset && handleDeleteAsset(deleteAsset)}
        onCancel={() => setDeleteAsset(null)}
        centered
      >
        <p>{t('imageLib.confirmDeleteMsg', { name: deleteAsset?.name })}</p>
      </Modal>
    </section>
  );
}
