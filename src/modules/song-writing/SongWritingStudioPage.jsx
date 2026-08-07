import React from 'react';
import {
  BookOpenText,
  Clock,
  Expand,
  Music2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Volume2,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';
import { parseJsonSafely, responseErrorMessage } from '../../utils/responseUtils';
import './SongWritingStudioPage.css';

const melodies = [
  { id: 'twinkle', name: 'Twinkle, Twinkle, Little Star', hint: '小星星', src: '/audio/twinkle-little-star.mp3' },
  { id: 'sunshine', name: "You Are My Sunshine", hint: '你是我的阳光', src: '/audio/you-are-my-sunshine.mp3' },
  { id: 'edelweiss', name: 'Edelweiss', hint: '雪绒花', src: '/audio/edelweiss.mp3' },
  { id: 'if-youre-happy', name: "If You're Happy and You Know It", hint: 'If You’re Happy and You Know It', src: "/audio/If You're Happy and You Know It (Karaoke Version) (Originally Performed By Kids Karaoke) - Zoom Karaoke.mp3" },
];

const instruments = [
  { id: 'maracas', emoji: '🪇', label: '砂槌' },
  { id: 'tambourine', emoji: '🪘', label: '铃鼓' },
  { id: 'hand-drum', emoji: '🥁', label: '手鼓' },
  { id: 'triangle', emoji: '△', label: '三角铁' },
  { id: 'ukulele', emoji: '🎸', label: '尤克里里' },
  { id: 'castanets', emoji: '🪇', label: '响板' },
  { id: 'shaker', emoji: '🪇', label: '沙锤' },
  { id: 'xylophone', emoji: '🎹', label: '木琴' },
];

function makeDraft({ languagePoint, theme, melody }) {
  const baseWords = (languagePoint || 'happy, excited, sad, angry, tired, bored, shy, calm').split(/[,，、\s]+/).filter(Boolean);
  const extraByTheme = {
    '情绪表达': ['scared', 'proud', 'lonely', 'surprised', 'confused', 'grateful', 'hopeful', 'peaceful'],
    '自然探索': ['sunny', 'rainy', 'windy', 'curious', 'amazed', 'free', 'wild', 'bright'],
    '自我认知': ['strong', 'weak', 'growing', 'learning', 'unique', 'special', 'confident', 'honest'],
    '人际关系': ['friendly', 'kind', 'helpful', 'sharing', 'caring', 'listening', 'loving', 'trusting'],
    '勇气与冒险': ['brave', 'bold', 'daring', 'adventurous', 'fearless', 'strong', 'ready', 'determined'],
  };
  const extras = extraByTheme[theme] || extraByTheme['情绪表达'];
  const words = [...new Set([...baseWords, ...extras])].slice(0, 16);
  const title = theme === '勇气与冒险' ? 'A Brave Little Sky' : theme === '自然探索' ? 'The Sky Inside Me' : 'My Little Bright Song';
  const linesByMelody = {
    twinkle: ['Twinkle, twinkle, I feel ______.', 'Twinkle, twinkle, bright and ______.', 'Up above, I sing today.', 'My ______ feelings light the way.', 'Twinkle, twinkle, hear me say.', 'I can share my ______ today.'],
    sunshine: ['You are my ______, my only ______.', 'You make me ______ when skies are gray.', 'You will never know, dear friends,', 'How ______ you make me feel today.'],
    edelweiss: ['Edelweiss, edelweiss, ______ and ______.', 'Every morning you greet me.', 'Small and white, clean and bright,', 'You make me feel ______ and light.'],
    'if-youre-happy': ["If you're ______ and you know it, clap your hands.", "If you're ______ and you know it, clap your hands.", "If you're ______ and you know it, then your face will surely show it.", "If you're ______ and you know it, clap your hands."],
  };
  return {
    title,
    melody,
    words,
    lines: linesByMelody[melody] || linesByMelody.twinkle,
  };
}

function downloadInteractiveHtml(draft, form, melody) {
  const lines = draft.lines.map((line) => `<p>${line.replace('______', '<input aria-label="fill in the blank">')}</p>`).join('');
  const words = draft.words.map((word) => `<button>${word}</button>`).join('');
  const html = `<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${draft.title}</title><style>body{margin:0;font-family:Arial,"Microsoft YaHei";color:#514d56}main{max-width:625px;margin:25px auto;text-align:center}h1{margin:0;font-size:28px}small{color:#aaa}.player{margin-top:20px;padding:16px;border-radius:16px;background:#a9ded7;border-bottom:4px solid #7cc8bd}.grid{display:grid;grid-template-columns:398px 212px;gap:15px;margin-top:14px;text-align:left}.lyrics,.words,.instruments{padding:14px;border-radius:14px}.lyrics{background:#e9def3}.words{background:#f9da50}.instruments{margin-top:12px;background:#f29c79}.lyrics p{padding:7px;border-bottom:1px solid #d6c8e2}.lyrics input{width:60px;border:2px solid #555;border-radius:8px}.words button{width:48%;margin:3px;border:2px solid #555;border-radius:16px;background:#fff;padding:6px;font-weight:bold}.foot{color:#eabf35;padding:20px}@media(max-width:650px){.grid{grid-template-columns:1fr}}</style><main><h1>${draft.title}</h1><small>旋律：${melody.name} · ${form.age}岁 · ${form.level}</small><section class="player">🎵 伴奏播放 ▶ ━━━━━━ 音量</section><div class="grid"><section class="lyrics"><b>🎶 填词模板</b>${lines}</section><div><section class="words"><b>📚 Word Bank</b><p>点击单词填入空格</p>${words}</section><section class="instruments"><b>🎸 乐器</b><p>👏 拍手 🥁 手鼓 🔔 铃鼓 🪇 沙锤</p></section></div></div><div class="foot">⭐ ☀️ 🌈 🎵 💛 ⭐<br><small>幸福力英文歌曲创编 · 轻松唱出心情</small></div></main></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `${draft.title || 'song-writing'}.html`; link.click(); URL.revokeObjectURL(url);
}

export function SongWritingStudioPage() {
  const audioRef = React.useRef(null);
  const melodyPreviewRef = React.useRef(null);
  const [form, setForm] = React.useState({ languagePoint: 'happy, calm, brave', age: '7-9', level: '初级（会字母和简单词）', theme: '情绪表达', melody: 'twinkle' });
  const [draft, setDraft] = React.useState(() => makeDraft({ languagePoint: 'happy, calm, brave', theme: '情绪表达', melody: 'twinkle' }));
  const [playing, setPlaying] = React.useState(false);
  const [melodyPreviewPlaying, setMelodyPreviewPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const [volume, setVolume] = React.useState(.75);
  const [activeBlank, setActiveBlank] = React.useState(null);
  const [blankValues, setBlankValues] = React.useState({});
  const [arrangement, setArrangement] = React.useState({});
  const [showWords, setShowWords] = React.useState(false);
  const [showPlan, setShowPlan] = React.useState(false);
  const [showContentEditor, setShowContentEditor] = React.useState(false);
  const [view, setView] = React.useState('list');
  const [works, setWorks] = React.useState(() => JSON.parse(localStorage.getItem('song-writing-works') || '[]'));
  const [searchTerm, setSearchTerm] = React.useState('');
  const [saveMessage, setSaveMessage] = React.useState('');
  const [generatedPlan, setGeneratedPlan] = React.useState(null);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const selectedMelody = melodies.find((item) => item.id === form.melody) || melodies[0];

  React.useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = speed;
    audioRef.current.volume = volume;
  }, [speed, volume]);

  React.useEffect(() => {
    setMelodyPreviewPlaying(false);
    if (!melodyPreviewRef.current) return;
    melodyPreviewRef.current.pause();
    melodyPreviewRef.current.currentTime = 0;
  }, [form.melody]);

  React.useEffect(() => {
    const root = document.querySelector('.song-writing-page');
    if (!root) return undefined;

    const cleanups = [];
    const listen = (element, eventName, handler) => {
      element.addEventListener(eventName, handler);
      cleanups.push(() => element.removeEventListener(eventName, handler));
    };
    const setPayload = (event, payload) => {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('application/x-song-writing', JSON.stringify(payload));
    };
    root.querySelectorAll('.word-chips button').forEach((button) => {
      const word = draft.words.find((item) => button.textContent.trim().endsWith(item));
      if (!word) return;
      button.draggable = true;
      listen(button, 'dragstart', (event) => setPayload(event, { type: 'word', word }));
    });
    root.querySelectorAll('.instrument-chips button').forEach((button) => {
      const instrument = instruments.find((item) => button.textContent.trim().endsWith(item.label));
      if (!instrument) return;
      button.draggable = true;
      listen(button, 'dragstart', (event) => setPayload(event, { type: 'instrument', instrument }));
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [draft.lines, draft.words]);

  const toggleAudio = async () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    try {
      await audioRef.current.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  };

  const toggleMelodyPreview = async () => {
    const audio = melodyPreviewRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      setMelodyPreviewPlaying(false);
      return;
    }
    try {
      await audio.play();
      setMelodyPreviewPlaying(true);
    } catch {
      setMelodyPreviewPlaying(false);
    }
  };

  const regenerate = () => {
    setDraft(makeDraft(form));
    setActiveBlank(null);
    setBlankValues({});
    setArrangement({});
  };

  const fillWordAt = (word, lineIndex) => {
    if (lineIndex === null || lineIndex === undefined) return;
    setBlankValues((current) => ({ ...current, [lineIndex]: word }));
  };

  const fillWord = (word) => {
    if (activeBlank === null) return;
    fillWordAt(word, activeBlank);
    setActiveBlank(null);
  };

  const addInstrument = (lineIndex, instrument) => setArrangement((current) => ({ ...current, [lineIndex]: [...(current[lineIndex] || []), instrument] }));
  const dropOnLine = (event, lineIndex, target) => {
    event.preventDefault();
    try {
      const payload = JSON.parse(event.dataTransfer.getData('application/x-song-writing'));
      if (payload.type === 'word' && target === 'word') fillWordAt(payload.word, lineIndex);
      if (payload.type === 'instrument' && target === 'instrument') addInstrument(lineIndex, payload.instrument);
    } catch {
      // Ignore drops that did not originate from the song-writing studio.
    }
  };
  const saveWork = () => {
    const work = { id: Date.now(), title: draft.title, draft, form, blankValues, arrangement, date: new Date().toLocaleDateString('zh-CN') };
    const next = [work, ...works.filter((item) => item.title !== work.title)];
    setWorks(next);
    localStorage.setItem('song-writing-works', JSON.stringify(next));
    setSaveMessage('已保存作品');
    window.setTimeout(() => setSaveMessage(''), 2400);
  };
  const generateSong = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate-song-writing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, melody: selectedMelody.name }) });
      const result = await parseJsonSafely(response);
      if (!response.ok || !result?.success) {
        throw new Error(responseErrorMessage(response, result, '歌曲生成失败，请稍后重试'));
      }
      const data = result.data;
      setDraft({ title: data.title, melody: form.melody, words: data.words, lines: data.lines });
      setGeneratedPlan(data.activityPlan);
      setBlankValues({});
      setArrangement({});
      setView('preview');
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : '歌曲生成失败');
    } finally { setIsGenerating(false); }
  };

  if (view === 'list') {
    const filteredWorks = works.filter((work) => work.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const removeWork = (id) => { const next = works.filter((work) => work.id !== id); setWorks(next); localStorage.setItem('song-writing-works', JSON.stringify(next)); };
    const openWork = (work) => { setDraft(work.draft); setForm(work.form); setBlankValues(work.blankValues || {}); setArrangement(work.arrangement || {}); setView('preview'); };
    return <main className="picture-book-studio-v2 pbv2-list-page"><header className="pbv2-topbar"><div className="pbv2-topbar-left"><div className="pbv2-topbar-icon"><BookOpenText size={28} /></div><div><h1>歌曲编排</h1><p>创建和管理你的歌曲互动作品</p></div></div><button type="button" className="pbv2-create-btn" style={{ display: 'inline-flex', minWidth: 126, color: '#fff', background: '#ef7865' }} onClick={() => setView('form')}><Plus size={18} color="#fff" /><span style={{ display: 'inline', color: '#fff' }}>新建歌曲</span></button></header><div className="pbv2-list-toolbar"><div className="pbv2-search-box"><Search size={16} /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜索歌曲..." /></div></div>{filteredWorks.length === 0 ? <div className="pbv2-list-empty"><BookOpenText size={48} /><p>还没有歌曲作品，点击右上角创建</p></div> : <div className="pbv2-card-grid">{filteredWorks.map((work) => <article key={work.id} className="pbv2-book-card" onClick={() => openWork(work)}><div className="pbv2-book-cover"><div className="pbv2-book-cover-placeholder"><Music2 size={32} /></div><span className="pbv2-book-status draft">草稿</span></div><div className="pbv2-book-info"><h3>{work.title || '未命名歌曲'}</h3><div className="pbv2-book-meta"><Clock size={13} /><span>{work.date}</span></div><div className="pbv2-book-actions"><button type="button" onClick={(e) => { e.stopPropagation(); openWork(work); }}><Pencil size={14} />编辑</button><button type="button" onClick={(e) => { e.stopPropagation(); removeWork(work.id); }}><Trash2 size={14} />删除</button></div></div></article>)}</div>}</main>;
  }

  if (view === 'form' && isGenerating) return <SongGenerationLoading />;

  if (view === 'form') return <main className="song-hub song-setup-page"><header><div><p>步骤 1 / 2</p><h1>创建歌曲互动</h1><span>设置课堂对象与歌曲主题，生成后可继续编辑歌词和词库。</span></div><button type="button" className="plain" onClick={() => setView('list')}>返回列表</button></header><section className="song-condition-card"><div className="condition-title"><span>✨</span><div><h2>歌曲创编参数</h2><p>选择适合孩子的语言点与旋律。</p></div></div><audio ref={melodyPreviewRef} src={selectedMelody.src} onEnded={() => setMelodyPreviewPlaying(false)} /><div className="song-form-grid"><label className="song-wide">目标语言点<input value={form.languagePoint} placeholder="例如：happy, calm, brave" onChange={(e) => setForm({ ...form, languagePoint: e.target.value })} /></label><ChoiceField label="年龄段" value={form.age} options={['7-9', '10-12', '13-15']} onChange={(age) => setForm({ ...form, age })} /><ChoiceField label="英文水平" value={form.level} options={['初级（会字母和简单词）', '中级（能简单对话）', '高级（能阅读和表达）']} onChange={(level) => setForm({ ...form, level })} /><ChoiceField label="幸福力主题" value={form.theme} options={['情绪表达', '自然探索', '自我认知', '人际关系', '勇气与冒险']} onChange={(theme) => setForm({ ...form, theme })} /><div className="melody-control"><label>旋律选择<select value={form.melody} onChange={(e) => setForm({ ...form, melody: e.target.value })}>{melodies.map((melody) => <option value={melody.id} key={melody.id}>{melody.name}</option>)}</select></label><button type="button" className={`melody-preview${melodyPreviewPlaying ? ' is-playing' : ''}`} onClick={toggleMelodyPreview} aria-label={melodyPreviewPlaying ? `暂停试听 ${selectedMelody.name}` : `试听 ${selectedMelody.name}`} aria-pressed={melodyPreviewPlaying}>{melodyPreviewPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}{melodyPreviewPlaying ? '暂停' : '试听'}</button></div></div><button type="button" className="generate-html" disabled={isGenerating} onClick={generateSong}><Sparkles size={18} />生成歌词和词库</button></section></main>;

  return (
    <main className="song-writing-page sky-song-page">
      <audio ref={audioRef} src={selectedMelody.src} onEnded={() => setPlaying(false)} />
      {/* Background decorations */}
      <svg className="bg-deco note1" width="40" height="52" viewBox="0 0 40 52"><ellipse cx="12" cy="42" rx="7" ry="5.5" fill="#e8ddf0" stroke="#2d2d2d" strokeWidth="2" transform="rotate(-20,12,42)"/><line x1="18" y1="38" x2="18" y2="8" stroke="#2d2d2d" strokeWidth="2.5"/><path d="M18 8 Q28 6 26 18 Q24 14 18 14" fill="#e8ddf0" stroke="#2d2d2d" strokeWidth="2"/></svg>
      <svg className="bg-deco note2" width="44" height="52" viewBox="0 0 44 52"><ellipse cx="10" cy="42" rx="7" ry="5.5" fill="#a8e0d8" stroke="#2d2d2d" strokeWidth="2" transform="rotate(-20,10,42)"/><ellipse cx="30" cy="38" rx="7" ry="5.5" fill="#a8e0d8" stroke="#2d2d2d" strokeWidth="2" transform="rotate(-20,30,38)"/><line x1="16" y1="38" x2="16" y2="8" stroke="#2d2d2d" strokeWidth="2.5"/><line x1="36" y1="34" x2="36" y2="8" stroke="#2d2d2d" strokeWidth="2.5"/><line x1="16" y1="8" x2="36" y2="8" stroke="#2d2d2d" strokeWidth="3"/></svg>
      <svg className="bg-deco note3" width="36" height="48" viewBox="0 0 36 48"><ellipse cx="11" cy="38" rx="6.5" ry="5" fill="#f7d958" stroke="#2d2d2d" strokeWidth="2" transform="rotate(-18,11,38)"/><line x1="17" y1="34" x2="17" y2="6" stroke="#2d2d2d" strokeWidth="2.5"/><path d="M17 6 Q27 4 25 16 Q23 12 17 12" fill="#f7d958" stroke="#2d2d2d" strokeWidth="2"/></svg>
      <svg className="bg-deco note4" width="42" height="52" viewBox="0 0 42 52"><ellipse cx="11" cy="42" rx="7" ry="5.5" fill="#e8ddf0" stroke="#2d2d2d" strokeWidth="2" transform="rotate(-20,11,42)"/><ellipse cx="31" cy="38" rx="7" ry="5.5" fill="#e8ddf0" stroke="#2d2d2d" strokeWidth="2" transform="rotate(-20,31,38)"/><line x1="17" y1="38" x2="17" y2="8" stroke="#2d2d2d" strokeWidth="2.5"/><line x1="37" y1="34" x2="37" y2="8" stroke="#2d2d2d" strokeWidth="2.5"/><line x1="17" y1="8" x2="37" y2="8" stroke="#2d2d2d" strokeWidth="3"/></svg>
      <svg className="bg-deco note5" width="36" height="48" viewBox="0 0 36 48"><ellipse cx="11" cy="38" rx="6.5" ry="5" fill="#f0a080" stroke="#2d2d2d" strokeWidth="2" transform="rotate(-18,11,38)"/><line x1="17" y1="34" x2="17" y2="6" stroke="#2d2d2d" strokeWidth="2.5"/><path d="M17 6 Q27 4 25 16 Q23 12 17 12" fill="#f0a080" stroke="#2d2d2d" strokeWidth="2"/></svg>
      <svg className="bg-deco inst1" width="36" height="56" viewBox="0 0 36 56"><ellipse cx="18" cy="36" rx="14" ry="16" fill="#f0a080" stroke="#2d2d2d" strokeWidth="2.5"/><circle cx="18" cy="36" r="5" fill="#fff" stroke="#2d2d2d" strokeWidth="2"/><rect x="14" y="4" width="8" height="22" rx="3" fill="#f0a080" stroke="#2d2d2d" strokeWidth="2.5"/><line x1="14" y1="10" x2="14" y2="22" stroke="#2d2d2d" strokeWidth="1.5"/><line x1="18" y1="10" x2="18" y2="22" stroke="#2d2d2d" strokeWidth="1.5"/><line x1="22" y1="10" x2="22" y2="22" stroke="#2d2d2d" strokeWidth="1.5"/></svg>
      <svg className="bg-deco inst2" width="52" height="38" viewBox="0 0 52 38"><rect x="1" y="1" width="50" height="36" rx="4" fill="#a8e0d8" stroke="#2d2d2d" strokeWidth="2.5"/><line x1="1" y1="22" x2="51" y2="22" stroke="#2d2d2d" strokeWidth="2"/><line x1="8" y1="22" x2="8" y2="37" stroke="#2d2d2d" strokeWidth="1.8"/><line x1="16" y1="22" x2="16" y2="37" stroke="#2d2d2d" strokeWidth="1.8"/><line x1="24" y1="22" x2="24" y2="37" stroke="#2d2d2d" strokeWidth="1.8"/><line x1="32" y1="22" x2="32" y2="37" stroke="#2d2d2d" strokeWidth="1.8"/><line x1="40" y1="22" x2="40" y2="37" stroke="#2d2d2d" strokeWidth="1.8"/><rect x="4" y="2" width="4" height="18" rx="1" fill="#2d2d2d"/><rect x="12" y="2" width="4" height="18" rx="1" fill="#2d2d2d"/><rect x="28" y="2" width="4" height="18" rx="1" fill="#2d2d2d"/><rect x="36" y="2" width="4" height="18" rx="1" fill="#2d2d2d"/></svg>
      <svg className="bg-deco flower1" width="38" height="38" viewBox="0 0 38 38"><circle cx="19" cy="10" r="7" fill="#f0a080" stroke="#2d2d2d" strokeWidth="2"/><circle cx="27" cy="19" r="7" fill="#f0a080" stroke="#2d2d2d" strokeWidth="2"/><circle cx="24" cy="31" r="7" fill="#f0a080" stroke="#2d2d2d" strokeWidth="2"/><circle cx="14" cy="31" r="7" fill="#f0a080" stroke="#2d2d2d" strokeWidth="2"/><circle cx="11" cy="19" r="7" fill="#f0a080" stroke="#2d2d2d" strokeWidth="2"/><circle cx="19" cy="19" r="5" fill="#f7d958" stroke="#2d2d2d" strokeWidth="2"/></svg>
      <svg className="bg-deco flower2" width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="9" r="6" fill="#e8ddf0" stroke="#2d2d2d" strokeWidth="2"/><circle cx="24" cy="17" r="6" fill="#e8ddf0" stroke="#2d2d2d" strokeWidth="2"/><circle cx="21" cy="27" r="6" fill="#e8ddf0" stroke="#2d2d2d" strokeWidth="2"/><circle cx="13" cy="27" r="6" fill="#e8ddf0" stroke="#2d2d2d" strokeWidth="2"/><circle cx="10" cy="17" r="6" fill="#e8ddf0" stroke="#2d2d2d" strokeWidth="2"/><circle cx="17" cy="17" r="4.5" fill="#f7d958" stroke="#2d2d2d" strokeWidth="2"/></svg>
      <svg className="bg-deco flower3" width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="8" r="5.5" fill="#f7d958" stroke="#2d2d2d" strokeWidth="2"/><circle cx="23" cy="16" r="5.5" fill="#f7d958" stroke="#2d2d2d" strokeWidth="2"/><circle cx="20" cy="25" r="5.5" fill="#f7d958" stroke="#2d2d2d" strokeWidth="2"/><circle cx="12" cy="25" r="5.5" fill="#f7d958" stroke="#2d2d2d" strokeWidth="2"/><circle cx="9" cy="16" r="5.5" fill="#f7d958" stroke="#2d2d2d" strokeWidth="2"/><circle cx="16" cy="16" r="4" fill="#fff" stroke="#2d2d2d" strokeWidth="2"/></svg>
      <svg className="bg-deco flower4" width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="9" r="6.5" fill="#f0a080" stroke="#2d2d2d" strokeWidth="2"/><circle cx="26" cy="18" r="6.5" fill="#f0a080" stroke="#2d2d2d" strokeWidth="2"/><circle cx="23" cy="29" r="6.5" fill="#f0a080" stroke="#2d2d2d" strokeWidth="2"/><circle cx="13" cy="29" r="6.5" fill="#f0a080" stroke="#2d2d2d" strokeWidth="2"/><circle cx="10" cy="18" r="6.5" fill="#f0a080" stroke="#2d2d2d" strokeWidth="2"/><circle cx="18" cy="18" r="4.5" fill="#f7d958" stroke="#2d2d2d" strokeWidth="2"/></svg>
      <svg className="bg-deco heart1" width="32" height="30" viewBox="0 0 32 30"><path d="M16 28 C16 28 2 18 2 10 C2 5 6 2 10 2 C13 2 16 5 16 5 C16 5 19 2 22 2 C26 2 30 5 30 10 C30 18 16 28 16 28Z" fill="#f0a080" stroke="#2d2d2d" strokeWidth="2.5"/></svg>
      <svg className="bg-deco heart2" width="28" height="26" viewBox="0 0 28 26"><path d="M14 24 C14 24 2 15 2 9 C2 4.5 5.5 2 9 2 C11.5 2 14 4.5 14 4.5 C14 4.5 16.5 2 19 2 C22.5 2 26 4.5 26 9 C26 15 14 24 14 24Z" fill="#e8ddf0" stroke="#2d2d2d" strokeWidth="2.5"/></svg>
      <svg className="bg-deco heart3" width="26" height="24" viewBox="0 0 26 24"><path d="M13 22 C13 22 2 14 2 8.5 C2 4.5 5 2 8 2 C10.5 2 13 4.5 13 4.5 C13 4.5 15.5 2 18 2 C21 2 24 4.5 24 8.5 C24 14 13 22 13 22Z" fill="#f7d958" stroke="#2d2d2d" strokeWidth="2.5"/></svg>
      <svg className="bg-deco smiley1" width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="15.5" fill="#f7d958" stroke="#2d2d2d" strokeWidth="2.5"/><circle cx="11" cy="13" r="2.5" fill="#2d2d2d"/><circle cx="23" cy="13" r="2.5" fill="#2d2d2d"/><path d="M10 22 Q17 30 24 22" fill="none" stroke="#2d2d2d" strokeWidth="2.5" strokeLinecap="round"/></svg>
      <svg className="bg-deco smiley2" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="14" fill="#a8e0d8" stroke="#2d2d2d" strokeWidth="2.5"/><circle cx="10" cy="12" r="2" fill="#2d2d2d"/><circle cx="20" cy="12" r="2" fill="#2d2d2d"/><path d="M9 20 Q15 27 21 20" fill="none" stroke="#2d2d2d" strokeWidth="2.5" strokeLinecap="round"/></svg>
      <svg className="bg-deco star1" width="28" height="28" viewBox="0 0 28 28"><polygon points="14,1 17.5,10 27,10 19.5,16 22,25 14,20 6,25 8.5,16 1,10 10.5,10" fill="#f7d958" stroke="#2d2d2d" strokeWidth="2"/></svg>
      <svg className="bg-deco star2" width="24" height="24" viewBox="0 0 24 24"><polygon points="12,1 14.5,9 23,9 16,14 18.5,22 12,17 5.5,22 8,14 1,9 9.5,9" fill="#e8ddf0" stroke="#2d2d2d" strokeWidth="2"/></svg>
      <svg className="bg-deco star3" width="22" height="22" viewBox="0 0 22 22"><polygon points="11,1 13,8 21,8 14.5,13 16.5,20 11,15.5 5.5,20 7.5,13 1,8 9,8" fill="#f0a080" stroke="#2d2d2d" strokeWidth="2"/></svg>
      <svg className="bg-deco star4" width="26" height="26" viewBox="0 0 26 26"><polygon points="13,1 15.5,9.5 25,9.5 17.5,15 20,24 13,19 6,24 8.5,15 1,9.5 10.5,9.5" fill="#f7d958" stroke="#2d2d2d" strokeWidth="2"/></svg>
      <header className="sky-title"><h1>{draft.title}</h1><p>旋律：{selectedMelody.name} · {form.age}岁 · {form.level}</p></header>
      <div className="sky-actions"><button type="button" onClick={() => setShowContentEditor(true)}>编辑歌词和词库</button><button type="button" onClick={saveWork}>💾 保存作品</button><button type="button" onClick={() => downloadInteractiveHtml(draft, form, selectedMelody)}>下载 HTML</button><button type="button" onClick={() => setShowPlan(true)}>📋 活动方案</button>{saveMessage && <span role="status">{saveMessage}</span>}</div><button type="button" className="sky-back" onClick={() => setView('list')}>← 返回作品列表</button>

      <section className="sky-studio">
        <article className="sky-player">
          <strong>🎵 伴奏播放</strong><div className="sky-player-row"><button type="button" className="sky-play" onClick={toggleAudio}>{playing ? <Pause fill="currentColor" size={17} /> : <Play fill="currentColor" size={17} />}</button><small>0:00</small><input aria-label="播放进度" type="range" /><small>0:00</small></div>
          <div className="speed-row">{[0.5,0.75,1,1.25,1.5].map((item) => <button type="button" className={speed === item ? 'active' : ''} key={item} onClick={() => setSpeed(item)}>{item}×</button>)}</div>
          <label className="sky-volume"><Volume2 size={14} /><input aria-label="音量" type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(Number(e.target.value))} /><b>{Math.round(volume * 100)}%</b></label><p>{selectedMelody.name} · {selectedMelody.hint}</p>
        </article>

        <div className="sky-content">
          <article className="sky-lyrics">
            <div className="sky-card-title"><b>🎶 填词模板</b><span>拖拽单词或直接输入</span></div>
            <div className="lyrics-lines">
            {draft.lines.map((line, index) => (
              <div className="lyric-line" key={`${index}-${line}`}>
                {(() => {
                  const editable = /^(.*?)(______)(.*)$/.exec(line);
                  return editable ? <><span className="lyric-copy">{editable[1]}</span><input className="lyric-blank" aria-label={`第 ${index + 1} 行填词`} value={blankValues[index] || ''} onFocus={() => setActiveBlank(index)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropOnLine(event, index, 'word')} onChange={(e) => setBlankValues((current) => ({ ...current, [index]: e.target.value }))} /><span className="lyric-copy">{editable[3]}</span></> : <span className="lyric-copy">{line}</span>;
                })()}
                <div className="line-instruments" onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropOnLine(event, index, 'instrument')}>{(arrangement[index] || []).map((instrument, itemIndex) => <span key={`${instrument.id}-${itemIndex}`}>{instrument.emoji}</span>)}<button type="button" title="为这一句配器" onClick={() => addInstrument(index, instruments[index % instruments.length])}>＋</button></div>
              </div>
            ))}
            </div><button type="button" className="sky-clear" onClick={regenerate}><RefreshCw size={14} />清空所有填空</button>
          </article>
          <div className="sky-sidecards">
            <article className="sky-words"><div className="sky-card-title"><b>📚 Word Bank</b><button type="button" onClick={() => setShowWords(true)}><Expand size={15} /></button></div><span>拖到左边空格</span><div className="word-chips">{draft.words.map((word, index) => <button type="button" key={`${word}-${index}`} onClick={() => fillWord(word)}><i>{['😊','😌','😎','🌈','⭐'][index % 5]}</i>{word}</button>)}</div><p>💡 先点击歌词空格，再点击单词填入</p></article>
            <article className="sky-instruments"><div className="sky-card-title"><b>🎸 乐器</b><span>拖到歌词旁</span></div><div className="instrument-chips">{instruments.map((instrument) => <button type="button" draggable key={instrument.id} onClick={() => activeBlank !== null && addInstrument(activeBlank, instrument)}><i>{instrument.emoji}</i>{instrument.label}</button>)}</div><p>💡 先点击乐器，再点击歌词旁的圆圈</p></article>
          </div>
        </div>
        <footer className="sky-footer">⭐ ☀️ 🌈 🎵 💛 ⭐<span>幸福力英文歌曲创编 · 轻松唱出心情</span></footer>
      </section>

      {showWords && <Overlay title="Word Bank · 选词区" className="word-bank-modal" onClose={() => setShowWords(false)}><p>投屏模式：邀请孩子先读、做动作，再选择最贴近自己感受的词卡。</p><div className="word-chips large">{draft.words.map((word, index) => <button type="button" key={`${word}-${index}`} onClick={() => { fillWord(word); setShowWords(false); }}><span>{['☀️', '☁️', '⭐', '🌈', '💛'][index % 5]}</span>{word}</button>)}</div></Overlay>}
      {showContentEditor && <Overlay title="编辑歌词和 Word Bank" onClose={() => setShowContentEditor(false)}><div className="song-content-editor"><section><h3>歌词模板</h3>{draft.lines.map((line, index) => <textarea key={index} value={line} rows={2} onChange={(event) => setDraft((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? event.target.value : item) }))} />)}</section><section><h3>Word Bank</h3>{draft.words.map((word, index) => <label key={index}><input value={word} onChange={(event) => setDraft((current) => ({ ...current, words: current.words.map((item, itemIndex) => itemIndex === index ? event.target.value : item) }))} /><button type="button" onClick={() => setDraft((current) => ({ ...current, words: current.words.filter((_, itemIndex) => itemIndex !== index) }))}>删除</button></label>)}<button type="button" className="add-word" onClick={() => setDraft((current) => ({ ...current, words: [...current.words, 'new word'] }))}>+ 添加词卡</button></section><button type="button" className="generate-html" onClick={() => { setBlankValues({}); setShowContentEditor(false); }}>保存修改</button></div></Overlay>}
      {showPlan && <Overlay title="活动方案" onClose={() => setShowPlan(false)}>{generatedPlan ? <div className="song-plan"><section><h3>学习目标</h3><p><b>英文：</b>{generatedPlan.englishGoal}</p><p><b>幸福力：</b>{generatedPlan.wellbeingGoal}</p></section><section><h3>课前准备</h3><p>{(generatedPlan.materials || []).join('、')}</p></section><section><h3>课堂流程</h3><ol>{(generatedPlan.steps || []).map((step, index) => <li key={index}><div><b>{index + 1}. {step.title}</b><em>{step.duration}</em></div><p>{step.teacherGuide}</p></li>)}</ol></section></div> : <p>请先生成歌词和词库，即可查看本作品的活动方案。</p>}</Overlay>}
    </main>
  );
}

function ChoiceField({ label, value, options, onChange }) { return <section className="song-choice-field"><b>{label}</b><div>{options.map((option) => <button type="button" key={option} className={value === option ? 'selected' : ''} onClick={() => onChange(option)}>{option}</button>)}</div></section>; }
function SongGenerationLoading() { return <main className="song-generation-page"><section className="song-generation-loading"><svg className="song-loading-illustration" width="165" height="145" viewBox="0 0 165 145" aria-hidden="true"><circle cx="138" cy="25" r="5" fill="#c48cff"/><circle cx="15" cy="108" r="7" fill="none" stroke="#ff7c73" strokeWidth="4"/><path d="M42 99c25 10 56 10 82-1" fill="none" stroke="#d7dce3" strokeWidth="3" strokeDasharray="5 5"/><g transform="rotate(-7 64 66)"><rect x="20" y="35" width="67" height="79" rx="12" fill="#fffdf7" stroke="#344255" strokeWidth="4"/><path d="M39 66h27M39 81h20" stroke="#75a9e8" strokeWidth="4" strokeLinecap="round"/></g><g transform="rotate(12 105 69)"><rect x="81" y="43" width="62" height="72" rx="12" fill="#f7e6ef" stroke="#344255" strokeWidth="4"/><path d="M100 71h25M100 86h17" stroke="#75a9e8" strokeWidth="4" strokeLinecap="round"/></g><g transform="rotate(-18 87 48)"><rect x="64" y="39" width="63" height="14" rx="7" fill="#ffcc63" stroke="#344255" strokeWidth="3"/><path d="M111 40h11v12h-11z" fill="#ff7c73"/><path d="M77 42h23" stroke="#fffdf7" strokeWidth="4" strokeLinecap="round"/></g></svg><h1>正在生成歌曲<span><i></i><i></i><i></i></span></h1></section></main>; }
function Overlay({ title, onClose, children, className = '' }) { return <div className="song-overlay" role="dialog" aria-modal="true"><div className={`song-modal ${className}`}><div className="modal-head"><h2>{title}</h2><button type="button" onClick={onClose}><X /></button></div>{children}</div></div>; }
