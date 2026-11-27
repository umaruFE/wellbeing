import { ContentTabPanel, ContentTabs, MetadataTag } from '../components/LibraryControls';
import React, { useEffect, useState } from 'react';
import i18next from 'i18next';
import { LocalizedValue } from '../i18n/LocalizedText.jsx';
import { useTranslation } from 'react-i18next';
import { PageLoading } from '../components/PageLoading';
import { parseJsonSafely, responseErrorMessage } from '../utils/responseUtils';
import { Button, Progress, message } from 'antd';
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
import { resolvePptMediaUrl } from './course-workflow/ppt/pptMediaUrl';

const TaskIcon = ({ type, ...props }) => {
  if (type === 'video') return <Video {...props} />;
  if (type === 'audio') return <Music {...props} />;
  return <ImageIcon {...props} />;
};

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

const getIconBgColor = (type) => {
  switch (type) {
    case 'image': return { bg: '#39724f', border: '#39724f' };
    case 'video': return { bg: 'var(--wb-primary)', border: 'var(--wb-primary-hover)' };
    case 'audio': return { bg: 'var(--wb-primary)', border: 'var(--wb-primary-hover)' };
    default: return { bg: '#39724f', border: '#39724f' };
  }
};

const statusConfigMap = {
  queued: {
    label: '等待中',
    tone: 'draft',
    icon: <Clock size={12} />,
  },
  running: {
    label: '进行中',
    tone: 'processing',
    icon: <Loader2 size={12} className="animate-spin" />,
  },
  succeeded: {
    label: '已完成',
    tone: 'ready',
    icon: <CheckCircle size={12} />,
  },
  failed: {
    label: '失败',
    tone: 'failed',
    icon: <Clock size={12} />,
  },
  cancelled: {
    label: '已取消',
    tone: 'neutral',
    icon: <Clock size={12} />,
  },
  processing: {
    label: '进行中',
    tone: 'processing',
    icon: <Loader2 size={12} className="animate-spin" />,
  },
  waiting: {
    label: '等待中',
    tone: 'draft',
    icon: <Clock size={12} />,
  },
  done: {
    label: '已完成',
    tone: 'ready',
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
    return new Date(value).toLocaleString(i18next.language?.startsWith('zh') ? 'zh-CN' : 'en-US', {
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

const findTaskMediaUrl = (value, depth = 0) => {
  if (!value || depth > 6) return '';
  if (typeof value === 'string') {
    return /^(https?:\/\/|\/api\/|\/upload\/)/.test(value) ? value : '';
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = findTaskMediaUrl(item, depth + 1);
      if (url) return url;
    }
    return '';
  }
  if (typeof value === 'object') {
    for (const key of ['thumbnailUrl', 'thumbnail_url', 'url', 'imageUrl', 'image_url', 'videoUrl', 'video_url', 'audioUrl', 'audio_url']) {
      const url = findTaskMediaUrl(value[key], depth + 1);
      if (url) return url;
    }
    for (const item of Object.values(value)) {
      const url = findTaskMediaUrl(item, depth + 1);
      if (url) return url;
    }
  }
  return '';
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
    mediaUrl: findTaskMediaUrl(task.result),
    showInsert: task.status === 'succeeded',
  };
};

const createDetailFromTask = (task, t) => {
  const raw = task.raw || task;
  const input = raw.input || {};
  return {
    type: raw.type || task.type || 'image',
    title: raw.title || task.title || 'AI 生成任务',
    count: t(raw.type === 'video' ? 'taskCenter.countVideo' : raw.type === 'audio' ? 'taskCenter.countAudio' : 'taskCenter.countImage', { count: raw.count || task.count || 1 }),
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
    <MetadataTag tone={config.tone}>
      {config.icon}
      <span><LocalizedValue value={config.label} catalog="taskCenterValues" /></span>
    </MetadataTag>
  );
};

const handleAccessibleCardKey = (event, onOpen) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onOpen();
  }
};

