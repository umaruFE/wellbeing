import i18next from 'i18next';
import { LocalizedText, LocalizedValue } from '../../../../i18n/LocalizedText.jsx';
import React from 'react';
import { Input } from 'antd';
import { Check, Pause, Sparkles, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import poppy from '../../../../assets/ip/poppy.png';
import edi from '../../../../assets/ip/edi.png';
import rolly from '../../../../assets/ip/rolly.png';
import milo from '../../../../assets/ip/milo.png';
import ace from '../../../../assets/ip/ace.png';
import apiService from '../../../../utils/apiService';
import videoStoryboardService from '../../../../services/videoStoryboardService';

const steps = ['场景 · 角色', '词汇与句型', '生成分镜', '生成视频'];
const storySteps = ['角色与方向', '叙事选项', '生成分镜', '生成视频'];
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
    const templateLabels = {
      shield: '拯救型：伙伴被困，完成挑战来拯救',
      map: '探险型：追踪线索，完成任务抵达宝藏',
      cup: '竞赛型：友谊挑战赛，比拼通关',
      gear: '解谜型：魔法失控，用正确动作恢复秩序',
    };
    return [
      '生成适合儿童英语PPT课件的情境叙事视频。',
      `叙事模板：${templateLabels[values.template] || templateLabels.shield}。`,
      `目标动作或词汇：${(values.words || []).join('、') || '无'}。`,
      `目标句型：${(values.sentences || []).join('；') || '无'}。`,
      `旁白语言：${values.narrationLanguage === 'bilingual' ? '中英双语' : '英文'}。`,
      `背景音乐：${values.bgm ? '自动匹配' : '关闭'}。`,
      `音效：${values.sfx ? '开启' : '关闭'}。`,
      '保持角色形象一致，画面清晰、活泼、连贯。',
    ].join('');
  }
  return [
    '生成适合儿童英语PPT课件的体能闯关视频。',
    `场景：${values.scene || '森林'}。`,
    `闯关词汇：${(values.words || []).join('、') || '无'}。`,
    `引导句型：${(values.sentences || []).join('；') || '无'}。`,
    `单词气泡样式：${values.bubble || '胶囊'}。`,
    `背景音乐：${values.bgm ? '开启' : '关闭'}。`,
    `英文旁白：${values.voice ? '开启' : '关闭'}。`,
    `单词发音音效：${values.sfx ? '开启' : '关闭'}。`,
    '保持角色形象一致，动作清晰，节奏活泼。',
  ].join('');
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function findVideoUrl(value, depth = 0) {
  if (depth > 6 || value == null) return '';
  if (typeof value === 'string') {
    return /^(https?:\/\/|\/api\/|\/uploads\/)/i.test(value) && /\.(mp4|webm|mov)(\?|$)/i.test(value)
      ? value
      : '';
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findVideoUrl(item, depth + 1);
      if (found) return found;
    }
    return '';
  }
  if (typeof value === 'object') {
    for (const key of ['video_url', 'videoUrl', 'url', 'assetUrl', 'outputUrl']) {
      const found = findVideoUrl(value[key], depth + 1);
      if (found) return found;
    }
    for (const item of Object.values(value)) {
      const found = findVideoUrl(item, depth + 1);
      if (found) return found;
    }
  }
  return '';
}

async function completeAndSaveVideo(asset, generated) {
  let completed = generated;
  if (!completed?.url && completed?.statusUrl) {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      await wait(3000);
      const status = await apiService.get(completed.statusUrl);
      const state = status?.status || status?.data?.status;
      const url = findVideoUrl(status);
      if (url) {
        completed = { ...completed, url, status: 'completed' };
        if (completed.backgroundTaskId) {
          apiService.post(`/api/background-tasks/${completed.backgroundTaskId}`, {
            action: 'complete',
            result: { ...status, url },
          }).catch((error) => {
            console.warn('[VideoAssetWizard] 后台任务完成状态同步失败:', error);
          });
        }
        break;
      }
      if (state === 'failed' || state === 'error') {
        if (completed.backgroundTaskId) {
          apiService.post(`/api/background-tasks/${completed.backgroundTaskId}`, {
            action: 'fail',
            error: status?.error || '视频生成失败',
          }).catch(() => {});
        }
        throw new Error(status?.error || i18next.t('videoWizard.videoGenerateFailed'));
      }
    }
  }

  if (completed?.url) {
    const saved = await apiService.post('/api/videos', {
      name: completed.title || asset.title,
      description: completed.prompt || '',
      video_url: completed.url,
      thumbnail_url: completed.thumbnailUrl || completed.thumbnail_url || '',
      duration: completed.duration || '',
      tags: ['AI生成', asset.code].filter(Boolean),
    });
    return { ...completed, libraryId: saved.data?.id, savedToLibrary: true };
  }

  return completed;
}

