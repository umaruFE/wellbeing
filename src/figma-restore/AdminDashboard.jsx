import { ContentTabPanel, ContentTabs, CreateButton, MetadataTag } from '../components/LibraryControls';
import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageLoading } from '../components/PageLoading';
import { 
  BookOpen, Image, Video, Music, FileText, CheckCircle,
  Sparkles, Package, Clock, Award, Users
} from 'lucide-react';
import apiService from '../services/api';
import { CreateCourseModal } from './create-course';
import { formatCourseDuration, getCourseCoverUrl, getCourseData, getDisplayCourseTitle } from './courseImages';
import './AdminDashboard.css';

const RECENT_PAGE_SIZE = 9;

const PlaceholderImg = ({ src, alt, className, style, icon: Icon }) => {
  const [errored, setErrored] = useState(!src);
  if (errored || !src) {
    return (
      <div className={className} style={{ ...style, background: 'var(--wb-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {Icon ? <Icon size={36} style={{ color: 'var(--wb-muted)' }} strokeWidth={1.5} /> : null}
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} style={style} onError={() => setErrored(true)} />;
};

const StatusTag = ({ status }) => {
  const { t } = useTranslation();
  const isPublished = status === 'published';
  return (
    <MetadataTag tone={isPublished ? 'ready' : 'draft'}>
      {isPublished ? <CheckCircle size={12} /> : <FileText size={12} />}
      <span>{isPublished ? t('course.published') : t('course.draft')}</span>
    </MetadataTag>
  );
};

const DEFAULT_COVER = '/assets/empty/3a4db69c7cdec2529d41fe498ca0887f.jpg';

const CourseCoverImage = ({ course }) => {
  const [errored, setErrored] = useState(false);
  const src = course.thumbnail;

  if (!src || errored) {
    return <img src={DEFAULT_COVER} alt="" className="course-image" loading="lazy" />;
  }

  return (
    <img
      src={src}
      alt=""
      className="course-image"
      loading="lazy"
      onError={() => setErrored(true)}
    />
  );
};

const CourseCard = ({ course, onClick }) => (
  <button type="button" className="course-card" onClick={onClick}>
    <CourseCoverImage course={course} />
    <span className="course-footer">
      <span className="course-footer-row">
        <span className="course-title">{course.title}</span>
        <StatusTag status={course.status} />
      </span>
      <span className="course-meta">
        <Award size={12} />
        <span className="meta-text">{course.grade}</span>
        <span className="meta-divider">·</span>
        <Clock size={12} />
        <span className="meta-text">{course.duration}</span>
        <span className="meta-divider">·</span>
        <Users size={12} />
        <span className="meta-text">{course.students}</span>
      </span>
      <span className="course-time">
        <Clock size={14} />
        <span className="time-text">{course.time}</span>
      </span>
    </span>
  </button>
);

const ImageCard = ({ image }) => (
  <div className="image-card">
    <PlaceholderImg src={image.url} alt={image.title || `Image ${image.id}`} className="image-card-img" icon={Image} />
    <div className="image-card-overlay">
      <div className="image-card-title">{image.title}</div>
      <div className="image-card-dimensions">{image.dimensions}</div>
    </div>
  </div>
);

const VideoCard = ({ video }) => {
  return (
  <div className="video-card">
    <div className="video-card-body">
      <PlaceholderImg src={video.thumbnail} alt={video.title} className="video-card-thumbnail" icon={Video} />
      <div className="video-duration">
        {video.duration}
      </div>
    </div>
    <div className="video-card-footer">
      <div className="video-title-row">
        <span className="video-title">{video.title}</span>
        {video.status !== 'published' && (
          <StatusTag status="draft" />
        )}
      </div>
      <div className="video-time">
        <Clock size={14} />
        <span className="video-time-text">{video.time}</span>
      </div>
    </div>
  </div>
  );
};

const audioColors = ['var(--wb-selected)', 'var(--wb-page)'];
const audioWaveformHeights = [
  18, 28, 14, 34, 22, 38, 16, 30, 24, 40,
  20, 32, 12, 36, 26, 18, 34, 22, 30, 16,
  38, 24, 28, 14, 36, 20, 32, 18, 40, 22,
];

const AudioCard = ({ audio, index }) => {
  const color = audioColors[index % audioColors.length];
  return (
    <div className="audio-card">
      <div className="audio-card-body" style={{ backgroundColor: color }}>
        <div className="audio-waveform">
          {audioWaveformHeights.map((height, i) => (
            <div
              key={i}
              className="audio-bar"
              style={{ height: `${height}px` }}
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

const EmptyState = ({ text }) => (
  <div className="wb-library-empty"><p role="status">{text}</p></div>
);

const CreateSection = ({ onCreateCourse, navigate }) => {
  const { t } = useTranslation();
  return (
  <div className="create-section">
    <div className="section-header">
      <div className="section-title-wrapper">
        <Sparkles size={18} />
        <h2 className="wb-section-title">{t('dashboard.quickActions')}</h2>
      </div>
    </div>
    <div className="create-section-content">
      <CreateButton onClick={onCreateCourse}>{t('course.createCourse')}</CreateButton>
      <div className="create-section-buttons">
        {[
          { icon: Image, label: t('asset.generateImage'), route: '/test/ip-scene' },
          { icon: Video, label: t('asset.generateVideo'), route: '/test/video-generator' },
          { icon: Music, label: t('asset.generateAudio'), route: '/test/audio-generator' },
        ].map(({ icon, label, route }) => (
          <button type="button" data-wb-button="secondary" key={label} className="create-btn" onClick={() => navigate(route)}>
            {React.createElement(icon, { size: 16 })}
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
  );
};

const AssetSection = ({ stats }) => {
  const { t } = useTranslation();
  const courseCount = stats?.content?.courses ?? stats?.courses?.total ?? '—';
  const pictureBookCount = stats?.content?.pictureBooks ?? '—';
  const totalContentCount = stats?.content?.total ?? '—';

  return (
    <div className="asset-section">
      <div className="section-header">
        <div className="section-title-wrapper">
          <Package size={18} />
          <h2 className="wb-section-title">{t('dashboard.totalAssets')}</h2>
        </div>
      </div>
      <div className="asset-content">
        <div className="asset-stats-row">
          <span className="info-text">{t('dashboard.totalGenerated')}</span>
          <div className="stat-number-wrapper">
            <span className="stat-number">{totalContentCount}</span>
            <span className="stat-label">{t('dashboard.unit')}</span>
          </div>
        </div>
        <div className="content-counts-row">
          <div className="content-count-item">
            <BookOpen size={15} />
            <span>{t('dashboard.courseCount')}</span>
            <strong>{courseCount}</strong>
          </div>
          <div className="content-count-divider" />
          <div className="content-count-item">
            <Image size={15} />
            <span>{t('dashboard.pictureBookCount')}</span>
            <strong>{pictureBookCount}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

const RecentSection = ({
  courses,
  coursesLoading,
  coursesLoadingMore,
  coursesHasMore,
  onCourseClick,
  onLoadMoreCourses,
  loadErrors,
  onRetry,
  images,
  imagesLoading,
  videos,
  videosLoading,
  audios,
  audiosLoading,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('courses');
  const tabs = [
    { value: 'courses', icon: BookOpen, label: t('sidebar.courseGroup') },
    { value: 'images', icon: Image, label: t('sidebar.imageLibrary') },
    { value: 'videos', icon: Video, label: t('sidebar.videoLibrary') },
    { value: 'audio', icon: Music, label: t('sidebar.audioLibrary') },
  ];

  const renderRow = (items, renderFn) => (
    <div className="wb-work-grid">{items.map(renderFn)}</div>
  );

  const activeLoading = { courses: coursesLoading, images: imagesLoading, videos: videosLoading, audio: audiosLoading }[activeTab];
  const renderContent = () => {
    if (activeLoading) return <PageLoading />;
    if (loadErrors[activeTab] === 'list') {
      return (
        <div className="wb-library-empty">
          <p role="alert">{t('common.operationFailed')}</p>
          <button type="button" data-wb-button="secondary" onClick={() => onRetry[activeTab]()}>{t('common.retry')}</button>
        </div>
      );
    }
    switch (activeTab) {
      case 'courses':
        if (!courses || courses.length === 0) return <EmptyState text={t('dashboard.noCourses')} />;
        return (
          <>
            {renderRow(courses, course => <CourseCard key={course.id} course={course} onClick={() => onCourseClick(course)} />)}
            {coursesHasMore && (
              <div className="recent-load-more-sentinel">
                {loadErrors.courses === 'more' && <span role="alert">{t('course.fetchFailed')}</span>}
                <button type="button" data-wb-button="secondary" disabled={coursesLoadingMore} onClick={onLoadMoreCourses}>
                  {t(coursesLoadingMore ? 'common.loading' : loadErrors.courses === 'more' ? 'common.retry' : 'course.loadMore')}
                </button>
              </div>
            )}
          </>
        );
      case 'images':
        if (!images || images.length === 0) return <EmptyState text={t('dashboard.noImages')} />;
        return renderRow(images, image => <ImageCard key={image.id} image={image} />);
      case 'videos':
        if (!videos || videos.length === 0) return <EmptyState text={t('dashboard.noVideos')} />;
        return renderRow(videos, video => <VideoCard key={video.id} video={video} />);
      case 'audio':
        if (!audios || audios.length === 0) return <EmptyState text={t('dashboard.noAudios')} />;
        return renderRow(audios, (audio, idx) => <AudioCard key={audio.id} audio={audio} index={idx} />);
      default:
        return null;
    }
  };

  return (
    <div className="recent-container">
      <h2 className="wb-section-title">{t('dashboard.recentCourses')}</h2>
      <ContentTabs group="recent-works" label={t('dashboard.recentCourses')} items={tabs} value={activeTab} onChange={setActiveTab} />
      <ContentTabPanel group="recent-works" value={activeTab} aria-busy={activeLoading}>
        {renderContent()}
      </ContentTabPanel>
    </div>
  );
};

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesLoadingMore, setCoursesLoadingMore] = useState(false);
  const [coursesPage, setCoursesPage] = useState(1);
  const [coursesHasMore, setCoursesHasMore] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [images, setImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [videos, setVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [audios, setAudios] = useState([]);
  const [audiosLoading, setAudiosLoading] = useState(true);

  const [stats, setStats] = useState(null);
  const [loadErrors, setLoadErrors] = useState({});
  const [initialLoading, setInitialLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const statsResult = await apiService.request('/api/stats');
      if (statsResult?.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  }, []);

  const fetchRecentCourses = useCallback(async (pageNum = 1, append = false) => {
    setLoadErrors(current => ({ ...current, courses: null }));
    try {
      if (pageNum === 1) {
        setCoursesLoading(true);
      } else {
        setCoursesLoadingMore(true);
      }

      const result = await apiService.getCourses({ limit: RECENT_PAGE_SIZE, page: pageNum });
      const list = result?.data || [];
      const pagination = result?.pagination || {};
      const mapped = list.map(course => {
        const courseData = getCourseData(course);
        const coverUrl = getCourseCoverUrl(course);
        const title = getDisplayCourseTitle(course, t('dashboard.unnamedCourse'));
        return {
          id: course.id,
          title,
          unit: course.unit || title,
          grade: course.age_group || '--',
          age: course.age_group || courseData?.age || '--',
          duration: formatCourseDuration(course.duration || courseData?.duration, t),
          students: '--',
          classSize: courseData?.classSize || course.unit || '',
          time: course.created_at
            ? new Date(course.created_at).toLocaleString('zh-CN', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
              }).replace(/\//g, '/')
            : '--',
          updatedAt: course.created_at
            ? new Date(course.created_at).toLocaleDateString('zh-CN', {
                year: 'numeric', month: '2-digit', day: '2-digit',
              }).replace(/\//g, '/')
            : '--',
          status: course.status === 'published' ? 'published' : 'draft',
          thumbnail: coverUrl,
          themeImageUrl: coverUrl,
          courseData,
          courseOverview: courseData?.courseOverview || null,
          theme: course.theme || courseData?.taskName || t('course.scenarioTask'),
          vocabularies: courseData?.vocabularies || [],
          grammars: courseData?.grammars || [],
          languageSkills: courseData?.languageSkills || [],
          experiencePath: courseData?.experiencePath || '',
          taskName: courseData?.taskName || '',
          storyContext: courseData?.storyContext || '',
          keyOutcome: courseData?.keyOutcome || '',
          journey: courseData?.journey || null,
          atmosphere: courseData?.atmosphere || '',
          specialRequirements: courseData?.specialRequirements || '',
          canvasData: course.canvas_data || course.canvasData || null,
          readingMaterialsData: course.reading_materials_data || course.readingMaterialsData || null,
        };
      });

      setCourses(prev => append ? [...prev, ...mapped] : mapped);
      setCoursesPage(pageNum);

      const totalPages = pagination.totalPages || Math.ceil((pagination.total || 0) / RECENT_PAGE_SIZE);
      setCoursesHasMore(totalPages ? pageNum < totalPages : list.length === RECENT_PAGE_SIZE);
    } catch (error) {
      console.error('获取最近课程失败:', error);
      setLoadErrors(current => ({ ...current, courses: append ? 'more' : 'list' }));
      if (!append) {
        setCourses([]);
      }
    } finally {
      setCoursesLoading(false);
      setCoursesLoadingMore(false);
    }
  }, [t]);

  const loadMoreCourses = useCallback(() => {
    if (coursesLoading || coursesLoadingMore || !coursesHasMore) return;
    fetchRecentCourses(coursesPage + 1, true);
  }, [coursesHasMore, coursesLoading, coursesLoadingMore, coursesPage, fetchRecentCourses]);

  const fetchRecentImages = useCallback(async () => {
    setLoadErrors(current => ({ ...current, images: null }));
    try {
      setImagesLoading(true);
      const result = await apiService.getPptImages({ limit: RECENT_PAGE_SIZE });
      const list = result?.data || [];
      setImages(list.map(img => ({
        id: img.id,
        url: img.image_url || img.imageUrl || img.url || img.preview_url || img.thumbnail_url || '',
        title: img.name || img.title || img.prompt?.substring(0, 20) || t('dashboard.unnamedImage'),
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
      setLoadErrors(current => ({ ...current, images: 'list' }));
      setImages([]);
    } finally {
      setImagesLoading(false);
    }
  }, [t]);

  const fetchRecentVideos = useCallback(async () => {
    setLoadErrors(current => ({ ...current, videos: null }));
    try {
      setVideosLoading(true);
      const result = await apiService.getVideos({ limit: RECENT_PAGE_SIZE });
      const list = result?.data || [];
      setVideos(list.map(video => ({
        id: video.id,
        thumbnail: video.thumbnail_url || video.thumbnailUrl || video.thumbnail || video.cover_url || video.coverUrl || '',
        title: video.name || video.title || t('dashboard.unnamedVideo'),
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
      setLoadErrors(current => ({ ...current, videos: 'list' }));
      setVideos([]);
    } finally {
      setVideosLoading(false);
    }
  }, [t]);

  const fetchRecentAudios = useCallback(async () => {
    setLoadErrors(current => ({ ...current, audio: null }));
    try {
      setAudiosLoading(true);
      const result = await apiService.getVoiceConfigs(undefined, { limit: RECENT_PAGE_SIZE });
      const list = (result?.data || result || []).slice(0, RECENT_PAGE_SIZE);
      setAudios(list.map(audio => ({
        id: audio.id,
        title: audio.name || audio.title || t('dashboard.unnamedAudio'),
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
      setLoadErrors(current => ({ ...current, audio: 'list' }));
      setAudios([]);
    } finally {
      setAudiosLoading(false);
    }
  }, [t]);

  useEffect(() => {
    let active = true;
    Promise.allSettled([loadData(), fetchRecentCourses()]).then(() => {
      if (active) setInitialLoading(false);
    });
    fetchRecentImages();
    fetchRecentVideos();
    fetchRecentAudios();
    return () => { active = false; };
  }, [loadData, fetchRecentCourses, fetchRecentImages, fetchRecentVideos, fetchRecentAudios]);

  const handleCreateCourse = () => {
    setCreateOpen(true);
  };

  const handleCreateSubmit = (values) => {
    setCreateOpen(false);
    navigate('/figma-courses', { state: { newCourse: values } });
  };

  const handleCourseClick = (course) => {
    navigate('/figma-courses', { state: { openCourse: course } });
  };

  if (initialLoading) {
    return <PageLoading layout="fill" />;
  }

  return (
    <section className="admin-dashboard wb-standard-page">
      <header className="wb-library-header"><h1>{t('sidebar.dashboard')}</h1></header>
      <Row className="dashboard-top-modules" gutter={[20, 20]} style={{ marginBottom: 20 }}>
        <Col xs={24} lg={12}>
          <CreateSection onCreateCourse={handleCreateCourse} navigate={navigate} />
        </Col>
        <Col xs={24} lg={12}>
          <AssetSection stats={stats} />
        </Col>
      </Row>
      <RecentSection
        courses={courses}
        coursesLoading={coursesLoading}
        coursesLoadingMore={coursesLoadingMore}
        coursesHasMore={coursesHasMore}
        onCourseClick={handleCourseClick}
        onLoadMoreCourses={loadMoreCourses}
        loadErrors={loadErrors}
        onRetry={{ courses: fetchRecentCourses, images: fetchRecentImages, videos: fetchRecentVideos, audio: fetchRecentAudios }}
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
    </section>
  );
};
