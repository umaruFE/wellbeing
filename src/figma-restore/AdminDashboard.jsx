import React, { useState, useMemo, useCallback } from 'react';
import { Row, Col, Button, Segmented, Tag, Progress } from 'antd';
import { 
  BookOpen, Image, Video, Music, FileText, CheckCircle, ChevronsUpDown,
  Sparkles, Plus, Package, RefreshCw, Zap, ListTodo, Clock, Award, Users
} from 'lucide-react';
import './AdminDashboard.css';

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

const mockImages = [
  { id: 1, url: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20pink%20monster%20in%20hot%20air%20balloon%20with%20telescope%20cyberpunk%20city%20cartoon%20style&image_size=square', title: '赛博朋克城市夜景', dimensions: '1024 × 1024', time: '2026/04/13 10:06:30', size: '2.3 MB' },
  { id: 2, url: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20monsters%20cooking%20in%20kitchen%20cartoon%20style&image_size=square', title: '复古咖啡馆插画', dimensions: '1024 × 1024', time: '2026/04/13 10:05:20', size: '1.8 MB' },
  { id: 3, url: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20monsters%20having%20party%20at%20night%20city%20scene%20cartoon%20style&image_size=square', title: '复古咖啡馆插画', dimensions: '1024 × 1024', time: '2026/04/13 10:04:15', size: '3.1 MB' },
  { id: 4, url: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20monsters%20in%20hot%20air%20balloon%20cartoon%20style&image_size=square', title: '复古咖啡馆插画', dimensions: '1024 × 1024', time: '2026/04/13 10:03:00', size: '2.7 MB' },
  { id: 5, url: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20monsters%20waiting%20at%20bus%20stop%20in%20rainy%20city%20cartoon%20style&image_size=square', title: '赛博朋克城市夜景', dimensions: '1024 × 1024', time: '2026/04/13 10:02:45', size: '1.5 MB' },
  { id: 6, url: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20monsters%20having%20picnic%20on%20beach%20tropical%20cartoon%20style&image_size=square', title: '复古咖啡馆插画', dimensions: '1024 × 1024', time: '2026/04/13 10:01:30', size: '2.0 MB' },
  { id: 7, url: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20monsters%20camping%20in%20forest%20at%20night%20cartoon%20style&image_size=square', title: '复古咖啡馆插画', dimensions: '1024 × 1024', time: '2026/04/13 10:00:15', size: '2.9 MB' },
  { id: 8, url: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20monsters%20in%20asian%20night%20market%20lanterns%20cartoon%20style&image_size=square', title: '复古咖啡馆插画', dimensions: '1024 × 1024', time: '2026/04/13 09:59:00', size: '1.2 MB' },
];

const mockVideos = [
  { id: 1, thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20pink%20monster%20in%20hot%20air%20balloon%20with%20telescope%20cartoon%20style&image_size=square', title: 'AI发展史科普视频', duration: '05:20', status: 'published', time: '2026/04/13 10:06:30' },
  { id: 2, thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20monsters%20having%20picnic%20on%20beach%20tropical%20cartoon%20style&image_size=square', title: 'AI发展史科普视频', duration: '05:20', status: 'draft', time: '2026/04/13 10:06:30' },
  { id: 3, thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20monsters%20in%20asian%20night%20market%20lanterns%20cartoon%20style&image_size=square', title: 'AI发展史科普视频', duration: '05:20', status: 'draft', time: '2026/04/13 10:06:30' },
  { id: 4, thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20monsters%20waiting%20at%20bus%20stop%20in%20rainy%20city%20cartoon%20style&image_size=square', title: 'AI发展史科普视频', duration: '05:20', status: 'draft', time: '2026/04/13 10:06:30' },
  { id: 5, thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20pink%20monster%20in%20hot%20air%20balloon%20cartoon%20style&image_size=square', title: 'AI发展史科普视频', duration: '05:20', status: 'draft', time: '2026/04/13 10:06:30' },
  { id: 6, thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20monsters%20cooking%20in%20kitchen%20cartoon%20style&image_size=square', title: 'AI发展史科普视频', duration: '05:20', status: 'draft', time: '2026/04/13 10:06:30' },
  { id: 7, thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20monsters%20camping%20in%20forest%20at%20night%20cartoon%20style&image_size=square', title: 'AI发展史科普视频', duration: '05:20', status: 'draft', time: '2026/04/13 10:06:30' },
  { id: 8, thumbnail: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=cute%20monsters%20in%20asian%20night%20market%20lanterns%20cartoon%20style&image_size=square', title: 'AI发展史科普视频', duration: '05:20', status: 'draft', time: '2026/04/13 10:06:30' },
];

const mockAudios = [
  { id: 1, title: '轻松背景音乐(BGM)', duration: '05:20', time: '2026/04/13 10:06:30', color: 'green' },
  { id: 2, title: '英文课文朗读语音', duration: '05:20', time: '2026/04/13 10:06:30', color: 'gold' },
  { id: 3, title: '英文课文朗读语音', duration: '05:20', time: '2026/04/13 10:06:30', color: 'blue' },
  { id: 4, title: '轻松背景音乐(BGM)', duration: '05:20', time: '2026/04/13 10:06:30', color: 'orange' },
  { id: 5, title: '英文课文朗读语音', duration: '05:20', time: '2026/04/13 10:06:30', color: 'purple' },
  { id: 6, title: '英文课文朗读语音', duration: '05:20', time: '2026/04/13 10:06:30', color: 'green' },
  { id: 7, title: '英文课文朗读语音', duration: '05:20', time: '2026/04/13 10:06:30', color: 'gold' },
  { id: 8, title: '轻松背景音乐(BGM)', duration: '05:20', time: '2026/04/13 10:06:30', color: 'purple' },
  { id: 9, title: '英文课文朗读语音', duration: '05:20', time: '2026/04/13 10:06:30', color: 'blue' },
  { id: 10, title: '英文课文朗读语音', duration: '05:20', time: '2026/04/13 10:06:30', color: 'orange' },
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
        <Award size={12} />
        <span className="meta-text">{course.grade}</span>
        <span className="meta-divider">·</span>
        <Clock size={12} />
        <span className="meta-text">{course.duration}</span>
        <span className="meta-divider">·</span>
        <Users size={12} />
        <span className="meta-text">{course.students}</span>
      </div>
      <div className="course-time">
        <Clock size={14} />
        <span className="time-text">{course.time}</span>
      </div>
    </div>
  </div>
);

const ImageCard = ({ image, onClick }) => (
  <div className="image-card" onClick={onClick}>
    <img src={image.url} alt={image.title || `Image ${image.id}`} className="image-card-img" />
    <div className="image-card-overlay">
      <div className="image-card-title">{image.title}</div>
      <div className="image-card-dimensions">{image.dimensions}</div>
    </div>
  </div>
);

const VideoCard = ({ video }) => (
  <div className="video-card">
    <div className="video-card-body">
      <img src={video.thumbnail} alt={video.title} className="video-card-thumbnail" />
      <div className="video-play-btn">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="24" cy="24" r="24" fill="rgba(0,0,0,0.6)" />
          <path d="M30 24L18 16V32L30 24Z" fill="white" />
        </svg>
      </div>
      <div className="video-duration">
        {video.duration}
      </div>
    </div>
    <div className="video-card-footer">
      <div className="video-title-row">
        <span className="video-title">{video.title}</span>
        {video.status !== 'published' && (
          <Tag
            color={video.status === 'published' ? 'success' : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              borderRadius: '100px',
              padding: '0 7px',
              height: '22px',
              fontSize: '12px',
              fontWeight: 500,
              border: '1px solid #333e4e',
              backgroundColor: '#fcfbf9',
              color: '#333e4e',
            }}
          >
            <FileText size={12} />
            <span>草稿</span>
          </Tag>
        )}
      </div>
      <div className="video-time">
        <Clock size={14} />
        <span className="video-time-text">{video.time}</span>
      </div>
    </div>
  </div>
);

const colorMap = {
  green: '#bdddc2',
  gold: '#ffd294',
  blue: '#9ecaff',
  orange: '#ff9a85',
  purple: '#c29edf',
};

const AudioCard = ({ audio }) => {
  const color = colorMap[audio.color] || '#bdddc2';
  
  return (
    <div className="audio-card">
      <div className="audio-card-body" style={{ backgroundColor: color }}>
        <div className="audio-waveform">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="audio-bar"
              style={{
                height: `${Math.random() * 30 + 10}px`,
              }}
            />
          ))}
        </div>
        <div className="audio-duration">{audio.duration}</div>
      </div>
      <div className="audio-card-footer">
        <span className="audio-title">{audio.title}</span>
        <div className="audio-time">
          <Clock size={14} />
          <span className="audio-time-text">{audio.time}</span>
        </div>
      </div>
    </div>
  );
};

const CreateSection = () => (
  <div className="create-section">
    <div className="section-header">
      <div className="section-title-wrapper">
        <Sparkles size={18} />
        <div className="section-title title-4">
          <span className="title-text">开始创作</span>
          <div className="title-decoration" />
          <div className="title-dots">
            <span className="dot-large" />
            <span className="dot-small" />
          </div>
        </div>
      </div>
    </div>
    <div className="create-section-content">
      <Button className="create-course-btn">
        <Plus size={16} />
        <span>创建新课程</span>
      </Button>
      <div className="create-section-buttons">
        {[{ icon: Image, label: '创建图片' }, { icon: Video, label: '创建视频' }, { icon: Music, label: '创建音频' }].map(({ icon: Icon, label }) => (
          <Button key={label} className="create-btn">
            <Icon size={16} />
            <span>{label}</span>
          </Button>
        ))}
      </div>
    </div>
  </div>
);

const AssetSection = () => (
  <div className="asset-section">
    <div className="section-header">
      <div className="section-title-wrapper">
        <Package size={18} />
        <div className="section-title title-5">
          <span className="title-text">素材与资产</span>
          <div className="title-decoration" />
          <div className="title-dots">
            <span className="dot-large" />
            <span className="dot-small" />
          </div>
        </div>
      </div>
      <Tag className="sync-tag">
        <RefreshCw size={12} className="animate-spin" />
        <span>实时同步中</span>
      </Tag>
    </div>
    <div className="asset-content">
      <div className="asset-stats-row">
        <span className="info-text">累计生成素材</span>
        <div className="stat-number-wrapper">
          <span className="stat-number">265</span>
          <span className="stat-label">个</span>
        </div>
      </div>
      <div className="power-row">
        <div className="power-info">
          <Zap size={14} />
          <span className="power-label">剩余算力</span>
        </div>
        <div className="power-content">
          <span className="power-value">
            <span className="power-current">37,153</span>
            <span className="power-total">/ 40k</span>
          </span>
          <Progress 
            percent={92.88} 
            strokeColor="#f5a233"
            strokeWidth={6}
            showInfo={false}
            className="power-progress"
          />
        </div>
      </div>
    </div>
  </div>
);

const TaskSection = () => (
  <div className="task-section">
    <div className="section-header">
      <div className="section-title-wrapper">
        <ListTodo size={18} />
        <div className="section-title title-6">
          <span className="title-text">今日任务概览</span>
          <div className="title-decoration" />
          <div className="title-dots">
            <span className="dot-large" />
            <span className="dot-small" />
          </div>
        </div>
      </div>
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
        <div className="task-card task-card-running">
          <span className="task-label">运行中</span>
          <span className="task-value">0</span>
        </div>
        <div className="task-card task-card-done">
          <span className="task-label">已完成</span>
          <span className="task-value">5</span>
        </div>
        <div className="task-card task-card-queue">
          <span className="task-label">排队中</span>
          <span className="task-value">2</span>
        </div>
      </div>
    </div>
  </div>
);

const RecentSection = () => {
  const [activeTab, setActiveTab] = useState('audio');
  const [selectedImage, setSelectedImage] = useState(null);
  
  const tabs = [
    { id: 'courses', icon: BookOpen, label: '课程' },
    { id: 'images', icon: Image, label: '图片' },
    { id: 'videos', icon: Video, label: '视频' },
    { id: 'audio', icon: Music, label: '音频' },
  ];

  const handleImageClick = useCallback((image) => {
    setSelectedImage(image);
  }, []);

  const handleClosePreview = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'courses':
        return [mockCourses.slice(0, 4), mockCourses.slice(4, 8)].map((row, rowIndex) => (
          <div key={rowIndex} className="recent-row">
            {row.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ));
      case 'images':
        return [mockImages.slice(0, 4), mockImages.slice(4, 8)].map((row, rowIndex) => (
          <div key={rowIndex} className="recent-images-row">
            {row.map(image => (
              <ImageCard key={image.id} image={image} onClick={() => handleImageClick(image)} />
            ))}
          </div>
        ));
      case 'videos':
        return [mockVideos.slice(0, 4), mockVideos.slice(4, 8)].map((row, rowIndex) => (
          <div key={rowIndex} className="recent-videos-row">
            {row.map(video => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        ));
      case 'audio':
        return [mockAudios.slice(0, 5), mockAudios.slice(5, 10)].map((row, rowIndex) => (
          <div key={rowIndex} className="recent-audios-row">
            {row.map(audio => (
              <AudioCard key={audio.id} audio={audio} />
            ))}
          </div>
        ));
      default:
        return null;
    }
  };

  return (
    <>
      <div className="recent-container">
        <div className="recent-header">
          <div className="recent-title-row">
            <div className="recent-title-wrapper title-4">
              <span className="title">最近创建</span>
              <div className="title-decoration" />
              <div className="title-dots">
                <span className="dot-large" />
                <span className="dot-small" />
              </div>
            </div>
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
                border: '2px solid #333E4E',
                borderRadius: '9999px',
                backgroundColor: '#f3f2ed',
              }}
            />
          </div>
          <div className="recent-sort-btn">
            <span>按更新时间</span>
            <ChevronsUpDown size={14} />
          </div>
        </div>
        <div className="recent-content">
          {renderContent()}
        </div>
      </div>
      {selectedImage && (
        <div className="image-preview-overlay" onClick={handleClosePreview}>
          <div className="image-preview-card" onClick={(e) => e.stopPropagation()}>
            <button className="image-preview-close" onClick={handleClosePreview}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 5L5 15M5 5L15 15" stroke="#575f6e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <img src={selectedImage.url} alt="Preview" className="image-preview-img" />
            <div className="image-preview-info">
              <div className="image-preview-time">
                <img src={icons.time} style={{ width: 14, height: 14 }} />
                <span>{selectedImage.time}</span>
              </div>
              <span className="image-preview-size">{selectedImage.size}</span>
            </div>
          </div>
        </div>
      )}
    </>
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
