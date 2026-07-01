import React from 'react';
import { Users, Clock, Award, CircleDot, CheckCircle2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CourseCoverFallback } from '../CourseCoverFallback';

function CourseManagementCover({ course }) {
  const [errored, setErrored] = React.useState(false);
  const src = course.themeImageUrl || course.thumbnail;

  React.useEffect(() => {
    setErrored(false);
  }, [src]);

  if (!src || errored) {
    return <CourseCoverFallback />;
  }

  return (
    <img
      className="fr-cm-cover-image"
      src={src}
      alt={course.title || ''}
      onError={() => setErrored(true)}
    />
  );
}

export function CourseCard({
  course,
  onOpen,
  onDelete,
}) {
  const { t } = useTranslation();
  const isPublished = course.status === 'published';

  return (
    <article
      className={`fr-cm-card ${course.active ? 'is-active' : ''}`}
      onClick={() => onOpen(course)}
    >
      <div className={`fr-cm-cover tone-${course.coverTone}`}>
        <CourseManagementCover course={course} />
        <button
          type="button"
          className="fr-cm-delete-btn"
          aria-label={t('course.deleteCourse')}
          title={t('course.deleteCourse')}
          onClick={(event) => {
            event.stopPropagation();
            onDelete?.(course);
          }}
        >
          <Trash2 size={15} />
        </button>
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
