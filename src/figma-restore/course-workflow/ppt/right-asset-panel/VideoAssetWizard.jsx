import React from 'react';
import { Input } from 'antd';
import { Check, Sparkles, X } from 'lucide-react';
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
        throw new Error(status?.error || '视频生成失败');
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
  const videoWidth = isVertical ? 720 : 1280;
  const videoHeight = isVertical ? 1280 : 720;

  const storyboardResult = await videoStoryboardService.callWebhookGenerateImages(
    role,
    direction,
    prompt,
    videoWidth,
    videoHeight,
  );
  const storyboardData = unwrapStoryboardData(storyboardResult);

  if (!storyboardData) {
    throw new Error('分镜生成完成，但未返回 storyboardData');
  }

  const storyboardImages = storyboardData.storyboard_images_filepath;
  const storyboardPrompts = storyboardData.storyboard_prompts;
  if (!Array.isArray(storyboardImages) || storyboardImages.length === 0) {
    throw new Error('分镜生成完成，但未返回分镜图片');
  }
  if (!Array.isArray(storyboardPrompts) || storyboardPrompts.length === 0) {
    throw new Error('分镜生成完成，但未返回视频提示词');
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
    throw new Error('视频合成完成，但未返回视频地址');
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
      <CountHint count={values.words.length} />

      <div className="ppt-v1-required-line"><b>{sentenceTitle.includes('第二关') ? '* ' : ''}{sentenceTitle}</b><span>{sentenceHint ? `（${sentenceHint}）` : ''}</span></div>
      <div className="ppt-v1-sentence-list">
        {values.sentences.map((sentence) => (
          <div key={sentence}><span>⠿</span><strong>{sentence}</strong><button type="button" onClick={() => removeSentence(sentence)} aria-label={`删除 ${sentence}`}><X size={14} /></button></div>
        ))}
      </div>
      <CountHint count={values.sentences.length} />
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
      <div><span>时长</span><strong>按分镜自动计算</strong></div>
      <div><span>视频方向</span><strong>{values.direction}</strong></div>
      <div><span>场景</span><strong>{values.scene}</strong></div>
      <div><span>IP 角色</span><strong>{values.character}</strong></div>
      <section>
        <article><span>词汇数</span><strong>{values.words.length}</strong></article>
        <article><span>句型数</span><strong>{values.sentences.length}</strong></article>
      </section>
    </div>
  );
}

function storyboardPromptText(prompt, index) {
  if (typeof prompt === 'string') return prompt;
  return prompt?.description || prompt?.prompt || `分镜 ${index + 1}`;
}

