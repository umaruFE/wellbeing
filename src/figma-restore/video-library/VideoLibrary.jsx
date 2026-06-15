import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, FileVideo, MoreVertical, Pause, Play, Search, Trash2, Upload as UploadIcon, Video } from 'lucide-react';
import { Button, Dropdown, Input, Modal, Select, Tag, Upload, message } from 'antd';
import apiService from '../../services/api';
import './VideoLibrary.css';
import { VideoPreviewModal } from './VideoPreviewModal';
import { TaskDetailModal } from '../TaskDetailModal';

export const VIDEO_ASSETS = [];

const tonePalette = ['blue', 'mint', 'peach', 'cyan'];

function formatDateTime(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '/');
}

function formatFileSize(value) {
  if (!value) return '--';
  if (typeof value === 'string') return value;
  return `${Math.max(Number(value) / 1024 / 1024, 0.1).toFixed(1)} MB`;
}

function normalizeDuration(value) {
  if (!value) return '--';
  if (typeof value === 'string') return value;
  const totalSeconds = Math.max(0, Math.round(Number(value)));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function normalizeSource(value, t) {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('ai') || raw.includes('generate')) return t('videoLib.sourceAi');
  if (raw.includes('upload') || raw.includes('manual')) return t('videoLib.sourceManual');
  if (raw.includes('course')) return t('videoLib.sourceCourse');
  return value || t('videoLib.sourceLibrary');
}

function normalizeVideoType(item = {}, t) {
  const raw = String(item.type || item.video_type || '').toLowerCase();
  if (raw.includes('animation') || raw.includes('动画')) return t('videoLib.typeAnimation');
  if (raw.includes('dialogue') || raw.includes('story') || raw.includes('情景')) return t('videoLib.typeDrama');
  if (raw.includes('knowledge') || raw.includes('讲解')) return t('videoLib.typeKnowledge');
  if (raw.includes('fitness') || raw.includes('tpr') || raw.includes('体能')) return t('videoLib.typeFitness');
  return item.type || item.video_type || t('videoLib.typeVideo');
}

