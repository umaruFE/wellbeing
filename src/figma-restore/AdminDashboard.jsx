import React, { useState, useMemo } from 'react';
import { Row, Col, Button, Segmented, Tag, Progress } from 'antd';
import { BookOpen, Image, Video, Music, FileText, CheckCircle, ChevronsUpDown } from 'lucide-react';
import './AdminDashboard.css';

const iconBasePath = '/assets/adminDashboard/';

const icons = {
  sparkles: `${iconBasePath}mp83qdgb-1p10wq7.svg`,
  plusOrange: `${iconBasePath}mp83qdgb-44u4iyo.svg`,
  image: `${iconBasePath}mp83qdgb-73acic7.svg`,
  video: `${iconBasePath}mp83qdgb-1yrsh5b.svg`,
  audio: `${iconBasePath}mp83qdgb-5mzsqrc.svg`,
  asset: `${iconBasePath}mp83tzl7-5dcnjsd.svg`,
  sync: `${iconBasePath}mp83tzl7-rbjgzut.svg`,
  zap: `${iconBasePath}mp83tzl7-4p8q9jz.svg`,
  task: `${iconBasePath}mp83wrxv-twpvdou.svg`,
  course: `${iconBasePath}mp83zqvk-fic0t94.svg`,
  imageTab: `${iconBasePath}mp83zqvk-wgd09lf.svg`,
  videoTab: `${iconBasePath}mp83zqvk-607tqq9.svg`,
  audioTab: `${iconBasePath}mp83zqvk-j7e3u9f.svg`,
  sort: `${iconBasePath}mp83zqvk-plh92hc.svg`,
  draft: `${iconBasePath}mp83zqvk-azl5lmg.svg`,
  grade: `${iconBasePath}mp83zqvk-drw1xd7.svg`,
  duration: `${iconBasePath}mp83zqvk-x8ix1m7.svg`,
  students: `${iconBasePath}mp83zqvk-p2tff8j.svg`,
  time: `${iconBasePath}mp83zqvk-8qgmjkv.svg`,
  published: `${iconBasePath}mp83zqvk-f719d8a.svg`,
};

