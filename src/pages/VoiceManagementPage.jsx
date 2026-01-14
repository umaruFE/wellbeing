import React, { useState } from 'react';
import { Upload, Music, Play, Pause, Trash2, Search, Filter, Smile, Frown, Meh, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const VoiceManagementPage = () => {
  const { hasRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmotion, setFilterEmotion] = useState('all');
  const [playingId, setPlayingId] = useState(null);

  const emotions = [
    { id: 'all', name: '全部', icon: Music },
    { id: 'happy', name: '开心', icon: Smile, color: 'text-yellow-500' },
    { id: 'sad', name: '悲伤', icon: Frown, color: 'text-blue-500' },
    { id: 'calm', name: '平静', icon: Meh, color: 'text-green-500' },
    { id: 'excited', name: '兴奋', icon: Heart, color: 'text-red-500' },
  ];

  // 模拟声音数据
  const [voices, setVoices] = useState([
    { id: 1, name: '开心语调1', emotion: 'happy', duration: '00:15', uploadedAt: '2024-01-15', url: '#' },
    { id: 2, name: '平静语调1', emotion: 'calm', duration: '00:20', uploadedAt: '2024-01-14', url: '#' },
    { id: 3, name: '悲伤语调1', emotion: 'sad', duration: '00:18', uploadedAt: '2024-01-13', url: '#' },
    { id: 4, name: '兴奋语调1', emotion: 'excited', duration: '00:12', uploadedAt: '2024-01-12', url: '#' },
  ]);

  const filteredVoices = voices.filter(voice => {
    const matchesSearch = voice.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmotion = filterEmotion === 'all' || voice.emotion === filterEmotion;
    return matchesSearch && matchesEmotion;
  });

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // 模拟上传
        const newVoice = {
          id: voices.length + 1,
          name: file.name.replace(/\.[^/.]+$/, ''),
          emotion: 'happy', // 默认情绪，实际应该让用户选择
          duration: '00:00',
          uploadedAt: new Date().toISOString().split('T')[0],
          url: URL.createObjectURL(file)
        };
        setVoices([...voices, newVoice]);
      }
    };
    input.click();
  };

  const handleDelete = (id) => {
    if (window.confirm('确定要删除这个声音吗？')) {
      setVoices(voices.filter(v => v.id !== id));
    }
  };

  const handlePlay = (id) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
    }
  };

  const getEmotionIcon = (emotion) => {
    const emotionData = emotions.find(e => e.id === emotion);
    if (emotionData && emotionData.icon) {
      const Icon = emotionData.icon;
      return <Icon className={`w-5 h-5 ${emotionData.color || 'text-slate-500'}`} />;
    }
    return <Music className="w-5 h-5 text-slate-500" />;
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Music className="w-6 h-6 text-blue-600" />
              声音管理
            </h1>
            <p className="text-sm text-slate-500 mt-1">上传和管理您的声音文件</p>
          </div>
          <button
            onClick={handleUpload}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4" />
            上传声音
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索声音..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="flex items-center gap-2">
              {emotions.map(emotion => {
                const Icon = emotion.icon;
                return (
                  <button
                    key={emotion.id}
                    onClick={() => setFilterEmotion(emotion.id)}
                    className={`px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      filterEmotion === emotion.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${emotion.color || ''}`} />
                    <span className="text-sm">{emotion.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Voice List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVoices.map(voice => (
            <div
              key={voice.id}
              className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    {getEmotionIcon(voice.emotion)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{voice.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">上传于 {voice.uploadedAt}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1">
                    <Music className="w-4 h-4" />
                    {voice.duration}
                  </span>
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs">
                    {emotions.find(e => e.id === voice.emotion)?.name || voice.emotion}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePlay(voice.id)}
                  className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                    playingId === voice.id
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  {playingId === voice.id ? (
                    <>
                      <Pause className="w-4 h-4" />
                      暂停
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      播放
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(voice.id)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {filteredVoices.length === 0 && (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">暂无声音文件</p>
          </div>
        )}
      </div>
    </div>
  );
};

