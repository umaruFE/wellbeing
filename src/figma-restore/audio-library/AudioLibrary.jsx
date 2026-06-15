import React from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, FileAudio, MoreVertical, Music, Pause, Play, Search, Trash2, Upload as UploadIcon } from 'lucide-react';
import { Button, Dropdown, Input, Modal, Select, Tag, Upload, message } from 'antd';
import apiService from '../../services/api';
import './AudioLibrary.css';
import { AudioPreviewModal } from './AudioPreviewModal';
import { TaskDetailModal } from '../TaskDetailModal';

export const AUDIO_ASSETS = [];

const tonePalette = ['lavender', 'mint', 'peach', 'blue'];

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
  if (raw.includes('ai') || raw.includes('generate')) return t('audioLib.sourceAi');
  if (raw.includes('upload') || raw.includes('manual')) return t('audioLib.sourceManual');
  if (raw.includes('course')) return t('audioLib.sourceCourse');
  return value || t('audioLib.sourceLibrary');
}

function normalizeAudioType(item = {}, t) {
  const raw = String(item.type || item.audio_type || item.voice_type || '').toLowerCase();
  if (raw.includes('bgm') || raw.includes('music')) return t('audioLib.typeBgm');
  if (raw.includes('song')) return t('audioLib.typeSong');
  if (raw.includes('effect')) return t('audioLib.typeEffect');
  return item.type || item.audio_type || t('audioLib.typeNarration');
}

export function normalizeAudioAsset(item = {}, index = 0, t) {
  const url = item.audio_url || item.audioUrl || item.url || item.file_url || item.object_url;
  const format = (item.format || item.file_format || item.name?.split('.').pop() || item.voice_type || 'AUDIO').toString().toUpperCase();
  const type = normalizeAudioType(item, t);
  return {
    id: item.id || url || `audio-${Math.random().toString(36).slice(2, 10)}`,
    name: item.name || item.title || item.voice_name || t('audioLib.unnamed'),
    source: normalizeSource(item.source || item.source_type || item.origin, t),
    type,
    format,
    fileSize: formatFileSize(item.file_size || item.size),
    duration: normalizeDuration(item.duration),
    created: formatDateTime(item.created_at || item.createdAt || item.created),
    tone: item.tone || tonePalette[index % tonePalette.length],
    objectUrl: url,
    info: {
      audioType: item.audio_type || item.voice_type || type,
      theme: item.theme || item.description || item.prompt || t('audioLib.classroomAsset'),
      style: item.style || item.emotion || item.mood || t('audioLib.unmarked'),
      lyric: item.lyric || item.lyrics || item.text || t('audioLib.noLyrics'),
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

export const createAudioTaskDetail = (asset, t) => ({
  type: 'audio',
  title: asset.name,
  count: `x 1 ${t('audioLib.audioUnit')}`,
  course: t('audioLib.libraryAsset'),
  status: 'done',
  statusText: t('audioLib.statusDone'),
  submit: asset.created,
  engine: `${t('audioLib.audioAsset')} · ${asset.format}`,
  progress: 100,
  prompt: (asset.source === t('audioLib.sourceAi') || asset.source === 'AI生成')
    ? `${asset.info.audioType}，${t('audioLib.themeLabel')} ${asset.info.theme}，${t('audioLib.styleLabel')} ${asset.info.style}。`
    : t('audioLib.taskPromptManual', { name: asset.name }),
  spec: `${asset.duration} · ${asset.format} · ${asset.fileSize}`,
  tracks: [asset.name],
  result: {
    url: asset.audioUrl || asset.audio_url || asset.objectUrl || asset.url,
  },
  config: [
    [t('audioLib.audioTypeLabel'), asset.info.audioType],
    [t('audioLib.themeLabel'), asset.info.theme],
    [t('audioLib.styleLabel'), asset.info.style],
    [t('imageLib.format'), asset.format],
  ],
});

function WaveArt({ asset, playing, onToggle, t }) {
  return (
    <div className={`fr-aud-wave tone-${asset.tone}`}>
      <Tag className="fr-aud-source-tag">{asset.source}</Tag>
      <div className="fr-aud-bars" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, index) => (
          <span key={index} style={{ height: `${30 + ((index * 17) % 54)}px` }} />
        ))}
      </div>
      <button className="fr-aud-play" type="button" onClick={onToggle} aria-label={playing ? t('audioLib.pause') : t('audioLib.play')}>
        {playing ? <Pause size={30} fill="currentColor" /> : <Play size={34} fill="currentColor" />}
      </button>
      <span className="fr-aud-duration">{asset.duration}</span>
    </div>
  );
}

