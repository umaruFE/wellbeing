import { FilterChip, LibrarySearch, MetadataTag } from '../../components/LibraryControls';
import React, { useState, useEffect, useRef } from 'react';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { PageLoading } from '../../components/PageLoading';
import { Eye, Clock, Grid, List, Copy, Book, Sparkles, Loader2 } from 'lucide-react';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { getCourseCoverUrl, getDisplayCourseTitle } from '../../figma-restore/courseImages';

const DEFAULT_COVER = '/assets/empty/3a4db69c7cdec2529d41fe498ca0887f.jpg';

export const CourseSquarePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [copyingId, setCopyingId] = useState(null);
  const copyPending = useRef(false);
  const searchInput = useRef(null);
  const [notice, noticeHolder] = message.useMessage();

  useEffect(() => {
    let cancelled = false;
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(false);

        const params = {
          public: 'true',
          status: 'published',
          limit: 100
        };

        const result = await apiService.getCourses(params);
        if (cancelled) return;
        const rawCourses = result.data || [];

        const normalized = rawCourses.map(course => {
          const ageGroup = course.age_group || course.ageGroup || '';

          let grade = '';
          if (ageGroup.includes('G1') || ageGroup.includes('一年级')) grade = t('square.grade1');
          else if (ageGroup.includes('G2') || ageGroup.includes('二年级')) grade = t('square.grade2');
          else if (ageGroup.includes('G3') || ageGroup.includes('三年级')) grade = t('square.grade3');
          else if (ageGroup.includes('G4') || ageGroup.includes('四年级')) grade = t('square.grade4');
          else if (ageGroup.includes('G5') || ageGroup.includes('五年级')) grade = t('square.grade5');
          else if (ageGroup.includes('G6') || ageGroup.includes('六年级')) grade = t('square.grade6');
          else if (ageGroup.includes('K') || ageGroup.includes('幼儿园')) grade = t('square.gradeK');

          const unit = course.unit || '';
          const unitParts = unit.split(/[：:]/);
          const unitEN = unitParts[0] || unit;
          const unitCN = unitParts[1] || '';

          const keywords = Array.isArray(course.keywords) ? course.keywords :
                          (course.keywords ? course.keywords.split(',').map(k => k.trim()) : []);

          const getTags = () => {
            const tags = [];
            const text = `${course.theme || ''} ${course.title || ''} ${keywords.join(' ')}`.toLowerCase();
            if (text.includes('phonics') || text.includes('自然拼读') || text.includes('发音')) tags.push(t('square.catPhonics'));
            if (text.includes('vocabulary') || text.includes('词汇')) tags.push(t('square.catVocabulary'));
            if (text.includes('reading') || text.includes('阅读') || text.includes('绘本')) tags.push(t('square.catReading'));
            if (text.includes('grammar') || text.includes('语法')) tags.push(t('square.catGrammar'));
            if (text.includes('speaking') || text.includes('口语') || text.includes('会话')) tags.push(t('square.catSpeaking'));
            return tags.length > 0 ? tags : [t('square.catGeneral')];
          };

          const author = [
            course.author_name,
            course.authorName,
            course.creator_name,
            course.creatorName,
            course.user_name,
            course.userName,
          ].find(value => typeof value === 'string' && value.trim()) || '';

          return {
            id: course.id,
            title: getDisplayCourseTitle(course, t('dashboard.unnamedCourse')),
            author,
            grade: grade || ageGroup || t('course.notSet'),
            unit: unitEN,
            unitCN: unitCN,
            duration: parseInt(course.duration) || 0,
            stage: ageGroup.includes('学前') || ageGroup.includes('K') ? t('square.preschool') :
                   ageGroup.includes('小学') || ageGroup.match(/G[1-6]/) ? t('square.primary') : t('course.notSet'),
            storyTheme: course.theme || t('course.notSet'),
            keywords: keywords,
            views: course.view_count || course.viewCount || 0,
            copies: course.copy_count || course.copyCount || 0,
            thumbnail: getCourseCoverUrl(course),
            tags: getTags()
          };
        });

        setCourses(normalized);
      } catch (err) {
        if (cancelled) return;
        console.error('fetch course square failed:', err);
        setError(true);
        setCourses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCourses();
    return () => { cancelled = true; };
  }, [retry, t]);

  const categories = [
    { id: 'all', name: t('common.all') },
    { id: 'phonics', name: t('square.catPhonics') },
    { id: 'reading', name: t('square.catReading') },
    { id: 'vocabulary', name: t('square.catVocabulary') },
    { id: 'grammar', name: t('square.catGrammar') },
  ];

  const keyword = searchTerm.trim().toLowerCase();
  const categoryName = categories.find(category => category.id === selectedCategory)?.name || '';
  const filteredCourses = courses.filter(course => {
    const matchesSearch = [course.title, course.unit, course.unitCN, course.storyTheme].some(value => value?.toLowerCase().includes(keyword));
    const matchesCategory = selectedCategory === 'all' ||
                           course.tags?.some(tag => tag.toLowerCase() === categoryName.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const handleCopyCourse = async (courseId) => {
    if (!user) {
      notice.warning(t('square.loginRequired'));
      return;
    }

    if (copyPending.current) return;
    copyPending.current = true;
    setCopyingId(courseId);
    try {
      const courseDetail = await apiService.getCourse(courseId);
      const originalCourse = courseDetail.data || courseDetail;

      const newCourseData = {
        title: `${originalCourse.title || t('dashboard.unnamedCourse')} (${t('square.copy')})`,
        description: originalCourse.description || '',
        ageGroup: originalCourse.age_group || originalCourse.ageGroup || '',
        unit: originalCourse.unit || '',
        duration: originalCourse.duration || '',
        theme: originalCourse.theme || '',
        keywords: Array.isArray(originalCourse.keywords)
          ? originalCourse.keywords
          : (originalCourse.keywords ? [originalCourse.keywords] : []),
        isPublic: false,
      };

      const result = await apiService.createCourse(newCourseData);

      if (result.error) {
        throw new Error(result.error);
      }

      setCourses(current => current.map(course => course.id === courseId
        ? { ...course, copies: (course.copies || 0) + 1 }
        : course));
      notice.success(t('square.copySuccess'));
    } catch (err) {
      console.error('copy course failed:', err);
      notice.error(t('square.copyFailed'));
    } finally {
      copyPending.current = false;
      setCopyingId(null);
    }
  };

  const clearFilters = () => {
    setSelectedCategory('all');
    setSearchTerm('');
    searchInput.current?.focus();
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num;
  };

  const isList = viewMode === 'list';

  return (
    <section className="wb-standard-page">
      {noticeHolder}
      <header className="wb-library-header">
        <h1>{t('sidebar.inspirationSquare')}</h1>
        <div className="flex items-center gap-2">
          <button type="button" data-wb-button="secondary" data-wb-icon aria-label={t('common.gridView')} aria-pressed={!isList} onClick={() => setViewMode('grid')}>
            <Grid size={16} aria-hidden="true" />
          </button>
          <button type="button" data-wb-button="secondary" data-wb-icon aria-label={t('common.listView')} aria-pressed={isList} onClick={() => setViewMode('list')}>
            <List size={16} aria-hidden="true" />
          </button>
        </div>
      </header>

      <div className="wb-library-tools pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map(category => (
            <FilterChip
              key={category.id}
              selected={selectedCategory === category.id}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </FilterChip>
          ))}
        </div>
        <LibrarySearch label={t('course.searchPlaceholder')} value={searchTerm} onChange={setSearchTerm} inputRef={searchInput} />
      </div>

      {loading ? <PageLoading /> : error ? (
        <div className="wb-library-empty">
          <p role="alert">{t('course.fetchFailed')}</p>
          <button type="button" data-wb-button="secondary" onClick={() => setRetry(value => value + 1)}>{t('common.retry')}</button>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="wb-library-empty">
          <p role="status">{t(courses.length === 0 ? 'square.noPublicCourses' : 'course.noMatchingCourses')}</p>
          {courses.length > 0 && (
            <button type="button" data-wb-button="secondary" onClick={clearFilters}>
              {t(selectedCategory === 'all' ? 'common.clearSearch' : 'common.clearFilters')}
            </button>
          )}
        </div>
      ) : (
        <div className={isList ? 'grid gap-4' : 'wb-case-grid'}>
          {filteredCourses.map(course => (
            <article
              key={course.id}
              className={isList ? 'wb-surface-panel flex flex-col items-start gap-4 sm:flex-row' : 'wb-case-card overflow-hidden'}
            >
              <div className={isList ? 'relative aspect-video w-full shrink-0 overflow-hidden rounded-[var(--wb-control-radius)] sm:w-40' : 'wb-case-cover'}>
                <img
                  src={course.thumbnail || DEFAULT_COVER}
                  alt=""
                  loading="lazy"
                  className="block h-full w-full object-cover"
                  onError={event => {
                    const image = event.currentTarget;
                    if (image.getAttribute('src') !== DEFAULT_COVER) image.src = DEFAULT_COVER;
                  }}
                />
              </div>
              <div className={isList ? 'flex w-full min-w-0 flex-col gap-2' : 'wb-case-body'}>
                <h3 className="m-0 text-[length:var(--wb-card-title-size)] font-semibold wrap-anywhere">{course.title}</h3>
                {course.author && <p className="m-0 text-sm text-[var(--wb-muted)]">{course.author}</p>}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--wb-muted)]">
                  {(course.unit || course.unitCN) && (
                    <span className="inline-flex items-center gap-2"><Book size={16} aria-hidden="true" />{[course.unit, course.unitCN].filter(Boolean).join(' · ')}</span>
                  )}
                  <span className="inline-flex items-center gap-2"><Clock size={16} aria-hidden="true" />{t('course.durationMinutes', { minutes: course.duration })} · {course.stage}</span>
                  <span className="inline-flex items-center gap-2"><Sparkles size={16} aria-hidden="true" />{course.storyTheme}</span>
                  {isList && <span>{course.grade}</span>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {[...new Set(isList ? [...course.tags, ...course.keywords] : course.tags)].map(tag => (
                    <MetadataTag key={tag}>{tag}</MetadataTag>
                  ))}
                </div>
                <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-[var(--wb-border-soft)] pt-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--wb-muted)]">
                    <span className="inline-flex items-center gap-1"><Eye size={14} aria-hidden="true" />{t('square.views', { count: formatNumber(course.views) })}</span>
                    <span>{t('square.copiedTimes', { count: course.copies })}</span>
                  </div>
                  <button
                    type="button"
                    data-wb-button="secondary"
                    data-wb-size="sm"
                    disabled={copyingId !== null}
                    aria-busy={copyingId === course.id}
                    onClick={() => handleCopyCourse(course.id)}
                  >
                    {copyingId === course.id ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                    {t('square.copyCourse')}
                  </button>
                </footer>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
