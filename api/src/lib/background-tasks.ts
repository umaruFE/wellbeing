import { randomUUID } from 'crypto';
import { db } from '@/lib/db';

export type GenerationTaskStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface CreateGenerationTaskInput {
  userId?: string | null;
  organizationId?: string | null;
  courseId?: string | null;
  type: 'image' | 'video' | 'audio';
  title: string;
  count?: number;
  related?: string;
  provider?: string;
  externalTaskId?: string | null;
  statusUrl?: string | null;
  input?: Record<string, any>;
  result?: Record<string, any> | null;
  status?: GenerationTaskStatus;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validUuid(value?: string | null) {
  return value && uuidRegex.test(value) ? value : null;
}

export async function ensureGenerationTasksTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS generation_tasks (
      id uuid PRIMARY KEY,
      user_id uuid NULL,
      organization_id uuid NULL,
      course_id uuid NULL,
      type text NOT NULL,
      title text NOT NULL,
      count int NOT NULL DEFAULT 1,
      related text NULL,
      status text NOT NULL DEFAULT 'queued',
      progress int NOT NULL DEFAULT 0,
      queue_position int NULL,
      provider text NULL,
      external_task_id text NULL,
      status_url text NULL,
      input jsonb NOT NULL DEFAULT '{}'::jsonb,
      result jsonb NULL,
      error_message text NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      started_at timestamptz NULL,
      finished_at timestamptz NULL,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS generation_tasks_user_idx ON generation_tasks(user_id);
    CREATE INDEX IF NOT EXISTS generation_tasks_status_idx ON generation_tasks(status);
    CREATE INDEX IF NOT EXISTS generation_tasks_created_idx ON generation_tasks(created_at DESC);
  `);
}

export async function createGenerationTask(input: CreateGenerationTaskInput) {
  await ensureGenerationTasksTable();

  const status = input.status || (input.externalTaskId ? 'running' : 'queued');
  const progress = status === 'succeeded' ? 100 : status === 'running' ? 10 : 0;

  const { rows } = await db.query(`
    INSERT INTO generation_tasks (
      id, user_id, organization_id, course_id, type, title, count, related,
      status, progress, provider, external_task_id, status_url, input, result, started_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb,$15::jsonb,$16)
    RETURNING *
  `, [
    randomUUID(),
    validUuid(input.userId),
    validUuid(input.organizationId),
    validUuid(input.courseId),
    input.type,
    input.title,
    input.count || 1,
    input.related || null,
    status,
    progress,
    input.provider || null,
    input.externalTaskId || null,
    input.statusUrl || null,
    JSON.stringify(input.input || {}),
    input.result ? JSON.stringify(input.result) : null,
    status === 'running' ? new Date().toISOString() : null,
  ]);

  return rows[0];
}

function normalizeExternalStatus(data: any) {
  const status = data?.status || data?.data?.status;
  const url = data?.url || data?.data?.url || data?.data?.videoData?.url || data?.data?.videoData?.videoUrl || data?.data?.videoData?.video_url;

  if (status === 'completed' || status === 'success' || data?.success === true && url) {
    return {
      status: 'succeeded' as GenerationTaskStatus,
      progress: 100,
      result: {
        ...data,
        url,
      },
    };
  }

  if (status === 'error' || status === 'failed' || data?.success === false) {
    return {
      status: 'failed' as GenerationTaskStatus,
      progress: 100,
      errorMessage: data?.error || data?.details || '任务执行失败',
    };
  }

  return {
    status: 'running' as GenerationTaskStatus,
    progress: data?.progress || data?.data?.progress || 35,
  };
}

async function pollTaskStatus(task: any) {
  if (!task.status_url || !task.external_task_id || task.status !== 'running') return task;

  try {
    const baseUrl = process.env.INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
    const statusUrl = task.status_url.startsWith('http')
      ? task.status_url
      : `${baseUrl}${task.status_url}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    const response = await fetch(statusUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) return task;
    const statusData = await response.json();
    const normalized = normalizeExternalStatus(statusData);

    const finishedAt = ['succeeded', 'failed'].includes(normalized.status) ? new Date().toISOString() : null;
    const { rows } = await db.query(`
      UPDATE generation_tasks
      SET status = $1,
          progress = $2,
          result = COALESCE($3::jsonb, result),
          error_message = COALESCE($4, error_message),
          finished_at = COALESCE($5, finished_at),
          updated_at = now()
      WHERE id = $6
      RETURNING *
    `, [
      normalized.status,
      normalized.progress,
      normalized.result ? JSON.stringify(normalized.result) : null,
      normalized.errorMessage || null,
      finishedAt,
      task.id,
    ]);
    return rows[0] || task;
  } catch (error) {
    console.warn('[background-tasks] poll failed:', error instanceof Error ? error.message : error);
    return task;
  }
}

export async function listGenerationTasks(userId: string | null, scope: 'active' | 'history') {
  await ensureGenerationTasksTable();

  const statuses = scope === 'active'
    ? ['queued', 'running']
    : ['succeeded', 'failed', 'cancelled'];

  const params: any[] = [statuses];
  let where = 'status = ANY($1)';
  if (validUuid(userId)) {
    params.push(userId);
    where += ` AND user_id = $${params.length}`;
  }

  const { rows } = await db.query(`
    SELECT *
    FROM generation_tasks
    WHERE ${where}
    ORDER BY created_at DESC
    LIMIT 100
  `, params);

  if (scope === 'active') {
    const updated = [];
    for (const task of rows) {
      updated.push(await pollTaskStatus(task));
    }
    return updated;
  }

  return rows;
}

export async function getGenerationTask(id: string) {
  await ensureGenerationTasksTable();
  const { rows } = await db.query('SELECT * FROM generation_tasks WHERE id = $1', [id]);
  const task = rows[0] || null;
  if (!task) return null;
  return pollTaskStatus(task);
}

export async function cancelGenerationTask(id: string, userId?: string | null) {
  await ensureGenerationTasksTable();
  const params: any[] = [id];
  let userFilter = '';
  if (validUuid(userId)) {
    params.push(userId);
    userFilter = ` AND user_id = $${params.length}`;
  }
  const { rows } = await db.query(`
    UPDATE generation_tasks
    SET status = 'cancelled', progress = 100, finished_at = now(), updated_at = now()
    WHERE id = $1 ${userFilter} AND status IN ('queued','running')
    RETURNING *
  `, params);
  return rows[0] || null;
}
