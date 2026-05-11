import React, { useState } from 'react';
import { X, Loader2, Play, Pause, Download, Volume2, Music, Mic, Image, Wand2 } from 'lucide-react';
import { IPSceneGenerator } from './IPSceneGenerator';
import IPCharacterGenerator from './IPCharacterGenerator';
import { VideoStoryboardModal } from './VideoStoryboardModal';

const AIImagePanel = ({ onGenerated, userId, organizationId }) => {
  const [prompt, setPrompt] = useState('');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError('请输入图片描述'); return; }
    setError(null);
    setIsGenerating(true);
    setProgress('正在提交生成请求...');

    try {
      const response = await fetch('/api/ai/free-image-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          width: width,
          height: height,
          user_id: userId,
          organization_id: organizationId
        })
      });

      const result = await response.json();
      if (!result.success || !result.tasks || result.tasks.length === 0) {
        throw new Error(result.error || '图片生成请求失败');
      }

      const taskId = result.tasks[0].promptId;
      const apiUrl = result.tasks[0].apiUrl;
      setProgress('图片生成中，请稍候...');

      let generatedUrl = null;
      for (let attempt = 0; attempt < 60; attempt++) {
        await new Promise(r => setTimeout(r, 3000));
        const statusUrl = `/api/ai/task-status/${taskId}?useComfyUI=true${apiUrl ? `&apiUrl=${encodeURIComponent(apiUrl)}` : ''}`;
        const statusRes = await fetch(statusUrl);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.status === 'completed' && statusData.url) {
            generatedUrl = statusData.url;
            break;
          } else if (statusData.status === 'error') {
            throw new Error(statusData.error || '图片生成失败');
          }
        }
        setProgress(`图片生成中... (${attempt + 1})`);
      }

      if (generatedUrl) {
        onGenerated({ type: 'image', url: generatedUrl, title: `AI生图 - ${prompt.substring(0, 15)}...` });
      } else {
        throw new Error('图片生成超时');
      }
    } catch (err) {
      setError(err.message || '图片生成失败');
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
        <Wand2 className="w-5 h-5 text-blue-500" /> AI 生图
      </h3>
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="描述你想要生成的图片，例如：&#10;一棵开满彩色苹果的魔法树，树下有藤编篮子，童话风格"
        rows={4}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400"
      />
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">宽度 (px)</label>
          <input
            type="number"
            value={width}
            onChange={e => setWidth(Number(e.target.value))}
            min={256}
            max={4096}
            step={64}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">高度 (px)</label>
          <input
            type="number"
            value={height}
            onChange={e => setHeight(Number(e.target.value))}
            min={256}
            max={4096}
            step={64}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-400"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {progress && (
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Loader2 size={12} className="animate-spin" /> {progress}
        </p>
      )}
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt.trim()}
        className="w-full py-2.5 rounded-lg text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ backgroundColor: '#4482E5' }}
      >
        {isGenerating ? (
          <><Loader2 size={16} className="animate-spin" /> 生成中...</>
        ) : (
          <><Wand2 size={16} /> 生成图片</>
        )}
      </button>
    </div>
  );
};

const VOICE_OPTIONS = [
  { id: '活力女声', name: '活力女声', description: '充满活力的女性声音' },
  { id: '不羁男声', name: '不羁男声', description: '自由不羁的男性声音' },
  { id: '沉稳男声', name: '沉稳男声', description: '沉稳有力的男性声音' },
  { id: '成熟女声', name: '成熟女声', description: '成熟优雅的女性声音' },
  { id: '聪明儿童男声', name: '聪明儿童男声', description: '聪明伶俐的儿童男声' },
  { id: '淡雅女声', name: '淡雅女声', description: '淡雅温柔的女性声音' },
  { id: '可爱儿童男声', name: '可爱儿童男声', description: '可爱活泼的儿童男声' },
  { id: '可爱儿童女声', name: '可爱儿童女声', description: '可爱甜美的儿童女声' },
  { id: '甜美女声', name: '甜美女声', description: '甜美动听的女性声音' },
  { id: '温暖少女', name: '温暖少女', description: '温暖治愈的少女声音' },
  { id: '温润男声', name: '温润男声', description: '温润如玉的男性声音' },
];

const SPEED_OPTIONS = [
  { id: 0.8, label: '0.8x（慢）' },
  { id: 1.0, label: '1.0x（标准）' },
  { id: 1.2, label: '1.2x（较快）' },
  { id: 1.5, label: '1.5x（快）' },
];