function unwrapStoryboardData(result) {
  return result?.storyboardData?.data
    || result?.storyboardData
    || result?.data?.storyboardData?.data
    || result?.data?.storyboardData;
}

function storyboardImageUrl(path) {
  if (typeof path !== 'string') return '';
  return path.startsWith('/home/node/files/')
    ? `/api/ai/serve-image?path=${encodeURIComponent(path)}`
    : path;
}

async function generateStoryboardAsset(asset, values) {
  const prompt = buildVideoPrompt(asset, values);
  const role = String(values.character || 'Poppy').toLowerCase();
  const direction = values.direction || '16:9';
  const isVertical = direction === '9:16';
  const videoWidth = isVertical ? 480 : 864;
  const videoHeight = isVertical ? 864 : 480;

  const storyboardResult = await videoStoryboardService.callWebhookGenerateImages(
    role,
    direction,
    prompt,
    videoWidth,
    videoHeight,
  );
  const storyboardData = unwrapStoryboardData(storyboardResult);

  if (!storyboardData) {
    throw new Error(i18next.t('videoWizard.storyboardDataMissing'));
  }

  const storyboardImages = storyboardData.storyboard_images_filepath;
  const storyboardPrompts = storyboardData.storyboard_prompts;
  if (!Array.isArray(storyboardImages) || storyboardImages.length === 0) {
    throw new Error(i18next.t('videoWizard.storyboardImagesMissing'));
  }
  if (!Array.isArray(storyboardPrompts) || storyboardPrompts.length === 0) {
    throw new Error(i18next.t('videoWizard.storyboardPromptsMissing'));
  }

  return {
    prompt,
    videoWidth,
    videoHeight,
    storyboardData,
    images: storyboardImages.map(storyboardImageUrl),
    prompts: storyboardPrompts,
  };
}

async function composeStoryboardVideo(asset, storyboard) {
  const {
    prompt,
    videoWidth,
    videoHeight,
    storyboardData,
    prompts: storyboardPrompts,
  } = storyboard;

  const composed = await videoStoryboardService.generateVideoWithPolling({
    storyboard_images_filepath: storyboardData.storyboard_images_filepath,
    storyboard_prompts: storyboardPrompts,
    video_width: videoWidth,
    video_height: videoHeight,
    voice: storyboardData.voice || {},
    storyboard_image_prompts: storyboardData.storyboard_image_prompts || [],
    title: asset.title,
  });
  const videoUrl = typeof composed?.videoData === 'string'
    ? composed.videoData
    : findVideoUrl(composed?.videoData || composed);
  if (!videoUrl) {
    throw new Error(i18next.t('videoWizard.videoUrlMissing'));
  }

  return completeAndSaveVideo(asset, {
    title: asset.title,
    prompt,
    url: videoUrl,
    status: 'completed',
    duration: storyboardPrompts.reduce(
      (total, item) => total + (Number(item?.duration) || 0),
      0,
    ),
    raw: composed,
  });
}

