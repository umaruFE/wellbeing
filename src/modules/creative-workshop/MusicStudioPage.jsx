import React from 'react';
import {
  ArrowLeft, ChevronRight, Clock, Download, ExternalLink, Loader2, Music, Pencil, Plus,
  RefreshCw, Save, Search, Sparkles, Trash2, Wand2, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  createCreativeWork, deleteCreativeWork, generateCreativeWorkExercises,
  generateCreativeWorkSong, getCreativeWorks, renderCreativeWork, updateCreativeWork,
} from './workshopStorage';
import '../picture-book/PictureBookStudioPage.css';
import './creativeWorkshop.css';

const MODULE_ID = 'music-star-quest';
const MODULE_NAME = '星光录音棚';
const STEPS = ['基本信息', '歌曲创作', '练习与教案', '音频与课件'];
const ACCENT = '#9966d0';

const AGE_OPTIONS = ['4–6 岁', '7–10 岁', '11–14 岁'];
const LEVEL_OPTIONS = ['初级', '中级', '高级'];
const STYLE_OPTIONS = ['欢快', '舒缓', '节奏感强'];
const DURATION_OPTIONS = ['短 (30-60s)', '中 (60-90s)', '长 (90-120s)'];
const STRUCTURE_OPTIONS = ['简单重复', '主歌+副歌', '主歌+副歌+桥段'];

const initialBasicInfo = { goals: '', theme: '', age: '', level: '', style: '', duration: '', structure: '', requirements: '' };
const initialSong = { title: '', songMeta: {}, lyrics: [], targetPatterns: [] };
const initialExercises = { ex1FillData: [], ex2Items: [], ex3Data: [], teachingPlans: {} };
const STAGE_TITLES = { 1: 'Stage 1', 2: 'Stage 2', 3: 'Stage 3', 4: 'Stage 4' };

