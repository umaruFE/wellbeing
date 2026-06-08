import React, { useEffect, useMemo, useState } from 'react';
import { Tag, Button, Progress, message } from 'antd';
import {
  CheckCircle,
  CirclePlus,
  Clock,
  Image as ImageIcon,
  Loader2,
  Music,
  Video,
  X,
} from 'lucide-react';
import './TaskCenter.css';
import { TaskDetailModal, createCanvasAssetPayload } from './TaskDetailModal';

const getIcon = (type) => {
  switch (type) {
    case 'image': return ImageIcon;
    case 'video': return Video;
    case 'audio': return Music;
    default: return ImageIcon;
  }
};

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

const mockHistoryTasks = [
  {
    id: 1,
    type: 'video',
    title: '口语对话练习视频',
    count: '1 个',
    related: 'Unit 2: Greetings',
    status: 'done',
    time: '2026/04/20 14:30',
    detailKey: 'videoDone',
  },
  {
    id: 2,
    type: 'image',
    title: '场景插图-教室',
    count: '4 张',
    related: 'Unit 2: Greetings',
    status: 'done',
    time: '2026/04/20 14:30',
    detailKey: 'imageScene',
  },
  {
    id: 3,
    type: 'audio',
    title: '单词跟读录音',
    count: '10 首',
    related: 'Unit 3: Animals (神奇的动物)',
    status: 'done',
    time: '2026/04/19 09:20',
    detailKey: 'audioWord',
  },
  {
    id: 4,
    type: 'image',
    title: '角色立绘-老师',
    count: '1 张',
    related: 'Unit 2: Greetings',
    status: 'done',
    time: '2026/04/20 14:30',
    detailKey: 'imageCharacter',
  },
  {
    id: 5,
    type: 'audio',
    title: '情绪氛围BGM',
    count: '3 首',
    related: 'Unit 3: Animals (神奇的动物)',
    status: 'done',
    time: '2026/04/18 11:10',
    detailKey: 'audioBgm',
  },
];

const mockQueueTasks = [
  {
    id: 1,
    type: 'image',
    title: '主题意境图',
    count: '8 张',
    related: 'Unit 3: Animals (神奇的动物)',
    status: 'processing',
    progress: 65,
    progressText: 'AI 引擎正在生成中...',
    statusText: '预计剩余 1 分钟',
    detailKey: 'imageRunning',
  },
  {
    id: 2,
    type: 'video',
    title: '体能闯关视频',
    count: '1 个',
    related: 'Unit 3: Animals (神奇的动物)',
    status: 'waiting',
    statusText: '排队中 #2 · 等待 GPU 分配',
    detailKey: 'videoWaiting',
  },
  {
    id: 3,
    type: 'image',
    title: '主题意境图',
    count: '8 张',
    related: 'Unit 3: Animals (神奇的动物)',
    status: 'waiting',
    statusText: '排队中 #3 · 等待 GPU 分配',
    detailKey: 'imageQueued',
  },
  {
    id: 4,
    type: 'video',
    title: '体能闯关视频',
    count: '1 个',
    related: 'Unit 3: Animals (神奇的动物)',
    status: 'waiting',
    statusText: '排队中 #4 · 等待 GPU 分配',
    detailKey: 'videoWaiting',
  },
  {
    id: 5,
    type: 'audio',
    title: '情绪氛围BGM',
    count: '3 首',
    related: 'Unit 3: Animals (神奇的动物)',
    status: 'done',
    statusText: '已完成 · 可插入画布',
    showInsert: true,
    detailKey: 'audioBgm',
  },
];

