import React from 'react';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Clock, Dumbbell, Image as ImageIcon,
  Loader2, Pencil, Plus, RefreshCw, Save, Search, Sparkles, Trash2, Wand2, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { getPromptTemplate } from '../../services/promptLibrary';
import { resolveGeneratedAsset } from '../../utils/assetGeneration';
import {
  createCreativeWork, deleteCreativeWork, generateCreativeWorkDesign,
  generateCreativeWorkPlan, getCreativeWorks, updateCreativeWork,
} from './workshopStorage';
import { YOGA_PAGE_TYPES, YOGA_POSES, findYogaPose } from './yogaPoses';
import '../picture-book/PictureBookStudioPage.css';
import './creativeWorkshop.css';

const MODULE_ID = 'interactive-yoga';
const MODULE_NAME = '互动式情境瑜伽';
const STEPS = ['基本信息', '活动方案', '页面设计', '制作插图'];
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

const PAGE_TYPE_LABEL = { scene: '场景页', transition: '过渡页', action: '动作页', return: '回归页', ending: '结束页' };
const PAGE_TYPE_SET = new Set(Object.keys(PAGE_TYPE_LABEL));
const AGE_OPTIONS = ['3-6岁', '7-9岁', '10-12岁', '13-15岁'];
const DURATION_OPTIONS = ['3-5分钟', '5-8分钟', '9-15分钟'];
const THEME_OPTIONS = [
  { label: '自然探索', hint: '森林、海洋、花园……' },
  { label: '动物世界', hint: '丛林动物、海洋生物……' },
  { label: '日常生活', hint: '整理房间、烹饪食物……' },
  { label: '太空冒险', hint: '星球旅行、宇航员训练……' },
  { label: '魔法幻想', hint: '魔法学校、精灵世界……' },
  { label: '季节旅行', hint: '春夏秋冬场景变换' },
];
const PROP_OPTIONS = [
  { label: '无道具', hint: '纯身体练习', value: '无道具（纯身体练习）' },
  { label: '基础瑜伽道具', hint: '瑜伽垫、瑜伽球、瑜伽砖、泡沫轴', value: '基础瑜伽道具（瑜伽垫、瑜伽球、瑜伽砖、泡沫轴）' },
  { label: '体适能道具', hint: '平衡木、跷跷板、过河石、弹力带、跳箱、蹦床、小哑铃、弹力绳', value: '体适能道具（平衡木、跷跷板、过河石、弹力带、跳箱、蹦床、小哑铃、弹力绳）' },
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
  const poseValue = page.pose || '';
  const poseInfo = findYogaPose(poseValue);
  const poseMissing = page.type === 'action' && !poseValue;
  return (
    <article className={`pbv2-production-card yoga-design-card pbv2-tone-${PRODUCTION_TONES[index % PRODUCTION_TONES.length]}`}>
      <div className="pbv2-production-body">
        <strong>
          P{index + 1} · {PAGE_TYPE_LABEL[page.type] || page.type}
          {poseInfo ? ` — ${poseInfo.zh}` : ''}
          {poseMissing && <em className="yoga-pose-warning"> 动作页未选体式</em>}
        </strong>
        <div className="pbv2-form-grid two">
          <label className="pbv2-field">
            <span>页面类型</span>
            <select value={page.type} onChange={(e) => onPageChange(page.id, { type: e.target.value })}>
              {Object.entries(PAGE_TYPE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="pbv2-field">
            <span>瑜伽动作</span>
            <select value={poseValue} onChange={(e) => onPageChange(page.id, { pose: e.target.value || null })}>
              <option value="">无</option>
              {YOGA_POSES.map((pose) => (
                <option key={pose.en} value={pose.en}>{pose.zh}（{pose.en}｜{'★'.repeat(pose.level)}）</option>
              ))}
            </select>
          </label>
        </div>
        {poseInfo && <p className="yoga-pose-desc">体式形态：{poseInfo.body}</p>}
        <Field label="英文字幕" value={page.subtitle} onChange={(v) => onPageChange(page.id, { subtitle: v })} />
        <Field area label="画面描述" value={page.imagePrompt} onChange={(v) => onPageChange(page.id, { imagePrompt: v })} />
        <Field area label="教师引导词" value={page.teacherLang} onChange={(v) => onPageChange(page.id, { teacherLang: v })} />
        <button type="button" className="pbv2-ghost" onClick={() => onRemove(page.id)}>
          <Trash2 size={14} /> 删除此页
        </button>
      </div>
    </article>
  );
}

// ── 制作插图卡片（step 4）───────────────────────────────────
const PRODUCTION_TONES = ['yellow', 'blue', 'green', 'coral'];

function ProductionCard({ page, index, onPageChange, onGenerateOne }) {
  return (
    <article className={`pbv2-production-card yoga-make-card pbv2-tone-${PRODUCTION_TONES[index % PRODUCTION_TONES.length]}`}>
      <div className="pbv2-preview">
        {page.status === 'generating' ? (
          <div className="pbv2-generating"><Loader2 className="spin" size={24} /> 生成中…</div>
        ) : page.img ? (
          <img src={page.img} alt={`P${index + 1}`} />
        ) : (
          <div className="pbv2-placeholder"><ImageIcon size={24} /> 未生成</div>
        )}
      </div>
      <div className="pbv2-production-body">
        <strong>P{index + 1} · {PAGE_TYPE_LABEL[page.type] || page.type}{page.pose ? ` — ${findYogaPose(page.pose)?.zh || page.pose}` : ''}</strong>
        <label className="pbv2-field">
          <span>瑜伽动作</span>
          <select value={page.pose || ''} onChange={(e) => onPageChange(page.id, { pose: e.target.value || null })}>
            <option value="">无</option>
            {YOGA_POSES.map((pose) => (
              <option key={pose.en} value={pose.en}>{pose.zh}（{pose.en}｜{'★'.repeat(pose.level)}）</option>
            ))}
          </select>
        </label>
        <Field label="英文字幕" value={page.subtitle} onChange={(v) => onPageChange(page.id, { subtitle: v })} />
        <Field area label="画面描述" value={page.imagePrompt} onChange={(v) => onPageChange(page.id, { imagePrompt: v })} />
        {page.error && <em>{page.error}</em>}
        <div className="pbv2-card-actions">
          <button type="button" disabled={page.status === 'generating'} onClick={() => onGenerateOne(page)}>
            {page.status === 'generating' ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}
            生成或调整
          </button>
        </div>
      </div>
    </article>
  );
}

// ── 授课模式：应用内全屏播放（同绘本），键盘 ←/→ 翻页、Esc 退出 ──
function YogaPresentation({ pages, index, setPageIndex, onExit }) {
  const page = pages[index];
  if (!page) return null;
  return (
    <div className="pbv2-presentation">
      <button type="button" className="pbv2-presentation-exit" onClick={onExit} aria-label="exit">
        <X size={24} />
      </button>
      <button
        type="button"
        className="pbv2-presentation-nav pbv2-presentation-prev"
        onClick={() => setPageIndex(Math.max(0, index - 1))}
        disabled={index === 0}
        aria-label="previous"
      >
        <ChevronLeft size={48} />
      </button>
      <div className="pbv2-presentation-stage">
        {page.img ? (
          <img src={page.img} alt={`Page ${index + 1}`} />
        ) : (
          <div className="pbv2-presentation-placeholder"><ImageIcon size={64} /></div>
        )}
      </div>
      <button
        type="button"
        className="pbv2-presentation-nav pbv2-presentation-next"
        onClick={() => setPageIndex(Math.min(pages.length - 1, index + 1))}
        disabled={index === pages.length - 1}
        aria-label="next"
      >
        <ChevronRight size={48} />
      </button>
      {page.subtitle ? <div className="pbv2-presentation-text">{page.subtitle}</div> : null}
      <div className="pbv2-presentation-counter">{index + 1} / {pages.length}</div>
    </div>
  );
}

export function YogaStudioPage() {
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
  const [showPresent, setShowPresent] = React.useState(false);
  const [presentIndex, setPresentIndex] = React.useState(0);

  React.useEffect(() => {
    if (!showPresent) return undefined;
    const handler = (event) => {
      if (event.key === 'ArrowLeft') setPresentIndex((i) => Math.max(0, i - 1));
      else if (event.key === 'ArrowRight') setPresentIndex((i) => Math.min(pages.length - 1, i + 1));
      else if (event.key === 'Escape') setShowPresent(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showPresent, pages.length]);

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
      const work = await createCreativeWork({ moduleId: MODULE_ID, moduleName: MODULE_NAME, title: '未命名情境瑜伽', parameters: initialBasicInfo });
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
      window.alert(err.message || '创建失败，请重试');
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
      setSaveState(`已保存 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`);
    } catch (err) {
      setSaveState('保存失败');
      setMessage(err.message || '保存失败，请重试');
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
      await updateCreativeWork(id, { title: (basicInfo.themes || [])[0] || basicInfo.goals?.slice(0, 20) || '未命名情境瑜伽', parameters: toServerParams(basicInfo) });
      const data = await generateCreativeWorkPlan(id);
      setPlan({ ...initialPlan, ...data.plan });
      if (data.title) setWorkTitle(data.title);
      setStep(1);
    } catch (err) {
      setMessage(err.message || '方案生成失败，请重试');
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
      setMessage(err.message || '方案生成失败，请重试');
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
      setMessage(err.message || '逐页设计生成失败，请重试');
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
      setSaveState(`已保存 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`);
    } catch {
      setSaveState('保存失败');
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
            fallbackError: '图片生成失败',
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
          rejectedByPage.set(fallbackPage, resultForAsset.reason?.message || '图片生成失败');
        }
      });
      const finalPages = sourcePages.map((page) => {
        const url = fulfilledByPage.get(page.page);
        if (url) return { ...page, img: url, status: 'done', error: '' };
        if (page.img) return { ...page, status: 'done', error: '' };
        return { ...page, status: 'placeholder', error: rejectedByPage.get(page.page) || '图片生成超时，请单独重试' };
      });
      setPages(finalPages);
      await savePagesSilently(finalPages);
    } catch (error) {
      setPages((current) => current.map((page) => ({ ...page, status: page.img ? 'done' : 'placeholder', error: error.message })));
      setMessage(error.message || '批量生成失败，请重试');
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
        fallbackError: '图片生成失败',
      });
      const finalPages = pages.map((page) => (page.id === targetPage.id ? {
        ...page,
        img: url || page.img,
        status: url ? 'done' : 'placeholder',
        error: url ? '' : '图片生成超时，请重试',
      } : page));
      setPages(finalPages);
      if (url) await savePagesSilently(finalPages);
    } catch (error) {
      updatePage(targetPage.id, { status: 'placeholder', error: error.message || '图片生成失败，请重试' });
    }
  };

  // ── 列表操作 ─────────────────────────────────────────────
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

  // 列表卡片「授课」：直接用已保存的页面进入应用内全屏演示
  const presentFromList = (work) => {
    setPages(hydratePages(work.result?.pages));
    setPresentIndex(0);
    setShowPresent(true);
  };
  const presentOverlay = showPresent && pages.length > 0 ? (
    <YogaPresentation pages={pages} index={presentIndex} setPageIndex={setPresentIndex} onExit={() => setShowPresent(false)} />
  ) : null;

  // ── 列表视图 ─────────────────────────────────────────────
  if (view === 'list') {
    return (
      <main className="picture-book-studio-v2">
        <div className="pbv2-list-page" style={{ '--cw-accent': ACCENT }}>
          <header className="pbv2-topbar">
            <div className="pbv2-topbar-left">
              <div className="pbv2-topbar-icon"><Dumbbell size={28} /></div>
              <div>
                <h1>{MODULE_NAME}</h1>
                <p>身体叙事 × 情境探索 × 英语内化，AI 生成带插图的授课课件</p>
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
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜索作品或情境主题…" />
            </div>
          </div>

          {message && <div className="pbv2-message">{message}</div>}

          {listLoading ? (
            <div className="pbv2-list-loading"><Loader2 className="spin" size={28} /></div>
          ) : filtered.length === 0 ? (
            <div className="pbv2-list-empty">
              <Dumbbell size={48} />
              <p>{searchTerm ? '没有匹配的作品' : '还没有作品，点击「新建作品」开始创作'}</p>
            </div>
          ) : (
            <div className="pbv2-card-grid">
              {filtered.map((work) => {
                const resultPages = Array.isArray(work.result?.pages) ? work.result.pages : [];
                const imageCount = resultPages.filter((p) => p.img).length;
                const statusLabel = resultPages.length === 0 ? '草稿' : (imageCount >= resultPages.length ? '已生成' : `插图 ${imageCount}/${resultPages.length}`);
                return (
                  <article key={work.id} className="pbv2-book-card" onClick={() => openWork(work)}>
                    <div className="pbv2-book-cover exp-cover">
                      <Dumbbell size={52} />
                      <span className={`pbv2-book-status ${imageCount >= resultPages.length && resultPages.length > 0 ? 'published' : 'draft'}`}>
                        {statusLabel}
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
                        {resultPages.length > 0 && (
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
        {presentOverlay}
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
            <h1>{workTitle || '新建情境瑜伽作品'}</h1>
            <p>按绘本制作流程完成：基本信息 → 活动方案 → 页面设计 → 制作插图</p>
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
            <button type="button" key={label} className={`${step === index ? 'is-active' : ''} ${step > index ? 'is-done' : ''}`} onClick={() => setStep(index)}>
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
                <OptionGroup label="年龄段" options={AGE_OPTIONS} value={basicInfo.age} onChange={(v) => setBasicInfo({ ...basicInfo, age: v })} tone="coral" />
                <OptionGroup label="时长范围" options={DURATION_OPTIONS} value={basicInfo.duration} onChange={(v) => setBasicInfo({ ...basicInfo, duration: v })} tone="green" />
              </div>
              <section className="pbv2-card pbv2-tone-coral">
                <div className="pbv2-card-title">情境主题（可多选）</div>
                <OptionGroup options={THEME_OPTIONS} multiple value={basicInfo.themes} onChange={(themes) => setBasicInfo({ ...basicInfo, themes })} tone="coral" />
              </section>
              <section className="pbv2-card pbv2-tone-green">
                <div className="pbv2-card-title">道具偏好（可多选，未选则默认无道具）</div>
                <OptionGroup options={PROP_OPTIONS} multiple value={basicInfo.props} onChange={(props) => setBasicInfo({ ...basicInfo, props })} tone="green" />
              </section>
              <section className="pbv2-card pbv2-tone-blue">
                <div className="pbv2-card-title">目标语言（必填）</div>
                <Field area label="目标词汇与句型" value={basicInfo.goals} onChange={(v) => setBasicInfo({ ...basicInfo, goals: v })} placeholder="例如：ocean, wave, What can you see?" />
              </section>
              <section className="pbv2-card pbv2-tone-green">
                <div className="pbv2-card-title">特殊要求（选填）</div>
                <Field area label="补充说明" value={basicInfo.requirements} onChange={(v) => setBasicInfo({ ...basicInfo, requirements: v })} placeholder="角色、道具或体式偏好" />
              </section>
              <footer className="pbv2-actions">
                <ChevronRight size={16} />
                <button type="button" className="pbv2-primary" disabled={!basicReady || planGenerating} onClick={generatePlanAndAdvance}>
                  {planGenerating ? <Loader2 className="spin" size={16} /> : <Wand2 size={16} />}
                  {planGenerating ? 'AI 生成中…' : 'AI 生成活动方案'}
                </button>
              </footer>
            </div>
          )}

          {/* step 2 · 活动方案 */}
          {step === 1 && (
            <div className="pbv2-step-panel">
              <section className="pbv2-plan-block pbv2-tone-coral">
                <div className="pbv2-form-grid three">
                  <Field label="英文活动标题" value={plan.storyTitleEn} onChange={(v) => setPlan({ ...plan, storyTitleEn: v })} />
                  <Field label="中文标题" value={plan.storyTitleZh} onChange={(v) => setPlan({ ...plan, storyTitleZh: v })} />
                  <Field label="建议页数" value={plan.recommendedPageCount} onChange={(v) => setPlan({ ...plan, recommendedPageCount: v })} />
                </div>
                <Field area label="情境旅程故事" value={plan.storyContent} onChange={(v) => setPlan({ ...plan, storyContent: v })} />
              </section>
              <section className="pbv2-card pbv2-tone-yellow">
                <div className="pbv2-card-title">活动目标</div>
                <div className="pbv2-form-grid three">
                  <Field area label="英语目标" value={plan.englishGoal} onChange={(v) => setPlan({ ...plan, englishGoal: v })} />
                  <Field area label="身心目标" value={plan.wellbeingGoal} onChange={(v) => setPlan({ ...plan, wellbeingGoal: v })} />
                  <Field area label="产出目标" value={plan.outputGoal} onChange={(v) => setPlan({ ...plan, outputGoal: v })} />
                </div>
              </section>
              <section className="pbv2-plan-block pbv2-tone-green">
                <Field area label="所需材料" value={plan.materials} onChange={(v) => setPlan({ ...plan, materials: v })} />
              </section>
              <footer className="pbv2-actions">
                <button type="button" className="pbv2-ghost" onClick={() => setStep(0)}>返回基本信息</button>
                <button type="button" className="pbv2-ghost" disabled={planGenerating} onClick={generatePlan}>
                  {planGenerating ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
                  {planGenerating ? 'AI 生成中…' : 'AI 重新生成方案'}
                </button>
                <button type="button" className="pbv2-primary" disabled={saving} onClick={savePlan}>
                  <Save size={16} /> 保存并设计页面
                </button>
              </footer>
            </div>
          )}

          {/* step 3 · 页面设计 */}
          {step === 2 && (
            <div className="pbv2-step-panel">
              <p className="yoga-design-hint">动作页必须选择「瑜伽动作」：插图中角色会清楚示范该体式的身体动作（图内不带任何文字）。「画面描述」是 AI 插图的依据，动作页请写清该体式的身体动作；「英文字幕」在授课模式叠加显示，不会画进图中。</p>
              <div className="pbv2-page-list">
                {pages.map((page, index) => (
                  <PageDesignCard key={page.id} page={page} index={index} onPageChange={updatePage} onRemove={removePage} />
                ))}
              </div>
              {pages.length === 0 && (
                <div className="pbv2-list-empty">
                  <Dumbbell size={48} />
                  <p>还没有页面设计，点击「AI 生成逐页设计」自动产出，或手动添加</p>
                </div>
              )}
              <button type="button" className="pbv2-add-page" onClick={addPage}>
                <Plus size={16} /> 添加一页
              </button>
              <footer className="pbv2-actions">
                <button type="button" className="pbv2-ghost" onClick={() => setStep(1)}>返回方案</button>
                <button type="button" className="pbv2-primary" disabled={designGenerating} onClick={generateDesign}>
                  {designGenerating ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                  {designGenerating ? 'AI 生成中…' : 'AI 生成逐页设计'}
                </button>
                <button type="button" className="pbv2-primary" disabled={pages.length === 0 || saving} onClick={savePages}>
                  <Save size={16} /> 保存并制作插图
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
                  {generatingAll ? '正在批量生成…' : '重新生成全部图片'}
                </button>
                <button type="button" className="pbv2-ghost" onClick={() => { setPresentIndex(0); setShowPresent(true); }} disabled={!pages.length}>
                  🖥️ 授课模式
                </button>
                <button type="button" className="pbv2-ghost" onClick={() => setStep(2)}>返回页面设计</button>
              </div>
              <div className="pbv2-page-list">
                {pages.map((page, index) => (
                  <ProductionCard key={page.id} page={page} index={index} onPageChange={updateMadePage} onGenerateOne={generateOneImage} />
                ))}
              </div>
              <p className="yoga-making-hint">插图说明：动作页的角色会清楚示范对应瑜伽体式的身体动作，图内不带任何文字；英文字幕在授课模式下叠加显示。对某页不满意时，直接修改该页的「瑜伽动作」「画面描述」或「英文字幕」（自动保存），再点「生成或调整」即按新内容重绘。批量生成约需 1-3 分钟。</p>
            </div>
          )}
        </section>
      </div>
      {presentOverlay}
    </main>
  );
}

export default YogaStudioPage;
