/**
 * AI 生图资产的通用解析/轮询工具（从绘本工作室抽出，供绘本与创作工坊共用）
 *
 * 后端 /api/ai/generate-ppt-asset 返回的 asset 可能是：
 *   - 已完成：直接带 url → 立即返回
 *   - 已提交：带 statusUrl（/api/ai/task-status/...）→ 轮询直到出图或失败
 */

import apiService from '../services/api';

export function pickUrl(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return pickUrl(value[0]);
  return value.url
    || value.assetUrl
    || value.imageUrl
    || value.themeImageUrl
    || value.data?.url
    || value.data?.assetUrl
    || value.data?.imageUrl
    || value.asset?.url
    || '';
}

export function getStatusUrl(asset) {
  return asset?.statusUrl || asset?.asset?.statusUrl || '';
}

export async function resolveGeneratedAsset(asset, { maxAttempts = 200, onResolved, fallbackError = 'Image generation failed' } = {}) {
  const directUrl = pickUrl(asset);
  if (directUrl) {
    onResolved?.(directUrl);
    return directUrl;
  }
  const statusUrl = getStatusUrl(asset);
  if (!statusUrl) return '';

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, attempt < 2 ? 1200 : 3000));
    const status = await apiService.request(statusUrl);
    const url = pickUrl(status);
    if (url) {
      onResolved?.(url);
      return url;
    }
    if (['failed', 'error'].includes(String(status?.status || '').toLowerCase())) {
      throw new Error(status?.error || fallbackError);
    }
  }
  return '';
}
