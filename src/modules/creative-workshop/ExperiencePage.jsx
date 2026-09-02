import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Download, ExternalLink, Loader2, Plus, RefreshCw, Search, Sparkles, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EXPERIENCE_CONFIG } from './workshopData';
import { createCreativeWork, deleteCreativeWork, generateCreativeWork, getCreativeWorks } from './workshopStorage';
import '../picture-book/PictureBookStudioPage.css';
import './creativeWorkshop.css';

const FIELD_OPTIONS = {
  age: ['4–6 岁', '7–10 岁', '11–14 岁'],
  duration: ['10–15 分钟', '15–20 分钟', '30–60 秒', '60–90 秒', '90–120 秒'],
  level: ['初级', '中级', '高级'],
  style: ['欢快', '舒缓', '节奏感强'],
};

const STATUS_LABEL = { draft: '草稿', generating: '生成中', done: '已生成', failed: '生成失败' };

export const ExperiencePage = ({ experience }) => {
  const config = EXPERIENCE_CONFIG[experience];
  const Icon = config.icon;
  const moduleId = experience === 'yoga' ? 'interactive-yoga' : 'music-star-quest';
  const navigate = useNavigate();
  const [mode, setMode] = useState('list'); // list | create | demo
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
            <div className="pbv2-topbar-icon exp-topbar-icon"><Icon size={28} /></div>
            <div>
              <h1>{config.type}</h1>
              <p>{config.subtitle}</p>
            </div>
          </div>
          <div className="pbv2-topbar-actions">
            <button type="button" className="pbv2-back-btn" onClick={() => setMode('demo')}>
              🖥️ 经典案例
            </button>
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

  // ── 新建 / 经典案例视图 ──
  return (
    <div className="experience-page" style={{ '--cw-accent': config.accent }}>
      <header className="experience-header">
        <button type="button" className="cw-icon-button" onClick={() => setMode('list')} aria-label="返回列表"><ArrowLeft size={19} /></button>
        <div><span>{config.type}</span><h1>{config.title}</h1></div>
        <div className="experience-tabs">
          <button className="active">新建作品</button>
          <button onClick={() => setMode('demo')}>经典案例</button>
        </div>
      </header>

      {mode === 'create' && (
        <main className="experience-create">
          <form className="experience-form" onSubmit={submit}>
            <span className="cw-eyebrow">新建作品 · 第 1 步（共 1 步）</span>
            <h2>告诉 AI 你想教什么</h2>
            <p>提交后 AI 将按官方规范生成完整作品（约 1-2 分钟）：{experience === 'yoga' ? '情境瑜伽将生成逐页设计 + 可授课页面' : '星光录音棚将生成歌词 + 练习 + 四关教学方案'}。</p>
            <div className="experience-form-grid">
              {config.fields.map(([name, label, placeholder, type]) => (
                <label key={name} className={type === 'textarea' ? 'wide' : ''}>{label}
                  {type === 'textarea' ? <textarea required={name === 'goals'} value={form[name] || ''} placeholder={placeholder} onChange={(event) => setForm({ ...form, [name]: event.target.value })} /> : type === 'select' ? <select value={form[name] || placeholder} onChange={(event) => setForm({ ...form, [name]: event.target.value })}>{(FIELD_OPTIONS[name] || [placeholder]).map((option) => <option key={option}>{option}</option>)}</select> : <input required={name === 'theme' || name === 'goals'} value={form[name] || ''} placeholder={placeholder} onChange={(event) => setForm({ ...form, [name]: event.target.value })} />}
                </label>
              ))}
            </div>
            <div className="cw-dialog-actions">
              <button type="button" className="cw-secondary-button" onClick={() => setMode('list')}>返回列表</button>
              <button className="cw-primary-button" type="submit" disabled={submitting}><Sparkles size={16} /> {submitting ? '创建并生成中…' : 'AI 生成作品'}</button>
            </div>
            {error && <p className="cw-dialog-error" role="alert">{error}</p>}
          </form>
        </main>
      )}

      {mode === 'demo' && (
        <main className="experience-demo">
          <div className="experience-demo-bar">
            <div><strong>官方经典案例</strong><span>{config.title}</span></div>
            <a className="cw-secondary-button" href={config.demoUrl} target="_blank" rel="noreferrer">新窗口打开 <ExternalLink size={15} /></a>
          </div>
          <iframe title={`${config.title} 经典案例`} src={config.demoUrl} allow="microphone; autoplay" />
        </main>
      )}
    </div>
  );
};

export default ExperiencePage;
