import React from 'react';
import {
  ArrowLeft, ChevronRight, Clock, Loader2, Music, Pencil, Plus,
  RefreshCw, Save, Search, Sparkles, Trash2, Wand2, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  createCreativeWork, deleteCreativeWork, generateCreativeWorkExercises,
  generateCreativeWorkLyricLine, generateCreativeWorkSong, getCreativeWorks, renderCreativeWork, updateCreativeWork,
} from './workshopStorage';
import '../picture-book/PictureBookStudioPage.css';
import './creativeWorkshop.css';

const MODULE_ID = 'music-star-quest';
const MODULE_NAME = '星光录音棚';
// 制作步骤与授课模式的四个关卡一一对应：2~5 步分别是第一~四关（练习 + 该关教案），序号见步骤圆标
const STEPS = ['stepBasic', 'stepSong', 'stepStage1', 'stepStage2', 'stepStage3', 'stepStage4'];
const STAGE_STEPS = { 1: 2, 2: 3, 3: 4, 4: 5 };
const ACCENT = '#9966d0';


const initialBasicInfo = { goals: '', theme: '', age: '', level: '', style: '', duration: '', structure: '', requirements: '' };
const initialSong = { title: '', songMeta: {}, lyrics: [], targetPatterns: [] };
const DEFAULT_ACTIONS = ['👏 Clap', '👋 Wave', '👣 Stomp', '🌀 Spin', '🚶 March', '🤏 Snap', '🫶 Heart', '➜ Point', '🕺 Twist', '🫨 Shake', '👐 Swing'];
const DEFAULT_INSTRUMENTS = ['Bell', 'Bongo', 'Cabasa', 'Castanets', 'Djembe', 'Drum', 'Handbell', 'Hand Drum', 'Maracas', 'Sleigh Bell', 'Tambourine', 'Xylophone', 'Finger Cym.', 'Triangle', 'Woodblock'];
const initialExercises = {
  ex1FillData: [], ex2Items: [], ex3Data: [], starRoles: [], teachingPlans: {},
  melodyActions: DEFAULT_ACTIONS,
  melodyInstruments: DEFAULT_INSTRUMENTS,
  echoData: { intermediate: [], challenge: [] },
};
const STAGE_TITLES = { 1: 'Lyric Hunter', 2: 'Melody Mover', 3: 'Echo Master', 4: 'Star Studio' };
// 第四关角色（与游戏模板 recordMarks 一致）
const STAR_ROLE_OPTIONS = [{ value: 'all' }, { value: 'teacher' }, { value: 'student' }, { value: 'solo' }];

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
async function generateSegmentAudio({ prompt, duration, maxDuration = 15 }) {
  const submit = await fetch('/api/ai/generate-audio', {
    method: 'POST',
    headers: authJsonHeaders(),
    body: JSON.stringify({ prompt, count: 1, duration: clamp(Math.round(duration) || 5, 3, maxDuration) }),
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
        {options.map((option) => {
          const opt = typeof option === 'string' ? { value: option, label: option } : option;
          return (
            <button type="button" key={opt.value} className={value === opt.value ? 'is-active' : ''} onClick={() => onChange(opt.value)}>
              {opt.label}
            </button>
          );
        })}
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

const fillToFullText = (item) => {
  let blank = 0;
  return (item?.sentence || []).map((part) => part === '' ? (item?.blanks?.[blank++] || '') : part).join('');
};
const lyricIndexForText = (lyrics, text) => lyrics.findIndex((row) => row.text === text);
const uniqueWords = (text) => Array.from(new Set(String(text || '').match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || []));
const escapeRegExp = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const makeFillItem = (lyricText, selectedWords, previous = {}) => {
  const wanted = selectedWords.filter(Boolean);
  if (!wanted.length) return { ...previous, lyricText, sentence: [lyricText], blanks: [], options: [] };
  const matcher = new RegExp(`\\b(${wanted.map(escapeRegExp).join('|')})\\b`, 'gi');
  const blanks = [];
  const sentence = [];
  let lastIndex = 0;
  lyricText.replace(matcher, (match, _group, offset) => {
    const before = lyricText.slice(lastIndex, offset);
    if (before) sentence.push(before);
    sentence.push('');
    blanks.push(match);
    lastIndex = offset + match.length;
    return match;
  });
  const after = lyricText.slice(lastIndex);
  if (after) sentence.push(after);
  return { ...previous, lyricText, sentence, blanks, options: Array.from(new Set([...blanks, ...(previous.options || [])])).slice(0, 6) };
};

function LyricSelect({ lyrics, value, onChange, label }) {
  return (
    <label className="pbv2-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
        <option value={-1}>—</option>
        {lyrics.map((row, idx) => <option key={`${idx}-${row.text}`} value={idx}>{idx + 1}. {row.text}</option>)}
      </select>
    </label>
  );
}

// ── 歌词编辑器（step 2）─────────────────────────────────────
function LyricsEditor({ lyrics, onGenerateLine, onChange }) {
  const { t } = useTranslation();
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
      } catch {
        window.alert(t('musicStudio.lyricsParseFail'));
      }
    };
    reader.readAsText(file, 'utf-8');
    if (fileRef.current) fileRef.current.value = '';
  };
  return (
    <section className="pbv2-card pbv2-tone-blue">
      <div className="cw-section-title">
        <div className="pbv2-card-title">{t('musicStudio.lyricsTimeline')}</div>
        <button type="button" className="pbv2-ghost" onClick={() => fileRef.current?.click()}>{t('musicStudio.uploadLyrics')}</button>
        <input ref={fileRef} type="file" accept=".lrc,.txt,text/plain" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>
      <p className="yoga-design-hint">{t('musicStudio.lyricsHint')}</p>
      {lyrics.map((row, idx) => (
        <div key={idx} className="cw-lyric-row">
          <input
            className="cw-lyric-time"
            style={{ width: 110 }}
            value={row.time || ''}
            onChange={(e) => updateRow(idx, { time: e.target.value })}
            placeholder="mm:ss–mm:ss"
            title={t('musicStudio.timeTitle')}
          />
          <span className="cw-lyric-text cw-lyric-text-readonly">{row.text || t('musicStudio.notGenerated')}</span>
          <input
            className="cw-lyric-keywords"
            value={keywords[idx] || ''}
            onChange={(e) => setKeywords((prev) => ({ ...prev, [idx]: e.target.value }))}
            placeholder={t('musicStudio.keywordPlaceholder')}
          />
          <button type="button" className="pbv2-ghost cw-lyric-generate" disabled={generatingIndex !== null} onClick={() => generate(idx)}>
            {generatingIndex === idx ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}
            {row.text ? t('musicStudio.regen') : t('musicStudio.generate')}
          </button>
        </div>
      ))}
    </section>
  );
}

