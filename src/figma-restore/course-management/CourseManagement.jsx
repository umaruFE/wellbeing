import React, { useMemo, useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { CreateCourseModal } from '../create-course';
import { CourseWorkflow } from '../course-workflow';
import { CourseCard } from './CourseCard';
import { CourseToolbar } from './CourseToolbar';
import { demoCourses } from './courseData';
import './CourseManagement.css';

export function CourseManagement({
  initialCourses = demoCourses,
  onCreateCourse,
  onOpenCourse,
  onEditCourse,
}) {
  const [courses, setCourses] = useState(initialCourses);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [workflowCourse, setWorkflowCourse] = useState(null);

  const counts = useMemo(() => ({
    all: courses.length,
    draft: courses.filter(course => course.status === 'draft').length,
    published: courses.filter(course => course.status === 'published').length,
  }), [courses]);

  const filteredCourses = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return courses.filter(course => {
      const matchesStatus = status === 'all' || course.status === status;
      const haystack = `${course.title} ${course.unit} ${course.theme} ${course.grade}`.toLowerCase();
      return matchesStatus && (!keyword || haystack.includes(keyword));
    });
  }, [courses, search, status]);

  const handleTogglePublish = (targetCourse) => {
    setCourses(currentCourses => currentCourses.map(course => {
      if (course.id !== targetCourse.id) return course;
      return {
        ...course,
        status: course.status === 'published' ? 'draft' : 'published',
      };
    }));
    setOpenMenuId(null);
  };

  const handleDelete = (targetCourse) => {
    setCourses(currentCourses => currentCourses.filter(course => course.id !== targetCourse.id));
    setOpenMenuId(null);
  };

  const handleStatusChange = (nextStatus) => {
    setStatus(nextStatus);
    setFilterOpen(false);
  };

  const handleCreateClick = () => {
    if (onCreateCourse) {
      onCreateCourse();
      return;
    }

    setCreateOpen(true);
  };

  const handleCreateSubmit = (values) => {
    const newCourse = {
      id: values.id,
      title: values.courseTitle || '新课程',
      unit: values.courseTitle || '新课程',
      status: 'draft',
      age: values.age,
      grade: 'Draft',
      duration: values.duration,
      theme: values.taskName || values.experiencePath || '情境任务',
      updatedAt: new Date().toLocaleDateString('zh-CN'),
      accent: '#ff705d',
      coverTone: 'coral',
      classSize: values.classSize,
      storyContext: values.storyContext,
      keyOutcome: values.keyOutcome,
      vocabularies: values.vocabularies,
      grammars: values.grammars,
      languageSkills: values.languageSkills,
      experiencePath: values.experiencePath,
      specialRequirements: values.specialRequirements,
      atmosphere: values.atmosphere,
      attachments: values.attachments,
    };

    setCourses(currentCourses => [newCourse, ...currentCourses]);
    setCreateOpen(false);
    setWorkflowCourse(newCourse);
  };

  if (workflowCourse) {
    return (
      <CourseWorkflow
        initialCourse={workflowCourse}
        onBack={() => setWorkflowCourse(null)}
      />
    );
  }

  return (
    <section className="fr-courses" onClick={() => setOpenMenuId(null)}>
      <div className="fr-cm-page">
        <header className="fr-cm-hero">
          <div className="fr-cm-hero-left">
            <div className="fr-cm-hero-icon">
              <BookOpen size={30} />
            </div>
            <div>
              <h1>课程管理</h1>
              <p>创建和管理您的课程</p>
            </div>
          </div>

          <button
            className="fr-cm-create"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleCreateClick();
            }}
          >
            <Plus size={22} />
            创建新课程
          </button>
        </header>

        <div className="fr-cm-panel" onClick={(event) => event.stopPropagation()}>
          <CourseToolbar
            search={search}
            status={status}
            counts={counts}
            isFilterOpen={filterOpen}
            onSearchChange={setSearch}
            onFilterToggle={() => setFilterOpen(value => !value)}
            onStatusChange={handleStatusChange}
          />

          {filteredCourses.length > 0 ? (
            <div className="fr-cm-grid">
              {filteredCourses.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  isMenuOpen={openMenuId === course.id}
                  onOpen={(item) => {
                    if (onOpenCourse) {
                      onOpenCourse(item);
                      return;
                    }
                    setWorkflowCourse(item);
                  }}
                  onEdit={(item) => {
                    setOpenMenuId(null);
                    onEditCourse?.(item);
                  }}
                  onMenuToggle={(id) => setOpenMenuId(current => current === id ? null : id)}
                  onTogglePublish={handleTogglePublish}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            <div className="fr-cm-empty">
              <BookOpen size={30} />
              <strong>暂无符合条件的课程</strong>
              <span>调整关键词或筛选条件后再试试。</span>
            </div>
          )}
        </div>
      </div>

      <CreateCourseModal
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />
    </section>
  );
}
