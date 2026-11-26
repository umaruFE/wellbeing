import { MetadataTag } from '../../components/LibraryControls';
import React from 'react';
import { Users, Clock, Award, CircleDot, CheckCircle2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DEFAULT_COVER = '/assets/empty/3a4db69c7cdec2529d41fe498ca0887f.jpg';

function CourseManagementCover({ course }) {
  const src = course.themeImageUrl || course.thumbnail;
  const [failedSrc, setFailedSrc] = React.useState(null);

  const visibleSrc = !src || failedSrc === src ? DEFAULT_COVER : src;

  return (
    <img
      className="fr-cm-cover-image"
      src={visibleSrc}
      alt=""
      loading="lazy"
      onError={visibleSrc === DEFAULT_COVER ? undefined : () => setFailedSrc(src)}
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
    <article className="fr-cm-card">
      <div className={`fr-cm-cover tone-${course.coverTone}`}>
        <CourseManagementCover course={course} />
      </div>

      <div className="fr-cm-card-body">
        <div className="fr-cm-card-head">
          <h3>
            <button type="button" className="fr-cm-open" onClick={() => onOpen(course)}>
              {course.title}
            </button>
          </h3>
          <MetadataTag tone={isPublished ? 'ready' : 'draft'}>
            {isPublished ? <CheckCircle2 /> : <CircleDot />}
            {isPublished ? t('course.published') : t('course.draft')}
          </MetadataTag>
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
          <Clock size={14} aria-hidden="true" />
          <span className="time-text">{course.updatedAt}</span>
          {onDelete && (
            <button
              type="button"
              className="fr-cm-delete-btn"
              data-wb-button="danger"
              data-wb-size="sm"
              data-wb-icon
              aria-label={`${t('course.deleteCourse')} ${course.title}`}
              title={t('course.deleteCourse')}
              onClick={() => onDelete(course)}
            >
              <Trash2 size={15} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
