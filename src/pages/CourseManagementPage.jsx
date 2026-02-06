import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Edit, Trash2, Eye, Upload, Search, Filter, MoreVertical } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const CourseManagementPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, draft, published, archived

  // 模拟课程数据
  const [courses, setCourses] = useState([
    { id: 1, title: '英语基础课程', description: '适合初学者的英语课程', status: 'published', createdAt: '2024-01-15', updatedAt: '2024-01-20' },
    { id: 2, title: '数学进阶课程', description: '高中数学进阶内容', status: 'draft', createdAt: '2024-01-18', updatedAt: '2024-01-19' },
    { id: 3, title: '科学实验课程', description: '有趣的科学实验教学', status: 'published', createdAt: '2024-01-10', updatedAt: '2024-01-15' },
  ]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || course.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleCreateCourse = () => {
    navigate('/courses/create');
  };

  const handleEditCourse = (courseId) => {
    navigate(`/courses/${courseId}/edit`);
  };

  const handleDeleteCourse = (courseId) => {
    if (window.confirm('确定要删除这个课程吗？')) {
      setCourses(courses.filter(c => c.id !== courseId));
    }
  };

  const handlePublishCourse = (courseId) => {
    setCourses(courses.map(c => 
      c.id === courseId ? { ...c, status: 'published' } : c
    ));
  };

  const getStatusBadge = (status) => {
    const styles = {
      published: 'bg-green-100 text-green-700',
      draft: 'bg-yellow-100 text-yellow-700',
      archived: 'bg-slate-100 text-slate-700'
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
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
              placeholder="搜索课程..."
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map(course => (
            <div
              key={course.id}
              className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-800 flex-1">{course.title}</h3>
                {getStatusBadge(course.status)}
              </div>
              <p className="text-sm text-slate-600 mb-4 line-clamp-2">{course.description}</p>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                <span>创建于 {course.createdAt}</span>
                <span>更新于 {course.updatedAt}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center justify-center gap-1 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  查看
                </button>
                <button
                  onClick={() => handleEditCourse(course.id)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-1 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  编辑
                </button>
                {course.status === 'draft' && (
                  <button
                    onClick={() => handlePublishCourse(course.id)}
                    className="px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                    title="发布"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteCourse(course.id)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">暂无课程</p>
          </div>
        )}
      </div>
    </div>
  );
};


