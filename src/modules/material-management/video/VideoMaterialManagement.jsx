import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Edit,
  Trash2,
  Video,
  X,
  Check,
  Upload,
  Play,
  Search
} from 'lucide-react';
import apiService from '../../../services/api';
import uploadService from '../../../services/uploadService';

export const VideoMaterialManagement = () => {
  const { t } = useTranslation();
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState({});
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const result = await apiService.getVideos();
        setVideos(result.data || []);
      } catch (err) {
        console.error('fetch videos failed:', err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  const filteredVideos = videos.filter(video =>
    video.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (type, data = {}) => {
    setModalType(type);
    setModalData(data);
  };

  const closeModal = () => {
    setModalType(null);
    setModalData({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  const handleVideoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/mkv', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      alert(t('videoMat.invalidFormat'));
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      alert(t('videoMat.tooLarge'));
      return;
    }

    try {
      setUploading(true);
      const result = await uploadService.uploadVideo(file, 'videos');

      if (result.success) {
        openModal('add', { videoUrl: result.url });
      } else {
        alert(result.error || t('common.uploadFailed'));
      }
    } catch (err) {
      console.error('upload video failed:', err);
      alert(t('videoMat.uploadRetry'));
    } finally {
      setUploading(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  const handleConfirmAdd = async () => {
    try {
      const result = await apiService.createVideo(modalData);
      if (result.data) {
        setVideos([result.data, ...videos]);
      }
      closeModal();
    } catch (err) {
      console.error('save video failed:', err);
      alert(t('videoMat.saveRetry'));
    }
  };

  const handleConfirmEdit = async () => {
    try {
      const result = await apiService.updateVideo(modalData.id, modalData);
      if (result.data) {
        setVideos(videos.map(v => v.id === modalData.id ? result.data : v));
      }
      closeModal();
    } catch (err) {
      console.error('update video failed:', err);
      alert(t('videoMat.updateRetry'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('videoMat.confirmDelete'))) return;

    try {
      await apiService.deleteVideo(id);
      setVideos(videos.filter(v => v.id !== id));
    } catch (err) {
      console.error('delete video failed:', err);
      alert(t('videoMat.deleteRetry'));
    }
  };

  const handleInputChange = (field, value) => {
    setModalData({ ...modalData, [field]: value });
  };

  const triggerVideoSelect = () => {
    if (videoInputRef.current) {
      videoInputRef.current.click();
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* 顶部操作栏 */}
      <div className="bg-surface border-b-2 border-stroke-light px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary-placeholder" />
              <input
                type="text"
                placeholder={t('videoMat.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border-2 border-stroke-light rounded-xl text-sm focus:ring-2 focus:ring-[#2d2d2d] focus:border-primary outline-none w-64 transition-all duration-200"
              />
            </div>
            <span className="text-sm text-primary-muted">
              {t('videoMat.totalCount', { count: filteredVideos.length })}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={videoInputRef}
              onChange={handleVideoSelect}
              accept="video/mp4,video/webm,video/ogg,video/mkv,video/quicktime"
              className="hidden"
            />
            <button
              onClick={triggerVideoSelect}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 border-2 border-primary rounded-xl hover:bg-warning-light hover:text-dark disabled:opacity-50 shadow-neo transition-all duration-200"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('common.uploading')}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  {t('videoMat.uploadVideo')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 视频列表 */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-info border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-primary-placeholder">
            <Video className="w-12 h-12 mb-3 opacity-50" />
            <p>{t('videoMat.noVideos')}</p>
            <p className="text-sm mt-1">{t('videoMat.clickUploadHint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className="bg-white rounded-[24px] border-2 border-stroke-light overflow-hidden cursor-pointer transition-all duration-200 hover:border-primary hover:shadow-[4px_4px_0px_0px_var(--color-dark)] hover:-translate-y-1"
              >
                {/* 视频预览 */}
                <div className="relative aspect-video bg-dark">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-12 h-12 text-primary-secondary" />
                    </div>
                  )}
                  {/* 播放按钮 */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                    <button className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white">
                      <Play className="w-6 h-6 text-info ml-1" />
                    </button>
                  </div>
                  {/* 时长 */}
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-xs rounded">
                      {video.duration}
                    </div>
                  )}
                </div>

                {/* 视频信息 */}
                <div className="p-4">
                  <h3 className="font-medium text-primary truncate" title={video.name}>
                    {video.name}
                  </h3>
                  {video.description && (
                    <p className="text-sm text-primary-muted mt-1 truncate" title={video.description}>
                      {video.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t-2 border-stroke-light">
                    <button
                      onClick={() => openModal('edit', video)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-dark hover:bg-warning-light border border-transparent hover:border-primary rounded-xl transition-all duration-200 font-medium"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      {t('common.edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-error hover:bg-error-light border border-transparent hover:border-error rounded-xl transition-all duration-200 font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      {t('common.delete')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 添加/编辑模态框 */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] border-2 border-stroke-light shadow-[4px_4px_0px_0px_var(--color-dark)] w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b-2 border-stroke-light">
              <h3 className="text-lg font-semibold text-primary">
                {modalType === 'add' ? t('videoMat.addTitle') : t('videoMat.editTitle')}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-surface-alt rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-primary-placeholder" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 视频预览 */}
              {modalData.video_url && (
                <div className="relative rounded-lg overflow-hidden bg-dark aspect-video">
                  <video
                    src={modalData.video_url}
                    className="w-full h-full object-contain"
                    controls
                  />
                </div>
              )}

              {/* 视频名称 */}
              <div>
                <label className="block text-sm font-medium text-primary-secondary mb-1">
                  {t('videoMat.nameLabel')} <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={modalData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t('videoMat.namePlaceholder')}
                  className="w-full px-4 py-2 border-2 border-stroke-light rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-primary outline-none transition-all duration-200"
                />
              </div>

              {/* 视频描述 */}
              <div>
                <label className="block text-sm font-medium text-primary-secondary mb-1">
                  {t('videoMat.descLabel')}
                </label>
                <textarea
                  value={modalData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder={t('videoMat.descPlaceholder')}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-stroke-light rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-primary outline-none resize-none transition-all duration-200"
                />
              </div>

              {/* 标签 */}
              <div>
                <label className="block text-sm font-medium text-primary-secondary mb-1">
                  {t('common.tags')}
                </label>
                <input
                  type="text"
                  value={modalData.tags?.join(', ') || ''}
                  onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(s => s.trim()))}
                  placeholder={t('videoMat.tagsPlaceholder')}
                  className="w-full px-4 py-2 border-2 border-stroke-light rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-primary outline-none transition-all duration-200"
                />
              </div>

              {/* 运镜 */}
              <div>
                <label className="block text-sm font-medium text-primary-secondary mb-1">
                  {t('videoMat.cameraMovement')}
                </label>
                <input
                  type="text"
                  value={modalData.camera_movement || ''}
                  onChange={(e) => handleInputChange('camera_movement', e.target.value)}
                  placeholder={t('videoMat.cameraPlaceholder')}
                  className="w-full px-4 py-2 border-2 border-stroke-light rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-primary outline-none transition-all duration-200"
                />
              </div>

              {/* 画面内容 */}
              <div>
                <label className="block text-sm font-medium text-primary-secondary mb-1">
                  {t('videoMat.sceneContent')}
                </label>
                <textarea
                  value={modalData.scene_content || ''}
                  onChange={(e) => handleInputChange('scene_content', e.target.value)}
                  placeholder={t('videoMat.scenePlaceholder')}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-stroke-light rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-primary outline-none resize-none transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t-2 border-stroke-light bg-surface">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-dark border-2 border-stroke-light rounded-xl hover:bg-warning-light hover:border-primary transition-all duration-200 font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={modalType === 'add' ? handleConfirmAdd : handleConfirmEdit}
                disabled={!modalData.name}
                className="flex items-center gap-2 px-4 py-2 bg-dark text-white border-2 border-primary rounded-xl hover:bg-warning-light hover:text-dark disabled:opacity-50 disabled:cursor-not-allowed shadow-neo transition-all duration-200 font-bold"
              >
                <Check className="w-4 h-4" />
                {modalType === 'add' ? t('common.add') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoMaterialManagement;
