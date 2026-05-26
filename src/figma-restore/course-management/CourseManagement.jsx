import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { BookOpen, Plus } from 'lucide-react';
import { CreateCourseModal } from '../create-course';
import { CourseWorkflow } from '../course-workflow';
import { CourseCard } from './CourseCard';
import { CourseToolbar } from './CourseToolbar';
import { demoCourses } from './courseData';
import apiService from '../../services/api';
import './CourseManagement.css';

export function CourseManagement({
  initialCourses = demoCourses,
  onCreateCourse,
  onOpenCourse,
  onEditCourse,
}) {
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [workflowCourse, setWorkflowCourse] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.newCourse && !workflowCourse) {
      const values = location.state.newCourse;
      const course = {
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
        courseOverview: values.courseOverview,
        themeImageUrl: values.themeImageUrl,
      };
      setWorkflowCourse(course);
      window.history.replaceState({}, '');
    }
  }, [location.state, workflowCourse]);

  const fetchCourses = useCallback(async () => {
    try {
      setCoursesLoading(true);
      const result = await apiService.getCourses();
      const list = result?.data || [];
      setCourses(list.map((course, i) => ({
        id: course.id,
        title: course.title || course.unit || '未命名课程',
        unit: course.unit || course.title || '未命名课程',
        status: course.status === 'published' ? 'published' : 'draft',
        age: course.age_group || '--',
        grade: course.age_group ? `G${course.age_group.split('-')[0]}` : '--',
        duration: course.duration ? `${course.duration}分钟` : '--',
        theme: course.theme || '情境任务',
        updatedAt: course.created_at
          ? new Date(course.created_at).toLocaleDateString('zh-CN', {
              year: 'numeric', month: '2-digit', day: '2-digit',
            }).replace(/\//g, '/')
          : '--',
        accent: ['#ff705d', '#4482e5', '#9966d0', '#509f69', '#edb100', '#f4785e'][i % 6],
        coverTone: ['coral', 'blue', 'purple', 'green', 'gold', 'rose'][i % 6],
        active: i === 0,
        courseOverview: course.course_data?.courseOverview || null,
        themeImageUrl: course.course_data?.themeImageUrl || course.theme_image_url || null,
      })));
    } catch (error) {
      console.error('获取课程列表失败:', error);
      setCourses(demoCourses);
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

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
      courseOverview: values.courseOverview,
      themeImageUrl: values.themeImageUrl,
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
    <section className="fr-courses">
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
            <Plus size={16} />
            创建新课程
          </button>
        </header>

        <div className="fr-cm-panel" onClick={(event) => event.stopPropagation()}>
          <CourseToolbar
            search={search}
            status={status}
            counts={counts}
            onSearchChange={setSearch}
            onStatusChange={handleStatusChange}
          />

          {coursesLoading ? (
            <div className="fr-cm-loading">
              <span className="loading-text">加载中...</span>
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="fr-cm-grid">
              {filteredCourses.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onOpen={(item) => {
                    if (onOpenCourse) {
                      onOpenCourse(item);
                      return;
                    }
                    setWorkflowCourse(item);
                  }}
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
