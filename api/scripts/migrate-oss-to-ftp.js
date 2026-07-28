#!/usr/bin/env node

/**
 * Migrate legacy Aliyun OSS URLs in production courses and picture books to
 * the currently configured upload provider (FTP in production).
 *
 * Dry run:
 *   MIGRATION_USERNAME=... MIGRATION_PASSWORD=... node scripts/migrate-oss-to-ftp.js
 *
 * Apply:
 *   MIGRATION_USERNAME=... MIGRATION_PASSWORD=... node scripts/migrate-oss-to-ftp.js --apply
 *
 * After deploying the PPT image update route, include legacy PPT library rows:
 *   ... node scripts/migrate-oss-to-ftp.js --apply --include-ppt-images
 *
 * Set MIGRATION_DIRECT_FTP=true plus FTP_HOST/FTP_USER/FTP_PASSWORD,
 * FTP_CDN_DOMAIN and FTP_BASE_DIR to bypass a reverse-proxy upload limit.
 */

const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');
const OSS = require('ali-oss');
const ftp = require('basic-ftp');

const APPLY = process.argv.includes('--apply');
const INCLUDE_PPT_IMAGES = process.argv.includes('--include-ppt-images');
const API_BASE_URL = (process.env.MIGRATION_API_BASE_URL || 'http://wellbeing.newstaredu.cn')
  .replace(/\/+$/, '');
const URL_PATTERN = /https?:\/\/[^\s"'<>\\]+/g;
const BACKUP_DIR = path.join(__dirname, '..', '.migration-backups');
const DIRECT_FTP = process.env.MIGRATION_DIRECT_FTP === 'true';

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function loadEnvFile(filename) {
  if (!fs.existsSync(filename)) return;
  for (const line of fs.readFileSync(filename, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

function ossHosts() {
  return new Set([
    process.env.ALIYUN_OSS_ENDPOINT || 'wellbeing1.oss-cn-beijing.aliyuncs.com',
    'wellbeing1.oss-cn-beijing.aliyuncs.com',
  ]);
}

function isLegacyOssUrl(value) {
  try {
    return ossHosts().has(new URL(value).host);
  } catch {
    return false;
  }
}

function collectLegacyUrls(value, output = []) {
  if (typeof value === 'string') {
    for (const match of value.matchAll(URL_PATTERN)) {
      if (isLegacyOssUrl(match[0])) output.push(match[0]);
    }
  } else if (Array.isArray(value)) {
    for (const item of value) collectLegacyUrls(item, output);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectLegacyUrls(item, output);
  }
  return output;
}

function replaceLegacyUrls(value, replacements) {
  if (typeof value === 'string') {
    return value.replace(URL_PATTERN, (url) => replacements.get(url) || url);
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceLegacyUrls(item, replacements));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        replaceLegacyUrls(item, replacements),
      ]),
    );
  }
  return value;
}

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    throw new Error(
      `${options.method || 'GET'} ${endpoint} failed: HTTP ${response.status} `
      + `${typeof body === 'string' ? body.slice(0, 300) : JSON.stringify(body)}`,
    );
  }
  return body;
}

async function login() {
  const body = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      username: requireEnv('MIGRATION_USERNAME'),
      password: requireEnv('MIGRATION_PASSWORD'),
    }),
  });
  if (!body?.token) throw new Error('Login succeeded without a token');
  return body.token;
}

async function fetchAll(endpoint, token, limit = 200) {
  const rows = [];
  for (let page = 1; ; page += 1) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const body = await request(
      `${endpoint}${separator}page=${page}&limit=${limit}`,
      { headers: { authorization: `Bearer ${token}` } },
    );
    rows.push(...(body.data || []));
    if (!body.pagination || page >= body.pagination.totalPages) break;
  }
  return rows;
}

function createOssClient() {
  return new OSS({
    region: requireEnv('ALIYUN_OSS_REGION'),
    bucket: requireEnv('ALIYUN_OSS_BUCKET'),
    accessKeyId: requireEnv('ALIYUN_OSS_ACCESS_KEY_ID'),
    accessKeySecret: requireEnv('ALIYUN_OSS_ACCESS_KEY_SECRET'),
    timeout: 60000,
  });
}

function objectKeyFromUrl(rawUrl) {
  return decodeURIComponent(new URL(rawUrl).pathname.replace(/^\/+/, ''));
}

function mimeType(filename, fallback) {
  if (fallback && fallback !== 'application/octet-stream') return fallback;
  const extension = path.extname(filename).toLowerCase();
  return {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
  }[extension] || 'application/octet-stream';
}

