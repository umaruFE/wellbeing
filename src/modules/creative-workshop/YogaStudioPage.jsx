import React from 'react';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Clock, Dumbbell, Image as ImageIcon,
  Loader2, Pencil, Plus, RefreshCw, Save, Search, Sparkles, Trash2, Wand2, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiService from '../../services/api';
import { getPromptTemplate } from '../../services/promptLibrary';
import { resolveGeneratedAsset } from '../../utils/assetGeneration';
import { openTeachingWindow } from '../../utils/teachingWindow';
import {
  createCreativeWork, deleteCreativeWork, generateCreativeWorkDesign,
  generateCreativeWorkPlan, getCreativeWorks, updateCreativeWork,
} from './workshopStorage';
import { YOGA_PAGE_TYPES, YOGA_POSES, findYogaPose } from './yogaPoses';
import '../picture-book/PictureBookStudioPage.css';
import './creativeWorkshop.css';

const MODULE_ID = 'interactive-yoga';
const MODULE_NAME = '互动式情境瑜伽';
const STEPS = ['stepBasic', 'stepPlan', 'stepDesign', 'stepMaking'];
const ACCENT = '#509f69';

// 兜底常量：权威版本在 api/src/prompts/builtin.ts（frontend.storybook-*），与绘本共用同一风格
const FALLBACK_VISUAL_STYLE = [
  'Oliver Jeffers-inspired loose watercolor washes with expressive black pen-and-ink sketch lines, warm, restrained, playful, and emotionally gentle.',
  'Use an extremely low-saturation washed palette of gray-blue, dusty gray-pink, sage gray-green, muted gray-orange, pale gray-yellow, and soft gray-purple.',
  'Let each page-specific image prompt determine the number of elements, layout, density, and composition.',
  'Use imperfect handwritten English typography only for the explicitly supplied page text.',
  'Use a flat light warm-beige textured drawing-paper background, no border, no frame, no open-book mockup, and no photographed book.',
  'Use one consistent landscape page ratio.',
  'Do not invent or display any words from the visual description or generation prompt.',
].join(' ');
const FALLBACK_NEGATIVE_PROMPT = 'Chinese characters, Chinese text, non-English text, unrequested words, extra letters, captions, annotations, speech bubbles, callouts, explanatory symbols, page numbers, borders, frames, open-book mockup, photographed book, saturated colors, neon colors, gibberish typography, pseudo-text, misspelled text, duplicated title, repeated text';

const PAGE_TYPE_LABEL = { scene: 'pageTypeScene', transition: 'pageTypeTransition', action: 'pageTypeAction', return: 'pageTypeReturn', ending: 'pageTypeEnding' };
const PAGE_TYPE_SET = new Set(Object.keys(PAGE_TYPE_LABEL));
const THEME_VALUES = ['自然探索', '动物世界', '日常生活', '太空冒险', '魔法幻想', '季节旅行'];
const PROP_OPTIONS = [
  { value: '无道具（纯身体练习）', key: 'propNone' },
  { value: '基础瑜伽道具（瑜伽垫、瑜伽球、瑜伽砖、泡沫轴）', key: 'propYoga' },
  { value: '体适能道具（平衡木、跷跷板、过河石、弹力带、跳箱、蹦床、小哑铃、弹力绳）', key: 'propFit' },
];

const toOption = (option) => (typeof option === 'string' ? { label: option, value: option } : { label: option.label, hint: option.hint, value: option.value || option.label });
/** 拆分服务端存的顿号串为数组（兼容旧自由文本主题） */
const splitParamList = (v) => (Array.isArray(v) ? v.map(String) : String(v || '').split(/[、,，]/).map((s) => s.trim()).filter(Boolean));
const toServerParams = (b) => ({
  goals: b.goals || '',
  age: b.age || '',
  duration: b.duration || '',
  theme: (b.themes || []).join('、'),
  props: (b.props || []).join('、'),
  requirements: b.requirements || '',
});
const fromServerParams = (p = {}) => ({
  goals: p.goals || '',
  age: p.age || '',
  duration: p.duration || '',
  themes: splitParamList(p.theme),
  props: splitParamList(p.props),
  requirements: p.requirements || '',
});
const initialBasicInfo = fromServerParams();
const initialPlan = {
  storyTitleEn: '', storyTitleZh: '', recommendedPageCount: 8, storyContent: '',
  englishGoal: '', wellbeingGoal: '', outputGoal: '', materials: '',
};

