import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Button, Segmented, Tag, Progress } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, Image, Video, Music, FileText, CheckCircle, ChevronsUpDown,
  Sparkles, Plus, Package, RefreshCw, Zap, ListTodo, Clock, Award, Users,
  Loader2
} from 'lucide-react';
import apiService from '../services/api';
import { CreateCourseModal } from './create-course';
import './AdminDashboard.css';

const PlaceholderImg = ({ src, alt, className, style, icon: Icon }) => {
  const [errored, setErrored] = useState(!src);
  if (errored || !src) {
    return (
      <div className={className} style={{ ...style, background: '#f0eee9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {Icon ? <Icon size={36} style={{ color: '#c4bfb6' }} strokeWidth={1.5} /> : null}
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} style={style} onError={() => setErrored(true)} />;
};

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

const CourseCard = ({ course, onClick }) => (
  <div className="course-card" onClick={onClick} style={{ cursor: 'pointer' }}>
    <PlaceholderImg src={course.thumbnail} alt={course.title} className="course-image" icon={BookOpen} />
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
    <PlaceholderImg src={image.url} alt={image.title || `Image ${image.id}`} className="image-card-img" icon={Image} />
    <div className="image-card-overlay">
      <div className="image-card-title">{image.title}</div>
      <div className="image-card-dimensions">{image.dimensions}</div>
    </div>
  </div>
);

const VideoCard = ({ video }) => (
  <div className="video-card">
    <div className="video-card-body">
      <PlaceholderImg src={video.thumbnail} alt={video.title} className="video-card-thumbnail" icon={Video} />
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

const audioColors = ['#bdddc2', '#ffd294', '#9ecaff', '#ff9a85', '#c29edf'];

const AudioCard = ({ audio, index }) => {
  const color = audioColors[index % audioColors.length];
  return (
    <div className="audio-card">
      <div className="audio-card-body" style={{ backgroundColor: color }}>
        <div className="audio-waveform">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="audio-bar"
              style={{ height: `${Math.random() * 30 + 10}px` }}
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

const EmptyState = ({ icon: Icon, text }) => (
  <div className="empty-container">
    <Icon size={40} className="empty-icon" />
    <span className="empty-text">{text}</span>
  </div>
);

const CreateSection = ({ onCreateCourse, navigate }) => (
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
      <Button className="create-course-btn" onClick={onCreateCourse}>
        <Plus size={16} />
        <span>创建新课程</span>
      </Button>
      <div className="create-section-buttons">
        {[
          { icon: Image, label: '创建图片', route: '/test/ip-scene' },
          { icon: Video, label: '创建视频', route: '/test/video-generator' },
          { icon: Music, label: '创建音频', route: '/test/audio-generator' },
        ].map(({ icon: Icon, label, route }) => (
          <Button key={label} className="create-btn" onClick={() => navigate(route)}>
            <Icon size={16} />
            <span>{label}</span>
          </Button>
        ))}
      </div>
    </div>
  </div>
);

const AssetSection = ({ stats, statsLoading }) => {
  const totalMediaCount = (stats.media?.images || 0) + (stats.media?.videos || 0) + (stats.media?.audios || 0);
  const computeUsage = stats.compute || { used: 0, total: 40000, remaining: 40000 };
  const remaining = computeUsage.total - computeUsage.used;
  const percent = computeUsage.total > 0 ? (remaining / computeUsage.total) * 100 : 100;

  return (
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
            {statsLoading ? (
              <Loader2 size={24} className="animate-spin" style={{ color: '#9ca3af' }} />
            ) : (
              <>
                <span className="stat-number">{totalMediaCount}</span>
                <span className="stat-label">个</span>
              </>
            )}
          </div>
        </div>
        <div className="power-row">
          <div className="power-info">
            <Zap size={14} />
            <span className="power-label">剩余算力</span>
          </div>
          <div className="power-content">
            <span className="power-value">
              <span className="power-current">{remaining.toLocaleString()}</span>
              <span className="power-total">/ {computeUsage.total / 1000}k</span>
            </span>
            <Progress
              percent={percent}
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
};

const TaskSection = ({ stats, statsLoading }) => (
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
          {statsLoading ? (
            <Loader2 size={24} className="animate-spin" style={{ color: '#9ca3af' }} />
          ) : (
            <>
              <span className="stat-number">{stats.tasks?.completed || 0}</span>
              <span className="stat-label">个</span>
            </>
          )}
        </div>
      </div>
      <div className="task-cards-row">
        <div className="task-card task-card-running">
          <span className="task-label">运行中</span>
          <span className="task-value">{statsLoading ? '-' : (stats.tasks?.running || 0)}</span>
        </div>
        <div className="task-card task-card-done">
          <span className="task-label">已完成</span>
          <span className="task-value">{statsLoading ? '-' : (stats.tasks?.completed || 0)}</span>
        </div>
        <div className="task-card task-card-queue">
          <span className="task-label">排队中</span>
          <span className="task-value">{statsLoading ? '-' : (stats.tasks?.queued || 0)}</span>
        </div>
      </div>
    </div>
  </div>
);

const RecentSection = ({ courses, coursesLoading, onCourseClick, images, imagesLoading, videos, videosLoading, audios, audiosLoading }) => {
  const [activeTab, setActiveTab] = useState('courses');

  const tabs = [
    { id: 'courses', icon: BookOpen, label: '课程' },
    { id: 'images', icon: Image, label: '图片' },
    { id: 'videos', icon: Video, label: '视频' },
    { id: 'audio', icon: Music, label: '音频' },
  ];

  const renderRow = (items, renderFn, rowSize) => {
    const rows = [];
    for (let i = 0; i < items.length; i += rowSize) {
      rows.push(items.slice(i, i + rowSize));
    }
    return rows.map((row, ri) => <div key={ri} className="recent-row">{row.map(renderFn)}</div>);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'courses':
        if (coursesLoading) return <div className="loading-container"><Loader2 size={24} className="animate-spin" style={{ color: '#9ca3af' }} /><span className="loading-text">加载中...</span></div>;
        if (!courses || courses.length === 0) return <EmptyState icon={FileText} text="暂无课程，点击上方按钮创建" />;
        return renderRow(courses, course => <CourseCard key={course.id} course={course} onClick={() => onCourseClick(course.id)} />, 4);
      case 'images':
        if (imagesLoading) return <div className="loading-container"><Loader2 size={24} className="animate-spin" style={{ color: '#9ca3af' }} /><span className="loading-text">加载中...</span></div>;
        if (!images || images.length === 0) return <EmptyState icon={Image} text="暂无图片素材" />;
        return renderRow(images, image => <ImageCard key={image.id} image={image} onClick={() => {}} />, 4);
      case 'videos':
        if (videosLoading) return <div className="loading-container"><Loader2 size={24} className="animate-spin" style={{ color: '#9ca3af' }} /><span className="loading-text">加载中...</span></div>;
        if (!videos || videos.length === 0) return <EmptyState icon={Video} text="暂无视频素材" />;
        return renderRow(videos, video => <VideoCard key={video.id} video={video} />, 4);
      case 'audio':
        if (audiosLoading) return <div className="loading-container"><Loader2 size={24} className="animate-spin" style={{ color: '#9ca3af' }} /><span className="loading-text">加载中...</span></div>;
        if (!audios || audios.length === 0) return <EmptyState icon={Music} text="暂无音频素材" />;
        return renderRow(audios, (audio, idx) => <AudioCard key={audio.id} audio={audio} index={idx} />, 5);
      default:
        return null;
    }
  };

  return (
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
  );
};

export const AdminDashboard = () => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [audios, setAudios] = useState([]);
  const [audiosLoading, setAudiosLoading] = useState(true);

  const [stats, setStats] = useState({
    courses: { total: 0 },
    media: { images: 0, videos: 0, audios: 0 },
    tasks: { running: 0, completed: 0, queued: 0 },
    todayCompleted: 0,
    compute: { used: 0, total: 40000, remaining: 40000 },
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const statsResult = await apiService.request('/api/stats');
      if (statsResult?.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchRecentCourses = useCallback(async () => {
    try {
      setCoursesLoading(true);
      const result = await apiService.getCourses({ limit: '8', page: '1' });
      const list = result?.data || [];
      setCourses(list.map(course => ({
        id: course.id,
        title: course.title || course.unit || '未命名课程',
        grade: course.age_group || '--',
        duration: course.duration ? `${course.duration}分钟` : '--',
        students: '--',
        time: course.created_at
          ? new Date(course.created_at).toLocaleString('zh-CN', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            }).replace(/\//g, '/')
          : '--',
        status: course.status === 'published' ? 'published' : 'draft',
        thumbnail: course.thumbnail || '',
      })));
    } catch (error) {
      console.error('获取最近课程失败:', error);
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  const fetchRecentImages = useCallback(async () => {
    try {
      setImagesLoading(true);
      const result = await apiService.getPptImages({ limit: '8' });
      const list = result?.data || [];
      setImages(list.map(img => ({
        id: img.id,
        url: img.image_url || img.url || '',
        title: img.title || img.prompt?.substring(0, 20) || '未命名图片',
        dimensions: img.width && img.height ? `${img.width} × ${img.height}` : '--',
        time: img.created_at
          ? new Date(img.created_at).toLocaleString('zh-CN', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            }).replace(/\//g, '/')
          : '--',
        size: '--',
      })));
    } catch (error) {
      console.error('获取图片失败:', error);
      setImages([]);
    } finally {
      setImagesLoading(false);
    }
  }, []);

  const fetchRecentVideos = useCallback(async () => {
    try {
      setVideosLoading(true);
      const result = await apiService.getVideos({ limit: '8' });
      const list = result?.data || [];
      setVideos(list.map(video => ({
        id: video.id,
        thumbnail: video.thumbnail_url || video.thumbnail || '',
        title: video.title || '未命名视频',
        duration: video.duration || '--:--',
        status: video.status || 'draft',
        time: video.created_at
          ? new Date(video.created_at).toLocaleString('zh-CN', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            }).replace(/\//g, '/')
          : '--',
      })));
    } catch (error) {
      console.error('获取视频失败:', error);
      setVideos([]);
    } finally {
      setVideosLoading(false);
    }
  }, []);

  const fetchRecentAudios = useCallback(async () => {
    try {
      setAudiosLoading(true);
      const result = await apiService.getVoiceConfigs();
      const list = (result?.data || result || []).slice(0, 10);
      setAudios(list.map(audio => ({
        id: audio.id,
        title: audio.name || audio.title || '未命名音频',
        duration: audio.duration || '--:--',
        time: audio.created_at
          ? new Date(audio.created_at).toLocaleString('zh-CN', {
              year: 'numeric', month: '2-digit', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            }).replace(/\//g, '/')
          : '--',
      })));
    } catch (error) {
      console.error('获取音频失败:', error);
      setAudios([]);
    } finally {
      setAudiosLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    fetchRecentCourses();
    fetchRecentImages();
    fetchRecentVideos();
    fetchRecentAudios();
  }, [loadData, fetchRecentCourses, fetchRecentImages, fetchRecentVideos, fetchRecentAudios]);

  const handleCreateCourse = () => {
    setCreateOpen(true);
  };

  const handleCreateSubmit = (values) => {
    setCreateOpen(false);
    navigate('/figma-courses', { state: { newCourse: values } });
  };

  const handleCourseClick = () => {
    navigate('/figma-courses');
  };

  return (
    <div className="admin-dashboard">
      <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={8}>
          <CreateSection onCreateCourse={handleCreateCourse} navigate={navigate} />
        </Col>
        <Col xs={24} lg={8}>
          <AssetSection stats={stats} statsLoading={statsLoading} />
        </Col>
        <Col xs={24} lg={8}>
          <TaskSection stats={stats} statsLoading={statsLoading} />
        </Col>
      </Row>
      <RecentSection
        courses={courses}
        coursesLoading={coursesLoading}
        onCourseClick={handleCourseClick}
        images={images}
        imagesLoading={imagesLoading}
        videos={videos}
        videosLoading={videosLoading}
        audios={audios}
        audiosLoading={audiosLoading}
      />
      <CreateCourseModal
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />
    </div>
  );
};
