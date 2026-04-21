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
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [playingId, setPlayingId] = useState(null);
  const [audioRefs] = useState({});

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('请输入要生成音频的文字内容');
      return;
    }
    setError(null);
    setIsGenerating(true);

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

      if (!data.executionId) {
        throw new Error('未返回有效的执行ID');
      }

      const audioItem = {
        id: `audio-${Date.now()}`,
        executionId: data.executionId,
        prompt: prompt.trim(),
        url: null,
        status: 'pending'
      };
      setResults(prev => [...prev, audioItem]);

      const maxAttempts = 60;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await fetch(`/api/ai/generate-audio?executionId=${audioItem.executionId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.status === 'completed' && statusData.results && statusData.results.length > 0) {
            setResults(prev =>
              prev.map(r => r.id === audioItem.id ? { ...r, url: statusData.results[0].url, status: 'done' } : r)
            );
            break;
          } else if (statusData.status === 'error') {
            setResults(prev =>
              prev.map(r => r.id === audioItem.id ? { ...r, status: 'error' } : r)
            );
            break;
          }
        }
      }
    } catch (err) {
      setError('生成失败: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = (id, url) => {
    if (playingId === id) {
      setPlayingId(null);
      if (audioRefs[id]) {
        audioRefs[id].pause();
        audioRefs[id].currentTime = 0;
      }
    } else {
      Object.values(audioRefs).forEach(a => { if (a) { a.pause(); a.currentTime = 0; } });
      setPlayingId(id);
      if (url && !audioRefs[id]) {
        const audio = new Audio(url);
        audioRefs[id] = audio;
        audio.onended = () => setPlayingId(null);
        audio.play().catch(() => setPlayingId(null));
      } else if (audioRefs[id]) {
        audioRefs[id].play().catch(() => setPlayingId(null));
      }
    }
  };

  const handleDownload = (url) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audio.mp3';
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#fcfbf9]">
      <header className="bg-white border-b-2 border-[#e5e3db] sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="返回"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Music className="w-5 h-5 text-blue-600" />
            AI音乐生成
          </h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="bg-white rounded-2xl border-2 border-[#e5e3db] shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-blue-600" />
            生成设置
          </h2>

          <div className="mb-5">
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              文字内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="输入要转换为音乐的故事或旁白内容，例如：一棵苹果树上结满了红彤彤的苹果，小兔子蹦蹦跳跳地跑过来……"
              rows={4}
              className="w-full border-2 border-[#e5e3db] rounded-xl px-4 py-3 text-sm resize-none
                focus:border-[#2d2d2d] focus:ring-2 focus:ring-[#2d2d2d]/10 outline-none transition-all"
            />
          </div>

          <div className="mb-5">
            <label className="text-sm font-medium text-slate-700 mb-2 block">音频风格</label>
            <div className="flex flex-wrap gap-2">
              {AUDIO_STYLES.map(style => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                    selectedStyle.id === style.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-[#e5e3db] text-slate-600 hover:border-[#2d2d2d] hover:bg-[#fffbe6]'
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <label className="text-sm font-medium text-slate-700 mb-2 block">音频时长</label>
            <div className="flex gap-2">
              {DURATION_OPTIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                    duration === d
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-[#e5e3db] text-slate-600 hover:border-[#2d2d2d] hover:bg-[#fffbe6]'
                  }`}
                >
                  {d}秒
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl flex items-center gap-2">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                生成中，请稍候...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                开始生成（每次生成4条）
              </>
            )}
          </button>
        </div>

        {results.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-[#e5e3db] shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-800 mb-4">生成结果</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.slice().reverse().map(item => (
                <div
                  key={item.id}
                  className="border border-[#e5e3db] rounded-xl p-4 hover:border-[#2d2d2d] transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm text-slate-600 line-clamp-2 flex-1 mr-2">{item.prompt}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                      item.status === 'done' ? 'bg-green-100 text-green-700' :
                      item.status === 'error' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.status === 'done' ? '已完成' : item.status === 'error' ? '失败' : '生成中'}
                    </span>
                  </div>
                  {item.status === 'done' && item.url ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => togglePlay(item.id, item.url)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-colors flex items-center justify-center gap-1 ${
                          playingId === item.id
                            ? 'border-red-300 bg-red-50 text-red-600'
                            : 'border-[#e5e3db] text-slate-700 hover:border-[#2d2d2d] hover:bg-[#fffbe6]'
                        }`}
                      >
                        {playingId === item.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {playingId === item.id ? '暂停' : '播放'}
                      </button>
                      <button
                        onClick={() => handleDownload(item.url)}
                        className="px-3 py-2 rounded-lg border-2 border-[#e5e3db] text-slate-600 hover:border-[#2d2d2d] hover:bg-[#fffbe6] transition-colors"
                        title="下载"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ) : item.status === 'pending' ? (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      等待生成...
                    </div>
                  ) : (
                    <p className="text-sm text-red-500">生成失败，请重试</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border-2 border-[#e5e3db] shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4">使用说明</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-2xl mb-2">✍️</div>
              <h3 className="font-medium text-slate-800 text-sm mb-1">输入文字</h3>
              <p className="text-xs text-slate-500">输入要转换为音乐的故事或旁白内容</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-2xl mb-2">🎭</div>
              <h3 className="font-medium text-slate-800 text-sm mb-1">选择风格</h3>
              <p className="text-xs text-slate-500">选择开心、悲伤、平静等不同情绪风格</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-2xl mb-2">🎵</div>
              <h3 className="font-medium text-slate-800 text-sm mb-1">生成并使用</h3>
              <p className="text-xs text-slate-500">AI 自动生成4条音频，可直接播放或下载</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioGeneratorPage;
