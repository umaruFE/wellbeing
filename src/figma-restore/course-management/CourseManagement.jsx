import { CreateButton } from '../../components/LibraryControls';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageLoading } from '../../components/PageLoading';
import { Modal, message } from 'antd';
import { CreateCourseModal } from '../create-course';
import { CourseWorkflow } from '../course-workflow';
import { CourseCard } from './CourseCard';
import { CourseToolbar } from './CourseToolbar';
import apiService from '../../services/api';
import { formatCourseDuration, getCourseCoverUrl, getCourseData, getCourseOverview, getDisplayCourseTitle } from '../courseImages';
import './CourseManagement.css';

function formatAge(value) {
  if (!value) return '--';
  const text = String(value).trim();
  const range = text.match(/(\d+)\s*[-~]\s*(\d+)/);
  if (range) return `${range[1]}-${range[2]}`;
  return text.replace(/岁/g, '').trim();
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
  const [notice, messageHolder] = message.useMessage();
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const courseListRequest = useRef(0);
  const [search, setSearch] = useState('');
  const [keyword, setKeyword] = useState('');
  const [counts, setCounts] = useState(null);
  useEffect(() => {
    const timer = setTimeout(() => setKeyword(search.trim()), 180);
    return () => clearTimeout(timer);
  }, [search]);
  const searchRef = useRef(null);
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
        grade: values.grade || '',
        duration: values.duration,
        theme: values.theme || values.taskName || values.experiencePath || '',
        updatedAt: new Date().toLocaleDateString('zh-CN'),
        accent: 'var(--wb-primary)',
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

  useEffect(() => {
    const handleSameRouteNav = (event) => {
      if (event.detail?.path === '/figma-courses') {
        handleWorkflowBack();
      }
    };

    window.addEventListener('wellbeing:nav-same-route', handleSameRouteNav);
    return () => window.removeEventListener('wellbeing:nav-same-route', handleSameRouteNav);
  }, [handleWorkflowBack]);

  const fetchCourses = useCallback(async (pageNum = 1, append = false) => {
    const requestId = ++courseListRequest.current;
    try {
      setLoadError(null);
      if (pageNum === 1) {
        setCoursesLoading(true);
      } else {
        setLoadingMore(true);
      }

      const result = await apiService.getCourses({ page: String(pageNum), limit: '12', view: 'library', search: keyword, ...(status === 'all' ? {} : { status }) });
      if (requestId !== courseListRequest.current) return;
      const list = result?.data || [];
      const pagination = result?.pagination || {};
      setCounts(result.counts);
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
          grade: pickFirst(course.grade, courseData?.grade) || '',
          duration: formatCourseDuration(rawDuration, t),
          rawDuration,
          theme: pickFirst(course.theme, courseData?.theme, overview?.theme) || '',
          updatedAt: course.created_at
            ? new Date(course.created_at).toLocaleDateString('zh-CN', {
                year: 'numeric', month: '2-digit', day: '2-digit',
              }).replace(/\//g, '/')
            : '--',
          accent: ['var(--wb-primary)', 'var(--wb-primary)', 'var(--wb-primary)', '#39724f', '#edb100', 'var(--wb-primary)'][i % 6],
          coverTone: ['coral', 'blue', 'purple', 'green', 'gold', 'rose'][i % 6],
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
      if (requestId !== courseListRequest.current) return;
      console.error('获取课程列表失败:', error);
      setLoadError(append ? 'more' : 'list');
      if (!append) {
        setCourses([]);
        setHasMore(false);
      }
    } finally {
      if (requestId === courseListRequest.current) {
        setCoursesLoading(false);
        setLoadingMore(false);
      }
    }
  }, [t, status, keyword]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const loadMoreCourses = () => {
    if (loadingMore || !hasMore) return;
    fetchCourses(page + 1, true);
  };

  const clearFilters = () => {
    setSearch('');
    setStatus('all');
    searchRef.current?.focus();
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
      grade: values.grade || '',
      duration: values.duration,
      theme: values.theme || values.taskName || values.experiencePath || '',
      updatedAt: new Date().toLocaleDateString('zh-CN'),
      accent: 'var(--wb-primary)',
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
      notice.error(t('course.deleteFailed'));
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
      {messageHolder}
      <div className="wb-standard-page">
        <header className="wb-library-header">
          <h1>{t('sidebar.completeCourse')}</h1>
          <CreateButton onClick={handleCreateClick}>{t('course.createCourse')}</CreateButton>
        </header>

        <div className="fr-cm-panel">
          <CourseToolbar
            search={search}
            status={status}
            counts={coursesLoading || loadError === 'list' ? undefined : counts}
            searchRef={searchRef}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
          />

          {coursesLoading ? (
            <PageLoading />
          ) : loadError === 'list' ? (
            <div className="wb-library-empty">
              <p role="alert">{t('course.fetchFailed')}</p>
              <button type="button" data-wb-button="secondary" onClick={() => fetchCourses()}>
                {t('common.retry')}
              </button>
            </div>
          ) : (
            <>
              {courses.length > 0 ? (
                <div className="wb-work-grid">
                  {courses.map(course => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onOpen={onOpenCourse || setWorkflowCourse}
                      onDelete={handleDeleteCourse}
                    />
                  ))}
                </div>
              ) : (
                <div className="wb-library-empty">
                  <p role="status">{t(counts?.all ? 'course.noMatchingCourses' : 'course.noCourses')}</p>
                  {counts?.all > 0 && (
                    <button type="button" data-wb-button="secondary" onClick={clearFilters}>
                      {t(status === 'all' ? 'common.clearSearch' : 'common.clearFilters')}
                    </button>
                  )}
                </div>
              )}
              {hasMore && (
                <div className="fr-cm-load-more">
                  {loadError === 'more' && <span role="alert">{t('course.fetchFailed')}</span>}
                  <button
                    type="button"
                    data-wb-button="secondary"
                    onClick={loadMoreCourses}
                    disabled={loadingMore}
                  >
                    {loadingMore ? t('common.loading') : t(loadError === 'more' ? 'common.retry' : 'course.loadMore')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <CreateCourseModal
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <Modal
        title={t('course.deleteCourse')}
        open={!!deleteTarget}
        onCancel={closeDeleteConfirm}
        onOk={confirmDeleteCourse}
        okText={t('common.delete')}
        cancelText={t('common.cancel')}
        okButtonProps={{ danger: true }}
        cancelButtonProps={{ disabled: deletingCourse }}
        confirmLoading={deletingCourse}
        closable={!deletingCourse}
        keyboard={!deletingCourse}
        maskClosable={!deletingCourse}
        centered
      >
        <p className="fr-cm-confirm-message">{t('course.confirmDeleteCourse')}</p>
        <strong className="fr-cm-confirm-title">{deleteTarget?.title}</strong>
      </Modal>
    </section>
  );
}
