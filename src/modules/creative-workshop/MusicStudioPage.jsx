import React from 'react';
import {
  ArrowLeft, ChevronRight, Clock, Loader2, Music, Pencil, Plus,
  RefreshCw, Save, Search, Sparkles, Trash2, Wand2, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  createCreativeWork, deleteCreativeWork, generateCreativeWorkExercises,
  generateCreativeWorkLyricLine, generateCreativeWorkSong, getCreativeWorks, renderCreativeWork, updateCreativeWork,
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
const initialExercises = { ex1FillData: [], ex2Items: [], ex3Data: [], starRoles: [], teachingPlans: {} };
const STAGE_TITLES = { 1: 'Lyric Hunter', 2: 'Melody Mover', 3: 'Echo Master', 4: 'Star Studio' };
// 第四关角色（与游戏模板 recordMarks 一致）
const STAR_ROLE_OPTIONS = [
  { value: 'all', label: 'All 齐唱' },
  { value: 'teacher', label: 'Teacher 教师' },
  { value: 'student', label: 'Student 学生' },
  { value: 'solo', label: 'Solo 独唱' },
];

// ── 歌词时间轴工具 ─────────────────────────────────────────
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const toTimeStr = (sec) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
const toRangeStr = (start, end) => `${toTimeStr(start)}–${toTimeStr(Math.max(end, start + 1))}`;
function parseTimeRange(time) {
  const m = String(time || '').match(/^(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const toSec = (mm, ss) => Number(mm) * 60 + Number(ss);
  const start = toSec(m[1], m[2]);
  const end = toSec(m[3], m[4]);
  return end > start ? { start, end } : null;
}
/** 解析上传的 .lrc / .txt 歌词：支持 [mm:ss.xx]行、mm:ss–mm:ss 行、纯文本行 */
function parseLyricsFile(text) {
  const rows = [];
  String(text || '').split(/\r?\n/).forEach((raw) => {
    const line = raw.trim();
    if (!line) return;
    const range = line.match(/^(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})\s+(.*)$/);
    if (range) {
      rows.push({ start: Number(range[1]) * 60 + Number(range[2]), end: Number(range[3]) * 60 + Number(range[4]), text: range[5].trim() });
      return;
    }
    const lrcMatches = [...line.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:]\d{1,3})?\]/g)];
    if (lrcMatches.length) {
      const lyricText = line.replace(/\[(\d{1,2}):(\d{2})(?:[.:]\d{1,3})?\]/g, '').trim();
      if (lyricText) lrcMatches.forEach((m) => rows.push({ start: Number(m[1]) * 60 + Number(m[2]), end: 0, text: lyricText }));
      return;
    }
    rows.push({ start: 0, end: 0, text: line });
  });
  if (!rows.length) throw new Error('未解析到任何歌词行');
  // LRC 只有起点：终点 = 下一行起点；纯文本行：从上一行结束处起每行 3 秒顺延
  let cursor = 0;
  return rows.map((row, idx) => {
    if (row.end > row.start) {
      cursor = Math.max(cursor, row.end);
      return { time: toRangeStr(row.start, row.end), text: row.text };
    }
    const nextStart = rows.slice(idx + 1).find((r) => r.start > row.start);
    if (row.start > 0 || nextStart) {
      const start = row.start > 0 ? row.start : cursor;
      const end = nextStart ? Math.max(nextStart.start, start + 1) : start + 3;
      cursor = Math.max(cursor, end);
      return { time: toRangeStr(start, end), text: row.text };
    }
    const time = toRangeStr(cursor, cursor + 3);
    cursor += 3;
    return { time, text: row.text };
  });
}

