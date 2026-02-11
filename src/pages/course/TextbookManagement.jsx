import React, { useState } from 'react';
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
  Image
} from 'lucide-react';

export const TextbookManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState(['textbook-1']);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null); // 'add', 'edit', 'delete'
  const [modalData, setModalData] = useState({});

  // 模拟教材数据 - 三级结构
  const [textbooks, setTextbooks] = useState([
    {
      id: 'textbook-1',
      name: '人教版',
      type: '人教版',
      children: [
        {
          id: 'grade-1-3',
          name: '三年级英语',
          grade: '三年级',
          children: [
            { id: 'unit-1-3-1', name: 'Unit 1: Hello', unit: 'Unit 1', keywords: ['Hello', 'Hi', 'I'] },
            { id: 'unit-1-3-2', name: 'Unit 2: Colors', unit: 'Unit 2', keywords: ['Red', 'Blue', 'Yellow'] },
            { id: 'unit-1-3-3', name: 'Unit 3: Animals', unit: 'Unit 3', keywords: ['Cat', 'Dog', 'Bird'] },
          ]
        },
        {
          id: 'grade-4-3',
          name: '四年级英语',
          grade: '四年级',
          children: [
            { id: 'unit-1-4-1', name: 'Unit 1: School', unit: 'Unit 1', keywords: ['School', 'Bag', 'Book'] },
            { id: 'unit-1-4-2', name: 'Unit 2: Numbers', unit: 'Unit 2', keywords: ['One', 'Two', 'Three'] },
          ]
        },
      ]
    },
    {
      id: 'textbook-2',
      name: '外研版',
      type: '外研版',
      children: [
        {
          id: 'grade-3-wy',
          name: '三年级英语',
          grade: '三年级',
          children: [
            { id: 'unit-1-wy-1', name: 'Module 1: Introduction', unit: 'Module 1', keywords: ['I am', 'I have', 'Good'] },
          ]
        },
      ]
    },
  ]);

  const toggleExpand = (id) => {
    setExpandedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectItem = (item) => {
    setSelectedItem(item);
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

  // 新增教材
  const handleAdd = () => {
    const newItem = {
      id: `textbook-${Date.now()}`,
      name: modalData.name || '新教材',
      type: modalData.type || '新教材',
      children: []
    };
    setTextbooks([...textbooks, newItem]);
    closeModal();
  };

  // 新增年级
  const handleAddGrade = () => {
    const newGrade = {
      id: `grade-${Date.now()}`,
      name: modalData.name || '新年级',
      grade: modalData.grade || '新年级',
      children: []
    };
    const updated = textbooks.map(tb => {
      if (tb.id === selectedItem?.id) {
        return { ...tb, children: [...tb.children, newGrade] };
      }
      return tb;
    });
    setTextbooks(updated);
    setExpandedItems([...expandedItems, selectedItem?.id]);
    closeModal();
  };

  // 新增单元
  const handleAddUnit = () => {
    const newUnit = {
      id: `unit-${Date.now()}`,
      name: modalData.name || '新单元',
      unit: modalData.unit || 'Unit',
      keywords: modalData.keywords?.split(',').map(k => k.trim()) || []
    };
    
    const updated = textbooks.map(tb => {
      const newTb = { ...tb };
      newTb.children = tb.children.map(grade => {
        if (grade.id === selectedItem?.id) {
          return { ...grade, children: [...grade.children, newUnit] };
        }
        return grade;
      });
      return newTb;
    });
    setTextbooks(updated);
    closeModal();
  };

  // 编辑
  const handleEdit = () => {
    const { id } = modalData;
    
    const updateItem = (items) => {
      return items.map(item => {
        if (item.id === id) {
          return { ...item, ...modalData };
        }
        if (item.children) {
          return { ...item, children: updateItem(item.children) };
        }
        return item;
      });
    };
    
    setTextbooks(updateItem(textbooks));
    setSelectedItem({ ...selectedItem, ...modalData });
    closeModal();
  };

  // 删除
  const handleDelete = () => {
    const { id } = modalData;
    
    const deleteItem = (items) => {
      return items.filter(item => item.id !== id).map(item => {
        if (item.children) {
          return { ...item, children: deleteItem(item.children) };
        }
        return item;
      });
    };
    
    setTextbooks(deleteItem(textbooks));
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
    closeModal();
  };

  const renderTreeItem = (item, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isSelected = selectedItem?.id === item.id;

    return (
      <div key={item.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-50 border-l-2 border-blue-600' : 'hover:bg-slate-50'
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => handleSelectItem(item)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(item.id);
              }}
              className="p-0.5 hover:bg-slate-200 rounded"
            >
              <ChevronRight
                className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            </button>
          ) : (
            <span className="w-5" />
          )}

          {level === 0 && <BookOpen className="w-4 h-4 text-blue-600" />}
          {level === 1 && <FolderOpen className="w-4 h-4 text-orange-600" />}
          {level === 2 && <Book className="w-4 h-4 text-green-600" />}

          <span className={`text-sm ${isSelected ? 'text-blue-600 font-medium' : 'text-slate-700'}`}>
            {item.name}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div className="bg-slate-50">
            {item.children.map(child => renderTreeItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredTextbooks = textbooks.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.children?.some(child =>
                           child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           child.children?.some(unit =>
                             unit.name.toLowerCase().includes(searchTerm.toLowerCase())
                           )
                         );
    return matchesSearch;
  });

  // 判断选中项的层级
  const getSelectedLevel = () => {
    if (!selectedItem) return 0;
    if (textbooks.find(tb => tb.id === selectedItem.id)) return 0;
    if (textbooks.some(tb => tb.children?.some(g => g.id === selectedItem.id))) return 1;
    return 2;
  };

  const selectedLevel = getSelectedLevel();

  return (
    <div className="h-full flex overflow-hidden">
      {/* 左侧 - 教材树 */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col shrink-0">
        {/* 搜索框 */}
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索教材、年级、单元..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* 教材树 */}
        <div className="flex-1 overflow-y-auto py-2">
          {filteredTextbooks.map(item => renderTreeItem(item))}
        </div>

        {/* 底部按钮 */}
        <div className="p-4 border-t border-slate-200">
          <button 
            onClick={() => openModal('add')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新增教材
          </button>
        </div>
      </div>

      {/* 右侧 - 详情区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedItem ? (
          <>
            {/* 详情头部 */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                    <span>{selectedItem.type || selectedItem.grade || '教材'}</span>
                    <ChevronRight className="w-4 h-4" />
                    <span>{selectedItem.grade || selectedItem.name}</span>
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
                    className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    编辑
                  </button>
                  {selectedLevel === 0 && (
                    <button 
                      onClick={() => openModal('addGrade')}
                      className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      新增年级
                    </button>
                  )}
                  {selectedLevel === 1 && (
                    <button 
                      onClick={() => openModal('addUnit')}
                      className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      新增单元
                    </button>
                  )}
                  <button 
                    onClick={() => openModal('delete', { ...selectedItem, level: selectedLevel })}
                    className="px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </div>
              </div>
            </div>

            {/* 详情内容 */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 基础信息 */}
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Book className="w-5 h-5 text-blue-600" />
                  基础信息
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">名称</span>
                    <span className="text-slate-800 font-medium">{selectedItem.name}</span>
                  </div>
                  {selectedItem.type && (
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">教材类型</span>
                      <span className="text-slate-800 font-medium">{selectedItem.type}</span>
                    </div>
                  )}
                  {selectedItem.grade && (
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">适用年级</span>
                      <span className="text-slate-800 font-medium">{selectedItem.grade}</span>
                    </div>
                  )}
                  {selectedItem.unit && (
                    <div className="flex justify-between py-2 border-b border-slate-100">
                      <span className="text-slate-500">单元编号</span>
                      <span className="text-slate-800 font-medium">{selectedItem.unit}</span>
                    </div>
                  )}
                  {selectedItem.keywords && (
                    <div className="flex justify-between py-2">
                      <span className="text-slate-500">关键词</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {selectedItem.keywords.map((kw, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 课本图片上传 - 仅单元显示 */}
              {selectedLevel === 2 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      <Image className="w-5 h-5 text-green-600" />
                      课本图片
                    </h3>
                    <button 
                      onClick={() => openModal('uploadImage')}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      上传图片
                    </button>
                  </div>
                  
                  {/* 图片网格 */}
                  <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="relative group aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-8 h-8 text-slate-300" />
                        </div>
                        {/* 悬停删除按钮 */}
                        <button 
                          onClick={() => openModal('deleteImage', { id: i })}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {/* 上传占位 */}
                    <div 
                      onClick={() => openModal('uploadImage')}
                      className="aspect-video bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors"
                    >
                      <Plus className="w-6 h-6 text-slate-400" />
                      <span className="text-xs text-slate-400 mt-1">上传</span>
                    </div>
                  </div>
                </div>
              )}
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

      {/* 模态框 */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            {/* 头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
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

            {/* 内容 */}
            <div className="p-6">
              {modalType === 'delete' ? (
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-slate-600 mb-2">确定要删除以下内容吗？</p>
                  <p className="font-medium text-slate-800">{modalData.name}</p>
                  {modalData.level === 0 && (
                    <p className="text-sm text-slate-500 mt-1">删除教材将同时删除其下所有年级和单元</p>
                  )}
                  {modalData.level === 1 && (
                    <p className="text-sm text-slate-500 mt-1">删除年级将同时删除其下所有单元</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">名称</label>
                    <input
                      type="text"
                      value={modalData.name || ''}
                      onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="请输入名称"
                    />
                  </div>
                  
                  {(modalType === 'add' || modalType === 'edit') && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">教材类型</label>
                      <input
                        type="text"
                        value={modalData.type || ''}
                        onChange={(e) => setModalData({ ...modalData, type: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="请输入教材类型"
                      />
                    </div>
                  )}

                  {(modalType === 'addGrade' || modalType === 'edit') && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">年级</label>
                      <input
                        type="text"
                        value={modalData.grade || modalData.name || ''}
                        onChange={(e) => setModalData({ ...modalData, grade: e.target.value, name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="请输入年级"
                      />
                    </div>
                  )}

                  {modalType === 'addUnit' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">单元编号</label>
                        <input
                          type="text"
                          value={modalData.unit || ''}
                          onChange={(e) => setModalData({ ...modalData, unit: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="如: Unit 1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">关键词（逗号分隔）</label>
                        <input
                          type="text"
                          value={modalData.keywords || ''}
                          onChange={(e) => setModalData({ ...modalData, keywords: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                          placeholder="如: Hello, Hi, I"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
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
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  modalType === 'delete'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
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
