import React from 'react';
import { Eye, FileVideo, MoreVertical, Pause, Play, Search, Trash2, Upload as UploadIcon, Video } from 'lucide-react';
import { Button, Dropdown, Input, Modal, Select, Tag, Upload, message } from 'antd';
import apiService from '../../services/api';
import './VideoLibrary.css';
import { VideoPreviewModal } from './VideoPreviewModal';
import { TaskDetailModal } from '../TaskDetailModal';

export const VIDEO_ASSETS = [];

const sourceOptions = [
  { label: '全部来源', value: '' },
  { label: 'AI生成', value: 'AI生成' },
  { label: '课程同步', value: '课程同步' },
  { label: '手动上传', value: '手动上传' },
];

const typeOptions = [
  { label: '全部类型', value: '' },
  { label: '动画片段', value: '动画片段' },
  { label: '情景剧', value: '情景剧' },
  { label: '知识讲解', value: '知识讲解' },
  { label: '体能闯关', value: '体能闯关' },
];

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

function normalizeSource(value) {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('ai') || raw.includes('generate')) return 'AI生成';
  if (raw.includes('upload') || raw.includes('manual')) return '手动上传';
  if (raw.includes('course')) return '课程同步';
  return value || '素材库';
}

function normalizeVideoType(item = {}) {
  const raw = String(item.type || item.video_type || '').toLowerCase();
  if (raw.includes('animation') || raw.includes('动画')) return '动画片段';
  if (raw.includes('dialogue') || raw.includes('story') || raw.includes('情景')) return '情景剧';
  if (raw.includes('knowledge') || raw.includes('讲解')) return '知识讲解';
  if (raw.includes('fitness') || raw.includes('tpr') || raw.includes('体能')) return '体能闯关';
  return item.type || item.video_type || '视频素材';
}

export function normalizeVideoAsset(item = {}, index = 0) {
  const url = item.video_url || item.videoUrl || item.url || item.file_url || item.object_url;
  const format = (item.format || item.file_format || item.name?.split('.').pop() || 'MP4').toString().toUpperCase();
  const type = normalizeVideoType(item);
  const ratio = item.ratio || item.aspect_ratio || item.video_ratio || '16:9';
  return {
    id: item.id || url || `video-${Math.random().toString(36).slice(2, 10)}`,
    name: item.name || item.title || '未命名视频素材',
    source: normalizeSource(item.source || item.source_type || item.origin),
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
      scene: item.scene || item.description || item.prompt || '课堂素材',
      language: item.language || item.words || item.tags || '未标注',
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

export const createVideoTaskDetail = (asset) => ({
  type: 'video',
  title: asset.name,
  count: 'x 1 个',
  course: '视频库素材',
  status: 'done',
  statusText: '已完成',
  submit: asset.created,
  engine: `视频素材 · ${asset.format}`,
  progress: 100,
  prompt: asset.source === 'AI生成' || asset.source === '课程同步'
    ? `${asset.info.videoType}，场景 ${asset.info.scene}，核心语言 ${asset.info.language}。`
    : `手动上传视频素材：${asset.name}`,
  result: {
    url: asset.objectUrl,
  },
  spec: `${asset.duration} · ${asset.ratio} · ${asset.format}`,
  hero: asset.tone === 'blue' ? 'classroom' : asset.tone === 'mint' ? 'camp' : asset.tone === 'peach' ? 'kitchen' : 'stage',
  shots: [
    asset.info.scene || asset.name,
    asset.info.language || '课堂语言输入',
    asset.info.spec || '输出课堂视频素材',
  ],
  result: {
    url: asset.videoUrl || asset.video_url || asset.objectUrl || asset.url,
  },
  config: [
    ['视频类型', asset.info.videoType],
    ['场景', asset.info.scene],
    ['视频比例', asset.ratio],
    ['格式', asset.format],
  ],
});

function VideoArt({ asset, playing, onToggle }) {
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
          <button className="fr-vid-play" type="button" onClick={onToggle} aria-label={playing ? '暂停' : '播放'}>
            {playing ? <Pause size={30} fill="currentColor" /> : <Play size={34} fill="currentColor" />}
          </button>
          <span className="fr-vid-duration">{asset.duration}</span>
        </>
      )}
    </div>
  );
}

