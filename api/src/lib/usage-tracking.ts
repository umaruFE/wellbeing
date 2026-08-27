/**
 * 使用习惯埋点（激活 schema 中的 audit_logs 表）
 *
 * 事件经 ETL（api/scripts/sync-usage-habits.mjs）聚合为用户/组织习惯画像，
 * 写入 RAGFlow usage-habits 数据集，供 AI 生成时检索个性化上下文。
 *
 * action 命名规范：{域}.{对象}.{动作}，如 ai.workflow.call、page.view、asset.download
 */
import { db } from '@/lib/db';

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
export function recordEvent(event: UsageEvent): void {
  void (async () => {
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
    } catch (err) {
      console.warn('[usage-tracking] record failed (ignored):', err instanceof Error ? err.message : err);
    }
  })();
}

/** 批量记录（/api/events 上报入口使用） */
export function recordEvents(events: UsageEvent[]): void {
  for (const event of events) recordEvent(event);
}
