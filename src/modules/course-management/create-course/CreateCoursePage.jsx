import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  RefreshCw,
  Edit3,
  Star,
  Users,
  Clock,
  Compass,
  MessageSquare,
  FileCheck,
  Layout,
  BookOpen,
  Smile,
  Loader2
} from 'lucide-react';
import { exportToPDF } from '../../../utils/exportUtils';

const apiService = {
  getCourse: async (courseId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            title: 'Unit 3: Animals',
            theme: 'Interstellar Rescue Adventure',
            age_group: '8-9 (G3)',
            duration: '40 min',
            capacity: '9-15',
            concept: '',
            courseData: {
              courseOverview: {
                corePhilosophy: 'PERMA + SEL',
                languageGoals: { vocabulary: '', grammar: '' },
                selGoals: '',
                permaGoals: '',
                finalTask: ''
              }
            }
          }
        });
      }, 300);
    });
  }
};

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
    },
    bg: {
      layout: '#F7F5F1',
    },
    fill: {
      gray1: '#FCFBF9',
    }
  },
  brand: {
    DEFAULT: '#F4785E',
    light: '#FDECE8',
  },
  info: { DEFAULT: '#4482E5' },
  success: { DEFAULT: '#509F69' },
  purple: { DEFAULT: '#9966D0' }
};

const safeRender = (data) => {
  if (data === null || data === undefined) return '';
  if (typeof data === 'string' || typeof data === 'number') return data;
  if (typeof data === 'object') {
    if (Array.isArray(data)) return data.join('；');
    if (data.$$typeof) return '';
    try { return JSON.stringify(data); } catch (e) { return '[Object]'; }
  }
  return String(data);
};

const ObjectiveCard = ({ icon, title, color, content, className = '' }) => (
  <div className={`bg-white rounded-2xl p-6 relative overflow-hidden flex items-start gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-0 ${className}`}>
    <div className="absolute left-0 top-6 bottom-6 w-1.5 rounded-r-md" style={{ backgroundColor: color }}></div>
    <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
         style={{ backgroundColor: `${color}10`, color: color }}>
      {React.isValidElement(icon) ? React.cloneElement(icon, { size: 24, strokeWidth: 2 }) : icon}
    </div>
    <div className="flex flex-col gap-1.5 pt-0.5">
      <h4 className="font-bold text-[15px]" style={{ color: colors.neutral.text[1] }}>
        {safeRender(title)}
      </h4>
      <p className="text-[13px] font-medium leading-relaxed" style={{ color: colors.neutral.text[2] }}>
        {safeRender(content)}
      </p>
    </div>
  </div>
);

