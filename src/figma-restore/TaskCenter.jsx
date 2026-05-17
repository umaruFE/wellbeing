import React, { useState } from 'react';
import { Tabs, Tag, Button, Progress } from 'antd';
import { Loader2, Clock, CheckCircle, CirclePlus } from 'lucide-react';
import './TaskCenter.css';

const iconBasePath = '/assets/adminDashboard/';

const icons = {
  refresh: `${iconBasePath}mp83zqvk-plh92hc.svg`,
  image: `${iconBasePath}mp83qdgb-73acic7.svg`,
  video: `${iconBasePath}mp83qdgb-1yrsh5b.svg`,
  audio: `${iconBasePath}mp83qdgb-5mzsqrc.svg`,
  processing: `${iconBasePath}mp83zqvk-f719d8a.svg`,
  waiting: `${iconBasePath}mp83zqvk-azl5lmg.svg`,
  done: `${iconBasePath}mp83zqvk-f719d8a.svg`,
  clock: `${iconBasePath}mp83zqvk-8qgmjkv.svg`,
  queue: `${iconBasePath}mp83zqvk-8qgmjkv.svg`,
  insert: `${iconBasePath}mp83qdgb-44u4iyo.svg`,
};

const mockTasks = [
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
    statusIcon: icons.clock,
  },
  {
    id: 2,
    type: 'video',
    title: '体能闯关视频',
    count: '1 个',
    related: 'Unit 3: Animals (神奇的动物)',
    status: 'waiting',
    statusText: '排队中 #2 · 等待 GPU 分配',
    statusIcon: icons.queue,
  },
  {
    id: 3,
    type: 'image',
    title: '主题意境图',
    count: '8 张',
    related: 'Unit 3: Animals (神奇的动物)',
    status: 'waiting',
    statusText: '排队中 #2 · 等待 GPU 分配',
    statusIcon: icons.queue,
  },
  {
    id: 4,
    type: 'video',
    title: '体能闯关视频',
    count: '1 个',
    related: 'Unit 3: Animals (神奇的动物)',
    status: 'waiting',
    statusText: '排队中 #2 · 等待 GPU 分配',
    statusIcon: icons.queue,
  },
  {
    id: 5,
    type: 'audio',
    title: '情绪氛围BGM',
    count: '3 首',
    related: 'Unit 3: Animals (神奇的动物)',
    status: 'done',
    statusText: '排队中 #2 · 等待 GPU 分配',
    statusIcon: icons.queue,
    showInsert: true,
  },
];

const TaskItem = ({ task }) => {
  const getIcon = () => {
    switch (task.type) {
      case 'image': return icons.image;
      case 'video': return icons.video;
      case 'audio': return icons.audio;
      default: return icons.image;
    }
  };

  const getIconClass = () => {
    switch (task.type) {
      case 'image': return 'task-item-icon-image';
      case 'video': return 'task-item-icon-video';
      case 'audio': return 'task-item-icon-audio';
      default: return 'task-item-icon-image';
    }
  };

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
      case 'done':
        return {
          text: '已完成',
          icon: <CheckCircle size={12} />,
          style: {
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
          <div className={`task-item-icon ${getIconClass()}`}>
            <img src={getIcon()} style={{ width: 20, height: 20 }} />
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
      
      <div className={task.showInsert ? 'task-item-footer' : 'task-status-text'}>
        <div className="task-status-text">
          <img src={task.statusIcon} className="task-status-icon" />
          <span className="task-status-text-content">{task.statusText}</span>
        </div>
        {task.showInsert && (
          <Button>
            <CirclePlus size={14} />
            <span>插入画布</span>
          </Button>
        )}
      </div>
    </div>
  );
};

export const TaskCenter = () => {
  const [activeTab, setActiveTab] = useState('queue');

  const tabs = [
    {
      key: 'queue',
      label: '当前队列 (2)',
      children: (
        <div className="task-center-content">
          {mockTasks.map(task => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      ),
    },
    {
      key: 'history',
      label: '历史记录 (200+)',
      children: (
        <div className="task-center-content">
          <p style={{ textAlign: 'center', padding: '40px', color: '#818997' }}>历史记录列表</p>
        </div>
      ),
    },
  ];

  return (
    <div className="task-center">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabs}
        style={{ width: '100%' }}
        tabBarStyle={{
          padding: '16px 24px 0',
          borderBottom: '1px solid #e8e3dd',
          margin: 0,
        }}
        activeTabStyle={{
          color: '#f4785e',
          fontWeight: 500,
          borderBottom: '2px solid #f4785e',
        }}
        tabStyle={{
          fontSize: '14px',
          fontWeight: 500,
          lineHeight: '22px',
          color: '#818997',
          marginRight: '32px',
          paddingBottom: '8px',
        }}
      />
    </div>
  );
};