const taskDetailData = {
  imageRunning: {
    type: 'image',
    title: '主题意境图',
    count: 'x 8 张',
    course: 'Unit 3: Animals (神奇的动物)',
    status: 'processing',
    statusText: '进行中',
    submit: '2026/04/20 14:30',
    engine: '图像生成 · 16:9 landscape',
    progress: 65,
    prompt: '神奇动物世界，童趣线条插画，温暖色调，适合小学英语课堂，用于课程主题封面与PPT背景。',
    spec: '8 张候选图 · 16:9 · 1920x1080 · 卡通插画风',
    scenes: ['rocket', 'kitchen', 'beach', 'stage'],
    config: [
      ['生成用途', 'PPT 背景 / 课程封面'],
      ['画面比例', '16:9 landscape'],
      ['图片风格', '卡通插画'],
      ['文字区域', '底部留白'],
    ],
  },
  imageQueued: {
    type: 'image',
    title: '主题意境图',
    count: 'x 8 张',
    course: 'Unit 3: Animals (神奇的动物)',
    status: 'waiting',
    statusText: '等待中',
    submit: '2026/04/20 14:36',
    engine: '图像生成 · 16:9 landscape',
    progress: 0,
    prompt: '动物园救援主题插图，包含友好的动物角色、任务感场景、明亮课堂色彩。',
    spec: '8 张候选图 · 等待 GPU 分配 · 预计 2 分钟后开始',
    scenes: ['beach', 'rocket', 'stage', 'camp'],
    config: [
      ['生成用途', 'PPT 背景 / 课程封面'],
      ['画面比例', '16:9 landscape'],
      ['图片风格', '卡通插画'],
      ['队列位置', '#3'],
    ],
  },
  imageScene: {
    type: 'image',
    title: '场景插图-教室',
    count: 'x 4 张',
    course: 'Unit 2: Greetings',
    status: 'done',
    statusText: '已完成',
    submit: '2026/04/20 14:30',
    engine: '场景插图 · 课堂环境',
    progress: 100,
    prompt: '明亮友好的英语教室，适合问候语练习，包含黑板、书包、晨间阳光与可互动空间。',
    spec: '4 张候选图 · 4:3 · 已同步图片库',
    scenes: ['classroom', 'kitchen', 'stage', 'camp'],
    config: [
      ['场景名称', '教室 Classroom'],
      ['画面比例', '4:3'],
      ['图片风格', '写实摄影'],
      ['输出状态', '已入库'],
    ],
  },
  imageCharacter: {
    type: 'image',
    title: '角色立绘-老师',
    count: 'x 1 张',
    course: 'Unit 2: Greetings',
    status: 'done',
    statusText: '已完成',
    submit: '2026/04/20 14:30',
    engine: '角色立绘 · 透明背景',
    progress: 100,
    prompt: '亲切的英语老师角色，正面站姿，适合课堂问候和引导互动。',
    spec: '1 张 PNG · 透明背景 · 可编辑素材',
    scenes: ['teacher', 'teacherAlt', 'teacherPose', 'teacherSmile'],
    config: [
      ['角色身份', '英语老师'],
      ['输出格式', 'PNG 透明背景'],
      ['图片风格', '卡通插画'],
      ['输出状态', '已入库'],
    ],
  },
  videoWaiting: {
    type: 'video',
    title: '体能闯关视频',
    count: 'x 1 个',
    course: 'Unit 3: Animals (神奇的动物)',
    status: 'waiting',
    statusText: '等待中',
    submit: '2026/04/20 14:38',
    engine: '视频生成 · 动作示范',
    progress: 0,
    prompt: '体能闯关课堂视频，学生跟随动物动作完成跳跃、奔跑与平衡桥挑战。',
    spec: '预计 2 分 55 秒 · 16:9 · 待生成',
    hero: 'gym',
    shots: ['Jump high!', 'Run to the gate!', 'Cross the bridge!'],
    config: [
      ['视频比例', '16:9'],
      ['单词气泡', '胶囊'],
      ['英语旁白', 'AI语音朗读导词'],
      ['队列位置', '#2'],
    ],
  },
  videoDone: {
    type: 'video',
    title: '口语对话练习视频',
    count: 'x 1 个',
    course: 'Unit 2: Greetings',
    status: 'done',
    statusText: '已完成',
    submit: '2026/04/20 14:30',
    engine: '视频生成 · 情景对话',
    progress: 100,
    prompt: '两个学生在教室门口进行 greeting 对话，节奏清晰，适合跟读和角色扮演。',
    spec: '00:35 · 1080p · MP4',
    hero: 'classroom',
    shots: ['Hello, I am Dennis.', 'Nice to meet you!', 'Let us practice together.'],
    config: [
      ['视频比例', '16:9'],
      ['场景', '教室门口'],
      ['字幕样式', '底部双语'],
      ['输出状态', '已入库'],
    ],
  },
  audioBgm: {
    type: 'audio',
    title: '情绪氛围BGM',
    count: 'x 3 首',
    course: 'Unit 3: Animals (神奇的动物)',
    status: 'done',
    statusText: '已完成',
    submit: '2026/04/18 11:10',
    engine: '音频生成 · 情绪氛围 BGM',
    progress: 100,
    prompt: '温暖、轻快、适合儿童课堂故事导入的背景音乐，避免强节拍抢占朗读。',
    spec: '3 首音频 · 每首 30 秒 · MP3',
    tracks: ['Warm adventure BGM', 'Funny animal walk', 'Soft bedtime story'],
    config: [
      ['音乐风格', '活动背景乐'],
      ['用途', '游戏 / 冥想'],
      ['输出格式', 'MP3'],
      ['输出状态', '已入库'],
    ],
  },
  audioWord: {
    type: 'audio',
    title: '单词跟读录音',
    count: 'x 10 首',
    course: 'Unit 3: Animals (神奇的动物)',
    status: 'done',
    statusText: '已完成',
    submit: '2026/04/19 09:20',
    engine: '语音生成 · 跟读音频',
    progress: 100,
    prompt: '儿童友好的英文单词跟读音频，清晰发音，留有重复间隔。',
    spec: '10 首音频 · 每条 5-8 秒 · MP3',
    tracks: ['sad / happy 跟读', 'lonely / bored 跟读', "Let's help them 句型"],
    config: [
      ['音频类型', '跟读朗读'],
      ['配音角色', '儿童友好音色'],
      ['输出格式', 'MP3'],
      ['输出状态', '已入库'],
    ],
  },
};

