import { NextRequest, NextResponse } from 'next/server';
import { getSignedUrl } from '@/lib/oss';
import { getUploadProvider, uploadFile } from '@/lib/fileUpload';
import { saveToLocal } from '@/lib/localUpload';

function getRequestId(request: NextRequest) {
  return request.headers.get('x-request-id') || crypto.randomUUID();
}

function formatUploadError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    };
  }

  return { message: String(error) };
}

// CORS 响应头辅助函数
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// OPTIONS 处理函数 - 处理预检请求
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

// 允许的文件类型（按场景区分）
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const DOC_TYPES = ['application/pdf'];
const VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
  // mkv 在不同浏览器/系统上可能会是这个 MIME
  'video/x-matroska'
];
const AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/flac',
  'audio/ogg',
  'audio/aac',
  'audio/x-m4a',
  'audio/mp4',
  // 某些系统可能会返回这个
  'application/octet-stream'
];

// 最大文件大小
const MAX_SIZE_DEFAULT = 10 * 1024 * 1024; // 10MB（图片/PDF）
const MAX_SIZE_VIDEO = 100 * 1024 * 1024; // 100MB（视频）
const MAX_SIZE_AUDIO = 50 * 1024 * 1024; // 50MB（音频）

function getFileExt(filename: string) {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx + 1).toLowerCase() : '';
}

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  const startedAt = Date.now();
  console.log(`[upload:${requestId}] request received`, {
    contentType: request.headers.get('content-type'),
    contentLength: request.headers.get('content-length'),
    forwardedFor: request.headers.get('x-forwarded-for'),
  });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      console.warn(`[upload:${requestId}] rejected: no file`, { folder });
      return NextResponse.json(
        { error: '没有上传文件' },
        { status: 400, headers: { ...corsHeaders(), 'X-Request-Id': requestId } }
      );
    }

    console.log(`[upload:${requestId}] file parsed`, {
      folder,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
    });

    // 按上传场景选择允许的类型与大小限制
    const isVideoUpload =
      folder.toLowerCase().includes('video') ||
      file.type.startsWith('video/');

    const isAudioUpload =
      folder.toLowerCase().includes('audio') ||
      file.type.startsWith('audio/');

    let allowedTypes: string[];
    let maxSize: number;

    if (isVideoUpload) {
      allowedTypes = VIDEO_TYPES;
      maxSize = MAX_SIZE_VIDEO;
    } else if (isAudioUpload) {
      allowedTypes = AUDIO_TYPES;
      maxSize = MAX_SIZE_AUDIO;
    } else {
      allowedTypes = [...IMAGE_TYPES, ...DOC_TYPES];
      maxSize = MAX_SIZE_DEFAULT;
    }

    // 验证文件类型
    // 注意：部分浏览器/系统对某些格式会返回 application/octet-stream，这里做一次基于后缀的兜底
    const ext = getFileExt(file.name);
    const isOctetStream = file.type === 'application/octet-stream';

    let octetStreamAllowed = false;
    if (isVideoUpload && isOctetStream) {
      octetStreamAllowed = ['mp4', 'webm', 'ogg', 'mov', 'mkv'].includes(ext);
    } else if (isAudioUpload && isOctetStream) {
      octetStreamAllowed = ['mp3', 'wav', 'flac', 'ogg', 'aac', 'm4a'].includes(ext);
    }

    if (!allowedTypes.includes(file.type) && !octetStreamAllowed) {
      console.warn(`[upload:${requestId}] rejected: unsupported file type`, {
        folder,
        filename: file.name,
        mimeType: file.type,
        extension: ext,
      });
      return NextResponse.json(
        { error: '不支持的文件类型' },
        { status: 400, headers: { ...corsHeaders(), 'X-Request-Id': requestId } }
      );
    }

    // 验证文件大小
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      console.warn(`[upload:${requestId}] rejected: file too large`, {
        filename: file.name,
        size: file.size,
        maxSize,
      });
      return NextResponse.json(
        { error: `文件大小不能超过${maxSizeMB}MB` },
        { status: 400, headers: { ...corsHeaders(), 'X-Request-Id': requestId } }
      );
    }

    let url: string;

    const uploadProvider = getUploadProvider();
    console.log(`[upload:${requestId}] storage upload started`, {
      provider: uploadProvider,
      folder,
      filename: file.name,
    });
    if (uploadProvider === 'ftp' || uploadProvider === 'oss') {
      url = await uploadFile(file, folder, file.name);
    } else {
      // 本地存储
      url = await saveToLocal(file, folder);
    }

    console.log(`[upload:${requestId}] upload completed`, {
      provider: uploadProvider,
      folder,
      filename: file.name,
      size: file.size,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({
      success: true,
      url,
      filename: file.name,
      size: file.size,
      type: file.type
    }, { headers: { ...corsHeaders(), 'X-Request-Id': requestId } });
  } catch (error) {
    console.error(`[upload:${requestId}] upload failed`, {
      durationMs: Date.now() - startedAt,
      error: formatUploadError(error),
    });
    return NextResponse.json(
      { error: '上传失败', requestId },
      { status: 500, headers: { ...corsHeaders(), 'X-Request-Id': requestId } }
    );
  }
}

// 获取文件的签名URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('path');
    const expires = parseInt(searchParams.get('expires') || '3600');

    if (!filePath) {
      return NextResponse.json(
        { error: '缺少文件路径' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const url = getSignedUrl(filePath, expires);

    return NextResponse.json({
      url,
      expires
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('Get signed URL error:', error);
    return NextResponse.json(
      { error: '获取访问链接失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
