import React from 'react';
import {
  ArrowLeft,
  BookOpenText,
  ChevronRight,
  Clock,
  Image,
  LayoutTemplate,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import './PictureBookStudioPage.css';

const initialBasicInfo = {
  age: '',
  level: '',
  participants: '',
  duration: '',
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

function toggleList(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function getSelectedTheme(info, isEn = false) {
  return info.themes[0] || info.themeOther || (isEn ? 'Emotional Expression' : '情绪表达');
}

function getMaterialsText(info, isEn = false) {
  const items = [...info.materials, String(info.materialOther || '').trim()].filter(Boolean);
  return items.join(isEn ? ', ' : '、') || (isEn ? 'Drawing paper, colored pencils/crayons' : '画纸、彩笔/蜡笔');
}

function recommendFallbackPageCount(info) {
  const vocabularyCount = String(info.vocabulary || '').split(/[,，、\s]+/).filter(Boolean).length;
  const materialCount = info.materials.length + (info.materialOther ? 1 : 0);
  const duration = Number.parseInt(String(info.duration || ''), 10) || 15;
  let count = 6;
  if (vocabularyCount > 4) count += 1;
  if (vocabularyCount > 8) count += 1;
  if (materialCount > 2) count += 1;
  if (duration >= 30) count += 1;
  if (duration >= 45) count += 1;
  return Math.min(12, Math.max(6, count));
}

function buildActivityPlan(info, isEn = false) {
  const theme = getSelectedTheme(info, isEn);
  const isNatureTheme = theme === '自然探索' || theme === 'Nature Exploration';
  const vocab = info.vocabulary || (isNatureTheme ? 'leaf, stone, tree, bug, river' : 'happy, sad, calm, brave, friend');
  const grammar = info.grammar || (isNatureTheme ? 'I can see... / It is...' : 'My friend is/feels... / My friend has...');
  const materialText = getMaterialsText(info, isEn);
  const titleMap = {
    情绪表达: 'My Feeling Friend',
    自然探索: 'A Tiny Nature Finder',
    自我认知: 'The Me I Can See',
    人际关系: 'A Bridge Between Friends',
    家庭与归属: 'My Warm Little Home',
    成长与变化: 'I Grow a Little More',
    感恩与善意: 'A Kindness Spark',
    身体与感知: 'My Body Says Hello',
    动物与生命: 'Hello, Little Life',
    勇气与冒险: 'A Brave Little Step',
    'Emotional Expression': 'My Feeling Friend',
    'Nature Exploration': 'A Tiny Nature Finder',
    'Self-awareness': 'The Me I Can See',
    Relationships: 'A Bridge Between Friends',
    'Family and Belonging': 'My Warm Little Home',
    'Growth and Change': 'I Grow a Little More',
    'Gratitude and Kindness': 'A Kindness Spark',
    'Body and Senses': 'My Body Says Hello',
    'Animals and Life': 'Hello, Little Life',
    'Courage and Adventure': 'A Brave Little Step',
  };
  const storyTitleEn = titleMap[theme] || 'My Creative Journey';

  return {
    storyTitleEn,
    storyTitleZh: '',
    storyContent: isEn
      ? `An action-led creative journey about ${theme}. Each page invites children to notice, choose, make, and share. Art externalizes inner experience, every choice is accepted, and English appears naturally when children need it to express themselves.`
      : `围绕“${theme}”展开的行动型创作旅程。每一页引导孩子观察、选择、动手和分享，以艺术外化内在体验，接纳每一种表达，并在真实表达需求中自然使用英文。`,
    englishGoal: isEn
      ? `Use the core vocabulary: ${vocab}; use the sentence patterns/grammar: ${grammar}; understand and answer simple questions about the work.`
      : `使用核心词汇：${vocab}；使用核心句型/语法：${grammar}；能听懂并回应与作品相关的简单提问。`,
    wellbeingGoal: isEn
      ? 'Turn inner feelings into visible images and experience understanding, acceptance, and connection through expression and collaboration.'
      : '将内在感受外化为可被看见的形象；在表达和协作中体验被理解、被接纳和共同创造的联结感。',
    outputGoal: isEn
      ? (isNatureTheme ? 'A personal nature discovery artwork and reflection' : 'A personal expressive artwork and a short English sharing moment')
      : (isNatureTheme ? '一份个人自然发现作品与感受表达' : '一份个人表达作品和一次简短的英文分享'),
    materials: isEn && !info.materials.length && !info.materialOther ? 'Drawing paper, colored pencils/crayons' : materialText,
    recommendedPageCount: recommendFallbackPageCount(info),
  };
}

function buildPictureBookPages(plan, info, requestedPageCount, isEn = false) {
  const title = plan.storyTitleEn || 'My Picture Book';
  const vocab = info.vocabulary || 'happy, sad, calm, brave, friend';
  const wordAnchors = vocab.split(/[,，、\s]+/).filter(Boolean).slice(0, 6).join(', ');
  const theme = getSelectedTheme(info, true);
  const landingPoints = {
    情绪表达: 'All feelings belong. Every one of them.',
    'Emotional Expression': 'All feelings belong. Every one of them.',
    自然探索: 'You are part of nature, and nature is you.',
    'Nature Exploration': 'You are part of nature, and nature is you.',
    自我认知: 'There is no one else like you.',
    'Self-awareness': 'There is no one else like you.',
    人际关系: 'Being yourself helps us grow closer.',
    Relationships: 'Being yourself helps us grow closer.',
    家庭与归属: 'You belong here, exactly as you are.',
    'Family and Belonging': 'You belong here, exactly as you are.',
    成长与变化: 'You can change and still be you.',
    'Growth and Change': 'You can change and still be you.',
    感恩与善意: 'Your kindness can make the world feel warmer.',
    'Gratitude and Kindness': 'Your kindness can make the world feel warmer.',
    身体与感知: 'Your body speaks. You can listen gently.',
    'Body and Senses': 'Your body speaks. You can listen gently.',
    动物与生命: 'Every living thing belongs in our shared world.',
    'Animals and Life': 'Every living thing belongs in our shared world.',
    勇气与冒险: 'Brave can be one small step.',
    'Courage and Adventure': 'Brave can be one small step.',
  };
  const landingPoint = landingPoints[theme] || 'Every part of you belongs.';
  const pages = [
    {
      pageType: 'cover',
      imageDescription: isEn
        ? `Guided picture-book cover, not a narrative scene. Show an inviting art table, simple tools, colorful child-made creations, and a small friendly guide welcoming the child to participate. Render only the English title “${title}”.`
        : `引导绘本封面，不是叙事场景。展示有吸引力的创作桌、简单工具、色彩丰富的儿童作品，以及欢迎孩子参与的小导游。画面只呈现英文标题“${title}”。`,
      text: title,
    },
    {
      pageType: 'question',
      imageDescription: isEn ? 'Open question page. Show a gentle color cloud and a large clear response area where the child can point or imagine. No story action and no correct answer.' : '开放式提问页。展示柔和的颜色云和一块清晰宽敞的回应区域，让孩子可以指认或想象。不设置故事情节和标准答案。',
      text: 'What color feels like you today?',
    },
    {
      pageType: 'choice',
      imageDescription: isEn ? `Choice page. Show six clear illustrated option cards with picture-and-word anchors using these English target words: ${wordAnchors}. Leave generous space for pointing and choosing.` : `选择页。展示六张清晰的图文选项卡，使用这些英文目标词汇作为“图案+单词”锚点：${wordAnchors}。留出充足空间供孩子指认和选择。`,
      text: 'Point to the word that fits.',
    },
    {
      pageType: 'question',
      imageDescription: isEn ? 'Body-awareness question page. Show a simple child-friendly body outline with softly highlighted areas and an open response space. Invite noticing without judgment.' : '身体觉察提问页。展示适合儿童理解的简洁身体轮廓、柔和高亮的身体区域和开放回应空间，引导孩子不带评判地觉察。',
      text: 'Where do you feel it?',
    },
    {
      pageType: 'instruction',
      imageDescription: isEn ? `Preparation instruction page. Clearly show ${plan.materials || 'paper and colored pencils'} as simple tool icons beside a large blank workspace waiting for the child's creation.` : `准备指令页。用简洁工具图标清楚展示${plan.materials || '画纸和彩笔'}，旁边保留一块等待孩子创作的大面积空白区域。`,
      text: 'Take your paper and colors.',
    },
    {
      pageType: 'choice',
      imageDescription: isEn ? 'Inspiration choice page. Show six non-perfect child-made shape cards: round, spiky, wavy, tiny, wide, and twisty. Each shape has its exact English word label.' : '灵感选择页。展示六张带有儿童手作感、不追求完美的形状卡片：round、spiky、wavy、tiny、wide、twisty。每种形状配对应的英文单词标签。',
      text: 'Choose a shape that feels right.',
    },
    {
      pageType: 'instruction',
      imageDescription: isEn ? 'Drawing instruction page. Show a pencil beginning one expressive shape and a large mostly blank area for the child. Emphasize that big and small are equally welcome.' : '绘画指令页。展示一支铅笔正在画出富有表现力的形状，并为孩子保留大面积空白创作区。传达画大或画小都可以被接纳。',
      text: 'Draw it big or small.',
    },
    {
      pageType: 'rule',
      imageDescription: isEn ? 'Game rule page. Show a large six-sided die and a visual equation: die dots equal the number of parts to add. Use icons and minimal English labels, not a narrative scene.' : '游戏规则页。展示一个醒目的六面骰子和视觉等式：骰子点数等于需要添加的身体部位数量。使用图标和极少量英文标签，不画叙事场景。',
      text: 'Roll. Count. Add that many parts.',
    },
    {
      pageType: 'instruction',
      imageDescription: isEn ? 'Action page with clear illustrated choices for eyes, ears, hands, feet, mouths, and antennae. Each option has a simple English word anchor.' : '行动指令页。清晰展示眼睛、耳朵、手、脚、嘴巴和触角等图示选项，每个选项配一个简单的英文单词锚点。',
      text: 'Add eyes, ears, hands, or feet.',
    },
    {
      pageType: 'instruction',
      imageDescription: isEn ? 'Creative invitation page showing optional wings, spots, stars, pockets, and soft spikes as idea cards, plus open space for the child’s own idea. Avoid polished model answers.' : '创意邀请页。用灵感卡展示可选的翅膀、斑点、星星、口袋和柔软尖角，并为孩子自己的想法保留开放空间。避免提供精致的标准答案。',
      text: 'Add one special power.',
    },
    {
      pageType: 'instruction',
      imageDescription: isEn ? 'Coloring action page. Show two or three selected color swatches, a child’s hand coloring an expressive shape, and a spacious unfinished area. Every color choice is accepted.' : '上色行动页。展示两到三种已选色块、孩子正在为富有表现力的形状上色的手，以及宽敞的未完成区域。接纳每一种颜色选择。',
      text: 'Pick two colors. Fill your shape.',
    },
    {
      pageType: 'instruction',
      imageDescription: isEn ? 'Naming page. Show the finished creation beside one simple blank name tag and a pencil. The small guide waits quietly without suggesting an answer.' : '命名指令页。展示完成的作品、一个简洁的空白姓名牌和一支铅笔。小导游安静等待，不暗示任何答案。',
      text: 'Give your creation a name.',
    },
    {
      pageType: 'question',
      imageDescription: isEn ? `Sharing prompt page. Show a child holding their creation with two short English sentence anchors: “I feel...” and “My friend feels...”. Include small picture-and-word anchors from: ${wordAnchors}.` : `分享提问页。展示孩子拿着自己的作品，并呈现两个简短英文句式锚点：“I feel...”和“My friend feels...”。加入这些词汇的小型“图案+单词”锚点：${wordAnchors}。`,
      text: 'Share: “I feel...”',
    },
    {
      pageType: 'back-cover',
      imageDescription: isEn ? `Back cover. A calm, spacious composition with the small guide waving goodbye. Render only this exact English landing point and no other content: “${landingPoint}”` : `封底。画面平静、留白充足，小导游挥手告别。只呈现这句准确的英文精神落脚点，不添加其他内容：“${landingPoint}”`,
      text: landingPoint,
    },
  ];
  const pageCount = Math.min(14, Math.max(6, Number(requestedPageCount) || recommendFallbackPageCount(info)));
  const selectionPriority = [0, 1, 4, 10, 12, 13, 2, 5, 11, 3, 6, 9, 8, 7];
  const selectedPages = selectionPriority.slice(0, pageCount).sort((a, b) => a - b).map((index) => pages[index]);
  return selectedPages.map((page, index) => ({
    id: `page-${Date.now()}-${index + 1}`,
    page: index + 1,
    pageType: page.pageType,
    imageDescription: page.imageDescription,
    imagePrompt: `Create a child-friendly guided picture-book ${page.pageType} page. Make the child action visually obvious with clear objects, choices, tools, and generous response space. Do not render labels, captions, annotations, speech bubbles, pseudo-text, symbols that resemble writing, or any typography beyond the separately supplied exact page text.`,
    text: page.text,
    imageUrl: '',
    status: 'placeholder',
    error: '',
  }));
}

function pickUrl(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return pickUrl(value[0]);
  return value.url
    || value.assetUrl
    || value.imageUrl
    || value.themeImageUrl
    || value.data?.url
    || value.data?.assetUrl
    || value.data?.imageUrl
    || value.asset?.url
    || '';
}

function getStatusUrl(asset) {
  return asset?.statusUrl || asset?.asset?.statusUrl || '';
}

async function resolveGeneratedAsset(asset, { maxAttempts = 200, onResolved, fallbackError = 'Image generation failed' } = {}) {
  const directUrl = pickUrl(asset);
  if (directUrl) {
    onResolved?.(directUrl);
    return directUrl;
  }
  const statusUrl = getStatusUrl(asset);
  if (!statusUrl) return '';

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, attempt < 2 ? 1200 : 3000));
    const status = await apiService.request(statusUrl);
    const url = pickUrl(status);
    if (url) {
      onResolved?.(url);
      return url;
    }
    if (['failed', 'error'].includes(String(status?.status || '').toLowerCase())) {
      throw new Error(status?.error || fallbackError);
    }
  }
  return '';
}