const getIconBgColor = (type) => {
  switch (type) {
    case 'image': return { bg: '#509f69', border: '#36784d' };
    case 'video': return { bg: '#4482e5', border: '#3062bf' };
    case 'audio': return { bg: '#9966d0', border: '#764bab' };
    default: return { bg: '#509f69', border: '#36784d' };
  }
};

const getDetailForTask = (task) => taskDetailData[task.detailKey] || taskDetailData.imageRunning;

const statusConfigMap = {
  queued: {
    label: '等待中',
    className: 'waiting',
    icon: <Clock size={12} />,
  },
  running: {
    label: '进行中',
    className: 'processing',
    icon: <Loader2 size={12} className="animate-spin" />,
  },
  succeeded: {
    label: '已完成',
    className: 'done',
    icon: <CheckCircle size={12} />,
  },
  failed: {
    label: '失败',
    className: 'failed',
    icon: <Clock size={12} />,
  },
  cancelled: {
    label: '已取消',
    className: 'cancelled',
    icon: <Clock size={12} />,
  },
  processing: {
    label: '进行中',
    className: 'processing',
    icon: <Loader2 size={12} className="animate-spin" />,
  },
  waiting: {
    label: '等待中',
    className: 'waiting',
    icon: <Clock size={12} />,
  },
  done: {
    label: '已完成',
    className: 'done',
    icon: <CheckCircle size={12} />,
  },
};

const taskStatusToUi = (status) => {
  if (status === 'queued') return 'waiting';
  if (status === 'running') return 'processing';
  if (status === 'succeeded') return 'done';
  if (status === 'failed') return 'failed';
  if (status === 'cancelled') return 'cancelled';
  return status || 'waiting';
};

const formatTaskTime = (value) => {
  if (!value) return '--';
  try {
    return new Date(value).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--';
  }
};

const getTaskStatusText = (task) => {
  if (task.status === 'queued') return '排队中 · 等待 GPU 分配';
  if (task.status === 'running') return task.progress >= 80 ? '正在整理生成结果' : 'AI 引擎正在生成中...';
  if (task.status === 'succeeded') return '已完成 · 可插入画布';
  if (task.status === 'failed') return task.error_message || '生成失败';
  if (task.status === 'cancelled') return '已取消';
  return task.status_text || '';
};

const normalizeTask = (task) => {
  const count = task.count || task.input?.count || 1;
  return {
    id: task.id,
    raw: task,
    type: task.type || 'image',
    title: task.title || 'AI 生成任务',
    count: String(count),
    related: task.related || task.input?.course_title || '未关联课程',
    status: taskStatusToUi(task.status),
    rawStatus: task.status,
    progress: task.status === 'queued' ? undefined : Number(task.progress || 0),
    progressText: getTaskStatusText(task),
    statusText: getTaskStatusText(task),
    time: formatTaskTime(task.finished_at || task.created_at),
    showInsert: task.status === 'succeeded',
    detailKey: task.type === 'video' ? 'videoWaiting' : task.type === 'audio' ? 'audioBgm' : 'imageRunning',
  };
};

