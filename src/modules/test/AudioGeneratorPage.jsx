import { LocalizedText } from '../../i18n/LocalizedText.jsx';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'antd';
import { PageLoading } from '../../components/PageLoading';
import { GenerateButton, GeneratedAudioActions, GeneratorPageLayout } from './GeneratorPageLayout';
import { Music, Wand2, PenLine, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AUDIO_STYLES } from '../../constants/aiOptions';

const DURATION_OPTIONS = [15, 30, 60, 90];

export const AudioGeneratorPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id || null;
  const organizationId = user?.organizationId ?? user?.organization_id ?? null;

  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(AUDIO_STYLES[0]);
  const [duration, setDuration] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { id, url, status }
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState(null); // 音频播放器引用

  const busy = isGenerating || isPolling;

  const handleGenerate = async () => {
    if (busy || !prompt.trim() || !userId) return;
    audioRef?.pause();
    setAudioRef(null);
    setIsPlaying(false);
    setError(null);
    setIsGenerating(true);
    setResult(null);

    try {
      const res = await fetch('/api/ai/generate-audio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          count: 4,
          o3ics: selectedStyle.tags,
          duration,
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

      setResult({ id: `audio-${Date.now()}`, executionId, url: null, status: 'pending' });
      setIsGenerating(false);
      setIsPolling(true);

      // 轮询获取音频
      for (let attempt = 0; attempt < 60; attempt++) {
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await fetch(`/api/ai/generate-audio?executionId=${executionId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.status === 'completed' && statusData.results && statusData.results.length > 0) {
            // 后端已经处理了资源获取，直接使用返回的 url
            setResult(prev => ({ ...prev, url: statusData.results[0].url, status: 'done' }));
            setIsPolling(false);
            return;
          } else if (statusData.status === 'error') {
            setResult(prev => ({ ...prev, status: 'error' }));
            setIsPolling(false);
            setError(statusData.error || t('common.operationFailed'));
            return;
          }
        }
      }

      setResult(prev => ({ ...prev, status: 'error' }));
      setError(t('assetGenerator.timeout'));
    } catch (err) {
      setError(err.message || t('common.operationFailed'));
      setResult(prev => prev ? { ...prev, status: 'error' } : null);
    } finally {
      setIsGenerating(false);
      setIsPolling(false);
    }
  };

  const togglePlay = () => {
    if (!result?.url) return;

    if (isPlaying) {
      audioRef?.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef) {
        const audio = new Audio(result.url);
        audio.onended = () => setIsPlaying(false);
        setAudioRef(audio);
        audio.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.play().catch(() => setIsPlaying(false));
      }
      setIsPlaying(true);
    }
  };

  const handleDownload = (url) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audio.mp3';
    a.click();
  };

  return (
    <GeneratorPageLayout title={t('testAudioUi.212cb198ea')}>
      <div className="wb-surface-panel">
        <h2 className="wb-section-title !mb-4 flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-[var(--wb-primary)]" />
          <LocalizedText id="testAudioUi.2baf02a01e" />
        </h2>

        <div className="mb-5">
          <label htmlFor="audio-prompt" className="text-sm font-medium text-[var(--wb-muted)] mb-2 block">
            <LocalizedText id="testAudioUi.d94c4d08f7" /> <span aria-hidden="true" className="text-error">*</span>
          </label>
          <textarea
            id="audio-prompt"
            data-wb-field
            required
            disabled={busy}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={t('testAudioUi.174a16cde0')}
            rows={4}
          />
        </div>

        <fieldset className="mb-5">
          <legend className="text-sm font-medium text-[var(--wb-muted)] mb-2 block">{t('audioGenerator.style')}</legend>
          <div className="flex flex-wrap gap-2">
            {AUDIO_STYLES.map(style => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style)}
                type="button"
                data-wb-button="secondary"
                aria-pressed={selectedStyle.id === style.id}
                disabled={busy}
              >
                {t(`assetGenerator.styleOption.${style.id}`)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mb-5">
          <legend className="text-sm font-medium text-[var(--wb-muted)] mb-2 block">{t('audioGenerator.duration')}</legend>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                type="button"
                data-wb-button="secondary"
                aria-pressed={duration === d}
                disabled={busy}
              >
                {d}<LocalizedText id="videoWizard.eb6aaba1a1" />
              </button>
            ))}
          </div>
        </fieldset>

        {error && <Alert type="error" showIcon message={error} className="mb-4" />}

        <GenerateButton busy={busy} disabled={!prompt.trim() || !userId} label={t('audioGenerator.generate')} onClick={handleGenerate} />
      </div>

      {/* 生成结果 */}
      {result && result.status !== 'error' && (
        <div className="wb-surface-panel">
          <h2 className="wb-section-title !mb-4"><LocalizedText id="assetPanel.stepGenResult" /></h2>

          {result.status === 'pending' ? (
            <PageLoading label={t('testAudioUi.515b54ee2b')} />
          ) : result.status === 'done' && result.url ? (
            <div className="border border-[var(--wb-border)] rounded-[10px] p-4">
              <div className="mb-3">
                <p className="text-sm text-[var(--wb-muted)] line-clamp-3">{prompt}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-success-light text-success-active"><LocalizedText id="testAudioUi.e99b48a29b" /></span>
                  <span className="text-xs text-[var(--wb-muted)]">{t(`assetGenerator.styleOption.${selectedStyle.id}`)} · {duration}<LocalizedText id="videoWizard.eb6aaba1a1" /></span>
                </div>
              </div>
              <GeneratedAudioActions playing={isPlaying} onPlay={togglePlay} onDownload={() => handleDownload(result.url)} />
            </div>
          ) : (
            null
          )}
        </div>
      )}

      <div className="wb-surface-panel">
        <h2 className="wb-section-title !mb-4"><LocalizedText id="testAudioUi.15683f6cd3" /></h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-[var(--wb-selected)] rounded-[10px] p-4">
            <PenLine className="w-5 h-5 mx-auto mb-2 text-[var(--wb-primary)]" />
            <h3 className="font-medium text-[var(--wb-text)] text-sm mb-1"><LocalizedText id="testAudioUi.ae47ab4ccc" /></h3>
            <p className="text-xs text-[var(--wb-muted)]"><LocalizedText id="testAudioUi.e231388071" /></p>
          </div>
          <div className="bg-[var(--wb-selected)] rounded-[10px] p-4">
            <SlidersHorizontal className="w-5 h-5 mx-auto mb-2 text-[var(--wb-primary)]" />
            <h3 className="font-medium text-[var(--wb-text)] text-sm mb-1"><LocalizedText id="testAudioUi.176b8362fd" /></h3>
            <p className="text-xs text-[var(--wb-muted)]"><LocalizedText id="testAudioUi.3c72df9f41" /></p>
          </div>
          <div className="bg-[var(--wb-selected)] rounded-[10px] p-4">
            <Music className="w-5 h-5 mx-auto mb-2 text-[var(--wb-primary)]" />
            <h3 className="font-medium text-[var(--wb-text)] text-sm mb-1"><LocalizedText id="testAudioUi.2732fcd825" /></h3>
            <p className="text-xs text-[var(--wb-muted)]"><LocalizedText id="testAudioUi.9d644895f1" /></p>
          </div>
        </div>
      </div>
    </GeneratorPageLayout>
  );
};

export default AudioGeneratorPage;
