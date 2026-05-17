/**
 * API 服务层
 * 统一处理 401 认证失败时跳转到登录页
 */

const AUTH_ERROR_MESSAGES = ['Token已过期', 'Token无效', '无效的token', '未提供认证token', '认证失败', 'Token验证失败'];

function isAuthError(error) {
  if (!error) return false;
  const msg = typeof error === 'string' ? error : error.message || '';
  return AUTH_ERROR_MESSAGES.some(e => msg.includes(e));
}

function handleAuthError() {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('storage'));
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

function parseError(response, data) {
  if (data?.error) return data.error;
  if (response.status === 401) return '认证失败，请重新登录';
  if (response.status === 403) return '权限不足';
  if (response.status === 404) return '资源不存在';
  if (response.status >= 500) return '服务器错误';
  return data?.message || '请求失败';
}

export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch {}

      const errorMsg = parseError(response, errorData);
      if (isAuthError(errorData.error) || isAuthError(errorMsg)) {
        handleAuthError();
      }
      throw new Error(errorMsg);
    }

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch {}
      throw new Error(parseError(response, errorData));
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      throw new Error('网络连接失败，请检查网络');
    }
    throw error;
  }
}

export default {
  get: (url, options) => apiFetch(url, { ...options, method: 'GET' }),
  post: (url, body, options) => apiFetch(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  put: (url, body, options) => apiFetch(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  delete: (url, options) => apiFetch(url, { ...options, method: 'DELETE' }),
};
