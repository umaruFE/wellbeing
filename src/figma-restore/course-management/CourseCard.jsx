import React from 'react';
import { Image, Users, Clock, Award, CircleDot, CheckCircle2 } from 'lucide-react';

export function CourseCard({
  course,
  onOpen,
}) {
  const isPublished = course.status === 'published';

  return (
    <article
      className={`fr-cm-card ${course.active ? 'is-active' : ''}`}
      onClick={() => onOpen(course)}
    >
      <div className={`fr-cm-cover tone-${course.coverTone}`}>
        <div className="fr-cm-cover-scene" aria-hidden="true">
          <span className="fr-cm-cover-orbit" />
          <span className="fr-cm-cover-block block-a" />
          <span className="fr-cm-cover-block block-b" />
          <Image size={30} />
          <span>暂无封面</span>
        </div>
      </div>

      <div className="fr-cm-card-body">
        <div className="fr-cm-card-head">
          <h3>{course.title}</h3>
          <span className={`fr-cm-tag ${isPublished ? 'published' : 'draft'}`}>
            {isPublished ? <CheckCircle2 /> : <CircleDot />}
            {isPublished ? '已发布' : '草稿'}
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
          <span className="meta-text">{course.classSize || '9-15人'}</span>
        </div>

        <div className="fr-cm-footer">
          <Clock size={14} />
          <span className="time-text">{course.updatedAt}</span>
        </div>
      </div>
    </article>
  );
}
