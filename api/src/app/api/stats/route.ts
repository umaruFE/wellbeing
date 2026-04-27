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
      mediaResult,
      tasksResult,
      todayTasksResult
    ] = await Promise.all([
      // 课程总数
      db.query('SELECT COUNT(*) as count FROM courses'),
      // 素材总数（从 course_data 中统计图片和视频）
      db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE course_data->'slides' IS NOT NULL) as image_count,
          COUNT(*) FILTER (WHERE course_data->'videos' IS NOT NULL) as video_count,
          COUNT(*) FILTER (WHERE course_data->'audios' IS NOT NULL) as audio_count
        FROM courses
        WHERE course_data IS NOT NULL
      `),
      // 任务总数（查询最近的任务记录）
      db.query(`
        SELECT 
          COUNT(*) FILTER (WHERE status IN ('pending', 'processing', 'running')) as running,
          COUNT(*) FILTER (WHERE status = 'completed') as completed,
          COUNT(*) FILTER (WHERE status = 'queued') as queued
        FROM prompt_history
        WHERE created_at >= NOW() - INTERVAL '7 days'
      `),
      // 今日完成的任务数
      db.query(`
        SELECT COUNT(*) as count 
        FROM prompt_history 
        WHERE status = 'completed' 
        AND DATE(created_at) = CURRENT_DATE
      `)
    ]);

    // 获取算力使用情况（从环境变量或默认配置）
    const computeUsed = 2847; // 可从 Redis 或数据库获取
    const computeTotal = 40000;

    const stats = {
      courses: {
        total: parseInt(coursesResult.rows[0]?.count || '0')
      },
      media: {
        images: parseInt(mediaResult.rows[0]?.image_count || '0'),
        videos: parseInt(mediaResult.rows[0]?.video_count || '0'),
        audios: parseInt(mediaResult.rows[0]?.audio_count || '0')
      },
      tasks: {
        running: parseInt(tasksResult.rows[0]?.running || '0'),
        completed: parseInt(tasksResult.rows[0]?.completed || '0'),
        queued: parseInt(tasksResult.rows[0]?.queued || '0')
      },
      todayCompleted: parseInt(todayTasksResult.rows[0]?.count || '0'),
      compute: {
        used: computeUsed,
        total: computeTotal,
        remaining: computeTotal - computeUsed
      }
    };

    return NextResponse.json({ data: stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
