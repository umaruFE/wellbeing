import { ContentTabPanel, ContentTabs, CreateButton, FilterChip, LibrarySearch, MetadataTag } from '../../components/LibraryControls';
import { AuthoringSteps } from '../../components/AuthoringSteps';
import React from 'react';
import { PageLoading } from '../../components/PageLoading';
import {
  ArrowLeft,
  BookOpenText,
  Check,
  ChevronLeft,
  ChevronRight,
  Image,
  LayoutTemplate,
  Loader2,
  Music2,
  Monitor,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
  Wand2,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import uploadService from '../../services/uploadService';
import { getPromptTemplate } from '../../services/promptLibrary';
import { resolveGeneratedAsset } from '../../utils/assetGeneration';
import { openTeachingWindow } from '../../utils/teachingWindow';
import { trackEvent } from '../../utils/usageTracker';
import { createPictureBookCaseDraft } from './pictureBookCases';
import './PictureBookStudioPage.css';

const initialBasicInfo = {
  age: '',
  level: '',
  participants: '',
  themes: [],
  themeOther: '',
  materials: [],
  materialOther: '',
  vocabulary: '',
  grammar: '',
};

const initialActivityPlan = {
  storyTitleEn: '',
  storyTitleZh: '',
  storyContent: '',
  englishGoal: '',
  wellbeingGoal: '',
  outputGoal: '',
  materials: '',
  recommendedPageCount: 0,
};

// 兜底常量：后端注册表（/api/prompts/frontend.*）不可用时使用；权威版本在
// api/src/prompts/builtin.ts 与 Wiki 页面 wellbeing/prompts/frontend.*
const FALLBACK_VISUAL_STYLE = [
  'Oliver Jeffers-inspired loose watercolor washes with expressive black pen-and-ink sketch lines, warm, restrained, playful, and emotionally gentle.',
  'Use an extremely low-saturation washed palette of gray-blue, dusty gray-pink, sage gray-green, muted gray-orange, pale gray-yellow, and soft gray-purple.',
  'Let each page-specific image prompt determine the number of elements, layout, density, and composition.',
  'Preserve creative-process traces: faint pencil construction lines, restrained watercolor splashes, and hand-drawn tool icons such as pencils or palettes.',
  'Use imperfect handwritten English typography only for the explicitly supplied page text.',
  'Use a flat light warm-beige textured drawing-paper background, no border, no frame, no open-book mockup, and no photographed book.',
  'Use one consistent landscape page ratio.',
  'Do not invent or display any words from the visual description or generation prompt.',
].join(' ');

const FALLBACK_NEGATIVE_PROMPT = 'Chinese characters, Chinese text, non-English text, unrequested words, extra letters, captions, annotations, speech bubbles, callouts, explanatory symbols, page numbers, borders, frames, open-book mockup, photographed book, saturated colors, neon colors, gibberish typography, pseudo-text, misspelled text, duplicated title, repeated text';

function sanitizeNonVisibleVisualPrompt(value) {
  let prompt = String(value || '').replace(/\s+/g, ' ').trim();
  if (!prompt) return '';

  const colonIndex = prompt.indexOf(':');
  const prefix = colonIndex >= 0 ? prompt.slice(0, colonIndex) : '';
  if (colonIndex >= 0 && prefix.length <= 180 && /arrang|show|card|thumbnail|option|item|scene|visual/i.test(prefix)) {
    prompt = prompt.slice(colonIndex + 1).trim();
  }

  return prompt
    .replace(/\b(?:labelled|labeled)\s+[“”"'‘’]?([a-z][a-z-]*)[“”"'‘’]?/gi, 'representing $1 without written labels')
    .replace(/\bunlabelled\b/gi, 'without written labels')
    .replace(/\b(?:title|heading|caption)\s*:\s*[^.;]+[.;]?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getPageVisualPrompt(page) {
  return sanitizeNonVisibleVisualPrompt(page?.imagePrompt || page?.imageDescription);
}

function toggleList(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function hasTeachingPages(pages) {
  return Array.isArray(pages) && pages.some(page => page && (page.imageUrl || page.img || page.subtitle || page.text));
}

export function PictureBookStudioPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isEn = i18n.language?.startsWith('en');
  const [view, setView] = React.useState('list');
  const [bookList, setBookList] = React.useState([]);
  const [bookCases, setBookCases] = React.useState([]);
  const [listLoading, setListLoading] = React.useState(true);
  const [listError, setListError] = React.useState(false);
  const [listNotice, setListNotice] = React.useState('');
  const [libraryTab, setLibraryTab] = React.useState('cases');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [editingBookId, setEditingBookId] = React.useState(null);
  const [step, setStep] = React.useState(0);
  const [basicInfo, setBasicInfo] = React.useState(initialBasicInfo);
  const [activityPlan, setActivityPlan] = React.useState(initialActivityPlan);
  const [pages, setPages] = React.useState([]);
  const [generatingAll, setGeneratingAll] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [saveState, setSaveState] = React.useState('');
  const editingBookIdRef = React.useRef(null);
  const savedContent = React.useRef(null);

  // 提示词统一从后端注册表拉取（Wiki 可覆盖），本地常量仅兜底
  const [storybookPrompts, setStorybookPrompts] = React.useState({
    visualStyle: FALLBACK_VISUAL_STYLE,
    negative: FALLBACK_NEGATIVE_PROMPT,
  });
  React.useEffect(() => {
    let alive = true;
    Promise.all([
      getPromptTemplate('frontend.storybook-visual-style', FALLBACK_VISUAL_STYLE),
      getPromptTemplate('frontend.storybook-negative', FALLBACK_NEGATIVE_PROMPT),
    ]).then(([visualStyle, negative]) => {
      if (alive) setStorybookPrompts({ visualStyle, negative });
    });
    return () => { alive = false; };
  }, []);
  const [backgroundMusic, setBackgroundMusic] = React.useState(null);
  const [audioLibrary, setAudioLibrary] = React.useState([]);
  const [songLibrary, setSongLibrary] = React.useState([]);
  const [showMusicPicker, setShowMusicPicker] = React.useState(false);
  const [musicSourceTab, setMusicSourceTab] = React.useState('audio');
  const [previewMusicId, setPreviewMusicId] = React.useState(null);
  const [aiMusicForm, setAiMusicForm] = React.useState({ prompt: '', style: 'calm, peaceful, warm, instrumental', duration: 30 });
  const [aiMusicGenerating, setAiMusicGenerating] = React.useState(false);
  const [aiMusicResult, setAiMusicResult] = React.useState(null);
  const [aiMusicError, setAiMusicError] = React.useState('');
  const musicPreviewRef = React.useRef(null);
  const musicDialogRef = React.useRef(null);

  React.useEffect(() => {
    if (!showMusicPicker) return;
    const dialog = musicDialogRef.current;
    const previousFocus = document.activeElement;
    const audio = musicPreviewRef.current;
    dialog?.showModal();
    return () => {
      audio?.pause();
      dialog?.close();
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [showMusicPicker]);

  const closeMusicPicker = () => {
    musicPreviewRef.current?.pause();
    setPreviewMusicId(null);
    setShowMusicPicker(false);
  };

  const handleMusicBackdropClick = (event) => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeMusicPicker();
  };

  const fetchBookList = React.useCallback(async () => {
    setListLoading(true);
    setListError(false);
    try {
      const params = { limit: 100 };
      if (user?.id) params.userId = user.id;
      const [result, platformCases] = await Promise.all([
        apiService.request('/api/picture-books?' + new URLSearchParams(params).toString()),
        apiService.request('/api/picture-books?scope=cases'),
      ]);
      setBookList(result.data || []);
      setBookCases(platformCases.data || []);
    } catch (err) {
      console.error('fetch picture books failed:', err);
      setListError(true);
    } finally {
      setListLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    if (view === 'list') fetchBookList();
  }, [view, fetchBookList]);

  React.useEffect(() => {
    Promise.all([apiService.getVoiceConfigs(user?.id), apiService.request('/api/audio-assets?limit=100')]).then(([voiceResult, assetResult]) => {
      const assets = [...(voiceResult.data || []), ...(assetResult.data || [])].map((item) => ({
        id: item.id,
        name: item.name || item.title || item.voice_name || t('pictureBook.untitledAudio'),
        type: item.type || item.audio_type || item.voice_type || '',
        description: item.description || item.theme || item.style || '',
        url: item.audio_url || item.audioUrl || item.url || item.file_url || item.object_url || '',
      })).filter((item) => item.url && (/bgm|music|背景音乐/i.test(item.type) || item.tags?.some?.((tag) => /bgm|music|背景音乐/i.test(tag))));
      setAudioLibrary(assets);
    }).catch(() => setAudioLibrary([]));
  }, [t, user?.id]);

  React.useEffect(() => {
    apiService.request('/api/song-library').then((result) => setSongLibrary((result.data || []).map((song) => ({
      id: song.id,
      name: song.name,
      description: song.description || song.melody_type || song.melodyType || t('pictureBook.songLibFallback'),
      vocalUrl: song.vocal_url || song.vocalUrl || '',
      instrumentalUrl: song.instrumental_url || song.instrumentalUrl || '',
    })))).catch(() => setSongLibrary([]));
  }, [t]);

  const generateAiMusic = async () => {
    if (!aiMusicForm.prompt.trim() || aiMusicGenerating) return;
    setAiMusicGenerating(true); setAiMusicError(''); setAiMusicResult(null);
    try {
      const response = await fetch('/api/ai/generate-audio', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` }, body: JSON.stringify({ prompt: aiMusicForm.prompt.trim(), count: 1, o3ics: aiMusicForm.style, duration: aiMusicForm.duration, user_id: user?.id || null, organization_id: user?.organizationId || null }) });
      const data = await response.json();
      if (!response.ok || !data.executionId) throw new Error(data.error || t('pictureBook.aiTaskCreateFailed'));
      for (let attempt = 0; attempt < 60; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 3000));
        const statusResponse = await fetch(`/api/ai/generate-audio?executionId=${encodeURIComponent(data.executionId)}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` } });
        if (!statusResponse.ok) continue;
        const status = await statusResponse.json();
        if (status.status === 'completed' && status.results?.[0]?.url) {
          const generatedName = aiMusicForm.prompt.trim().slice(0, 30) || 'AI 背景音乐';
          const saved = await apiService.request('/api/audio-assets', { method: 'POST', body: JSON.stringify({ name: generatedName, audioUrl: status.results[0].url, duration: `${aiMusicForm.duration}s`, tags: ['背景音乐', 'AI生成'], description: aiMusicForm.prompt.trim() }) });
          const savedMusic = { id: saved.data?.id || `ai-${data.executionId}`, name: generatedName, description: 'AI 生成背景音乐', url: saved.data?.audio_url || status.results[0].url, source: 'ai' };
          setAiMusicResult(savedMusic);
          setAudioLibrary((current) => [savedMusic, ...current.filter((item) => item.id !== savedMusic.id)]);
          return;
        }
        if (status.status === 'error') throw new Error(t('pictureBook.aiMusicFailed'));
      }
      throw new Error(t('pictureBook.aiMusicTimeout'));
    } catch (error) { setAiMusicError(error instanceof Error ? error.message : t('pictureBook.aiMusicFailed')); }
    finally { setAiMusicGenerating(false); }
  };

  const deleteBook = async (bookId) => {
    if (!window.confirm(t('pictureBook.confirmDelete'))) return;
    try {
      await apiService.request(`/api/picture-books/${bookId}`, { method: 'DELETE' });
      setBookList(bookList.filter((b) => b.id !== bookId));
    } catch {
      alert(t('pictureBook.deleteFailed'));
    }
  };

  const openBook = (book) => {
    setLibraryTab('mine');
    setListNotice('');
    editingBookIdRef.current = book.id;
    setEditingBookId(book.id);
    const data = book.book_data || {};
    const loaded = {
      basicInfo: { ...initialBasicInfo, ...data.basicInfo },
      activityPlan: { ...initialActivityPlan, ...data.activityPlan },
      pages: Array.isArray(data.pages) ? data.pages : [],
      backgroundMusic: data.backgroundMusic || null,
    };
    savedContent.current = loaded;
    setBasicInfo(loaded.basicInfo);
    setActivityPlan(loaded.activityPlan);
    setPages(loaded.pages);
    setBackgroundMusic(loaded.backgroundMusic);
    setStep(Number.isInteger(data.step) && data.step >= 0 && data.step <= 3 ? data.step : 0);
    setSaveState('');
    setMessage('');
    setView('studio');
  };

  const createNewBook = () => {
    setLibraryTab('mine');
    setSearchTerm('');
    setListNotice('');
    editingBookIdRef.current = null;
    setEditingBookId(null);
    setBasicInfo(initialBasicInfo);
    setActivityPlan(initialActivityPlan);
    const emptyPages = [];
    setPages(emptyPages);
    savedContent.current = { basicInfo: initialBasicInfo, activityPlan: initialActivityPlan, pages: emptyPages, backgroundMusic: null };
    setBackgroundMusic(null);
    setStep(0);
    setMessage('');
    setView('studio');
  };

  const useBookCase = (book) => {
    savedContent.current = null;
    const data = createPictureBookCaseDraft(book);
    setListNotice('');
    editingBookIdRef.current = null;
    setEditingBookId(null);
    setBasicInfo({ ...initialBasicInfo, ...data.basicInfo });
    setActivityPlan({ ...initialActivityPlan, ...data.activityPlan });
    setPages(data.pages || []);
    setBackgroundMusic(data.backgroundMusic || null);
    setStep(0);
    setLibraryTab('mine');
    setSearchTerm('');
    setMessage('');
    setSaveState('');
    setView('studio');
  };

  const presentBook = (book) => {
    setListNotice('');
    const data = book.book_data || {};
    if (!hasTeachingPages(data.pages)) {
      setListNotice(t('pictureBook.presentEmpty'));
      return;
    }
    if (!openTeachingWindow({ pages: data.pages, title: book.title || t('pictureBook.untitled'), backgroundMusic: data.backgroundMusic || null })) {
      setListNotice(t('pictureBook.previewBlocked'));
    }
  };

  const saveBook = async (extraData = {}) => {
    const bookData = {
      basicInfo: extraData.basicInfo || basicInfo,
      activityPlan: extraData.activityPlan || activityPlan,
      pages: extraData.pages || pages,
      backgroundMusic: extraData.backgroundMusic !== undefined ? extraData.backgroundMusic : backgroundMusic,
      step: Number.isInteger(extraData.step) ? extraData.step : step,
    };
    const coverUrl = bookData.pages.find((p) => p.imageUrl)?.imageUrl || '';
    const payload = {
      userId: user?.id,
      title: bookData.activityPlan.storyTitleEn || t('pictureBook.untitled'),
      status: 'draft',
      coverUrl,
      bookData,
    };
    setSaving(true);
    setSaveState('');
    try {
      const currentBookId = editingBookIdRef.current || editingBookId;
      if (currentBookId) {
        await apiService.request(`/api/picture-books/${currentBookId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        const result = await apiService.request('/api/picture-books', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (result.data?.id) {
          editingBookIdRef.current = result.data.id;
          setEditingBookId(result.data.id);
        }
      }
      savedContent.current = bookData;
      setSaveState(t('pictureBook.saved'));
      return true;
    } catch (err) {
      console.error('save picture book failed:', err);
      setSaveState(t('pictureBook.saveFailed'));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveBackgroundMusic = async (music) => {
    const currentBookId = editingBookIdRef.current || editingBookId;
    if (!currentBookId) {
      setBackgroundMusic(music);
      return saveBook({ backgroundMusic: music });
    }
    try {
      await apiService.request(`/api/picture-books/${currentBookId}`, { method: 'PUT', body: JSON.stringify({ backgroundMusic: music }) });
      if (savedContent.current) savedContent.current = { ...savedContent.current, backgroundMusic: music };
      return true;
    } catch (error) {
      console.error('save picture book background music failed:', error);
      setMessage(t('pictureBook.musicSaveFailed'));
      return false;
    }
  };

  const hasContentChanges = () => {
    const last = savedContent.current;
    return !last || last.basicInfo !== basicInfo || last.activityPlan !== activityPlan || last.pages !== pages || last.backgroundMusic !== backgroundMusic;
  };

  const backToList = async () => {
    if (!hasContentChanges() || await saveBook()) setView('list');
  };

  const goToStep = async (nextStep) => {
    if (!hasContentChanges() || await saveBook({ step: nextStep })) setStep(nextStep);
  };

  React.useEffect(() => {
    if (view !== 'studio') return;
    const handler = () => { if (!saving && !generating && !generatingAll) void backToList(); };
    window.addEventListener('wellbeing:nav-same-route', handler);
    return () => window.removeEventListener('wellbeing:nav-same-route', handler);
  });

  const steps = [
    t('pictureBook.stepBasic'),
    t('pictureBook.stepPlan'),
    t('pictureBook.stepDesign'),
    t('pictureBook.stepMaking'),
  ];

  const canBuildPlan = Boolean(String(basicInfo.vocabulary || '').trim() || String(basicInfo.grammar || '').trim());

  const setBasicField = (field, value) => {
    setBasicInfo((current) => ({ ...current, [field]: value }));
  };

  const setPlanField = (field, value) => {
    setActivityPlan((current) => ({ ...current, [field]: value }));
  };

  const updatePage = (id, patch) => {
    setPages((current) => current.map((page) => (page.id === id ? { ...page, ...patch } : page)));
  };

  const buildPlan = async () => {
    if (!canBuildPlan) {
      setMessage(t('pictureBook.selectRequired'));
      return;
    }
    setGenerating(true);
    setMessage(t('pictureBook.generatingPlan'));
    try {
      const data = await apiService.request('/api/rag/generate', {
        method: 'POST',
        body: JSON.stringify({
          type: 'activity-plan',
          basicInfo,
          language: isEn ? 'en' : 'zh',
          outputLanguage: isEn ? 'English' : 'Chinese',
        }),
      });
      if (!data.success || !data.activityPlan) {
        throw new Error(data.error || t('pictureBook.planFailed'));
      }

      const nextPlan = { ...initialActivityPlan, ...data.activityPlan };
      setActivityPlan(nextPlan);
      setPages([]);
      setMessage('');
      setStep(1);
      await saveBook({ activityPlan: nextPlan, pages: [], step: 1 });
      trackEvent('picturebook.activity-plan.generate.success', 'picture_book', editingBookIdRef.current || editingBookId, {
        themes: basicInfo.themes,
        age: basicInfo.age,
        level: basicInfo.level,
        source: 'ai',
      });
    } catch (error) {
      setMessage(error.message || t('pictureBook.planFailed'));
      trackEvent('picturebook.activity-plan.generate.error', 'picture_book', editingBookIdRef.current || editingBookId, {
        error: error.message,
      });
    } finally {
      setGenerating(false);
    }
  };

  const buildDesign = async () => {
    setGenerating(true);
    setMessage(t('pictureBook.generatingDesign'));
    const pageCount = pages.length || Number(activityPlan.recommendedPageCount) || undefined;
    try {
      const data = await apiService.request('/api/rag/generate', {
        method: 'POST',
        body: JSON.stringify({
          type: 'picture-book-design',
          basicInfo,
          activityPlan,
          ...(pageCount ? { pageCount } : {}),
          language: isEn ? 'en' : 'zh',
          outputLanguage: isEn ? 'English' : 'Chinese',
        }),
      });
      if (!data.success || !Array.isArray(data.pages) || !data.pages.length) {
        throw new Error(data.error || t('pictureBook.designFailed'));
      }

      const nextPages = data.pages.map((p, i) => ({
        id: `page-${Date.now()}-${i}`,
        page: p.page || i + 1,
        pageType: p.pageType || 'instruction',
        imageDescription: p.imageDescription || '',
        imagePrompt: p.imagePrompt || '',
        visualWords: Array.isArray(p.visualWords) ? p.visualWords : [],
        text: p.text || '',
        imageUrl: '',
        status: 'placeholder',
        error: '',
      }));
      setPages(nextPages);
      setMessage('');
      setStep(2);
      await saveBook({ pages: nextPages, step: 2 });
      trackEvent('picturebook.design.generate.success', 'picture_book', editingBookIdRef.current || editingBookId, {
        pageCount: nextPages.length,
        source: 'ai',
      });
    } catch (error) {
      setMessage(error.message || t('pictureBook.designFailed'));
      trackEvent('picturebook.design.generate.error', 'picture_book', editingBookIdRef.current || editingBookId, {
        error: error.message,
      });
    } finally {
      setGenerating(false);
    }
  };

  const addPage = () => {
    setPages((current) => [
      ...current,
      {
        id: `page-${Date.now()}`,
        page: current.length + 1,
          pageType: 'instruction',
          imageDescription: t('pictureBook.newPageDescription'),
          imagePrompt: '',
        text: 'New page text.',
        imageUrl: '',
        status: 'placeholder',
        error: '',
      },
    ]);
  };

  const removePage = (id) => {
    setPages((current) => current.filter((page) => page.id !== id).map((page, index) => ({ ...page, page: index + 1 })));
  };

  const buildStorybookRequest = () => ({
    assetType: 'image',
    assetCode: 'B9',
    assetName: t('pictureBook.batchImages'),
    prompt: `${storybookPrompts.visualStyle}\nBook title: ${activityPlan.storyTitleEn}.\nGuided activity concept: ${activityPlan.storyContent}`,
    options: {
      imageRatio: '16:9',
      imageStyle: 'Watercolor Picture Book',
      negativePrompt: storybookPrompts.negative,
      referenceNotes: [
        'These are prompt-only visual directions for an action-led guided picture book. They must guide composition but must never be rendered as visible page text.',
        'ABSOLUTE TYPOGRAPHY RULE: each image may display only its visibleEnglishText value exactly. Never display imageDescription, imagePrompt, pageType, labels, captions, annotations, speech bubbles, Chinese characters, pseudo-text, or any other words.',
        JSON.stringify(pages.map((page) => ({
          page: page.page,
          pageType: page.pageType || 'instruction',
          imagePrompt: getPageVisualPrompt(page),
          visibleEnglishText: page.text,
          allowedVisibleWords: [],
        }))),
      ].join('\n'),
      batchItems: pages.map((page) => ({
        page: page.page,
        pageType: page.pageType || 'instruction',
        title: `${activityPlan.storyTitleEn || 'Picture Book'} · Page ${page.page}`,
        // The n8n storybook workflow treats `text` as literal visible typography.
        // The cover title is supplied separately as storybookTitle, so keep page 1 empty to avoid duplication.
        text: page.page === 1 ? '' : page.text,
        imageDescription: page.imageDescription,
        imagePrompt: getPageVisualPrompt(page),
        visualWords: [],
        prompt: [
          `Create a guided picture-book ${page.pageType || 'instruction'} page, never a narrative story scene.`,
          storybookPrompts.visualStyle,
          `NON-VISIBLE SCENE INSTRUCTIONS — interpret as pictures, never typography: ${getPageVisualPrompt(page)}.`,
          `Render this exact English core text: “${page.text}”.`,
          'Do not add any word labels beyond the exact core text.',
          'Make the child action visually obvious using pictures only.',
          'Do not add captions, annotations, speech bubbles, Chinese text, pseudo-text, extra sentences, or unrelated typography.',
        ].join(' '),
      })),
      rawValues: {
        storybookTitle: activityPlan.storyTitleEn || 'Picture Book',
        storybookContent: pages.map((page) => page.text).join('\n'),
        storybookStyle: 'Watercolor Picture Book',
        storybookGrade: basicInfo.age || (isEn ? 'Ages 7–9' : '7-9岁'),
      },
    },
  });

  const generateAllImages = async () => {
    if (pages.length < 2) {
      setMessage(t('pictureBook.minimumPages'));
      return;
    }
    setGeneratingAll(true);
    setMessage('');
    const sourcePages = pages.map((page) => ({ ...page }));
    setPages((current) => current.map((page) => ({ ...page, status: 'generating', error: '' })));
    try {
      const result = await apiService.request('/api/ai/generate-ppt-asset', {
        method: 'POST',
        body: JSON.stringify(buildStorybookRequest()),
      });
      const assets = Array.isArray(result.assets) ? result.assets : [result.asset].filter(Boolean);
      setStep(3);
      const results = await Promise.allSettled(assets.map(async (asset, index) => {
        const pageNumber = Number(asset?.raw?.page || asset?.page) || index + 1;
        const url = await resolveGeneratedAsset(asset, {
          fallbackError: t('pictureBook.imageFailed'),
          onResolved: (url) => setPages((current) => current.map((page) => (
            page.page === pageNumber
              ? { ...page, imageUrl: url, status: 'done', error: '' }
              : page
          ))),
        });
        return { pageNumber, url };
      }));
      const fulfilledByPage = new Map();
      const rejectedByPage = new Map();
      results.forEach((resultForAsset, index) => {
        const fallbackPage = Number(assets[index]?.raw?.page || assets[index]?.page) || index + 1;
        if (resultForAsset.status === 'fulfilled' && resultForAsset.value?.url) {
          fulfilledByPage.set(resultForAsset.value.pageNumber, resultForAsset.value.url);
        } else if (resultForAsset.status === 'rejected') {
          rejectedByPage.set(fallbackPage, resultForAsset.reason?.message || t('pictureBook.imageFailed'));
        }
      });
      const finalPages = sourcePages.map((page) => {
        const url = fulfilledByPage.get(page.page);
        if (url) return { ...page, imageUrl: url, status: 'done', error: '' };
        if (page.imageUrl) return { ...page, status: 'done', error: '' };
        return {
          ...page,
          status: 'placeholder',
          error: rejectedByPage.get(page.page) || t('pictureBook.imageTimeout'),
        };
      });
      setPages(finalPages);
      await saveBook({ pages: finalPages, step: 3 });
    } catch (error) {
      setPages((current) => current.map((page) => ({ ...page, status: page.imageUrl ? 'done' : 'placeholder', error: error.message })));
      setMessage(error.message || t('pictureBook.batchFailed'));
    } finally {
      setGeneratingAll(false);
    }
  };

  const generateOneImage = async (targetPage) => {
    updatePage(targetPage.id, { status: 'generating', error: '' });
    try {
      const prompt = [
        `Children picture-book illustration for page ${targetPage.page}.`,
        `Story title: ${activityPlan.storyTitleEn || 'Picture Book'}.`,
        storybookPrompts.visualStyle,
        `NON-VISIBLE SCENE INSTRUCTIONS — interpret as pictures, never typography: ${getPageVisualPrompt(targetPage)}.`,
        `Page mode: ${targetPage.pageType || 'instruction'}. This is an action-led guided picture book, not a narrative story scene.`,
        'Make the requested child action, choices, tools, or response space visually obvious.',
        `Render only this exact English core text: “${targetPage.text}”.`,
        'Do not render word labels beyond the exact core text.',
        'Do not render captions, annotations, speech bubbles, Chinese characters, pseudo-text, or unrelated words.',
        'Warm classroom-ready picture-book style, consistent soft watercolor palette, no watermark.',
      ].join(' ');
      const result = await apiService.request('/api/ai/generate-ppt-asset', {
        method: 'POST',
        body: JSON.stringify({
          assetType: 'image',
          assetCode: 'B9',
          assetName: t('pictureBook.pageAssetName', { page: targetPage.page }),
          prompt,
          options: {
            imageRatio: '16:9',
            imageStyle: 'Watercolor Picture Book',
            negativePrompt: storybookPrompts.negative,
            batchItems: [{
              page: targetPage.page,
              pageType: targetPage.pageType || 'instruction',
              title: `${activityPlan.storyTitleEn || 'Picture Book'} · Page ${targetPage.page}`,
              text: targetPage.page === 1 ? '' : targetPage.text,
              imageDescription: targetPage.imageDescription,
              imagePrompt: getPageVisualPrompt(targetPage),
              visualWords: [],
              prompt,
            }],
            rawValues: {
              scene: getPageVisualPrompt(targetPage),
              storybookTitle: activityPlan.storyTitleEn || 'Picture Book',
              storybookStyle: 'Watercolor Picture Book',
              storybookGrade: basicInfo.age || (isEn ? 'Ages 7–9' : '7-9岁'),
            },
          },
        }),
      });
      const url = await resolveGeneratedAsset(result.asset || result.assets?.[0] || result, {
        fallbackError: t('pictureBook.imageFailed'),
      });
      const finalPages = pages.map((page) => (page.id === targetPage.id ? {
        ...page,
        imageUrl: url,
        status: url ? 'done' : 'placeholder',
        error: url ? '' : t('pictureBook.imageSubmitted'),
      } : page));
      setPages(finalPages);
      if (url) await saveBook({ pages: finalPages, step: 3 });
    } catch (error) {
      updatePage(targetPage.id, { status: 'placeholder', error: error.message || t('pictureBook.singleFailed') });
    }
  };

  const uploadPageImage = async (page, file) => {
    if (!file) return;
    updatePage(page.id, { status: 'generating', error: '' });
    const result = await uploadService.uploadFile(file, 'picture-books');
    if (!result.success || !result.url) {
      updatePage(page.id, { status: 'placeholder', error: result.error || t('common.uploadFailed') });
      return;
    }
    const finalPages = pages.map((item) => (item.id === page.id ? {
      ...item,
      imageUrl: result.url,
      status: 'done',
      error: '',
    } : item));
    setPages(finalPages);
    await saveBook({ pages: finalPages, step: 3 });
  };

  const enterMaking = async (mode) => {
    if (!(await saveBook({ step: 3 }))) return;
    setStep(3);
    if (mode === 'all') await generateAllImages();
  };

  return (
    <main className={`picture-book-studio-v2${view === 'list' ? ' pbv2-library' : ' wb-authoring'}`}>
      {view === 'list' ? (
        <PictureBookListView
          books={bookList}
          cases={bookCases}
          activeTab={libraryTab}
          onTabChange={(tab) => { setLibraryTab(tab); setListNotice(''); }}
          loading={listLoading}
          error={listError}
          notice={listNotice}
          onRetry={fetchBookList}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onCreate={createNewBook}
          onOpen={openBook}
          onUseCase={useBookCase}
          onDelete={deleteBook}
          onPresent={presentBook}
        />
      ) : (
        <>
          <div className="wb-authoring-heading">
            <button type="button" className="wb-button quiet" onClick={backToList} disabled={saving}>
              <ArrowLeft size={16} aria-hidden="true" />{t('pictureBook.backToList')}
            </button>
            <header className="wb-authoring-header">
              <h1 className="wb-authoring-title">{activityPlan.storyTitleEn || t('pictureBook.newBook')}</h1>
              <div className="wb-authoring-actions">
                <button type="button" className="wb-button" onClick={() => saveBook()} disabled={saving}>
                  {saving ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
                  {saving ? t('pictureBook.saving') : t('pictureBook.saveProgress')}
                </button>
              </div>
              <div className="wb-authoring-status" role="status" aria-live="polite">
                <span className={`wb-status${saveState === t('pictureBook.saveFailed') ? ' is-error' : ''}`}>{saving ? t('pictureBook.saving') : saveState || t('pictureBook.draft')}</span>
              </div>
            </header>
          </div>

        <AuthoringSteps
          label={t('pictureBook.studioTitle')}
          steps={steps}
          current={step}
          onChange={goToStep}
          disabled={saving || generating || generatingAll}
        />

        <section className="wb-authoring-body" aria-label={steps[step]} aria-busy={generating || generatingAll}>
          {message && <div className={`wb-notice${generating || generatingAll ? '' : ' warning'}`} role="status" aria-live="polite">{generating || generatingAll ? <Loader2 className="spin" size={16} aria-hidden="true" /> : null}{message}</div>}

          {step === 0 && (
            <BasicInfoStep
              basicInfo={basicInfo}
              setBasicField={setBasicField}
            />
          )}

          {step === 1 && (
            <ActivityPlanStep
              activityPlan={activityPlan}
              setPlanField={setPlanField}
            />
          )}

          {step === 2 && (
            <PictureBookDesignStep
              pages={pages}
              updatePage={updatePage}
              addPage={addPage}
              removePage={removePage}
            />
          )}

          {step === 3 && (
            <PictureBookMakingStep
              pages={pages}
              updatePage={updatePage}
              onGenerateOne={generateOneImage}
              onUpload={uploadPageImage}
              backgroundMusic={backgroundMusic}
              onChooseMusic={() => setShowMusicPicker(true)}
              onRemoveMusic={async () => { setBackgroundMusic(null); await saveBackgroundMusic(null); }}
            />
          )}
        </section>
        <footer className="wb-authoring-footer">
          <div className="wb-footer-meta">{steps[step]}</div>
          <div className="wb-footer-actions">
            {step > 0 && <button type="button" className="wb-button quiet" disabled={saving || generating || generatingAll} onClick={() => goToStep(step - 1)}><ArrowLeft size={16} aria-hidden="true" />{t(['pictureBook.backToBasic', 'pictureBook.backToPlan', 'pictureBook.backToDesign'][step - 1])}</button>}
            {step === 0 && <button type="button" className="wb-button primary" disabled={!canBuildPlan || generating || saving} onClick={buildPlan}>{generating ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}{generating ? t('pictureBook.generating') : t('pictureBook.generatePlan')}</button>}
            {step === 1 && <button type="button" className="wb-button primary" disabled={generating || saving} onClick={buildDesign}>{generating ? <Loader2 className="spin" size={16} /> : <BookOpenText size={16} />}{generating ? t('pictureBook.generating') : t('pictureBook.generateDesign')}</button>}
            {step === 2 && <button type="button" className="wb-button primary" disabled={generatingAll || saving} onClick={() => enterMaking('all')}>{generatingAll ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}{generatingAll ? t('pictureBook.generating') : t('pictureBook.generateBook')}</button>}
            {step === 3 && <><button type="button" className="wb-button" disabled={generatingAll || saving} onClick={generateAllImages}>{generatingAll ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}{generatingAll ? t('pictureBook.generating') : t('pictureBook.regenerateAll')}</button><button type="button" className="wb-button primary" disabled={pages.length === 0} onClick={() => { if (!openTeachingWindow({ pages, title: activityPlan.storyTitleEn || t('pictureBook.untitled'), backgroundMusic })) setMessage(t('pictureBook.presentEmpty')); }}><Monitor size={16} />{t('common.teachMode')}</button></>}
          </div>
        </footer>
        </>
      )}

      {showMusicPicker && (
        <dialog ref={musicDialogRef} className="wb-dialog pbv2-music-modal" aria-labelledby="pbv2-music-title" onCancel={(event) => { event.preventDefault(); closeMusicPicker(); }} onClick={handleMusicBackdropClick}>
          <div className="pbv2-music-content">
            <div className="wb-dialog-heading pbv2-music-head"><div><h2 id="pbv2-music-title">{t('pictureBook.musicPickerTitle')}</h2><p>{t('pictureBook.musicPickerHint')}</p></div><button type="button" className="wb-button quiet" aria-label={t('common.close')} onClick={closeMusicPicker}><X size={18} /></button></div>
            <audio ref={musicPreviewRef} onEnded={() => setPreviewMusicId(null)} />
            <ContentTabs
              group="pbv2-music" className="pbv2-music-tabs" label={t('pictureBook.musicPickerTitle')} value={musicSourceTab} onChange={setMusicSourceTab}
              items={[
                { value: 'audio', label: t('pictureBook.tabAudioLibrary') },
                { value: 'song', label: t('pictureBook.tabSongLibrary') },
                { value: 'ai', label: t('pictureBook.tabAiGenerate'), icon: Wand2 },
              ]}
            />
            {musicSourceTab === 'audio' && <ContentTabPanel group="pbv2-music" value="audio" className="pbv2-music-list">{audioLibrary.map((music) => <MusicPickerItem key={music.id} music={music} backgroundMusic={backgroundMusic} previewMusicId={previewMusicId} previewRef={musicPreviewRef} setPreviewMusicId={setPreviewMusicId} onSelect={async () => { setBackgroundMusic(music); closeMusicPicker(); await saveBackgroundMusic(music); }} />)}{audioLibrary.length === 0 && <div className="pbv2-music-empty">{t('pictureBook.audioEmptyMusic')}</div>}</ContentTabPanel>}
            {musicSourceTab === 'song' && <ContentTabPanel group="pbv2-music" value="song" className="pbv2-music-list">{songLibrary.flatMap((song) => [{ ...song, id: `song-${song.id}-instrumental`, name: `${song.name}${t('pictureBook.nameInstrumental')}`, url: song.instrumentalUrl, source: 'song' }, { ...song, id: `song-${song.id}-vocal`, name: `${song.name}${t('pictureBook.nameVocal')}`, url: song.vocalUrl, source: 'song' }]).filter((music) => music.url).map((music) => <MusicPickerItem key={music.id} music={music} backgroundMusic={backgroundMusic} previewMusicId={previewMusicId} previewRef={musicPreviewRef} setPreviewMusicId={setPreviewMusicId} onSelect={async () => { setBackgroundMusic(music); closeMusicPicker(); await saveBackgroundMusic(music); }} />)}{songLibrary.every((song) => !song.instrumentalUrl && !song.vocalUrl) && <div className="pbv2-music-empty">{t('pictureBook.songEmptyMusic')}</div>}</ContentTabPanel>}
            {musicSourceTab === 'ai' && <ContentTabPanel group="pbv2-music" value="ai" className="pbv2-ai-music" aria-busy={aiMusicGenerating}><label><span>{t('pictureBook.aiDescLabel')}</span><textarea value={aiMusicForm.prompt} onChange={(event) => setAiMusicForm((current) => ({ ...current, prompt: event.target.value }))} placeholder={t('pictureBook.aiDescPlaceholder')} /></label><div className="pbv2-ai-music-row"><label><span>{t('pictureBook.aiStyleLabel')}</span><select value={aiMusicForm.style} onChange={(event) => setAiMusicForm((current) => ({ ...current, style: event.target.value }))}><option value="calm, peaceful, warm, instrumental">{t('pictureBook.styleCalm')}</option><option value="happy, cheerful, playful, instrumental">{t('pictureBook.stylePlayful')}</option><option value="dreamy, magical, gentle, instrumental">{t('pictureBook.styleDreamy')}</option><option value="nature, peaceful, acoustic, instrumental">{t('pictureBook.styleNature')}</option></select></label><label><span>{t('pictureBook.aiDurationLabel')}</span><select value={aiMusicForm.duration} onChange={(event) => setAiMusicForm((current) => ({ ...current, duration: Number(event.target.value) }))}>{[15, 30, 60, 90].map((duration) => <option key={duration} value={duration}>{t('pictureBook.durationSeconds', { n: duration })}</option>)}</select></label></div><button type="button" className="wb-button primary" disabled={!aiMusicForm.prompt.trim() || aiMusicGenerating} onClick={generateAiMusic}>{aiMusicGenerating ? <Loader2 className="spin" size={15} /> : <Wand2 size={15} />}{aiMusicGenerating ? t('pictureBook.aiGeneratingLong') : t('pictureBook.aiGenerateMusic')}</button>{aiMusicError && <p className="wb-notice error" role="alert">{aiMusicError}</p>}{aiMusicResult && <MusicPickerItem music={aiMusicResult} backgroundMusic={backgroundMusic} previewMusicId={previewMusicId} previewRef={musicPreviewRef} setPreviewMusicId={setPreviewMusicId} selectLabel={t('pictureBook.useThisMusic')} onSelect={async () => { setBackgroundMusic(aiMusicResult); closeMusicPicker(); await saveBackgroundMusic(aiMusicResult); }} />}</ContentTabPanel>}
          </div>
        </dialog>
      )}
    </main>
  );
}

function PictureBookListView({ books, cases, activeTab, onTabChange, loading, error, notice, onRetry, searchTerm, setSearchTerm, onCreate, onOpen, onUseCase, onDelete, onPresent }) {
  const { t } = useTranslation();
  const searchInput = React.useRef(null);
  const searchLabel = t('common.searchActivity');
  const isCases = activeTab === 'cases';
  const query = searchTerm.trim().toLowerCase();
  const source = isCases ? cases : books;
  const hasActiveSearch = Boolean(query && source.length);
  const visibleBooks = source.filter((book) => {
    const plan = book.book_data?.activityPlan;
    return [book.title || t('pictureBook.untitled'), plan?.storyTitleZh, plan?.storyTitleEn]
      .some((value) => String(value || '').toLowerCase().includes(query));
  });
  const clearSearch = () => {
    setSearchTerm('');
    searchInput.current?.focus();
  };
  return (
    <div className="pbv2-list-page">
      <header className="pbv2-library-header wb-library-header">
        <h1>{t('sidebar.artExpression')}</h1>
        <div className="pbv2-library-actions">
          <CreateButton onClick={onCreate}>{t('common.newActivity')}</CreateButton>
        </div>
      </header>

      <div className="wb-library-tools">
        <ContentTabs
          group="pbv2-library" label={t('pictureBook.librarySource')} value={activeTab} onChange={onTabChange}
          items={[
            { value: 'cases', label: t('pictureBook.caseLibrary'), count: loading || error ? '—' : cases.length },
            { value: 'mine', label: t('pictureBook.myActivities'), count: loading || error ? '—' : books.length },
          ]}
        />
        <LibrarySearch label={searchLabel} value={searchTerm} onChange={setSearchTerm} inputRef={searchInput} aria-controls="pbv2-library-panel" />
      </div>

      <ContentTabPanel group="pbv2-library" value={activeTab} aria-busy={loading}>
        {notice && <p className="pbv2-library-notice" role="alert">{notice}</p>}
        {loading ? (
          <PageLoading />
        ) : error ? (
          <div className="wb-library-empty" role="alert"><p>{t('pictureBook.listLoadFailed')}</p><button type="button" data-wb-button="secondary" onClick={onRetry}>{t('common.retry')}</button></div>
        ) : visibleBooks.length === 0 ? (
          <div className="wb-library-empty">
            <p role="status">{t(hasActiveSearch ? 'pictureBook.noSearchResults' : isCases ? 'pictureBook.noCases' : 'pictureBook.noMyActivities')}</p>
            {hasActiveSearch && <button type="button" data-wb-button="secondary" onClick={clearSearch}>{t('pictureBook.clearSearch')}</button>}
          </div>
        ) : (
          <div className={isCases ? 'wb-case-grid' : 'pbv2-card-grid'}>
            {visibleBooks.map((book) => {
              const data = book.book_data || {};
              const title = book.title || t('pictureBook.untitled');
              const playable = hasTeachingPages(data.pages);
              const previewProps = { disabled: !playable, title: playable ? undefined : t('pictureBook.presentEmpty') };
              const openCard = () => isCases ? onPresent(book) : onOpen(book);
              return (
                <article key={book.id} className={isCases ? 'pbv2-book-card wb-case-card' : 'pbv2-book-card'}>
                  <button type="button" className={isCases ? 'pbv2-book-cover wb-case-cover' : 'pbv2-book-cover'} {...(isCases ? previewProps : {})} onClick={openCard} aria-label={`${t(isCases ? 'pictureBook.previewCase' : 'common.edit')} ${title}`}>
                    {book.cover_url ? <img src={book.cover_url} alt="" loading="lazy" onError={(event) => { event.currentTarget.hidden = true; }} /> : null}
                    <span className="pbv2-book-cover-placeholder" aria-hidden="true"><BookOpenText size={40} /></span>
                  </button>
                  <div className={isCases ? 'pbv2-book-info wb-case-body' : 'pbv2-book-info'}>
                    {!isCases && <div className="pbv2-book-state">
                      <MetadataTag tone={book.status === 'published' ? 'ready' : 'draft'}>{t(book.status === 'published' ? 'pictureBook.published' : 'pictureBook.draft')}</MetadataTag>
                      {book.updated_at && <time dateTime={book.updated_at}>{new Date(book.updated_at).toLocaleDateString()}</time>}
                    </div>}
                    <h3 className={isCases ? 'wb-case-title' : undefined}><button type="button" {...(isCases ? previewProps : {})} onClick={openCard}>{title}</button></h3>
                    <div className="pbv2-book-meta">
                      {data.basicInfo?.age && <MetadataTag>{data.basicInfo.age}</MetadataTag>}
                      <MetadataTag>{t('pictureBook.pageTotal', { count: data.pages?.length || 0 })}</MetadataTag>
                    </div>
                    <div className={isCases ? 'wb-case-actions' : 'pbv2-book-actions'}>
                      {isCases ? <>
                        <button type="button" data-wb-button="primary" {...previewProps} onClick={() => onPresent(book)}>{t('pictureBook.previewCase')}</button>
                        <button type="button" data-wb-button="secondary" onClick={() => onUseCase(book)}>{t('pictureBook.useCase')}</button>
                      </> : <>
                        <button type="button" data-wb-button="primary" {...previewProps} onClick={() => onPresent(book)}><Monitor size={16} aria-hidden="true" />{t('pictureBook.startTeaching')}</button>
                        <button type="button" data-wb-button="secondary" onClick={() => onOpen(book)}>{t('pictureBook.continuePreparing')}</button>
                        <button type="button" data-wb-button="danger" data-wb-icon="" onClick={() => onDelete(book.id)} aria-label={`${t('common.delete')} ${title}`} title={t('common.delete')}><Trash2 size={16} aria-hidden="true" /></button>
                      </>}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </ContentTabPanel>
    </div>
  );
}

function BasicInfoStep({ basicInfo, setBasicField }) {
  const { t } = useTranslation();
  const localizedAgeOptions = t('pictureBook.ageOptions', { returnObjects: true });
  const localizedLevelOptions = t('pictureBook.levelOptions', { returnObjects: true });
  const localizedParticipantOptions = t('pictureBook.participantOptions', { returnObjects: true });
  const localizedThemeOptions = t('pictureBook.themeOptions', { returnObjects: true });
  const localizedMaterialOptions = t('pictureBook.materialOptions', { returnObjects: true });
  return (
    <div className="pbv2-step-panel">
      <section className="wb-authoring-panel wb-form-stack">
        <OptionGroup label={t('pictureBook.studentAge')} options={localizedAgeOptions} value={basicInfo.age} onChange={(value) => setBasicField('age', value)} />
        <OptionGroup label={t('pictureBook.englishLevel')} options={localizedLevelOptions} value={basicInfo.level} onChange={(value) => setBasicField('level', value)} />
        <OptionGroup label={t('pictureBook.participants')} options={localizedParticipantOptions} value={basicInfo.participants} onChange={(value) => setBasicField('participants', value)} />
      </section>

      <CheckboxGroup
        label={t('pictureBook.themePreference')}
        options={localizedThemeOptions}
        value={basicInfo.themes}
        otherValue={basicInfo.themeOther}
        onToggle={(value) => setBasicField('themes', toggleList(basicInfo.themes, value))}
        onOther={(value) => setBasicField('themeOther', value)}
      />

      <CheckboxGroup
        label={t('pictureBook.availableMaterials')}
        options={localizedMaterialOptions}
        value={basicInfo.materials}
        otherValue={basicInfo.materialOther}
        onToggle={(value) => setBasicField('materials', toggleList(basicInfo.materials, value))}
        onOther={(value) => setBasicField('materialOther', value)}
      />

      <section className="wb-authoring-panel">
        <div className="wb-panel-heading"><h2>{t('pictureBook.languageGoalsOptional')}</h2></div>
        <div className="wb-form-grid">
          <Field label={t('pictureBook.coreVocabulary')} value={basicInfo.vocabulary} onChange={(value) => setBasicField('vocabulary', value)} placeholder={t('pictureBook.vocabularyPlaceholder')} />
          <Field label={t('pictureBook.coreGrammar')} value={basicInfo.grammar} onChange={(value) => setBasicField('grammar', value)} placeholder={t('pictureBook.grammarPlaceholder')} />
        </div>
      </section>

    </div>
  );
}

function ActivityPlanStep({ activityPlan, setPlanField }) {
  const { t } = useTranslation();
  return (
    <div className="pbv2-step-panel">
      <section className="wb-authoring-panel wb-form-stack">
        <div className="wb-form-grid">
          <Field label={t('pictureBook.englishStoryTitle')} value={activityPlan.storyTitleEn} onChange={(value) => setPlanField('storyTitleEn', value)} />
          <Field label={t('pictureBook.recommendedPageCount')} value={activityPlan.recommendedPageCount} onChange={(value) => setPlanField('recommendedPageCount', value)} placeholder={t('pictureBook.pageCountPlaceholder')} />
        </div>
        <Field area label={t('pictureBook.storyContent')} value={activityPlan.storyContent} onChange={(value) => setPlanField('storyContent', value)} />
      </section>
      <section className="wb-authoring-panel">
        <div className="wb-panel-heading"><h2>{t('pictureBook.activityGoals')}</h2></div>
        <div className="wb-form-grid pbv2-goals-grid">
          <Field area label={t('pictureBook.englishGoal')} value={activityPlan.englishGoal} onChange={(value) => setPlanField('englishGoal', value)} />
          <Field area label={t('pictureBook.wellbeingGoal')} value={activityPlan.wellbeingGoal} onChange={(value) => setPlanField('wellbeingGoal', value)} />
          <Field area label={t('pictureBook.outputGoal')} value={activityPlan.outputGoal} onChange={(value) => setPlanField('outputGoal', value)} />
        </div>
      </section>
      <section className="wb-authoring-panel">
        <Field area label={t('pictureBook.materials')} value={activityPlan.materials} onChange={(value) => setPlanField('materials', value)} />
      </section>
    </div>
  );
}

function PictureBookDesignStep({ pages, updatePage, addPage, removePage }) {
  const { t } = useTranslation();
  return (
    <div className="pbv2-step-panel">
      <div className="pbv2-page-list">
        {pages.map((page) => (
          <PageDesignCard key={page.id} page={page} updatePage={updatePage} removePage={removePage} />
        ))}
      </div>
      <button type="button" className="wb-button pbv2-add-page" onClick={addPage}>
        <Plus size={16} />
        {t('pictureBook.addPage')}
      </button>
    </div>
  );
}

function PictureBookMakingStep({ pages, updatePage, onGenerateOne, onUpload, backgroundMusic, onChooseMusic, onRemoveMusic }) {
  const { t } = useTranslation();
  return (
    <div className="pbv2-step-panel">
      <section className="wb-authoring-panel pbv2-making-toolbar">
        <div className="wb-panel-heading"><h2>{t('pictureBook.musicPickerTitle')}</h2><p>{t('pictureBook.musicPickerHint')}</p></div>
        <div className={`pbv2-background-music${backgroundMusic ? ' selected' : ''}`}>
          <Music2 size={17} />
          <span title={backgroundMusic?.name}>{backgroundMusic?.name || t('pictureBook.noMusicSelected')}</span>
          <button type="button" className="wb-button" onClick={onChooseMusic}>{backgroundMusic ? t('pictureBook.changeMusic') : t('pictureBook.chooseMusic')}</button>
          {backgroundMusic && <button type="button" className="wb-button quiet" onClick={onRemoveMusic} aria-label={t('pictureBook.removeMusic')}><X size={16} /></button>}
        </div>
      </section>
      <div className="pbv2-production-grid">
        {pages.map((page) => (
          <ProductionCard
            key={page.id}
            page={page}
            updatePage={updatePage}
            onGenerateOne={onGenerateOne}
            onUpload={onUpload}
          />
        ))}
      </div>
    </div>
  );
}

function PageDesignCard({ page, updatePage, removePage }) {
  const { t } = useTranslation();
  return (
    <article className="wb-authoring-panel pbv2-page-card">
      <div className="pbv2-page-card-head">
        <h2>{t('pictureBook.pageNumber', { page: page.page })}</h2>
        <button type="button" className="wb-button danger" onClick={() => removePage(page.id)} aria-label={`${t('common.delete')} ${t('pictureBook.pageNumber', { page: page.page })}`}><Trash2 size={16} /></button>
      </div>
      <div className="wb-form-grid">
      <Field area label={t('pictureBook.imageDescription')} value={page.imageDescription} onChange={(value) => updatePage(page.id, { imageDescription: value })} />
      <Field area label={t('pictureBook.pageText')} value={page.text} onChange={(value) => updatePage(page.id, { text: value })} />
      </div>
    </article>
  );
}

function ProductionCard({ page, updatePage, onGenerateOne, onUpload }) {
  const { t } = useTranslation();
  return (
    <article className="wb-authoring-panel pbv2-production-card" aria-busy={page.status === 'generating'}>
      <div className="pbv2-preview">
        {page.status === 'generating' ? (
          <div className="pbv2-generating" role="status"><Loader2 className="spin" size={24} />{t('pictureBook.generating')}</div>
        ) : page.imageUrl ? (
          <img src={page.imageUrl} alt={t('pictureBook.pageNumber', { page: page.page })} />
        ) : (
          <div className="pbv2-placeholder"><Image size={24} />{t('pictureBook.imagePlaceholder')}</div>
        )}
      </div>
      <div className="pbv2-production-body">
        <h2>{t('pictureBook.pageNumber', { page: page.page })}</h2>
        <Field area label={t('pictureBook.imageDescription')} value={page.imageDescription} onChange={(value) => updatePage(page.id, { imageDescription: value })} />
        <Field label={t('pictureBook.pageText')} value={page.text} onChange={(value) => updatePage(page.id, { text: value })} />
        {page.error && <p className="wb-notice error" role="alert">{page.error}</p>}
        <div className="pbv2-card-actions">
          <button type="button" className="wb-button" onClick={() => onGenerateOne(page)} disabled={page.status === 'generating'}>
            {page.status === 'generating' ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}
            {t('pictureBook.generateOrAdjust')}
          </button>
          <label className="wb-button">
            <Upload size={14} />
            {t('pictureBook.manualUpload')}
            <input type="file" accept="image/*" aria-label={`${t('pictureBook.manualUpload')} ${t('pictureBook.pageNumber', { page: page.page })}`} disabled={page.status === 'generating'} onChange={(event) => onUpload(page, event.target.files?.[0])} />
          </label>
        </div>
      </div>
    </article>
  );
}

function OptionGroup({ label, options, value, onChange }) {
  return (
    <fieldset className="pbv2-option-field">
      <legend>{label}</legend>
      <div className="pbv2-option-grid">
        {options.map((option) => (
          <FilterChip key={option} selected={value === option} onClick={() => onChange(value === option ? '' : option)}>
            {option}
          </FilterChip>
        ))}
      </div>
    </fieldset>
  );
}

function CheckboxGroup({ label, options, value, otherValue, onToggle, onOther }) {
  const { t } = useTranslation();
  return (
    <section className="wb-authoring-panel">
      <div className="wb-panel-heading"><h2>{label}</h2></div>
      <div className="pbv2-chip-grid">
        {options.map((option) => (
          <FilterChip key={option} selected={value.includes(option)} onClick={() => onToggle(option)}>
            {value.includes(option) && <Check size={14} aria-hidden="true" />}{option}
          </FilterChip>
        ))}
      </div>
      <label className="wb-field pbv2-other-field"><span>{t('pictureBook.otherPlaceholder')}</span><input value={otherValue} onChange={(event) => onOther(event.target.value)} /></label>
    </section>
  );
}

function Field({ label, value, onChange, placeholder, area }) {
  return (
    <label className="wb-field">
      <span>{label}</span>
      {area ? (
        <textarea value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      ) : (
        <input value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      )}
    </label>
  );
}

function MusicPickerItem({ music, backgroundMusic, previewMusicId, previewRef, setPreviewMusicId, onSelect, selectLabel = '' }) {
  const { t } = useTranslation();
  const isPreviewing = previewMusicId === music.id;
  return <div className={`pbv2-music-item${backgroundMusic?.id === music.id ? ' selected' : ''}`}><div><strong>{music.name}</strong><span>{music.description || t('pictureBook.bgmFallback')}</span></div><button type="button" className="wb-button" aria-pressed={isPreviewing} aria-label={`${t('pictureBook.preview')} ${music.name}`} onClick={() => { const audio = previewRef.current; if (!audio) return; if (isPreviewing && !audio.paused) { audio.pause(); setPreviewMusicId(null); } else { audio.src = music.url; audio.play().then(() => setPreviewMusicId(music.id)).catch(() => setPreviewMusicId(null)); } }}>{isPreviewing ? <Pause size={15} /> : <Play size={15} />}{t('pictureBook.preview')}</button><button type="button" className="wb-button primary" onClick={() => { previewRef.current?.pause(); setPreviewMusicId(null); onSelect(); }}>{selectLabel || t('pictureBook.select')}</button></div>;
}
