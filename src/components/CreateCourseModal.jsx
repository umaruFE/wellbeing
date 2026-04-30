import React, { useState } from 'react';
import { X, Check, Loader2 } from 'lucide-react';
import { colors, typography, shadows } from '../theme/theme';

const CreateCourseModal = ({ isOpen, onClose, onFinish }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    age: '7-9岁',
    duration: '60分钟',
    scale: '9-15人',
    vocabulary: [],
    grammar: [],
    skills: ['听力理解', '口语表达'],
    paths: ['艺术表达', '音乐律动'],
    theme: '',
    requirements: ''
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [vocabInput, setVocabInput] = useState('');
  const [grammarInput, setGrammarInput] = useState('');

  if (!isOpen) return null;

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
    if (!data.title?.trim()) {
      setStep(1);
      return;
    }
    setSubmitting(true);
    const user = getUser();
    const payload = { ...data, userId: user?.id || null, organizationId: user?.organization_id || null };

    try {
      const response = await fetch('/api/ai/generate-course', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (result.success) {
        console.log('[CreateCourseModal] API响应:', result.data);
        setSubmitting(false);

        // N8N 直接返回 courseData
        if (result.data?.courseData) {
          console.log('[CreateCourseModal] 收到courseData:', result.data.courseData);
          onFinish?.({
            ...data,
            courseData: result.data.courseData
          });
        } else {
          // 没有 courseData，提示用户
          console.log('[CreateCourseModal] 未收到courseData:', result.data);
          alert('课件生成失败，请重试');
        }
      } else {
        console.error('[CreateCourseModal] 课件生成失败:', result.error || '未知错误');
        setSubmitting(false);
      }
    } catch (error) {
      console.error('网络错误，请重试');
      setSubmitting(false);
    }
  };

  const handleAddTag = (e, field, value, setter) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault();
      if (!formData[field].includes(value.trim())) {
        setFormData({ ...formData, [field]: [...formData[field], value.trim()] });
      }
      setter('');
    }
  };

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  // --- 样式定义 ---
  const primaryButtonStyle = {
    backgroundColor: '#F4785E',
    color: '#fff',
    border: '2px solid #333E4E',
    boxShadow: '6px 6px 0px 0px #333E4E', 
    transition: 'all 0.1s ease',
  };

  const secondaryButtonStyle = {
    backgroundColor: '#fff',
    color: '#575F6E',
    border: '1.5px solid #E6E3DE',
    boxShadow: '2px 2px 0px 0px rgba(0,0,0,0.05)',
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
            backgroundColor: isActive ? '#F4785E' : (isCompleted ? '#FDECE8' : '#FFF'),
            color: isActive ? '#FFF' : (isCompleted ? '#F4785E' : '#A4ABB8'),
            border: isCompleted || isActive ? 'none' : '1px solid #E6E3DE'
          }}
        >
          {isCompleted ? <Check size={18} strokeWidth={3} /> : id}
        </div>
        <span className="text-sm font-bold transition-colors duration-300"
          style={{ color: isCompleted || isActive ? '#333E4E' : '#A4ABB8' }}>
          {label}
        </span>
      </div>
    );
  };

  const CustomCheckbox = ({ label, isSelected, onClick }) => (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-white transition-all text-sm"
      style={{ borderColor: isSelected ? '#F4785E' : '#E6E3DE', color: isSelected ? '#F4785E' : '#575F6E' }}>
      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-white border-[#F4785E]' : 'bg-white border-gray-300'}`}>
        {isSelected && <Check size={12} className="text-[#F4785E]" strokeWidth={4} />}
      </div>
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-[760px] rounded-[32px] flex flex-col relative overflow-hidden" 
           style={{ fontFamily: typography.fontFamily.default }}>
        
        {/* 1. 顶部红色装饰线 */}
        <div className="w-full h-1.5 bg-gray-100 relative">
          <div className="absolute h-full bg-[#F4785E] transition-all duration-500"
               style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        {/* 标题栏 */}
        <div className="px-10 pt-8 flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#333E4E]">创建课程</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24} /></button>
        </div>

        {/* 2. 步骤指示器 (完全还原 image_7b321c.png) */}
        <div className="px-10 mt-6 flex items-center">
          <StepItem id={1} label="基本信息" currentStep={step} />
          <div className="flex-1 h-[1.5px] mx-6 transition-colors duration-300" 
            style={{ backgroundColor: step > 1 ? '#F4785E' : '#F5F2EE' }} />
          
          <StepItem id={2} label="教学目标" currentStep={step} />
          <div className="flex-1 h-[1.5px] mx-6 transition-colors duration-300" 
            style={{ backgroundColor: step > 2 ? '#F4785E' : '#F5F2EE' }} />
          
          <StepItem id={3} label="情境设置" currentStep={step} />
        </div>

        {/* 3. 内容区 */}
        <div className="px-10 py-4 min-h-[460px]">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <section>
                <label className="block text-sm font-bold mb-3 text-[#333E4E]">课程名称 <span className="text-orange-500">*</span></label>
                <input type="text" placeholder="请输入课程名称" value={formData.title} onChange={e => updateField('title', e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F4785E] transition-all" />
              </section>
              <div className="grid grid-cols-2 gap-8">
                <section>
                  <label className="block text-sm font-bold mb-3">学生年龄 <span className="text-orange-500">*</span></label>
                  <div className="flex gap-2">
                    {['3-6岁', '7-9岁', '9-12岁'].map(opt => (
                      <button key={opt} onClick={() => updateField('age', opt)}
                        className={`px-4 py-2 rounded-lg border text-sm transition-all ${formData.age === opt ? 'border-[#F4785E] text-[#F4785E] bg-orange-50 font-bold' : 'border-gray-200 text-gray-400'}`}>{opt}</button>
                    ))}
                  </div>
                </section>
                <section>
                  <label className="block text-sm font-bold mb-3">课程时长 <span className="text-orange-500">*</span></label>
                  <div className="flex gap-2">
                    {['40分钟', '60分钟', '120分钟'].map(opt => (
                      <button key={opt} onClick={() => updateField('duration', opt)}
                        className={`px-4 py-2 rounded-lg border text-sm transition-all ${formData.duration === opt ? 'border-[#F4785E] text-[#F4785E] bg-orange-50 font-bold' : 'border-gray-200 text-gray-400'}`}>{opt}</button>
                    ))}
                  </div>
                </section>
              </div>
              <section>
                <label className="block text-sm font-bold mb-3 text-[#333E4E]">班级规模 <span className="text-orange-500">*</span></label>
                <div className="flex gap-2">
                  {['≤ 8人', '9-15人', '≥ 16人'].map(opt => (
                    <button key={opt} onClick={() => updateField('scale', opt)}
                      className={`px-4 py-2 rounded-lg border text-sm transition-all ${formData.scale === opt ? 'border-[#F4785E] text-[#F4785E] bg-orange-50 font-bold' : 'border-gray-200 text-gray-400'}`}>{opt}</button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <section>
                <label className="block text-sm font-bold mb-3 text-[#333E4E]">核心语言目标</label>
                {/* 灰底分栏卡片布局 */}
                <div className="grid grid-cols-2 gap-px bg-[#F9F9F9] rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-6">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">词汇</span>
                    <div className="min-h-[110px] mt-4 bg-white rounded-xl p-3 flex flex-wrap gap-2 content-start border border-transparent focus-within:border-orange-200 transition-all">
                      {formData.vocabulary.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-orange-50 text-[#F4785E] rounded text-xs border border-orange-100 flex items-center gap-1">
                          {tag} <X size={12} className="cursor-pointer" onClick={() => updateField('vocabulary', formData.vocabulary.filter(t => t !== tag))} />
                        </span>
                      ))}
                      <textarea className="w-full h-12 bg-transparent outline-none text-sm resize-none" placeholder="输入内容" value={vocabInput} 
                        onChange={e => setVocabInput(e.target.value)} onKeyDown={e => handleAddTag(e, 'vocabulary', vocabInput, setVocabInput)} />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2 font-medium italic">输入后按回车添加</p>
                  </div>
                  <div className="p-6 border-l border-gray-200">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">语法/句型</span>
                    <div className="min-h-[110px] mt-4 bg-white rounded-xl p-3 border border-transparent focus-within:border-orange-200 transition-all">
                      <textarea className="w-full h-12 bg-transparent outline-none text-sm resize-none" placeholder="输入内容" value={grammarInput} 
                        onChange={e => setGrammarInput(e.target.value)} onKeyDown={e => handleAddTag(e, 'grammar', grammarInput, setGrammarInput)} />
                    </div>
                    <p className="text-[11px] text-gray-400 mt-2 font-medium italic">输入后按回车添加</p>
                  </div>
                </div>
              </section>
              <section>
                <label className="block text-sm font-bold mb-3 text-[#333E4E]">语言能力培养侧重 <span className="font-normal text-gray-400 ml-1">(可多选)</span></label>
                <div className="flex flex-wrap gap-3">
                  {['听力理解', '口语表达', '阅读理解', '书面表达', '综合能力'].map(s => (
                    <CustomCheckbox key={s} label={s} isSelected={formData.skills.includes(s)} 
                      onClick={() => updateField('skills', formData.skills.includes(s) ? formData.skills.filter(i => i !== s) : [...formData.skills, s])} />
                  ))}
                </div>
              </section>
              <section>
                <label className="block text-sm font-bold mb-3 text-[#333E4E]">主导幸福力体验路径 <span className="font-normal text-gray-400 ml-1">(可多选)</span></label>
                <div className="flex flex-wrap gap-3">
                  {['艺术表达', '体感探索', '音乐律动', '自动匹配'].map(p => (
                    <CustomCheckbox key={p} label={p} isSelected={formData.paths.includes(p)} 
                      onClick={() => updateField('paths', formData.paths.includes(p) ? formData.paths.filter(i => i !== p) : [...formData.paths, p])} />
                  ))}
                </div>
              </section>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <section>
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-bold text-[#333E4E]">情境主题 <span className="text-orange-500">*</span></label>
                  <button className="text-sm px-4 py-1.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all shadow-sm">自动匹配</button>
                </div>
                <input type="text" value={formData.theme} onChange={e => updateField('theme', e.target.value)}
                  className="w-full px-4 py-3.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#F4785E] transition-all" placeholder="请输入情境主题" />
                <div className="flex flex-wrap gap-3 mt-4">
                  {['森林探险', '海底世界', '太空旅行', '童话城堡', '农场生活', '城市探索'].map(t => (
                    <button key={t} onClick={() => updateField('theme', t)} 
                      className={`px-4 py-1.5 rounded-full border text-xs transition-all ${
                        formData.theme === t ? 'bg-[#FDECE8] border-[#F4785E] text-[#F4785E]' : 'bg-[#F9F9F9] border-transparent text-gray-500 hover:bg-gray-200'
                      }`}>{t}</button>
                  ))}
                </div>
              </section>
              <section>
                <label className="block text-sm font-bold mb-3 text-[#333E4E]">特定要求</label>
                <textarea value={formData.requirements} onChange={e => updateField('requirements', e.target.value)}
                  className="w-full px-4 py-4 rounded-2xl border border-gray-200 outline-none h-44 resize-none focus:border-[#F4785E] transition-all" placeholder="可填写：场地设备限制、学生个性特点等" />
              </section>
            </div>
          )}
        </div>

        {/* 4. 底部按钮栏：强化 6px 实体阴影与点击反馈 */}
        <div className="px-10 py-8 flex items-center border-t border-gray-50 bg-gray-50/20">
          <button onClick={() => step > 1 ? setStep(step - 1) : onClose()} 
            className="px-8 py-2.5 rounded-xl font-bold transition-all active:translate-y-[2px] active:translate-x-[2px] active:shadow-none shadow-sm border border-gray-200"
          >
            {step > 1 ? '上一步' : '取消'}
          </button>
          
          <div className="flex-1" />
          
          <div className="flex gap-6 items-center">
            {step > 1 && <button onClick={onClose} className="font-bold text-neutral-400 hover:text-neutral-600 px-4 transition-colors">取消</button>}
            
            <button 
              onClick={() => step < 3 ? setStep(step + 1) : handleFinish(formData)}
              disabled={submitting}
              className="px-12 py-3 rounded-xl font-bold transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none flex items-center gap-2 group disabled:opacity-70"
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