// ── 练习编辑器（step 3）─────────────────────────────────────
function AiSectionButton({ loading, hasContent, onClick }) {
  const { t } = useTranslation();
  return (
    <button type="button" className="pbv2-ghost cw-section-ai" disabled={loading} onClick={onClick}>
      {loading ? <Loader2 className="spin" size={14} /> : <Sparkles size={14} />}
      {loading ? t('musicStudio.aiGenerating') : (hasContent ? t('musicStudio.aiRegen') : t('musicStudio.aiGenerate'))}
    </button>
  );
}

function FillEditor({ items, lyrics, onChange, onGenerate, generating }) {
  const { t } = useTranslation();
  const update = (idx, patch) => onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  return (
    <section className="pbv2-card pbv2-tone-yellow">
      <div className="cw-section-title"><div className="pbv2-card-title">{t('musicStudio.ex1Title')}</div><AiSectionButton loading={generating} hasContent={items.length > 0} onClick={onGenerate} /></div>
      {items.map((item, idx) => (
        <div key={idx} className="cw-exercise-item">
          <div className="cw-exercise-head"><span>{t('musicStudio.questionN', { n: idx + 1 })}</span><button type="button" onClick={() => remove(idx)}><Trash2 size={13} /></button></div>
          <div className="cw-exercise-grid">
            <LyricSelect lyrics={lyrics} label={t('musicStudio.selectLyric')} value={lyricIndexForText(lyrics, item.lyricText || fillToFullText(item))} onChange={(li) => {
              const text = lyrics[li]?.text || '';
              update(idx, makeFillItem(text, [], item));
            }} />
            <label className="pbv2-field"><span>{t('musicStudio.selectBlankWords')}</span><div className="cw-word-picker">
              {uniqueWords(item.lyricText || fillToFullText(item)).map((word) => {
                const active = (item.blanks || []).some((blank) => blank.toLowerCase() === word.toLowerCase());
                return <button key={word} type="button" className={active ? 'is-active' : ''} onClick={() => {
                  const selected = active ? (item.blanks || []).filter((w) => w.toLowerCase() !== word.toLowerCase()) : [...(item.blanks || []), word];
                  update(idx, makeFillItem(item.lyricText || fillToFullText(item), selected, item));
                }}>{word}</button>;
              })}
            </div></label>
            <Field label={t('musicStudio.optionsLabel')} value={(item.options || []).join(', ')} onChange={(v) => update(idx, { options: v.split(/[,，]/).map((s) => s.trim()).filter(Boolean) })} />
            <Field label="emoji" value={item.emoji || ''} onChange={(v) => update(idx, { emoji: v })} />
          </div>
        </div>
      ))}
      <button type="button" className="pbv2-add-page" onClick={() => onChange([...items, { sentence: ['', ''], blanks: [''], options: [], emoji: '🎵' }])}>
        <Plus size={16} /> {t('musicStudio.addFill')}
      </button>
    </section>
  );
}

function ScrambleEditor({ items, lyrics, onChange, onGenerate, generating }) {
  const { t } = useTranslation();
  const update = (idx, patch) => onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  return (
    <section className="pbv2-card pbv2-tone-green">
      <div className="cw-section-title"><div className="pbv2-card-title">{t('musicStudio.ex2Title')}</div><AiSectionButton loading={generating} hasContent={items.length > 0} onClick={onGenerate} /></div>
      {items.map((item, idx) => (
        <div key={idx} className="cw-exercise-item">
          <div className="cw-exercise-head"><span>{t('musicStudio.questionN', { n: idx + 1 })}</span><button type="button" onClick={() => remove(idx)}><Trash2 size={13} /></button></div>
          <LyricSelect lyrics={lyrics} label={t('musicStudio.selectLyric')} value={lyricIndexForText(lyrics, item.answer)} onChange={(li) => {
            const answer = lyrics[li]?.text || '';
            update(idx, { answer, words: answer.trim().split(/\s+/).filter(Boolean) });
          }} />
        </div>
      ))}
      <button type="button" className="pbv2-add-page" onClick={() => onChange([...items, { answer: '', words: [] }])}>
        <Plus size={16} /> {t('musicStudio.addScramble')}
      </button>
    </section>
  );
}

function ListenEditor({ items, lyrics, onChange, onGenerate, generating }) {
  const { t } = useTranslation();
  const update = (idx, patch) => onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  const updateOption = (idx, oi, value) => update(idx, { options: items[idx].options.map((o, i) => (i === oi ? value : o)) });
  return (
    <section className="pbv2-card pbv2-tone-coral">
      <div className="cw-section-title"><div className="pbv2-card-title">{t('musicStudio.ex3Title')}</div><AiSectionButton loading={generating} hasContent={items.length > 0} onClick={onGenerate} /></div>
      {items.map((item, idx) => (
        <div key={idx} className="cw-exercise-item">
          <div className="cw-exercise-head">
            <span>{t('musicStudio.questionN', { n: idx + 1 })} · {t('musicStudio.correctSentence')}
              <select value={item.correct ?? 0} onChange={(e) => update(idx, { correct: Number(e.target.value) })}>
                {(item.options || []).map((_, i) => <option key={i} value={i}>{t('musicStudio.optionN', { n: i + 1 })}</option>)}
              </select>
            </span>
            <input style={{ width: 110 }} placeholder="00:13–00:14" value={item.time || ''} onChange={(e) => update(idx, { time: e.target.value })} title={t('musicStudio.timeTitleEx3')} />
            <button type="button" onClick={() => remove(idx)}><Trash2 size={13} /></button>
          </div>
          <LyricSelect lyrics={lyrics} label={t('musicStudio.selectCorrectLyric')} value={lyricIndexForText(lyrics, item.options?.[item.correct ?? 0])} onChange={(li) => {
            const row = lyrics[li];
            if (!row) return;
            const correct = item.correct ?? 0;
            const options = [...(item.options || ['', '', ''])];
            options[correct] = row.text;
            update(idx, { options, time: row.time });
          }} />
          {(item.options || []).map((opt, oi) => (
            <Field key={oi} label={t('musicStudio.optionLabel', { n: oi + 1 }) + (item.correct === oi ? t('musicStudio.correctTag') : '')} value={opt} onChange={(v) => updateOption(idx, oi, v)} />
          ))}
        </div>
      ))}
      <button type="button" className="pbv2-add-page" onClick={() => onChange([...items, { question: 'Choose the sentence you hear:', options: ['', '', ''], correct: 0 }])}>
        <Plus size={16} /> {t('musicStudio.addListen')}
      </button>
    </section>
  );
}

