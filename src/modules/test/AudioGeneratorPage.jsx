import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, Wand2, Play, Pause, Download, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AUDIO_STYLES = [
  { id: 'happy', name: '开心', tags: 'happy, cheerful, upbeat' },
  { id: 'sad', name: '悲伤', tags: 'sad, emotional, melancholic' },
  { id: 'calm', name: '平静', tags: 'calm, peaceful, relaxing' },
  { id: 'excited', name: '兴奋', tags: 'excited, energetic, dynamic' },
  { id: 'narration', name: '旁白', tags: 'narration, clear, storytelling' },
];

const DURATION_OPTIONS = [15, 30, 60, 90];

export const AudioGeneratorPage = () => {
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
    <div className="min-h-screen h-screen bg-surface overflow-y-auto">
      <header className="bg-white border-b-2 border-stroke-light sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-surface-alt rounded-lg transition-colors"
            title="返回"
          >
            <ArrowLeft className="w-5 h-5 text-primary-secondary" />
          </button>
          <h1 className="text-lg font-bold text-primary flex items-center gap-2">
            <Music className="w-5 h-5 text-info" />
            AI音乐生成
          </h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
        <div className="bg-white rounded-2xl border-2 border-stroke-light shadow-sm p-6">
          <h2 className="text-base font-bold text-primary mb-4 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-info" />
            生成设置
          </h2>

          <div className="mb-5">
            <label className="text-sm font-medium text-primary-secondary mb-2 block">
              文字内容 <span className="text-error">*</span>
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="输入要转换为音乐的故事或旁白内容，例如：一棵苹果树上结满了红彤彤的苹果，小兔子蹦蹦跳跳地跑过来……"
              rows={4}
              className="w-full border-2 border-stroke-light rounded-xl px-4 py-3 text-sm resize-none
                focus:border-primary focus:ring-2 focus:ring-[#2d2d2d]/10 outline-none transition-all"
            />
          </div>

          <div className="mb-5">
            <label className="text-sm font-medium text-primary-secondary mb-2 block">音频风格</label>
            <div className="flex flex-wrap gap-2">
              {AUDIO_STYLES.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                    selectedStyle.id === style.id
                      ? 'border-info bg-info-light text-info-active'
                      : 'border-stroke-light text-primary-secondary hover:border-primary hover:bg-warning-light'
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="text-sm font-medium text-primary-secondary mb-2 block">音频时长</label>
            <div className="flex gap-2">
              {DURATION_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                    duration === d
                      ? 'border-info bg-info-light text-info-active'
                      : 'border-stroke-light text-primary-secondary hover:border-primary hover:bg-warning-light'
                  }`}
                >
                  {d}秒
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
            disabled={isGenerating || !prompt.trim()}
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
                开始生成（每次生成4条）
              </>
            )}
          </button>
        </div>

        {/* 生成结果 */}
        {result && (
          <div className="bg-white rounded-2xl border-2 border-stroke-light shadow-sm p-6">
            <h2 className="text-base font-bold text-primary mb-4">生成结果</h2>

            {result.status === 'pending' ? (
              <div className="flex items-center gap-3 text-primary-muted">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>正在生成音乐，请稍候...</span>
              </div>
            ) : result.status === 'done' && result.url ? (
              <div className="border border-stroke-light rounded-xl p-4">
                <div className="mb-3">
                  <p className="text-sm text-primary-secondary line-clamp-3">{prompt}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-success-light text-success-active">已完成</span>
                    <span className="text-xs text-primary-placeholder">{selectedStyle.name} · {duration}秒</span>
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

        <div className="bg-white rounded-2xl border-2 border-stroke-light shadow-sm p-6">
          <h2 className="text-base font-bold text-primary mb-4">使用说明</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-info-light rounded-xl p-4">
              <div className="text-2xl mb-2">✍️</div>
              <h3 className="font-medium text-primary text-sm mb-1">输入文字</h3>
              <p className="text-xs text-primary-muted">输入要转换为音乐的故事或旁白内容</p>
            </div>
            <div className="bg-info-light rounded-xl p-4">
              <div className="text-2xl mb-2">🎭</div>
              <h3 className="font-medium text-primary text-sm mb-1">选择风格</h3>
              <p className="text-xs text-primary-muted">选择开心、悲伤、平静等不同情绪风格</p>
            </div>
            <div className="bg-info-light rounded-xl p-4">
              <div className="text-2xl mb-2">🎵</div>
              <h3 className="font-medium text-primary text-sm mb-1">生成并使用</h3>
              <p className="text-xs text-primary-muted">AI 自动生成4条音频，可直接播放或下载</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioGeneratorPage;
