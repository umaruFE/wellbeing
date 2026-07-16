import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';
import { uploadToOss } from '@/lib/oss';

const HAS_OSS_KEYS = !!(process.env.ALIYUN_OSS_ACCESS_KEY_ID && process.env.ALIYUN_OSS_ACCESS_KEY_SECRET);
const UPLOAD_PROVIDER = (process.env.UPLOAD_PROVIDER || 'local').toLowerCase();
const USE_OSS = UPLOAD_PROVIDER === 'oss' && HAS_OSS_KEYS;
const ROUTE_VERSION = 'generate-course-overview-2026-06-24-language-forwarding-v2';
const TEXTLESS_THEME_IMAGE_REQUIREMENT = [
  'Theme image requirement:',
  'The cover image must be a textless full-canvas illustration with theme-specific scenery and props.',
  'Avoid listing forbidden text-container object names in themeImagePrompt; use positive composition language such as rich background details, continuous scenery, icons, colors, paths, props, and non-text symbols.',
  'If the course outcome mentions a card, promise, message, writing, or title, represent the idea with scenery, abstract decorative shapes, icons, colors, paths, props, or non-text symbols only.',
].join(' ');

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
    'X-Route-Version': ROUTE_VERSION,
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

function normalizeOutputLanguage(language?: string, outputLanguage?: string) {
  const value = `${outputLanguage || language || ''}`.toLowerCase();
  const isEnglish = value.includes('english') || value === 'en' || value.startsWith('en-');
  return {
    language: isEnglish ? 'en' : 'zh',
    outputLanguage: isEnglish ? 'English' : 'Chinese',
    isEnglish,
  };
}

function buildOutputInstruction(isEnglish: boolean) {
  if (isEnglish) {
    return [
      'Return structured JSON only. Do not include Markdown, explanations, or Chinese text.',
      'All user-facing fields in courseOverview must be written in English, including courseTitle, overallContext, languageGoals, selGoals, permaGoals, finalTask, themeImagePrompt, and every journey field.',
      'themeImagePrompt must describe a textless full-canvas cover illustration. Use positive visual language only: theme-specific scenery, props, icons, colors, paths, background details, and non-text symbols. Do not mention speech bubbles, text boxes, whiteboards, posters, blank panels, or other text-container object names.',
      'courseOverview must include a journey field.',
      'journey must include engage, empower, execute, and elevate.',
      'The class journey must be based on this course theme, story context, language goals, final outcome, and growth goals. Do not use generic template sentences.',
      'Each journey field should be 20-45 English words and include concrete classroom actions.',
    ].join('\n');
  }

  return [
    '请返回结构化 JSON。',
    'courseOverview 中必须包含 journey 字段。',
    'journey 必须包含 engage、empower、execute、elevate 四个字段。',
    '课堂旅程必须基于本课程的主题、故事情境、语言目标、最终成果和成长目标生成，不能使用通用模板句。',
    '每个 journey 字段 35-70 个中文字符，并体现具体课堂动作。',
    'themeImagePrompt 必须描述无文字、全画幅、连续场景的封面插画，只使用与主题相关的场景、道具、图标、颜色、路径和非文字符号。不要在 themeImagePrompt 中提及对话气泡、文本框、白板、海报、空白面板等文字容器名称。',
  ].join('\n');
}

function sanitizeThemeImagePrompt(prompt?: string) {
  return String(prompt || '')
    .replace(/Do not include[^.\n]*(speech bubbles|dialogue balloons|thought bubbles|comic bubbles|text boxes|blank white panels|whiteboards|posters|visual container)[^.\n]*\.?/gi, '')
    .replace(/Absolutely no visible text[^.\n]*\.?/gi, '')
    .replace(/No text,\s*no speech bubbles,\s*no posters,\s*no writing of any kind\.?/gi, 'Textless visual illustration.')
    .replace(/no written whiteboard,\s*no poster text,\s*no speech bubbles\.?/gi, '')
    .replace(/speech bubbles|dialogue balloons|thought bubbles|comic bubbles|callout bubbles|text boxes|empty caption boxes|blank white panels|white rounded rectangles|empty rounded rectangles|blank whiteboards|blank posters|blank signs|whiteboards|posters|display boards|presentation boards|UI panels|comic panels|frames reserved for text|visual containers? designed to hold text/gi, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function enforceTextlessCoverPrompt(prompt?: string) {
  const base = sanitizeThemeImagePrompt(prompt);
  return [
    base || 'Child-friendly classroom course cover illustration.',
    'Textless full-canvas visual illustration only.',
    'Use one continuous scene filled with theme-specific scenery, props, icons, paths, colors, and non-text symbols.',
  ].join('\n');
}

function appendTextlessImageRequirement(value?: string) {
  const text = String(value || '').trim();
  if (!text) return TEXTLESS_THEME_IMAGE_REQUIREMENT;
  return `${text}\n\n${TEXTLESS_THEME_IMAGE_REQUIREMENT}`;
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
      language,
      outputLanguage,
      userId,
      organizationId
    } = body;

    const languageConfig = normalizeOutputLanguage(language, outputLanguage);

    console.log('[generate-course-overview] 收到请求:', {
      version: ROUTE_VERSION,
      theme,
      duration,
      rawLanguage: language,
      rawOutputLanguage: outputLanguage,
      language: languageConfig.language,
      outputLanguage: languageConfig.outputLanguage,
    });

    const n8nPayload = {
      language: languageConfig.language,
      outputLanguage: languageConfig.outputLanguage,
      age: age || '7-9',
      duration: duration || '60',
      scale: scale || '9-15',
      vocabulary: vocabulary || [],
      grammar: grammar || [],
      skills: skills || [],
      paths: paths || [],
      theme: theme || '',
      requirements: appendTextlessImageRequirement(requirements || specialRequirements || ''),
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
      outputInstruction: buildOutputInstruction(languageConfig.isEnglish),
      themeImageInstruction: enforceTextlessCoverPrompt(''),
      routeVersion: ROUTE_VERSION,
      expectedFields: {
        courseOverview: [
          'courseTitle',
          'overallContext',
          'languageGoals',
          'selGoals',
          'permaGoals',
          'finalTask',
          'themeImagePrompt',
          'journey.engage',
          'journey.empower',
          'journey.execute',
          'journey.elevate',
        ],
      },
      userId,
      organizationId,
      timestamp: Date.now()
    };

    console.log('[generate-course-overview] 调用 N8N:', { workflow: 'course-overview-generator' });

    const result = await n8nClient.call('course-overview-generator', n8nPayload, { timeout: 300000 });

    console.log('[generate-course-overview] N8N 响应:', JSON.stringify(result, null, 2).substring(0, 500));

    const firstItem = Array.isArray(result) ? result[0] : result;
    const courseOverview = firstItem?.data?.courseOverview || firstItem?.courseOverview || null;
    if (courseOverview?.themeImagePrompt) {
      courseOverview.themeImagePrompt = enforceTextlessCoverPrompt(courseOverview.themeImagePrompt);
    }
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