// ── AI 分段音频（n8n 音乐生成 → 缓存 → base64） ───────────────
const authJsonHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});
/** 生成一段歌曲音频，返回可直接嵌入课件的 mp3 data URI */
async function generateSegmentAudio({ prompt, duration }) {
  const submit = await fetch('/api/ai/generate-audio', {
    method: 'POST',
    headers: authJsonHeaders(),
    body: JSON.stringify({ prompt, count: 1, duration: clamp(Math.round(duration) || 5, 3, 15) }),
  });
  if (!submit.ok) throw new Error((await submit.json().catch(() => ({}))).error || '音频任务提交失败');
  const { executionId } = await submit.json();
  if (!executionId) throw new Error('音频任务提交失败（缺少 executionId）');
  let url = '';
  for (let attempt = 0; attempt < 100 && !url; attempt++) {
    await new Promise((r) => setTimeout(r, 3000));
    const status = await fetch(`/api/ai/generate-audio?executionId=${executionId}`, { headers: authJsonHeaders() });
    if (!status.ok) continue;
    const data = await status.json();
    if (data.status === 'error') throw new Error('音频生成失败，请重试');
    if (data.status === 'completed' && data.results?.length) url = data.results[0].url;
  }
  if (!url) throw new Error('音频生成超时，请重试');
  // OSS 地址跨域，先经后端缓存为同源地址再取字节
  const cacheRes = await fetch('/api/media/cache', {
    method: 'POST',
    headers: authJsonHeaders(),
    body: JSON.stringify({ url, type: 'audio' }),
  });
  const cacheJson = await cacheRes.json().catch(() => ({}));
  const localUrl = cacheJson?.data?.url || url;
  const blob = await (await fetch(localUrl)).blob();
  if (blob.size > 8 * 1024 * 1024) throw new Error('生成的音频超过 8MB');
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
/** 顺次拼接 mp3 分段（mp3 帧可直接字节级连接），得到完整原唱 data URI */
function mergeMp3DataUris(dataUris) {
  const valid = dataUris.filter(Boolean);
  if (!valid.length) return '';
  const payload = valid
    .map((uri) => String(uri).replace(/^data:audio\/[^;]+;base64,/, ''))
    .join('');
  return `data:audio/mpeg;base64,${payload}`;
}
const hasCompleteExercises = (value) => Boolean(
  value?.ex1FillData?.length
  && value?.ex2Items?.length
  && value?.ex3Data?.length
  && value?.starRoles?.length
  && ['1', '2', '3', '4'].every((key) => value?.teachingPlans?.[key])
);
const htmlToPlainText = (value) => String(value || '')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/(p|li|div|ul|ol|h[1-6])>/gi, '\n')
  .replace(/<li[^>]*>/gi, '• ')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/\n{3,}/g, '\n\n')
  .trim();
