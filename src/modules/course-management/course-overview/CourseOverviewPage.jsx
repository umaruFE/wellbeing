import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Edit3,
  Star,
  Users,
  Clock,
  Target,
  Compass,
  MessageSquare,
  Smile,
  FileCheck
} from 'lucide-react';
import { useCourseLayout } from '../../../components/CourseLayout';
import apiService from '../../../services/api';

const colors = {
  neutral: {
    white: '#FFFFFF',
    text: {
      1: '#333E4E',
      2: '#575F6E',
      3: '#818997',
      disabled: '#A4ABB8',
    },
    border: {
      DEFAULT: '#E6E3DE',
      secondary: '#EFECE8',
      split: '#F5F2EE',
    },
    bg: {
      layout: '#F7F5F1',
    },
    fill: {
      gray1: '#FCFBF9',
      gray2: '#F7F5F1',
    }
  },
  brand: {
    DEFAULT: '#F4785E',
    bg: '#FDECE8',
    light: '#FDECE8',
  },
  info: { DEFAULT: '#4482E5' },
  success: { DEFAULT: '#509F69' },
  purple: { DEFAULT: '#9966D0' }
};

const CourseOverviewPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { setTitle, setActions } = useCourseLayout();
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setLoading(false);
        return;
      }
      try {
        const result = await apiService.getCourse(courseId);
        setCourseData(result.data || result);
      } catch (err) {
        console.error('获取课程失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [courseId]);

  const neoButtonStyle = {
    backgroundColor: colors.neutral.white,
    color: colors.neutral.text[1],
    border: `2px solid ${colors.neutral.text[1]}`,
    boxShadow: `6px 6px 0px 0px ${colors.neutral.text[1]}`,
    transition: 'all 0.1s ease',
  };

  const primaryNeoButtonStyle = {
    ...neoButtonStyle,
    backgroundColor: colors.brand.DEFAULT,
    color: colors.neutral.white,
  };

  useEffect(() => {
    const displayTitle = courseData?.title || '未命名课程';
    setTitle(<span className="font-bold text-[15px]" style={{ color: colors.neutral.text[1] }}>{displayTitle}</span>);
    setActions(
      <>
        <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5 mr-2">
          <RefreshCw size={12} /> 所有更改已保存
        </span>
        <div className="px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5"
             style={{ backgroundColor: colors.brand.light, color: colors.brand.DEFAULT }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.brand.DEFAULT }}></span>
          后台任务 2
        </div>
        <button className="px-5 py-1.5 rounded-lg text-[13px] font-bold border transition-colors text-white"
                style={{ backgroundColor: '#4C5866' }}>
          导出
        </button>
        <button className="px-5 py-1.5 rounded-lg text-[13px] font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: colors.brand.DEFAULT }}>
          发布
        </button>
      </>
    );
    return () => { setTitle(null); setActions(null); };
  }, [courseData, setTitle, setActions]);

  const ObjectiveCard = ({ icon, title, color, content }) => (
    <div className="bg-white rounded-[24px] p-8 border flex gap-6 transition-all hover:translate-y-[-4px] hover:shadow-xl relative overflow-hidden group"
      style={{ borderColor: colors.neutral.border.secondary }}>
      <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: color }}></div>
      <div className="p-4 rounded-2xl h-fit transition-transform group-hover:scale-110" style={{ backgroundColor: colors.neutral.bg.layout }}>
        {React.cloneElement(icon, { size: 28, style: { color: color } })}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-lg mb-3 flex items-center justify-between" style={{ color: colors.neutral.text[1] }}>
          {title}
          <Edit3 size={16} className="opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-gray-300 hover:text-gray-500" />
        </h4>
        <p className="text-sm leading-relaxed font-medium" style={{ color: colors.neutral.text[2] }}>
          {content}
        </p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.neutral.bg.layout }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-brand-coral border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: colors.neutral.text[2] }}>加载中...</p>
        </div>
      </div>
    );
  }

  const displayData = courseData?.courseData?.courseOverview || {
    courseTitle: courseData?.title || '未命名课程',
    corePhilosophy: 'PERMA + SEL + 体验驱动',
    overallContext: courseData?.concept || '暂无课程概述',
    languageGoals: {
      vocabulary: courseData?.vocabulary || '暂无词汇目标',
      grammar: courseData?.grammar || '暂无语法目标'
    },
    selGoals: courseData?.selGoals || '暂无SEL目标',
    permaGoals: courseData?.permaGoals || '暂无PERMA目标',
    finalTask: courseData?.finalTask || '暂无产出任务',
  };

  return (
    <div className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: colors.neutral.bg.layout, fontFamily: '"HarmonyOS Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}>
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start max-w-[1400px] mx-auto">
        {/* Left: Course Core Info */}
        <div className="lg:col-span-4 bg-white p-8 border shadow-sm"
          style={{ borderRadius: '32px', borderColor: colors.neutral.border.secondary }}>

          <h2 className="text-3xl font-bold mb-3" style={{ color: colors.neutral.text[1] }}>{displayData.courseTitle}</h2>
          <span className="inline-block px-4 py-1.5 text-xs font-bold rounded-xl mb-8"
            style={{ backgroundColor: colors.brand.bg, color: colors.brand.DEFAULT }}>
            {courseData?.theme || '森林探险'}
          </span>

          <div className="flex items-center gap-5 mb-10 text-sm font-medium" style={{ color: colors.neutral.text[2] }}>
            <span className="flex items-center gap-2"><Users size={18} style={{ color: colors.brand.DEFAULT }} /> {courseData?.age_group || '7-9岁'}</span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.neutral.border.DEFAULT }}></span>
            <span className="flex items-center gap-2"><Clock size={18} style={{ color: colors.brand.DEFAULT }} /> {courseData?.duration || '40分钟'}</span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.neutral.border.DEFAULT }}></span>
            <span className="flex items-center gap-2"><Target size={18} style={{ color: colors.brand.DEFAULT }} /> {courseData?.capacity || '9-15人'}</span>
          </div>

          {/* Core Philosophy */}
          <div className="border rounded-[24px] p-6 mb-10 relative overflow-hidden group"
            style={{ backgroundColor: colors.neutral.fill.gray1, borderColor: `${colors.brand.DEFAULT}30` }}>
            <div className="flex items-center gap-2 mb-4" style={{ color: colors.brand.DEFAULT }}>
              <Star size={20} fill="currentColor" />
              <span className="text-base font-bold">核心理念</span>
            </div>
            <p className="text-sm leading-relaxed relative z-10 font-medium" style={{ color: colors.neutral.text[2] }}>
              {displayData.corePhilosophy}
            </p>
            <Star size={100} className="absolute -right-6 -bottom-6 opacity-[0.04] rotate-12 transition-transform group-hover:scale-110" style={{ color: colors.brand.DEFAULT }} />
          </div>

          {/* Cover Image Preview */}
          <div className="relative rounded-[24px] overflow-hidden aspect-[16/11] group" style={{ backgroundColor: colors.brand.bg, border: `1.5px solid ${colors.neutral.border.secondary}` }}>
            {courseData?.thumbnail ? (
              <img
                src={courseData.thumbnail}
                alt="Course Cover"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ color: colors.neutral.text.disabled }}>
                暂无封面图
              </div>
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
              <button className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2" style={primaryNeoButtonStyle}>
                <RefreshCw size={18} /> 重新生成封面
              </button>
            </div>
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-bold text-gray-500 border border-white">
              PREVIEW
            </div>
          </div>
        </div>

        {/* Right: Course Objectives */}
        <div className="lg:col-span-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold" style={{ color: colors.neutral.text[1] }}>课程目标解构</h3>
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-widest">Analysis</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ObjectiveCard
              icon={<Compass />}
              title="整体情境"
              color={colors.brand.DEFAULT}
              content={displayData.overallContext}
            />
            <ObjectiveCard
              icon={<MessageSquare />}
              title="语言培养目标"
              color={colors.info.DEFAULT}
              content={`词汇: ${displayData.languageGoals?.vocabulary || '暂无'}\n句型: ${displayData.languageGoals?.grammar || '暂无'}`}
            />
            <ObjectiveCard
              icon={<Users />}
              title="SEL核心目标"
              color={colors.success.DEFAULT}
              content={displayData.selGoals}
            />
            <ObjectiveCard
              icon={<Smile />}
              title="PERMA幸福体验目标"
              color={colors.purple.DEFAULT}
              content={displayData.permaGoals}
            />
            <div className="md:col-span-2">
              <ObjectiveCard
                icon={<FileCheck />}
                title="终极产出任务"
                color={colors.brand.DEFAULT}
                content={displayData.finalTask}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseOverviewPage;
