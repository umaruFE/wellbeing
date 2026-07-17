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

function buildActivityPlan(info, isEn = false) {
  const theme = getSelectedTheme(info, isEn);
  const isNatureTheme = theme === '自然探索' || theme === 'Nature Exploration';
  const vocab = info.vocabulary || (isNatureTheme ? 'leaf, stone, tree, bug, river' : 'happy, sad, calm, brave, friend');
  const grammar = info.grammar || (isNatureTheme ? 'I can see... / It is...' : 'My friend is/feels... / My friend has...');
  const materialText = getMaterialsText(info, isEn);
  const titleMap = {
    情绪表达: ['My Feeling Friend', '我的情绪朋友'],
    自然探索: ['A Tiny Nature Finder', '小小自然发现家'],
    自我认知: ['The Me I Can See', '看见我自己'],
    人际关系: ['A Bridge Between Friends', '朋友之间的小桥'],
    家庭与归属: ['My Warm Little Home', '温暖的小小家'],
    成长与变化: ['I Grow a Little More', '我又长大了一点'],
    感恩与善意: ['A Kindness Spark', '善意小火花'],
    身体与感知: ['My Body Says Hello', '身体在打招呼'],
    动物与生命: ['Hello, Little Life', '你好，小生命'],
    勇气与冒险: ['A Brave Little Step', '勇敢的一小步'],
    'Emotional Expression': ['My Feeling Friend'],
    'Nature Exploration': ['A Tiny Nature Finder'],
    'Self-awareness': ['The Me I Can See'],
    Relationships: ['A Bridge Between Friends'],
    'Family and Belonging': ['My Warm Little Home'],
    'Growth and Change': ['I Grow a Little More'],
    'Gratitude and Kindness': ['A Kindness Spark'],
    'Body and Senses': ['My Body Says Hello'],
    'Animals and Life': ['Hello, Little Life'],
    'Courage and Adventure': ['A Brave Little Step'],
  };
  const [storyTitleEn] = titleMap[theme] || ['My Picture Book Adventure', '我的绘本冒险'];

  return {
    storyTitleEn,
    storyTitleZh: '',
    storyContent: isEn
      ? `In this ${theme} story, the children meet a little character who needs to be understood. Through observation, expression, and creativity, they help turn invisible feelings or ideas into images that can be shared.`
      : `孩子们在“${theme}”主题故事中遇到一个需要被理解的小角色。大家通过观察、表达和创作，帮助它把看不见的感受或想法变成可以分享的图像，并用简单英文完成介绍。`,
    englishGoal: isEn
      ? `Use the core vocabulary: ${vocab}; use the sentence patterns/grammar: ${grammar}; understand and answer simple questions about the work.`
      : `使用核心词汇：${vocab}；使用核心句型/语法：${grammar}；能听懂并回应与作品相关的简单提问。`,
    wellbeingGoal: isEn
      ? 'Turn inner feelings into visible images and experience understanding, acceptance, and connection through expression and collaboration.'
      : '将内在感受外化为可被看见的形象；在表达和协作中体验被理解、被接纳和共同创造的联结感。',
    outputGoal: isEn
      ? (isNatureTheme ? 'A one-page nature discovery book and a nature observation artwork' : 'A group picture book and a themed creative poster')
      : (isNatureTheme ? '一页自然发现绘本和一张自然观察作品' : '一本小组绘本和一张主题创作海报'),
    materials: isEn && !info.materials.length && !info.materialOther ? 'Drawing paper, colored pencils/crayons' : materialText,
  };
}

