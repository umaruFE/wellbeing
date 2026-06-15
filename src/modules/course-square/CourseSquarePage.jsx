import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, Search, Star, Users, Clock, Grid, List, Copy, Book, Sparkles, Tag } from 'lucide-react';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export const CourseSquarePage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          public: 'true',
          status: 'published',
          limit: 100
        };

        const result = await apiService.getCourses(params);
        const rawCourses = result.data || [];

        const normalized = rawCourses.map(course => {
          const ageGroup = course.age_group || course.ageGroup || '';
          const ageMatch = ageGroup.match(/(\d+)[-~](\d+)/);
          const age = ageMatch ? `${ageMatch[1]}-${ageMatch[2]}` : ageGroup || t('course.notSet');

          let grade = '';
          if (ageGroup.includes('G1') || ageGroup.includes('一年级')) grade = '一年级/G1';
          else if (ageGroup.includes('G2') || ageGroup.includes('二年级')) grade = '二年级/G2';
          else if (ageGroup.includes('G3') || ageGroup.includes('三年级')) grade = '三年级/G3';
          else if (ageGroup.includes('G4') || ageGroup.includes('四年级')) grade = '四年级/G4';
          else if (ageGroup.includes('G5') || ageGroup.includes('五年级')) grade = '五年级/G5';
          else if (ageGroup.includes('G6') || ageGroup.includes('六年级')) grade = '六年级/G6';
          else if (ageGroup.includes('K') || ageGroup.includes('幼儿园')) grade = '幼儿园/K';

          const unit = course.unit || '';
          const unitParts = unit.split(/[：:]/);
          const unitEN = unitParts[0] || unit;
          const unitCN = unitParts[1] || '';

          const keywords = Array.isArray(course.keywords) ? course.keywords :
                          (course.keywords ? course.keywords.split(',').map(k => k.trim()) : []);

          const getThumbnail = () => {
            const theme = (course.theme || '').toLowerCase();
            const title = (course.title || '').toLowerCase();
            if (theme.includes('动物') || title.includes('animal')) return '🦁';
            if (theme.includes('颜色') || title.includes('color')) return '🌈';
            if (theme.includes('食物') || title.includes('food')) return '🍎';
            if (theme.includes('天气') || title.includes('weather')) return '🌤️';
            if (theme.includes('数学') || title.includes('math') || title.includes('fraction')) return '🔢';
            if (theme.includes('字母') || title.includes('phonics') || title.includes('abc')) return '🔤';
            return '📚';
          };

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

          return {
            id: course.id,
            title: course.title || t('dashboard.unnamedCourse'),
            author: course.user_name || course.userName || t('square.unknownAuthor'),
            age: age,
            grade: grade || ageGroup || t('course.notSet'),
            unit: unitEN,
            unitCN: unitCN,
            duration: parseInt(course.duration) || 0,
            stage: ageGroup.includes('学前') || ageGroup.includes('K') ? t('square.preschool') :
                   ageGroup.includes('小学') || ageGroup.match(/G[1-6]/) ? t('square.primary') : t('course.notSet'),
            storyTheme: course.theme || t('course.notSet'),
            keywords: keywords,
            rating: 4.5,
            students: course.view_count || course.viewCount || 0,
            copies: course.copy_count || course.copyCount || 0,
            thumbnail: course.thumbnail || getThumbnail(),
            tags: getTags()
          };
        });

        setCourses(normalized);
      } catch (err) {
        console.error('fetch course square failed:', err);
        setError(`${t('course.fetchFailed')}: ${err.message || ''}`);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [t]);

  const categories = [
    { id: 'all', name: t('common.all') },
    { id: 'phonics', name: t('square.catPhonics') },
    { id: 'reading', name: t('square.catReading') },
    { id: 'vocabulary', name: t('square.catVocabulary') },
    { id: 'grammar', name: t('square.catGrammar') },
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = (course.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.unit || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.storyTheme || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ||
                           course.tags?.some(tag => tag.toLowerCase().includes(selectedCategory.toLowerCase()));
    return matchesSearch && matchesCategory;
  });

  const handleCopyCourse = async (courseId) => {
    if (!user) {
      alert(t('square.loginRequired'));
      return;
    }

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

      try {
        setCourses(courses.map(c =>
          c.id === courseId
            ? { ...c, copies: (c.copies || 0) + 1 }
            : c
        ));
      } catch (err) {
      }

      alert(t('square.copySuccess'));
    } catch (err) {
      console.error('copy course failed:', err);
      alert(t('square.copyFailed'));
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num;
  };

  return (
    <div className="h-screen flex flex-col bg-surface">
      {/* Header */}
      <div className="bg-surface border-b-2 border-stroke-light shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-dark flex items-center gap-2">
                <BookOpen className="w-8 h-8 text-dark" />
                {t('square.title')}
              </h1>
              <p className="text-primary-muted mt-1">{t('square.subtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'grid' ? 'bg-warning-light border-2 border-primary text-dark' : 'text-primary-placeholder hover:bg-surface-alt'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  viewMode === 'list' ? 'bg-warning-light border-2 border-primary text-dark' : 'text-primary-placeholder hover:bg-surface-alt'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-placeholder" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('square.searchPlaceholder')}
              className="w-full pl-12 pr-4 py-3 border-2 border-stroke-light rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-primary outline-none text-lg transition-all duration-200"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-dark text-white border-2 border-primary'
                    : 'bg-surface-alt text-primary-secondary hover:bg-warning-light hover:border-2 hover:border-primary'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Course List */}
      <div className="flex-1 overflow-y-auto max-w-7xl mx-auto px-6 py-6 w-full">
        {error && (
          <div className="bg-error-light border border-error-border text-error-active px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-info border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-primary-muted">{t('common.loading')}</p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <div
                key={course.id}
                className="bg-white rounded-[24px] border-2 border-stroke-light overflow-hidden cursor-pointer group transition-all duration-200 hover:border-primary hover:shadow-[4px_4px_0px_0px_var(--color-dark)] hover:-translate-y-1"
              >
                <div className="h-40 bg-gradient-to-br from-[#fffbe6] to-[#e5e3db] flex items-center justify-center text-6xl relative border-b-2 border-stroke-light">
                  {course.thumbnail}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyCourse(course.id);
                    }}
                    className="absolute top-3 right-3 px-3 py-1.5 bg-white border-2 border-primary text-dark rounded-xl text-sm font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shadow-neo hover:bg-warning-light"
                  >
                    <Copy className="w-4 h-4" />
                    {t('square.copyCourse')}
                  </button>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-primary flex-1 pr-2">{course.title}</h3>
                  </div>
                  <p className="text-xs text-primary-placeholder mb-3">by {course.author}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-primary-secondary">
                      <Book className="w-4 h-4 text-primary-placeholder" />
                      <span>{course.unit} - {course.unitCN}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary-secondary">
                      <Clock className="w-4 h-4 text-primary-placeholder" />
                      <span>{course.duration}{t('course.minutes')} ({course.stage})</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-primary-secondary">
                      <Sparkles className="w-4 h-4 text-primary-placeholder" />
                      <span>{course.storyTheme}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {course.tags?.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-warning-light text-dark border border-stroke-light rounded-lg text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t-2 border-stroke-light">
                    <div className="flex items-center gap-3 text-sm text-primary-muted">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{course.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{formatNumber(course.students)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-success">
                      <Copy className="w-3 h-3" />
                      <span>{t('square.copiedTimes', { count: course.copies })}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCourses.map(course => (
              <div
                key={course.id}
                className="bg-white rounded-[24px] border-2 border-stroke-light p-5 cursor-pointer group transition-all duration-200 hover:border-primary hover:shadow-[4px_4px_0px_0px_var(--color-dark)] hover:-translate-y-1"
              >
                <div className="flex gap-5">
                  <div className="w-36 h-36 bg-gradient-to-br from-[#fffbe6] to-[#e5e3db] rounded-2xl flex items-center justify-center text-5xl shrink-0 relative border-2 border-stroke-light">
                    {course.thumbnail}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCourse(course.id);
                      }}
                      className="absolute -bottom-2 -right-2 px-3 py-1.5 bg-white border-2 border-primary text-dark rounded-xl text-sm font-bold flex items-center gap-1 shadow-neo opacity-0 group-hover:opacity-100 transition-all hover:bg-warning-light"
                    >
                      <Copy className="w-4 h-4" />
                      {t('square.copy')}
                    </button>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-primary">{course.title}</h3>
                        <p className="text-sm text-primary-placeholder">by {course.author}</p>
                      </div>
                      <span className="px-2 py-1 bg-warning-light border border-primary text-dark rounded-lg text-xs font-bold">
                        {course.grade}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 my-3">
                      <div className="flex items-center gap-2 text-sm text-primary-secondary">
                        <Book className="w-4 h-4 text-primary-placeholder" />
                        <span>{course.unit} - {course.unitCN}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-primary-secondary">
                        <Clock className="w-4 h-4 text-primary-placeholder" />
                        <span>{course.duration}{t('course.minutes')} ({course.stage})</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-primary-secondary">
                        <Sparkles className="w-4 h-4 text-primary-placeholder" />
                        <span>{course.storyTheme}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-primary-secondary">
                        <Tag className="w-4 h-4 text-primary-placeholder" />
                        <span>{course.tags?.join(' / ')}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {course.keywords?.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-warning-light text-dark border border-stroke-light rounded-lg text-xs font-medium"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t-2 border-stroke-light">
                      <div className="flex items-center gap-4 text-sm text-primary-muted">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{course.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{formatNumber(course.students)} {t('square.students')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-success">
                          <Copy className="w-4 h-4" />
                          <span>{t('square.copiedTimes', { count: course.copies })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-primary-placeholder mx-auto mb-4" />
            <p className="text-primary-muted">
              {courses.length === 0 ? t('square.noPublicCourses') : t('square.noResults')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
