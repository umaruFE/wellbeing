import { createServerClient } from './db';
import { getUploadProvider } from './fileUpload';
import { persistComfyImageUrl } from './persistRemoteImage';

const GPU_HOST_SUFFIX = '.container.x-gpu.com';

type MigrationSources = {
  courses: any[];
  pictureBooks: any[];
  pptImages: any[];
};

function gpuSource(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const parsed = new URL(value, 'http://localhost');
    const inner = parsed.searchParams.get('url');
    if (inner) {
      const innerUrl = new URL(inner);
      if (innerUrl.hostname.endsWith(GPU_HOST_SUFFIX)) return innerUrl.href;
    }
    if (parsed.hostname.endsWith(GPU_HOST_SUFFIX) && parsed.pathname.includes('/view')) {
      return parsed.href;
    }
  } catch {
    return null;
  }
  return null;
}

function collectGpuSources(value: unknown, output: string[] = []): string[] {
  if (typeof value === 'string') {
    const source = gpuSource(value);
    if (source) output.push(source);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectGpuSources(item, output));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectGpuSources(item, output));
  }
  return output;
}

function replaceGpuSources(value: unknown, replacements: Map<string, string>): unknown {
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

async function loadSources(): Promise<MigrationSources> {
  const pool = createServerClient();
  const [courses, pictureBooks, pptImages] = await Promise.all([
    pool.query('SELECT * FROM courses ORDER BY id'),
    pool.query('SELECT * FROM picture_books ORDER BY id'),
    pool.query('SELECT * FROM ppt_images ORDER BY id'),
  ]);
  return {
    courses: courses.rows,
    pictureBooks: pictureBooks.rows,
    pptImages: pptImages.rows,
  };
}

export async function inspectGpuImageMigration() {
  const sources = await loadSources();
  const uniqueSources = Array.from(new Set(collectGpuSources(sources)));
  return {
    provider: getUploadProvider(),
    uniqueSources: uniqueSources.length,
    occurrences: collectGpuSources(sources).length,
    affected: {
      courses: sources.courses.filter((row) => collectGpuSources(row).length).length,
      pictureBooks: sources.pictureBooks.filter((row) => collectGpuSources(row).length).length,
      pptImages: sources.pptImages.filter((row) => collectGpuSources(row).length).length,
    },
  };
}

export async function migrateGpuImagesToCurrentStorage(userId: string) {
  if (getUploadProvider() !== 'ftp') {
    throw new Error('旧 GPU 图片迁移只能在 UPLOAD_PROVIDER=ftp 的生产环境执行');
  }

  const sources = await loadSources();
  const uniqueSources = Array.from(new Set(collectGpuSources(sources)));
  if (!uniqueSources.length) {
    return { ...(await inspectGpuImageMigration()), migrated: 0 };
  }

  const replacements = new Map<string, string>();
  for (const source of uniqueSources) {
    const persistedUrl = await persistComfyImageUrl(source, 'ai-generated-images/gpu-migration');
    if (
      persistedUrl === source
      || persistedUrl.includes(GPU_HOST_SUFFIX)
      || persistedUrl.includes('aliyuncs.com')
    ) {
      throw new Error(`图片未成功转存到 FTP：${source}`);
    }
    replacements.set(source, persistedUrl);
  }

  const pool = createServerClient();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS media_migration_backups (
        id BIGSERIAL PRIMARY KEY,
        migration_type TEXT NOT NULL,
        operator_id TEXT,
        snapshot JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(
      `INSERT INTO media_migration_backups (migration_type, operator_id, snapshot)
       VALUES ($1, $2, $3::jsonb)`,
      ['gpu-to-ftp', userId, JSON.stringify(sources)],
    );

    let updatedCourses = 0;
    for (const course of sources.courses) {
      const fields = {
        course_data: course.course_data,
        canvas_data: course.canvas_data,
        reading_materials_data: course.reading_materials_data,
      };
      if (!collectGpuSources(fields).length) continue;
      await client.query(
        `UPDATE courses
         SET course_data = $1::jsonb,
             canvas_data = $2::jsonb,
             reading_materials_data = $3::jsonb,
             updated_at = NOW()
         WHERE id = $4`,
        [
          JSON.stringify(replaceGpuSources(course.course_data, replacements)),
          JSON.stringify(replaceGpuSources(course.canvas_data, replacements)),
          JSON.stringify(replaceGpuSources(course.reading_materials_data, replacements)),
          course.id,
        ],
      );
      updatedCourses += 1;
    }

    let updatedPictureBooks = 0;
    for (const book of sources.pictureBooks) {
      if (!collectGpuSources({ cover: book.cover_url, data: book.book_data }).length) continue;
      await client.query(
        `UPDATE picture_books
         SET cover_url = $1, book_data = $2::jsonb, updated_at = NOW()
         WHERE id = $3`,
        [
          replaceGpuSources(book.cover_url, replacements),
          JSON.stringify(replaceGpuSources(book.book_data, replacements)),
          book.id,
        ],
      );
      updatedPictureBooks += 1;
    }

    let updatedPptImages = 0;
    for (const image of sources.pptImages) {
      if (!collectGpuSources(image.image_url).length) continue;
      await client.query(
        'UPDATE ppt_images SET image_url = $1, updated_at = NOW() WHERE id = $2',
        [replaceGpuSources(image.image_url, replacements), image.id],
      );
      updatedPptImages += 1;
    }

    await client.query('COMMIT');
    const remaining = await inspectGpuImageMigration();
    if (remaining.occurrences > 0) {
      throw new Error(`迁移后仍有 ${remaining.occurrences} 处 GPU 地址，请重试`);
    }
    return {
      ...remaining,
      migrated: replacements.size,
      updated: {
        courses: updatedCourses,
        pictureBooks: updatedPictureBooks,
        pptImages: updatedPptImages,
      },
    };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}
