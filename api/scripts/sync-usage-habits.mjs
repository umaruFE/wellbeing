#!/usr/bin/env node
/**
 * 使用习惯画像 ETL：audit_logs + prompt_history + generation_tasks
 *   → 聚合为组织/用户两级画像 Markdown
 *   → 推入 RAGFlow usage-habits 数据集（先清旧再上传）
 *
 * 运行（在 api/ 目录）：
 *   node scripts/sync-usage-habits.mjs [--days=30]
 *
 * 环境变量：
 *   DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD   业务 PostgreSQL
 *   RAGFLOW_API_URL/RAGFLOW_API_KEY               RAGFlow（必填，否则只打印不推送）
 *
 * 建议通过 cron 每日执行一次
 */
import pg from 'pg';

const args = process.argv.slice(2);
const daysArg = args.find((a) => a.startsWith('--days='));
const DAYS = daysArg ? Number.parseInt(daysArg.split('=')[1], 10) || 30 : 30;

const RAGFLOW_API_URL = process.env.RAGFLOW_API_URL || 'http://localhost:9380';
const RAGFLOW_API_KEY = process.env.RAGFLOW_API_KEY || '';
const DATASET_NAME = process.env.RAGFLOW_HABITS_DATASET || 'usage-habits';
const DOC_PREFIX = 'usage-habits-';

// ---------- PostgreSQL ----------
const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'wellbeing',
  user: process.env.DB_USER || 'wellbeing_user',
  password: process.env.DB_PASSWORD || '',
});

async function q(sql, params = []) {
  const res = await pool.query(sql, params);
  return res.rows;
}

async function safeQ(sql, params = []) {
  try {
    return await q(sql, params);
  } catch (err) {
    console.warn(`[etl] skip (table missing?): ${err.message}`);
    return [];
  }
}

