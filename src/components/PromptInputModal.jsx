import React, { useState } from 'react';
import { X, Type, Edit } from 'lucide-react';

/**
 * PromptInputModal - 内容输入模态框
 * 用于手动输入文本内容
 * 简化版：移除AI生成功能，保留直接输入模式
 */
export const PromptInputModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = '输入内容',
  description = '请输入您的内容',
  placeholder = '请输入内容...',
  initialContent = '',
  type = 'text', // 'text' | 其他
  isLoading = false
}) => {
  const [content, setContent] = useState(initialContent);

  React.useEffect(() => {
    if (isOpen) {
      setContent(initialContent || '');
    }
  }, [isOpen, initialContent]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!content.trim()) return;
    onConfirm(content);
    setContent('');
  };

  const handleClose = () => {
    setContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">{title}</h3>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">内容</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none h-32"
              autoFocus
            />
            <p className="text-xs text-slate-400 mt-2">
              提示：直接输入文本内容，将立即添加到画布
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || !content.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <Edit className="w-4 h-4" />
              确认添加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
