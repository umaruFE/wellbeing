import React from 'react';
import { Users, Clock, Award, CircleDot, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CourseCoverFallback } from '../CourseCoverFallback';

export function CourseCard({
  course,
  onOpen,
}) {
  const { t } = useTranslation();
  const isPublished = course.status === 'published';

  return (
    <article
      className={`fr-cm-card ${course.active ? 'is-active' : ''}`}
      onClick={() => onOpen(course)}
    >
      <div className={`fr-cm-cover tone-${course.coverTone}`}>
        {course.themeImageUrl || course.thumbnail ? (
          <img className="fr-cm-cover-image" src={course.themeImageUrl || course.thumbnail} alt={course.title || t('course.noCover')} />
        ) : (
          <CourseCoverFallback />
        )}
      </div>

      <div className="fr-cm-card-body">
        <div className="fr-cm-card-head">
          <h3>{course.title}</h3>
          <span className={`fr-cm-tag ${isPublished ? 'published' : 'draft'}`}>
            {isPublished ? <CheckCircle2 /> : <CircleDot />}
            {isPublished ? t('course.published') : t('course.draft')}
          </span>
        </div>

        <div className="fr-cm-meta">
          <Award size={12} />
          <span className="meta-text">{course.age}</span>
          <span className="meta-divider">·</span>
          <Clock size={12} />
          <span className="meta-text">{course.duration}</span>
          <span className="meta-divider">·</span>
          <Users size={12} />
          <span className="meta-text">{course.classSize || t('course.defaultClassSize')}</span>
        </div>

        <div className="fr-cm-footer">
          <Clock size={14} />
          <span className="time-text">{course.updatedAt}</span>
        </div>
      </div>
    </article>
  );
}
