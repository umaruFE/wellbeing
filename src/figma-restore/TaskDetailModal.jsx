import React, { useEffect } from 'react';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  CirclePlus,
  Image as ImageIcon,
  Music,
  RotateCcw,
  Video,
  X,
} from 'lucide-react';
import './TaskCenter.css';
import { resolvePptMediaUrl } from './course-workflow/ppt/pptMediaUrl';

const getIcon = (type) => {
  switch (type) {
    case 'image': return ImageIcon;
    case 'video': return Video;
    case 'audio': return Music;
    default: return ImageIcon;
  }
};

const sceneLabelKeys = {
  rocket: 'taskDetail.sceneRocket',
  kitchen: 'taskDetail.sceneKitchen',
  beach: 'taskDetail.sceneBeach',
  stage: 'taskDetail.sceneStage',
  camp: 'taskDetail.sceneCamp',
  classroom: 'taskDetail.sceneClassroom',
  teacher: 'taskDetail.sceneTeacher',
  teacherAlt: 'taskDetail.sceneTeacherAlt',
  teacherPose: 'taskDetail.sceneTeacherPose',
  teacherSmile: 'taskDetail.sceneTeacherSmile',
};

const findGeneratedMediaUrl = (value, type, depth = 0) => {
  if (!value || depth > 6) return '';
  if (typeof value === 'string') {
    return /^(https?:\/\/|\/api\/|\/upload\/)/.test(value) ? value : '';
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = findGeneratedMediaUrl(item, type, depth + 1);
      if (url) return url;
    }
    return '';
  }
  if (typeof value === 'object') {
    const typeKeys = type === 'video'
      ? ['videoUrl', 'video_url', 'url', 'outputUrl']
      : type === 'audio'
        ? ['audioUrl', 'audio_url', 'url', 'outputUrl']
        : ['imageUrl', 'image_url', 'url', 'outputUrl'];
    for (const key of typeKeys) {
      const url = findGeneratedMediaUrl(value[key], type, depth + 1);
      if (url) return url;
    }
    for (const item of Object.values(value)) {
      const url = findGeneratedMediaUrl(item, type, depth + 1);
      if (url) return url;
    }
  }
  return '';
};

export const createCanvasAssetPayload = (task) => {
  const type = task.type === 'video' ? 'video' : task.type === 'audio' ? 'audio' : 'image';
  const resultUrl = findGeneratedMediaUrl(task.result, type);
  const common = {
    title: task.title,
    prompt: task.prompt,
    url: resultUrl,
    src: resultUrl,
  };

  if (type === 'video') {
    return {
      type,
      patch: {
        ...common,
        width: 360,
        height: 216,
        duration: task.title.includes('体能') || task.title.includes('Fitness') ? '02:55' : '00:35',
        videoMeta: {
          videoType: task.title.includes('口语对话') || task.title.includes('Dialogue') ? '情境叙事视频' : '体能闯关视频',
          scene: task.title.includes('口语对话') || task.title.includes('Dialogue') ? '校门口 / 英语问候' : '森林 / 动物园任务',
          chars: task.title.includes('口语对话') || task.title.includes('Dialogue') ? '学生角色 x2' : 'Poppy',
          vocab: task.title.includes('口语对话') || task.title.includes('Dialogue') ? 2 : 3,
          sents: task.title.includes('口语对话') || task.title.includes('Dialogue') ? 3 : 2,
          autoplay: true,
          loop: false,
          muted: false,
        },
      },
    };
  }

  if (type === 'audio') {
    return {
      type,
      patch: {
        ...common,
        width: 300,
        height: 56,
        duration: task.title.includes('跟读') || task.title.includes('Read') ? '00:08' : '00:30',
      },
    };
  }

  return {
    type,
    patch: {
      ...common,
      width: task.title.includes('角色立绘') || task.title.includes('Character') ? 220 : task.title.includes('场景插图') || task.title.includes('Scene') ? 320 : 360,
      height: task.title.includes('角色立绘') || task.title.includes('Character') ? 220 : task.title.includes('场景插图') || task.title.includes('Scene') ? 240 : 203,
    },
  };
};

const withoutCountPrefix = (count) => String(count || '').replace('x ', '');

