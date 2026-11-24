import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageLoading } from '../../../components/PageLoading';
import {
  BookOpen,
  Search,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  FolderOpen,
  Book,
  Layers,
  X,
  Check,
  Image,
  Upload
} from 'lucide-react';
import apiService from '../../../services/api';

export const TextbookManagement = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(0); // 0: textbook, 1: grade, 2: unit
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState({});
  const [textbooks, setTextbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 从 API 获取教材数据
  useEffect(() => {
    const fetchTextbooks = async () => {
      try {
        setLoading(true);
        const result = await apiService.getTextbooks();
        setTextbooks(result.data || []);
        setError(null);
      } catch (err) {
        console.error('获取教材列表失败:', err);
        setError(t('textbook.loadFailed'));
        setTextbooks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTextbooks();
  }, []);

  const toggleExpand = (id) => {
    setExpandedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectItem = (item, level) => {
    setSelectedItem(item);
    setSelectedLevel(level);
  };

  // 打开模态框
  const openModal = (type, data = {}) => {
    setModalType(type);
    setModalData(data);
  };

  // 关闭模态框
  const closeModal = () => {
    setModalType(null);
    setModalData({});
  };

  // 新增教材类型
  const handleAdd = async () => {
    try {
      const result = await apiService.createTextbookType({
        name: modalData.name || t('textbook.newTextbook'),
        description: modalData.type || ''
      });
      if (result.data) {
        setTextbooks([...textbooks, {
          ...result.data,
          children: []
        }]);
      }
      closeModal();
    } catch (err) {
      console.error('新增教材失败:', err);
      alert(t('textbook.addFailed'));
    }
  };

  // 新增年级
  const handleAddGrade = async () => {
    try {
      const result = await apiService.createTextbookUnit({
        action: 'grade',
        textbookTypeId: selectedItem.id,
        name: modalData.name || modalData.grade || t('textbook.newGrade'),
        grade: modalData.grade || modalData.name || t('textbook.newGrade')
      });
      // 重新获取数据
      const allResult = await apiService.getTextbooks();
      setTextbooks(allResult.data || []);
      closeModal();
    } catch (err) {
      console.error('新增年级失败:', err);
      alert(t('textbook.addFailed'));
    }
  };

  // 新增单元
  const handleAddUnit = async () => {
    try {
      const result = await apiService.createTextbookUnit({
        action: 'unit',
        textbookTypeId: selectedItem.textbook_type_id || selectedItem.id,
        gradeId: selectedItem.id,
        name: modalData.name || t('textbook.newUnit'),
        unitCode: modalData.unit || '',
        keywords: modalData.keywords?.split(',').map(k => k.trim()) || []
      });
      // 重新获取数据
      const allResult = await apiService.getTextbooks();
      setTextbooks(allResult.data || []);
      closeModal();
    } catch (err) {
      console.error('新增单元失败:', err);
      alert(t('textbook.addFailed'));
    }
  };

  // 编辑
  const handleEdit = () => {
    // TODO: 实现编辑功能
    console.log('Edit:', modalData);
    closeModal();
  };

  // 删除
  const handleDelete = () => {
    // TODO: 实现删除功能
    console.log('Delete:', modalData);
    closeModal();
  };

  // 搜索过滤
  const filteredTextbooks = textbooks.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();

    // 检查教材名称
    if (item.name?.toLowerCase().includes(searchLower)) return true;

    // 检查年级
    if (item.children?.some(g => g.name?.toLowerCase().includes(searchLower))) return true;

    // 检查单元
    if (item.children?.some(g =>
      g.children?.some(u => u.name?.toLowerCase().includes(searchLower))
    )) return true;

    return false;
  });

  const renderTreeItem = (item, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isSelected = selectedItem?.id === item.id;

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 cursor-pointer transition-all duration-200 ${
            isSelected ? "bg-[var(--wb-selected)] border-l border-[var(--wb-selected-border)]" : "hover:bg-[var(--wb-selected)] hover:border-l hover:border-[var(--wb-border)]"
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => handleSelectItem(item, level)}
        >
          {hasChildren && (
            <ChevronRight
              className={`w-4 h-4 text-[var(--wb-muted)] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(item.id);
              }}
            />
          )}
          {!hasChildren && <span className="w-4 h-4" />}
          <FolderOpen className={`w-4 h-4 ${level === 0 ? 'text-info-hover' : level === 1 ? 'text-success' : 'text-warning'}`} />
          <span className="text-sm text-[var(--wb-muted)]">{item.name}</span>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {item.children.map(child => renderTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // 获取选中项的层级路径
  const getSelectedPath = () => {
    if (!selectedItem) return [];
    let path = [];
    for (const tb of textbooks) {
      if (tb.id === selectedItem.id) {
        path = [tb.name];
        break;
      }
      for (const grade of (tb.children || [])) {
        if (grade.id === selectedItem.id) {
          path = [tb.name, grade.name];
          break;
        }
        for (const unit of (grade.children || [])) {
          if (unit.id === selectedItem.id) {
            path = [tb.name, grade.name, unit.name];
            break;
          }
        }
      }
    }
    return path;
  };

  if (loading) {
    return <PageLoading layout="fill" />;
  }

  return (
    <div className="h-full min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden bg-[var(--wb-page)]">
      {/* Left - Textbook Tree */}
      <div className="w-full lg:w-80 max-h-[45vh] lg:max-h-none bg-[var(--wb-surface)] border-b lg:border-b-0 lg:border-r border-[var(--wb-border)] flex flex-col shrink-0">
        {/* Search Box */}
        <div className="p-4 border-b border-[var(--wb-border)]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--wb-muted)]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('textbook.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 border border-[var(--wb-border)] rounded-[10px] focus:ring-2 focus:ring-[var(--wb-selected-border)] focus:border-[var(--wb-selected-border)] outline-none text-sm transition-all duration-200 min-h-11"
            />
          </div>
        </div>

        {/* Textbook Tree */}
        <div className="flex-1 overflow-y-auto py-2">
          {filteredTextbooks.map(item => renderTreeItem(item))}
        </div>

        {/* Bottom Button */}
        <div className="p-4 border-t border-[var(--wb-border)] space-y-2">
          <button
            onClick={() => openModal('add')}
            className="w-full px-4 py-2 border border-[var(--wb-selected-border)] rounded-[10px] hover:bg-[var(--wb-selected)] hover:text-[var(--wb-text)] flex items-center justify-center gap-2 transition-all duration-200 font-medium shadow-none min-h-10"
          >
            <Plus className="w-4 h-4" />
            {t('textbook.addTextbook')}
          </button>
        </div>
      </div>

      {/* Right - Detail Area */}
      <div className="min-w-0 min-h-[360px] lg:min-h-0 flex-1 flex flex-col overflow-visible lg:overflow-hidden">
        {selectedItem ? (
          <>
            {/* Detail Header */}
            <div className="bg-[var(--wb-surface)] border-b border-[var(--wb-border)] px-4 sm:px-6 py-4 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm text-[var(--wb-muted)] mb-1">
                    <span>{selectedItem.type || selectedItem.grade || t('textbook.textbookLabel')}</span>
                    {selectedItem.grade && (
                      <>
                        <ChevronRight className="w-4 h-4" />
                        <span>{selectedItem.grade}</span>
                      </>
                    )}
                    {selectedItem.unit && (
                      <>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-[var(--wb-primary)]">{selectedItem.unit}</span>
                      </>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-[var(--wb-text)]">{selectedItem.name}</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => openModal('edit', { ...selectedItem, level: selectedLevel })}
                    className="px-3 py-2 border border-[var(--wb-border)] text-[var(--wb-text)] rounded-[10px] hover:bg-[var(--wb-selected)] hover:border-[var(--wb-selected-border)] flex items-center gap-2 text-sm transition-all duration-200 font-medium min-h-10"
                  >
                    <Edit className="w-4 h-4" />
                    {t('common.edit')}
                  </button>
                  {selectedLevel === 0 && (
                    <button
                      onClick={() => openModal('addGrade')}
                      className="px-3 py-2 border border-[var(--wb-border)] text-[var(--wb-text)] rounded-[10px] hover:bg-[var(--wb-selected)] hover:border-[var(--wb-selected-border)] flex items-center gap-2 text-sm transition-all duration-200 font-medium min-h-10"
                    >
                      <Plus className="w-4 h-4" />
                      {t('textbook.addGrade')}
                    </button>
                  )}
                  {selectedLevel === 1 && (
                    <button
                      onClick={() => openModal('addUnit')}
                      className="px-3 py-2 border border-[var(--wb-border)] text-[var(--wb-text)] rounded-[10px] hover:bg-[var(--wb-selected)] hover:border-[var(--wb-selected-border)] flex items-center gap-2 text-sm transition-all duration-200 font-medium min-h-10"
                    >
                      <Plus className="w-4 h-4" />
                      {t('textbook.addUnit')}
                    </button>
                  )}
                  <button
                    onClick={() => openModal('delete', { ...selectedItem, level: selectedLevel })}
                    className="px-3 py-2 border border-error-border text-error rounded-[10px] hover:bg-error-light hover:border-error flex items-center gap-2 text-sm transition-all duration-200 font-medium min-h-10"
                  >
                    <Trash2 className="w-4 h-4" />
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 min-w-0">
              <div className="grid grid-cols-1 gap-6">
                {/* Basic Info */}
                <div className="bg-[var(--wb-surface)] rounded-[14px] border border-[var(--wb-border)] p-5 transition-all duration-200 hover:border-[var(--wb-selected-border)] hover:shadow-[0_4px_18px_rgba(48,43,59,0.06)] ">
                  <h3 className="font-semibold text-[var(--wb-text)] mb-4 flex items-center gap-2">
                    <Book className="w-5 h-5 text-[var(--wb-primary)]" />
                    {t('textbook.basicInfo')}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-[var(--wb-border)]">
                      <span className="text-[var(--wb-muted)]">{t('textbook.name')}</span>
                      <span className="text-[var(--wb-text)] font-medium">{selectedItem.name}</span>
                    </div>
                    {selectedItem.type && (
                      <div className="flex justify-between py-2 border-b border-[var(--wb-border)]">
                        <span className="text-[var(--wb-muted)]">{t('textbook.type')}</span>
                        <span className="text-[var(--wb-text)] font-medium">{selectedItem.type}</span>
                      </div>
                    )}
                    {selectedItem.grade && (
                      <div className="flex justify-between py-2 border-b border-[var(--wb-border)]">
                        <span className="text-[var(--wb-muted)]">{t('textbook.grade')}</span>
                        <span className="text-[var(--wb-text)] font-medium">{selectedItem.grade}</span>
                      </div>
                    )}
                    {selectedItem.unit_code && (
                      <div className="flex justify-between py-2 border-b border-[var(--wb-border)]">
                        <span className="text-[var(--wb-muted)]">{t('textbook.unitCode')}</span>
                        <span className="text-[var(--wb-text)] font-medium">{selectedItem.unit_code}</span>
                      </div>
                    )}
                    {selectedItem.keywords && (
                      <div className="flex justify-between py-2">
                        <span className="text-[var(--wb-muted)]">{t('common.tags')}</span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {(Array.isArray(selectedItem.keywords) ? selectedItem.keywords : []).map((kw, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-[var(--wb-selected)] text-[var(--wb-primary)] rounded text-xs">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Layers className="w-16 h-16 text-[var(--wb-muted)] mx-auto mb-4" />
              <p className="text-[var(--wb-muted)]">{t('textbook.selectFromLeft')}</p>
              <p className="text-sm text-[var(--wb-muted)] mt-1">{t('textbook.threeLevelHint')}</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--wb-surface)] rounded-[18px] border border-[var(--wb-border)] shadow-[0_4px_18px_rgba(48,43,59,0.06)] w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[var(--wb-border)]">
              <h3 className="text-lg font-semibold text-[var(--wb-text)]">
                {modalType === 'add' && t('textbook.addTextbook')}
                {modalType === 'addGrade' && t('textbook.addGrade')}
                {modalType === 'addUnit' && t('textbook.addUnit')}
                {modalType === 'edit' && t('common.edit')}
                {modalType === 'delete' && t('common.confirmDelete')}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-[var(--wb-page)] rounded-[10px] min-h-10">
                <X className="w-5 h-5 text-[var(--wb-muted)]" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 min-w-0">
              {modalType === 'delete' ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-error-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-6 h-6 text-error" />
                  </div>
                  <p className="text-[var(--wb-muted)] mb-2">{t('textbook.confirmDeleteMsg')}</p>
                  <p className="font-medium text-[var(--wb-text)]">{modalData.name}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--wb-muted)] mb-1">{t('textbook.name')}</label>
                    <input
                      type="text"
                      value={modalData.name || ''}
                      onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-[var(--wb-border)] rounded-[10px] focus:ring-2 focus:ring-[var(--wb-selected-border)] focus:border-[var(--wb-selected-border)] outline-none transition-all duration-200 min-h-11"
                      placeholder={t('textbook.namePlaceholder')}
                    />
                  </div>

                  {(modalType === 'add' || modalType === 'edit') && modalData.level === 0 && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--wb-muted)] mb-1">{t('textbook.type')}</label>
                      <input
                        type="text"
                        value={modalData.type || modalData.name || ''}
                        onChange={(e) => setModalData({ ...modalData, type: e.target.value, name: e.target.value })}
                        className="w-full px-4 py-2 border border-[var(--wb-border)] rounded-[10px] focus:ring-2 focus:ring-[var(--wb-selected-border)] focus:border-[var(--wb-selected-border)] outline-none transition-all duration-200 min-h-11"
                        placeholder={t('textbook.typePlaceholder')}
                      />
                    </div>
                  )}

                  {(modalType === 'addGrade' || modalType === 'edit') && modalData.level === 1 && (
                    <div>
                      <label className="block text-sm font-medium text-[var(--wb-muted)] mb-1">{t('textbook.grade')}</label>
                      <input
                        type="text"
                        value={modalData.grade || modalData.name || ''}
                        onChange={(e) => setModalData({ ...modalData, grade: e.target.value, name: e.target.value })}
                        className="w-full px-4 py-2 border border-[var(--wb-border)] rounded-[10px] focus:ring-2 focus:ring-[var(--wb-selected-border)] focus:border-[var(--wb-selected-border)] outline-none transition-all duration-200 min-h-11"
                        placeholder={t('textbook.gradePlaceholder')}
                      />
                    </div>
                  )}

                  {modalType === 'addUnit' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-[var(--wb-muted)] mb-1">{t('textbook.unitName')}</label>
                        <input
                          type="text"
                          value={modalData.name || ''}
                          onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                          className="w-full px-4 py-2 border border-[var(--wb-border)] rounded-[10px] focus:ring-2 focus:ring-[var(--wb-selected-border)] focus:border-[var(--wb-selected-border)] outline-none transition-all duration-200 min-h-11"
                          placeholder={t('textbook.unitNamePlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--wb-muted)] mb-1">{t('textbook.unitCode')}</label>
                        <input
                          type="text"
                          value={modalData.unit || ''}
                          onChange={(e) => setModalData({ ...modalData, unit: e.target.value })}
                          className="w-full px-4 py-2 border border-[var(--wb-border)] rounded-[10px] focus:ring-2 focus:ring-[var(--wb-selected-border)] focus:border-[var(--wb-selected-border)] outline-none transition-all duration-200 min-h-11"
                          placeholder={t('textbook.unitCodePlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[var(--wb-muted)] mb-1">{t('textbook.keywordsLabel')}</label>
                        <input
                          type="text"
                          value={modalData.keywords || ''}
                          onChange={(e) => setModalData({ ...modalData, keywords: e.target.value })}
                          className="w-full px-4 py-2 border border-[var(--wb-border)] rounded-[10px] focus:ring-2 focus:ring-[var(--wb-selected-border)] focus:border-[var(--wb-selected-border)] outline-none transition-all duration-200 min-h-11"
                          placeholder={t('textbook.keywordsPlaceholder')}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Buttons */}
            <div className="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-[var(--wb-border)]">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-[var(--wb-text)] border border-[var(--wb-border)] rounded-[10px] hover:bg-[var(--wb-selected)] hover:border-[var(--wb-selected-border)] transition-all duration-200 font-medium min-h-10"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  if (modalType === 'add') handleAdd();
                  if (modalType === 'addGrade') handleAddGrade();
                  if (modalType === 'addUnit') handleAddUnit();
                  if (modalType === 'edit') handleEdit();
                  if (modalType === 'delete') handleDelete();
                }}
                className={`px-4 py-2 rounded-[10px] transition-all duration-200 flex items-center gap-2 font-bold shadow-none min-h-10 ${
                  modalType === 'delete'
                    ? "bg-[var(--wb-primary)] text-white border border-[var(--wb-selected-border)] hover:bg-error hover:border-error"
                    : "bg-[var(--wb-primary)] text-white border border-[var(--wb-selected-border)] hover:bg-[var(--wb-primary-hover)] hover:text-white"
                }`}
              >
                <Check className="w-4 h-4" />
                {modalType === 'delete' ? t('common.confirmDelete') : t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
