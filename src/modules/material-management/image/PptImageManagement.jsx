import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Image,
  X,
  Check,
  Upload
} from 'lucide-react';
import apiService from '../../../services/api';
import uploadService from '../../../services/uploadService';

export const PptImageManagement = () => {
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState({});
  const [pptImages, setPptImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // 从 API 获取数据
  useEffect(() => {
    const fetchImages = async () => {
      try {
        setLoading(true);
        const result = await apiService.getPptImages();
        setPptImages(result.data || []);
      } catch (err) {
        console.error('获取PPT图片失败:', err);
        setPptImages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  // 打开模态框
  const openModal = (type, data = {}) => {
    setModalType(type);
    setModalData(data);
  };

  // 关闭模态框
  const closeModal = () => {
    if (modalData.previewUrl) {
      URL.revokeObjectURL(modalData.previewUrl);
    }
    setModalType(null);
    setModalData({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理文件选择
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 验证文件
      const validation = uploadService.validateFile(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
      // 生成本地预览 URL 用于回显
      const previewUrl = URL.createObjectURL(file);
      setModalData({ ...modalData, file, previewUrl });
    }
  };

  // 新增图片
  const handleAdd = async () => {
    if (!modalData.file && !modalData.imageUrl) {
      alert('请选择要上传的图片');
      return;
    }

    try {
      setUploading(true);

      let imageUrl = modalData.imageUrl;

      // 如果有文件，先上传到 OSS
      if (modalData.file) {
        const uploadResult = await uploadService.uploadFile(modalData.file, 'ppt-images');
        if (!uploadResult.success) {
          alert(uploadResult.error || '上传失败');
          setUploading(false);
          return;
        }
        imageUrl = uploadResult.url;
      }

      // 调用 API 保存
      const result = await apiService.createPptImage({
        name: modalData.name || modalData.file?.name || '新图片',
        imageUrl,
        tags: modalData.tags?.split(',').map(t => t.trim()) || []
      });

      if (result.data) {
        setPptImages([result.data, ...pptImages]);
      }

      closeModal();
    } catch (err) {
      console.error('新增图片失败:', err);
      alert('保存失败');
    } finally {
      setUploading(false);
    }
  };

  // 编辑图片
  const handleEdit = async () => {
    // TODO: 实现编辑功能
    console.log('Edit:', modalData);
    closeModal();
  };

  // 删除图片
  const handleDelete = async () => {
    // TODO: 实现删除功能
    console.log('Delete:', modalData);
    closeModal();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-surface">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-info border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-primary-muted">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="bg-surface border-b-2 border-stroke-light px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-primary">PPT风格图片</h2>
            <p className="text-sm text-primary-muted mt-1">管理课件背景、边框、插画等视觉素材</p>
          </div>
          <button
            onClick={() => openModal('add')}
            className="px-4 py-2 border-2 border-primary rounded-xl hover:bg-warning-light hover:text-dark flex items-center gap-2 transition-all duration-200 font-medium shadow-neo"
          >
            <Upload className="w-4 h-4" />
            上传图片
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 图片网格 */}
        <div className="grid grid-cols-5 gap-4">
          {pptImages.map((img) => (
            <div
              key={img.id}
              className="relative group bg-surface rounded-[24px] border-2 border-stroke-light overflow-hidden transition-all duration-200 hover:border-primary hover:shadow-[4px_4px_0px_0px_var(--color-dark)] hover:-translate-y-1"
            >
              {/* 预览区域 */}
              <div className="aspect-video bg-surface-alt flex items-center justify-center relative">
                {img.image_url ? (
                  <img src={img.image_url} alt={img.name} className="w-full h-full object-cover" />
                ) : (
                  <Image className="w-8 h-8 text-primary-placeholder" />
                )}

                {/* 悬停遮罩层 */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <button
                    onClick={() => openModal('edit', img)}
                    className="p-2 bg-surface rounded-lg hover:bg-info-light text-info transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openModal('delete', img)}
                    className="p-2 bg-surface rounded-lg hover:bg-error-light text-error transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200 delay-75"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 信息区域 */}
              <div className="p-3">
                <div className="text-sm font-medium text-primary mb-1 truncate">{img.name}</div>
                <div className="flex flex-wrap gap-1">
                  {(img.tags || []).slice(0, 2).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-surface-alt text-primary-muted rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {pptImages.length === 0 && (
          <div className="text-center py-12">
            <Image className="w-16 h-16 text-primary-placeholder mx-auto mb-4" />
            <p className="text-primary-muted">暂无图片</p>
          </div>
        )}
      </div>

      {/* 模态框 */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface rounded-[24px] border-2 border-stroke-light shadow-[4px_4px_0px_0px_var(--color-dark)] w-full max-w-md mx-4">
            {/* 头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-stroke-light">
              <h3 className="text-lg font-semibold text-primary">
                {modalType === 'add' && '上传图片'}
                {modalType === 'edit' && '编辑图片'}
                {modalType === 'delete' && '确认删除'}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-surface-alt rounded-lg">
                <X className="w-5 h-5 text-primary-placeholder" />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-6">
              {modalType === 'delete' ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-error-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-6 h-6 text-error" />
                  </div>
                  <p className="text-primary-secondary mb-2">确定要删除以下图片吗？</p>
                  <p className="font-medium text-primary">{modalData.name}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 图片上传预览 */}
                  <div
                    className="border-2 border-dashed border-stroke-light rounded-xl p-6 text-center hover:border-primary transition-all duration-200 cursor-pointer bg-surface"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {modalData.file ? (
                      <div className="w-full aspect-video flex items-center justify-center bg-surface-alt rounded-lg overflow-hidden">
                        <img
                          src={modalData.previewUrl}
                          alt="预览"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : modalData.image_url ? (
                      <img src={modalData.image_url} alt="Preview" className="max-h-48 mx-auto rounded" />
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-surface-alt rounded-full flex items-center justify-center mx-auto mb-3">
                          <Upload className="w-8 h-8 text-primary-placeholder" />
                        </div>
                        <p className="text-sm text-primary-secondary mb-1">点击或拖拽上传图片</p>
                        <p className="text-xs text-primary-placeholder">支持 PNG、JPG 格式，最大 10MB</p>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-secondary mb-1">图片名称</label>
                    <input
                      type="text"
                      value={modalData.name || modalData.file?.name || ''}
                      onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-stroke-light rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-primary outline-none transition-all duration-200"
                      placeholder="请输入图片名称"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-secondary mb-1">标签（逗号分隔）</label>
                    <input
                      type="text"
                      value={modalData.tags || (Array.isArray(modalData.tags) ? modalData.tags.join(',') : '')}
                      onChange={(e) => setModalData({ ...modalData, tags: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-stroke-light rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-primary outline-none transition-all duration-200"
                      placeholder="如：动物, 可爱, 彩色"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t-2 border-stroke-light">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-dark border-2 border-stroke-light rounded-xl hover:bg-warning-light hover:border-primary transition-all duration-200 font-medium"
                disabled={uploading}
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (modalType === 'add') handleAdd();
                  if (modalType === 'edit') handleEdit();
                  if (modalType === 'delete') handleDelete();
                }}
                className={`px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 font-bold shadow-neo ${
                  modalType === 'delete'
                    ? 'bg-dark text-white border-2 border-primary hover:bg-error hover:border-error'
                    : 'bg-dark text-white border-2 border-primary hover:bg-warning-light hover:text-dark'
                }`}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    上传中...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {modalType === 'delete' ? '确认删除' : '保存'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