const plainTeachingPlans = (plans) => Object.fromEntries(Object.entries(plans || {}).map(([key, plan]) => [key, {
  ...plan,
  title: htmlToPlainText(plan?.title),
  sections: (plan?.sections || []).map((section) => ({ ...section, title: htmlToPlainText(section.title), content: htmlToPlainText(section.content) })),
}]));

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
function LyricsEditor({ lyrics, onGenerateLine, onChange }) {
  const [keywords, setKeywords] = React.useState({});
  const [generatingIndex, setGeneratingIndex] = React.useState(null);
  const fileRef = React.useRef(null);
  const generate = async (idx) => {
    if (generatingIndex !== null) return;
    setGeneratingIndex(idx);
    try {
      await onGenerateLine(idx, keywords[idx] || '');
    } finally {
      setGeneratingIndex(null);
    }
  };
  const updateRow = (idx, patch) => onChange(lyrics.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseLyricsFile(String(reader.result || ''));
        onChange(parsed);
      } catch (err) {
        window.alert(err.message || '歌词文件解析失败');
      }
    };
    reader.readAsText(file, 'utf-8');
    if (fileRef.current) fileRef.current.value = '';
  };
  return (
    <section className="pbv2-card pbv2-tone-blue">
      <div className="cw-section-title">
        <div className="pbv2-card-title">歌词时间轴（授课时按 time 与音频同步高亮）</div>
        <button type="button" className="pbv2-ghost" onClick={() => fileRef.current?.click()}>上传歌词（.lrc / .txt）</button>
        <input ref={fileRef} type="file" accept=".lrc,.txt,text/plain" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>
      <p className="yoga-design-hint">支持上传 LRC / 文本歌词（时间格式 mm:ss–mm:ss 或 [mm:ss]；无时间则自动按每行 3 秒顺延，可手动修改）。AI 逐行重新生成时保持时间不变。</p>
      {lyrics.map((row, idx) => (
        <div key={idx} className="cw-lyric-row">
          <input
            className="cw-lyric-time"
            style={{ width: 110 }}
            value={row.time || ''}
            onChange={(e) => updateRow(idx, { time: e.target.value })}
            placeholder="mm:ss–mm:ss"
            title="该行起止时间（与音频同步高亮用）"
          />
          <span className="cw-lyric-text cw-lyric-text-readonly">{row.text || '尚未生成'}</span>
          <input
            className="cw-lyric-keywords"
            value={keywords[idx] || ''}
            onChange={(e) => setKeywords((prev) => ({ ...prev, [idx]: e.target.value }))}
            placeholder="调整关键词，如：sunshine, hello"
          />
          <button type="button" className="pbv2-ghost cw-lyric-generate" disabled={generatingIndex !== null} onClick={() => generate(idx)}>
            {generatingIndex === idx ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}
            {row.text ? '重新生成' : '生成'}
          </button>
        </div>
      ))}
    </section>
  );
}

// ── 练习编辑器（step 3）─────────────────────────────────────
function AiSectionButton({ loading, hasContent, onClick }) {
  return (
    <button type="button" className="pbv2-ghost cw-section-ai" disabled={loading} onClick={onClick}>
      {loading ? <Loader2 className="spin" size={14} /> : <Sparkles size={14} />}
      {loading ? 'AI 生成中…' : (hasContent ? 'AI 重新生成' : 'AI 生成')}
    </button>
  );
}