export function VideoLibrary({ variant, onInsertTaskAsset } = {}) {
  const [assets, setAssets] = React.useState(VIDEO_ASSETS);
  const [search, setSearch] = React.useState('');
  const [source, setSource] = React.useState('');
  const [type, setType] = React.useState('');
  const [previewAsset, setPreviewAsset] = React.useState(null);
  const [deleteAsset, setDeleteAsset] = React.useState(null);
  const [taskDetail, setTaskDetail] = React.useState(null);
  const [playingId, setPlayingId] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    apiService.getVideos({ limit: 200 })
      .then((result) => {
        if (!alive) return;
        setAssets((result.data || []).map(normalizeVideoAsset));
      })
      .catch((error) => {
        console.error('获取视频库失败:', error);
        if (alive) {
          setAssets([]);
          message.error('获取视频库失败');
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
    if (!file?.type?.startsWith('video/')) {
      message.warning('请选择视频文件');
      return Upload.LIST_IGNORE;
    }

    const format = file.name?.split('.').pop()?.toUpperCase() || 'VIDEO';
    const nextAsset = {
      id: `manual-video-${Date.now()}`,
      name: file.name?.replace(/\.[^/.]+$/, '') || '新上传视频',
      source: '手动上传',
      type: '体能闯关',
      format,
      fileSize: `${Math.max(file.size / 1024 / 1024, 0.1).toFixed(1)} MB`,
      duration: '0:30',
      ratio: '16:9',
      created: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '/'),
      tone: 'cyan',
      info: { videoType: '本地上传视频', scene: '课堂素材', language: '未标注', spec: '原始视频文件' },
      objectUrl: URL.createObjectURL(file),
    };
    setAssets(current => [nextAsset, ...current]);
    message.success('视频已上传到视频库');
    return false;
  };

  const handleDeleteAsset = (asset) => {
    setAssets(current => current.filter(item => item.id !== asset.id));
    setPreviewAsset(current => (current?.id === asset.id ? null : current));
    setDeleteAsset(null);
    if (asset.objectUrl) URL.revokeObjectURL(asset.objectUrl);
    message.success(`已删除「${asset.name}」`);
  };

  const handlePlay = (asset) => {
    if (!asset.objectUrl) {
      message.info('当前视频素材暂无可播放文件');
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
              <h1>视频库</h1>
              <p>管理 AI 生成、课程同步和手动上传的动画片段、情景剧、知识讲解素材</p>
            </div>
          </div>
          <Upload accept="video/*" beforeUpload={handleUpload} showUploadList={false}>
            <button className="fr-vid-upload-btn" type="button">
              <UploadIcon size={16} />
              上传视频
            </button>
          </Upload>
        </header>

        <section className="fr-vid-panel">
          <div className="fr-vid-toolbar">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索视频" prefix={<Search size={16} />} allowClear />
            <div className="fr-vid-filter-group">
              <Select value={source} onChange={setSource} options={sourceFilterOptions} />
              <Select value={type} onChange={setType} options={typeFilterOptions} />
            </div>
          </div>

          {filteredAssets.length > 0 ? (
            <div className="fr-vid-grid">
              {filteredAssets.map(asset => (
                <article className="fr-vid-card" key={asset.id} onClick={() => setPreviewAsset(asset)}>
                  <VideoArt asset={asset} playing={playingId === asset.id} onToggle={(event) => {
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
                            { key: 'detail', icon: <Eye size={14} />, label: '查看详情' },
                            { key: 'delete', icon: <Trash2 size={14} />, label: '删除', danger: true },
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
              <strong>没有找到匹配的视频素材</strong>
              <span>调整关键词、来源或类型后再试试。</span>
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
          setTaskDetail(createVideoTaskDetail(asset));
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
        title="删除视频素材"
        className="fr-vid-confirm-modal"
        okText="确认删除"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        onOk={() => deleteAsset && handleDeleteAsset(deleteAsset)}
        onCancel={() => setDeleteAsset(null)}
        centered
      >
        <p>确认删除「{deleteAsset?.name}」吗？删除后将从当前视频库列表移除。</p>
      </Modal>
    </section>
  );
}
