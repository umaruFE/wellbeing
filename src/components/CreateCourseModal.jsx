import i18next from 'i18next';
import { LocalizedText } from '../i18n/LocalizedText.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Check, Loader2 } from 'lucide-react';
import { colors, typography, shadows } from '../theme/theme';

const CreateCourseModal = ({ isOpen, onClose, onFinish }) => {
  const { i18n } = useTranslation();
  const isChinese = !i18n.language?.startsWith('en');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: '7-9岁',
    duration: '60分钟',
    scale: '9-15人',
    vocabulary: [],
    grammar: [],
    skills: [],
    paths: [],
    theme: '',
    requirements: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [autoTheme, setAutoTheme] = useState(false);
  const [errors, setErrors] = useState({});
  const createFlowAbortRef = useRef(null);
  const mountedRef = useRef(false);

  const cancelCreateFlow = () => {
    if (createFlowAbortRef.current) {
      createFlowAbortRef.current.abort();
      createFlowAbortRef.current = null;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelCreateFlow();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) cancelCreateFlow();
  }, [isOpen]);

  const handleClose = () => {
    cancelCreateFlow();
    setSubmitting(false);
    onClose?.();
  };

  if (!isOpen) return null;

  // 验证表单
  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 3) {
      if (!autoTheme && !formData.theme?.trim()) {
        newErrors.theme = '请输入情境主题或选择自动匹配';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理下一步
  const handleNextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  // --- 业务逻辑 ---
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  };

  const getUser = () => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  };

  const handleFinish = async (data) => {
    if (submitting) return;
    setSubmitting(true);
    const user = getUser();
    const payload = {
      ...data,
      language: isChinese ? 'zh' : 'en',
      outputLanguage: isChinese ? 'Chinese' : 'English',
      userId: user?.id || null,
      organizationId: user?.organization_id || null
    };

    try {
      const abortController = new AbortController();
      cancelCreateFlow();
      createFlowAbortRef.current = abortController;

      const response = await fetch('/api/ai/generate-course-overview', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
        signal: abortController.signal
      });
      const result = await response.json();

      if (result.success && result.data?.courseOverview) {
        console.log('[CreateCourseModal] 概览API响应:', result.data);
        const overview = result.data.courseOverview;

        const keywordsList = [data.vocabulary, data.grammar]
          .filter(Boolean)
          .flatMap(v => Array.isArray(v) ? v : v.split(/\r?\n/).map(k => k.trim()))
          .filter(Boolean);

        const saveData = {
          title: overview.courseTitle || data.theme || '未命名课程',
          description: overview.overallContext || '',
          ageGroup: data.age,
          unit: data.scale,
          duration: data.duration,
          theme: overview.theme || data.theme,
          keywords: keywordsList,
          courseData: { courseOverview: overview },
          status: 'draft',
          userId: user?.id || null,
          organizationId: user?.organizationId || user?.organization_id || null
        };

        try {
          const saveResult = await (await import('../services/api')).default.createCourse(saveData, { signal: abortController.signal });
          if (abortController.signal.aborted || !mountedRef.current) return;
          if (createFlowAbortRef.current === abortController) {
            createFlowAbortRef.current = null;
          }
          if (saveResult.data?.id) {
            setSubmitting(false);
            onFinish?.({ ...data, courseId: saveResult.data.id, courseOverview: overview, title: overview.courseTitle });
          } else {
            console.error('保存课程失败，没有返回 id');
            setSubmitting(false);
            alert(i18next.t('createCourseUi.saveFailed'));
          }
        } catch (err) {
          if (createFlowAbortRef.current === abortController) {
            createFlowAbortRef.current = null;
          }
          if (err?.name === 'AbortError') {
            if (mountedRef.current) setSubmitting(false);
            return;
          }
          console.error('保存课程失败:', err);
          setSubmitting(false);
          alert(i18next.t('createCourseUi.saveFailed'));
        }
      } else {
        console.error('[CreateCourseModal] 概览生成失败:', result.error || '未知错误');
        if (createFlowAbortRef.current === abortController) {
          createFlowAbortRef.current = null;
        }
        setSubmitting(false);
        alert(result.error || i18next.t('createCourseUi.overviewFailed'));
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        createFlowAbortRef.current = null;
        if (mountedRef.current) setSubmitting(false);
        return;
      }
      createFlowAbortRef.current = null;
      console.error('网络错误，请重试');
      setSubmitting(false);
      alert(i18next.t('createCourseUi.networkFailed'));
    }
  };

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  // --- 样式定义 ---
  const primaryButtonStyle = {
    minHeight: 40,
    border: '1px solid var(--wb-primary)',
    transition: 'background-color 0.15s ease',
  };

  const secondaryButtonStyle = {
    backgroundColor: 'var(--wb-surface)',
    color: 'var(--wb-muted)',
    border: '1px solid var(--wb-border)',
  };

  // --- 子组件：Stepper 步骤项 ---
  const StepItem = ({ id, label, currentStep }) => {
    const isCompleted = currentStep > id;
    const isActive = currentStep === id;
    
    return (
      <div className="flex items-center gap-3">
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
          style={{
            backgroundColor: isActive ? 'var(--wb-primary)' : (isCompleted ? 'var(--wb-selected)' : '#FFF'),
            color: isActive ? '#FFF' : (isCompleted ? 'var(--wb-primary)' : 'var(--wb-muted)'),
            border: isCompleted || isActive ? 'none' : '1px solid var(--wb-border)'
          }}
        >
          {isCompleted ? <Check size={18} strokeWidth={3} /> : id}
        </div>
        <span className="text-sm font-bold transition-colors duration-300"
          style={{ color: isCompleted || isActive ? 'var(--wb-text)' : 'var(--wb-muted)' }}>
          {label}
        </span>
      </div>
    );
  };

  const CustomCheckbox = ({ label, isSelected, onClick }) => (
    <button onClick={onClick} className="min-h-10 flex items-center gap-2 px-4 py-2 rounded-[var(--wb-control-radius)] border bg-white transition-all text-sm"
      style={{ borderColor: isSelected ? 'var(--wb-primary)' : 'var(--wb-border)', color: isSelected ? 'var(--wb-primary)' : 'var(--wb-muted)' }}>
      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-white border-[var(--wb-primary)]' : 'bg-white border-gray-300'}`}>
        {isSelected && <Check size={12} className="text-[var(--wb-primary)]" strokeWidth={4} />}
      </div>
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[760px] rounded-[18px] flex flex-col relative overflow-hidden"
           style={{ fontFamily: typography.fontFamily.default }}>
        
        {/* 1. 顶部红色装饰线 */}
        <div className="w-full h-1.5 bg-gray-100 relative">
          <div className="absolute h-full bg-[var(--wb-primary)] transition-all duration-500"
               style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        {/* 标题栏 */}
        <div className="px-10 pt-8 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[var(--wb-text)]"><LocalizedText id="course.createCourse" /></h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
        </div>

        {/* 2. 步骤指示器 (完全还原 image_7b321c.png) */}
        <div className="px-10 mt-6 flex items-center">
          <StepItem id={1} label={i18next.t('musicStudio.stepBasic')} currentStep={step} />
          <div className="flex-1 h-[1.5px] mx-6 transition-colors duration-300" 
            style={{ backgroundColor: step > 1 ? 'var(--wb-primary)' : 'var(--wb-page)' }} />
          
          <StepItem id={2} label={i18next.t('createCourseUi.5a1062a60e')} currentStep={step} />
          <div className="flex-1 h-[1.5px] mx-6 transition-colors duration-300" 
            style={{ backgroundColor: step > 2 ? 'var(--wb-primary)' : 'var(--wb-page)' }} />
          
          <StepItem id={3} label={i18next.t('createCourseUi.c2c5dabfec')} currentStep={step} />
        </div>

        {/* 3. 内容区 */}
        <div className="px-10 py-4 min-h-[460px]">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-2 gap-8">
                <section>
                  <label className="block text-sm font-bold mb-3"><LocalizedText id="createCourseUi.e94b9b7e27" /> <span className="text-orange-500">*</span></label>
                  <div className="flex gap-2">
                    {['3-6岁', '7-9岁', '9-12岁'].map(opt => (
                      <button key={opt} onClick={() => updateField('age', opt)}
                        className={`min-h-10 px-4 py-2 rounded-[var(--wb-control-radius)] border text-sm transition-all ${formData.age === opt ? 'border-[var(--wb-selected-border)] text-[var(--wb-primary)] bg-[var(--wb-selected)] font-bold' : 'border-gray-200 text-gray-400'}`}>{opt}</button>
                    ))}
                  </div>
                </section>
                <section>
                  <label className="block text-sm font-bold mb-3"><LocalizedText id="createCourse.duration" /> <span className="text-orange-500">*</span></label>
                  <div className="flex gap-2">
                    {['40分钟', '60分钟', '120分钟'].map(opt => (
                      <button key={opt} onClick={() => updateField('duration', opt)}
                        className={`min-h-10 px-4 py-2 rounded-[var(--wb-control-radius)] border text-sm transition-all ${formData.duration === opt ? 'border-[var(--wb-selected-border)] text-[var(--wb-primary)] bg-[var(--wb-selected)] font-bold' : 'border-gray-200 text-gray-400'}`}>{opt}</button>
                    ))}
                  </div>
                </section>
              </div>
              <section>
                <label className="block text-sm font-bold mb-3 text-[var(--wb-text)]"><LocalizedText id="createCourse.classSize" /> <span className="text-orange-500">*</span></label>
                <div className="flex gap-2">
                  {['≤ 8人', '9-15人', '≥ 16人'].map(opt => (
                    <button key={opt} onClick={() => updateField('scale', opt)}
                      className={`min-h-10 px-4 py-2 rounded-[var(--wb-control-radius)] border text-sm transition-all ${formData.scale === opt ? 'border-[var(--wb-selected-border)] text-[var(--wb-primary)] bg-[var(--wb-selected)] font-bold' : 'border-gray-200 text-gray-400'}`}>{opt}</button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <section>
                <label className="block text-sm font-bold mb-3 text-[var(--wb-text)]"><LocalizedText id="createCourseUi.84fcc112cc" /></label>
                <div className="grid grid-cols-2 gap-px bg-[var(--wb-page)] rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-6">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider"><LocalizedText id="courseOverview.vocabulary" /></span>
                    <textarea
                      className="w-full min-h-[110px] mt-4 bg-white rounded-[var(--wb-control-radius)] p-3 text-sm resize-none border border-transparent focus:border-[var(--wb-primary)] outline-none transition-all"
                      placeholder={i18next.t('createCourseUi.9480552faf')}
                      value={Array.isArray(formData.vocabulary) ? formData.vocabulary.join(', ') : (formData.vocabulary || '')}
                      onChange={e => updateField('vocabulary', e.target.value)}
                    />
                  </div>
                  <div className="p-6 border-l border-gray-200">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider"><LocalizedText id="createCourse.grammarLabel" /></span>
                    <textarea
                      className="w-full min-h-[110px] mt-4 bg-white rounded-[var(--wb-control-radius)] p-3 text-sm resize-none border border-transparent focus:border-[var(--wb-primary)] outline-none transition-all"
                      placeholder={i18next.t('createCourseUi.c614cf5025')}
                      value={Array.isArray(formData.grammar) ? formData.grammar.join(', ') : (formData.grammar || '')}
                      onChange={e => updateField('grammar', e.target.value)}
                    />
                  </div>
                </div>
              </section>
              <section>
                <label className="block text-sm font-bold mb-3 text-[var(--wb-text)]"><LocalizedText id="createCourseUi.fb83f53eb4" /></label>
                <div className="flex flex-wrap gap-3">
                  {['听力理解', '口语表达', '阅读理解', '书面表达'].map(s => (
                    <CustomCheckbox key={s} label={s} isSelected={formData.skills.includes(s)} 
                      onClick={() => updateField('skills', formData.skills.includes(s) ? formData.skills.filter(i => i !== s) : [...formData.skills, s])} />
                  ))}
                </div>
              </section>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <section>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-bold text-[var(--wb-text)]"><LocalizedText id="createCourseUi.81d610d4b2" /> <span className="text-orange-500">*</span></label>
                  <button 
                    onClick={() => { 
                      setAutoTheme(!autoTheme); 
                      if (!autoTheme) updateField('theme', '');
                      setErrors(prev => ({ ...prev, theme: '' }));
                    }}
                    className={`min-h-10 text-sm px-4 py-1.5 rounded-[var(--wb-control-radius)] border transition-all shadow-sm ${autoTheme ? 'border-[var(--wb-selected-border)] text-[var(--wb-primary)] bg-[var(--wb-selected)] font-bold' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    {autoTheme ? '✓ AI自动匹配' : '自动匹配'}
                  </button>
                </div>
                <input type="text" 
                  value={autoTheme ? 'AI将根据课程信息自动生成情境主题' : formData.theme} 
                  onChange={e => { if (!autoTheme) { updateField('theme', e.target.value); setErrors(prev => ({ ...prev, theme: '' })); } }}
                  disabled={autoTheme}
                  className={`min-h-11 w-full px-4 py-3.5 rounded-[var(--wb-control-radius)] border transition-all focus:outline-none ${autoTheme ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed' : errors.theme ? 'border-red-400 focus:border-red-500 bg-red-50' : 'border-gray-200 focus:border-[var(--wb-primary)]'}`}
                  placeholder={i18next.t('createCourseUi.0839d788fa')} />
                {errors.theme && <p className="text-red-500 text-xs mt-1">{errors.theme}</p>}
                {!autoTheme && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {['森林探险', '海底世界', '太空旅行', '童话城堡', '农场生活', '城市探索'].map(t => (
                      <button key={t} onClick={() => updateField('theme', t)} 
                        className={`min-h-10 px-4 py-1.5 rounded-full border text-xs transition-all ${
                          formData.theme === t ? 'bg-[var(--wb-selected)] border-[var(--wb-selected-border)] text-[var(--wb-primary)]' : 'bg-[var(--wb-page)] border-transparent text-gray-500 hover:bg-gray-200'
                        }`}>{t}</button>
                    ))}
                  </div>
                )}
              </section>
              <section>
                <label className="block text-sm font-bold mb-3 text-[var(--wb-text)]"><LocalizedText id="createCourseUi.0997049de1" /> <span className="font-normal text-gray-400 ml-1"><LocalizedText id="createCourseUi.ff33e15337" /></span></label>
                <div className="flex flex-wrap gap-3">
                  {['艺术表达', '体感探索', '音乐律动'].map(p => (
                    <CustomCheckbox key={p} label={p} isSelected={formData.paths.includes(p)} 
                      onClick={() => updateField('paths', formData.paths.includes(p) ? formData.paths.filter(i => i !== p) : [...formData.paths, p])} />
                  ))}
                </div>
              </section>
              <section>
                <label className="block text-sm font-bold mb-3 text-[var(--wb-text)]"><LocalizedText id="createCourseUi.47c203fae2" /></label>
                <textarea value={formData.requirements} onChange={e => updateField('requirements', e.target.value)}
                  className="w-full px-4 py-4 rounded-[var(--wb-control-radius)] border border-gray-200 outline-none h-44 resize-none focus:border-[var(--wb-primary)] transition-all" placeholder={i18next.t('createCourseUi.d7d611f997')} />
              </section>
            </div>
          )}
        </div>

        {/* 底部操作沿用统一控件样式。 */}
        <div className="px-10 py-8 flex items-center border-t border-gray-50 bg-gray-50/20">
          <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} 
            className="min-h-10 px-8 py-2 rounded-[var(--wb-control-radius)] font-medium transition-colors hover:bg-[var(--wb-selected)] border border-[var(--wb-border)]"
          >
            {step > 1 ? '上一步' : '取消'}
          </button>
          
          <div className="flex-1" />
          
          <div className="flex gap-6 items-center">
            {step > 1 && <button onClick={onClose} className="min-h-10 font-bold text-neutral-400 hover:text-neutral-600 px-4 transition-colors"><LocalizedText id="common.cancel" /></button>}
            
            <button 
              onClick={() => step < 3 ? handleNextStep() : handleFinish(formData)}
              disabled={submitting}
              className="min-h-10 px-8 py-2 rounded-[var(--wb-control-radius)] bg-[var(--wb-primary)] text-white hover:bg-[var(--wb-primary-hover)] active:bg-[var(--wb-primary-active)] font-semibold transition-colors flex items-center gap-2 group disabled:opacity-50"
              style={primaryButtonStyle}
            >
              {submitting && <Loader2 size={20} className="animate-spin" />}
              {step === 3 ? (submitting ? '提交中...' : '完成') : '下一步'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCourseModal;
