import React, { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Check, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { WORKSHOP_MODULES } from './workshopData';
import { createCreativeWork } from './workshopStorage';
import './creativeWorkshop.css';

const GenerateDialog = ({ module, moduleId, onClose }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', goals: '', age: '7–10 岁', duration: '20 分钟', notes: '' });
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await createCreativeWork({ moduleId, moduleName: module.title, title: form.title, parameters: form });
      setSaved(true);
    } catch (err) {
      console.error('保存草稿失败:', err);
      setError(err.message || '保存失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cw-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <div className="cw-dialog" role="dialog" aria-modal="true" aria-label={`生成${module.title}`} onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="cw-icon-button cw-dialog-close" onClick={onClose} aria-label="关闭"><X size={18} /></button>
        {saved ? (
          <div className="cw-success">
            <span className="cw-success-icon"><Check size={30} /></span>
            <h2>创作任务已保存</h2>
            <p>参数已保存为草稿，你可以在“我的作品”中继续编辑和管理。</p>
            <button type="button" className="cw-primary-button" onClick={() => navigate('/my-works')}>查看我的作品 <ArrowRight size={16} /></button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <span className="cw-eyebrow">生成同款</span>
            <h2>创建{module.title}</h2>
            <p className="cw-dialog-intro">填写核心信息，平台会建立一份可继续完善的创作草稿。</p>
            <label>作品名称<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={`例如：我的${module.title}`} /></label>
            <label>教学目标<textarea required value={form.goals} onChange={(event) => setForm({ ...form, goals: event.target.value })} placeholder="输入词汇、句型、能力或情感目标" /></label>
            <div className="cw-form-grid">
              <label>年龄段<select value={form.age} onChange={(event) => setForm({ ...form, age: event.target.value })}><option>4–6 岁</option><option>7–10 岁</option><option>11–14 岁</option></select></label>
              <label>建议时长<select value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })}><option>10 分钟</option><option>20 分钟</option><option>40 分钟</option><option>60 分钟</option></select></label>
            </div>
            <label>补充要求<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="可选：班级特点、教材章节或素材偏好" /></label>
            <div className="cw-dialog-actions">
              <button type="button" className="cw-secondary-button" onClick={onClose}>取消</button>
              <button type="submit" className="cw-primary-button" disabled={submitting}><Sparkles size={16} /> {submitting ? '保存中…' : '创建草稿'}</button>
            </div>
            {error && <p className="cw-dialog-error" role="alert">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
};

export const CreativeWorkshopPage = () => {
  const { moduleId = 'english-plus' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showGenerator, setShowGenerator] = useState(false);
  const module = useMemo(() => WORKSHOP_MODULES[moduleId] || WORKSHOP_MODULES['english-plus'], [moduleId]);
  const Icon = module.icon;

  if (user?.role === 'picture_song_creator' && moduleId !== 'english-plus') {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <div className="cw-page" style={{ '--cw-accent': module.accent }}>
      <section className="cw-hero">
        <div className="cw-hero-copy">
          <span className="cw-eyebrow">{module.eyebrow}</span>
          <h1><span className="cw-title-icon"><Icon size={28} /></span>{module.title}</h1>
          <p>{module.description}</p>
          <div className="cw-hero-actions">
            <button type="button" className="cw-primary-button" onClick={() => setShowGenerator(true)}><Sparkles size={17} /> 生成同款</button>
          </div>
        </div>
        <div className="cw-model-card">
          <span className="cw-model-number">01</span>
          <strong>输入参数生成同款</strong>
          <span className="cw-model-line" />
          <span className="cw-model-number">02</span>
          <strong>保存、发布与再创作</strong>
        </div>
      </section>

      <section className="cw-section">
        <div className="cw-section-heading"><div><span>创作路径</span><h2>选择你要制作的内容</h2></div><p>每条路径使用专门的教学模板与生成流程。</p></div>
        <div className="cw-path-grid">
          {module.paths.map((path) => {
            const PathIcon = path.icon;
            return (
              <article key={path.title} className="cw-path-card">
                <span className="cw-path-icon"><PathIcon size={22} /></span>
                <h3>{path.title}</h3><p>{path.description}</p>
                {path.path ? (
                  <button type="button" onClick={() => navigate(path.path)}>{path.action || '进入创作'} <ArrowRight size={15} /></button>
                ) : (
                  <button type="button" onClick={() => setShowGenerator(true)}>生成同款 <ArrowRight size={15} /></button>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {showGenerator && <GenerateDialog module={module} moduleId={moduleId} onClose={() => setShowGenerator(false)} />}
    </div>
  );
};

export default CreativeWorkshopPage;