const getTaskMaterialConfig = (task, t) => {
  const base = {
    group: t('taskDetail.groupImage'),
    subtype: t('taskDetail.subThemeScene'),
    sections: [
      {
        title: t('taskDetail.secBasic'),
        items: [
          [t('taskDetail.usage'), t('taskDetail.usagePpt')],
          [t('taskDetail.ratio'), task.title.includes('场景') || task.title.includes('Scene') ? '4:3' : '16:9 landscape'],
          [t('taskDetail.visStyle'), t('taskDetail.cartoon')],
          [t('taskDetail.textOverlay'), t('taskDetail.noText')],
        ],
      },
      {
        title: t('taskDetail.secContent'),
        items: [
          [t('taskDetail.sceneDesc'), task.prompt],
          [t('taskDetail.refImage'), t('taskDetail.notUploaded')],
          [t('taskDetail.outputCount'), withoutCountPrefix(task.count)],
          [t('taskDetail.resultForm'), task.status === 'done' ? t('taskDetail.insertable') : t('taskDetail.afterGen')],
        ],
      },
    ],
  };

  if (task.type === 'video') {
    const isDialogue = task.title.includes('口语对话') || task.title.includes('Dialogue');
    return {
      group: t('taskDetail.groupVideo'),
      subtype: isDialogue ? t('taskDetail.subDialogue') : t('taskDetail.subFitness'),
      sections: isDialogue ? [
        {
          title: t('taskDetail.secNarrative'),
          items: [
            [t('taskDetail.vidTemplate'), t('taskDetail.dialoguePractice')],
            [t('taskDetail.worldScene'), t('taskDetail.campusGreeting')],
            [t('taskDetail.charSetup'), t('taskDetail.studentChars')],
            [t('taskDetail.vidDirection'), t('taskDetail.landscape169')],
          ],
        },
        {
          title: t('taskDetail.secLanguage'),
          items: [
            [t('taskDetail.coreSentence'), 'Hello / How are you?'],
            [t('taskDetail.subtitle'), t('taskDetail.enSubtitle')],
            [t('taskDetail.narration'), t('taskDetail.childSpeed')],
            [t('taskDetail.estDuration'), t('taskDetail.duration35')],
          ],
        },
      ] : [
        {
          title: t('taskDetail.secChallenge'),
          items: [
            [t('taskDetail.vidType'), t('taskDetail.fitnessChallenge')],
            [t('taskDetail.sceneDesc'), t('taskDetail.sceneForest')],
            [t('taskDetail.ipChar'), 'Poppy'],
            [t('taskDetail.vidDirection'), t('taskDetail.landscape169')],
          ],
        },
        {
          title: t('taskDetail.secLangFx'),
          items: [
            [t('taskDetail.vocabCount'), '3'],
            [t('taskDetail.sentenceCount'), '2'],
            [t('taskDetail.bubbleStyle'), t('taskDetail.capsule')],
            [t('taskDetail.estDuration'), t('taskDetail.duration230')],
          ],
        },
        {
          title: t('taskDetail.secPlayback'),
          items: [
            [t('taskDetail.bgm'), t('taskDetail.on')],
            [t('taskDetail.enNarration'), t('taskDetail.on')],
            [t('taskDetail.wordSound'), t('taskDetail.on')],
            [t('taskDetail.loopPlay'), t('taskDetail.off')],
          ],
        },
      ],
    };
  }

  if (task.type === 'audio') {
    const isReading = task.title.includes('跟读') || task.title.includes('Read');
    return {
      group: t('taskDetail.groupAudio'),
      subtype: isReading ? t('taskDetail.subReadAlong') : t('taskDetail.subBgm'),
      sections: isReading ? [
        {
          title: t('taskDetail.secRead'),
          items: [
            [t('taskDetail.audioType'), t('taskDetail.subReadAlong')],
            [t('taskDetail.readText'), 'sad / happy / lonely / bored'],
            [t('taskDetail.voice'), t('taskDetail.female')],
            [t('taskDetail.speed'), t('taskDetail.normalSlow')],
          ],
        },
        {
          title: t('taskDetail.secOutput'),
          items: [
            [t('taskDetail.splitMethod'), t('taskDetail.perItem')],
            [t('taskDetail.pause'), t('taskDetail.keepPause')],
            [t('taskDetail.outputCount'), withoutCountPrefix(task.count)],
            [t('taskDetail.format'), 'MP3'],
          ],
        },
      ] : [
        {
          title: t('taskDetail.secMusic'),
          items: [
            [t('taskDetail.audioType'), t('taskDetail.subBgm')],
            [t('taskDetail.mood'), t('taskDetail.mysteriousGentle')],
            [t('taskDetail.musicPurpose'), t('taskDetail.storyTransition')],
            [t('taskDetail.estDuration'), '30s'],
          ],
        },
        {
          title: t('taskDetail.secOutput'),
          items: [
            [t('taskDetail.vocal'), t('taskDetail.none')],
            [t('taskDetail.format'), t('taskDetail.instrumental')],
            [t('taskDetail.outputCount'), withoutCountPrefix(task.count)],
            [t('taskDetail.format'), 'MP3'],
          ],
        },
      ],
    };
  }

  if (task.title.includes('场景插图') || task.title.includes('Scene')) {
    base.subtype = t('taskDetail.subStoryBg');
    base.sections[0].items = [
      [t('taskDetail.usage'), t('taskDetail.usageScene')],
      [t('taskDetail.ratio'), '4:3'],
      [t('taskDetail.visStyle'), t('taskDetail.cartoon')],
      [t('taskDetail.whitespace'), t('taskDetail.keepTop')],
    ];
  }

  if (task.title.includes('角色立绘') || task.title.includes('Character')) {
    base.subtype = t('taskDetail.subCharSprite');
    base.sections[0].items = [
      [t('taskDetail.usage'), t('taskDetail.usageChar')],
      [t('taskDetail.ratio'), '1:1'],
      [t('taskDetail.bg'), t('taskDetail.transparent')],
      [t('taskDetail.charPose'), t('taskDetail.smileWave')],
    ];
  }

  return base;
};

