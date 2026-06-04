import React from 'react';
import { Image, Music, Video } from 'lucide-react';
import apiService from '../../../utils/apiService';
import { PptDemoScene } from './PptDemoScene';
import './css/PptAssetPanel.css';

const assetGroups = {
  image: {
    noun: '图片',
    formId: 'gv-img-s1',
    resultTitle: '选择图片',
    cards: [
      ['B1', '主题意境图', '背景图，无文字', 'ico-blue'],
      ['B2', '意境图（有文字）', '海报效果，图文排版', 'ico-purple'],
      ['B3', '词汇闪卡', '批量生成', 'ico-coral'],
      ['B4', '故事配图', '文字留白', 'ico-green'],
      ['B5', '活动氛围图', '体能/音乐', 'ico-blue'],
      ['B6', '主题词图谱', '场景词汇标注', 'ico-coral'],
      ['B7', '文本配图', '谜题/对话', 'ico-pink'],
      ['B8', '知识总结图', '语法/思维导图', 'ico-orange'],
      ['B9', '绘本故事配图', '多页故事角色一致', 'ico-teal'],
      ['B10', '四格漫画', '漫画情节和对话', 'ico-lime'],
      ['B11', '动作示意图', 'TPR，IP角色', 'ico-purple'],
    ],
    icon: Image,
  },
  audio: {
    noun: '音频',
    formId: 'gv-aud',
    resultTitle: '选择音频',
    cards: [
      ['C1', '情绪氛围BGM', '纯器乐', 'ico-coral'],
      ['C2', '活动背景乐', '游戏/冥想', 'ico-purple'],
      ['C3', '跟读朗读', 'TTS', 'ico-green'],
      ['C4', '情景对话', '多角色', 'ico-blue'],
      ['C5', '教学歌曲', 'AI词+音乐', 'ico-purple'],
      ['C6', '冥想引导', '语音+背景', 'ico-coral'],
    ],
    icon: Music,
  },
  video: {
    noun: '视频',
    formId: 'gv6',
    resultTitle: '选择视频',
    cards: [
      ['V1', '体能闯关视频', '单角色·5步向导', 'ico-blue'],
      ['VM', '情境叙事视频', '世界观·叙事CG', 'ico-purple'],
      ['V3', '教学动画', '即将上线', 'ico-coral', true],
    ],
    icon: Video,
  },
};

function SvgGlyph({ type }) {
  const Icon = type;
  return <Icon size={18} />;
}

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function Field({ label, children }) {
  return (
    <div className="fg">
      <label className="fl">{label}</label>
      {children}
    </div>
  );
}

