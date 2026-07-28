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
  const ftpPort = Number(process.env.FTP_PORT || 21);
  const ftpSecure = process.env.FTP_SECURE === 'true';
  let buffer: Buffer;
  if (file && typeof (file as any).arrayBuffer === 'function') {
    buffer = Buffer.from(await (file as File).arrayBuffer());
  } else if (file instanceof ArrayBuffer) {
    buffer = Buffer.from(file);
  } else {
    buffer = file as Buffer;
  }

  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const client = new ftp.Client(60000);
    client.ftp.encoding = 'utf-8';
    try {
      await client.access({
        host: ftpHost,
        port: ftpPort,
        user: ftpUser,
        password: ftpPassword,
        secure: ftpSecure,
      });

      const relativePath = generatePath(folder, filename);
      const fullPath = `${ftpBaseDir}/${relativePath}`;
      await client.ensureDir(`/${path.dirname(fullPath)}`);
      await client.uploadFrom(Readable.from(buffer), path.basename(fullPath));
      return `${ftpCdnDomain}/${fullPath}`;
    } catch (error) {
      lastError = error;
      console.error(`[fileUpload] FTP upload attempt ${attempt}/3 failed:`, error);
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
      }
    } finally {
      client.close();
    }
  }
  throw lastError instanceof Error ? lastError : new Error('FTP upload failed');
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
