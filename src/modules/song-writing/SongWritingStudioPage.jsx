import React from 'react';
import {
  BookOpenCheck,
  BookOpenText,
  ChevronDown,
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
import './SongWritingStudioPage.css';

const melodies = [
  { id: 'twinkle', name: 'Twinkle, Twinkle, Little Star', hint: '小星星', src: '/audio/twinkle-little-star.mp3' },
  { id: 'sunshine', name: "You Are My Sunshine", hint: '你是我的阳光', src: '/audio/you-are-my-sunshine.mp3' },
  { id: 'edelweiss', name: 'Edelweiss', hint: '雪绒花', src: '/audio/edelweiss.mp3' },
];

const instruments = [
  { id: 'clap', emoji: '👏', label: 'Clap' },
  { id: 'drum', emoji: '🥁', label: 'Drum' },
  { id: 'bell', emoji: '🔔', label: 'Bell' },
  { id: 'shaker', emoji: '🪇', label: 'Shaker' },
];

function makeDraft({ languagePoint, theme, melody }) {
  const words = (languagePoint || 'happy, calm, brave').split(/[,，、\s]+/).filter(Boolean).slice(0, 5);
  const title = theme === '勇气与冒险' ? 'A Brave Little Sky' : theme === '自然探索' ? 'The Sky Inside Me' : 'My Little Bright Song';
  return {
    title,
    melody,
    words,
    lines: [
      `When I wake, I feel ______ today,`,
      'I take a breath and look around.',
      `My little heart can be ______,`,
      'And make a soft and caring sound.',
      `I can be ______, one step at a time,`,
      'I sing my feelings, loud and kind.',
    ],
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
  const [form, setForm] = React.useState({ languagePoint: 'happy, calm, brave', age: '7-9', level: '初级', difficulty: '低', theme: '情绪表达', melody: 'twinkle' });
  const [draft, setDraft] = React.useState(() => makeDraft({ languagePoint: 'happy, calm, brave', theme: '情绪表达', melody: 'twinkle' }));
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const [volume, setVolume] = React.useState(.75);
  const [activeBlank, setActiveBlank] = React.useState(null);
  const [arrangement, setArrangement] = React.useState({});
  const [showWords, setShowWords] = React.useState(false);
  const [showPlan, setShowPlan] = React.useState(false);
  const [showGuide, setShowGuide] = React.useState(false);
  const [view, setView] = React.useState('list');
  const [works, setWorks] = React.useState(() => JSON.parse(localStorage.getItem('song-writing-works') || '[]'));
  const [searchTerm, setSearchTerm] = React.useState('');
  const selectedMelody = melodies.find((item) => item.id === form.melody) || melodies[0];

  React.useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = speed;
    audioRef.current.volume = volume;
  }, [speed, volume]);

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

  const regenerate = () => {
    setDraft(makeDraft(form));
    setActiveBlank(null);
    setArrangement({});
  };

  const fillWord = (word) => {
    if (activeBlank === null) return;
    setDraft((current) => ({
      ...current,
      lines: current.lines.map((line, index) => index === activeBlank ? line.replace('______', word) : line),
    }));
    setActiveBlank(null);
  };

  const updateLine = (index, value) => setDraft((current) => ({ ...current, lines: current.lines.map((line, itemIndex) => itemIndex === index ? value : line) }));
  const addInstrument = (lineIndex, instrument) => setArrangement((current) => ({ ...current, [lineIndex]: [...(current[lineIndex] || []), instrument] }));
  const saveWork = () => { const work = { id: Date.now(), title: draft.title, draft, form, date: new Date().toLocaleDateString('zh-CN') }; const next = [work, ...works.filter((item) => item.title !== work.title)]; setWorks(next); localStorage.setItem('song-writing-works', JSON.stringify(next)); };

  if (view === 'list') {
    const filteredWorks = works.filter((work) => work.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const removeWork = (id) => { const next = works.filter((work) => work.id !== id); setWorks(next); localStorage.setItem('song-writing-works', JSON.stringify(next)); };
    return <main className="picture-book-studio-v2 pbv2-list-page"><header className="pbv2-topbar"><div className="pbv2-topbar-left"><div className="pbv2-topbar-icon"><BookOpenText size={28} /></div><div><h1>歌曲编排</h1><p>创建和管理你的歌曲互动作品</p></div></div><button type="button" className="pbv2-create-btn" style={{ display: 'inline-flex', minWidth: 126, color: '#fff', background: '#ef7865' }} onClick={() => setView('form')}><Plus size={18} color="#fff" /><span style={{ display: 'inline', color: '#fff' }}>新建歌曲</span></button></header><div className="pbv2-list-toolbar"><div className="pbv2-search-box"><Search size={16} /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜索歌曲..." /></div></div>{filteredWorks.length === 0 ? <div className="pbv2-list-empty"><BookOpenText size={48} /><p>还没有歌曲作品，点击右上角创建</p></div> : <div className="pbv2-card-grid">{filteredWorks.map((work) => <article key={work.id} className="pbv2-book-card" onClick={() => { setDraft(work.draft); setForm(work.form); setView('preview'); }}><div className="pbv2-book-cover"><div className="pbv2-book-cover-placeholder"><Music2 size={32} /></div><span className="pbv2-book-status draft">草稿</span></div><div className="pbv2-book-info"><h3>{work.title || '未命名歌曲'}</h3><div className="pbv2-book-meta"><Clock size={13} /><span>{work.date}</span></div><div className="pbv2-book-actions"><button type="button" onClick={(e) => { e.stopPropagation(); setDraft(work.draft); setForm(work.form); setView('preview'); }}><Pencil size={14} />编辑</button><button type="button" onClick={(e) => { e.stopPropagation(); removeWork(work.id); }}><Trash2 size={14} />删除</button></div></div></article>)}</div>}</main>;
  }

  if (view === 'form') return <main className="song-hub"><header><div><p>步骤 1 / 2</p><h1>设置生成条件</h1><span>先设定语言点、年龄、难度、主题和旋律。</span></div><button type="button" className="plain" onClick={() => setView('list')}>返回列表</button></header><section className="song-condition-card"><div className="condition-title"><span>✨</span><div><h2>歌曲创编参数</h2><p>生成后可预览、保存并下载独立 HTML。</p></div></div><div className="song-form-grid"><label className="song-wide">目标语言点<input value={form.languagePoint} onChange={(e) => setForm({ ...form, languagePoint: e.target.value })} /></label><Select label="年龄段" value={form.age} options={['7-9', '10-12', '13-15']} onChange={(age) => setForm({ ...form, age })} /><Select label="英文水平" value={form.level} options={['初级', '中级', '高级']} onChange={(level) => setForm({ ...form, level })} /><Select label="填词难度" value={form.difficulty} options={['低', '中', '高']} onChange={(difficulty) => setForm({ ...form, difficulty })} /><Select label="幸福力主题" value={form.theme} options={['情绪表达', '自然探索', '自我认知', '人际关系', '勇气与冒险']} onChange={(theme) => setForm({ ...form, theme })} /><label>旋律选择<select value={form.melody} onChange={(e) => setForm({ ...form, melody: e.target.value })}><option value="twinkle">小星星</option><option value="sunshine">You Are My Sunshine</option><option value="edelweiss">雪绒花</option></select></label></div><button type="button" className="generate-html" onClick={() => { setDraft(makeDraft(form)); setView('preview'); }}><Sparkles size={18} />生成互动 HTML 页面</button></section></main>;

  return (
    <main className="song-writing-page sky-song-page">
      <audio ref={audioRef} src={selectedMelody.src} onEnded={() => setPlaying(false)} />
      <span className="sky-deco note n1">♪</span><span className="sky-deco note n2">♫</span><span className="sky-deco heart h1">♡</span><span className="sky-deco star s1">★</span><span className="sky-deco flower f1">✿</span><span className="sky-deco smile m1">☻</span>
      <header className="sky-title"><h1>{draft.title}</h1><p>旋律：{selectedMelody.name} · {form.age}岁 · {form.level}</p></header>
      <div className="sky-actions"><button type="button" onClick={saveWork}>保存作品</button><button type="button" onClick={() => downloadInteractiveHtml(draft, form, selectedMelody)}>下载 HTML</button><button type="button" onClick={() => setShowPlan(true)}>📋 活动方案</button><button type="button" aria-label="教学引导" onClick={() => setShowGuide(true)}><BookOpenCheck size={17} /></button></div><button type="button" className="sky-back" onClick={() => setView('list')}>← 返回作品列表</button>

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
                <textarea value={line} rows="1" onChange={(e) => updateLine(index, e.target.value)} onFocus={() => line.includes('______') && setActiveBlank(index)} />
                <div className="line-instruments">{(arrangement[index] || []).map((instrument, itemIndex) => <span key={`${instrument.id}-${itemIndex}`}>{instrument.emoji}</span>)}<button type="button" title="为这一句配器" onClick={() => addInstrument(index, instruments[index % instruments.length])}>＋</button></div>
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

      {showWords && <Overlay title="Word Bank · 选词区" onClose={() => setShowWords(false)}><p>把词卡投到大屏上，邀请孩子先读、做动作或选出最贴近自己的词。</p><div className="word-chips large">{draft.words.map((word, index) => <button type="button" key={`${word}-${index}`} onClick={() => { fillWord(word); setShowWords(false); }}><span>{['☀️', '☁️', '⭐', '🌈', '💛'][index % 5]}</span>{word}</button>)}</div></Overlay>}
      {showPlan && <Overlay title="活动方案" onClose={() => setShowPlan(false)}><ol className="song-plan"><li><b>听一听</b>：试听 {selectedMelody.name}，用身体拍出稳定节拍。</li><li><b>选一选</b>：在 Word Bank 中选取最符合当下感受的词。</li><li><b>唱一唱</b>：填入歌词，按原旋律完整演唱。</li><li><b>加一加</b>：为每一句选择乐器或身体打击乐。</li><li><b>说一说</b>：用 “I feel …” 分享你的歌词选择。</li></ol></Overlay>}
      {showGuide && <Overlay title="教学引导" onClose={() => setShowGuide(false)}><div className="guide-copy"><h3>不追求唱得标准，先让表达发生。</h3><p>当孩子犹豫时，给出两个词卡作为选择，并接纳所有合理答案。可先由教师示范一行，再让小组分句配器和演唱。</p><p>提示语：<em>“Which word sounds like your feeling today?”</em></p></div></Overlay>}
    </main>
  );
}

function Select({ label, value, options, onChange }) { return <label>{label}<select value={value} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option value={option} key={option}>{option}</option>)}</select><ChevronDown size={14} /></label>; }
function Overlay({ title, onClose, children }) { return <div className="song-overlay" role="dialog" aria-modal="true"><div className="song-modal"><div className="modal-head"><h2>{title}</h2><button type="button" onClick={onClose}><X /></button></div>{children}</div></div>; }
