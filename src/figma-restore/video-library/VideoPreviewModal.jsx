import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Pause, Play, X } from 'lucide-react';
import { Button, Modal, Tag, message } from 'antd';

function formatMediaTime(value) {
  if (!Number.isFinite(value) || value <= 0) return '00:00';
  const totalSeconds = Math.floor(value);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function VideoArt({ asset, playing, onToggle, t }) {
  return (
    <div className={`fr-vid-frame tone-${asset.tone}`}>
      <Tag className="fr-vid-source-tag">{asset.source}</Tag>
      <span className="fr-vid-moon" />
      <span className="fr-vid-line line-a" />
      <span className="fr-vid-line line-b" />
      <span className="fr-vid-line line-c" />
      <button className="fr-vid-play" type="button" onClick={onToggle} aria-label={playing ? t('videoLib.pause') : t('videoLib.play')}>
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

function getVideoGenerationRows(asset, t) {
  if (asset.type === t('videoLib.typeDrama') || asset.type === '情景剧') {
    return [
      [t('videoLib.videoTypeLabel'), t('videoLib.dialogueVideo')],
      [t('videoLib.roleLabel'), t('videoLib.roleAnimalFriends')],
      [t('videoLib.languageGoal'), 'greeting / feeling'],
      [t('videoLib.outputSpec'), t('videoLib.specSubtitled')],
    ];
  }

  if (asset.type === t('videoLib.typeAnimation') || asset.type === '动画片段') {
    return [
      [t('videoLib.videoTypeLabel'), t('videoLib.sceneAnimation')],
      [t('videoLib.roleLabel'), t('videoLib.roleStudent')],
      [t('videoLib.languageGoal'), asset.info.language || 'planet / rocket / stars'],
      [t('videoLib.outputSpec'), t('videoLib.specIntro')],
    ];
  }

  if (asset.type === t('videoLib.typeKnowledge') || asset.type === '知识讲解') {
    return [
      [t('videoLib.videoTypeLabel'), t('videoLib.knowledgeVideo')],
      [t('videoLib.roleLabel'), t('videoLib.roleNarration')],
      [t('videoLib.languageGoal'), asset.info.language || 'apple / banana / orange'],
      [t('videoLib.outputSpec'), t('videoLib.specSubtitled')],
    ];
  }

  return [
    [t('videoLib.videoTypeLabel'), asset.info.videoType || t('videoLib.actionDemoVideo')],
    [t('videoLib.roleLabel'), asset.name.includes('体能') ? 'Poppy' : t('videoLib.roleClassroom')],
    [t('videoLib.languageGoal'), asset.info.language || 'jump / run / stop'],
    [t('videoLib.outputSpec'), asset.info.spec || `${asset.ratio} · ${asset.format}`],
  ];
}

export function VideoPreviewModal({ asset, open, onClose, onViewTask }) {
  const { t } = useTranslation();
  const videoRef = React.useRef(null);
  const [progress, setProgress] = React.useState({ current: 0, duration: 0 });

  React.useEffect(() => {
    setProgress({ current: 0, duration: 0 });
  }, [asset?.id, open]);

  if (!asset) return null;
  const isAi = asset.source === t('videoLib.sourceAi') || asset.source === t('videoLib.sourceCourse') || asset.source === 'AI生成' || asset.source === '课程同步';
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
            <VideoArt asset={asset} playing={false} t={t} onToggle={() => message.info(t('videoLib.sampleNoFile'))} />
          )}
          <div className="fr-vid-progress">
            <div className="fr-vid-time-row"><span>{formatMediaTime(progress.current)}</span><span>{durationLabel}</span></div>
            <div className="fr-vid-track"><span style={{ width: `${progressPercent}%` }} /></div>
          </div>
        </div>
        <aside className="fr-vid-preview-panel">
          <section>
            <h3>{t('imageLib.basicInfo')}</h3>
            <InfoRows rows={[
              [t('imageLib.source'), asset.source],
              [t('imageLib.format'), asset.format],
              [t('imageLib.fileSize'), asset.fileSize],
              [t('videoLib.ratioLabel'), asset.ratio],
              [t('course.createdAt'), asset.created],
              [t('audioLib.duration'), asset.duration],
            ]} />
          </section>
          <section>
            <h3>{isAi ? t('imageLib.generationInfo') : t('imageLib.uploadInfo')}</h3>
            <InfoRows rows={isAi ? getVideoGenerationRows(asset, t) : [
              [t('imageLib.uploader'), 'Admin'],
              [t('imageLib.originalFilename'), `${asset.name}.${asset.format.toLowerCase()}`],
              [t('imageLib.fileSize'), asset.fileSize],
            ]} />
          </section>
        </aside>
      </div>
      <div className="fr-vid-modal-footer">
        {onViewTask && (
          <Button onClick={() => onViewTask(asset)}>{t('imageLib.viewTask')}</Button>
        )}
        <Button onClick={onClose}>{t('common.close')}</Button>
        <Button icon={<Download size={14} />} onClick={() => message.success(t('videoLib.downloadStarted'))}>
          {t('common.download')}
        </Button>
      </div>
    </Modal>
  );
}
