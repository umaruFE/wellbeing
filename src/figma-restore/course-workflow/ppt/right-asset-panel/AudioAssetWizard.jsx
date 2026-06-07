import React from 'react';
import { Input } from 'antd';
import { Activity, BookOpen, Check, Clock, Dumbbell, Flame, Music, Palette, Play, Sparkles, Trophy, UserRound, Zap } from 'lucide-react';
import audioSoonDialogue from './assets/audio-soon-dialogue.svg';
import audioSoonMeditation from './assets/audio-soon-meditation.svg';
import { audioConfig } from './assetPanelData';
import { FieldBlock, OptionGrid, Tip } from './AssetControls';
import { GenerationProgress } from './GenerationProgress';
import { GeneratedAssetResults } from './GeneratedAssetResults';
import apiService from '../../../../utils/apiService';

function AudioField({ field, value, onChange }) {
  if (field.type === 'textarea') {
    return (
      <FieldBlock label={field.label}>
        <Input.TextArea value={value || ''} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} />
      </FieldBlock>
    );
  }
  if (field.type === 'input') {
    return (
      <FieldBlock label={field.label}>
        <Input value={value || ''} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} />
      </FieldBlock>
    );
  }
  return (
    <FieldBlock label={field.label}>
      <OptionGrid options={field.options} value={value || field.options[0]} onChange={onChange} columns={field.options.length > 3 ? 4 : 3} />
    </FieldBlock>
  );
}

function durationToSeconds(value) {
  const match = String(value || '').match(/(\d+)/);
  if (!match) return 60;
  const amount = Number(match[1]);
  return String(value).includes('分钟') ? amount * 60 : amount;
}

function speedToNumber(value) {
  if (value === '慢速') return 0.85;
  if (value === '快速') return 1.15;
  return 1;
}

function buildAudioPrompt(asset, values) {
  if (asset.code === 'C1') return `生成情绪氛围BGM，情绪：${values.emotion || '安静'}，时长：${values.duration || '1分钟'}，纯器乐，适合儿童英语PPT课堂。`;
  if (asset.code === 'C2') return `生成活动背景乐，活动类型：${values.activity || '互动体能'}，节奏：${values.tempo || '中速'}，适合儿童英语课堂活动。`;
  if (asset.code === 'C3') return values.text || 'Hello! Good morning! How are you today?';
  if (asset.code === 'C5') return `生成教学歌曲，主题：${values.topic || '儿童英语课堂'}，风格：${values.style || '轻快流行'}，歌词：${values.lyrics || 'AI自动生成英文歌词'}`;
  return `生成${asset.title}，${asset.desc || ''}`;
}

async function submitAudioAsset(asset, values) {
  const response = await apiService.post('/api/ai/generate-ppt-asset', {
    assetType: 'audio',
    assetCode: asset.code,
    assetName: asset.title,
    prompt: buildAudioPrompt(asset, values),
    options: {
      emotion: values.emotion,
      audioDuration: values.duration || '1分钟',
      duration: durationToSeconds(values.duration),
      activity: values.activity,
      tempo: values.tempo,
      text: values.text,
      voice: values.voice,
      speed: speedToNumber(values.speed),
      topic: values.topic,
      style: values.style,
      lyrics: values.lyrics,
    },
  });
  return response.asset || response.assets?.[0];
}

const c1Emotions = [
  ['安静', '😌'],
  ['欢快', '😄'],
  ['悬念', '😮'],
  ['动感', '⚡'],
  ['庆祝', '🎁'],
  ['伤感', '😢'],
  ['白噪音', '♧'],
];

const c1Durations = [
  ['30秒', '适合课堂过渡 / 安静练习'],
  ['1分钟', '适合小组活动 / 冥想放松'],
  ['2分钟', '适合完整活动 / 长时陪伴'],
  ['3分钟', '适合长篇故事 / 深度沉浸'],
];

const c2Activities = [
  ['互动体能', Dumbbell],
  ['艺术创作', Palette],
  ['瘦身冥想', UserRound],
  ['专注练习', BookOpen],
  ['成果展示', Trophy],
  ['课间休息', UserRound],
];

const c2Tempos = [
  ['慢速 60-80 BPM', '冥想 / 放松 / 睡前', Clock],
  ['中速 80-100 BPM', '日常活动 / 绘画 / 手工', Activity],
  ['快速 100-140 BPM', '比赛 / 游戏 / 体能闯关', Zap],
];

