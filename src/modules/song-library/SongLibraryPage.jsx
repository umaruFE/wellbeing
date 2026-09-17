import i18next from 'i18next';
import { LocalizedText } from '../../i18n/LocalizedText.jsx';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Music, Play, Pause, Trash2, Plus, Edit, X, Disc } from 'lucide-react';
import apiService from '../../services/api';
import uploadService from '../../services/uploadService';
import './SongLibraryPage.css';

const MELODY_TYPES = [
  {
    id: 'lyrical',
    value: 'Edelweiss',
    color: '#6d59c5',
  },
  {
    id: 'warm',
    value: 'You Are My Sunshine',
    color: '#F5A233',
  },
  {
    id: 'light',
    value: 'Twinkle, Twinkle, Little Star',
    color: '#4482E5',
  },
  {
    id: 'interactive',
    value: "If You're Happy and You Know It",
    color: '#CF5846',
  },
];

const EMPTY_FORM = {
  name: '',
  melodyType: '',
  vocalUrl: '',
  instrumentalUrl: '',
  lyrics: '',
  description: '',
};

const getMelody = (value) => MELODY_TYPES.find((m) => m.value === value || m.id === value);

export const SongLibraryPage = () => {
  useTranslation(); // Re-render translated option labels when language changes.
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [uploadingField, setUploadingField] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      const result = await apiService.request('/api/song-library');
      const list = Array.isArray(result?.data) ? result.data : [];
      setSongs(list);
    } catch (err) {
      console.error('fetch songs failed:', err);
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const handleAdd = () => {
    setEditingSong(null);
    setFormData(EMPTY_FORM);
    setShowForm(true);
  };

  const handleEdit = (song) => {
    const storedMelodyType = song.melodyType || song.melody_type || '';
    const melody = getMelody(storedMelodyType);
    setEditingSong(song);
    setFormData({
      name: song.name || '',
      melodyType: melody?.value || storedMelodyType,
      vocalUrl: song.vocalUrl || song.vocal_url || '',
      instrumentalUrl: song.instrumentalUrl || song.instrumental_url || '',
      lyrics: song.lyrics || '',
      description: song.description || '',
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSong(null);
    setFormData(EMPTY_FORM);
  };

  const handleFileUpload = async (file, field) => {
    if (!file) return;
    try {
      setUploadingField(field);
      const uploadResult = await uploadService.uploadFile(file, 'song-library');
      if (!uploadResult.success) {
        alert(uploadResult.error || i18next.t('songLibraryUi.uploadFailed'));
        return;
      }
      setFormData((prev) => ({ ...prev, [field]: uploadResult.url }));
    } catch (err) {
      console.error('upload file failed:', err);
      alert(i18next.t('songLibraryUi.uploadFailed'));
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.melodyType) {
      alert(i18next.t('songLibraryUi.required'));
      return;
    }
    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        melodyType: formData.melodyType,
        vocalUrl: formData.vocalUrl,
        instrumentalUrl: formData.instrumentalUrl,
        lyrics: formData.lyrics,
        description: formData.description,
      };
      if (editingSong) {
        await apiService.request(`/api/song-library/${editingSong.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiService.request('/api/song-library', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setShowForm(false);
      setEditingSong(null);
      setFormData(EMPTY_FORM);
      await fetchSongs();
    } catch (err) {
      console.error('save song failed:', err);
      alert(i18next.t('songLibraryUi.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (song) => {
    if (!window.confirm(i18next.t('songLibraryUi.deleteConfirm', { name: song.name }))) return;
    try {
      await apiService.request(`/api/song-library/${song.id}`, { method: 'DELETE' });
      setSongs((prev) => prev.filter((s) => s.id !== song.id));
    } catch (err) {
      console.error('delete song failed:', err);
      alert(i18next.t('songLibraryUi.deleteFailed'));
    }
  };

  if (loading) {
    return (
      <div className="song-library-loading">
        <div className="song-library-spinner" />
        <p><LocalizedText id="common.loading" /></p>
      </div>
    );
  }

  return (
    <div className="song-library-page">
      <header className="song-library-header">
        <div className="song-library-title">
          <Disc className="song-library-title-icon" />
          <div>
            <h1><LocalizedText id="songLibraryUi.9e98d91694" /></h1>
            <p><LocalizedText id="songLibraryUi.4e8b1c41f0" /></p>
          </div>
        </div>
        <button className="song-library-add-btn" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          <LocalizedText id="songLibraryUi.3085cb2ec6" />
        </button>
      </header>

      <div className="song-library-grid">
        {songs.map((song) => {
          const melodyType = song.melodyType || song.melody_type;
          const melody = getMelody(melodyType);
          return (
            <div className="song-card" key={song.id}>
              <div className="song-card-head">
                <div className="song-card-info">
                  <div className="song-card-icon">
                    <Music className="w-5 h-5" />
                  </div>
                  <div className="song-card-text">
                    <h3>{song.name}</h3>
                    {song.description && <p>{song.description}</p>}
                  </div>
                </div>
                <div className="song-card-actions">
                  <button
                    className="song-card-edit"
                    onClick={() => handleEdit(song)}
                    title={i18next.t('common.edit')}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="song-card-delete"
                    onClick={() => handleDelete(song)}
                    title={i18next.t('common.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="song-card-badge-wrap">
                <span
                  className="song-card-badge"
                  style={{
                    backgroundColor: `${melody?.color || '#818997'}1A`,
                    color: melody?.color || '#818997',
                    borderColor: `${melody?.color || '#818997'}40`,
                  }}
                >
                  <Disc className="w-3 h-3" />
                  {melody ? i18next.t(`songLibraryUi.melody.${melody.id}.name`) : melodyType}
                </span>
              </div>

              <div className="song-audio-section">
                <div className="song-audio-label">
                  <Play className="w-3 h-3" />
                  <LocalizedText id="songWriting.vocalVersion" />
                </div>
                {song.vocalUrl || song.vocal_url ? (
                  <audio controls src={song.vocalUrl || song.vocal_url} className="song-audio-player" />
                ) : (
                  <span className="song-audio-empty"><LocalizedText id="songLibraryUi.2ef7f6b42c" /></span>
                )}
              </div>

              <div className="song-audio-section">
                <div className="song-audio-label">
                  <Pause className="w-3 h-3" />
                  <LocalizedText id="generatedResults.instrumental" />
                </div>
                {song.instrumentalUrl || song.instrumental_url ? (
                  <audio controls src={song.instrumentalUrl || song.instrumental_url} className="song-audio-player" />
                ) : (
                  <span className="song-audio-empty"><LocalizedText id="songLibraryUi.2ef7f6b42c" /></span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {songs.length === 0 && (
        <div className="song-library-empty">
          <Music className="song-library-empty-icon" />
          <p><LocalizedText id="songLibraryUi.9ffa19a0f3" /></p>
        </div>
      )}

      {showForm && (
        <div className="song-library-overlay" onClick={handleCancel}>
          <div className="song-form" onClick={(e) => e.stopPropagation()}>
            <div className="song-form-head">
              <h2>{editingSong ? '编辑曲目' : '添加曲目'}</h2>
              <button className="song-form-close" onClick={handleCancel} title={i18next.t('songLibraryUi.6c14bd7f6f')}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="song-form-row">
                <label className="song-form-label">
                  <LocalizedText id="songLibraryUi.e5ef4c2721" /> <span className="song-form-required">*</span>
                </label>
                <input
                  type="text"
                  className="song-form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={i18next.t('songLibraryUi.f7e2ffccab')}
                  required
                />
              </div>

              <div className="song-form-row">
                <label className="song-form-label">
                  <LocalizedText id="songLibraryUi.2e513c92d9" /> <span className="song-form-required">*</span>
                </label>
                <select
                  className="song-form-select"
                  value={formData.melodyType}
                  onChange={(e) => setFormData({ ...formData, melodyType: e.target.value })}
                  required
                >
                  <option value=""><LocalizedText id="songLibraryUi.568045fa2d" /></option>
                  {MELODY_TYPES.map((m) => (
                    <option key={m.id} value={m.value}>
                      {i18next.t(`songLibraryUi.melody.${m.id}.name`)}｜{i18next.t(`songLibraryUi.melody.${m.id}.description`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="song-form-row">
                <label className="song-form-label"><LocalizedText id="songLibraryUi.abf2a0b72a" /></label>
                <div className="song-form-upload">
                  <label className="song-form-upload-btn">
                    <Upload className="w-4 h-4" />
                    {uploadingField === 'vocalUrl' ? '上传中...' : '选择文件'}
                    <input
                      type="file"
                      accept="audio/*"
                      className="song-form-upload-input"
                      onChange={(e) => handleFileUpload(e.target.files[0], 'vocalUrl')}
                      disabled={uploadingField !== null}
                    />
                  </label>
                  {formData.vocalUrl && (
                    <span className="song-form-upload-done">
                      <audio controls src={formData.vocalUrl} className="song-audio-player" />
                    </span>
                  )}
                </div>
              </div>

              <div className="song-form-row">
                <label className="song-form-label"><LocalizedText id="songLibraryUi.a53ec034ef" /></label>
                <div className="song-form-upload">
                  <label className="song-form-upload-btn">
                    <Upload className="w-4 h-4" />
                    {uploadingField === 'instrumentalUrl' ? '上传中...' : '选择文件'}
                    <input
                      type="file"
                      accept="audio/*"
                      className="song-form-upload-input"
                      onChange={(e) => handleFileUpload(e.target.files[0], 'instrumentalUrl')}
                      disabled={uploadingField !== null}
                    />
                  </label>
                  {formData.instrumentalUrl && (
                    <span className="song-form-upload-done">
                      <audio controls src={formData.instrumentalUrl} className="song-audio-player" />
                    </span>
                  )}
                </div>
              </div>

              <div className="song-form-row">
                <label className="song-form-label"><LocalizedText id="songLibraryUi.0104086d90" /></label>
                <textarea
                  className="song-form-textarea"
                  value={formData.lyrics}
                  onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                  placeholder={i18next.t('songLibraryUi.1cf30bb984')}
                  rows={4}
                />
              </div>

              <div className="song-form-row">
                <label className="song-form-label"><LocalizedText id="common.description" /></label>
                <input
                  type="text"
                  className="song-form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={i18next.t('songLibraryUi.936c74a8c1')}
                />
              </div>

              <div className="song-form-foot">
                <button type="button" className="song-form-cancel" onClick={handleCancel}>
                  <LocalizedText id="common.cancel" />
                </button>
                <button type="submit" className="song-form-save" disabled={uploadingField !== null || saving}>
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SongLibraryPage;
