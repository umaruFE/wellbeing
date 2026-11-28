import { LocalizedText } from '../../i18n/LocalizedText.jsx';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'antd';
import { PageLoading } from '../../components/PageLoading';
import { GenerateButton, GeneratedAudioActions, GeneratorPageLayout } from './GeneratorPageLayout';
import { Video } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import VideoStoryboardModal from '../../components/VideoStoryboardModal';
import { AUDIO_STYLES } from '../../constants/aiOptions';

const DURATION_OPTIONS = [15, 30, 60, 90];

export const VideoGeneratorPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [videoResult, setVideoResult] = useState(null);

  // 音乐生成状态
  const [showAudioPanel, setShowAudioPanel] = useState(false);
  const [storyboardPrompts, setStoryboardPrompts] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(AUDIO_STYLES[0]);
  const [duration, setDuration] = useState(30);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPollingAudio, setIsPollingAudio] = useState(false);
  const [audioError, setAudioError] = useState(null);
  const [audioResult, setAudioResult] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioRef, setAudioRef] = useState(null);

  const userId = user?.id || null;
  const organizationId = user?.organizationId ?? user?.organization_id ?? null;

  const handleConfirm = (data) => {
    // 如果有分镜提示词，自动填充到音乐生成面板
    if (data.scenes && data.scenes.length > 0) {
      const prompts = data.scenes.map((scene, index) => 
        `${index + 1}. ${scene.prompt || scene.description || scene.text}`
      ).join('\n');
      setStoryboardPrompts(prompts);
    }
    setVideoResult({ title: data.title, count: data.scenes?.length || 0, duration: data.duration });
    setShowModal(false);
  };

  // 生成背景音乐（调用 gene-music 流程）
  const busy = isGeneratingAudio || isPollingAudio;

  const handleGenerateAudio = async () => {
    if (busy || !storyboardPrompts.trim() || !userId) return;
    audioRef?.pause();
    setAudioRef(null);
    setIsPlayingAudio(false);
    setAudioError(null);
    setIsGeneratingAudio(true);
    setAudioResult(null);

    try {
      const res = await fetch('/api/ai/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          storyboard_prompts: storyboardPrompts.trim(),
          count: 4,
          o3ics: selectedStyle.tags,
          duration,
          workflow: 'gene-music',
          user_id: userId,
          organization_id: organizationId
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: t('common.operationFailed') }));
        throw new Error(err.error || t('common.operationFailed'));
      }

      const data = await res.json();
      const executionId = data.executionId;

      setAudioResult({ id: `audio-${Date.now()}`, executionId, url: null, status: 'pending' });
      setIsGeneratingAudio(false);
      setIsPollingAudio(true);

      // 轮询获取音频
      for (let attempt = 0; attempt < 60; attempt++) {
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await fetch(`/api/ai/generate-audio?executionId=${executionId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.status === 'completed' && statusData.results && statusData.results.length > 0) {
            setAudioResult(prev => ({ ...prev, url: statusData.results[0].url, status: 'done' }));
            setIsPollingAudio(false);
            return;
          } else if (statusData.status === 'error') {
            setAudioResult(prev => ({ ...prev, status: 'error' }));
            setIsPollingAudio(false);
            setAudioError(statusData.error || t('common.operationFailed'));
            return;
          }
        }
      }

      setAudioResult(prev => ({ ...prev, status: 'error' }));
      setAudioError(t('assetGenerator.timeout'));
    } catch (err) {
      setAudioError(err.message || t('common.operationFailed'));
      setAudioResult(prev => prev ? { ...prev, status: 'error' } : null);
    } finally {
      setIsGeneratingAudio(false);
      setIsPollingAudio(false);
    }
  };

  const toggleAudioPlay = () => {
    if (!audioResult?.url) return;

    if (isPlayingAudio) {
      audioRef?.pause();
      setIsPlayingAudio(false);
    } else {
      if (!audioRef) {
        const audio = new Audio(audioResult.url);
        audio.onended = () => setIsPlayingAudio(false);
        setAudioRef(audio);
        audio.play().catch(() => setIsPlayingAudio(false));
      } else {
        audioRef.play().catch(() => setIsPlayingAudio(false));
      }
      setIsPlayingAudio(true);
    }
  };

  const handleAudioDownload = (url) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'background-music.mp3';
    a.click();
  };

  return (
    <GeneratorPageLayout title={t('testVideoUi.96e92dfb39')}>
      <section className="wb-surface-panel space-y-4">
        <p className="text-[var(--wb-muted)]">{t('testVideoUi.35cf55935e')}</p>
        <button type="button" data-wb-button="primary" aria-haspopup="dialog" disabled={!userId} onClick={() => setShowModal(true)}>
          <Video size={16} aria-hidden="true" />{t('testVideoUi.7a6fac0dc2')}
        </button>
        {videoResult && (
          <Alert
            type="success"
            showIcon
            message={t('videoStoryboard.completed')}
            description={<>{videoResult.title && <p>{videoResult.title}</p>}{t('testVideoUi.resultSummary', videoResult)}</>}
          />
        )}
        <h2 className="wb-section-title">{t('testAudioUi.15683f6cd3')}</h2>
        <ol className="list-decimal space-y-2 pl-5 text-[var(--wb-muted)]">
          {['c5a2052a40', 'bb34526bc5', 'e73fc69fd6', 'ed31514f90'].map((key) => <li key={key}>{t(`testVideoUi.${key}`)}</li>)}
        </ol>
      </section>

      <section className="wb-surface-panel space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="wb-section-title">{t('testVideoUi.e2782f101a')}</h2>
          <button type="button" data-wb-button="secondary" aria-expanded={showAudioPanel} aria-controls="video-background-music" onClick={() => setShowAudioPanel((open) => !open)}>
            {t(showAudioPanel ? 'common.collapse' : 'common.expand')}
          </button>
        </header>
        <div id="video-background-music" className="space-y-4" hidden={!showAudioPanel}>
          <div>
            <label htmlFor="background-music-prompt" className="text-sm font-medium mb-2 block">
              {t('testVideoUi.a29ea2de1e')} <span aria-hidden="true" className="text-error">*</span>
            </label>
            <textarea
              id="background-music-prompt"
              data-wb-field
              required
              disabled={busy}
              value={storyboardPrompts}
              onChange={(event) => setStoryboardPrompts(event.target.value)}
              placeholder={t('testVideoUi.b5152b46f4')}
              rows={5}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <fieldset>
              <legend className="text-sm font-medium mb-2">{t('audioGenerator.style')}</legend>
              <div className="flex flex-wrap gap-2">
                {AUDIO_STYLES.map((style) => (
                  <button type="button" data-wb-button="secondary" key={style.id} aria-pressed={selectedStyle.id === style.id} disabled={busy} onClick={() => setSelectedStyle(style)}>
                    {t(`assetGenerator.styleOption.${style.id}`)}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-medium mb-2">{t('audioGenerator.duration')}</legend>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((value) => (
                  <button type="button" data-wb-button="secondary" key={value} aria-pressed={duration === value} disabled={busy} onClick={() => setDuration(value)}>
                    {value}<LocalizedText id="videoWizard.eb6aaba1a1" />
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          {audioError && <Alert type="error" showIcon message={audioError} />}
          <GenerateButton busy={busy} disabled={!storyboardPrompts.trim() || !userId} label={t('pictureBook.aiGenerateMusic')} onClick={handleGenerateAudio} />
          {audioResult?.status === 'pending' && <PageLoading label={t('testVideoUi.515b54ee2b')} />}
          {audioResult?.status === 'done' && audioResult.url && (
            <div className="rounded-[var(--wb-control-radius)] border border-[var(--wb-border-soft)] p-4">
              <h3 className="text-base font-semibold mb-2">{t('assetPanel.stepGenResult')}</h3>
              <p className="text-sm text-[var(--wb-muted)] line-clamp-3 mb-2">{storyboardPrompts}</p>
              <p className="text-xs text-[var(--wb-muted)] mb-3">
                {t(`assetGenerator.styleOption.${selectedStyle.id}`)} · {duration}<LocalizedText id="videoWizard.eb6aaba1a1" />
              </p>
              <GeneratedAudioActions playing={isPlayingAudio} onPlay={toggleAudioPlay} onDownload={() => handleAudioDownload(audioResult.url)} />
            </div>
          )}
        </div>
      </section>
      <VideoStoryboardModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
        userId={userId}
        organizationId={organizationId}
      />
    </GeneratorPageLayout>
  );
};

export default VideoGeneratorPage;