// ---------- RAGFlow ----------
async function rf(path, options = {}) {
  const response = await fetch(`${RAGFLOW_API_URL}/v1${path}`, {
    ...options,
    headers: {
      ...(options.formData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${RAGFLOW_API_KEY}`,
    },
  });
  const json = await response.json().catch(() => null);
  if (!response.ok || json?.code !== 0) {
    throw new Error(`RAGFlow ${path} failed: ${json?.message || response.status}`);
  }
  return json.data ?? json;
}

async function ensureDataset() {
  const list = await rf('/datasets?page=1&page_size=100');
  const found = (list || []).find((d) => d.name === DATASET_NAME);
  if (found) return found.id;
  const created = await rf('/datasets', {
    method: 'POST',
    body: JSON.stringify({ name: DATASET_NAME, description: '用户使用习惯画像（ETL 自动生成）', chunk_method: 'naive' }),
  });
  return created.id;
}

async function uploadDoc(datasetId, filename, text) {
  const formData = new FormData();
  formData.append('file', new Blob([text], { type: 'text/markdown' }), filename);
  const data = await rf(`/datasets/${datasetId}/documents`, { method: 'POST', formData });
  const docId = Array.isArray(data) ? data[0]?.id : data?.id;
  await rf(`/datasets/${datasetId}/chunks`, {
    method: 'POST',
    body: JSON.stringify({ document_ids: [docId] }),
  });
}

/** 删除本次窗口外的旧画像文档（按文件名前缀 + 日期标记） */
async function purgeOldDocs(datasetId, keepDateTag) {
  const docs = await rf(`/datasets/${datasetId}/documents?page=1&page_size=100`);
  const stale = (docs || []).filter(
    (d) => d.name?.startsWith(DOC_PREFIX) && d.name !== `${DOC_PREFIX}index-${keepDateTag}.md` && !d.name.includes(`-${keepDateTag}.`)
  );
  // 同日重跑：先清同日旧文档，避免重复堆积
  const sameDay = (docs || []).filter((d) => d.name?.includes(keepDateTag));
  for (const d of [...stale, ...sameDay]) {
    await rf(`/datasets/${datasetId}/documents`, {
      method: 'DELETE',
      body: JSON.stringify({ ids: [d.id] }),
    }).catch(() => {});
  }
}

// ---------- 聚合 ----------
async function collectStats() {
  const since = `NOW() - INTERVAL '${DAYS} days'`;

  const [actions, workflows, hours, promptTypes, promptModels, taskTypes, taskStatus, users] = await Promise.all([
    safeQ(`SELECT action, COUNT(*)::int AS n FROM audit_logs WHERE created_at > ${since} GROUP BY action ORDER BY n DESC LIMIT 30`),
    safeQ(`SELECT details->>'workflowName' AS wf, COUNT(*)::int AS n,
              SUM(CASE WHEN action = 'ai.workflow.error' THEN 1 ELSE 0 END)::int AS errors
           FROM audit_logs WHERE created_at > ${since} AND resource_type = 'n8n_workflow'
           GROUP BY wf ORDER BY n DESC LIMIT 10`),
    safeQ(`SELECT EXTRACT(HOUR FROM created_at)::int AS h, COUNT(*)::int AS n
           FROM audit_logs WHERE created_at > ${since} GROUP BY h ORDER BY n DESC LIMIT 5`),
    safeQ(`SELECT prompt_type, COUNT(*)::int AS n,
              ROUND(AVG(execution_time)::numeric, 0)::int AS avg_ms,
              SUM(CASE WHEN success THEN 1 ELSE 0 END)::int AS ok
           FROM prompt_history WHERE created_at > ${since} GROUP BY prompt_type ORDER BY n DESC LIMIT 10`),
    safeQ(`SELECT model_name, COUNT(*)::int AS n FROM prompt_history WHERE created_at > ${since} GROUP BY model_name ORDER BY n DESC LIMIT 5`),
    safeQ(`SELECT type, COUNT(*)::int AS n FROM generation_tasks WHERE started_at > ${since} GROUP BY type ORDER BY n DESC`),
    safeQ(`SELECT status, COUNT(*)::int AS n FROM generation_tasks WHERE started_at > ${since} GROUP BY status`),
    safeQ(`SELECT COALESCE(u.name, a.user_id::text) AS name, a.user_id,
              COUNT(*)::int AS events,
              COUNT(DISTINCT a.details->>'workflowName')::int AS workflows_used
           FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id
           WHERE a.created_at > ${since} AND a.user_id IS NOT NULL
           GROUP BY a.user_id, u.name ORDER BY events DESC LIMIT 10`),
  ]);

  return { actions, workflows, hours, promptTypes, promptModels, taskTypes, taskStatus, users };
}

function table(rows, headers) {
  if (!rows.length) return '（无数据）\n';
  const line = (cells) => `| ${cells.join(' | ')} |`;
  return [line(headers), line(headers.map(() => '---')), ...rows.map((r) => line(r))].join('\n') + '\n';
}

function buildOrgDoc(stats) {
  const totalWf = stats.workflows.reduce((s, r) => s + r.n, 0);
  const totalErr = stats.workflows.reduce((s, r) => s + r.errors, 0);
  const errRate = totalWf ? ((totalErr / totalWf) * 100).toFixed(1) : '0';
  const peak = stats.hours.map((r) => `${r.h}:00 (${r.n} 次)`).join('、') || '—';

  return `# 组织使用习惯画像（近 ${DAYS} 天）

> 由 usage-habits ETL 自动生成，供 AI 生成课程/素材时检索个性化上下文。生成时间：${new Date().toISOString()}

## AI 工作流使用

共调用 **${totalWf}** 次，错误 ${totalErr} 次（错误率 ${errRate}%）。

| 工作流 | 调用次数 | 失败次数 |
| --- | --- | --- |
${stats.workflows.map((r) => `| ${r.wf || '(未知)'} | ${r.n} | ${r.errors} |`).join('\n') || '| — | — | — |'}

## 素材生成分布（generation_tasks）

${table(stats.taskTypes.map((r) => [r.type, r.n]), ['类型', '次数'])}
${table(stats.taskStatus.map((r) => [r.status, r.n]), ['状态', '次数'])}

## 提示词使用（prompt_history）

${table(stats.promptTypes.map((r) => [r.prompt_type, r.n, `${r.avg_ms}ms`, r.ok]), ['提示词类型', '次数', '平均耗时', '成功数'])}
${table(stats.promptModels.map((r) => [r.model_name, r.n]), ['模型', '次数'])}

## 全量事件分布（audit_logs）

${table(stats.actions.map((r) => [r.action, r.n]), ['动作', '次数'])}

## 活跃用户 Top 10

${table(stats.users.map((r) => [r.name || '(未知)', r.events, r.workflows_used]), ['用户', '事件数', '使用过的工作流数'])}

## 高峰时段

${peak}

## 可参考的运营洞察

- 错误率 ${errRate}%${Number(errRate) > 20 ? '（偏高，建议检查高频失败工作流的稳定性）' : '（正常）'}
- 最常用工作流：${stats.workflows[0]?.wf || '—'}，可优先保障其质量与素材规范一致性
`;
}

function buildIndexDoc(stats) {
  return `# 使用习惯画像索引（近 ${DAYS} 天）

- 组织画像：usage-habits-org
- 用户画像：${stats.users.map((u) => `${u.name || u.user_id}（usage-habits-user-${String(u.user_id).slice(0, 8)}）`).join('、') || '暂无'}
`;
}

async function main() {
  console.log(`[etl] 聚合近 ${DAYS} 天数据...`);
  const stats = await collectStats();

  const dateTag = new Date().toISOString().slice(0, 10);
  const orgDoc = buildOrgDoc(stats);

  if (!RAGFLOW_API_KEY) {
    console.log('[etl] 未配置 RAGFLOW_API_KEY，仅打印画像：\n');
    console.log(orgDoc);
    await pool.end();
    return;
  }

  console.log('[etl] 推送 RAGFlow...');
  const datasetId = await ensureDataset();
  await purgeOldDocs(datasetId, dateTag);

  await uploadDoc(datasetId, `${DOC_PREFIX}org-${dateTag}.md`, orgDoc);
  await uploadDoc(datasetId, `${DOC_PREFIX}index-${dateTag}.md`, buildIndexDoc(stats));

  // 用户级画像（每活跃用户一篇，控制在 Top 10）
  for (const u of stats.users) {
    if (!u.user_id) continue;
    const [uWf, uActions] = await Promise.all([
      safeQ(`SELECT details->>'workflowName' AS wf, COUNT(*)::int AS n
             FROM audit_logs WHERE user_id = $1 AND created_at > NOW() - INTERVAL '${DAYS} days'
             GROUP BY wf ORDER BY n DESC LIMIT 5`, [u.user_id]),
      safeQ(`SELECT action, COUNT(*)::int AS n
             FROM audit_logs WHERE user_id = $1 AND created_at > NOW() - INTERVAL '${DAYS} days'
             GROUP BY action ORDER BY n DESC LIMIT 10`, [u.user_id]),
    ]);
    const userDoc = `# 用户使用画像：${u.name || u.user_id}（近 ${DAYS} 天）

> 由 usage-habits ETL 自动生成。AI 生成内容时可参考该用户偏好。

- 事件总数：${u.events}；使用过的工作流数：${u.workflows_used}

## 常用 AI 工作流

${table(uWf.map((r) => [r.wf || '(未知)', r.n]), ['工作流', '次数'])}

## 行为分布

${table(uActions.map((r) => [r.action, r.n]), ['动作', '次数'])}

## 个性化提示

- 优先沿用其常用工作流的产出规范；高频时段可参考组织画像高峰分布
`;
    await uploadDoc(datasetId, `${DOC_PREFIX}user-${String(u.user_id).slice(0, 8)}-${dateTag}.md`, userDoc);
  }

  console.log(`[etl] 完成：1 篇组织画像 + ${stats.users.length} 篇用户画像 → RAGFlow 数据集 ${DATASET_NAME}`);
  await pool.end();
}

main().catch(async (err) => {
  console.error('[etl] failed:', err);
  await pool.end().catch(() => {});
  process.exit(1);
});