const createDetailFromTask = (task) => {
  const raw = task.raw || task;
  const input = raw.input || {};
  return {
    type: raw.type || task.type || 'image',
    title: raw.title || task.title || 'AI 生成任务',
    count: `x ${raw.count || task.count || 1} ${raw.type === 'video' ? '个' : raw.type === 'audio' ? '首' : '张'}`,
    course: raw.related || task.related || '未关联课程',
    status: taskStatusToUi(raw.status),
    statusText: statusConfigMap[raw.status]?.label || task.statusText || '等待中',
    submit: formatTaskTime(raw.created_at),
    engine: raw.type === 'video' ? '视频生成 · 后台任务' : raw.type === 'audio' ? '音频生成 · 后台任务' : '图片生成 · 后台任务',
    progress: Number(raw.progress || task.progress || 0),
    prompt: input.prompt || input.storyboard_prompts?.join('\n') || '无提示词',
    spec: raw.type === 'video'
      ? `${input.video_width || 856}x${input.video_height || 480}`
      : `${input.width || 1024}x${input.height || 1024}`,
    scenes: ['rocket', 'kitchen', 'beach', 'stage'],
    hero: 'classroom',
    shots: input.storyboard_prompts || [],
    tracks: [],
    result: raw.result || null,
  };
};

const TaskStatusTag = ({ status }) => {
  const config = statusConfigMap[status] || statusConfigMap.waiting;
  return (
    <Tag className={`task-status-pill ${config.className}`}>
      {config.icon}
      <span>{config.label}</span>
    </Tag>
  );
};

const handleAccessibleCardKey = (event, onOpen) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onOpen();
  }
};

const HistoryTaskItem = ({ task, onOpenDetail, onInsertTaskAsset, onRetryTask }) => {
  const iconColors = getIconBgColor(task.type);
  const IconComponent = getIcon(task.type);

  return (
    <div
      className="history-task-item"
      role="button"
      tabIndex={0}
      onClick={(event) => {
        if (event.target.closest('button')) return;
        onOpenDetail(task);
      }}
      onKeyDown={(event) => handleAccessibleCardKey(event, () => onOpenDetail(task))}
    >
      <div className="history-task-header">
        <div className="history-task-info">
          <div
            className="history-task-icon"
            style={{
              backgroundColor: iconColors.bg,
              borderColor: iconColors.border,
            }}
          >
            <IconComponent size={20} style={{ color: '#ffffff' }} />
          </div>
          <div className="history-task-detail">
            <div className="history-task-title-row">
              <span className="history-task-title">{task.title}</span>
              <Tag className="history-task-count">x {task.count}</Tag>
            </div>
            <span className="history-task-related">关联: {task.related}</span>
          </div>
        </div>
        <TaskStatusTag status={task.status} />
      </div>
      <div className="history-task-footer">
        <div className="history-task-time">
          <Clock size={14} />
          <span className="history-task-time-text">{task.time}</span>
        </div>
        {task.showInsert && (
          <Button
            className="history-insert-btn"
            onClick={(event) => {
              event.stopPropagation();
              onInsertTaskAsset?.(createCanvasAssetPayload(task.raw ? createDetailFromTask(task) : getDetailForTask(task)));
            }}
          >
            <CirclePlus size={14} />
            <span>插入画布</span>
          </Button>
        )}
        {['failed', 'cancelled'].includes(task.rawStatus) && (
          <Button
            className="history-insert-btn"
            onClick={(event) => {
              event.stopPropagation();
              onRetryTask?.(task);
            }}
          >
            重新生成
          </Button>
        )}
      </div>
    </div>
  );
};

const QueueTaskItem = ({ task, onOpenDetail, onInsertTaskAsset, onCancelTask }) => {
  const IconComponent = getIcon(task.type);

  return (
    <div
      className="task-item"
      role="button"
      tabIndex={0}
      onClick={(event) => {
        if (event.target.closest('button')) return;
        onOpenDetail(task);
      }}
      onKeyDown={(event) => handleAccessibleCardKey(event, () => onOpenDetail(task))}
    >
      <div className="task-item-header">
        <div className="task-item-info">
          <div className={`task-item-icon task-item-icon-${task.type}`}>
            <IconComponent size={20} />
          </div>
          <div className="task-item-detail">
            <div className="task-item-title-row">
              <span className="task-item-title">{task.title}</span>
              <div className="task-item-count">
                <span className="task-item-count-text">x {task.count}</span>
              </div>
            </div>
            <span className="task-item-related">关联: {task.related}</span>
          </div>
        </div>
        <TaskStatusTag status={task.status} />
      </div>

      {task.progress !== undefined && (
        <div className="task-progress">
          <div className="task-progress-row">
            <span className="task-progress-text">{task.progressText}</span>
            <span className="task-progress-text">{task.progress}%</span>
          </div>
          <Progress
            percent={task.progress}
            strokeColor="#ff6b5f"
            strokeWidth={4}
            showInfo={false}
          />
        </div>
      )}

      <div className="task-footer">
        <div className="task-status-text">
          <Clock size={14} />
          <span className="task-status-text-content">{task.statusText}</span>
        </div>

        {task.showInsert && (
          <Button
            className="task-insert-btn"
            onClick={(event) => {
              event.stopPropagation();
              onInsertTaskAsset?.(createCanvasAssetPayload(task.raw ? createDetailFromTask(task) : getDetailForTask(task)));
            }}
          >
            <CirclePlus size={14} />
            <span>插入画布</span>
          </Button>
        )}
        {['waiting', 'processing'].includes(task.status) && (
          <Button
            className="task-cancel-btn"
            onClick={(event) => {
              event.stopPropagation();
              onCancelTask?.(task);
            }}
          >
            取消
          </Button>
        )}
      </div>
    </div>
  );
};

