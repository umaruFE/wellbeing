import React from 'react';
import {
  ArrowLeft, Check, ChevronRight, Clock, Loader2, Music, Pause, Pencil, Play, Plus,
  RefreshCw, Save, Search, Sparkles, Trash2, Wand2, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  createCreativeWork, deleteCreativeWork, generateCreativeWorkExercises,
  generateCreativeWorkSong, getCreativeWorks, getCreativeWork, renderCreativeWork, updateCreativeWork,
} from './workshopStorage';
import '../picture-book/PictureBookStudioPage.css';
import './creativeWorkshop.css';
import { applyActualLrc, formatMusicTime } from './musicTiming';
import uploadService from '../../services/uploadService';
import aiAssetService from '../../services/aiAssetService';

const MODULE_ID = 'music-star-quest';
const MODULE_NAME = '星光录音棚';
// 制作步骤与授课模式的四个关卡一一对应：2~5 步分别是第一~四关（练习 + 该关教案），序号见步骤圆标
const STEPS = ['stepBasic', 'stepSong', 'stepStage1', 'stepStage2', 'stepStage3', 'stepStage4'];
const STAGE_STEPS = { 1: 2, 2: 3, 3: 4, 4: 5 };
const ACCENT = '#9966d0';


const initialBasicInfo = { goals: '', theme: '', age: '', level: '', style: '', duration: '', structure: '', requirements: '' };
const initialSong = { title: '', songMeta: {}, lyrics: [], targetPatterns: [] };
const DEFAULT_ACTIONS = ['Arms Circle', 'Make A Heart', 'Jump', 'Arms up', 'Knee Pat', 'Chest Pat', 'Stomp', 'Head Pat', 'Shoulder Pat', 'Snap', 'Wave', 'Touch Toes'];
const DEFAULT_INSTRUMENTS = ['Bell', 'Bongo', 'Cabasa', 'Castanets', 'Djembe', 'Drum', 'Handbell', 'Hand Drum', 'Maracas', 'Sleigh Bell', 'Tambourine', 'Xylophone', 'Finger Cym.', 'Triangle', 'Woodblock'];
// public/ip 里的动作图目录（仅动作池使用缩略图）
const ACTION_IMAGE_BASE = '/ip/';
/** 旧作品存的是历史动作名（如 👏 Clap），统一迁移为 public/ip 的 12 个规范动作 */
const normalizeMelodyActions = (value) => {
  const list = Array.isArray(value) ? value.filter((item) => typeof item === 'string' && item.trim()) : [];
  return list.length && list.every((item) => DEFAULT_ACTIONS.includes(item)) ? list : DEFAULT_ACTIONS;
};
const initialExercises = {
  ex1FillData: [], ex2Items: [], ex3Data: [], starRoles: [], teachingPlans: {},
  melodyActions: DEFAULT_ACTIONS,
  melodyInstruments: DEFAULT_INSTRUMENTS,
  melodySlots: [],
  echoData: { intermediate: [], challenge: [] },
};
const STAGE_TITLES = { 1: 'Lyric Hunter', 2: 'Melody Mover', 3: 'Echo Master', 4: 'Star Studio' };

// ── 歌词时间轴工具 ─────────────────────────────────────────
const toTimeStr = formatMusicTime;
const toRangeStr = (start, end) => `${toTimeStr(start)}–${toTimeStr(Math.max(end, start + 1))}`;
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
  if (!rows.length) throw new Error('musicStudio.noLyricLines');
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

// ── AI 整曲音频（n8n 提交 → 轮询 → 通用资源下载 → 缓存） ──────
const authJsonHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});
/** 生成整曲，返回 FTP/CDN 音频 URL 与服务端测得的实际时长。 */
async function generateFullSongAudio({ id, resume, onProgress, isCurrent }) {
  if (!resume) {
    const submit = await fetch(`/api/creative-works/${id}/music`, {
      method: 'POST',
      headers: authJsonHeaders(),
    });
    if (!submit.ok) throw new Error((await submit.json().catch(() => ({}))).error || 'musicStudio.audioSubmitFail');
  }
  let url = '';
  let completed;
  for (let attempt = 0; attempt < 360 && !url; attempt++) {
    if (!isCurrent()) throw new Error('musicStudio.leftWorkBgGen');
    await new Promise((r) => setTimeout(r, 5000));
    let status;
    try {
      status = await fetch(`/api/creative-works/${id}/music`, { headers: authJsonHeaders(), signal: AbortSignal.timeout(30000) });
    } catch (error) {
      if (!isCurrent()) throw new Error('musicStudio.leftWorkBgGen');
      if (error instanceof TypeError || ['TimeoutError', 'AbortError'].includes(error.name)) { onProgress('', 'reconnecting'); continue; }
      throw error;
    }
    if ([503, 504].includes(status.status)) { onProgress('', 'reconnecting'); continue; }
    const json = await status.json().catch(() => ({}));
    if (!status.ok) throw new Error(json.error || 'musicStudio.songTaskQueryFail');
    const data = json.data || {};
    onProgress(data.executionId, data.phase);
    if (data.status === 'error') throw new Error(data.error || 'musicStudio.audioGenFail');
    if (data.status === 'completed') { url = data.url; completed = data; }
  }
  if (!url) throw new Error('musicStudio.audioGenTimeout');
  return completed;
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
  const { t } = useTranslation();
  return (
    <label className="pbv2-field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(Number(event.target.value))}>
        <option value={-1}>{t('musicStudio.selectLyricPlaceholder')}</option>
        {lyrics.map((row, idx) => <option key={`${idx}-${row.text}`} value={idx}>{idx + 1}. {row.text}</option>)}
      </select>
    </label>
  );
}

// ── 歌词编辑器（step 2）─────────────────────────────────────
function LyricClipPlayer({ source, workId, index, canLoad, onPlay }) {
  const { t } = useTranslation();
  const [loaded, setLoaded] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const requestVersion = React.useRef(0);
  const player = React.useRef(null);
  const [playing, setPlaying] = React.useState(false);
  React.useEffect(() => {
    return () => { requestVersion.current += 1; };
  }, [workId, index, source, canLoad]);
  const loadClip = async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`/api/creative-works/${workId}/music`, { headers: authJsonHeaders() });
      const payload = await response.json();
      const url = payload.data?.lyrics?.[index]?.url;
      if (!response.ok || typeof url !== 'string' || !url.startsWith('https://')) throw new Error('clip URL unavailable');
      if (version === requestVersion.current) setLoaded(url);
    } catch {
      if (version === requestVersion.current) setError(true);
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  };
  return (
    <div className="cw-lyric-clip">
      {source || loaded ? <><button type="button" className="cw-clip-play" aria-label={t('musicStudio.lyricClipLabel', { n: index + 1 })} onClick={() => { if (player.current?.paused) player.current.play().catch(() => setError(true)); else player.current?.pause(); }}>{playing ? '⏸' : '▶'}</button><audio ref={player} preload="none" src={source || loaded} onPlay={(event) => { setPlaying(true); onPlay(event); }} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => setError(true)} /></>
        : canLoad ? <button type="button" className="pbv2-ghost" disabled={loading} onClick={loadClip}>
          {loading && <Loader2 className="spin" size={14} />}{t(loading ? 'musicStudio.lyricClipLoading' : 'musicStudio.lyricClipLoad')}
        </button> : <span className="cw-echo-audio-status">{t('musicStudio.segmentAudioPending')}</span>}
      {error && <span role="alert" className="cw-echo-audio-status is-failed">{t('musicStudio.lyricClipError')}</span>}
    </div>
  );
}

