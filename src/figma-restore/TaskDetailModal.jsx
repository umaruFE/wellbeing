import React, { useEffect } from 'react';
import { Button } from 'antd';
import {
  CirclePlus,
  Image as ImageIcon,
  Music,
  Play,
  RotateCcw,
  Video,
  X,
} from 'lucide-react';
import './TaskCenter.css';

const getIcon = (type) => {
  switch (type) {
    case 'image': return ImageIcon;
    case 'video': return Video;
    case 'audio': return Music;
    default: return ImageIcon;
  }
};

const sceneLabels = {
  rocket: '太空场景',
  kitchen: '厨房任务',
  beach: '海边救援',
  stage: '舞台展示',
  camp: '营地探索',
  classroom: '教室互动',
  teacher: '老师立绘',
  teacherAlt: '引导动作',
  teacherPose: '讲解姿势',
  teacherSmile: '微笑表情',
};

export const createCanvasAssetPayload = (task) => {
  const type = task.type === 'video' ? 'video' : task.type === 'audio' ? 'audio' : 'image';
  const common = {
    title: task.title,
    prompt: task.prompt,
    url: task.result?.url,
    src: task.result?.url,
  };

  if (type === 'video') {
    return {
      type,
      patch: {
        ...common,
        width: 360,
        height: 216,
        duration: task.title.includes('体能') ? '02:55' : '00:35',
        videoMeta: {
          videoType: task.title.includes('口语对话') ? '情境叙事视频' : '体能闯关视频',
          scene: task.title.includes('口语对话') ? '校门口 / 英语问候' : '森林 / 动物园任务',
          chars: task.title.includes('口语对话') ? '学生角色 x2' : 'Poppy',
          vocab: task.title.includes('口语对话') ? 2 : 3,
          sents: task.title.includes('口语对话') ? 3 : 2,
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
        duration: task.title.includes('跟读') ? '00:08' : '00:30',
      },
    };
  }

  return {
    type,
    patch: {
      ...common,
      width: task.title.includes('角色立绘') ? 220 : task.title.includes('场景插图') ? 320 : 360,
      height: task.title.includes('角色立绘') ? 220 : task.title.includes('场景插图') ? 240 : 203,
    },
  };
};

const withoutCountPrefix = (count) => count.replace('x ', '');

const getTaskMaterialConfig = (task) => {
  const base = {
    group: '图文素材',
    subtype: '主题意境图',
    sections: [
      {
        title: '基础设置',
        items: [
          ['生成用途', 'PPT 背景 / 课程封面'],
          ['画面比例', task.title.includes('场景') ? '4:3' : '16:9 landscape'],
          ['视觉风格', '卡通插画'],
          ['文字叠加', '无文字'],
        ],
      },
      {
        title: '内容输入',
        items: [
          ['场景描述', task.prompt],
          ['参考图片', '未上传'],
          ['输出数量', withoutCountPrefix(task.count)],
          ['结果形式', task.status === 'done' ? '可插入画布' : '生成完成后可插入'],
        ],
      },
    ],
  };

  if (task.type === 'video') {
    const isDialogue = task.title.includes('口语对话');
    return {
      group: '视频素材',
      subtype: isDialogue ? '情境叙事视频' : '体能闯关视频',
      sections: isDialogue ? [
        {
          title: '叙事设置',
          items: [
            ['视频模板', '对话练习 · 校园场景'],
            ['世界观/场景', '校门口 / 英语问候'],
            ['角色设置', '学生角色 x2'],
            ['视频方向', '横版 16:9'],
          ],
        },
        {
          title: '语言与输出',
          items: [
            ['核心句型', 'Hello / How are you?'],
            ['字幕', '开启英文字幕'],
            ['旁白', '儿童友好语速'],
            ['预计时长', '35 秒'],
          ],
        },
      ] : [
        {
          title: '闯关设置',
          items: [
            ['视频类型', '体能闯关'],
            ['场景', '森林 / 动物园任务'],
            ['IP 角色', 'Poppy'],
            ['视频方向', '横版 16:9'],
          ],
        },
        {
          title: '语言与动效',
          items: [
            ['词汇数量', '3 个'],
            ['句型数量', '2 个'],
            ['单词气泡样式', '胶囊'],
            ['预计时长', '约 2 分 30 秒'],
          ],
        },
        {
          title: '播放设置',
          items: [
            ['背景音乐', '开启'],
            ['英文旁白', '开启'],
            ['单词发音音效', '开启'],
            ['循环播放', '关闭'],
          ],
        },
      ],
    };
  }

  if (task.type === 'audio') {
    const isReading = task.title.includes('跟读');
    return {
      group: '音频素材',
      subtype: isReading ? '跟读朗读' : '情绪氛围BGM',
      sections: isReading ? [
        {
          title: '朗读设置',
          items: [
            ['音频类型', '跟读朗读'],
            ['朗读文本', 'sad / happy / lonely / bored'],
            ['声音', '女声'],
            ['语速', '正常偏慢'],
          ],
        },
        {
          title: '输出设置',
          items: [
            ['切分方式', '逐条生成'],
            ['停顿间隔', '保留跟读停顿'],
            ['输出数量', withoutCountPrefix(task.count)],
            ['格式', 'MP3'],
          ],
        },
      ] : [
        {
          title: '音乐设置',
          items: [
            ['音频类型', '情绪氛围BGM'],
            ['情绪氛围', '神秘 / 温柔'],
            ['音乐用途', '故事开场与任务过渡'],
            ['时长', '30 秒循环'],
          ],
        },
        {
          title: '输出设置',
          items: [
            ['人声', '无'],
            ['版本', '纯器乐'],
            ['输出数量', withoutCountPrefix(task.count)],
            ['格式', 'MP3'],
          ],
        },
      ],
    };
  }

  if (task.title.includes('场景插图')) {
    base.subtype = '故事背景/内容配图';
    base.sections[0].items = [
      ['生成用途', '阅读材料 / PPT 场景图'],
      ['画面比例', '4:3'],
      ['视觉风格', '卡通插画'],
      ['文字留白', '保留上方留白'],
    ];
  }

  if (task.title.includes('角色立绘')) {
    base.subtype = '角色立绘（拓展素材）';
    base.sections[0].items = [
      ['生成用途', '角色引导 / 页面装饰'],
      ['画面比例', '1:1'],
      ['背景', '透明背景 PNG'],
      ['角色姿态', '微笑挥手'],
    ];
  }

  return base;
};

const getCompactConfigRows = (task) => {
  const rows = [];
  getTaskMaterialConfig(task).sections.forEach((section) => {
    section.items.forEach((item) => {
      if (rows.length < 4) rows.push(item);
    });
  });
  return rows;
};

const ImagePreview = ({ task }) => (
  <div className="tdm-panel">
    <div className="tdm-panel-title"><span className="tdm-dot" />图片候选</div>
    <div className="tdm-preview-grid">
      {(task.scenes || []).map((scene, index) => (
        <button className="tdm-preview-card" type="button" key={`${scene}-${index}`}>
          <div className={`tdm-scene tdm-scene-${scene}`} data-label={sceneLabels[scene] || '生成预览'} />
          <span className="tdm-preview-label">候选 {index + 1}</span>
        </button>
      ))}
    </div>
  </div>
);

const VideoPreview = ({ task }) => (
  <div className="tdm-panel">
    <div className="tdm-panel-title"><span className="tdm-dot" />视频预览</div>
    <div className={`tdm-video-hero tdm-scene-${task.hero || 'classroom'}`}>
      <div className="tdm-play-big"><Play size={28} fill="currentColor" /></div>
      <div className="tdm-duration-badge">00:35</div>
    </div>
    <div className="tdm-storyboard">
      {(task.shots || []).map((shot, index) => (
        <div className="tdm-shot" key={shot}>
          <strong>{index + 1}. {shot}</strong>
          <span>{index === 0 ? '建立课堂情境与观看期待' : index === 1 ? '呈现核心动作与语言输入' : '保留学生模仿和回应节奏'}</span>
        </div>
      ))}
    </div>
  </div>
);

const AudioPreview = ({ task }) => (
  <div className="tdm-panel">
    <div className="tdm-panel-title"><span className="tdm-dot" />音频列表</div>
    <div className="tdm-audio-stack">
      {(task.tracks || []).map((track, index) => (
        <div className="tdm-audio-track" key={track}>
          <div className={`tdm-audio-thumb wave-${index + 1}`}><div className="tdm-waveform" /></div>
          <div className="tdm-audio-copy">
            <div className="tdm-audio-name">{track}</div>
            <div className="tdm-audio-desc">00:{index === 0 ? '30' : index === 1 ? '24' : '18'} · MP3 · 可循环</div>
          </div>
          <Button className="tdm-small-btn" onClick={(event) => event.stopPropagation()}>试听</Button>
        </div>
      ))}
    </div>
  </div>
);

const TaskPreview = ({ task }) => {
  if (task.type === 'video') return <VideoPreview task={task} />;
  if (task.type === 'audio') return <AudioPreview task={task} />;
  return <ImagePreview task={task} />;
};

export const TaskDetailModal = ({ task, open, onClose, onInsertTaskAsset }) => {
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
  const progressText = task.status === 'done' ? '生成完成' : (task.status === 'waiting' ? '等待 GPU 分配' : 'AI 引擎正在生成中');
  const compactConfigRows = getCompactConfigRows(task);

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
            <div className="tdm-sub">关联：{task.course}</div>
          </div>
          <button className="tdm-close" type="button" onClick={onClose} aria-label="关闭">
            <X size={20} />
          </button>
        </div>

        <div className="tdm-body">
          <div className="tdm-main-grid">
            <TaskPreview task={task} />

            <aside className="tdm-compact-panel">
              <section className="tdm-info-section">
                <div className="tdm-section-title">任务信息</div>
                <div className="tdm-info-list">
                  <div className="tdm-info-row"><label>生成类型</label><span>{task.engine}</span></div>
                  <div className="tdm-info-row"><label>提交时间</label><span>{task.submit}</span></div>
                </div>
                <div className="tdm-progress">
                  <div className="tdm-progress-row"><span>{progressText}</span><span>{task.progress}%</span></div>
                  <div className="tdm-progress-track"><div className="tdm-progress-fill" style={{ width: `${task.progress}%` }} /></div>
                </div>
              </section>

              <section className="tdm-info-section">
                <div className="tdm-section-title">生成配置</div>
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
                <div className="tdm-section-title">生成提示词</div>
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
                    插入画布
                  </Button>
                )}
                <Button className="tdm-action-btn">
                  <RotateCcw size={16} />
                  重新生成
                </Button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
};
