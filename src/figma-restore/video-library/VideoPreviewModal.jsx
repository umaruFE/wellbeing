import React from 'react';
import { CirclePlus, Download, Pause, Play, X } from 'lucide-react';
import { Button, Modal, Tag, message } from 'antd';

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
      <Tag className="fr-vid-source-tag">{asset.source}</Tag>
      <span className="fr-vid-moon" />
      <span className="fr-vid-line line-a" />
      <span className="fr-vid-line line-b" />
      <span className="fr-vid-line line-c" />
      <button className="fr-vid-play" type="button" onClick={onToggle} aria-label={playing ? '暂停' : '播放'}>
        {playing ? <Pause size={30} fill="currentColor" /> : <Play size={34} fill="currentColor" />}
      </button>
      <span className="fr-vid-duration">{asset.duration}</span>
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

function getVideoGenerationRows(asset) {
  if (asset.type === '情景剧') {
    return [
      ['视频类型', '角色对话视频'],
      ['角色', '动物朋友 x2'],
      ['语言目标', 'greeting / feeling'],
      ['输出规格', '16:9 · 带字幕'],
    ];
  }

  if (asset.type === '动画片段') {
    return [
      ['视频类型', '情境动画视频'],
      ['角色', '学生角色 x1'],
      ['语言目标', asset.info.language || 'planet / rocket / stars'],
      ['输出规格', '16:9 · 课堂导入短片'],
    ];
  }

  if (asset.type === '知识讲解') {
    return [
      ['视频类型', '知识讲解视频'],
      ['角色', '旁白讲解'],
      ['语言目标', asset.info.language || 'apple / banana / orange'],
      ['输出规格', '16:9 · 带字幕'],
    ];
  }

  return [
    ['视频类型', asset.info.videoType || '动作示范视频'],
    ['角色', asset.name.includes('体能') ? 'Poppy' : '课堂角色'],
    ['语言目标', asset.info.language || 'jump / run / stop'],
    ['输出规格', asset.info.spec || `${asset.ratio} · ${asset.format}`],
  ];
}

export function VideoPreviewModal({ asset, open, onClose, onViewTask, onInsertCanvas }) {
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
            <InfoRows rows={isAi ? getVideoGenerationRows(asset) : [
              ['上传者', 'Admin'],
              ['原文件名', `${asset.name}.${asset.format.toLowerCase()}`],
              ['文件大小', asset.fileSize],
            ]} />
          </section>
        </aside>
      </div>
      <div className="fr-vid-modal-footer">
        {onViewTask && (
          <Button onClick={() => onViewTask(asset)}>查看生成任务</Button>
        )}
        <Button onClick={onClose}>关闭</Button>
        <Button icon={<Download size={14} />} onClick={() => message.success('已开始下载视频')}>
          下载
        </Button>
        {onInsertCanvas && (
          <Button className="tdm-action-primary" type="primary" icon={<CirclePlus size={15} />} onClick={() => onInsertCanvas(asset)}>
            插入画布
          </Button>
        )}
      </div>
    </Modal>
  );
}
