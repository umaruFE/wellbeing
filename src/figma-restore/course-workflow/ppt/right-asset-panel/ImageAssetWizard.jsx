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
      <FieldBlock label="活动主题">
        <OptionGrid options={activityThemeOpts} value={values.theme} onChange={(value) => setValue('theme', value)} columns={4} />
      </FieldBlock>
    );
  }
  if (asset.code === 'B8') {
    return (
      <>
        <FieldBlock label="图表类型">
          <OptionGrid options={chartOpts} value={values.chart} onChange={(value) => setValue('chart', value)} columns={4} />
        </FieldBlock>
        <FieldBlock label="输出方向">
          <OptionGrid options={ratioOpts.slice(0, 2)} value={values.ratio} onChange={(value) => setValue('ratio', value)} columns={2} />
        </FieldBlock>
      </>
    );
  }
  if (asset.code === 'B10') {
    return (
      <FieldBlock label="漫画风格">
        <OptionGrid options={comicStyleOpts} value={values.comicStyle} onChange={(value) => setValue('comicStyle', value)} columns={3} />
      </FieldBlock>
    );
  }
  if (asset.code === 'B11') {
    return (
      <>
        <FieldBlock label="IP 角色">
          <OptionGrid options={characterOptions} value={values.character} onChange={(value) => setValue('character', value)} columns={5} />
        </FieldBlock>
        <FieldBlock label="已选动作">
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

const focusedImageTitles = {
  B1: '生成主题意境图',
  B2: '生成意境图（有文字）',
  B3: 'flashcard 词汇闪卡',
  B4: '故事配图',
  B5: '活动氛围图',
  B6: '主题词图谱',
  B7: '文本配图',
  B8: '知识总结图',
  B9: '绘本故事配图',
  B10: '四格漫画',
  B11: '动作示意图',
  B13: 'IP角色场景图',
};

const activityThemeCards = [
  { value: '艺术', icon: Palette },
  { value: '瑜伽', icon: BookOpen },
  { value: '体能', icon: Dumbbell },
  { value: '音乐', icon: Music },
  { value: '游戏', icon: Gamepad2 },
  { value: '展示', icon: CircleDot },
  { value: '庆祝', icon: Gift },
];

const textLayoutCards = ['对话气泡', '卷轴', '卡片框'];

const knowledgeChartCards = [
  { value: '思维导图', icon: MessageSquareText },
  { value: '知识表格', icon: Table2 },
  { value: '鱼骨图', icon: FishSymbol },
  { value: '树状图', icon: Sprout },
];

const comicStyleCards = ['Q版萌系', '日漫风', '美漫风'];

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
      throw new Error(status.error || '图片生成失败');
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

const b13CharMeta = {
  Poppy: { tag: '活泼', short: 'P', base: '#ff705d', colors: ['#ff705d', '#ff8a7a', '#f97360'], prompt: 'Poppy，活泼友好的IP角色，透明背景，适合儿童英语课堂场景。' },
  Edi: { tag: '冷静', short: 'E', base: '#4f8cff', colors: ['#4f8cff', '#60a5fa', '#2563eb'], prompt: 'Edi，冷静聪明的IP角色，透明背景，正在引导学生观察和思考。' },
  Rolly: { tag: '温暖', short: 'R', base: '#22c55e', colors: ['#22c55e', '#34d399', '#16a34a'], prompt: 'Rolly，温暖可靠的IP角色，透明背景，动作亲切自然。' },
  Milo: { tag: '自信', short: 'M', base: '#f59e0b', colors: ['#f59e0b', '#fbbf24', '#d97706'], prompt: 'Milo，自信开朗的IP角色，透明背景，站姿积极有表现力。' },
  Ace: { tag: '机智', short: 'A', base: '#8b5cf6', colors: ['#8b5cf6', '#a78bfa', '#7c3aed'], prompt: 'Ace，机智敏捷的IP角色，透明背景，动作轻快，适合趣味课堂。' },
};

const b13BgVariants = [
  { name: '太空教室', symbol: '✦', css: 'radial-gradient(circle at 18% 20%,#fff7ad 0 .7rem,transparent .75rem),radial-gradient(circle at 76% 34%,#bfdbfe 0 1rem,transparent 1.05rem),linear-gradient(135deg,#dbeafe 0%,#eef2ff 45%,#fff7ed 100%)' },
  { name: '森林课堂', symbol: '葉', css: 'radial-gradient(circle at 18% 28%,#bbf7d0 0 2.6rem,transparent 2.7rem),radial-gradient(circle at 76% 24%,#fde68a 0 2rem,transparent 2.1rem),linear-gradient(135deg,#dcfce7 0%,#ecfccb 48%,#fef3c7 100%)' },
  { name: '海底实验室', symbol: '水', css: 'radial-gradient(circle at 22% 28%,rgba(255,255,255,.72) 0 .65rem,transparent .7rem),radial-gradient(circle at 72% 64%,rgba(255,255,255,.55) 0 .9rem,transparent .95rem),linear-gradient(135deg,#bae6fd 0%,#a7f3d0 50%,#e0f2fe 100%)' },
  { name: '农场舞台', symbol: 'IP', css: 'radial-gradient(circle at 20% 78%,#fcd34d 0 2rem,transparent 2.1rem),radial-gradient(circle at 78% 30%,#fecaca 0 2.2rem,transparent 2.3rem),linear-gradient(135deg,#fef3c7 0%,#dcfce7 52%,#fee2e2 100%)' },
];

const b13Examples = [
  { label: '森林探险', value: '森林教室，寻找动物单词' },
  { label: '海底实验室', value: '海底实验室，观察颜色词汇' },
  { label: '农场运动会', value: '农场运动会，学习动物动作' },
];

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
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">比例</div>
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
  return (
    <div className="ppt-storybook-stepper" aria-label="IP角色场景图步骤">
      {['设定', '编排', '合成'].map((label, index) => (
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
  const toggle = (name) => {
    const next = value.includes(name) ? value.filter((item) => item !== name) : [...value, name];
    if (next.length) onChange(next);
  };

  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">选择IP角色 <span>可多选，默认生成独立透明角色图层。</span></div>
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
  const virtual = b13VirtualSize(values.ratio);
  const bg = b13BgVariants[values.ipBgIndex % b13BgVariants.length] || b13BgVariants[0];
  return (
    <div className={final ? 'b13-final-preview' : 'b13-preview-card b13-step2-preview-card'} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      <div className={final ? 'b13-preview-art b13-final-art' : 'b13-preview-art b13-step2-preview-art'} style={{ aspectRatio: values.ratio.replace(':', ' / '), background: bg.css }}>
        {final ? <span className="b13-preview-badge done">合成完成</span> : null}
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
    setValue('ipBgPrompt', `${values.ipScene} 背景画面，明亮清晰，适合PPT课件，无文字。`);
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
                <strong>图层已分离准备完毕</strong>
                <span>您可以直接生成，或进入全屏微调角色位置。</span>
              </div>
            </div>
            <B13MiniPreview values={values} onClick={() => setModalOpen(true)} />
            <div className="b13-ready-summary-card">
              <div><span className="b13-ready-check">✓</span><b>背景就绪</b></div>
              <i />
              <div><span className="b13-ready-check">✓</span><b>{values.ipLayers.length} 个角色已就绪</b></div>
            </div>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="b13-drawer-body">
            <B13MiniPreview values={values} final />
            <div className="b13-status-list final">
              <div><span>画面比例</span><b>{values.ratio}</b></div>
              <div><span>IP角色</span><b>{values.ipLayers.length}个角色</b></div>
              <div><span>输出格式</span><b>PNG · 透明图层已合成</b></div>
            </div>
          </div>
        ) : null}
      </div>
      <div className="ppt-inline-footer ppt-img-footer">
        {step === 0 ? <button type="button" className="ppt-primary-btn" onClick={generatePreview}><Sparkles size={14} />生成图片</button> : null}
        {step === 1 ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(0)}>上一步</button>
            <button type="button" className="ppt-primary-btn" onClick={() => { setValue('ipComposed', true); setStep(2); }}>下一步 →</button>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <button type="button" className="ppt-ghost-btn">保存到素材库</button>
            <button type="button" className="ppt-primary-btn" onClick={onGenerate}>插入画布 →</button>
          </>
        ) : null}
      </div>
      {modalOpen ? (
        <div className="b13-compose-modal-wrap">
          <div className="b13-modal">
            <div className="b13-modal-hd">
              <div><div className="b13-modal-title">IP角色场景图 · 编排</div></div>
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
                    <div className="b13-prop-title">背景设置</div>
                    <label className="b13-prop-label">背景提示词</label>
                    <Input.TextArea className="ppt-img-textarea-input b13-prop-textarea" value={values.ipBgPrompt || ''} onChange={(event) => setValue('ipBgPrompt', event.target.value)} />
                    <div className="b13-action-grid"><button type="button" className="btn b13-regen-btn" onClick={() => setValue('ipBgIndex', (values.ipBgIndex + 1) % b13BgVariants.length)}>重新生成背景</button></div>
                    <label className="b13-prop-label">背景缩放 <span>{values.ipBgScale || 100}%</span></label>
                    <input type="range" min="100" max="150" value={values.ipBgScale || 100} onChange={(event) => setValue('ipBgScale', Number(event.target.value))} />
                    <div className="b13-prop-note">背景不支持旋转和翻转，仅支持重新生成与缩放。</div>
                  </div>
                ) : (
                  <div className="b13-prop-section">
                    <div className="b13-prop-title">{selectedLayer.name}角色设置</div>
                    <label className="b13-prop-label">角色提示词</label>
                    <Input.TextArea className="ppt-img-textarea-input b13-prop-textarea" value={selectedLayer.prompt || ''} onChange={(event) => updateLayer(selectedLayer.key, { prompt: event.target.value })} />
                    <div className="b13-action-grid"><button type="button" className="btn b13-regen-btn" onClick={() => updateLayer(selectedLayer.key, { variant: (selectedLayer.variant || 0) + 1 })}>重新生成角色</button></div>
                    <div className="b13-num-grid">
                      <label>X<Input type="number" value={Math.round(selectedLayer.x)} onChange={(event) => updateLayer(selectedLayer.key, { x: Number(event.target.value) })} /></label>
                      <label>Y<Input type="number" value={Math.round(selectedLayer.y)} onChange={(event) => updateLayer(selectedLayer.key, { y: Number(event.target.value) })} /></label>
                    </div>
                    <label className="b13-prop-label">大小 <span>{Math.round(selectedLayer.size)}%</span></label>
                    <input type="range" min="55" max="150" value={selectedLayer.size} onChange={(event) => updateLayer(selectedLayer.key, { size: Number(event.target.value) })} />
                    <label className="b13-prop-label">旋转角度 <span>{Math.round(selectedLayer.rot || 0)}°</span></label>
                    <input type="range" min="-45" max="45" value={selectedLayer.rot || 0} onChange={(event) => updateLayer(selectedLayer.key, { rot: Number(event.target.value) })} />
                    <div className="b13-flip-row">
                      <button type="button" className={selectedLayer.flipX ? 'is-active' : ''} onClick={() => updateLayer(selectedLayer.key, { flipX: !selectedLayer.flipX })}>水平翻转</button>
                      <button type="button" className={selectedLayer.flipY ? 'is-active' : ''} onClick={() => updateLayer(selectedLayer.key, { flipY: !selectedLayer.flipY })}>垂直翻转</button>
                    </div>
                    <div className="b13-z-row">
                      <button type="button" onClick={() => moveLayerOrder(-1)}>下移一层</button>
                      <button type="button" onClick={() => moveLayerOrder(1)}>上移一层</button>
                    </div>
                  </div>
                )}
              </aside>
            </div>
            <div className="b13-modal-ft">
              <button type="button" className="b13-footer-btn b13-footer-ghost" onClick={() => setModalOpen(false)}>取消</button>
              <button type="button" className="b13-footer-btn b13-footer-ghost" onClick={() => setModalOpen(false)}>保存编排</button>
              <button type="button" className="b13-footer-btn b13-footer-primary" onClick={() => { setModalOpen(false); setValue('ipComposed', true); setStep(2); }}>保存并合成</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StylePicker({ value, onChange }) {
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">风格</div>
      <div className="ppt-img-style-row">
        {['卡通插画', '写实摄影'].map((style) => (
          <button type="button" key={style} className={value === style ? 'is-active' : ''} onClick={() => onChange(style)}>
            {style}
          </button>
        ))}
      </div>
    </div>
  );
}

function WhitespacePicker({ value, onChange }) {
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label is-muted">文字留白区域</div>
      <div className="ppt-img-whitespace-row">
        {['顶部', '底部', '左侧', '右侧'].map((item) => (
          <button type="button" key={item} className={value === item ? 'is-active' : ''} onClick={() => onChange(item)}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function ActivityThemePicker({ value, onChange }) {
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">活动主题</div>
      <div className="ppt-img-activity-grid">
        {activityThemeCards.map(({ value: theme, icon: Icon }) => (
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
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">文字框样式</div>
      <div className="ppt-img-text-layout-row">
        {textLayoutCards.map((item) => (
          <button type="button" key={item} className={value === item ? 'is-active' : ''} onClick={() => onChange(item)}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function KnowledgeChartPicker({ value, onChange }) {
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">图表类型</div>
      <div className="ppt-img-knowledge-grid">
        {knowledgeChartCards.map(({ value: item, icon: Icon }) => (
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
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">输出方向</div>
      <div className="ppt-img-output-row">
        {[
          ['16:9', '16:9横版（PPT）'],
          ['9:16', '9:16竖版（海报）'],
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
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">漫画风格</div>
      <div className="ppt-img-text-layout-row">
        {comicStyleCards.map((item) => (
          <button type="button" key={item} className={value === item ? 'is-active' : ''} onClick={() => onChange(item)}>
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function CharacterPicker({ value, onChange }) {
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">IP 角色</div>
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
        <div className="ppt-img-label">动作类型</div>
        <div className="ppt-img-output-row">
          {[
            ['瑜伽 / 姿势', '▱'],
            ['TPR 体能', '◉'],
          ].map(([item, icon]) => (
            <button type="button" key={item} className={values.actionType === item ? 'is-active' : ''} onClick={() => setValue('actionType', item)}>
              <span className="ppt-img-action-type-icon">{icon}</span>{item}
            </button>
          ))}
        </div>
      </div>
      <div className="ppt-img-section">
        <div className="ppt-img-label">已选动作 <span>每个动作生成1张</span></div>
        <div className="ppt-img-selected-action">
          {selected.length ? selected.map((action) => (
            <button type="button" key={action} onClick={() => removeAction(action)}>
              {action} ×
            </button>
          )) : <span>从下方选择或搜索添加动作...</span>}
        </div>
        <Input
          className="ppt-img-text-input"
          value={draft}
          placeholder="搜索动作，或输入后按 Enter 新增"
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
  return (
    <div className="ppt-img-fixed-ratio-bar">
      <span>比例</span>
      <strong>{ratio}</strong>
      <em>固定，不可更改</em>
    </div>
  );
}

function ScenePromptBox({ value, onChange }) {
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">描述场景 <span>（中英文均可）</span></div>
      <div className="ppt-img-prompt-box">
        <Input.TextArea
          value={value}
          placeholder="例：太空场景，宇宙飞船驾驶舱"
          maxLength={40}
          onChange={(event) => onChange(event.target.value)}
        />
        <div>
          <span>{value.length} / 40</span>
          <button type="button">帮我写</button>
        </div>
      </div>
    </div>
  );
}

function FlashcardPreview({ word, includeChinese, includePhonetic }) {
  return (
    <div className="ppt-img-section">
      <div className="ppt-img-label">效果预览</div>
      <div className="ppt-b3-preview-stage">
        <div className="ppt-b3-preview-card">
          <div><span>AI 插图区域</span></div>
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
      <div className="ppt-img-label">词汇列表 <span>（输入后按回车添加）</span></div>
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
          placeholder="输入词汇后按 Enter 添加..."
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
            含中文释义
          </label>
          <label>
            <input type="checkbox" checked={!!values.includePhonetic} onChange={(event) => setValue('includePhonetic', event.target.checked)} />
            含音标
          </label>
          <span>{words.length} 个词</span>
        </div>
      </div>
    </div>
  );
}

function FocusedImageForm({ asset, values, setValue, onGenerate }) {
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
              <div className="ppt-img-label">故事场景描述</div>
              <Input
                className="ppt-img-text-input"
                value={values.storyScene || ''}
                placeholder="例：森林里的小木屋，秋天傍晚"
                onChange={(event) => setValue('storyScene', event.target.value)}
              />
            </div>
            <div className="ppt-img-section">
              <div className="ppt-img-label">角色描述（可选）</div>
              <Input
                className="ppt-img-text-input"
                value={values.storyCharacter || ''}
                placeholder="例：戴眼镜的小女孩，橙色外套"
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
              <div className="ppt-img-label">活动标题</div>
              <Input
                className="ppt-img-text-input"
                value={values.activityTitle || ''}
                placeholder="例：Animal Sports Day / 星际音乐会"
                onChange={(event) => setValue('activityTitle', event.target.value)}
              />
            </div>
            <div className="ppt-img-ai-tip">
              AI 根据主题类型和活动标题自动生成画面，无需描述提示词
            </div>
          </>
        ) : null}
        {isTopicMap ? (
          <>
            <div className="ppt-asset-divider" />
            <div className="ppt-img-section">
              <div className="ppt-img-label">场景名称</div>
              <Input
                className="ppt-img-text-input"
                value={values.topicScene || ''}
                placeholder="例：厨房 Kitchen"
                onChange={(event) => setValue('topicScene', event.target.value)}
              />
            </div>
            <div className="ppt-img-section">
              <div className="ppt-img-label">标注词汇（每行一个，至少5个）</div>
              <Input.TextArea
                className="ppt-img-textarea-input"
                value={values.topicWords || ''}
                placeholder={'冰箱 refrigerator\n炉灶 stove\n水龙头 faucet'}
                onChange={(event) => setValue('topicWords', event.target.value)}
              />
            </div>
            <div className="ppt-img-ai-tip">AI生成场景图并自动标注词汇位置</div>
          </>
        ) : null}
        {isTextImage ? (
          <>
            <div className="ppt-asset-divider" />
            <TextLayoutPicker value={values.textLayout} onChange={(value) => setValue('textLayout', value)} />
            <div className="ppt-img-section">
              <div className="ppt-img-label">文字内容（谜题、对话等）</div>
              <Input.TextArea
                className="ppt-img-textarea-input is-text-card"
                value={values.textContent || ''}
                placeholder={'例：What can fly but has no wings?\n——A dream!'}
                onChange={(event) => setValue('textContent', event.target.value)}
              />
            </div>
            <div className="ppt-img-section">
              <div className="ppt-img-label">背景场景描述</div>
              <Input
                className="ppt-img-text-input"
                value={values.textBackground || ''}
                placeholder="例：神秘森林，夜晚，星光"
                onChange={(event) => setValue('textBackground', event.target.value)}
              />
            </div>
          </>
        ) : null}
        {isKnowledgeImage ? (
          <>
            <div className="ppt-img-section">
              <div className="ppt-img-label">中心主题词</div>
              <Input
                className="ppt-img-text-input"
                value={values.knowledgeTopic || ''}
                placeholder="例：Present Tense 现在时"
                onChange={(event) => setValue('knowledgeTopic', event.target.value)}
              />
            </div>
            <div className="ppt-img-section">
              <div className="ppt-img-label">知识点/分支内容（每行一条）</div>
              <Input.TextArea
                className="ppt-img-textarea-input"
                value={values.knowledgeItems || ''}
                placeholder={'Simple Present: 主语+动词原形\nPresent Continuous: 主语+am/is/are+V-ing\n用法：表示习惯性动作'}
                onChange={(event) => setValue('knowledgeItems', event.target.value)}
              />
            </div>
            <div className="ppt-img-ai-tip">AI根据图表类型自动排布知识结构</div>
          </>
        ) : null}
        {isComicImage ? (
          <>
            <ComicStylePicker value={values.comicStyle} onChange={(value) => setValue('comicStyle', value)} />
            <label className="ppt-img-check-row">
              <input type="checkbox" checked={values.comicDialogue !== false} onChange={(event) => setValue('comicDialogue', event.target.checked)} />
              含对话气泡文字
            </label>
            <div className="ppt-asset-divider" />
            <div className="ppt-img-section">
              <div className="ppt-img-label">目标短语/句型</div>
              <Input
                className="ppt-img-text-input"
                value={values.phrase || ''}
                placeholder="例：Can I have...? / I want to..."
                onChange={(event) => setValue('phrase', event.target.value)}
              />
            </div>
            <div className="ppt-img-section">
              <div className="ppt-img-label">故事主角</div>
              <Input
                className="ppt-img-text-input"
                value={values.comicCharacter || ''}
                placeholder="例：一只爱吃糖的北极熊"
                onChange={(event) => setValue('comicCharacter', event.target.value)}
              />
            </div>
            <div className="ppt-img-section">
              <div className="ppt-img-label">故事情节（可选，留空则AI自由发挥）</div>
              <Input.TextArea
                className="ppt-img-textarea-input"
                value={values.plot || ''}
                placeholder="例：第1格：主角发现冰淇淋店..."
                onChange={(event) => setValue('plot', event.target.value)}
              />
            </div>
            <div className="ppt-img-ai-tip">固定4格漫画布局，AI自动编排起承转合</div>
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
                <div className="ppt-img-label">叠加文字内容</div>
                <Input
                  className="ppt-img-text-input"
                  value={values.overlayText || ''}
                  placeholder="例:Reach for the Stars!"
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
          <Sparkles size={14} />生成图片
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
  const labels = ['粘贴故事', '确认预览', '生成图片'];
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
  const examples = ['三只小猪', '曹冲称象', '坐井观天'];
  return (
    <div className="ppt-storybook-body">
      <div className="ppt-img-section">
        <div className="ppt-img-label">故事名称</div>
        <Input
          className="ppt-img-text-input"
          value={values.storybookTitle || ''}
          placeholder="给你的绘本起个名字吧..."
          onChange={(event) => setValue('storybookTitle', event.target.value)}
        />
      </div>
      <div className="ppt-img-section">
        <div className="ppt-img-label-row"><span>故事内容</span><em>{(values.storybookContent || '').length} 字</em></div>
        <Input.TextArea
          className="ppt-storybook-textarea"
          value={values.storybookContent || ''}
          placeholder="请粘贴您的故事内容，AI 将自动为您拆分成多页绘本分镜..."
          onChange={(event) => setValue('storybookContent', event.target.value)}
        />
      </div>
      <div className="ppt-storybook-examples">
        <span>示例：</span>
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
        <div className="ppt-img-label">画面风格</div>
        <div className="ppt-img-text-layout-row">
          {['水彩绘本', '3D卡通', '剪纸拼贴'].map((item) => (
            <button type="button" key={item} className={values.storybookStyle === item ? 'is-active' : ''} onClick={() => setValue('storybookStyle', item)}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="ppt-img-section">
        <div className="ppt-img-label">阅读目标年级</div>
        <div className="ppt-storybook-grade-grid">
          {['小一（6-7岁）', '小二（7-8岁）', '小三（8-9岁）', '小四（9-10岁）'].map((item) => (
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
  return (
    <div className="ppt-storybook-body">
      <div className="ppt-storybook-summary">
        <strong>三只小猪</strong>
        <span>水彩绘本</span>
        <em>共 5 页</em>
      </div>
      <div className="ppt-storybook-frame-grid">
        {storybookFrames.map((frame, index) => (
          <article key={frame}>
            <div>
              <b>{index + 1}</b>
              <strong>分镜脚本</strong>
              <span>待配图</span>
            </div>
            <p>{frame}</p>
          </article>
        ))}
      </div>
      <p className="ppt-storybook-note">生成后支持单页重新绘制</p>
    </div>
  );
}

function StorybookGenerateStep() {
  return (
    <div className="ppt-storybook-generate">
      <div className="ppt-storybook-spinner"><span /></div>
      <strong>AI 正在施展魔法...</strong>
      <em>已完成 1 / 5 页</em>
      <div className="ppt-storybook-progress"><i /></div>
      <div className="ppt-storybook-running-tip">正在生成第 2 页：“第一只小猪用稻草盖了一所房子...”</div>
      <div className="ppt-storybook-result-grid">
        {storybookFrames.slice(0, 4).map((frame, index) => (
          <article key={frame} className={index === 0 ? 'is-done' : index === 1 ? 'is-running' : ''}>
            <div><b>{index + 1}</b>{index === 0 ? <span>✓</span> : index === 1 ? <span>⌛</span> : null}</div>
            <strong>{index === 0 ? 'Page 1' : ''}</strong>
            <p>{frame}</p>
          </article>
        ))}
      </div>
      <p className="ppt-storybook-note">请勿关闭面板，生成完成后自动跳转</p>
    </div>
  );
}

function StorybookImageWizard({ values, setValue, onGenerate }) {
  const [step, setStep] = React.useState(0);

  return (
    <div className="ppt-img-flow">
      <div className="ppt-img-flow-body">
        <StorybookStepper step={step} generating={false} />
        {step === 0 ? <StorybookPasteStep values={values} setValue={setValue} /> : null}
        {step === 1 ? <StorybookPreviewStep values={values} /> : null}
      </div>
      <div className="ppt-inline-footer ppt-img-footer">
        {step === 1 ? <button type="button" className="ppt-ghost-btn" onClick={() => setStep(0)}>上一步</button> : null}
        <button
          type="button"
          className="ppt-primary-btn"
          onClick={() => {
            if (step === 0) setStep(1);
            else onGenerate();
          }}
        >
          <Sparkles size={14} />
          {step === 0 ? '下一步：确认分镜内容' : '开始生成图片'}
        </button>
      </div>
    </div>
  );
}

function ImageTypeContent({ asset, values, setValue }) {
  const updateText = (key) => (event) => setValue(key, event.target.value);

  if (asset.code === 'B2') {
    return (
      <>
        <PromptField
          label="描述场景（中英文均可）"
          value={values.scene || ''}
          placeholder="例：太空场景，宇宙飞船驾驶舱"
          onChange={(value) => setValue('scene', value)}
          maxLength={40}
        />
        <FieldBlock label="叠加文字内容">
          <Input value={values.overlayText || ''} placeholder="例:Reach for the Stars!" onChange={updateText('overlayText')} />
        </FieldBlock>
      </>
    );
  }

  if (asset.code === 'B3') {
    return (
      <>
        <FieldBlock label="词汇列表（输入后按回车添加）">
          <div className="ppt-b3-word-box">
            <div className="ppt-b3-chip-row">
              <span>apple x</span>
              <span>banana x</span>
            </div>
            <Input.TextArea
              value={values.words || 'apple\nbanana'}
              onChange={updateText('words')}
              placeholder="输入词汇后按回车添加"
            />
            <div className="ppt-b3-option-row">
              <label><input type="checkbox" defaultChecked /> 含中文释义</label>
              <label><input type="checkbox" /> 含音标</label>
              <span>2 个词</span>
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
        <FieldBlock label="故事场景描述">
          <Input value={values.storyScene || ''} placeholder="例：森林里的小木屋，秋天傍晚" onChange={updateText('storyScene')} />
        </FieldBlock>
        <FieldBlock label="角色描述（可选）">
          <Input value={values.storyCharacter || ''} placeholder="例：戴眼镜的小女孩，橙色外套" onChange={updateText('storyCharacter')} />
        </FieldBlock>
      </>
    );
  }

  if (asset.code === 'B5') {
    return (
      <>
        <FieldBlock label="活动标题">
          <Input value={values.activityTitle || ''} placeholder="例：Animal Sports Day / 星际音乐会" onChange={updateText('activityTitle')} />
        </FieldBlock>
        <Tip>AI 根据主题类型和活动标题自动生成画面，无需描述提示词</Tip>
      </>
    );
  }

  if (asset.code === 'B6') {
    return (
      <>
        <FieldBlock label="场景名称">
          <Input value={values.mapScene || ''} placeholder="例：厨房 Kitchen" onChange={updateText('mapScene')} />
        </FieldBlock>
        <FieldBlock label="标注词汇（每行一个，至少5个）">
          <Input.TextArea
            value={values.mapWords || ''}
            onChange={updateText('mapWords')}
            placeholder={'冰箱 refrigerator\n炉灶 stove\n水龙头 faucet\n砧板 cutting board\n微波炉 microwave'}
          />
        </FieldBlock>
        <Tip>AI生成场景图并自动标注词汇位置</Tip>
      </>
    );
  }

  if (asset.code === 'B7') {
    return (
      <>
        <FieldBlock label="文字框样式">
          <OptionGrid options={['对话气泡', '卷轴', '卡片框']} value={values.bubble || '对话气泡'} onChange={(value) => setValue('bubble', value)} columns={3} />
        </FieldBlock>
        <FieldBlock label="文字内容（谜题、对话等）">
          <Input.TextArea
            value={values.textContent || ''}
            onChange={updateText('textContent')}
            placeholder={'例：What can fly but has no wings?\n--A dream!'}
          />
        </FieldBlock>
        <FieldBlock label="背景场景描述">
          <Input value={values.textBg || ''} placeholder="例：神秘森林，夜晚，星光" onChange={updateText('textBg')} />
        </FieldBlock>
      </>
    );
  }

  if (asset.code === 'B8') {
    return (
      <>
        <FieldBlock label="中心主题词">
          <Input value={values.center || ''} placeholder="例：Present Tense 现在时" onChange={updateText('center')} />
        </FieldBlock>
        <FieldBlock label="知识点/分支内容（每行一条）">
          <Input.TextArea
            value={values.knowledge || ''}
            onChange={updateText('knowledge')}
            placeholder={'Simple Present: 主语+动词原形\nPresent Continuous: 主语+am/is/are+V-ing\n用法：表示习惯性动作\n例句：She reads every day.'}
          />
        </FieldBlock>
        <Tip>AI根据图表类型自动排布知识结构</Tip>
      </>
    );
  }

  if (asset.code === 'B10') {
    return (
      <>
        <label className="ppt-check-row"><input type="checkbox" defaultChecked /> 含对话气泡文字</label>
        <FieldBlock label="目标短语/句型">
          <Input value={values.phrase || ''} placeholder="例：Can I have...? / I want to..." onChange={updateText('phrase')} />
        </FieldBlock>
        <FieldBlock label="故事主角">
          <Input value={values.comicCharacter || ''} placeholder="例：一只爱吃糖的北极熊" onChange={updateText('comicCharacter')} />
        </FieldBlock>
        <FieldBlock label="故事情节（可选，留空则AI自由发挥）">
          <Input.TextArea value={values.plot || ''} placeholder="例：第1格：主角发现冰淇淋店..." onChange={updateText('plot')} />
        </FieldBlock>
        <Tip>固定4格漫画布局，AI自动编排起承转合</Tip>
      </>
    );
  }

  if (asset.code === 'B11') {
    return (
      <>
        <div className="ppt-b11-selected">
          <span>从下方选择或搜索添加动作...</span>
        </div>
        <FieldBlock label="搜索动作">
          <Input value={values.actionSearch || ''} placeholder="搜索动作，或输入后按 Enter 新增" onChange={updateText('actionSearch')} />
        </FieldBlock>
      </>
    );
  }

  return (
    <PromptField
      label="描述场景（中英文均可）"
      value={values.prompt}
      placeholder="例：太空场景，宇宙飞船驾驶舱"
      onChange={(value) => setValue('prompt', value)}
      maxLength={40}
    />
  );
}

export function ImageAssetWizard({ asset, onBack, onInsert, onTitleChange }) {
  const { t } = useTranslation();
  const [stage, setStage] = React.useState('form');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [results, setResults] = React.useState([]);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [values, setValues] = React.useState({
    ratio: asset.code === 'B3' ? '3:4' : asset.code === 'B4' ? '9:16' : '16:9',
    style: asset.code === 'B4' ? '写实摄影' : '卡通插画',
    prompt: '',
    whitespace: '底部',
    theme: '体能',
    topicWords: '',
    chart: '思维导图',
    comicStyle: 'Q版萌系',
    character: 'Poppy',
    action: '站立伸展',
    actions: ['Cobra', 'Dolphin pose', 'Mouse pose'],
    actionType: '瑜伽 / 姿势',
    words: 'apple\nbanana',
    flashWords: ['apple', 'banana'],
    includeChinese: true,
    includePhonetic: false,
    comicDialogue: true,
    textLayout: '对话气泡',
    knowledgeItems: '',
    storybookTitle: '',
    storybookContent: '',
    storybookStyle: '水彩绘本',
    storybookGrade: '小二（7-8岁）',
    ipCharacters: ['Poppy', 'Edi'],
    ipScene: '太空教室，认识星球单词',
    ipBgPrompt: '太空教室背景，明亮、适合PPT封面，无文字。',
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
    if (stage === 'generating') onTitleChange?.('正在生成...');
    else if (stage === 'result') onTitleChange?.('选择图片');
    else onTitleChange?.(focusedImageTitles[asset.code] || asset.title);
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
      setErrorMessage(error.message || '图片生成失败，请稍后重试');
      setStage('form');
    }
  }, [asset, values]);

  const handleSaveOnly = React.useCallback(async () => {
    const selectedResult = results[selectedIndex] || results[0];
    if (!selectedResult?.url) {
      message.warning('图片还未生成完成，暂时不能存入图片库');
      return;
    }

    try {
      await apiService.post('/api/ppt-images', {
        name: selectedResult.title || asset.title,
        imageUrl: selectedResult.url,
        tags: [
          asset.code,
          selectedResult.imageSubtype || selectedResult.assetCode || asset.code,
          'AI生成',
        ].filter(Boolean),
      });
      message.success('已保存到图片库');
    } catch (error) {
      message.error(error.message || '保存到图片库失败');
    }
  }, [asset, results, selectedIndex]);

  if (stage === 'generating') {
    const batchItems = buildBatchItems(asset, values) || [];
    return (
      <GenerationProgress
        title="AI 正在生成图片"
        subtitle={asset.code === 'B13' ? `${values.ipCharacters.join('、')} · ${values.ratio}` : `${values.style} · ${values.ratio}`}
        batch={asset.code === 'B3' || asset.code === 'B11' ? { done: 0, total: batchItems.length || 1, unit: '张' } : null}
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
          <div className="ppt-fixed-ratio"><span>比例</span><strong>{asset.code === 'B3' ? '1:1' : values.ratio}</strong><em>固定，不可更改</em></div>
        ) : (
          <FieldBlock label="比例">
            <OptionGrid options={getRatioOptions(t)} value={values.ratio} onChange={(value) => setValue('ratio', value)} columns={5} />
          </FieldBlock>
        )}

        {!['B8', 'B10', 'B11'].includes(asset.code) ? (
          <FieldBlock label="风格">
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
          <Sparkles size={14} />生成图片
        </button>
      </div>
    </>
  );
}