const c3Templates = [
  ['课堂问候', '👋', 'Hello! Good morning! How are you today?'],
  ['水果主题', '🍎', 'apple\nbanana\norange\npear'],
  ['颜色主题', '🎨', 'red\nyellow\nblue\ngreen'],
  ['数字歌', '✣', 'one\ntwo\nthree\nfour\nfive'],
];

const c3Voices = [
  ['女声', '温暖亲切', '#cbb7ff'],
  ['男声', '清晰有力', '#ffffff'],
  ['童声', '活泼可爱', '#9ad7ad'],
];

const c3Speeds = [
  ['慢速', '适合初学', Clock],
  ['正常', '日常跟读', Activity],
  ['快速', '挑战跟读', Zap],
];

const c5Themes = [
  ['水果认知', '🍎'],
  ['颜色学习', '🎨'],
  ['数字歌', '✚'],
  ['身体部位', '♡'],
  ['动物叫声', '🦁'],
  ['家庭成员', '👨‍👩‍👧'],
  ['天气歌', '☁'],
  ['星期歌', '◇'],
];

const c5Styles = [
  ['轻快流行', '活泼欢快 · 适合律动'],
  ['童谣摇滚', '节奏感强 · 适合跟唱'],
  ['说唱节奏', '朗朗上口 · 适合跟读'],
  ['温馨民谣', '柔和舒缓 · 适合睡前'],
];