function uploadLimit(objectKey, contentType) {
  if (objectKey.toLowerCase().includes('video') || contentType.startsWith('video/')) {
    return 100 * 1024 * 1024;
  }
  if (objectKey.toLowerCase().includes('audio') || contentType.startsWith('audio/')) {
    return 50 * 1024 * 1024;
  }
  return 10 * 1024 * 1024;
}

async function preflightObjects(oss, legacyUrls) {
  const byObject = new Map(
    legacyUrls.map((legacyUrl) => [objectKeyFromUrl(legacyUrl), legacyUrl]),
  );
  const entries = [...byObject.keys()];
  let bytes = 0;
  const errors = [];

  for (let index = 0; index < entries.length; index += 10) {
    await Promise.all(entries.slice(index, index + 10).map(async (objectKey) => {
      try {
        const result = await oss.head(objectKey);
        const size = Number(result.res?.headers?.['content-length'] || 0);
        const contentType = mimeType(
          objectKey,
          result.res?.headers?.['content-type'],
        );
        bytes += size;
        if (size > uploadLimit(objectKey, contentType)) {
          errors.push(`${objectKey}: ${size} bytes exceeds production upload limit`);
        }
      } catch (error) {
        errors.push(`${objectKey}: ${error.code || error.message}`);
      }
    }));
  }

  if (errors.length) {
    throw new Error(`OSS preflight failed:\n${errors.join('\n')}`);
  }
  return { objects: entries.length, bytes };
}

async function createFtpClient() {
  const client = new ftp.Client(60000);
  client.ftp.encoding = 'utf-8';
  await client.access({
    host: requireEnv('FTP_HOST'),
    port: Number(process.env.FTP_PORT || 21),
    user: requireEnv('FTP_USER'),
    password: requireEnv('FTP_PASSWORD'),
    secure: process.env.FTP_SECURE === 'true',
  });
  return client;
}