const HistoryTaskItem = ({ task, onOpenDetail, onInsertTaskAsset, onRetryTask }) => {
  const { t } = useTranslation();
  const iconColors = getIconBgColor(task.type);

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
            className={`history-task-icon ${task.mediaUrl ? 'has-thumbnail' : ''}`}
            style={{
              backgroundColor: iconColors.bg,
              borderColor: iconColors.border,
            }}
          >
            {task.mediaUrl && task.type === 'image' ? (
              <img src={resolvePptMediaUrl(task.mediaUrl)} alt="" />
            ) : task.mediaUrl && task.type === 'video' ? (
              <video src={resolvePptMediaUrl(task.mediaUrl)} muted preload="metadata" />
            ) : (
              <TaskIcon type={task.type} size={20} style={{ color: '#ffffff' }} />
            )}
          </div>
          <div className="history-task-detail">
            <div className="history-task-title-row">
              <span className="history-task-title"><LocalizedValue value={task.title} catalog="taskCenterValues" /></span>
              <MetadataTag>x <LocalizedValue value={task.count} catalog="taskCenterValues" /></MetadataTag>
            </div>
            <span className="history-task-related">{t('taskCenter.related')}: <LocalizedValue value={task.related} catalog="taskCenterValues" /></span>
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
              onInsertTaskAsset?.(createCanvasAssetPayload(createDetailFromTask(task, t)));
            }}
          >
            <CirclePlus size={14} />
            <span>{t('taskCenter.insert')}</span>
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
            {t('common.regenerate')}
          </Button>
        )}
      </div>
    </div>
  );
};

const QueueTaskItem = ({ task, onOpenDetail, onInsertTaskAsset, onCancelTask }) => {
  const { t } = useTranslation();

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
            <TaskIcon type={task.type} size={20} />
          </div>
          <div className="task-item-detail">
            <div className="task-item-title-row">
              <span className="task-item-title"><LocalizedValue value={task.title} catalog="taskCenterValues" /></span>
              <div className="task-item-count">
                <span className="task-item-count-text">x <LocalizedValue value={task.count} catalog="taskCenterValues" /></span>
              </div>
            </div>
            <span className="task-item-related">{t('taskCenter.related')}: <LocalizedValue value={task.related} catalog="taskCenterValues" /></span>
          </div>
        </div>
        <TaskStatusTag status={task.status} />
      </div>

      {task.progress !== undefined && (
        <div className="task-progress">
          <div className="task-progress-row">
            <span className="task-progress-text"><LocalizedValue value={task.progressText} catalog="taskCenterValues" /></span>
            <span className="task-progress-text">{task.progress}%</span>
          </div>
          <Progress
            percent={task.progress}
            strokeColor="var(--wb-primary)"
            strokeWidth={4}
            showInfo={false}
          />
        </div>
      )}

      <div className="task-footer">
        <div className="task-status-text">
          <Clock size={14} />
          <span className="task-status-text-content"><LocalizedValue value={task.statusText} catalog="taskCenterValues" /></span>
        </div>

        {task.showInsert && (
          <Button
            className="task-insert-btn"
            onClick={(event) => {
              event.stopPropagation();
              onInsertTaskAsset?.(createCanvasAssetPayload(createDetailFromTask(task, t)));
            }}
          >
            <CirclePlus size={14} />
            <span>{t('taskCenter.insert')}</span>
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
            {t('common.cancel')}
          </Button>
        )}
      </div>
    </div>
  );
};