export function PptAssetPanel({ type, onClose, onInsert }) {
  const group = assetGroups[type] || assetGroups.image;
  const [view, setView] = React.useState('gv0');
  const [selected, setSelected] = React.useState(null);
  const [videoStep, setVideoStep] = React.useState(1);
  const [progress, setProgress] = React.useState(0);
  const [resultIndex, setResultIndex] = React.useState(0);
  const [resultItems, setResultItems] = React.useState([]);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [formState, setFormState] = React.useState({
    imageRatio: '16:9',
    imageStyle: '卡通插画',
    prompt: '',
    audioMood: '轻快',
    audioDuration: '1分钟',
    videoType: '体能闯关',
    videoScene: '森林 / 拯救型',
    videoRole: 'Poppy',
    videoScript: '角色进入场景，完成 3 个课堂动作挑战，并在结尾给出鼓励反馈。',
  });

  React.useEffect(() => {
    setView('gv0');
    setSelected(null);
    setVideoStep(1);
    setProgress(0);
    setResultIndex(0);
    setResultItems([]);
    setErrorMessage('');
  }, [type]);

  React.useEffect(() => {
    if (view !== 'gv-gen') return undefined;
    let cancelled = false;
    setProgress(18);
    setErrorMessage('');
    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(current + 9, 88));
    }, 650);

    const generate = async () => {
      try {
        const prompt = formState.prompt.trim()
          || `生成适合 PPT 画布使用的${selected?.name || group.noun}素材，内容清晰，适合儿童英语课堂。`;
        const result = await apiService.post('/api/ai/generate-ppt-asset', {
          assetType: type,
          assetCode: selected?.code,
          assetName: selected?.name,
          prompt,
          options: {
            imageRatio: formState.imageRatio,
            imageStyle: formState.imageStyle,
            audioMood: formState.audioMood,
            audioDuration: formState.audioDuration,
            videoType: formState.videoType,
            videoScene: formState.videoScene,
            videoRole: formState.videoRole,
            videoScript: formState.videoScript,
          },
        });
        if (cancelled) return;
        setProgress(100);
        setResultItems(result.assets?.length ? result.assets : [result.asset].filter(Boolean));
        setView('gv3');
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(error.message || `${group.noun}生成失败`);
        setView(group.formId);
      } finally {
        window.clearInterval(timer);
      }
    };

    generate();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [view, type, selected, group.noun, group.formId, formState]);

  const startWizard = (card) => {
    if (card[4]) return;
    setSelected({ code: card[0], name: card[1], desc: card[2] });
    setVideoStep(1);
    setFormState((current) => ({
      ...current,
      prompt: `生成适合 PPT 画布使用的${card[1]}，${card[2]}，画面或内容清晰，适合儿童英语课堂。`,
    }));
    setView(group.formId);
  };

  const insertAsset = () => {
    const card = selected || { name: `${group.noun}素材`, desc: '素材库' };
    const generated = resultItems[resultIndex] || {};
    onInsert(type, {
      title: generated.title || card.name,
      prompt: generated.prompt || formState.prompt || `${card.name}：${card.desc}`,
      url: generated.url,
      taskId: generated.taskId,
      statusUrl: generated.statusUrl,
      generationStatus: generated.status || (generated.taskId ? 'submitted' : undefined),
      duration: generated.duration,
      videoMeta: generated.videoMeta,
    });
  };

  const entryTitle = type === 'image' ? '选择图片素材类型' : type === 'audio' ? '选择音频素材类型' : '选择视频素材类型';

  const renderEntry = () => (
    <div id="gv0" className="gp-view">
      <div className="gp-hd">
        <div className="gp-title">插入素材</div>
        <button className="gp-x" type="button" onClick={onClose}>×</button>
      </div>
      <div className="gp-sc">
        <div className="tg-sec" data-asset-group={type}>{entryTitle}</div>
        <div className={`tg asset-type-grid ${type === 'audio' ? 'audio-type-grid' : ''} ${type === 'video' ? 'video-type-grid' : ''}`}>
          {group.cards.map((card) => {
            const disabled = card[4];
            return (
              <button
                type="button"
                key={card[0]}
                className={`tc asset-type-card ${disabled ? 'dim' : ''}`}
                onClick={() => startWizard(card)}
              >
                <div className={`ti asset-ico ${card[3]}`}><SvgGlyph type={group.icon} /></div>
                <div className="tn">{card[1]}</div>
                <div className="ts">{card[2]}</div>
              </button>
            );
          })}
        </div>
        <div className="tg-sec asset-lib-title" data-asset-group="common">素材库</div>
        <div className="asset-lib-wrap">
          <button className="asset-library-btn" type="button" onClick={() => setErrorMessage('素材库选择器尚未接入，请先使用 AI 生成。')}>
            从已有素材库选择
          </button>
          {errorMessage && <div className="tip">{errorMessage}</div>}
        </div>
      </div>
    </div>
  );

  const renderImageWizard = () => (
    <div id="gv-img-s1" className="gp-view" data-img-code={selected?.code || 'B1'}>
      <div className="gp-hd">
        <button className="gp-back" type="button" onClick={() => setView('gv0')}><BackIcon /></button>
        <div className="gp-title">{selected?.name || '主题意境图'}</div>
        <button className="gp-x" type="button" onClick={onClose}>×</button>
      </div>
      <div className="gp-sc">
        <div className="mw">
          <Field label="图片比例">
            <div className="rc-row">
              {['16:9', '4:3', '1:1'].map((item) => (
                <button className={`rc ${formState.imageRatio === item ? 'on' : ''}`} type="button" key={item} onClick={() => setFormState((current) => ({ ...current, imageRatio: item }))}>
                  <div className="rn">{item}</div>
                </button>
              ))}
            </div>
          </Field>
          <Field label="图片风格">
            <div className="rc-row two">
              {['卡通插画', '水彩手绘', '写实摄影', '扁平插画'].map((item) => (
                <button className={`rc ${formState.imageStyle === item ? 'on' : ''}`} type="button" key={item} onClick={() => setFormState((current) => ({ ...current, imageStyle: item }))}>
                  <div className="rn">{item}</div>
                </button>
              ))}
            </div>
          </Field>
          <Field label="内容描述">
            <textarea className="fi" value={formState.prompt} onChange={(event) => setFormState((current) => ({ ...current, prompt: event.target.value }))} />
          </Field>
          {errorMessage && <div className="tip">{errorMessage}</div>}
          <div className="tip">生成后会进入候选结果页，选择满意素材后再插入画布。</div>
        </div>
      </div>
      <div className="gp-ft">
        <button id="s1-gen-btn" className="btn btn-pri" type="button" onClick={() => setView('gv-gen')}>生成图片</button>
      </div>
    </div>
  );

  const renderAudioWizard = () => (
    <div id="gv-aud" className="gp-view">
      <div className="gp-hd">
        <button className="gp-back" type="button" onClick={() => setView('gv0')}><BackIcon /></button>
        <div className="gp-title">{selected?.name || '情绪氛围BGM'}</div>
        <button className="gp-x" type="button" onClick={onClose}>×</button>
      </div>
      <div className="gp-sc">
        <div className="mw">
          <Field label="音频情绪">
            <div className="rc-row two">
              {['轻快', '温暖', '紧张', '安静'].map((item) => (
                <button className={`rc ${formState.audioMood === item ? 'on' : ''}`} type="button" key={item} onClick={() => setFormState((current) => ({ ...current, audioMood: item }))}>
                  <div className="rn">{item}</div>
                </button>
              ))}
            </div>
          </Field>
          <Field label="时长">
            <select className="fi" value={formState.audioDuration} onChange={(event) => setFormState((current) => ({ ...current, audioDuration: event.target.value }))}>
              <option>30秒</option>
              <option>1分钟</option>
              <option>2分钟</option>
            </select>
          </Field>
          <Field label="音频描述">
            <textarea className="fi" value={formState.prompt} onChange={(event) => setFormState((current) => ({ ...current, prompt: event.target.value }))} />
          </Field>
          {errorMessage && <div className="tip">{errorMessage}</div>}
          <div className="tip">音频生成后会保存到素材库，也可直接插入当前 PPT 画布。</div>
        </div>
      </div>
      <div className="gp-ft">
        <button className="btn btn-pri" type="button" onClick={() => setView('gv-gen')}>生成音频</button>
      </div>
    </div>
  );

  const renderVideoWizard = () => (
    <div id="gv6" className="gp-view">
      <div className="gp-hd">
        <button className="gp-back" type="button" onClick={() => (videoStep > 1 ? setVideoStep(videoStep - 1) : setView('gv0'))}><BackIcon /></button>
        <div className="gp-title">{selected?.name || '体能闯关视频'}</div>
        <button className="gp-x" type="button" onClick={onClose}>×</button>
      </div>
      <div className="gp-sc">
        <div className="mw">
          <div className="vid-stepbar">
            {[1, 2, 3, 4, 5].map((step) => <button key={step} type="button" className={`vid-sp ${videoStep === step ? 'on' : ''}`} onClick={() => setVideoStep(step)}>{step}</button>)}
          </div>
          {videoStep === 1 && (
            <>
              <Field label="视频类型"><select className="fi" value={formState.videoType} onChange={(event) => setFormState((current) => ({ ...current, videoType: event.target.value }))}><option>体能闯关</option><option>情境叙事</option></select></Field>
              <Field label="场景模板">
                <div className="vid-scene-row">
                  {['森林 / 拯救型', '星球 / 闯关型'].map((scene) => (
                    <button type="button" key={scene} className={`vid-scene-thumb ${formState.videoScene === scene ? 'on' : ''}`} onClick={() => setFormState((current) => ({ ...current, videoScene: scene }))}>
                      <PptDemoScene /><span>{scene}</span>
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}
          {videoStep === 2 && (
            <>
              <Field label="IP 角色">
                <div className="rc-row two">
                  {['Poppy', 'Edi', 'Milo', 'Ace'].map((item) => (
                    <button className={`rc ${formState.videoRole === item ? 'on' : ''}`} type="button" key={item} onClick={() => setFormState((current) => ({ ...current, videoRole: item }))}>
                      <div className="rn">{item}</div>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="动作脚本"><textarea className="fi" value={formState.videoScript} onChange={(event) => setFormState((current) => ({ ...current, videoScript: event.target.value }))} /></Field>
            </>
          )}
          {videoStep >= 3 && (
            <>
              <Field label="视频参数">
                <div className="rc-row">
                  {['自动播放', '循环播放', '静音预览'].map((item, index) => <button className={`rc ${index === 0 ? 'on' : ''}`} type="button" key={item}><div className="rn">{item}</div></button>)}
                </div>
              </Field>
              <Field label="视频描述">
                <textarea className="fi" value={formState.prompt} onChange={(event) => setFormState((current) => ({ ...current, prompt: event.target.value }))} />
              </Field>
              {errorMessage && <div className="tip">{errorMessage}</div>}
            </>
          )}
        </div>
      </div>
      <div className="gp-ft">
        {videoStep < 5 ? (
          <button className="btn btn-pri" type="button" onClick={() => setVideoStep(videoStep + 1)}>下一步</button>
        ) : (
          <button className="btn btn-pri" type="button" onClick={() => setView('gv-gen')}>生成视频</button>
        )}
      </div>
    </div>
  );

  const renderGenerating = () => (
    <div id="gv2" className="gp-view">
      <div className="gp-hd">
        <div className="gp-title">正在生成...</div>
        <button className="gp-x" type="button" onClick={onClose}>×</button>
      </div>
      <div className="gp-sc gen-main">
        <div className="gen-icon">✦</div>
        <div className="gen-main-label">AI 正在生成{group.noun}</div>
        <div className="gen-bar"><i style={{ width: `${progress}%` }} /></div>
        <div className="gen-status">{progress}% · {progress < 60 ? '生成中' : '整理结果'}</div>
      </div>
    </div>
  );

  const renderResult = () => (
    <div id="gv3" className="gp-view">
      <div className="gp-hd">
        <button className="gp-back" type="button" onClick={() => setView(group.formId)}><BackIcon /></button>
        <div className="gp-title">{selected?.name || group.resultTitle} · 生成结果</div>
        <button className="gp-x" type="button" onClick={onClose}>×</button>
      </div>
      <div className="gp-sc">
        <div className="result-grid">
          {resultItems.map((item, index) => (
            <button type="button" className={`result-card ${resultIndex === index ? 'on' : ''}`} key={item.taskId || item.url || index} onClick={() => setResultIndex(index)}>
              {type === 'audio' ? (
                <div className="audio-result"><Music size={20} /><span>{item.title || selected?.name || '音频素材'}</span></div>
              ) : item.url ? (
                type === 'video' ? <video src={item.url} muted /> : <img src={item.url} alt={item.title || selected?.name || '生成素材'} />
              ) : (
                <PptDemoScene />
              )}
              <b>{item.status === 'completed' ? '生成完成' : '任务已提交'}</b>
              {item.taskId && <span>{item.taskId}</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="gp-ft">
        <button className="btn btn-ghost" type="button" onClick={() => setView(group.formId)}>重新生成</button>
        <button className="btn btn-pri" type="button" onClick={insertAsset}>插入画布</button>
      </div>
    </div>
  );

  return (
    <aside className="ppt-right ppt-generate-panel gp on">
      {view === 'gv0' && renderEntry()}
      {view === 'gv-img-s1' && renderImageWizard()}
      {view === 'gv-aud' && renderAudioWizard()}
      {view === 'gv6' && renderVideoWizard()}
      {view === 'gv-gen' && renderGenerating()}
      {view === 'gv3' && renderResult()}
    </aside>
  );
}
