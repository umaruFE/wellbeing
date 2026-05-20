import React, { useState } from 'react';
import { Tabs, Tag, Button, Progress } from 'antd';
import { Loader2, Clock, CheckCircle, CirclePlus, X, Image, Video, Music } from 'lucide-react';
import './TaskCenter.css';

const getIcon = (type) => {
  switch (type) {
    case 'image': return Image;
    case 'video': return Video;
    case 'audio': return Music;
    default: return Image;
  }
};

const mockHistoryTasks = [
  {
    id: 1,
    type: 'video',
    title: '口语对话练习视频',
    count: '1 个',
    related: 'Unit 2: Greetings',
    status: 'done',
    time: '2026/04/20 14:30',
  },
  {
    id: 2,
    type: 'image',
    title: '场景插图-教室',
    count: '4 张',
    related: 'Unit 2: Greetings',
    status: 'done',
    time: '2026/04/20 14:30',
  },
  {
    id: 3,
    type: 'audio',
    title: '单词跟读录音',
    count: '10 首',
    related: 'Unit 3: Animals (神奇的动物)',
    status: 'done',
    time: '2026/04/19 09:20',
  },
  {
    id: 4,
    type: 'image',
    title: '角色立绘-老师',
    count: '1 张',
    related: 'Unit 2: Greetings',
    status: 'done',
    time: '2026/04/20 14:30',
  },
  {
    id: 5,
    type: 'audio',
    title: '情绪氛围BGM',
    count: '3 首',
    related: 'Unit 3: Animals (神奇的动物)',
    status: 'done',
    time: '2026/04/18 11:10',
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
  },
  {
    id: 2,
    type: 'video',
    title: '体能闯关视频',
    count: '1 个',
    related: 'Unit 3: Animals (神奇的动物)',
    status: 'waiting',
    statusText: '排队中 #2 · 等待 GPU 分配',
  },
  {
    id: 3,
    type: 'image',
    title: '主题意境图',
    count: '8 张',
    related: 'Unit 3: Animals (神奇的动物)',
    status: 'waiting',
    statusText: '排队中 #2 · 等待 GPU 分配',
  },
  {
    id: 4,
    type: 'video',
    title: '体能闯关视频',
    count: '1 个',
    related: 'Unit 3: Animals (神奇的动物)',
    status: 'waiting',
    statusText: '排队中 #2 · 等待 GPU 分配',
  },
  {
    id: 5,
    type: 'audio',
    title: '情绪氛围BGM',
    count: '3 首',
    related: 'Unit 3: Animals (神奇的动物)',
    status: 'done',
    statusText: '排队中 #2 · 等待 GPU 分配',
    showInsert: true,
  },
];

const getIconBgColor = (type) => {
  switch (type) {
    case 'image': return { bg: '#509f69', border: '#36784d' };
    case 'video': return { bg: '#4482e5', border: '#3062bf' };
    case 'audio': return { bg: '#9966d0', border: '#764bab' };
    default: return { bg: '#509f69', border: '#36784d' };
  }
};

const HistoryTaskItem = ({ task }) => {
  const iconColors = getIconBgColor(task.type);
  const IconComponent = getIcon(task.type);
  
  return (
    <div className="history-task-item">
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
              <Tag 
                className="history-task-count"
                style={{
                  border: '1px solid #333e4e',
                  borderRadius: '100px',
                  backgroundColor: '#fcfbf9',
                  color: '#333e4e',
                  padding: '2px 7px',
                  fontSize: '12px',
                  fontWeight: 500,
                  lineHeight: '20px',
                }}
              >
                x {task.count}
              </Tag>
            </div>
            <span className="history-task-related">关联: {task.related}</span>
          </div>
        </div>
        <Tag
          style={{
            border: '1px solid #509f69',
            borderRadius: '100px',
            backgroundColor: '#ebf7ee',
            color: '#509f69',
            padding: '4px 7px',
            fontSize: '12px',
            fontWeight: 500,
            lineHeight: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <CheckCircle size={12} />
          <span>已完成</span>
        </Tag>
      </div>
      <div className="history-task-footer">
        <div className="history-task-time">
          <Clock size={14} />
          <span className="history-task-time-text">{task.time}</span>
        </div>
        <Button
          className="history-insert-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            border: '2px solid #333e4e',
            borderRadius: '8px',
            boxShadow: '3px 3px 0px 0px #333e4e',
            backgroundColor: '#ffffff',
            padding: '0 15px',
            height: '32px',
            fontWeight: 500,
            fontSize: '14px',
            color: '#333e4e',
          }}
        >
          <CirclePlus size={14} />
          <span>插入画布</span>
        </Button>
      </div>
    </div>
  );
};

const QueueTaskItem = ({ task }) => {
  const IconComponent = getIcon(task.type);
  
  const getStatusConfig = () => {
    switch (task.status) {
      case 'processing':
        return {
          text: '进行中',
          icon: <Loader2 size={12} className="animate-spin" />,
          style: {
            border: '1px solid #4482e5',
            borderRadius: '100px',
            backgroundColor: '#f0f8ff',
            color: '#4482e5',
            padding: '4px 7px',
            fontSize: '12px',
            fontWeight: 500,
            lineHeight: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          },
        };
      case 'waiting':
        return {
          text: '等待中',
          icon: <Clock size={12} />,
          style: {
            border: '1px solid #f5a233',
            borderRadius: '100px',
            backgroundColor: '#fff4e5',
            color: '#f5a233',
            padding: '4px 7px',
            fontSize: '12px',
            fontWeight: 500,
            lineHeight: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          },
        };
      default:
        return {
          text: '等待中',
          icon: <Clock size={12} />,
          style: {
            border: '1px solid #f5a233',
            borderRadius: '100px',
            backgroundColor: '#fff4e5',
            color: '#f5a233',
            padding: '4px 7px',
            fontSize: '12px',
            fontWeight: 500,
            lineHeight: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          },
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="task-item">
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
        <Tag style={statusConfig.style}>
          {statusConfig.icon}
          <span>{statusConfig.text}</span>
        </Tag>
      </div>
      
      {task.progress !== undefined && (
        <div className="task-progress">
          <div className="task-progress-row">
            <span className="task-progress-text">{task.progressText}</span>
            <span className="task-progress-text">{task.progress}%</span>
          </div>
          <Progress 
            percent={task.progress} 
            strokeColor="#ff5252"
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
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              border: '2px solid #333e4e',
              borderRadius: '8px',
              boxShadow: '3px 3px 0px 0px #333e4e',
              backgroundColor: '#ffffff',
              padding: '0 15px',
              height: '32px',
              fontWeight: 500,
              fontSize: '14px',
              color: '#333e4e',
            }}
          >
            <CirclePlus size={14} />
            <span>插入画布</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export const TaskCenter = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('queue');

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
          当前队列 (2)
        </span>
        <span 
          className={`task-center-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          历史记录 (200+)
        </span>
      </div>
      <div className="task-center-content">
        {activeTab === 'queue' ? (
          mockQueueTasks.map(task => (
            <QueueTaskItem key={task.id} task={task} />
          ))
        ) : (
          mockHistoryTasks.map(task => (
            <HistoryTaskItem key={task.id} task={task} />
          ))
        )}
      </div>
    </div>
  );
};