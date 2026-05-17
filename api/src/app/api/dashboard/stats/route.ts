import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401 }
      );
    }

    const user = authResult.user;
    const today = new Date().toISOString().split('T')[0];

    let totalCourses = 0;
    let totalPptImages = 0;
    let totalVideos = 0;
    let totalVoices = 0;
    let todayCourses = 0;
    let todayPptImages = 0;
    let todayVideos = 0;
    let todayVoices = 0;

    try {
      const coursesCount = await db.query('SELECT COUNT(*) as count FROM courses');
      totalCourses = parseInt(coursesCount.rows[0]?.count || '0');
    } catch (e) {
      console.error('Error counting courses:', e);
    }

    try {
      const todayCoursesResult = await db.query(
        "SELECT COUNT(*) as count FROM courses WHERE created_at >= $1",
        [today]
      );
      todayCourses = parseInt(todayCoursesResult.rows[0]?.count || '0');
    } catch (e) {
      console.error('Error counting today courses:', e);
    }

    try {
      const pptImagesCount = await db.query('SELECT COUNT(*) as count FROM ppt_images');
      totalPptImages = parseInt(pptImagesCount.rows[0]?.count || '0');
    } catch (e) {
      console.error('Error counting ppt_images:', e);
    }

    try {
      const todayPptImagesResult = await db.query(
        "SELECT COUNT(*) as count FROM ppt_images WHERE created_at >= $1",
        [today]
      );
      todayPptImages = parseInt(todayPptImagesResult.rows[0]?.count || '0');
    } catch (e) {
      console.error('Error counting today ppt_images:', e);
    }

    try {
      const videosCount = await db.query('SELECT COUNT(*) as count FROM videos');
      totalVideos = parseInt(videosCount.rows[0]?.count || '0');
    } catch (e) {
      console.error('Error counting videos:', e);
    }

    try {
      const todayVideosResult = await db.query(
        "SELECT COUNT(*) as count FROM videos WHERE created_at >= $1",
        [today]
      );
      todayVideos = parseInt(todayVideosResult.rows[0]?.count || '0');
    } catch (e) {
      console.error('Error counting today videos:', e);
    }

    try {
      const voicesCount = await db.query('SELECT COUNT(*) as count FROM voice_configs');
      totalVoices = parseInt(voicesCount.rows[0]?.count || '0');
    } catch (e) {
      console.error('Error counting voice_configs:', e);
    }

    try {
      const todayVoicesResult = await db.query(
        "SELECT COUNT(*) as count FROM voice_configs WHERE created_at >= $1",
        [today]
      );
      todayVoices = parseInt(todayVoicesResult.rows[0]?.count || '0');
    } catch (e) {
      console.error('Error counting today voice_configs:', e);
    }

    const totalAssets = totalPptImages + totalVideos + totalVoices;
    const todayTasks = todayCourses + todayPptImages + todayVideos + todayVoices;

    return NextResponse.json({
      data: {
        assets: {
          total: totalAssets,
          totalCourses,
          totalPptImages,
          totalVideos,
          totalVoices,
        },
        todayTasks: {
          total: todayTasks,
          todayCourses,
          todayPptImages,
          todayVideos,
          todayVoices,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