const EMOTION_OPTIONS = [
  { id: 'neutral', label: '中性', emotion_prompt: '' },
  { id: 'cheerful', label: '愉快', emotion_prompt: '开心快乐的语气' },
  { id: 'sad', label: '悲伤', emotion_prompt: '低沉悲伤的语气' },
  { id: 'angry', label: '愤怒', emotion_prompt: '生气激动的语气' },
  { id: 'excited', label: '兴奋', emotion_prompt: '激动兴奋的语气' },
  { id: 'gentle', label: '温柔', emotion_prompt: '柔和温暖的语气' },
];

const AUDIO_STYLES = [
  { id: 'happy', name: '开心', tags: 'happy, cheerful, upbeat' },
  { id: 'sad', name: '悲伤', tags: 'sad, emotional, melancholic' },
  { id: 'calm', name: '平静', tags: 'calm, peaceful, relaxing' },
  { id: 'excited', name: '兴奋', tags: 'excited, energetic, dynamic' },
  { id: 'narration', name: '旁白', tags: 'narration, clear, storytelling' },
];

const DURATION_OPTIONS = [15, 30, 60, 90];

const ImageTypeSelector = ({ onSelect }) => (
  <div className="space-y-4">
    <h3 className="text-base font-bold text-gray-800">选择图片生成方式</h3>
    <div className="grid grid-cols-3 gap-3">
      <button
        onClick={() => onSelect('ai')}
        className="p-5 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <Wand2 className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-bold text-sm text-gray-800">AI 生图</span>
        </div>
        <p className="text-[11px] text-gray-500">输入提示词生成图片</p>
      </button>
      <button
        onClick={() => onSelect('ip')}
        className="p-5 border-2 border-gray-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all text-left"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <Image className="w-4 h-4 text-purple-600" />
          </div>
          <span className="font-bold text-sm text-gray-800">IP 场景</span>
        </div>
        <p className="text-[11px] text-gray-500">选角色生成场景图</p>
      </button>
      <button
        onClick={() => onSelect('ip-character')}
        className="p-5 border-2 border-gray-200 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all text-left"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
            <Image className="w-4 h-4 text-orange-600" />
          </div>
          <span className="font-bold text-sm text-gray-800">IP 人物</span>
        </div>
        <p className="text-[11px] text-gray-500">生成单个人物图</p>
      </button>
    </div>
  </div>
);

