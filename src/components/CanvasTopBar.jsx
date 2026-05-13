import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  Copy,
  BookOpen,
  Layout
} from 'lucide-react';

const CanvasTopBar = ({
  isLeftOpen,
  onToggleLeft,
  moduleLabel,
  moduleIcon,
  currentTitle,
  pageInfo,
  tagLabel,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  extraActions,
  accentColor = 'indigo'
}) => {
  const colorMap = {
    indigo: { bg50: 'bg-indigo-50', text600: 'text-indigo-600', bg100: 'bg-indigo-100', text700: 'text-indigo-700' },
    orange: { bg50: 'bg-orange-50', text600: 'text-orange-600', bg100: 'bg-orange-100', text700: 'text-orange-700' },
    blue: { bg50: 'bg-blue-50', text600: 'text-blue-600', bg100: 'bg-blue-100', text700: 'text-blue-700' },
  };
  const c = colorMap[accentColor] || colorMap.indigo;

  const iconEl = moduleIcon === 'book' ? <BookOpen className="w-4 h-4" /> : <Layout className="w-4 h-4" />;

  return (
    <div className="h-14 bg-white border-b-2 border-stroke-light flex items-center justify-between px-6 shadow-sm z-10">
      <div className="flex items-center gap-4 min-w-0">
        {!isLeftOpen && (
          <>
            <button
              onClick={onToggleLeft}
              className="text-primary-placeholder hover:text-primary-secondary hover:bg-surface-alt p-1.5 rounded transition-colors"
              title="展开页面列表"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="font-bold text-primary-secondary flex items-center gap-2 mr-4">
              {iconEl}
              <span className="text-xs">{moduleLabel}</span>
            </div>
          </>
        )}
        {/* <span className="text-sm font-medium text-primary-muted whitespace-nowrap">当前编辑:</span> */}
        {tagLabel && (
          <span className={`px-2 py-1 ${c.bg50} ${c.text600} rounded text-xs font-medium whitespace-nowrap`}>
            {tagLabel}
          </span>
        )}
        {currentTitle && (
          <h2 className="text-sm font-bold text-primary truncate" title={currentTitle}>
            {currentTitle}
          </h2>
        )}
        {pageInfo && (
          <span className={`px-3 py-1 ${c.bg100} ${c.text700} rounded-full text-xs font-bold whitespace-nowrap`}>
            {pageInfo}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onUndo}
          disabled={canUndo === false}
          className="p-2 hover:bg-surface-alt rounded text-primary-placeholder hover:text-primary-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="撤销 (Ctrl+Z)"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={canRedo === false}
          className="p-2 hover:bg-surface-alt rounded text-primary-placeholder hover:text-primary-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="重做 (Ctrl+Shift+Z)"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-stroke"></div>
        {extraActions}
      </div>
    </div>
  );
};

export default CanvasTopBar;