async function verifyPublicUrl(url) {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, { method: 'HEAD' });
    lastStatus = response.status;
    if (response.ok) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Uploaded file is not publicly readable: ${url} (HTTP ${lastStatus})`);
}

async function uploadObject(oss, legacyUrl, token, ftpClient) {
  const objectKey = objectKeyFromUrl(legacyUrl);
  const result = await oss.get(objectKey);
  const buffer = Buffer.isBuffer(result.content)
    ? result.content
    : Buffer.from(result.content);
  const filename = path.basename(objectKey);
  const folder = objectKey.split('/')[0] || 'uploads';
  const contentType = mimeType(filename, result.res?.headers?.['content-type']);

  let uploadedUrl;
  if (DIRECT_FTP) {
    const ftpBaseDir = requireEnv('FTP_BASE_DIR').replace(/^\/+|\/+$/g, '');
    const ftpCdnDomain = requireEnv('FTP_CDN_DOMAIN').replace(/\/+$/, '');
    const remotePath = `${ftpBaseDir}/${objectKey}`;
    let existingSize = -1;
    try {
      existingSize = await ftpClient.size(`/${remotePath}`);
    } catch {
      // The target does not exist yet.
    }
    if (existingSize !== buffer.length) {
      await ftpClient.ensureDir(`/${path.posix.dirname(remotePath)}`);
      await ftpClient.uploadFrom(Readable.from(buffer), path.posix.basename(remotePath));
    }
    uploadedUrl = `${ftpCdnDomain}/${remotePath}`;
  } else {
    const form = new FormData();
    form.append('file', new Blob([buffer], { type: contentType }), filename);
    form.append('folder', folder);
    const body = await request('/api/upload', {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: form,
    });
    uploadedUrl = body?.url;
  }
  if (!uploadedUrl || isLegacyOssUrl(uploadedUrl)) {
    throw new Error(`Upload did not return a stable provider URL for ${objectKey}`);
  }
  await verifyPublicUrl(uploadedUrl);
  return uploadedUrl;
}

function writeBackup(payload) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(BACKUP_DIR, `oss-to-ftp-${stamp}.json`);
  fs.writeFileSync(filename, `${JSON.stringify(payload, null, 2)}\n`, {
    mode: 0o600,
  });
  return filename;
}

async function main() {
  loadEnvFile(path.join(__dirname, '..', '.env'));
  const token = await login();
  const [courses, pictureBooks, pptImages] = await Promise.all([
    fetchAll('/api/courses', token),
    fetchAll('/api/picture-books', token),
    fetchAll('/api/ppt-images', token),
  ]);

  const sources = { courses, pictureBooks, pptImages };
  const affected = Object.fromEntries(
    Object.entries(sources).map(([name, rows]) => [
      name,
      rows.filter((row) => collectLegacyUrls(row).length > 0).length,
    ]),
  );
  // Only include resources that the current production API can update.
  // ppt_images is inventoried and reported, but its route currently has no
  // update operation, so uploading those objects would create unused files.
  const legacyUrls = [
    ...new Set([
      ...collectLegacyUrls(courses),
      ...collectLegacyUrls(pictureBooks),
      ...(INCLUDE_PPT_IMAGES ? collectLegacyUrls(pptImages) : []),
    ]),
  ];
  const uniqueObjects = new Set(legacyUrls.map(objectKeyFromUrl));
  const oss = createOssClient();
  const preflight = await preflightObjects(oss, legacyUrls);

  console.log(JSON.stringify({
    mode: APPLY ? 'apply' : 'dry-run',
    rows: Object.fromEntries(
      Object.entries(sources).map(([name, rows]) => [name, rows.length]),
    ),
    affected,
    legacyUrlVariants: legacyUrls.length,
    uniqueObjects: uniqueObjects.size,
    totalMiB: Number((preflight.bytes / 1024 / 1024).toFixed(2)),
  }, null, 2));

  if (!APPLY) return;

  const backupFile = writeBackup({
    createdAt: new Date().toISOString(),
    apiBaseUrl: API_BASE_URL,
    sources,
  });
  console.log(`Backup: ${backupFile}`);

  const replacementByObject = new Map();
  const replacements = new Map();
  const ftpClient = DIRECT_FTP ? await createFtpClient() : null;
  let uploaded = 0;

  try {
    for (const legacyUrl of legacyUrls) {
      const objectKey = objectKeyFromUrl(legacyUrl);
      let newUrl = replacementByObject.get(objectKey);
      if (!newUrl) {
        newUrl = await uploadObject(oss, legacyUrl, token, ftpClient);
        replacementByObject.set(objectKey, newUrl);
        uploaded += 1;
        console.log(`Uploaded ${uploaded}/${uniqueObjects.size}: ${objectKey}`);
      }
      replacements.set(legacyUrl, newUrl);
    }
  } finally {
    ftpClient?.close();
  }

  let updatedCourses = 0;
  for (const course of courses) {
    const courseFields = [
      ['courseData', course.course_data ?? course.courseData],
      ['canvasData', course.canvas_data ?? course.canvasData],
      [
        'readingMaterialsData',
        course.reading_materials_data ?? course.readingMaterialsData,
      ],
    ];
    const updateBody = Object.fromEntries(
      courseFields
        .filter(([, value]) => collectLegacyUrls(value).length > 0)
        .map(([key, value]) => [key, replaceLegacyUrls(value, replacements)]),
    );
    if (!Object.keys(updateBody).length) continue;
    await request(`/api/courses/${encodeURIComponent(course.id)}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(updateBody),
    });
    updatedCourses += 1;
  }

  let updatedPictureBooks = 0;
  for (const book of pictureBooks) {
    const relevant = { cover_url: book.cover_url, book_data: book.book_data };
    if (!collectLegacyUrls(relevant).length) continue;
    await request(`/api/picture-books/${encodeURIComponent(book.id)}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        coverUrl: replaceLegacyUrls(book.cover_url, replacements),
        bookData: replaceLegacyUrls(book.book_data, replacements),
      }),
    });
    updatedPictureBooks += 1;
  }

  let updatedPptImages = 0;
  if (INCLUDE_PPT_IMAGES) {
    for (const image of pptImages) {
      if (!collectLegacyUrls(image.image_url).length) continue;
      await request(`/api/ppt-images/${encodeURIComponent(image.id)}`, {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: replaceLegacyUrls(image.image_url, replacements),
        }),
      });
      updatedPptImages += 1;
    }
  }

  const [verifiedCourses, verifiedPictureBooks, verifiedPptImages] = await Promise.all([
    fetchAll('/api/courses', token),
    fetchAll('/api/picture-books', token),
    fetchAll('/api/ppt-images', token),
  ]);
  const remaining = {
    courses: collectLegacyUrls(verifiedCourses).length,
    pictureBooks: collectLegacyUrls(verifiedPictureBooks).length,
    ...(INCLUDE_PPT_IMAGES
      ? { pptImages: collectLegacyUrls(verifiedPptImages).length }
      : {}),
  };
  if (Object.values(remaining).some((count) => count > 0)) {
    throw new Error(`Verification failed; legacy URLs remain: ${JSON.stringify(remaining)}`);
  }

  console.log(JSON.stringify({
    uploaded,
    updatedCourses,
    updatedPictureBooks,
    updatedPptImages,
    remaining,
    note: affected.pptImages && !INCLUDE_PPT_IMAGES
      ? `${affected.pptImages} ppt_images rows require a separate update-capable endpoint`
      : undefined,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