function StoryboardImagesStep({ storyboard, generating, onRegenerate }) {
  return (
    <div className="ppt-v1-body">
      <div className="ppt-v1-section-title">生成分镜图片</div>
      {generating ? (
        <div className="ppt-v1-progress-card">
          <div className="ppt-v1-progress-hero">
            <span />
            <strong>正在生成分镜图片</strong>
            <em>AI 正在根据角色和提示词编排画面，请稍候...</em>
          </div>
        </div>
      ) : storyboard ? (
        <>
          <p className="ppt-storyboard-tip">
            已生成 {storyboard.images.length} 张分镜图片。确认无误后进入下一步生成视频。
          </p>
          <div className="ppt-storyboard-grid">
            {storyboard.images.map((image, index) => (
              <article key={`${image}-${index}`}>
                <div>
                  {image ? <img src={image} alt={`分镜 ${index + 1}`} /> : <span>暂无图片</span>}
                  <b>分镜 {index + 1}</b>
                </div>
                <p>{storyboardPromptText(storyboard.prompts[index], index)}</p>
                <em>{Number(storyboard.prompts[index]?.duration) || 3} 秒</em>
              </article>
            ))}
          </div>
          <button type="button" className="ppt-storyboard-regenerate" onClick={onRegenerate}>
            ↻ 重新生成分镜图片
          </button>
        </>
      ) : (
        <div className="ppt-storyboard-empty">
          <strong>先生成分镜图片，再生成视频</strong>
          <p>系统会使用当前选择的单个 IP 角色、画面比例和全部选项生成分镜。</p>
        </div>
      )}
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
  const [storyboardGenerating, setStoryboardGenerating] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [storyboard, setStoryboard] = React.useState(null);
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
      setErrorMessage(error.message || '分镜图片生成失败');
    } finally {
      setStoryboardGenerating(false);
    }
  };

  const generateVideo = async () => {
    if (!storyboard) {
      setErrorMessage('请先生成分镜图片');
      setStep(2);
      return;
    }
    setGenerating(true);
    setErrorMessage('');
    try {
      const generated = await composeStoryboardVideo(asset, storyboard);
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
        {step === 2 ? (
          <StoryboardImagesStep
            storyboard={storyboard}
            generating={storyboardGenerating}
            onRegenerate={generateStoryboard}
          />
        ) : null}
        {step === 3 ? <ConfirmStep values={values} generating={generating} /> : null}
        {errorMessage ? <div className="ppt-c1-tip">{errorMessage}</div> : null}
      </div>
      <div className="ppt-v1-footer">
        {generating || storyboardGenerating ? (
          <button type="button" className="ppt-v1-primary is-disabled">
            {storyboardGenerating ? '正在生成分镜' : '正在生成视频'}
          </button>
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
                else if (step === 2 && !storyboard) generateStoryboard();
                else if (step === 2) setStep(3);
                else generateVideo();
              }}
            >
              {step === 2 && !storyboard ? '生成分镜图片' : step === 3 ? '生成视频' : '下一步'}
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
      <div className="ppt-vm-section-title">选择一个 IP 角色（单选）</div>
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
  const templateLabels = {
    shield: '拯救型',
    map: '探险型',
    cup: '竞赛型',
    gear: '解谜型',
  };
  return (
    <div className="ppt-v1-summary-card ppt-vm-summary-card">
      <div><span>叙事模板</span><strong>{templateLabels[values.template] || '拯救型'}</strong></div>
      <div><span>时长</span><strong>按分镜自动计算</strong></div>
      <div><span>视频方向</span><strong>{values.direction}</strong></div>
      <div><span>IP 角色</span><strong>{values.character}</strong></div>
      <div><span>生成方式</span><strong>AI 自动分镜</strong></div>
      <section>
        <article><span>词汇数</span><strong>{values.words.length}</strong></article>
        <article><span>句型数</span><strong>{values.sentences.length}</strong></article>
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
  const [storyboardGenerating, setStoryboardGenerating] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [storyboard, setStoryboard] = React.useState(null);
  const [errorMessage, setErrorMessage] = React.useState('');
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
    onTitleChange?.(step === 0 ? '编辑视频素材' : asset.title);
  }, [asset.title, onTitleChange, step]);

  const generateStoryboard = async () => {
    setStoryboardGenerating(true);
    setErrorMessage('');
    try {
      const generatedStoryboard = await generateStoryboardAsset(asset, values);
      setStoryboard(generatedStoryboard);
    } catch (error) {
      setErrorMessage(error.message || '分镜图片生成失败');
    } finally {
      setStoryboardGenerating(false);
    }
  };

  const generateVideo = async () => {
    if (!storyboard) {
      setErrorMessage('请先生成分镜图片');
      setStep(2);
      return;
    }
    setGenerating(true);
    setErrorMessage('');
    try {
      const generated = await composeStoryboardVideo(asset, storyboard);
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
        {step === 2 ? (
          <StoryboardImagesStep
            storyboard={storyboard}
            generating={storyboardGenerating}
            onRegenerate={generateStoryboard}
          />
        ) : null}
        {step === 3 ? <StoryGenerateStep values={values} generating={generating} /> : null}
        {errorMessage ? <div className="ppt-c1-tip">{errorMessage}</div> : null}
      </div>
      <div className="ppt-v1-footer">
        {generating || storyboardGenerating ? (
          <button type="button" className="ppt-v1-primary is-disabled">
            {storyboardGenerating ? '正在生成分镜' : '正在生成视频'}
          </button>
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
                else if (step === 2 && !storyboard) generateStoryboard();
                else if (step === 2) setStep(3);
                else generateVideo();
              }}
            >
              {step === 2 && !storyboard ? '生成分镜图片' : step === 3 ? '生成视频' : '下一步'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
