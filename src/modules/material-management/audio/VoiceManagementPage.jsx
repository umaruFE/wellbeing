import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Music, Play, Pause, Trash2, Search, Filter, Smile, Frown, Meh, Heart } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import apiService from '../../../services/api';
import uploadService from '../../../services/uploadService';

export const VoiceManagementPage = () => {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmotion, setFilterEmotion] = useState('all');
  const [playingId, setPlayingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const audioRef = useRef(null);

  const emotions = [
    { id: 'all', nameKey: 'common.all', icon: Music },
    { id: 'happy', nameKey: 'voice.emotionHappy', icon: Smile, color: 'text-yellow-500' },
    { id: 'sad', nameKey: 'voice.emotionSad', icon: Frown, color: 'text-info-hover' },
    { id: 'calm', nameKey: 'voice.emotionCalm', icon: Meh, color: 'text-success' },
    { id: 'excited', nameKey: 'voice.emotionExcited', icon: Heart, color: 'text-error' },
  ];

  const [voices, setVoices] = useState([]);

  useEffect(() => {
    const fetchVoices = async () => {
      try {
        setLoading(true);
        const result = await apiService.getVoiceConfigs();
        const list = Array.isArray(result?.data) ? result.data : [];
        setVoices(list.map(item => ({
          id: item.id,
          name: item.name || `${t('voice.config')}-${item.id}`,
          emotion: 'all',
          duration: '--:--',
          uploadedAt: (item.created_at || '').slice(0, 10) || '--',
          url: item.previewUrl || '#',
          raw: item,
        })));
      } catch (err) {
        console.error('fetch voice configs failed:', err);
        setVoices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVoices();
  }, [t]);

  const filteredVoices = voices.filter(voice => {
    const matchesSearch = voice.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmotion = filterEmotion === 'all' || voice.emotion === filterEmotion;
    return matchesSearch && matchesEmotion;
  });

  const handleUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        try {
          setUploading(true);
          const uploadResult = await uploadService.uploadFile(file, 'voices');
          if (!uploadResult.success) {
            alert(uploadResult.error || t('common.uploadFailed'));
            return;
          }
        const newVoice = {
            id: `local-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
            emotion: 'all',
            duration: '--:--',
          uploadedAt: new Date().toISOString().split('T')[0],
            url: uploadResult.url || '#',
            raw: { uploadedUrl: uploadResult.url }
        };
          setVoices(prev => [newVoice, ...prev]);
        } catch (err) {
          console.error('upload voice failed:', err);
          alert(t('common.uploadFailed'));
        } finally {
          setUploading(false);
        }
      }
    };
    input.click();
  };

  const handleDelete = (id) => {
    if (window.confirm(t('voice.confirmDelete'))) {
      setVoices(voices.filter(v => v.id !== id));
    }
  };

  const handlePlay = (id) => {
    if (playingId === id) {
      setPlayingId(null);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else {
      setPlayingId(id);
      const voice = voices.find(v => v.id === id);
      if (voice?.url && voice.url !== '#') {
        try {
          if (!audioRef.current) {
            audioRef.current = new Audio();
          }
          audioRef.current.src = voice.url;
          audioRef.current.play().catch(() => {});
        } catch (e) {
        }
      }
    }
  };

  const getEmotionIcon = (emotion) => {
    const emotionData = emotions.find(e => e.id === emotion);
    if (emotionData && emotionData.icon) {
      const Icon = emotionData.icon;
      return <Icon className={`w-5 h-5 ${emotionData.color || 'text-primary-muted'}`} />;
    }
    return <Music className="w-5 h-5 text-primary-muted" />;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-info border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-muted">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-surface">
      {/* Header */}
      <div className="bg-surface border-b-2 border-stroke-light px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
              <Music className="w-6 h-6 text-dark" />
              {t('voice.title')}
            </h1>
            <p className="text-sm text-primary-muted mt-1">{t('voice.subtitle')}</p>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all duration-200 font-medium shadow-neo ${
              uploading ? 'bg-gray-disabled text-gray-disabled-text cursor-not-allowed border-2 border-gray-disabled' : 'border-2 border-primary hover:bg-warning-light hover:text-dark'
            }`}
          >
            <Upload className="w-4 h-4" />
            {uploading ? t('common.uploading') : t('voice.uploadVoice')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border-b-2 border-stroke-light px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-placeholder" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('voice.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 border-2 border-stroke-light rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-primary outline-none transition-all duration-200"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary-placeholder" />
            <div className="flex items-center gap-2">
              {emotions.map(emotion => {
                const Icon = emotion.icon;
                return (
                  <button
                    key={emotion.id}
                    onClick={() => setFilterEmotion(emotion.id)}
                    className={`px-3 py-2 rounded-xl flex items-center gap-2 transition-all duration-200 font-medium ${
                      filterEmotion === emotion.id
                        ? 'bg-warning-light text-dark border-2 border-primary'
                        : 'bg-surface text-primary-secondary border-2 border-stroke-light hover:border-primary hover:bg-warning-light'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${emotion.color || ''}`} />
                    <span className="text-sm">{t(emotion.nameKey)}</span>
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
              className="bg-surface rounded-[24px] border-2 border-stroke-light p-5 transition-all duration-200 hover:border-primary hover:shadow-[4px_4px_0px_0px_var(--color-dark)] hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-warning-light rounded-xl flex items-center justify-center border-2 border-stroke-light">
                    {getEmotionIcon(voice.emotion)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">{voice.name}</h3>
                    <p className="text-xs text-primary-muted mt-1">{t('voice.uploadedAt', { date: voice.uploadedAt })}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4 text-sm text-primary-secondary">
                  <span className="flex items-center gap-1">
                    <Music className="w-4 h-4" />
                    {voice.duration}
                  </span>
                  <span className="px-2 py-1 bg-warning-light border border-stroke-light rounded text-xs">
                    {emotions.find(e => e.id === voice.emotion)?.nameKey ? t(emotions.find(e => e.id === voice.emotion).nameKey) : voice.emotion}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePlay(voice.id)}
                  className={`flex-1 px-3 py-2 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 font-medium ${
                    playingId === voice.id
                      ? 'bg-error-light text-error border-2 border-error-border hover:border-error hover:bg-error-light'
                      : 'bg-warning-light text-dark border-2 border-stroke-light hover:border-primary hover:bg-warning-light'
                  }`}
                >
                  {playingId === voice.id ? (
                    <>
                      <Pause className="w-4 h-4" />
                      {t('voice.pause')}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      {t('voice.play')}
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(voice.id)}
                  className="px-3 py-2 bg-error-light text-error border-2 border-error-border rounded-xl hover:border-error hover:bg-error-light transition-all duration-200"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {filteredVoices.length === 0 && (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-primary-placeholder mx-auto mb-4" />
            <p className="text-primary-muted">{t('voice.noVoices')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
