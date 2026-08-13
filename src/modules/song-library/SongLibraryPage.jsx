import React, { useEffect, useState } from 'react';
import { Upload, Music, Play, Pause, Trash2, Plus, Edit, X, Disc } from 'lucide-react';
import apiService from '../../services/api';
import uploadService from '../../services/uploadService';
import './SongLibraryPage.css';

const MELODY_TYPES = [
  {
    id: 'lyrical',
    value: 'Edelweiss',
    name: '舒缓抒情型',
    description: '旋律柔和、起伏舒展，情感逐步推进',
    color: '#6d59c5',
  },
  {
    id: 'warm',
    value: 'You Are My Sunshine',
    name: '温暖舒展型',
    description: '旋律明朗温暖，长句自然流动',
    color: '#F5A233',
  },
  {
    id: 'light',
    value: 'Twinkle, Twinkle, Little Star',
    name: '轻快跳跃型',
    description: '节奏均匀、短句重复，旋律轻巧活泼',
    color: '#4482E5',
  },
  {
    id: 'interactive',
    value: "If You're Happy and You Know It",
    name: '欢快互动型',
    description: '长短句交替、节奏鲜明，适合动作互动',
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
        alert(uploadResult.error || '上传失败');
        return;
      }
      setFormData((prev) => ({ ...prev, [field]: uploadResult.url }));
    } catch (err) {
      console.error('upload file failed:', err);
      alert('上传失败');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.melodyType) {
      alert('请填写曲目名称和旋律类型');
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
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (song) => {
    if (!window.confirm(`确定要删除「${song.name}」吗？`)) return;
    try {
      await apiService.request(`/api/song-library/${song.id}`, { method: 'DELETE' });
      setSongs((prev) => prev.filter((s) => s.id !== song.id));
    } catch (err) {
      console.error('delete song failed:', err);
      alert('删除失败');
    }
  };

  if (loading) {
    return (
      <div className="song-library-loading">
        <div className="song-library-spinner" />
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="song-library-page">
      <header className="song-library-header">
        <div className="song-library-title">
          <Disc className="song-library-title-icon" />
          <div>
            <h1>曲目库</h1>
            <p>管理演唱版与伴奏版曲目资源</p>
          </div>
        </div>
        <button className="song-library-add-btn" onClick={handleAdd}>
          <Plus className="w-4 h-4" />
          添加曲目
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
                    title="编辑"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="song-card-delete"
                    onClick={() => handleDelete(song)}
                    title="删除"
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
                  {melody ? melody.name : melodyType}
                </span>
              </div>

              <div className="song-audio-section">
                <div className="song-audio-label">
                  <Play className="w-3 h-3" />
                  演唱版
                </div>
                {song.vocalUrl || song.vocal_url ? (
                  <audio controls src={song.vocalUrl || song.vocal_url} className="song-audio-player" />
                ) : (
                  <span className="song-audio-empty">暂无音频</span>
                )}
              </div>

              <div className="song-audio-section">
                <div className="song-audio-label">
                  <Pause className="w-3 h-3" />
                  伴奏版
                </div>
                {song.instrumentalUrl || song.instrumental_url ? (
                  <audio controls src={song.instrumentalUrl || song.instrumental_url} className="song-audio-player" />
                ) : (
                  <span className="song-audio-empty">暂无音频</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {songs.length === 0 && (
        <div className="song-library-empty">
          <Music className="song-library-empty-icon" />
          <p>暂无曲目，点击「添加曲目」开始创建</p>
        </div>
      )}

      {showForm && (
        <div className="song-library-overlay" onClick={handleCancel}>
          <div className="song-form" onClick={(e) => e.stopPropagation()}>
            <div className="song-form-head">
              <h2>{editingSong ? '编辑曲目' : '添加曲目'}</h2>
              <button className="song-form-close" onClick={handleCancel} title="关闭">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="song-form-row">
                <label className="song-form-label">
                  曲目名称 <span className="song-form-required">*</span>
                </label>
                <input
                  type="text"
                  className="song-form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入曲目名称"
                  required
                />
              </div>

              <div className="song-form-row">
                <label className="song-form-label">
                  旋律类型 <span className="song-form-required">*</span>
                </label>
                <select
                  className="song-form-select"
                  value={formData.melodyType}
                  onChange={(e) => setFormData({ ...formData, melodyType: e.target.value })}
                  required
                >
                  <option value="">请选择旋律类型</option>
                  {MELODY_TYPES.map((m) => (
                    <option key={m.id} value={m.value}>
                      {m.name}｜{m.description}
                    </option>
                  ))}
                </select>
              </div>

              <div className="song-form-row">
                <label className="song-form-label">演唱版音频文件</label>
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
                <label className="song-form-label">伴奏版音频文件</label>
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
                <label className="song-form-label">原版歌词参考</label>
                <textarea
                  className="song-form-textarea"
                  value={formData.lyrics}
                  onChange={(e) => setFormData({ ...formData, lyrics: e.target.value })}
                  placeholder="可选，填写原版歌词作为参考"
                  rows={4}
                />
              </div>

              <div className="song-form-row">
                <label className="song-form-label">描述</label>
                <input
                  type="text"
                  className="song-form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="可选，简短描述"
                />
              </div>

              <div className="song-form-foot">
                <button type="button" className="song-form-cancel" onClick={handleCancel}>
                  取消
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
