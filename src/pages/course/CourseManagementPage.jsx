import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Edit, Trash2, Eye, Upload, Search, Filter, Clock, Book, Sparkles, Layout } from 'lucide-react';
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

  const getStatusBadge = (status) => {
    const styles = {
      published: 'bg-green-100 text-green-700 border border-green-200',
      draft: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      archived: 'bg-slate-100 text-slate-600 border border-slate-200'
    };
    const labels = {
      published: '已发布',
      draft: '草稿',
      archived: '已归档'
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              课程管理
            </h1>
            <p className="text-sm text-slate-500 mt-1">创建和管理您的课程</p>
          </div>
          <button
            onClick={handleCreateCourse}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            创建课程
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索课程、单元、主题..."
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">全部状态</option>
              <option value="draft">草稿</option>
              <option value="published">已发布</option>
              <option value="archived">已归档</option>
            </select>
          </div>
        </div>
      </div>

      {/* Course List */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500">加载中...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map(course => (
            <div
              key={course.id}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => navigate(`/courses/${course.id}`)}
            >
              {/* 左右布局：左侧缩略图 + 右侧信息 */}
              <div className="flex gap-4">
                {/* 左侧缩略图 - 点击放大预览 */}
                <div
                  className="w-32 h-24 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex-shrink-0 overflow-hidden relative cursor-zoom-in group"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (course.thumbnail) {
                      window.open(course.thumbnail, '_blank');
                    }
                  }}
                >
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-blue-300">
                      <Layout className="w-8 h-8 mb-1" />
                      <span className="text-[10px]">暂无封面</span>
                    </div>
                  )}
                  {/* 悬停时显示放大图标 */}
                  {course.thumbnail && (
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white drop-shadow-lg" />
                    </div>
                  )}
                </div>

                {/* 右侧信息区域 - 点击跳转详情 */}
                <div
                  className="flex-1 min-w-0"
                >
                  {/* 标题和状态 */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-base font-bold text-slate-800 flex-1 pr-2 truncate">{course.title}</h3>
                    {getStatusBadge(course.status)}
                  </div>

                  {/* 课程信息 */}
                  <div className="space-y-1.5">
                    {/* 年龄和年级 */}
                    <div className="flex items-center gap-2 text-xs">
                      <Book className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-600">{course.age_group || '未设置'}</span>
                    </div>

                    {/* 教材单元 */}
                    <div className="flex items-start gap-2 text-xs">
                      <BookOpen className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                      <div className="truncate">
                        <span className="text-slate-800">{course.unit || '未设置'}</span>
                      </div>
                    </div>

                    {/* 剧情主题 */}
                    <div className="flex items-center gap-2 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-600 truncate">{course.theme || '未设置'}</span>
                    </div>

                    {/* 上课时长 */}
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-600">{course.duration || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 关键词标签 */}
              {course.keywords && course.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {course.keywords.slice(0, 4).map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium"
                    >
                      {keyword}
                    </span>
                  ))}
                  {course.keywords.length > 4 && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">
                      +{course.keywords.length - 4}
                    </span>
                  )}
                </div>
              )}

              {/* 底部操作栏 */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditCourse(course.id);
                  }}
                  className="flex-1 px-2 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-1 transition-colors text-xs"
                >
                  <Edit className="w-3.5 h-3.5" />
                  编辑
                </button>
                {course.status === 'draft' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePublishCourse(course.id);
                    }}
                    className="px-2 py-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                    title="发布"
                  >
                    <Upload className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCourse(course.id);
                  }}
                  className="px-2 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 更新时间 */}
              <div className="mt-2 text-[10px] text-slate-400 text-center">
                {course.updatedAt ? (
                  <>更新于 {new Date(course.updatedAt).toLocaleString('zh-CN', { hour12: false })}</>
                ) : (
                  <>创建于 {course.createdAt ? new Date(course.createdAt).toLocaleString('zh-CN', { hour12: false }) : '未知时间'}</>
                )}
              </div>
            </div>
          ))}
        </div>
        )}

        {/* 无课程时的提示 */}
        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">暂无课程</p>
          </div>
        )}
      </div>
    </div>
  );
};
