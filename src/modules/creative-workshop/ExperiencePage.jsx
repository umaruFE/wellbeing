import React, { useState } from 'react';
import { ArrowLeft, Check, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EXPERIENCE_CONFIG } from './workshopData';
import { createCreativeWork } from './workshopStorage';
import './creativeWorkshop.css';

const FIELD_OPTIONS = {
  age: ['4–6 岁', '7–10 岁', '11–14 岁'],
  duration: ['10–15 分钟', '15–20 分钟', '30–60 秒', '60–90 秒', '90–120 秒'],
  level: ['初级', '中级', '高级'],
  style: ['欢快', '舒缓', '节奏感强'],
};

export const ExperiencePage = ({ experience }) => {
  const config = EXPERIENCE_CONFIG[experience];
  const Icon = config.icon;
  const navigate = useNavigate();
  const [mode, setMode] = useState('overview');
  const [form, setForm] = useState({});
  const [created, setCreated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await createCreativeWork({
        moduleId: experience === 'yoga' ? 'interactive-yoga' : 'music-star-quest',
        moduleName: experience === 'yoga' ? '互动式情境瑜伽' : '星光录音棚',
        title: form.theme || form.goals,
        parameters: form,
      });
      setCreated(true);
    } catch (err) {
      console.error('保存草稿失败:', err);
      setError(err.message || '保存失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="experience-page" style={{ '--cw-accent': config.accent }}>
      <header className="experience-header">
        <button type="button" className="cw-icon-button" onClick={() => navigate('/workshop/english-plus')} aria-label="返回"><ArrowLeft size={19} /></button>
        <div><span>{config.type}</span><h1>{config.title}</h1></div>
        <div className="experience-tabs">
          <button className={mode === 'overview' ? 'active' : ''} onClick={() => setMode('overview')}>活动介绍</button>
          <button className={mode === 'create' ? 'active' : ''} onClick={() => { setMode('create'); setCreated(false); }}>生成同款</button>
        </div>
      </header>

      {mode === 'overview' && (
        <main className="experience-overview">
          <section className="experience-lead">
            <span className="cw-title-icon"><Icon size={30} /></span>
            <span className="cw-eyebrow">经典类型</span>
            <h2>{config.subtitle}</h2><p>{config.description}</p>
            <div className="experience-actions"><button className="cw-primary-button" onClick={() => setMode('create')}><Sparkles size={17} /> 生成同款</button></div>
          </section>
          <section className="experience-features">{config.features.map((feature, index) => <div key={feature}><span>0{index + 1}</span><strong>{feature}</strong></div>)}</section>
          <section className="experience-method"><span>统一创作模式</span><h2>输入参数 → 生成草稿 → 管理发布</h2><p>生成同款会把教师输入保存到“我的作品”，用于后续生成与编辑。</p></section>
        </main>
      )}

      {mode === 'create' && (
        <main className="experience-create">
          {created ? (
            <div className="experience-created"><span><Check size={34} /></span><h2>同款创作草稿已建立</h2><p>输入内容已保存，可以前往“我的作品”继续管理。</p><div><button className="cw-secondary-button" onClick={() => { setCreated(false); setForm({}); }}><X size={16} /> 再建一个</button><button className="cw-primary-button" onClick={() => navigate('/my-works')}>查看我的作品</button></div></div>
          ) : (
            <form className="experience-form" onSubmit={submit}>
              <span className="cw-eyebrow">生成同款</span><h2>告诉 AI 你想教什么</h2><p>当前阶段会建立结构化创作草稿，保留后续接入生成服务所需的完整参数。</p>
              <div className="experience-form-grid">
                {config.fields.map(([name, label, placeholder, type]) => (
                  <label key={name} className={type === 'textarea' ? 'wide' : ''}>{label}
                    {type === 'textarea' ? <textarea required={name === 'goals'} value={form[name] || ''} placeholder={placeholder} onChange={(event) => setForm({ ...form, [name]: event.target.value })} /> : type === 'select' ? <select value={form[name] || placeholder} onChange={(event) => setForm({ ...form, [name]: event.target.value })}>{(FIELD_OPTIONS[name] || [placeholder]).map((option) => <option key={option}>{option}</option>)}</select> : <input required value={form[name] || ''} placeholder={placeholder} onChange={(event) => setForm({ ...form, [name]: event.target.value })} />}
                  </label>
                ))}
              </div>
              <button className="cw-primary-button" type="submit" disabled={submitting}><Sparkles size={17} /> {submitting ? '保存中…' : '创建生成任务'}</button>
              {error && <p className="cw-dialog-error" role="alert">{error}</p>}
            </form>
          )}
        </main>
      )}
    </div>
  );
};

export default ExperiencePage;