function LyricsEditor({ lyrics, audio = {}, workId, onEditLyric }) {
  const { t } = useTranslation();
  const clips = React.useRef(null);
  const [editingIndex, setEditingIndex] = React.useState(-1);
  const [editDraft, setEditDraft] = React.useState('');
  const [activeLyric, setActiveLyric] = React.useState(-1);
  const editInputRef = React.useRef(null);
  const segments = Array.isArray(audio.segments) ? audio.segments : [];
  const recognized = audio.transcription?.lyrics || [];
  const pauseOtherClips = event => {
    clips.current?.querySelectorAll('audio').forEach(player => { if (player !== event.currentTarget) player.pause(); });
  };
  const startEdit = (idx) => {
    setEditingIndex(idx);
    setEditDraft(lyrics[idx]?.text || '');
  };
  const cancelEdit = () => { setEditingIndex(-1); setEditDraft(''); };
  const commitEdit = () => {
    if (editingIndex < 0) return;
    const next = editDraft.trim();
    if (next && next !== lyrics[editingIndex]?.text) onEditLyric?.(editingIndex, next);
    cancelEdit();
  };
  React.useEffect(() => {
    if (editingIndex >= 0) editInputRef.current?.focus();
  }, [editingIndex]);
  return (
    <section className="pbv2-card pbv2-tone-blue" ref={clips}>
      <div className="pbv2-card-title">{t('musicStudio.lyricsTimeline')}</div>
      {lyrics.map((row, idx) => {
        const editing = editingIndex === idx;
        return (
          <div key={`${workId}-${audio.generationTask?.executionId || ''}-${idx}-${row.text}-${row.time}`} className={`cw-lyric-row cw-lyric-row-with-clip${onEditLyric ? ' cw-lyric-row-editable' : ''}${activeLyric === idx ? ' is-playing' : ''}`} title={t('musicStudio.lyricTimeTooltip', { time: row.time || t('musicStudio.alignmentPending') })}>
            <span className="cw-lyric-time">{idx + 1}</span>
            {editing ? (
              <div className="cw-lyric-edit">
                <input ref={editInputRef} value={editDraft} aria-label={t('musicStudio.editLyricAria', { n: idx + 1 })} onChange={(event) => setEditDraft(event.target.value)} onBlur={commitEdit}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.nativeEvent.isComposing) commitEdit();
                    if (event.key === 'Escape') cancelEdit();
                  }} />
              </div>
            ) : (
              <span className="cw-lyric-text cw-lyric-text-readonly">{row.text || t('musicStudio.notGenerated')}</span>
            )}
            <div className="cw-lyric-row-tools">
              {editing ? (<>
                <button type="button" className="cw-lyric-tool-btn is-save" aria-label={t('musicStudio.lyricEditSave')} title={t('musicStudio.lyricEditSave')} onMouseDown={(event) => event.preventDefault()} onClick={commitEdit}><Check size={14} /></button>
                <button type="button" className="cw-lyric-tool-btn" aria-label={t('musicStudio.lyricEditCancel')} title={t('musicStudio.lyricEditCancel')} onMouseDown={(event) => event.preventDefault()} onClick={cancelEdit}><X size={14} /></button>
              </>) : onEditLyric && (
                <button type="button" className="cw-lyric-tool-btn" aria-label={t('musicStudio.editLyricAria', { n: idx + 1 })} title={t('musicStudio.editLyricBtn')} onClick={() => startEdit(idx)}><Pencil size={13} /></button>
              )}
              <LyricClipPlayer source={segments[idx]} workId={workId} index={idx} onPlay={(event) => { pauseOtherClips(event); setActiveLyric(idx); }}
                canLoad={Boolean(workId && audio.generationTask?.status === 'completed' && recognized[idx]?.text === row.text && recognized[idx]?.time === row.time)} />
            </div>
          </div>
        );
      })}
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

