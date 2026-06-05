import React from 'react';
import { Check, Clock, Music, Play, RefreshCw, Sparkles } from 'lucide-react';
import { audioConfig } from './assetPanelData';
import { FieldBlock, OptionGrid, Tip } from './AssetControls';
import { GenerationProgress } from './GenerationProgress';
import { GeneratedAssetResults } from './GeneratedAssetResults';

function AudioField({ field, value, onChange }) {
  if (field.type === 'textarea') {
    return (
      <FieldBlock label={field.label}>
        <textarea value={value || ''} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} />
      </FieldBlock>
    );
  }
  if (field.type === 'input') {
    return (
      <FieldBlock label={field.label}>
        <input value={value || ''} placeholder={field.placeholder} onChange={(event) => onChange(event.target.value)} />
      </FieldBlock>
    );
  }
  return (
    <FieldBlock label={field.label}>
      <OptionGrid options={field.options} value={value || field.options[0]} onChange={onChange} columns={field.options.length > 3 ? 4 : 3} />
    </FieldBlock>
  );
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

function AudioStepper({ steps, step }) {
  return (
    <div className="ppt-audio-stepper">
      {steps.map((item, index) => (
        <React.Fragment key={item}>
          <span className={`${step === index ? 'is-active' : ''} ${step > index ? 'is-done' : ''}`}>
            <b>{step > index ? <Check size={11} /> : index + 1}</b>{item.replace('选择', '').replace('生成结果', '生成')}
          </span>
          {index < steps.length - 1 ? <i>›</i> : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function C1Stepper({ step, done = false }) {
  const items = ['情绪', '时长', '生成'];
  return (
    <div className="ppt-c1-stepper">
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

function C1AudioWizard({ asset, onInsert, onTitleChange }) {
  const [step, setStep] = React.useState(0);
  const [values, setValues] = React.useState({ emotion: '安静', duration: '1分钟' });
  const setValue = (key, value) => setValues((current) => ({ ...current, [key]: value }));
  const isGenerating = step === 2;
  const isResult = step === 3;

  React.useEffect(() => {
    onTitleChange?.(asset.title);
  }, [asset.title, onTitleChange]);

  React.useEffect(() => {
    if (step !== 2) return undefined;
    const timer = window.setTimeout(() => setStep(3), 1400);
    return () => window.clearTimeout(timer);
  }, [step]);

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
      <div className="ppt-inline-footer ppt-c1-footer">
        {step === 0 ? <button type="button" className="ppt-primary-btn" onClick={() => setStep(1)}>下一步 →</button> : null}
        {step === 1 ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(0)}>←</button>
            <button type="button" className="ppt-primary-btn" onClick={() => setStep(2)}>生成BGM ★</button>
          </>
        ) : null}
        {isGenerating ? <button type="button" className="ppt-ghost-btn" onClick={() => setStep(1)}>取消</button> : null}
        {isResult ? (
          <>
            <button type="button" className="ppt-ghost-btn" onClick={() => setStep(2)}><RefreshCw size={16} />重新生成</button>
            <button type="button" className="ppt-primary-btn" onClick={() => onInsert('audio', asset)}>插入画布 →</button>
          </>
        ) : null}
      </div>
    </>
  );
}

export function AudioAssetWizard({ asset, onBack, onInsert, onTitleChange }) {
  if (asset.code === 'C1') {
    return <C1AudioWizard asset={asset} onInsert={onInsert} onTitleChange={onTitleChange} />;
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
