import React, { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  User,
  X,
  Check,
  Upload
} from 'lucide-react';

export const IpCharacterManagement = () => {
  const [modalType, setModalType] = useState(null); // 'add', 'edit', 'delete'
  const [modalData, setModalData] = useState({});

  // 模拟IP人物数据
  const [ipCharacters, setIpCharacters] = useState([
    { id: 1, name: '小英老师', gender: '女', style: '教师', description: '英语教师形象，友善亲切', preview: null },
    { id: 2, name: 'Tommy猫', gender: '动物', style: '吉祥物', description: '蓝色卡通猫，活泼可爱', preview: null },
    { id: 3, name: 'Lily老师', gender: '女', style: '教师', description: '年轻女教师，温柔专业', preview: null },
    { id: 4, name: 'Sam同学', gender: '男', style: '学生', description: '三年级小学生，好奇好学', preview: null },
    { id: 5, name: 'Kitty兔', gender: '动物', style: '吉祥物', description: '粉色小兔子，温馨治愈', preview: null },
    { id: 6, name: 'Mike老师', gender: '男', style: '教师', description: '男教师形象，阳光活力', preview: null },
    { id: 7, name: 'Emma同学', gender: '女', style: '学生', description: '四年级小学生，勤奋好学', preview: null },
    { id: 8, name: 'Bunny兔', gender: '动物', style: '吉祥物', description: '绿色小兔子，聪明伶俐', preview: null },
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

  // 新增人物
  const handleAdd = () => {
    const newItem = {
      id: Date.now(),
      name: modalData.name || '新人物',
      gender: modalData.gender || '女',
      style: modalData.style || '教师',
      description: modalData.description || '',
      preview: null
    };
    setIpCharacters([...ipCharacters, newItem]);
    closeModal();
  };

  // 编辑人物
  const handleEdit = () => {
    const updated = ipCharacters.map(char => 
      char.id === modalData.id 
        ? { ...char, name: modalData.name, gender: modalData.gender, style: modalData.style, description: modalData.description }
        : char
    );
    setIpCharacters(updated);
    closeModal();
  };

  // 删除人物
  const handleDelete = () => {
    setIpCharacters(ipCharacters.filter(char => char.id !== modalData.id));
    closeModal();
  };

  const genderOptions = ['男', '女', '动物'];
  const styleOptions = ['教师', '学生', '吉祥物', '其他'];

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">IP人物</h2>
            <p className="text-sm text-slate-500 mt-1">管理课程中使用的虚拟人物形象</p>
          </div>
          <button 
            onClick={() => openModal('add')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
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
              className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-200"
            >
              {/* 头像区域 */}
              <div className="aspect-square bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center relative">
                <User className="w-16 h-16 text-blue-300" />
                
                {/* 悬停操作按钮 */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button 
                    onClick={() => openModal('edit', char)}
                    className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-blue-50 text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => openModal('delete', char)}
                    className="p-1.5 bg-white rounded-lg shadow-sm hover:bg-red-50 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 信息区域 */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-800">{char.name}</h3>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                    {char.style}
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-3">{char.description}</p>
                
                {/* 性别标签 */}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="px-2 py-0.5 bg-slate-100 rounded">
                    {char.gender === '女' ? '👩' : char.gender === '男' ? '👨' : '🐾'} {char.gender}
                  </span>
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
                {modalType === 'add' && '新增人物'}
                {modalType === 'edit' && '编辑人物'}
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
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="text-slate-600 mb-2">确定要删除以下人物吗？</p>
                  <p className="font-medium text-slate-800 text-lg">{modalData.name}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 头像上传预览 */}
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-blue-400 transition-colors cursor-pointer">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-50 to-purple-50 rounded-full flex items-center justify-center mx-auto mb-2">
                      <User className="w-10 h-10 text-blue-300" />
                    </div>
                    <p className="text-xs text-slate-500">点击上传头像图片</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">人物名称</label>
                    <input
                      type="text"
                      value={modalData.name || ''}
                      onChange={(e) => setModalData({ ...modalData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="请输入人物名称"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">性别</label>
                      <select
                        value={modalData.gender || '女'}
                        onChange={(e) => setModalData({ ...modalData, gender: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        {genderOptions.map(opt => (
                          <option key={opt} value={opt}>
                            {opt === '女' ? '👩' : opt === '男' ? '👨' : '🐾'} {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">类型</label>
                      <select
                        value={modalData.style || '教师'}
                        onChange={(e) => setModalData({ ...modalData, style: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      >
                        {styleOptions.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">描述</label>
                    <textarea
                      value={modalData.description || ''}
                      onChange={(e) => setModalData({ ...modalData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      rows={3}
                      placeholder="请输入人物描述"
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