export function AudioLibrary({ variant, onInsertTaskAsset } = {}) {
  const { t } = useTranslation();
  const [assets, setAssets] = React.useState(AUDIO_ASSETS);
  const [search, setSearch] = React.useState('');
  const [source, setSource] = React.useState('');
  const [type, setType] = React.useState('');
  const [previewAsset, setPreviewAsset] = React.useState(null);
  const [deleteAsset, setDeleteAsset] = React.useState(null);
  const [taskDetail, setTaskDetail] = React.useState(null);
  const [playingId, setPlayingId] = React.useState(null);
  const [playProgress, setPlayProgress] = React.useState({ assetId: null, current: 0, duration: 0 });
  const audioRef = React.useRef(null);

  const sourceOptions = React.useMemo(() => [
    { label: t('imageLib.sourceAll'), value: '' },
    { label: t('audioLib.sourceAi'), value: t('audioLib.sourceAi') },
    { label: t('audioLib.sourceManual'), value: t('audioLib.sourceManual') },
  ], [t]);

  const typeOptions = React.useMemo(() => [
    { label: t('imageLib.typeAll'), value: '' },
    { label: t('audioLib.typeBgm'), value: t('audioLib.typeBgm') },
    { label: t('audioLib.typeNarration'), value: t('audioLib.typeNarration') },
    { label: t('audioLib.typeSong'), value: t('audioLib.typeSong') },
    { label: t('audioLib.typeEffect'), value: t('audioLib.typeEffect') },
  ], [t]);

  React.useEffect(() => {
    let alive = true;
    apiService.getVoiceConfigs()
      .then((result) => {
        if (!alive) return;
        setAssets((result.data || []).map((item, idx) => normalizeAudioAsset(item, idx, t)));
      })
      .catch((error) => {
        console.error('fetch audio library failed:', error);
        if (alive) {
          setAssets([]);
          message.error(t('audioLib.fetchFailed'));
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
    if (!file?.type?.startsWith('audio/')) {
      message.warning(t('audioLib.selectAudioFile'));
      return Upload.LIST_IGNORE;
    }

    const format = file.name?.split('.').pop()?.toUpperCase() || 'AUDIO';
    const nextAsset = {
      id: `manual-audio-${Date.now()}`,
      name: file.name || t('audioLib.newUploadName'),
      source: t('audioLib.sourceManual'),
      type: t('audioLib.typeNarration'),
      format,
      fileSize: `${Math.max(file.size / 1024 / 1024, 0.1).toFixed(1)} MB`,
      duration: '0:30',
      created: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '/'),
      tone: 'blue',
      info: { audioType: t('audioLib.localAudio'), theme: t('audioLib.classroomAsset'), style: t('audioLib.unmarked'), lyric: t('audioLib.noLyrics') },
      objectUrl: URL.createObjectURL(file),
    };
    setAssets(current => [nextAsset, ...current]);
    message.success(t('audioLib.uploadSuccess'));
    return false;
  };

  const stopAudio = React.useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlayingId(null);
    setPlayProgress({ assetId: null, current: 0, duration: 0 });
  }, []);

  const handlePlayAudio = React.useCallback((asset) => {
    if (playingId === asset.id) {
      stopAudio();
      return;
    }

    stopAudio();

    if (!asset.objectUrl) {
      message.info(t('audioLib.noPlayableFile'));
      return;
    }

    const audio = new Audio(asset.objectUrl);
    audioRef.current = audio;
    const updateProgress = () => {
      setPlayProgress({
        assetId: asset.id,
        current: audio.currentTime || 0,
        duration: Number.isFinite(audio.duration) ? audio.duration : 0,
      });
    };
    audio.onloadedmetadata = updateProgress;
    audio.ontimeupdate = updateProgress;
    audio.onended = () => {
      setPlayingId(null);
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      setPlayProgress({ assetId: asset.id, current: duration, duration });
    };
    audio.play()
      .then(() => {
        setPlayingId(asset.id);
        updateProgress();
      })
      .catch(() => {
        audioRef.current = null;
        setPlayingId(null);
        setPlayProgress({ assetId: null, current: 0, duration: 0 });
        message.warning(t('audioLib.playFailed'));
      });
  }, [playingId, stopAudio, t]);

  React.useEffect(() => stopAudio, [stopAudio]);

  const handleDeleteAsset = (asset) => {
    setAssets(current => current.filter(item => item.id !== asset.id));
    setPreviewAsset(current => (current?.id === asset.id ? null : current));
    setDeleteAsset(null);
    if (playingId === asset.id) stopAudio();
    if (asset.objectUrl) URL.revokeObjectURL(asset.objectUrl);
    message.success(t('audioLib.deleteSuccess', { name: asset.name }));
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
    <section className={`fr-aud-lib ${variant === 'ppt-picker' ? 'ppt-library-picker' : ''}`}>
      <div className="fr-aud-page">
        <header className="fr-aud-hero">
          <div className="fr-aud-hero-left">
            <div className="fr-aud-hero-icon"><Music size={30} /></div>
            <div>
              <h1>{t('audioLib.title')}</h1>
              <p>{t('audioLib.subtitle')}</p>
            </div>
          </div>
          <Upload accept="audio/*" beforeUpload={handleUpload} showUploadList={false}>
            <button className="fr-aud-upload-btn" type="button">
              <UploadIcon size={16} />
              {t('audioLib.uploadAudio')}
            </button>
          </Upload>
        </header>

        <section className="fr-aud-panel">
          <div className="fr-aud-toolbar">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t('audioLib.searchPlaceholder')}
              prefix={<Search size={16} />}
              allowClear
            />
            <div className="fr-aud-filter-group">
              <Select value={source} onChange={setSource} options={sourceFilterOptions} />
              <Select value={type} onChange={setType} options={typeFilterOptions} />
            </div>
          </div>

          {filteredAssets.length > 0 ? (
            <div className="fr-aud-grid">
              {filteredAssets.map(asset => (
                <article className="fr-aud-card" key={asset.id} onClick={() => setPreviewAsset(asset)}>
                  <WaveArt asset={asset} playing={playingId === asset.id} t={t} onToggle={(event) => {
                    event.stopPropagation();
                    handlePlayAudio(asset);
                  }} />
                  <div className="fr-aud-meta">
                    <div className="fr-aud-name">{asset.name}</div>
                    <div className="fr-aud-chip-row">
                      <span className="fr-aud-type-chip">{asset.type}</span>
                      <span className="fr-aud-size">{asset.format} · {asset.fileSize}</span>
                    </div>
                    <div className="fr-aud-footer">
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
                        <button className="fr-aud-card-menu-btn" type="button" aria-label="更多操作" onClick={(event) => event.stopPropagation()}>
                          <MoreVertical size={18} />
                        </button>
                      </Dropdown>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="fr-aud-empty">
              <FileAudio size={30} />
              <strong>{t('audioLib.noResults')}</strong>
              <span>{t('audioLib.noResultsHint')}</span>
            </div>
          )}
        </section>
      </div>

      <AudioPreviewModal
        asset={previewAsset}
        open={Boolean(previewAsset)}
        onClose={() => setPreviewAsset(null)}
        playing={previewAsset?.id === playingId}
        onTogglePlay={() => previewAsset && handlePlayAudio(previewAsset)}
        progress={playProgress}
        onViewTask={(asset) => {
          stopAudio();
          setTaskDetail(createAudioTaskDetail(asset, t));
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
        title={t('audioLib.deleteTitle')}
        className="fr-aud-confirm-modal"
        okText={t('imageLib.confirmDeleteBtn')}
        cancelText={t('common.cancel')}
        okButtonProps={{ danger: true }}
        onOk={() => deleteAsset && handleDeleteAsset(deleteAsset)}
        onCancel={() => setDeleteAsset(null)}
        centered
      >
        <p>{t('audioLib.confirmDeleteMsg', { name: deleteAsset?.name })}</p>
      </Modal>
    </section>
  );
}