const getCompactConfigRows = (task, t) => {
  const rows = [];
  getTaskMaterialConfig(task, t).sections.forEach((section) => {
    section.items.forEach((item) => {
      if (rows.length < 4) rows.push(item);
    });
  });
  return rows;
};

const ResultPanel = ({ task }) => {
  const url = findGeneratedMediaUrl(task.result, task.type);
  return (
    <div className="tdm-panel">
      <div className="tdm-panel-title"><span className="tdm-dot" />生成结果</div>
      <div className={`tdm-single-result is-${task.type}`}>
        {!url ? (
          <div className="tdm-result-empty">生成资源暂不可用</div>
        ) : task.type === 'video' ? (
          <video src={resolvePptMediaUrl(url)} controls preload="metadata" />
        ) : task.type === 'audio' ? (
          <audio src={resolvePptMediaUrl(url)} controls preload="metadata" />
        ) : (
          <img src={resolvePptMediaUrl(url)} alt={task.title || '生成图片'} />
        )}
      </div>
    </div>
  );
};

const TaskPreview = ({ task, t }) => {
  return <ResultPanel task={task} />;
};

export const TaskDetailModal = ({ task, open, onClose, onInsertTaskAsset }) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!task) return null;

  const IconComponent = getIcon(task.type);
  const progressText = task.status === 'done' ? t('taskDetail.statusDone') : (task.status === 'waiting' ? t('taskDetail.statusWaiting') : t('taskDetail.statusRunning'));
  const compactConfigRows = getCompactConfigRows(task, t);

  return (
    <>
      <div className={`task-detail-backdrop ${open ? 'open' : ''}`} onClick={onClose} />
      <section className={`task-detail-modal ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="tdm-head">
          <div className={`tdm-icon ${task.type}`}>
            <IconComponent size={24} />
          </div>
          <div className="tdm-title-wrap">
            <div className="tdm-title-row">
              <div className="tdm-title">{task.title}</div>
              <span className="tdm-count">{task.count}</span>
              <span className={`tdm-status ${task.status}`}>{task.statusText}</span>
            </div>
            <div className="tdm-sub">{t('taskDetail.related', { name: task.course })}</div>
          </div>
          <button className="tdm-close" type="button" onClick={onClose} aria-label={t('common.close', 'Close')}>
            <X size={20} />
          </button>
        </div>

        <div className="tdm-body">
          <div className="tdm-main-grid">
            <TaskPreview task={task} t={t} />

            <aside className="tdm-compact-panel">
              <section className="tdm-info-section">
                <div className="tdm-section-title">{t('taskDetail.taskInfo')}</div>
                <div className="tdm-info-list">
                  <div className="tdm-info-row"><label>{t('taskDetail.genType')}</label><span>{task.engine}</span></div>
                  <div className="tdm-info-row"><label>{t('taskDetail.submitTime')}</label><span>{task.submit}</span></div>
                </div>
                <div className="tdm-progress">
                  <div className="tdm-progress-row"><span>{progressText}</span><span>{task.progress}%</span></div>
                  <div className="tdm-progress-track"><div className="tdm-progress-fill" style={{ width: `${task.progress}%` }} /></div>
                </div>
              </section>

              <section className="tdm-info-section">
                <div className="tdm-section-title">{t('taskDetail.genConfig')}</div>
                <div className="tdm-info-list">
                  {compactConfigRows.map(([label, value]) => (
                    <div className="tdm-info-row" key={label}>
                      <label>{label}</label>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="tdm-info-section">
                <div className="tdm-section-title">{t('taskDetail.genPrompt')}</div>
                <div className="tdm-prompt">{task.prompt}</div>
              </section>

              <div className="tdm-compact-actions">
                {task.status === 'done' && (
                  <Button
                    className="tdm-action-btn tdm-action-primary"
                    onClick={() => {
                      onInsertTaskAsset?.(createCanvasAssetPayload(task));
                      onClose();
                    }}
                  >
                    <CirclePlus size={16} />
                    {t('taskDetail.insertCanvas')}
                  </Button>
                )}
                <Button className="tdm-action-btn">
                  <RotateCcw size={16} />
                  {t('taskDetail.regenerate')}
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
};
