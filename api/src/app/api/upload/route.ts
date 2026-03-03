import { NextRequest, NextResponse } from 'next/server';
import { uploadToOss, getSignedUrl } from '@/lib/oss';
import { saveToLocal } from '@/lib/localUpload';

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

// 本地优先；只有显式指定才使用 OSS
const HAS_OSS_KEYS = !!(process.env.ALIYUN_OSS_ACCESS_KEY_ID && process.env.ALIYUN_OSS_ACCESS_KEY_SECRET);
const UPLOAD_PROVIDER = (process.env.UPLOAD_PROVIDER || 'local').toLowerCase(); // 'local' | 'oss'
const USE_OSS = UPLOAD_PROVIDER === 'oss' && HAS_OSS_KEYS;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json(
        { error: '没有上传文件' },
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        { error: '不支持的文件类型' },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return NextResponse.json(
        { error: `文件大小不能超过${maxSizeMB}MB` },
        { status: 400 }
      );
    }

    let url: string;

    if (USE_OSS) {
      url = await uploadToOss(file, folder, file.name);
    } else {
      if (UPLOAD_PROVIDER === 'oss' && !HAS_OSS_KEYS) {
        console.warn('[upload] UPLOAD_PROVIDER=oss but OSS keys are missing; falling back to local storage.');
      }
      // 本地存储，后续可迁移到 OSS
      url = await saveToLocal(file, folder);
    }

    return NextResponse.json({
      success: true,
      url,
      filename: file.name,
      size: file.size,
      type: file.type
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: '上传失败' },
      { status: 500 }
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
        { status: 400 }
      );
    }

    const url = getSignedUrl(filePath, expires);

    return NextResponse.json({
      url,
      expires
    });
  } catch (error) {
    console.error('Get signed URL error:', error);
    return NextResponse.json(
      { error: '获取访问链接失败' },
      { status: 500 }
    );
  }
}

