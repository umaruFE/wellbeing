import { LocalizedText } from '../../i18n/LocalizedText.jsx';
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'antd';
import { PageLoading } from '../../components/PageLoading';
import { GenerateButton, GeneratedAudioActions, GeneratorPageLayout } from './GeneratorPageLayout';
import { Mic, Wand2, Play, Pause, Volume2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { VOICE_OPTIONS, SPEED_OPTIONS, EMOTION_OPTIONS } from '../../constants/aiOptions';

export const VoiceGeneratorPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const userId = user?.id || null;
  const organizationId = user?.organizationId ?? user?.organization_id ?? null;

  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0]);
  const [speed, setSpeed] = useState(SPEED_OPTIONS[1]);
  const [emotion, setEmotion] = useState(EMOTION_OPTIONS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { id, url, status }
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingVoice, setPlayingVoice] = useState(null); // 当前正在播放的音色
  const [audioRef, setAudioRef] = useState(null); // 音频播放器引用
  const audioPreviewRef = useRef(null); // 试听音频播放器引用

  // 播放/停止音色试听
  const handlePlayVoice = (voice) => {
    // 如果正在播放同一个音色，则停止
    if (playingVoice === voice.id) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
      setPlayingVoice(null);
      return;
    }
    
    // 停止之前的播放
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }
    
    // 播放新的音色
    const audio = new Audio(`/src/assets/voice/${voice.file}`);
    audioPreviewRef.current = audio;
    
    const finishPreview = () => {
      if (audioPreviewRef.current !== audio) return;
      setPlayingVoice(null);
      audioPreviewRef.current = null;
    };
    audio.onended = finishPreview;
    audio.onerror = finishPreview;
    audio.play().catch(finishPreview);
    setPlayingVoice(voice.id);
  };

  const busy = isGenerating || isPolling;

  const handleGenerate = async () => {
    if (busy || !text.trim() || !userId) return;
    audioRef?.pause();
    setAudioRef(null);
    setIsPlaying(false);
    setError(null);
    setIsGenerating(true);
    setResult(null);

    try {
      const res = await fetch('/api/ai/generate-voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          text: text.trim(),
          voice_id: selectedVoice.id,
          speed: speed.id,
          emotion_prompt: emotion.emotion_prompt,
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

      setResult({ id: `voice-${Date.now()}`, executionId, url: null, status: 'pending' });
      setIsGenerating(false);
      setIsPolling(true);

      // 轮询获取音频
      for (let attempt = 0; attempt < 60; attempt++) {
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await fetch(`/api/ai/generate-voice?executionId=${executionId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.status === 'completed') {
            // 后端已经处理了 get-resource，直接使用返回的 url
            setResult(prev => ({ ...prev, url: statusData.url, status: 'done' }));
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
    a.download = 'voice.wav';
    a.click();
  };

  return (
    <GeneratorPageLayout title={t('testVoiceUi.8e8251a806')}>
      {/* 生成表单 */}
      <div className="wb-surface-panel">
        <h2 className="wb-section-title !mb-4 flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-[var(--wb-primary)]" />
          <LocalizedText id="testVoiceUi.2baf02a01e" />
        </h2>

        {/* 文字输入 */}
        <div className="mb-5">
          <label htmlFor="voice-prompt" className="text-sm font-medium text-[var(--wb-muted)] mb-2 block">
            <LocalizedText id="testVoiceUi.4658611d50" /> <span aria-hidden="true" className="text-error">*</span>
          </label>
          <textarea
            id="voice-prompt"
            data-wb-field
            required
            disabled={busy}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={t('testVoiceUi.d2306af61e')}
            rows={5}
          />
          <p className="text-xs text-[var(--wb-muted)] mt-1">{text.length} <LocalizedText id="assetPanel.iwChars" /></p>
        </div>

        {/* 音色选择 */}
        <fieldset className="mb-5">
          <legend className="text-sm font-medium text-[var(--wb-muted)] mb-2 block"><LocalizedText id="testVoiceUi.7aae6d22a0" /></legend>
          <p className="text-xs text-[var(--wb-muted)] mb-3">
            <LocalizedText id="testVoiceUi.8f23564876" />
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
            {VOICE_OPTIONS.map((voice, index) => {
              const isSelected = selectedVoice.id === voice.id;
              const isPlaying = playingVoice === voice.id;
              return (
                <div
                  key={voice.id}
                  className={`relative flex flex-wrap items-center justify-between gap-3 p-2 rounded-[10px] border transition-all ${
                    isSelected
                      ? "border-[var(--wb-selected-border)] bg-[var(--wb-selected)]"
                      : "border-[var(--wb-border)] hover:border-[var(--wb-selected-border)] hover:bg-[var(--wb-selected)]"
                  }`}
                >
                  <button
                    type="button"
                    data-wb-button="secondary"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedVoice(voice)}
                    disabled={busy}
                    className="flex-1"
                  >
                    <Volume2 size={16} aria-hidden="true" />
                    <span>{t(`assetGenerator.voiceOption${index}`)}</span>
                  </button>
                  <button
                    type="button"
                    data-wb-button="quiet"
                    data-wb-icon
                    onClick={() => handlePlayVoice(voice)}
                    disabled={busy}
                    aria-label={t(isPlaying ? 'voiceTest.stopPreview' : 'voiceTest.preview')}
                    title={t(isPlaying ? 'voiceTest.stopPreview' : 'voiceTest.preview')}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 text-[var(--wb-primary)]" />
                    ) : (
                      <Play className="w-4 h-4 text-[var(--wb-muted)] hover:text-[var(--wb-primary)]" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-[var(--wb-muted)] mt-1">
            <LocalizedText id="lesson.selected" />{t(`assetGenerator.voiceOption${VOICE_OPTIONS.indexOf(selectedVoice)}`)} - {t(`assetGenerator.voiceDescription.${VOICE_OPTIONS.indexOf(selectedVoice)}`)}
          </p>
        </fieldset>

        {/* 语速选择 */}
        <fieldset className="mb-5">
          <legend className="text-sm font-medium text-[var(--wb-muted)] mb-2 block"><LocalizedText id="testVoiceUi.747374775d" /></legend>
          <div className="flex flex-wrap gap-2">
            {SPEED_OPTIONS.map((s, index) => (
              <button
                key={s.id}
                onClick={() => setSpeed(s)}
                type="button"
                data-wb-button="secondary"
                aria-pressed={speed.id === s.id}
                disabled={busy}
              >
                {t(`assetGenerator.speedOption${index}`)}
              </button>
            ))}
          </div>
        </fieldset>

        {/* 情感选择 */}
        <fieldset className="mb-5">
          <legend className="text-sm font-medium text-[var(--wb-muted)] mb-2 block"><LocalizedText id="testVoiceUi.0fac799ac8" /></legend>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {EMOTION_OPTIONS.map(e => (
              <button
                key={e.id}
                onClick={() => setEmotion(e)}
                type="button"
                data-wb-button="secondary"
                aria-pressed={emotion.id === e.id}
                disabled={busy}
                className="flex-col"
              >
                <span>{t(`assetGenerator.emotionOption.${e.id}`)}</span>
                <small className="text-[var(--wb-muted)] leading-tight">{t(`assetGenerator.emotionDescription.${e.id}`)}</small>
              </button>
            ))}
          </div>
        </fieldset>

        {error && <Alert type="error" showIcon message={error} className="mb-4" />}

        <GenerateButton busy={busy} disabled={!text.trim() || !userId} label={t('assetGenerator.generateVoice')} onClick={handleGenerate} />
      </div>

      {/* 生成结果 */}
      {result && result.status !== 'error' && (
        <div className="wb-surface-panel">
          <h2 className="wb-section-title !mb-4"><LocalizedText id="assetPanel.stepGenResult" /></h2>

          {result.status === 'pending' ? (
            <PageLoading label={t('testVoiceUi.7c99c36ef9')} />
          ) : result.status === 'done' && result.url ? (
            <div className="border border-[var(--wb-border)] rounded-[10px] p-4">
              <div className="mb-3">
                <p className="text-sm text-[var(--wb-muted)] line-clamp-3">{text}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-success-light text-success-active"><LocalizedText id="testVoiceUi.e99b48a29b" /></span>
                  <span className="text-xs text-[var(--wb-muted)]">{t(`assetGenerator.voiceOption${VOICE_OPTIONS.indexOf(selectedVoice)}`)} · {t(`assetGenerator.speedOption${SPEED_OPTIONS.indexOf(speed)}`)}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--wb-selected)] text-[var(--wb-primary-hover)]">{t(`assetGenerator.emotionOption.${emotion.id}`)}</span>
                </div>
              </div>
              <GeneratedAudioActions playing={isPlaying} onPlay={togglePlay} onDownload={() => handleDownload(result.url)} />
            </div>
          ) : (
            null
          )}
        </div>
      )}

      {/* 使用说明 */}
      <div className="wb-surface-panel">
        <h2 className="wb-section-title !mb-4"><LocalizedText id="testVoiceUi.15683f6cd3" /></h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-[var(--wb-selected)] rounded-[10px] p-4">
            <div className="text-2xl mb-2">✍️</div>
            <h3 className="font-medium text-[var(--wb-text)] text-sm mb-1"><LocalizedText id="testVoiceUi.ae47ab4ccc" /></h3>
            <p className="text-xs text-[var(--wb-muted)]"><LocalizedText id="testVoiceUi.2b891a79ce" /></p>
          </div>
          <div className="bg-[var(--wb-selected)] rounded-[10px] p-4">
            <div className="text-2xl mb-2">🎭</div>
            <h3 className="font-medium text-[var(--wb-text)] text-sm mb-1"><LocalizedText id="assetPanel.stepSelectVoice" /></h3>
            <p className="text-xs text-[var(--wb-muted)]"><LocalizedText id="testVoiceUi.85190a1dae" /></p>
          </div>
          <div className="bg-[var(--wb-selected)] rounded-[10px] p-4">
            <div className="text-2xl mb-2">🔊</div>
            <h3 className="font-medium text-[var(--wb-text)] text-sm mb-1"><LocalizedText id="testVoiceUi.24b62bdac7" /></h3>
            <p className="text-xs text-[var(--wb-muted)]"><LocalizedText id="testVoiceUi.5eb94661bb" /></p>
          </div>
        </div>
      </div>
    </GeneratorPageLayout>
  );
};

export default VoiceGeneratorPage;
