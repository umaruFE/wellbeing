import React from 'react';
import { Input } from 'antd';
import { Check, Sparkles, X } from 'lucide-react';
import poppy from '../../../../assets/ip/poppy.png';
import edi from '../../../../assets/ip/edi.png';
import rolly from '../../../../assets/ip/rolly.png';
import milo from '../../../../assets/ip/milo.png';
import ace from '../../../../assets/ip/ace.png';
import apiService from '../../../../utils/apiService';

const steps = ['场景 · 角色', '词汇与句型', '确认并生成'];
const storySteps = ['角色', '叙事', '脚本', '分镜', '合成'];
const scenes = ['森林', '沙滩', '海洋', '农场', '太空', '雪山'];
const characters = [
  { name: 'Poppy', image: poppy },
  { name: 'Edi', image: edi },
  { name: 'Rolly', image: rolly },
  { name: 'Milo', image: milo },
  { name: 'Ace', image: ace },
];
const bubbleTypes = ['胶囊', '圆形', '方形', '爆炸星'];
const progressRows = [
  { text: '生成开场动画', status: '已完成', state: 'done' },
  { text: '第一关：单词击打', status: '已完成', state: 'done' },
  { text: '第二关：平衡桥', status: '进行中', state: 'running' },
  { text: '合成最终视频', status: '等待', state: 'waiting' },
];
const storyProgressRows = [
  { text: '场景建立 · 角色登场', status: '已完成', state: 'done' },
  { text: '危机出现', status: '已完成', state: 'done' },
  { text: '挑战：Snake pose', status: '进行中', state: 'running' },
  { text: '挑战：Jump high', status: '等待', state: 'waiting' },
  { text: '通关庆祝', status: '等待', state: 'waiting' },
];

function buildVideoPrompt(asset, values) {
  if (asset.code === 'VM') {
    return `生成情境叙事视频。模板：${values.template || '拯救型'}。角色：${(values.characters || []).join(', ') || 'Poppy'}。词汇/动作：${(values.words || []).join(', ')}。句型：${(values.sentences || []).join('; ')}。旁白语言：${values.narrationLanguage || 'english'}。画面风格适合儿童英语PPT课件。`;
  }
  return `生成体能闯关视频。场景：${values.scene || '森林'}。角色：${values.character || 'Poppy'}。词汇：${(values.words || []).join(', ')}。句型：${(values.sentences || []).join('; ')}。气泡样式：${values.bubble || '胶囊'}。画面风格适合儿童英语PPT课件。`;
}

async function submitVideoAsset(asset, values) {
  const response = await apiService.post('/api/ai/generate-ppt-asset', {
    assetType: 'video',
    assetCode: asset.code,
    assetName: asset.title,
    prompt: buildVideoPrompt(asset, values),
    options: {
      direction: values.direction,
      scene: values.scene,
      character: values.character,
      characters: values.characters,
      words: values.words,
      sentences: values.sentences,
      bubble: values.bubble,
      bgm: values.bgm,
      voice: values.voice,
      sfx: values.sfx,
      template: values.template,
      narrationLanguage: values.narrationLanguage,
      duration: asset.code === 'VM' ? 12 : 8,
    },
  });
  return response.asset || response.assets?.[0];
}

