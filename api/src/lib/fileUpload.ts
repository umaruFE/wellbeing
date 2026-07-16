import { Buffer } from 'node:buffer';
import * as ftp from 'basic-ftp';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { uploadToOss as uploadToOssOriginal, generateFilePath } from './oss';

/**
 * 统一文件上传工具
 * - 生产环境 (NODE_ENV=production): 上传到 FTP 服务器 z.dhr.dhredu.cn/wellbeing/
 * - 开发环境: 上传到阿里云 OSS
 */

const FTP_HOST = process.env.FTP_HOST || '114.55.25.62';
const FTP_USER = process.env.FTP_USER || 'z.dhr.dhredu.cn';
const FTP_PASSWORD = process.env.FTP_PASSWORD || '@2026#z.dhr.dhredu.cn_01_13*@';
const FTP_CDN_DOMAIN = process.env.FTP_CDN_DOMAIN || 'https://z.dhr.dhredu.cn';
const FTP_BASE_DIR = process.env.FTP_BASE_DIR || 'wellbeing';

export function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/**
 * 生成文件路径（通用）
 */
export function generatePath(folder: string, filename: string): string {
  return generateFilePath(folder, filename);
}

/**
 * 上传文件到 FTP 服务器
 */
async function uploadToFtp(
  file: File | ArrayBuffer | Buffer,
  folder: string,
  filename: string
): Promise<string> {
  const client = new ftp.Client();
  client.ftp.encoding = 'utf-8';

  try {
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
      secure: false,
    });

    const relativePath = generatePath(folder, filename);
    const fullPath = `${FTP_BASE_DIR}/${relativePath}`;
    const dirParts = path.dirname(fullPath).split('/');
    const fileName = path.basename(fullPath);

    // Create nested directories
    for (const dir of dirParts) {
      try {
        await client.ensureDir(dir);
      } catch {
        // dir might already exist
      }
    }

    // Convert file to Buffer -> stream
    let buffer: Buffer;
    if (file && typeof (file as any).arrayBuffer === 'function') {
      buffer = Buffer.from(await (file as File).arrayBuffer());
    } else if (file instanceof ArrayBuffer) {
      buffer = Buffer.from(file);
    } else {
      buffer = file as Buffer;
    }

    const stream = Readable.from(buffer);
    await client.uploadFrom(stream, fileName);

    return `${FTP_CDN_DOMAIN}/${fullPath}`;
  } finally {
    client.close();
  }
}

/**
 * 统一上传接口 - 根据环境自动选择 OSS 或 FTP
 */
export async function uploadFile(
  file: File | ArrayBuffer | Buffer,
  folder: string,
  filename: string
): Promise<string> {
  if (isProduction()) {
    return uploadToFtp(file, folder, filename);
  }
  return uploadToOssOriginal(file, folder, filename);
}
