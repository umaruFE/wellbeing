import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  onRestore,
  onClose 
}) => {
  const [selectedIndex, setSelectedIndex] = useState(currentVersionIndex);
  const { t, i18n } = useTranslation();

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
    if (confirm(t('historyVersion.restoreConfirm'))) {
      // 恢复版本时，调用onRestore回调来实际应用数据
      if (onRestore) {
        onRestore(selectedIndex);
      } else {
        // 如果没有提供onRestore，则调用onSelectVersion作为后备
        onSelectVersion?.(selectedIndex);
      }
      // 恢复后可以选择关闭侧边栏
      onClose?.();
    }
  };

  const currentVersion = historyVersions[selectedIndex];

  return (
    <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="p-6 border-b-2 border-stroke-light flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-info p-2 rounded-lg text-white">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-primary">{t('historyVersion.title')}</h2>
              <p className="text-xs text-primary-muted">{t('historyVersion.hint')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-surface-alt rounded-lg text-primary-placeholder hover:text-primary-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Version Info Bar */}
        <div className="px-6 py-4 bg-surface border-b-2 border-stroke-light flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="text-primary-muted">{t('historyVersion.version')} </span>
              <span className="font-bold text-info">{selectedIndex + 1}</span>
              <span className="text-primary-placeholder"> / {historyVersions.length}</span>
            </div>
            {currentVersion && (
              <div className="text-xs text-primary-muted flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>{new Date(currentVersion.timestamp).toLocaleString(i18n.language?.startsWith('en') ? 'en-US' : 'zh-CN')}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevious}
              disabled={selectedIndex === 0}
              className="px-4 py-2 bg-white border-2 border-stroke-light rounded-xl text-dark hover:bg-warning-light hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              {t('historyVersion.previous')}
            </button>
            <button
              onClick={handleNext}
              disabled={selectedIndex === historyVersions.length - 1}
              className="px-4 py-2 bg-white border-2 border-stroke-light rounded-xl text-dark hover:bg-warning-light hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all font-medium"
            >
              {t('historyVersion.next')}
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleRestore}
              className="px-4 py-2 bg-info text-white rounded-lg hover:bg-info-active flex items-center gap-2 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              {t('historyVersion.restore')}
            </button>
          </div>
        </div>

        {/* Version Content */}
        <div className="flex-1 overflow-auto p-6">
          {currentVersion ? (
            <div className="space-y-4">
              {currentVersion.description && (
                <div className="bg-info-light border border-info-border rounded-lg p-4">
                  <p className="text-sm text-info-active">{currentVersion.description}</p>
                </div>
              )}
              
              {/* Version Data Preview */}
              <div className="bg-surface rounded-xl p-4 border-2 border-stroke-light">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-primary-muted" />
                  <span className="text-xs font-bold text-primary-muted uppercase">{t('historyVersion.preview')}</span>
                </div>
                <pre className="text-xs text-dark overflow-auto max-h-96 bg-white p-4 rounded-xl border-2 border-stroke-light">
                  {JSON.stringify(currentVersion.data, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-primary-placeholder">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('historyVersion.empty')}</p>
            </div>
          )}
        </div>
    </div>
  );
};

