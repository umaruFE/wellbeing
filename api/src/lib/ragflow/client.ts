/**
 * RAGFlow HTTP API 客户端
 *
 * 环境变量：
 *   RAGFLOW_API_URL   RAGFlow 服务地址，默认 http://localhost:9380
 *   RAGFLOW_API_KEY   在 RAGFlow Web UI（用户设置 → API）生成的 Bearer Token
 *
 * API 约定：所有响应为 { code, message?, data }，code === 0 表示成功
 */

const BASE_URL = process.env.RAGFLOW_API_URL || 'http://localhost:9380';
const API_KEY = process.env.RAGFLOW_API_KEY || '';
const API_PREFIX = process.env.RAGFLOW_API_PREFIX || '/api/v1';

export function isRagflowEnabled(): boolean {
  return Boolean(process.env.RAGFLOW_ENABLED === 'true' && API_KEY);
}

async function request<T = any>(
  path: string,
  options: { method?: string; body?: unknown; formData?: FormData } = {}
): Promise<T> {
  const { method = 'GET', body, formData } = options;

  const fetchOptions: RequestInit = {
    method,
    headers: {
      ...(formData ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${API_KEY}`,
    },
  };
  if (formData) fetchOptions.body = formData;
  else if (body !== undefined) fetchOptions.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${API_PREFIX}${path}`, fetchOptions);
  const text = await response.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`RAGFlow API non-JSON response ${response.status}: ${text.slice(0, 200)}`);
  }

  if (!response.ok || (json && json.code !== 0)) {
    throw new Error(`RAGFlow API ${method} ${path} failed: ${json?.message || response.status}`);
  }
  return (json?.data ?? json) as T;
}

/** 数据集（Dataset）管理 */
export const datasets = {
  list: (params: { page?: number; page_size?: number } = {}) =>
    request<any[]>(`/datasets?page=${params.page ?? 1}&page_size=${params.page_size ?? 100}`),

  create: (payload: { name: string; description?: string; embedding_model?: string; chunk_method?: string }) =>
    request<any>('/datasets', { method: 'POST', body: payload }),

  delete: (datasetId: string) =>
    request(`/datasets/${datasetId}`, { method: 'DELETE' }),
};

/**
 * 按名称查找或创建数据集，返回 dataset id（供上传/检索复用）
 */
export async function ensureDataset(name: string, description = ''): Promise<string> {
  const page_size = 100;
  for (let page = 1; page <= 10; page++) {
    const list = await datasets.list({ page, page_size });
    const found = (list || []).find((d: any) => d.name === name);
    if (found) return found.id;
    if (!list || list.length < page_size) break;
  }
  const created = await datasets.create({ name, description, chunk_method: 'naive' });
  return created.id;
}

/** 文档管理 */
export const documents = {
  list: (datasetId: string, params: { page?: number; page_size?: number; keywords?: string } = {}) => {
    const qs = new URLSearchParams({
      page: String(params.page ?? 1),
      page_size: String(params.page_size ?? 100),
      ...(params.keywords ? { keywords: params.keywords } : {}),
    });
    return request<any[]>(`/datasets/${datasetId}/documents?${qs.toString()}`);
  },

  /**
   * 上传纯文本内容为一个 Markdown 文档
   * @returns 文档 id
   */
  uploadText: async (datasetId: string, filename: string, text: string) => {
    const formData = new FormData();
    formData.append(
      'file',
      new Blob([text], { type: 'text/markdown' }),
      filename.endsWith('.md') ? filename : `${filename}.md`
    );
    const data = await request<any[]>(`/datasets/${datasetId}/documents`, {
      method: 'POST',
      formData,
    });
    if (!Array.isArray(data) || !data[0]?.id) throw new Error('RAGFlow upload returned no document id');
    return data[0].id as string;
  },

  /** 触发解析（切片 + 向量化） */
  parse: (datasetId: string, documentIds: string[]) =>
    request(`/datasets/${datasetId}/chunks`, {
      method: 'POST',
      body: { document_ids: documentIds },
    }),

  delete: (datasetId: string, documentIds: string[]) =>
    request(`/datasets/${datasetId}/documents`, {
      method: 'DELETE',
      body: { ids: documentIds },
    }),

  /** 上传文本并触发解析（组合操作，返回文档 id） */
  uploadAndParse: async (datasetId: string, filename: string, text: string) => {
    const id = await documents.uploadText(datasetId, filename, text);
    await documents.parse(datasetId, [id]);
    return id;
  },
};

export interface RetrievedChunk {
  content: string;
  similarity: number;
  documentKeyword?: string;
}

/**
 * 检索接口：按问题在指定数据集中做向量检索
 */
export async function retrieval(params: {
  question: string;
  datasetIds: string[];
  topK?: number;
  similarityThreshold?: number;
}): Promise<RetrievedChunk[]> {
  const data = await request<{ chunks: any[] }>('/retrieval', {
    method: 'POST',
    body: {
      question: params.question,
      dataset_ids: params.datasetIds,
      top_k: params.topK ?? 10,
      similarity_threshold: params.similarityThreshold ?? 0.2,
    },
  });
  return (data?.chunks || []).map((c: any) => ({
    content: c.content,
    similarity: c.similarity,
    documentKeyword: c.document_keyword,
  }));
}

export const ragflowClient = { isRagflowEnabled, datasets, ensureDataset, documents, retrieval };
export default ragflowClient;