export function PictureBookStudioPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isEn = i18n.language?.startsWith('en');
  const [view, setView] = React.useState('list');
  const [bookList, setBookList] = React.useState([]);
  const [listLoading, setListLoading] = React.useState(false);
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

  const fetchBookList = React.useCallback(async () => {
    setListLoading(true);
    try {
      const params = { limit: 100 };
      if (user?.id) params.userId = user.id;
      const result = await apiService.request('/api/picture-books?' + new URLSearchParams(params).toString());
      setBookList(result.data || []);
    } catch (err) {
      console.error('fetch picture books failed:', err);
      setBookList([]);
    } finally {
      setListLoading(false);
    }
  }, [user?.id]);

  React.useEffect(() => {
    if (view === 'list') fetchBookList();
  }, [view, fetchBookList]);

  React.useEffect(() => {
    const handler = () => setView('list');
    window.addEventListener('wellbeing:nav-same-route', handler);
    return () => window.removeEventListener('wellbeing:nav-same-route', handler);
  }, []);

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
    setEditingBookId(book.id);
    const data = book.book_data || {};
    if (data.basicInfo) setBasicInfo(data.basicInfo);
    if (data.activityPlan) setActivityPlan(data.activityPlan);
    if (data.pages) setPages(data.pages);
    setStep(Number.isInteger(data.step) ? data.step : 0);
    setView('studio');
  };

  const createNewBook = () => {
    setEditingBookId(null);
    setBasicInfo(initialBasicInfo);
    setActivityPlan(initialActivityPlan);
    setPages([]);
    setStep(0);
    setMessage('');
    setView('studio');
  };

  const saveBook = async (extraData = {}) => {
    const bookData = {
      basicInfo: extraData.basicInfo || basicInfo,
      activityPlan: extraData.activityPlan || activityPlan,
      pages: extraData.pages || pages,
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
      if (editingBookId) {
        await apiService.request(`/api/picture-books/${editingBookId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        const result = await apiService.request('/api/picture-books', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (result.data?.id) setEditingBookId(result.data.id);
      }
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

  const backToList = async () => {
    await saveBook();
    setView('list');
  };

  const goToStep = async (nextStep) => {
    await saveBook({ step: nextStep });
    setStep(nextStep);
  };

  const steps = [
    t('pictureBook.stepBasic'),
    t('pictureBook.stepPlan'),
    t('pictureBook.stepDesign'),
    t('pictureBook.stepMaking'),
  ];

  const canBuildPlan = Boolean(basicInfo.age && basicInfo.level);

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
      const res = await fetch('/api/rag/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'activity-plan',
          basicInfo,
          language: isEn ? 'en' : 'zh',
          outputLanguage: isEn ? 'English' : 'Chinese',
        }),
      });
      const data = await res.json();
      if (data.success && data.activityPlan) {
        const nextPlan = { ...initialActivityPlan, ...data.activityPlan };
        setActivityPlan(nextPlan);
        setPages([]);
        setMessage('');
        setStep(1);
        saveBook({ activityPlan: nextPlan, pages: [], step: 1 });
      } else {
        // Fallback to local template
        const nextPlan = buildActivityPlan(basicInfo, isEn);
        setActivityPlan(nextPlan);
        setPages([]);
        setMessage(data.error || t('pictureBook.planFallback'));
        setStep(1);
        saveBook({ activityPlan: nextPlan, pages: [], step: 1 });
      }
    } catch (err) {
      // Fallback to local template
      const nextPlan = buildActivityPlan(basicInfo, isEn);
      setActivityPlan(nextPlan);
      setPages([]);
      setMessage(`${t('pictureBook.planFallback')}: ${err.message}`);
      setStep(1);
      saveBook({ activityPlan: nextPlan, pages: [], step: 1 });
    } finally {
      setGenerating(false);
    }
  };

  const buildDesign = async () => {
    setGenerating(true);
    setMessage(t('pictureBook.generatingDesign'));
    const pageCount = pages.length > 0
      ? pages.length
      : Number(activityPlan.recommendedPageCount) || undefined;
    try {
      const res = await fetch('/api/rag/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'picture-book-design',
          basicInfo,
          activityPlan,
          ...(pageCount ? { pageCount } : {}),
          language: isEn ? 'en' : 'zh',
          outputLanguage: isEn ? 'English' : 'Chinese',
        }),
      });
      const data = await res.json();
      if (data.success && data.pages && data.pages.length > 0) {
        const nextPages = data.pages.map((p, i) => ({
          id: `page-${Date.now()}-${i}`,
          page: p.page || i + 1,
          pageType: p.pageType || 'instruction',
          imageDescription: p.imageDescription || '',
          imagePrompt: p.imagePrompt || '',
          text: p.text || '',
          imageUrl: '',
          status: 'placeholder',
          error: '',
        }));
        setPages(nextPages);
        setMessage('');
        setStep(2);
        saveBook({ pages: nextPages, step: 2 });
      } else {
        // Fallback to local template
        const fallbackPages = buildPictureBookPages(activityPlan, basicInfo, pageCount, isEn);
        setPages(fallbackPages);
        setMessage(data.error || t('pictureBook.designFallback'));
        setStep(2);
        saveBook({ pages: fallbackPages, step: 2 });
      }
    } catch (err) {
      // Fallback to local template
      const fallbackPages = buildPictureBookPages(activityPlan, basicInfo, pageCount, isEn);
      setPages(fallbackPages);
      setMessage(`${t('pictureBook.designFallback')}: ${err.message}`);
      setStep(2);
      saveBook({ pages: fallbackPages, step: 2 });
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
    prompt: `${activityPlan.storyTitleEn}\n${activityPlan.storyContent}`,
    options: {
      imageRatio: '16:9',
      imageStyle: 'Watercolor Picture Book',
      negativePrompt: 'Chinese characters, Chinese text, non-English text, extra words, extra letters, captions, labels, annotations, speech bubbles, callouts, explanatory symbols, gibberish typography, pseudo-text, misspelled text, duplicated title, repeated text',
      referenceNotes: [
        'These are prompt-only visual directions for an action-led guided picture book. They must guide composition but must never be rendered as visible page text.',
        'ABSOLUTE TYPOGRAPHY RULE: each image may display only its visibleEnglishText value exactly. Never display imageDescription, imagePrompt, pageType, labels, captions, annotations, speech bubbles, Chinese characters, pseudo-text, or any other words.',
        JSON.stringify(pages.map((page) => ({
          page: page.page,
          pageType: page.pageType || 'instruction',
          imagePrompt: page.imagePrompt || page.imageDescription,
          visibleEnglishText: page.text,
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
        imagePrompt: page.imagePrompt || page.imageDescription,
        prompt: [
          `Create a guided picture-book ${page.pageType || 'instruction'} page, never a narrative story scene.`,
          page.imagePrompt || page.imageDescription,
          `Render only this exact English core text (maximum 10 words): “${page.text}”`,
          'Make the child action visually obvious using pictures only.',
          'Do not add labels, captions, annotations, speech bubbles, Chinese text, pseudo-text, extra sentences, or unrelated typography.',
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
    setPages((current) => current.map((page) => ({ ...page, status: 'generating', error: '' })));
    try {
      const result = await apiService.request('/api/ai/generate-ppt-asset', {
        method: 'POST',
        body: JSON.stringify(buildStorybookRequest()),
      });
      const assets = Array.isArray(result.assets) ? result.assets : [result.asset].filter(Boolean);
      setStep(3);
      const results = await Promise.allSettled(assets.map((asset, index) => {
        const pageNumber = Number(asset?.raw?.page || asset?.page) || index + 1;
        return resolveGeneratedAsset(asset, {
          fallbackError: t('pictureBook.imageFailed'),
          onResolved: (url) => setPages((current) => current.map((page) => (
            page.page === pageNumber
              ? { ...page, imageUrl: url, status: 'done', error: '' }
              : page
          ))),
        });
      }));
      setPages((current) => current.map((page, index) => {
        const resultForPage = results[index];
        if (page.imageUrl || (resultForPage?.status === 'fulfilled' && resultForPage.value)) return page;
        return {
          ...page,
          status: 'placeholder',
          error: resultForPage?.status === 'rejected'
            ? resultForPage.reason?.message || t('pictureBook.imageFailed')
            : t('pictureBook.imageTimeout'),
        };
      }));
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
        `Visual prompt: ${targetPage.imagePrompt || targetPage.imageDescription}.`,
        `Page text context: ${targetPage.text}.`,
        `Page mode: ${targetPage.pageType || 'instruction'}. This is an action-led guided picture book, not a narrative story scene.`,
        'Make the requested child action, choices, tools, or response space visually obvious.',
        `Render only this exact English core text: “${targetPage.text}”.`,
        'Do not render labels, captions, annotations, speech bubbles, Chinese characters, pseudo-text, or any other words.',
        'Warm classroom-ready picture-book style, consistent soft watercolor palette, no watermark.',
      ].join(' ');
      const result = await apiService.request('/api/ai/generate-ppt-asset', {
        method: 'POST',
        body: JSON.stringify({
          assetType: 'image',
          assetCode: 'B4',
          assetName: t('pictureBook.pageAssetName', { page: targetPage.page }),
          prompt,
          options: {
            imageRatio: '16:9',
            imageStyle: 'Watercolor Picture Book',
            negativePrompt: 'Chinese characters, Chinese text, non-English text, extra words, extra letters, captions, labels, annotations, speech bubbles, callouts, gibberish typography, pseudo-text, misspelled text, duplicated text',
            rawValues: {
              scene: targetPage.imageDescription,
            },
          },
        }),
      });
      const url = await resolveGeneratedAsset(result.asset || result.assets?.[0] || result, {
        fallbackError: t('pictureBook.imageFailed'),
      });
      updatePage(targetPage.id, {
        imageUrl: url,
        status: url ? 'done' : 'placeholder',
        error: url ? '' : t('pictureBook.imageSubmitted'),
      });
    } catch (error) {
      updatePage(targetPage.id, { status: 'placeholder', error: error.message || t('pictureBook.singleFailed') });
    }
  };

  const uploadPageImage = (page, file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    updatePage(page.id, { imageUrl: url, status: 'done', error: '' });
  };

  const enterMaking = (mode) => {
    setStep(3);
    saveBook({ step: 3 });
    if (mode === 'all') generateAllImages();
  };

  return (
    <main className="picture-book-studio-v2">
      {view === 'list' ? (
        <PictureBookListView
          books={bookList.filter((b) => (b.title || '').toLowerCase().includes(searchTerm.toLowerCase()))}
          loading={listLoading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onCreate={createNewBook}
          onOpen={openBook}
          onDelete={deleteBook}
        />
      ) : (
        <>
          <header className="pbv2-topbar">
            <div className="pbv2-topbar-left">
              <div className="pbv2-topbar-icon">
                <BookOpenText size={28} />
              </div>
              <div>
                <h1>{t('pictureBook.studioTitle')}</h1>
                <p>{t('pictureBook.studioSubtitle')}</p>
              </div>
            </div>
            <div className="pbv2-topbar-actions">
              <span className={`pbv2-save-state ${saveState === t('pictureBook.saveFailed') ? 'is-error' : ''}`}>{saveState}</span>
              <button type="button" className="pbv2-save-btn" onClick={() => saveBook()} disabled={saving}>
                {saving ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
                {saving ? t('pictureBook.saving') : t('pictureBook.saveProgress')}
              </button>
              <button type="button" className="pbv2-back-btn" onClick={backToList}>
                <ArrowLeft size={16} />
                {t('pictureBook.backToList')}
              </button>
            </div>
          </header>

      <div className="pbv2-shell">
        <aside className="pbv2-steps">
          {steps.map((label, index) => (
            <button
              type="button"
              key={label}
              className={`${step === index ? 'is-active' : ''} ${step > index ? 'is-done' : ''}`}
              onClick={() => goToStep(index)}
            >
              <span>{index + 1}</span>
              <strong>{label}</strong>
            </button>
          ))}
        </aside>

        <section className={`pbv2-workspace pbv2-workspace-step-${step}`}>
          {message && <div className="pbv2-message">{message}</div>}

          {step === 0 && (
            <BasicInfoStep
              basicInfo={basicInfo}
              setBasicField={setBasicField}
              buildPlan={buildPlan}
              canBuildPlan={canBuildPlan}
              generating={generating}
            />
          )}

          {step === 1 && (
            <ActivityPlanStep
              activityPlan={activityPlan}
              setPlanField={setPlanField}
              onBack={() => setStep(0)}
              onBuildDesign={buildDesign}
              generating={generating}
            />
          )}

          {step === 2 && (
            <PictureBookDesignStep
              pages={pages}
              updatePage={updatePage}
              addPage={addPage}
              removePage={removePage}
              onBack={() => setStep(1)}
              onMake={enterMaking}
              generatingAll={generatingAll}
            />
          )}

          {step === 3 && (
            <PictureBookMakingStep
              pages={pages}
              updatePage={updatePage}
              onBack={() => setStep(2)}
              onGenerateAll={generateAllImages}
              onGenerateOne={generateOneImage}
              onUpload={uploadPageImage}
              generatingAll={generatingAll}
            />
          )}
        </section>
      </div>
        </>
      )}
    </main>
  );
}

function PictureBookListView({ books, loading, searchTerm, setSearchTerm, onCreate, onOpen, onDelete }) {
  const { t } = useTranslation();
  return (
    <div className="pbv2-list-page">
      <header className="pbv2-topbar">
        <div className="pbv2-topbar-left">
          <div className="pbv2-topbar-icon">
            <BookOpenText size={28} />
          </div>
          <div>
            <h1>{t('pictureBook.listTitle')}</h1>
            <p>{t('pictureBook.listSubtitle')}</p>
          </div>
        </div>
        <button type="button" className="pbv2-create-btn" onClick={onCreate}>
          <Plus size={18} />
          {t('pictureBook.newBook')}
        </button>
      </header>

      <div className="pbv2-list-toolbar">
        <div className="pbv2-search-box">
          <Search size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('pictureBook.searchPlaceholder')}
          />
        </div>
      </div>

      {loading ? (
        <div className="pbv2-list-loading">
          <Loader2 className="spin" size={28} />
        </div>
      ) : books.length === 0 ? (
        <div className="pbv2-list-empty">
          <BookOpenText size={48} />
          <p>{t('pictureBook.empty')}</p>
        </div>
      ) : (
        <div className="pbv2-card-grid">
          {books.map((book) => (
            <article key={book.id} className="pbv2-book-card" onClick={() => onOpen(book)}>
              <div className="pbv2-book-cover">
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} />
                ) : (
                  <div className="pbv2-book-cover-placeholder">
                    <LayoutTemplate size={32} />
                  </div>
                )}
                <span className={`pbv2-book-status ${book.status || 'draft'}`}>
                  {book.status === 'published' ? t('pictureBook.published') : t('pictureBook.draft')}
                </span>
              </div>
              <div className="pbv2-book-info">
                <h3>{book.title || t('pictureBook.untitled')}</h3>
                <div className="pbv2-book-meta">
                  <Clock size={13} />
                  <span>{book.updated_at ? new Date(book.updated_at).toLocaleDateString() : ''}</span>
                </div>
                <div className="pbv2-book-actions">
                  <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(book); }}>
                    <Pencil size={14} />
                    {t('common.edit')}
                  </button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(book.id); }}>
                    <Trash2 size={14} />
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function BasicInfoStep({ basicInfo, setBasicField, buildPlan, canBuildPlan, generating }) {
  const { t } = useTranslation();
  const localizedAgeOptions = t('pictureBook.ageOptions', { returnObjects: true });
  const localizedLevelOptions = t('pictureBook.levelOptions', { returnObjects: true });
  const localizedParticipantOptions = t('pictureBook.participantOptions', { returnObjects: true });
  const localizedDurationOptions = t('pictureBook.durationOptions', { returnObjects: true });
  const localizedThemeOptions = t('pictureBook.themeOptions', { returnObjects: true });
  const localizedMaterialOptions = t('pictureBook.materialOptions', { returnObjects: true });
  return (
    <div className="pbv2-step-panel">
      <div className="pbv2-form-grid two">
        <OptionGroup tone="coral" required label={t('pictureBook.studentAge')} options={localizedAgeOptions} value={basicInfo.age} onChange={(value) => setBasicField('age', value)} />
        <OptionGroup tone="blue" required label={t('pictureBook.englishLevel')} options={localizedLevelOptions} value={basicInfo.level} onChange={(value) => setBasicField('level', value)} />
        <OptionGroup tone="yellow" label={t('pictureBook.participants')} options={localizedParticipantOptions} value={basicInfo.participants} onChange={(value) => setBasicField('participants', value)} />
        <OptionGroup tone="green" label={t('pictureBook.duration')} options={localizedDurationOptions} value={basicInfo.duration} onChange={(value) => setBasicField('duration', value)} />
      </div>

      <CheckboxGroup
        tone="yellow"
        label={t('pictureBook.themePreference')}
        options={localizedThemeOptions}
        value={basicInfo.themes}
        otherValue={basicInfo.themeOther}
        onToggle={(value) => setBasicField('themes', toggleList(basicInfo.themes, value))}
        onOther={(value) => setBasicField('themeOther', value)}
      />

      <CheckboxGroup
        tone="green"
        label={t('pictureBook.availableMaterials')}
        options={localizedMaterialOptions}
        value={basicInfo.materials}
        otherValue={basicInfo.materialOther}
        onToggle={(value) => setBasicField('materials', toggleList(basicInfo.materials, value))}
        onOther={(value) => setBasicField('materialOther', value)}
      />

      <section className="pbv2-card pbv2-tone-blue">
        <div className="pbv2-card-title">{t('pictureBook.languageGoalsOptional')}</div>
        <div className="pbv2-form-grid two">
          <Field label={t('pictureBook.coreVocabulary')} value={basicInfo.vocabulary} onChange={(value) => setBasicField('vocabulary', value)} placeholder={t('pictureBook.vocabularyPlaceholder')} />
          <Field label={t('pictureBook.coreGrammar')} value={basicInfo.grammar} onChange={(value) => setBasicField('grammar', value)} placeholder={t('pictureBook.grammarPlaceholder')} />
        </div>
      </section>

      <FooterActions>
        <button type="button" className="pbv2-primary" disabled={!canBuildPlan || generating} onClick={buildPlan}>
          <Wand2 size={16} />
          {generating ? t('pictureBook.generating') : t('pictureBook.generatePlan')}
        </button>
      </FooterActions>
    </div>
  );
}

function ActivityPlanStep({ activityPlan, setPlanField, onBack, onBuildDesign, generating }) {
  const { t } = useTranslation();
  return (
    <div className="pbv2-step-panel">
      <section className="pbv2-plan-block pbv2-tone-coral">
        <div className="pbv2-form-grid two">
          <Field label={t('pictureBook.englishStoryTitle')} value={activityPlan.storyTitleEn} onChange={(value) => setPlanField('storyTitleEn', value)} />
          <Field label={t('pictureBook.recommendedPageCount')} value={activityPlan.recommendedPageCount} onChange={(value) => setPlanField('recommendedPageCount', value)} placeholder={t('pictureBook.pageCountPlaceholder')} />
        </div>
        <Field area label={t('pictureBook.storyContent')} value={activityPlan.storyContent} onChange={(value) => setPlanField('storyContent', value)} />
      </section>
      <section className="pbv2-card pbv2-tone-yellow">
        <div className="pbv2-card-title">{t('pictureBook.activityGoals')}</div>
        <div className="pbv2-form-grid three">
          <Field area label={t('pictureBook.englishGoal')} value={activityPlan.englishGoal} onChange={(value) => setPlanField('englishGoal', value)} />
          <Field area label={t('pictureBook.wellbeingGoal')} value={activityPlan.wellbeingGoal} onChange={(value) => setPlanField('wellbeingGoal', value)} />
          <Field area label={t('pictureBook.outputGoal')} value={activityPlan.outputGoal} onChange={(value) => setPlanField('outputGoal', value)} />
        </div>
      </section>
      <section className="pbv2-plan-block pbv2-tone-green">
        <Field area label={t('pictureBook.materials')} value={activityPlan.materials} onChange={(value) => setPlanField('materials', value)} />
      </section>
      <FooterActions>
        <button type="button" className="pbv2-ghost" onClick={onBack}>{t('pictureBook.backToBasic')}</button>
        <button type="button" className="pbv2-primary" disabled={generating} onClick={onBuildDesign}>
          <BookOpenText size={16} />
          {generating ? t('pictureBook.generating') : t('pictureBook.generateDesign')}
        </button>
      </FooterActions>
    </div>
  );
}

function PictureBookDesignStep({ pages, updatePage, addPage, removePage, onBack, onMake, generatingAll }) {
  const { t } = useTranslation();
  return (
    <div className="pbv2-step-panel">
      <div className="pbv2-page-list">
        {pages.map((page, index) => (
          <PageDesignCard key={page.id} page={page} toneIndex={index} updatePage={updatePage} removePage={removePage} />
        ))}
      </div>
      <button type="button" className="pbv2-add-page" onClick={addPage}>
        <Plus size={16} />
        {t('pictureBook.addPage')}
      </button>
      <FooterActions>
        <button type="button" className="pbv2-ghost" onClick={onBack}>{t('pictureBook.backToPlan')}</button>
        {/* <button type="button" className="pbv2-secondary" onClick={() => onMake('placeholder')}>
          <Image size={16} />
          先生成占位符
        </button> */}
        <button type="button" className="pbv2-primary" disabled={generatingAll} onClick={() => onMake('all')}>
          {generatingAll ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
          {t('pictureBook.generateBook')}
        </button>
      </FooterActions>
    </div>
  );
}

function PictureBookMakingStep({ pages, updatePage, onBack, onGenerateAll, onGenerateOne, onUpload, generatingAll }) {
  const { t } = useTranslation();
  return (
    <div className="pbv2-step-panel">
      <div className="pbv2-making-toolbar">
        <button type="button" className="pbv2-primary" disabled={generatingAll} onClick={onGenerateAll}>
          {generatingAll ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
          {t('pictureBook.regenerateAll')}
        </button>
        <button type="button" className="pbv2-ghost" onClick={onBack}>{t('pictureBook.backToDesign')}</button>
      </div>
      <div className="pbv2-production-grid">
        {pages.map((page, index) => (
          <ProductionCard
            key={page.id}
            page={page}
            toneIndex={index}
            updatePage={updatePage}
            onGenerateOne={onGenerateOne}
            onUpload={onUpload}
          />
        ))}
      </div>
    </div>
  );
}

function PageDesignCard({ page, toneIndex, updatePage, removePage }) {
  const { t } = useTranslation();
  const tones = ['yellow', 'blue', 'green', 'coral'];
  return (
    <article className={`pbv2-page-card pbv2-tone-${tones[toneIndex % tones.length]}`}>
      <div className="pbv2-page-card-head">
        <strong>{t('pictureBook.pageNumber', { page: page.page })}</strong>
        <button type="button" onClick={() => removePage(page.id)}><Trash2 size={15} /></button>
      </div>
      <Field area label={t('pictureBook.imageDescription')} value={page.imageDescription} onChange={(value) => updatePage(page.id, { imageDescription: value })} />
      <Field area label={t('pictureBook.pageText')} value={page.text} onChange={(value) => updatePage(page.id, { text: value })} />
    </article>
  );
}

function ProductionCard({ page, toneIndex, updatePage, onGenerateOne, onUpload }) {
  const { t } = useTranslation();
  const tones = ['yellow', 'blue', 'green', 'coral'];
  return (
    <article className={`pbv2-production-card pbv2-tone-${tones[toneIndex % tones.length]}`}>
      <div className="pbv2-preview">
        {page.status === 'generating' ? (
          <div className="pbv2-generating"><Loader2 className="spin" size={24} />{t('pictureBook.generating')}</div>
        ) : page.imageUrl ? (
          <img src={page.imageUrl} alt={t('pictureBook.pageNumber', { page: page.page })} />
        ) : (
          <div className="pbv2-placeholder"><Image size={24} />{t('pictureBook.imagePlaceholder')}</div>
        )}
      </div>
      <div className="pbv2-production-body">
        <strong>{t('pictureBook.pageNumber', { page: page.page })}</strong>
        <textarea value={page.imageDescription} onChange={(event) => updatePage(page.id, { imageDescription: event.target.value })} />
        <input value={page.text} onChange={(event) => updatePage(page.id, { text: event.target.value })} />
        {page.error && <em>{page.error}</em>}
        <div className="pbv2-card-actions">
          <button type="button" onClick={() => onGenerateOne(page)} disabled={page.status === 'generating'}>
            {page.status === 'generating' ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}
            {t('pictureBook.generateOrAdjust')}
          </button>
          <label>
            <Upload size={14} />
            {t('pictureBook.manualUpload')}
            <input type="file" accept="image/*" onChange={(event) => onUpload(page, event.target.files?.[0])} />
          </label>
        </div>
      </div>
    </article>
  );
}

function PanelHeader({ eyebrow, title, desc }) {
  return (
    <header className="pbv2-panel-head">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{desc}</p>
    </header>
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
  const { t } = useTranslation();
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
      <input className="pbv2-input" value={otherValue} onChange={(event) => onOther(event.target.value)} placeholder={t('pictureBook.otherPlaceholder')} />
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
