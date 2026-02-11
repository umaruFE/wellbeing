import React, { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Image,
  X,
  Check,
  Upload
} from 'lucide-react';

export const PptImageManagement = () => {
  const [modalType, setModalType] = useState(null); // 'add', 'edit', 'delete'
  const [modalData, setModalData] = useState({});

  // 模拟PPT风格图片数据
  const [pptImages, setPptImages] = useState([
    { id: 1, name: '可爱动物背景', tags: ['动物', '可爱', '彩色'], preview: null },
    { id: 2, name: '学习场景插画', tags: ['学习', '教室', '学生'], preview: null },
    { id: 3, name: '彩虹天空背景', tags: ['天空', '彩虹', '自然'], preview: null },
    { id: 4, name: '字母卡片素材', tags: ['字母', '学习', '卡片'], preview: null },
    { id: 5, name: '教室场景背景', tags: ['教室', '学习', '场景'], preview: null },
    { id: 6, name: '食物主题插画', tags: ['食物', '水果', '健康'], preview: null },
  ]);

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

  // 新增图片
  const handleAdd = () => {
    const newItem = {
      id: Date.now(),
      name: modalData.name || '新图片',
      tags: modalData.tags?.split(',').map(t => t.trim()) || [],
      preview: null
    };
    setPptImages([...pptImages, newItem]);
    closeModal();
  };

  // 编辑图片
  const handleEdit = () => {
    const updated = pptImages.map(img => 
      img.id === modalData.id 
        ? { ...img, name: modalData.name, tags: modalData.tags?.split(',').map(t => t.trim()) || [] }
        : img
    );
    setPptImages(updated);
    closeModal();
  };

  // 删除图片
  const handleDelete = () => {
    setPptImages(pptImages.filter(img => img.id !== modalData.id));
    closeModal();
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">PPT风格图片</h2>
            <p className="text-sm text-slate-500 mt-1">管理课件背景、边框、插画等视觉素材</p>
          </div>
          <button 
            onClick={() => openModal('add')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
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
              className="relative group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-200"
            >
              {/* 预览区域 */}
              <div className="aspect-video bg-slate-100 flex items-center justify-center relative">
                <Image className="w-8 h-8 text-slate-300" />
                
                {/* 悬停遮罩层 */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  <button 
                    onClick={() => openModal('edit', img)}
                    className="p-2 bg-white rounded-lg hover:bg-blue-50 text-blue-600 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => openModal('delete', img)}
                    className="p-2 bg-white rounded-lg hover:bg-red-50 text-red-600 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200 delay-75"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 信息区域 */}
              <div className="p-3">
                <div className="text-sm font-medium text-slate-800 mb-1 truncate">{img.name}</div>
                <div className="flex flex-wrap gap-1">
                  {img.tags.slice(0, 2).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 模态框 */}
      {modalType && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            {/* 头部 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">
                {modalType === 'add' && '上传图片'}
                {modalType === 'edit' && '编辑图片'}
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
                  <p className="text-slate-600 mb-2">确定要删除以下图片吗？</p>
                  <p className="font-medium text-slate-800">{modalData.name}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 图片上传预览 */}
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Upload className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-600 mb-1">点击或拖拽上传图片</p>
                    <p className="text-xs text-slate-400">支持 PNG、JPG 格式</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">图片名称</label>
                    <input
                      type="text"
                      value={modalData.name || ''}
                      onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="请输入图片名称"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">标签（逗号分隔）</label>
                    <input
                      type="text"
                      value={modalData.tags || ''}
                      onChange={(e) => setModalData({ ...modalData, tags: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="如: 动物, 可爱, 彩色"
                    />
                  </div>
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