function EditablePool({ title, hint, items, onChange, placeholder }) {
  const { t } = useTranslation();
  const update = (idx, value) => onChange(items.map((item, i) => i === idx ? value : item));
  return (
    <section className="pbv2-card pbv2-tone-green">
      <div className="pbv2-card-title">{title}</div>
      <p className="yoga-design-hint">{hint}</p>
      <div className="cw-pool-editor">
        {items.map((item, idx) => <div key={idx}><input value={item} onChange={(e) => update(idx, e.target.value)} /><button type="button" onClick={() => onChange(items.filter((_, i) => i !== idx))}><Trash2 size={13} /></button></div>)}
      </div>
      <button type="button" className="pbv2-add-page" onClick={() => onChange([...items, ''])}><Plus size={16} /> {t('musicStudio.addItem', { item: placeholder })}</button>
    </section>
  );
}

function echoPreviewText(text, mode, words) {
  if (mode === 'beginner') return text;
  const targets = new Set((Array.isArray(words) ? words : []).map((word) => String(word).toLowerCase()));
  return String(text || '').split(' ').map((word) => {
    const clean = word.replace(/[^a-zA-Z']/g, '');
    const suffix = word.replace(/[a-zA-Z']/g, '');
    if (!clean || !targets.has(clean.toLowerCase())) return word;
    if (mode === 'intermediate') return `${'_'.repeat(clean.length)}${suffix}`;
    return `${clean[0]}${'_'.repeat(Math.max(0, clean.length - 1))}${suffix}`;
  }).join(' ');
}

function EchoMasterPreview({ lyrics, audio, echoData, onGenerate, generating }) {
  const { t } = useTranslation();
  const [mode, setMode] = React.useState('beginner');
  const failures = new Set(Array.isArray(audio?.segmentFailures) ? audio.segmentFailures : []);
  const segments = Array.isArray(audio?.segments) ? audio.segments : [];
  const hasEchoData = Boolean((echoData?.intermediate?.length || 0) + (echoData?.challenge?.length || 0));
  const maskedWords = (idx) => {
    if (mode === 'intermediate') return echoData?.intermediate?.[idx] || [];
    if (mode === 'challenge') return echoData?.challenge?.[idx] || [];
    return [];
  };
  const modes = [
    { value: 'beginner', label: '⭐ Beginner', detail: 'Full Lyrics' },
    { value: 'intermediate', label: '⭐⭐ Intermediate', detail: 'Partial Blanks' },
    { value: 'challenge', label: '⭐⭐⭐ Challenge', detail: 'First Letter Only' },
  ];
  return (
    <section className="pbv2-card pbv2-tone-yellow cw-echo-preview">
      <div className="cw-section-title">
        <div className="pbv2-card-title">{t('musicStudio.echoPreviewTitle')}</div>
        <AiSectionButton loading={generating} hasContent={hasEchoData} onClick={onGenerate} />
      </div>
      <p className="yoga-design-hint">{t('musicStudio.echoPreviewHint')}</p>
      <p className="yoga-design-hint">{t('musicStudio.echoGenerateHint')}</p>
      <div className="cw-echo-modes">
        {modes.map((item) => (
          <button key={item.value} type="button" className={mode === item.value ? 'is-active' : ''} onClick={() => setMode(item.value)}>
            <strong>{item.label}</strong><small>{item.detail}</small>
          </button>
        ))}
      </div>
      <div className="cw-echo-preview-lines">
        {lyrics.map((row, idx) => {
          const failed = failures.has(idx);
          const segment = segments[idx];
          return (
            <div key={`${idx}-${row.time}`} className={`cw-echo-preview-line${failed ? ' is-failed' : ''}`}>
              <span className="cw-lyric-time">{row.time || '--:--'}</span>
              <strong>{echoPreviewText(row.text, mode, maskedWords(idx))}</strong>
              {failed ? <span className="cw-echo-audio-status is-failed">{t('musicStudio.segmentAudioFailed')}</span>
                : segment ? <audio controls preload="none" src={segment} />
                  : <span className="cw-echo-audio-status">{t('musicStudio.segmentAudioPending')}</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── 第四关 Stage Star 分工编辑器（step 3）────────────────────
function StarRolesEditor({ lyrics, roles, onChange, onGenerate, generating }) {
  const { t } = useTranslation();
  const roleOf = (idx) => STAR_ROLE_OPTIONS.some((r) => r.value === roles[idx]) ? roles[idx] : 'all';
  const setRole = (idx, value) => onChange(lyrics.map((_, i) => (i === idx ? value : roleOf(i))));
  return (
    <section className="pbv2-card pbv2-tone-green">
      <div className="cw-section-title">
        <div className="pbv2-card-title">{t('musicStudio.ex4Title')}</div>
        <AiSectionButton loading={generating} hasContent={roles.length > 0} onClick={onGenerate} />
      </div>
      <p className="yoga-design-hint">{t('musicStudio.rolesHint')}</p>
      {lyrics.length === 0 && <p className="yoga-design-hint">{t('musicStudio.needLyricsFirst')}</p>}
      {lyrics.map((row, idx) => (
        <div key={idx} className="cw-lyric-row">
          <span className="cw-lyric-time">{row.time || '--:--'}</span>
          <span className="cw-lyric-text cw-lyric-text-readonly">{row.text || t('musicStudio.notGenerated')}</span>
          <span className="cw-star-role-picker">
            {STAR_ROLE_OPTIONS.map((r) => {
              const roleLabel = t('musicStudio.role_' + r.value);
              return (
                <button
                  key={r.value}
                  type="button"
                  className={`cw-star-role-chip${roleOf(idx) === r.value ? ' is-active' : ''}`}
                  onClick={() => setRole(idx, r.value)}
                  title={roleLabel}
                >
                  {roleLabel}
                </button>
              );
            })}
          </span>
        </div>
      ))}
    </section>
  );
}

function PlansEditor({ plans, onChange, onGenerate, generating, stage }) {
  const { t } = useTranslation();
  const stages = ['1', '2', '3', '4'];
  const [activeStage, setActiveStage] = React.useState('1');
  const currentStage = stage || activeStage;
  const updateStage = (key, patch) => onChange({ ...plans, [key]: { ...(plans[key] || {}), ...patch } });
  const updateSection = (key, si, patch) => {
    const sections = (plans[key]?.sections || []).map((s, i) => (i === si ? { ...s, ...patch } : s));
    updateStage(key, { sections });
  };
  return (
    <section className="pbv2-card pbv2-tone-blue">
      <div className="cw-section-title"><div className="pbv2-card-title">{stage ? t('musicStudio.planTitleStage', { stage }) : t('musicStudio.planTitleAll')}</div><AiSectionButton loading={generating} hasContent={Boolean(plans?.[currentStage])} onClick={onGenerate} /></div>
      {!stage && (
        <div className="cw-stage-tabs" role="tablist" aria-label={t('musicStudio.planTabsAria')}>
          {stages.map((key, index) => (
            <button key={key} type="button" role="tab" aria-selected={activeStage === key} className={activeStage === key ? 'is-active' : ''} onClick={() => setActiveStage(key)}>
              {t('musicStudio.planTab', { n: index + 1 })}<small>{STAGE_TITLES[key]}</small>
            </button>
          ))}
        </div>
      )}
      {(() => {
        const plan = plans[currentStage] || { title: '', sections: [] };
        return (
          <div className="cw-plan-stage" role="tabpanel">
            <h4>{t('musicStudio.planHeading', { stage: currentStage, name: STAGE_TITLES[currentStage] })} · {plan.title || t('musicStudio.unnamedPlan')}</h4>
            <Field label={t('musicStudio.planTitleLabel')} value={plan.title || ''} onChange={(v) => updateStage(currentStage, { title: v })} />
            {(plan.sections || []).map((section, si) => (
              <div key={si} className="cw-plan-section">
                <Field label={t('musicStudio.sectionTitleLabel', { n: si + 1 })} value={section.title || ''} onChange={(v) => updateSection(currentStage, si, { title: v })} />
                <Field area label={t('musicStudio.contentLabel')} value={section.content || ''} onChange={(v) => updateSection(currentStage, si, { content: v })} />
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
  const { t } = useTranslation();
  const inputRef = React.useRef(null);
  const handleFile = (file) => {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { window.alert(t('musicStudio.audioTooLarge')); return; }
    const reader = new FileReader();
    reader.onload = () => onPick({ dataUri: String(reader.result || ''), name: file.name });
    reader.readAsDataURL(file);
  };
  return (
    <div className={`cw-audio-card${dataUri ? ' has' : ''}`}>
      <h4>{label}{dataUri ? ' · ' + t('musicStudio.uploaded') : ' · ' + t('musicStudio.notUploaded')}</h4>
      {dataUri ? (
        <>
          <audio controls src={dataUri} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="pbv2-ghost" onClick={() => inputRef.current?.click()}>{t('musicStudio.reupload')}</button>
            <button type="button" className="pbv2-ghost" onClick={onRemove}><Trash2 size={14} /> {t('musicStudio.remove')}</button>
          </div>
        </>
      ) : (
        <button type="button" className="pbv2-ghost" onClick={() => inputRef.current?.click()}>{t('musicStudio.pickMp3')}</button>
      )}
      {name && <small style={{ color: '#818997' }}>{name}</small>}
      <input ref={inputRef} type="file" accept="audio/mpeg,.mp3" hidden onChange={(e) => handleFile(e.target.files?.[0])} />
    </div>
  );
}

export function MusicStudioPage() {
  const { t } = useTranslation();
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
  const [promptOpen, setPromptOpen] = React.useState(false);
  const [promptText, setPromptText] = React.useState('');
  const promptActionRef = React.useRef(null);

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
      melodyActions: Array.isArray(r.melodyActions) ? r.melodyActions : DEFAULT_ACTIONS,
      melodyInstruments: Array.isArray(r.melodyInstruments) ? r.melodyInstruments : DEFAULT_INSTRUMENTS,
      echoData: r.echoData ? {
        intermediate: Array.isArray(r.echoData.intermediate) ? r.echoData.intermediate : [],
        challenge: Array.isArray(r.echoData.challenge) ? r.echoData.challenge : [],
      } : { intermediate: [], challenge: [] },
    });
    setAudio(r.audio || {});
    setRendered(Boolean(work.hasHtml));
    setMessage('');
    const exercisesComplete = hasCompleteExercises(r);
    setStep(r.lyrics?.length ? (exercisesComplete ? STAGE_STEPS[4] : STAGE_STEPS[1]) : 0);
    setView('studio');
    if (r.lyrics?.length && !exercisesComplete) {
      setExGenerating(true);
      generateCreativeWorkExercises(work.id)
        .then((data) => setExercises({ ...initialExercises, ...data }))
        .catch((err) => setMessage(err.message || t('musicStudio.exercisesGenFail')))
        .finally(() => setExGenerating(false));
    }
  };

  const createWork = async () => {
    try {
      const work = await createCreativeWork({ moduleId: MODULE_ID, moduleName: MODULE_NAME, title: t('musicStudio.untitledWorkTitle'), parameters: initialBasicInfo });
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
      window.alert(err.message || t('musicStudio.createFailed'));
    }
  };

  const backToList = () => { setEditing(null); setView('list'); loadWorks(); };

  const persist = async (payload) => {
    const id = editingIdRef.current;
    if (!id) return;
    setSaving(true);
    try {
      await updateCreativeWork(id, payload);
      setSaveState(t('musicStudio.savedAt', { time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) }));
    } catch (err) {
      setSaveState(t('musicStudio.saveFailedShort'));
      setMessage(err.message || t('musicStudio.saveFailed'));
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
      const nextSong = { title: data.title || '', songMeta: data.song?.songMeta || {}, lyrics: data.song?.lyrics || [], targetPatterns: data.song?.targetPatterns || [] };
      setSong(nextSong);
      if (data.title) setWorkTitle(data.title);
      setStep(1);
      await generateAllSegments(nextSong, data.title || basicInfo.theme);
    } catch (err) {
      setMessage(err.message || t('musicStudio.songGenFail'));
    } finally {
      setSongGenerating(false);
    }
  };

  // ── step 1：歌曲编辑 ──────────────────────────────────────
  const regenerateSong = async (adjustment) => {
    const id = editingIdRef.current;
    if (!id || songGenerating) return;
    setSongGenerating(true);
    setMessage('');
    try {
      await updateCreativeWork(id, { parameters: basicInfo });
      const data = await generateCreativeWorkSong(id, adjustment);
      const nextSong = { title: data.title || '', songMeta: data.song?.songMeta || {}, lyrics: data.song?.lyrics || [], targetPatterns: data.song?.targetPatterns || [] };
      setSong(nextSong);
      if (data.title) setWorkTitle(data.title);
      await generateAllSegments(nextSong, data.title || basicInfo.theme);
    } catch (err) {
      setMessage(err.message || t('musicStudio.songGenFail'));
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
      setSaveState(t('musicStudio.lineSaved'));
    } catch (err) {
      setMessage(err.message || t('musicStudio.lineGenFail'));
      throw err;
    }
  };

  const saveSong = async () => {
    await persist({ title: song.title || workTitle, song, audio });
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
      setMessage(err.message || t('musicStudio.exGenFail'));
    } finally {
      setExGenerating(false);
    }
  };

  const generateExerciseSection = async (section, adjustment) => {
    const id = editingIdRef.current;
    if (!id || sectionGenerating || exGenerating) return;
    setSectionGenerating(section);
    setMessage('');
    try {
      await persist({ song, title: song.title || workTitle });
      const data = await generateCreativeWorkExercises(id, section, adjustment);
      setExercises((current) => ({ ...current, ...data }));
      setSaveState(t('musicStudio.sectionSaved'));
    } catch (err) {
      setMessage(err.message || t('musicStudio.sectionGenFail'));
    } finally {
      setSectionGenerating('');
    }
  };

  const openAdjustPrompt = (action) => {
    promptActionRef.current = action;
    setPromptText('');
    setPromptOpen(true);
  };
  const confirmAdjustPrompt = async () => {
    const action = promptActionRef.current;
    promptActionRef.current = null;
    setPromptOpen(false);
    if (!action) return;
    await action(promptText.trim());
  };
  const requestSongRegen = () => openAdjustPrompt(regenerateSong);
  const requestSectionRegen = (section) => openAdjustPrompt((adjustment) => generateExerciseSection(section, adjustment));

  const saveExercises = async (nextStep) => {
    await persist({ exercises });
    setStep(nextStep);
  };

  // ── step 3：音频与课件 ────────────────────────────────────
  const generateAllSegments = async (songOverride, titleOverride) => {
    if (segmentBusy) return;
    const activeSong = songOverride?.lyrics ? songOverride : song;
    const activeTitle = titleOverride || activeSong.title || workTitle || 'Music Star Quest';
    const targets = activeSong.lyrics.map((row, idx) => ({ row, idx })).filter(({ row }) => row.text);
    if (!targets.length) { setMessage(t('musicStudio.noLyricsForAudio')); return; }
    setSegmentBusy('all');
    setMessage('');
    const nextSegments = activeSong.lyrics.map(() => '');
    const failed = [];
    try {
      for (let n = 0; n < targets.length; n++) {
        const { row, idx } = targets[n];
        setMessage(t('musicStudio.segProgress', { done: n + 1, total: targets.length }));
        const range = parseTimeRange(row.time);
        try {
          nextSegments[idx] = await generateSegmentAudio({
            prompt: `儿童英语教学歌曲《${activeTitle}》的一个分段。风格：${basicInfo.style || '欢快'}，清脆童声、节奏明快。只唱这一句歌词："${row.text}"，不要添加其他歌词或念白。`,
            duration: range ? range.end - range.start : 5,
          });
        } catch (err) {
          console.error(`分段 ${idx + 1} 生成失败:`, err);
          failed.push(idx + 1);
        }
      }
      if (failed.length) {
        const partialAudio = {
          ...audio,
          vocal: '',
          vocalName: '',
          segments: nextSegments,
          segmentFailures: failed.map((lineNumber) => lineNumber - 1),
        };
        setAudio(partialAudio);
        await persist({ audio: partialAudio, song: activeSong, title: activeTitle });
        throw new Error(t('musicStudio.fullSongPartialFail', { lines: failed.join(', ') }));
      }
      const merged = mergeMp3DataUris(nextSegments);
      if (!merged) throw new Error(t('musicStudio.noSegsToMerge'));
      setMessage(t('musicStudio.generatingBacking'));
      const lastRange = [...activeSong.lyrics].reverse().map((row) => parseTimeRange(row.time)).find(Boolean);
      const backingDuration = lastRange?.end || Math.max(30, activeSong.lyrics.length * 3);
      const backing = await generateSegmentAudio({
        prompt: `儿童英语教学歌曲《${activeTitle}》的纯伴奏。风格：${basicInfo.style || '欢快'}，适合儿童课堂演唱，旋律清晰、节奏稳定。严格不要人声、歌词、念白或合唱。`,
        duration: backingDuration,
        maxDuration: 120,
      });
      const nextAudio = { ...audio, segments: nextSegments, segmentFailures: [], vocal: merged, vocalName: t('musicStudio.aiFullSongName'), backing, backingName: t('musicStudio.aiBackingName') };
      setAudio(nextAudio);
      await persist({ audio: nextAudio, song: activeSong, title: activeTitle });
      setMessage('');
      setSaveState(t('musicStudio.aiFullSongReady'));
    } catch (err) {
      setMessage(err.message || t('musicStudio.fullSongFail'));
    } finally {
      setSegmentBusy(null);
    }
  };

  // 进入第四关 / 音频发生变化后，自动（重新）渲染课件，无需额外的第七步
  const lastRenderedAudioRef = React.useRef('');
  const renderTimerRef = React.useRef(null);
  React.useEffect(() => {
    if (step !== STAGE_STEPS[4]) return;
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
      setSaveState(t('musicStudio.coursewareReady'));
      return data;
    } catch (err) {
      setMessage(err.message || t('musicStudio.coursewareFail'));
      return null;
    } finally {
      setRendering(false);
    }
  };

  // 授课模式：课件 HTML 由 render 接口返回，转 Blob URL 后在新窗口打开（无独立查看/下载后端路由）
  const gameHtmlUrlRef = React.useRef(null);
  const applyGameHtml = (html) => {
    if (gameHtmlUrlRef.current) URL.revokeObjectURL(gameHtmlUrlRef.current);
    gameHtmlUrlRef.current = html ? URL.createObjectURL(new Blob([html], { type: 'text/html' })) : null;
    return gameHtmlUrlRef.current;
  };
  React.useEffect(() => () => { if (gameHtmlUrlRef.current) URL.revokeObjectURL(gameHtmlUrlRef.current); }, []);

  // 弹窗必须在用户手势内同步打开，取到课件后再定向，避免被浏览器拦截
  const openGameWindow = (win, url) => {
    if (!win) { setMessage(t('musicStudio.popupBlocked')); return false; }
    try { win.document.title = 'Music Star Quest'; } catch { /* about:blank 跨窗口写入失败可忽略 */ }
    win.location.href = url;
    return true;
  };

  // 列表卡片「授课」：hasHtml 时按已存数据重渲染取回 HTML，新窗口打开
  const presentFromList = (work) => {
    if (!work.hasHtml) return;
    const win = window.open('', '_blank');
    setMessage('');
    renderCreativeWork(work.id)
      .then((data) => {
        const url = applyGameHtml(data?.html);
        if (!url) throw new Error(t('musicStudio.coursewareEmpty'));
        openGameWindow(win, url);
      })
      .catch((err) => {
        if (win) win.close();
        setMessage(err.message || t('musicStudio.coursewareLoadFail'));
      });
  };
  const presentCurrent = async () => {
    const id = editingIdRef.current;
    if (!id) return;
    // 已有 Blob（本会话渲染过）直接开新窗口；否则按已存数据重渲染
    if (gameHtmlUrlRef.current) { window.open(gameHtmlUrlRef.current, '_blank'); return; }
    const data = await renderCreativeWork(id).catch(() => null);
    const url = applyGameHtml(data?.html);
    if (url) window.open(url, '_blank');
  };

  const remove = async (id) => {
    if (!window.confirm(t('musicStudio.confirmDelete'))) return;
    try {
      await deleteCreativeWork(id);
      setWorks((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      window.alert(err.message || t('musicStudio.deleteFailed'));
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
                <h1>{t('musicStudio.moduleName')}</h1>
                <p>{t('musicStudio.listSubtitle')}</p>
              </div>
            </div>
            <div className="pbv2-topbar-actions">
              <button type="button" className="pbv2-back-btn" onClick={() => navigate('/workshop/english-plus')}>
                <ArrowLeft size={16} /> {t('musicStudio.back')}
              </button>
              <button type="button" className="pbv2-create-btn" onClick={createWork}>
                <Plus size={18} /> {t('musicStudio.newWork')}
              </button>
            </div>
          </header>

          <div className="pbv2-list-toolbar">
            <div className="pbv2-search-box">
              <Search size={16} />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('musicStudio.searchPlaceholder')} />
            </div>
          </div>

          {message && <div className="pbv2-message">{message}</div>}

          {listLoading ? (
            <div className="pbv2-list-loading"><Loader2 className="spin" size={28} /></div>
          ) : filtered.length === 0 ? (
            <div className="pbv2-list-empty">
              <Music size={48} />
              <p>{searchTerm ? t('musicStudio.noMatch') : t('musicStudio.emptyList')}</p>
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
                        {work.hasHtml ? t('musicStudio.statusDone') : (lyricCount ? t('musicStudio.statusInProgress') : t('musicStudio.statusDraft'))}
                      </span>
                    </div>
                    <div className="pbv2-book-info">
                      <h3>{work.title || t('musicStudio.untitled')}</h3>
                      <div className="pbv2-book-meta">
                        <Clock size={13} />
                        <span>{work.parameters?.age || ''}{work.parameters?.duration ? ` · ${work.parameters.duration}` : ''}</span>
                        <span>·</span>
                        <span>{work.updatedAt ? new Date(work.updatedAt).toLocaleDateString() : ''}</span>
                      </div>
                      <div className="pbv2-book-actions">
                        <button type="button" onClick={(e) => { e.stopPropagation(); openWork(work); }}>
                          <Pencil size={14} /> {t('musicStudio.edit')}
                        </button>
                        {work.hasHtml && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); presentFromList(work); }}>
                            🖥️ {t('common.teach')}
                          </button>
                        )}
                        <button type="button" onClick={(e) => { e.stopPropagation(); remove(work.id); }}>
                          <Trash2 size={14} /> {t('musicStudio.delete')}
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

  // ── 工作室视图（7 步，与授课四关对应）──────────────────────
  return (
    <main className="picture-book-studio-v2">
      <header className="pbv2-topbar">
        <div className="pbv2-topbar-left">
          <div className="pbv2-topbar-icon"><Music size={28} /></div>
          <div>
            <h1>{workTitle || t('musicStudio.newCourseware')}</h1>
            <p>{t('musicStudio.studioSubtitle')}</p>
          </div>
        </div>
        <div className="pbv2-topbar-actions">
          <span className={`pbv2-save-state ${saveState === t('musicStudio.saveFailedShort') ? 'is-error' : ''}`}>{saveState}</span>
          <button type="button" className="pbv2-back-btn" onClick={backToList}>
            <ArrowLeft size={16} /> {t('musicStudio.backToList')}
          </button>
        </div>
      </header>

      <div className="pbv2-shell">
        <aside className="pbv2-steps cw-steps-seven">
          <div className="cw-steps-row">
            {STEPS.slice(0, 4).map((label, index) => (
              <button type="button" key={label} className={`${step === index ? 'is-active' : ''} ${step > index ? 'is-done' : ''}`} onClick={() => enterStep(index)}>
                <span>{index + 1}</span>
                <strong>{t('musicStudio.' + label)}</strong>
              </button>
            ))}
          </div>
          <div className="cw-steps-row">
            {STEPS.slice(4).map((label, index) => (
              <button type="button" key={label} className={`${step === index + 4 ? 'is-active' : ''} ${step > index + 4 ? 'is-done' : ''}`} onClick={() => enterStep(index + 4)}>
                <span>{index + 5}</span>
                <strong>{t('musicStudio.' + label)}</strong>
              </button>
            ))}
          </div>
        </aside>

        <section className={`pbv2-workspace pbv2-workspace-step-${step}`}>
          {message && <div className="pbv2-message">{message}</div>}

          {/* step 1 · 基本信息 */}
          {step === 0 && (
            <div className="pbv2-step-panel">
              <div className="pbv2-form-grid two">
                <OptionGroup required label={t('musicStudio.ageLabel')} options={[{ value: '4–6 岁', label: t('musicStudio.age4to6') }, { value: '7–10 岁', label: t('musicStudio.age7to10') }, { value: '11–14 岁', label: t('musicStudio.age11to14') }]} value={basicInfo.age} onChange={(v) => setBasicInfo({ ...basicInfo, age: v })} tone="coral" />
                <OptionGroup required label={t('musicStudio.levelLabel')} options={[{ value: '初级', label: t('musicStudio.levelBeginner') }, { value: '中级', label: t('musicStudio.levelIntermediate') }, { value: '高级', label: t('musicStudio.levelAdvanced') }]} value={basicInfo.level} onChange={(v) => setBasicInfo({ ...basicInfo, level: v })} tone="blue" />
                <OptionGroup label={t('musicStudio.styleLabel')} options={[{ value: '欢快', label: t('musicStudio.styleCheerful') }, { value: '舒缓', label: t('musicStudio.styleSoothing') }, { value: '节奏感强', label: t('musicStudio.styleRhythmic') }]} value={basicInfo.style} onChange={(v) => setBasicInfo({ ...basicInfo, style: v })} tone="yellow" />
                <OptionGroup label={t('musicStudio.durationLabel')} options={[{ value: '短 (30-60s)', label: t('musicStudio.durShort') }, { value: '中 (60-90s)', label: t('musicStudio.durMedium') }, { value: '长 (90-120s)', label: t('musicStudio.durLong') }]} value={basicInfo.duration} onChange={(v) => setBasicInfo({ ...basicInfo, duration: v })} tone="green" />
                <OptionGroup label={t('musicStudio.structLabel')} options={[{ value: '简单重复', label: t('musicStudio.structSimple') }, { value: '主歌+副歌', label: t('musicStudio.structVerseChorus') }, { value: '主歌+副歌+桥段', label: t('musicStudio.structFull') }]} value={basicInfo.structure} onChange={(v) => setBasicInfo({ ...basicInfo, structure: v })} tone="coral" />
              </div>
              <section className="pbv2-card pbv2-tone-coral">
                <div className="pbv2-card-title">{t('musicStudio.goalsLabel')}</div>
                <input className="pbv2-input" value={basicInfo.goals} onChange={(e) => setBasicInfo({ ...basicInfo, goals: e.target.value })} placeholder={t('musicStudio.goalsPlaceholder')} />
              </section>
              <section className="pbv2-card pbv2-tone-blue">
                <div className="pbv2-card-title">{t('musicStudio.themeLabel')}</div>
                <input className="pbv2-input" value={basicInfo.theme} onChange={(e) => setBasicInfo({ ...basicInfo, theme: e.target.value })} placeholder={t('musicStudio.themePlaceholder')} />
              </section>
              <section className="pbv2-card pbv2-tone-green">
                <div className="pbv2-card-title">{t('musicStudio.reqLabel')}</div>
                <Field area label={t('musicStudio.reqField')} value={basicInfo.requirements} onChange={(v) => setBasicInfo({ ...basicInfo, requirements: v })} placeholder={t('musicStudio.reqPlaceholder')} />
              </section>
              <footer className="pbv2-actions">
                <ChevronRight size={16} />
                <button type="button" className="pbv2-primary" disabled={!basicReady || songGenerating} onClick={generateSongAndAdvance}>
                  {songGenerating ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                  {songGenerating ? t('musicStudio.aiGenerating') : t('musicStudio.aiGenSong')}
                </button>
              </footer>
            </div>
          )}

          {/* step 2 · 歌曲创作 */}
          {step === 1 && (
            <div className="pbv2-step-panel">
              <section className="pbv2-plan-block pbv2-tone-coral">
                <div className="pbv2-form-grid two">
                  <Field label={t('musicStudio.songTitleLabel')} value={song.title} onChange={(v) => { setSong({ ...song, title: v }); setWorkTitle(v); }} />
                  <Field label={t('musicStudio.patternsLabel')} area value={(song.targetPatterns || []).join('\n')} onChange={(v) => setSong({ ...song, targetPatterns: v.split('\n').map((s) => s.trim()).filter(Boolean) })} />
                </div>
              </section>
              <LyricsEditor lyrics={song.lyrics} onGenerateLine={generateLyricLine} onChange={(lyrics) => setSong({ ...song, lyrics })} />
              <section className="pbv2-card pbv2-tone-green">
                <div className="pbv2-card-title">{t('musicStudio.replaceAudioTitle')}</div>
                <p className="yoga-design-hint">{t('musicStudio.replaceAudioHint')}</p>
                <div className="pbv2-form-grid two">
                  <AudioCard label={t('musicStudio.vocalLabel')} name={audio.vocalName} dataUri={audio.vocal} onPick={({ dataUri, name }) => setAudio({ ...audio, vocal: dataUri, vocalName: name })} onRemove={() => setAudio({ ...audio, vocal: '', vocalName: '' })} />
                  <AudioCard label={t('musicStudio.backingLabel')} name={audio.backingName} dataUri={audio.backing} onPick={({ dataUri, name }) => setAudio({ ...audio, backing: dataUri, backingName: name })} onRemove={() => setAudio({ ...audio, backing: '', backingName: '' })} />
                </div>
              </section>
              <section className="pbv2-card pbv2-tone-yellow">
                <div className="cw-section-title">
                  <div className="pbv2-card-title">{t('musicStudio.aiFullSongTitle')}</div>
                  <button type="button" className="pbv2-ghost" disabled={segmentBusy !== null || !song.lyrics.length} onClick={() => generateAllSegments()}>
                    {segmentBusy === 'all' ? <Loader2 className="spin" size={14} /> : <Sparkles size={14} />}
                    {segmentBusy === 'all' ? t('musicStudio.aiGenerating') : (audio.vocal ? t('musicStudio.regenerateFullSong') : t('musicStudio.generateFullSong'))}
                  </button>
                </div>
                <p className="yoga-design-hint">{t('musicStudio.aiFullSongHint')}</p>
                {audio.vocal ? <div className="cw-generated-song"><strong>{audio.vocalName || t('musicStudio.aiFullSongName')}</strong><audio controls preload="metadata" src={audio.vocal} /></div> : null}
                {audio.backing ? <div className="cw-generated-song"><strong>{audio.backingName || t('musicStudio.aiBackingName')}</strong><audio controls preload="metadata" src={audio.backing} /></div> : null}
              </section>
              <footer className="pbv2-actions">
                <button type="button" className="pbv2-ghost" onClick={() => setStep(0)}>{t('musicStudio.backToBasic')}</button>
                <button type="button" className="pbv2-ghost" disabled={songGenerating} onClick={requestSongRegen}>
                  {songGenerating ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
                  {songGenerating ? t('musicStudio.aiGenerating') : t('musicStudio.aiRegenSong')}
                </button>
                <button type="button" className="pbv2-primary" disabled={saving} onClick={saveSong}>
                  <Save size={16} /> {t('musicStudio.saveToExercises')}
                </button>
              </footer>
            </div>
          )}

          {/* step 3 · 第一关 Lyric Hunter（填空 + 连词 + 听音 + 教案） */}
          {step === 2 && (
            <div className="pbv2-step-panel">
              <p className="yoga-design-hint">{t('musicStudio.stage1Hint')}</p>
              <FillEditor lyrics={song.lyrics} items={exercises.ex1FillData} onChange={(ex1FillData) => setExercises({ ...exercises, ex1FillData })} onGenerate={() => requestSectionRegen('ex1FillData')} generating={sectionGenerating === 'ex1FillData'} />
              <ScrambleEditor lyrics={song.lyrics} items={exercises.ex2Items} onChange={(ex2Items) => setExercises({ ...exercises, ex2Items })} onGenerate={() => requestSectionRegen('ex2Items')} generating={sectionGenerating === 'ex2Items'} />
              <ListenEditor lyrics={song.lyrics} items={exercises.ex3Data} onChange={(ex3Data) => setExercises({ ...exercises, ex3Data })} onGenerate={() => requestSectionRegen('ex3Data')} generating={sectionGenerating === 'ex3Data'} />
              <PlansEditor plans={exercises.teachingPlans} onChange={(teachingPlans) => setExercises({ ...exercises, teachingPlans })} onGenerate={() => requestSectionRegen('teachingPlans')} generating={sectionGenerating === 'teachingPlans'} stage="1" />
              <footer className="pbv2-actions">
                <button type="button" className="pbv2-ghost" onClick={() => setStep(1)}>{t('musicStudio.backToSong')}</button>
                <button type="button" className="pbv2-ghost" disabled={exGenerating} onClick={generateExercises}>
                  {exGenerating ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                  {exGenerating ? t('musicStudio.aiGenerating') : t('musicStudio.aiGenExercises')}
                </button>
                <button type="button" className="pbv2-primary" disabled={saving} onClick={() => saveExercises(STAGE_STEPS[2])}>
                  <Save size={16} /> {t('musicStudio.saveNext2')}
                </button>
              </footer>
            </div>
          )}

          {/* step 4 · 第二关 Melody Mover（教案） */}
          {step === 3 && (
            <div className="pbv2-step-panel">
              <p className="yoga-design-hint">{t('musicStudio.stage2Hint')}</p>
              <EditablePool title="Actions" hint={t('musicStudio.actionsHint')} placeholder="Action" items={exercises.melodyActions || []} onChange={(melodyActions) => setExercises({ ...exercises, melodyActions })} />
              <EditablePool title="Instruments" hint={t('musicStudio.instrumentsHint')} placeholder="Instrument" items={exercises.melodyInstruments || []} onChange={(melodyInstruments) => setExercises({ ...exercises, melodyInstruments })} />
              <PlansEditor plans={exercises.teachingPlans} onChange={(teachingPlans) => setExercises({ ...exercises, teachingPlans })} onGenerate={() => requestSectionRegen('teachingPlans')} generating={sectionGenerating === 'teachingPlans'} stage="2" />
              <footer className="pbv2-actions">
                <button type="button" className="pbv2-ghost" onClick={() => setStep(STAGE_STEPS[1])}>{t('musicStudio.backStage1')}</button>
                <button type="button" className="pbv2-primary" disabled={saving} onClick={() => saveExercises(STAGE_STEPS[3])}>
                  <Save size={16} /> {t('musicStudio.saveNext3')}
                </button>
              </footer>
            </div>
          )}

          {/* step 5 · 第三关 Echo Master（教案） */}
          {step === 4 && (
            <div className="pbv2-step-panel">
              <p className="yoga-design-hint">{t('musicStudio.stage3Hint')}</p>
              <EchoMasterPreview lyrics={song.lyrics} audio={audio} echoData={exercises.echoData} onGenerate={() => requestSectionRegen('echoData')} generating={sectionGenerating === 'echoData'} />
              <PlansEditor plans={exercises.teachingPlans} onChange={(teachingPlans) => setExercises({ ...exercises, teachingPlans })} onGenerate={() => requestSectionRegen('teachingPlans')} generating={sectionGenerating === 'teachingPlans'} stage="3" />
              <footer className="pbv2-actions">
                <button type="button" className="pbv2-ghost" onClick={() => setStep(STAGE_STEPS[2])}>{t('musicStudio.backStage2')}</button>
                <button type="button" className="pbv2-primary" disabled={saving} onClick={() => saveExercises(STAGE_STEPS[4])}>
                  <Save size={16} /> {t('musicStudio.saveNext4')}
                </button>
              </footer>
            </div>
          )}

          {/* step 6 · 第四关 Star Studio（颜色分工 + 教案） */}
          {step === 5 && (
            <div className="pbv2-step-panel">
              <div className="pbv2-making-toolbar">
                <button type="button" className="pbv2-ghost" disabled={!rendered || rendering} onClick={() => presentCurrent()}>
                  {rendering ? <Loader2 className="spin" size={16} /> : null}
                  🖥️ {t('common.teachMode')}
                </button>
                <span className="pbv2-save-state">{rendering ? t('musicStudio.rendering') : (rendered ? t('musicStudio.renderedReady') : '')}</span>
              </div>
              <p className="yoga-design-hint">{t('musicStudio.stage4Hint')}</p>
              <StarRolesEditor lyrics={song.lyrics} roles={exercises.starRoles} onChange={(starRoles) => setExercises({ ...exercises, starRoles })} onGenerate={() => requestSectionRegen('starRoles')} generating={sectionGenerating === 'starRoles'} />
              <PlansEditor plans={exercises.teachingPlans} onChange={(teachingPlans) => setExercises({ ...exercises, teachingPlans })} onGenerate={() => requestSectionRegen('teachingPlans')} generating={sectionGenerating === 'teachingPlans'} stage="4" />
              <footer className="pbv2-actions">
                <button type="button" className="pbv2-ghost" onClick={() => setStep(STAGE_STEPS[3])}>{t('musicStudio.backStage3')}</button>
                <button type="button" className="pbv2-primary" disabled={saving || rendering} onClick={buildCourseware}>
                  <Save size={16} /> {t('musicStudio.saveNextAudio')}
                </button>
              </footer>
            </div>
          )}
        </section>
      </div>

      {promptOpen && (
        <div className="cw-dialog-backdrop" onClick={() => setPromptOpen(false)}>
          <div className="cw-dialog" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="cw-icon-button cw-dialog-close" onClick={() => setPromptOpen(false)}><X size={16} /></button>
            <h2>{t('musicStudio.adjustPromptTitle')}</h2>
            <p className="cw-dialog-intro">{t('musicStudio.adjustPromptDescription')}</p>
            <label>
              {t('musicStudio.adjustPromptLabel')}
              <textarea value={promptText} onChange={(e) => setPromptText(e.target.value)} placeholder={t('musicStudio.adjustPromptPlaceholder')} autoFocus />
            </label>
            <div className="cw-dialog-actions">
              <button type="button" className="cw-secondary-button" onClick={() => setPromptOpen(false)}>{t('musicStudio.cancel')}</button>
              <button type="button" className="cw-primary-button" onClick={confirmAdjustPrompt}>{t('musicStudio.confirmGenerate')}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default MusicStudioPage;
