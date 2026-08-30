/**
 * 使用习惯埋点（激活 schema 中的 audit_logs 表）
 *
 * 事件经 ETL（api/scripts/sync-usage-habits.mjs）聚合为用户/组织习惯画像，
 * 写入 RAGFlow usage-habits 数据集，供 AI 生成时检索个性化上下文。
 *
 * action 命名规范：{域}.{对象}.{动作}，如 ai.workflow.call、page.view、asset.download
 */
import { db } from '@/lib/db';
import { documents, ensureDataset, isRagflowEnabled } from '@/lib/ragflow/client';

export interface UsageEvent {
  userId?: string | null;
  organizationId?: string | null;
  action: string;
  resourceType?: string;
  /** 仅接受 UUID；非 UUID 标识（如 document_id、任务 id）放入 details.resourceId */
  resourceId?: string | null;
  details?: Record<string, unknown>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HABITS_DATASET = process.env.RAGFLOW_HABITS_DATASET || 'usage-habits';

async function mirrorPictureBookEvent(event: UsageEvent): Promise<void> {
  if (!isRagflowEnabled() || !event.action.startsWith('picturebook.')) return;

  const datasetId = await ensureDataset(HABITS_DATASET, '用户使用记录（实时事件 + ETL 聚合画像）');
  const timestamp = new Date().toISOString();
  const safeTimestamp = timestamp.replace(/[:.]/g, '-');
  const filename = `usage-event-${safeTimestamp}-${crypto.randomUUID()}.md`;
  const content = [
    '# 用户操作记录',
    '',
    `- 时间：${timestamp}`,
    `- 用户 ID：${event.userId || 'anonymous'}`,
    `- 组织 ID：${event.organizationId || 'unknown'}`,
    `- 操作：${event.action}`,
    `- 资源类型：${event.resourceType || 'web'}`,
    `- 资源 ID：${event.resourceId || 'unknown'}`,
    '',
    '## 操作详情',
    '',
    '```json',
    JSON.stringify(event.details || {}, null, 2),
    '```',
  ].join('\n');
  await documents.uploadAndParse(datasetId, filename, content);
}

let tableReady = false;
async function ensureTable() {
  if (tableReady) return;
  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      organization_id UUID,
      action VARCHAR(100) NOT NULL,
      resource_type VARCHAR(100),
      resource_id UUID,
      details JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  // organization_id 为 schema 原表新增列（记录事件归属组织）
  await db.query(`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS organization_id UUID`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at)`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action)`);
  tableReady = true;
}

/**
 * 记录一条使用事件（fire-and-forget，不阻塞业务请求、失败不影响主流程）
 */
export async function recordEvent(event: UsageEvent): Promise<void> {
  try {
      await ensureTable();
      const userId = event.userId && UUID_RE.test(event.userId) ? event.userId : null;
      const resourceId = event.resourceId && UUID_RE.test(event.resourceId) ? event.resourceId : null;
      await db.query(
        `INSERT INTO audit_logs (user_id, organization_id, action, resource_type, resource_id, details)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          event.organizationId && UUID_RE.test(event.organizationId) ? event.organizationId : null,
          event.action,
          event.resourceType || null,
          resourceId,
          JSON.stringify(event.details || {}),
        ]
      );
      await mirrorPictureBookEvent(event);
  } catch (err) {
    console.warn('[usage-tracking] record failed (ignored):', err instanceof Error ? err.message : err);
  }
}

/** 批量记录（/api/events 上报入口使用） */
export async function recordEvents(events: UsageEvent[]): Promise<void> {
  await Promise.all(events.map((event) => recordEvent(event)));
}
