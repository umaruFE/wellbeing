import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { colors, typography, shadows } from '../theme/theme';

const CreateCourseModal = ({ isOpen, onClose, onFinish }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1
    age: '3-6岁',
    duration: '40分钟',
    scale: '≤ 8人',
    title: '',
    // Step 2
    vocabulary: '',
    grammar: '',
    skills: [],
    paths: [],
    // Step 3
    theme: '',
    requirements: ''
  });

  if (!isOpen) return null;

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field, item) => {
    const arr = formData[field];
    if (arr.includes(item)) {
      updateField(field, arr.filter(i => i !== item));
    } else {
      updateField(field, [...arr, item]);
    }
  };

  // 渲染自定义复选框 (用于步骤2)
  const RenderCheckbox = ({ label, isSelected, onClick }) => (
    <button 
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg border transition-all"
      style={{ 
        borderColor: isSelected ? colors.brand.DEFAULT : colors.neutral.border.DEFAULT,
        backgroundColor: isSelected ? colors.brand.bg : 'white'
      }}
    >
      <div className="w-4 h-4 rounded border flex items-center justify-center"
        style={{ 
          borderColor: isSelected ? colors.brand.DEFAULT : colors.neutral.border.DEFAULT,
          backgroundColor: isSelected ? colors.brand.DEFAULT : 'white'
        }}
      >
        {isSelected && <Check size={12} color="white" strokeWidth={4} />}
      </div>
      <span className="text-sm" style={{ color: colors.neutral.text[1] }}>{label}</span>
    </button>
  );

  // --- 步骤渲染函数 ---

  const renderStep1 = () => (
    <div className="space-y-6">
      <section>
        <label className="block text-sm font-strong mb-3">学生年龄 <span style={{ color: colors.brand.DEFAULT }}>*</span></label>
        <div className="flex gap-3">
          {['3-6岁', '7-9岁', '9-12岁'].map(opt => (
            <button key={opt} onClick={() => updateField('age', opt)} className="px-6 py-2 rounded-xl border-2 transition-all text-sm"
              style={{ 
                borderColor: formData.age === opt ? colors.brand.DEFAULT : colors.neutral.border.secondary,
                backgroundColor: formData.age === opt ? colors.brand.DEFAULT : 'transparent',
                color: formData.age === opt ? 'white' : colors.neutral.text[1],
                boxShadow: formData.age === opt ? shadows.neoActive : 'none'
              }}>{opt}</button>
          ))}
        </div>
      </section>
      <section>
        <label className="block text-sm font-strong mb-3">课程时长 <span style={{ color: colors.brand.DEFAULT }}>*</span></label>
        <div className="flex gap-3">
          {['40分钟', '60分钟', '120分钟'].map(opt => (
            <button key={opt} onClick={() => updateField('duration', opt)} className="px-6 py-2 rounded-xl border-2 transition-all text-sm"
              style={{ 
                borderColor: formData.duration === opt ? colors.brand.DEFAULT : colors.neutral.border.secondary,
                backgroundColor: formData.duration === opt ? colors.brand.DEFAULT : 'transparent',
                color: formData.duration === opt ? 'white' : colors.neutral.text[1]
              }}>{opt}</button>
          ))}
        </div>
      </section>
      <section>
        <label className="block text-sm font-strong mb-3">班级规模 <span style={{ color: colors.brand.DEFAULT }}>*</span></label>
        <div className="flex gap-3">
          {['≤ 8人', '9-15人', '≥ 16人'].map(opt => (
            <button key={opt} onClick={() => updateField('scale', opt)} className="px-6 py-2 rounded-xl border-2 transition-all text-sm"
              style={{ 
                borderColor: formData.scale === opt ? colors.brand.DEFAULT : colors.neutral.border.secondary,
                backgroundColor: formData.scale === opt ? colors.brand.DEFAULT : 'transparent',
                color: formData.scale === opt ? 'white' : colors.neutral.text[1]
              }}>{opt}</button>
          ))}
        </div>
      </section>
      <section>
        <label className="block text-sm font-strong mb-3">课程名称 <span style={{ color: colors.brand.DEFAULT }}>*</span></label>
        <input type="text" placeholder="请输入课程名称，如：动物主题英语课" value={formData.title} onChange={e => updateField('title', e.target.value)}
          className="w-full px-4 py-3 border-2 outline-none" style={{ borderRadius: '12px', borderColor: colors.neutral.border.secondary }} />
      </section>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <section>
        <label className="block text-sm font-strong mb-3">核心语言目标</label>
        <div className="grid grid-cols-2 rounded-xl overflow-hidden border" style={{ borderColor: colors.neutral.border.split }}>
          <div className="p-4 bg-surfaceAlt border-r" style={{ borderColor: colors.neutral.border.split }}>
            <span className="text-xs font-strong text-neutral-text-3">词汇</span>
            <textarea placeholder="输入内容" value={formData.vocabulary} onChange={e => updateField('vocabulary', e.target.value)}
              className="w-full bg-transparent outline-none text-sm mt-2 h-20 resize-none" />
            <div className="text-[10px] text-neutral-text-placeholder mt-2">输入后按回车添加</div>
          </div>
          <div className="p-4 bg-surfaceAlt">
            <span className="text-xs font-strong text-neutral-text-3">语法/句型</span>
            <textarea placeholder="输入内容" value={formData.grammar} onChange={e => updateField('grammar', e.target.value)}
              className="w-full bg-transparent outline-none text-sm mt-2 h-20 resize-none" />
            <div className="text-[10px] text-neutral-text-placeholder mt-2">输入后按回车添加</div>
          </div>
        </div>
      </section>
      <section>
        <label className="block text-sm font-strong mb-3">语言能力培养侧重 <span className="font-normal text-xs text-neutral-text-3">(可多选)</span></label>
        <div className="flex flex-wrap gap-3">
          {['听力理解', '口语表达', '阅读理解', '书面表达', '综合能力'].map(skill => (
            <RenderCheckbox key={skill} label={skill} isSelected={formData.skills.includes(skill)} onClick={() => toggleArrayItem('skills', skill)} />
          ))}
        </div>
      </section>
      <section>
        <label className="block text-sm font-strong mb-3">主导核心体验路径 <span className="font-normal text-xs text-neutral-text-3">(可多选)</span></label>
        <div className="flex flex-wrap gap-3">
          {['艺术表达', '体感探索', '音乐律动', '自助匹配'].map(path => (
            <RenderCheckbox key={path} label={path} isSelected={formData.paths.includes(path)} onClick={() => toggleArrayItem('paths', path)} />
          ))}
        </div>
      </section>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <section>
        <label className="block text-sm font-strong mb-3">情境主题</label>
        <div className="flex gap-2">
          <input type="text" placeholder="输入情境" value={formData.theme} onChange={e => updateField('theme', e.target.value)}
            className="flex-1 px-4 py-2.5 border-2 outline-none" style={{ borderRadius: '12px', borderColor: colors.neutral.border.secondary }} />
          <button className="px-4 py-2 border rounded-xl text-sm transition-all hover:bg-neutral-fill-gray2" style={{ borderColor: colors.neutral.border.DEFAULT }}>自动匹配</button>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {['森林探险', '海底世界', '太空旅行', '童话城堡', '农场生活', '城市探索'].map(t => (
            <button key={t} onClick={() => updateField('theme', t)} className="px-3 py-1.5 rounded-lg border text-xs text-neutral-text-2 hover:bg-neutral-fill-gray1"
              style={{ borderColor: colors.neutral.border.split }}>{t}</button>
          ))}
        </div>
      </section>
      <section>
        <label className="block text-sm font-strong mb-3">特定要求</label>
        <textarea placeholder="输入您的特定要求" value={formData.requirements} onChange={e => updateField('requirements', e.target.value)}
          className="w-full px-4 py-3 border-2 outline-none h-32 resize-none" style={{ borderRadius: '12px', borderColor: colors.neutral.border.secondary }} />
      </section>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ backgroundColor: colors.neutral.bg.mask }}>
      <div className="bg-white w-full max-w-[620px] rounded-[24px] overflow-hidden flex flex-col" style={{ fontFamily: typography.fontFamily.default }}>
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b" style={{ borderColor: colors.neutral.border.secondary }}>
          <h2 className="text-lg font-strong">创建课程</h2>
          <button onClick={onClose}><X size={20} style={{ color: colors.neutral.text[3] }} /></button>
        </div>

        {/* Stepper */}
        <div className="px-10 pt-8 pb-4">
          <div className="relative w-full h-[3px] mb-4" style={{ backgroundColor: colors.neutral.border.split }}>
             <div className="absolute left-0 top-0 h-full transition-all duration-300" 
                  style={{ width: `${(step / 3) * 100}%`, backgroundColor: colors.brand.DEFAULT }} />
          </div>
          <div className="flex justify-between text-sm">
            <span className="px-3 py-1 rounded-lg" style={{ color: step === 1 ? colors.brand.DEFAULT : colors.success.DEFAULT, backgroundColor: step === 1 ? colors.brand.bg : 'transparent', fontWeight: step === 1 ? 600 : 400 }}>基本信息</span>
            <span className="px-3 py-1 rounded-lg" style={{ color: step === 2 ? colors.brand.DEFAULT : (step > 2 ? colors.success.DEFAULT : colors.neutral.text.disabled), backgroundColor: step === 2 ? colors.brand.bg : 'transparent', fontWeight: step === 2 ? 600 : 400 }}>课程目标</span>
            <span className="px-3 py-1 rounded-lg" style={{ color: step === 3 ? colors.brand.DEFAULT : colors.neutral.text.disabled, backgroundColor: step === 3 ? colors.brand.bg : 'transparent', fontWeight: step === 3 ? 600 : 400 }}>情境设置</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-10 py-6 min-h-[420px]">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t flex justify-end gap-3" style={{ borderColor: colors.neutral.border.split, backgroundColor: colors.neutral.bg.layout }}>
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 rounded-xl border-2 transition-all"
              style={{ borderColor: colors.neutral.border.secondary, color: colors.neutral.text[2] }}>上一步</button>
          )}
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl border-2"
            style={{ borderColor: colors.neutral.border.secondary, color: colors.neutral.text[2] }}>取消</button>
          
          {step < 3 ? (
            <button onClick={() => setStep(step + 1)} className="px-10 py-2.5 rounded-xl text-white font-strong"
              style={{ backgroundColor: colors.brand.DEFAULT, boxShadow: shadows.neo, border: `2px solid ${colors.neutral.text[1]}` }}>下一步</button>
          ) : (
            <button onClick={() => onFinish(formData)} className="px-10 py-2.5 rounded-xl text-white font-strong"
              style={{ backgroundColor: colors.brand.DEFAULT, boxShadow: shadows.neo, border: `2px solid ${colors.neutral.text[1]}` }}>完成</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateCourseModal;