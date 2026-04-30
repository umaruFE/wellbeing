import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Edit3, Trash2, Upload, Search, Filter, Clock, Users, Sparkles, LayoutTemplate, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';

export const CourseManagementPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false);
    };
    if (filterOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterOpen]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const params = {};
        if (user?.id) {
          params.userId = user.id;
        }
        const result = await apiService.getCourses(params);
        const rawCourses = result.data || [];
        // 规范字段名：后端是 snake_case（created_at/updated_at），前端用 camelCase
        const normalized = rawCourses.map(c => ({
          ...c,
          createdAt: c.createdAt || c.created_at || null,
          updatedAt: c.updatedAt || c.updated_at || null,
        }));
        setCourses(normalized);
        setError(null);
      } catch (err) {
        console.error('获取课程列表失败:', err);
        setError('加载课程失败');
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user?.id]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = (course.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.unit || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (course.theme || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || course.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleCreateCourse = () => {
    navigate('/create');
  };

  // 编辑课程：跳转到创建页并携带 courseId，让编辑器直接进入表格模式
  const handleEditCourse = (courseId) => {
    navigate(`/create?courseId=${courseId}`);
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('确定要删除这个课程吗？')) {
      try {
        await apiService.deleteCourse(courseId);
        setCourses(courses.filter(c => c.id !== courseId));
      } catch (err) {
        console.error('删除课程失败:', err);
        alert('删除失败');
      }
    }
  };

  const handlePublishCourse = async (courseId) => {
    try {
      await apiService.updateCourse(courseId, { status: 'published' });
      setCourses(courses.map(c =>
        c.id === courseId ? { ...c, status: 'published' } : c
      ));
    } catch (err) {
      console.error('发布课程失败:', err);
      alert('发布失败');
    }
  };

  const getStatusLabel = (status) => {
    const labels = { published: '已发布', draft: '草稿', archived: '已归档' };
    return labels[status] || status;
  };

  const formatDuration = (dur) => {
    if (typeof dur === 'number') return `${dur}分钟`;
    if (typeof dur === 'string' && dur.includes('分钟')) return dur;
    return dur ? `${dur}分钟` : '未设置';
  };

  return (
    <div className="h-full overflow-y-auto bg-surface">
      {/* Header */}
      <div className="mx-auto p-8 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-xl bg-green-soft flex items-center justify-center border-2 border-primary flex-shrink-0">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-dark">课程管理</h1>
              <p className="text-sm text-primary-muted mt-0.5">创建和管理您的课程</p>
            </div>
          </div>
          <button
            onClick={handleCreateCourse}
            className="px-5 py-2.5 bg-brand-coral text-white rounded-full font-bold flex items-center gap-2 transition-colors border-2 border-primary shadow-neo hover:shadow-neo-hover hover:translate-[-1px,-1px]"
          >
            <Plus className="w-4 h-4" />
            创建课程
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="mx-auto px-8 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-placeholder" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索课程名称或关键字..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border-2 border-stroke-light bg-white focus:border-primary focus:ring-0 outline-none text-dark placeholder:text-primary-placeholder"
            />
          </div>
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="px-4 py-2.5 rounded-2xl border-2 border-stroke-light bg-white flex items-center gap-2 text-dark font-medium hover:border-primary transition-colors"
            >
              <Filter className="w-4 h-4 text-primary-muted" />
              {filterStatus === 'all' ? '全部状态' : getStatusLabel(filterStatus)}
              <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 py-2 bg-white rounded-xl border-2 border-primary shadow-[4px_4px_0px_0px_var(--color-dark)] z-10 min-w-[140px]">
                {['all', 'draft', 'published', 'archived'].map((s) => (
                  <button
                    key={s}
                    onClick={() => { setFilterStatus(s); setFilterOpen(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-surface-alt text-dark"
                  >
                    {s === 'all' ? '全部状态' : getStatusLabel(s)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course List */}
      <div className=" mx-auto px-8 pb-20">
        {error && (
          <div className="bg-error-light border-2 border-error-border text-error-active px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-green-soft border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-primary-muted">加载中...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <div
              key={course.id}
              className="bg-white rounded-[24px] border-2 border-stroke-light p-4 cursor-pointer group transition-all duration-200 ease-out hover:border-primary hover:shadow-[4px_4px_0px_0px_var(--color-dark)] hover:-translate-y-1"
              onClick={() => navigate(`/courses/${course.id}/overview`)}
            >
              {/* 左右布局：左侧封面 + 右侧信息 */}
              <div className="flex gap-4">
                {/* 左侧封面占位 */}
                <div
                  className="w-28 h-32 flex-shrink-0 rounded-xl border-2 border-dashed border-stroke-light bg-surface flex flex-col items-center justify-center text-warm-muted overflow-hidden"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (course.thumbnail) window.open(course.thumbnail, '_blank');
                  }}
                >
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <LayoutTemplate className="w-8 h-8 mb-1" />
                      <span className="text-[10px]">暂无封面</span>
                    </>
                  )}
                </div>

                {/* 右侧信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-bold text-dark flex-1 truncate">{course.title}</h3>
                    <span className="bg-yellow-badge text-yellow-badge-text text-[11px] font-extrabold px-2.5 py-1 rounded-md border-2 border-primary flex-shrink-0 shadow-neo-active">{getStatusLabel(course.status)}</span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-dark">
                      <Users className="w-3.5 h-3.5 text-green-muted" />
                      <span className="truncate">{course.age_group || '未设置'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-dark">
                      <BookOpen className="w-3.5 h-3.5 text-brand-amber" />
                      <span className="truncate">{course.unit || '未设置'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-dark">
                      <Sparkles className="w-3.5 h-3.5 text-pink-soft" />
                      <span className="truncate">{course.theme || '未设置'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-dark">
                      <Clock className="w-3.5 h-3.5 text-brand-coral" />
                      <span>{formatDuration(course.duration)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 底部操作栏 */}
              <div className="mt-4 pt-3 border-t border-dashed border-stroke-light">
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleEditCourse(course.id); }}
                    className="flex-1 px-3 py-2 bg-warning-light text-dark rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs transition-all duration-200 hover:bg-warning-light hover:border-brand-amber"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    编辑
                  </button>
                  {course.status === 'draft' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePublishCourse(course.id); }}
                      className="p-2 rounded-full bg-success-light text-success hover:bg-success-light transition-colors"
                      title="发布"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }}
                    className="p-2 rounded-full bg-error-light text-error hover:bg-error-light transition-colors"
                    title="删除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-center mt-2 text-[10px] text-primary-muted">
                  {course.updatedAt
                    ? `更新于 ${new Date(course.updatedAt).toLocaleString('zh-CN', { hour12: false })}`
                    : course.createdAt
                      ? `创建于 ${new Date(course.createdAt).toLocaleString('zh-CN', { hour12: false })}`
                      : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* 无课程时的提示 */}
        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-stroke-light mx-auto mb-4" />
            <p className="text-primary-muted">暂无课程</p>
          </div>
        )}
      </div>
    </div>
  );
};