function FillEditor({ items, onChange, onPersistVisual, onGenerate, generating }) {
  const { t } = useTranslation();
  const [uploadingIndex, setUploadingIndex] = React.useState(null);
  const [uploadError, setUploadError] = React.useState('');
  const [imagePrompt, setImagePrompt] = React.useState(null);
  const [generatingImage, setGeneratingImage] = React.useState(false);
  const update = (idx, patch) => onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const updateVisual = async (idx, patch) => {
    const nextItems = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange(nextItems);
    if (onPersistVisual) await onPersistVisual(nextItems);
  };
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  const updateOption = (idx, optionIndex, value) => {
    const options = Array.from({ length: 4 }, (_, i) => items[idx].options?.[i] || '');
    options[optionIndex] = value;
    update(idx, { options });
  };
  const uploadImage = async (idx, file) => {
    if (!file) return;
    setUploadError('');
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setUploadError(t('musicStudio.fillImageInvalid'));
      return;
    }
    setUploadingIndex(idx);
    const result = await uploadService.uploadFile(file, 'music-fill-images');
    if (result.success) await updateVisual(idx, { imageUrl: result.url, emoji: '' });
    else setUploadError(result.error || t('musicStudio.fillImageUploadFailed'));
    setUploadingIndex(null);
  };
  const generateImage = async () => {
    const prompt = imagePrompt?.prompt?.trim();
    if (!prompt || imagePrompt?.idx == null || generatingImage) return;
    setGeneratingImage(true);
    setUploadError('');
    try {
      const submitted = await aiAssetService.generateMultipleImages(prompt, { count: 1, width: 768, height: 768, workflow_type: 'lora-v3' });
      const task = submitted?.tasks?.[0];
      if (!task?.promptId) throw new Error(t('musicStudio.fillImageGenerateFailed', { defaultValue: 'AI 生图任务提交失败' }));
      const result = await aiAssetService.pollTaskAndUpload(task.promptId, 0, prompt, 120, 3000, undefined, task.apiUrl);
      if (!result?.url) throw new Error(t('musicStudio.fillImageGenerateFailed', { defaultValue: 'AI 生图失败' }));
      await updateVisual(imagePrompt.idx, { imageUrl: result.url, emoji: '' });
      setImagePrompt(null);
    } catch (error) {
      setUploadError(error.message || t('musicStudio.fillImageGenerateFailed', { defaultValue: 'AI 生图失败' }));
    } finally {
      setGeneratingImage(false);
    }
  };
  return (
    <section className="pbv2-card pbv2-tone-yellow">
      <div className="cw-section-title"><div className="pbv2-card-title">{t('musicStudio.ex1Title')}</div><AiSectionButton loading={generating} hasContent={items.length > 0} onClick={onGenerate} /></div>
      {items.map((item, idx) => (
        <div key={idx} className="cw-exercise-item">
          <div className="cw-exercise-head"><span>{t('musicStudio.questionN', { n: idx + 1 })}</span><button type="button" onClick={() => remove(idx)}><Trash2 size={13} /></button></div>
          <div className="cw-exercise-grid cw-fill-grid">
            <label className="pbv2-field"><span>{t('musicStudio.selectBlankWords')}</span><div className="cw-word-picker">
              {uniqueWords(item.lyricText || fillToFullText(item)).map((word) => {
                const active = (item.blanks || []).some((blank) => blank.toLowerCase() === word.toLowerCase());
                return <button key={word} type="button" className={active ? 'is-active' : ''} onClick={() => {
                  const selected = active ? [] : [word];
                  update(idx, makeFillItem(item.lyricText || fillToFullText(item), selected, item));
                }}>{word}</button>;
              })}
            </div></label>
            <div className="cw-fixed-options">
              {Array.from({ length: 4 }, (_, optionIndex) => {
                const option = item.options?.[optionIndex] || '';
                const correct = Boolean(option) && (item.blanks || []).some((blank) => blank.trim().toLowerCase() === option.trim().toLowerCase());
                return <label key={optionIndex} className={`pbv2-field cw-fill-option${correct ? ' is-correct' : ''}`}>
                  <span>{t('musicStudio.optionLabel', { n: optionIndex + 1 })}</span>
                  <input value={option} onChange={(event) => updateOption(idx, optionIndex, event.target.value)} />
                </label>;
              })}
            </div>
            <div className="cw-fill-visual"><span>{t('musicStudio.fillVisualLabel')}</span><div className="cw-fill-visual-body">
              <div className="cw-fill-image-frame">{item.imageUrl ? <img src={item.imageUrl} alt="" /> : <span>{item.emoji || '🎵'}</span>}</div>
              <div className="cw-fill-visual-tools">
                <select aria-label={t('musicStudio.customEmoji')} value={item.imageUrl ? '' : (item.emoji || '')} onChange={(event) => updateVisual(idx, { emoji: event.target.value, imageUrl: '' })}>
                  <option value="">Emoji</option>
                  {['🎵', '😊', '❤️', '🌈', '⭐', '☀️', '🌸', '🐻', '👏', '🎤', '🏃', '🌍'].map((emoji) => <option key={emoji} value={emoji}>{emoji}</option>)}
                </select>
                <label className="cw-fill-image-upload">{uploadingIndex === idx ? '上传中…' : '上传'}<input type="file" accept="image/jpeg,image/png,image/gif,image/webp" disabled={uploadingIndex !== null} onChange={(event) => { uploadImage(idx, event.target.files?.[0]); event.target.value = ''; }} /></label>
                <button type="button" className="pbv2-ghost cw-ai-image-button" onClick={() => setImagePrompt({ idx, prompt: item.imagePrompt || '' })}><Sparkles size={14} />AI</button>
                {item.imageUrl && <button type="button" className="cw-fill-image-remove" onClick={() => updateVisual(idx, { imageUrl: '', emoji: '🎵' })}>{t('musicStudio.removeImage')}</button>}
              </div>
            </div></div>
            <div className="cw-question-preview" aria-label={t('musicStudio.questionN', { n: idx + 1 })}>
              <small>{t('musicStudio.previewLabel', { defaultValue: '题目效果' })}</small>
              <strong>{(item.sentence || []).map((part) => part === '' ? ' ______ ' : part).join('')}</strong>
              <div>{(item.options || []).map((option, optionIndex) => <span key={`${option}-${optionIndex}`}>{String.fromCharCode(65 + optionIndex)}. {option}</span>)}</div>
            </div>
          </div>
        </div>
      ))}
      {uploadError && <p role="alert" className="cw-echo-audio-status is-failed">{uploadError}</p>}
      <button type="button" className="pbv2-add-page" onClick={() => onChange([...items, { sentence: ['', ''], blanks: [''], options: [], emoji: '🎵' }])}>
        <Plus size={16} /> {t('musicStudio.addFill')}
      </button>
      {imagePrompt && <div className="cw-dialog-backdrop" onClick={() => !generatingImage && setImagePrompt(null)}>
        <div className="cw-dialog" onClick={(event) => event.stopPropagation()}>
          <button type="button" className="cw-icon-button cw-dialog-close" disabled={generatingImage} onClick={() => setImagePrompt(null)}><X size={16} /></button>
          <h2>AI 生成配图</h2>
          <p className="cw-dialog-intro">请描述图片中的主体、动作、色彩和风格。</p>
          <label>生图提示词<textarea value={imagePrompt.prompt} onChange={(event) => setImagePrompt({ ...imagePrompt, prompt: event.target.value })} placeholder="例如：一个开心跳舞的小朋友，儿童绘本风格，黄色背景" autoFocus /></label>
          <div className="cw-dialog-actions"><button type="button" className="cw-secondary-button" disabled={generatingImage} onClick={() => setImagePrompt(null)}>{t('musicStudio.cancel')}</button><button type="button" className="cw-primary-button" disabled={generatingImage || !imagePrompt.prompt.trim()} onClick={generateImage}>{generatingImage ? <Loader2 className="spin" size={15} /> : <Sparkles size={15} />}{generatingImage ? '生成中…' : '开始生成'}</button></div>
        </div>
      </div>}
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
          <div className="cw-scramble-layout">
            <label className="pbv2-field cw-scramble-lyric">
              <span>{t('musicStudio.lyricLabel', { defaultValue: '歌词' })}</span>
              <select value={lyricIndexForText(lyrics, item.answer)} onChange={(event) => {
                const answer = lyrics[Number(event.target.value)]?.text || '';
                update(idx, { answer, words: answer.trim().split(/\s+/).filter(Boolean) });
              }}>
                <option value={-1}>{t('musicStudio.selectLyricPlaceholder')}</option>
                {lyrics.map((row, lyricIndex) => <option key={`${lyricIndex}-${row.text}`} value={lyricIndex}>{row.text}</option>)}
              </select>
            </label>
            <div className="cw-scramble-question">
              <span className="cw-scramble-label">{t('musicStudio.questionLabel', { defaultValue: '题目' })}</span>
              <div className="cw-scramble-words">{(item.words || []).map((word, wordIndex) => <span key={`${word}-${wordIndex}`}>{word}</span>)}</div>
            </div>
          </div>
        </div>
      ))}
      <button type="button" className="pbv2-add-page" onClick={() => onChange([...items, { answer: '', words: [] }])}>
        <Plus size={16} /> {t('musicStudio.addScramble')}
      </button>
    </section>
  );
}

