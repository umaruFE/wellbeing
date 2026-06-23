import React from 'react';
import { Input, message } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  CircleDot,
  Dumbbell,
  FishSymbol,
  Gamepad2,
  Gift,
  MessageSquareText,
  Music,
  Palette,
  Sparkles,
  Sprout,
  Table2,
} from 'lucide-react';
import poppy from '../../../../assets/ip/poppy.png';
import edi from '../../../../assets/ip/edi.png';
import rolly from '../../../../assets/ip/rolly.png';
import milo from '../../../../assets/ip/milo.png';
import ace from '../../../../assets/ip/ace.png';
import apiService from '../../../../utils/apiService';
import {
  characterOptions,
  getActionOptions,
  getActivityThemes,
  getChartOptions,
  getComicStyles,
  getImageSpecificFields,
  getRatioOptions,
  getStyleOptions,
  getWhitespaceOptions,
} from './assetPanelData';
import { FieldBlock, OptionGrid, PromptField, Tip } from './AssetControls';
import { GenerationProgress } from './GenerationProgress';
import { GeneratedAssetResults } from './GeneratedAssetResults';

function ImageSpecificOptions({ asset, values, setValue }) {
  const { t } = useTranslation();
  const whitespaceOpts = getWhitespaceOptions(t);
  const activityThemeOpts = getActivityThemes(t);
  const chartOpts = getChartOptions(t);
  const ratioOpts = getRatioOptions(t);
  const comicStyleOpts = getComicStyles(t);
  const actionOpts = getActionOptions(t);

  if (asset.code === 'B4') {
    return (
      <FieldBlock label={t('assetPanel.wsTop')}>
        <OptionGrid options={whitespaceOpts} value={values.whitespace} onChange={(value) => setValue('whitespace', value)} columns={4} />
      </FieldBlock>
    );
  }
  if (asset.code === 'B5') {
    return (
      <FieldBlock label={t('assetPanel.iwActivityTheme')}>
        <OptionGrid options={activityThemeOpts} value={values.theme} onChange={(value) => setValue('theme', value)} columns={4} />
      </FieldBlock>
    );
  }
  if (asset.code === 'B8') {
    return (
      <>
        <FieldBlock label={t('assetPanel.iwChartType')}>
          <OptionGrid options={chartOpts} value={values.chart} onChange={(value) => setValue('chart', value)} columns={4} />
        </FieldBlock>
        <FieldBlock label={t('assetPanel.iwOutputDirection')}>
          <OptionGrid options={ratioOpts.slice(0, 2)} value={values.ratio} onChange={(value) => setValue('ratio', value)} columns={2} />
        </FieldBlock>
      </>
    );
  }
  if (asset.code === 'B10') {
    return (
      <FieldBlock label={t('assetPanel.iwComicStyle')}>
        <OptionGrid options={comicStyleOpts} value={values.comicStyle} onChange={(value) => setValue('comicStyle', value)} columns={3} />
      </FieldBlock>
    );
  }
  if (asset.code === 'B11') {
    return (
      <>
        <FieldBlock label={t('assetPanel.iwIpCharacter')}>
          <OptionGrid options={characterOptions} value={values.character} onChange={(value) => setValue('character', value)} columns={5} />
        </FieldBlock>
        <FieldBlock label={t('assetPanel.iwSelectedActions')}>
          <OptionGrid options={actionOpts} value={values.action} onChange={(value) => setValue('action', value)} columns={2} />
        </FieldBlock>
      </>
    );
  }
  return null;
}

const imageRatioSets = {
  B1: ['16:9', '4:3', '1:1', '9:16'],
  B2: ['16:9', '4:3', '1:1', '9:16'],
  B3: ['9:16', '3:4', '1:1', '16:9'],
  B4: ['16:9', '4:3', '1:1', '9:16'],
  B5: ['16:9', '4:3', '1:1', '9:16'],
  B7: ['16:9', '4:3', '1:1', '9:16'],
  B11: ['16:9', '4:3', '1:1', '9:16'],
  B13: ['16:9', '4:3', '1:1', '9:16'],
};

function getFocusedImageTitles(t) {
  return {
    B1: t('assetPanel.iwGenThemeScene'),
    B2: t('assetPanel.iwGenSceneWithText'),
    B3: t('assetPanel.iwFlashcard'),
    B4: t('assetPanel.iwStoryIllustration'),
    B5: t('assetPanel.iwActivityAtmosphere'),
    B6: t('assetPanel.iwThemeWordMap'),
    B7: t('assetPanel.iwTextIllustration'),
    B8: t('assetPanel.iwKnowledgeSummary'),
    B9: t('assetPanel.iwPictureBook'),
    B10: t('assetPanel.iwFourPanelComic'),
    B11: t('assetPanel.iwActionIllustration'),
    B13: t('assetPanel.iwIpScene'),
  };
}

function getActivityThemeCards(t) {
  return [
    { value: t('assetPanel.themeArt'), icon: Palette },
    { value: t('assetPanel.themeYoga'), icon: BookOpen },
    { value: t('assetPanel.themeFitness'), icon: Dumbbell },
    { value: t('assetPanel.themeMusic'), icon: Music },
    { value: t('assetPanel.themeGame'), icon: Gamepad2 },
    { value: t('assetPanel.themeShow'), icon: CircleDot },
    { value: t('assetPanel.themeCelebrate'), icon: Gift },
  ];
}

function getTextLayoutCards(t) {
  return [t('assetPanel.iwDialogueBubble'), t('assetPanel.iwScroll'), t('assetPanel.iwCardFrame')];
}

function getKnowledgeChartCards(t) {
  return [
    { value: t('assetPanel.chartMindMap'), icon: MessageSquareText },
    { value: t('assetPanel.chartTable'), icon: Table2 },
    { value: t('assetPanel.chartFishbone'), icon: FishSymbol },
    { value: t('assetPanel.chartTree'), icon: Sprout },
  ];
}

function getComicStyleCards(t) {
  return [t('assetPanel.comicCute'), t('assetPanel.comicAnime'), t('assetPanel.comicWestern')];
}

const ipCharacters = [
  { name: 'Poppy', image: poppy },
  { name: 'Edi', image: edi },
  { name: 'Rolly', image: rolly },
  { name: 'Milo', image: milo },
  { name: 'Ace', image: ace },
];

const imagePromptBuilders = {
  B1: (values) => `生成PPT主题意境背景图，无文字。场景：${values.scene || '儿童英语课堂主题场景'}。风格：${values.style}。`,
  B2: (values) => `生成PPT意境海报图，包含图文排版。场景：${values.scene || '课堂主题场景'}。叠加文字：${values.overlayText || '课程主题标题'}。风格：${values.style}。`,
  B3: (values) => `批量生成统一版式的词汇闪卡。词汇：${(values.flashWords || []).join(', ') || values.words || 'apple, banana'}。${values.includeChinese !== false ? '包含中文释义。' : '不包含中文释义。'}${values.includePhonetic ? '包含音标。' : ''}`,
  B4: (values) => `生成故事配图，预留${values.whitespace || '底部'}文字区域。故事场景：${values.storyScene || '儿童绘本故事场景'}。角色描述：${values.storyCharacter || '无指定角色'}。风格：${values.style}。`,
  B5: (values) => `生成活动氛围图。活动主题：${values.theme || '体能'}。活动标题：${values.activityTitle || '课堂活动'}。画面适合PPT课堂导入。风格：${values.style}。`,
  B6: (values) => `生成主题词图谱，场景词汇标注。场景：${values.topicScene || '课堂主题场景'}。标注词汇：${values.topicWords || '至少5个主题词汇'}。`,
  B7: (values) => `生成文本配图。文字框样式：${values.textLayout || '对话气泡'}。文字内容：${values.textContent || '课堂问题或短对话'}。背景：${values.textBackground || '课堂主题背景'}。风格：${values.style}。`,
  B8: (values) => `生成知识总结图。图表类型：${values.chart || '思维导图'}。中心主题：${values.knowledgeTopic || '课程知识点'}。分支内容：${values.knowledgeItems || '核心知识点列表'}。`,
  B9: (values) => `生成多页绘本故事配图，保持角色一致。故事名：${values.storybookTitle || '绘本故事'}。故事内容：${values.storybookContent || '儿童英语绘本故事'}。风格：${values.storybookStyle || '水彩绘本'}。阅读年级：${values.storybookGrade || '小学低年级'}。`,
  B10: (values) => `生成四格漫画，固定四格布局。漫画风格：${values.comicStyle || 'Q版萌系'}。${values.comicDialogue !== false ? '包含对话气泡文字。' : '不包含文字。'}目标短语/句型：${values.phrase || '课堂目标句型'}。主角：${values.comicCharacter || '儿童友好角色'}。情节：${values.plot || 'AI自动编排起承转合'}。`,
  B11: (values) => `生成动作示意图。IP角色：${values.character || 'Poppy'}。动作类型：${values.actionType || '瑜伽 / 姿势'}。动作：${(values.actions || [values.action]).filter(Boolean).join(', ')}。要求清晰展示动作姿态，适合TPR课堂。`,
};