export function normalizeVideoAsset(item = {}, index = 0, t) {
  const url = item.video_url || item.videoUrl || item.url || item.file_url || item.object_url;
  const format = (item.format || item.file_format || item.name?.split('.').pop() || 'MP4').toString().toUpperCase();
  const type = normalizeVideoType(item, t);
  const ratio = item.ratio || item.aspect_ratio || item.video_ratio || '16:9';
  return {
    id: item.id || url || `video-${Math.random().toString(36).slice(2, 10)}`,
    name: item.name || item.title || t('videoLib.unnamed'),
    source: normalizeSource(item.source || item.source_type || item.origin, t),
    type,
    format,
    fileSize: formatFileSize(item.file_size || item.size),
    duration: normalizeDuration(item.duration),
    ratio,
    created: formatDateTime(item.created_at || item.createdAt || item.created),
    tone: item.tone || tonePalette[index % tonePalette.length],
    objectUrl: url,
    thumbnailUrl: item.thumbnail_url || item.thumbnailUrl,
    info: {
      videoType: item.video_type || type,
      scene: item.scene || item.description || item.prompt || t('videoLib.classroomAsset'),
      language: item.language || item.words || item.tags || t('videoLib.unmarked'),
      spec: item.spec || `${ratio} · ${format}`,
    },
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

export const createVideoTaskDetail = (asset, t) => ({
  type: 'video',
  title: asset.name,
  count: `x 1 ${t('videoLib.videoUnit')}`,
  course: t('videoLib.libraryAsset'),
  status: 'done',
  statusText: t('videoLib.statusDone'),
  submit: asset.created,
  engine: `${t('videoLib.videoAsset')} · ${asset.format}`,
  progress: 100,
  prompt: (asset.source === t('videoLib.sourceAi') || asset.source === t('videoLib.sourceCourse') || asset.source === 'AI生成' || asset.source === '课程同步')
    ? `${asset.info.videoType}，${t('videoLib.sceneLabel')} ${asset.info.scene}，${t('videoLib.languageLabel')} ${asset.info.language}。`
    : t('videoLib.taskPromptManual', { name: asset.name }),
  spec: `${asset.duration} · ${asset.ratio} · ${asset.format}`,
  hero: asset.tone === 'blue' ? 'classroom' : asset.tone === 'mint' ? 'camp' : asset.tone === 'peach' ? 'kitchen' : 'stage',
  shots: [
    asset.info.scene || asset.name,
    asset.info.language || t('videoLib.classroomLanguage'),
    asset.info.spec || t('videoLib.outputAssetSpec'),
  ],
  result: {
    url: asset.videoUrl || asset.video_url || asset.objectUrl || asset.url,
  },
  config: [
    [t('videoLib.videoTypeLabel'), asset.info.videoType],
    [t('videoLib.sceneLabel'), asset.info.scene],
    [t('videoLib.ratioLabel'), asset.ratio],
    [t('imageLib.format'), asset.format],
  ],
});

function VideoArt({ asset, playing, onToggle, t }) {
  return (
    <div className={`fr-vid-frame tone-${asset.tone}`}>
      {asset.objectUrl && playing ? (
        <video className="fr-vid-real" src={asset.objectUrl} autoPlay controls />
      ) : (
        <>
          <Tag className="fr-vid-source-tag">{asset.source}</Tag>
          <span className="fr-vid-moon" />
          <span className="fr-vid-line line-a" />
          <span className="fr-vid-line line-b" />
          <span className="fr-vid-line line-c" />
          <button className="fr-vid-play" type="button" onClick={onToggle} aria-label={playing ? t('videoLib.pause') : t('videoLib.play')}>
            {playing ? <Pause size={30} fill="currentColor" /> : <Play size={34} fill="currentColor" />}
          </button>
          <span className="fr-vid-duration">{asset.duration}</span>
        </>
      )}
    </div>
  );
}

export function VideoLibrary({ variant, onInsertTaskAsset } = {}) {
  const { t } = useTranslation();
  const [assets, setAssets] = React.useState(VIDEO_ASSETS);
  const [search, setSearch] = React.useState('');
  const [source, setSource] = React.useState('');
  const [type, setType] = React.useState('');
  const [previewAsset, setPreviewAsset] = React.useState(null);
  const [deleteAsset, setDeleteAsset] = React.useState(null);
  const [taskDetail, setTaskDetail] = React.useState(null);
  const [playingId, setPlayingId] = React.useState(null);

  const sourceOptions = React.useMemo(() => [
    { label: t('imageLib.sourceAll'), value: '' },
    { label: t('videoLib.sourceAi'), value: t('videoLib.sourceAi') },
    { label: t('videoLib.sourceCourse'), value: t('videoLib.sourceCourse') },
    { label: t('videoLib.sourceManual'), value: t('videoLib.sourceManual') },
  ], [t]);

  const typeOptions = React.useMemo(() => [
    { label: t('imageLib.typeAll'), value: '' },
    { label: t('videoLib.typeAnimation'), value: t('videoLib.typeAnimation') },
    { label: t('videoLib.typeDrama'), value: t('videoLib.typeDrama') },
    { label: t('videoLib.typeKnowledge'), value: t('videoLib.typeKnowledge') },
    { label: t('videoLib.typeFitness'), value: t('videoLib.typeFitness') },
  ], [t]);

  React.useEffect(() => {
    let alive = true;
    apiService.getVideos({ limit: 200 })
      .then((result) => {
        if (!alive) return;
        setAssets((result.data || []).map((item, idx) => normalizeVideoAsset(item, idx, t)));
      })
      .catch((error) => {
        console.error('fetch video library failed:', error);
        if (alive) {
          setAssets([]);
          message.error(t('videoLib.fetchFailed'));
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
      const haystack = `${asset.name} ${asset.type} ${asset.source} ${asset.format}`.toLowerCase();
      return (!keyword || haystack.includes(keyword))
        && (!source || asset.source === source)
        && (!type || asset.type === type);
    });
  }, [assets, search, source, type]);

  const handleUpload = async (file) => {
    if (!file?.type?.startsWith('video/')) {
      message.warning(t('videoLib.selectVideoFile'));
      return Upload.LIST_IGNORE;
    }

    const format = file.name?.split('.').pop()?.toUpperCase() || 'VIDEO';
    const nextAsset = {
      id: `manual-video-${Date.now()}`,
      name: file.name?.replace(/\.[^/.]+$/, '') || t('videoLib.newUploadName'),
      source: t('videoLib.sourceManual'),
      type: t('videoLib.typeFitness'),
      format,
      fileSize: `${Math.max(file.size / 1024 / 1024, 0.1).toFixed(1)} MB`,
      duration: '0:30',
      ratio: '16:9',
      created: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '/'),
      tone: 'cyan',
      info: { videoType: t('videoLib.localVideo'), scene: t('videoLib.classroomAsset'), language: t('videoLib.unmarked'), spec: t('videoLib.originalFile') },
      objectUrl: URL.createObjectURL(file),
    };
    setAssets(current => [nextAsset, ...current]);
    message.success(t('videoLib.uploadSuccess'));
    return false;
  };

  const handleDeleteAsset = (asset) => {
    setAssets(current => current.filter(item => item.id !== asset.id));
    setPreviewAsset(current => (current?.id === asset.id ? null : current));
    setDeleteAsset(null);
    if (asset.objectUrl) URL.revokeObjectURL(asset.objectUrl);
    message.success(t('videoLib.deleteSuccess', { name: asset.name }));
  };

  const handlePlay = (asset) => {
    if (!asset.objectUrl) {
      message.info(t('videoLib.noPlayableFile'));
      return;
    }
    setPlayingId(current => (current === asset.id ? null : asset.id));
  };

  const handleMenuClick = ({ key, domEvent }, asset) => {
    domEvent?.stopPropagation();
    if (key === 'detail') {
      setPreviewAsset(asset);
      return;
    }
    if (key === 'delete') setDeleteAsset(asset);
  };

  return (
    <section className={`fr-vid-lib ${variant === 'ppt-picker' ? 'ppt-library-picker' : ''}`}>
      <div className="fr-vid-page">
        <header className="fr-vid-hero">
          <div className="fr-vid-hero-left">
            <div className="fr-vid-hero-icon"><Video size={30} /></div>
            <div>
              <h1>{t('videoLib.title')}</h1>
              <p>{t('videoLib.subtitle')}</p>
            </div>
          </div>
          <Upload accept="video/*" beforeUpload={handleUpload} showUploadList={false}>
            <button className="fr-vid-upload-btn" type="button">
              <UploadIcon size={16} />
              {t('videoLib.uploadVideo')}
            </button>
          </Upload>
        </header>

        <section className="fr-vid-panel">
          <div className="fr-vid-toolbar">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('videoLib.searchPlaceholder')} prefix={<Search size={16} />} allowClear />
            <div className="fr-vid-filter-group">
              <Select value={source} onChange={setSource} options={sourceFilterOptions} />
              <Select value={type} onChange={setType} options={typeFilterOptions} />
            </div>
          </div>

          {filteredAssets.length > 0 ? (
            <div className="fr-vid-grid">
              {filteredAssets.map(asset => (
                <article className="fr-vid-card" key={asset.id} onClick={() => setPreviewAsset(asset)}>
                  <VideoArt asset={asset} playing={playingId === asset.id} t={t} onToggle={(event) => {
                    event.stopPropagation();
                    handlePlay(asset);
                  }} />
                  <div className="fr-vid-meta">
                    <div className="fr-vid-name">{asset.name}</div>
                    <div className="fr-vid-chip-row">
                      <span className="fr-vid-type-chip">{asset.type}</span>
                      <span className="fr-vid-size">{asset.format} · {asset.fileSize}</span>
                    </div>
                    <div className="fr-vid-footer">
                      <span>{asset.created}</span>
                      <Dropdown
                        trigger={['click']}
                        menu={{
                          items: [
                            { key: 'detail', icon: <Eye size={14} />, label: t('imageLib.viewDetail') },
                            { key: 'delete', icon: <Trash2 size={14} />, label: t('common.delete'), danger: true },
                          ],
                          onClick: (info) => handleMenuClick(info, asset),
                        }}
                      >
                        <button className="fr-vid-card-menu-btn" type="button" aria-label="更多操作" onClick={(event) => event.stopPropagation()}>
                          <MoreVertical size={18} />
                        </button>
                      </Dropdown>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="fr-vid-empty">
              <FileVideo size={30} />
              <strong>{t('videoLib.noResults')}</strong>
              <span>{t('videoLib.noResultsHint')}</span>
            </div>
          )}
        </section>
      </div>

      <VideoPreviewModal
        asset={previewAsset}
        open={Boolean(previewAsset)}
        onClose={() => setPreviewAsset(null)}
        onViewTask={(asset) => {
          setPlayingId(null);
          setTaskDetail(createVideoTaskDetail(asset, t));
          setPreviewAsset(null);
        }}
      />

      <TaskDetailModal
        task={taskDetail}
        open={Boolean(taskDetail)}
        onClose={() => setTaskDetail(null)}
        onInsertTaskAsset={onInsertTaskAsset}
      />

      <Modal
        open={Boolean(deleteAsset)}
        title={t('videoLib.deleteTitle')}
        className="fr-vid-confirm-modal"
        okText={t('imageLib.confirmDeleteBtn')}
        cancelText={t('common.cancel')}
        okButtonProps={{ danger: true }}
        onOk={() => deleteAsset && handleDeleteAsset(deleteAsset)}
        onCancel={() => setDeleteAsset(null)}
        centered
      >
        <p>{t('videoLib.confirmDeleteMsg', { name: deleteAsset?.name })}</p>
      </Modal>
    </section>
  );
}
