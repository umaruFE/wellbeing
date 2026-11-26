import { CreateButton, LibrarySearch, MetadataTag } from '../../components/LibraryControls';
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { PageLoading } from '../../components/PageLoading';
import { Modal, message } from 'antd';
import {
  Edit,
  Trash2,
  User,
  Check,
  Upload
} from 'lucide-react';
import apiService from '../../services/api';
import uploadService from '../../services/uploadService';
import { MaterialLibraryFeedback } from './MaterialLibraryControls';

export const IpCharacterManagement = () => {
  const { t } = useTranslation();
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState({});
  const [ipCharacters, setIpCharacters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [search, setSearch] = useState('');
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
        setLoadError(false);
        const result = await apiService.getIpCharacters();
        setIpCharacters(result.data || []);
      } catch (err) {
        console.error('fetch ip characters failed:', err);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCharacters();
  }, [loadAttempt]);

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
    message.info(t('common.featureUnavailable'));
    closeModal();
  };

  const handleDelete = async () => {
    message.info(t('common.featureUnavailable'));
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

  const query = search.trim().toLowerCase();
  const visibleCharacters = ipCharacters.filter((character) => [character.name, character.description, character.style]
    .some((value) => String(value || '').toLowerCase().includes(query)));

  return (
    <div className="h-full flex flex-col bg-[var(--wb-page)]">
      {/* 头部 */}
      <header className="wb-library-header px-4 sm:px-7 pt-7 pb-5 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1>{t('assetGenerator.ipCharacter')}</h1>
            <p className="text-sm text-[var(--wb-muted)] mt-1">{t('ipCharacter.subtitle')}</p>
          </div>
          <CreateButton onClick={() => openModal('add')}>{t('ipCharacter.addCharacter')}</CreateButton>
        </div>
      </header>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-7 pb-7 min-w-0">
        <LibrarySearch className="mb-5" label={t('common.search')} value={search} onChange={setSearch} />
        {loading ? <PageLoading /> : loadError ? (
          <MaterialLibraryFeedback error={t('common.loadFailed')} onRetry={() => setLoadAttempt((n) => n + 1)} />
        ) : visibleCharacters.length === 0 ? (
          <MaterialLibraryFeedback empty={t('ipCharacter.noCharacters')} filtered={Boolean(query)} onReset={() => setSearch('')} />
        ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {visibleCharacters.map((char) => (
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

                <div className="absolute top-2 right-2 flex gap-1 rounded-[var(--wb-control-radius)] bg-[var(--wb-surface)] p-1 shadow-sm">
                  <button
                    type="button"
                    onClick={() => openModal('edit', char)}
                    data-wb-button="quiet" data-wb-size="sm" data-wb-icon aria-label={t('common.edit')}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openModal('delete', char)}
                    data-wb-button="danger" data-wb-size="sm" data-wb-icon aria-label={t('common.delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 信息区域 */}
              <div className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <h3 className="font-semibold text-[var(--wb-text)]">{char.name}</h3>
                  <MetadataTag>{char.style}</MetadataTag>
                </div>
                <p className="text-sm text-[var(--wb-muted)] mb-3">{char.description}</p>

                {/* 性别标签 */}
                <div className="flex items-center gap-2 text-xs text-[var(--wb-muted)]">
                  <MetadataTag>{getGenderEmoji(char.gender)} {getGenderLabel(char.gender)}</MetadataTag>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* 模态框 */}
      <Modal
        open={Boolean(modalType)}
        title={modalType && t(({ add: 'ipCharacter.addCharacter', edit: 'ipCharacter.editCharacter', delete: 'common.confirmDelete' })[modalType])}
        onCancel={closeModal}
        footer={null}
        maskClosable={false}
        keyboard={!uploading}
        closable={!uploading}
      >
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
              <label
                className="block border border-dashed border-[var(--wb-border)] rounded-[var(--wb-control-radius)] p-4 text-center hover:border-[var(--wb-selected-border)] focus-within:outline-[var(--wb-primary)] focus-within:outline-2 transition-all duration-200 cursor-pointer bg-[var(--wb-surface)]"
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
                  className="sr-only"
                />
              </label>

              <div>
                <label htmlFor="ip-character-name" className="block text-sm font-medium text-[var(--wb-muted)] mb-1">{t('ipCharacter.characterName')}</label>
                <input id="ip-character-name"
                  type="text"
                  value={modalData.name || ''}
                  onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                  data-wb-field
                  placeholder={t('ipCharacter.namePlaceholder')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ip-character-gender" className="block text-sm font-medium text-[var(--wb-muted)] mb-1">{t('ipCharacter.gender')}</label>
                  <select id="ip-character-gender"
                    value={modalData.gender || 'female'}
                    onChange={(e) => setModalData({ ...modalData, gender: e.target.value })}
                    data-wb-field
                  >
                    {genderOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.emoji} {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="ip-character-style" className="block text-sm font-medium text-[var(--wb-muted)] mb-1">{t('ipCharacter.type')}</label>
                  <select id="ip-character-style"
                    value={modalData.style || 'teacher'}
                    onChange={(e) => setModalData({ ...modalData, style: e.target.value })}
                    data-wb-field
                  >
                    {styleOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="ip-character-description" className="block text-sm font-medium text-[var(--wb-muted)] mb-1">{t('common.description')}</label>
                <textarea id="ip-character-description"
                  value={modalData.description || ''}
                  onChange={(e) => setModalData({ ...modalData, description: e.target.value })}
                  data-wb-field
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
            type="button"
            onClick={closeModal}
            data-wb-button="secondary"
            disabled={uploading}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => {
              if (modalType === 'add') handleAdd();
              if (modalType === 'edit') handleEdit();
              if (modalType === 'delete') handleDelete();
            }}
            data-wb-button={modalType === 'delete' ? 'danger' : 'primary'}
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
                {modalType === 'delete' ? t('common.delete') : t('common.save')}
              </>
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
};
