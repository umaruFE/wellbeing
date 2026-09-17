import i18next from 'i18next';
import { LocalizedText, LocalizedValue } from '../../../../i18n/LocalizedText.jsx';
import React from 'react';
import { Input } from 'antd';
import { Activity, BookOpen, Check, Clock, Dumbbell, Flame, Music, Palette, Play, Sparkles, Trophy, UserRound, Zap } from 'lucide-react';
import audioSoonDialogue from './assets/audio-soon-dialogue.svg';
import audioSoonMeditation from './assets/audio-soon-meditation.svg';
import { useTranslation } from 'react-i18next';
import { getAudioConfig } from './assetPanelData';
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
      <OptionGrid options={field.options} value={value || field.options[0]} onChange={onChange} columns={field.options.length > 3 ? 4 : 3} labelCatalog="audioOptionLabels" />
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
            <b>{step > index ? <Check size={11} /> : index + 1}</b><LocalizedValue value={item.replace('选择', '').replace('生成结果', '生成')} catalog="audioOptionLabels" />
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
            <b>{step > index || done ? <Check size={11} /> : index + 1}</b><LocalizedValue value={item} catalog="audioOptionLabels" />
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
    onTitleChange?.(asset.title);
  }, [asset.title, onTitleChange]);

  const generateAudio = async () => {
    setStep(3);
    setErrorMessage('');
    try {
      const generated = await submitAudioAsset(asset, values);
      setGeneratedAsset(generated);
      setStep(4);
    } catch (error) {
      setErrorMessage(error.message || i18next.t('audioWizard.submitFailed'));
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
          <div className="ppt-audio-section-title"><LocalizedText id="audioWizard.d71b4a8fd4" /></div>
          <Input
            className="ppt-c5-topic-input"
            value={values.topic}
            onChange={(event) => setValue('topic', event.target.value)}
          />
          <div className="ppt-audio-section-title is-muted"><LocalizedText id="audioWizard.7b2e0643c5" /></div>
          <div className="ppt-c5-chip-row">
            {c5Themes.map(([name, icon]) => (
              <button type="button" key={name} className={values.topic.includes(name) ? 'is-active' : ''} onClick={() => toggleTheme(name)}>
                {icon ? <span>{icon}</span> : null}<LocalizedValue value={name} catalog="audioOptionLabels" />
              </button>
            ))}
          </div>
          <div className="ppt-c1-tip"><LocalizedText id="audioWizard.72eae19cc7" /></div>
        </div>
      ) : null}
      {step === 1 ? (
        <div className="ppt-c1-body">
          <div className="ppt-audio-section-title"><LocalizedText id="audioWizard.c16bfc477c" /></div>
          <div className="ppt-c1-emotion-grid ppt-c5-style-grid">
            {c5Styles.map(([name, desc]) => (
              <button type="button" key={name} className={values.style === name ? 'is-active' : ''} onClick={() => setValue('style', name)}>
                <strong><Music size={30} /></strong>
                <span><LocalizedValue value={name} catalog="audioOptionLabels" /></span>
                <em><LocalizedValue value={desc} catalog="audioOptionLabels" /></em>
              </button>
            ))}
          </div>
          <div className="ppt-c1-tip ppt-c5-style-tip"><Flame size={14} /><LocalizedText id="audioWizard.7a992e1a85" /></div>
        </div>
      ) : null}
      {step === 2 ? (
        <div className="ppt-c1-body">
          <div className="ppt-audio-section-title"><LocalizedText id="audioWizard.02a45a3d8c" /></div>
          <div className="ppt-c3-textbox ppt-c5-lyrics-box">
            <Input.TextArea value={values.lyrics} onChange={(event) => setValue('lyrics', event.target.value)} />
          </div>
          <div className="ppt-c1-tip"><LocalizedText id="audioWizard.696d13f564" /></div>
        </div>
      ) : null}
      {isGenerating ? (
        <div className="ppt-c1-generating">
          <span className="ppt-c1-spinner" />
          <strong><LocalizedText id="audioWizard.3416fae884" /></strong>
          <em><LocalizedValue value={values.style} catalog="audioOptionLabels" /> <LocalizedText id="audioWizard.d6208a76b7" /></em>
          <div className="ppt-c1-progress"><i /></div>
          <p><LocalizedText id="audioWizard.a53d69ed67" /></p>
        </div>
      ) : null}
      {isResult ? (
        <div className="ppt-c1-result">
          <div className="ppt-c1-result-sub"><LocalizedValue value={values.style} catalog="audioOptionLabels" /> <LocalizedText id="audioWizard.ce9474de0a" /></div>
          <article>
            <div>
              <strong><LocalizedText id="audioWizard.8617bddcc3" /></strong>
              <span><Music size={14} /><LocalizedText id="audioWizard.a9d9d8a723" /></span>
            </div>
            <section>
              <button type="button" aria-label={i18next.t('audioWizard.21925350de')}><Play size={16} fill="currentColor" /></button>
              <i><b /></i>
              <em>1:20</em>
            </section>
          </article>
        </div>
      ) : null}
      {errorMessage ? <div className="ppt-c1-tip">{errorMessage}</div> : null}
      <div className="ppt-inline-footer ppt-c1-footer">
        {step === 0 ? <button type="button" className="ppt-primary-btn" onClick={() => setStep(1)}><LocalizedText id="audioWizard.ea0ef2ae72" /></button> : null}
        {step === 1 ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(0)} aria-label={i18next.t('audioWizard.75ef1241c0')}><span aria-hidden="true">←</span></button>
            <button type="button" className="ppt-primary-btn" onClick={() => setStep(2)}><LocalizedText id="audioWizard.7c16cdf95c" /></button>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(1)}><LocalizedText id="audioWizard.75ef1241c0" /></button>
            <button type="button" className="ppt-primary-btn" onClick={generateAudio}><LocalizedText id="audioWizard.c4d651ef53" /></button>
          </>
        ) : null}
        {isGenerating ? <button type="button" className="ppt-ghost-btn" onClick={() => setStep(2)}><LocalizedText id="audioWizard.4d0b4688c7" /></button> : null}
        {isResult ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(3)}><LocalizedText id="audioWizard.2e19057052" /></button>
            <button type="button" className="ppt-primary-btn" onClick={() => onInsert('audio', { ...asset, ...generatedAsset, title: generatedAsset?.title || asset.title })}><LocalizedText id="audioWizard.e8641c2c63" /></button>
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
        <em><Clock size={14} /><LocalizedText id="audioWizard.d302bacb72" /></em>
      </div>
      <div className="ppt-audio-soon-footer">
        <button type="button" onClick={onClose}><LocalizedText id="audioWizard.6c14bd7f6f" /></button>
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
      setErrorMessage(error.message || i18next.t('audioWizard.submitFailed'));
      setStep(0);
    }
  };

  return (
    <>
      <C1Stepper step={isResult ? 1 : step} done={isResult} items={['内容', '生成']} />
      {step === 0 ? (
        <div className="ppt-c1-body">
          <div className="ppt-audio-section-title"><LocalizedValue value={asset.code === 'C4' ? '输入对话脚本' : '输入引导词'} catalog="audioOptionLabels" /></div>
          <div className="ppt-c3-textbox">
            <Input.TextArea value={values.text} onChange={(event) => setValue('text', event.target.value)} />
          </div>
          <div className="ppt-audio-section-title"><LocalizedText id="audioWizard.3f5ad33fd5" /></div>
          <OptionGrid options={['女声', '男声', '童声']} value={values.voice} onChange={(value) => setValue('voice', value)} columns={3} labelCatalog="audioOptionLabels" />
          <OptionGrid options={['30秒', '1分钟', '2分钟']} value={values.duration} onChange={(value) => setValue('duration', value)} columns={3} labelCatalog="audioOptionLabels" />
          {errorMessage ? <div className="ppt-c1-tip">{errorMessage}</div> : null}
        </div>
      ) : null}
      {isGenerating ? (
        <div className="ppt-c1-generating">
          <span className="ppt-c1-spinner" />
          <strong><LocalizedText id="audioWizard.5f57664caa" />{asset.title}...</strong>
          <em><LocalizedValue value={values.voice} catalog="audioOptionLabels" /> · <LocalizedValue value={values.duration} catalog="audioOptionLabels" /></em>
          <div className="ppt-c1-progress"><i /></div>
          <p><LocalizedText id="audioWizard.fc4a59c854" /></p>
        </div>
      ) : null}
      {isResult ? (
        <div className="ppt-c1-result">
          <div className="ppt-c1-result-sub"><LocalizedValue value={values.voice} catalog="audioOptionLabels" /> · <LocalizedValue value={values.duration} catalog="audioOptionLabels" /> <LocalizedText id="audioWizard.9cf794f9fc" /></div>
          <article>
            <div>
              <strong>{asset.title}_01.mp3</strong>
              <span><Music size={14} /><LocalizedText id="audioWizard.b74569c1b3" /></span>
            </div>
            <section>
              <button type="button" aria-label={i18next.t('audioWizard.21925350de')}><Play size={16} fill="currentColor" /></button>
              <i><b /></i>
              <em><LocalizedValue value={values.duration} catalog="audioOptionLabels" /></em>
            </section>
          </article>
        </div>
      ) : null}
      <div className="ppt-inline-footer ppt-c1-footer">
        {step === 0 ? <button type="button" className="ppt-primary-btn" onClick={generateAudio}><LocalizedText id="audioWizard.b74569c1b3" /></button> : null}
        {isGenerating ? <button type="button" className="ppt-ghost-btn" onClick={() => setStep(0)}><LocalizedText id="audioWizard.4d0b4688c7" /></button> : null}
        {isResult ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={generateAudio}><LocalizedText id="audioWizard.2e19057052" /></button>
            <button type="button" className="ppt-primary-btn" onClick={() => onInsert('audio', { ...asset, ...generatedAsset, title: generatedAsset?.title || asset.title })}><LocalizedText id="audioWizard.e8641c2c63" /></button>
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
      setErrorMessage(error.message || i18next.t('audioWizard.readingFailed'));
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
          <div className="ppt-audio-section-title"><LocalizedText id="audioWizard.8e379b6dd4" /></div>
          <div className="ppt-c3-template-row">
            {c3Templates.map(([name, icon, text]) => (
              <button type="button" key={name} className={values.template === name ? 'is-active' : ''} onClick={() => applyTemplate(name, text)}>
                <span>{icon}</span><LocalizedValue value={name} catalog="audioOptionLabels" />
              </button>
            ))}
          </div>
          <div className="ppt-audio-section-title"><LocalizedText id="audioWizard.855872485e" /></div>
          <div className="ppt-c3-textbox">
            <Input.TextArea
              value={values.text}
              placeholder={i18next.t('audioWizard.readAlongPlaceholder')}
              onChange={(event) => setValue('text', event.target.value)}
            />
          </div>
          <div className="ppt-c3-count-row">
            <span><LocalizedText id="audioWizard.73232250a4" /></span>
            <strong>{lineCount} <LocalizedText id="audioWizard.bce2ef6151" /></strong>
          </div>
        </div>
      ) : null}
      {step === 1 ? (
        <div className="ppt-c1-body">
          <div className="ppt-audio-section-title"><LocalizedText id="audioWizard.78dc219a04" /></div>
          <div className="ppt-c1-emotion-grid ppt-c3-voice-grid">
            {c3Voices.map(([name, desc, color]) => (
              <button type="button" key={name} className={values.voice === name ? 'is-active' : ''} onClick={() => setValue('voice', name)}>
                <strong style={{ background: color }}><UserRound size={18} /></strong>
                <span><LocalizedValue value={name} catalog="audioOptionLabels" /></span>
                <em><LocalizedValue value={desc} catalog="audioOptionLabels" /></em>
              </button>
            ))}
          </div>
          <div className="ppt-c3-speed-head">
            <span><LocalizedText id="audioWizard.747374775d" /></span>
            <strong><LocalizedValue value={values.speed} catalog="audioOptionLabels" /></strong>
          </div>
          <div className="ppt-c1-emotion-grid ppt-c3-speed-grid">
            {c3Speeds.map(([name, desc, Icon]) => (
              <button type="button" key={name} className={values.speed === name ? 'is-active' : ''} onClick={() => setValue('speed', name)}>
                <strong><Icon size={18} /></strong>
                <span><LocalizedValue value={name} catalog="audioOptionLabels" /></span>
                <em><LocalizedValue value={desc} catalog="audioOptionLabels" /></em>
              </button>
            ))}
          </div>
          <div className="ppt-c1-tip"><LocalizedText id="audioWizard.6a630b40cf" /></div>
        </div>
      ) : null}
      {isGenerating ? (
        <div className="ppt-c1-generating">
          <span className="ppt-c1-spinner" />
          <strong><LocalizedText id="audioWizard.6400d172e7" /></strong>
          <em><LocalizedValue value={values.voice} catalog="audioOptionLabels" /> · <LocalizedValue value={values.speed} catalog="audioOptionLabels" /></em>
          <div className="ppt-c1-progress"><i /></div>
          <p><LocalizedText id="audioWizard.3dc50d4f17" /></p>
        </div>
      ) : null}
      {isResult ? (
        <div className="ppt-c1-result">
          <div className="ppt-c1-result-sub"><LocalizedValue value={values.voice} catalog="audioOptionLabels" /> · <LocalizedValue value={values.speed} catalog="audioOptionLabels" /> <LocalizedText id="audioWizard.ce9474de0a" /></div>
          <article>
            <div>
              <strong><LocalizedText id="audioWizard.e7ad48bed2" /></strong>
              <span><Music size={14} /><LocalizedText id="audioWizard.19038d451c" /></span>
            </div>
            <section>
              <button type="button" aria-label={i18next.t('audioWizard.21925350de')}><Play size={16} fill="currentColor" /></button>
              <i><b /></i>
              <em>0:45</em>
            </section>
          </article>
        </div>
      ) : null}
      {errorMessage ? <div className="ppt-c1-tip">{errorMessage}</div> : null}
      <div className="ppt-inline-footer ppt-c1-footer">
        {step === 0 ? <button type="button" className="ppt-primary-btn" onClick={() => setStep(1)}><LocalizedText id="audioWizard.ea0ef2ae72" /></button> : null}
        {step === 1 ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(0)}><LocalizedText id="audioWizard.75ef1241c0" /></button>
            <button type="button" className="ppt-primary-btn" onClick={generateAudio}><LocalizedText id="audioWizard.1403abe424" /></button>
          </>
        ) : null}
        {isGenerating ? <button type="button" className="ppt-ghost-btn" onClick={() => setStep(1)}><LocalizedText id="audioWizard.4d0b4688c7" /></button> : null}
        {isResult ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(2)}><LocalizedText id="audioWizard.2e19057052" /></button>
            <button type="button" className="ppt-primary-btn" onClick={() => onInsert('audio', { ...asset, ...generatedAsset, title: generatedAsset?.title || asset.title })}><LocalizedText id="audioWizard.e8641c2c63" /></button>
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
      setErrorMessage(error.message || i18next.t('audioWizard.activityFailed'));
      setStep(1);
    }
  };

  return (
    <>
      <C1Stepper step={isResult ? 2 : step} done={isResult} items={['活动类型', '节奏', '生成']} />
      {step === 0 ? (
        <div className="ppt-c1-body">
          <div className="ppt-audio-section-title"><LocalizedText id="audioWizard.86f19c514b" /></div>
          <div className="ppt-c1-emotion-grid ppt-c2-activity-grid">
            {c2Activities.map(([name, Icon]) => (
              <button type="button" key={name} className={values.activity === name ? 'is-active' : ''} onClick={() => setValue('activity', name)}>
                <strong><Icon size={20} /></strong><span><LocalizedValue value={name} catalog="audioOptionLabels" /></span>
              </button>
            ))}
          </div>
          <div className="ppt-c1-tip"><LocalizedText id="audioWizard.48d20254b9" /></div>
        </div>
      ) : null}
      {step === 1 ? (
        <div className="ppt-c1-body">
          <div className="ppt-audio-section-title"><LocalizedText id="audioWizard.e26ca7a0e1" /></div>
          <div className="ppt-c1-duration-list">
            {c2Tempos.map(([name, desc, Icon]) => (
              <button type="button" key={name} className={values.tempo === name ? 'is-active' : ''} onClick={() => setValue('tempo', name)}>
                <i><Icon size={16} /></i>
                <span><strong><LocalizedValue value={name} catalog="audioOptionLabels" /></strong><em><LocalizedValue value={desc} catalog="audioOptionLabels" /></em></span>
                <b />
              </button>
            ))}
          </div>
          <div className="ppt-c1-tip"><LocalizedText id="audioWizard.323b64e8f8" /></div>
        </div>
      ) : null}
      {isGenerating ? (
        <div className="ppt-c1-generating">
          <span className="ppt-c1-spinner" />
          <strong><LocalizedText id="audioWizard.2856c77ad6" /></strong>
          <em><LocalizedValue value={values.activity} catalog="audioOptionLabels" /> · <LocalizedValue value={tempoLabel} catalog="audioOptionLabels" /></em>
          <div className="ppt-c1-progress"><i /></div>
          <p><LocalizedText id="audioWizard.5b5be13a68" /></p>
        </div>
      ) : null}
      {isResult ? (
        <div className="ppt-c1-result">
          <div className="ppt-c1-result-sub"><LocalizedValue value={values.activity} catalog="audioOptionLabels" /> · <LocalizedValue value={tempoLabel} catalog="audioOptionLabels" /> <LocalizedText id="audioWizard.ce9474de0a" /></div>
          <article>
            <div>
              <strong><LocalizedText id="audioWizard.734776bd2e" /></strong>
              <span><Music size={14} /><LocalizedText id="audioWizard.aa530fe0a5" /></span>
            </div>
            <section>
              <button type="button" aria-label={i18next.t('audioWizard.21925350de')}><Play size={16} fill="currentColor" /></button>
              <i><b /></i>
              <em>1:30</em>
            </section>
          </article>
        </div>
      ) : null}
      {errorMessage ? <div className="ppt-c1-tip">{errorMessage}</div> : null}
      <div className="ppt-inline-footer ppt-c1-footer">
        {step === 0 ? <button type="button" className="ppt-primary-btn" onClick={() => setStep(1)}><LocalizedText id="audioWizard.ea0ef2ae72" /></button> : null}
        {step === 1 ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(0)}><LocalizedText id="audioWizard.75ef1241c0" /></button>
            <button type="button" className="ppt-primary-btn" onClick={generateAudio}><LocalizedText id="audioWizard.1df8a13f7a" /></button>
          </>
        ) : null}
        {isGenerating ? <button type="button" className="ppt-ghost-btn" onClick={() => setStep(1)}><LocalizedText id="audioWizard.4d0b4688c7" /></button> : null}
        {isResult ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(2)}><LocalizedText id="audioWizard.2e19057052" /></button>
            <button type="button" className="ppt-primary-btn" onClick={() => onInsert('audio', { ...asset, ...generatedAsset, title: generatedAsset?.title || asset.title })}><LocalizedText id="audioWizard.e8641c2c63" /></button>
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
      setErrorMessage(error.message || i18next.t('audioWizard.moodFailed'));
      setStep(1);
    }
  };

  return (
    <>
      <C1Stepper step={isResult ? 2 : step} done={isResult} />
      {step === 0 ? (
        <div className="ppt-c1-body">
          <div className="ppt-audio-section-title"><LocalizedText id="audioWizard.aca4011765" /></div>
          <div className="ppt-c1-emotion-grid">
            {c1Emotions.map(([name, icon]) => (
              <button type="button" key={name} className={values.emotion === name ? 'is-active' : ''} onClick={() => setValue('emotion', name)}>
                <strong>{icon}</strong><span><LocalizedValue value={name} catalog="audioOptionLabels" /></span>
              </button>
            ))}
          </div>
          <div className="ppt-c1-tip"><LocalizedText id="audioWizard.195175f324" /></div>
        </div>
      ) : null}
      {step === 1 ? (
        <div className="ppt-c1-body">
          <div className="ppt-audio-section-title"><LocalizedText id="audioWizard.1fe93f57e0" /></div>
          <div className="ppt-c1-duration-list">
            {c1Durations.map(([name, desc]) => (
              <button type="button" key={name} className={values.duration === name ? 'is-active' : ''} onClick={() => setValue('duration', name)}>
                <i><Clock size={16} /></i>
                <span><strong><LocalizedValue value={name} catalog="audioOptionLabels" /></strong><em><LocalizedValue value={desc} catalog="audioOptionLabels" /></em></span>
                <b />
              </button>
            ))}
          </div>
          <div className="ppt-c1-tip"><LocalizedText id="audioWizard.dd47694be8" /></div>
        </div>
      ) : null}
      {isGenerating ? (
        <div className="ppt-c1-generating">
          <span className="ppt-c1-spinner" />
          <strong><LocalizedText id="audioWizard.597da97c96" /></strong>
          <em><LocalizedValue value={values.emotion} catalog="audioOptionLabels" /> · <LocalizedValue value={values.duration} catalog="audioOptionLabels" /></em>
          <div className="ppt-c1-progress"><i /></div>
          <p><LocalizedText id="audioWizard.45254be62f" /></p>
        </div>
      ) : null}
      {isResult ? (
        <div className="ppt-c1-result">
          <div className="ppt-c1-result-sub"><LocalizedValue value={values.emotion} catalog="audioOptionLabels" /> · <LocalizedValue value={values.duration} catalog="audioOptionLabels" /> <LocalizedText id="audioWizard.ce9474de0a" /></div>
          <article>
            <div>
              <strong><LocalizedText id="audioWizard.c918319f59" /></strong>
              <span><Music size={14} /><LocalizedText id="audioWizard.1f0b50eb38" /></span>
            </div>
            <section>
              <button type="button" aria-label={i18next.t('audioWizard.21925350de')}><Play size={16} fill="currentColor" /></button>
              <i><b /></i>
              <em>{values.duration === '30秒' ? '0:30' : values.duration === '1分钟' ? '1:30' : values.duration === '2分钟' ? '2:00' : '3:00'}</em>
            </section>
          </article>
        </div>
      ) : null}
      {errorMessage ? <div className="ppt-c1-tip">{errorMessage}</div> : null}
      <div className="ppt-inline-footer ppt-c1-footer">
        {step === 0 ? <button type="button" className="ppt-primary-btn" onClick={() => setStep(1)}><LocalizedText id="audioWizard.ea0ef2ae72" /></button> : null}
        {step === 1 ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(0)}><LocalizedText id="audioWizard.75ef1241c0" /></button>
            <button type="button" className="ppt-primary-btn" onClick={generateAudio}><LocalizedText id="audioWizard.1df8a13f7a" /></button>
          </>
        ) : null}
        {isGenerating ? <button type="button" className="ppt-ghost-btn" onClick={() => setStep(1)}><LocalizedText id="audioWizard.4d0b4688c7" /></button> : null}
        {isResult ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(2)}><LocalizedText id="audioWizard.2e19057052" /></button>
            <button type="button" className="ppt-primary-btn" onClick={() => onInsert('audio', { ...asset, ...generatedAsset, title: generatedAsset?.title || asset.title })}><LocalizedText id="audioWizard.e8641c2c63" /></button>
          </>
        ) : null}
      </div>
    </>
  );
}

