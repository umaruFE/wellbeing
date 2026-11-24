import i18next from 'i18next';
import React from 'react';
import { BookOpen } from 'lucide-react';
import './CourseCoverFallback.css';

export function CourseCoverFallback({ className = '' }) {
  return (
    <div className={`course-cover-fallback ${className}`} aria-label={i18next.t('imageLib.insertCover')}>
      <BookOpen className="ccf-icon" size={40} strokeWidth={1.5} aria-hidden="true" />
    </div>
  );
}
