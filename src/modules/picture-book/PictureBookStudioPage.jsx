import React from 'react';
import {
  BookOpenText,
  ChevronRight,
  Image,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import apiService from '../../services/api';
import './PictureBookStudioPage.css';

const ageOptions = ['4-6岁', '7-9岁', '10-12岁', '13-15岁'];
const levelOptions = ['零基础', '初级（会字母和简单词）', '中级（能简单对话）', '高级（能阅读和表达）'];
const participantOptions = ['单人', '小组（2-4人）', '大组（5-10人）', '班级（10+）'];
const durationOptions = ['5分钟', '10分钟', '15分钟', '30分钟', '45分钟', '60分钟'];
const themeOptions = ['情绪表达', '自然探索', '自我认知', '人际关系', '家庭与归属', '成长与变化', '感恩与善意', '身体与感知', '动物与生命', '勇气与冒险'];
const materialOptions = ['画纸', '彩笔/蜡笔', '水彩', '黏土/橡皮泥', '拼贴材料（杂志/彩纸/胶水）', '自然材料（树叶/石头）', '回收材料（纸盒/瓶盖）', '毛线/布料', '印章/印泥'];

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

function joinWithOther(list, other) {
  return [...list, String(other || '').trim()].filter(Boolean).join('、');
}

function getSelectedTheme(info) {
  return info.themes[0] || info.themeOther || '情绪表达';
}

function getMaterialsText(info) {
  return joinWithOther(info.materials, info.materialOther) || '画纸、彩笔/蜡笔';
}

function buildActivityPlan(info) {
  const theme = getSelectedTheme(info);
  const vocab = info.vocabulary || (theme === '自然探索' ? 'leaf, stone, tree, bug, river' : 'happy, sad, calm, brave, friend');
  const grammar = info.grammar || (theme === '自然探索' ? 'I can see... / It is...' : 'My friend is/feels... / My friend has...');
  const materialText = getMaterialsText(info);
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
  };
  const [storyTitleEn, storyTitleZh] = titleMap[theme] || ['My Picture Book Adventure', '我的绘本冒险'];

  return {
    storyTitleEn,
    storyTitleZh,
    storyContent: `孩子们在“${theme}”主题故事中遇到一个需要被理解的小角色。大家通过观察、表达和创作，帮助它把看不见的感受或想法变成可以分享的图像，并用简单英文完成介绍。`,
    englishGoal: `使用核心词汇：${vocab}；使用核心句型/语法：${grammar}；能听懂并回应与作品相关的简单提问。`,
    wellbeingGoal: '将内在感受外化为可被看见的形象；在表达和协作中体验被理解、被接纳和共同创造的联结感。',
    outputGoal: theme === '自然探索' ? '一页自然发现绘本和一张自然观察作品' : '一本小组绘本和一张主题创作海报',
    materials: materialText,
  };
}

