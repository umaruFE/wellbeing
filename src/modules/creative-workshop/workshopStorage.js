/**
 * 创作工坊草稿存储 — 后端数据库版（表 creative_works）
 * API：GET/POST /api/creative-works，DELETE /api/creative-works/:id
 */

const authHeaders = () => {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : '';
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const parseResponse = async (response) => {
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.error || `请求失败（${response.status}）`);
  }
  return json;
};

// 数据库行 → 页面字段（camelCase），保持原 localStorage 结构兼容
const normalize = (row) => ({
  id: row.id,
  moduleId: row.module_id,
  moduleName: row.module_name,
  title: row.title,
  parameters: row.parameters || {},
  status: row.status,
  hasHtml: Boolean(row.has_html),
  result: row.result || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const getCreativeWorks = async (moduleId) => {
  const query = moduleId ? `?moduleId=${encodeURIComponent(moduleId)}` : '';
  const response = await fetch(`/api/creative-works${query}`, { headers: authHeaders() });
  const json = await parseResponse(response);
  return (json.data || []).map(normalize);
};

// 触发生成（LLM + 模板注入，耗时 30-120 秒）
export const generateCreativeWork = async (id) => {
  const response = await fetch(`/api/creative-works/${id}/generate`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const json = await parseResponse(response);
  return { ...normalize({ ...json.data, module_id: '', module_name: '', title: '', parameters: {} }), ...json.data };
};

export const createCreativeWork = async ({ moduleId, moduleName, title, parameters }) => {
  const response = await fetch('/api/creative-works', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ moduleId, moduleName, title, parameters }),
  });
  const json = await parseResponse(response);
  return normalize(json.data);
};

export const deleteCreativeWork = async (id) => {
  const response = await fetch(`/api/creative-works/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await parseResponse(response);
};
