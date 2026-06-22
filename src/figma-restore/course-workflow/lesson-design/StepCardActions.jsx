import React from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Edit3, MoreVertical, SlidersHorizontal } from 'lucide-react';

export function StepCardActions({ onDetail, onEdit, onAdjust, onMore, menu }) {
  const { t } = useTranslation();

  return (
    <div className="step-card-footer">
      <button type="button" className="step-card-action" onClick={onDetail}>
        <BookOpen size={14} />
        {t('lesson.detail')}
      </button>
      <button type="button" className="step-card-action" onClick={onEdit}>
        <Edit3 size={14} />
        {t('common.edit')}
      </button>
      <button type="button" className="step-card-action" onClick={onAdjust}>
        <SlidersHorizontal size={14} />
        {t('lesson.adjustParams')}
      </button>
      <span className="step-card-more-wrap">
        <button type="button" className="step-card-action icon" onClick={onMore} aria-label={t('common.more')}>
          <MoreVertical size={14} />
        </button>
        {menu}
      </span>
    </div>
  );
}
