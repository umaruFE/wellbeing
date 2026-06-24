import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';
import { uploadToOss } from '@/lib/oss';
import { db } from '@/lib/db';

const HAS_OSS_KEYS = !!(process.env.ALIYUN_OSS_ACCESS_KEY_ID && process.env.ALIYUN_OSS_ACCESS_KEY_SECRET);
const UPLOAD_PROVIDER = (process.env.UPLOAD_PROVIDER || 'local').toLowerCase();
const USE_OSS = UPLOAD_PROVIDER === 'oss' && HAS_OSS_KEYS;

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

function enforceTextlessCoverPrompt(prompt: string) {
  return [
    String(prompt || '').trim() || 'Child-friendly classroom course cover illustration.',
    'Create a pure visual illustration only.',
    'The image must be a full-bleed single continuous environment scene, not a comic page, worksheet, presentation slide, UI layout, or template.',
    'Fill the canvas with scenery, props, paths, plants, stars, icons, and abstract decorative symbols instead of blank areas.',
    'Absolutely no visible text of any language: no Chinese characters, no letters, no numbers, no title, no caption, no labels, no signs, no logo, no watermark.',
    'Do not include speech bubbles, dialogue balloons, thought bubbles, comic bubbles, callout bubbles, text boxes, empty caption boxes, blank white panels, white rounded rectangles, empty rounded rectangles, blank boards, blank signs, blank cards, whiteboards, posters, display boards, presentation boards, UI panels, comic panels, frames reserved for text, or any visual container designed to hold text.',
  ].join('\n');
}

async function transferThemeImage(imageUrl: string): Promise<string | null> {
  try {
    let downloadUrl = imageUrl;
    if (imageUrl.startsWith('/')) {
      const COMFYUI_PUBLIC_URL = process.env.COMFYUI_PUBLIC_URL || 'https://vcbj5meqyp1y7ifw-8188.container.x-gpu.com';
      downloadUrl = `${COMFYUI_PUBLIC_URL}${imageUrl}`;
    }

    console.log('[regenerate-theme-image] 下载主题图片:', downloadUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(downloadUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const urlObj = new URL(downloadUrl);
    const filenameParam = urlObj.searchParams.get('filename') || '';
    const ext = filenameParam.split('.').pop() || 'png';
    const savedFilename = `theme-${Date.now()}.${ext}`;

    if (USE_OSS) {
      return await uploadToOss(buffer, 'course-themes', savedFilename);
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
    return `/uploads/course-themes/${year}/${month}/${day}/${uniqueName}`;
  } catch (err) {
    console.error('[regenerate-theme-image] 转存图片失败:', err);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, themeImagePrompt } = body;

    if (!themeImagePrompt) {
      return NextResponse.json(
        { success: false, error: '缺少 themeImagePrompt 参数' },
        { status: 400, headers: corsHeaders() }
      );
    }

    console.log('[regenerate-theme-image] 调用 N8N 工作流: course-theme-image-generator');

    const result = await n8nClient.call(
      'course-theme-image-generator',
      { themeImagePrompt: enforceTextlessCoverPrompt(themeImagePrompt) },
      { timeout: 300000 }
    );

    console.log('[regenerate-theme-image] N8N 响应:', JSON.stringify(result, null, 2).substring(0, 500));

    const firstItem = Array.isArray(result) ? result[0] : result;
    const rawThemeImageUrl = firstItem?.data?.themeImageUrl || firstItem?.themeImageUrl || null;

    if (!rawThemeImageUrl) {
      return NextResponse.json(
        { success: false, error: '图片生成失败' },
        { status: 500, headers: corsHeaders() }
      );
    }

    let themeImageUrl = await transferThemeImage(rawThemeImageUrl);

    if (!themeImageUrl) {
      themeImageUrl = rawThemeImageUrl;
    }

    console.log('[regenerate-theme-image] 图片已保存:', themeImageUrl);

    if (courseId) {
      try {
        const existing = await db.query('SELECT course_data FROM courses WHERE id = $1', [courseId]);
        const existingData = existing.rows[0]?.course_data || {};
        const parsedData = typeof existingData === 'string' ? JSON.parse(existingData) : existingData;
        parsedData.themeImageUrl = themeImageUrl;
        await db.query('UPDATE courses SET course_data = $1, updated_at = $2 WHERE id = $3', [
          JSON.stringify(parsedData),
          new Date().toISOString(),
          courseId
        ]);
        console.log('[regenerate-theme-image] 数据库已更新');
      } catch (dbErr) {
        console.error('[regenerate-theme-image] 数据库更新失败:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      themeImageUrl
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('[regenerate-theme-image] 失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '图片生成失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