function VideoStepper({ step }) {
  return (
    <div className="ppt-v1-stepper">
      {steps.map((label, index) => (
        <React.Fragment key={label}>
          <div className={`ppt-v1-step ${step === index ? 'is-active' : ''} ${step > index ? 'is-done' : ''}`}>
            <span>{step > index ? <Check size={12} /> : index + 1}</span>
            <strong>{label}</strong>
          </div>
          {index < steps.length - 1 ? <i /> : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function StoryStepper({ step }) {
  return (
    <div className="ppt-vm-stepper">
      {storySteps.map((label, index) => (
        <React.Fragment key={label}>
          <div className={`ppt-vm-step ${step === index ? 'is-active' : ''} ${step > index ? 'is-done' : ''}`}>
            <span>{step > index ? <Check size={12} /> : index + 1}</span>
            <strong>{label}</strong>
          </div>
          {index < storySteps.length - 1 ? <i /> : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function SceneRoleStep({ values, setValue }) {
  return (
    <div className="ppt-v1-body">
      <div className="ppt-v1-section-title">设置场景</div>
      <div className="ppt-v1-scene-grid">
        {scenes.map((scene) => (
          <button
            type="button"
            key={scene}
            className={values.scene === scene ? 'is-active' : ''}
            onClick={() => setValue('scene', scene)}
          >
            <span className={`ppt-v1-scene-art scene-${scene}`} />
            <strong>{scene}</strong>
          </button>
        ))}
      </div>

      <div className="ppt-v1-scene-prompt">
        <Input.TextArea placeholder="例：太空场景，宇宙飞船驾驶舱" maxLength={40} />
        <div>
          <span>0 / 40</span>
          <button type="button"><Sparkles size={14} />帮我写</button>
        </div>
      </div>

      <div className="ppt-v1-section-title">IP 角色</div>
      <div className="ppt-v1-character-grid">
        {characters.map((character) => (
          <button
            type="button"
            key={character.name}
            className={values.character === character.name ? 'is-active' : ''}
            onClick={() => setValue('character', character.name)}
          >
            <img src={character.image} alt="" />
            <span>{character.name}</span>
          </button>
        ))}
      </div>

      <div className="ppt-v1-section-title">视频方向</div>
      <div className="ppt-v1-direction-row">
        {[
          ['16:9', '横版'],
          ['9:16', '竖版'],
        ].map(([ratio, label]) => (
          <button
            type="button"
            key={ratio}
            className={values.direction === ratio ? 'is-active' : ''}
            onClick={() => setValue('direction', ratio)}
          >
            <strong>{ratio}</strong>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function WordSentenceFields({
  values,
  setValue,
  wordTitle = '第一关 · 单词击打',
  wordHint = '词汇将在视频中逐一出现供学生击打',
  sentenceTitle = '第二关 · 平衡桥',
  sentenceHint = '每个句型对应一座平衡桥关卡',
  wordCountSuffix = '，建议至少',
}) {
  const [wordDraft, setWordDraft] = React.useState('');
  const [addingSentence, setAddingSentence] = React.useState(false);
  const [sentenceDraft, setSentenceDraft] = React.useState('');

  const addWord = () => {
    const word = wordDraft.trim();
    if (!word || values.words.includes(word)) return;
    setValue('words', [...values.words, word]);
    setWordDraft('');
  };

  const removeWord = (word) => {
    setValue('words', values.words.filter((item) => item !== word));
  };

  const addSentence = () => {
    const sentence = sentenceDraft.trim();
    if (!sentence || values.sentences.includes(sentence)) return;
    setValue('sentences', [...values.sentences, sentence]);
    setSentenceDraft('');
    setAddingSentence(false);
  };

  const removeSentence = (sentence) => {
    setValue('sentences', values.sentences.filter((item) => item !== sentence));
  };

  return (
    <>
      <div className="ppt-v1-required-line"><b>* {wordTitle}</b>{wordHint ? <span>（{wordHint}）</span> : null}</div>
      <div className="ppt-v1-word-box">
        <div>
          {values.words.map((word) => (
            <span key={word}>{word}<button type="button" onClick={() => removeWord(word)} aria-label={`删除 ${word}`}><X size={12} /></button></span>
          ))}
        </div>
        <Input.TextArea
          value={wordDraft}
          placeholder="输入后按 Enter 添加..."
          onChange={(event) => setWordDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              addWord();
            }
          }}
        />
      </div>
      <p className="ppt-v1-count">已添加<strong>{values.words.length}</strong>个{wordCountSuffix}<strong>6</strong>个</p>

      <div className="ppt-v1-required-line"><b>{sentenceTitle.includes('第二关') ? '* ' : ''}{sentenceTitle}</b><span>{sentenceHint ? `（${sentenceHint}）` : ''}</span></div>
      <div className="ppt-v1-sentence-list">
        {values.sentences.map((sentence) => (
          <div key={sentence}><span>⠿</span><strong>{sentence}</strong><button type="button" onClick={() => removeSentence(sentence)} aria-label={`删除 ${sentence}`}><X size={14} /></button></div>
        ))}
      </div>
      <p className="ppt-v1-count">已添加<strong>{values.sentences.length}</strong>个，建议至少<strong>6</strong>个</p>
      {addingSentence ? (
        <div className="ppt-v1-sentence-add-row">
          <span>⠿</span>
          <Input
            autoFocus
            value={sentenceDraft}
            placeholder="输入句型，按 Enter 确认..."
            onChange={(event) => setSentenceDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addSentence();
              }
              if (event.key === 'Escape') {
                setAddingSentence(false);
                setSentenceDraft('');
              }
            }}
          />
          <button type="button" onClick={addSentence}>确认</button>
          <button type="button" onClick={() => { setAddingSentence(false); setSentenceDraft(''); }}>×</button>
        </div>
      ) : (
        <button type="button" className="ppt-v1-add-sentence" onClick={() => setAddingSentence(true)}>+ 添加句型</button>
      )}
    </>
  );
}

function VocabSentenceStep({ values, setValue }) {
  const toggle = (key) => setValue(key, !values[key]);

  return (
    <div className="ppt-v1-body">
      <div className="ppt-v1-section-title">填写词汇与句型</div>

      <WordSentenceFields values={values} setValue={setValue} />

      <div className="ppt-v1-duration-row">
        <span>预计视频时长</span>
        <strong>约 2 分 55秒</strong>
      </div>

      <div className="ppt-v1-divider" />
      <div className="ppt-v1-section-title">单词气泡样式</div>
      <div className="ppt-v1-bubble-grid">
        {bubbleTypes.map((type) => (
          <button type="button" key={type} className={values.bubble === type ? 'is-active' : ''} onClick={() => setValue('bubble', type)}>
            <span className={`shape-${type}`} />
            <strong>{type}</strong>
          </button>
        ))}
      </div>

      <div className="ppt-v1-divider" />
      <div className="ppt-v1-section-title">视频偏好设置</div>
      <div className="ppt-v1-toggle-card">
        {[
          ['bgm', '背景音乐', '动感音乐随关卡节奏变化'],
          ['voice', '英文旁白', 'AI语音朗读引导词'],
          ['sfx', '单词发音音效', '击破单词时播放该词发音'],
        ].map(([key, title, desc]) => (
          <button type="button" key={key} onClick={() => toggle(key)}>
            <span><strong>{title}</strong><em>{desc}</em></span>
            <i className={values[key] ? 'is-on' : ''} />
          </button>
        ))}
      </div>
    </div>
  );
}

function SummaryCard({ values }) {
  return (
    <div className="ppt-v1-summary-card">
      <div><span>视频类型</span><strong>体能闯关</strong></div>
      <div><span>时长</span><strong>02 : 16</strong></div>
      <div><span>视频方向</span><strong>{values.direction}</strong></div>
      <div><span>场景 / 模板</span><strong>{values.scene} / 拯救型</strong></div>
      <div><span>IP 角色</span><strong>Poppy, Edi</strong></div>
      <section>
        <article><span>词汇数</span><strong>12</strong></article>
        <article><span>句型数</span><strong>5</strong></article>
      </section>
    </div>
  );
}

function ConfirmStep({ values, generating }) {
  return (
    <div className="ppt-v1-body">
      <div className="ppt-v1-section-title">确认并生成视频</div>
      <SummaryCard values={values} />
      <div className="ppt-v1-divider" />
      {generating ? (
        <div className="ppt-v1-progress-card">
          <div className="ppt-v1-progress-hero">
            <span />
            <strong>正在生成视频</strong>
            <em>正在处理第二个平衡桥...</em>
          </div>
          <div className="ppt-v1-progress-list">
            {progressRows.map((row) => (
              <div key={row.text} className={`is-${row.state}`}>
                <span>{row.state === 'done' ? '✓' : row.state === 'running' ? '○' : '◷'}</span>
                <strong>{row.text}</strong>
                <em>{row.status}</em>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function VideoAssetWizard({ asset, onBack, onInsert, onTitleChange }) {
  if (asset.code === 'VM') {
    return <StoryVideoFlow asset={asset} onBack={onBack} onInsert={onInsert} onTitleChange={onTitleChange} />;
  }
  return <FitnessVideoFlow asset={asset} onBack={onBack} onInsert={onInsert} onTitleChange={onTitleChange} />;
}

function FitnessVideoFlow({ asset, onBack, onInsert, onTitleChange }) {
  const [step, setStep] = React.useState(0);
  const [generating, setGenerating] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [values, setValues] = React.useState({
    scene: '森林',
    character: 'Poppy',
    direction: '16:9',
    words: ['Dennis', 'James', 'Ricky'],
    sentences: ['Jump high!', 'Run to the gate!'],
    bubble: '胶囊',
    bgm: true,
    voice: false,
    sfx: false,
  });
  const setValue = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  React.useEffect(() => {
    onTitleChange?.(asset.title);
  }, [asset.title, onTitleChange]);

  const generateVideo = async () => {
    setGenerating(true);
    setErrorMessage('');
    try {
      const generated = await submitVideoAsset(asset, values);
      onInsert('video', { ...asset, ...generated, title: generated?.title || asset.title });
    } catch (error) {
      setErrorMessage(error.message || '视频生成任务提交失败');
      setGenerating(false);
    }
  };

  return (
    <div className="ppt-video-flow">
      <div className="ppt-video-flow-body">
        <VideoStepper step={step} />
        {step === 0 ? <SceneRoleStep values={values} setValue={setValue} /> : null}
        {step === 1 ? <VocabSentenceStep values={values} setValue={setValue} /> : null}
        {step === 2 ? <ConfirmStep values={values} generating={generating} /> : null}
        {errorMessage ? <div className="ppt-c1-tip">{errorMessage}</div> : null}
      </div>
      <div className="ppt-v1-footer">
        {generating ? (
          <button type="button" className="ppt-v1-primary is-disabled">正在生成</button>
        ) : (
          <>
            <button type="button" className="ppt-v1-secondary" onClick={step === 0 ? onBack : () => setStep((current) => current - 1)}>
              {step === 0 ? '取消' : '上一步'}
            </button>
            <button
              type="button"
              className="ppt-v1-primary"
              onClick={() => {
                if (step < 2) setStep((current) => current + 1);
                else generateVideo();
              }}
            >
              {step === 2 ? '生成视频' : '下一步'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function StoryRoleStep({ values, setValue }) {
  const toggleCharacter = (name) => {
    const current = values.characters;
    setValue('characters', current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  };

  return (
    <div className="ppt-vm-body">
      <div className="ppt-vm-section-title">选择参与本场景的IP 角色（可多选）</div>
      <div className="ppt-vm-character-grid">
        {characters.map((character) => (
          <button
            type="button"
            key={character.name}
            className={values.characters.includes(character.name) ? 'is-active' : ''}
            onClick={() => toggleCharacter(character.name)}
          >
            <img src={character.image} alt="" />
            <span>{character.name}</span>
            {values.characters.includes(character.name) ? <b>✓</b> : null}
          </button>
        ))}
      </div>
      <div className="ppt-vm-section-title">视频方向</div>
      <div className="ppt-v1-direction-row">
        {[
          ['16:9', '横版'],
          ['9:16', '竖版'],
        ].map(([ratio, label]) => (
          <button type="button" key={ratio} className={values.direction === ratio ? 'is-active' : ''} onClick={() => setValue('direction', ratio)}>
            <strong>{ratio}</strong>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StoryNarrativeStep({ values, setValue }) {
  const templates = [
    ['shield', '拯救型', '伙伴被困，完成挑战来拯救'],
    ['map', '探险型', '追踪线索，完成任务抵达宝藏'],
    ['cup', '竞赛型', '友谊挑战赛，比拼通关'],
    ['gear', '解谜型', '魔法失控，用正确动作恢复秩序'],
  ];

  return (
    <div className="ppt-vm-body">
      <div className="ppt-vm-section-title">叙事模板</div>
      <div className="ppt-vm-template-list">
        {templates.map(([key, title, desc]) => (
          <button type="button" key={key} className={values.template === key ? 'is-active' : ''} onClick={() => setValue('template', key)}>
            <i>{key === 'shield' ? '♜' : key === 'map' ? '◇' : key === 'cup' ? '♛' : '✤'}</i>
            <span><strong>{title}</strong><em>{desc}</em></span>
          </button>
        ))}
      </div>
      <div className="ppt-v1-divider" />
      <div className="ppt-vm-section-title">填写词汇与句型</div>
      <WordSentenceFields
        values={values}
        setValue={setValue}
        wordTitle="目标动作 / 词汇"
        wordHint=""
        sentenceTitle="目标句型（可选）"
        sentenceHint=""
        wordCountSuffix=""
      />
    </div>
  );
}

function StoryScriptStep() {
  const cards = [
    ['开场', '场景建立 · 角色登场', 'Poppy 和 Edi 出现在场景中，镜头缓缓推进，建立故事氛围。', '"Welcome! Are you ready for an adventure?"', 'P E'],
    ['危机', '危机出现', '突发事件打破平静！拯救型叙事：需要完成挑战才能解决问题。', '"Oh no! We need your help!"', 'P E'],
    ['闯关', '挑战：Snake pose', 'Poppy 面对关卡，提示动作"Snake pose"。口号："Be long and thin like a snake!"', '"Challenge! Can you do "Snake pose"?"', 'P'],
    ['闯关', '挑战：Jump high', 'Poppy 和 Edi 出现场景中，镜头缓缓推进，建立故事氛围。', '"Challenge! Can you do "Jump high"?"', 'E'],
    ['胜利', '场景建立 · 角色登场', 'Poppy 和 Edi 出现场景中，镜头缓缓推进，建立故事氛围。', '"Amazing! You did it!"', 'P E'],
  ];

  return (
    <div className="ppt-vm-body">
      <div className="ppt-vm-section-title">叙事脚本</div>
      <p className="ppt-vm-sub">AI 已编排叙事节拍，可整体重新生成</p>
      <div className="ppt-vm-script-list">
        {cards.map(([tag, title, desc, quote, people], index) => (
          <article key={`${title}-${index}`}>
            <div>
              <b className={`tag-${tag}`}>{tag}</b>
              <strong>{title}</strong>
              <span>{people}</span>
            </div>
            <em>远景→推进</em>
            <p>{desc}</p>
            <blockquote>{quote}<small>{index > 1 ? title.replace('挑战：', '') : ''}</small></blockquote>
          </article>
        ))}
      </div>
      <button type="button" className="ppt-vm-regenerate">↻ 整体重新生成</button>
    </div>
  );
}

const storyFrames = [
  {
    title: '场景建立 · 角色登场',
    desc: 'Poppy 和 Edi 出现在沙滩场景中，镜头缓缓推进，建立冒险故事氛围。',
    tags: ['开场', '远景→推进', 'Poppy', 'Edi'],
  },
  {
    title: '危机出现',
    desc: '突发事件打破平静，伙伴需要完成挑战才能继续前进。',
    tags: ['危机', '特写→摇镜', 'Poppy', 'Edi'],
  },
  {
    title: '挑战：Snake pose',
    desc: 'Poppy 面对关卡，提示动作 Snake pose，并引导学生模仿。',
    tags: ['闯关', '中景·跟拍', 'Poppy'],
  },
  {
    title: '挑战：Jump high',
    desc: 'Edi 接力挑战 Jump high，画面保留鼓励和互动节奏。',
    tags: ['闯关', '中景·跟拍', 'Edi'],
  },
  {
    title: '通关庆祝',
    desc: '角色完成任务后一起庆祝，镜头拉远收束故事。',
    tags: ['胜利', '远景→推进', 'Poppy', 'Edi'],
  },
];

const defaultFramePositions = storyFrames.map((_, index) => ({
  Poppy: { x: index === 2 ? 46 : 34, y: index === 4 ? 58 : 64 },
  Edi: { x: index === 3 ? 54 : 66, y: index === 4 ? 58 : 64 },
}));

function StoryStoryboardStep({ values, setValue }) {
  const [activeFrame, setActiveFrame] = React.useState(null);
  const [framePositions, setFramePositions] = React.useState(defaultFramePositions);

  const openFrame = (index) => {
    setActiveFrame(index);
  };

  const closeFrame = () => {
    setActiveFrame(null);
  };

  const updateFramePosition = (frameIndex, character, position) => {
    setFramePositions((current) => current.map((frame, index) => (
      index === frameIndex ? { ...frame, [character]: position } : frame
    )));
  };

  const resetFrame = (frameIndex) => {
    setFramePositions((current) => current.map((frame, index) => (
      index === frameIndex ? defaultFramePositions[frameIndex] : frame
    )));
  };

  return (
    <div className="ppt-vm-body">
      <div className="ppt-vm-section-title">分镜画面 + 角色编排</div>
      <p className="ppt-vm-sub">点击任意帧在全屏窗口中编辑角色位置，不满意可重新生成</p>
      <div className="ppt-vm-frame-grid">
        {storyFrames.map((frame, index) => (
          <button type="button" key={frame.title} onClick={() => openFrame(index)}>
            <span className="ppt-v1-scene-art" />
            <b>帧{index + 1}</b>
            <i>P</i><i>E</i>
            <strong>{frame.title}</strong>
          </button>
        ))}
      </div>
      {activeFrame !== null ? (
        <FrameEditModal
          activeFrame={activeFrame}
          framePositions={framePositions}
          onClose={closeFrame}
          onFrameChange={setActiveFrame}
          onPositionChange={updateFramePosition}
          onResetFrame={resetFrame}
        />
      ) : null}
      <div className="ppt-vm-section-title">视频偏好设置</div>
      <div className="ppt-vm-pref-card">
        <div>
          <span>旁白语言</span>
          <p>
            {[
              ['english', 'English'],
              ['bilingual', '双语'],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={values.narrationLanguage === value ? 'is-active' : ''}
                onClick={() => setValue('narrationLanguage', value)}
              >
                {label}
              </button>
            ))}
          </p>
        </div>
        <div>
          <span>BGM</span>
          <button
            type="button"
            className={`ppt-vm-auto-pill ${values.bgm ? 'is-active' : ''}`}
            onClick={() => setValue('bgm', !values.bgm)}
          >
            {values.bgm ? '自动匹配' : '已关闭'}
          </button>
        </div>
        <button type="button" className="ppt-vm-pref-switch-row" onClick={() => setValue('sfx', !values.sfx)}>
          <span>音效</span>
          <i className={values.sfx ? 'is-on' : ''} />
        </button>
      </div>
    </div>
  );
}

function FrameEditModal({ activeFrame, framePositions, onClose, onFrameChange, onPositionChange, onResetFrame }) {
  const stageRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(null);
  const [bgScale, setBgScale] = React.useState(100);
  const frame = storyFrames[activeFrame];
  const framePosition = framePositions[activeFrame];
  const selectedCharacters = characters.filter((character) => ['Poppy', 'Edi'].includes(character.name));

  React.useEffect(() => {
    const stopDragging = () => setDragging(null);
    window.addEventListener('pointerup', stopDragging);
    return () => window.removeEventListener('pointerup', stopDragging);
  }, []);

  const moveCharacter = (event) => {
    if (!dragging || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = Math.min(92, Math.max(8, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(88, Math.max(16, ((event.clientY - rect.top) / rect.height) * 100));
    onPositionChange(activeFrame, dragging, { x, y });
  };

  const startDrag = (event, name) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragging(name);
  };

  const goFrame = (direction) => {
    onFrameChange(Math.min(storyFrames.length - 1, Math.max(0, activeFrame + direction)));
  };

  return (
    <div className="ppt-vm-modal-backdrop" role="dialog" aria-modal="true">
      <div className="ppt-vm-modal">
        <div className="ppt-vm-modal-head">
          <strong>帧 {activeFrame + 1} · {frame.title}</strong>
          <div>
            <button type="button" onClick={() => onResetFrame(activeFrame)}>↻ 重新生成本帧</button>
            <button type="button" className="ppt-vm-modal-close" onClick={onClose} aria-label="关闭"><X size={16} /></button>
          </div>
        </div>
        <div className="ppt-vm-modal-content">
          <div className="ppt-vm-modal-label">
            画布编排 <span>（拖拽缩放背景 · 拖拽摆放角色 · 角色大小固定）</span>
          </div>
          <div className="ppt-vm-canvas-wrap">
            <div
              className="ppt-vm-canvas"
              ref={stageRef}
              onPointerMove={moveCharacter}
            >
              <div className="ppt-vm-bg-layer" style={{ transform: `scale(${bgScale / 100})` }} />
              {selectedCharacters.map((character) => {
                const position = framePosition[character.name] || { x: 50, y: 64 };
                return (
                  <button
                    type="button"
                    key={character.name}
                    className="ppt-vm-character-layer"
                    style={{ left: `${position.x}%`, top: `${position.y}%` }}
                    onPointerDown={(event) => startDrag(event, character.name)}
                  >
                    <img src={character.image} alt={character.name} />
                    <span>{character.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="ppt-vm-scale-row">
            <span>背景缩放</span>
            <input
              type="range"
              min="50"
              max="200"
              value={bgScale}
              onChange={(event) => setBgScale(Number(event.target.value))}
            />
            <strong>{bgScale}%</strong>
          </div>
          <div className="ppt-vm-modal-info">
            <p>{frame.desc}</p>
            <div>
              {frame.tags.map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          </div>
          <div className="ppt-vm-modal-label">全部帧</div>
          <div className="ppt-vm-modal-nav">
            {storyFrames.map((item, index) => (
              <button
                type="button"
                key={item.title}
                className={index === activeFrame ? 'is-active' : ''}
                onClick={() => onFrameChange(index)}
              >
                <span className="ppt-v1-scene-art" />
                <b>帧{index + 1}</b>
                <strong>{item.title}</strong>
              </button>
            ))}
          </div>
        </div>
        <div className="ppt-vm-modal-foot">
          <button type="button" onClick={() => goFrame(-1)} disabled={activeFrame === 0}>上一帧</button>
          <button type="button" onClick={() => (activeFrame === storyFrames.length - 1 ? onClose() : goFrame(1))}>
            {activeFrame === storyFrames.length - 1 ? '保存返回' : '下一帧 →'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StorySummary({ values }) {
  return (
    <div className="ppt-v1-summary-card ppt-vm-summary-card">
      <div><span>叙事模板</span><strong>shield 拯救型</strong></div>
      <div><span>时长</span><strong>02 : 16</strong></div>
      <div><span>视频方向</span><strong>{values.direction}</strong></div>
      <div><span>IP 角色</span><strong>{values.characters.join(', ')}</strong></div>
      <div><span>分镜帧数</span><strong>5 帧</strong></div>
      <section>
        <article><span>词汇数</span><strong>12</strong></article>
        <article><span>句型数</span><strong>5</strong></article>
      </section>
    </div>
  );
}

function StoryGenerateStep({ values, generating }) {
  return (
    <div className="ppt-vm-body">
      <div className="ppt-vm-section-title">确认并生成视频</div>
      <StorySummary values={values} />
      <div className="ppt-v1-divider" />
      {generating ? (
        <div className="ppt-v1-progress-card">
          <div className="ppt-v1-progress-hero">
            <span />
            <strong>正在生成视频</strong>
            <em>正在处理第二个平衡桥...</em>
          </div>
          <div className="ppt-v1-progress-list">
            {storyProgressRows.map((row) => (
              <div key={row.text} className={`is-${row.state}`}>
                <span>{row.state === 'done' ? '✓' : row.state === 'running' ? '○' : '◷'}</span>
                <strong>{row.text}</strong>
                <em>{row.status}</em>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StoryVideoFlow({ asset, onBack, onInsert, onTitleChange }) {
  const [step, setStep] = React.useState(0);
  const [generating, setGenerating] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [values, setValues] = React.useState({
    characters: ['Poppy', 'Edi'],
    direction: '16:9',
    template: 'shield',
    words: ['Dennis', 'James', 'Ricky'],
    sentences: ['Jump high!', 'Run to the gate!'],
    narrationLanguage: 'english',
    bgm: true,
    sfx: false,
  });
  const setValue = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  React.useEffect(() => {
    onTitleChange?.(step === 0 ? '编辑视频素材' : asset.title);
  }, [asset.title, onTitleChange, step]);

  const generateVideo = async () => {
    setGenerating(true);
    setErrorMessage('');
    try {
      const generated = await submitVideoAsset(asset, values);
      onInsert('video', { ...asset, ...generated, title: generated?.title || asset.title });
    } catch (error) {
      setErrorMessage(error.message || '视频生成任务提交失败');
      setGenerating(false);
    }
  };

  return (
    <div className="ppt-video-flow">
      <div className="ppt-video-flow-body">
        <StoryStepper step={step} />
        {step === 0 ? <StoryRoleStep values={values} setValue={setValue} /> : null}
        {step === 1 ? <StoryNarrativeStep values={values} setValue={setValue} /> : null}
        {step === 2 ? <StoryScriptStep /> : null}
        {step === 3 ? <StoryStoryboardStep values={values} setValue={setValue} /> : null}
        {step === 4 ? <StoryGenerateStep values={values} generating={generating} /> : null}
        {errorMessage ? <div className="ppt-c1-tip">{errorMessage}</div> : null}
      </div>
      <div className="ppt-v1-footer">
        {generating ? (
          <button type="button" className="ppt-v1-primary is-disabled">正在生成</button>
        ) : (
          <>
            <button type="button" className="ppt-v1-secondary" onClick={step === 0 ? onBack : () => setStep((current) => current - 1)}>
              {step === 0 ? '取消' : '上一步'}
            </button>
            <button
              type="button"
              className="ppt-v1-primary"
              onClick={() => {
                if (step < 4) setStep((current) => current + 1);
                else generateVideo();
              }}
            >
              {step === 4 ? '生成视频' : '下一步'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