function ListenEditor({ items, lyrics, audio = {}, onChange, onGenerate, generating }) {
  const { t } = useTranslation();
  const update = (idx, patch) => onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const remove = (idx) => onChange(items.filter((_, i) => i !== idx));
  const clips = React.useRef(null);
  const segments = Array.isArray(audio.segments) ? audio.segments : [];
  const pauseOtherClips = (event) => clips.current?.querySelectorAll('audio').forEach((player) => { if (player !== event.currentTarget) player.pause(); });
  const updateOption = (idx, oi, value) => update(idx, { options: items[idx].options.map((o, i) => (i === oi ? value : o)) });
  return (
    <section className="pbv2-card pbv2-tone-coral" ref={clips}>
      <div className="cw-section-title"><div className="pbv2-card-title">{t('musicStudio.ex3Title')}</div><AiSectionButton loading={generating} hasContent={items.length > 0} onClick={onGenerate} /></div>
      {items.map((item, idx) => (
        <div key={idx} className="cw-exercise-item">
          <div className="cw-exercise-head">
            <span className="cw-listen-answer-control">{t('musicStudio.questionN', { n: idx + 1 })} · {t('musicStudio.correctSentence')}
              <select value={item.correct ?? 0} onChange={(e) => update(idx, { correct: Number(e.target.value) })}>
                {(item.options || []).map((_, i) => <option key={i} value={i}>{t('musicStudio.optionN', { n: i + 1 })}</option>)}
              </select>
            </span>
            <input className="cw-listen-time" placeholder="00:13–00:14" value={item.time || ''} onChange={(e) => update(idx, { time: e.target.value })} title={t('musicStudio.timeTitleEx3')} />
            <button type="button" onClick={() => remove(idx)}><Trash2 size={13} /></button>
          </div>
          <label className="pbv2-field cw-listen-lyric-select">
            <span>{t('musicStudio.selectCorrectLyric')}</span>
            <div>
              <select value={lyricIndexForText(lyrics, item.options?.[item.correct ?? 0])} onChange={(event) => {
                const row = lyrics[Number(event.target.value)];
                if (!row) return;
                const correct = item.correct ?? 0;
                const options = [...(item.options || ['', '', ''])];
                options[correct] = row.text;
                update(idx, { options, time: row.time });
              }}>
                <option value={-1}>{t('musicStudio.selectLyricPlaceholder')}</option>
                {lyrics.map((row, lyricIndex) => <option key={`${lyricIndex}-${row.text}`} value={lyricIndex}>{lyricIndex + 1}. {row.text}</option>)}
              </select>
            {segments[lyricIndexForText(lyrics, item.options?.[item.correct ?? 0])] ? <EchoClipButton source={segments[lyricIndexForText(lyrics, item.options?.[item.correct ?? 0])]} label={t('musicStudio.lyricClipLabel', { n: idx + 1 })} onPlay={pauseOtherClips} /> : <span className="cw-echo-audio-status">{t('musicStudio.segmentAudioPending')}</span>}
            </div>
          </label>
          <div className="cw-listen-options">
            {(item.options || []).map((option, optionIndex) => <label key={optionIndex} className={(item.correct ?? 0) === optionIndex ? 'is-correct' : ''}>
              <span>{t('musicStudio.optionLabel', { n: optionIndex + 1 })}</span>
              <input value={option || ''} onChange={(event) => updateOption(idx, optionIndex, event.target.value)} />
            </label>)}
          </div>
        </div>
      ))}
      <button type="button" className="pbv2-add-page" onClick={() => onChange([...items, { question: 'Choose the sentence you hear:', options: ['', '', ''], correct: 0 }])}>
        <Plus size={16} /> {t('musicStudio.addListen')}
      </button>
    </section>
  );
}

function EditablePool({ title, items, onChange, options, thumbBase }) {
  const { t } = useTranslation();
  return (
    <section className="pbv2-card pbv2-tone-green">
      <div className="pbv2-card-title">{title}</div>
      <div className="cw-pool-choices">
        {options.map((item) => <button type="button" key={item} aria-pressed={items.includes(item)} className={items.includes(item) ? 'is-active' : ''} onClick={() => onChange(options.filter((option) => option === item ? !items.includes(item) : items.includes(option)))}>{thumbBase ? <img className="cw-pool-thumb" src={`${thumbBase}${encodeURIComponent(item)}.png`} alt="" loading="lazy" /> : null}{t('musicStudio.poolItem', { returnObjects: true })?.[item] || item}<span>{items.includes(item) ? '−' : '+'}</span></button>)}
      </div>
      <span className="cw-pool-count">{t('musicStudio.selectedCount', { count: items.length })}</span>
    </section>
  );
}

