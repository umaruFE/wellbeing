import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PageLoading } from '../../components/PageLoading';
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
  const { t } = useTranslation();
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState({});
  const [ipCharacters, setIpCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const genderOptions = [
    { value: 'male', label: t('ipCharacter.male'), emoji: '👨' },
    { value: 'female', label: t('ipCharacter.female'), emoji: '👩' },
    { value: 'animal', label: t('ipCharacter.animal'), emoji: '🐾' },
  ];
  const styleOptions = [
    { value: 'teacher', label: t('ipCharacter.teacher') },
    { value: 'student', label: t('ipCharacter.student') },
    { value: 'mascot', label: t('ipCharacter.mascot') },
    { value: 'other', label: t('ipCharacter.otherStyle') },
  ];

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        setLoading(true);
        const result = await apiService.getIpCharacters();
        setIpCharacters(result.data || []);
      } catch (err) {
        console.error('fetch ip characters failed:', err);
        setIpCharacters([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCharacters();
  }, []);

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
  };

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

  const handleAdd = async () => {
    if (!modalData.file && !modalData.imageUrl) {
      alert(t('ipCharacter.selectAvatar'));
      return;
    }

    try {
      setUploading(true);

      let imageUrl = modalData.imageUrl;

      if (modalData.file) {
        const uploadResult = await uploadService.uploadFile(modalData.file, 'ip-characters');
        if (!uploadResult.success) {
          alert(uploadResult.error || t('common.uploadFailed'));
          setUploading(false);
          return;
        }
        imageUrl = uploadResult.url;
      }

      const result = await apiService.createIpCharacter({
        name: modalData.name || t('ipCharacter.newCharacter'),
        gender: modalData.gender || 'female',
        style: modalData.style || 'teacher',
        description: modalData.description || '',
        imageUrl
      });

      if (result.data) {
        setIpCharacters([result.data, ...ipCharacters]);
      }

      closeModal();
    } catch (err) {
      console.error('add character failed:', err);
      alert(t('common.saveFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async () => {
    console.log('Edit:', modalData);
    closeModal();
  };

  const handleDelete = async () => {
    console.log('Delete:', modalData);
    closeModal();
  };

  const getGenderEmoji = (gender) => {
    if (gender === 'female' || gender === '女') return '👩';
    if (gender === 'male' || gender === '男') return '👨';
    return '🐾';
  };

  const getGenderLabel = (gender) => {
    if (gender === 'female' || gender === '女') return t('ipCharacter.female');
    if (gender === 'male' || gender === '男') return t('ipCharacter.male');
    return t('ipCharacter.animal');
  };

  if (loading) {
    return <PageLoading layout="fill" />;
  }

  return (
    <div className="h-full flex flex-col bg-[var(--wb-page)]">
      {/* 头部 */}
      <div className="bg-[var(--wb-surface)] border-b border-[var(--wb-border)] px-4 sm:px-6 py-4 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[28px] font-bold text-[var(--wb-text)]">{t('ipCharacter.title')}</h2>
            <p className="text-sm text-[var(--wb-muted)] mt-1">{t('ipCharacter.subtitle')}</p>
          </div>
          <button
            onClick={() => openModal('add')}
            className="px-4 py-2 bg-[var(--wb-primary)] text-white border border-[var(--wb-selected-border)] rounded-[10px] hover:bg-[var(--wb-primary-hover)] hover:text-white flex items-center gap-2 transition-all duration-200 font-medium shadow-none min-h-10 active:bg-[var(--wb-primary-active)]"
          >
            <Plus className="w-4 h-4" />
            {t('ipCharacter.addCharacter')}
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-w-0">
        {/* 人物卡片网格 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {ipCharacters.map((char) => (
            <div
              key={char.id}
              className="group bg-[var(--wb-surface)] rounded-[14px] border border-[var(--wb-border)] overflow-hidden transition-all duration-200 hover:border-[var(--wb-selected-border)] hover:shadow-[0_4px_18px_rgba(48,43,59,0.06)] "
            >
              {/* 头像区域 */}
              <div className="aspect-square bg-[var(--wb-selected)] flex items-center justify-center relative border-b border-[var(--wb-border)]">
                {char.image_url ? (
                  <img src={char.image_url} alt={char.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-stroke-light" />
                )}

                {/* 悬停操作按钮 */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => openModal('edit', char)}
                    className="p-1.5 bg-[var(--wb-surface)] border border-[var(--wb-border)] rounded-[10px] shadow-sm hover:bg-[var(--wb-selected)] hover:border-[var(--wb-selected-border)] text-[var(--wb-text)] transition-all duration-200 min-h-10"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openModal('delete', char)}
                    className="p-1.5 bg-[var(--wb-surface)] border border-[var(--wb-border)] rounded-[10px] shadow-sm hover:bg-error-light hover:border-error text-error transition-all duration-200 min-h-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 信息区域 */}
              <div className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-[var(--wb-text)]">{char.name}</h3>
                  <span className="px-2 py-0.5 bg-[var(--wb-selected)] border border-[var(--wb-border)] text-[var(--wb-text)] rounded text-xs">
                    {char.style}
                  </span>
                </div>
                <p className="text-sm text-[var(--wb-muted)] mb-3">{char.description}</p>

                {/* 性别标签 */}
                <div className="flex items-center gap-2 text-xs text-[var(--wb-muted)]">
                  <span className="px-2 py-0.5 bg-[var(--wb-surface)] border border-[var(--wb-border)] rounded">
                    {getGenderEmoji(char.gender)} {getGenderLabel(char.gender)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {ipCharacters.length === 0 && (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-[var(--wb-muted)] mx-auto mb-4" />
            <p className="text-[var(--wb-muted)]">{t('ipCharacter.noCharacters')}</p>
          </div>
        )}
      </div>

      {/* 模态框 */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--wb-surface)] rounded-[18px] border border-[var(--wb-border)] shadow-[0_4px_18px_rgba(48,43,59,0.06)] w-full max-w-md mx-4">
            {/* 头部 */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[var(--wb-border)]">
              <h3 className="text-lg font-semibold text-[var(--wb-text)]">
                {modalType === 'add' && t('ipCharacter.addCharacter')}
                {modalType === 'edit' && t('ipCharacter.editCharacter')}
                {modalType === 'delete' && t('common.confirmDelete')}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-[var(--wb-page)] rounded-[10px] min-h-10">
                <X className="w-5 h-5 text-[var(--wb-muted)]" />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-4 sm:p-6 min-w-0">
              {modalType === 'delete' ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-error-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-error" />
                  </div>
                  <p className="text-[var(--wb-muted)] mb-2">{t('ipCharacter.confirmDeleteMsg')}</p>
                  <p className="font-medium text-[var(--wb-text)] text-lg">{modalData.name}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 头像上传预览 */}
                  <div
                    className="border border-dashed border-[var(--wb-border)] rounded-[10px] p-4 text-center hover:border-[var(--wb-selected-border)] transition-all duration-200 cursor-pointer bg-[var(--wb-surface)]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {modalData.file ? (
                      <div className="w-20 h-20 mx-auto rounded-full bg-[var(--wb-page)] flex items-center justify-center">
                        <User className="w-10 h-10 text-[var(--wb-muted)]" />
                        <span className="ml-2 text-xs text-[var(--wb-muted)]">{modalData.file.name}</span>
                      </div>
                    ) : modalData.image_url ? (
                      <img src={modalData.image_url} alt="Preview" className="w-20 h-20 mx-auto rounded-full object-cover" />
                    ) : (
                      <div className="w-20 h-20 bg-[var(--wb-selected)] rounded-full flex items-center justify-center mx-auto mb-2">
                        <User className="w-10 h-10 text-info-icon" />
                      </div>
                    )}
                    <p className="text-xs text-[var(--wb-muted)]">{t('ipCharacter.clickToUpload')}</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--wb-muted)] mb-1">{t('ipCharacter.characterName')}</label>
                    <input
                      type="text"
                      value={modalData.name || ''}
                      onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-[var(--wb-border)] rounded-[10px] focus:ring-2 focus:ring-[var(--wb-selected-border)] focus:border-[var(--wb-selected-border)] outline-none transition-all duration-200 min-h-11"
                      placeholder={t('ipCharacter.namePlaceholder')}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--wb-muted)] mb-1">{t('ipCharacter.gender')}</label>
                      <select
                        value={modalData.gender || 'female'}
                        onChange={(e) => setModalData({ ...modalData, gender: e.target.value })}
                        className="w-full px-4 py-2 border border-[var(--wb-border)] rounded-[10px] focus:ring-2 focus:ring-[var(--wb-selected-border)] focus:border-[var(--wb-selected-border)] outline-none transition-all duration-200 min-h-11"
                      >
                        {genderOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.emoji} {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--wb-muted)] mb-1">{t('ipCharacter.type')}</label>
                      <select
                        value={modalData.style || 'teacher'}
                        onChange={(e) => setModalData({ ...modalData, style: e.target.value })}
                        className="w-full px-4 py-2 border border-[var(--wb-border)] rounded-[10px] focus:ring-2 focus:ring-[var(--wb-selected-border)] focus:border-[var(--wb-selected-border)] outline-none transition-all duration-200 min-h-11"
                      >
                        {styleOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--wb-muted)] mb-1">{t('common.description')}</label>
                    <textarea
                      value={modalData.description || ''}
                      onChange={(e) => setModalData({ ...modalData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-[var(--wb-border)] rounded-[10px] focus:ring-2 focus:ring-[var(--wb-selected-border)] focus:border-[var(--wb-selected-border)] outline-none resize-none"
                      rows={3}
                      placeholder={t('ipCharacter.descPlaceholder')}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-[var(--wb-border)]">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-[var(--wb-text)] border border-[var(--wb-border)] rounded-[10px] hover:bg-[var(--wb-selected)] hover:border-[var(--wb-selected-border)] transition-all duration-200 font-medium min-h-10"
                disabled={uploading}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  if (modalType === 'add') handleAdd();
                  if (modalType === 'edit') handleEdit();
                  if (modalType === 'delete') handleDelete();
                }}
                className={`px-4 py-2 rounded-[10px] transition-all duration-200 flex items-center gap-2 font-bold shadow-none min-h-10 ${
                  modalType === 'delete'
                    ? "bg-[var(--wb-primary)] text-white border border-[var(--wb-selected-border)] hover:bg-error hover:border-error"
                    : "bg-[var(--wb-primary)] text-white border border-[var(--wb-selected-border)] hover:bg-[var(--wb-primary-hover)] hover:text-white"
                }`}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                    {t('common.uploading')}
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    {modalType === 'delete' ? t('common.confirmDelete') : t('common.save')}
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
