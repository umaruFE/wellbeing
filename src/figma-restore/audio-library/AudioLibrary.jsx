import React from 'react';
import { Eye, FileAudio, MoreVertical, Music, Pause, Play, Search, Trash2, Upload as UploadIcon } from 'lucide-react';
import { Button, Dropdown, Input, Modal, Select, Tag, Upload, message } from 'antd';
import apiService from '../../services/api';
import './AudioLibrary.css';
import { AudioPreviewModal } from './AudioPreviewModal';
import { TaskDetailModal } from '../TaskDetailModal';

export const AUDIO_ASSETS = [];

const sourceOptions = [
  { label: '全部来源', value: '' },
  { label: 'AI生成', value: 'AI生成' },
  { label: '手动上传', value: '手动上传' },
];

const typeOptions = [
  { label: '全部类型', value: '' },
  { label: 'BGM', value: 'BGM' },
  { label: '旁白', value: '旁白' },
  { label: '歌曲', value: '歌曲' },
  { label: '音效', value: '音效' },
];

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

function normalizeSource(value) {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('ai') || raw.includes('generate')) return 'AI生成';
  if (raw.includes('upload') || raw.includes('manual')) return '手动上传';
  if (raw.includes('course')) return '课程同步';
  return value || '素材库';
}

function normalizeAudioType(item = {}) {
  const raw = String(item.type || item.audio_type || item.voice_type || '').toLowerCase();
  if (raw.includes('bgm') || raw.includes('music')) return 'BGM';
  if (raw.includes('song')) return '歌曲';
  if (raw.includes('effect')) return '音效';
  return item.type || item.audio_type || '旁白';
}

export function normalizeAudioAsset(item = {}, index = 0) {
  const url = item.audio_url || item.audioUrl || item.url || item.file_url || item.object_url;
  const format = (item.format || item.file_format || item.name?.split('.').pop() || item.voice_type || 'AUDIO').toString().toUpperCase();
  const type = normalizeAudioType(item);
  return {
    id: item.id || url || `audio-${Math.random().toString(36).slice(2, 10)}`,
    name: item.name || item.title || item.voice_name || '未命名音频素材',
    source: normalizeSource(item.source || item.source_type || item.origin),
    type,
    format,
    fileSize: formatFileSize(item.file_size || item.size),
    duration: normalizeDuration(item.duration),
    created: formatDateTime(item.created_at || item.createdAt || item.created),
    tone: item.tone || tonePalette[index % tonePalette.length],
    objectUrl: url,
    info: {
      audioType: item.audio_type || item.voice_type || type,
      theme: item.theme || item.description || item.prompt || '课堂素材',
      style: item.style || item.emotion || item.mood || '未标注',
      lyric: item.lyric || item.lyrics || item.text || '无歌词',
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

export const createAudioTaskDetail = (asset) => ({
  type: 'audio',
  title: asset.name,
  count: 'x 1 首',
  course: '音频库素材',
  status: 'done',
  statusText: '已完成',
  submit: asset.created,
  engine: `音频素材 · ${asset.format}`,
  progress: 100,
  prompt: asset.source === 'AI生成'
    ? `${asset.info.audioType}，主题 ${asset.info.theme}，风格 ${asset.info.style}。`
    : `手动上传音频素材：${asset.name}`,
  result: {
    url: asset.objectUrl,
  },
  spec: `${asset.duration} · ${asset.format} · ${asset.fileSize}`,
  tracks: [asset.name],
  config: [
    ['音频类型', asset.info.audioType],
    ['主题', asset.info.theme],
    ['风格', asset.info.style],
    ['格式', asset.format],
  ],
});

function WaveArt({ asset, playing, onToggle }) {
  return (
    <div className={`fr-aud-wave tone-${asset.tone}`}>
      <Tag className="fr-aud-source-tag">{asset.source}</Tag>
      <div className="fr-aud-bars" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, index) => (
          <span key={index} style={{ height: `${30 + ((index * 17) % 54)}px` }} />
        ))}
      </div>
      <button className="fr-aud-play" type="button" onClick={onToggle} aria-label={playing ? '暂停' : '播放'}>
        {playing ? <Pause size={30} fill="currentColor" /> : <Play size={34} fill="currentColor" />}
      </button>
      <span className="fr-aud-duration">{asset.duration}</span>
    </div>
  );
}

export function AudioLibrary({ variant, onInsertTaskAsset } = {}) {
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

  React.useEffect(() => {
    let alive = true;
    apiService.getVoiceConfigs()
      .then((result) => {
        if (!alive) return;
        setAssets((result.data || []).map(normalizeAudioAsset));
      })
      .catch((error) => {
        console.error('获取音频库失败:', error);
        if (alive) {
          setAssets([]);
          message.error('获取音频库失败');
        }
      });
    return () => {
      alive = false;
    };
  }, []);

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
      message.warning('请选择音频文件');
      return Upload.LIST_IGNORE;
    }

    const format = file.name?.split('.').pop()?.toUpperCase() || 'AUDIO';
    const nextAsset = {
      id: `manual-audio-${Date.now()}`,
      name: file.name || '新上传音频',
      source: '手动上传',
      type: '旁白',
      format,
      fileSize: `${Math.max(file.size / 1024 / 1024, 0.1).toFixed(1)} MB`,
      duration: '0:30',
      created: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '/'),
      tone: 'blue',
      info: { audioType: '本地上传音频', theme: '课堂素材', style: '未标注', lyric: '无歌词' },
      objectUrl: URL.createObjectURL(file),
    };
    setAssets(current => [nextAsset, ...current]);
    message.success('音频已上传到音频库');
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
      message.info('当前音频素材暂无可播放文件');
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
        message.warning('音频播放失败，请检查文件格式');
      });
  }, [playingId, stopAudio]);

  React.useEffect(() => stopAudio, [stopAudio]);

  const handleDeleteAsset = (asset) => {
    setAssets(current => current.filter(item => item.id !== asset.id));
    setPreviewAsset(current => (current?.id === asset.id ? null : current));
    setDeleteAsset(null);
    if (playingId === asset.id) stopAudio();
    if (asset.objectUrl) URL.revokeObjectURL(asset.objectUrl);
    message.success(`已删除「${asset.name}」`);
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
              <h1>音频库</h1>
              <p>管理 AI 生成、课程同步和手动上传的 BGM、旁白、歌曲素材</p>
            </div>
          </div>
          <Upload accept="audio/*" beforeUpload={handleUpload} showUploadList={false}>
            <button className="fr-aud-upload-btn" type="button">
              <UploadIcon size={16} />
              上传音频
            </button>
          </Upload>
        </header>

        <section className="fr-aud-panel">
          <div className="fr-aud-toolbar">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索音频"
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
                  <WaveArt asset={asset} playing={playingId === asset.id} onToggle={(event) => {
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
                            { key: 'detail', icon: <Eye size={14} />, label: '查看详情' },
                            { key: 'delete', icon: <Trash2 size={14} />, label: '删除', danger: true },
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
              <strong>没有找到匹配的音频素材</strong>
              <span>调整关键词、来源或类型后再试试。</span>
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
          setTaskDetail(createAudioTaskDetail(asset));
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
        title="删除音频素材"
        className="fr-aud-confirm-modal"
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        onOk={() => deleteAsset && handleDeleteAsset(deleteAsset)}
        onCancel={() => setDeleteAsset(null)}
        centered
      >
        <p>确认删除「{deleteAsset?.name}」吗？删除后将从当前音频库列表移除。</p>
      </Modal>
    </section>
  );
}
