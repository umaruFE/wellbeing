import React from 'react';
import {
  ArrowLeft,
  BookOpenText,
  ChevronRight,
  Clock,
  Expand,
  Loader2,
  Music2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
  Search,
  Volume2,
  Wand2,
  X,
  Pencil,
  Trash2,
} from 'lucide-react';
import apiService from '../../services/api';
import { parseJsonSafely, responseErrorMessage } from '../../utils/responseUtils';
import './SongWritingStudioPage.css';

const melodies = [
  { id: 'twinkle', name: 'Twinkle, Twinkle, Little Star', hint: '小星星', src: '/audio/twinkle-little-star.mp3' },
  { id: 'sunshine', name: "You Are My Sunshine", hint: '你是我的阳光', src: '/audio/you-are-my-sunshine.mp3' },
  { id: 'edelweiss', name: 'Edelweiss', hint: '雪绒花', src: '/audio/edelweiss.mp3' },
  { id: 'if-youre-happy', name: "If You're Happy and You Know It", hint: 'If You’re Happy and You Know It', src: "/audio/If You're Happy and You Know It (Karaoke Version) (Originally Performed By Kids Karaoke) - Zoom Karaoke.mp3" },
];

const melodyTypeLabels = {
  Edelweiss: '舒缓抒情型',
  'You Are My Sunshine': '温暖舒展型',
  'Twinkle, Twinkle, Little Star': '轻快跳跃型',
  "If You're Happy and You Know It": '欢快互动型',
};

const instruments = [
  { id: 'bell', icon: '/audio/icon/bell.png', label: '铃铛' },
  { id: 'bongo', icon: '/audio/icon/Bongo.png', label: '邦戈鼓' },
  { id: 'maracas', icon: '/audio/icon/Maracas.png', label: '砂槌' },
  { id: 'tambourine', icon: '/audio/icon/Tambourine.png', label: '铃鼓' },
  { id: 'hand-drum', icon: '/audio/icon/hand drum.png', label: '手鼓' },
  { id: 'triangle', icon: '/audio/icon/Triangle.webp', label: '三角铁' },
  { id: 'djembe', icon: '/audio/icon/Djembe.png', label: '非洲鼓' },
  { id: 'castanets', icon: '/audio/icon/Castanets.png', label: '响板' },
  { id: 'cabasa', icon: '/audio/icon/Cabasa.png', label: '沙锤' },
  { id: 'xylophone', icon: '/audio/icon/Xylophone.png', label: '木琴' },
  { id: 'drum', icon: '/audio/icon/drum.png', label: '鼓' },
  { id: 'finger-cymbals', icon: '/audio/icon/Finger Cymbals.png', label: '指钹' },
  { id: 'hand-bell', icon: '/audio/icon/Hand bell.png', label: '手铃' },
  { id: 'sleigh-bell', icon: '/audio/icon/Sleigh bell.png', label: '雪橇铃' },
  { id: 'wood-block', icon: '/audio/icon/Wood block.png', label: '木鱼' },
];

const ageOptions = ['4-6岁', '7-9岁', '10-12岁', '13-15岁'];
const levelOptions = ['零基础', '初级（会字母和简单词）', '中级（能简单对话）', '高级（能阅读和表达）'];
const participantOptions = ['单人', '小组（2-4人）', '大组（5-10人）', '班级（10+）'];
const themeOptions = ['情绪表达', '自然探索', '自我认知', '人际关系', '家庭与归属', '成长与变化', '感恩与善意', '身体与感知', '动物与生命', '勇气与冒险'];
const adjustmentSuggestions = ['词汇太难', '词汇太简单', '核心语言点丢失', '句式太重复', '填空太多', '填空太少', 'L1唱起来不顺', 'L2音节数不对'];
const SONG_WORKS_KEY = 'song-writing-works';
const SONG_SESSION_KEY = 'song-writing-session';

function readStoredJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function toggleList(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function wordIcon(word) {
  const value = word.toLowerCase();
  if (/(happy|joy|cheerful|smile)/.test(value)) return '😊';
  if (/(calm|quiet|peace|relax)/.test(value)) return '😌';
  if (/(sad|cry|blue)/.test(value)) return '😢';
  if (/(angry|mad)/.test(value)) return '😠';
  if (/(scared|afraid|fear)/.test(value)) return '😨';
  if (/(excited|wow)/.test(value)) return '🤩';
  if (/(tired|sleepy|sleep)/.test(value)) return '😴';
  if (/(brave|strong|bold)/.test(value)) return '💪';
  if (/(breathe|breath|slow)/.test(value)) return '🌬️';
  if (/(stand|tall|up)/.test(value)) return '🧍';
  if (/(heart|love|kind)/.test(value)) return '❤️';
  if (/(hand|clap)/.test(value)) return '👏';
  if (/(touch|hold|hug)/.test(value)) return '🤲';
  if (/(jump|hop)/.test(value)) return '🤸';
  if (/(dance|move|wiggle)/.test(value)) return '💃';
  if (/(sing|song)/.test(value)) return '🎵';
  if (/(shake|maraca)/.test(value)) return '🪇';
  if (/(drum|beat)/.test(value)) return '🥁';
  if (/(sun|bright)/.test(value)) return '☀️';
  if (/(cloud|cloudy)/.test(value)) return '☁️';
  if (/(rainbow|colour|color)/.test(value)) return '🌈';
  if (/(mountain)/.test(value)) return '⛰️';
  if (/(river|ocean|wave|lake)/.test(value)) return '🌊';
  if (/(tree|forest|leaf|grass)/.test(value)) return '🌳';
  if (/(pause|stop)/.test(value)) return '⏸️';
  return '✨';
}

function wordCardIcon(word, wordEmojis) {
  const generatedEmoji = wordEmojis?.[word];
  return generatedEmoji && generatedEmoji !== '💬' ? generatedEmoji : wordIcon(word);
}

function formatAudioTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

function makeDraft({ vocabulary, themes, themeOther, melody } = {}) {
  const languagePoint = vocabulary || 'happy, calm, brave, sad, angry, tired, bored, shy, calm';
  const theme = themes?.[0] || themeOther || '情绪表达';
  const baseWords = languagePoint.split(/[,，、\s]+/).filter(Boolean);
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
  const html = `<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${draft.title}</title><style>body{margin:0;font-family:Arial,"Microsoft YaHei";color:#514d56}main{max-width:625px;margin:25px auto;text-align:center}h1{margin:0;font-size:28px}small{color:#aaa}.player{margin-top:20px;padding:16px;border-radius:16px;background:#a9ded7;border-bottom:4px solid #7cc8bd}.grid{display:grid;grid-template-columns:398px 212px;gap:15px;margin-top:14px;text-align:left}.lyrics,.words,.instruments{padding:14px;border-radius:14px}.lyrics{background:#e9def3}.words{background:#f9da50}.instruments{margin-top:12px;background:#f29c79}.lyrics p{padding:7px;border-bottom:1px solid #d6c8e2}.lyrics input{width:60px;border:2px solid #555;border-radius:8px}.words button{width:48%;margin:3px;border:2px solid #555;border-radius:16px;background:#fff;padding:6px;font-weight:bold}.foot{color:#eabf35;padding:20px}@media(max-width:650px){.grid{grid-template-columns:1fr}}</style><main><h1>${draft.title}</h1><small>旋律：${melody.name} · ${form.age} · ${form.level}</small><section class="player">🎵 伴奏播放 ▶ ━━━━━━ 音量</section><div class="grid"><section class="lyrics"><b>🎶 填词模板</b>${lines}</section><div><section class="words"><b>📚 Word Bank</b><p>点击单词填入空格</p>${words}</section><section class="instruments"><b>🎸 乐器</b><p>👏 拍手 🥁 手鼓 🔔 铃鼓 🪇 沙锤</p></section></div></div><div class="foot">⭐ ☀️ 🌈 🎵 💛 ⭐<br><small>幸福力英文歌曲创编 · 轻松唱出心情</small></div></main></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `${draft.title || 'song-writing'}.html`; link.click(); URL.revokeObjectURL(url);
}

const melodyGradients = {
  twinkle: ['#f7d958', '#f0a080'],
  sunshine: ['#f7b5a6', '#fde6c5'],
  edelweiss: ['#a8e0d8', '#d4eef0'],
  'if-youre-happy': ['#e8ddf0', '#f7d958'],
};

function generateCoverSvg(title, melodyId, melodyName) {
  const [c1, c2] = melodyGradients[melodyId] || ['#a8e0d8', '#e8ddf0'];
  const safeTitle = (title || 'My Song').slice(0, 30);
  const safeMelody = (melodyName || '').slice(0, 25);
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="400" height="280" rx="16" fill="url(#g)"/><circle cx="60" cy="50" r="20" fill="#fff" opacity="0.3"/><circle cx="340" cy="230" r="28" fill="#fff" opacity="0.2"/><text x="200" y="120" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="bold" fill="#3a3045">${safeTitle}</text><text x="200" y="155" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="#6a5a7a">${safeMelody}</text><text x="200" y="245" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#8a7a9a">🎵 幸福力英文歌曲创编</text><g transform="translate(180,60)"><circle cx="0" cy="20" r="7" fill="#fff" opacity="0.4" stroke="#3a3045" stroke-width="1.5"/><line x1="6" y1="16" x2="6" y2="-4" stroke="#3a3045" stroke-width="2"/><path d="M6 -4 Q16 -6 14 6 Q12 2 6 2" fill="#fff" opacity="0.4" stroke="#3a3045" stroke-width="1.5"/></g></svg>`)}`;
}

export function SongWritingStudioPage() {
  const initialSessionRef = React.useRef(readStoredJson(SONG_SESSION_KEY, null));
  const initialSession = initialSessionRef.current;
  const audioRef = React.useRef(null);
  const melodyPreviewRef = React.useRef(null);
  const lyricEditorRefs = React.useRef([]);
  const [form, setForm] = React.useState(() => initialSession?.form || { age: '', level: '', participants: '', themes: [], themeOther: '', vocabulary: '', grammar: '', melody: '' });
  const [draft, setDraft] = React.useState(() => initialSession?.draft || makeDraft({ vocabulary: 'happy, calm, brave', themes: ['情绪表达'], melody: 'twinkle' }));
  const [playing, setPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [melodyPreviewPlaying, setMelodyPreviewPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState(1);
  const [volume, setVolume] = React.useState(.75);
  const [activeBlank, setActiveBlank] = React.useState(null);
  const [blankValues, setBlankValues] = React.useState(() => initialSession?.blankValues || {});
  const [arrangement, setArrangement] = React.useState(() => initialSession?.arrangement || {});
  const [showWords, setShowWords] = React.useState(false);
  const [selectedLargeWord, setSelectedLargeWord] = React.useState('');
  const [showAllInstruments, setShowAllInstruments] = React.useState(false);
  const [showPlan, setShowPlan] = React.useState(false);
  const [showContentEditor, setShowContentEditor] = React.useState(false);
  const [showAdjustmentPanel, setShowAdjustmentPanel] = React.useState(false);
  const [adjustmentRequest, setAdjustmentRequest] = React.useState('');
  const [regeneratingLine, setRegeneratingLine] = React.useState(null);
  const [regeneratingAll, setRegeneratingAll] = React.useState(false);
  const [songLibrary, setSongLibrary] = React.useState([]);
  const [songLibraryLoading, setSongLibraryLoading] = React.useState(true);
  const [songLibraryError, setSongLibraryError] = React.useState('');
  const [showSongPicker, setShowSongPicker] = React.useState(false);
  const [songTypeFilter, setSongTypeFilter] = React.useState('all');
  const [previewSongId, setPreviewSongId] = React.useState(null);
  const [previewAudioMode, setPreviewAudioMode] = React.useState('instrumental');
  const previewRef = React.useRef(null);
  const [audioMode, setAudioMode] = React.useState('instrumental');
  const [view, setView] = React.useState(() => initialSession?.view === 'studio' ? 'studio' : 'list');
  const [step, setStep] = React.useState(() => initialSession?.step ?? 0);
  const [works, setWorks] = React.useState(() => readStoredJson(SONG_WORKS_KEY, []));
  const [activeWorkId, setActiveWorkId] = React.useState(() => initialSession?.activeWorkId || null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [saveMessage, setSaveMessage] = React.useState('');
  const [generatedPlan, setGeneratedPlan] = React.useState(() => initialSession?.generatedPlan || null);
  const [coverUrl, setCoverUrl] = React.useState(() => initialSession?.coverUrl || '');
  const [showPresentation, setShowPresentation] = React.useState(false);
  const presentationHistoryActiveRef = React.useRef(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const legacyMelody = melodies.find((item) => item.id === form.melody);
  const canGenerate = Boolean(form.age && form.level && form.melody && songLibrary.some((song) => String(song.id) === String(form.melody)));
  const setFormField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const steps = ['基础信息', '歌曲制作'];
  const goToStep = (nextStep) => {
    if (nextStep > 0 && !generatedPlan) return;
    setStep(nextStep);
  };
  const startNewSong = () => {
    setSaveMessage('');
    setGeneratedPlan(null);
    setActiveWorkId(null);
    setCoverUrl('');
    setBlankValues({});
    setArrangement({});
    setForm({ age: '', level: '', participants: '', themes: [], themeOther: '', vocabulary: '', grammar: '', melody: '' });
    setDraft(makeDraft({ vocabulary: 'happy, calm, brave', themes: ['情绪表达'], melody: 'twinkle' }));
    setStep(0);
    setView('studio');
  };

  const openPresentation = React.useCallback(() => {
    if (!presentationHistoryActiveRef.current) {
      window.history.pushState({ ...window.history.state, songWritingPresentation: true }, '');
      presentationHistoryActiveRef.current = true;
    }
    setShowPresentation(true);
  }, []);

  const closePresentation = React.useCallback(() => {
    if (presentationHistoryActiveRef.current) {
      window.history.back();
      return;
    }
    setShowPresentation(false);
  }, []);

  React.useEffect(() => {
    const handlePopState = () => {
      presentationHistoryActiveRef.current = false;
      setShowPresentation(false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  React.useEffect(() => {
    const handler = () => { setView('list'); setStep(0); };
    window.addEventListener('wellbeing:nav-same-route', handler);
    return () => window.removeEventListener('wellbeing:nav-same-route', handler);
  }, []);

  const fetchSongLibrary = React.useCallback(async () => {
    setSongLibraryLoading(true);
    setSongLibraryError('');
    try {
      const result = await apiService.request('/api/song-library');
      setSongLibrary(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      setSongLibrary([]);
      setSongLibraryError(error instanceof Error ? error.message : '曲目库加载失败');
    } finally {
      setSongLibraryLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchSongLibrary(); }, [fetchSongLibrary]);

  const librarySong = React.useMemo(() => {
    const byId = songLibrary.find((song) => song.id == form.melody || String(song.id) === String(form.melody));
    if (byId) return byId;
    if (!legacyMelody) return null;
    return songLibrary.find((song) => (song.melody_type || song.melodyType) === legacyMelody.name) || null;
  }, [songLibrary, form.melody, legacyMelody]);

  const selectedMelody = React.useMemo(() => {
    if (librarySong) {
      return {
        id: librarySong.id,
        name: librarySong.name,
        hint: librarySong.description || librarySong.melody_type || librarySong.melodyType || '曲目库',
        src: librarySong.instrumental_url || librarySong.instrumentalUrl || librarySong.vocal_url || librarySong.vocalUrl || '',
      };
    }
    return legacyMelody || { id: '', name: '未选择曲目', hint: '', src: '' };
  }, [librarySong, legacyMelody]);

  const currentAudioSrc = React.useMemo(() => {
    if (librarySong) {
      const vocalUrl = librarySong.vocal_url || librarySong.vocalUrl;
      const instrumentalUrl = librarySong.instrumental_url || librarySong.instrumentalUrl;
      if (audioMode === 'vocal' && vocalUrl) return vocalUrl;
      if (audioMode === 'instrumental' && instrumentalUrl) return instrumentalUrl;
      return vocalUrl || instrumentalUrl || '';
    }
    return legacyMelody?.src || '';
  }, [librarySong, audioMode, legacyMelody]);

  const songTypes = React.useMemo(() => [...new Set(songLibrary.map((song) => song.melody_type || song.melodyType).filter(Boolean))], [songLibrary]);
  const filteredSongLibrary = React.useMemo(() => songLibrary.filter((song) => songTypeFilter === 'all' || (song.melody_type || song.melodyType) === songTypeFilter), [songLibrary, songTypeFilter]);

  const persistWork = React.useCallback((showConfirmation = false) => {
    if (view !== 'studio' || step !== 1 || !draft?.title) return;
    const id = activeWorkId || Date.now();
    const work = {
      id,
      title: draft.title,
      coverUrl: coverUrl || generateCoverSvg(draft.title, form.melody, selectedMelody.name),
      draft: { ...draft, activityPlan: generatedPlan },
      form,
      blankValues,
      arrangement,
      date: new Date().toLocaleDateString('zh-CN'),
    };
    setActiveWorkId(id);
    setWorks((current) => {
      const next = [work, ...current.filter((item) => item.id !== id && (activeWorkId || item.title !== work.title))];
      localStorage.setItem(SONG_WORKS_KEY, JSON.stringify(next));
      return next;
    });
    if (showConfirmation) {
      setSaveMessage('已保存作品');
      window.setTimeout(() => setSaveMessage(''), 2400);
    }
  }, [activeWorkId, arrangement, blankValues, coverUrl, draft, form, generatedPlan, selectedMelody.name, step, view]);

  React.useEffect(() => {
    if (view !== 'studio') {
      localStorage.removeItem(SONG_SESSION_KEY);
      return;
    }
    localStorage.setItem(SONG_SESSION_KEY, JSON.stringify({ view, step, activeWorkId, form, draft, blankValues, arrangement, generatedPlan, coverUrl }));
  }, [activeWorkId, arrangement, blankValues, coverUrl, draft, form, generatedPlan, step, view]);

  React.useEffect(() => {
    if (view !== 'studio' || step !== 1 || !generatedPlan) return undefined;
    const timer = window.setTimeout(() => persistWork(false), 700);
    return () => window.clearTimeout(timer);
  }, [generatedPlan, persistWork, step, view]);

  const stopSongPreview = React.useCallback(() => {
    previewRef.current?.pause();
    if (previewRef.current) previewRef.current.currentTime = 0;
    setPreviewSongId(null);
  }, []);

  const previewLibrarySong = async (song, mode) => {
    const vocalUrl = song.vocal_url || song.vocalUrl;
    const instrumentalUrl = song.instrumental_url || song.instrumentalUrl;
    const src = mode === 'vocal' ? vocalUrl : instrumentalUrl;
    if (!src || !previewRef.current) return;
    const samePreview = String(previewSongId) === String(song.id) && previewAudioMode === mode;
    if (samePreview && !previewRef.current.paused) {
      stopSongPreview();
      return;
    }
    previewRef.current.pause();
    previewRef.current.src = src;
    previewRef.current.currentTime = 0;
    setPreviewSongId(song.id);
    setPreviewAudioMode(mode);
    try {
      await previewRef.current.play();
    } catch {
      setPreviewSongId(null);
    }
  };

  React.useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = speed;
    audioRef.current.volume = volume;
  }, [speed, volume]);

  React.useEffect(() => {
    audioRef.current?.pause();
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [audioMode, currentAudioSrc]);

  const syncAudioDuration = (event) => {
    const nextDuration = event.currentTarget.duration;
    setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
  };

  const seekAudio = (event) => {
    const nextTime = Number(event.target.value);
    if (!audioRef.current || !Number.isFinite(nextTime)) return;
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  React.useEffect(() => {
    setMelodyPreviewPlaying(false);
    if (!melodyPreviewRef.current) return;
    melodyPreviewRef.current.pause();
    melodyPreviewRef.current.currentTime = 0;
  }, [form.melody]);

  React.useEffect(() => {
    const handleSameRouteNav = (event) => {
      if (event.detail?.path !== '/song-writing') return;

      audioRef.current?.pause();
      melodyPreviewRef.current?.pause();
      setPlaying(false);
      setMelodyPreviewPlaying(false);
      setShowWords(false);
      setShowPlan(false);
      setShowContentEditor(false);
      setView('list');
    };

    window.addEventListener('wellbeing:nav-same-route', handleSameRouteNav);
    return () => window.removeEventListener('wellbeing:nav-same-route', handleSameRouteNav);
  }, []);

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

  const fillWordAt = (word, blankTarget) => {
    if (!blankTarget || blankTarget.lineIndex === undefined) return;
    setBlankValues((current) => ({ ...current, [`${blankTarget.lineIndex}:${blankTarget.blankIndex}`]: word }));
  };

  const fillWord = (word) => {
    if (activeBlank === null) return;
    fillWordAt(word, activeBlank);
    setActiveBlank(null);
  };

  const MAX_INSTRUMENTS_PER_LINE = 3;
  const addInstrument = (lineIndex, instrument) => setArrangement((current) => {
    const currentLine = current[lineIndex] || [];
    if (currentLine.length >= MAX_INSTRUMENTS_PER_LINE) return current;
    return { ...current, [lineIndex]: [...currentLine, instrument] };
  });
  const removeInstrument = (lineIndex, itemIndex) => setArrangement((current) => ({ ...current, [lineIndex]: (current[lineIndex] || []).filter((_, i) => i !== itemIndex) }));
  const dropOnLine = (event, lineIndex, target) => {
    event.preventDefault();
    try {
      const payload = JSON.parse(event.dataTransfer.getData('application/x-song-writing'));
      if (payload.type === 'word' && target === 'word') fillWordAt(payload.word, { lineIndex, blankIndex: 0 });
      if (payload.type === 'instrument' && target === 'instrument') addInstrument(lineIndex, payload.instrument);
    } catch {
      // Ignore drops that did not originate from the song-writing studio.
    }
  };
  const saveWork = () => persistWork(true);
  const generateSong = async () => {
    if (!librarySong) {
      setSaveMessage('请先从曲目库选择一首歌曲');
      return;
    }
    setIsGenerating(true);
    try {
      const melodyName = librarySong.melody_type || librarySong.melodyType || librarySong.name;
      const response = await fetch('/api/ai/generate-song-writing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, melody: melodyName }) });
      const result = await parseJsonSafely(response);
      if (!response.ok || !result?.success) {
        throw new Error(responseErrorMessage(response, result, '歌曲生成失败，请稍后重试'));
      }
      const data = result.data;
      setDraft({ title: data.title, melody: form.melody, words: data.words, lines: data.lines, wordEmojis: data.wordEmojis || {} });
      setGeneratedPlan(data.activityPlan);
      setCoverUrl(generateCoverSvg(data.title, form.melody, selectedMelody.name));
      setBlankValues({});
      setArrangement({});
      setStep(1);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : '歌曲生成失败');
    } finally { setIsGenerating(false); }
  };

  const regenerateLine = async (index) => {
    setRegeneratingLine(index);
    try {
      const themeList = [...(form.themes || [])];
      if (form.themeOther) themeList.push(form.themeOther);
      const melodyName = librarySong?.melody_type || librarySong?.name || selectedMelody.name;
      const response = await fetch('/api/ai/generate-song-writing-line', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ melody: melodyName, themes: themeList, vocabulary: form.vocabulary, grammar: form.grammar, lines: draft.lines, regenerateIndex: index, adjustmentRequest }),
      });
      const result = await parseJsonSafely(response);
      if (!response.ok || !result?.success) throw new Error(responseErrorMessage(response, result, '重新生成失败'));
      setDraft((current) => ({ ...current, lines: current.lines.map((line, i) => (i === index ? result.data.line : line)) }));
      setBlankValues({});
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : '重新生成失败');
    } finally { setRegeneratingLine(null); }
  };

  const regenerateAllLines = async () => {
    setRegeneratingAll(true);
    setIsGenerating(true);
    try {
      const melodyName2 = librarySong?.melody_type || librarySong?.name || selectedMelody.name;
      const response = await fetch('/api/ai/generate-song-writing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, melody: melodyName2, adjustmentRequest }) });
      const result = await parseJsonSafely(response);
      if (!response.ok || !result?.success) throw new Error(responseErrorMessage(response, result, '重新生成失败'));
      const data = result.data;
      setDraft((current) => ({ ...current, lines: data.lines, words: data.words, wordEmojis: data.wordEmojis || {} }));
      setBlankValues({});
      setShowAdjustmentPanel(false);
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : '重新生成失败');
    } finally { setRegeneratingAll(false); setIsGenerating(false); }
  };

  const insertBlankInLine = (index) => {
    const textarea = lyricEditorRefs.current[index];
    setDraft((current) => {
      const line = current.lines[index];
      const start = textarea?.selectionStart ?? line.length;
      const end = textarea?.selectionEnd ?? start;
      const before = line.slice(0, start).replace(/\s*$/, '');
      const after = line.slice(end).replace(/^\s*/, '');
      const newLine = `${before}${before ? ' ' : ''}______${after ? ' ' : ''}${after}`;
      return { ...current, lines: current.lines.map((l, i) => (i === index ? newLine : l)) };
    });
    setBlankValues({});
  };

  const clearBlanksInLine = (index) => {
    setDraft((current) => ({ ...current, lines: current.lines.map((line, itemIndex) => itemIndex === index ? line.replace(/\s*______\s*/g, ' ').replace(/ {2,}/g, ' ').trim() : line) }));
    setBlankValues({});
  };

  const toggleAdjustmentSuggestion = (suggestion) => {
    setAdjustmentRequest((current) => {
      const items = current.split(/[，,；;\n]/).map((item) => item.trim()).filter(Boolean);
      const next = items.includes(suggestion) ? items.filter((item) => item !== suggestion) : [...items, suggestion];
      return next.join('；');
    });
  };

  const saveContentEdits = () => {
    setBlankValues({});
    setShowContentEditor(false);
    setSaveMessage('修改已自动保存');
    window.setTimeout(() => setSaveMessage(''), 2400);
  };

  if (view === 'list') {
    const filteredWorks = works.filter((work) => work.title.toLowerCase().includes(searchTerm.toLowerCase()));
    const removeWork = (id) => { const next = works.filter((work) => work.id !== id); setWorks(next); localStorage.setItem(SONG_WORKS_KEY, JSON.stringify(next)); };
    const loadWork = (work) => {
      setDraft(work.draft);
      const oldForm = work.form || {};
      setForm({
        age: oldForm.age || '',
        level: oldForm.level || '',
        participants: oldForm.participants || '',
        themes: Array.isArray(oldForm.themes) ? oldForm.themes : (oldForm.theme ? [oldForm.theme] : []),
        themeOther: oldForm.themeOther || '',
        vocabulary: oldForm.vocabulary || oldForm.languagePoint || '',
        grammar: oldForm.grammar || '',
        melody: oldForm.melody || 'twinkle',
      });
      setBlankValues(work.blankValues || {});
      setArrangement(work.arrangement || {});
      setGeneratedPlan(work.draft?.activityPlan || null);
      setCoverUrl(work.coverUrl || '');
      setActiveWorkId(work.id);
    };
    const openWork = (work) => { loadWork(work); setStep(1); setView('studio'); };
    const presentWork = (work) => { loadWork(work); setStep(1); setView('studio'); openPresentation(); };
    return <main className="picture-book-studio-v2 pbv2-list-page"><header className="pbv2-topbar"><div className="pbv2-topbar-left"><div className="pbv2-topbar-icon"><BookOpenText size={28} /></div><div><h1>歌曲编排</h1><p>创建和管理你的歌曲互动作品</p></div></div><button type="button" className="pbv2-create-btn" style={{ display: 'inline-flex', minWidth: 126, color: '#fff', background: '#ef7865' }} onClick={startNewSong}><Plus size={18} color="#fff" /><span style={{ display: 'inline', color: '#fff' }}>新建歌曲</span></button></header><div className="pbv2-list-toolbar"><div className="pbv2-search-box"><Search size={16} /><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜索歌曲..." /></div></div>{filteredWorks.length === 0 ? <div className="pbv2-list-empty"><BookOpenText size={48} /><p>还没有歌曲作品，点击右上角创建</p></div> : <div className="pbv2-card-grid">{filteredWorks.map((work) => <article key={work.id} className="pbv2-book-card" onClick={() => openWork(work)}><div className="pbv2-book-cover">{work.coverUrl ? <img src={work.coverUrl} alt={work.title} className="pbv2-book-cover-img" /> : <div className="pbv2-book-cover-placeholder"><Music2 size={32} /></div>}<span className="pbv2-book-status draft">草稿</span></div><div className="pbv2-book-info"><h3>{work.title || '未命名歌曲'}</h3><div className="pbv2-book-meta"><Clock size={13} /><span>{work.date}</span></div><div className="pbv2-book-actions"><button type="button" onClick={(e) => { e.stopPropagation(); openWork(work); }}><Pencil size={14} />编辑</button><button type="button" onClick={(e) => { e.stopPropagation(); presentWork(work); }}>🖥️ 授课</button><button type="button" onClick={(e) => { e.stopPropagation(); removeWork(work.id); }}><Trash2 size={14} />删除</button></div></div></article>)}</div>}</main>;
  }

  if (view === 'studio' && isGenerating && step === 0) return <SongGenerationLoading />;

  if (view === 'studio') return (
    <main className="picture-book-studio-v2">
      <header className="pbv2-topbar">
        <div className="pbv2-topbar-left">
          <div className="pbv2-topbar-icon"><Music2 size={28} /></div>
          <div>
            <h1>歌曲编排工作室</h1>
            <p>设计适合课堂使用的英文幸福力歌曲互动</p>
          </div>
        </div>
        <div className="pbv2-topbar-actions">
          <span className="pbv2-save-state">{saveMessage || '自动保存已开启'}</span>
          <button type="button" className="pbv2-save-btn" onClick={saveWork}>
            <Save size={16} />保存作品
          </button>
          <button type="button" className="pbv2-back-btn" onClick={() => setView('list')}>
            <ArrowLeft size={16} />返回列表
          </button>
        </div>
      </header>
      <div className="pbv2-shell">
        <aside className="pbv2-steps">
          {steps.map((label, index) => (
            <button type="button" key={label} className={`${step === index ? 'is-active' : ''}${step > index ? ' is-done' : ''}`} disabled={index > 0 && !generatedPlan} onClick={() => goToStep(index)}>
              <span>{index + 1}</span>
              <strong>{label}</strong>
            </button>
          ))}
        </aside>
        <section className={`pbv2-workspace pbv2-workspace-step-${step}`}>
          {/* {saveMessage && <div className="pbv2-message">{saveMessage}</div>} */}

          {step === 0 && (
          <div className="pbv2-step-panel">
            <div className="pbv2-form-grid two">
              <OptionGroup tone="coral" required label="学生年龄" options={ageOptions} value={form.age} onChange={(value) => setFormField('age', value)} />
              <OptionGroup tone="blue" required label="英文水平" options={levelOptions} value={form.level} onChange={(value) => setFormField('level', value)} />
              <OptionGroup tone="yellow" label="参与人数" options={participantOptions} value={form.participants} onChange={(value) => setFormField('participants', value)} />
            </div>

            <CheckboxGroup
              tone="yellow"
              label="活动主题偏好"
              options={themeOptions}
              value={form.themes}
              otherValue={form.themeOther}
              onToggle={(value) => setFormField('themes', toggleList(form.themes, value))}
              onOther={(value) => setFormField('themeOther', value)}
            />

            <section className="pbv2-card pbv2-tone-blue">
              <div className="pbv2-card-title">语言目标（非必填）</div>
              <div className="pbv2-form-grid two">
                <Field label="核心词汇" value={form.vocabulary} onChange={(value) => setFormField('vocabulary', value)} placeholder="例如：happy, sad, body, friend" />
                <Field label="核心句型/语法" value={form.grammar} onChange={(value) => setFormField('grammar', value)} placeholder="例如：My friend has... / My friend is..." />
              </div>
            </section>

            <section className="pbv2-card pbv2-tone-coral">
              <div className="pbv2-card-title">从曲目库选择歌曲 <span className="pbv2-required">*</span></div>
              {songLibraryLoading ? (
                <div className="song-library-empty">
                  <Loader2 className="spin" size={28} />
                  <p>正在加载曲目库...</p>
                </div>
              ) : songLibraryError ? (
                <div className="song-library-empty">
                  <Music2 size={32} />
                  <p>{songLibraryError}</p>
                  <button type="button" className="pbv2-ghost" onClick={fetchSongLibrary}>重新加载</button>
                </div>
              ) : songLibrary.length === 0 ? (
                <div className="song-library-empty">
                  <Music2 size={32} />
                  <p>曲目库暂无歌曲，请先到曲目库添加歌曲</p>
                </div>
              ) : (
                <div className="song-picker-selected">
                  {librarySong ? <div><strong>{librarySong.name}</strong><span>{melodyTypeLabels[librarySong.melody_type || librarySong.melodyType] || librarySong.melody_type || librarySong.melodyType}</span></div> : <p>尚未选择歌曲</p>}
                  <button type="button" className="pbv2-ghost" onClick={() => setShowSongPicker(true)}>{librarySong ? '更换歌曲' : '选择歌曲'}</button>
                </div>
              )}
            </section>

            <FooterActions>
              <button type="button" className="pbv2-primary" disabled={!canGenerate || isGenerating} onClick={generateSong}>
                {isGenerating ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                {isGenerating ? '生成中...' : '生成歌词和词库'}
              </button>
              {!songLibraryLoading && !librarySong && songLibrary.length > 0 && <span className="pbv2-action-hint">请先选择一首曲目库歌曲</span>}
            </FooterActions>
          </div>
          )}

          {showSongPicker && (
            <div className="song-overlay" onClick={() => { stopSongPreview(); setShowSongPicker(false); }}>
              <div className="song-modal song-picker-modal" onClick={(event) => event.stopPropagation()}>
                <div className="modal-head"><div><h2>从曲目库选择歌曲</h2><p>可按旋律类型筛选，并分别试听演唱版或伴奏版</p></div><button type="button" onClick={() => { stopSongPreview(); setShowSongPicker(false); }}><X size={18} /></button></div>
                <audio ref={previewRef} onEnded={() => setPreviewSongId(null)} />
                <div className="song-picker-filters">
                  <button type="button" className={songTypeFilter === 'all' ? 'active' : ''} onClick={() => setSongTypeFilter('all')}>全部</button>
                  {songTypes.map((type) => <button type="button" key={type} className={songTypeFilter === type ? 'active' : ''} onClick={() => setSongTypeFilter(type)}>{melodyTypeLabels[type] || type}</button>)}
                </div>
                <div className="song-library-grid">
                  {filteredSongLibrary.map((song) => {
                    const isSelected = String(form.melody) === String(song.id);
                    const vocalUrl = song.vocal_url || song.vocalUrl;
                    const instrumentalUrl = song.instrumental_url || song.instrumentalUrl;
                    return <div key={song.id} className={`song-library-card${isSelected ? ' selected' : ''}`} onClick={() => { setFormField('melody', song.id); stopSongPreview(); setShowSongPicker(false); }}>
                      <div className="song-library-card-head"><span className="song-library-name">{song.name}</span>{isSelected && <span className="song-library-check">✓</span>}</div>
                      <span className="song-library-type">{melodyTypeLabels[song.melody_type || song.melodyType] || song.melody_type || song.melodyType}</span>
                      {song.description && <p className="song-library-desc">{song.description}</p>}
                      <div className="song-library-preview-actions">
                        <button type="button" disabled={!vocalUrl} className={`song-library-preview${String(previewSongId) === String(song.id) && previewAudioMode === 'vocal' ? ' playing' : ''}`} onClick={(event) => { event.stopPropagation(); previewLibrarySong(song, 'vocal'); }}>{String(previewSongId) === String(song.id) && previewAudioMode === 'vocal' ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}演唱版</button>
                        <button type="button" disabled={!instrumentalUrl} className={`song-library-preview${String(previewSongId) === String(song.id) && previewAudioMode === 'instrumental' ? ' playing' : ''}`} onClick={(event) => { event.stopPropagation(); previewLibrarySong(song, 'instrumental'); }}>{String(previewSongId) === String(song.id) && previewAudioMode === 'instrumental' ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}伴奏版</button>
                      </div>
                    </div>;
                  })}
                </div>
                {filteredSongLibrary.length === 0 && <div className="song-library-empty"><p>该类型下暂无歌曲</p></div>}
              </div>
            </div>
          )}

          {step === 1 && (
          <div className="song-writing-page sky-song-page pbv2-song-making">
            <audio ref={audioRef} src={currentAudioSrc} onLoadedMetadata={syncAudioDuration} onDurationChange={syncAudioDuration} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onEnded={() => { setPlaying(false); setCurrentTime(0); }} />
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
      <header className="sky-title"><h1>{draft.title}</h1><p>旋律：{selectedMelody.name} · {form.age} · {form.level}</p></header>
      <div className="pbv2-making-toolbar">
        <button type="button" className="pbv2-ghost" onClick={() => setShowContentEditor(true)}>编辑歌词和词库</button>
        {/* <button type="button" className="pbv2-ghost" onClick={() => downloadInteractiveHtml(draft, form, selectedMelody)}>下载 HTML</button> */}
        <button type="button" className="pbv2-ghost" onClick={() => setShowPlan(true)}>📋 活动方案</button>
        <button type="button" className="pbv2-primary" onClick={openPresentation}>🖥️ 授课模式</button>
      </div>

      <section className="sky-studio">
        <article className="sky-player">
          <strong>🎵 {audioMode === 'vocal' ? '演唱版' : '伴奏播放'}</strong>
          {librarySong && (librarySong.vocal_url || librarySong.vocalUrl || librarySong.instrumental_url || librarySong.instrumentalUrl) && (
            <div className="audio-mode-toggle sky-mode-toggle">
              <button type="button" disabled={!(librarySong.instrumental_url || librarySong.instrumentalUrl)} className={audioMode === 'instrumental' ? 'active' : ''} onClick={() => setAudioMode('instrumental')}>伴奏版</button>
              <button type="button" disabled={!(librarySong.vocal_url || librarySong.vocalUrl)} className={audioMode === 'vocal' ? 'active' : ''} onClick={() => setAudioMode('vocal')}>演唱版</button>
            </div>
          )}
          <div className="sky-player-row"><button type="button" className="sky-play" onClick={toggleAudio}>{playing ? <Pause fill="currentColor" size={17} /> : <Play fill="currentColor" size={17} />}</button><small>{formatAudioTime(currentTime)}</small><input aria-label="播放进度" type="range" min="0" max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} disabled={!duration} onChange={seekAudio} /><small>{formatAudioTime(duration)}</small></div>
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
                  if (!line.includes('______')) return <span className="lyric-copy">{line}</span>;
                  return line.split('______').map((part, blankIndex, parts) => <React.Fragment key={`${index}-${blankIndex}`}><span className="lyric-copy">{part}</span>{blankIndex < parts.length - 1 && <input className="lyric-blank" aria-label={`第 ${index + 1} 行第 ${blankIndex + 1} 个填空`} value={blankValues[`${index}:${blankIndex}`] ?? (blankIndex === 0 ? blankValues[index] || '' : '')} onFocus={() => setActiveBlank({ lineIndex: index, blankIndex })} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); try { const payload = JSON.parse(event.dataTransfer.getData('application/x-song-writing')); if (payload.type === 'word') fillWordAt(payload.word, { lineIndex: index, blankIndex }); } catch { /* Ignore invalid drops. */ } }} onChange={(e) => setBlankValues((current) => ({ ...current, [`${index}:${blankIndex}`]: e.target.value }))} />}</React.Fragment>);
                })()}
                <div className="line-instruments" onDragOver={(event) => event.preventDefault()} onDrop={(event) => dropOnLine(event, index, 'instrument')}>{(arrangement[index] || []).map((instrument, itemIndex) => <span key={`${instrument.id}-${itemIndex}`} className="line-instrument-chip" title={`${instrument.label}（点击移除）`} role="button" tabIndex={0} onClick={() => removeInstrument(index, itemIndex)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') removeInstrument(index, itemIndex); }}><img src={instrument.icon} alt={instrument.label} /></span>)}<button type="button" title={(arrangement[index] || []).length >= MAX_INSTRUMENTS_PER_LINE ? '每句最多 3 个乐器' : '为这一句配器'} disabled={(arrangement[index] || []).length >= MAX_INSTRUMENTS_PER_LINE} onClick={() => addInstrument(index, instruments[index % instruments.length])}>＋</button></div>
              </div>
            ))}
            </div><button type="button" className="sky-clear" onClick={regenerate}><RefreshCw size={14} />清空所有填空</button>
          </article>
          <div className="sky-sidecards">
            <article className="sky-words"><div className="sky-card-title"><b>📚 Word Bank</b><button type="button" onClick={() => { setSelectedLargeWord(''); setShowWords(true); }}><Expand size={15} /></button></div><span>拖到左边空格</span><div className="word-chips">{draft.words.map((word, index) => <button type="button" key={`${word}-${index}`} onClick={() => fillWord(word)}><i>{wordCardIcon(word, draft.wordEmojis)}</i>{word}</button>)}</div><p>💡 先点击歌词空格，再点击单词填入</p></article>
            <article className="sky-instruments"><div className="sky-card-title"><b>🎸 乐器</b><span>拖到歌词旁</span></div><div className="instrument-chips">{(showAllInstruments ? instruments : instruments.slice(0, 8)).map((instrument) => <button type="button" draggable key={instrument.id} onClick={() => activeBlank !== null && addInstrument(activeBlank.lineIndex, instrument)}><img src={instrument.icon} alt="" />{instrument.label}</button>)}{instruments.length > 8 && <button type="button" className="instrument-toggle" onClick={() => setShowAllInstruments((v) => !v)}>{showAllInstruments ? '收起' : `展开 (${instruments.length - 8})`}</button>}</div><p>💡 先点击乐器，再点击歌词旁的圆圈；每句最多 3 个，点击已添加的乐器可移除</p></article>
          </div>
        </div>
        <footer className="sky-footer">⭐ ☀️ 🌈 🎵 💛 ⭐<span>幸福力英文歌曲创编 · 轻松唱出心情</span></footer>
      </section>

      {showWords && <Overlay title="Word Bank · 选词区" className="word-bank-modal" onClose={() => setShowWords(false)}><p>投屏模式：点击词卡进行课堂聚焦，再次点击可取消选中。</p><div className="word-chips large">{draft.words.map((word, index) => <button type="button" className={selectedLargeWord === word ? 'is-selected' : ''} key={`${word}-${index}`} onClick={() => setSelectedLargeWord((current) => current === word ? '' : word)}><span>{wordCardIcon(word, draft.wordEmojis)}</span>{word}</button>)}</div></Overlay>}
      {showContentEditor && (
        <Overlay title="编辑歌词和 Word Bank" onClose={() => setShowContentEditor(false)}>
          <div className="song-content-editor pbv2-editor">
            <div className="song-editor-scroll">
            <section className="pbv2-editor-section lyrics-editor-section">
              <div className="song-editor-header">
                <h3>歌词模板</h3>
                <button type="button" className="regenerate-all-btn" disabled={regeneratingAll} onClick={() => setShowAdjustmentPanel((current) => !current)}>
                  {regeneratingAll ? <Loader2 className="spin" size={13} /> : <RefreshCw size={13} />}
                  {regeneratingAll ? '生成中...' : showAdjustmentPanel ? '收起调整' : '全部重新生成'}
                </button>
              </div>
              <p className="blank-hint">💡 在文本中点击指定位置，或选中要替换的文字，再点「插入填空」；可重复插入多个</p>
              {showAdjustmentPanel && <div className="song-adjustment-box">
                <label htmlFor="song-adjustment-request">具体调整需求</label>
                <textarea id="song-adjustment-request" rows={2} value={adjustmentRequest} onChange={(event) => setAdjustmentRequest(event.target.value)} placeholder="例如：保留核心句型，让 L1 更顺口，并减少一个填空" />
                <div className="song-adjustment-suggestions">
                  {adjustmentSuggestions.map((suggestion) => <button type="button" key={suggestion} className={adjustmentRequest.includes(suggestion) ? 'is-active' : ''} onClick={() => toggleAdjustmentSuggestion(suggestion)}>{suggestion}</button>)}
                </div>
                <button type="button" className="song-adjustment-submit" disabled={regeneratingAll} onClick={regenerateAllLines}>{regeneratingAll ? <Loader2 className="spin" size={13} /> : <Wand2 size={13} />}{regeneratingAll ? '正在重新生成...' : '按调整需求重新生成'}</button>
              </div>}
              {draft.lines.map((line, index) => (
                <div key={index} className="lyric-edit-row">
                  <span className="line-number">L{index + 1}</span>
                  <textarea ref={(element) => { lyricEditorRefs.current[index] = element; }} value={line} rows={1} onChange={(event) => setDraft((current) => ({ ...current, lines: current.lines.map((item, itemIndex) => itemIndex === index ? event.target.value : item) }))} />
                  <div className="line-actions">
                    <div className="blank-actions"><button type="button" className="blank-toggle" onClick={() => insertBlankInLine(index)}><Plus size={12} />插入填空</button>{line.includes('______') && <button type="button" className="blank-clear" onClick={() => clearBlanksInLine(index)}><Trash2 size={12} />清空填空</button>}</div>
                    <button type="button" className="line-regenerate" disabled={regeneratingLine === index} onClick={() => regenerateLine(index)}>{regeneratingLine === index ? <Loader2 className="spin" size={12} /> : <RefreshCw size={12} />}{regeneratingLine === index ? '生成中' : 'AI 重新生成'}</button>
                  </div>
                </div>
              ))}
            </section>
            <section className="pbv2-editor-section word-editor-section">
              <h3>Word Bank</h3>
              {draft.words.map((word, index) => <label key={index}><input value={word} onChange={(event) => setDraft((current) => ({ ...current, words: current.words.map((item, itemIndex) => itemIndex === index ? event.target.value : item) }))} /><button type="button" aria-label={`删除 ${word}`} onClick={() => setDraft((current) => ({ ...current, words: current.words.filter((_, itemIndex) => itemIndex !== index) }))}><Trash2 size={15} /></button></label>)}
              <button type="button" className="add-word" onClick={() => setDraft((current) => ({ ...current, words: [...current.words, 'new word'] }))}><Plus size={13} /> 添加词卡</button>
            </section>
            </div>
            <button type="button" className="generate-html pbv2-editor-save" onClick={saveContentEdits}>保存修改</button>
          </div>
        </Overlay>
      )}
      {showPlan && <Overlay title="活动方案" onClose={() => setShowPlan(false)}>{generatedPlan ? <div className="song-plan"><section><h3>学习目标</h3><p><b>英文：</b>{generatedPlan.englishGoal}</p><p><b>幸福力：</b>{generatedPlan.wellbeingGoal}</p></section><section><h3>课前准备</h3><p>{(generatedPlan.materials || []).join('、')}</p></section><section><h3>课堂流程</h3><ol>{(generatedPlan.steps || []).map((step, index) => <li key={index}><div><b>{index + 1}. {step.title}</b><em>{step.duration}</em></div><p>{step.teacherGuide}</p></li>)}</ol></section></div> : <p>请先生成歌词和词库，即可查看本作品的活动方案。</p>}</Overlay>}
      {showPresentation && <SongPresentation draft={draft} blankValues={blankValues} arrangement={arrangement} audioRef={audioRef} playing={playing} toggleAudio={toggleAudio} speed={speed} setSpeed={setSpeed} volume={volume} setVolume={setVolume} selectedMelody={selectedMelody} audioMode={audioMode} setAudioMode={setAudioMode} librarySong={librarySong} currentAudioSrc={currentAudioSrc} onClose={closePresentation} />}
          </div>
          )}
        </section>
      </div>
    </main>
  );
}

function OptionGroup({ label, required, options, value, onChange, tone = 'coral' }) {
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

function CheckboxGroup({ label, options, value, otherValue, onToggle, onOther, tone = 'yellow' }) {
  return (
    <section className={`pbv2-card pbv2-tone-${tone}`}>
      <div className="pbv2-card-title">{label}</div>
      <div className="pbv2-chip-grid">
        {options.map((option) => (
          <button type="button" key={option} className={value.includes(option) ? 'is-active' : ''} onClick={() => onToggle(option)}>
            {option}
          </button>
        ))}
      </div>
      <input className="pbv2-input" value={otherValue} onChange={(event) => onOther(event.target.value)} placeholder="其他（自由输入）" />
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

function FooterActions({ children }) {
  return (
    <footer className="pbv2-actions">
      <ChevronRight size={16} />
      {children}
    </footer>
  );
}
function SongGenerationLoading() { return <main className="song-generation-page"><section className="song-generation-loading"><svg className="song-loading-illustration" width="165" height="145" viewBox="0 0 165 145" aria-hidden="true"><circle cx="138" cy="25" r="5" fill="#c48cff"/><circle cx="15" cy="108" r="7" fill="none" stroke="#ff7c73" strokeWidth="4"/><path d="M42 99c25 10 56 10 82-1" fill="none" stroke="#d7dce3" strokeWidth="3" strokeDasharray="5 5"/><g transform="rotate(-7 64 66)"><rect x="20" y="35" width="67" height="79" rx="12" fill="#fffdf7" stroke="#344255" strokeWidth="4"/><path d="M39 66h27M39 81h20" stroke="#75a9e8" strokeWidth="4" strokeLinecap="round"/></g><g transform="rotate(12 105 69)"><rect x="81" y="43" width="62" height="72" rx="12" fill="#f7e6ef" stroke="#344255" strokeWidth="4"/><path d="M100 71h25M100 86h17" stroke="#75a9e8" strokeWidth="4" strokeLinecap="round"/></g><g transform="rotate(-18 87 48)"><rect x="64" y="39" width="63" height="14" rx="7" fill="#ffcc63" stroke="#344255" strokeWidth="3"/><path d="M111 40h11v12h-11z" fill="#ff7c73"/><path d="M77 42h23" stroke="#fffdf7" strokeWidth="4" strokeLinecap="round"/></g></svg><h1>正在生成歌曲<span><i></i><i></i><i></i></span></h1></section></main>; }
function Overlay({ title, onClose, children, className = '' }) {
  const editorClass = title === '编辑歌词和 Word Bank' ? 'song-content-editor-modal' : '';
  return <div className="song-overlay" role="dialog" aria-modal="true"><div className={`song-modal ${editorClass} ${className}`}><div className="modal-head"><h2>{title}</h2><button type="button" onClick={onClose}><X /></button></div>{children}</div></div>;
}
function SongPresentation({ draft, blankValues, arrangement, audioRef, playing, toggleAudio, speed, setSpeed, volume, setVolume, selectedMelody, audioMode, setAudioMode, librarySong, currentAudioSrc, onClose }) {
  const renderLine = (line, index) => {
    if (!line.includes('______')) return line;
    const parts = line.split('______');
    return parts.map((part, i) => (
      <React.Fragment key={i}>
        {part}
        {i < parts.length - 1 && <span className="present-blank filled">{(blankValues?.[`${index}:${i}`] ?? (i === 0 ? blankValues?.[index] : '')) || '______'}</span>}
      </React.Fragment>
    ));
  };
  return (
    <div className="pbv2-presentation song-presentation" role="dialog" aria-modal="true">
      <span className="song-present-deco deco-note">♫</span>
      <span className="song-present-deco deco-star">✦</span>
      <span className="song-present-deco deco-heart">♥</span>
      <span className="song-present-deco deco-wave">〰</span>
      <button type="button" className="pbv2-presentation-exit" onClick={onClose} aria-label="exit"><X size={24} /></button>
      <div className="song-present-content">
        <h1 className="song-present-title">{draft.title}</h1>
        <p className="song-present-subtitle">{selectedMelody.name}</p>
        <div className="song-present-player-bar">
          <audio ref={audioRef} src={currentAudioSrc} />
          <button type="button" className="song-present-play" onClick={toggleAudio}>{playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}</button>
          <div className="song-present-controls">
            <div className="song-present-speed">{[0.5,0.75,1,1.25,1.5].map((item) => <button type="button" className={speed === item ? 'active' : ''} key={item} onClick={() => setSpeed(item)}>{item}×</button>)}</div>
            <label className="song-present-volume"><Volume2 size={16} /><input aria-label="音量" type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(Number(e.target.value))} /><b>{Math.round(volume * 100)}%</b></label>
            {librarySong && (librarySong.vocal_url || librarySong.instrumental_url) && (
              <div className="song-present-mode">
                <button type="button" className={audioMode === 'instrumental' ? 'active' : ''} onClick={() => setAudioMode('instrumental')}>伴奏版</button>
                <button type="button" className={audioMode === 'vocal' ? 'active' : ''} onClick={() => setAudioMode('vocal')}>演唱版</button>
              </div>
            )}
          </div>
        </div>
        <div className="song-present-lyrics">
          {draft.lines.map((line, index) => (
            <div key={index} className="song-present-line">
              <span className="song-present-line-copy">{renderLine(line, index)}</span>
              {(arrangement?.[index] || []).length > 0 && <span className="song-present-instruments">{arrangement[index].map((instrument, itemIndex) => <span key={`${instrument.id}-${itemIndex}`} title={instrument.label}><img src={instrument.icon} alt={instrument.label} /><small>{instrument.label}</small></span>)}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
