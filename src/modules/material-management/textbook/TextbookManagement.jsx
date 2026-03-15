import React, { useState, useEffect } from 'react';
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
        setError('加载教材失败');
        // 如果 API 失败，使用空数组
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
        name: modalData.name || '新教材',
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
      alert('新增失败');
    }
  };

  // 新增年级
  const handleAddGrade = async () => {
    try {
      const result = await apiService.createTextbookUnit({
        action: 'grade',
        textbookTypeId: selectedItem.id,
        name: modalData.name || modalData.grade || '新年级',
        grade: modalData.grade || modalData.name || '新年级'
      });
      // 重新获取数据
      const allResult = await apiService.getTextbooks();
      setTextbooks(allResult.data || []);
      closeModal();
    } catch (err) {
      console.error('新增年级失败:', err);
      alert('新增失败');
    }
  };

  // 新增单元
  const handleAddUnit = async () => {
    try {
      const result = await apiService.createTextbookUnit({
        action: 'unit',
        textbookTypeId: selectedItem.textbook_type_id || selectedItem.id,
        gradeId: selectedItem.id,
        name: modalData.name || '新单元',
        unitCode: modalData.unit || '',
        keywords: modalData.keywords?.split(',').map(k => k.trim()) || []
      });
      // 重新获取数据
      const allResult = await apiService.getTextbooks();
      setTextbooks(allResult.data || []);
      closeModal();
    } catch (err) {
      console.error('新增单元失败:', err);
      alert('新增失败');
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
            isSelected ? 'bg-[#fffbe6] border-l-2 border-[#2d2d2d]' : 'hover:bg-[#fffbe6] hover:border-l-2 hover:border-[#e5e3db]'
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => handleSelectItem(item, level)}
        >
          {hasChildren && (
            <ChevronRight
              className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(item.id);
              }}
            />
          )}
          {!hasChildren && <span className="w-4 h-4" />}
          <FolderOpen className={`w-4 h-4 ${level === 0 ? 'text-blue-500' : level === 1 ? 'text-green-500' : 'text-orange-500'}`} />
          <span className="text-sm text-slate-700">{item.name}</span>
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
    return (
      <div className="h-full flex items-center justify-center bg-[#fcfbf9]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left - Textbook Tree */}
      <div className="w-80 bg-[#fcfbf9] border-r-2 border-[#e5e3db] flex flex-col shrink-0">
        {/* Search Box */}
        <div className="p-4 border-b-2 border-[#e5e3db]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索教材、年级、单元..."
              className="w-full pl-10 pr-4 py-2 border-2 border-[#e5e3db] rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-[#2d2d2d] outline-none text-sm transition-all duration-200"
            />
          </div>
        </div>

        {/* Textbook Tree */}
        <div className="flex-1 overflow-y-auto py-2">
          {filteredTextbooks.map(item => renderTreeItem(item))}
        </div>

        {/* Bottom Button */}
        <div className="p-4 border-t-2 border-[#e5e3db] space-y-2">
          <button
            onClick={() => openModal('add')}
            className="w-full px-4 py-2 border-2 border-[#2d2d2d] rounded-xl hover:bg-[#fffbe6] hover:text-[#2d2d2d] flex items-center justify-center gap-2 transition-all duration-200 font-medium shadow-[2px_2px_0px_0px_rgba(45,45,45,1)]"
          >
            <Plus className="w-4 h-4" />
            新增教材
          </button>
        </div>
      </div>

      {/* Right - Detail Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedItem ? (
          <>
            {/* Detail Header */}
            <div className="bg-[#fcfbf9] border-b-2 border-[#e5e3db] px-6 py-4 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                    <span>{selectedItem.type || selectedItem.grade || '教材'}</span>
                    {selectedItem.grade && (
                      <>
                        <ChevronRight className="w-4 h-4" />
                        <span>{selectedItem.grade}</span>
                      </>
                    )}
                    {selectedItem.unit && (
                      <>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-blue-600">{selectedItem.unit}</span>
                      </>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-slate-800">{selectedItem.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openModal('edit', { ...selectedItem, level: selectedLevel })}
                    className="px-3 py-2 border-2 border-[#e5e3db] text-[#2d2d2d] rounded-xl hover:bg-[#fffbe6] hover:border-[#2d2d2d] flex items-center gap-2 text-sm transition-all duration-200 font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    编辑
                  </button>
                  {selectedLevel === 0 && (
                    <button
                      onClick={() => openModal('addGrade')}
                      className="px-3 py-2 border-2 border-[#e5e3db] text-[#2d2d2d] rounded-xl hover:bg-[#fffbe6] hover:border-[#2d2d2d] flex items-center gap-2 text-sm transition-all duration-200 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      新增年级
                    </button>
                  )}
                  {selectedLevel === 1 && (
                    <button
                      onClick={() => openModal('addUnit')}
                      className="px-3 py-2 border-2 border-[#e5e3db] text-[#2d2d2d] rounded-xl hover:bg-[#fffbe6] hover:border-[#2d2d2d] flex items-center gap-2 text-sm transition-all duration-200 font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      新增单元
                    </button>
                  )}
                  <button
                    onClick={() => openModal('delete', { ...selectedItem, level: selectedLevel })}
                    className="px-3 py-2 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-600 flex items-center gap-2 text-sm transition-all duration-200 font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </div>
              </div>
            </div>

            {/* Detail Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Basic Info */}
                <div className="bg-[#fcfbf9] rounded-[24px] border-2 border-[#e5e3db] p-5 transition-all duration-200 hover:border-[#2d2d2d] hover:shadow-[4px_4px_0px_0px_rgba(45,45,45,1)] hover:-translate-y-1">
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Book className="w-5 h-5 text-blue-600" />
                    基础信息
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b-2 border-[#e5e3db]">
                      <span className="text-slate-500">名称</span>
                      <span className="text-slate-800 font-medium">{selectedItem.name}</span>
                    </div>
                    {selectedItem.type && (
                      <div className="flex justify-between py-2 border-b-2 border-[#e5e3db]">
                        <span className="text-slate-500">教材类型</span>
                        <span className="text-slate-800 font-medium">{selectedItem.type}</span>
                      </div>
                    )}
                    {selectedItem.grade && (
                      <div className="flex justify-between py-2 border-b-2 border-[#e5e3db]">
                        <span className="text-slate-500">适用年级</span>
                        <span className="text-slate-800 font-medium">{selectedItem.grade}</span>
                      </div>
                    )}
                    {selectedItem.unit_code && (
                      <div className="flex justify-between py-2 border-b-2 border-[#e5e3db]">
                        <span className="text-slate-500">单元编号</span>
                        <span className="text-slate-800 font-medium">{selectedItem.unit_code}</span>
                      </div>
                    )}
                    {selectedItem.keywords && (
                      <div className="flex justify-between py-2">
                        <span className="text-slate-500">关键词</span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {(Array.isArray(selectedItem.keywords) ? selectedItem.keywords : []).map((kw, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
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
              <Layers className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">请从左侧选择教材单元</p>
              <p className="text-sm text-slate-400 mt-1">支持三级分类：教材 {'>'} 年级 {'>'} 单元</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#fcfbf9] rounded-[24px] border-2 border-[#e5e3db] shadow-[4px_4px_0px_0px_rgba(45,45,45,1)] w-full max-w-md mx-4">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#e5e3db]">
              <h3 className="text-lg font-semibold text-slate-800">
                {modalType === 'add' && '新增教材'}
                {modalType === 'addGrade' && '新增年级'}
                {modalType === 'addUnit' && '新增单元'}
                {modalType === 'edit' && '编辑'}
                {modalType === 'delete' && '确认删除'}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {modalType === 'delete' ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-slate-600 mb-2">确定要删除以下内容吗？</p>
                  <p className="font-medium text-slate-800">{modalData.name}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">名称</label>
                    <input
                      type="text"
                      value={modalData.name || ''}
                      onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-[#e5e3db] rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-[#2d2d2d] outline-none transition-all duration-200"
                      placeholder="请输入名称"
                    />
                  </div>

                  {(modalType === 'add' || modalType === 'edit') && modalData.level === 0 && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">教材类型</label>
                      <input
                        type="text"
                        value={modalData.type || modalData.name || ''}
                        onChange={(e) => setModalData({ ...modalData, type: e.target.value, name: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-[#e5e3db] rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-[#2d2d2d] outline-none transition-all duration-200"
                        placeholder="如：人教版、外研版"
                      />
                    </div>
                  )}

                  {(modalType === 'addGrade' || modalType === 'edit') && modalData.level === 1 && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">年级</label>
                      <input
                        type="text"
                        value={modalData.grade || modalData.name || ''}
                        onChange={(e) => setModalData({ ...modalData, grade: e.target.value, name: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-[#e5e3db] rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-[#2d2d2d] outline-none transition-all duration-200"
                        placeholder="如：三年级、四年级"
                      />
                    </div>
                  )}

                  {modalType === 'addUnit' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">单元名称</label>
                        <input
                          type="text"
                          value={modalData.name || ''}
                          onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-[#e5e3db] rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-[#2d2d2d] outline-none transition-all duration-200"
                          placeholder="如：Unit 1: Hello"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">单元编号</label>
                        <input
                          type="text"
                          value={modalData.unit || ''}
                          onChange={(e) => setModalData({ ...modalData, unit: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-[#e5e3db] rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-[#2d2d2d] outline-none transition-all duration-200"
                          placeholder="如：Unit 1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">关键词（逗号分隔）</label>
                        <input
                          type="text"
                          value={modalData.keywords || ''}
                          onChange={(e) => setModalData({ ...modalData, keywords: e.target.value })}
                          className="w-full px-4 py-2 border-2 border-[#e5e3db] rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-[#2d2d2d] outline-none transition-all duration-200"
                          placeholder="如：Hello, Hi, I"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Buttons */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t-2 border-[#e5e3db]">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-[#2d2d2d] border-2 border-[#e5e3db] rounded-xl hover:bg-[#fffbe6] hover:border-[#2d2d2d] transition-all duration-200 font-medium"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (modalType === 'add') handleAdd();
                  if (modalType === 'addGrade') handleAddGrade();
                  if (modalType === 'addUnit') handleAddUnit();
                  if (modalType === 'edit') handleEdit();
                  if (modalType === 'delete') handleDelete();
                }}
                className={`px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 font-bold shadow-[2px_2px_0px_0px_rgba(45,45,45,1)] ${
                  modalType === 'delete'
                    ? 'bg-[#2d2d2d] text-white border-2 border-[#2d2d2d] hover:bg-red-600 hover:border-red-600'
                    : 'bg-[#2d2d2d] text-white border-2 border-[#2d2d2d] hover:bg-[#fffbe6] hover:text-[#2d2d2d]'
                }`}
              >
                <Check className="w-4 h-4" />
                {modalType === 'delete' ? '确认删除' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