export function AudioAssetWizard({ asset, onBack, onClose, onInsert, onTitleChange }) {
  const { t } = useTranslation();
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

  const cfg = getAudioConfig(t)[asset.code] || getAudioConfig(t).C1;
  const [stage, setStage] = React.useState('form');
  const [step, setStep] = React.useState(0);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [values, setValues] = React.useState({ emotion: '安静', duration: '30秒' });
  const setValue = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  React.useEffect(() => {
    if (stage === 'generating') onTitleChange?.(i18next.t('assetPanel.iwGenerating'));
    else if (stage === 'result') onTitleChange?.(i18next.t('audioWizard.selectAudio'));
    else onTitleChange?.(asset.title);
  }, [asset.title, onTitleChange, stage]);

  if (stage === 'generating') {
    return <GenerationProgress title={i18next.t('audioWizard.4e0d6c5dc9')} subtitle={i18next.t('audioWizard.savedToLibrary', { title: asset.title })} progress={72} onHang={onClose} onViewResult={() => setStage('result')} />;
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
            <div className="ppt-audio-section-title"><LocalizedText id="audioWizard.aca4011765" /></div>
            <div className="ppt-audio-emotion-grid">
              {c1Emotions.map(([name, icon]) => (
                <button type="button" key={name} className={values.emotion === name ? 'is-active' : ''} onClick={() => setValue('emotion', name)}>
                  <strong>{icon}</strong><span><LocalizedValue value={name} catalog="audioOptionLabels" /></span>
                </button>
              ))}
            </div>
            <Tip><LocalizedText id="audioWizard.195175f324" /></Tip>
          </>
        ) : null}
        {asset.code === 'C1' && step === 1 ? (
          <>
            <div className="ppt-audio-section-title"><LocalizedText id="audioWizard.1fe93f57e0" /></div>
            <div className="ppt-audio-duration-list">
              {c1Durations.map(([name, desc]) => (
                <button type="button" key={name} className={values.duration === name ? 'is-active' : ''} onClick={() => setValue('duration', name)}>
                  <i /><span><strong><LocalizedValue value={name} catalog="audioOptionLabels" /></strong><em><LocalizedValue value={desc} catalog="audioOptionLabels" /></em></span><b />
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
            <strong><LocalizedText id="audioWizard.321978cea1" /></strong>
            <dl>
              <dt><LocalizedText id="audioWizard.50ff6ddc7b" /></dt><dd>{asset.title}</dd>
              <dt><LocalizedText id="audioWizard.1690d1c10b" /></dt><dd><LocalizedValue value={values.emotion || values.topic || values.activity || '自动匹配'} catalog="audioOptionLabels" /></dd>
              <dt><LocalizedText id="audioWizard.29d0552d2e" /></dt><dd><LocalizedValue value={values.duration || '1分钟'} catalog="audioOptionLabels" /></dd>
            </dl>
            <Tip><LocalizedText id="audioWizard.43daae6c15" /></Tip>
          </div>
        ) : null}
      </div>
      <div className="ppt-inline-footer">
        <button type="button" className="ppt-ghost-btn" onClick={step === 0 ? onBack : () => setStep((current) => current - 1)}><LocalizedValue value={step === 0 ? '返回类型' : '上一步'} catalog="audioOptionLabels" /></button>
        <button type="button" className="ppt-primary-btn" onClick={() => {
          const maxStep = asset.code === 'C1' ? 2 : 1;
          if (step < maxStep) setStep((current) => current + 1);
          else setStage('generating');
        }}>
          {step < (asset.code === 'C1' ? 2 : 1) ? <LocalizedValue value="下一步" catalog="audioOptionLabels" /> : <><Sparkles size={14} /><LocalizedText id="audioWizard.b74569c1b3" /></>}
        </button>
      </div>
    </>
  );
}