function buildPictureBookPages(plan, info, isEn = false) {
  const title = plan.storyTitleEn || 'My Picture Book';
  const vocab = info.vocabulary || 'happy, sad, calm, brave, friend';
  const grammar = info.grammar || 'My friend is/feels...';
  const pages = [
    {
      imageDescription: isEn
        ? `Cover. A warm children's picture-book scene. The main character stands at a bright creative table surrounded by ${plan.materials || 'drawing paper and colored pencils'}, with space reserved for the title.`
        : `封面。温暖的儿童绘本场景，主角站在明亮的创作桌前，周围有${plan.materials || '画纸和彩笔'}，画面留有标题空间。`,
      text: title,
    },
    {
      imageDescription: isEn ? 'The story begins. The curious main character discovers a tiny clue or a new friend in a clear, gentle scene rich in child-friendly details.' : '故事开始。主角发现一个小小的线索或朋友，表情好奇，场景清晰、温柔，有适合儿童观察的细节。',
      text: 'I see a little friend.',
    },
    {
      imageDescription: isEn ? `Language exploration page. Show objects or feelings related to the core vocabulary: ${vocab}. Do not render the words in the image; show only observable visual details.` : `语言探索页。画面呈现核心词汇对应的物品或感受：${vocab}。不要把词写进图片，只呈现可观察的画面。`,
      text: `My friend has ${vocab.split(/[,，、\s]+/).filter(Boolean)[0] || 'colors'}.`,
    },
    {
      imageDescription: isEn ? `Expression practice page. The main character and friends use the pattern “${grammar}” to express observations or feelings. Show interaction without text bubbles.` : `表达练习页。主角和同伴一起使用句型“${grammar}”表达观察或感受，画面有互动但不要出现文字气泡。`,
      text: info.grammar ? info.grammar.split(/[;；。]/)[0] : 'My friend feels happy.',
    },
    {
      imageDescription: isEn ? `Creative activity page. The children use ${plan.materials || 'drawing paper and colored pencils'} to make ${plan.outputGoal || 'a themed poster'}. The composition should convey collaboration.` : `活动创作页。孩子们使用${plan.materials || '画纸和彩笔'}制作产出物：${plan.outputGoal || '一张主题海报'}，构图有合作感。`,
      text: 'We make it together.',
    },
    {
      imageDescription: isEn ? 'Final presentation page. The children share their work, and the main character feels seen and accepted in a warm classroom filled with achievement and connection.' : '结尾展示页。孩子们展示作品，主角被看见和接纳，画面有成就感、联结感和温暖的课堂氛围。',
      text: 'We share. We listen. We smile.',
    },
  ];
  return pages.map((page, index) => ({
    id: `page-${Date.now()}-${index + 1}`,
    page: index + 1,
    imageDescription: page.imageDescription,
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
    try {
      const pageCount = pages.length > 0 ? pages.length : 6;
      const res = await fetch('/api/rag/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'picture-book-design',
          basicInfo,
          activityPlan,
          pageCount,
          language: isEn ? 'en' : 'zh',
          outputLanguage: isEn ? 'English' : 'Chinese',
        }),
      });
      const data = await res.json();
      if (data.success && data.pages && data.pages.length > 0) {
        const nextPages = data.pages.map((p, i) => ({
          id: `page-${Date.now()}-${i}`,
          page: p.page || i + 1,
          imageDescription: p.imageDescription || '',
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
        const fallbackPages = buildPictureBookPages(activityPlan, basicInfo, isEn);
        setPages(fallbackPages);
        setMessage(data.error || t('pictureBook.designFallback'));
        setStep(2);
        saveBook({ pages: fallbackPages, step: 2 });
      }
    } catch (err) {
      // Fallback to local template
      const fallbackPages = buildPictureBookPages(activityPlan, basicInfo, isEn);
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
        imageDescription: t('pictureBook.newPageDescription'),
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
      batchItems: pages.map((page) => ({
        page: page.page,
        title: `${activityPlan.storyTitleEn || 'Picture Book'} · Page ${page.page}`,
        text: `${page.imageDescription}\nPage text: ${page.text}`,
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
        `Image description: ${targetPage.imageDescription}.`,
        `Page text context: ${targetPage.text}.`,
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
        <Field label={t('pictureBook.englishStoryTitle')} value={activityPlan.storyTitleEn} onChange={(value) => setPlanField('storyTitleEn', value)} />
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
