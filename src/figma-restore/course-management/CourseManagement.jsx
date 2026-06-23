import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, BookOpen, Plus, X } from 'lucide-react';
import { CreateCourseModal } from '../create-course';
import { CourseWorkflow } from '../course-workflow';
import { CourseCard } from './CourseCard';
import { CourseToolbar } from './CourseToolbar';
import { demoCourses } from './courseData';
import apiService from '../../services/api';
import { getCourseCoverUrl, getCourseData, getCourseOverview, getDisplayCourseTitle } from '../courseImages';
import './CourseManagement.css';

function formatAge(value) {
  if (!value) return '--';
  const text = String(value).trim();
  const range = text.match(/(\d+)\s*[-~]\s*(\d+)/);
  if (range) return `${range[1]}-${range[2]}`;
  return text.replace(/岁/g, '').trim();
}

function formatDuration(value) {
  if (!value) return '--';
  const text = String(value);
  const minutes = text.match(/\d+/)?.[0];
  if (!minutes) return text;
  return `${minutes} min`;
}

function formatClassSize(value) {
  const text = value ? String(value).trim() : '';
  if (!text) return '';

  const rangeMatch = text.match(/(\d+)\s*[-~]\s*(\d+)/);
  if (rangeMatch) {
    return `${rangeMatch[1]}-${rangeMatch[2]}`;
  }

  const atMostMatch = text.match(/[≤<=]\s*(\d+)/);
  if (atMostMatch) {
    return `≤${atMostMatch[1]}`;
  }

  const atLeastMatch = text.match(/[≥>=]\s*(\d+)/);
  if (atLeastMatch) {
    return `≥${atLeastMatch[1]}`;
  }

  return text.replace(/人/g, '').trim();
}

function pickFirst(...values) {
  return values.find((value) => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && String(value).trim() !== '';
  });
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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(false);
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
        language: values.language || 'zh',
        outputLanguage: values.outputLanguage || 'Chinese',
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
        const overview = getCourseOverview(course);
        const coverUrl = getCourseCoverUrl(course);
        const title = getDisplayCourseTitle(course, t('dashboard.unnamedCourse'));
        const rawAge = pickFirst(course.age_group, courseData?.age, courseData?.ageGroup);
        const rawDuration = pickFirst(course.duration, courseData?.duration);
        const rawClassSize = pickFirst(courseData?.classSize, course.unit, courseData?.scale);
        const languageGoals = overview?.languageGoals || {};
        const vocabularies = pickFirst(courseData?.vocabularies, courseData?.vocabulary, languageGoals.vocabulary, course.keywords, []);
        const grammars = pickFirst(courseData?.grammars, courseData?.grammar, languageGoals.grammar, []);
        const languageSkills = pickFirst(courseData?.languageSkills, courseData?.skills, []);
        const experiencePaths = pickFirst(courseData?.experiencePaths, courseData?.paths, courseData?.experiencePath, []);
        return {
          id: course.id,
          title,
          courseTitle: title,
          unit: course.unit || title,
          status: course.status === 'published' ? 'published' : 'draft',
          age: formatAge(rawAge),
          rawAge,
          grade: rawAge ? `G${String(rawAge).split('-')[0]}` : '--',
          duration: formatDuration(rawDuration),
          rawDuration,
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
          canvasData: course.canvas_data || course.canvasData || null,
          courseOverview: overview || courseData?.courseOverview || null,
          themeImageUrl: coverUrl,
          thumbnail: coverUrl,
          classSize: formatClassSize(rawClassSize),
          rawClassSize,
          vocabularies,
          grammars,
          languageSkills,
          experiencePaths,
          experiencePath: courseData?.experiencePath || (Array.isArray(experiencePaths) ? experiencePaths[0] : experiencePaths) || '',
          taskName: courseData?.taskName || '',
          storyContext: courseData?.storyContext || overview?.overallContext || '',
          keyOutcome: courseData?.keyOutcome || overview?.finalTask || '',
          journey: courseData?.journey || null,
          atmosphere: courseData?.atmosphere || '',
          specialRequirements: courseData?.specialRequirements || '',
          language: courseData?.language || 'zh',
          outputLanguage: courseData?.outputLanguage || 'Chinese',
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
        age: formatAge(course.age),
        duration: formatDuration(course.duration),
        classSize: formatClassSize(course.classSize),
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
      language: values.language || 'zh',
      outputLanguage: values.outputLanguage || 'Chinese',
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

  const handleDeleteCourse = (course) => {
    if (!course?.id) return;
    setDeleteTarget(course);
  };

  const closeDeleteConfirm = () => {
    if (deletingCourse) return;
    setDeleteTarget(null);
  };

  const confirmDeleteCourse = async () => {
    if (!deleteTarget?.id) return;
    setDeletingCourse(true);
    try {
      await apiService.deleteCourse(deleteTarget.id);
      setCourses(currentCourses => currentCourses.filter(item => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      fetchCourses(1);
    } catch (error) {
      console.error('删除课程失败:', error);
      window.alert(t('course.deleteFailed'));
    } finally {
      setDeletingCourse(false);
    }
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
                    onDelete={handleDeleteCourse}
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

      {deleteTarget && (
        <div
          className="fr-cm-confirm-mask"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeDeleteConfirm();
          }}
        >
          <div className="fr-cm-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="fr-cm-delete-title">
            <button
              type="button"
              className="fr-cm-confirm-close"
              onClick={closeDeleteConfirm}
              aria-label={t('common.close')}
              disabled={deletingCourse}
            >
              <X size={18} />
            </button>
            <div className="fr-cm-confirm-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="fr-cm-confirm-copy">
              <h2 id="fr-cm-delete-title">{t('course.deleteCourse')}</h2>
              <p>{t('course.confirmDeleteCourse')}</p>
              <strong>{deleteTarget.title}</strong>
            </div>
            <div className="fr-cm-confirm-actions">
              <button type="button" className="fr-cm-confirm-cancel" onClick={closeDeleteConfirm} disabled={deletingCourse}>
                {t('common.cancel')}
              </button>
              <button type="button" className="fr-cm-confirm-danger" onClick={confirmDeleteCourse} disabled={deletingCourse}>
                {deletingCourse ? t('common.loading') : t('course.deleteCourse')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