function splitLines(text) {
  return String(text || '').split(/\n|,|，/).map((item) => item.trim()).filter(Boolean);
}

function buildBatchItems(asset, values) {
  if (asset.code === 'B3') {
    const words = splitLines(values.words);
    return words.length ? words : values.flashWords;
  }
  if (asset.code === 'B11') return values.actions?.length ? values.actions : [values.action].filter(Boolean);
  if (asset.code === 'B9') return splitLines(values.storybookContent).map((text, index) => ({ page: index + 1, text }));
  return undefined;
}

function buildImageGenerationRequest(asset, values) {
  const promptBuilder = imagePromptBuilders[asset.code] || imagePromptBuilders.B1;
  const batchItems = buildBatchItems(asset, values);
  return {
    assetType: 'image',
    assetCode: asset.code,
    assetName: asset.title,
    prompt: promptBuilder(values),
    options: {
      imageRatio: values.ratio,
      imageStyle: values.style,
      imageSubtype: asset.code,
      whitespace: values.whitespace,
      activityTheme: values.theme,
      chart: values.chart,
      comicStyle: values.comicStyle,
      character: values.character,
      actionType: values.actionType,
      batchItems,
      includeChinese: values.includeChinese !== false,
      includePhonetic: !!values.includePhonetic,
      comicDialogue: values.comicDialogue !== false,
      textLayout: values.textLayout,
      rawValues: values,
    },
  };
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function pollGeneratedImage(asset) {
  if (asset.url || !asset.taskId || !asset.statusUrl) return asset;

  for (let attempt = 0; attempt < 60; attempt += 1) {
    await wait(3000);
    const status = await apiService.get(asset.statusUrl);
    if (status.status === 'completed' && status.url) {
      return {
        ...asset,
        url: status.url,
        filename: status.filename,
        status: 'completed',
      };
    }
    if (status.status === 'error') {
      throw new Error(status.error || t('assetPanel.iwGenFailed'));
    }
  }

  return asset;
}

const actionChips = [
  'Tree pose',
  'Cobra',
  'Mountain',
  'Shark pose',
  'Mouse pose',
  'Dolphin pose',
  'Cow pose',
  'Rainbow',
  'Frog',
  'Flower',
  'Crab pose',
];

function getB13CharMeta(t) {
  return {
    Poppy: { tag: t('assetPanel.iwLively'), short: 'P', base: '#ff705d', colors: ['#ff705d', '#ff8a7a', '#f97360'], prompt: 'Poppy，活泼友好的IP角色，透明背景，适合儿童英语课堂场景。' },
    Edi: { tag: t('assetPanel.iwCalm'), short: 'E', base: '#4f8cff', colors: ['#4f8cff', '#60a5fa', '#2563eb'], prompt: 'Edi，冷静聪明的IP角色，透明背景，正在引导学生观察和思考。' },
    Rolly: { tag: t('assetPanel.iwWarm'), short: 'R', base: '#22c55e', colors: ['#22c55e', '#34d399', '#16a34a'], prompt: 'Rolly，温暖可靠的IP角色，透明背景，动作亲切自然。' },
    Milo: { tag: t('assetPanel.iwConfident'), short: 'M', base: '#f59e0b', colors: ['#f59e0b', '#fbbf24', '#d97706'], prompt: 'Milo，自信开朗的IP角色，透明背景，站姿积极有表现力。' },
    Ace: { tag: t('assetPanel.iwClever'), short: 'A', base: '#8b5cf6', colors: ['#8b5cf6', '#a78bfa', '#7c3aed'], prompt: 'Ace，机智敏捷的IP角色，透明背景，动作轻快，适合趣味课堂。' },
  };
}

function getB13BgVariants(t) {
  return [
    { name: t('assetPanel.iwSpaceClassroom'), symbol: '✦', css: 'radial-gradient(circle at 18% 20%,#fff7ad 0 .7rem,transparent .75rem),radial-gradient(circle at 76% 34%,#bfdbfe 0 1rem,transparent 1.05rem),linear-gradient(135deg,#dbeafe 0%,#eef2ff 45%,#fff7ed 100%)' },
    { name: t('assetPanel.iwForestClassroom'), symbol: '葉', css: 'radial-gradient(circle at 18% 28%,#bbf7d0 0 2.6rem,transparent 2.7rem),radial-gradient(circle at 76% 24%,#fde68a 0 2rem,transparent 2.1rem),linear-gradient(135deg,#dcfce7 0%,#ecfccb 48%,#fef3c7 100%)' },
    { name: t('assetPanel.iwOceanLab'), symbol: '水', css: 'radial-gradient(circle at 22% 28%,rgba(255,255,255,.72) 0 .65rem,transparent .7rem),radial-gradient(circle at 72% 64%,rgba(255,255,255,.55) 0 .9rem,transparent .95rem),linear-gradient(135deg,#bae6fd 0%,#a7f3d0 50%,#e0f2fe 100%)' },
    { name: t('assetPanel.iwFarmStage'), symbol: 'IP', css: 'radial-gradient(circle at 20% 78%,#fcd34d 0 2rem,transparent 2.1rem),radial-gradient(circle at 78% 30%,#fecaca 0 2.2rem,transparent 2.3rem),linear-gradient(135deg,#fef3c7 0%,#dcfce7 52%,#fee2e2 100%)' },
  ];
}

function getB13Examples(t) {
  return [
    { label: t('assetPanel.iwForestExplore'), value: '森林教室，寻找动物单词' },
    { label: t('assetPanel.iwOceanLabExp'), value: '海底实验室，观察颜色词汇' },
    { label: t('assetPanel.iwFarmSports'), value: '农场运动会，学习动物动作' },
  ];
}

function b13Color(name, variant = 0) {
  const meta = b13CharMeta[name] || b13CharMeta.Poppy;
  return meta.colors[variant % meta.colors.length] || meta.base;
}

function b13VirtualSize(ratio) {
  const map = { '16:9': [16, 9], '4:3': [4, 3], '1:1': [1, 1], '9:16': [9, 16] };
  const [w, h] = map[ratio] || map['16:9'];
  return { w: 760, h: Math.round((760 * h) / w) };
}

function b13InitialLayer(name, index, total, ratio) {
  const meta = b13CharMeta[name] || b13CharMeta.Poppy;
  const size = b13VirtualSize(ratio);
  return {
    key: `char-${name}`,
    name,
    prompt: meta.prompt,
    variant: 0,
    x: Math.round((size.w / (total + 1)) * (index + 1) - 39),
    y: Math.round(size.h * 0.57 - (index % 2) * 22),
    size: 100,
    rot: 0,
    flipX: false,
    flipY: false,
    z: index + 1,
  };
}

function RatioPicker({ code, value, onChange }) {
  const { t } = useTranslation();
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">{t('assetPanel.iwRatio')}</div>
      <div className="ppt-img-ratio-grid">
        {imageRatioSets[code].map((ratio) => (
          <button type="button" key={ratio} className={value === ratio ? 'is-active' : ''} onClick={() => onChange(ratio)}>
            <i className={`ratio-${ratio.replace(':', '-')}`} />
            <span>{ratio}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function IpSceneStepper({ step }) {
  const { t } = useTranslation();
  const labels = [t('assetPanel.iwStepperSetup'), t('assetPanel.iwStepperLayout'), t('assetPanel.iwStepperComposite')];
  return (
    <div className="ppt-storybook-stepper" aria-label={t('assetPanel.iwIpScene')}>
      {labels.map((label, index) => (
        <React.Fragment key={label}>
          <div className={`ppt-storybook-step ${step === index ? 'is-active' : ''} ${step > index ? 'is-done' : ''}`}>
            <span>{step > index ? '✓' : index + 1}</span>
            <strong>{label}</strong>
          </div>
          {index < 2 ? <i /> : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function IpSceneCharacterPicker({ value, onChange }) {
  const { t } = useTranslation();
  const toggle = (name) => {
    const next = value.includes(name) ? value.filter((item) => item !== name) : [...value, name];
    if (next.length) onChange(next);
  };

  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">{t('assetPanel.iwSelectIpChars')} <span>{t('assetPanel.iwMultiSelectHint')}</span></div>
      <div className="ppt-img-character-grid">
        {ipCharacters.map((character) => {
          const active = value.includes(character.name);
          return (
            <button type="button" key={character.name} className={active ? 'is-active' : ''} onClick={() => toggle(character.name)}>
              <i><img src={character.image} alt="" /></i>
              <span>{character.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function B13MiniPreview({ values, final = false, onClick }) {
  const { t } = useTranslation();
  const virtual = b13VirtualSize(values.ratio);
  const bg = b13BgVariants[values.ipBgIndex % b13BgVariants.length] || b13BgVariants[0];
  return (
    <div className={final ? 'b13-final-preview' : 'b13-preview-card b13-step2-preview-card'} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      <div className={final ? 'b13-preview-art b13-final-art' : 'b13-preview-art b13-step2-preview-art'} style={{ aspectRatio: values.ratio.replace(':', ' / '), background: bg.css }}>
        {final ? <span className="b13-preview-badge done">{t('assetPanel.iwCompositeDone')}</span> : null}
        <div className="b13-preview-bg-symbol">{final ? 'IP' : bg.symbol}</div>
        <div className="b13-preview-chars">
          {(values.ipLayers || []).slice().sort((a, b) => a.z - b.z).map((layer) => {
            const meta = b13CharMeta[layer.name] || b13CharMeta.Poppy;
            const left = Math.max(3, Math.min(88, (layer.x / virtual.w) * 100));
            const top = Math.max(6, Math.min(78, (layer.y / virtual.h) * 100));
            const miniW = Math.max(26, 36 * ((layer.size || 100) / 100));
            const miniH = Math.max(34, 46 * ((layer.size || 100) / 100));
            const transform = `rotate(${layer.rot || 0}deg) scaleX(${layer.flipX ? -1 : 1}) scaleY(${layer.flipY ? -1 : 1})`;
          return (
            <div
                key={layer.key}
                className="b13-mini-char"
                style={{ left: `${left}%`, top: `${top}%`, width: miniW, height: miniH, background: b13Color(layer.name, layer.variant), transform, zIndex: layer.z }}
              >
                {meta.short}
              </div>
          );
        })}
      </div>
    </div>
    </div>
  );
}

function IpSceneWizard({ values, setValue, onGenerate }) {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const [step, setStep] = React.useState(0);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedKey, setSelectedKey] = React.useState(null);
  const dragRef = React.useRef(null);

  const syncLayers = (chars = values.ipCharacters) => {
    const old = new Map((values.ipLayers || []).map((layer) => [layer.name, layer]));
    setValue('ipLayers', chars.map((name, index) => ({ ...(old.get(name) || b13InitialLayer(name, index, chars.length, values.ratio)), z: index + 1 })));
  };

  const generatePreview = () => {
    if (!values.ipScene?.trim()) return;
    syncLayers();
    setValue('ipBgPrompt', isEn ? `${values.ipScene} background, bright and clear, suitable for PPT slides, no text.` : `${values.ipScene} 背景画面，明亮清晰，适合PPT课件，无文字。`);
    setValue('ipComposed', false);
    setStep(1);
  };

  const updateLayer = (key, patch) => {
    setValue('ipLayers', (values.ipLayers || []).map((layer) => (layer.key === key ? { ...layer, ...patch } : layer)));
  };

  const moveLayerOrder = (delta) => {
    if (!selectedKey) return;
    const ordered = (values.ipLayers || []).slice().sort((a, b) => a.z - b.z);
    const index = ordered.findIndex((layer) => layer.key === selectedKey);
    const target = ordered[index + delta];
    const current = ordered[index];
    if (!current || !target) return;
    setValue('ipLayers', (values.ipLayers || []).map((layer) => {
      if (layer.key === current.key) return { ...layer, z: target.z };
      if (layer.key === target.key) return { ...layer, z: current.z };
      return layer;
    }));
  };

  const startLayerDrag = (event, layer) => {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedKey(layer.key);
    dragRef.current = {
      key: layer.key,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: layer.x,
      originY: layer.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const dragLayer = (event) => {
    const drag = dragRef.current;
    if (!drag) return;
    const nextX = Math.round(drag.originX + event.clientX - drag.startX);
    const nextY = Math.round(drag.originY + event.clientY - drag.startY);
    updateLayer(drag.key, { x: nextX, y: nextY });
  };

  const endLayerDrag = () => {
    dragRef.current = null;
  };

  React.useEffect(() => {
    syncLayers(values.ipCharacters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.ipCharacters.join('|')]);

  const selectedLayer = (values.ipLayers || []).find((layer) => layer.key === selectedKey) || null;
  const bg = b13BgVariants[values.ipBgIndex % b13BgVariants.length] || b13BgVariants[0];

  return (
    <div className="ppt-img-flow ppt-b13-flow">
      <div className="ppt-img-flow-body">
        <IpSceneStepper step={step} />
        {step === 0 ? (
          <div className="ppt-img-focused-form">
            <RatioPicker code="B13" value={values.ratio} onChange={(value) => setValue('ratio', value)} />
            <IpSceneCharacterPicker value={values.ipCharacters} onChange={(value) => setValue('ipCharacters', value)} />
            <ScenePromptBox value={values.ipScene || ''} onChange={(value) => setValue('ipScene', value)} />
            <div className="b13-chip-row">
              {b13Examples.map((item) => (
                <button type="button" key={item.label} onClick={() => setValue('ipScene', item.value)}>{item.label}</button>
              ))}
            </div>
          </div>
        ) : null}
        {step === 1 ? (
          <div className="b13-drawer-body">
            <div className="b13-layer-ready-card">
              <div className="b13-layer-ready-icon" aria-hidden="true">▣</div>
              <div className="b13-layer-ready-copy">
                <strong>{t('assetPanel.iwLayerReady')}</strong>
                <span>{t('assetPanel.iwDirectGenHint')}</span>
              </div>
            </div>
            <B13MiniPreview values={values} onClick={() => setModalOpen(true)} />
            <div className="b13-ready-summary-card">
              <div><span className="b13-ready-check">✓</span><b>{t('assetPanel.iwBgReady')}</b></div>
              <i />
              <div><span className="b13-ready-check">✓</span><b>{values.ipLayers.length} {t('assetPanel.iwCharsReady')}</b></div>
            </div>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="b13-drawer-body">
            <B13MiniPreview values={values} final />
            <div className="b13-status-list final">
              <div><span>{t('assetPanel.iwImageRatio')}</span><b>{values.ratio}</b></div>
              <div><span>{t('assetPanel.iwIpChars')}</span><b>{values.ipLayers.length} {t('assetPanel.iwCharsReady')}</b></div>
              <div><span>{t('assetPanel.iwOutputFormat')}</span><b>{t('assetPanel.iwPngTransparent')}</b></div>
            </div>
          </div>
        ) : null}
      </div>
      <div className="ppt-inline-footer ppt-img-footer">
        {step === 0 ? <button type="button" className="ppt-primary-btn" onClick={generatePreview}><Sparkles size={14} />{t('assetPanel.iwGenerateImage')}</button> : null}
        {step === 1 ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(0)}>{t('assetPanel.iwPrevStep')}</button>
            <button type="button" className="ppt-primary-btn" onClick={() => { setValue('ipComposed', true); setStep(2); }}>{t('assetPanel.iwNextStep')}</button>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <button type="button" className="ppt-ghost-btn">{t('assetPanel.iwSaveToLibrary')}</button>
            <button type="button" className="ppt-primary-btn" onClick={onGenerate}>{t('assetPanel.iwInsertCanvas')}</button>
          </>
        ) : null}
      </div>
      {modalOpen ? (
        <div className="b13-compose-modal-wrap">
          <div className="b13-modal">
            <div className="b13-modal-hd">
              <div><div className="b13-modal-title">{t('assetPanel.iwIpSceneLayout')}</div></div>
              <div className="b13-modal-actions"><button type="button" className="b13-modal-x" onClick={() => setModalOpen(false)}>×</button></div>
            </div>
            <div className="b13-modal-body">
              <div className="b13-canvas-pane">
                <div className="b13-canvas-wrap">
                  <div className="b13-canvas" style={{ aspectRatio: values.ratio.replace(':', ' / ') }} onClick={() => setSelectedKey(null)}>
                    <div className="b13-bg-layer" style={{ background: bg.css, transform: `scale(${(values.ipBgScale || 100) / 100})` }}>{bg.symbol}</div>
                    <div className="b13-char-layer-wrap">
                      {(values.ipLayers || []).slice().sort((a, b) => a.z - b.z).map((layer) => {
                        const meta = b13CharMeta[layer.name] || b13CharMeta.Poppy;
                        return (
                          <div
                            key={layer.key}
                            className={`b13-char-node ${selectedKey === layer.key ? 'is-active' : ''}`}
                            style={{
                              left: layer.x,
                              top: layer.y,
                              width: 78 * ((layer.size || 100) / 100),
                              height: 98 * ((layer.size || 100) / 100),
                              zIndex: 10 + layer.z,
                              transform: `rotate(${layer.rot || 0}deg) scaleX(${layer.flipX ? -1 : 1}) scaleY(${layer.flipY ? -1 : 1})`,
                            }}
                            onClick={(event) => { event.stopPropagation(); setSelectedKey(layer.key); }}
                            onPointerDown={(event) => startLayerDrag(event, layer)}
                            onPointerMove={dragLayer}
                            onPointerUp={endLayerDrag}
                            onPointerCancel={endLayerDrag}
                          >
                            <div className="b13-char-body" style={{ background: b13Color(layer.name, layer.variant) }}>{meta.short}</div>
                            <div className="b13-char-name">{layer.name}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <aside className="b13-prop-pane">
                {!selectedLayer ? (
                  <div className="b13-prop-section">
                    <div className="b13-prop-title">{t('assetPanel.iwBgSettings')}</div>
                    <label className="b13-prop-label">{t('assetPanel.iwBgPrompt')}</label>
                    <Input.TextArea className="ppt-img-textarea-input b13-prop-textarea" value={values.ipBgPrompt || ''} onChange={(event) => setValue('ipBgPrompt', event.target.value)} />
                    <div className="b13-action-grid"><button type="button" className="btn b13-regen-btn" onClick={() => setValue('ipBgIndex', (values.ipBgIndex + 1) % b13BgVariants.length)}>{t('assetPanel.iwRegenBg')}</button></div>
                    <label className="b13-prop-label">{t('assetPanel.iwBgScale')} <span>{values.ipBgScale || 100}%</span></label>
                    <input type="range" min="100" max="150" value={values.ipBgScale || 100} onChange={(event) => setValue('ipBgScale', Number(event.target.value))} />
                    <div className="b13-prop-note">{t('assetPanel.iwBgNoRotate')}</div>
                  </div>
                ) : (
                  <div className="b13-prop-section">
                    <div className="b13-prop-title">{selectedLayer.name}{t('assetPanel.iwCharSettings')}</div>
                    <label className="b13-prop-label">{t('assetPanel.iwCharPrompt')}</label>
                    <Input.TextArea className="ppt-img-textarea-input b13-prop-textarea" value={selectedLayer.prompt || ''} onChange={(event) => updateLayer(selectedLayer.key, { prompt: event.target.value })} />
                    <div className="b13-action-grid"><button type="button" className="btn b13-regen-btn" onClick={() => updateLayer(selectedLayer.key, { variant: (selectedLayer.variant || 0) + 1 })}>{t('assetPanel.iwRegenChar')}</button></div>
                    <div className="b13-num-grid">
                      <label>X<Input type="number" value={Math.round(selectedLayer.x)} onChange={(event) => updateLayer(selectedLayer.key, { x: Number(event.target.value) })} /></label>
                      <label>Y<Input type="number" value={Math.round(selectedLayer.y)} onChange={(event) => updateLayer(selectedLayer.key, { y: Number(event.target.value) })} /></label>
                    </div>
                    <label className="b13-prop-label">{t('assetPanel.iwSize')} <span>{Math.round(selectedLayer.size)}%</span></label>
                    <input type="range" min="55" max="150" value={selectedLayer.size} onChange={(event) => updateLayer(selectedLayer.key, { size: Number(event.target.value) })} />
                    <label className="b13-prop-label">{t('assetPanel.iwRotationAngle')} <span>{Math.round(selectedLayer.rot || 0)}°</span></label>
                    <input type="range" min="-45" max="45" value={selectedLayer.rot || 0} onChange={(event) => updateLayer(selectedLayer.key, { rot: Number(event.target.value) })} />
                    <div className="b13-flip-row">
                      <button type="button" className={selectedLayer.flipX ? 'is-active' : ''} onClick={() => updateLayer(selectedLayer.key, { flipX: !selectedLayer.flipX })}>{t('assetPanel.iwFlipH')}</button>
                      <button type="button" className={selectedLayer.flipY ? 'is-active' : ''} onClick={() => updateLayer(selectedLayer.key, { flipY: !selectedLayer.flipY })}>{t('assetPanel.iwFlipV')}</button>
                    </div>
                    <div className="b13-z-row">
                      <button type="button" onClick={() => moveLayerOrder(-1)}>{t('assetPanel.iwMoveDownLayer')}</button>
                      <button type="button" onClick={() => moveLayerOrder(1)}>{t('assetPanel.iwMoveUpLayer')}</button>
                    </div>
                  </div>
                )}
              </aside>
            </div>
            <div className="b13-modal-ft">
              <button type="button" className="b13-footer-btn b13-footer-ghost" onClick={() => setModalOpen(false)}>{t('assetPanel.iwCancel')}</button>
              <button type="button" className="b13-footer-btn b13-footer-ghost" onClick={() => setModalOpen(false)}>{t('assetPanel.iwSaveLayout')}</button>
              <button type="button" className="b13-footer-btn b13-footer-primary" onClick={() => { setModalOpen(false); setValue('ipComposed', true); setStep(2); }}>{t('assetPanel.iwSaveAndComposite')}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StylePicker({ value, onChange }) {
  const { t } = useTranslation();
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">{t('assetPanel.iwStyle')}</div>
      <div className="ppt-img-style-row">
        {[t('assetPanel.styleCartoon'), t('assetPanel.styleRealistic')].map((style) => (
          <button type="button" key={style} className={value === style ? 'is-active' : ''} onClick={() => onChange(style)}>
            {style}
          </button>
        ))}
      </div>
    </div>
  );
}

function WhitespacePicker({ value, onChange }) {
  const { t } = useTranslation();
  const opts = [t('assetPanel.wsTop'), t('assetPanel.wsBottom'), t('assetPanel.wsLeft'), t('assetPanel.wsRight')];
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label is-muted">{t('assetPanel.iwTextWhitespace')}</div>
      <div className="ppt-img-whitespace-row">
        {opts.map((item) => (
          <button type="button" key={item} className={value === item ? 'is-active' : ''} onClick={() => onChange(item)}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function ActivityThemePicker({ value, onChange }) {
  const { t } = useTranslation();
  const cards = getActivityThemeCards(t);
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">{t('assetPanel.iwActivityTheme')}</div>
      <div className="ppt-img-activity-grid">
        {cards.map(({ value: theme, icon: Icon }) => (
          <button type="button" key={theme} className={value === theme ? 'is-active' : ''} onClick={() => onChange(theme)}>
            <Icon size={26} />
            <span>{theme}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TextLayoutPicker({ value, onChange }) {
  const { t } = useTranslation();
  const cards = getTextLayoutCards(t);
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">{t('assetPanel.iwTextFrameStyle')}</div>
      <div className="ppt-img-text-layout-row">
        {cards.map((item) => (
          <button type="button" key={item} className={value === item ? 'is-active' : ''} onClick={() => onChange(item)}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function KnowledgeChartPicker({ value, onChange }) {
  const { t } = useTranslation();
  const cards = getKnowledgeChartCards(t);
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">{t('assetPanel.iwChartType')}</div>
      <div className="ppt-img-knowledge-grid">
        {cards.map(({ value: item, icon: Icon }) => (
          <button type="button" key={item} className={value === item ? 'is-active' : ''} onClick={() => onChange(item)}>
            <Icon size={28} />
            <span>{item}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function OutputDirectionPicker({ value, onChange }) {
  const { t } = useTranslation();
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">{t('assetPanel.iwOutputDirection')}</div>
      <div className="ppt-img-output-row">
        {[
          ['16:9', t('assetPanel.iwLandscape169')],
          ['9:16', t('assetPanel.iwPortrait916')],
        ].map(([ratio, label]) => (
          <button type="button" key={ratio} className={value === ratio ? 'is-active' : ''} onClick={() => onChange(ratio)}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ComicStylePicker({ value, onChange }) {
  const { t } = useTranslation();
  const cards = getComicStyleCards(t);
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">{t('assetPanel.iwComicStyle')}</div>
      <div className="ppt-img-text-layout-row">
        {cards.map((item) => (
          <button type="button" key={item} className={value === item ? 'is-active' : ''} onClick={() => onChange(item)}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function CharacterPicker({ value, onChange }) {
  const { t } = useTranslation();
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">{t('assetPanel.iwIpCharacter')}</div>
      <div className="ppt-img-character-grid">
        {ipCharacters.map((character) => (
          <button type="button" key={character.name} className={value === character.name ? 'is-active' : ''} onClick={() => onChange(character.name)}>
            <i><img src={character.image} alt="" /></i>
            <span>{character.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ActionSelector({ values, setValue }) {
  const { t } = useTranslation();
  const selected = values.actions || ['Cobra', 'Dolphin pose', 'Mouse pose'];
  const [draft, setDraft] = React.useState('');
  const addAction = (action) => {
    const next = action.trim();
    if (next && !selected.includes(next)) setValue('actions', [...selected, next]);
    setDraft('');
  };
  const removeAction = (action) => {
    setValue('actions', selected.filter((item) => item !== action));
  };

  return (
    <>
      <div className="ppt-img-section">
        <div className="ppt-img-label">{t('assetPanel.iwActionType')}</div>
        <div className="ppt-img-output-row">
          {[
            [t('assetPanel.iwYogaPose'), '▱'],
            [t('assetPanel.iwTprFitness'), '◉'],
          ].map(([item, icon]) => (
            <button type="button" key={item} className={values.actionType === item ? 'is-active' : ''} onClick={() => setValue('actionType', item)}>
              <span className="ppt-img-action-type-icon">{icon}</span>{item}
            </button>
          ))}
        </div>
      </div>
      <div className="ppt-img-section">
        <div className="ppt-img-label">{t('assetPanel.iwSelectedActions')} <span>{t('assetPanel.iwEachActionOne')}</span></div>
        <div className="ppt-img-selected-action">
          {selected.length ? selected.map((action) => (
            <button type="button" key={action} onClick={() => removeAction(action)}>
              {action} ×
            </button>
          )) : <span>{t('assetPanel.iwSelectFromBelow')}</span>}
        </div>
        <Input
          className="ppt-img-text-input"
          value={draft}
          placeholder={t('assetPanel.iwSearchPlaceholder')}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addAction(draft);
            }
          }}
        />
        <div className="ppt-img-action-chip-row">
          {actionChips.map((action) => (
            <button type="button" key={action} className={selected.includes(action) ? 'is-disabled' : ''} disabled={selected.includes(action)} onClick={() => addAction(action)}>
              {action}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function FixedRatioBar({ ratio }) {
  const { t } = useTranslation();
  return (
    <div className="ppt-img-fixed-ratio-bar">
      <span>{t('assetPanel.iwRatio')}</span>
      <strong>{ratio}</strong>
      <em>{t('assetPanel.iwFixedCannotChange')}</em>
    </div>
  );
}

function ScenePromptBox({ value, onChange }) {
  const { t } = useTranslation();
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">{t('assetPanel.iwDescribeScene')} <span>{t('assetPanel.iwAnyLanguage')}</span></div>
      <div className="ppt-img-prompt-box">
        <Input.TextArea
          value={value}
          placeholder={t('assetPanel.iwScenePlaceholder')}
          maxLength={40}
          onChange={(event) => onChange(event.target.value)}
        />
        <div>
          <span>{value.length} / 40</span>
          <button type="button">{t('assetPanel.iwHelpWrite')}</button>
        </div>
      </div>
    </div>
  );
}

function FlashcardPreview({ word, includeChinese, includePhonetic }) {
  const { t } = useTranslation();
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">{t('assetPanel.iwEffectPreview')}</div>
      <div className="ppt-b3-preview-stage">
        <div className="ppt-b3-preview-card">
          <div><span>{t('assetPanel.iwAiIllustration')}</span></div>
          <strong>{word || 'apple'}</strong>
          <i />
          {includeChinese ? <span>苹果</span> : null}
          {includePhonetic ? <em>/ˈæpl/</em> : null}
        </div>
      </div>
    </div>
  );
}

function FlashcardWordEditor({ values, setValue }) {
  const { t } = useTranslation();
  const words = values.flashWords || ['apple', 'banana'];
  const [draft, setDraft] = React.useState('');
  const addWord = () => {
    const word = draft.trim();
    if (!word || words.includes(word)) return;
    setValue('flashWords', [...words, word]);
    setDraft('');
  };
  const removeWord = (word) => setValue('flashWords', words.filter((item) => item !== word));

  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">{t('assetPanel.iwVocabList')} <span>（{t('assetPanel.iwInputVocabHint')}）</span></div>
      <div className="ppt-b3-word-box">
        <div className="ppt-b3-chip-row">
          {words.map((word) => (
            <button type="button" key={word} onClick={() => removeWord(word)}>
              {word} ×
            </button>
          ))}
        </div>
        <Input
          value={draft}
          placeholder={t('assetPanel.iwInputVocabHint')}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addWord();
            }
          }}
        />
        <div className="ppt-b3-option-row">
          <label>
            <input type="checkbox" checked={values.includeChinese !== false} onChange={(event) => setValue('includeChinese', event.target.checked)} />
            {t('assetPanel.iwIncludeChinese')}
          </label>
          <label>
            <input type="checkbox" checked={!!values.includePhonetic} onChange={(event) => setValue('includePhonetic', event.target.checked)} />
            {t('assetPanel.iwIncludePhonetic')}
          </label>
          <span>{words.length} {t('assetPanel.iwWordCount')}</span>
        </div>
      </div>
    </div>
  );
}

function FocusedImageForm({ asset, values, setValue, onGenerate }) {
  const { t } = useTranslation();
  const isFlashcard = asset.code === 'B3';
  const isStoryImage = asset.code === 'B4';
  const isActivityImage = asset.code === 'B5';
  const isTopicMap = asset.code === 'B6';
  const isTextImage = asset.code === 'B7';
  const isKnowledgeImage = asset.code === 'B8';
  const isComicImage = asset.code === 'B10';
  const isActionImage = asset.code === 'B11';
  return (
    <div className="ppt-img-flow">
      <div className="ppt-img-flow-body">
        <div className="ppt-img-focused-form">
        {isComicImage ? (
          <FixedRatioBar ratio="16:9" />
        ) : isKnowledgeImage ? (
          <>
            <KnowledgeChartPicker value={values.chart} onChange={(value) => setValue('chart', value)} />
            <OutputDirectionPicker value={values.ratio} onChange={(value) => setValue('ratio', value)} />
          </>
        ) : isTopicMap ? (
          <FixedRatioBar ratio="16:9" />
        ) : (
          <RatioPicker code={asset.code} value={values.ratio} onChange={(value) => setValue('ratio', value)} />
        )}
        {!isKnowledgeImage && !isComicImage && !isActionImage ? <StylePicker value={values.style} onChange={(value) => setValue('style', value)} /> : null}
        {isStoryImage ? (
          <>
            <WhitespacePicker value={values.whitespace} onChange={(value) => setValue('whitespace', value)} />
            <div className="ppt-asset-divider" />
            <div className="ppt-img-section">
              <div className="ppt-img-label">{t('assetPanel.iwStorySceneDesc')}</div>
              <Input
                className="ppt-img-text-input"
                value={values.storyScene || ''}
                placeholder={t('assetPanel.fB4Placeholder')}
                onChange={(event) => setValue('storyScene', event.target.value)}
              />
            </div>
            <div className="ppt-img-section">
              <div className="ppt-img-label">{t('assetPanel.iwCharacterDesc')}</div>
              <Input
                className="ppt-img-text-input"
                value={values.storyCharacter || ''}
                placeholder={t('assetPanel.iwScenePlaceholder')}
                onChange={(event) => setValue('storyCharacter', event.target.value)}
              />
            </div>
          </>
        ) : null}
        {isActivityImage ? (
          <>
            <div className="ppt-asset-divider" />
            <ActivityThemePicker value={values.theme} onChange={(value) => setValue('theme', value)} />
            <div className="ppt-img-section">
              <div className="ppt-img-label">{t('assetPanel.iwActivityTitle')}</div>
              <Input
                className="ppt-img-text-input"
                value={values.activityTitle || ''}
                placeholder={t('assetPanel.fB5Placeholder')}
                onChange={(event) => setValue('activityTitle', event.target.value)}
              />
            </div>
            <div className="ppt-img-ai-tip">
              {t('assetPanel.iwAiAutoFill')}
            </div>
          </>
        ) : null}
        {isTopicMap ? (
          <>
            <div className="ppt-asset-divider" />
            <div className="ppt-img-section">
              <div className="ppt-img-label">{t('assetPanel.iwSceneName')}</div>
              <Input
                className="ppt-img-text-input"
                value={values.topicScene || ''}
                placeholder={t('assetPanel.fB6Placeholder')}
                onChange={(event) => setValue('topicScene', event.target.value)}
              />
            </div>
            <div className="ppt-img-section">
              <div className="ppt-img-label">{t('assetPanel.iwAnnotationWords')}</div>
              <Input.TextArea
                className="ppt-img-textarea-input"
                value={values.topicWords || ''}
                placeholder={t('assetPanel.fB6Placeholder')}
                onChange={(event) => setValue('topicWords', event.target.value)}
              />
            </div>
            <div className="ppt-img-ai-tip">{t('assetPanel.iwAiGenScene')}</div>
          </>
        ) : null}
        {isTextImage ? (
          <>
            <div className="ppt-asset-divider" />
            <TextLayoutPicker value={values.textLayout} onChange={(value) => setValue('textLayout', value)} />
            <div className="ppt-img-section">
              <div className="ppt-img-label">{t('assetPanel.iwTextContent')}</div>
              <Input.TextArea
                className="ppt-img-textarea-input is-text-card"
                value={values.textContent || ''}
                placeholder={t('assetPanel.iwTextContentPlaceholder')}
                onChange={(event) => setValue('textContent', event.target.value)}
              />
            </div>
            <div className="ppt-img-section">
              <div className="ppt-img-label">{t('assetPanel.iwBgSceneDesc')}</div>
              <Input
                className="ppt-img-text-input"
                value={values.textBackground || ''}
                placeholder={t('assetPanel.fB7Placeholder')}
                onChange={(event) => setValue('textBackground', event.target.value)}
              />
            </div>
          </>
        ) : null}
        {isKnowledgeImage ? (
          <>
            <div className="ppt-img-section">
              <div className="ppt-img-label">{t('assetPanel.iwCenterTopic')}</div>
              <Input
                className="ppt-img-text-input"
                value={values.knowledgeTopic || ''}
                placeholder={t('assetPanel.fB8Placeholder')}
                onChange={(event) => setValue('knowledgeTopic', event.target.value)}
              />
            </div>
            <div className="ppt-img-section">
              <div className="ppt-img-label">{t('assetPanel.iwKnowledgeBranches')}</div>
              <Input.TextArea
                className="ppt-img-textarea-input"
                value={values.knowledgeItems || ''}
                placeholder={t('assetPanel.iwKnowledgePlaceholder')}
                onChange={(event) => setValue('knowledgeItems', event.target.value)}
              />
            </div>
            <div className="ppt-img-ai-tip">{t('assetPanel.iwAiAutoLayout')}</div>
          </>
        ) : null}
        {isComicImage ? (
          <>
            <ComicStylePicker value={values.comicStyle} onChange={(value) => setValue('comicStyle', value)} />
            <label className="ppt-img-check-row">
              <input type="checkbox" checked={values.comicDialogue !== false} onChange={(event) => setValue('comicDialogue', event.target.checked)} />
              {t('assetPanel.iwIncludeBubbleText')}
            </label>
            <div className="ppt-asset-divider" />
            <div className="ppt-img-section">
              <div className="ppt-img-label">{t('assetPanel.iwTargetPhrase')}</div>
              <Input
                className="ppt-img-text-input"
                value={values.phrase || ''}
                placeholder={t('assetPanel.iwPhrasePlaceholder')}
                onChange={(event) => setValue('phrase', event.target.value)}
              />
            </div>
            <div className="ppt-img-section">
              <div className="ppt-img-label">{t('assetPanel.iwStoryChar')}</div>
              <Input
                className="ppt-img-text-input"
                value={values.comicCharacter || ''}
                placeholder={t('assetPanel.fB10Placeholder')}
                onChange={(event) => setValue('comicCharacter', event.target.value)}
              />
            </div>
            <div className="ppt-img-section">
              <div className="ppt-img-label">{t('assetPanel.iwStoryPlot')}</div>
              <Input.TextArea
                className="ppt-img-textarea-input"
                value={values.plot || ''}
                placeholder={t('assetPanel.iwPlotPlaceholder')}
                onChange={(event) => setValue('plot', event.target.value)}
              />
            </div>
            <div className="ppt-img-ai-tip">{t('assetPanel.iwAutoComicLayout')}</div>
          </>
        ) : null}
        {isActionImage ? (
          <>
            <div className="ppt-asset-divider" />
            <CharacterPicker value={values.character} onChange={(value) => setValue('character', value)} />
            <ActionSelector values={values} setValue={setValue} />
          </>
        ) : null}
        {isFlashcard ? (
          <>
            <FlashcardWordEditor values={values} setValue={setValue} />
            <FlashcardPreview
              word={(values.flashWords || ['apple'])[0]}
              includeChinese={values.includeChinese !== false}
              includePhonetic={!!values.includePhonetic}
            />
          </>
        ) : !isStoryImage && !isActivityImage && !isTopicMap && !isTextImage && !isKnowledgeImage && !isComicImage && !isActionImage ? (
          <>
            <ScenePromptBox value={values.scene || ''} onChange={(value) => setValue('scene', value)} />
            {asset.code === 'B2' ? (
              <div className="ppt-img-section">
                <div className="ppt-img-label">{t('assetPanel.iwOverlayText')}</div>
                <Input
                  className="ppt-img-text-input"
                  value={values.overlayText || ''}
                  placeholder={t('assetPanel.fB2Placeholder')}
                  onChange={(event) => setValue('overlayText', event.target.value)}
                />
              </div>
            ) : null}
          </>
        ) : null}
        </div>
      </div>
      <div className="ppt-inline-footer ppt-img-footer">
        <button type="button" className="ppt-primary-btn" onClick={onGenerate}>
          <Sparkles size={14} />{t('assetPanel.iwGenerateImage')}
        </button>
      </div>
    </div>
  );
}

const storybookFrames = [
  '很久很久以前，有三只小猪。',
  '第一只小猪用稻草盖了一所房子。',
  '第二只小猪用木头盖了一所房子。',
  '第三只小猪非常勤奋，用坚固的砖头盖了一所房子。',
  '有一天，大灰狼来了...',
];

function StorybookStepper({ step, generating }) {
  const { t } = useTranslation();
  const labels = [t('assetPanel.iwPasteStory'), t('assetPanel.iwConfirmPreview'), t('assetPanel.iwGenerateImage')];
  return (
    <div className="ppt-storybook-stepper">
      {labels.map((label, index) => (
        <React.Fragment key={label}>
          <div className={`ppt-storybook-step ${step === index ? 'is-active' : ''} ${step > index || (generating && index < 2) ? 'is-done' : ''}`}>
            <span>{step > index || (generating && index < 2) ? '✓' : index + 1}</span>
            <strong>{label}</strong>
          </div>
          {index < labels.length - 1 ? <i /> : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function StorybookPasteStep({ values, setValue }) {
  const { t } = useTranslation();
  const examples = ['三只小猪', '曹冲称象', '坐井观天'];
  return (
    <div className="ppt-storybook-body">
      <div className="ppt-img-section">
        <div className="ppt-img-label">{t('assetPanel.iwStoryName')}</div>
        <Input
          className="ppt-img-text-input"
          value={values.storybookTitle || ''}
          placeholder={t('assetPanel.iwStoryPlaceholder')}
          onChange={(event) => setValue('storybookTitle', event.target.value)}
        />
      </div>
      <div className="ppt-img-section">
        <div className="ppt-img-label-row"><span>{t('assetPanel.iwStoryContent')}</span><em>{(values.storybookContent || '').length} {t('assetPanel.iwChars')}</em></div>
        <Input.TextArea
          className="ppt-storybook-textarea"
          value={values.storybookContent || ''}
          placeholder={t('assetPanel.iwStoryContentPlaceholder')}
          onChange={(event) => setValue('storybookContent', event.target.value)}
        />
      </div>
      <div className="ppt-storybook-examples">
        <span>{t('assetPanel.iwExample')}</span>
        {examples.map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => {
              setValue('storybookTitle', item);
              setValue('storybookContent', storybookFrames.join('\n'));
            }}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="ppt-asset-divider" />
      <div className="ppt-img-section">
        <div className="ppt-img-label">{t('assetPanel.iwPictureBookStyle')}</div>
        <div className="ppt-img-text-layout-row">
          {[t('assetPanel.iwWatercolor'), t('assetPanel.iwCartoon3d'), t('assetPanel.iwPaperCut')].map((item) => (
            <button type="button" key={item} className={values.storybookStyle === item ? 'is-active' : ''} onClick={() => setValue('storybookStyle', item)}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="ppt-img-section">
        <div className="ppt-img-label">{t('assetPanel.iwTargetGrade')}</div>
        <div className="ppt-storybook-grade-grid">
          {[t('assetPanel.iwGrade1'), t('assetPanel.iwGrade2'), t('assetPanel.iwGrade3'), t('assetPanel.iwGrade4')].map((item) => (
            <button type="button" key={item} className={values.storybookGrade === item ? 'is-active' : ''} onClick={() => setValue('storybookGrade', item)}>
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function StorybookPreviewStep() {
  const { t } = useTranslation();
  return (
    <div className="ppt-storybook-body">
      <div className="ppt-storybook-summary">
        <strong>三只小猪</strong>
        <span>{t('assetPanel.iwWatercolor')}</span>
        <em>{t('assetPanel.iwPages')} 5</em>
      </div>
      <div className="ppt-storybook-frame-grid">
        {storybookFrames.map((frame, index) => (
          <article key={frame}>
            <div>
              <b>{index + 1}</b>
              <strong>{t('assetPanel.iwStoryboard')}</strong>
              <span>{t('assetPanel.iwPendingIllustration')}</span>
            </div>
            <p>{frame}</p>
          </article>
        ))}
      </div>
      <p className="ppt-storybook-note">{t('assetPanel.iwRegenAfter')}</p>
    </div>
  );
}

function StorybookGenerateStep() {
  const { t } = useTranslation();
  return (
    <div className="ppt-storybook-generate">
      <div className="ppt-storybook-spinner"><span /></div>
      <strong>{t('assetPanel.iwAiMagic')}</strong>
      <em>1 / 5 {t('assetPanel.iwPages')}</em>
      <div className="ppt-storybook-progress"><i /></div>
      <div className="ppt-storybook-running-tip">{t('assetPanel.iwGeneratingPage')} 2...</div>
      <div className="ppt-storybook-result-grid">
        {storybookFrames.slice(0, 4).map((frame, index) => (
          <article key={frame} className={index === 0 ? 'is-done' : index === 1 ? 'is-running' : ''}>
            <div><b>{index + 1}</b>{index === 0 ? <span>✓</span> : index === 1 ? <span>⌛</span> : null}</div>
            <strong>{index === 0 ? 'Page 1' : ''}</strong>
            <p>{frame}</p>
          </article>
        ))}
      </div>
      <p className="ppt-storybook-note">{t('assetPanel.iwDoNotClose')}</p>
    </div>
  );
}

function StorybookImageWizard({ values, setValue, onGenerate }) {
  const { t } = useTranslation();
  const [step, setStep] = React.useState(0);

  return (
    <div className="ppt-img-flow">
      <div className="ppt-img-flow-body">
        <StorybookStepper step={step} generating={false} />
        {step === 0 ? <StorybookPasteStep values={values} setValue={setValue} /> : null}
        {step === 1 ? <StorybookPreviewStep values={values} /> : null}
      </div>
      <div className="ppt-inline-footer ppt-img-footer">
        {step === 1 ? <button type="button" className="ppt-ghost-btn" onClick={() => setStep(0)}>{t('assetPanel.iwPrevStep')}</button> : null}
        <button
          type="button"
          className="ppt-primary-btn"
          onClick={() => {
            if (step === 0) setStep(1);
            else onGenerate();
          }}
        >
          <Sparkles size={14} />
          {step === 0 ? t('assetPanel.iwNextConfirm') : t('assetPanel.iwStartGen')}
        </button>
      </div>
    </div>
  );
}

function ImageTypeContent({ asset, values, setValue }) {
  const { t } = useTranslation();
  const updateText = (key) => (event) => setValue(key, event.target.value);

  if (asset.code === 'B2') {
    return (
      <>
        <PromptField
          label={t('assetPanel.iwDescribeScene') + ' ' + t('assetPanel.iwAnyLanguage')}
          value={values.scene || ''}
          placeholder={t('assetPanel.iwScenePlaceholder')}
          onChange={(value) => setValue('scene', value)}
          maxLength={40}
        />
        <FieldBlock label={t('assetPanel.iwOverlayText')}>
          <Input value={values.overlayText || ''} placeholder={t('assetPanel.fB2Placeholder')} onChange={updateText('overlayText')} />
        </FieldBlock>
      </>
    );
  }

  if (asset.code === 'B3') {
    return (
      <>
        <FieldBlock label={t('assetPanel.iwVocabList')}>
          <div className="ppt-b3-word-box">
            <div className="ppt-b3-chip-row">
              <span>apple x</span>
              <span>banana x</span>
            </div>
            <Input.TextArea
              value={values.words || 'apple\nbanana'}
              onChange={updateText('words')}
              placeholder={t('assetPanel.iwInputVocabHint')}
            />
            <div className="ppt-b3-option-row">
              <label><input type="checkbox" defaultChecked /> {t('assetPanel.iwIncludeChinese')}</label>
              <label><input type="checkbox" /> {t('assetPanel.iwIncludePhonetic')}</label>
              <span>2 {t('assetPanel.iwWordCount')}</span>
            </div>
          </div>
        </FieldBlock>
        <FlashcardPreview />
      </>
    );
  }

  if (asset.code === 'B4') {
    return (
      <>
        <FieldBlock label={t('assetPanel.iwStorySceneDesc')}>
          <Input value={values.storyScene || ''} placeholder={t('assetPanel.fB4Placeholder')} onChange={updateText('storyScene')} />
        </FieldBlock>
        <FieldBlock label={t('assetPanel.iwCharacterDesc')}>
          <Input value={values.storyCharacter || ''} placeholder={t('assetPanel.iwScenePlaceholder')} onChange={updateText('storyCharacter')} />
        </FieldBlock>
      </>
    );
  }

  if (asset.code === 'B5') {
    return (
      <>
        <FieldBlock label={t('assetPanel.iwActivityTitle')}>
          <Input value={values.activityTitle || ''} placeholder={t('assetPanel.fB5Placeholder')} onChange={updateText('activityTitle')} />
        </FieldBlock>
        <Tip>{t('assetPanel.iwAiAutoFill')}</Tip>
      </>
    );
  }

  if (asset.code === 'B6') {
    return (
      <>
        <FieldBlock label={t('assetPanel.iwSceneName')}>
          <Input value={values.mapScene || ''} placeholder={t('assetPanel.fB6Placeholder')} onChange={updateText('mapScene')} />
        </FieldBlock>
        <FieldBlock label={t('assetPanel.iwAnnotationWords')}>
          <Input.TextArea
            value={values.mapWords || ''}
            onChange={updateText('mapWords')}
            placeholder={t('assetPanel.fB6Placeholder')}
          />
        </FieldBlock>
        <Tip>{t('assetPanel.iwAiGenScene')}</Tip>
      </>
    );
  }

  if (asset.code === 'B7') {
    return (
      <>
        <FieldBlock label={t('assetPanel.iwTextFrameStyle')}>
          <OptionGrid options={[t('assetPanel.iwDialogueBubble'), t('assetPanel.iwScroll'), t('assetPanel.iwCardFrame')]} value={values.bubble || t('assetPanel.iwDialogueBubble')} onChange={(value) => setValue('bubble', value)} columns={3} />
        </FieldBlock>
        <FieldBlock label={t('assetPanel.iwTextContent')}>
          <Input.TextArea
            value={values.textContent || ''}
            onChange={updateText('textContent')}
            placeholder={t('assetPanel.iwTextContentPlaceholder')}
          />
        </FieldBlock>
        <FieldBlock label={t('assetPanel.iwBgSceneDesc')}>
          <Input value={values.textBg || ''} placeholder={t('assetPanel.fB7Placeholder')} onChange={updateText('textBg')} />
        </FieldBlock>
      </>
    );
  }

  if (asset.code === 'B8') {
    return (
      <>
        <FieldBlock label={t('assetPanel.iwCenterTopic')}>
          <Input value={values.center || ''} placeholder={t('assetPanel.fB8Placeholder')} onChange={updateText('center')} />
        </FieldBlock>
        <FieldBlock label={t('assetPanel.iwKnowledgeBranches')}>
          <Input.TextArea
            value={values.knowledge || ''}
            onChange={updateText('knowledge')}
            placeholder={t('assetPanel.iwKnowledgePlaceholder')}
          />
        </FieldBlock>
        <Tip>{t('assetPanel.iwAiAutoLayout')}</Tip>
      </>
    );
  }

  if (asset.code === 'B10') {
    return (
      <>
        <label className="ppt-check-row"><input type="checkbox" defaultChecked /> {t('assetPanel.iwIncludeBubbleText')}</label>
        <FieldBlock label={t('assetPanel.iwTargetPhrase')}>
          <Input value={values.phrase || ''} placeholder={t('assetPanel.iwPhrasePlaceholder')} onChange={updateText('phrase')} />
        </FieldBlock>
        <FieldBlock label={t('assetPanel.iwStoryChar')}>
          <Input value={values.comicCharacter || ''} placeholder={t('assetPanel.fB10Placeholder')} onChange={updateText('comicCharacter')} />
        </FieldBlock>
        <FieldBlock label={t('assetPanel.iwStoryPlot')}>
          <Input.TextArea value={values.plot || ''} placeholder={t('assetPanel.fB10Placeholder')} onChange={updateText('plot')} />
        </FieldBlock>
        <Tip>{t('assetPanel.iwAutoComicLayout')}</Tip>
      </>
    );
  }

  if (asset.code === 'B11') {
    return (
      <>
        <div className="ppt-b11-selected">
          <span>{t('assetPanel.iwSelectFromBelow')}</span>
        </div>
        <FieldBlock label={t('assetPanel.iwSearchActions')}>
          <Input value={values.actionSearch || ''} placeholder={t('assetPanel.iwSearchPlaceholder')} onChange={updateText('actionSearch')} />
        </FieldBlock>
      </>
    );
  }

  return (
    <PromptField
      label={t('assetPanel.iwDescribeScene') + ' ' + t('assetPanel.iwAnyLanguage')}
      value={values.prompt}
      placeholder={t('assetPanel.iwScenePlaceholder')}
      onChange={(value) => setValue('prompt', value)}
      maxLength={40}
    />
  );
}

export function ImageAssetWizard({ asset, onBack, onInsert, onTitleChange }) {
  const { t, i18n } = useTranslation();
  const isEn = i18n.language?.startsWith('en');
  const [stage, setStage] = React.useState('form');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [results, setResults] = React.useState([]);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [values, setValues] = React.useState({
    ratio: asset.code === 'B3' ? '3:4' : asset.code === 'B4' ? '9:16' : '16:9',
    style: asset.code === 'B4' ? (isEn ? 'Realistic Photography' : '写实摄影') : (isEn ? 'Cartoon Illustration' : '卡通插画'),
    prompt: '',
    whitespace: isEn ? 'Bottom' : '底部',
    theme: isEn ? 'Fitness' : '体能',
    topicWords: '',
    chart: isEn ? 'Mind Map' : '思维导图',
    comicStyle: isEn ? 'Q-version cute' : 'Q版萌系',
    character: 'Poppy',
    action: isEn ? 'Standing Stretch' : '站立伸展',
    actions: ['Cobra', 'Dolphin pose', 'Mouse pose'],
    actionType: isEn ? 'Yoga / Pose' : '瑜伽 / 姿势',
    words: 'apple\nbanana',
    flashWords: ['apple', 'banana'],
    includeChinese: true,
    includePhonetic: false,
    comicDialogue: true,
    textLayout: isEn ? 'Dialogue Bubble' : '对话气泡',
    knowledgeItems: '',
    storybookTitle: '',
    storybookContent: '',
    storybookStyle: isEn ? 'Watercolor Picture Book' : '水彩绘本',
    storybookGrade: isEn ? 'Grade 2 (7-8 years)' : '小二（7-8岁）',
    ipCharacters: ['Poppy', 'Edi'],
    ipScene: isEn ? 'Space classroom, learning planet words' : '太空教室，认识星球单词',
    ipBgPrompt: isEn ? 'Space classroom background, bright, suitable for PPT cover, no text.' : '太空教室背景，明亮、适合PPT封面，无文字。',
    ipBgScale: 100,
    ipBgIndex: 0,
    ipComposed: false,
    ipLayers: [],
  });
  const imageFields = getImageSpecificFields(t);
  const field = imageFields[asset.code] || imageFields.B1;
  const isFixedRatio = ['B3', 'B8', 'B10', 'B11'].includes(asset.code);

  const setValue = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  React.useEffect(() => {
    if (stage === 'generating') onTitleChange?.(t('assetPanel.iwGenerating'));
    else if (stage === 'result') onTitleChange?.(t('assetPanel.iwSelectImage'));
    else onTitleChange?.(getFocusedImageTitles(t)[asset.code] || asset.title);
  }, [asset.code, asset.title, onTitleChange, stage]);

  const handleGenerate = React.useCallback(async () => {
    setStage('generating');
    setErrorMessage('');
    try {
      const request = buildImageGenerationRequest(asset, values);
      const response = await apiService.post('/api/ai/generate-ppt-asset', request);
      const nextResults = (response.assets?.length ? response.assets : [response.asset]).filter(Boolean).map((item, index) => ({
        ...item,
        title: item.title || `${asset.title} ${index + 1}`,
        assetCode: asset.code,
        imageSubtype: response.imageSubtype,
        width: item.width,
        height: item.height,
      }));
      const completedResults = await Promise.all(nextResults.map(pollGeneratedImage));
      setResults(completedResults);
      setSelectedIndex(0);
      setStage('result');
    } catch (error) {
      setErrorMessage(error.message || t('assetPanel.iwGenFailed'));
      setStage('form');
    }
  }, [asset, values]);

  const handleSaveOnly = React.useCallback(async () => {
    const selectedResult = results[selectedIndex] || results[0];
    if (!selectedResult?.url) {
      message.warning(t('assetPanel.iwNotReady'));
      return;
    }

    try {
      await apiService.post('/api/ppt-images', {
        name: selectedResult.title || asset.title,
        imageUrl: selectedResult.url,
        tags: [
          asset.code,
          selectedResult.imageSubtype || selectedResult.assetCode || asset.code,
          t('assetPanel.iwAiIllustration'),
        ].filter(Boolean),
      });
      message.success(t('assetPanel.iwSavedToLibrary'));
    } catch (error) {
      message.error(error.message || t('assetPanel.iwSaveFailed'));
    }
  }, [asset, results, selectedIndex]);

  if (stage === 'generating') {
    const batchItems = buildBatchItems(asset, values) || [];
    return (
      <GenerationProgress
        title={t('assetPanel.iwAiGeneratingTitle')}
        subtitle={asset.code === 'B13' ? `${values.ipCharacters.join('、')} · ${values.ratio}` : `${values.style} · ${values.ratio}`}
        batch={asset.code === 'B3' || asset.code === 'B11' ? { done: 0, total: batchItems.length || 1, unit: t('assetPanel.iwPages') } : null}
      />
    );
  }

  if (stage === 'result') {
    const selectedResult = results[selectedIndex] || results[0] || null;
    return (
      <GeneratedAssetResults
        kind="image"
        asset={{ ...asset, results }}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        onRegenerate={handleGenerate}
        onSaveOnly={handleSaveOnly}
        onInsert={() => {
          if (asset.code === 'B3') {
            const completedItems = results.filter((item) => item?.url);
            onInsert('image', {
              ...asset,
              ...selectedResult,
              title: asset.title,
              items: completedItems.length ? completedItems : results,
            });
            return;
          }
          onInsert('image', { ...asset, ...selectedResult, title: selectedResult?.title || asset.title });
        }}
      />
    );
  }

  if (asset.code === 'B13') {
    return <IpSceneWizard values={values} setValue={setValue} onGenerate={() => onInsert('image', asset)} />;
  }

  if (['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B10', 'B11'].includes(asset.code)) {
    return (
      <>
        <FocusedImageForm
          asset={asset}
          values={values}
          setValue={setValue}
          onGenerate={handleGenerate}
        />
        {errorMessage ? <div className="ppt-img-ai-tip">{errorMessage}</div> : null}
      </>
    );
  }

  if (asset.code === 'B9') {
    return (
      <>
        <StorybookImageWizard values={values} setValue={setValue} onGenerate={handleGenerate} />
        {errorMessage ? <div className="ppt-img-ai-tip">{errorMessage}</div> : null}
      </>
    );
  }

  return (
    <>
      <div className="ppt-asset-form">
        {isFixedRatio ? (
          <div className="ppt-fixed-ratio"><span>{t('assetPanel.iwRatio')}</span><strong>{asset.code === 'B3' ? '1:1' : values.ratio}</strong><em>{t('assetPanel.iwFixedCannotChange')}</em></div>
        ) : (
          <FieldBlock label={t('assetPanel.iwRatio')}>
            <OptionGrid options={getRatioOptions(t)} value={values.ratio} onChange={(value) => setValue('ratio', value)} columns={5} />
          </FieldBlock>
        )}

        {!['B8', 'B10', 'B11'].includes(asset.code) ? (
          <FieldBlock label={t('assetPanel.iwStyle')}>
            <OptionGrid options={getStyleOptions(t)} value={values.style} onChange={(value) => setValue('style', value)} columns={3} />
          </FieldBlock>
        ) : null}

        <ImageSpecificOptions asset={asset} values={values} setValue={setValue} />

        <div className="ppt-asset-divider" />
        <ImageTypeContent asset={asset} values={values} setValue={setValue} />
        {!['B3', 'B5', 'B6', 'B8', 'B10'].includes(asset.code) ? <Tip>{field.note}</Tip> : null}

      </div>
      <div className="ppt-inline-footer">
        {errorMessage ? <Tip>{errorMessage}</Tip> : null}
        <button type="button" className="ppt-primary-btn" onClick={handleGenerate}>
          <Sparkles size={14} />{t('assetPanel.iwGenerateImage')}
        </button>
      </div>
    </>
  );
}
