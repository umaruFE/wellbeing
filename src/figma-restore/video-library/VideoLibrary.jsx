import React from 'react';
import { Download, Eye, FileVideo, MoreVertical, Pause, Play, Search, Trash2, Upload as UploadIcon, Video, X } from 'lucide-react';
import { Button, Dropdown, Input, Modal, Select, Tag, Upload, message } from 'antd';
import './VideoLibrary.css';

const VIDEO_ASSETS = [
  { id: 'vid-space', name: '太空探索动画', source: 'AI生成', type: '动画片段', format: 'MP4', fileSize: '18.6 MB', duration: '0:45', ratio: '16:9', created: '2026/04/13 10:22:06', tone: 'blue', info: { videoType: '情境叙事视频', scene: '太空探索', language: 'planet / rocket / stars', spec: '16:9 · 课堂导入短片' } },
  { id: 'vid-friends', name: '动物朋友情景剧', source: 'AI生成', type: '情景剧', format: 'MP4', fileSize: '31.4 MB', duration: '1:20', ratio: '16:9', created: '2026/04/13 10:31:18', tone: 'mint', info: { videoType: '情景对话视频', scene: '动物朋友合作', language: 'Hello / Help me', spec: '16:9 · 小组讨论' } },
  { id: 'vid-fruit', name: '水果主题知识讲解', source: '课程同步', type: '知识讲解', format: 'MP4', fileSize: '42.8 MB', duration: '2:15', ratio: '16:9', created: '2026/04/12 15:42:30', tone: 'peach', info: { videoType: '知识讲解视频', scene: '水果词汇', language: 'apple / banana / orange', spec: '16:9 · 讲解素材' } },
  { id: 'vid-tpr', name: '体能闯关示范视频', source: '手动上传', type: '体能闯关', format: 'MOV', fileSize: '26.1 MB', duration: '0:58', ratio: '16:9', created: '2026/04/12 16:24:05', tone: 'cyan', info: { videoType: '动作示范视频', scene: 'TPR 体能关卡', language: 'jump / run / stop', spec: '16:9 · 示范素材' } },
];

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

function formatMediaTime(value) {
  if (!Number.isFinite(value) || value <= 0) return '00:00';
  const totalSeconds = Math.floor(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

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

function InfoRows({ rows }) {
  return (
    <div className="fr-vid-info-list">
      {rows.map(([label, value]) => (
        <div className="fr-vid-info-row" key={label}>
          <label>{label}</label>
          <span>{value}</span>
        </div>
      ))}
    </div>
  );
}

function VideoPreviewModal({ asset, open, onClose }) {
  const videoRef = React.useRef(null);
  const [progress, setProgress] = React.useState({ current: 0, duration: 0 });

  React.useEffect(() => {
    setProgress({ current: 0, duration: 0 });
  }, [asset?.id, open]);

  if (!asset) return null;
  const isAi = asset.source === 'AI生成' || asset.source === '课程同步';
  const progressPercent = progress.duration > 0 ? Math.min((progress.current / progress.duration) * 100, 100) : 0;
  const durationLabel = progress.duration > 0 ? formatMediaTime(progress.duration) : asset.duration;

  const updateProgress = () => {
    const video = videoRef.current;
    if (!video) return;
    setProgress({
      current: video.currentTime || 0,
      duration: Number.isFinite(video.duration) ? video.duration : 0,
    });
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={760}
      className="fr-vid-modal fr-vid-preview-modal"
      closeIcon={<X size={22} />}
      title={(
        <div className="fr-vid-detail-head">
          <div className="fr-vid-modal-title">{asset.name}</div>
          <div className="fr-vid-modal-tags">
            <Tag color="error">{asset.type}</Tag>
            <Tag>{asset.source}</Tag>
            <Tag>{asset.format}</Tag>
          </div>
        </div>
      )}
    >
      <div className="fr-vid-preview-body">
        <div className="fr-vid-preview-player">
          {asset.objectUrl ? (
            <video
              ref={videoRef}
              className="fr-vid-preview-video"
              src={asset.objectUrl}
              controls
              onLoadedMetadata={updateProgress}
              onTimeUpdate={updateProgress}
              onEnded={updateProgress}
            />
          ) : (
            <VideoArt asset={asset} playing={false} onToggle={() => message.info('示例素材暂无真实视频文件，请上传本地视频后播放')} />
          )}
          <div className="fr-vid-progress">
            <div className="fr-vid-time-row"><span>{formatMediaTime(progress.current)}</span><span>{durationLabel}</span></div>
            <div className="fr-vid-track"><span style={{ width: `${progressPercent}%` }} /></div>
          </div>
        </div>
        <aside className="fr-vid-preview-panel">
          <section>
            <h3>基础信息</h3>
            <InfoRows rows={[
              ['来源', asset.source],
              ['格式', asset.format],
              ['文件大小', asset.fileSize],
              ['视频比例', asset.ratio],
              ['创建时间', asset.created],
              ['时长', asset.duration],
            ]} />
          </section>
          <section>
            <h3>{isAi ? '生成信息' : '上传信息'}</h3>
            <InfoRows rows={isAi ? [
              ['视频类型', asset.info.videoType],
              ['场景', asset.info.scene],
              ['核心语言', asset.info.language],
              ['输出规格', asset.info.spec],
            ] : [
              ['上传者', 'Admin'],
              ['原文件名', `${asset.name}.${asset.format.toLowerCase()}`],
              ['文件大小', asset.fileSize],
            ]} />
          </section>
        </aside>
      </div>
      <div className="fr-vid-modal-footer">
        <Button onClick={onClose}>关闭</Button>
        <Button icon={<Download size={14} />} onClick={() => message.success('已开始下载视频')}>
          下载
        </Button>
      </div>
    </Modal>
  );
}

export function VideoLibrary() {
  const [assets, setAssets] = React.useState(VIDEO_ASSETS);
  const [search, setSearch] = React.useState('');
  const [source, setSource] = React.useState('');
  const [type, setType] = React.useState('');
  const [previewAsset, setPreviewAsset] = React.useState(null);
  const [deleteAsset, setDeleteAsset] = React.useState(null);
  const [playingId, setPlayingId] = React.useState(null);

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
      message.info('示例素材暂无真实视频文件，请上传本地视频后播放');
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
    <section className="fr-vid-lib">
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
              <Select value={source} onChange={setSource} options={sourceOptions} />
              <Select value={type} onChange={setType} options={typeOptions} />
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

      <VideoPreviewModal asset={previewAsset} open={Boolean(previewAsset)} onClose={() => setPreviewAsset(null)} />

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
