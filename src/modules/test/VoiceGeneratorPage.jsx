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
    <div className="min-h-screen h-screen bg-surface overflow-y-auto">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b-2 border-stroke-light sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-surface-alt rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary-secondary" />
          </button>
          <h1 className="text-lg font-bold text-primary flex items-center gap-2">
            <Mic className="w-5 h-5 text-info" />
            <LocalizedText id="testVoiceUi.8e8251a806" />
          </h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
        {/* 生成表单 */}
        <div className="bg-white rounded-2xl border-2 border-stroke-light shadow-sm p-6">
          <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-info" />
            <LocalizedText id="testVoiceUi.2baf02a01e" />
          </h2>

          {/* 文字输入 */}
          <div className="mb-5">
            <label className="text-sm font-medium text-primary-secondary mb-2 block">
              <LocalizedText id="testVoiceUi.4658611d50" /> <span className="text-error">*</span>
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={i18next.t('testVoiceUi.d2306af61e')}
              rows={5}
              className="w-full border-2 border-stroke-light rounded-xl px-4 py-3 text-sm resize-none
                focus:border-primary focus:ring-2 focus:ring-[#2d2d2d]/10 outline-none transition-all"
            />
            <p className="text-xs text-primary-placeholder mt-1">{text.length} <LocalizedText id="assetPanel.iwChars" /></p>
          </div>

          {/* 音色选择 */}
          <div className="mb-5">
            <label className="text-sm font-medium text-primary-secondary mb-2 block"><LocalizedText id="testVoiceUi.7aae6d22a0" /></label>
            <p className="text-xs text-primary-placeholder mb-3">
              <LocalizedText id="testVoiceUi.8f23564876" />
            </p>
            <div className="grid grid-cols-4 gap-2">
              {VOICE_OPTIONS.map((voice, index) => {
                const isSelected = selectedVoice.id === voice.id;
                const isPlaying = playingVoice === voice.id;
                return (
                  <div
                    key={voice.id}
                    className={`relative flex items-center justify-between p-2 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-info bg-info-light'
                        : 'border-stroke-light hover:border-primary hover:bg-warning-light'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedVoice(voice)}
                      disabled={isGenerating}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-primary-placeholder" />
                        <span className="text-xs font-medium text-primary-secondary">{t(`assetGenerator.voiceOption${index}`)}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handlePlayVoice(voice)}
                      disabled={isGenerating}
                      className="p-1 rounded hover:bg-white/50 transition-colors"
                      title={t(isPlaying ? 'voiceTest.stopPreview' : 'voiceTest.preview')}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 text-info" />
                      ) : (
                        <Play className="w-4 h-4 text-primary-placeholder hover:text-info" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-primary-placeholder mt-1">
              <LocalizedText id="lesson.selected" />{t(`assetGenerator.voiceOption${VOICE_OPTIONS.indexOf(selectedVoice)}`)} - {t(`assetGenerator.voiceDescription.${VOICE_OPTIONS.indexOf(selectedVoice)}`)}
            </p>
          </div>

          {/* 语速选择 */}
          <div className="mb-5">
            <label className="text-sm font-medium text-primary-secondary mb-2 block"><LocalizedText id="testVoiceUi.747374775d" /></label>
            <div className="flex gap-2">
              {SPEED_OPTIONS.map((s, index) => (
                <button
                  key={s.id}
                  onClick={() => setSpeed(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                    speed.id === s.id
                      ? 'border-info bg-info-light text-info-active'
                      : 'border-stroke-light text-primary-secondary hover:border-primary hover:bg-warning-light'
                  }`}
                >
                  {t(`assetGenerator.speedOption${index}`)}
                </button>
              ))}
            </div>
          </div>

          {/* 情感选择 */}
          <div className="mb-5">
            <label className="text-sm font-medium text-primary-secondary mb-2 block"><LocalizedText id="testVoiceUi.0fac799ac8" /></label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {EMOTION_OPTIONS.map(e => (
                <button
                  key={e.id}
                  onClick={() => setEmotion(e)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200 text-left ${
                    emotion.id === e.id
                      ? 'border-info bg-info-light text-info-active'
                      : 'border-stroke-light text-primary-secondary hover:border-primary hover:bg-warning-light'
                  }`}
                >
                  <div className="font-medium">{t(`assetGenerator.emotionOption.${e.id}`)}</div>
                  <div className="text-xs opacity-70">{t(`assetGenerator.emotionDescription.${e.id}`)}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-error-light border border-error-border text-error text-sm rounded-xl flex items-center gap-2">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !text.trim()}
            className="w-full px-6 py-3 bg-info text-white rounded-xl font-medium hover:bg-info-active
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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
          <div className="bg-white rounded-2xl border-2 border-stroke-light shadow-sm p-6">
            <h2 className="text-base font-bold text-primary mb-4"><LocalizedText id="assetPanel.stepGenResult" /></h2>

            {result.status === 'pending' ? (
              <div className="flex items-center gap-3 text-primary-muted">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span><LocalizedText id="testVoiceUi.7c99c36ef9" /></span>
              </div>
            ) : result.status === 'done' && result.url ? (
              <div className="border border-stroke-light rounded-xl p-4">
                <div className="mb-3">
                  <p className="text-sm text-primary-secondary line-clamp-3">{text}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-success-light text-success-active"><LocalizedText id="testVoiceUi.e99b48a29b" /></span>
                    <span className="text-xs text-primary-placeholder">{t(`assetGenerator.voiceOption${VOICE_OPTIONS.indexOf(selectedVoice)}`)} · {t(`assetGenerator.speedOption${SPEED_OPTIONS.indexOf(speed)}`)}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-info-light text-info-active">{t(`assetGenerator.emotionOption.${emotion.id}`)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={togglePlay}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors flex items-center justify-center gap-2 ${
                      isPlaying
                        ? 'border-error-border bg-error-light text-error'
                        : 'border-stroke-light text-primary-secondary hover:border-primary'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlaying ? '暂停' : '播放'}
                  </button>
                  <button
                    onClick={() => handleDownload(result.url)}
                    className="px-4 py-2 rounded-lg border-2 border-stroke-light text-primary-secondary hover:border-primary transition-colors"
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
        <div className="bg-white rounded-2xl border-2 border-stroke-light shadow-sm p-6">
          <h2 className="text-base font-bold text-primary mb-4"><LocalizedText id="testVoiceUi.15683f6cd3" /></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-info-light rounded-xl p-4">
              <div className="text-2xl mb-2">✍️</div>
              <h3 className="font-medium text-primary text-sm mb-1"><LocalizedText id="testVoiceUi.ae47ab4ccc" /></h3>
              <p className="text-xs text-primary-muted"><LocalizedText id="testVoiceUi.2b891a79ce" /></p>
            </div>
            <div className="bg-info-light rounded-xl p-4">
              <div className="text-2xl mb-2">🎭</div>
              <h3 className="font-medium text-primary text-sm mb-1"><LocalizedText id="assetPanel.stepSelectVoice" /></h3>
              <p className="text-xs text-primary-muted"><LocalizedText id="testVoiceUi.85190a1dae" /></p>
            </div>
            <div className="bg-info-light rounded-xl p-4">
              <div className="text-2xl mb-2">🔊</div>
              <h3 className="font-medium text-primary text-sm mb-1"><LocalizedText id="testVoiceUi.24b62bdac7" /></h3>
              <p className="text-xs text-primary-muted"><LocalizedText id="testVoiceUi.5eb94661bb" /></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceGeneratorPage;
