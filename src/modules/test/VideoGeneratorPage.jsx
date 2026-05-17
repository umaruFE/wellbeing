import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, Music, Wand2, Play, Pause, Download, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import VideoStoryboardModal from '../../components/VideoStoryboardModal';

const AUDIO_STYLES = [
  { id: 'happy', name: '开心', tags: 'happy, cheerful, upbeat' },
  { id: 'sad', name: '悲伤', tags: 'sad, emotional, melancholic' },
  { id: 'calm', name: '平静', tags: 'calm, peaceful, relaxing' },
  { id: 'excited', name: '兴奋', tags: 'excited, energetic, dynamic' },
  { id: 'narration', name: '旁白', tags: 'narration, clear, storytelling' },
];

const DURATION_OPTIONS = [15, 30, 60, 90];

export const VideoGeneratorPage = () => {
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
              title="返回"
            >
              <ArrowLeft className="w-5 h-5 text-primary-secondary" />
            </button>
            <h1 className="text-lg font-bold text-primary">AI视频生成器</h1>
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
                AI视频分镜生成器
              </h1>
              <p className="text-primary-secondary mb-8">
                通过AI智能分析，一键生成分镜脚本和图片，并合成精美视频
              </p>

              <button
                onClick={() => setShowModal(true)}
                className="px-8 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-3 mx-auto text-lg font-medium shadow-lg hover:shadow-xl"
              >
                <Video className="w-6 h-6" />
                打开视频生成器
              </button>
            </div>

            <div className="border-t border-stroke pt-8">
              <h2 className="text-xl font-semibold text-dark mb-4">功能特点：</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">📝</div>
                  <h3 className="font-medium text-dark mb-1">智能分镜</h3>
                  <p className="text-sm text-primary-muted">AI自动分析故事内容，生成专业的分镜脚本</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🎨</div>
                  <h3 className="font-medium text-dark mb-1">精美图片</h3>
                  <p className="text-sm text-primary-muted">支持多种风格，生成分镜图片保持视觉一致性</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">🎬</div>
                  <h3 className="font-medium text-dark mb-1">视频合成</h3>
                  <p className="text-sm text-primary-muted">基于LTX-Video模型，生成流畅连贯的视频</p>
                </div>
              </div>
            </div>

            <div className="border-t border-stroke pt-8 mt-8">
              <h2 className="text-xl font-semibold text-dark mb-4">使用步骤：</h2>
              <ol className="space-y-3 text-primary-secondary">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple rounded-full flex items-center justify-center text-sm font-medium">1</span>
                  <span>填写故事核心要素和整体风格描述</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple rounded-full flex items-center justify-center text-sm font-medium">2</span>
                  <span>AI自动生成分镜脚本和图片</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple rounded-full flex items-center justify-center text-sm font-medium">3</span>
                  <span>预览并调整分镜图片</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple rounded-full flex items-center justify-center text-sm font-medium">4</span>
                  <span>点击生成视频，等待AI合成最终作品</span>
                </li>
              </ol>
            </div>
          </div>

          {/* 背景音乐生成面板 */}
          <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-dark flex items-center gap-2">
                <Music className="w-5 h-5 text-info" />
                背景音乐生成器
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
                    分镜提示词 <span className="text-error">*</span>
                  </label>
                  <textarea
                    value={storyboardPrompts}
                    onChange={e => setStoryboardPrompts(e.target.value)}
                    placeholder="输入分镜提示词，视频生成后会自动填充到这里，例如：
1. 阳光明媚的森林，小兔子在草地上跳跃
2. 小兔子发现了一朵美丽的花
3. 小兔子和蝴蝶一起玩耍"
                    rows={5}
                    className="w-full border-2 border-stroke-light rounded-xl px-4 py-3 text-sm resize-none
                      focus:border-primary focus:ring-2 focus:ring-[#2d2d2d]/10 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-primary-secondary mb-2 block">音乐风格</label>
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
                          {style.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-primary-secondary mb-2 block">音乐时长</label>
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
                          {d}秒
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
                      生成背景音乐
                    </>
                  )}
                </button>

                {/* 生成结果 */}
                {audioResult && (
                  <div className="border-2 border-stroke-light rounded-xl p-4">
                    <h3 className="text-base font-bold text-primary mb-3">生成结果</h3>

                    {audioResult.status === 'pending' ? (
                      <div className="flex items-center gap-3 text-primary-muted">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>正在生成音乐，请稍候...</span>
                      </div>
                    ) : audioResult.status === 'done' && audioResult.url ? (
                      <div>
                        <div className="mb-3">
                          <p className="text-sm text-primary-secondary line-clamp-3">{storyboardPrompts}</p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-success-light text-success-active">已完成</span>
                            <span className="text-xs text-primary-placeholder">{selectedStyle.name} · {duration}秒</span>
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
                            title="下载"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-error text-sm">生成失败，请重试</div>
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
