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

// The production FTP server limits pending PASV listeners per source IP.
// Keep every FTP transfer in one process-wide queue so concurrent image/task
// requests cannot exhaust that limit.
let ftpUploadQueue: Promise<void> = Promise.resolve();

function enqueueFtpUpload<T>(operation: () => Promise<T>): Promise<T> {
  const queuedOperation = ftpUploadQueue
    .catch(() => undefined)
    .then(operation);
  ftpUploadQueue = queuedOperation.then(() => undefined, () => undefined);
  return queuedOperation;
}

/**
 * 上传文件到 FTP 服务器
 */
async function performFtpUpload(
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
  // This trusted FTP endpoint advertises its internal data-transfer host
  // (10.24.19.203) in PASV responses. Enable it explicitly even if an old
  // PM2 environment still contains the previous `false` value.
  const allowSeparateTransferHost = ftpHost === '114.55.25.62'
    || process.env.FTP_ALLOW_SEPARATE_TRANSFER_HOST === 'true';
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
    const client = new ftp.Client(60000, {
      allowSeparateTransferHost,
    });
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isPasvLimitError = /(?:425|too many pending PASV)/i.test(errorMessage);
        const retryDelay = isPasvLimitError ? attempt * 5000 : attempt * 1500;
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
      }
    } finally {
      client.close();
    }
  }
  throw lastError instanceof Error ? lastError : new Error('FTP upload failed');
}

async function uploadToFtp(
  file: File | ArrayBuffer | Buffer,
  folder: string,
  filename: string
): Promise<string> {
  return enqueueFtpUpload(() => performFtpUpload(file, folder, filename));
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
