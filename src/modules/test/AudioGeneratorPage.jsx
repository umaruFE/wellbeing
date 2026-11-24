import i18next from 'i18next';
import { LocalizedText } from '../../i18n/LocalizedText.jsx';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, Wand2, Play, Pause, Download, Loader2, PenLine, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { AUDIO_STYLES } from '../../constants/aiOptions';

const DURATION_OPTIONS = [15, 30, 60, 90];

export const AudioGeneratorPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || null;
  const organizationId = user?.organizationId || null;

  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(AUDIO_STYLES[0]);
  const [duration, setDuration] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { id, url, status }
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState(null); // 音频播放器引用

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('请输入要生成音频的文字内容');
      return;
    }
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
        const err = await res.json().catch(() => ({ error: '请求失败' }));
        throw new Error(err.error || '生成失败');
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
          console.log('轮询结果:', statusData);
          if (statusData.status === 'completed' && statusData.results && statusData.results.length > 0) {
            // 后端已经处理了资源获取，直接使用返回的 url
            setResult(prev => ({ ...prev, url: statusData.results[0].url, status: 'done' }));
            setIsPolling(false);
            return;
          } else if (statusData.status === 'error') {
            setResult(prev => ({ ...prev, status: 'error' }));
            setIsPolling(false);
            setError('生成失败，请重试');
            return;
          }
        }
      }

      setResult(prev => ({ ...prev, status: 'error' }));
      setError('生成超时，请重试');
    } catch (err) {
      setError('生成失败: ' + err.message);
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
    <div className="min-h-screen h-screen bg-[var(--wb-page)] overflow-y-auto">
      <header className="bg-white border-b border-[var(--wb-border)] sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 min-h-14 py-2 flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[var(--wb-page)] rounded-[10px] transition-colors min-h-10"
            title={i18next.t('common.back')}
          >
            <ArrowLeft className="w-5 h-5 text-[var(--wb-muted)]" />
          </button>
          <h1 className="text-[28px] leading-tight font-bold text-[var(--wb-text)] flex flex-wrap items-center gap-2 min-w-0">
            <Music className="w-5 h-5 text-[var(--wb-primary)]" />
            <LocalizedText id="testAudioUi.212cb198ea" />
          </h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="bg-white rounded-[14px] border border-[var(--wb-border)] shadow-none p-6">
          <h2 className="text-base font-bold text-[var(--wb-text)] mb-4 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-[var(--wb-primary)]" />
            <LocalizedText id="testAudioUi.2baf02a01e" />
          </h2>

          <div className="mb-5">
            <label className="text-sm font-medium text-[var(--wb-muted)] mb-2 block">
              <LocalizedText id="testAudioUi.d94c4d08f7" /> <span className="text-error">*</span>
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={i18next.t('testAudioUi.174a16cde0')}
              rows={4}
              className="w-full border border-[var(--wb-border)] rounded-[10px] px-4 py-3 text-sm resize-none\n                focus:border-[var(--wb-selected-border)] focus:ring-2 focus:ring-[var(--wb-selected)] outline-none transition-all"
            />
          </div>

          <div className="mb-5">
            <label className="text-sm font-medium text-[var(--wb-muted)] mb-2 block"><LocalizedText id="testAudioUi.a280d80a26" /></label>
            <div className="flex flex-wrap gap-2">
              {AUDIO_STYLES.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`px-4 py-2 rounded-[10px] text-sm font-medium border transition-all duration-200 min-h-10 ${
                    selectedStyle.id === style.id
                      ? "border-[var(--wb-selected-border)] bg-[var(--wb-selected)] text-[var(--wb-primary-hover)]"
                      : "border-[var(--wb-border)] text-[var(--wb-muted)] hover:border-[var(--wb-selected-border)] hover:bg-[var(--wb-selected)]"
                  }`}
                >
                  {t(`assetGenerator.styleOption.${style.id}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="text-sm font-medium text-[var(--wb-muted)] mb-2 block"><LocalizedText id="testAudioUi.afeeda8e62" /></label>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`px-4 py-2 rounded-[10px] text-sm font-medium border transition-all duration-200 min-h-10 ${
                    duration === d
                      ? "border-[var(--wb-selected-border)] bg-[var(--wb-selected)] text-[var(--wb-primary-hover)]"
                      : "border-[var(--wb-border)] text-[var(--wb-muted)] hover:border-[var(--wb-selected-border)] hover:bg-[var(--wb-selected)]"
                  }`}
                >
                  {d}<LocalizedText id="videoWizard.eb6aaba1a1" />
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-error-light border border-error-border text-error text-sm rounded-[10px] flex items-center gap-2">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full px-6 py-2 bg-[var(--wb-primary)] text-white rounded-[10px] font-medium hover:bg-[var(--wb-primary-hover)]\n              disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 min-h-10 active:bg-[var(--wb-primary-active)]"
          >
            {(isGenerating || isPolling) ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isGenerating ? '提交中...' : '生成中，请稍候...'}
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <LocalizedText id="workshopPage.modules.teaching-materials.paths.0.action" />
              </>
            )}
          </button>
        </div>

        {/* 生成结果 */}
        {result && (
          <div className="bg-white rounded-[14px] border border-[var(--wb-border)] shadow-none p-6">
            <h2 className="text-base font-bold text-[var(--wb-text)] mb-4"><LocalizedText id="assetPanel.stepGenResult" /></h2>

            {result.status === 'pending' ? (
              <div className="flex items-center gap-3 text-[var(--wb-muted)]">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span><LocalizedText id="testAudioUi.515b54ee2b" /></span>
              </div>
            ) : result.status === 'done' && result.url ? (
              <div className="border border-[var(--wb-border)] rounded-[10px] p-4">
                <div className="mb-3">
                  <p className="text-sm text-[var(--wb-muted)] line-clamp-3">{prompt}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-success-light text-success-active"><LocalizedText id="testAudioUi.e99b48a29b" /></span>
                    <span className="text-xs text-[var(--wb-muted)]">{t(`assetGenerator.styleOption.${selectedStyle.id}`)} · {duration}<LocalizedText id="videoWizard.eb6aaba1a1" /></span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={togglePlay}
                    className={`flex-1 px-4 py-2 rounded-[10px] text-sm font-medium border transition-colors flex items-center justify-center gap-2  min-h-10 ${
                      isPlaying
                        ? 'border-error-border bg-error-light text-error'
                        : "border-[var(--wb-border)] text-[var(--wb-muted)] hover:border-[var(--wb-selected-border)]"
                    }`}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlaying ? '暂停' : '播放'}
                  </button>
                  <button
                    onClick={() => handleDownload(result.url)}
                    className="px-4 py-2 rounded-[10px] border border-[var(--wb-border)] text-[var(--wb-muted)] hover:border-[var(--wb-selected-border)] transition-colors min-h-10"
                    title={i18next.t('common.download')}
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-error text-sm"><LocalizedText id="assetPanel.iwHelpWriteFail" /></div>
            )}
          </div>
        )}

        <div className="bg-white rounded-[14px] border border-[var(--wb-border)] shadow-none p-6">
          <h2 className="text-base font-bold text-[var(--wb-text)] mb-4"><LocalizedText id="testAudioUi.15683f6cd3" /></h2>
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
      </div>
    </div>
  );
};

export default AudioGeneratorPage;
