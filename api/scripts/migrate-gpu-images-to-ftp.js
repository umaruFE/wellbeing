#!/usr/bin/env node

/**
 * Persist legacy ComfyUI/GPU image URLs into FTP and replace production
 * database references. Safe to rerun: remote paths are deterministic.
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');
const ftp = require('basic-ftp');

const APPLY = process.argv.includes('--apply');
const API_BASE_URL = (process.env.MIGRATION_API_BASE_URL || 'http://wellbeing.newstaredu.cn')
  .replace(/\/+$/, '');
const UPLOAD_BASE_URL = (process.env.MIGRATION_UPLOAD_BASE_URL || API_BASE_URL)
  .replace(/\/+$/, '');
const GPU_HOST_SUFFIX = '.container.x-gpu.com';
const BACKUP_DIR = path.join(__dirname, '..', '.migration-backups');
const DIRECT_FTP = process.env.MIGRATION_DIRECT_FTP === 'true';

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

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function request(endpoint, options = {}) {
  return requestUrl(`${API_BASE_URL}${endpoint}`, endpoint, options);
}

async function requestUrl(url, label, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!response.ok) {
    const error = new Error(
      `${options.method || 'GET'} ${label} failed: HTTP ${response.status} `
      + `${typeof body === 'string' ? body.slice(0, 200) : JSON.stringify(body)}`,
    );
    error.status = response.status;
    throw error;
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
  return body.token;
}

async function fetchAll(endpoint, token) {
  const rows = [];
  for (let page = 1; ; page += 1) {
    const body = await request(`${endpoint}?page=${page}&limit=200`, {
      headers: { authorization: `Bearer ${token}` },
    });
    rows.push(...(body.data || []));
    if (!body.pagination || page >= body.pagination.totalPages) break;
  }
  return rows;
}

function gpuSource(value) {
  if (typeof value !== 'string') return null;
  try {
    const parsed = new URL(value, API_BASE_URL);
    const inner = parsed.searchParams.get('url');
    if (inner) {
      const innerUrl = new URL(inner);
      if (
        innerUrl.host.endsWith(GPU_HOST_SUFFIX)
        && innerUrl.pathname.includes('/view')
      ) return innerUrl.href;
    }
    if (
      parsed.host.endsWith(GPU_HOST_SUFFIX)
      && parsed.pathname.includes('/view')
    ) return parsed.href;
  } catch {
    return null;
  }
  return null;
}

function collectGpuSources(value, output = []) {
  if (typeof value === 'string') {
    const source = gpuSource(value);
    if (source) output.push(source);
  } else if (Array.isArray(value)) {
    for (const item of value) collectGpuSources(item, output);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectGpuSources(item, output);
  }
  return output;
}

function replaceGpuSources(value, replacements) {
  if (typeof value === 'string') {
    const source = gpuSource(value);
    return source ? replacements.get(source) || value : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => replaceGpuSources(item, replacements));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        replaceGpuSources(item, replacements),
      ]),
    );
  }
  return value;
}

function safeFilename(source) {
  const url = new URL(source);
  const original = url.searchParams.get('filename') || path.posix.basename(url.pathname);
  const cleaned = (original || 'image.png').replace(/[^A-Za-z0-9._-]/g, '_');
  const hash = crypto.createHash('sha256').update(source).digest('hex').slice(0, 12);
  return `${hash}-${cleaned}`;
}

async function createFtpClient() {
  const client = new ftp.Client(60000, {
    allowSeparateTransferHost: process.env.FTP_ALLOW_SEPARATE_TRANSFER_HOST === 'true',
  });
  await client.access({
    host: requireEnv('FTP_HOST'),
    port: Number(process.env.FTP_PORT || 21),
    user: requireEnv('FTP_USER'),
    password: requireEnv('FTP_PASSWORD'),
    secure: process.env.FTP_SECURE === 'true',
  });
  return client;
}

async function publicUrlWorks(url) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) return true;
    } catch {
      // Retry transient DNS/CDN errors.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function downloadSource(source) {
  let lastError;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(source, {
        signal: AbortSignal.timeout(45000),
        headers: { 'User-Agent': 'Wellbeing-GPU-Migration/1.0' },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) {
        throw new Error(`unexpected content type ${contentType}`);
      }
      const buffer = Buffer.from(await response.arrayBuffer());
      if (!buffer.length || buffer.length > 20 * 1024 * 1024) {
        throw new Error(`invalid image size ${buffer.length}`);
      }
      return buffer;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  throw new Error(`Unable to download ${source}: ${lastError?.message}`);
}

async function persistSource(client, source) {
  if (!client) {
    const buffer = await downloadSource(source);
    const filename = safeFilename(source);
    const form = new FormData();
    form.append('file', new Blob([buffer], { type: 'image/png' }), filename);
    form.append('folder', 'ai-generated-images/gpu-migration');
    const body = await requestUrl(`${UPLOAD_BASE_URL}/api/upload`, '/api/upload', {
      method: 'POST',
      body: form,
    });
    const publicUrl = body?.url;
    if (!publicUrl || gpuSource(publicUrl) || publicUrl.includes('aliyuncs.com')) {
      throw new Error(`Production upload did not return an FTP/CDN URL for ${source}`);
    }
    if (!await publicUrlWorks(publicUrl)) {
      throw new Error(`Uploaded file is not publicly readable: ${publicUrl}`);
    }
    return publicUrl;
  }

  const baseDir = requireEnv('FTP_BASE_DIR').replace(/^\/+|\/+$/g, '');
  const cdn = requireEnv('FTP_CDN_DOMAIN').replace(/\/+$/, '');
  const now = new Date();
  const remotePath = [
    baseDir,
    'ai-generated-images',
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    'gpu-migration',
    safeFilename(source),
  ].join('/');
  const publicUrl = `${cdn}/${remotePath}`;

  try {
    const size = await client.size(`/${remotePath}`);
    if (size > 0 && await publicUrlWorks(publicUrl)) return publicUrl;
  } catch {
    // Upload below.
  }

  const buffer = await downloadSource(source);
  await client.ensureDir(`/${path.posix.dirname(remotePath)}`);
  await client.uploadFrom(Readable.from(buffer), path.posix.basename(remotePath));
  if (!await publicUrlWorks(publicUrl)) {
    throw new Error(`FTP upload is not publicly readable: ${publicUrl}`);
  }
  return publicUrl;
}

function writeBackup(payload) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = path.join(BACKUP_DIR, `gpu-to-ftp-${stamp}.json`);
  fs.writeFileSync(filename, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
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
  const uniqueSources = [...new Set(collectGpuSources(sources))];
  const affected = Object.fromEntries(
    Object.entries(sources).map(([name, rows]) => [
      name,
      rows.filter((row) => collectGpuSources(row).length).length,
    ]),
  );

  console.log(JSON.stringify({
    mode: APPLY ? 'apply' : 'dry-run',
    uniqueSources: uniqueSources.length,
    occurrences: collectGpuSources(sources).length,
    affected,
  }, null, 2));
  if (!APPLY) return;

  const backupFile = writeBackup({ createdAt: new Date().toISOString(), sources });
  console.log(`Backup: ${backupFile}`);

  const client = DIRECT_FTP ? await createFtpClient() : null;
  const replacements = new Map();
  try {
    for (let index = 0; index < uniqueSources.length; index += 1) {
      const source = uniqueSources[index];
      const persisted = await persistSource(client, source);
      replacements.set(source, persisted);
      console.log(`Persisted ${index + 1}/${uniqueSources.length}: ${safeFilename(source)}`);
    }
  } finally {
    client?.close();
  }

  if (process.env.MIGRATION_USE_ADMIN_FINALIZE === 'true') {
    const result = await request('/api/admin/media-migration', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        action: 'finalize',
        replacements: Object.fromEntries(replacements),
      }),
    });
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  let updatedCourses = 0;
  for (const course of courses) {
    const fields = [
      ['courseData', course.course_data ?? course.courseData],
      ['canvasData', course.canvas_data ?? course.canvasData],
      ['readingMaterialsData', course.reading_materials_data ?? course.readingMaterialsData],
    ];
    const body = Object.fromEntries(
      fields
        .filter(([, value]) => collectGpuSources(value).length)
        .map(([key, value]) => [key, replaceGpuSources(value, replacements)]),
    );
    if (!Object.keys(body).length) continue;
    await request(`/api/courses/${encodeURIComponent(course.id)}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    updatedCourses += 1;
  }

  let updatedPictureBooks = 0;
  for (const book of pictureBooks) {
    const relevant = { cover_url: book.cover_url, book_data: book.book_data };
    if (!collectGpuSources(relevant).length) continue;
    await request(`/api/picture-books/${encodeURIComponent(book.id)}`, {
      method: 'PUT',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        coverUrl: replaceGpuSources(book.cover_url, replacements),
        bookData: replaceGpuSources(book.book_data, replacements),
      }),
    });
    updatedPictureBooks += 1;
  }

  const pendingPptRows = [];
  let updatedPptImages = 0;
  for (const image of pptImages) {
    if (!collectGpuSources(image.image_url).length) continue;
    try {
      await request(`/api/ppt-images/${encodeURIComponent(image.id)}`, {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: replaceGpuSources(image.image_url, replacements),
        }),
      });
      updatedPptImages += 1;
    } catch (error) {
      if (error.status === 404) {
        pendingPptRows.push(image.id);
        continue;
      }
      throw error;
    }
  }

  const [verifiedCourses, verifiedPictureBooks, verifiedPptImages] = await Promise.all([
    fetchAll('/api/courses', token),
    fetchAll('/api/picture-books', token),
    fetchAll('/api/ppt-images', token),
  ]);
  const remaining = {
    courses: collectGpuSources(verifiedCourses).length,
    pictureBooks: collectGpuSources(verifiedPictureBooks).length,
    pptImages: collectGpuSources(verifiedPptImages).length,
  };
  if (Object.values(remaining).some((count) => count > 0)) {
    throw new Error(`Verification failed; GPU URLs remain: ${JSON.stringify(remaining)}`);
  }

  const mappingFile = writeBackup({
    createdAt: new Date().toISOString(),
    replacements: Object.fromEntries(replacements),
    pendingPptRows,
  });
  console.log(JSON.stringify({
    persisted: replacements.size,
    updatedCourses,
    updatedPictureBooks,
    updatedPptImages,
    pendingPptRows: pendingPptRows.length,
    remaining,
    mappingFile,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
