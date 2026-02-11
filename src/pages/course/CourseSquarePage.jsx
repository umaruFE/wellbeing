import React, { useState } from 'react';
import { BookOpen, Search, Star, Users, Clock, Grid, List, Copy, Book, Sparkles, Tag } from 'lucide-react';

export const CourseSquarePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 模拟广场课程数据 - 儿童英语培训
  const courses = [
    {
      id: 1,
      title: '三年级英语 Unit 3 Animals',
      author: '张老师',
      age: '8-9岁',
      grade: '三年级/G3',
      unit: 'Unit 3: Animals',
      unitCN: '神奇的动物',
      duration: 15,
      stage: '学前',
      storyTheme: '星际救援冒险',
      keywords: ['Red', 'Blue', 'Yellow', 'Animals'],
      rating: 4.9,
      students: 256,
      copies: 89,
      thumbnail: '🦁',
      tags: ['自然拼读', '词汇学习']
    },
    {
      id: 2,
      title: '五年级英语 Unit 5 Fractions',
      author: '李老师',
      age: '10-11岁',
      grade: '五年级/G5',
      unit: 'Unit 5: Fractions',
      unitCN: '分数的奥秘',
      duration: 30,
      stage: '小学',
      storyTheme: '数学王国大冒险',
      keywords: ['Half', 'Quarter', 'Share'],
      rating: 4.7,
      students: 189,
      copies: 56,
      thumbnail: '🔢',
      tags: ['阅读理解', '语法']
    },
    {
      id: 3,
      title: '一年级英语 Unit 1 Colors',
      author: '王老师',
      age: '6-7岁',
      grade: '一年级/G1',
      unit: 'Unit 1: Colors',
      unitCN: '多彩的世界',
      duration: 10,
      stage: '学前',
      storyTheme: '彩虹小镇的故事',
      keywords: ['Red', 'Green', 'Blue'],
      rating: 4.8,
      students: 342,
      copies: 128,
      thumbnail: '🌈',
      tags: ['自然拼读', '基础词汇']
    },
    {
      id: 4,
      title: '二年级英语 Unit 2 Food',
      author: '赵老师',
      age: '7-8岁',
      grade: '二年级/G2',
      unit: 'Unit 2: Food',
      unitCN: '美味的食物',
      duration: 12,
      stage: '学前',
      storyTheme: '小厨师大冒险',
      keywords: ['Apple', 'Banana', 'Milk'],
      rating: 4.6,
      students: 178,
      copies: 67,
      thumbnail: '🍎',
      tags: ['口语会话', '词汇学习']
    },
    {
      id: 5,
      title: '四年级英语 Unit 4 Weather',
      author: '刘老师',
      age: '9-10岁',
      grade: '四年级/G4',
      unit: 'Unit 4: Weather',
      unitCN: '神奇的天气',
      duration: 20,
      stage: '小学',
      storyTheme: '天气侦探',
      keywords: ['Rain', 'Sunny', 'Cloud'],
      rating: 4.5,
      students: 145,
      copies: 45,
      thumbnail: '🌤️',
      tags: ['阅读理解', '语法']
    },
    {
      id: 6,
      title: '自然拼读 Phonics ABC',
      author: '陈老师',
      age: '5-8岁',
      grade: '幼儿园/K',
      unit: 'Phonics Level 1',
      unitCN: '自然拼读入门',
      duration: 8,
      stage: '学前',
      storyTheme: '字母王国',
      keywords: ['A', 'B', 'C', 'Phonics'],
      rating: 4.9,
      students: 456,
      copies: 203,
      thumbnail: '🔤',
      tags: ['自然拼读', '发音']
    },
  ];

  // 儿童英语培训分类 - 简化版
  const categories = [
    { id: 'all', name: '全部' },
    { id: 'phonics', name: '自然拼读' },
    { id: 'reading', name: '绘本阅读' },
    { id: 'vocabulary', name: '词汇学习' },
    { id: 'grammar', name: '语法' },
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.storyTheme.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ||
                           course.tags?.some(tag => tag.toLowerCase().includes(selectedCategory.toLowerCase()));
    return matchesSearch && matchesCategory;
  });

  const handleCopyCourse = (courseId) => {
    alert('课程复制成功！已添加到您的课程列表，您可以开始编辑。');
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num;
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-8 h-8 text-blue-600" />
                课程广场
              </h1>
              <p className="text-slate-500 mt-1">发现优质课程，一键复制开始您的教学</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-slate-100'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索课程、单元、主题..."
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg"
            />
          </div>

          {/* Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Course List - 可滚动区域 */}
      <div className="flex-1 overflow-y-auto max-w-7xl mx-auto px-6 py-6 w-full">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <div
                key={course.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
              >
                {/* 缩略图 */}
                <div className="h-40 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-6xl relative">
                  {course.thumbnail}
                  {/* 复制按钮 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyCourse(course.id);
                    }}
                    className="absolute top-3 right-3 px-3 py-1.5 bg-white/90 backdrop-blur text-blue-600 rounded-lg text-sm font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shadow-sm hover:bg-white"
                  >
                    <Copy className="w-4 h-4" />
                    复制课程
                  </button>
                </div>
                <div className="p-5">
                  {/* 标题和作者 */}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-slate-800 flex-1 pr-2">{course.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">by {course.author}</p>

                  {/* 课程信息 */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Book className="w-4 h-4 text-slate-400" />
                      <span>{course.unit} - {course.unitCN}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>{course.duration}分钟 ({course.stage})</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Sparkles className="w-4 h-4 text-slate-400" />
                      <span>{course.storyTheme}</span>
                    </div>
                  </div>

                  {/* 标签 */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {course.tags?.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* 统计数据 */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{course.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{formatNumber(course.students)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-green-600">
                      <Copy className="w-3 h-3" />
                      <span>已复制 {course.copies} 次</span>
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
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex gap-5">
                  {/* 缩略图 */}
                  <div className="w-36 h-36 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center text-5xl shrink-0 relative">
                    {course.thumbnail}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCourse(course.id);
                      }}
                      className="absolute -bottom-2 -right-2 px-3 py-1.5 bg-white text-blue-600 rounded-lg text-sm font-medium flex items-center gap-1 shadow-md opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Copy className="w-4 h-4" />
                      复制
                    </button>
                  </div>

                  {/* 课程信息 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">{course.title}</h3>
                        <p className="text-sm text-slate-400">by {course.author}</p>
                      </div>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {course.grade}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 my-3">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Book className="w-4 h-4 text-slate-400" />
                        <span>{course.unit} - {course.unitCN}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{course.duration}分钟 ({course.stage})</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Sparkles className="w-4 h-4 text-slate-400" />
                        <span>{course.storyTheme}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Tag className="w-4 h-4 text-slate-400" />
                        <span>{course.tags?.join(' / ')}</span>
                      </div>
                    </div>

                    {/* 关键词 */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {course.keywords?.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>

                    {/* 底部统计 */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{course.rating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{formatNumber(course.students)} 学员</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-600">
                          <Copy className="w-4 h-4" />
                          <span>已复制 {course.copies} 次</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">未找到相关课程</p>
          </div>
        )}
      </div>
    </div>
  );
};