export const TaskCenter = ({ onClose, onInsertTaskAsset }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('queue');
  const tabGroup = React.useId();
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [queueTasks, setQueueTasks] = useState(null);
  const [historyTasks, setHistoryTasks] = useState(null);
  const [loadErrors, setLoadErrors] = useState({});

  const loadTasks = React.useCallback(async (scope) => {
    const setTasks = scope === 'history' ? setHistoryTasks : setQueueTasks;
    try {
      const response = await fetch(`/api/background-tasks?scope=${scope === 'history' ? 'history' : 'active'}`, {
        headers: getAuthHeaders(),
      });
      const result = await parseJsonSafely(response);

      if (!response.ok || !result?.success) {
        throw new Error(responseErrorMessage(response, result, i18next.t('taskCenterValues.后台任务获取失败')));
      }

      const tasks = (result.data?.tasks || []).map(normalizeTask);
      setTasks(tasks);
      setLoadErrors(current => current[scope] ? { ...current, [scope]: '' } : current);
    } catch (error) {
      setLoadErrors(current => ({ ...current, [scope]: error?.message || t('taskCenterValues.后台任务获取失败') }));
    }
  }, [t]);

  useEffect(() => {
    let disposed = false;
    const refreshAllTasks = async () => {
      await loadTasks('queue');
      if (!disposed) await loadTasks('history');
    };
    refreshAllTasks();
    const timer = window.setInterval(refreshAllTasks, 5000);
    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [loadTasks]);

  const currentTasks = activeTab === 'queue' ? queueTasks : historyTasks;

  const openTaskDetail = (task) => {
    setSelectedTask(createDetailFromTask(task, t));
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
        throw new Error(result.error || t('taskCenter.cancelFailed'));
      }
      message.success(t('taskCenter.cancelled'));
      loadTasks('queue');
    } catch (error) {
      message.error(error?.message || t('taskCenter.cancelFailed'));
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
        throw new Error(result.error || t('taskCenter.retryFailed'));
      }
      message.success(t('taskCenter.retried'));
      setActiveTab('queue');
      loadTasks('queue');
    } catch (error) {
      message.error(error?.message || t('taskCenter.retryFailed'));
    }
  };

  return (
    <div className="task-center-container">
      <div className="task-center-header">
        <h2 className="task-center-title">{t('taskCenter.title')}</h2>
        <button type="button" data-wb-button="quiet" data-wb-size="sm" data-wb-icon aria-label={t('common.close')} onClick={onClose}>
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <ContentTabs
        group={tabGroup} label={t('taskCenter.title')} className="task-center-tabs"
        value={activeTab} onChange={setActiveTab}
        items={[
          { value: 'queue', label: t('taskCenter.queue'), count: queueTasks?.length ?? '—' },
          { value: 'history', label: t('taskCenter.history'), count: historyTasks?.length ?? '—' },
        ]}
      />
      <ContentTabPanel key={activeTab} group={tabGroup} value={activeTab} className="task-center-content" aria-busy={currentTasks === null && !loadErrors[activeTab]}>
        {loadErrors[activeTab] && (
          <div role="alert" className="wb-library-empty">
            <p>{loadErrors[activeTab]}</p>
            <button type="button" data-wb-button="secondary" onClick={() => loadTasks(activeTab)}>{t('common.retry')}</button>
          </div>
        )}
        {currentTasks === null && !loadErrors[activeTab] && <PageLoading />}
        {currentTasks?.length === 0 && !loadErrors[activeTab] && <div className="task-center-empty" role="status">{t('taskCenter.empty')}</div>}
        {currentTasks?.map(task => activeTab === 'queue'
          ? <QueueTaskItem key={task.id} task={task} onOpenDetail={openTaskDetail} onInsertTaskAsset={onInsertTaskAsset} onCancelTask={cancelTask} />
          : <HistoryTaskItem key={task.id} task={task} onOpenDetail={openTaskDetail} onInsertTaskAsset={onInsertTaskAsset} onRetryTask={retryTask} />
        )}
      </ContentTabPanel>

      <TaskDetailModal task={selectedTask} open={detailOpen} onClose={closeTaskDetail} onInsertTaskAsset={onInsertTaskAsset} />
    </div>
  );
};
