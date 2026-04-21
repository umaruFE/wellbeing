import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Wand2, Play, Pause, Download, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const VOICE_OPTIONS = [
  { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓（女声-年轻）', lang: '中文' },
  { id: 'zh-CN-YunxiNeural', name: '云希（男声-年轻）', lang: '中文' },
  { id: 'zh-CN-YunyangNeural', name: '云扬（男声-新闻）', lang: '中文' },
  { id: 'zh-CN-Xiaoyi', name: '小艺（女声）', lang: '中文' },
  { id: 'zh-CN-liaoning', name: '辽宁（男声）', lang: '东北话' },
  { id: 'zh-CN-shaanxi', name: '陕西（男声）', lang: '陕西话' },
  { id: 'zh-CN-henan', name: '河南（女声）', lang: '河南话' },
];

const SPEED_OPTIONS = [
  { id: 0.8, label: '0.8x（慢）' },
  { id: 1.0, label: '1.0x（标准）' },
  { id: 1.2, label: '1.2x（较快）' },
  { id: 1.5, label: '1.5x（快）' },
];

export const VoiceGeneratorPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || null;
  const organizationId = user?.organizationId || null;

  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0]);
  const [speed, setSpeed] = useState(SPEED_OPTIONS[1]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { id, url, status }
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState(null);

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
          voice: selectedVoice.id,
          speed: speed.id,
          user_id: userId,
          organization_id: organizationId
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '请求失败' }));
        throw new Error(err.error || '生成失败');
      }

      const data = await res.json();
      const promptId = data.promptId;

      setResult({ id: `voice-${Date.now()}`, promptId, url: null, status: 'pending' });
      setIsGenerating(false);
      setIsPolling(true);

      // 轮询获取音频
      for (let attempt = 0; attempt < 60; attempt++) {
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await fetch(`/api/ai/generate-voice?promptId=${promptId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
        });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.url) {
            setResult(prev => ({ ...prev, url: statusData.url, status: 'done' }));
            setIsPolling(false);
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
    <div className="min-h-screen bg-[#fcfbf9]">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b-2 border-[#e5e3db] sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Mic className="w-5 h-5 text-blue-600" />
            AI声音生成
          </h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* 生成表单 */}
        <div className="bg-white rounded-2xl border-2 border-[#e5e3db] shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Wand2 className="w-4 h-4 text-blue-600" />
            生成设置
          </h2>

          {/* 文字输入 */}
          <div className="mb-5">
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              文字内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="输入要转换为语音的文字内容，例如：小兔子蹦蹦跳跳地走进森林，看到一棵结满红苹果的大树……"
              rows={5}
              className="w-full border-2 border-[#e5e3db] rounded-xl px-4 py-3 text-sm resize-none
                focus:border-[#2d2d2d] focus:ring-2 focus:ring-[#2d2d2d]/10 outline-none transition-all"
            />
            <p className="text-xs text-slate-400 mt-1">{text.length} 字</p>
          </div>

          {/* 音色选择 */}
          <div className="mb-5">
            <label className="text-sm font-medium text-slate-700 mb-2 block">音色选择</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {VOICE_OPTIONS.map(voice => (
                <button
                  key={voice.id}
                  onClick={() => setSelectedVoice(voice)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200 text-left ${
                    selectedVoice.id === voice.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-[#e5e3db] text-slate-600 hover:border-[#2d2d2d]'
                  }`}
                >
                  <div className="font-medium">{voice.name}</div>
                  <div className="text-xs opacity-70">{voice.lang}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 语速选择 */}
          <div className="mb-5">
            <label className="text-sm font-medium text-slate-700 mb-2 block">语速</label>
            <div className="flex gap-2">
              {SPEED_OPTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSpeed(s)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                    speed.id === s.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-[#e5e3db] text-slate-600 hover:border-[#2d2d2d] hover:bg-[#fffbe6]'
                  }`}
                >
                  {s.label}
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
            disabled={isGenerating || !text.trim()}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700
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
                开始生成
              </>
            )}
          </button>
        </div>

        {/* 生成结果 */}
        {result && (
          <div className="bg-white rounded-2xl border-2 border-[#e5e3db] shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-800 mb-4">生成结果</h2>

            {result.status === 'pending' ? (
              <div className="flex items-center gap-3 text-slate-500">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>正在生成语音，请稍候...</span>
              </div>
            ) : result.status === 'done' && result.url ? (
              <div className="border border-[#e5e3db] rounded-xl p-4">
                <div className="mb-3">
                  <p className="text-sm text-slate-600 line-clamp-3">{text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">已完成</span>
                    <span className="text-xs text-slate-400">{selectedVoice.name} · {speed.label}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={togglePlay}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border-2 transition-colors flex items-center justify-center gap-2 ${
                      isPlaying
                        ? 'border-red-300 bg-red-50 text-red-600'
                        : 'border-[#e5e3db] text-slate-700 hover:border-[#2d2d2d]'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isPlaying ? '暂停' : '播放'}
                  </button>
                  <button
                    onClick={() => handleDownload(result.url)}
                    className="px-4 py-2 rounded-lg border-2 border-[#e5e3db] text-slate-600 hover:border-[#2d2d2d] transition-colors"
                    title="下载"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-red-500 text-sm">生成失败，请重试</div>
            )}
          </div>
        )}

        {/* 使用说明 */}
        <div className="bg-white rounded-2xl border-2 border-[#e5e3db] shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-800 mb-4">使用说明</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-2xl mb-2">✍️</div>
              <h3 className="font-medium text-slate-800 text-sm mb-1">输入文字</h3>
              <p className="text-xs text-slate-500">输入要转换为语音的文字内容</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-2xl mb-2">🎭</div>
              <h3 className="font-medium text-slate-800 text-sm mb-1">选择音色</h3>
              <p className="text-xs text-slate-500">支持多种中文音色和方言</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="text-2xl mb-2">🔊</div>
              <h3 className="font-medium text-slate-800 text-sm mb-1">播放下载</h3>
              <p className="text-xs text-slate-500">生成后可立即播放或下载使用</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceGeneratorPage;