const CreateCoursePageContent = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const courseId = searchParams.get('courseId');
  const contentRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const steps = [
    { id: 1, label: t('course.overview'), icon: Layout },
    { id: 2, label: t('course.lessonPlan'), icon: BookOpen },
    { id: 3, label: t('course.courseware'), icon: FileCheck },
  ];

  const handleExportCourse = async () => {
    if (!contentRef.current) return;
    setIsExporting(true);
    try {
      const filename = `${t('createCourse.title')}_${courseData?.title || 'untitled'}_${Date.now()}.pdf`;
      await exportToPDF(contentRef.current, filename);
    } catch (err) {
      console.error('export failed:', err);
      alert(t('courseOverview.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    const stateData = location.state?.courseData;
    if (stateData) {
      setCourseData(stateData);
      const id = stateData.id;
      if (id) {
        navigate(`/courses/${id}/overview`, { replace: true });
        return;
      }
    }
    if (courseId) {
      navigate(`/courses/${courseId}/overview`, { replace: true });
      return;
    }
    setLoading(false);
  }, [location.state, courseId, navigate]);

  const handleStepClick = (stepId) => {
    setCurrentStep(stepId);
    const targetCourseId = courseId || location.state?.courseData?.id;
    switch (stepId) {
      case 1:
        break;
      case 2:
        navigate(`/create?courseId=${targetCourseId}&view=table`);
        break;
      case 3:
        navigate(`/create?courseId=${targetCourseId}&view=canvas`);
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden" style={{ backgroundColor: colors.neutral.bg.layout }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-brand-coral border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p style={{ color: colors.neutral.text[2] }}>{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden" style={{ backgroundColor: colors.neutral.bg.layout }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="mb-4" style={{ color: colors.neutral.text[2] }}>{t('createCourse.noData')}</p>
            <button
              onClick={() => navigate('/courses')}
              className="px-4 py-2 rounded-lg font-medium border hover:bg-gray-50 transition-colors"
              style={{ borderColor: colors.neutral.border.DEFAULT, color: colors.neutral.text[2] }}
            >
              {t('createCourse.backToList')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const displayData = {
    title: courseData.title || t('dashboard.unnamedCourse'),
    theme: courseData.theme || '',
    age_group: courseData.age_group || '',
    duration: courseData.duration || '',
    capacity: courseData.capacity || '',
    concept: courseData.concept || t('courseOverview.noContext'),
    corePhilosophy: courseData.courseData?.courseOverview?.corePhilosophy || 'PERMA + SEL',
    languageGoals: courseData.courseData?.courseOverview?.languageGoals || {
      vocabulary: courseData.vocabulary || t('courseOverview.noVocab'),
      grammar: courseData.grammar || t('courseOverview.noGrammar')
    },
    selGoals: courseData.courseData?.courseOverview?.selGoals || courseData.selGoals || t('courseOverview.noSel'),
    permaGoals: courseData.courseData?.courseOverview?.permaGoals || courseData.permaGoals || t('courseOverview.noPerma'),
    finalTask: courseData.courseData?.courseOverview?.finalTask || courseData.finalTask || t('courseOverview.noTask'),
    thumbnail: courseData.thumbnail || null,
  };

  return (
    <div ref={contentRef} className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden font-sans" style={{ backgroundColor: colors.neutral.bg.layout, fontFamily: '"HarmonyOS Sans SC", system-ui, sans-serif' }}>

      <div className="p-6 pb-0 shrink-0">
        <header className="h-[72px] bg-white rounded-2xl flex items-center justify-between px-6 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">

          <div className="flex-1"></div>

          <nav className="flex items-center justify-center flex-1 shrink-0">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const Icon = step.icon;
              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => handleStepClick(step.id)}
                    className="flex items-center gap-2 cursor-pointer"
                    disabled={!courseId && !location.state?.courseData?.id && step.id > 1}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${!isActive && 'border'}`}
                         style={{
                           backgroundColor: isActive ? colors.brand.DEFAULT : colors.neutral.white,
                           borderColor: !isActive ? colors.neutral.border.DEFAULT : 'transparent',
                           color: isActive ? '#FFF' : colors.neutral.text.disabled,
                         }}>
                      <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className="text-[13px] font-bold tracking-wide"
                          style={{ color: isActive ? colors.neutral.text[1] : colors.neutral.text.disabled }}>
                      {step.label}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className="w-12 h-px mx-3" style={{ backgroundColor: colors.neutral.border.secondary }}></div>
                  )}
                </React.Fragment>
              );
            })}
          </nav>

          <div className="flex items-center justify-end gap-3 flex-1">
            <button className="px-4 py-1.5 rounded-lg text-[13px] font-medium border flex items-center gap-2 hover:bg-gray-50 transition-colors"
                    style={{ borderColor: colors.neutral.border.DEFAULT, color: colors.neutral.text[1] }}>
              <RefreshCw size={14} /> {t('common.regenerate')}
            </button>
            <button className="px-4 py-1.5 rounded-lg text-[13px] font-medium border flex items-center gap-2 hover:bg-gray-50 transition-colors"
                    style={{ borderColor: colors.neutral.border.DEFAULT, color: colors.neutral.text[1] }}>
              <Edit3 size={14} /> {t('common.edit')}
            </button>
            <button
              onClick={handleExportCourse}
              disabled={isExporting}
              className="px-6 py-1.5 rounded-lg text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#445161' }}>
              {isExporting ? <><Loader2 size={14} className="inline animate-spin mr-1" />{t('courseOverview.exporting')}</> : t('common.export')}
            </button>
          </div>
        </header>
      </div>

      <main className="flex-1 overflow-y-auto p-6 pt-6">
        <div className="max-w-[1300px] mx-auto">

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

            <div className="xl:col-span-4 bg-white p-6 rounded-2xl flex flex-col shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-0">
              <h2 className="text-[22px] font-bold mb-3" style={{ color: colors.neutral.text[1] }}>
                {safeRender(displayData.title)}
              </h2>
              <div className="mb-6">
                <span className="inline-block px-3 py-1 text-[11px] font-bold rounded-full"
                      style={{ backgroundColor: colors.brand.light, color: colors.brand.DEFAULT }}>
                  {safeRender(displayData.theme)}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-8 text-[12px] font-medium" style={{ color: colors.neutral.text[2] }}>
                <span className="flex items-center gap-1.5"><Users size={14} /> {safeRender(displayData.age_group)}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span className="flex items-center gap-1.5"><Clock size={14} /> {safeRender(displayData.duration)}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span className="flex items-center gap-1.5"><Users size={14} /> {safeRender(displayData.capacity)}</span>
              </div>

              <div className="rounded-xl p-5 mb-6 relative overflow-hidden"
                   style={{ backgroundColor: colors.brand.light }}>
                <div className="flex items-center gap-2 mb-2" style={{ color: colors.brand.DEFAULT }}>
                  <Star size={16} fill="currentColor" />
                  <span className="text-[13px] font-bold">{t('courseOverview.corePhilosophy')}</span>
                </div>
                <p className="text-[13px] font-medium leading-relaxed relative z-10" style={{ color: colors.neutral.text[1] }}>
                  {safeRender(displayData.corePhilosophy)}
                </p>
                <Star size={80} className="absolute -right-4 -bottom-4 opacity-[0.08] rotate-12" style={{ color: colors.brand.DEFAULT }} />
              </div>

              <div className="relative rounded-xl overflow-hidden mt-auto bg-[#FDF8F5] flex items-center justify-center group min-h-[200px]">
                {displayData.thumbnail ? (
                  <img src={displayData.thumbnail} alt="Course Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center" style={{ color: colors.neutral.text.disabled }}>
                    <span className="text-[13px] font-bold">{t('courseOverview.noCover')}</span>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-white px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm text-gray-400">
                  PREVIEW
                </div>
              </div>
            </div>

            <div className="xl:col-span-8 flex flex-col">
              <div className="flex items-center justify-between mb-5 px-1">
                <h3 className="text-[17px] font-bold" style={{ color: colors.neutral.text[1] }}>{t('courseOverview.goalBreakdown')}</h3>
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-400">ANALYSIS</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <ObjectiveCard
                  icon={<Compass />}
                  title={t('courseOverview.overallContext')}
                  color={colors.brand.DEFAULT}
                  content={displayData.concept}
                />
                <ObjectiveCard
                  icon={<MessageSquare />}
                  title={t('courseOverview.languageGoals')}
                  color={colors.info.DEFAULT}
                  content={`${t('courseOverview.vocabulary')}: ${safeRender(displayData.languageGoals.vocabulary || t('courseOverview.noVocab'))} ${t('courseOverview.grammar')}: ${safeRender(displayData.languageGoals.grammar || t('courseOverview.noGrammar'))}`}
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
                    content={displayData.finalTask}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

const CreateCoursePage = CreateCoursePageContent;

export default CreateCoursePage;
