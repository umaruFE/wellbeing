import React from 'react';
import { Bookmark, Edit3, Image, MoreVertical, Sparkles, Trash2, Users } from 'lucide-react';

export function CourseCard({
  course,
  isMenuOpen,
  onOpen,
  onMenuToggle,
  onEdit,
  onTogglePublish,
  onDelete,
}) {
  const isPublished = course.status === 'published';

  return (
    <article
      className={`fr-cm-card ${course.active ? 'is-active' : ''}`}
      style={{ '--course-accent': course.accent }}
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

        <button
          className="fr-cm-menu-btn"
          type="button"
          aria-label={`${course.title} 操作菜单`}
          onClick={(event) => {
            event.stopPropagation();
            onMenuToggle(course.id);
          }}
        >
          <MoreVertical size={16} />
        </button>

        {isMenuOpen && (
          <div className="fr-cm-card-menu" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => onEdit(course)}>
              <Edit3 size={14} />
              编辑课程
            </button>
            <button type="button" onClick={() => onTogglePublish(course)}>
              <Bookmark size={14} />
              {isPublished ? '取消发布' : '发布课程'}
            </button>
            <span />
            <button type="button" className="danger" onClick={() => onDelete(course)}>
              <Trash2 size={14} />
              删除课程
            </button>
          </div>
        )}
      </div>

      <div className="fr-cm-card-body">
        <div className="fr-cm-card-head">
          <h3>{course.title}</h3>
          <span className={`fr-cm-tag ${isPublished ? 'published' : 'draft'}`}>
            {isPublished ? '已发布' : '草稿'}
          </span>
        </div>

        <div className="fr-cm-meta">
          <span>
            <Users size={15} />
            {course.age} · {course.grade} · {course.duration}
          </span>
          <span>
            <Sparkles size={15} />
            {course.theme}
          </span>
        </div>

        <div className="fr-cm-footer">
          {course.unit} · 更新于 {course.updatedAt}
        </div>
      </div>
    </article>
  );
}
