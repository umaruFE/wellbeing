import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';
import { uploadToOss } from '@/lib/oss';

const HAS_OSS_KEYS = !!(process.env.ALIYUN_OSS_ACCESS_KEY_ID && process.env.ALIYUN_OSS_ACCESS_KEY_SECRET);
const UPLOAD_PROVIDER = (process.env.UPLOAD_PROVIDER || 'local').toLowerCase();
const USE_OSS = UPLOAD_PROVIDER === 'oss' && HAS_OSS_KEYS;

async function transferThemeImage(imageUrl: string): Promise<string | null> {
  try {
    let downloadUrl = imageUrl;

    if (imageUrl.startsWith('/')) {
      const COMFYUI_PUBLIC_URL = process.env.COMFYUI_PUBLIC_URL || 'https://vcbj5meqyp1y7ifw-8188.container.x-gpu.com';
      downloadUrl = `${COMFYUI_PUBLIC_URL}${imageUrl}`;
    }

    console.log('[generate-course-overview] 下载主题图片:', downloadUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(downloadUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('[generate-course-overview] 下载图片失败:', response.status);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const urlObj = new URL(downloadUrl);
    const filenameParam = urlObj.searchParams.get('filename') || '';
    const ext = filenameParam.split('.').pop() || 'png';
    const savedFilename = `theme-${Date.now()}.${ext}`;

    if (USE_OSS) {
      const url = await uploadToOss(buffer, 'course-themes', savedFilename);
      console.log('[generate-course-overview] 图片已上传到 OSS:', url);
      return url;
    }

    const fs = await import('fs/promises');
    const path = await import('path');
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
    const baseDir = path.join(process.cwd(), 'public', 'uploads', 'course-themes', String(year), month, day);
    await fs.mkdir(baseDir, { recursive: true });
    await fs.writeFile(path.join(baseDir, uniqueName), buffer);
    const localUrl = `/uploads/course-themes/${year}/${month}/${day}/${uniqueName}`;
    console.log('[generate-course-overview] 图片已保存到本地:', localUrl);
    return localUrl;
  } catch (err) {
    console.error('[generate-course-overview] 转存图片失败:', err);
    return null;
  }
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      age,
      duration,
      scale,
      vocabulary,
      grammar,
      skills,
      paths,
      theme,
      requirements,
      adjustments,
      existingOverview,
      existing_overview,
      courseOverview: inputCourseOverview,
      courseTitle,
      taskName,
      storyContext,
      keyOutcome,
      atmosphere,
      attachments,
      specialRequirements,
      userId,
      organizationId
    } = body;

    console.log('[generate-course-overview] 收到请求:', { theme, duration });

    const n8nPayload = {
      age: age || '7-9岁',
      duration: duration || '60分钟',
      scale: scale || '9-15人',
      vocabulary: vocabulary || [],
      grammar: grammar || [],
      skills: skills || [],
      paths: paths || [],
      theme: theme || '',
      requirements: requirements || specialRequirements || '',
      adjustments: adjustments || '',
      existing_overview: existingOverview || existing_overview || inputCourseOverview
        ? (typeof (existingOverview || existing_overview || inputCourseOverview) === 'string'
            ? (existingOverview || existing_overview || inputCourseOverview)
            : JSON.stringify(existingOverview || existing_overview || inputCourseOverview))
        : '',
      courseTitle: courseTitle || '',
      taskName: taskName || '',
      storyContext: storyContext || '',
      keyOutcome: keyOutcome || '',
      atmosphere: atmosphere || '',
      attachments: attachments || [],
      userId,
      organizationId,
      timestamp: Date.now()
    };

    console.log('[generate-course-overview] 调用 N8N:', { workflow: 'course-overview-generator' });

    const result = await n8nClient.call('course-overview-generator', n8nPayload, { timeout: 300000 });

    console.log('[generate-course-overview] N8N 响应:', JSON.stringify(result, null, 2).substring(0, 500));

    const firstItem = Array.isArray(result) ? result[0] : result;
    const courseOverview = firstItem?.data?.courseOverview || firstItem?.courseOverview || null;
    const rawThemeImageUrl = firstItem?.data?.themeImageUrl || firstItem?.themeImageUrl || null;

    let themeImageUrl = rawThemeImageUrl;
    if (rawThemeImageUrl) {
      themeImageUrl = await transferThemeImage(rawThemeImageUrl);
    }

    if (courseOverview) {
      return NextResponse.json({
        success: true,
        data: { courseOverview, themeImageUrl }
      }, { headers: corsHeaders() });
    }

    return NextResponse.json({
      success: false,
      error: '未能获取课程概览数据'
    }, { status: 500, headers: corsHeaders() });

  } catch (error) {
    console.error('[generate-course-overview] 失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '课程概览生成失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