export const TaskCenter = ({ onClose, onInsertTaskAsset }) => {
  const [activeTab, setActiveTab] = useState('queue');
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [queueTasks, setQueueTasks] = useState([]);
  const [historyTasks, setHistoryTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadTasks = async (scope = activeTab) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/background-tasks?scope=${scope === 'history' ? 'history' : 'active'}`, {
        headers: getAuthHeaders(),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '后台任务获取失败');
      }

      const tasks = (result.data?.tasks || []).map(normalizeTask);
      if (scope === 'history') {
        setHistoryTasks(tasks);
      } else {
        setQueueTasks(tasks);
      }
    } catch (error) {
      message.error(error?.message || '后台任务获取失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks(activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'queue') return undefined;
    const timer = window.setInterval(() => loadTasks('queue'), 5000);
    return () => window.clearInterval(timer);
  }, [activeTab]);

  const currentTasks = useMemo(
    () => (activeTab === 'queue' ? queueTasks : historyTasks),
    [activeTab, queueTasks, historyTasks],
  );

  const openTaskDetail = (task) => {
    setSelectedTask(task.raw ? createDetailFromTask(task) : getDetailForTask(task));
    setDetailOpen(true);
  };

  const closeTaskDetail = () => {
    setDetailOpen(false);
  };

  const cancelTask = async (task) => {
    try {
      const response = await fetch(`/api/background-tasks/${task.id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'cancel' }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || '取消失败');
      }
      message.success('任务已取消');
      loadTasks('queue');
    } catch (error) {
      message.error(error?.message || '取消失败');
    }
  };

  const retryTask = async (task) => {
    try {
      const response = await fetch(`/api/background-tasks/${task.id}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action: 'retry' }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || '重试失败');
      }
      message.success('任务已重新提交');
      setActiveTab('queue');
      loadTasks('queue');
    } catch (error) {
      message.error(error?.message || '重试失败');
    }
  };

  return (
    <div className="task-center-container">
      <div className="task-center-header">
        <div className="task-center-title">
          <span className="title-text">后台任务</span>
          <div className="title-decoration" />
          <div className="title-dots">
            <span className="dot-large" />
            <span className="dot-small" />
          </div>
        </div>
        <button className="task-center-close" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <div className="task-center-tabs">
        <span
          className={`task-center-tab ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => setActiveTab('queue')}
        >
          当前队列 ({queueTasks.length})
        </span>
        <span
          className={`task-center-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          历史记录 ({historyTasks.length})
        </span>
      </div>
      <div className="task-center-content">
        {loading && currentTasks.length === 0 ? (
          <div className="task-center-empty">正在加载后台任务...</div>
        ) : currentTasks.length === 0 ? (
          <div className="task-center-empty">暂无后台任务</div>
        ) : (
          currentTasks.map(task => (
            activeTab === 'queue'
              ? <QueueTaskItem key={task.id} task={task} onOpenDetail={openTaskDetail} onInsertTaskAsset={onInsertTaskAsset} onCancelTask={cancelTask} />
              : <HistoryTaskItem key={task.id} task={task} onOpenDetail={openTaskDetail} onInsertTaskAsset={onInsertTaskAsset} onRetryTask={retryTask} />
          ))
        )}
      </div>

      <TaskDetailModal task={selectedTask} open={detailOpen} onClose={closeTaskDetail} onInsertTaskAsset={onInsertTaskAsset} />
    </div>
  );
};