function VideoStepper({ step }) {
  return (
    <div className="ppt-v1-stepper">
      {steps.map((label, index) => (
        <React.Fragment key={label}>
          <div className={`ppt-v1-step ${step === index ? 'is-active' : ''} ${step > index ? 'is-done' : ''}`}>
            <span>{step > index ? <Check size={12} /> : index + 1}</span>
            <strong><LocalizedValue value={label} catalog="videoOptionLabels" /></strong>
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
            <strong><LocalizedValue value={label} catalog="videoOptionLabels" /></strong>
          </div>
          {index < storySteps.length - 1 ? <i /> : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function CountHint({ count, minimum = 6 }) {
  const { t } = useTranslation();

  return (
    <p className="ppt-v1-count">
      {t('ppt.videoAssetCountPrefix')}
      <strong>{count}</strong>
      {t('ppt.videoAssetCountMiddle')}
      <strong>{minimum}</strong>
      {t('ppt.videoAssetCountSuffix')}
    </p>
  );
}

function SceneRoleStep({ values, setValue }) {
  return (
    <div className="ppt-v1-body">
      <div className="ppt-v1-section-title"><LocalizedText id="videoWizard.4130da68db" /></div>
      <div className="ppt-v1-scene-grid">
        {scenes.map((scene) => (
          <button
            type="button"
            key={scene}
            className={values.scene === scene ? 'is-active' : ''}
            onClick={() => setValue('scene', scene)}
          >
            <span className={`ppt-v1-scene-art scene-${scene}`} />
            <strong><LocalizedValue value={scene} catalog="videoOptionLabels" /></strong>
          </button>
        ))}
      </div>

      <div className="ppt-v1-scene-prompt">
        <Input.TextArea placeholder={i18next.t('videoWizard.6fcf0d9501')} maxLength={40} />
        <div>
          <span>0 / 40</span>
          <button type="button"><Sparkles size={14} /><LocalizedText id="videoWizard.b76ad92520" /></button>
        </div>
      </div>

      <div className="ppt-v1-section-title"><LocalizedText id="videoWizard.1851ef4d16" /></div>
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

      <div className="ppt-v1-section-title"><LocalizedText id="videoWizard.f43ebf86b1" /></div>
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
            <span><LocalizedValue value={label} catalog="videoOptionLabels" /></span>
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
      <div className="ppt-v1-required-line"><b>* <LocalizedValue value={wordTitle} catalog="videoOptionLabels" /></b>{wordHint ? <span>（<LocalizedValue value={wordHint} catalog="videoOptionLabels" />）</span> : null}</div>
      <div className="ppt-v1-word-box">
        <div>
          {values.words.map((word) => (
            <span key={word}>{word}<button type="button" onClick={() => removeWord(word)} aria-label={i18next.t('videoWizard.deleteItem', { item: word })}><X size={12} /></button></span>
          ))}
        </div>
        <Input.TextArea
          value={wordDraft}
          placeholder={i18next.t('videoWizard.0510057c10')}
          onChange={(event) => setWordDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              addWord();
            }
          }}
        />
      </div>
      <CountHint count={values.words.length} />

      <div className="ppt-v1-required-line"><b>{sentenceTitle.includes('第二关') ? '* ' : ''}<LocalizedValue value={sentenceTitle} catalog="videoOptionLabels" /></b><span>{sentenceHint ? <>（<LocalizedValue value={sentenceHint} catalog="videoOptionLabels" />）</> : null}</span></div>
      <div className="ppt-v1-sentence-list">
        {values.sentences.map((sentence) => (
          <div key={sentence}><span>⠿</span><strong>{sentence}</strong><button type="button" onClick={() => removeSentence(sentence)} aria-label={i18next.t('videoWizard.deleteItem', { item: sentence })}><X size={14} /></button></div>
        ))}
      </div>
      <CountHint count={values.sentences.length} />
      {addingSentence ? (
        <div className="ppt-v1-sentence-add-row">
          <span>⠿</span>
          <Input
            autoFocus
            value={sentenceDraft}
            placeholder={i18next.t('videoWizard.ab4868b5c1')}
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
          <button type="button" onClick={addSentence}><LocalizedText id="videoWizard.b56d9ac6c5" /></button>
          <button type="button" onClick={() => { setAddingSentence(false); setSentenceDraft(''); }}>×</button>
        </div>
      ) : (
        <button type="button" className="ppt-v1-add-sentence" onClick={() => setAddingSentence(true)}><LocalizedText id="videoWizard.e4e9c85084" /></button>
      )}
    </>
  );
}

function VocabSentenceStep({ values, setValue }) {
  const toggle = (key) => setValue(key, !values[key]);

  return (
    <div className="ppt-v1-body">
      <div className="ppt-v1-section-title"><LocalizedText id="videoWizard.2321a49fa5" /></div>

      <WordSentenceFields values={values} setValue={setValue} />

      <div className="ppt-v1-duration-row">
        <span><LocalizedText id="videoWizard.45c619288a" /></span>
        <strong><LocalizedText id="videoWizard.3118b0401d" /></strong>
      </div>

      <div className="ppt-v1-divider" />
      <div className="ppt-v1-section-title"><LocalizedText id="videoWizard.de1e09b58e" /></div>
      <div className="ppt-v1-bubble-grid">
        {bubbleTypes.map((type) => (
          <button type="button" key={type} className={values.bubble === type ? 'is-active' : ''} onClick={() => setValue('bubble', type)}>
            <span className={`shape-${type}`} />
            <strong><LocalizedValue value={type} catalog="videoOptionLabels" /></strong>
          </button>
        ))}
      </div>

      <div className="ppt-v1-divider" />
      <div className="ppt-v1-section-title"><LocalizedText id="videoWizard.a5bd70de60" /></div>
      <div className="ppt-v1-toggle-card">
        {[
          ['bgm', '背景音乐', '动感音乐随关卡节奏变化'],
          ['voice', '英文旁白', 'AI语音朗读引导词'],
          ['sfx', '单词发音音效', '击破单词时播放该词发音'],
        ].map(([key, title, desc]) => (
          <button type="button" key={key} onClick={() => toggle(key)}>
            <span><strong><LocalizedValue value={title} catalog="videoOptionLabels" /></strong><em><LocalizedValue value={desc} catalog="videoOptionLabels" /></em></span>
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
      <div><span><LocalizedText id="videoWizard.7849d47875" /></span><strong><LocalizedText id="videoWizard.29b723248a" /></strong></div>
      <div><span><LocalizedText id="videoWizard.29d0552d2e" /></span><strong><LocalizedText id="videoWizard.5ebd7f9bb6" /></strong></div>
      <div><span><LocalizedText id="videoWizard.f43ebf86b1" /></span><strong>{values.direction}</strong></div>
      <div><span><LocalizedText id="videoWizard.625b392c7b" /></span><strong><LocalizedValue value={values.scene} catalog="videoOptionLabels" /></strong></div>
      <div><span><LocalizedText id="videoWizard.1851ef4d16" /></span><strong>{values.character}</strong></div>
      <section>
        <article><span><LocalizedText id="videoWizard.305c991321" /></span><strong>{values.words.length}</strong></article>
        <article><span><LocalizedText id="videoWizard.ede08f1fa0" /></span><strong>{values.sentences.length}</strong></article>
      </section>
    </div>
  );
}

function storyboardPromptText(prompt, index) {
  if (typeof prompt === 'string') return prompt;
  return prompt?.description || prompt?.prompt || `${i18next.t('videoWizard.fcad7fe371')} ${index + 1}`;
}

function StoryboardImagesStep({ storyboard, generating, onRegenerate }) {
  return (
    <div className="ppt-v1-body">
      <div className="ppt-v1-section-title"><LocalizedText id="videoWizard.396339fb3f" /></div>
      {generating ? (
        <div className="ppt-v1-progress-card">
          <div className="ppt-v1-progress-hero">
            <span />
            <strong><LocalizedText id="videoWizard.95faa45d9f" /></strong>
            <em><LocalizedText id="videoWizard.4a43563202" /></em>
          </div>
        </div>
      ) : storyboard ? (
        <>
          <p className="ppt-storyboard-tip">
            <LocalizedText id="videoWizard.79c74f41ca" /> {storyboard.images.length} <LocalizedText id="videoWizard.926630340e" />
          </p>
          <div className="ppt-storyboard-grid">
            {storyboard.images.map((image, index) => (
              <article key={`${image}-${index}`}>
                <div>
                  {image ? <img src={image} alt={`${i18next.t('videoWizard.fcad7fe371')} ${index + 1}`} /> : <span><LocalizedText id="videoWizard.56872a6c3b" /></span>}
                  <b><LocalizedText id="videoWizard.fcad7fe371" /> {index + 1}</b>
                </div>
                <p>{storyboardPromptText(storyboard.prompts[index], index)}</p>
                <em>{Number(storyboard.prompts[index]?.duration) || 3} <LocalizedText id="videoWizard.eb6aaba1a1" /></em>
              </article>
            ))}
          </div>
          <button type="button" className="ppt-storyboard-regenerate" onClick={onRegenerate}>
            <LocalizedText id="videoWizard.955c056a4a" />
          </button>
        </>
      ) : (
        <div className="ppt-storyboard-empty">
          <strong><LocalizedText id="videoWizard.5bf4910a45" /></strong>
          <p><LocalizedText id="videoWizard.10c1f82ee0" /></p>
        </div>
      )}
    </div>
  );
}

function ConfirmStep({ values, generating, onHang }) {
  return (
    <div className="ppt-v1-body">
      <div className="ppt-v1-section-title"><LocalizedText id="videoWizard.b4c82d6033" /></div>
      <SummaryCard values={values} />
      <div className="ppt-v1-divider" />
      {generating ? (
        <div className="ppt-v1-progress-card">
          <div className="ppt-v1-progress-hero">
            <span />
            <strong><LocalizedText id="videoWizard.1e15b84cd2" /></strong>
            <em><LocalizedText id="videoWizard.2a35cf292b" /></em>
          </div>
          <div className="ppt-v1-progress-list">
            {progressRows.map((row) => (
              <div key={row.text} className={`is-${row.state}`}>
                <span>{row.state === 'done' ? '✓' : row.state === 'running' ? '○' : '◷'}</span>
                <strong><LocalizedValue value={row.text} catalog="videoOptionLabels" /></strong>
                <em><LocalizedValue value={row.status} catalog="videoOptionLabels" /></em>
              </div>
            ))}
          </div>
          <button type="button" className="ppt-hang-btn ppt-video-hang-btn" onClick={onHang}>
            <Pause size={13} /><LocalizedText id="videoWizard.094559b0f2" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function VideoAssetWizard({ asset, onBack, onClose, onInsert, onTitleChange }) {
  if (asset.code === 'VM') {
    return <StoryVideoFlow asset={asset} onBack={onBack} onClose={onClose} onInsert={onInsert} onTitleChange={onTitleChange} />;
  }
  return <FitnessVideoFlow asset={asset} onBack={onBack} onClose={onClose} onInsert={onInsert} onTitleChange={onTitleChange} />;
}

function FitnessVideoFlow({ asset, onBack, onClose, onInsert, onTitleChange }) {
  const [step, setStep] = React.useState(0);
  const [storyboardGenerating, setStoryboardGenerating] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [storyboard, setStoryboard] = React.useState(null);
  const [errorMessage, setErrorMessage] = React.useState('');
  const suspendedRef = React.useRef(false);
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
  const setValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setStoryboard(null);
  };

  React.useEffect(() => {
    onTitleChange?.(asset.title);
  }, [asset.title, onTitleChange]);

  const generateStoryboard = async () => {
    setStoryboardGenerating(true);
    setErrorMessage('');
    try {
      const generatedStoryboard = await generateStoryboardAsset(asset, values);
      setStoryboard(generatedStoryboard);
    } catch (error) {
      setErrorMessage(error.message || i18next.t('videoOptionLabels.分镜图片生成失败'));
    } finally {
      setStoryboardGenerating(false);
    }
  };

  const generateVideo = async () => {
    if (!storyboard) {
      setErrorMessage(i18next.t('videoOptionLabels.请先生成分镜图片'));
      setStep(2);
      return;
    }
    suspendedRef.current = false;
    setGenerating(true);
    setErrorMessage('');
    try {
      const generated = await composeStoryboardVideo(asset, storyboard);
      if (!suspendedRef.current) {
        onInsert('video', { ...asset, ...generated, title: generated?.title || asset.title });
      }
    } catch (error) {
      setErrorMessage(error.message || i18next.t('videoOptionLabels.视频生成任务提交失败'));
      setGenerating(false);
    }
  };

  const handleHang = () => {
    suspendedRef.current = true;
    onClose?.();
  };

  return (
    <div className="ppt-video-flow">
      <div className="ppt-video-flow-body">
        <VideoStepper step={step} />
        {step === 0 ? <SceneRoleStep values={values} setValue={setValue} /> : null}
        {step === 1 ? <VocabSentenceStep values={values} setValue={setValue} /> : null}
        {step === 2 ? (
          <StoryboardImagesStep
            storyboard={storyboard}
            generating={storyboardGenerating}
            onRegenerate={generateStoryboard}
          />
        ) : null}
        {step === 3 ? <ConfirmStep values={values} generating={generating} onHang={handleHang} /> : null}
        {errorMessage ? <div className="ppt-c1-tip">{errorMessage}</div> : null}
      </div>
      <div className="ppt-v1-footer">
        {generating || storyboardGenerating ? (
          <>
            <button type="button" className="ppt-v1-primary is-disabled">
              <LocalizedValue value={storyboardGenerating ? '正在生成分镜' : '正在生成视频'} catalog="videoOptionLabels" />
            </button>
          </>
        ) : (
          <>
            <button type="button" className="ppt-v1-secondary" onClick={step === 0 ? onBack : () => setStep((current) => current - 1)}>
              <LocalizedValue value={step === 0 ? '取消' : '上一步'} catalog="videoOptionLabels" />
            </button>
            <button
              type="button"
              className="ppt-v1-primary"
              onClick={() => {
                if (step < 2) setStep((current) => current + 1);
                else if (step === 2 && !storyboard) generateStoryboard();
                else if (step === 2) setStep(3);
                else generateVideo();
              }}
            >
              <LocalizedValue value={step === 2 && !storyboard ? '生成分镜图片' : step === 3 ? '生成视频' : '下一步'} catalog="videoOptionLabels" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function StoryRoleStep({ values, setValue }) {
  return (
    <div className="ppt-vm-body">
      <div className="ppt-vm-section-title"><LocalizedText id="videoWizard.f9c88023e0" /></div>
      <div className="ppt-vm-character-grid">
        {characters.map((character) => (
          <button
            type="button"
            key={character.name}
            className={values.character === character.name ? 'is-active' : ''}
            onClick={() => setValue('character', character.name)}
          >
            <img src={character.image} alt="" />
            <span>{character.name}</span>
            {values.character === character.name ? <b>✓</b> : null}
          </button>
        ))}
      </div>
      <div className="ppt-vm-section-title"><LocalizedText id="videoWizard.f43ebf86b1" /></div>
      <div className="ppt-v1-direction-row">
        {[
          ['16:9', '横版'],
          ['9:16', '竖版'],
        ].map(([ratio, label]) => (
          <button type="button" key={ratio} className={values.direction === ratio ? 'is-active' : ''} onClick={() => setValue('direction', ratio)}>
            <strong>{ratio}</strong>
            <span><LocalizedValue value={label} catalog="videoOptionLabels" /></span>
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
      <div className="ppt-vm-section-title"><LocalizedText id="videoWizard.ca2b33abc8" /></div>
      <div className="ppt-vm-template-list">
        {templates.map(([key, title, desc]) => (
          <button type="button" key={key} className={values.template === key ? 'is-active' : ''} onClick={() => setValue('template', key)}>
            <i>{key === 'shield' ? '♜' : key === 'map' ? '◇' : key === 'cup' ? '♛' : '✤'}</i>
            <span><strong><LocalizedValue value={title} catalog="videoOptionLabels" /></strong><em><LocalizedValue value={desc} catalog="videoOptionLabels" /></em></span>
          </button>
        ))}
      </div>
      <div className="ppt-v1-divider" />
      <div className="ppt-vm-section-title"><LocalizedText id="videoWizard.2321a49fa5" /></div>
      <WordSentenceFields
        values={values}
        setValue={setValue}
        wordTitle="目标动作 / 词汇"
        wordHint=""
        sentenceTitle="目标句型（可选）"
        sentenceHint=""
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
      <div className="ppt-vm-section-title"><LocalizedText id="videoWizard.a125e1e127" /></div>
      <p className="ppt-vm-sub"><LocalizedText id="videoWizard.d675779a66" /></p>
      <div className="ppt-vm-script-list">
        {cards.map(([tag, title, desc, quote, people], index) => (
          <article key={`${title}-${index}`}>
            <div>
              <b className={`tag-${tag}`}><LocalizedValue value={tag} catalog="videoOptionLabels" /></b>
              <strong><LocalizedValue value={title} catalog="videoOptionLabels" /></strong>
              <span>{people}</span>
            </div>
            <em><LocalizedText id="videoWizard.667144be2e" /></em>
            <p><LocalizedValue value={desc} catalog="videoOptionLabels" /></p>
            <blockquote>{quote}<small>{index > 1 ? title.replace('挑战：', '') : ''}</small></blockquote>
          </article>
        ))}
      </div>
      <button type="button" className="ppt-vm-regenerate"><LocalizedText id="videoWizard.9a9ac408f7" /></button>
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
      <div className="ppt-vm-section-title"><LocalizedText id="videoWizard.186baf641d" /></div>
      <p className="ppt-vm-sub"><LocalizedText id="videoWizard.5ee2db8ec3" /></p>
      <div className="ppt-vm-frame-grid">
        {storyFrames.map((frame, index) => (
          <button type="button" key={frame.title} onClick={() => openFrame(index)}>
            <span className="ppt-v1-scene-art" />
            <b><LocalizedText id="videoWizard.63917a8d49" />{index + 1}</b>
            <i>P</i><i>E</i>
            <strong><LocalizedValue value={frame.title} catalog="videoOptionLabels" /></strong>
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
      <div className="ppt-vm-section-title"><LocalizedText id="videoWizard.a5bd70de60" /></div>
      <div className="ppt-vm-pref-card">
        <div>
          <span><LocalizedText id="videoWizard.2b02889700" /></span>
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
                <LocalizedValue value={label} catalog="videoOptionLabels" />
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
            <LocalizedValue value={values.bgm ? '自动匹配' : '已关闭'} catalog="videoOptionLabels" />
          </button>
        </div>
        <button type="button" className="ppt-vm-pref-switch-row" onClick={() => setValue('sfx', !values.sfx)}>
          <span><LocalizedText id="videoWizard.505e64c2a0" /></span>
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
          <strong><LocalizedText id="videoWizard.63917a8d49" /> {activeFrame + 1} · <LocalizedValue value={frame.title} catalog="videoOptionLabels" /></strong>
          <div>
            <button type="button" onClick={() => onResetFrame(activeFrame)}><LocalizedText id="videoWizard.fc8156bb16" /></button>
            <button type="button" className="ppt-vm-modal-close" onClick={onClose} aria-label={i18next.t('videoWizard.6c14bd7f6f')}><X size={16} /></button>
          </div>
        </div>
        <div className="ppt-vm-modal-content">
          <div className="ppt-vm-modal-label">
            <LocalizedText id="videoWizard.ea93972364" /> <span><LocalizedText id="videoWizard.f4c828595d" /></span>
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
            <span><LocalizedText id="videoWizard.9e5d7e2f76" /></span>
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
            <p><LocalizedValue value={frame.desc} catalog="videoOptionLabels" /></p>
            <div>
              {frame.tags.map((tag) => <span key={tag}><LocalizedValue value={tag} catalog="videoOptionLabels" /></span>)}
            </div>
          </div>
          <div className="ppt-vm-modal-label"><LocalizedText id="videoWizard.9b115e4f91" /></div>
          <div className="ppt-vm-modal-nav">
            {storyFrames.map((item, index) => (
              <button
                type="button"
                key={item.title}
                className={index === activeFrame ? 'is-active' : ''}
                onClick={() => onFrameChange(index)}
              >
                <span className="ppt-v1-scene-art" />
                <b><LocalizedText id="videoWizard.63917a8d49" />{index + 1}</b>
                <strong><LocalizedValue value={item.title} catalog="videoOptionLabels" /></strong>
              </button>
            ))}
          </div>
        </div>
        <div className="ppt-vm-modal-foot">
          <button type="button" onClick={() => goFrame(-1)} disabled={activeFrame === 0}><LocalizedText id="videoWizard.2d7f0cab98" /></button>
          <button type="button" onClick={() => (activeFrame === storyFrames.length - 1 ? onClose() : goFrame(1))}>
            <LocalizedValue value={activeFrame === storyFrames.length - 1 ? '保存返回' : '下一帧 →'} catalog="videoOptionLabels" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StorySummary({ values }) {
  const templateLabels = {
    shield: '拯救型',
    map: '探险型',
    cup: '竞赛型',
    gear: '解谜型',
  };
  return (
    <div className="ppt-v1-summary-card ppt-vm-summary-card">
      <div><span><LocalizedText id="videoWizard.ca2b33abc8" /></span><strong><LocalizedValue value={templateLabels[values.template] || '拯救型'} catalog="videoOptionLabels" /></strong></div>
      <div><span><LocalizedText id="videoWizard.29d0552d2e" /></span><strong><LocalizedText id="videoWizard.5ebd7f9bb6" /></strong></div>
      <div><span><LocalizedText id="videoWizard.f43ebf86b1" /></span><strong>{values.direction}</strong></div>
      <div><span><LocalizedText id="videoWizard.1851ef4d16" /></span><strong>{values.character}</strong></div>
      <div><span><LocalizedText id="videoWizard.9d48527d26" /></span><strong><LocalizedText id="videoWizard.9da25dd09f" /></strong></div>
      <section>
        <article><span><LocalizedText id="videoWizard.305c991321" /></span><strong>{values.words.length}</strong></article>
        <article><span><LocalizedText id="videoWizard.ede08f1fa0" /></span><strong>{values.sentences.length}</strong></article>
      </section>
    </div>
  );
}

function StoryGenerateStep({ values, generating, onHang }) {
  return (
    <div className="ppt-vm-body">
      <div className="ppt-vm-section-title"><LocalizedText id="videoWizard.b4c82d6033" /></div>
      <StorySummary values={values} />
      <div className="ppt-v1-divider" />
      {generating ? (
        <div className="ppt-v1-progress-card">
          <div className="ppt-v1-progress-hero">
            <span />
            <strong><LocalizedText id="videoWizard.1e15b84cd2" /></strong>
            <em><LocalizedText id="videoWizard.2a35cf292b" /></em>
          </div>
          <div className="ppt-v1-progress-list">
            {storyProgressRows.map((row) => (
              <div key={row.text} className={`is-${row.state}`}>
                <span>{row.state === 'done' ? '✓' : row.state === 'running' ? '○' : '◷'}</span>
                <strong><LocalizedValue value={row.text} catalog="videoOptionLabels" /></strong>
                <em><LocalizedValue value={row.status} catalog="videoOptionLabels" /></em>
              </div>
            ))}
          </div>
          <button type="button" className="ppt-hang-btn ppt-video-hang-btn" onClick={onHang}>
            <Pause size={13} /><LocalizedText id="videoWizard.094559b0f2" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function StoryVideoFlow({ asset, onBack, onClose, onInsert, onTitleChange }) {
  const [step, setStep] = React.useState(0);
  const [storyboardGenerating, setStoryboardGenerating] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [storyboard, setStoryboard] = React.useState(null);
  const [errorMessage, setErrorMessage] = React.useState('');
  const suspendedRef = React.useRef(false);
  const [values, setValues] = React.useState({
    character: 'Poppy',
    direction: '16:9',
    template: 'shield',
    words: ['Dennis', 'James', 'Ricky'],
    sentences: ['Jump high!', 'Run to the gate!'],
    narrationLanguage: 'english',
    bgm: true,
    sfx: false,
  });
  const setValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setStoryboard(null);
  };

  React.useEffect(() => {
    onTitleChange?.(step === 0 ? i18next.t('videoWizard.editVideoAsset') : asset.title);
  }, [asset.title, onTitleChange, step]);

  const generateStoryboard = async () => {
    setStoryboardGenerating(true);
    setErrorMessage('');
    try {
      const generatedStoryboard = await generateStoryboardAsset(asset, values);
      setStoryboard(generatedStoryboard);
    } catch (error) {
      setErrorMessage(error.message || i18next.t('videoOptionLabels.分镜图片生成失败'));
    } finally {
      setStoryboardGenerating(false);
    }
  };

  const generateVideo = async () => {
    if (!storyboard) {
      setErrorMessage(i18next.t('videoOptionLabels.请先生成分镜图片'));
      setStep(2);
      return;
    }
    suspendedRef.current = false;
    setGenerating(true);
    setErrorMessage('');
    try {
      const generated = await composeStoryboardVideo(asset, storyboard);
      if (!suspendedRef.current) {
        onInsert('video', { ...asset, ...generated, title: generated?.title || asset.title });
      }
    } catch (error) {
      setErrorMessage(error.message || i18next.t('videoOptionLabels.视频生成任务提交失败'));
      setGenerating(false);
    }
  };

  const handleHang = () => {
    suspendedRef.current = true;
    onClose?.();
  };

  return (
    <div className="ppt-video-flow">
      <div className="ppt-video-flow-body">
        <StoryStepper step={step} />
        {step === 0 ? <StoryRoleStep values={values} setValue={setValue} /> : null}
        {step === 1 ? <StoryNarrativeStep values={values} setValue={setValue} /> : null}
        {step === 2 ? (
          <StoryboardImagesStep
            storyboard={storyboard}
            generating={storyboardGenerating}
            onRegenerate={generateStoryboard}
          />
        ) : null}
        {step === 3 ? <StoryGenerateStep values={values} generating={generating} onHang={handleHang} /> : null}
        {errorMessage ? <div className="ppt-c1-tip">{errorMessage}</div> : null}
      </div>
      <div className="ppt-v1-footer">
        {generating || storyboardGenerating ? (
          <>
            <button type="button" className="ppt-v1-primary is-disabled">
              <LocalizedValue value={storyboardGenerating ? '正在生成分镜' : '正在生成视频'} catalog="videoOptionLabels" />
            </button>
          </>
        ) : (
          <>
            <button type="button" className="ppt-v1-secondary" onClick={step === 0 ? onBack : () => setStep((current) => current - 1)}>
              <LocalizedValue value={step === 0 ? '取消' : '上一步'} catalog="videoOptionLabels" />
            </button>
            <button
              type="button"
              className="ppt-v1-primary"
              onClick={() => {
                if (step < 2) setStep((current) => current + 1);
                else if (step === 2 && !storyboard) generateStoryboard();
                else if (step === 2) setStep(3);
                else generateVideo();
              }}
            >
              <LocalizedValue value={step === 2 && !storyboard ? '生成分镜图片' : step === 3 ? '生成视频' : '下一步'} catalog="videoOptionLabels" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
