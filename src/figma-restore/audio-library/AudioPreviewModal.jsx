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

function InfoRows({ rows }) {
  return (
    <div className="fr-aud-info-list">
      {rows.map(([label, value]) => (
        <div className="fr-aud-info-row" key={label}>
          <label>{label}</label>
          <span>{value}</span>
        </div>
      ))}
    </div>
  );
}

function getAudioGenerationRows(asset) {
  if (asset.type === 'BGM') {
    return [
      ['音频类型', '情绪氛围BGM'],
      ['情绪氛围', asset.info.style || '安静 / 温暖'],
      ['音乐用途', asset.info.theme || '故事开场与任务过渡'],
      ['输出规格', `${asset.duration} · ${asset.format}`],
    ];
  }

  if (asset.type === '歌曲') {
    return [
      ['音频类型', '教学歌曲'],
      ['音色', '女声'],
      ['语速', '正常'],
      ['文本', asset.info.lyric || asset.info.theme || '课堂歌曲文本'],
    ];
  }

  return [
    ['音频类型', '跟读朗读'],
    ['音色', '女声'],
    ['语速', '正常'],
    ['文本', asset.name.includes('Jump') ? '体能闯关口令与动作提示' : (asset.info.lyric || asset.info.theme || '课堂朗读文本')],
  ];
}

export function AudioPreviewModal({ asset, open, onClose, playing, onTogglePlay, progress, onViewTask, onInsertCanvas }) {
  if (!asset) return null;
  const isAi = asset.source === 'AI生成';
  const isCurrentAsset = progress.assetId === asset.id;
  const activeDuration = isCurrentAsset ? progress.duration : 0;
  const progressPercent = activeDuration > 0 ? Math.min((progress.current / activeDuration) * 100, 100) : 0;
  const currentLabel = isCurrentAsset ? formatMediaTime(progress.current) : '00:00';
  const durationLabel = activeDuration > 0 ? formatMediaTime(activeDuration) : asset.duration;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={760}
      className="fr-aud-modal fr-aud-preview-modal"
      closeIcon={<X size={22} />}
      title={(
        <div className="fr-aud-detail-head">
          <div className="fr-aud-modal-title">{asset.name}</div>
          <div className="fr-aud-modal-tags">
            <Tag color="error">{asset.type}</Tag>
            <Tag>{asset.source}</Tag>
            <Tag>{asset.format}</Tag>
          </div>
        </div>
      )}
    >
      <div className="fr-aud-preview-body">
        <div className="fr-aud-preview-player">
          <WaveArt asset={asset} playing={playing} onToggle={onTogglePlay} />
          <div className="fr-aud-progress">
            <div className="fr-aud-time-row"><span>{currentLabel}</span><span>{durationLabel}</span></div>
            <div className="fr-aud-track"><span style={{ width: `${progressPercent}%` }} /></div>
          </div>
        </div>
        <aside className="fr-aud-preview-panel">
          <section>
            <h3>基础信息</h3>
            <InfoRows rows={[
              ['来源', asset.source],
              ['格式', asset.format],
              ['文件大小', asset.fileSize],
              ['创建时间', asset.created],
              ['时长', asset.duration],
            ]} />
          </section>
          <section>
            <h3>{isAi ? '生成信息' : '上传信息'}</h3>
            <InfoRows rows={isAi ? getAudioGenerationRows(asset) : [
              ['上传者', 'Admin'],
              ['原文件名', `${asset.name}`],
              ['文件大小', asset.fileSize],
            ]} />
          </section>
        </aside>
      </div>
      <div className="fr-aud-modal-footer">
        {onViewTask && (
          <Button onClick={() => onViewTask(asset)}>查看生成任务</Button>
        )}
        <Button onClick={onClose}>关闭</Button>
        <Button icon={<Download size={14} />} onClick={() => message.success('已开始下载音频')}>
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
