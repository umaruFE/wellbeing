import i18next from 'i18next';
import { LocalizedText } from '../../../../i18n/LocalizedText.jsx';
import React from 'react';
import { Button, Form, Input, Select, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import { History, Maximize2, Pause, Play, RotateCcw, X } from 'lucide-react';
import { PptRotationControl } from './PptRotationControl';
import '../css/PptVideoConfigPanel.css';

const getVideoSizePresets = (t) => [
  { value: 'fit', label: t('pptVideoUi.presetFit'), width: 940, height: 529 },
  { value: 'wide', label: t('pptVideoUi.presetWide'), width: 640, height: 360 },
  { value: 'vertical', label: t('pptVideoUi.presetVertical'), width: 304, height: 540 },
  { value: 'square', label: t('pptVideoUi.presetSquare'), width: 420, height: 420 },
  { value: 'pip', label: t('pptVideoUi.presetPip'), width: 260, height: 146 },
];

function VideoNumberField({ value, unit, onChange }) {
  const [draft, setDraft] = React.useState(String(value ?? ''));

  React.useEffect(() => {
    setDraft(String(value ?? ''));
  }, [value]);

  const commit = () => {
    const next = Number(draft);
    if (!Number.isFinite(next) || next < 28) {
      setDraft(String(value ?? ''));
      return;
    }
    onChange(next);
  };

  return (
    <div className="panel-number-field">
      <Input
        inputMode="numeric"
        value={draft}
        addonAfter={unit}
        style={{ width: '100%' }}
        onChange={(event) => {
          const nextDraft = event.target.value;
          setDraft(nextDraft);
          const next = Number(nextDraft);
          if (Number.isFinite(next) && next >= 28) onChange(next);
        }}
        onBlur={commit}
        onPressEnter={commit}
      />
    </div>
  );
}

export function PptVideoConfigPanel({ selectedLayer, onUpdateLayer, onSelectLayer, onFitLayer }) {
  const { t } = useTranslation();
  const videoSizePresets = getVideoSizePresets(t);
  const aspectRatio = (Number(selectedLayer.width) || 1) / (Number(selectedLayer.height) || 1);
  const [isPlaying, setIsPlaying] = React.useState(false);

  const getVideoElement = React.useCallback(() => (
    Array.from(document.querySelectorAll('video[data-ppt-video-id]'))
      .find((video) => video.dataset.pptVideoId === selectedLayer.id) || null
  ), [selectedLayer.id]);

  React.useEffect(() => {
    const video = getVideoElement();
    if (!video) {
      setIsPlaying(false);
      return undefined;
    }

    const syncPlaybackState = () => setIsPlaying(!video.paused && !video.ended);
    syncPlaybackState();
    video.addEventListener('play', syncPlaybackState);
    video.addEventListener('pause', syncPlaybackState);
    video.addEventListener('ended', syncPlaybackState);
    return () => {
      video.removeEventListener('play', syncPlaybackState);
      video.removeEventListener('pause', syncPlaybackState);
      video.removeEventListener('ended', syncPlaybackState);
    };
  }, [getVideoElement, selectedLayer.url]);

  const togglePlayback = () => {
    const video = getVideoElement();
    if (!video) return;
    if (video.paused || video.ended) {
      video.play().catch(() => setIsPlaying(false));
    } else {
      video.pause();
    }
  };

  return (
    <aside className="ppt-right ppt-video-config-panel">
      <div className="video-panel-head">
        <span><LocalizedText id="videoMat.editTitle" /></span>
        <Button
          type="text"
          className="video-panel-close"
          icon={<X size={16} />}
          onClick={() => onSelectLayer(null)}
          aria-label={i18next.t('pptVideoUi.6c14bd7f6f')}
        />
      </div>

      <Form className="video-panel-form" layout="vertical">
        <Form.Item label={i18next.t('pptVideoUi.4c619cf584')}>
          <Input
            value={selectedLayer.title || ''}
            onChange={(event) => onUpdateLayer({ title: event.target.value })}
          />
        </Form.Item>

        <div className="video-size-grid">
          <Form.Item label={i18next.t('pptVideoUi.eaa8ac23a0')} className="video-size-preset-field">
            <Select
              placeholder={i18next.t('pptVideoUi.f10d07d138')}
              value={undefined}
              options={videoSizePresets}
              onChange={(_, option) => onUpdateLayer({
                width: option.width,
                height: option.height,
              })}
            />
          </Form.Item>
          <Form.Item label={i18next.t('assetPanel.width')}>
            <VideoNumberField value={selectedLayer.width} unit="px" onChange={(width) => onUpdateLayer({
              width,
              height: Math.round(width / aspectRatio),
            })} />
          </Form.Item>
          <Form.Item label={i18next.t('pptVideoUi.b096b3f5ac')}>
            <VideoNumberField value={selectedLayer.height} unit="px" onChange={(height) => onUpdateLayer({
              width: Math.round(height * aspectRatio),
              height,
            })} />
          </Form.Item>
          <Form.Item label={i18next.t('pptVideoUi.a69e51e503')}>
            <PptRotationControl
              value={selectedLayer.rotation}
              onChange={(rotation) => onUpdateLayer({ rotation })}
            />
          </Form.Item>
        </div>

        <Button className="video-fit-canvas" icon={<Maximize2 size={15} />} onClick={onFitLayer} block>
          <LocalizedText id="pptVideoUi.c795250471" />
        </Button>

        <Button
          className={`video-playback-button ${isPlaying ? 'is-playing' : ''}`}
          icon={isPlaying ? <Pause size={16} /> : <Play size={16} />}
          onClick={togglePlayback}
          disabled={!selectedLayer.url}
          block
        >
          {isPlaying ? t('pptVideoUi.pauseVideo') : t('pptVideoUi.playVideo')}
        </Button>

        <div className="video-info-card">
          <div className="video-meta-row"><span><LocalizedText id="videoLib.videoTypeLabel" /></span><strong>{selectedLayer.videoMeta?.videoType || t('course.notSet')}</strong></div>
          <div className="video-meta-row"><span><LocalizedText id="course.duration" /></span><strong>{selectedLayer.duration || t('course.notSet')}</strong></div>
          <div className="video-meta-row"><span><LocalizedText id="pptVideoUi.c35a6afa4a" /></span><strong>{selectedLayer.videoMeta?.scene || t('course.notSet')}</strong></div>
          <div className="video-meta-row"><span><LocalizedText id="taskDetail.ipChar" /></span><strong>{selectedLayer.videoMeta?.chars || t('course.notSet')}</strong></div>

          <div className="video-stat-grid">
            <div><span><LocalizedText id="videoWizard.305c991321" /></span><strong>{selectedLayer.videoMeta?.vocab || 0}</strong></div>
            <div><span><LocalizedText id="videoWizard.ede08f1fa0" /></span><strong>{selectedLayer.videoMeta?.sents || 0}</strong></div>
          </div>
        </div>

        <div className="video-switch-list">
          <label><span><LocalizedText id="pptVideoUi.4db314d0f6" /></span><Switch checked={selectedLayer.autoplay !== false} onChange={(autoplay) => onUpdateLayer({ autoplay })} /></label>
          <label><span><LocalizedText id="taskDetail.loopPlay" /></span><Switch checked={!!selectedLayer.loop} onChange={(loop) => onUpdateLayer({ loop })} /></label>
          <label><span><LocalizedText id="pptVideoUi.2ca5437d6e" /></span><Switch checked={!!selectedLayer.muted} onChange={(muted) => onUpdateLayer({ muted })} /></label>
        </div>

        <div className="video-action-row">
          <Button icon={<History size={15} />}><LocalizedText id="pptVideoUi.6410bdf02c" /></Button>
          <Button className="video-regenerate" icon={<RotateCcw size={15} />}><LocalizedText id="pptVideoUi.2e19057052" /></Button>
        </div>
      </Form>
    </aside>
  );
}
