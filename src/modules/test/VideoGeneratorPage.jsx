import i18next from 'i18next';
import { LocalizedText } from '../../i18n/LocalizedText.jsx';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, Music, Wand2, Play, Pause, Download, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import VideoStoryboardModal from '../../components/VideoStoryboardModal';
import { AUDIO_STYLES } from '../../constants/aiOptions';

const DURATION_OPTIONS = [15, 30, 60, 90];

export const VideoGeneratorPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);

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
  const organizationId = user?.organizationId || null;

  const handleConfirm = (data) => {
    console.log('视频生成完成:', data);
    // 如果有分镜提示词，自动填充到音乐生成面板
    if (data.scenes && data.scenes.length > 0) {
      const prompts = data.scenes.map((scene, index) => 
        `${index + 1}. ${scene.prompt || scene.description || scene.text}`
      ).join('\n');
      setStoryboardPrompts(prompts);
    }
    alert(`视频「${data.title}」生成成功！\n分镜数：${data.scenes?.length || 0}\n时长：${data.duration}秒`);
    setShowModal(false);
  };

  // 生成背景音乐（调用 gene-music 流程）
  const handleGenerateAudio = async () => {
    if (!storyboardPrompts.trim()) {
      setAudioError('请输入分镜提示词或故事内容');
      return;
    }
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
        const err = await res.json().catch(() => ({ error: '请求失败' }));
        throw new Error(err.error || '生成失败');
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
          console.log('音频轮询结果:', statusData);
          if (statusData.status === 'completed' && statusData.results && statusData.results.length > 0) {
            setAudioResult(prev => ({ ...prev, url: statusData.results[0].url, status: 'done' }));
            setIsPollingAudio(false);
            return;
          } else if (statusData.status === 'error') {
            setAudioResult(prev => ({ ...prev, status: 'error' }));
            setIsPollingAudio(false);
            setAudioError('生成失败，请重试');
            return;
          }
        }
      }

      setAudioResult(prev => ({ ...prev, status: 'error' }));
      setAudioError('生成超时，请重试');
    } catch (err) {
      setAudioError('生成失败: ' + err.message);
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
    <div className="min-h-screen bg-surface-alt">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-stroke sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-surface-alt rounded-lg transition-colors"
              title={i18next.t('common.back')}
            >
              <ArrowLeft className="w-5 h-5 text-primary-secondary" />
            </button>
            <h1 className="text-lg font-bold text-primary"><LocalizedText id="testVideoUi.96e92dfb39" /></h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-primary-muted">
              {user ? user.name || user.email || '用户' : '未登录'}
            </span>
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-purple" />
              </div>
              <h1 className="text-3xl font-bold text-dark mb-4">
                <LocalizedText id="testVideoUi.ca82b1f18b" />
              </h1>
              <p className="text-primary-secondary mb-8">
                <LocalizedText id="testVideoUi.35cf55935e" />
              </p>

              <button
                onClick={() => setShowModal(true)}
                className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-3 mx-auto text-lg font-medium shadow-lg hover:shadow-xl"
              >
                <Video className="w-6 h-6" />
                <LocalizedText id="testVideoUi.7a6fac0dc2" />
              </button>
            </div>

            <div className="border-t border-stroke pt-8">
              <h2 className="text-xl font-semibold text-dark mb-4"><LocalizedText id="testVideoUi.b009db40f4" /></h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">📝</div>
                  <h3 className="font-medium text-dark mb-1"><LocalizedText id="testVideoUi.e081c961d6" /></h3>
                  <p className="text-sm text-primary-muted"><LocalizedText id="testVideoUi.3a4601d5c0" /></p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🎨</div>
                  <h3 className="font-medium text-dark mb-1"><LocalizedText id="testVideoUi.b76a04d00f" /></h3>
                  <p className="text-sm text-primary-muted"><LocalizedText id="testVideoUi.f3bc9f143f" /></p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🎬</div>
                  <h3 className="font-medium text-dark mb-1"><LocalizedText id="testVideoUi.7627c369ab" /></h3>
                  <p className="text-sm text-primary-muted"><LocalizedText id="testVideoUi.ba3e3bf27b" /></p>
                </div>
              </div>
            </div>

            <div className="border-t border-stroke pt-8 mt-8">
              <h2 className="text-xl font-semibold text-dark mb-4"><LocalizedText id="testVideoUi.51d4e3c510" /></h2>
              <ol className="space-y-3 text-primary-secondary">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple rounded-full flex items-center justify-center text-sm font-medium">1</span>
                  <span><LocalizedText id="testVideoUi.c5a2052a40" /></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple rounded-full flex items-center justify-center text-sm font-medium">2</span>
                  <span><LocalizedText id="testVideoUi.bb34526bc5" /></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple rounded-full flex items-center justify-center text-sm font-medium">3</span>
                  <span><LocalizedText id="testVideoUi.e73fc69fd6" /></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple rounded-full flex items-center justify-center text-sm font-medium">4</span>
                  <span><LocalizedText id="testVideoUi.ed31514f90" /></span>
                </li>
              </ol>
            </div>
          </div>

          {/* 背景音乐生成面板 */}
          <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark flex items-center gap-2">
                <Music className="w-5 h-5 text-info" />
                <LocalizedText id="testVideoUi.e2782f101a" />
              </h2>
              <button
                onClick={() => setShowAudioPanel(!showAudioPanel)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showAudioPanel
                    ? 'bg-info text-white'
                    : 'bg-info-light text-info-active hover:bg-info'
                }`}
              >
                {showAudioPanel ? '收起' : '展开'}
              </button>
            </div>

            {showAudioPanel && (
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-primary-secondary mb-2 block">
                    <LocalizedText id="testVideoUi.a29ea2de1e" /> <span className="text-error">*</span>
                  </label>
                  <textarea
                    value={storyboardPrompts}
                    onChange={e => setStoryboardPrompts(e.target.value)}
                    placeholder={i18next.t('testVideoUi.b5152b46f4')}
                    rows={5}
                    className="w-full border-2 border-stroke-light rounded-xl px-4 py-3 text-sm resize-none
                      focus:border-primary focus:ring-2 focus:ring-[#2d2d2d]/10 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-primary-secondary mb-2 block"><LocalizedText id="audioGenerator.style" /></label>
                    <div className="flex flex-wrap gap-2">
                      {AUDIO_STYLES.map(style => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(style)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
                            selectedStyle.id === style.id
                              ? 'border-info bg-info-light text-info-active'
                              : 'border-stroke-light text-primary-secondary hover:border-primary'
                          }`}
                        >
                          {t(`assetGenerator.styleOption.${style.id}`)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-primary-secondary mb-2 block"><LocalizedText id="testVideoUi.a31fd9daff" /></label>
                    <div className="flex gap-2">
                      {DURATION_OPTIONS.map(d => (
                        <button
                          key={d}
                          onClick={() => setDuration(d)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
                            duration === d
                              ? 'border-info bg-info-light text-info-active'
                              : 'border-stroke-light text-primary-secondary hover:border-primary'
                          }`}
                        >
                          {d}<LocalizedText id="videoWizard.eb6aaba1a1" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {audioError && (
                  <div className="p-3 bg-error-light border border-error-border text-error text-sm rounded-xl">
                    {audioError}
                  </div>
                )}

                <button
                  onClick={handleGenerateAudio}
                  disabled={isGeneratingAudio || isPollingAudio || !storyboardPrompts.trim()}
                  className="w-full px-6 py-3 bg-info text-white rounded-xl font-medium hover:bg-info-active
                    disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {(isGeneratingAudio || isPollingAudio) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isGeneratingAudio ? '提交中...' : '生成中，请稍候...'}
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <LocalizedText id="pictureBook.aiGenerateMusic" />
                    </>
                  )}
                </button>

                {/* 生成结果 */}
                {audioResult && (
                  <div className="border-2 border-stroke-light rounded-xl p-4">
                    <h3 className="text-base font-bold text-primary mb-3"><LocalizedText id="assetPanel.stepGenResult" /></h3>

                    {audioResult.status === 'pending' ? (
                      <div className="flex items-center gap-3 text-primary-muted">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span><LocalizedText id="testVideoUi.515b54ee2b" /></span>
                      </div>
                    ) : audioResult.status === 'done' && audioResult.url ? (
                      <div>
                        <div className="mb-3">
                          <p className="text-sm text-primary-secondary line-clamp-3">{storyboardPrompts}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-success-light text-success-active"><LocalizedText id="testVideoUi.e99b48a29b" /></span>
                            <span className="text-xs text-primary-placeholder">{t(`assetGenerator.styleOption.${selectedStyle.id}`)} · {duration}<LocalizedText id="videoWizard.eb6aaba1a1" /></span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={toggleAudioPlay}
                            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors flex items-center justify-center gap-2 ${
                              isPlayingAudio
                                ? 'border-error-border bg-error-light text-error'
                                : 'border-stroke-light text-primary-secondary hover:border-primary'
                            }`}
                          >
                            {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            {isPlayingAudio ? '暂停' : '播放'}
                          </button>
                          <button
                            onClick={() => handleAudioDownload(audioResult.url)}
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
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 视频生成模态框 */}
      <VideoStoryboardModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleConfirm}
        userId={userId}
        organizationId={organizationId}
      />
    </div>
  );
};

export default VideoGeneratorPage;