function FillEditor({ items, onChange, onGenerate, generating }) {
  const update = (idx, patch) => onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  return (
    <section className="pbv2-card pbv2-tone-yellow">
      <div className="cw-section-title"><div className="pbv2-card-title">选词填空（Exercise 1）</div><AiSectionButton loading={generating} hasContent={items.length > 0} onClick={onGenerate} /></div>
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

function ScrambleEditor({ items, onChange, onGenerate, generating }) {
  const update = (idx, patch) => onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  return (
    <section className="pbv2-card pbv2-tone-green">
      <div className="cw-section-title"><div className="pbv2-card-title">连词成句（Exercise 2，单词顺序游戏内自动打乱）</div><AiSectionButton loading={generating} hasContent={items.length > 0} onClick={onGenerate} /></div>
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

function ListenEditor({ items, onChange, onGenerate, generating }) {
  const update = (idx, patch) => onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  const updateOption = (idx, oi, value) => update(idx, { options: items[idx].options.map((o, i) => (i === oi ? value : o)) });
  return (
    <section className="pbv2-card pbv2-tone-coral">
      <div className="cw-section-title"><div className="pbv2-card-title">听音选词（Exercise 3，正确句播放歌曲片段后选择）</div><AiSectionButton loading={generating} hasContent={items.length > 0} onClick={onGenerate} /></div>
      {items.map((item, idx) => (
        <div key={idx} className="cw-exercise-item">
          <div className="cw-exercise-head">
            <span>第 {idx + 1} 题 · 正确句：
              <select value={item.correct ?? 0} onChange={(e) => update(idx, { correct: Number(e.target.value) })}>
                {(item.options || []).map((_, i) => <option key={i} value={i}>选项 {i + 1}</option>)}
              </select>
            </span>
            <input style={{ width: 110 }} placeholder="00:13–00:14" value={item.time || ''} onChange={(e) => update(idx, { time: e.target.value })} title="正确句所在歌词行的时间段（游戏按此播放片段，留空则从 25 秒处播 8 秒）" />
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

// ── 第四关 Stage Star 分工编辑器（step 3）────────────────────
function StarRolesEditor({ lyrics, roles, onChange, onGenerate, generating }) {
  const roleOf = (idx) => STAR_ROLE_OPTIONS.some((r) => r.value === roles[idx]) ? roles[idx] : 'all';
  const setRole = (idx, value) => onChange(lyrics.map((_, i) => (i === idx ? value : roleOf(i))));
  return (
    <section className="pbv2-card pbv2-tone-green">
      <div className="cw-section-title">
        <div className="pbv2-card-title">Stage Star 分工（Exercise 4，第四关按颜色分工演唱并录制）</div>
        <AiSectionButton loading={generating} hasContent={roles.length > 0} onClick={onGenerate} />
      </div>
      <p className="yoga-design-hint">逐行选择演唱角色（All 齐唱 / Teacher 教师领 / Student 学生 / Solo 独唱）；此处仅作预设，课堂中第四关 Mark Part 仍可现场改色。</p>
      {lyrics.length === 0 && <p className="yoga-design-hint">请先在第 2 步生成歌词。</p>}
      {lyrics.map((row, idx) => (
        <div key={idx} className="cw-lyric-row">
          <span className="cw-lyric-time">{row.time || '--:--'}</span>
          <span className="cw-lyric-text cw-lyric-text-readonly">{row.text || '尚未生成'}</span>
          <span className="cw-star-role-picker">
            {STAR_ROLE_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                className={`cw-star-role-chip${roleOf(idx) === r.value ? ' is-active' : ''}`}
                onClick={() => setRole(idx, r.value)}
                title={r.label}
              >
                {r.label}
              </button>
            ))}
          </span>
        </div>
      ))}
    </section>
  );
}

function PlansEditor({ plans, onChange, onGenerate, generating }) {
  const stages = ['1', '2', '3', '4'];
  const [activeStage, setActiveStage] = React.useState('1');
  const updateStage = (key, patch) => onChange({ ...plans, [key]: { ...(plans[key] || {}), ...patch } });
  const updateSection = (key, si, patch) => {
    const sections = (plans[key]?.sections || []).map((s, i) => (i === si ? { ...s, ...patch } : s));
    updateStage(key, { sections });
  };
  return (
    <section className="pbv2-card pbv2-tone-blue">
      <div className="cw-section-title"><div className="pbv2-card-title">四关教学方案（游戏内「How to teach」抽屉展示）</div><AiSectionButton loading={generating} hasContent={Object.keys(plans || {}).length > 0} onClick={onGenerate} /></div>
      <div className="cw-stage-tabs" role="tablist" aria-label="四关教学环节">
        {stages.map((key, index) => (
          <button key={key} type="button" role="tab" aria-selected={activeStage === key} className={activeStage === key ? 'is-active' : ''} onClick={() => setActiveStage(key)}>
            第 {index + 1} 关教案<small>{STAGE_TITLES[key]}</small>
          </button>
        ))}
      </div>
      {(() => {
        const plan = plans[activeStage] || { title: '', sections: [] };
        return (
          <div className="cw-plan-stage" role="tabpanel">
            <h4>第 {activeStage} 关 · {STAGE_TITLES[activeStage]} · {plan.title || '未命名教学方案'}</h4>
            <Field label="方案标题" value={plan.title || ''} onChange={(v) => updateStage(activeStage, { title: v })} />
            {(plan.sections || []).map((section, si) => (
              <div key={si} className="cw-plan-section">
                <Field label={`分节标题 ${si + 1}`} value={section.title || ''} onChange={(v) => updateSection(activeStage, si, { title: v })} />
                <Field area label="内容" value={section.content || ''} onChange={(v) => updateSection(activeStage, si, { content: v })} />
              </div>
            ))}
          </div>
        );
      })()}
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
  const [segmentBusy, setSegmentBusy] = React.useState(null);
  const [workTitle, setWorkTitle] = React.useState('');

  const [songGenerating, setSongGenerating] = React.useState(false);
  const [exGenerating, setExGenerating] = React.useState(false);
  const [sectionGenerating, setSectionGenerating] = React.useState('');
  const [rendering, setRendering] = React.useState(false);
  const [rendered, setRendered] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveState, setSaveState] = React.useState('');
  const [gameWorkId, setGameWorkId] = React.useState(null);

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
      starRoles: Array.isArray(r.starRoles) ? r.starRoles : [],
      teachingPlans: plainTeachingPlans(r.teachingPlans),
    });
    setAudio(r.audio || {});
    setRendered(Boolean(work.hasHtml));
    setMessage('');
    const exercisesComplete = hasCompleteExercises(r);
    setStep(r.lyrics?.length ? (exercisesComplete ? 3 : 2) : 0);
    setView('studio');
    if (r.lyrics?.length && !exercisesComplete) {
      setExGenerating(true);
      generateCreativeWorkExercises(work.id)
        .then((data) => setExercises({ ...initialExercises, ...data }))
        .catch((err) => setMessage(err.message || '练习与教案生成失败，请点击 AI 生成重试'))
        .finally(() => setExGenerating(false));
    }
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

  const generateLyricLine = async (index, keywords) => {
    const id = editingIdRef.current;
    if (!id) return;
    setMessage('');
    try {
      // 先保存歌名与目标句型，确保单行生成使用页面上的最新上下文。
      await updateCreativeWork(id, { title: song.title || workTitle, song });
      const data = await generateCreativeWorkLyricLine(id, index, keywords);
      setSong((current) => ({ ...current, lyrics: data.lyrics || current.lyrics }));
      setSaveState('单行歌词已生成并保存');
    } catch (err) {
      setMessage(err.message || '单行歌词生成失败，请重试');
      throw err;
    }
  };

  const saveSong = async () => {
    await persist({ title: song.title || workTitle, song });
    setStep(2);
    if (!hasCompleteExercises(exercises)) await generateExercises();
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

  const generateExerciseSection = async (section) => {
    const id = editingIdRef.current;
    if (!id || sectionGenerating || exGenerating) return;
    setSectionGenerating(section);
    setMessage('');
    try {
      await persist({ song, title: song.title || workTitle });
      const data = await generateCreativeWorkExercises(id, section);
      setExercises((current) => ({ ...current, ...data }));
      setSaveState('该区块已重新生成并保存');
    } catch (err) {
      setMessage(err.message || '该区块生成失败，请重试');
    } finally {
      setSectionGenerating('');
    }
  };

  const saveExercises = async () => {
    await persist({ exercises });
    setStep(3);
  };

  // ── step 3：音频与课件 ────────────────────────────────────
  const segments = Array.isArray(audio.segments) ? audio.segments : [];
  const setSegment = (idx, dataUri) => {
    const next = song.lyrics.map((_, i) => (i === idx ? dataUri : segments[i] || ''));
    setAudio({ ...audio, segments: next });
  };
  const generateSegment = async (idx) => {
    const row = song.lyrics[idx];
    if (!row?.text || segmentBusy) return;
    setSegmentBusy(idx);
    setMessage('');
    try {
      const range = parseTimeRange(row.time);
      const duration = range ? range.end - range.start : 5;
      const style = basicInfo.style || '欢快';
      const dataUri = await generateSegmentAudio({
        prompt: `儿童英语教学歌曲《${song.title || 'Music Star Quest'}》的一个分段。风格：${style}，清脆童声、节奏明快。只唱这一句歌词："${row.text}"，不要添加其他歌词或念白。`,
        duration,
      });
      setSegment(idx, dataUri);
      setSaveState(`第 ${idx + 1} 段音频已生成`);
    } catch (err) {
      setMessage(err.message || `第 ${idx + 1} 段音频生成失败`);
    } finally {
      setSegmentBusy(null);
    }
  };
  const generateAllSegments = async () => {
    if (segmentBusy) return;
    const targets = song.lyrics.map((row, idx) => ({ row, idx })).filter(({ row, idx }) => row.text && !segments[idx]);
    if (!targets.length) { setMessage('全部分段都已生成'); return; }
    for (let n = 0; n < targets.length; n++) {
      const { idx } = targets[n];
      setSegmentBusy(idx);
      setMessage(`正在生成分段音频 ${n + 1}/${targets.length}…`);
      await generateSegmentDuringBatch(idx);
    }
    setSegmentBusy(null);
    setMessage('');
    setSaveState('分段音频生成完成');
  };
  const generateSegmentDuringBatch = async (idx) => {
    const row = song.lyrics[idx];
    const range = parseTimeRange(row.time);
    const style = basicInfo.style || '欢快';
    try {
      const dataUri = await generateSegmentAudio({
        prompt: `儿童英语教学歌曲《${song.title || 'Music Star Quest'}》的一个分段。风格：${style}，清脆童声、节奏明快。只唱这一句歌词："${row.text}"，不要添加其他歌词或念白。`,
        duration: range ? range.end - range.start : 5,
      });
      setSegment(idx, dataUri);
    } catch (err) {
      console.error(`分段 ${idx + 1} 生成失败:`, err);
      setMessage(`第 ${idx + 1} 段生成失败：${err.message || '未知错误'}，已跳过`);
    }
  };
  const mergeSegmentsToVocal = async () => {
    const merged = mergeMp3DataUris(song.lyrics.map((_, i) => segments[i]));
    if (!merged) { setMessage('还没有可合并的分段音频'); return; }
    await persist({ audio: { ...audio, vocal: merged, vocalName: `AI 分段合并（${segments.filter(Boolean).length} 段）` } });
    setAudio((current) => ({ ...current, vocal: merged, vocalName: `AI 分段合并（${segments.filter(Boolean).length} 段）` }));
    setSaveState('分段已合并为原唱');
  };

  // 进入音频与课件步 / 音频发生变化后，自动（重新）渲染课件，无需手动点按钮
  const lastRenderedAudioRef = React.useRef('');
  const renderTimerRef = React.useRef(null);
  React.useEffect(() => {
    if (step !== 3) return;
    if (JSON.stringify(audio) === lastRenderedAudioRef.current) return;
    if (renderTimerRef.current) clearTimeout(renderTimerRef.current);
    renderTimerRef.current = setTimeout(() => { buildCourseware(); }, 800);
    return () => { if (renderTimerRef.current) clearTimeout(renderTimerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, audio]);

  const buildCourseware = async () => {
    const id = editingIdRef.current;
    if (!id || rendering) return;
    setRendering(true);
    setMessage('');
    try {
      await persist({ exercises, title: song.title || workTitle, audio });
      const data = await renderCreativeWork(id, audio);
      applyGameHtml(data?.html);
      lastRenderedAudioRef.current = JSON.stringify(audio);
      setRendered(true);
      setSaveState('课件已生成');
      return data;
    } catch (err) {
      setMessage(err.message || '课件生成失败，请重试');
      return null;
    } finally {
      setRendering(false);
    }
  };

  // 授课模式：课件 HTML 由 render 接口返回，前端转 Blob URL 在 iframe 播放（无独立查看/下载后端路由）
  const gameHtmlUrlRef = React.useRef(null);
  const applyGameHtml = (html) => {
    if (gameHtmlUrlRef.current) URL.revokeObjectURL(gameHtmlUrlRef.current);
    gameHtmlUrlRef.current = html ? URL.createObjectURL(new Blob([html], { type: 'text/html' })) : null;
    return gameHtmlUrlRef.current;
  };
  React.useEffect(() => () => { if (gameHtmlUrlRef.current) URL.revokeObjectURL(gameHtmlUrlRef.current); }, []);

  // 列表卡片「授课」：hasHtml 时按已存数据重渲染取回 HTML 再全屏试玩
  const presentFromList = async (work) => {
    if (!work.hasHtml) return;
    setMessage('');
    try {
      const data = await renderCreativeWork(work.id);
      if (!applyGameHtml(data?.html)) throw new Error('课件内容为空');
      setGameWorkId(work.id);
    } catch (err) {
      setMessage(err.message || '课件加载失败，请重试');
    }
  };
  const presentCurrent = async () => {
    const id = editingIdRef.current;
    if (!id) return;
    // 已有 Blob（本会话渲染过）直接用；否则按已存数据重渲染
    if (gameHtmlUrlRef.current) { setGameWorkId(id); return; }
    const data = await renderCreativeWork(id).catch(() => null);
    if (applyGameHtml(data?.html)) setGameWorkId(id);
  };
  const gameOverlay = gameWorkId ? (
    <div className="cw-game-overlay">
      <button type="button" className="cw-game-close" onClick={() => setGameWorkId(null)}>
        <X size={16} /> 退出试玩
      </button>
      <iframe src={gameHtmlUrlRef.current || 'about:blank'} title="Music Star Quest" allow="autoplay" />
    </div>
  ) : null;

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

  const enterStep = (index) => {
    setStep(index);
    if (index === 2 && song.lyrics.length && !hasCompleteExercises(exercises) && !exGenerating) {
      generateExercises();
    }
  };

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
                        <button type="button" onClick={(e) => { e.stopPropagation(); openWork(work); }}>
                          <Pencil size={14} /> 编辑
                        </button>
                        {work.hasHtml && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); presentFromList(work); }}>
                            🖥️ 授课
                          </button>
                        )}
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
        {gameOverlay}
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
            <button type="button" key={label} className={`${step === index ? 'is-active' : ''} ${step > index ? 'is-done' : ''}`} onClick={() => enterStep(index)}>
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
              <LyricsEditor lyrics={song.lyrics} onGenerateLine={generateLyricLine} onChange={(lyrics) => setSong({ ...song, lyrics })} />
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
              <FillEditor items={exercises.ex1FillData} onChange={(ex1FillData) => setExercises({ ...exercises, ex1FillData })} onGenerate={() => generateExerciseSection('ex1FillData')} generating={sectionGenerating === 'ex1FillData'} />
              <ScrambleEditor items={exercises.ex2Items} onChange={(ex2Items) => setExercises({ ...exercises, ex2Items })} onGenerate={() => generateExerciseSection('ex2Items')} generating={sectionGenerating === 'ex2Items'} />
              <ListenEditor items={exercises.ex3Data} onChange={(ex3Data) => setExercises({ ...exercises, ex3Data })} onGenerate={() => generateExerciseSection('ex3Data')} generating={sectionGenerating === 'ex3Data'} />
              <StarRolesEditor lyrics={song.lyrics} roles={exercises.starRoles} onChange={(starRoles) => setExercises({ ...exercises, starRoles })} onGenerate={() => generateExerciseSection('starRoles')} generating={sectionGenerating === 'starRoles'} />
              <PlansEditor plans={exercises.teachingPlans} onChange={(teachingPlans) => setExercises({ ...exercises, teachingPlans })} onGenerate={() => generateExerciseSection('teachingPlans')} generating={sectionGenerating === 'teachingPlans'} />
              <footer className="pbv2-actions">
                <button type="button" className="pbv2-ghost" onClick={() => setStep(1)}>返回歌曲编辑</button>
                <button type="button" className="pbv2-ghost" disabled={exGenerating} onClick={generateExercises}>
                  {exGenerating ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                  {exGenerating ? 'AI 生成中…' : 'AI 生成练习与教案'}
                </button>
                <button type="button" className="pbv2-primary" disabled={saving} onClick={saveExercises}>
                  <Save size={16} /> 保存，进入音频与课件
                </button>
              </footer>
            </div>
          )}

          {/* step 4 · 音频与课件 */}
          {step === 3 && (
            <div className="pbv2-step-panel">
              <div className="pbv2-making-toolbar">
                <button type="button" className="pbv2-ghost" onClick={() => enterStep(2)}>返回练习编辑</button>
                <button type="button" className="pbv2-ghost" disabled={!rendered || rendering} onClick={() => presentCurrent()}>
                  {rendering ? <Loader2 className="spin" size={16} /> : null}
                  🖥️ 授课模式
                </button>
                <span className="pbv2-save-state">{rendering ? '课件生成中…' : (rendered ? '课件已就绪' : '')}</span>
              </div>
              <p className="yoga-design-hint">进入本步或调整音频后，课件会自动生成并更新，无需手动操作。原唱用于完整聆听/跟唱/录制，伴奏用于无原唱演唱；音频以离线方式嵌入课件（单文件 ≤8MB），不上传时涉及听音的环节将无法播放。</p>
              <div className="pbv2-form-grid two">
                <AudioCard label="原唱（Vocal）" name={audio.vocalName} dataUri={audio.vocal} onPick={({ dataUri, name }) => setAudio({ ...audio, vocal: dataUri, vocalName: name })} onRemove={() => setAudio({ ...audio, vocal: '', vocalName: '' })} />
                <AudioCard label="伴奏（Backing）" name={audio.backingName} dataUri={audio.backing} onPick={({ dataUri, name }) => setAudio({ ...audio, backing: dataUri, backingName: name })} onRemove={() => setAudio({ ...audio, backing: '', backingName: '' })} />
              </div>
              <section className="pbv2-card pbv2-tone-yellow">
                <div className="cw-section-title">
                  <div className="pbv2-card-title">AI 生成分段音频（按歌词逐段生成）</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="pbv2-ghost" disabled={segmentBusy !== null || !song.lyrics.length} onClick={generateAllSegments}>
                      {segmentBusy === 'all' ? <Loader2 className="spin" size={14} /> : <Sparkles size={14} />} 生成分段音频
                    </button>
                    <button type="button" className="pbv2-ghost" disabled={segmentBusy !== null || !segments.some(Boolean)} onClick={mergeSegmentsToVocal} title="把已生成的分段按顺序拼接为完整原唱（mp3 直接连接）">
                      合并为原唱
                    </button>
                  </div>
                </div>
                <p className="yoga-design-hint">逐段生成、可单独试听与重生成；全部生成后点「合并为原唱」即可作为 Vocal 嵌入课件（也可继续上传完整音频覆盖）。伴奏暂不支持 AI 生成。</p>
                {song.lyrics.map((row, idx) => (
                  <div key={idx} className="cw-lyric-row">
                    <span className="cw-lyric-time">{row.time || '--:--'}</span>
                    <span className="cw-lyric-text cw-lyric-text-readonly">{row.text || '尚未生成'}</span>
                    <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      {segments[idx] ? <audio controls preload="none" src={segments[idx]} style={{ height: 30 }} /> : null}
                      <button type="button" className="pbv2-ghost cw-lyric-generate" disabled={segmentBusy !== null} onClick={() => generateSegment(idx)}>
                        {segmentBusy === idx ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}
                        {segments[idx] ? '重新生成' : '生成'}
                      </button>
                      {segments[idx] ? <button type="button" className="pbv2-ghost" onClick={() => setSegment(idx, '')}><Trash2 size={14} /></button> : null}
                    </span>
                  </div>
                ))}
              </section>
            </div>
          )}
        </section>
      </div>

      {gameOverlay}
    </main>
  );
}

export default MusicStudioPage;