const VoiceGeneratorPanel = ({ onGenerated, userId, organizationId }) => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(VOICE_OPTIONS[0]);
  const [speed, setSpeed] = useState(SPEED_OPTIONS[1]);
  const [emotion, setEmotion] = useState(EMOTION_OPTIONS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!text.trim()) { setError('请输入文字内容'); return; }
    setError(null);
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text.trim(),
          voice_id: selectedVoice.id,
          speed: speed.id,
          emotion_prompt: emotion.emotion_prompt,
          user_id: userId,
          organization_id: organizationId
        })
      });
      if (!res.ok) throw new Error('生成失败');
      const data = await res.json();
      const executionId = data.executionId;
      for (let attempt = 0; attempt < 60; attempt++) {
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await fetch(`/api/ai/generate-voice?executionId=${executionId}`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.status === 'completed' && statusData.url) {
            onGenerated({ type: 'audio', url: statusData.url, title: `语音 - ${selectedVoice.name}` });
            setIsGenerating(false);
            return;
          } else if (statusData.status === 'error') {
            throw new Error('生成失败');
          }
        }
      }
      throw new Error('生成超时');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
        <Mic className="w-5 h-5 text-blue-500" /> 声音生成
      </h3>
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder="输入要转换为语音的文字内容..." rows={4}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-400" />
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-2">音色</label>
        <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto">
          {VOICE_OPTIONS.map(v => (
            <button key={v.id} onClick={() => setSelectedVoice(v)}
              className={`px-2 py-1.5 rounded text-[11px] font-medium border transition-all ${selectedVoice.id === v.id ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {v.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 block mb-2">语速</label>
          <div className="flex gap-1">
            {SPEED_OPTIONS.map(s => (
              <button key={s.id} onClick={() => setSpeed(s)}
                className={`flex-1 px-2 py-1 rounded text-[11px] font-medium border transition-all ${speed.id === s.id ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-500 block mb-2">情感</label>
          <div className="flex flex-wrap gap-1">
            {EMOTION_OPTIONS.map(e => (
              <button key={e.id} onClick={() => setEmotion(e)}
                className={`px-2 py-1 rounded text-[11px] font-medium border transition-all ${emotion.id === e.id ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'}`}>
                {e.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button onClick={handleGenerate} disabled={isGenerating || !text.trim()}
        className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> 生成中...</> : <><Mic className="w-4 h-4" /> 生成语音</>}
      </button>
    </div>
  );
};

const AudioGeneratorPanel = ({ onGenerated, userId, organizationId }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(AUDIO_STYLES[0]);
  const [duration, setDuration] = useState(30);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError('请输入描述内容'); return; }
    setError(null);
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storyboard_prompts: prompt.trim(),
          count: 4,
          o3ics: selectedStyle.tags,
          duration,
          workflow: 'gene-music',
          user_id: userId,
          organization_id: organizationId
        })
      });
      if (!res.ok) throw new Error('生成失败');
      const data = await res.json();
      const executionId = data.executionId;
      for (let attempt = 0; attempt < 60; attempt++) {
        await new Promise(r => setTimeout(r, 3000));
        const statusRes = await fetch(`/api/ai/generate-audio?executionId=${executionId}`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData.status === 'completed' && statusData.results?.length > 0) {
            onGenerated({ type: 'audio', url: statusData.results[0].url, title: `音乐 - ${selectedStyle.name}` });
            setIsGenerating(false);
            return;
          } else if (statusData.status === 'error') {
            throw new Error('生成失败');
          }
        }
      }
      throw new Error('生成超时');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
        <Music className="w-5 h-5 text-green-500" /> 背景音乐生成
      </h3>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="输入音乐风格描述..." rows={3}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-green-400" />
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-2">风格</label>
        <div className="flex gap-1.5">
          {AUDIO_STYLES.map(s => (
            <button key={s.id} onClick={() => setSelectedStyle(s)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-all ${selectedStyle.id === s.id ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
              {s.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-2">时长</label>
        <div className="flex gap-1.5">
          {DURATION_OPTIONS.map(d => (
            <button key={d} onClick={() => setDuration(d)}
              className={`px-3 py-1.5 rounded text-xs font-medium border transition-all ${duration === d ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
              {d}秒
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-red-500 text-xs">{error}</p>}
      <button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()}
        className="w-full py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
        {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> 生成中...</> : <><Music className="w-4 h-4" /> 生成音乐</>}
      </button>
    </div>
  );
};

export const AssetGeneratorModal = ({
  isOpen,
  onClose,
  assetType,
  onGenerated,
  userId,
  organizationId
}) => {
  const [imageMode, setImageMode] = useState(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setImageMode(null);
    onClose();
  };

  const handleIPGenerated = (result) => {
    if (result?.url) {
      onGenerated({ type: 'image', url: result.url, title: 'IP场景图' });
      onClose();
    }
  };

  const handleVideoConfirm = (data) => {
    const videoUrl = data?.videoUrl;
    if (videoUrl) {
      onGenerated({ type: 'video', url: videoUrl, title: data.title || 'AI生成视频' });
    } else if (data?.scenes?.length > 0) {
      const scene = data.scenes[0];
      if (scene.imageUrl || scene.url) {
        onGenerated({ type: 'video', url: scene.imageUrl || scene.url, title: data.title || '视频分镜' });
      }
    }
    handleClose();
  };

  const renderContent = () => {
    switch (assetType) {
      case 'image':
        if (!imageMode) return <ImageTypeSelector onSelect={setImageMode} />;
        if (imageMode === 'ip') {
          return (
            <IPSceneGenerator
              isOpen={true}
              onClose={handleClose}
              onConfirm={handleIPGenerated}
              userId={userId}
              organizationId={organizationId}
            />
          );
        }
        if (imageMode === 'ip-character') {
          return (
            <IPCharacterGenerator
              isOpen={true}
              onClose={handleClose}
              onConfirm={(result) => { onGenerated(result); handleClose(); }}
              userId={userId}
              organizationId={organizationId}
            />
          );
        }
        return <AIImagePanel onGenerated={(result) => { onGenerated(result); handleClose(); }} userId={userId} organizationId={organizationId} />;

      case 'video':
        return (
          <VideoStoryboardModal
            isOpen={true}
            onClose={handleClose}
            onConfirm={handleVideoConfirm}
            userId={userId}
            organizationId={organizationId}
          />
        );

      case 'audio':
        return <AudioGeneratorPanel onGenerated={(result) => { onGenerated(result); onClose(); }} userId={userId} organizationId={organizationId} />;

      case 'voice':
        return <VoiceGeneratorPanel onGenerated={(result) => { onGenerated(result); onClose(); }} userId={userId} organizationId={organizationId} />;

      default:
        return null;
    }
  };

  const isIPMode = assetType === 'image' && (imageMode === 'ip' || imageMode === 'ip-character');
  const isVideoMode = assetType === 'video';

  if (isIPMode || isVideoMode) {
    return renderContent();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-800">
            {assetType === 'image' ? '图片生成' : assetType === 'audio' ? '背景音乐生成' : '语音生成'}
          </h2>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AssetGeneratorModal;
