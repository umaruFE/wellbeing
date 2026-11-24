import i18next from 'i18next';
import { LocalizedText } from '../../i18n/LocalizedText.jsx';
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Wand2, Play, Pause, Download, Loader2, Volume2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { VOICE_OPTIONS, SPEED_OPTIONS, EMOTION_OPTIONS } from '../../constants/aiOptions';

export const VoiceGeneratorPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || null;
  const organizationId = user?.organizationId || null;

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
    
    audio.onended = () => {
      setPlayingVoice(null);
      audioPreviewRef.current = null;
    };
    
    audio.onerror = () => {
      console.error('音频加载失败:', voice.file);
      setPlayingVoice(null);
      audioPreviewRef.current = null;
    };
    
    audio.play();
    setPlayingVoice(voice.id);
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('请输入要转换为语音的文字内容');
      return;
    }
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
        const err = await res.json().catch(() => ({ error: '请求失败' }));
        throw new Error(err.error || '生成失败');
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
          console.log('轮询结果:', statusData);
          if (statusData.status === 'completed') {
            // 后端已经处理了 get-resource，直接使用返回的 url
            setResult(prev => ({ ...prev, url: statusData.url, status: 'done' }));
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
    a.download = 'voice.wav';
    a.click();
  };

  return (
    <div className="min-h-screen h-screen bg-[var(--wb-page)] overflow-y-auto">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-[var(--wb-border)] sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 min-h-14 py-2 flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-[var(--wb-page)] rounded-[10px] transition-colors min-h-10"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--wb-muted)]" />
          </button>
          <h1 className="text-[28px] leading-tight font-bold text-[var(--wb-text)] flex flex-wrap items-center gap-2 min-w-0">
            <Mic className="w-5 h-5 text-[var(--wb-primary)]" />
            <LocalizedText id="testVoiceUi.8e8251a806" />
          </h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
        {/* 生成表单 */}
        <div className="bg-white rounded-[14px] border border-[var(--wb-border)] shadow-sm p-6">
          <h2 className="text-base font-bold text-[var(--wb-text)] mb-4 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-[var(--wb-primary)]" />
            <LocalizedText id="testVoiceUi.2baf02a01e" />
          </h2>

          {/* 文字输入 */}
          <div className="mb-5">
            <label className="text-sm font-medium text-[var(--wb-muted)] mb-2 block">
              <LocalizedText id="testVoiceUi.4658611d50" /> <span className="text-error">*</span>
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={i18next.t('testVoiceUi.d2306af61e')}
              rows={5}
              className="w-full border border-[var(--wb-border)] rounded-[10px] px-4 py-3 text-sm resize-none\n                focus:border-[var(--wb-selected-border)] focus:ring-2 focus:ring-[var(--wb-selected)] outline-none transition-all"
            />
            <p className="text-xs text-[var(--wb-muted)] mt-1">{text.length} <LocalizedText id="assetPanel.iwChars" /></p>
          </div>

          {/* 音色选择 */}
          <div className="mb-5">
            <label className="text-sm font-medium text-[var(--wb-muted)] mb-2 block"><LocalizedText id="testVoiceUi.7aae6d22a0" /></label>
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
                      onClick={() => setSelectedVoice(voice)}
                      disabled={isGenerating}
                      className="flex-1 text-left min-h-10"
                    >
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-[var(--wb-muted)]" />
                        <span className="text-xs font-medium text-[var(--wb-muted)]">{t(`assetGenerator.voiceOption${index}`)}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handlePlayVoice(voice)}
                      disabled={isGenerating}
                      className="p-1 rounded hover:bg-white/50 transition-colors min-h-10"
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
          </div>

          {/* 语速选择 */}
          <div className="mb-5">
            <label className="text-sm font-medium text-[var(--wb-muted)] mb-2 block"><LocalizedText id="testVoiceUi.747374775d" /></label>
            <div className="flex flex-wrap gap-2">
              {SPEED_OPTIONS.map((s, index) => (
                <button
                  key={s.id}
                  onClick={() => setSpeed(s)}
                  className={`px-4 py-2 rounded-[10px] text-sm font-medium border transition-all duration-200 min-h-10 ${
                    speed.id === s.id
                      ? "border-[var(--wb-selected-border)] bg-[var(--wb-selected)] text-[var(--wb-primary-hover)]"
                      : "border-[var(--wb-border)] text-[var(--wb-muted)] hover:border-[var(--wb-selected-border)] hover:bg-[var(--wb-selected)]"
                  }`}
                >
                  {t(`assetGenerator.speedOption${index}`)}
                </button>
              ))}
            </div>
          </div>

          {/* 情感选择 */}
          <div className="mb-5">
            <label className="text-sm font-medium text-[var(--wb-muted)] mb-2 block"><LocalizedText id="testVoiceUi.0fac799ac8" /></label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {EMOTION_OPTIONS.map(e => (
                <button
                  key={e.id}
                  onClick={() => setEmotion(e)}
                  className={`px-3 py-2 rounded-[10px] text-sm font-medium border transition-all duration-200 text-left  min-h-10 ${
                    emotion.id === e.id
                      ? "border-[var(--wb-selected-border)] bg-[var(--wb-selected)] text-[var(--wb-primary-hover)]"
                      : "border-[var(--wb-border)] text-[var(--wb-muted)] hover:border-[var(--wb-selected-border)] hover:bg-[var(--wb-selected)]"
                  }`}
                >
                  <div className="font-medium">{t(`assetGenerator.emotionOption.${e.id}`)}</div>
                  <div className="text-xs opacity-70">{t(`assetGenerator.emotionDescription.${e.id}`)}</div>
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
            disabled={isGenerating || !text.trim()}
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
          <div className="bg-white rounded-[14px] border border-[var(--wb-border)] shadow-sm p-6">
            <h2 className="text-base font-bold text-[var(--wb-text)] mb-4"><LocalizedText id="assetPanel.stepGenResult" /></h2>

            {result.status === 'pending' ? (
              <div className="flex items-center gap-3 text-[var(--wb-muted)]">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span><LocalizedText id="testVoiceUi.7c99c36ef9" /></span>
              </div>
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

        {/* 使用说明 */}
        <div className="bg-white rounded-[14px] border border-[var(--wb-border)] shadow-sm p-6">
          <h2 className="text-base font-bold text-[var(--wb-text)] mb-4"><LocalizedText id="testVoiceUi.15683f6cd3" /></h2>
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
      </div>
    </div>
  );
};

export default VoiceGeneratorPage;
