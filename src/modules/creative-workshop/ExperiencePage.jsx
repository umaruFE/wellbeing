import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight, Clock, Download, ExternalLink, Loader2, Plus, RefreshCw, Search, Sparkles, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EXPERIENCE_CONFIG } from './workshopData';
import { createCreativeWork, deleteCreativeWork, generateCreativeWork, getCreativeWorks } from './workshopStorage';
import '../picture-book/PictureBookStudioPage.css';
import './creativeWorkshop.css';

const STATUS_LABEL = { draft: '草稿', generating: '生成中', done: '已生成', failed: '生成失败' };

// 与绘本制作 BasicInfoStep 同款表单小组件（OptionGroup / Field）
function ExpOptionGroup({ label, required, options, value, onChange, tone = 'coral' }) {
  return (
    <section className={`pbv2-fieldset pbv2-tone-${tone}`}>
      <div className="pbv2-label">{label}{required && <b>*</b>}</div>
      <div className="pbv2-option-grid">
        {options.map((option) => (
          <button type="button" key={option} className={value === option ? 'is-active' : ''} onClick={() => onChange(value === option ? '' : option)}>
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}

function ExpField({ label, value, onChange, placeholder, area }) {
  return (
    <label className="pbv2-field">
      <span>{label}</span>
      {area ? (
        <textarea value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      ) : (
        <input value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      )}
    </label>
  );
}

export const ExperiencePage = ({ experience }) => {
  const config = EXPERIENCE_CONFIG[experience];
  const Icon = config.icon;
  const moduleId = experience === 'yoga' ? 'interactive-yoga' : 'music-star-quest';
  const navigate = useNavigate();
  const [mode, setMode] = useState('list'); // list | create
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [works, setWorks] = useState([]);
  const [worksLoading, setWorksLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [generatingId, setGeneratingId] = useState(null);

  const loadWorks = () => {
    getCreativeWorks(moduleId)
      .then(setWorks)
      .catch(() => {})
      .finally(() => setWorksLoading(false));
  };

  useEffect(() => { loadWorks(); /* eslint-disable-next-line */ }, [moduleId]);

  const runGenerate = async (id) => {
    if (generatingId) return;
    setGeneratingId(id);
    setError('');
    try {
      await generateCreativeWork(id);
      loadWorks();
    } catch (err) {
      console.error('生成失败:', err);
      setError(err.message || '生成失败，请重试');
      loadWorks();
    } finally {
      setGeneratingId(null);
    }
  };

  // 创建并立即生成（LLM 耗时约 30-120 秒）
  const submit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const work = await createCreativeWork({
        moduleId,
        moduleName: experience === 'yoga' ? '互动式情境瑜伽' : '星光录音棚',
        title: form.theme || form.goals,
        parameters: form,
      });
      setMode('list');
      setForm({});
      await runGenerate(work.id);
    } catch (err) {
      console.error('保存草稿失败:', err);
      setError(err.message || '保存失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('确认删除这份作品？')) return;
    try {
      await deleteCreativeWork(id);
      setWorks((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      window.alert(err.message || '删除失败，请重试');
    }
  };

  const filtered = works.filter((w) =>
    `${w.title || ''} ${w.parameters?.goals || ''} ${w.parameters?.theme || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── 列表视图（结构与绘本制作列表一致）──
  if (mode === 'list') {
    return (
      <main className="picture-book-studio-v2">
        <div className="pbv2-list-page" style={{ '--cw-accent': config.accent }}>
        <header className="pbv2-topbar">
          <div className="pbv2-topbar-left">
            <div className="pbv2-topbar-icon"><Icon size={28} /></div>
            <div>
              <h1>{config.type}</h1>
              <p>{config.subtitle}</p>
            </div>
          </div>
          <div className="pbv2-topbar-actions">
            <button type="button" className="pbv2-back-btn" onClick={() => navigate('/workshop/english-plus')}>
              <ArrowLeft size={16} /> 返回
            </button>
            <button type="button" className="pbv2-create-btn" onClick={() => { setMode('create'); setError(''); }}>
              <Plus size={18} /> 新建作品
            </button>
          </div>
        </header>

        <div className="pbv2-list-toolbar">
          <div className="pbv2-search-box">
            <Search size={16} />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜索作品、主题或目标语言点…" />
          </div>
        </div>

        {error && <div className="pbv2-message">{error}</div>}

        {worksLoading ? (
          <div className="pbv2-list-loading"><Loader2 className="spin" size={28} /></div>
        ) : filtered.length === 0 ? (
          <div className="pbv2-list-empty">
            <Icon size={48} />
            <p>{searchTerm ? '没有匹配的作品' : '还没有作品，点击「新建作品」开始 AI 创作'}</p>
          </div>
        ) : (
          <div className="pbv2-card-grid">
            {filtered.map((work) => {
              const status = generatingId === work.id ? 'generating' : work.status;
              return (
                <article key={work.id} className="pbv2-book-card" onClick={() => work.status === 'done' && window.open(`/api/creative-works/${work.id}/html`, '_blank')}>
                  <div className="pbv2-book-cover exp-cover">
                    <Icon size={52} />
                    <span className={`pbv2-book-status ${work.status === 'done' ? 'published' : 'draft'}`}>
                      {STATUS_LABEL[status] || status}
                    </span>
                  </div>
                  <div className="pbv2-book-info">
                    <h3>{work.title || '未命名作品'}</h3>
                    <div className="pbv2-book-meta">
      <Clock size={13} />
                      <span>{work.parameters?.age || ''}{work.parameters?.duration ? ` · ${work.parameters.duration}` : ''}</span>
                      <span>·</span>
                      <span>{work.updated_at ? new Date(work.updated_at).toLocaleDateString() : ''}</span>
                    </div>
                    <div className="pbv2-book-actions">
                      {work.status === 'done' && (
                        <>
                          <button type="button" onClick={(e) => { e.stopPropagation(); window.open(`/api/creative-works/${work.id}/html`, '_blank'); }}>
                            <ExternalLink size={14} /> 打开
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); window.location.href = `/api/creative-works/${work.id}/html?download=1`; }}>
                            <Download size={14} /> 下载
                          </button>
                        </>
                      )}
                      <button type="button" disabled={Boolean(generatingId)} onClick={(e) => { e.stopPropagation(); runGenerate(work.id); }}>
                        {generatingId === work.id ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}
                        {generatingId === work.id ? '生成中' : '重新生成'}
                      </button>
                      <button type="button" onClick={(e) => { e.stopPropagation(); remove(work.id); }}>
                        <Trash2 size={14} /> 删除
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {generatingId && (
          <div className="generating-toast"><Sparkles size={16} /> AI 正在生成作品（约 1-2 分钟），完成后卡片状态会更新</div>
        )}
        </div>
      </main>
    );
  }

  // ── 新建视图（1:1 对照绘本 BasicInfoStep 结构）──
  const optionSets = {
    age: ['4–6 岁', '7–10 岁', '11–14 岁'],
    level: ['初级', '中级', '高级'],
    style: ['欢快', '舒缓', '节奏感强'],
    duration: experience === 'yoga' ? ['10–15 分钟', '15–20 分钟', '20–30 分钟'] : ['30–60 秒', '60–90 秒', '90–120 秒'],
  };
  const optionTones = { age: 'coral', level: 'blue', style: 'yellow', duration: 'green' };
  const selectFields = config.fields.filter(([name, , , type]) => type === 'select');
  const themeField = config.fields.find(([name]) => name === 'theme');
  const requiredFilled = String(form.theme || '').trim() && String(form.goals || '').trim();
  const canSubmit = requiredFilled && !submitting;

  return (
    <main className="picture-book-studio-v2">
      <header className="pbv2-topbar">
        <div className="pbv2-topbar-left">
          <div className="pbv2-topbar-icon"><Icon size={28} /></div>
          <div>
            <h1>新建{config.type}作品</h1>
            <p>填写教学信息，AI 将按官方规范生成完整作品（约 1-2 分钟）</p>
          </div>
        </div>
        <div className="pbv2-topbar-actions">
          <button type="button" className="pbv2-back-btn" onClick={() => setMode('list')}>
            <ArrowLeft size={16} /> 返回列表
          </button>
        </div>
      </header>

      <div className="pbv2-shell">
        <aside className="pbv2-steps">
          <button type="button" className="is-active">
            <span>1</span>
            <strong>基本信息</strong>
          </button>
          <button type="button" disabled>
            <span>2</span>
            <strong>AI 生成作品</strong>
          </button>
        </aside>

        <section className="pbv2-workspace pbv2-workspace-step-0">
          {error && <div className="pbv2-message">{error}</div>}
          <div className="pbv2-step-panel">
            <div className="pbv2-form-grid two">
              {selectFields.map(([name, label, placeholder]) => (
                <ExpOptionGroup
                  key={name}
                  required={name === 'age'}
                  label={label}
                  options={optionSets[name] || [placeholder]}
                  value={form[name] || ''}
                  onChange={(value) => setForm({ ...form, [name]: value })}
                  tone={optionTones[name] || 'coral'}
                />
              ))}
            </div>

            <section className="pbv2-card pbv2-tone-coral">
              <div className="pbv2-card-title">{themeField ? themeField[1] : '主题'}（必填）</div>
              <input
                className="pbv2-input"
                value={form.theme || ''}
                onChange={(event) => setForm({ ...form, theme: event.target.value })}
                placeholder={themeField ? themeField[2] : ''}
              />
            </section>

            <section className="pbv2-card pbv2-tone-blue">
              <div className="pbv2-card-title">语言目标（必填）</div>
              <div className="pbv2-form-grid two">
                <ExpField area label="目标语言点" value={form.goals} onChange={(value) => setForm({ ...form, goals: value })} placeholder={experience === 'yoga' ? '例如：ocean, wave, What can you see?' : '例如：China, USA, Where are you from?'} />
              </div>
            </section>

            <section className="pbv2-card pbv2-tone-green">
              <div className="pbv2-card-title">特殊要求（选填）</div>
              <ExpField area label="补充说明" value={form.requirements} onChange={(value) => setForm({ ...form, requirements: value })} placeholder={experience === 'yoga' ? '角色、道具或体式偏好' : '例如：加入问答呼应'} />
            </section>

            <footer className="pbv2-actions">
              <ChevronRight size={16} />
              <button type="button" className="pbv2-primary" disabled={!canSubmit} onClick={submit}>
                {submitting ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                {submitting ? 'AI 生成中…' : 'AI 生成作品'}
              </button>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
};

export default ExperiencePage;
