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

function getAudioGenerationRows(asset, t) {
  if (asset.type === t('audioLib.typeBgm') || asset.type === 'BGM') {
    return [
      [t('audioLib.audioTypeLabel'), t('audioLib.moodBgm')],
      [t('audioLib.moodLabel'), asset.info.style || t('audioLib.moodDefault')],
      [t('audioLib.musicUse'), asset.info.theme || t('audioLib.musicUseDefault')],
      [t('audioLib.outputSpec'), `${asset.duration} · ${asset.format}`],
    ];
  }

  if (asset.type === t('audioLib.typeSong') || asset.type === '歌曲') {
    return [
      [t('audioLib.audioTypeLabel'), t('audioLib.teachingSong')],
      [t('audioLib.voice'), t('audioLib.femaleVoice')],
      [t('audioLib.speed'), t('audioLib.normal')],
      [t('audioLib.textContent'), asset.info.lyric || asset.info.theme || t('audioLib.songTextDefault')],
    ];
  }

  return [
    [t('audioLib.audioTypeLabel'), t('audioLib.readAloud')],
    [t('audioLib.voice'), t('audioLib.femaleVoice')],
    [t('audioLib.speed'), t('audioLib.normal')],
    [t('audioLib.textContent'), asset.name.includes('Jump') ? t('audioLib.physicalCueText') : (asset.info.lyric || asset.info.theme || t('audioLib.readTextDefault'))],
  ];
}

export function AudioPreviewModal({ asset, open, onClose, playing, onTogglePlay, progress, onViewTask }) {
  const { t } = useTranslation();
  if (!asset) return null;
  const isAi = asset.source === t('audioLib.sourceAi') || asset.source === 'AI生成';
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
          <WaveArt asset={asset} playing={playing} onToggle={onTogglePlay} t={t} />
          <div className="fr-aud-progress">
            <div className="fr-aud-time-row"><span>{currentLabel}</span><span>{durationLabel}</span></div>
            <div className="fr-aud-track"><span style={{ width: `${progressPercent}%` }} /></div>
          </div>
        </div>
        <aside className="fr-aud-preview-panel">
          <section>
            <h3>{t('imageLib.basicInfo')}</h3>
            <InfoRows rows={[
              [t('imageLib.source'), asset.source],
              [t('imageLib.format'), asset.format],
              [t('imageLib.fileSize'), asset.fileSize],
              [t('course.createdAt'), asset.created],
              [t('audioLib.duration'), asset.duration],
            ]} />
          </section>
          <section>
            <h3>{isAi ? t('imageLib.generationInfo') : t('imageLib.uploadInfo')}</h3>
            <InfoRows rows={isAi ? getAudioGenerationRows(asset, t) : [
              [t('imageLib.uploader'), 'Admin'],
              [t('imageLib.originalFilename'), `${asset.name}`],
              [t('imageLib.fileSize'), asset.fileSize],
            ]} />
          </section>
        </aside>
      </div>
      <div className="fr-aud-modal-footer">
        {onViewTask && (
          <Button onClick={() => onViewTask(asset)}>{t('imageLib.viewTask')}</Button>
        )}
        <Button onClick={onClose}>{t('common.close')}</Button>
        <Button icon={<Download size={14} />} onClick={() => message.success(t('audioLib.downloadStarted'))}>
          {t('common.download')}
        </Button>
      </div>
    </Modal>
  );
}