// 第二关缺省槽位：按歌词行预填动作/乐器，授课课件里作为学生的初始摆法（可继续改动）
const normalizeMelodySlots = (value, lineCount) => {
  const rows = Array.isArray(value) ? value : [];
  return Array.from({ length: lineCount }, (_, i) => (Array.isArray(rows[i]) ? rows[i] : [])
    .filter((slot) => slot && (slot.type === 'action' || slot.type === 'inst') && typeof slot.name === 'string' && slot.name.trim()));
};
function MelodyDefaultsEditor({ lyrics, actions, instruments, slots, onChange }) {
  const { t } = useTranslation();
  const poolItem = t('musicStudio.poolItem', { returnObjects: true });
  const label = (name) => poolItem?.[name] || name;
  const rows = normalizeMelodySlots(slots, lyrics.length);
  const addSlot = (i, type, name) => onChange(rows.map((row, ri) => (ri === i ? [...row, { type, name }] : row)));
  const removeSlot = (i, idx) => onChange(rows.map((row, ri) => (ri === i ? row.filter((_, ci) => ci !== idx) : row)));
  const filledCount = rows.reduce((total, row) => total + row.length, 0);
  return (
    <section className="pbv2-card pbv2-tone-blue cw-melody-defaults">
      <div className="cw-section-title">
        <div>
          <div className="pbv2-card-title">{t('musicStudio.defaultsTitle')}</div>
          <span className="cw-pool-count">{t('musicStudio.defaultsHint')}</span>
        </div>
        {filledCount > 0 && <button type="button" className="pbv2-ghost" onClick={() => onChange(lyrics.map(() => []))}>{t('musicStudio.defaultsClear')}</button>}
      </div>
      <div className="cw-melody-defaults-rows">
        {lyrics.map((row, i) => (
          <div key={`${i}-${row.time || ''}`} className="cw-melody-default-line">
            <span className="cw-lyric-time">{i + 1}</span>
            <div className="cw-melody-default-content">
              <strong>{row.text}</strong>
              <div className="cw-melody-default-slots">
                {rows[i].map((slot, idx) => (
                  <span key={`${slot.type}-${slot.name}-${idx}`} className={`cw-melody-default-chip is-${slot.type}`}>
                    {slot.type === 'action' && <img src={`${ACTION_IMAGE_BASE}${encodeURIComponent(slot.name)}.png`} alt="" loading="lazy" />}
                    {slot.type === 'inst' ? '🥁' : ''}{label(slot.name)}
                    <button type="button" aria-label={t('musicStudio.defaultsRemove')} onClick={() => removeSlot(i, idx)}>×</button>
                  </span>
                ))}
                <select className="cw-melody-default-add" value="" disabled={!actions.length} onChange={(event) => { if (event.target.value) addSlot(i, 'action', event.target.value); }}>
                  <option value="">{t('musicStudio.defaultsAddAction')}</option>
                  {actions.map((name) => <option key={name} value={name}>{label(name)}</option>)}
                </select>
                <select className="cw-melody-default-add" value="" disabled={!instruments.length} onChange={(event) => { if (event.target.value) addSlot(i, 'inst', event.target.value); }}>
                  <option value="">{t('musicStudio.defaultsAddInstrument')}</option>
                  {instruments.map((name) => <option key={name} value={name}>{label(name)}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
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

function EchoClipButton({ source, label, onPlay }) {
  const [playing, setPlaying] = React.useState(false);
  const player = React.useRef(null);
  return <span className="cw-echo-clip"><button type="button" className="cw-clip-play" aria-label={label} aria-pressed={playing} onClick={() => { if (player.current?.paused) player.current.play().catch(() => setPlaying(false)); else player.current?.pause(); }}>{playing ? '⏸' : '▶'}</button><audio ref={player} preload="none" src={source} onPlay={(event) => { setPlaying(true); onPlay(event); }} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} /></span>;
}

function EchoMasterPreview({ lyrics, audio, echoData, onChange, onGenerate, generating }) {
  const { t } = useTranslation();
  const clips = React.useRef(null);
  const pauseOtherClips = (event) => clips.current?.querySelectorAll('audio').forEach((player) => { if (player !== event.currentTarget) player.pause(); });
  const failures = new Set(Array.isArray(audio?.segmentFailures) ? audio.segmentFailures : []);
  const segments = Array.isArray(audio?.segments) ? audio.segments : [];
  const hasEchoData = Boolean((echoData?.intermediate?.length || 0) + (echoData?.challenge?.length || 0));
  const selectedWords = (mode, idx) => Array.isArray(echoData?.[mode]?.[idx]) ? echoData[mode][idx] : [];
  const toggleWord = (mode, idx, word) => {
    const current = selectedWords(mode, idx);
    const active = current.some((item) => item.toLowerCase() === word.toLowerCase());
    if (!active && current.length >= 2) return;
    const nextRow = active ? current.filter((item) => item.toLowerCase() !== word.toLowerCase()) : [...current, word];
    const currentRows = Array.isArray(echoData?.[mode]) ? echoData[mode] : [];
    const nextRows = lyrics.map((_, lineIdx) => lineIdx === idx ? nextRow : (currentRows[lineIdx] || []));
    onChange({
      intermediate: Array.isArray(echoData?.intermediate) ? echoData.intermediate : [],
      challenge: Array.isArray(echoData?.challenge) ? echoData.challenge : [],
      [mode]: nextRows,
    });
  };
  const modes = [
    { value: 'beginner', dataKey: 'beginner', label: '1. ⭐ Beginner', detail: t('musicStudio.echoFullLyrics') },
    { value: 'challenge', dataKey: 'challenge', label: '2. ⭐⭐ Intermediate', detail: t('musicStudio.echoFirstLetter') },
    { value: 'intermediate', dataKey: 'intermediate', label: '3. ⭐⭐⭐ Challenge', detail: t('musicStudio.echoWholeWord') },
  ];
  return (
    <section className="pbv2-card pbv2-tone-yellow cw-echo-preview" ref={clips}>
      <div className="cw-section-title">
        <div className="pbv2-card-title">{t('musicStudio.echoPreviewTitle')}</div>
        <AiSectionButton loading={generating} hasContent={hasEchoData} onClick={onGenerate} />
      </div>
      <div className="cw-echo-levels">
        {modes.map((item) => (
          <section key={item.value} className="cw-echo-level">
            <header>
              <strong>{item.label}</strong>
              <span>{item.detail}{item.value === 'challenge' ? ` · ${t('musicStudio.echoMaxTwo')}` : ''}</span>
            </header>
            <div className="cw-echo-preview-lines">
              {lyrics.map((row, idx) => {
                const failed = failures.has(idx);
                const segment = segments[idx];
                const words = Array.from(new Map((row.text.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) || []).map((word) => [word.toLowerCase(), word])).values());
                const selected = selectedWords(item.dataKey, idx);
                return (
                  <div key={`${item.value}-${idx}-${row.time}`} className={`cw-echo-preview-line${failed ? ' is-failed' : ''}`}>
                    <span className="cw-lyric-time" title={t('musicStudio.lyricTimeTooltip', { time: row.time || t('musicStudio.alignmentPending') })}>{idx + 1}</span>
                    <div className="cw-echo-line-content">
                      <strong>{echoPreviewText(row.text, item.value, selected)}</strong>
                      {item.value !== 'beginner' && (
                        <div className="cw-word-picker">
                          {words.map((word) => {
                            const active = selected.some((value) => value.toLowerCase() === word.toLowerCase());
                            return <button key={word} type="button" className={active ? 'is-active' : ''} onClick={() => toggleWord(item.dataKey, idx, word)}>{word}</button>;
                          })}
                        </div>
                      )}
                    </div>
                    {failed ? <span className="cw-echo-audio-status is-failed">{t('musicStudio.segmentAudioFailed')}</span>
                      : segment ? <EchoClipButton source={segment} label={t('musicStudio.lyricClipLabel', { n: idx + 1 })} onPlay={pauseOtherClips} />
                        : <span className="cw-echo-audio-status">{t('musicStudio.segmentAudioPending')}</span>}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </section>
  );
}

// ── 第四关 Stage Star 分工编辑器（step 3）────────────────────
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

function PrepSongPlayer({ audio }) {
  const { t } = useTranslation();
  const [mode, setMode] = React.useState(audio.vocal ? 'vocal' : 'backing');
  const [playing, setPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const playerRef = React.useRef(null);
  const source = mode === 'vocal' ? audio.vocal : audio.backing;
  React.useEffect(() => {
    if (mode === 'vocal' && !audio.vocal && audio.backing) setMode('backing');
    if (mode === 'backing' && !audio.backing && audio.vocal) setMode('vocal');
  }, [audio.vocal, audio.backing, mode]);
  React.useEffect(() => {
    const player = playerRef.current;
    if (player) {
      player.pause();
      player.load();
    }
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [source]);
  const timeLabel = (value) => {
    const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  };
  const togglePlay = () => {
    const player = playerRef.current;
    if (!player) return;
    if (player.paused) player.play().catch(() => setPlaying(false));
    else player.pause();
  };
  return (
    <section className="pbv2-card pbv2-tone-coral cw-prep-player">
      <div className="cw-prep-player-tracks">
        {(audio.vocal || audio.backing) && <div className="cw-track-toggle" role="group" aria-label={t('musicStudio.songVersion', { defaultValue: '歌曲版本' })}>
          <button type="button" disabled={!audio.vocal} className={mode === 'vocal' ? 'is-active' : ''} onClick={() => setMode('vocal')}>{t('musicStudio.vocalLabel')}</button>
          <button type="button" disabled={!audio.backing} className={mode === 'backing' ? 'is-active' : ''} onClick={() => setMode('backing')}>{t('musicStudio.backingLabel')}</button>
        </div>}
        {source && <div className="cw-compact-audio">
          <button type="button" className="cw-compact-play" onClick={togglePlay} aria-label={playing ? t('common.pause', { defaultValue: '暂停' }) : t('common.play', { defaultValue: '播放' })}>{playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}</button>
          <span>{timeLabel(currentTime)}</span>
          <input type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} disabled={!duration} aria-label={t('musicStudio.songProgress', { defaultValue: '歌曲进度' })} onChange={(event) => { const next = Number(event.target.value); if (playerRef.current) playerRef.current.currentTime = next; setCurrentTime(next); }} />
          <span>{timeLabel(duration)}</span>
          <audio ref={playerRef} preload="metadata" src={source} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)} onDurationChange={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setCurrentTime(0); }} />
        </div>}
        {!audio.vocal && !audio.backing && <span className="cw-echo-audio-status">{t('musicStudio.songAudioUnavailable')}</span>}
      </div>
    </section>
  );
}

export function MusicStudioPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [view, setView] = React.useState('list');
  const [works, setWorks] = React.useState([]);
  const [listLoading, setListLoading] = React.useState(true);
  const [listError, setListError] = React.useState('');
  const [openingWorkId, setOpeningWorkId] = React.useState(null);
  const openingWorkRef = React.useRef(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [message, setMessage] = React.useState('');

  const editingIdRef = React.useRef(null);
  const [step, setStep] = React.useState(0);
  const [basicInfo, setBasicInfo] = React.useState(initialBasicInfo);
  const [song, setSong] = React.useState(initialSong);
  const [exercises, setExercises] = React.useState(initialExercises);
  const [audio, setAudio] = React.useState({});
  const [songLibrary, setSongLibrary] = React.useState([]);
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
    setListError('');
    return getCreativeWorks(MODULE_ID)
      .then(setWorks)
      .catch((error) => setListError(error.message))
      .finally(() => setListLoading(false));
  }, []);
  React.useEffect(() => { loadWorks(); }, [loadWorks]);
  React.useEffect(() => {
    fetch('/api/song-library', { headers: authJsonHeaders() })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('song library')))
      .then((data) => setSongLibrary(Array.isArray(data?.data) ? data.data : []))
      .catch(() => setSongLibrary([]));
  }, []);

  const setEditing = (id) => { editingIdRef.current = id; };

  const openWork = async (summary) => {
    if (openingWorkRef.current !== null) return;
    openingWorkRef.current = summary.id;
    setOpeningWorkId(summary.id);
    setMessage('');
    try {
      const work = summary.isSummary ? await getCreativeWork(summary.id) : summary;
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
      melodyActions: normalizeMelodyActions(r.melodyActions),
      melodyInstruments: Array.isArray(r.melodyInstruments) ? r.melodyInstruments : DEFAULT_INSTRUMENTS,
      melodySlots: normalizeMelodySlots(r.melodySlots, Array.isArray(r.lyrics) ? r.lyrics.length : 0),
      echoData: r.echoData ? {
        intermediate: Array.isArray(r.echoData.intermediate) ? r.echoData.intermediate : [],
        challenge: Array.isArray(r.echoData.challenge) ? r.echoData.challenge : [],
      } : { intermediate: [], challenge: [] },
    });
    setAudio(r.audio || {});
    setRendered(Boolean(work.hasHtml) && r.audio?.alignmentStatus !== 'pending');
    setMessage('');
    const exercisesComplete = hasCompleteExercises(r);
    setStep(r.lyrics?.length || r.audio?.generationTask?.status === 'submitted' || r.audio?.alignmentStatus === 'pending' ? 1 : 0);
    setView('studio');
    if (r.lyrics?.length && !exercisesComplete) {
      setExGenerating(true);
      generateCreativeWorkExercises(work.id)
        .then((data) => setExercises({ ...initialExercises, ...data }))
        .catch((err) => setMessage(err.message || t('musicStudio.exercisesGenFail')))
        .finally(() => setExGenerating(false));
    }
    } catch (error) {
      setMessage(error.message || t('musicStudio.workLoadFailed'));
    } finally {
      openingWorkRef.current = null;
      setOpeningWorkId(null);
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
  const basicReady = String(basicInfo.goals || '').trim();
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
      setAudio({ alignmentStatus: 'pending' });
      if (data.title) setWorkTitle(data.title);
      setStep(1);
      await generateAllSegments(nextSong, data.title || basicInfo.theme);
    } catch (err) {
      setMessage(err.message || t('musicStudio.songGenFail'));
    } finally {
      setSongGenerating(false);
    }
  };
  const continueFromBasic = async () => {
    if (song.songMeta?.source !== 'library') return generateSongAndAdvance();
    const id = editingIdRef.current;
    if (!id) return;
    await updateCreativeWork(id, { title: song.title || basicInfo.theme, parameters: basicInfo, song, audio });
    setStep(1);
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
      setAudio({ alignmentStatus: 'pending' });
      if (data.title) setWorkTitle(data.title);
      await generateAllSegments(nextSong, data.title || basicInfo.theme);
    } catch (err) {
      setMessage(err.message || t('musicStudio.songGenFail'));
    } finally {
      setSongGenerating(false);
    }
  };

  const selectLibrarySong = (songId) => {
    const picked = songLibrary.find((item) => String(item.id) === String(songId));
    if (!picked) return;
    let lyrics = [];
    try {
      lyrics = parseLyricsFile(picked.lyrics || '').map((row) => ({
        ...row,
        text: row.text.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '').replace(/\s*[—–]\s*/g, ' ').replace(/\s+-\s+/g, ' ').replace(/\s{2,}/g, ' ').trim(),
      }));
    } catch { lyrics = []; }
    const title = picked.name || t('musicStudio.untitled');
    setSong({ title, songMeta: { source: 'library', melodyType: picked.melody_type || picked.melodyType || '' }, lyrics, targetPatterns: String(basicInfo.goals || '').split(/[,，；;\n]/).map((item) => item.trim()).filter(Boolean) });
    setWorkTitle(title);
    setAudio({ vocal: picked.vocal_url || picked.vocalUrl || '', vocalName: title, backing: picked.instrumental_url || picked.instrumentalUrl || '', backingName: title });
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
  const generateAllSegments = async (songOverride, titleOverride, resume = false, audioOverride) => {
    if (segmentBusy) return;
    const activeSong = songOverride?.lyrics ? songOverride : song;
    const activeTitle = titleOverride || activeSong.title || workTitle || 'Music Star Quest';
    if (!activeSong.lyrics.length) { setMessage(t('musicStudio.noLyricsForAudio')); return; }
    const id = editingIdRef.current;
    if (!id) return;
    const currentAudio = audioOverride || audio;
    setSegmentBusy('all');
    setMessage(t('musicStudio.fullSongSubmitting'));
    try {
      if (!resume) await updateCreativeWork(id, { song: activeSong, title: activeTitle, parameters: basicInfo });
      const generated = await generateFullSongAudio({
        id, resume, isCurrent: () => editingIdRef.current === id,
        onProgress: (executionId, phase) => setMessage(t(phase === 'backing' ? 'musicStudio.backingGenerating' : phase === 'reconnecting' ? 'musicStudio.fullSongReconnecting' : 'musicStudio.fullSongWaiting', { id: executionId })),
      });
      if (editingIdRef.current !== id) return;
      // Old lyric ranges, fragments and independently-generated backing do not belong to this new master.
      const nextSong = { ...activeSong, lyrics: generated.lyrics };
      const segments = generated.lyrics.map(line => line.url);
      const nextExercises = { ...exercises, ex3Data: exercises.ex3Data.map(row => ({ ...row, time: '' })) };
      const nextAudio = { ...currentAudio, vocal: generated.url, vocalName: t('musicStudio.aiFullSongName'),
        backing: generated.backingUrl || '', backingName: generated.backingUrl ? t('musicStudio.backingLabel') : '', backingStatus: generated.backing ? 'completed' : 'not_generated', segments, segmentFailures: [], actualDuration: generated.actualDuration,
        transcription: generated, timingSource: generated.timingSource,
        alignmentStatus: 'needs_review', generationTask: { executionId: generated.executionId, promptId: generated.promptId, lyricsHash: generated.lyricsHash, status: 'completed' },
        requestedIntroSeconds: generated.requestedIntroSeconds };
      setSong(nextSong);
      setAudio(nextAudio);
      setExercises(nextExercises);
      await updateCreativeWork(id, { audio: nextAudio, song: nextSong, title: activeTitle, exercises: nextExercises });
      setRendered(false);
      setMessage(t('musicStudio.transcriptionNeedsReview'));
      setSaveState(t('musicStudio.aiFullSongReady'));
    } catch (err) {
      // err.message 可能是本模块抛出的 musicStudio.* key，也可能是后端原文；t() + defaultValue 兼容两者
      if (editingIdRef.current === id) setMessage(err.message ? t(err.message, { defaultValue: err.message }) : t('musicStudio.fullSongFail'));
    } finally {
      setSegmentBusy(null);
    }
  };

  const importActualLrc = async (file) => {
    if (!file || !audio.vocal || !audio.actualDuration) return;
    const id = editingIdRef.current;
    try {
      const lyrics = applyActualLrc(await file.text(), song.lyrics, audio.actualDuration);
      if (editingIdRef.current !== id) return;
      const nextSong = { ...song, lyrics };
      const nextAudio = { ...audio, alignmentStatus: 'lrc_imported', segments: [] };
      const nextExercises = { ...exercises, ex3Data: exercises.ex3Data.map(row => ({ ...row, time: lyrics.find(line => line.text === row.options?.[row.correct])?.time || '' })) };
      await updateCreativeWork(id, { song: nextSong, audio: nextAudio, exercises: nextExercises });
      if (editingIdRef.current !== id) return;
      setSong(nextSong);
      setAudio(nextAudio);
      setExercises(nextExercises);
      setRendered(false);
      setMessage(t('musicStudio.actualLrcImported'));
    } catch (err) { setMessage(err.message); }
  };

  // 修正单句歌词：只改写歌词条文本，时间轴与切句片段保持不变，并立即保存到服务端
  const editLyricLine = (index, text) => {
    const nextSong = { ...song, lyrics: song.lyrics.map((row, i) => (i === index ? { ...row, text } : row)) };
    setSong(nextSong);
    persist({ song: nextSong, title: nextSong.title || workTitle });
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
          ) : listError ? (
            <div className="pbv2-list-empty" role="alert">
              <p>{listError}</p>
              <button type="button" className="pbv2-ghost" onClick={loadWorks}>{t('common.retry')}</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="pbv2-list-empty">
              <Music size={48} />
              <p>{searchTerm ? t('musicStudio.noMatch') : t('musicStudio.emptyList')}</p>
            </div>
          ) : (
            <div className="pbv2-card-grid">
              {filtered.map((work) => {
                const lyricCount = work.isSummary ? work.lyricCount : work.result?.lyrics?.length || 0;
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
                        <button type="button" disabled={openingWorkId !== null} onClick={(e) => { e.stopPropagation(); openWork(work); }}>
                          {openingWorkId === work.id ? <Loader2 className="spin" size={14} /> : <Pencil size={14} />} {t(openingWorkId === work.id ? 'musicStudio.workLoading' : 'musicStudio.edit')}
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
            {STEPS.map((label, index) => (
              <button type="button" key={label} className={`${step === index ? 'is-active' : ''} ${step > index ? 'is-done' : ''}`} onClick={() => enterStep(index)}>
                <span>{index + 1}</span>
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
                <OptionGroup label={t('musicStudio.ageLabel')} options={[{ value: '4–6 岁', label: t('musicStudio.age4to6') }, { value: '7–10 岁', label: t('musicStudio.age7to10') }, { value: '11–14 岁', label: t('musicStudio.age11to14') }]} value={basicInfo.age} onChange={(v) => setBasicInfo({ ...basicInfo, age: v })} tone="coral" />
                <OptionGroup label={t('musicStudio.levelLabel')} options={[{ value: '零基础', label: t('musicStudio.levelZero') }, { value: '初级（会字母和简单词）', label: t('musicStudio.levelBeginner') }, { value: '中级（能简单对话）', label: t('musicStudio.levelIntermediate') }, { value: '高级（能阅读和表达）', label: t('musicStudio.levelAdvanced') }]} value={basicInfo.level} onChange={(v) => setBasicInfo({ ...basicInfo, level: v })} tone="blue" />
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
              <section className="pbv2-card pbv2-tone-yellow">
                <div className="pbv2-card-title">{t('musicStudio.chooseLibrarySong')}</div>
                <select className="pbv2-input" disabled={Boolean(segmentBusy) || songGenerating} defaultValue="" onChange={(event) => selectLibrarySong(event.target.value)}>
                  <option value="">{t('musicStudio.chooseLibrarySongPlaceholder')}</option>
                  {songLibrary.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </section>
              <footer className="pbv2-actions">
                <ChevronRight size={16} />
                <button type="button" className="pbv2-primary" disabled={!basicReady || songGenerating} onClick={continueFromBasic}>
                  {songGenerating ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                  {songGenerating ? t('musicStudio.aiGenerating') : (song.songMeta?.source === 'library' ? t('common.next') : t('musicStudio.aiGenSong'))}
                </button>
              </footer>
            </div>
          )}

          {/* step 2 · 歌曲创作 */}
          {step === 1 && (
            <div className="pbv2-step-panel">
              <PrepSongPlayer audio={audio} />
              {audio.generationTask?.status === 'submitted' && <p>{t('musicStudio.resumeFullSong')}</p>}
              {audio.alignmentStatus === 'pending' && (
                <section className="pbv2-card pbv2-tone-yellow">
                  <p>{t('musicStudio.actualLrcHint')}</p>
                  <label className="pbv2-ghost">{t('musicStudio.importActualLrc')}<input type="file" accept=".lrc" disabled={Boolean(segmentBusy)} onChange={event => { importActualLrc(event.target.files?.[0]); event.target.value = ''; }} /></label>
                </section>
              )}
              <LyricsEditor lyrics={song.lyrics} audio={audio} workId={editingIdRef.current} onEditLyric={editLyricLine} />
              <footer className="pbv2-actions">
                <button type="button" className="pbv2-ghost" onClick={() => setStep(0)}>{t('musicStudio.backToBasic')}</button>
                <button type="button" className="pbv2-ghost" disabled={songGenerating || Boolean(segmentBusy)} onClick={requestSongRegen}>
                  {songGenerating ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
                  {songGenerating ? t('musicStudio.aiGenerating') : t('musicStudio.aiRegenSong')}
                </button>
                <button type="button" className="pbv2-primary" disabled={saving || Boolean(segmentBusy)} onClick={saveSong}>
                  <Save size={16} /> {t('musicStudio.saveToExercises')}
                </button>
              </footer>
            </div>
          )}

          {/* step 3 · 第一关 Lyric Hunter（填空 + 连词 + 听音 + 教案） */}
          {step === 2 && (
            <div className="pbv2-step-panel">
              <PrepSongPlayer audio={audio} />
              <FillEditor lyrics={song.lyrics} items={exercises.ex1FillData} onChange={(ex1FillData) => setExercises({ ...exercises, ex1FillData })} onPersistVisual={(ex1FillData) => persist({ exercises: { ...exercises, ex1FillData } })} onGenerate={() => requestSectionRegen('ex1FillData')} generating={sectionGenerating === 'ex1FillData'} />
              <ScrambleEditor lyrics={song.lyrics} items={exercises.ex2Items} onChange={(ex2Items) => setExercises({ ...exercises, ex2Items })} onGenerate={() => requestSectionRegen('ex2Items')} generating={sectionGenerating === 'ex2Items'} />
              <ListenEditor lyrics={song.lyrics} audio={audio} items={exercises.ex3Data} onChange={(ex3Data) => setExercises({ ...exercises, ex3Data })} onGenerate={() => requestSectionRegen('ex3Data')} generating={sectionGenerating === 'ex3Data'} />
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

          {/* step 4 · 第二关 Melody Mover（缺省槽位 + 教案） */}
          {step === 3 && (
            <div className="pbv2-step-panel cw-melody-prep-layout">
              <PrepSongPlayer audio={audio} />
              <div className="cw-melody-scroll cw-melody-scroll-left"><EditablePool title={t('musicStudio.actionsTitle')} options={DEFAULT_ACTIONS} thumbBase={ACTION_IMAGE_BASE} items={exercises.melodyActions || []} onChange={(melodyActions) => setExercises({ ...exercises, melodyActions })} /></div>
              <div className="cw-melody-scroll cw-melody-scroll-right"><EditablePool title={t('musicStudio.instrumentsTitle')} options={DEFAULT_INSTRUMENTS} items={exercises.melodyInstruments || []} onChange={(melodyInstruments) => setExercises({ ...exercises, melodyInstruments })} /></div>
              <div className="cw-melody-defaults-wrap">
                <MelodyDefaultsEditor lyrics={song.lyrics} actions={exercises.melodyActions || []} instruments={exercises.melodyInstruments || []} slots={exercises.melodySlots || []} onChange={(melodySlots) => setExercises({ ...exercises, melodySlots })} />
              </div>
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
              <PrepSongPlayer audio={audio} />
              <EchoMasterPreview lyrics={song.lyrics} audio={audio} echoData={exercises.echoData} onChange={(echoData) => setExercises({ ...exercises, echoData })} onGenerate={() => requestSectionRegen('echoData')} generating={sectionGenerating === 'echoData'} />
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
              <PrepSongPlayer audio={audio} />
              <div className="pbv2-making-toolbar">
                <button type="button" className="pbv2-ghost" disabled={!rendered || rendering} onClick={() => presentCurrent()}>
                  {rendering ? <Loader2 className="spin" size={16} /> : null}
                  🖥️ {t('common.teachMode')}
                </button>
                <span className="pbv2-save-state">{rendering ? t('musicStudio.rendering') : (rendered ? t('musicStudio.renderedReady') : '')}</span>
              </div>
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

      {exGenerating && (
        <div className="cw-global-loading" role="status" aria-live="polite" aria-busy="true">
          <div className="cw-global-loading-card">
            <Loader2 className="spin" size={36} />
            <strong>{t('musicStudio.loadingExercisesTitle')}</strong>
            <span>{t('musicStudio.loadingExercisesHint')}</span>
          </div>
        </div>
      )}

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