// ── 与绘本/瑜伽同款表单小组件 ───────────────────────────────
function OptionGroup({ label, required, options, value, onChange, tone = 'coral' }) {
  return (
    <section className={`pbv2-fieldset pbv2-tone-${tone}`}>
      <div className="pbv2-label">{label}{required && <b>*</b>}</div>
      <div className="pbv2-option-grid">
        {options.map((option) => (
          <button type="button" key={option} className={value === option ? 'is-active' : ''} onClick={() => onChange(option)}>
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}

function Field({ label, value, onChange, placeholder, area }) {
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

const sentenceToText = (parts) => (parts || []).join('___');
const textToParts = (text) => String(text).split('___');

// ── 歌词编辑器（step 2）─────────────────────────────────────
function LyricsEditor({ lyrics, onChange }) {
  const updateRow = (idx, patch) => onChange(lyrics.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  const removeRow = (idx) => onChange(lyrics.filter((_, i) => i !== idx));
  return (
    <section className="pbv2-card pbv2-tone-blue">
      <div className="pbv2-card-title">歌词时间轴（授课时按 time 与音频同步高亮）</div>
      {lyrics.map((row, idx) => (
        <div key={idx} className="cw-lyric-row">
          <input className="cw-lyric-time" value={row.time || ''} onChange={(e) => updateRow(idx, { time: e.target.value })} placeholder="00:02–00:04" />
          <input className="cw-lyric-text" value={row.text || ''} onChange={(e) => updateRow(idx, { text: e.target.value })} placeholder="歌词行" />
          <button type="button" className="cw-lyric-remove" onClick={() => removeRow(idx)} aria-label="删除歌词行"><Trash2 size={14} /></button>
        </div>
      ))}
      <button type="button" className="pbv2-add-page" onClick={() => onChange([...lyrics, { time: '', text: '' }])}>
        <Plus size={16} /> 添加一行
      </button>
    </section>
  );
}

// ── 练习编辑器（step 3）─────────────────────────────────────
function FillEditor({ items, onChange }) {
  const update = (idx, patch) => onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  return (
    <section className="pbv2-card pbv2-tone-yellow">
      <div className="pbv2-card-title">选词填空（Exercise 1）</div>
      {items.map((item, idx) => (
        <div key={idx} className="cw-exercise-item">
          <div className="cw-exercise-head"><span>第 {idx + 1} 题</span><button type="button" onClick={() => remove(idx)}><Trash2 size={13} /></button></div>
          <div className="cw-exercise-grid">
            <Field label="句子（___ 为空位）" value={sentenceToText(item.sentence)} onChange={(v) => update(idx, { sentence: textToParts(v) })} />
            <Field label="答案（顺序对应空位，逗号分隔）" value={(item.blanks || []).join(', ')} onChange={(v) => update(idx, { blanks: v.split(/[,，]/).map((s) => s.trim()).filter(Boolean) })} />
            <Field label="候选词（逗号分隔，含干扰项）" value={(item.options || []).join(', ')} onChange={(v) => update(idx, { options: v.split(/[,，]/).map((s) => s.trim()).filter(Boolean) })} />
            <Field label="emoji" value={item.emoji || ''} onChange={(v) => update(idx, { emoji: v })} />
          </div>
        </div>
      ))}
      <button type="button" className="pbv2-add-page" onClick={() => onChange([...items, { sentence: ['', ''], blanks: [''], options: [], emoji: '🎵' }])}>
        <Plus size={16} /> 添加填空题
      </button>
    </section>
  );
}

function ScrambleEditor({ items, onChange }) {
  const update = (idx, patch) => onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  return (
    <section className="pbv2-card pbv2-tone-green">
      <div className="pbv2-card-title">连词成句（Exercise 2，单词顺序游戏内自动打乱）</div>
      {items.map((item, idx) => (
        <div key={idx} className="cw-exercise-item">
          <div className="cw-exercise-head"><span>第 {idx + 1} 题</span><button type="button" onClick={() => remove(idx)}><Trash2 size={13} /></button></div>
          <Field label="完整句子" value={item.answer} onChange={(v) => update(idx, { answer: v, words: v.trim().split(/\s+/).filter(Boolean) })} />
        </div>
      ))}
      <button type="button" className="pbv2-add-page" onClick={() => onChange([...items, { answer: '', words: [] }])}>
        <Plus size={16} /> 添加连词成句
      </button>
    </section>
  );
}

function ListenEditor({ items, onChange }) {
  const update = (idx, patch) => onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  const updateOption = (idx, oi, value) => update(idx, { options: items[idx].options.map((o, i) => (i === oi ? value : o)) });
  return (
    <section className="pbv2-card pbv2-tone-coral">
      <div className="pbv2-card-title">听音选词（Exercise 3，正确句播放歌曲片段后选择）</div>
      {items.map((item, idx) => (
        <div key={idx} className="cw-exercise-item">
          <div className="cw-exercise-head">
            <span>第 {idx + 1} 题 · 正确句：
              <select value={item.correct ?? 0} onChange={(e) => update(idx, { correct: Number(e.target.value) })}>
                {(item.options || []).map((_, i) => <option key={i} value={i}>选项 {i + 1}</option>)}
              </select>
            </span>
            <button type="button" onClick={() => remove(idx)}><Trash2 size={13} /></button>
          </div>
          {(item.options || []).map((opt, oi) => (
            <Field key={oi} label={`选项 ${oi + 1}${item.correct === oi ? '（正确）' : ''}`} value={opt} onChange={(v) => updateOption(idx, oi, v)} />
          ))}
        </div>
      ))}
      <button type="button" className="pbv2-add-page" onClick={() => onChange([...items, { question: 'Choose the sentence you hear:', options: ['', '', ''], correct: 0 }])}>
        <Plus size={16} /> 添加听音选词
      </button>
    </section>
  );
}

function PlansEditor({ plans, onChange }) {
  const stages = ['1', '2', '3', '4'];
  const updateStage = (key, patch) => onChange({ ...plans, [key]: { ...(plans[key] || {}), ...patch } });
  const updateSection = (key, si, patch) => {
    const sections = (plans[key]?.sections || []).map((s, i) => (i === si ? { ...s, ...patch } : s));
    updateStage(key, { sections });
  };
  return (
    <section className="pbv2-card pbv2-tone-blue">
      <div className="pbv2-card-title">四关教学方案（游戏内「How to teach」抽屉展示）</div>
      {stages.map((key) => {
        const plan = plans[key] || { title: '', sections: [] };
        return (
          <details key={key} className="cw-plan-details">
            <summary>{STAGE_TITLES[key]} · {plan.title || '未命名'}</summary>
            <Field label="方案标题" value={plan.title || ''} onChange={(v) => updateStage(key, { title: v })} />
            {(plan.sections || []).map((section, si) => (
              <div key={si} className="cw-plan-section">
                <Field label={`分节标题 ${si + 1}`} value={section.title || ''} onChange={(v) => updateSection(key, si, { title: v })} />
                <Field area label="内容（支持 HTML）" value={section.content || ''} onChange={(v) => updateSection(key, si, { content: v })} />
              </div>
            ))}
          </details>
        );
      })}
    </section>
  );
}

// ── 音频上传卡片（step 4）───────────────────────────────────
function AudioCard({ label, name, dataUri, onPick, onRemove }) {
  const inputRef = React.useRef(null);
  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { window.alert('音频不能超过 8MB，请压缩后再上传'); return; }
    const reader = new FileReader();
    reader.onload = () => onPick({ dataUri: String(reader.result || ''), name: file.name });
    reader.readAsDataURL(file);
  };
  return (
    <div className={`cw-audio-card${dataUri ? ' has' : ''}`}>
      <h4>{label}{dataUri ? ' · 已上传' : ' · 未上传'}</h4>
      {dataUri ? (
        <>
          <audio controls src={dataUri} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="pbv2-ghost" onClick={() => inputRef.current?.click()}>重新上传</button>
            <button type="button" className="pbv2-ghost" onClick={onRemove}><Trash2 size={14} /> 移除</button>
          </div>
        </>
      ) : (
        <button type="button" className="pbv2-ghost" onClick={() => inputRef.current?.click()}>选择 mp3 文件（≤8MB）</button>
      )}
      {name && <small style={{ color: '#818997' }}>{name}</small>}
      <input ref={inputRef} type="file" accept="audio/mpeg,.mp3" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
    </div>
  );
}

export function MusicStudioPage() {
  const navigate = useNavigate();
  const [view, setView] = React.useState('list');
  const [works, setWorks] = React.useState([]);
  const [listLoading, setListLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [message, setMessage] = React.useState('');

  const editingIdRef = React.useRef(null);
  const [step, setStep] = React.useState(0);
  const [basicInfo, setBasicInfo] = React.useState(initialBasicInfo);
  const [song, setSong] = React.useState(initialSong);
  const [exercises, setExercises] = React.useState(initialExercises);
  const [audio, setAudio] = React.useState({});
  const [workTitle, setWorkTitle] = React.useState('');

  const [songGenerating, setSongGenerating] = React.useState(false);
  const [exGenerating, setExGenerating] = React.useState(false);
  const [rendering, setRendering] = React.useState(false);
  const [rendered, setRendered] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveState, setSaveState] = React.useState('');
  const [showGame, setShowGame] = React.useState(false);

  const loadWorks = React.useCallback(() => {
    setListLoading(true);
    getCreativeWorks(MODULE_ID)
      .then(setWorks)
      .catch(() => {})
      .finally(() => setListLoading(false));
  }, []);
  React.useEffect(() => { loadWorks(); }, [loadWorks]);

  const setEditing = (id) => { editingIdRef.current = id; };

  const openWork = (work) => {
    setEditing(work.id);
    setBasicInfo({ ...initialBasicInfo, ...(work.parameters || {}) });
    const r = work.result || {};
    setWorkTitle(r.title || work.title || '');
    setSong({ title: r.title || work.title || '', songMeta: r.songMeta || {}, lyrics: Array.isArray(r.lyrics) ? r.lyrics : [], targetPatterns: Array.isArray(r.targetPatterns) ? r.targetPatterns : [] });
    setExercises({
      ex1FillData: Array.isArray(r.ex1FillData) ? r.ex1FillData : [],
      ex2Items: Array.isArray(r.ex2Items) ? r.ex2Items : [],
      ex3Data: Array.isArray(r.ex3Data) ? r.ex3Data : [],
      teachingPlans: r.teachingPlans || {},
    });
    setAudio(r.audio || {});
    setRendered(Boolean(work.hasHtml));
    setMessage('');
    setStep(r.lyrics?.length ? (r.ex1FillData?.length ? 3 : 2) : 0);
    setView('studio');
  };

  const createWork = async () => {
    try {
      const work = await createCreativeWork({ moduleId: MODULE_ID, moduleName: MODULE_NAME, title: '未命名歌曲课件', parameters: initialBasicInfo });
      await loadWorks();
      setEditing(work.id);
      setBasicInfo(initialBasicInfo);
      setSong(initialSong);
      setExercises(initialExercises);
      setAudio({});
      setWorkTitle('');
      setRendered(false);
      setStep(0);
      setMessage('');
      setView('studio');
    } catch (err) {
      window.alert(err.message || '创建失败，请重试');
    }
  };

  const backToList = () => { setEditing(null); setView('list'); loadWorks(); };

  const persist = async (payload) => {
    const id = editingIdRef.current;
    if (!id) return;
    setSaving(true);
    try {
      await updateCreativeWork(id, payload);
      setSaveState(`已保存 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`);
    } catch (err) {
      setSaveState('保存失败');
      setMessage(err.message || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  // ── step 0：基本信息 → AI 生成歌曲（同瑜伽第 1 步交互）──────
  const basicReady = String(basicInfo.goals || '').trim() && String(basicInfo.theme || '').trim();
  const generateSongAndAdvance = async () => {
    const id = editingIdRef.current;
    if (!id || songGenerating) return;
    setSongGenerating(true);
    setMessage('');
    try {
      await updateCreativeWork(id, { title: basicInfo.theme, parameters: basicInfo });
      const data = await generateCreativeWorkSong(id);
      setSong({ title: data.title || '', songMeta: data.song?.songMeta || {}, lyrics: data.song?.lyrics || [], targetPatterns: data.song?.targetPatterns || [] });
      if (data.title) setWorkTitle(data.title);
      setStep(1);
    } catch (err) {
      setMessage(err.message || '歌曲生成失败，请重试');
    } finally {
      setSongGenerating(false);
    }
  };

  // ── step 1：歌曲编辑 ──────────────────────────────────────
  const regenerateSong = async () => {
    const id = editingIdRef.current;
    if (!id || songGenerating) return;
    setSongGenerating(true);
    setMessage('');
    try {
      await updateCreativeWork(id, { parameters: basicInfo });
      const data = await generateCreativeWorkSong(id);
      setSong({ title: data.title || '', songMeta: data.song?.songMeta || {}, lyrics: data.song?.lyrics || [], targetPatterns: data.song?.targetPatterns || [] });
      if (data.title) setWorkTitle(data.title);
    } catch (err) {
      setMessage(err.message || '歌曲生成失败，请重试');
    } finally {
      setSongGenerating(false);
    }
  };

  const saveSong = async () => {
    await persist({ title: song.title || workTitle, song });
    setStep(2);
  };

  // ── step 2：练习与教案 ────────────────────────────────────
  const generateExercises = async () => {
    const id = editingIdRef.current;
    if (!id || exGenerating) return;
    setExGenerating(true);
    setMessage('');
    try {
      await persist({ song, title: song.title || workTitle });
      const data = await generateCreativeWorkExercises(id);
      setExercises({ ...initialExercises, ...data });
    } catch (err) {
      setMessage(err.message || '练习生成失败，请重试');
    } finally {
      setExGenerating(false);
    }
  };

  const saveExercises = async () => {
    await persist({ exercises });
    setStep(3);
  };

  // ── step 3：音频与课件 ────────────────────────────────────
  const buildCourseware = async () => {
    const id = editingIdRef.current;
    if (!id || rendering) return;
    setRendering(true);
    setMessage('');
    try {
      await persist({ exercises, title: song.title || workTitle });
      await renderCreativeWork(id, audio);
      setRendered(true);
      setSaveState('课件已生成');
    } catch (err) {
      setMessage(err.message || '课件生成失败，请重试');
    } finally {
      setRendering(false);
    }
  };

  const tokenQS = `token=${encodeURIComponent(localStorage.getItem('token') || '')}`;
  const openHtml = (id) => window.open(`/api/creative-works/${id}/html?${tokenQS}`, '_blank');
  const downloadHtml = (id) => { window.location.href = `/api/creative-works/${id}/html?download=1&${tokenQS}`; };

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
    `${w.title || ''} ${w.parameters?.theme || ''} ${w.parameters?.goals || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── 列表视图 ─────────────────────────────────────────────
  if (view === 'list') {
    return (
      <main className="picture-book-studio-v2">
        <div className="pbv2-list-page" style={{ '--cw-accent': ACCENT }}>
          <header className="pbv2-topbar">
            <div className="pbv2-topbar-left">
              <div className="pbv2-topbar-icon"><Music size={28} /></div>
              <div>
                <h1>{MODULE_NAME}</h1>
                <p>AI 创歌 → 练习设计 → 上传音频 → 四关闯关游戏课件</p>
              </div>
            </div>
            <div className="pbv2-topbar-actions">
              <button type="button" className="pbv2-back-btn" onClick={() => navigate('/workshop/english-plus')}>
                <ArrowLeft size={16} /> 返回
              </button>
              <button type="button" className="pbv2-create-btn" onClick={createWork}>
                <Plus size={18} /> 新建作品
              </button>
            </div>
          </header>

          <div className="pbv2-list-toolbar">
            <div className="pbv2-search-box">
              <Search size={16} />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜索作品或歌曲主题…" />
            </div>
          </div>

          {message && <div className="pbv2-message">{message}</div>}

          {listLoading ? (
            <div className="pbv2-list-loading"><Loader2 className="spin" size={28} /></div>
          ) : filtered.length === 0 ? (
            <div className="pbv2-list-empty">
              <Music size={48} />
              <p>{searchTerm ? '没有匹配的作品' : '还没有作品，点击「新建作品」开始创作'}</p>
            </div>
          ) : (
            <div className="pbv2-card-grid">
              {filtered.map((work) => {
                const lyricCount = work.result?.lyrics?.length || 0;
                return (
                  <article key={work.id} className="pbv2-book-card" onClick={() => openWork(work)}>
                    <div className="pbv2-book-cover exp-cover">
                      <Music size={52} />
                      <span className={`pbv2-book-status ${work.hasHtml ? 'published' : 'draft'}`}>
                        {work.hasHtml ? '已生成课件' : (lyricCount ? '创作中' : '草稿')}
                      </span>
                    </div>
                    <div className="pbv2-book-info">
                      <h3>{work.title || '未命名作品'}</h3>
                      <div className="pbv2-book-meta">
                        <Clock size={13} />
                        <span>{work.parameters?.age || ''}{work.parameters?.duration ? ` · ${work.parameters.duration}` : ''}</span>
                        <span>·</span>
                        <span>{work.updatedAt ? new Date(work.updatedAt).toLocaleDateString() : ''}</span>
                      </div>
                      <div className="pbv2-book-actions">
                        {work.hasHtml && (
                          <>
                            <button type="button" onClick={(e) => { e.stopPropagation(); openHtml(work.id); }}>
                              <ExternalLink size={14} /> 打开
                            </button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); downloadHtml(work.id); }}>
                              <Download size={14} /> 下载
                            </button>
                          </>
                        )}
                        <button type="button" onClick={(e) => { e.stopPropagation(); openWork(work); }}>
                          <Pencil size={14} /> 编辑
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
        </div>
      </main>
    );
  }

  // ── 工作室视图（4 步）─────────────────────────────────────
  return (
    <main className="picture-book-studio-v2">
      <header className="pbv2-topbar">
        <div className="pbv2-topbar-left">
          <div className="pbv2-topbar-icon"><Music size={28} /></div>
          <div>
            <h1>{workTitle || '新建歌曲课件'}</h1>
            <p>按绘本制作流程完成：基本信息 → 歌曲创作 → 练习与教案 → 音频与课件</p>
          </div>
        </div>
        <div className="pbv2-topbar-actions">
          <span className={`pbv2-save-state ${saveState === '保存失败' ? 'is-error' : ''}`}>{saveState}</span>
          <button type="button" className="pbv2-back-btn" onClick={backToList}>
            <ArrowLeft size={16} /> 返回列表
          </button>
        </div>
      </header>

      <div className="pbv2-shell">
        <aside className="pbv2-steps">
          {STEPS.map((label, index) => (
            <button type="button" key={label} className={`${step === index ? 'is-active' : ''} ${step > index ? 'is-done' : ''}`} onClick={() => setStep(index)}>
              <span>{index + 1}</span>
              <strong>{label}</strong>
            </button>
          ))}
        </aside>

        <section className={`pbv2-workspace pbv2-workspace-step-${step}`}>
          {message && <div className="pbv2-message">{message}</div>}

          {/* step 1 · 基本信息 */}
          {step === 0 && (
            <div className="pbv2-step-panel">
              <div className="pbv2-form-grid two">
                <OptionGroup required label="年龄段" options={AGE_OPTIONS} value={basicInfo.age} onChange={(v) => setBasicInfo({ ...basicInfo, age: v })} tone="coral" />
                <OptionGroup required label="英文水平" options={LEVEL_OPTIONS} value={basicInfo.level} onChange={(v) => setBasicInfo({ ...basicInfo, level: v })} tone="blue" />
                <OptionGroup label="风格偏好" options={STYLE_OPTIONS} value={basicInfo.style} onChange={(v) => setBasicInfo({ ...basicInfo, style: v })} tone="yellow" />
                <OptionGroup label="歌曲时长" options={DURATION_OPTIONS} value={basicInfo.duration} onChange={(v) => setBasicInfo({ ...basicInfo, duration: v })} tone="green" />
                <OptionGroup label="结构要求" options={STRUCTURE_OPTIONS} value={basicInfo.structure} onChange={(v) => setBasicInfo({ ...basicInfo, structure: v })} tone="coral" />
              </div>
              <section className="pbv2-card pbv2-tone-coral">
                <div className="pbv2-card-title">目标语言点（必填）</div>
                <input className="pbv2-input" value={basicInfo.goals} onChange={(e) => setBasicInfo({ ...basicInfo, goals: e.target.value })} placeholder="例如：China, USA, Where are you from?" />
              </section>
              <section className="pbv2-card pbv2-tone-blue">
                <div className="pbv2-card-title">歌曲主题（必填）</div>
                <input className="pbv2-input" value={basicInfo.theme} onChange={(e) => setBasicInfo({ ...basicInfo, theme: e.target.value })} placeholder="例如：国家与问候" />
              </section>
              <section className="pbv2-card pbv2-tone-green">
                <div className="pbv2-card-title">特殊要求（选填）</div>
                <Field area label="补充说明" value={basicInfo.requirements} onChange={(v) => setBasicInfo({ ...basicInfo, requirements: v })} placeholder="例如：要有问答呼应" />
              </section>
              <footer className="pbv2-actions">
                <ChevronRight size={16} />
                <button type="button" className="pbv2-primary" disabled={!basicReady || songGenerating} onClick={generateSongAndAdvance}>
                  {songGenerating ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                  {songGenerating ? 'AI 生成中…' : 'AI 生成歌曲'}
                </button>
              </footer>
            </div>
          )}

          {/* step 2 · 歌曲创作 */}
          {step === 1 && (
            <div className="pbv2-step-panel">
              <section className="pbv2-plan-block pbv2-tone-coral">
                <div className="pbv2-form-grid two">
                  <Field label="歌名" value={song.title} onChange={(v) => { setSong({ ...song, title: v }); setWorkTitle(v); }} />
                  <Field label="目标句型/词汇（每行一个，用于歌词高亮）" area value={(song.targetPatterns || []).join('\n')} onChange={(v) => setSong({ ...song, targetPatterns: v.split('\n').map((s) => s.trim()).filter(Boolean) })} />
                </div>
              </section>
              <LyricsEditor lyrics={song.lyrics} onChange={(lyrics) => setSong({ ...song, lyrics })} />
              <footer className="pbv2-actions">
                <button type="button" className="pbv2-ghost" onClick={() => setStep(0)}>返回基本信息</button>
                <button type="button" className="pbv2-ghost" disabled={songGenerating} onClick={regenerateSong}>
                  {songGenerating ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
                  {songGenerating ? 'AI 生成中…' : 'AI 重新生成歌曲'}
                </button>
                <button type="button" className="pbv2-primary" disabled={saving} onClick={saveSong}>
                  <Save size={16} /> 保存并设计练习
                </button>
              </footer>
            </div>
          )}

          {/* step 3 · 练习与教案 */}
          {step === 2 && (
            <div className="pbv2-step-panel">
              <p className="yoga-design-hint">三类练习全部来自歌词（题量按歌曲时长自动匹配 4:3:2 规则），生成后可逐题修改；四关教学方案展示在游戏每关的「How to teach」抽屉里。</p>
              <FillEditor items={exercises.ex1FillData} onChange={(ex1FillData) => setExercises({ ...exercises, ex1FillData })} />
              <ScrambleEditor items={exercises.ex2Items} onChange={(ex2Items) => setExercises({ ...exercises, ex2Items })} />
              <ListenEditor items={exercises.ex3Data} onChange={(ex3Data) => setExercises({ ...exercises, ex3Data })} />
              <PlansEditor plans={exercises.teachingPlans} onChange={(teachingPlans) => setExercises({ ...exercises, teachingPlans })} />
              <footer className="pbv2-actions">
                <button type="button" className="pbv2-ghost" onClick={() => setStep(1)}>返回歌曲编辑</button>
                <button type="button" className="pbv2-ghost" disabled={exGenerating} onClick={generateExercises}>
                  {exGenerating ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                  {exGenerating ? 'AI 生成中…' : 'AI 生成练习与教案'}
                </button>
                <button type="button" className="pbv2-primary" disabled={saving} onClick={saveExercises}>
                  <Save size={16} /> 保存并上传音频
                </button>
              </footer>
            </div>
          )}

          {/* step 4 · 音频与课件 */}
          {step === 3 && (
            <div className="pbv2-step-panel">
              <p className="yoga-design-hint">上传歌曲音频后点「生成课件」：原唱用于完整聆听/跟唱/录制，伴奏用于无原唱演唱。音频会以离线方式嵌入课件（单文件 ≤8MB）。不上传音频也可以生成课件，但涉及听音的环节将无法播放。</p>
              <div className="pbv2-form-grid two">
                <AudioCard label="原唱（Vocal）" name={audio.vocalName} dataUri={audio.vocal} onPick={({ dataUri, name }) => setAudio({ ...audio, vocal: dataUri, vocalName: name })} onRemove={() => setAudio({ ...audio, vocal: '', vocalName: '' })} />
                <AudioCard label="伴奏（Backing）" name={audio.backingName} dataUri={audio.backing} onPick={({ dataUri, name }) => setAudio({ ...audio, backing: dataUri, backingName: name })} onRemove={() => setAudio({ ...audio, backing: '', backingName: '' })} />
              </div>
              <footer className="pbv2-actions">
                <button type="button" className="pbv2-ghost" onClick={() => setStep(2)}>返回练习编辑</button>
                <button type="button" className="pbv2-primary" disabled={rendering} onClick={buildCourseware}>
                  {rendering ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                  {rendering ? '生成中…' : (rendered ? '重新生成课件' : '生成课件')}
                </button>
                <button type="button" className="pbv2-ghost" disabled={!rendered} onClick={() => setShowGame(true)}>
                  🖥️ 授课模式
                </button>
                <button type="button" className="pbv2-ghost" disabled={!rendered} onClick={() => openHtml(editingIdRef.current)}>
                  <ExternalLink size={16} /> 打开课件
                </button>
                <button type="button" className="pbv2-ghost" disabled={!rendered} onClick={() => downloadHtml(editingIdRef.current)}>
                  <Download size={16} /> 下载课件
                </button>
              </footer>
            </div>
          )}
        </section>
      </div>

      {showGame && (
        <div className="cw-game-overlay">
          <button type="button" className="cw-game-close" onClick={() => setShowGame(false)}>
            <X size={16} /> 退出试玩
          </button>
          <iframe src={`/api/creative-works/${editingIdRef.current}/html?${tokenQS}`} title="Music Star Quest" allow="autoplay" />
        </div>
      )}
    </main>
  );
}

export default MusicStudioPage;
