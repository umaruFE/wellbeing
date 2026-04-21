import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mic, Wand2, Play, Pause, Download, Loader2, Volume2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const VOICE_OPTIONS = [
  { id: '活力女声', name: '活力女声', file: '活力女声.flac', description: '充满活力的女性声音' },
  { id: '不羁男声', name: '不羁男声', file: '不羁男声.flac', description: '自由不羁的男性声音' },
  { id: '沉稳男声', name: '沉稳男声', file: '沉稳男声.flac', description: '沉稳有力的男性声音' },
  { id: '成熟女声', name: '成熟女声', file: '成熟女声.flac', description: '成熟优雅的女性声音' },
  { id: '聪明儿童男声', name: '聪明儿童男声', file: '聪明儿童男声.flac', description: '聪明伶俐的儿童男声' },
  { id: '淡雅女声', name: '淡雅女声', file: '淡雅女声.flac', description: '淡雅温柔的女性声音' },
  { id: '搞笑大爷', name: '搞笑大爷', file: '搞笑大爷.flac', description: '幽默风趣的老年男声' },
  { id: '可爱儿童男声', name: '可爱儿童男声', file: '可爱儿童男声.flac', description: '可爱活泼的儿童男声' },
  { id: '可爱儿童女声', name: '可爱儿童女声', file: '可爱儿童女声.flac', description: '可爱甜美的儿童女声' },
  { id: '老年女声', name: '老年女声', file: '老年女声.flac', description: '慈祥温和的老年女声' },
  { id: '少年男声', name: '少年男声', file: '少年男声.flac', description: '朝气蓬勃的少年男声' },
  { id: '甜美女声', name: '甜美女声', file: '甜美女声.flac', description: '甜美动听的女性声音' },
  { id: '温暖少女', name: '温暖少女', file: '温暖少女.flac', description: '温暖治愈的少女声音' },
  { id: '温润男声', name: '温润男声', file: '温润男声.flac', description: '温润如玉的男性声音' },
];

const SPEED_OPTIONS = [
  { id: 0.8, label: '0.8x（慢）' },
  { id: 1.0, label: '1.0x（标准）' },
  { id: 1.2, label: '1.2x（较快）' },
  { id: 1.5, label: '1.5x（快）' },
];

const EMOTION_OPTIONS = [
  { id: 'neutral', label: '中性', description: '平静自然的语气', emotion_prompt: '' },
  { id: 'cheerful', label: '愉快', description: '开心快乐的语气', emotion_prompt: '开心快乐的语气' },
  { id: 'sad', label: '悲伤', description: '低沉悲伤的语气', emotion_prompt: '低沉悲伤的语气' },
  { id: 'angry', label: '愤怒', description: '生气激动的语气', emotion_prompt: '生气激动的语气' },
  { id: 'fearful', label: '恐惧', description: '害怕紧张的语气', emotion_prompt: '害怕紧张的语气' },
  { id: 'excited', label: '兴奋', description: '激动兴奋的语气', emotion_prompt: '激动兴奋的语气' },
  { id: 'gentle', label: '温柔', description: '柔和温暖的语气', emotion_prompt: '柔和温暖的语气' },
  { id: 'serious', label: '严肃', description: '认真严肃的语气', emotion_prompt: '认真严肃的语气' },
];

export const VoiceGeneratorPage = () => {
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
    <div className="min-h-screen h-screen bg-[#fcfbf9] overflow-y-auto">
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

      <div className="max-w-4xl mx-auto p-6 space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto">
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
            <p className="text-xs text-slate-400 mb-3">
              选择视频配音的音色风格
            </p>
            <div className="grid grid-cols-4 gap-2">
              {VOICE_OPTIONS.map((voice) => {
                const isSelected = selectedVoice.id === voice.id;
                const isPlaying = playingVoice === voice.id;
                return (
                  <div
                    key={voice.id}
                    className={`relative flex items-center justify-between p-2 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-[#e5e3db] hover:border-[#2d2d2d] hover:bg-[#fffbe6]'
                    }`}
                  >
                    <button
                      onClick={() => setSelectedVoice(voice)}
                      disabled={isGenerating}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-medium text-slate-700">{voice.name}</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handlePlayVoice(voice)}
                      disabled={isGenerating}
                      className="p-1 rounded hover:bg-white/50 transition-colors"
                      title={isPlaying ? '停止播放' : '试听'}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Play className="w-4 h-4 text-slate-400 hover:text-blue-600" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              已选择：{selectedVoice.name} - {selectedVoice.description}
            </p>
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

          {/* 情感选择 */}
          <div className="mb-5">
            <label className="text-sm font-medium text-slate-700 mb-2 block">情感风格</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {EMOTION_OPTIONS.map(e => (
                <button
                  key={e.id}
                  onClick={() => setEmotion(e)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all duration-200 text-left ${
                    emotion.id === e.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-[#e5e3db] text-slate-600 hover:border-[#2d2d2d] hover:bg-[#fffbe6]'
                  }`}
                >
                  <div className="font-medium">{e.label}</div>
                  <div className="text-xs opacity-70">{e.description}</div>
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
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">已完成</span>
                    <span className="text-xs text-slate-400">{selectedVoice.name} · {speed.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{emotion.label}</span>
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
