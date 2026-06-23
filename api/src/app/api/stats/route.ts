import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';

// GET /api/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/stats - 开始认证');
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401 }
      );
    }

    const user = authResult.user;

    // 并行查询多个统计数据
    const [
      coursesResult,
      pptImagesResult,
      videosResult,
      voicesResult,
      todayCoursesResult,
      todayPptImagesResult,
      todayVideosResult,
      todayVoicesResult,
    ] = await Promise.all([
      // 课程总数
      db.query('SELECT COUNT(*) as count FROM courses').catch(() => ({ rows: [{ count: '0' }] })),
      // 图片素材总数
      db.query('SELECT COUNT(*) as count FROM ppt_images').catch(() => ({ rows: [{ count: '0' }] })),
      // 视频素材总数
      db.query('SELECT COUNT(*) as count FROM videos').catch(() => ({ rows: [{ count: '0' }] })),
      // 音频素材总数
      db.query('SELECT COUNT(*) as count FROM voice_configs').catch(() => ({ rows: [{ count: '0' }] })),
      // 今日新增课程
      db.query("SELECT COUNT(*) as count FROM courses WHERE created_at >= CURRENT_DATE").catch(() => ({ rows: [{ count: '0' }] })),
      // 今日新增图片
      db.query("SELECT COUNT(*) as count FROM ppt_images WHERE created_at >= CURRENT_DATE").catch(() => ({ rows: [{ count: '0' }] })),
      // 今日新增视频
      db.query("SELECT COUNT(*) as count FROM videos WHERE created_at >= CURRENT_DATE").catch(() => ({ rows: [{ count: '0' }] })),
      // 今日新增音频
      db.query("SELECT COUNT(*) as count FROM voice_configs WHERE created_at >= CURRENT_DATE").catch(() => ({ rows: [{ count: '0' }] })),
    ]);

    const totalCourses = parseInt(coursesResult.rows[0]?.count || '0');
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
      media: {
        images: totalImages,
        videos: totalVideos,
        audios: totalAudios,
      },
      tasks: {
        running: 0,
        completed: todayCompleted,
        queued: 0,
      },
      todayCompleted,
      compute: {
        used: 0,
        total: 40000,
        remaining: 40000,
      },
    };

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
