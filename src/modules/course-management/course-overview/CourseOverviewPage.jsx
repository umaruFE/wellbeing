import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  FileCheck,
  Loader2,
  Wand2,
  X
} from 'lucide-react';
import { useCourseLayout } from '../../../components/CourseLayout';
import { useAuth } from '../../../contexts/AuthContext';
import apiService from '../../../services/api';
import { exportToPDF } from '../../../utils/exportUtils';

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
  const { t } = useTranslation();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setTitle, setActions } = useCourseLayout();
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isGeneratingCourse, setIsGeneratingCourse] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerateAdjustments, setRegenerateAdjustments] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const contentRef = useRef(null);

  const handleRegenerateOverview = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    try {
      const payload = {
        age: courseData.age_group || '7-9岁',
        duration: courseData.duration || '60分钟',
        scale: courseData.capacity || courseData.unit || '9-15人',
        vocabulary: courseData.keywords || [],
        grammar: [],
        skills: courseData.skills || [],
        paths: courseData.paths || [],
        theme: courseData.theme || '',
        requirements: '',
        adjustments: regenerateAdjustments,
        existingOverview: displayData,
        userId: courseData.user_id || null,
        organizationId: courseData.organization_id || null
      };
      const response = await fetch('/api/ai/generate-course-overview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success && result.data?.courseOverview) {
        const newOverview = result.data.courseOverview;
        const updatedCourseData = {
          ...courseData,
          theme: newOverview.theme || courseData.theme || '',
          title: newOverview.courseTitle || courseData.title,
          course_data: {
            ...(typeof courseData.course_data === 'string' ? JSON.parse(courseData.course_data) : courseData.course_data),
            courseOverview: newOverview
          }
        };
        await apiService.updateCourse(courseId, {
          courseData: updatedCourseData.course_data,
          title: updatedCourseData.title,
          theme: updatedCourseData.theme,
          userId: user?.id || courseData?.user_id || null,
          organizationId: user?.organizationId || user?.organization_id || courseData?.organization_id || null,
        });
        setCourseData(updatedCourseData);
        setShowRegenerateModal(false);
        setRegenerateAdjustments('');
      } else {
        alert(result.error || t('courseOverview.regenerateFailed'));
      }
    } catch (err) {
      console.error('regenerate failed:', err);
      alert(t('courseOverview.regenerateFailed'));
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleGenerateCourse = async () => {
    if (!courseId || isGeneratingCourse) return;
    setIsGeneratingCourse(true);
    try {
      const payload = {
        age: courseData.age_group || '7-9岁',
        duration: courseData.duration || '60分钟',
        scale: courseData.capacity || courseData.unit || '9-15人',
        vocabulary: courseData.keywords || [],
        grammar: [],
        skills: [],
        paths: [],
        theme: courseData.theme || '',
        requirements: '',
        courseOverview: displayData,
        userId: courseData.user_id || null,
        organizationId: courseData.organization_id || null
      };
      const response = await fetch('/api/ai/generate-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.success && result.data?.courseData) {
        const courseDataResult = result.data.courseData;
        const mergedCourseData = {
          courseOverview: displayData,
          ...courseDataResult
        };
        await apiService.updateCourse(courseId, {
          courseData: mergedCourseData,
          title: displayData.courseTitle || courseData.title,
          userId: user?.id || courseData?.user_id || null,
          organizationId: user?.organizationId || user?.organization_id || courseData?.organization_id || null,
        });
        navigate(`/courses/${courseId}/lesson-plan`);
      } else {
        alert(result.error || t('courseOverview.generateLessonFailed'));
      }
    } catch (err) {
      console.error('generate lesson failed:', err);
      alert(t('courseOverview.generateLessonFailed'));
    } finally {
      setIsGeneratingCourse(false);
    }
  };

  const handleExportCourse = async () => {
    if (!contentRef.current) return;
    setIsExporting(true);
    try {
      const filename = `${t('courseOverview.title')}_${courseData?.title || 'untitled'}_${Date.now()}.pdf`;
      await exportToPDF(contentRef.current, filename);
    } catch (err) {
      console.error('export failed:', err);
      alert(t('courseOverview.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

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
        console.error('fetch course failed:', err);
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
    const displayTitle = courseData?.title || '';
    setTitle(<span className="font-bold text-[15px]" style={{ color: colors.neutral.text[1] }}>{displayTitle}</span>);

    const handleSave = async () => {
      if (!courseId) return;
      setIsSaving(true);
      try {
        await apiService.updateCourse(courseId, {
          courseData,
          userId: user?.id || courseData?.user_id || null,
          organizationId: user?.organizationId || user?.organization_id || courseData?.organization_id || null,
        });
      } catch (err) {
        console.error('save failed:', err);
        alert(t('course.saveFailed'));
      } finally {
        setIsSaving(false);
      }
    };

    const handlePublish = async () => {
      if (!courseId) return;
      setIsPublishing(true);
      try {
        await apiService.updateCourse(courseId, {
          courseData,
          status: 'published',
          userId: user?.id || courseData?.user_id || null,
          organizationId: user?.organizationId || user?.organization_id || courseData?.organization_id || null,
        });
        alert(t('course.publishSuccess'));
      } catch (err) {
        console.error('publish failed:', err);
        alert(t('course.publishFailed'));
      } finally {
        setIsPublishing(false);
      }
    };

    setActions(
      <>
        <span className="text-xs font-medium text-gray-400 flex items-center gap-1.5 mr-2">
          {isSaving ? <><Loader2 size={12} className="animate-spin" /> {t('common.saving')}</> : <><RefreshCw size={12} /> {t('courseOverview.allSaved')}</>}
        </span>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-1.5 rounded-lg text-[13px] font-bold border transition-colors text-white disabled:opacity-50"
          style={{ backgroundColor: '#4C5866' }}>
          {isSaving ? <><Loader2 size={14} className="inline animate-spin mr-1" />{t('common.saving')}</> : t('common.save')}
        </button>
        {/* <button
          onClick={handleExportCourse}
          disabled={isExporting}
          className="px-5 py-1.5 rounded-lg text-[13px] font-bold border transition-colors text-white disabled:opacity-50"
          style={{ backgroundColor: '#4C5866' }}>
          {isExporting ? <><Loader2 size={14} className="inline animate-spin mr-1" />{t('courseOverview.exporting')}</> : t('common.export')}
        </button> */}
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className="px-5 py-1.5 rounded-lg text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: colors.brand.DEFAULT }}>
          {isPublishing ? <><Loader2 size={14} className="inline animate-spin mr-1" />{t('common.publishing')}</> : t('common.publish')}
        </button>
      </>
    );
    return () => { setTitle(null); setActions(null); };
  }, [courseData, courseId, isExporting, isSaving, isPublishing, setTitle, setActions]);

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
          {/* <Edit3 size={16} className="opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-gray-300 hover:text-gray-500" /> */}
        </h4>
        <p className="text-sm leading-relaxed font-medium max-h-22 overflow-y-auto pr-2" style={{ color: colors.neutral.text[2] }}>
          {content}
        </p>
      </div>
    </div>
  );

  const parsedCourseData = React.useMemo(() => {
    if (!courseData) return null;
    let inner = courseData.course_data;
    if (typeof inner === 'string') {
      try { inner = JSON.parse(inner); } catch { inner = null; }
    }

    let n8nData = null;
    if (inner?.text?.courseData) {
      n8nData = inner.text.courseData;
    } else if (inner?.courseData) {
      n8nData = inner.courseData;
    } else if (inner?.courseOverview) {
      n8nData = inner;
    } else if (inner) {
      n8nData = inner;
    } else {
      n8nData = {};
    }

    if (typeof n8nData === 'string') {
      try { n8nData = JSON.parse(n8nData); } catch { n8nData = {}; }
    }

    return { ...courseData, parsedCourseData: n8nData };
  }, [courseData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.neutral.bg.layout }}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-brand-coral border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p style={{ color: colors.neutral.text[2] }}>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const displayData = parsedCourseData?.parsedCourseData?.courseOverview || {
    courseTitle: courseData?.title || t('dashboard.unnamedCourse'),
    corePhilosophy: 'PERMA + SEL + ' + t('courseOverview.experienceDriven'),
    overallContext: courseData?.concept || t('courseOverview.noContext'),
    languageGoals: {
      vocabulary: courseData?.vocabulary || t('courseOverview.noVocab'),
      grammar: courseData?.grammar || t('courseOverview.noGrammar')
    },
    selGoals: courseData?.selGoals || t('courseOverview.noSel'),
    permaGoals: courseData?.permaGoals || t('courseOverview.noPerma'),
    finalTask: courseData?.finalTask || t('courseOverview.noTask'),
  };

  return (
    <div ref={contentRef} className="flex-1 overflow-y-auto p-6" style={{ backgroundColor: colors.neutral.bg.layout, fontFamily: '"HarmonyOS Sans SC", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' }}>
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start max-w-[1400px] mx-auto">
        {/* Left: Course Core Info */}
        <div className="lg:col-span-4 bg-white p-8 border shadow-sm lg:sticky lg:top-24"
          style={{ borderRadius: '32px', borderColor: colors.neutral.border.secondary }}>

          <h2 className="text-2xl font-bold mb-3" style={{ color: colors.neutral.text[1] }}>{displayData.courseTitle}</h2>
          <span className="inline-block px-4 py-1.5 text-xs font-bold rounded-xl mb-8"
            style={{ backgroundColor: colors.brand.bg, color: colors.brand.DEFAULT }}>
            {courseData?.theme || displayData.theme || ''}
          </span>

          <div className="flex items-center gap-5 mb-10 text-sm font-medium" style={{ color: colors.neutral.text[2] }}>
            <span className="flex items-center gap-1"><Users size={18} style={{ color: colors.brand.DEFAULT }} /> {courseData?.age_group || '7-9岁'}</span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.neutral.border.DEFAULT }}></span>
            <span className="flex items-center gap-1"><Clock size={18} style={{ color: colors.brand.DEFAULT }} /> {courseData?.duration || '40分钟'}</span>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.neutral.border.DEFAULT }}></span>
            <span className="flex items-center gap-1"><Target size={18} style={{ color: colors.brand.DEFAULT }} /> {courseData?.capacity || '9-15人'}</span>
          </div>

          {/* Core Philosophy */}
          <div className="border rounded-[24px] p-6 mb-10 relative overflow-hidden group"
            style={{ backgroundColor: colors.neutral.fill.gray1, borderColor: `${colors.brand.DEFAULT}30` }}>
            <div className="flex items-center gap-2 mb-4" style={{ color: colors.brand.DEFAULT }}>
              <Star size={20} fill="currentColor" />
              <span className="text-base font-bold">{t('courseOverview.corePhilosophy')}</span>
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
                {t('courseOverview.noCover')}
              </div>
            )}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
              <button className="px-6 py-2.5 rounded-xl font-bold flex items-center gap-2" style={primaryNeoButtonStyle}>
                <RefreshCw size={18} /> {t('courseOverview.regenerateCover')}
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
            <h3 className="text-2xl font-bold" style={{ color: colors.neutral.text[1] }}>{t('courseOverview.goalBreakdown')}</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowRegenerateModal(true)}
                className="px-4 py-1.5 rounded-lg text-[12px] font-bold flex items-center gap-1.5 transition-colors hover:bg-gray-100"
                style={{ color: colors.neutral.text[2], border: `1px solid ${colors.neutral.border.DEFAULT}` }}
              >
                <RefreshCw size={13} /> {t('common.regenerate')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ObjectiveCard
              icon={<Compass />}
              title={t('courseOverview.overallContext')}
              color={colors.brand.DEFAULT}
              content={displayData.overallContext}
            />
            <ObjectiveCard
              icon={<MessageSquare />}
              title={t('courseOverview.languageGoals')}
              color={colors.info.DEFAULT}
              content={`${t('courseOverview.vocabulary')}: ${displayData.languageGoals?.vocabulary || t('common.none')}\n${t('courseOverview.grammar')}: ${displayData.languageGoals?.grammar || t('common.none')}`}
            />
            <ObjectiveCard
              icon={<Users />}
              title={t('courseOverview.selGoals')}
              color={colors.success.DEFAULT}
              content={displayData.selGoals}
            />
            <ObjectiveCard
              icon={<Smile />}
              title={t('courseOverview.permaGoals')}
              color={colors.purple.DEFAULT}
              content={displayData.permaGoals}
            />
            <div className="md:col-span-2">
              <ObjectiveCard
                icon={<FileCheck />}
                title={t('courseOverview.finalTask')}
                color={colors.brand.DEFAULT}
                content={displayData.finalTask || displayData.finalOutput || displayData.outputTask || t('courseOverview.noTask')}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto mt-10 flex justify-center">
        <button
          onClick={handleGenerateCourse}
          disabled={isGeneratingCourse}
          className="px-10 py-4 rounded-2xl text-base font-bold text-white transition-all flex items-center gap-3 shadow-lg hover:shadow-xl hover:translate-y-[-2px] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: colors.brand.DEFAULT, border: `2px solid ${colors.neutral.text[1]}`, boxShadow: `4px 4px 0px 0px ${colors.neutral.text[1]}` }}
        >
          {isGeneratingCourse ? (
            <><Loader2 size={22} className="animate-spin" /> {t('courseOverview.generatingLessonPlan')}</>
          ) : (
            <><Wand2 size={22} /> {t('courseOverview.generateLessonPlan')}</>
          )}
        </button>
      </div>

      {showRegenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-[24px] p-8 w-full max-w-[520px] shadow-2xl border" style={{ borderColor: colors.neutral.border.secondary }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold" style={{ color: colors.neutral.text[1] }}>{t('courseOverview.regenerate')}</h3>
              <button
                onClick={() => { setShowRegenerateModal(false); setRegenerateAdjustments(''); }}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="mb-6">
              <label className="text-[13px] font-bold block mb-2" style={{ color: colors.neutral.text[1] }}>{t('courseOverview.adjustments')}</label>
              <textarea
                value={regenerateAdjustments}
                onChange={e => setRegenerateAdjustments(e.target.value)}
                placeholder={t('courseOverview.adjustmentsPlaceholder')}
                rows={4}
                className="w-full px-4 py-3 rounded-[16px] border text-[13px] resize-none focus:outline-none focus:ring-2 transition-all"
                style={{ borderColor: colors.neutral.border.DEFAULT, focusRingColor: colors.brand.DEFAULT }}
              />
              <p className="text-[11px] mt-1.5" style={{ color: colors.neutral.text[3] }}>{t('courseOverview.leaveBlank')}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowRegenerateModal(false); setRegenerateAdjustments(''); }}
                className="flex-1 py-3 rounded-xl text-[13px] font-bold transition-colors hover:bg-gray-50"
                style={{ border: `1.5px solid ${colors.neutral.border.DEFAULT}`, color: colors.neutral.text[2] }}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleRegenerateOverview}
                disabled={isRegenerating}
                className="flex-1 py-3 rounded-xl text-[13px] font-bold text-white transition-all disabled:opacity-60"
                style={{ backgroundColor: colors.brand.DEFAULT }}
              >
                {isRegenerating ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> {t('common.generating')}</span>
                ) : (
                  <span className="flex items-center justify-center gap-2"><RefreshCw size={16} /> {t('common.regenerate')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseOverviewPage;
