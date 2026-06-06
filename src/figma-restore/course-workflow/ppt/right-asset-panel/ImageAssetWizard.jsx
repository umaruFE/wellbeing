import React from 'react';
import { Input } from 'antd';
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
import {
  actionOptions,
  activityThemes,
  characterOptions,
  chartOptions,
  comicStyles,
  imageSpecificFields,
  ratioOptions,
  styleOptions,
  whitespaceOptions,
} from './assetPanelData';
import { FieldBlock, OptionGrid, PromptField, Tip } from './AssetControls';
import { GenerationProgress } from './GenerationProgress';
import { GeneratedAssetResults } from './GeneratedAssetResults';

function ImageSpecificOptions({ asset, values, setValue }) {
  if (asset.code === 'B4') {
    return (
      <FieldBlock label="文字留白区域">
        <OptionGrid options={whitespaceOptions} value={values.whitespace} onChange={(value) => setValue('whitespace', value)} columns={4} />
      </FieldBlock>
    );
  }
  if (asset.code === 'B5') {
    return (
      <FieldBlock label="活动主题">
        <OptionGrid options={activityThemes} value={values.theme} onChange={(value) => setValue('theme', value)} columns={4} />
      </FieldBlock>
    );
  }
  if (asset.code === 'B8') {
    return (
      <>
        <FieldBlock label="图表类型">
          <OptionGrid options={chartOptions} value={values.chart} onChange={(value) => setValue('chart', value)} columns={4} />
        </FieldBlock>
        <FieldBlock label="输出方向">
          <OptionGrid options={ratioOptions.slice(0, 2)} value={values.ratio} onChange={(value) => setValue('ratio', value)} columns={2} />
        </FieldBlock>
      </>
    );
  }
  if (asset.code === 'B10') {
    return (
      <FieldBlock label="漫画风格">
        <OptionGrid options={comicStyles} value={values.comicStyle} onChange={(value) => setValue('comicStyle', value)} columns={3} />
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
          <OptionGrid options={actionOptions} value={values.action} onChange={(value) => setValue('action', value)} columns={2} />
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
  const [generating, setGenerating] = React.useState(false);

  return (
    <div className="ppt-img-flow">
      <div className="ppt-img-flow-body">
        <StorybookStepper step={step} generating={generating} />
        {step === 0 ? <StorybookPasteStep values={values} setValue={setValue} /> : null}
        {step === 1 ? <StorybookPreviewStep values={values} /> : null}
        {step === 2 ? <StorybookGenerateStep /> : null}
      </div>
      <div className="ppt-inline-footer ppt-img-footer">
        {step === 1 ? <button type="button" className="ppt-ghost-btn" onClick={() => setStep(0)}>上一步</button> : null}
        <button
          type="button"
          className={`ppt-primary-btn ${generating ? 'is-disabled' : ''}`}
          onClick={() => {
            if (step === 0) setStep(1);
            else if (step === 1) {
              setGenerating(true);
              setStep(2);
            } else onGenerate();
          }}
          disabled={generating}
        >
          <Sparkles size={14} />
          {step === 0 ? '下一步：确认分镜内容' : step === 1 ? '开始生成 5 张' : '生成中...'}
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
  const [stage, setStage] = React.useState('form');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
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
  });
  const field = imageSpecificFields[asset.code] || imageSpecificFields.B1;
  const isFixedRatio = ['B3', 'B8', 'B10', 'B11'].includes(asset.code);

  const setValue = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  React.useEffect(() => {
    if (stage === 'generating') onTitleChange?.('正在生成...');
    else if (stage === 'result') onTitleChange?.('选择图片');
    else onTitleChange?.(focusedImageTitles[asset.code] || asset.title);
  }, [asset.code, asset.title, onTitleChange, stage]);

  React.useEffect(() => {
    if (stage !== 'generating') return undefined;
    const timer = window.setTimeout(() => {
      setSelectedIndex(0);
      setStage('result');
    }, 1600);
    return () => window.clearTimeout(timer);
  }, [stage]);

  if (stage === 'generating') {
    return (
      <GenerationProgress
        title="AI 正在生成图片"
        subtitle={`${values.style} · ${values.ratio}`}
        batch={asset.code === 'B3' || asset.code === 'B11' ? { done: 2, total: 6, unit: '张' } : null}
      />
    );
  }

  if (stage === 'result') {
    return (
      <GeneratedAssetResults
        kind="image"
        asset={asset}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        onRegenerate={() => setStage('generating')}
        onInsert={() => onInsert('image', asset)}
      />
    );
  }

  if (['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B10', 'B11'].includes(asset.code)) {
    return (
      <FocusedImageForm
        asset={asset}
        values={values}
        setValue={setValue}
        onGenerate={() => setStage('generating')}
      />
    );
  }

  if (asset.code === 'B9') {
    return <StorybookImageWizard values={values} setValue={setValue} onGenerate={() => setStage('generating')} />;
  }

  return (
    <>
      <div className="ppt-asset-form">
        {isFixedRatio ? (
          <div className="ppt-fixed-ratio"><span>比例</span><strong>{asset.code === 'B3' ? '1:1' : values.ratio}</strong><em>固定，不可更改</em></div>
        ) : (
          <FieldBlock label="比例">
            <OptionGrid options={ratioOptions} value={values.ratio} onChange={(value) => setValue('ratio', value)} columns={5} />
          </FieldBlock>
        )}

        {!['B8', 'B10', 'B11'].includes(asset.code) ? (
          <FieldBlock label="风格">
            <OptionGrid options={styleOptions} value={values.style} onChange={(value) => setValue('style', value)} columns={3} />
          </FieldBlock>
        ) : null}

        <ImageSpecificOptions asset={asset} values={values} setValue={setValue} />

        <div className="ppt-asset-divider" />
        <ImageTypeContent asset={asset} values={values} setValue={setValue} />
        {!['B3', 'B5', 'B6', 'B8', 'B10'].includes(asset.code) ? <Tip>{field.note}</Tip> : null}

      </div>
      <div className="ppt-inline-footer">
        <button type="button" className="ppt-primary-btn" onClick={() => setStage('generating')}>
          <Sparkles size={14} />生成图片
        </button>
      </div>
    </>
  );
}
