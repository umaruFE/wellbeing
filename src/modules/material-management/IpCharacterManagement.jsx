import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  User,
  X,
  Check,
  Upload
} from 'lucide-react';
import apiService from '../../services/api';
import uploadService from '../../services/uploadService';

export const IpCharacterManagement = () => {
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState({});
  const [ipCharacters, setIpCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const genderOptions = ['男', '女', '动物'];
  const styleOptions = ['教师', '学生', '吉祥物', '其他'];

  // 从 API 获取数据
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoading(true);
        const result = await apiService.getIpCharacters();
        setIpCharacters(result.data || []);
      } catch (err) {
        console.error('获取IP人物失败:', err);
        setIpCharacters([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCharacters();
  }, []);

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
  };

  // 处理文件选择
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validation = uploadService.validateFile(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
      setModalData({ ...modalData, file });
    }
  };

  // 新增人物
  const handleAdd = async () => {
    if (!modalData.file && !modalData.imageUrl) {
      alert('请选择要上传的头像图片');
      return;
    }

    try {
      setUploading(true);

      let imageUrl = modalData.imageUrl;

      // 如果有文件，先上传到 OSS
      if (modalData.file) {
        const uploadResult = await uploadService.uploadFile(modalData.file, 'ip-characters');
        if (!uploadResult.success) {
          alert(uploadResult.error || '上传失败');
          setUploading(false);
          return;
        }
        imageUrl = uploadResult.url;
      }

      // 调用 API 保存
      const result = await apiService.createIpCharacter({
        name: modalData.name || '新人物',
        gender: modalData.gender || '女',
        style: modalData.style || '教师',
        description: modalData.description || '',
        imageUrl
      });

      if (result.data) {
        setIpCharacters([result.data, ...ipCharacters]);
      }

      closeModal();
    } catch (err) {
      console.error('新增人物失败:', err);
      alert('保存失败');
    } finally {
      setUploading(false);
    }
  };

  // 编辑人物
  const handleEdit = async () => {
    // TODO: 实现编辑功能
    console.log('Edit:', modalData);
    closeModal();
  };

  // 删除人物
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
            <h2 className="text-xl font-bold text-primary">IP人物</h2>
            <p className="text-sm text-primary-muted mt-1">管理课程中使用的虚拟人物形象</p>
          </div>
          <button
            onClick={() => openModal('add')}
            className="px-4 py-2 bg-dark text-white border-2 border-primary rounded-xl hover:bg-warning-light hover:text-dark flex items-center gap-2 transition-all duration-200 font-medium shadow-neo"
          >
            <Plus className="w-4 h-4" />
            新增人物
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* 人物卡片网格 */}
        <div className="grid grid-cols-4 gap-4">
          {ipCharacters.map((char) => (
            <div
              key={char.id}
              className="group bg-surface rounded-[24px] border-2 border-stroke-light overflow-hidden transition-all duration-200 hover:border-primary hover:shadow-[4px_4px_0px_0px_var(--color-dark)] hover:-translate-y-1"
            >
              {/* 头像区域 */}
              <div className="aspect-square bg-gradient-to-br from-[#fffbe6] to-[#f5f0e6] flex items-center justify-center relative border-b-2 border-stroke-light">
                {char.image_url ? (
                  <img src={char.image_url} alt={char.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-stroke-light" />
                )}

                {/* 悬停操作按钮 */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => openModal('edit', char)}
                    className="p-1.5 bg-surface border-2 border-stroke-light rounded-lg shadow-sm hover:bg-warning-light hover:border-primary text-dark transition-all duration-200"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openModal('delete', char)}
                    className="p-1.5 bg-surface border-2 border-stroke-light rounded-lg shadow-sm hover:bg-error-light hover:border-error text-error transition-all duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 信息区域 */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-primary">{char.name}</h3>
                  <span className="px-2 py-0.5 bg-warning-light border border-stroke-light text-dark rounded text-xs">
                    {char.style}
                  </span>
                </div>
                <p className="text-sm text-primary-muted mb-3">{char.description}</p>

                {/* 性别标签 */}
                <div className="flex items-center gap-2 text-xs text-primary-placeholder">
                  <span className="px-2 py-0.5 bg-surface border border-stroke-light rounded">
                    {char.gender === '女' ? '👩' : char.gender === '男' ? '👨' : '🐾'} {char.gender}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {ipCharacters.length === 0 && (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-primary-placeholder mx-auto mb-4" />
            <p className="text-primary-muted">暂无人物</p>
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
                {modalType === 'add' && '新增人物'}
                {modalType === 'edit' && '编辑人物'}
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
                  <div className="w-16 h-16 bg-error-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-error" />
                  </div>
                  <p className="text-primary-secondary mb-2">确定要删除以下人物吗？</p>
                  <p className="font-medium text-primary text-lg">{modalData.name}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 头像上传预览 */}
                  <div
                    className="border-2 border-dashed border-stroke-light rounded-xl p-4 text-center hover:border-primary transition-all duration-200 cursor-pointer bg-surface"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {modalData.file ? (
                      <div className="w-20 h-20 mx-auto rounded-full bg-surface-alt flex items-center justify-center">
                        <User className="w-10 h-10 text-primary-placeholder" />
                        <span className="ml-2 text-xs text-primary-muted">{modalData.file.name}</span>
                      </div>
                    ) : modalData.image_url ? (
                      <img src={modalData.image_url} alt="Preview" className="w-20 h-20 mx-auto rounded-full object-cover" />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center mx-auto mb-2">
                        <User className="w-10 h-10 text-info-icon" />
                      </div>
                    )}
                    <p className="text-xs text-primary-muted">点击上传头像图片</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-secondary mb-1">人物名称</label>
                    <input
                      type="text"
                      value={modalData.name || ''}
                      onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-stroke-light rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-primary outline-none transition-all duration-200"
                      placeholder="请输入人物名称"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-secondary mb-1">性别</label>
                      <select
                        value={modalData.gender || '女'}
                        onChange={(e) => setModalData({ ...modalData, gender: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-stroke-light rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-primary outline-none transition-all duration-200"
                      >
                        {genderOptions.map(opt => (
                          <option key={opt} value={opt}>
                            {opt === '女' ? '👩' : opt === '男' ? '👨' : '🐾'} {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-secondary mb-1">类型</label>
                      <select
                        value={modalData.style || '教师'}
                        onChange={(e) => setModalData({ ...modalData, style: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-stroke-light rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-primary outline-none transition-all duration-200"
                      >
                        {styleOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-secondary mb-1">描述</label>
                    <textarea
                      value={modalData.description || ''}
                      onChange={(e) => setModalData({ ...modalData, description: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-stroke-light rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-primary outline-none resize-none"
                      rows={3}
                      placeholder="请输入人物描述"
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
