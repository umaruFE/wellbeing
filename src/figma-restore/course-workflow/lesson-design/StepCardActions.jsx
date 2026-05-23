import React from 'react';
import { BookOpen, Edit3, MoreVertical, SlidersHorizontal } from 'lucide-react';

export function StepCardActions({ onDetail, onEdit, onAdjust, onMore }) {
  return (
    <div className="step-card-footer">
      <button type="button" className="step-card-action" onClick={onDetail}>
        <BookOpen size={14} />
        详情
      </button>
      <button type="button" className="step-card-action" onClick={onEdit}>
        <Edit3 size={14} />
        编辑
      </button>
      <button type="button" className="step-card-action" onClick={onAdjust}>
        <SlidersHorizontal size={14} />
        调整参数
      </button>
      <button type="button" className="step-card-action icon" onClick={onMore} aria-label="更多操作">
        <MoreVertical size={14} />
      </button>
    </div>
  );
}