function buildPictureBookPages(plan, info) {
  const title = plan.storyTitleEn || 'My Picture Book';
  const vocab = info.vocabulary || 'happy, sad, calm, brave, friend';
  const grammar = info.grammar || 'My friend is/feels...';
  const pages = [
    {
      imageDescription: `封面。温暖的儿童绘本场景，主角站在明亮的创作桌前，周围有${plan.materials || '画纸和彩笔'}，画面留有标题空间。`,
      text: `${title}\n${plan.storyTitleZh || '我的绘本'}`,
    },
    {
      imageDescription: '故事开始。主角发现一个小小的线索或朋友，表情好奇，场景清晰、温柔，有适合儿童观察的细节。',
      text: 'I see a little friend.',
    },
    {
      imageDescription: `语言探索页。画面呈现核心词汇对应的物品或感受：${vocab}。不要把词写进图片，只呈现可观察的画面。`,
      text: `My friend has ${vocab.split(/[,，、\s]+/).filter(Boolean)[0] || 'colors'}.`,
    },
    {
      imageDescription: `表达练习页。主角和同伴一起使用句型“${grammar}”表达观察或感受，画面有互动但不要出现文字气泡。`,
      text: info.grammar ? info.grammar.split(/[;；。]/)[0] : 'My friend feels happy.',
    },
    {
      imageDescription: `活动创作页。孩子们使用${plan.materials || '画纸和彩笔'}制作产出物：${plan.outputGoal || '一张主题海报'}，构图有合作感。`,
      text: 'We make it together.',
    },
    {
      imageDescription: '结尾展示页。孩子们展示作品，主角被看见和接纳，画面有成就感、联结感和温暖的课堂氛围。',
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

async function resolveGeneratedAsset(asset) {
  const directUrl = pickUrl(asset);
  if (directUrl) return directUrl;
  const statusUrl = getStatusUrl(asset);
  if (!statusUrl) return '';

  for (let attempt = 0; attempt < 18; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, attempt < 2 ? 1200 : 3000));
    const status = await apiService.request(statusUrl);
    const url = pickUrl(status);
    if (url) return url;
    if (['failed', 'error'].includes(String(status?.status || '').toLowerCase())) {
      throw new Error(status?.error || '图片生成失败');
    }
  }
  return '';
}

export function PictureBookStudioPage() {
  const { i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const [step, setStep] = React.useState(0);
  const [basicInfo, setBasicInfo] = React.useState(initialBasicInfo);
  const [activityPlan, setActivityPlan] = React.useState(initialActivityPlan);
  const [pages, setPages] = React.useState([]);
  const [makeMode, setMakeMode] = React.useState('all');
  const [generatingAll, setGeneratingAll] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const steps = [
    '基础信息',
    '活动方案',
    '绘本设计',
    '绘本制作',
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

  const buildPlan = () => {
    if (!canBuildPlan) {
      setMessage('请先选择学生年龄和英文水平。');
      return;
    }
    const nextPlan = buildActivityPlan(basicInfo);
    setActivityPlan(nextPlan);
    setPages([]);
    setMessage('');
    setStep(1);
  };

  const buildDesign = () => {
    const nextPages = buildPictureBookPages(activityPlan, basicInfo);
    setPages(nextPages);
    setMessage('');
    setStep(2);
  };

  const addPage = () => {
    setPages((current) => [
      ...current,
      {
        id: `page-${Date.now()}`,
        page: current.length + 1,
        imageDescription: '新增页面图片描述。',
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
    assetName: '绘本批量图片',
    prompt: `${activityPlan.storyTitleEn} ${activityPlan.storyTitleZh}\n${activityPlan.storyContent}`,
    options: {
      imageRatio: '16:9',
      imageStyle: 'Watercolor Picture Book',
      batchItems: pages.map((page) => ({
        page: page.page,
        title: `${activityPlan.storyTitleEn || 'Picture Book'} · Page ${page.page}`,
        text: `${page.imageDescription}\nPage text: ${page.text}`,
      })),
      rawValues: {
        storybookTitle: activityPlan.storyTitleEn || activityPlan.storyTitleZh || 'Picture Book',
        storybookContent: pages.map((page) => page.text).join('\n'),
        storybookStyle: 'Watercolor Picture Book',
        storybookGrade: basicInfo.age || '7-9岁',
      },
    },
  });

  const generateAllImages = async () => {
    if (pages.length < 2) {
      setMessage('至少需要 2 页绘本设计才能批量生成图片。');
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
      const urls = await Promise.all(assets.map(resolveGeneratedAsset));
      setPages((current) => current.map((page, index) => ({
        ...page,
        imageUrl: urls[index] || page.imageUrl,
        status: urls[index] ? 'done' : 'placeholder',
        error: urls[index] ? '' : '图片任务已提交，请稍后单页刷新或重新生成。',
      })));
      setStep(3);
    } catch (error) {
      setPages((current) => current.map((page) => ({ ...page, status: page.imageUrl ? 'done' : 'placeholder', error: error.message })));
      setMessage(error.message || '批量生成失败。');
    } finally {
      setGeneratingAll(false);
    }
  };

  const generateOneImage = async (targetPage) => {
    updatePage(targetPage.id, { status: 'generating', error: '' });
    try {
      const prompt = [
        `Children picture-book illustration for page ${targetPage.page}.`,
        `Story title: ${activityPlan.storyTitleEn || activityPlan.storyTitleZh || 'Picture Book'}.`,
        `Image description: ${targetPage.imageDescription}.`,
        `Page text context: ${targetPage.text}.`,
        'Warm classroom-ready picture-book style, consistent soft watercolor palette, no watermark.',
      ].join(' ');
      const result = await apiService.request('/api/ai/generate-ppt-asset', {
        method: 'POST',
        body: JSON.stringify({
          assetType: 'image',
          assetCode: 'B4',
          assetName: `绘本第 ${targetPage.page} 页`,
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
      const url = await resolveGeneratedAsset(result.asset || result.assets?.[0] || result);
      updatePage(targetPage.id, {
        imageUrl: url,
        status: url ? 'done' : 'placeholder',
        error: url ? '' : '图片任务已提交，请稍后重试。',
      });
    } catch (error) {
      updatePage(targetPage.id, { status: 'placeholder', error: error.message || '单页生成失败。' });
    }
  };

  const uploadPageImage = (page, file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    updatePage(page.id, { imageUrl: url, status: 'done', error: '' });
  };

  const enterMaking = (mode) => {
    setMakeMode(mode);
    setStep(3);
    if (mode === 'all') generateAllImages();
  };

  return (
    <main className="picture-book-studio-v2">
      <header className="pbv2-topbar">
        <div className="pbv2-topbar-left">
          <div className="pbv2-topbar-icon">
            <BookOpenText size={28} />
          </div>
          <div>
            <h1>{isEn ? 'Picture Book Studio' : '绘本制作'}</h1>
            <p>设计适合课堂使用的英文幸福力绘本</p>
          </div>
        </div>
      </header>

      <div className="pbv2-shell">
        <aside className="pbv2-steps">
          {steps.map((label, index) => (
            <button
              type="button"
              key={label}
              className={`${step === index ? 'is-active' : ''} ${step > index ? 'is-done' : ''}`}
              onClick={() => setStep(index)}
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
            />
          )}

          {step === 1 && (
            <ActivityPlanStep
              activityPlan={activityPlan}
              setPlanField={setPlanField}
              onBack={() => setStep(0)}
              onBuildDesign={buildDesign}
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
              makeMode={makeMode}
              setMakeMode={setMakeMode}
              onBack={() => setStep(2)}
              onGenerateAll={generateAllImages}
              onGenerateOne={generateOneImage}
              onUpload={uploadPageImage}
              generatingAll={generatingAll}
            />
          )}
        </section>
      </div>
    </main>
  );
}

function BasicInfoStep({ basicInfo, setBasicField, buildPlan, canBuildPlan }) {
  return (
    <div className="pbv2-step-panel">
      <div className="pbv2-form-grid two">
        <OptionGroup tone="coral" required label="学生年龄" options={ageOptions} value={basicInfo.age} onChange={(value) => setBasicField('age', value)} />
        <OptionGroup tone="blue" required label="英文水平" options={levelOptions} value={basicInfo.level} onChange={(value) => setBasicField('level', value)} />
        <OptionGroup tone="yellow" label="参与人数" options={participantOptions} value={basicInfo.participants} onChange={(value) => setBasicField('participants', value)} />
        <OptionGroup tone="green" label="活动时长" options={durationOptions} value={basicInfo.duration} onChange={(value) => setBasicField('duration', value)} />
      </div>

      <CheckboxGroup
        tone="yellow"
        label="活动主题偏好"
        options={themeOptions}
        value={basicInfo.themes}
        otherValue={basicInfo.themeOther}
        onToggle={(value) => setBasicField('themes', toggleList(basicInfo.themes, value))}
        onOther={(value) => setBasicField('themeOther', value)}
      />

      <CheckboxGroup
        tone="green"
        label="可用物料"
        options={materialOptions}
        value={basicInfo.materials}
        otherValue={basicInfo.materialOther}
        onToggle={(value) => setBasicField('materials', toggleList(basicInfo.materials, value))}
        onOther={(value) => setBasicField('materialOther', value)}
      />

      <section className="pbv2-card pbv2-tone-blue">
        <div className="pbv2-card-title">语言目标（非必填）</div>
        <div className="pbv2-form-grid two">
          <Field label="核心词汇" value={basicInfo.vocabulary} onChange={(value) => setBasicField('vocabulary', value)} placeholder="例如：happy, sad, body, friend" />
          <Field label="核心句型/语法" value={basicInfo.grammar} onChange={(value) => setBasicField('grammar', value)} placeholder="例如：My friend has... / My friend is..." />
        </div>
      </section>

      <FooterActions>
        <button type="button" className="pbv2-primary" disabled={!canBuildPlan} onClick={buildPlan}>
          <Wand2 size={16} />
          生成活动方案
        </button>
      </FooterActions>
    </div>
  );
}

function ActivityPlanStep({ activityPlan, setPlanField, onBack, onBuildDesign }) {
  return (
    <div className="pbv2-step-panel">
      <section className="pbv2-plan-block pbv2-tone-coral">
        <div className="pbv2-form-grid two">
          <Field label="故事名称（英文）" value={activityPlan.storyTitleEn} onChange={(value) => setPlanField('storyTitleEn', value)} />
          <Field label="故事名称（中文）" value={activityPlan.storyTitleZh} onChange={(value) => setPlanField('storyTitleZh', value)} />
        </div>
        <Field area label="故事内容" value={activityPlan.storyContent} onChange={(value) => setPlanField('storyContent', value)} />
      </section>
      <section className="pbv2-card pbv2-tone-yellow">
        <div className="pbv2-card-title">活动目标</div>
        <div className="pbv2-form-grid three">
          <Field area label="英文" value={activityPlan.englishGoal} onChange={(value) => setPlanField('englishGoal', value)} />
          <Field area label="幸福力" value={activityPlan.wellbeingGoal} onChange={(value) => setPlanField('wellbeingGoal', value)} />
          <Field area label="产出物" value={activityPlan.outputGoal} onChange={(value) => setPlanField('outputGoal', value)} />
        </div>
      </section>
      <section className="pbv2-plan-block pbv2-tone-green">
        <Field area label="物料" value={activityPlan.materials} onChange={(value) => setPlanField('materials', value)} />
      </section>
      <FooterActions>
        <button type="button" className="pbv2-ghost" onClick={onBack}>返回基础信息</button>
        <button type="button" className="pbv2-primary" onClick={onBuildDesign}>
          <BookOpenText size={16} />
          生成绘本设计
        </button>
      </FooterActions>
    </div>
  );
}

function PictureBookDesignStep({ pages, updatePage, addPage, removePage, onBack, onMake, generatingAll }) {
  return (
    <div className="pbv2-step-panel">
      <div className="pbv2-page-list">
        {pages.map((page, index) => (
          <PageDesignCard key={page.id} page={page} toneIndex={index} updatePage={updatePage} removePage={removePage} />
        ))}
      </div>
      <button type="button" className="pbv2-add-page" onClick={addPage}>
        <Plus size={16} />
        添加一页
      </button>
      <FooterActions>
        <button type="button" className="pbv2-ghost" onClick={onBack}>返回活动方案</button>
        <button type="button" className="pbv2-secondary" onClick={() => onMake('placeholder')}>
          <Image size={16} />
          先生成占位符
        </button>
        <button type="button" className="pbv2-primary" disabled={generatingAll} onClick={() => onMake('all')}>
          {generatingAll ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
          一次性生成所有图片
        </button>
      </FooterActions>
    </div>
  );
}

function PictureBookMakingStep({ pages, updatePage, makeMode, setMakeMode, onBack, onGenerateAll, onGenerateOne, onUpload, generatingAll }) {
  return (
    <div className="pbv2-step-panel">
      <div className="pbv2-making-toolbar">
        <button type="button" className="pbv2-primary" disabled={generatingAll} onClick={onGenerateAll}>
          {generatingAll ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
          重新生成全部图片
        </button>
        <button type="button" className="pbv2-ghost" onClick={onBack}>返回绘本设计</button>
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
  const tones = ['yellow', 'blue', 'green', 'coral'];
  return (
    <article className={`pbv2-page-card pbv2-tone-${tones[toneIndex % tones.length]}`}>
      <div className="pbv2-page-card-head">
        <strong>第 {page.page} 页</strong>
        <button type="button" onClick={() => removePage(page.id)}><Trash2 size={15} /></button>
      </div>
      <Field area label="图片描述" value={page.imageDescription} onChange={(value) => updatePage(page.id, { imageDescription: value })} />
      <Field area label="文字" value={page.text} onChange={(value) => updatePage(page.id, { text: value })} />
    </article>
  );
}

function ProductionCard({ page, toneIndex, updatePage, onGenerateOne, onUpload }) {
  const tones = ['yellow', 'blue', 'green', 'coral'];
  return (
    <article className={`pbv2-production-card pbv2-tone-${tones[toneIndex % tones.length]}`}>
      <div className="pbv2-preview">
        {page.status === 'generating' ? (
          <div className="pbv2-generating"><Loader2 className="spin" size={24} />生成中</div>
        ) : page.imageUrl ? (
          <img src={page.imageUrl} alt={`第 ${page.page} 页`} />
        ) : (
          <div className="pbv2-placeholder"><Image size={24} />图片占位符</div>
        )}
      </div>
      <div className="pbv2-production-body">
        <strong>第 {page.page} 页</strong>
        <textarea value={page.imageDescription} onChange={(event) => updatePage(page.id, { imageDescription: event.target.value })} />
        <input value={page.text} onChange={(event) => updatePage(page.id, { text: event.target.value })} />
        {page.error && <em>{page.error}</em>}
        <div className="pbv2-card-actions">
          <button type="button" onClick={() => onGenerateOne(page)} disabled={page.status === 'generating'}>
            {page.status === 'generating' ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}
            生成/调整图片
          </button>
          <label>
            <Upload size={14} />
            手动上传
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