function AudioStepper({ steps, step }) {
  return (
    <div className="ppt-audio-stepper">
      {steps.map((item, index) => (
        <React.Fragment key={item}>
          <span className={`${step === index ? 'is-active' : ''} ${step > index ? 'is-done' : ''}`}>
            <b>{step > index ? <Check size={11} /> : index + 1}</b>{item.replace('选择', '').replace('生成结果', '生成')}
          </span>
          {index < steps.length - 1 ? <i>—</i> : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function C1Stepper({ step, done = false, items = ['情绪', '时长', '生成'] }) {
  return (
    <div className={`ppt-c1-stepper ${items.length === 4 ? 'is-four' : ''}`}>
      {items.map((item, index) => (
        <React.Fragment key={item}>
          <span className={`${step === index ? 'is-active' : ''} ${step > index || done ? 'is-done' : ''}`}>
            <b>{step > index || done ? <Check size={11} /> : index + 1}</b>{item}
          </span>
          {index < items.length - 1 ? <i /> : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function C5AudioWizard({ asset, onInsert, onTitleChange }) {
  const [step, setStep] = React.useState(0);
  const [generatedAsset, setGeneratedAsset] = React.useState(null);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [values, setValues] = React.useState({
    topic: '水果认知 颜色学习 天气歌 身体部位 星期歌',
    style: '轻快流行',
    lyrics: 'Apple, apple, red and round,\nBanana, banana, yellow is found.\nSing the colors, clap with me,\nLearning fruits is fun and easy!',
  });
  const setValue = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const isGenerating = step === 3;
  const isResult = step === 4;

  React.useEffect(() => {
    onTitleChange?.('教学歌曲');
  }, [onTitleChange]);

  const generateAudio = async () => {
    setStep(3);
    setErrorMessage('');
    try {
      const generated = await submitAudioAsset(asset, values);
      setGeneratedAsset(generated);
      setStep(4);
    } catch (error) {
      setErrorMessage(error.message || '音频生成任务提交失败');
      setStep(2);
    }
  };

  const toggleTheme = (theme) => {
    const parts = values.topic.split(/\s+/).filter(Boolean);
    const next = parts.includes(theme) ? parts.filter((item) => item !== theme) : [...parts, theme];
    setValue('topic', next.join(' '));
  };

  return (
    <>
      <C1Stepper step={isResult ? 3 : step} done={isResult} items={['主题', '风格', '歌词', '生成']} />
      {step === 0 ? (
        <div className="ppt-c1-body">
          <div className="ppt-audio-section-title">输入歌曲主题</div>
          <Input
            className="ppt-c5-topic-input"
            value={values.topic}
            onChange={(event) => setValue('topic', event.target.value)}
          />
          <div className="ppt-audio-section-title is-muted">推荐主题</div>
          <div className="ppt-c5-chip-row">
            {c5Themes.map(([name, icon]) => (
              <button type="button" key={name} className={values.topic.includes(name) ? 'is-active' : ''} onClick={() => toggleTheme(name)}>
                {icon ? <span>{icon}</span> : null}{name}
              </button>
            ))}
          </div>
          <div className="ppt-c1-tip">建议选择贴近教学进度的核心主题，AI将自动生成适合儿童演唱的英文歌词</div>
        </div>
      ) : null}
      {step === 1 ? (
        <div className="ppt-c1-body">
          <div className="ppt-audio-section-title">选择音乐风格</div>
          <div className="ppt-c1-emotion-grid ppt-c5-style-grid">
            {c5Styles.map(([name, desc]) => (
              <button type="button" key={name} className={values.style === name ? 'is-active' : ''} onClick={() => setValue('style', name)}>
                <strong><Music size={30} /></strong>
                <span>{name}</span>
                <em>{desc}</em>
              </button>
            ))}
          </div>
          <div className="ppt-c1-tip ppt-c5-style-tip"><Flame size={14} />系统将生成原声版（带歌词演唱） + 伴奏版（纯乐器），方便不同场景使用</div>
        </div>
      ) : null}
      {step === 2 ? (
        <div className="ppt-c1-body">
          <div className="ppt-audio-section-title">AI生成歌词</div>
          <div className="ppt-c3-textbox ppt-c5-lyrics-box">
            <Input.TextArea value={values.lyrics} onChange={(event) => setValue('lyrics', event.target.value)} />
          </div>
          <div className="ppt-c1-tip">可直接编辑歌词内容，再生成歌曲音频</div>
        </div>
      ) : null}
      {isGenerating ? (
        <div className="ppt-c1-generating">
          <span className="ppt-c1-spinner" />
          <strong>正在生成教学歌曲...</strong>
          <em>{values.style} · 原声版 + 伴奏版</em>
          <div className="ppt-c1-progress"><i /></div>
          <p>正在编曲 · 合成儿童演唱音频...</p>
        </div>
      ) : null}
      {isResult ? (
        <div className="ppt-c1-result">
          <div className="ppt-c1-result-sub">{values.style} · 生成完成</div>
          <article>
            <div>
              <strong>教学歌曲_01.mp3</strong>
              <span><Music size={14} />原声版</span>
            </div>
            <section>
              <button type="button" aria-label="播放"><Play size={16} fill="currentColor" /></button>
              <i><b /></i>
              <em>1:20</em>
            </section>
          </article>
        </div>
      ) : null}
      {errorMessage ? <div className="ppt-c1-tip">{errorMessage}</div> : null}
      <div className="ppt-inline-footer ppt-c1-footer">
        {step === 0 ? <button type="button" className="ppt-primary-btn" onClick={() => setStep(1)}>下一步</button> : null}
        {step === 1 ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(0)} aria-label="上一步"><span aria-hidden="true">←</span></button>
            <button type="button" className="ppt-primary-btn" onClick={() => setStep(2)}>AI生成歌词 ★</button>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(1)}>上一步</button>
            <button type="button" className="ppt-primary-btn" onClick={generateAudio}>生成歌曲</button>
          </>
        ) : null}
        {isGenerating ? <button type="button" className="ppt-ghost-btn" onClick={() => setStep(2)}>取消</button> : null}
        {isResult ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(3)}>重新生成</button>
            <button type="button" className="ppt-primary-btn" onClick={() => onInsert('audio', { ...asset, ...generatedAsset, title: generatedAsset?.title || asset.title })}>插入画布</button>
          </>
        ) : null}
      </div>
    </>
  );
}
const audioComingSoonCopy = {
  C4: {
    desc: ['支持多角色对话场景生成', 'AI自动分配不同音色'],
    image: audioSoonDialogue,
  },
  C6: {
    desc: ['支持语音旁白 + 背景音乐同步生成', '适合情绪放松、睡前冥想等场景'],
    image: audioSoonMeditation,
  },
};

function AudioComingSoon({ asset, onClose, onTitleChange }) {
  const copy = audioComingSoonCopy[asset.code] || { desc: [asset.desc] };

  React.useEffect(() => {
    onTitleChange?.(asset.title);
  }, [asset.title, onTitleChange]);

  return (
    <>
      <div className="ppt-audio-soon">
        <img src={copy.image || audioSoonDialogue} alt="" />
        <strong>{asset.title}</strong>
        <p>
          {copy.desc.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </p>
        <em><Clock size={14} />即将上线</em>
      </div>
      <div className="ppt-audio-soon-footer">
        <button type="button" onClick={onClose}>关闭</button>
      </div>
    </>
  );
}

function SimpleAudioWizard({ asset, onInsert, onTitleChange }) {
  const [step, setStep] = React.useState(0);
  const [generatedAsset, setGeneratedAsset] = React.useState(null);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [values, setValues] = React.useState({
    text: asset.code === 'C4'
      ? 'A: What can you see?\nB: I can see a lion.\nA: Great job!'
      : 'Close your eyes. Take a deep breath. Listen to the music and relax.',
    voice: '女声',
    speed: '正常',
    duration: '1分钟',
  });
  const setValue = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const isGenerating = step === 1;
  const isResult = step === 2;

  React.useEffect(() => {
    onTitleChange?.(asset.title);
  }, [asset.title, onTitleChange]);

  const generateAudio = async () => {
    setStep(1);
    setErrorMessage('');
    try {
      const generated = await submitAudioAsset(asset, values);
      setGeneratedAsset(generated);
      setStep(2);
    } catch (error) {
      setErrorMessage(error.message || '音频生成任务提交失败');
      setStep(0);
    }
  };

  return (
    <>
      <C1Stepper step={isResult ? 1 : step} done={isResult} items={['内容', '生成']} />
      {step === 0 ? (
        <div className="ppt-c1-body">
          <div className="ppt-audio-section-title">{asset.code === 'C4' ? '输入对话脚本' : '输入引导词'}</div>
          <div className="ppt-c3-textbox">
            <Input.TextArea value={values.text} onChange={(event) => setValue('text', event.target.value)} />
          </div>
          <div className="ppt-audio-section-title">音色与时长</div>
          <OptionGrid options={['女声', '男声', '童声']} value={values.voice} onChange={(value) => setValue('voice', value)} columns={3} />
          <OptionGrid options={['30秒', '1分钟', '2分钟']} value={values.duration} onChange={(value) => setValue('duration', value)} columns={3} />
          {errorMessage ? <div className="ppt-c1-tip">{errorMessage}</div> : null}
        </div>
      ) : null}
      {isGenerating ? (
        <div className="ppt-c1-generating">
          <span className="ppt-c1-spinner" />
          <strong>正在生成{asset.title}...</strong>
          <em>{values.voice} · {values.duration}</em>
          <div className="ppt-c1-progress"><i /></div>
          <p>正在调用语音生成流程...</p>
        </div>
      ) : null}
      {isResult ? (
        <div className="ppt-c1-result">
          <div className="ppt-c1-result-sub">{values.voice} · {values.duration} · 任务已提交</div>
          <article>
            <div>
              <strong>{asset.title}_01.mp3</strong>
              <span><Music size={14} />生成音频</span>
            </div>
            <section>
              <button type="button" aria-label="播放"><Play size={16} fill="currentColor" /></button>
              <i><b /></i>
              <em>{values.duration}</em>
            </section>
          </article>
        </div>
      ) : null}
      <div className="ppt-inline-footer ppt-c1-footer">
        {step === 0 ? <button type="button" className="ppt-primary-btn" onClick={generateAudio}>生成音频</button> : null}
        {isGenerating ? <button type="button" className="ppt-ghost-btn" onClick={() => setStep(0)}>取消</button> : null}
        {isResult ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={generateAudio}>重新生成</button>
            <button type="button" className="ppt-primary-btn" onClick={() => onInsert('audio', { ...asset, ...generatedAsset, title: generatedAsset?.title || asset.title })}>插入画布</button>
          </>
        ) : null}
      </div>
    </>
  );
}

function C3AudioWizard({ asset, onInsert, onTitleChange }) {
  const [step, setStep] = React.useState(0);
  const [generatedAsset, setGeneratedAsset] = React.useState(null);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [values, setValues] = React.useState({ text: '', voice: '女声', speed: '正常', template: '课堂问候' });
  const setValue = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const isGenerating = step === 2;
  const isResult = step === 3;
  const lineCount = values.text.split(/\r?\n/).map((item) => item.trim()).filter(Boolean).length;

  React.useEffect(() => {
    onTitleChange?.('跟读朗读');
  }, [onTitleChange]);

  const generateAudio = async () => {
    setStep(2);
    setErrorMessage('');
    try {
      const generated = await submitAudioAsset(asset, values);
      setGeneratedAsset(generated);
      setStep(3);
    } catch (error) {
      setErrorMessage(error.message || '朗读音频生成任务提交失败');
      setStep(1);
    }
  };

  const applyTemplate = (name, text) => {
    setValues((current) => ({ ...current, template: name, text }));
  };

  return (
    <>
      <C1Stepper step={isResult ? 2 : step} done={isResult} items={['输入文本', '发音人', '生成']} />
      {step === 0 ? (
        <div className="ppt-c1-body">
          <div className="ppt-audio-section-title">快捷模板</div>
          <div className="ppt-c3-template-row">
            {c3Templates.map(([name, icon, text]) => (
              <button type="button" key={name} className={values.template === name ? 'is-active' : ''} onClick={() => applyTemplate(name, text)}>
                <span>{icon}</span>{name}
              </button>
            ))}
          </div>
          <div className="ppt-audio-section-title">输入朗读内容</div>
          <div className="ppt-c3-textbox">
            <Input.TextArea
              value={values.text}
              placeholder={'请输入英文单词、短语或句子，支持批量输入（每行一条）\n\n例：'}
              onChange={(event) => setValue('text', event.target.value)}
            />
          </div>
          <div className="ppt-c3-count-row">
            <span>每行一条，自动拆分为多个音频</span>
            <strong>{lineCount} 条</strong>
          </div>
        </div>
      ) : null}
      {step === 1 ? (
        <div className="ppt-c1-body">
          <div className="ppt-audio-section-title">选择发音人</div>
          <div className="ppt-c1-emotion-grid ppt-c3-voice-grid">
            {c3Voices.map(([name, desc, color]) => (
              <button type="button" key={name} className={values.voice === name ? 'is-active' : ''} onClick={() => setValue('voice', name)}>
                <strong style={{ background: color }}><UserRound size={18} /></strong>
                <span>{name}</span>
                <em>{desc}</em>
              </button>
            ))}
          </div>
          <div className="ppt-c3-speed-head">
            <span>语速</span>
            <strong>{values.speed}</strong>
          </div>
          <div className="ppt-c1-emotion-grid ppt-c3-speed-grid">
            {c3Speeds.map(([name, desc, Icon]) => (
              <button type="button" key={name} className={values.speed === name ? 'is-active' : ''} onClick={() => setValue('speed', name)}>
                <strong><Icon size={18} /></strong>
                <span>{name}</span>
                <em>{desc}</em>
              </button>
            ))}
          </div>
          <div className="ppt-c1-tip">童声 + 慢速适合K2/G1入门阶段，正常语速适合G2-G4跟读练习</div>
        </div>
      ) : null}
      {isGenerating ? (
        <div className="ppt-c1-generating">
          <span className="ppt-c1-spinner" />
          <strong>正在生成跟读朗读...</strong>
          <em>{values.voice} · {values.speed}</em>
          <div className="ppt-c1-progress"><i /></div>
          <p>正在拆分文本 · 合成朗读音频...</p>
        </div>
      ) : null}
      {isResult ? (
        <div className="ppt-c1-result">
          <div className="ppt-c1-result-sub">{values.voice} · {values.speed} · 生成完成</div>
          <article>
            <div>
              <strong>跟读朗读_01.mp3</strong>
              <span><Music size={14} />朗读音频</span>
            </div>
            <section>
              <button type="button" aria-label="播放"><Play size={16} fill="currentColor" /></button>
              <i><b /></i>
              <em>0:45</em>
            </section>
          </article>
        </div>
      ) : null}
      {errorMessage ? <div className="ppt-c1-tip">{errorMessage}</div> : null}
      <div className="ppt-inline-footer ppt-c1-footer">
        {step === 0 ? <button type="button" className="ppt-primary-btn" onClick={() => setStep(1)}>下一步</button> : null}
        {step === 1 ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(0)}>上一步</button>
            <button type="button" className="ppt-primary-btn" onClick={generateAudio}>生成朗读</button>
          </>
        ) : null}
        {isGenerating ? <button type="button" className="ppt-ghost-btn" onClick={() => setStep(1)}>取消</button> : null}
        {isResult ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(2)}>重新生成</button>
            <button type="button" className="ppt-primary-btn" onClick={() => onInsert('audio', { ...asset, ...generatedAsset, title: generatedAsset?.title || asset.title })}>插入画布</button>
          </>
        ) : null}
      </div>
    </>
  );
}

function C2AudioWizard({ asset, onInsert, onTitleChange }) {
  const [step, setStep] = React.useState(0);
  const [generatedAsset, setGeneratedAsset] = React.useState(null);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [values, setValues] = React.useState({ activity: '互动体能', tempo: '中速 80-100 BPM' });
  const setValue = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const isGenerating = step === 2;
  const isResult = step === 3;
  const tempoLabel = values.tempo.split(' ')[0];

  React.useEffect(() => {
    onTitleChange?.('活动背景音乐');
  }, [onTitleChange]);

  const generateAudio = async () => {
    setStep(2);
    setErrorMessage('');
    try {
      const generated = await submitAudioAsset(asset, values);
      setGeneratedAsset(generated);
      setStep(3);
    } catch (error) {
      setErrorMessage(error.message || '活动背景乐生成任务提交失败');
      setStep(1);
    }
  };

  return (
    <>
      <C1Stepper step={isResult ? 2 : step} done={isResult} items={['活动类型', '节奏', '生成']} />
      {step === 0 ? (
        <div className="ppt-c1-body">
          <div className="ppt-audio-section-title">选择活动类型</div>
          <div className="ppt-c1-emotion-grid ppt-c2-activity-grid">
            {c2Activities.map(([name, Icon]) => (
              <button type="button" key={name} className={values.activity === name ? 'is-active' : ''} onClick={() => setValue('activity', name)}>
                <strong><Icon size={20} /></strong><span>{name}</span>
              </button>
            ))}
          </div>
          <div className="ppt-c1-tip">每种活动类型预设对应乐器与节奏风格，互动体能以鼓点为主，瘦身冥想以长音为主</div>
        </div>
      ) : null}
      {step === 1 ? (
        <div className="ppt-c1-body">
          <div className="ppt-audio-section-title">选择节奏速度</div>
          <div className="ppt-c1-duration-list">
            {c2Tempos.map(([name, desc, Icon]) => (
              <button type="button" key={name} className={values.tempo === name ? 'is-active' : ''} onClick={() => setValue('tempo', name)}>
                <i><Icon size={16} /></i>
                <span><strong>{name}</strong><em>{desc}</em></span>
                <b />
              </button>
            ))}
          </div>
          <div className="ppt-c1-tip">BPM决定背景音乐的律动强度，请根据活动节奏选择合适的配速</div>
        </div>
      ) : null}
      {isGenerating ? (
        <div className="ppt-c1-generating">
          <span className="ppt-c1-spinner" />
          <strong>正在生成活动BGM...</strong>
          <em>{values.activity} · {tempoLabel}</em>
          <div className="ppt-c1-progress"><i /></div>
          <p>正在组装活动Prompt · 匹配乐器与节奏...</p>
        </div>
      ) : null}
      {isResult ? (
        <div className="ppt-c1-result">
          <div className="ppt-c1-result-sub">{values.activity} · {tempoLabel} · 生成完成</div>
          <article>
            <div>
              <strong>活动BGM_01.mp3</strong>
              <span><Music size={14} />活动配乐</span>
            </div>
            <section>
              <button type="button" aria-label="播放"><Play size={16} fill="currentColor" /></button>
              <i><b /></i>
              <em>1:30</em>
            </section>
          </article>
        </div>
      ) : null}
      {errorMessage ? <div className="ppt-c1-tip">{errorMessage}</div> : null}
      <div className="ppt-inline-footer ppt-c1-footer">
        {step === 0 ? <button type="button" className="ppt-primary-btn" onClick={() => setStep(1)}>下一步</button> : null}
        {step === 1 ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(0)}>上一步</button>
            <button type="button" className="ppt-primary-btn" onClick={generateAudio}>生成BGM</button>
          </>
        ) : null}
        {isGenerating ? <button type="button" className="ppt-ghost-btn" onClick={() => setStep(1)}>取消</button> : null}
        {isResult ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(2)}>重新生成</button>
            <button type="button" className="ppt-primary-btn" onClick={() => onInsert('audio', { ...asset, ...generatedAsset, title: generatedAsset?.title || asset.title })}>插入画布</button>
          </>
        ) : null}
      </div>
    </>
  );
}

