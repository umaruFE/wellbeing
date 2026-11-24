import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';

// GET /api/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401 }
      );
    }

    // 并行查询多个统计数据
    const [
      coursesResult,
      pictureBooksResult,
      pptImagesResult,
      videosResult,
      voicesResult,
      todayCoursesResult,
      todayPptImagesResult,
      todayVideosResult,
      todayVoicesResult,
      tasksResult,
    ] = await Promise.all([
      // 课程总数
      db.query('SELECT COUNT(*) as count FROM courses'),
      // 绘本总数
      db.query('SELECT COUNT(*) as count FROM picture_books'),
      // 图片素材总数
      db.query('SELECT COUNT(*) as count FROM ppt_images'),
      // 视频素材总数
      db.query('SELECT COUNT(*) as count FROM videos'),
      // 音频素材总数
      db.query('SELECT COUNT(*) as count FROM voice_configs'),
      // 今日新增课程
      db.query("SELECT COUNT(*) as count FROM courses WHERE created_at >= CURRENT_DATE"),
      // 今日新增图片
      db.query("SELECT COUNT(*) as count FROM ppt_images WHERE created_at >= CURRENT_DATE"),
      // 今日新增视频
      db.query("SELECT COUNT(*) as count FROM videos WHERE created_at >= CURRENT_DATE"),
      // 今日新增音频
      db.query("SELECT COUNT(*) as count FROM voice_configs WHERE created_at >= CURRENT_DATE"),
      db.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'running')::int AS running,
           COUNT(*) FILTER (WHERE status = 'queued')::int AS queued,
           COUNT(*) FILTER (WHERE status = 'succeeded' AND finished_at >= CURRENT_DATE)::int AS completed
         FROM generation_tasks WHERE user_id = $1`,
        [authResult.user?.id],
      ).catch((error: { code?: string }) => {
        if (error.code === '42P01') return null;
        throw error;
      }),
    ]);

    const totalCourses = parseInt(coursesResult.rows[0]?.count || '0');
    const totalPictureBooks = parseInt(pictureBooksResult.rows[0]?.count || '0');
    const totalImages = parseInt(pptImagesResult.rows[0]?.count || '0');
    const totalVideos = parseInt(videosResult.rows[0]?.count || '0');
    const totalAudios = parseInt(voicesResult.rows[0]?.count || '0');

    const todayCourses = parseInt(todayCoursesResult.rows[0]?.count || '0');
    const todayImages = parseInt(todayPptImagesResult.rows[0]?.count || '0');
    const todayVideos = parseInt(todayVideosResult.rows[0]?.count || '0');
    const todayAudios = parseInt(todayVoicesResult.rows[0]?.count || '0');

    const todayCompleted = todayCourses + todayImages + todayVideos + todayAudios;

    const stats = {
      courses: {
        total: totalCourses,
      },
      content: {
        total: totalCourses + totalPictureBooks,
        courses: totalCourses,
        pictureBooks: totalPictureBooks,
      },
      media: {
        images: totalImages,
        videos: totalVideos,
        audios: totalAudios,
      },
      tasks: tasksResult?.rows[0] ?? null,
      todayCompleted,
      compute: null,
    };

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: '后台统计暂时不可用' },
      { status: 500 }
    );
  }
}
