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
      return <Icon className={`w-5 h-5 ${emotionData.color || "text-[var(--wb-muted)]"}`} />;
    }
    return <Music className="w-5 h-5 text-[var(--wb-muted)]" />;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--wb-surface)]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-[var(--wb-selected-border)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--wb-muted)]">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--wb-page)]">
      {/* Header */}
      <div className="bg-[var(--wb-surface)] border-b border-[var(--wb-border)] px-4 sm:px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[28px] font-bold text-[var(--wb-text)] flex items-center gap-2">
              <Music className="w-6 h-6 text-[var(--wb-text)]" />
              {t('voice.title')}
            </h1>
            <p className="text-sm text-[var(--wb-muted)] mt-1">{t('voice.subtitle')}</p>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`px-4 py-2 rounded-[10px] flex items-center gap-2 transition-all duration-200 font-medium shadow-none min-h-10 ${
              uploading ? "bg-gray-disabled text-gray-disabled-text cursor-not-allowed border border-gray-disabled" : "border border-[var(--wb-selected-border)] hover:bg-[var(--wb-selected)] hover:text-[var(--wb-text)]"
            }`}
          >
            <Upload className="w-4 h-4" />
            {uploading ? t('common.uploading') : t('voice.uploadVoice')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--wb-surface)] border-b border-[var(--wb-border)] px-4 sm:px-6 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-full min-w-0 sm:flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--wb-muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('voice.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 border border-[var(--wb-border)] rounded-[10px] focus:ring-2 focus:ring-[var(--wb-selected-border)] focus:border-[var(--wb-selected-border)] outline-none transition-all duration-200 min-h-11"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--wb-muted)]" />
            <div className="flex flex-wrap items-center gap-2">
              {emotions.map(emotion => {
                const Icon = emotion.icon;
                return (
                  <button
                    key={emotion.id}
                    onClick={() => setFilterEmotion(emotion.id)}
                    className={`px-3 py-2 rounded-[10px] flex items-center gap-2 transition-all duration-200 font-medium  min-h-10 ${
                      filterEmotion === emotion.id
                        ? "bg-[var(--wb-selected)] text-[var(--wb-text)] border border-[var(--wb-selected-border)]"
                        : "bg-[var(--wb-surface)] text-[var(--wb-muted)] border border-[var(--wb-border)] hover:border-[var(--wb-selected-border)] hover:bg-[var(--wb-selected)]"
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
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-w-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVoices.map(voice => (
            <div
              key={voice.id}
              className="bg-[var(--wb-surface)] rounded-[14px] border border-[var(--wb-border)] p-5 transition-all duration-200 hover:border-[var(--wb-selected-border)] hover:shadow-[0_4px_18px_rgba(48,43,59,0.06)] "
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[var(--wb-selected)] rounded-[10px] flex items-center justify-center border border-[var(--wb-border)]">
                    {getEmotionIcon(voice.emotion)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--wb-text)]">{voice.name}</h3>
                    <p className="text-xs text-[var(--wb-muted)] mt-1">{t('voice.uploadedAt', { date: voice.uploadedAt })}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-4 text-sm text-[var(--wb-muted)]">
                  <span className="flex items-center gap-1">
                    <Music className="w-4 h-4" />
                    {voice.duration}
                  </span>
                  <span className="px-2 py-1 bg-[var(--wb-selected)] border border-[var(--wb-border)] rounded text-xs">
                    {emotions.find(e => e.id === voice.emotion)?.nameKey ? t(emotions.find(e => e.id === voice.emotion).nameKey) : voice.emotion}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handlePlay(voice.id)}
                  className={`flex-1 px-3 py-2 rounded-[10px] flex items-center justify-center gap-2 transition-all duration-200 font-medium  min-h-10 ${
                    playingId === voice.id
                      ? "bg-error-light text-error border border-error-border hover:border-error hover:bg-error-light"
                      : "bg-[var(--wb-selected)] text-[var(--wb-text)] border border-[var(--wb-border)] hover:border-[var(--wb-selected-border)] hover:bg-[var(--wb-selected)]"
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
                  className="px-3 py-2 bg-error-light text-error border border-error-border rounded-[10px] hover:border-error hover:bg-error-light transition-all duration-200 min-h-10"
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
            <Music className="w-16 h-16 text-[var(--wb-muted)] mx-auto mb-4" />
            <p className="text-[var(--wb-muted)]">{t('voice.noVoices')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