const mockCourses = [
  { id: 1, title: '神奇的动物世界', grade: '7-9岁', duration: '40分钟', students: '9-15人', time: '2026/04/13 10:06:30', status: 'draft', thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20pink%20monster%20in%20hot%20air%20balloon%20over%20desert%20landscape%20cartoon%20style&image_size=landscape_4_3' },
  { id: 2, title: '神奇的动物世界', grade: '7-9岁', duration: '40分钟', students: '9-15人', time: '2026/04/13 10:06:30', status: 'published', thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20monsters%20waiting%20at%20bus%20stop%20in%20rainy%20city%20cartoon%20style&image_size=landscape_4_3' },
  { id: 3, title: '神奇的动物世界', grade: '7-9岁', duration: '40分钟', students: '9-15人', time: '2026/04/13 10:06:30', status: 'draft', thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20monsters%20having%20picnic%20on%20beach%20tropical%20cartoon%20style&image_size=landscape_4_3' },
  { id: 4, title: '神奇的动物世界', grade: '7-9岁', duration: '40分钟', students: '9-15人', time: '2026/04/13 10:06:30', status: 'draft', thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20monsters%20on%20stage%20with%20spotlight%20performing%20cartoon%20style&image_size=landscape_4_3' },
  { id: 5, title: '神奇的动物世界', grade: '7-9岁', duration: '40分钟', students: '9-15人', time: '2026/04/13 10:06:30', status: 'draft', thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20monsters%20cooking%20in%20kitchen%20cartoon%20style&image_size=landscape_4_3' },
  { id: 6, title: '神奇的动物世界', grade: '7-9岁', duration: '40分钟', students: '9-15人', time: '2026/04/13 10:06:30', status: 'draft', thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20monsters%20in%20asian%20night%20market%20lanterns%20cartoon%20style&image_size=landscape_4_3' },
  { id: 7, title: '神奇的动物世界', grade: '7-9岁', duration: '40分钟', students: '9-15人', time: '2026/04/13 10:06:30', status: 'published', thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20monsters%20in%20hot%20air%20balloon%20over%20red%20rock%20canyon%20cartoon%20style&image_size=landscape_4_3' },
  { id: 8, title: '神奇的动物世界', grade: '7-9岁', duration: '40分钟', students: '9-15人', time: '2026/04/13 10:06:30', status: 'draft', thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20monsters%20camping%20in%20forest%20at%20night%20cartoon%20style&image_size=landscape_4_3' },
];

const StatusTag = ({ status }) => {
  const isPublished = status === 'published';
  return (
    <Tag
      color={isPublished ? 'success' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        borderRadius: '100px',
        padding: '0 7px',
        height: '22px',
        fontSize: '12px',
        fontWeight: 500,
      }}
    >
      {isPublished ? <CheckCircle size={12} /> : <FileText size={12} />}
      <span>{isPublished ? '已发布' : '草稿'}</span>
    </Tag>
  );
};

const CourseCard = ({ course }) => (
  <div className="course-card">
    <img src={course.thumbnail} alt={course.title} className="course-image" />
    <div className="course-footer">
      <div className="course-footer-row">
        <span className="course-title">{course.title}</span>
        <StatusTag status={course.status} />
      </div>
      <div className="course-meta">
        <img src={icons.grade} style={{ width: 12, height: 12 }} />
        <span className="meta-text">{course.grade}</span>
        <span className="meta-divider">·</span>
        <img src={icons.duration} style={{ width: 12, height: 12 }} />
        <span className="meta-text">{course.duration}</span>
        <span className="meta-divider">·</span>
        <img src={icons.students} style={{ width: 12, height: 12 }} />
        <span className="meta-text">{course.students}</span>
      </div>
      <div className="course-time">
        <img src={icons.time} style={{ width: 14, height: 14 }} />
        <span className="time-text">{course.time}</span>
      </div>
    </div>
  </div>
);

const CreateSection = () => (
  <div className="stat-card">
    <div className="card-header">
      <img src={icons.sparkles} style={{ width: 18, height: 18 }} />
      <span className="title">开始创作</span>
    </div>
    <div className="create-section-content">
      <Button
        type="primary"
        size="large"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          border: '2px solid #333e4e',
          borderRadius: '9999px',
          boxShadow: '3px 3px 0px 0px #333e4e',
          backgroundColor: '#f4785e',
          padding: '0 14px',
          height: '40px',
          fontWeight: 500,
          fontSize: '16px',
          color: '#ffffff',
        }}
      >
        <img src={icons.plusOrange} style={{ width: 16, height: 16 }} />
        <span>创建新课程</span>
      </Button>
      <div className="create-section-buttons">
        {[{ icon: icons.image, label: '创建图片' }, { icon: icons.video, label: '创建视频' }, { icon: icons.audio, label: '创建音频' }].map(({ icon, label }) => (
          <Button
            key={label}
            size="middle"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              flex: 1,
              border: '2px solid #333e4e',
              borderRadius: '8px',
              boxShadow: '3px 3px 0px 0px rgba(0,0,0,0.15)',
              backgroundColor: '#ffffff',
              padding: '0 15px',
              height: '40px',
              fontWeight: 500,
              fontSize: '14px',
              color: '#333e4e',
            }}
          >
            <img src={icon} style={{ width: 16, height: 16 }} />
            <span>{label}</span>
          </Button>
        ))}
      </div>
    </div>
  </div>
);

const AssetSection = () => (
  <div 
    className="stat-card"
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      border: '1px solid #e8e3dd',
      borderRadius: '12px',
      backgroundColor: '#ffffff',
      padding: '19px',
      width: '469px',
      height: '178px',
      rowGap: '16px',
    }}
  >
    <div 
      style={{
        display: 'flex',
        flexShrink: 0,
        alignItems: 'center',
        alignSelf: 'stretch',
        justifyContent: 'space-between',
        height: '24px',
      }}
    >
      <div 
        style={{
          display: 'inline-flex',
          flexShrink: 0,
          alignItems: 'center',
          columnGap: '8px',
          height: '23px',
        }}
      >
        <img 
          src={icons.asset} 
          style={{ 
            width: '18px', 
            height: '18px',
            flexShrink: 0,
          }} 
        />
        <span 
          style={{
            flexShrink: 0,
            lineHeight: '24px',
            letterSpacing: '0',
            color: '#333e4e',
            fontSize: '16px',
            fontWeight: 700,
          }}
        >
          素材与资产
        </span>
      </div>
      <Tag
        style={{
          display: 'inline-flex',
          flexShrink: 0,
          alignItems: 'center',
          columnGap: '4px',
          border: '1px solid #333e4e',
          borderRadius: '100px',
          backgroundColor: '#fcfbf9',
          padding: '0 7px',
          height: '22px',
        }}
      >
        <img 
          src={icons.sync} 
          style={{ 
            width: '12px', 
            height: '12px',
            flexShrink: 0,
          }} 
          className="animate-spin"
        />
        <span 
          style={{
            flexShrink: 0,
            lineHeight: '20px',
            letterSpacing: '0',
            color: '#333e4e',
            fontSize: '12px',
            fontWeight: 500,
          }}
        >
          实时同步中
        </span>
      </Tag>
    </div>
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        alignItems: 'flex-start',
        alignSelf: 'stretch',
        justifyContent: 'center',
        rowGap: '16px',
      }}
    >
      <div 
        style={{
          display: 'flex',
          flexShrink: 0,
          alignItems: 'center',
          alignSelf: 'stretch',
          justifyContent: 'space-between',
          minWidth: '412px',
          height: '40px',
        }}
      >
        <span 
          style={{
            flexShrink: 0,
            lineHeight: '22px',
            letterSpacing: '0',
            color: '#575f6e',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          累计生成素材
        </span>
        <div 
          style={{
            display: 'inline-flex',
            flexShrink: 0,
            alignItems: 'center',
            columnGap: '4px',
          }}
        >
          <span 
            style={{
              flexShrink: 0,
              lineHeight: '38px',
              letterSpacing: '0',
              color: '#333e4e',
              fontSize: '30px',
              fontWeight: 700,
            }}
          >
            265
          </span>
          <span 
            style={{
              display: 'flex',
              flexShrink: 0,
              alignItems: 'flex-end',
              width: '12px',
              height: '32px',
              lineHeight: '20px',
              letterSpacing: '0',
              color: '#818997',
              fontSize: '12px',
              fontWeight: 500,
            }}
          >
            个
          </span>
        </div>
      </div>
      <div 
        style={{
          display: 'flex',
          flexShrink: 0,
          alignItems: 'center',
          alignSelf: 'stretch',
          justifyContent: 'space-between',
          border: '1px solid #e8e3dd',
          borderRadius: '8px',
          backgroundColor: '#fcfbf9',
          padding: '7px 16px',
          height: '40px',
        }}
      >
        <div 
          style={{
            display: 'inline-flex',
            flexShrink: 0,
            alignItems: 'center',
            columnGap: '4px',
          }}
        >
          <img 
            src={icons.zap} 
            style={{ 
              width: '14px', 
              height: '14px',
              flexShrink: 0,
            }} 
          />
          <span 
            style={{
              flexShrink: 0,
              lineHeight: '22px',
              letterSpacing: '0',
              color: '#575f6e',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            剩余算力
          </span>
        </div>
        <div 
          style={{
            display: 'inline-flex',
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'center',
            columnGap: '8px',
            height: '15px',
          }}
        >
          <span 
            style={{
              flexShrink: 0,
              lineHeight: '22px',
              letterSpacing: '0',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            <span style={{ color: '#333e4e' }}>37,153</span>
            <span style={{ color: '#818997' }}>/ 40k</span>
          </span>
          <Progress 
            percent={92.88} 
            strokeColor="#f5a233"
            strokeWidth={6}
            showInfo={false}
            style={{ width: '117px' }}
          />
        </div>
      </div>
    </div>
  </div>
);

const TaskSection = () => (
  <div className="stat-card">
    <div className="card-header">
      <img src={icons.task} style={{ width: 18, height: 18 }} />
      <span className="title">今日任务概览</span>
    </div>
    <div className="task-content">
      <div className="task-stats-row">
        <span className="info-text">今日累计完成</span>
        <div className="stat-number-wrapper">
          <span className="stat-number">47</span>
          <span className="stat-label">个</span>
        </div>
      </div>
      <div className="task-cards-row">
        <div className="task-card-running">
          <span className="task-label task-label-running">运行中</span>
          <span className="task-value task-value-running">0</span>
        </div>
        <div className="task-card-done">
          <span className="task-label task-label-done">已完成</span>
          <span className="task-value task-value-done">5</span>
        </div>
        <div className="task-card-queue">
          <span className="task-label task-label-queue">排队中</span>
          <span className="task-value task-value-queue">2</span>
        </div>
      </div>
    </div>
  </div>
);

const RecentSection = () => {
  const [activeTab, setActiveTab] = useState('courses');
  
  const tabs = [
    { id: 'courses', icon: BookOpen, label: '课程' },
    { id: 'images', icon: Image, label: '图片' },
    { id: 'videos', icon: Video, label: '视频' },
    { id: 'audio', icon: Music, label: '音频' },
  ];

  const coursesToShow = useMemo(() => mockCourses, []);

  return (
    <div className="recent-container">
      <div className="recent-header">
        <div className="recent-title-row">
          <span className="title">最近创建</span>
          <Segmented
            options={tabs.map(tab => {
              const IconComponent = tab.icon;
              return {
                label: (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <IconComponent size={14} />
                    <span>{tab.label}</span>
                  </span>
                ),
                value: tab.id,
              };
            })}
            value={activeTab}
            onChange={setActiveTab}
            style={{
              border: '1.5px solid #333E4E',
              borderRadius: '8px',
            }}
          />
        </div>
        <Button
          type="text"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '92px',
            height: '32px',
            fontSize: '14px',
            fontWeight: 500,
            lineHeight: '22px',
            color: '#f4785e',
            padding: 0,
          }}
        >
          <span>按更新时间</span>
          <ChevronsUpDown size={14} />
        </Button>
      </div>
      <div className="recent-content">
        {[coursesToShow.slice(0, 4), coursesToShow.slice(4, 8)].map((row, rowIndex) => (
          <div key={rowIndex} className="recent-row">
            {row.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={8}><CreateSection /></Col>
        <Col xs={24} lg={8}><AssetSection /></Col>
        <Col xs={24} lg={8}><TaskSection /></Col>
      </Row>
      <RecentSection />
    </div>
  );
};
