import React, { useState, useEffect, useRef } from 'react';
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
import apiService from '../../services/api';
import uploadService from '../../services/uploadService';

export const VideoMaterialManagement = () => {
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState({});
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // 从 API 获取数据
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const result = await apiService.getVideos();
        setVideos(result.data || []);
      } catch (err) {
        console.error('获取视频素材失败:', err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  // 过滤搜索
  const filteredVideos = videos.filter(video =>
    video.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 打开模态框
  const openModal = (type, data = {}) => {
    setModalType(type);
    setModalData(data);
  };

  // 关闭模态框
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

  // 处理视频上传
  const handleVideoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 验证视频文件
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/mkv', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      alert('请选择 MP4、WebM、OGG 或 QuickTime 格式的视频文件');
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB
      alert('视频文件大小不能超过 100MB');
      return;
    }

    try {
      setUploading(true);
      const result = await uploadService.uploadVideo(file, 'videos');

      if (result.success) {
        openModal('add', { videoUrl: result.url });
      } else {
        alert(result.error || '上传失败');
      }
    } catch (err) {
      console.error('上传视频失败:', err);
      alert('上传失败，请重试');
    } finally {
      setUploading(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  // 确认添加视频
  const handleConfirmAdd = async () => {
    try {
      const result = await apiService.createVideo(modalData);
      if (result.data) {
        setVideos([result.data, ...videos]);
      }
      closeModal();
    } catch (err) {
      console.error('保存视频失败:', err);
      alert('保存失败，请重试');
    }
  };

  // 确认编辑视频
  const handleConfirmEdit = async () => {
    try {
      const result = await apiService.updateVideo(modalData.id, modalData);
      if (result.data) {
        setVideos(videos.map(v => v.id === modalData.id ? result.data : v));
      }
      closeModal();
    } catch (err) {
      console.error('更新视频失败:', err);
      alert('更新失败，请重试');
    }
  };

  // 删除视频
  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个视频素材吗？')) return;

    try {
      await apiService.deleteVideo(id);
      setVideos(videos.filter(v => v.id !== id));
    } catch (err) {
      console.error('删除视频失败:', err);
      alert('删除失败，请重试');
    }
  };

  // 处理表单变更
  const handleInputChange = (field, value) => {
    setModalData({ ...modalData, [field]: value });
  };

  // 触发文件选择
  const triggerVideoSelect = () => {
    if (videoInputRef.current) {
      videoInputRef.current.click();
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* 顶部操作栏 */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索视频素材..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
              />
            </div>
            <span className="text-sm text-slate-500">
              共 {filteredVideos.length} 个视频
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  上传视频
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
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Video className="w-12 h-12 mb-3 opacity-50" />
            <p>暂无视频素材</p>
            <p className="text-sm mt-1">点击上传按钮添加视频</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* 视频预览 */}
                <div className="relative aspect-video bg-slate-900">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Video className="w-12 h-12 text-slate-600" />
                    </div>
                  )}
                  {/* 播放按钮 */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                    <button className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white">
                      <Play className="w-6 h-6 text-blue-600 ml-1" />
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
                  <h3 className="font-medium text-slate-800 truncate" title={video.name}>
                    {video.name}
                  </h3>
                  {video.description && (
                    <p className="text-sm text-slate-500 mt-1 truncate" title={video.description}>
                      {video.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => openModal('edit', video)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(video.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      删除
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">
                {modalType === 'add' ? '添加视频素材' : '编辑视频素材'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 视频预览 */}
              {modalData.video_url && (
                <div className="relative rounded-lg overflow-hidden bg-slate-900 aspect-video">
                  <video
                    src={modalData.video_url}
                    className="w-full h-full object-contain"
                    controls
                  />
                </div>
              )}

              {/* 视频名称 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  视频名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={modalData.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="请输入视频名称"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* 视频描述 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  视频描述
                </label>
                <textarea
                  value={modalData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="请输入视频描述（可选）"
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              {/* 标签 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  标签
                </label>
                <input
                  type="text"
                  value={modalData.tags?.join(', ') || ''}
                  onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(t => t.trim()))}
                  placeholder="标签1, 标签2, 标签3（可选）"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* 运镜 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  运镜
                </label>
                <input
                  type="text"
                  value={modalData.camera_movement || ''}
                  onChange={(e) => handleInputChange('camera_movement', e.target.value)}
                  placeholder="请输入运镜方式（可选）"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* 画面内容 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  画面内容
                </label>
                <textarea
                  value={modalData.scene_content || ''}
                  onChange={(e) => handleInputChange('scene_content', e.target.value)}
                  placeholder="请输入画面内容描述（可选）"
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={modalType === 'add' ? handleConfirmAdd : handleConfirmEdit}
                disabled={!modalData.name}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-4 h-4" />
                {modalType === 'add' ? '添加' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoMaterialManagement;

