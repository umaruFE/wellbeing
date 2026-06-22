import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, Plus } from 'lucide-react';
import { CreateCourseModal } from '../create-course';
import { CourseWorkflow } from '../course-workflow';
import { CourseCard } from './CourseCard';
import { CourseToolbar } from './CourseToolbar';
import { demoCourses } from './courseData';
import apiService from '../../services/api';
import { getCourseCoverUrl, getCourseData } from '../courseImages';
import './CourseManagement.css';

function formatDuration(value, t) {
  if (!value) return '--';
  const text = String(value);
  const minutes = text.match(/\d+/)?.[0];
  if (!minutes) return text;
  return t('course.durationMinutes', { count: Number(minutes), minutes });
}

function formatClassSize(value, t) {
  const text = value ? String(value).trim() : '';
  if (!text) return '';

  const rangeMatch = text.match(/(\d+)\s*[-~]\s*(\d+)/);
  if (rangeMatch) {
    return t('course.classSizeRange', { min: rangeMatch[1], max: rangeMatch[2] });
  }

  const atMostMatch = text.match(/[≤<=]\s*(\d+)/);
  if (atMostMatch) {
    return t('course.classSizeAtMost', { count: atMostMatch[1] });
  }

  const atLeastMatch = text.match(/[≥>=]\s*(\d+)/);
  if (atLeastMatch) {
    return t('course.classSizeAtLeast', { count: atLeastMatch[1] });
  }

  return text;
}

export function CourseManagement({
  onCreateCourse,
  onOpenCourse,
}) {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [workflowCourse, setWorkflowCourse] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const suppressRouteStateRef = React.useRef(false);

  const clearRouteState = useCallback(() => {
    if (!location.state) return;
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    if (!location.state) {
      suppressRouteStateRef.current = false;
      return;
    }

    if (suppressRouteStateRef.current) {
      clearRouteState();
      return;
    }

    if (location.state?.openCourse && !workflowCourse) {
      setWorkflowCourse(location.state.openCourse);
      clearRouteState();
      return;
    }

    if (location.state?.newCourse && !workflowCourse) {
      const values = location.state.newCourse;
      const course = {
        id: values.id,
        title: values.courseTitle || t('course.newCourse'),
        unit: values.courseTitle || t('course.newCourse'),
        status: 'draft',
        age: values.age,
        grade: 'Draft',
        duration: values.duration,
        theme: values.taskName || values.experiencePath || t('course.scenarioTask'),
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
      clearRouteState();
    }
  }, [clearRouteState, location.state, workflowCourse, t]);

  const handleWorkflowBack = useCallback(() => {
    suppressRouteStateRef.current = true;
    setWorkflowCourse(null);
    clearRouteState();
  }, [clearRouteState]);

  const fetchCourses = useCallback(async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setCoursesLoading(true);
      } else {
        setLoadingMore(true);
      }

      const result = await apiService.getCourses({ page: String(pageNum), limit: '12' });
      const list = result?.data || [];
      const pagination = result?.pagination || {};
      const mapped = list.map((course, i) => {
        const courseData = getCourseData(course);
        const coverUrl = getCourseCoverUrl(course);
        return {
          id: course.id,
          title: course.title || course.unit || t('dashboard.unnamedCourse'),
          unit: course.unit || course.title || t('dashboard.unnamedCourse'),
          status: course.status === 'published' ? 'published' : 'draft',
          age: course.age_group || courseData?.age || '--',
          grade: course.age_group ? `G${course.age_group.split('-')[0]}` : '--',
          duration: formatDuration(course.duration || courseData?.duration, t),
          theme: course.theme || t('course.scenarioTask'),
          updatedAt: course.created_at
            ? new Date(course.created_at).toLocaleDateString('zh-CN', {
                year: 'numeric', month: '2-digit', day: '2-digit',
              }).replace(/\//g, '/')
            : '--',
          accent: ['#ff705d', '#4482e5', '#9966d0', '#509f69', '#edb100', '#f4785e'][i % 6],
          coverTone: ['coral', 'blue', 'purple', 'green', 'gold', 'rose'][i % 6],
          active: i === 0,
          courseData,
          courseOverview: courseData?.courseOverview || null,
          themeImageUrl: coverUrl,
          thumbnail: coverUrl,
          classSize: formatClassSize(courseData?.classSize || course.unit, t),
          vocabularies: courseData?.vocabularies || [],
          grammars: courseData?.grammars || [],
          languageSkills: courseData?.languageSkills || [],
          experiencePath: courseData?.experiencePath || '',
          taskName: courseData?.taskName || '',
          storyContext: courseData?.storyContext || '',
          keyOutcome: courseData?.keyOutcome || '',
          journey: courseData?.journey || null,
          atmosphere: courseData?.atmosphere || '',
          specialRequirements: courseData?.specialRequirements || '',
        };
      });

      if (append) {
        setCourses(prev => [...prev, ...mapped]);
      } else {
        setCourses(mapped);
      }

      setHasMore(pageNum < (pagination.totalPages || 1));
      setPage(pageNum);
    } catch (error) {
      console.error('获取课程列表失败:', error);
      if (!append) setCourses(demoCourses.map(course => ({
        ...course,
        duration: formatDuration(course.duration, t),
        classSize: formatClassSize(course.classSize, t),
      })));
    } finally {
      setCoursesLoading(false);
      setLoadingMore(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const loadMoreCourses = () => {
    if (loadingMore || !hasMore) return;
    fetchCourses(page + 1, true);
  };

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
      title: values.courseTitle || t('course.newCourse'),
      unit: values.courseTitle || t('course.newCourse'),
      status: 'draft',
      age: values.age,
      grade: 'Draft',
      duration: values.duration,
      theme: values.taskName || values.experiencePath || t('course.scenarioTask'),
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
    fetchCourses(1);
  };

  if (workflowCourse) {
    return (
      <CourseWorkflow
        initialCourse={workflowCourse}
        onBack={handleWorkflowBack}
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
              <h1>{t('course.title')}</h1>
              <p>{t('course.subtitle')}</p>
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
            {t('dashboard.createCourse')}
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
              <span className="loading-text">{t('common.loading')}</span>
            </div>
          ) : filteredCourses.length > 0 ? (
            <>
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
              {hasMore && (
                <div className="fr-cm-load-more">
                  <button
                    type="button"
                    className="fr-cm-load-more-btn"
                    onClick={loadMoreCourses}
                    disabled={loadingMore}
                  >
                    {loadingMore ? t('common.loading') : t('course.loadMore')}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="fr-cm-empty">
              <BookOpen size={30} />
              <strong>{t('course.noMatchingCourses')}</strong>
              <span>{t('course.adjustFilters')}</span>
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