// 数据库存储的页面结构（与后端 renderYogaHtml / 模板 pages 对齐）
const toStoragePages = (list) => list.map((p, i) => ({
  id: p.id || `P${i + 1}`,
  page: i + 1,
  type: PAGE_TYPE_SET.has(p.type) ? p.type : 'action',
  pose: p.pose || null,
  subtitle: p.subtitle || '',
  teacherLang: p.teacherLang || '',
  expression: p.expression || '',
  action: p.action || '',
  imagePrompt: p.imagePrompt || '',
  node: p.node || '🌿',
  img: p.img || '',
}));

// 数据库页面 → 本地编辑态（补运行时字段；旧作品无 imagePrompt 时按服务端同款规则兜底）
const hydratePages = (list) => (Array.isArray(list) ? list : []).map((p, i) => {
  const base = toStoragePages([p])[0];
  return {
    ...base,
    imagePrompt: base.imagePrompt || [p.subtitle, p.action].filter(Boolean).join('，'),
    page: p.page || i + 1,
    status: p.img ? 'done' : 'placeholder',
    error: '',
  };
});

// ── 与绘本 BasicInfoStep 同款表单小组件 ─────────────────────
function OptionGroup({ label, required, options, value, onChange, tone = 'coral', multiple = false }) {
  const all = options.map(toOption);
  const values = multiple ? (Array.isArray(value) ? value : []) : null;
  // 多选时保留不在预置项里的历史值（旧作品自由填写的主题），作为额外 chip 展示
  const extras = multiple ? values.filter((v) => !all.some((o) => o.value === v)).map((label) => ({ label, value: label })) : [];
  const chips = [...all, ...extras];
  const isActive = (option) => (multiple ? values.includes(option.value) : value === option.value);
  const handleClick = (option) => {
    if (!multiple) { onChange(option.value); return; }
    onChange(values.includes(option.value) ? values.filter((v) => v !== option.value) : [...values, option.value]);
  };
  return (
    <section className={`pbv2-fieldset pbv2-tone-${tone}`}>
      <div className="pbv2-label">{label}{required && <b>*</b>}</div>
      <div className="pbv2-option-grid">
        {chips.map((option) => (
          <button type="button" key={option.value} className={isActive(option) ? 'is-active' : ''} onClick={() => handleClick(option)} title={option.hint || ''}>
            {option.label}{option.hint && <small>{option.hint}</small>}
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

// ── 逐页设计卡片（step 3）───────────────────────────────────
function PageDesignCard({ page, index, onPageChange, onRemove }) {
  const { t } = useTranslation();
  const poseValue = page.pose || '';
  const poseInfo = findYogaPose(poseValue);
  const poseMissing = page.type === 'action' && !poseValue;
  return (
    <article className={`pbv2-production-card yoga-design-card pbv2-tone-${PRODUCTION_TONES[index % PRODUCTION_TONES.length]}`}>
      <div className="pbv2-production-body">
        <strong>
          P{index + 1} · {PAGE_TYPE_LABEL[page.type] ? t('yogaStudio.' + PAGE_TYPE_LABEL[page.type]) : page.type}
          {poseInfo ? ` — ${poseInfo.zh}` : ''}
          {poseMissing && <em className="yoga-pose-warning"> {t('yogaStudio.poseMissingWarning')}</em>}
        </strong>
        <div className="pbv2-form-grid two">
          <label className="pbv2-field">
            <span>{t('yogaStudio.pageTypeLabel')}</span>
            <select value={page.type} onChange={(e) => onPageChange(page.id, { type: e.target.value })}>
              {Object.entries(PAGE_TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="pbv2-field">
            <span>{t('yogaStudio.poseLabel')}</span>
            <select value={poseValue} onChange={(e) => onPageChange(page.id, { pose: e.target.value || null })}>
              <option value="">{t('yogaStudio.poseNone')}</option>
              {YOGA_POSES.map((pose) => (
                <option key={pose.en} value={pose.en}>{pose.zh}（{pose.en}｜{'★'.repeat(pose.level)}）</option>
              ))}
            </select>
          </label>
        </div>
        {poseInfo && <p className="yoga-pose-desc">{t('yogaStudio.poseShape', { body: poseInfo.body })}</p>}
        <Field label={t('yogaStudio.subtitleLabel')} value={page.subtitle} onChange={(v) => onPageChange(page.id, { subtitle: v })} />
        <Field area label={t('yogaStudio.imageDescLabel')} value={page.imagePrompt} onChange={(v) => onPageChange(page.id, { imagePrompt: v })} />
        <Field area label={t('yogaStudio.teacherLangLabel')} value={page.teacherLang} onChange={(v) => onPageChange(page.id, { teacherLang: v })} />
        <button type="button" className="pbv2-ghost" onClick={() => onRemove(page.id)}>
          <Trash2 size={14} /> {t('yogaStudio.deletePage')}
        </button>
      </div>
    </article>
  );
}

// ── 制作插图卡片（step 4）───────────────────────────────────
const PRODUCTION_TONES = ['yellow', 'blue', 'green', 'coral'];

function ProductionCard({ page, index, onPageChange, onGenerateOne }) {
  const { t } = useTranslation();
  return (
    <article className={`pbv2-production-card yoga-make-card pbv2-tone-${PRODUCTION_TONES[index % PRODUCTION_TONES.length]}`}>
      <div className="pbv2-preview">
        {page.status === 'generating' ? (
          <div className="pbv2-generating"><Loader2 className="spin" size={24} /> {t('yogaStudio.generating')}</div>
        ) : page.img ? (
          <img src={page.img} alt={`P${index + 1}`} />
        ) : (
          <div className="pbv2-placeholder"><ImageIcon size={24} /> {t('yogaStudio.notGenerated')}</div>
        )}
      </div>
      <div className="pbv2-production-body">
        <strong>P{index + 1} · {PAGE_TYPE_LABEL[page.type] ? t('yogaStudio.' + PAGE_TYPE_LABEL[page.type]) : page.type}{page.pose ? ` — ${findYogaPose(page.pose)?.zh || page.pose}` : ''}</strong>
        <label className="pbv2-field">
          <span>{t('yogaStudio.poseLabel')}</span>
          <select value={page.pose || ''} onChange={(e) => onPageChange(page.id, { pose: e.target.value || null })}>
            <option value="">{t('yogaStudio.poseNone')}</option>
            {YOGA_POSES.map((pose) => (
              <option key={pose.en} value={pose.en}>{pose.zh}（{pose.en}｜{'★'.repeat(pose.level)}）</option>
            ))}
          </select>
        </label>
        <Field label={t('yogaStudio.subtitleLabel')} value={page.subtitle} onChange={(v) => onPageChange(page.id, { subtitle: v })} />
        <Field area label={t('yogaStudio.imageDescLabel')} value={page.imagePrompt} onChange={(v) => onPageChange(page.id, { imagePrompt: v })} />
        {page.error && <em>{page.error}</em>}
        <div className="pbv2-card-actions">
          <button type="button" disabled={page.status === 'generating'} onClick={() => onGenerateOne(page)}>
            {page.status === 'generating' ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}
            {t('yogaStudio.genOrAdjust')}
          </button>
        </div>
      </div>
    </article>
  );
}

// ── 授课模式：新窗口播放（utils/teachingWindow，键盘 ←/→ 翻页、Esc 退出） ──
const openYogaTeaching = (pages, title) => openTeachingWindow({
  pages: (pages || []).map((p) => ({ image: p.img, subtitle: p.subtitle })),
  title,
});

export function YogaStudioPage() {
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
  const [plan, setPlan] = React.useState(initialPlan);
  const [pages, setPages] = React.useState([]);
  const [workTitle, setWorkTitle] = React.useState('');

  const [planGenerating, setPlanGenerating] = React.useState(false);
  const [designGenerating, setDesignGenerating] = React.useState(false);
  const [generatingAll, setGeneratingAll] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saveState, setSaveState] = React.useState('');

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
    setBasicInfo(fromServerParams(work.parameters || {}));
    const result = work.result || {};
    setWorkTitle(result.title || work.title || '');
    setPlan({ ...initialPlan, ...(result.plan || {}) });
    setPages(hydratePages(result.pages));
    setMessage('');
    setStep(Array.isArray(result.pages) && result.pages.length ? 2 : (result.plan ? 1 : 0));
    setView('studio');
  };

  const createWork = async () => {
    try {
      const work = await createCreativeWork({ moduleId: MODULE_ID, moduleName: MODULE_NAME, title: t('yogaStudio.untitledYoga'), parameters: initialBasicInfo });
      await loadWorks();
      setEditing(work.id);
      setBasicInfo(initialBasicInfo);
      setPlan(initialPlan);
      setPages([]);
      setWorkTitle('');
      setStep(0);
      setMessage('');
      setView('studio');
    } catch (err) {
      window.alert(err.message || t('yogaStudio.createFailed'));
    }
  };

  const backToList = () => {
    setEditing(null);
    setView('list');
    loadWorks();
  };

  const persist = async (payload) => {
    const id = editingIdRef.current;
    if (!id) return;
    setSaving(true);
    try {
      await updateCreativeWork(id, payload);
      setSaveState(t('yogaStudio.savedAt', { time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) }));
    } catch (err) {
      setSaveState(t('yogaStudio.saveFailedShort'));
      setMessage(err.message || t('yogaStudio.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  // ── step 0：基础信息 → 保存并直接 AI 生成方案（同绘本第 1 步交互）──
  const basicReady = String(basicInfo.goals || '').trim().length > 0;
  const generatePlanAndAdvance = async () => {
    const id = editingIdRef.current;
    if (!id || planGenerating) return;
    setPlanGenerating(true);
    setMessage('');
    try {
      await updateCreativeWork(id, { title: (basicInfo.themes || [])[0] || basicInfo.goals?.slice(0, 20) || t('yogaStudio.untitledYoga'), parameters: toServerParams(basicInfo) });
      const data = await generateCreativeWorkPlan(id);
      setPlan({ ...initialPlan, ...data.plan });
      if (data.title) setWorkTitle(data.title);
      setStep(1);
    } catch (err) {
      setMessage(err.message || t('yogaStudio.planGenFail'));
    } finally {
      setPlanGenerating(false);
    }
  };

  // ── step 1：活动方案 ──────────────────────────────────────
  const generatePlan = async () => {
    const id = editingIdRef.current;
    if (!id || planGenerating) return;
    setPlanGenerating(true);
    setMessage('');
    try {
      await persist({ parameters: toServerParams(basicInfo) });
      const data = await generateCreativeWorkPlan(id);
      setPlan({ ...initialPlan, ...data.plan });
      if (data.title) setWorkTitle(data.title);
    } catch (err) {
      setMessage(err.message || t('yogaStudio.planGenFail'));
    } finally {
      setPlanGenerating(false);
    }
  };

  const savePlan = async () => {
    await persist({ plan, title: plan.storyTitleEn || workTitle });
    setStep(2);
  };

  // ── step 2：逐页设计 ──────────────────────────────────────
  const generateDesign = async () => {
    const id = editingIdRef.current;
    if (!id || designGenerating) return;
    setDesignGenerating(true);
    setMessage('');
    try {
      await persist({ plan });
      const data = await generateCreativeWorkDesign(id);
      setPages(hydratePages(data.pages));
      if (data.title) setWorkTitle(data.title);
    } catch (err) {
      setMessage(err.message || t('yogaStudio.designGenFail'));
    } finally {
      setDesignGenerating(false);
    }
  };

  const updatePage = (id, patch) => {
    setPages((current) => current.map((page) => (page.id === id ? { ...page, ...patch } : page)));
  };
  const removePage = (id) => {
    setPages((current) => current.filter((page) => page.id !== id).map((page, index) => ({ ...page, page: index + 1 })));
  };
  const addPage = () => {
    setPages((current) => [...current, {
      id: `P${Date.now()}`, page: current.length + 1, type: 'action', pose: null,
      subtitle: '', teacherLang: '', expression: '', action: '', imagePrompt: '',
      node: '🌿', img: '', status: 'placeholder', error: '',
    }]);
  };

  const savePages = async () => {
    const storagePages = toStoragePages(pages);
    setPages(hydratePages(storagePages));
    await persist({ pages: storagePages, title: workTitle || plan.storyTitleEn });
    setStep(3);
  };

  // ── step 3：插图生成（复用绘本 B9 批量链路）────────────────
  // 动作页图上唯一可见文字 = 体式短名；其余页完全无字（字幕由授课 HTML 叠加）
  const buildPagePrompt = (page) => {
    const poseInfo = findYogaPose(page.pose);
    return [
      `Create a guided yoga-adventure ${page.type} page illustration, never a narrative story scene.`,
      storybookPrompts.visualStyle,
      `NON-VISIBLE SCENE INSTRUCTIONS — interpret as pictures, never typography: ${page.imagePrompt || page.subtitle}.`,
      poseInfo
        ? `The guide character must clearly demonstrate the yoga pose "${poseInfo.en}" (${poseInfo.body}) — the pose silhouette must be instantly recognizable to children.`
        : 'This page shows the scene and atmosphere only; no yoga pose is needed.',
      'Render a completely text-free illustration, no typography at all.',
      'Do not add captions, annotations, speech bubbles, Chinese text, pseudo-text, extra sentences, or unrelated typography.',
      'Keep characters and style consistent across the whole adventure, no watermark.',
    ].join(' ');
  };

  const buildPageBatchItem = (page) => ({
    page: page.page,
    pageType: page.type,
    title: `${plan.storyTitleEn || workTitle || 'Yoga Adventure'} · Page ${page.page}`,
    text: '',
    imageDescription: page.imagePrompt,
    imagePrompt: page.imagePrompt,
    visualWords: [],
    prompt: buildPagePrompt(page),
    visibleEnglishText: '',
  });

  const buildImageRequest = (targetPages) => ({
    assetType: 'image',
    assetCode: 'B9',
    assetName: `${MODULE_NAME}插图`,
    prompt: `${storybookPrompts.visualStyle}\nAdventure title: ${plan.storyTitleEn || workTitle || 'Yoga Adventure'}.\nGuided yoga concept: ${plan.storyContent || (basicInfo.themes || []).join('、') || ''}`,
    options: {
      imageRatio: '16:9',
      imageStyle: 'Watercolor Picture Book',
      negativePrompt: storybookPrompts.negative,
      referenceNotes: [
        'These are prompt-only visual directions for a guided yoga adventure. They must guide composition but must never be rendered as visible page text.',
        'ABSOLUTE TYPOGRAPHY RULE: every page illustration must be completely text-free. Never display imagePrompt, subtitle, pose names, pageType, captions, Chinese characters, pseudo-text, or any other words.',
        JSON.stringify(targetPages.map(buildPageBatchItem)),
      ].join('\n'),
      batchItems: targetPages.map(buildPageBatchItem),
      rawValues: {
        storybookTitle: plan.storyTitleEn || workTitle || 'Yoga Adventure',
        storybookContent: targetPages.map((p) => p.subtitle).join('\n'),
        storybookStyle: 'Watercolor Picture Book',
        storybookGrade: basicInfo.age || '7-9岁',
      },
    },
  });

  const savePagesSilently = async (finalPages) => {
    const storagePages = toStoragePages(finalPages);
    try {
      await updateCreativeWork(editingIdRef.current, { pages: storagePages });
      setSaveState(t('yogaStudio.savedAt', { time: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) }));
    } catch {
      setSaveState(t('yogaStudio.saveFailedShort'));
    }
  };

  // 制作页编辑（字幕/画面描述）：本地更新 + 防抖自动保存，重绘时即用最新内容
  const pagesRef = React.useRef(pages);
  React.useEffect(() => { pagesRef.current = pages; }, [pages]);
  const editPersistTimer = React.useRef(null);
  const updateMadePage = (id, patch) => {
    updatePage(id, patch);
    if (editPersistTimer.current) clearTimeout(editPersistTimer.current);
    editPersistTimer.current = setTimeout(() => {
      if (editingIdRef.current) savePagesSilently(pagesRef.current);
    }, 900);
  };

  const generateAllImages = async () => {
    if (pages.length < 2 || generatingAll) return;
    setGeneratingAll(true);
    setMessage('');
    const sourcePages = pages.map((page) => ({ ...page }));
    setPages((current) => current.map((page) => ({ ...page, status: 'generating', error: '' })));
    try {
      const result = await apiService.request('/api/ai/generate-ppt-asset', {
        method: 'POST',
        body: JSON.stringify(buildImageRequest(sourcePages)),
      });
      const assets = Array.isArray(result.assets) ? result.assets : [result.asset].filter(Boolean);
      const results = await Promise.allSettled(assets.map(async (asset, index) => {
        const pageNumber = Number(asset?.raw?.page || asset?.page) || index + 1;
        return {
          pageNumber,
          url: await resolveGeneratedAsset(asset, {
            fallbackError: t('yogaStudio.imgFail'),
            onResolved: (url) => setPages((current) => current.map((page) => (
              page.page === pageNumber ? { ...page, img: url, status: 'done', error: '' } : page
            ))),
          }),
        };
      }));
      const fulfilledByPage = new Map();
      const rejectedByPage = new Map();
      results.forEach((resultForAsset, index) => {
        const fallbackPage = Number(assets[index]?.raw?.page || assets[index]?.page) || index + 1;
        if (resultForAsset.status === 'fulfilled' && resultForAsset.value?.url) {
          fulfilledByPage.set(resultForAsset.value.pageNumber, resultForAsset.value.url);
        } else if (resultForAsset.status === 'rejected') {
          rejectedByPage.set(fallbackPage, resultForAsset.reason?.message || t('yogaStudio.imgFail'));
        }
      });
      const finalPages = sourcePages.map((page) => {
        const url = fulfilledByPage.get(page.page);
        if (url) return { ...page, img: url, status: 'done', error: '' };
        if (page.img) return { ...page, status: 'done', error: '' };
        return { ...page, status: 'placeholder', error: rejectedByPage.get(page.page) || t('yogaStudio.imgTimeoutSingle') };
      });
      setPages(finalPages);
      await savePagesSilently(finalPages);
    } catch (error) {
      setPages((current) => current.map((page) => ({ ...page, status: page.img ? 'done' : 'placeholder', error: error.message })));
      setMessage(error.message || t('yogaStudio.batchFail'));
    } finally {
      setGeneratingAll(false);
    }
  };

  const generateOneImage = async (targetPage) => {
    updatePage(targetPage.id, { status: 'generating', error: '' });
    try {
      const result = await apiService.request('/api/ai/generate-ppt-asset', {
        method: 'POST',
        body: JSON.stringify(buildImageRequest([targetPage])),
      });
      const url = await resolveGeneratedAsset(result.asset || result.assets?.[0] || result, {
        fallbackError: t('yogaStudio.imgFail'),
      });
      const finalPages = pages.map((page) => (page.id === targetPage.id ? {
        ...page,
        img: url || page.img,
        status: url ? 'done' : 'placeholder',
        error: url ? '' : t('yogaStudio.imgTimeout'),
      } : page));
      setPages(finalPages);
      if (url) await savePagesSilently(finalPages);
    } catch (error) {
      updatePage(targetPage.id, { status: 'placeholder', error: error.message || t('yogaStudio.imgFailRetry') });
    }
  };

  // ── 列表操作 ─────────────────────────────────────────────
  const remove = async (id) => {
    if (!window.confirm(t('yogaStudio.confirmDelete'))) return;
    try {
      await deleteCreativeWork(id);
      setWorks((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      window.alert(err.message || t('yogaStudio.deleteFailed'));
    }
  };

  const filtered = works.filter((w) =>
    `${w.title || ''} ${w.parameters?.theme || ''} ${w.parameters?.goals || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 列表卡片「授课」：直接用已保存的页面进入新窗口授课
  const presentFromList = (work) => {
    if (!openYogaTeaching(work.result?.pages, work.title || work.result?.title || t('yogaStudio.teachTitleFallback'))) {
      setMessage(t('yogaStudio.noPlayablePages'));
    }
  };

  // ── 列表视图 ─────────────────────────────────────────────
  if (view === 'list') {
    return (
      <main className="picture-book-studio-v2">
        <div className="pbv2-list-page" style={{ '--cw-accent': ACCENT }}>
          <header className="pbv2-topbar">
            <div className="pbv2-topbar-left">
              <div className="pbv2-topbar-icon"><Dumbbell size={28} /></div>
              <div>
                <h1>{t('yogaStudio.moduleName')}</h1>
                <p>{t('yogaStudio.listSubtitle')}</p>
              </div>
            </div>
            <div className="pbv2-topbar-actions">
              <button type="button" className="pbv2-back-btn" onClick={() => navigate('/workshop/english-plus')}>
                <ArrowLeft size={16} /> {t('yogaStudio.back')}
              </button>
              <button type="button" className="pbv2-create-btn" onClick={createWork}>
                <Plus size={18} /> {t('yogaStudio.newWork')}
              </button>
            </div>
          </header>

          <div className="pbv2-list-toolbar">
            <div className="pbv2-search-box">
              <Search size={16} />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t('yogaStudio.searchPlaceholder')} />
            </div>
          </div>

          {message && <div className="pbv2-message">{message}</div>}

          {listLoading ? (
            <div className="pbv2-list-loading"><Loader2 className="spin" size={28} /></div>
          ) : filtered.length === 0 ? (
            <div className="pbv2-list-empty">
              <Dumbbell size={48} />
              <p>{searchTerm ? t('yogaStudio.noMatch') : t('yogaStudio.emptyList')}</p>
            </div>
          ) : (
            <div className="pbv2-card-grid">
              {filtered.map((work) => {
                const resultPages = Array.isArray(work.result?.pages) ? work.result.pages : [];
                const imageCount = resultPages.filter((p) => p.img).length;
                const statusLabel = resultPages.length === 0 ? t('yogaStudio.statusDraft') : (imageCount >= resultPages.length ? t('yogaStudio.statusDone') : t('yogaStudio.statusImages', { done: imageCount, total: resultPages.length }));
                return (
                  <article key={work.id} className="pbv2-book-card" onClick={() => openWork(work)}>
                    <div className="pbv2-book-cover exp-cover">
                      <Dumbbell size={52} />
                      <span className={`pbv2-book-status ${imageCount >= resultPages.length && resultPages.length > 0 ? 'published' : 'draft'}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="pbv2-book-info">
                      <h3>{work.title || t('yogaStudio.untitled')}</h3>
                      <div className="pbv2-book-meta">
                        <Clock size={13} />
                        <span>{work.parameters?.age || ''}{work.parameters?.duration ? ` · ${work.parameters.duration}` : ''}</span>
                        <span>·</span>
                        <span>{work.updatedAt ? new Date(work.updatedAt).toLocaleDateString() : ''}</span>
                      </div>
                      <div className="pbv2-book-actions">
                        <button type="button" onClick={(e) => { e.stopPropagation(); openWork(work); }}>
                          <Pencil size={14} /> {t('yogaStudio.edit')}
                        </button>
                        {resultPages.length > 0 && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); presentFromList(work); }}>
                            🖥️ {t('common.teach')}
                          </button>
                        )}
                        <button type="button" onClick={(e) => { e.stopPropagation(); remove(work.id); }}>
                          <Trash2 size={14} /> {t('yogaStudio.delete')}
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
          <div className="pbv2-topbar-icon"><Dumbbell size={28} /></div>
          <div>
            <h1>{workTitle || t('yogaStudio.newWorkTitle')}</h1>
            <p>{t('yogaStudio.studioSubtitle')}</p>
          </div>
        </div>
        <div className="pbv2-topbar-actions">
          <span className={`pbv2-save-state ${saveState === t('yogaStudio.saveFailedShort') ? 'is-error' : ''}`}>{saveState}</span>
          <button type="button" className="pbv2-back-btn" onClick={backToList}>
            <ArrowLeft size={16} /> {t('yogaStudio.backToList')}
          </button>
        </div>
      </header>

      <div className="pbv2-shell">
        <aside className="pbv2-steps">
          {STEPS.map((label, index) => (
            <button type="button" key={label} className={`${step === index ? 'is-active' : ''} ${step > index ? 'is-done' : ''}`} onClick={() => setStep(index)}>
              <span>{index + 1}</span>
              <strong>{t('yogaStudio.' + label)}</strong>
            </button>
          ))}
        </aside>

        <section className={`pbv2-workspace pbv2-workspace-step-${step}`}>
          {message && <div className="pbv2-message">{message}</div>}

          {/* step 1 · 基本信息 */}
          {step === 0 && (
            <div className="pbv2-step-panel">
              <div className="pbv2-form-grid two">
                <OptionGroup label={t('yogaStudio.ageLabel')} options={[{ value: '3-6岁', label: t('yogaStudio.age36') }, { value: '7-9岁', label: t('yogaStudio.age79') }, { value: '10-12岁', label: t('yogaStudio.age1012') }, { value: '13-15岁', label: t('yogaStudio.age1315') }]} value={basicInfo.age} onChange={(v) => setBasicInfo({ ...basicInfo, age: v })} tone="coral" />
                <OptionGroup label={t('yogaStudio.durationLabel')} options={[{ value: '3-5分钟', label: t('yogaStudio.dur35') }, { value: '5-8分钟', label: t('yogaStudio.dur58') }, { value: '9-15分钟', label: t('yogaStudio.dur915') }]} value={basicInfo.duration} onChange={(v) => setBasicInfo({ ...basicInfo, duration: v })} tone="green" />
              </div>
              <section className="pbv2-card pbv2-tone-coral">
                <div className="pbv2-card-title">{t('yogaStudio.themesLabel')}</div>
                <OptionGroup options={THEME_VALUES.map((v, i) => ({ value: v, label: t('yogaStudio.theme' + i), hint: t('yogaStudio.themeHint' + i) }))} multiple value={basicInfo.themes} onChange={(themes) => setBasicInfo({ ...basicInfo, themes })} tone="coral" />
              </section>
              <section className="pbv2-card pbv2-tone-green">
                <div className="pbv2-card-title">{t('yogaStudio.propsLabel')}</div>
                <OptionGroup options={PROP_OPTIONS.map((p) => ({ value: p.value, label: t('yogaStudio.' + p.key), hint: t('yogaStudio.' + p.key + 'Hint') }))} multiple value={basicInfo.props} onChange={(props) => setBasicInfo({ ...basicInfo, props })} tone="green" />
              </section>
              <section className="pbv2-card pbv2-tone-blue">
                <div className="pbv2-card-title">{t('yogaStudio.goalsLabel')}</div>
                <Field area label={t('yogaStudio.goalsField')} value={basicInfo.goals} onChange={(v) => setBasicInfo({ ...basicInfo, goals: v })} placeholder={t('yogaStudio.goalsPlaceholder')} />
              </section>
              <section className="pbv2-card pbv2-tone-green">
                <div className="pbv2-card-title">{t('yogaStudio.reqLabel')}</div>
                <Field area label={t('yogaStudio.reqField')} value={basicInfo.requirements} onChange={(v) => setBasicInfo({ ...basicInfo, requirements: v })} placeholder={t('yogaStudio.reqPlaceholder')} />
              </section>
              <footer className="pbv2-actions">
                <ChevronRight size={16} />
                <button type="button" className="pbv2-primary" disabled={!basicReady || planGenerating} onClick={generatePlanAndAdvance}>
                  {planGenerating ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                  {planGenerating ? t('yogaStudio.aiGenerating') : t('yogaStudio.aiGenPlan')}
                </button>
              </footer>
            </div>
          )}

          {/* step 2 · 活动方案 */}
          {step === 1 && (
            <div className="pbv2-step-panel">
              <section className="pbv2-plan-block pbv2-tone-coral">
                <div className="pbv2-form-grid three">
                  <Field label={t('yogaStudio.titleEn')} value={plan.storyTitleEn} onChange={(v) => setPlan({ ...plan, storyTitleEn: v })} />
                  <Field label={t('yogaStudio.titleZh')} value={plan.storyTitleZh} onChange={(v) => setPlan({ ...plan, storyTitleZh: v })} />
                  <Field label={t('yogaStudio.pageCount')} value={plan.recommendedPageCount} onChange={(v) => setPlan({ ...plan, recommendedPageCount: v })} />
                </div>
                <Field area label={t('yogaStudio.storyLabel')} value={plan.storyContent} onChange={(v) => setPlan({ ...plan, storyContent: v })} />
              </section>
              <section className="pbv2-card pbv2-tone-yellow">
                <div className="pbv2-card-title">{t('yogaStudio.goalsTitle')}</div>
                <div className="pbv2-form-grid three">
                  <Field area label={t('yogaStudio.englishGoal')} value={plan.englishGoal} onChange={(v) => setPlan({ ...plan, englishGoal: v })} />
                  <Field area label={t('yogaStudio.wellbeingGoal')} value={plan.wellbeingGoal} onChange={(v) => setPlan({ ...plan, wellbeingGoal: v })} />
                  <Field area label={t('yogaStudio.outputGoal')} value={plan.outputGoal} onChange={(v) => setPlan({ ...plan, outputGoal: v })} />
                </div>
              </section>
              <section className="pbv2-plan-block pbv2-tone-green">
                <Field area label={t('yogaStudio.materialsLabel')} value={plan.materials} onChange={(v) => setPlan({ ...plan, materials: v })} />
              </section>
              <footer className="pbv2-actions">
                <button type="button" className="pbv2-ghost" onClick={() => setStep(0)}>{t('yogaStudio.backToBasic')}</button>
                <button type="button" className="pbv2-ghost" disabled={planGenerating} onClick={generatePlan}>
                  {planGenerating ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
                  {planGenerating ? t('yogaStudio.aiGenerating') : t('yogaStudio.aiRegenPlan')}
                </button>
                <button type="button" className="pbv2-primary" disabled={saving} onClick={savePlan}>
                  <Save size={16} /> {t('yogaStudio.saveToDesign')}
                </button>
              </footer>
            </div>
          )}

          {/* step 3 · 页面设计 */}
          {step === 2 && (
            <div className="pbv2-step-panel">
              <p className="yoga-design-hint">{t('yogaStudio.designHint')}</p>
              <div className="pbv2-page-list">
                {pages.map((page, index) => (
                  <PageDesignCard key={page.id} page={page} index={index} onPageChange={updatePage} onRemove={removePage} />
                ))}
              </div>
              {pages.length === 0 && (
                <div className="pbv2-list-empty">
                  <Dumbbell size={48} />
                  <p>{t('yogaStudio.noDesignYet')}</p>
                </div>
              )}
              <button type="button" className="pbv2-add-page" onClick={addPage}>
                <Plus size={16} /> {t('yogaStudio.addPage')}
              </button>
              <footer className="pbv2-actions">
                <button type="button" className="pbv2-ghost" onClick={() => setStep(1)}>{t('yogaStudio.backToPlan')}</button>
                <button type="button" className="pbv2-primary" disabled={designGenerating} onClick={generateDesign}>
                  {designGenerating ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                  {designGenerating ? t('yogaStudio.aiGenerating') : t('yogaStudio.aiGenDesign')}
                </button>
                <button type="button" className="pbv2-primary" disabled={pages.length === 0 || saving} onClick={savePages}>
                  <Save size={16} /> {t('yogaStudio.saveToMaking')}
                </button>
              </footer>
            </div>
          )}

          {/* step 4 · 制作插图 */}
          {step === 3 && (
            <div className="pbv2-step-panel">
              <div className="pbv2-making-toolbar yoga-making-toolbar">
                <button type="button" className="pbv2-primary" disabled={generatingAll || pages.length < 2} onClick={generateAllImages}>
                  {generatingAll ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
                  {generatingAll ? t('yogaStudio.batchGenerating') : t('yogaStudio.regenAll')}
                </button>
                <button type="button" className="pbv2-ghost" onClick={() => { if (!openYogaTeaching(pages, workTitle || t('yogaStudio.teachTitleFallback'))) setMessage(t('yogaStudio.noPlayablePages')); }} disabled={!pages.length}>
                  🖥️ {t('common.teachMode')}
                </button>
                <button type="button" className="pbv2-ghost" onClick={() => setStep(2)}>{t('yogaStudio.backToDesign')}</button>
              </div>
              <div className="pbv2-page-list">
                {pages.map((page, index) => (
                  <ProductionCard key={page.id} page={page} index={index} onPageChange={updateMadePage} onGenerateOne={generateOneImage} />
                ))}
              </div>
              <p className="yoga-making-hint">{t('yogaStudio.makingHint')}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default YogaStudioPage;
