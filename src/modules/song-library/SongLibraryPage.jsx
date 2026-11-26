import { CreateButton, LibrarySearch, MetadataTag } from '../../components/LibraryControls';
import i18next from 'i18next';
import { LocalizedText } from '../../i18n/LocalizedText.jsx';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageLoading } from '../../components/PageLoading';
import { MaterialLibraryFeedback } from '../material-management/MaterialLibraryControls';
import { Modal, message } from 'antd';
import { Upload, Music, Play, Pause, Trash2, Edit, Disc } from 'lucide-react';
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
  const [loadError, setLoadError] = useState(false);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [uploadingField, setUploadingField] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [modal, modalContext] = Modal.useModal();

  const fetchSongs = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const result = await apiService.request('/api/song-library');
      const list = Array.isArray(result?.data) ? result.data : [];
      setSongs(list);
    } catch (err) {
      console.error('fetch songs failed:', err);
      setLoadError(true);
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

  const handleDelete = (song) => modal.confirm({
    title: i18next.t('common.confirmDelete'),
    content: i18next.t('songLibraryUi.deleteConfirm', { name: song.name }),
    okText: i18next.t('common.delete'),
    cancelText: i18next.t('common.cancel'),
    okButtonProps: { danger: true },
    onOk: async () => {
      try {
        await apiService.request(`/api/song-library/${song.id}`, { method: 'DELETE' });
        setSongs((prev) => prev.filter((s) => s.id !== song.id));
      } catch (err) {
        console.error('delete song failed:', err);
        message.error(i18next.t('songLibraryUi.deleteFailed'));
        throw err;
      }
    },
  });

  const query = search.trim().toLowerCase();
  const visibleSongs = songs.filter((song) => {
    const type = song.melodyType || song.melody_type;
    const melody = getMelody(type);
    const melodyLabel = melody ? i18next.t(`songLibraryUi.melody.${melody.id}.name`) : type;
    return [song.name, song.description, melodyLabel]
      .some((value) => String(value || '').toLowerCase().includes(query));
  });

  return (
    <div className="song-library-page">
      {modalContext}
      <header className="song-library-header wb-library-header">
        <div className="song-library-title">
          <div>
            <h1><LocalizedText id="songLibraryUi.9e98d91694" /></h1>
            <p><LocalizedText id="songLibraryUi.4e8b1c41f0" /></p>
          </div>
        </div>
        <CreateButton onClick={handleAdd}><LocalizedText id="songLibraryUi.3085cb2ec6" /></CreateButton>
      </header>

      <LibrarySearch className="mb-5" label={i18next.t('songWriting.searchPlaceholder')} value={search} onChange={setSearch} />
      {loading ? <PageLoading /> : loadError ? (
        <MaterialLibraryFeedback error={i18next.t('common.loadFailed')} onRetry={fetchSongs} />
      ) : visibleSongs.length === 0 ? (
        <MaterialLibraryFeedback empty={i18next.t('common.noData')} filtered={Boolean(query)} onReset={() => setSearch('')} />
      ) : (
      <div className="song-library-grid">
        {visibleSongs.map((song) => {
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
                    type="button"
                    data-wb-button="quiet" data-wb-size="sm" data-wb-icon
                    onClick={() => handleEdit(song)}
                    aria-label={i18next.t('common.edit')}
                    title={i18next.t('common.edit')}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    data-wb-button="danger" data-wb-size="sm" data-wb-icon
                    onClick={() => handleDelete(song)}
                    aria-label={i18next.t('common.delete')}
                    title={i18next.t('common.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="song-card-badge-wrap">
                <MetadataTag>
                  <Disc size={12} aria-hidden="true" />
                  {melody ? i18next.t(`songLibraryUi.melody.${melody.id}.name`) : melodyType}
                </MetadataTag>
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
      </div>)}

      <Modal
        open={showForm}
        title={i18next.t(editingSong ? 'common.edit' : 'songLibraryUi.3085cb2ec6')}
        onCancel={handleCancel}
        footer={null}
        maskClosable={false}
        keyboard={uploadingField === null && !saving}
        closable={uploadingField === null && !saving}
      >
        <form onSubmit={handleSubmit}>
          <div className="song-form-row">
            <label className="song-form-label" htmlFor="song-library-name">
              <LocalizedText id="songLibraryUi.e5ef4c2721" /> <span className="song-form-required">*</span>
            </label>
            <input
              type="text"
              id="song-library-name"
              data-wb-field
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={i18next.t('songLibraryUi.f7e2ffccab')}
              required
            />
          </div>

          <div className="song-form-row">
            <label className="song-form-label" htmlFor="song-library-melodyType">
              <LocalizedText id="songLibraryUi.2e513c92d9" /> <span className="song-form-required">*</span>
            </label>
            <select
              id="song-library-melodyType"
              data-wb-field
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
              <label className="song-form-upload-btn" data-wb-button="secondary">
                <Upload className="w-4 h-4" />
                {i18next.t(uploadingField === 'vocalUrl' ? 'common.uploading' : 'common.upload')}
                <input
                  type="file"
                  accept="audio/*"
                  className="song-form-upload-input"
                  aria-label={i18next.t('songLibraryUi.abf2a0b72a')}
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
              <label className="song-form-upload-btn" data-wb-button="secondary">
                <Upload className="w-4 h-4" />
                {i18next.t(uploadingField === 'instrumentalUrl' ? 'common.uploading' : 'common.upload')}
                <input
                  type="file"
                  accept="audio/*"
                  className="song-form-upload-input"
                  aria-label={i18next.t('songLibraryUi.a53ec034ef')}
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
            <label className="song-form-label" htmlFor="song-library-lyrics"><LocalizedText id="songLibraryUi.0104086d90" /></label>
            <textarea
              id="song-library-lyrics"
              data-wb-field
              value={formData.lyrics}
              onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
              placeholder={i18next.t('songLibraryUi.1cf30bb984')}
              rows={4}
            />
          </div>

          <div className="song-form-row">
            <label className="song-form-label" htmlFor="song-library-description"><LocalizedText id="common.description" /></label>
            <input
              type="text"
              id="song-library-description"
              data-wb-field
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={i18next.t('songLibraryUi.936c74a8c1')}
            />
          </div>

          <div className="song-form-foot">
            <button type="button" data-wb-button="secondary" onClick={handleCancel} disabled={uploadingField !== null || saving}>
              <LocalizedText id="common.cancel" />
            </button>
            <button type="submit" data-wb-button="primary" disabled={uploadingField !== null || saving}>
              {i18next.t(saving ? 'common.saving' : 'common.save')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SongLibraryPage;