function C1AudioWizard({ asset, onInsert, onTitleChange }) {
  const [step, setStep] = React.useState(0);
  const [generatedAsset, setGeneratedAsset] = React.useState(null);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [values, setValues] = React.useState({ emotion: '安静', duration: '1分钟' });
  const setValue = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const isGenerating = step === 2;
  const isResult = step === 3;

  React.useEffect(() => {
    onTitleChange?.(asset.title);
  }, [asset.title, onTitleChange]);

  const generateAudio = async () => {
    setStep(2);
    setErrorMessage('');
    try {
      const generated = await submitAudioAsset(asset, values);
      setGeneratedAsset(generated);
      setStep(3);
    } catch (error) {
      setErrorMessage(error.message || '情绪BGM生成任务提交失败');
      setStep(1);
    }
  };

  return (
    <>
      <C1Stepper step={isResult ? 2 : step} done={isResult} />
      {step === 0 ? (
        <div className="ppt-c1-body">
          <div className="ppt-audio-section-title">选择情绪标签</div>
          <div className="ppt-c1-emotion-grid">
            {c1Emotions.map(([name, icon]) => (
              <button type="button" key={name} className={values.emotion === name ? 'is-active' : ''} onClick={() => setValue('emotion', name)}>
                <strong>{icon}</strong><span>{name}</span>
              </button>
            ))}
          </div>
          <div className="ppt-c1-tip">情绪标签决定BGM的整体基调，系统将自动匹配合适的乐器与节奏</div>
        </div>
      ) : null}
      {step === 1 ? (
        <div className="ppt-c1-body">
          <div className="ppt-audio-section-title">选择音频时长</div>
          <div className="ppt-c1-duration-list">
            {c1Durations.map(([name, desc]) => (
              <button type="button" key={name} className={values.duration === name ? 'is-active' : ''} onClick={() => setValue('duration', name)}>
                <i><Clock size={16} /></i>
                <span><strong>{name}</strong><em>{desc}</em></span>
                <b />
              </button>
            ))}
          </div>
          <div className="ppt-c1-tip">时长越长生成时间越久，建议先试生成30秒确认效果</div>
        </div>
      ) : null}
      {isGenerating ? (
        <div className="ppt-c1-generating">
          <span className="ppt-c1-spinner" />
          <strong>正在生成情绪BGM...</strong>
          <em>{values.emotion} · {values.duration}</em>
          <div className="ppt-c1-progress"><i /></div>
          <p>正在组装情绪Prompt · 连接HeartMuLa引擎...</p>
        </div>
      ) : null}
      {isResult ? (
        <div className="ppt-c1-result">
          <div className="ppt-c1-result-sub">{values.emotion} · {values.duration} · 生成完成</div>
          <article>
            <div>
              <strong>情绪BGM_01.mp3</strong>
              <span><Music size={14} />纯器乐</span>
            </div>
            <section>
              <button type="button" aria-label="播放"><Play size={16} fill="currentColor" /></button>
              <i><b /></i>
              <em>{values.duration === '30秒' ? '0:30' : values.duration === '1分钟' ? '1:30' : values.duration === '2分钟' ? '2:00' : '3:00'}</em>
            </section>
          </article>
        </div>
      ) : null}
      {errorMessage ? <div className="ppt-c1-tip">{errorMessage}</div> : null}
      <div className="ppt-inline-footer ppt-c1-footer">
        {step === 0 ? <button type="button" className="ppt-primary-btn" onClick={() => setStep(1)}>下一步</button> : null}
        {step === 1 ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(0)}>上一步</button>
            <button type="button" className="ppt-primary-btn" onClick={generateAudio}>生成BGM</button>
          </>
        ) : null}
        {isGenerating ? <button type="button" className="ppt-ghost-btn" onClick={() => setStep(1)}>取消</button> : null}
        {isResult ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(2)}>重新生成</button>
            <button type="button" className="ppt-primary-btn" onClick={() => onInsert('audio', { ...asset, ...generatedAsset, title: generatedAsset?.title || asset.title })}>插入画布</button>
          </>
        ) : null}
      </div>
    </>
  );
}

