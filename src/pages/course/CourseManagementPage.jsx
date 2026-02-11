import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Edit, Trash2, Eye, Upload, Search, Filter, Clock, Tag, Book, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const CourseManagementPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // 模拟课程数据 - 增加更多字段
  const [courses, setCourses] = useState([
    {
      id: 1,
      title: '三年级英语 Unit 3 Animals',
      age: '8-9岁',
      grade: '三年级/G3',
      unit: 'Unit 3: Animals',
      unitCN: '神奇的动物',
      duration: 15,
      durationType: '微课',
      stage: '学前',
      storyTheme: '星际救援冒险',
      keywords: ['Red', 'Blue', 'Yellow'],
      status: 'published',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20'
    },
    {
      id: 2,
      title: '数学进阶课程',
      age: '10-11岁',
      grade: '五年级/G5',
      unit: 'Unit 5: Fractions',
      unitCN: '分数的奥秘',
      duration: 30,
      durationType: '正课',
      stage: '小学',
      storyTheme: '数学王国大冒险',
      keywords: ['Fraction', 'Half', 'Quarter'],
      status: 'draft',
      createdAt: '2024-01-18',
      updatedAt: '2024-01-19'
    },
    {
      id: 3,
      title: '科学实验课程',
      age: '7-8岁',
      grade: '二年级/G2',
      unit: 'Unit 2: Water',
      unitCN: '水的循环',
      duration: 20,
      durationType: '实验课',
      stage: '学前',
      storyTheme: '小水滴旅行记',
      keywords: ['Water', 'Ice', 'Steam'],
      status: 'published',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-15'
    },
    {
      id: 4,
      title: '英语基础课程',
      age: '6-7岁',
      grade: '一年级/G1',
      unit: 'Unit 1: Colors',
      unitCN: '多彩的世界',
      duration: 10,
      durationType: '微课',
      stage: '学前',
      storyTheme: '彩虹小镇的故事',
      keywords: ['Red', 'Green', 'Blue', 'Yellow'],
      status: 'archived',
      createdAt: '2024-01-05',
      updatedAt: '2024-01-08'
    },
    {
      id: 5,
      title: '音乐启蒙课程',
      age: '5-6岁',
      grade: '幼儿园/K',
      unit: 'Unit 2: Rhythm',
      unitCN: '节奏的魔法',
      duration: 12,
      durationType: '微课',
      stage: '学前',
      storyTheme: '音乐森林派对',
      keywords: ['Music', 'Beat', 'Dance'],
      status: 'draft',
      createdAt: '2024-01-20',
      updatedAt: '2024-01-20'
    },
  ]);

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.storyTheme.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || course.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleCreateCourse = () => {
    window.location.href = 'http://localhost:5173/create';
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map(course => (
            <div
              key={course.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all cursor-pointer"
            >
              {/* 标题和状态 */}
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex-1 pr-2">{course.title}</h3>
                {getStatusBadge(course.status)}
              </div>

              {/* 课程信息网格 */}
              <div className="space-y-3 mb-4">
                {/* 年龄和年级 */}
                <div className="flex items-center gap-2 text-sm">
                  <Book className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{course.age} ({course.grade})</span>
                </div>

                {/* 教材单元 */}
                <div className="flex items-start gap-2 text-sm">
                  <BookOpen className="w-4 h-4 text-slate-400 mt-0.5" />
                  <div>
                    <span className="text-slate-800 font-medium">{course.unit}</span>
                    <span className="text-slate-500 ml-1">- {course.unitCN}</span>
                  </div>
                </div>

                {/* 上课时长 */}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{course.duration}分钟 ({course.durationType}/{course.stage})</span>
                </div>

                {/* 剧情主题 */}
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{course.storyTheme}</span>
                </div>
              </div>

              {/* 关键词标签 */}
              {course.keywords && course.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
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
              <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                <button
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="flex-1 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 flex items-center justify-center gap-1 transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  查看
                </button>
                <button
                  onClick={() => handleEditCourse(course.id)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-1 transition-colors text-sm"
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

              {/* 更新时间 */}
              <div className="mt-3 text-xs text-slate-400 text-center">
                更新于 {course.updatedAt}
              </div>
            </div>
          ))}
        </div>
        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">暂无课程</p>
            <button
              onClick={handleCreateCourse}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto transition-colors"
            >
              <Plus className="w-4 h-4" />
              立即创建
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
