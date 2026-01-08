import React, { useState } from 'react';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  RotateCcw,
  RotateCw,
  X,
  CheckCircle2,
  FileText
} from 'lucide-react';

/**
 * HistoryVersionView - 历史版本查看页面
 * 支持向前向后回滚查看历史版本
 */
export const HistoryVersionView = ({ 
  historyVersions = [], 
  currentVersionIndex = 0,
  onSelectVersion,
  onClose 
}) => {
  const [selectedIndex, setSelectedIndex] = useState(currentVersionIndex);

  const handlePrevious = () => {
    if (selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      setSelectedIndex(newIndex);
      onSelectVersion?.(newIndex);
    }
  };

  const handleNext = () => {
    if (selectedIndex < historyVersions.length - 1) {
      const newIndex = selectedIndex + 1;
      setSelectedIndex(newIndex);
      onSelectVersion?.(newIndex);
    }
  };

  const handleRestore = () => {
    if (confirm('确定要恢复到该版本吗？当前未保存的更改将丢失。')) {
      onSelectVersion?.(selectedIndex);
      onClose?.();
    }
  };

  const currentVersion = historyVersions[selectedIndex];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-800">历史版本</h2>
              <p className="text-xs text-slate-500">查看和恢复历史版本</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Version Info Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-slate-500">版本 </span>
              <span className="font-bold text-blue-600">{selectedIndex + 1}</span>
              <span className="text-slate-400"> / {historyVersions.length}</span>
            </div>
            {currentVersion && (
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>{new Date(currentVersion.timestamp).toLocaleString('zh-CN')}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={selectedIndex === 0}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              上一个
            </button>
            <button
              onClick={handleNext}
              disabled={selectedIndex === historyVersions.length - 1}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              下一个
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleRestore}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              恢复此版本
            </button>
          </div>
        </div>

        {/* Version Content */}
        <div className="flex-1 overflow-auto p-6">
          {currentVersion ? (
            <div className="space-y-4">
              {currentVersion.description && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">{currentVersion.description}</p>
                </div>
              )}
              
              {/* Version Data Preview */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-500 uppercase">版本数据预览</span>
                </div>
                <pre className="text-xs text-slate-600 overflow-auto max-h-96 bg-white p-4 rounded border border-slate-200">
                  {JSON.stringify(currentVersion.data, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂无历史版本</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