export function AudioAssetWizard({ asset, onBack, onClose, onInsert, onTitleChange }) {
  if (asset.code === 'C1') {
    return <C1AudioWizard asset={asset} onInsert={onInsert} onTitleChange={onTitleChange} />;
  }
  if (asset.code === 'C2') {
    return <C2AudioWizard asset={asset} onInsert={onInsert} onTitleChange={onTitleChange} />;
  }
  if (asset.code === 'C3') {
    return <C3AudioWizard asset={asset} onInsert={onInsert} onTitleChange={onTitleChange} />;
  }
  if (asset.code === 'C5') {
    return <C5AudioWizard asset={asset} onInsert={onInsert} onTitleChange={onTitleChange} />;
  }
  if (['C4', 'C6'].includes(asset.code)) {
    return <SimpleAudioWizard asset={asset} onInsert={onInsert} onTitleChange={onTitleChange} />;
  }

  const cfg = audioConfig[asset.code] || audioConfig.C1;
  const [stage, setStage] = React.useState('form');
  const [step, setStep] = React.useState(0);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [values, setValues] = React.useState({ emotion: '安静', duration: '30秒' });
  const setValue = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  React.useEffect(() => {
    if (stage === 'generating') onTitleChange?.('正在生成...');
    else if (stage === 'result') onTitleChange?.('选择音频');
    else onTitleChange?.(asset.title);
  }, [asset.title, onTitleChange, stage]);

  if (stage === 'generating') {
    return <GenerationProgress title="AI 正在生成音频" subtitle={`${asset.title} · 自动保存到音频素材库`} progress={72} onViewResult={() => setStage('result')} />;
  }

  if (stage === 'result') {
    return (
      <GeneratedAssetResults
        kind="audio"
        asset={asset}
        selectedIndex={selectedIndex}
        onSelect={setSelectedIndex}
        onRegenerate={() => setStage('generating')}
        onInsert={() => onInsert('audio', asset)}
      />
    );
  }

  return (
    <>
      <AudioStepper steps={cfg.steps} step={step} />
      <div className="ppt-asset-form">
        {asset.code === 'C1' && step === 0 ? (
          <>
            <div className="ppt-audio-section-title">选择情绪标签</div>
            <div className="ppt-audio-emotion-grid">
              {c1Emotions.map(([name, icon]) => (
                <button type="button" key={name} className={values.emotion === name ? 'is-active' : ''} onClick={() => setValue('emotion', name)}>
                  <strong>{icon}</strong><span>{name}</span>
                </button>
              ))}
            </div>
            <Tip>情绪标签决定BGM的整体基调，系统将自动匹配合适的乐器与节奏</Tip>
          </>
        ) : null}
        {asset.code === 'C1' && step === 1 ? (
          <>
            <div className="ppt-audio-section-title">选择音频时长</div>
            <div className="ppt-audio-duration-list">
              {c1Durations.map(([name, desc]) => (
                <button type="button" key={name} className={values.duration === name ? 'is-active' : ''} onClick={() => setValue('duration', name)}>
                  <i /><span><strong>{name}</strong><em>{desc}</em></span><b />
                </button>
              ))}
            </div>
          </>
        ) : null}
        {(asset.code !== 'C1' || step === 0) && asset.code !== 'C1' ? (
          <>
            <div className="ppt-audio-hero">
              <Music size={24} />
              <div><strong>{asset.title}</strong><span>{asset.desc}</span></div>
            </div>
            {cfg.fields.map((field) => (
              <AudioField
                key={field.key}
                field={field}
                value={values[field.key]}
                onChange={(value) => setValue(field.key, value)}
              />
            ))}
          </>
        ) : null}
        {(asset.code === 'C1' && step === 2) || (asset.code !== 'C1' && step > 0) ? (
          <div className="ppt-audio-confirm">
            <Music size={24} />
            <strong>确认并生成音频</strong>
            <dl>
              <dt>音频类型</dt><dd>{asset.title}</dd>
              <dt>情绪/主题</dt><dd>{values.emotion || values.topic || values.activity || '自动匹配'}</dd>
              <dt>时长</dt><dd>{values.duration || '1分钟'}</dd>
            </dl>
            <Tip>已自动保存到音频素材库，插入画布后将保留生成版本信息。</Tip>
          </div>
        ) : null}
      </div>
      <div className="ppt-inline-footer">
        <button type="button" className="ppt-ghost-btn" onClick={step === 0 ? onBack : () => setStep((current) => current - 1)}>{step === 0 ? '返回类型' : '上一步'}</button>
        <button type="button" className="ppt-primary-btn" onClick={() => {
          const maxStep = asset.code === 'C1' ? 2 : 1;
          if (step < maxStep) setStep((current) => current + 1);
          else setStage('generating');
        }}>
          {step < (asset.code === 'C1' ? 2 : 1) ? '下一步' : <><Sparkles size={14} />生成音频</>}
        </button>
      </div>
    </>
  );
}
