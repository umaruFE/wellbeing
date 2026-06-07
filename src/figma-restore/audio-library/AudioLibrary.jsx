import React from 'react';
import { Eye, FileAudio, MoreVertical, Music, Pause, Play, Search, Trash2, Upload as UploadIcon } from 'lucide-react';
import { Button, Dropdown, Input, Modal, Select, Tag, Upload, message } from 'antd';
import './AudioLibrary.css';
import { AudioPreviewModal } from './AudioPreviewModal';
import { TaskDetailModal, createCanvasAssetPayload } from '../TaskDetailModal';

const AUDIO_ASSETS = [
  { id: 'aud-calm', name: '安静氛围BGM_01.mp3', source: 'AI生成', type: 'BGM', format: 'MP3', fileSize: '2.4 MB', duration: '1:00', created: '2026/04/13 10:06:30', tone: 'lavender', info: { audioType: '情绪氛围 BGM', theme: 'Quiet classroom', style: '安静 / 温暖', lyric: '无歌词' } },
  { id: 'aud-jump', name: 'Jump! Run! 体能旁白', source: 'AI生成', type: '旁白', format: 'WAV', fileSize: '5.8 MB', duration: '0:45', created: '2026/04/13 10:09:14', tone: 'mint', info: { audioType: '跟读旁白', theme: 'TPR warm-up', style: '活泼 / 清晰', lyric: 'Jump! Run! Go!' } },
  { id: 'aud-fruit', name: '水果歌 Fruit Song.mp3', source: 'AI生成', type: '歌曲', format: 'MP3', fileSize: '3.9 MB', duration: '1:30', created: '2026/04/13 10:18:42', tone: 'peach', info: { audioType: '教学歌曲', theme: 'Fruit vocabulary', style: '轻快', lyric: '水果词汇与简单句型' } },
  { id: 'aud-kitchen', name: '动物厨房口令音效', source: '手动上传', type: '旁白', format: 'AAC', fileSize: '1.8 MB', duration: '0:32', created: '2026/04/12 16:24:05', tone: 'blue', info: { audioType: '课堂口令', theme: 'Kitchen task', style: '干净 / 短促', lyric: '无歌词' } },
];

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

const createAudioTaskDetail = (asset) => ({
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
      message.info('示例素材暂无真实音频文件，请上传本地音频后播放');
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

  const handleInsertToCanvas = (asset) => {
    const task = createAudioTaskDetail(asset);
    onInsertTaskAsset?.(createCanvasAssetPayload(task));
    stopAudio();
    setPreviewAsset(null);
    setTaskDetail(null);
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
              <Select value={source} onChange={setSource} options={sourceOptions} />
              <Select value={type} onChange={setType} options={typeOptions} />
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
        onInsertCanvas={onInsertTaskAsset ? handleInsertToCanvas : null}
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
