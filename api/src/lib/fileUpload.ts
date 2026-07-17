import { Buffer } from 'node:buffer';
import * as ftp from 'basic-ftp';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { uploadToOss as uploadToOssOriginal, generateFilePath } from './oss';

/**
 * 统一文件上传工具
 * 由 UPLOAD_PROVIDER 显式选择 local、oss 或 ftp，避免 NODE_ENV 与部署环境耦合。
 */

export type UploadProvider = 'local' | 'oss' | 'ftp';

export function getUploadProvider(): UploadProvider {
  const provider = (process.env.UPLOAD_PROVIDER || 'local').trim().toLowerCase();
  if (provider === 'local' || provider === 'oss' || provider === 'ftp') {
    return provider;
  }
  throw new Error(`Unsupported UPLOAD_PROVIDER: ${provider}`);
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required when UPLOAD_PROVIDER=ftp`);
  return value;
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
  const ftpHost = requiredEnv('FTP_HOST');
  const ftpUser = requiredEnv('FTP_USER');
  const ftpPassword = requiredEnv('FTP_PASSWORD');
  const ftpCdnDomain = requiredEnv('FTP_CDN_DOMAIN').replace(/\/+$/, '');
  const ftpBaseDir = requiredEnv('FTP_BASE_DIR').replace(/^\/+|\/+$/g, '');
  const client = new ftp.Client();
  client.ftp.encoding = 'utf-8';

  try {
    await client.access({
      host: ftpHost,
      user: ftpUser,
      password: ftpPassword,
      secure: false,
    });

    const relativePath = generatePath(folder, filename);
    const fullPath = `${ftpBaseDir}/${relativePath}`;
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

    return `${ftpCdnDomain}/${fullPath}`;
  } finally {
    client.close();
  }
}

/**
 * 统一远程上传接口 - 根据 UPLOAD_PROVIDER 选择 OSS 或 FTP
 */
export async function uploadFile(
  file: File | ArrayBuffer | Buffer,
  folder: string,
  filename: string
): Promise<string> {
  const provider = getUploadProvider();
  if (provider === 'ftp') {
    return uploadToFtp(file, folder, filename);
  }
  if (provider === 'oss') {
    return uploadToOssOriginal(file, folder, filename);
  }
  throw new Error('uploadFile does not handle local storage; use saveToLocal instead');
}
