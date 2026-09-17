/**
 * 前端使用习惯埋点工具
 *
 * 用法：
 *   import { trackEvent } from '@/utils/usageTracker';
 *   trackEvent('page.view', 'course', courseId, { module: 'course-workflow' });
 *
 * action 命名规范见 api/src/lib/usage-tracking.ts
 */

let context = { userId: null, organizationId: null };

/** 登录后注入全局上下文（后续所有事件自动携带） */
export function setTrackingContext({ userId, organizationId }) {
  context = { userId: userId || null, organizationId: organizationId || null };
}

export function trackEvent(action, resourceType, resourceId, details) {
  const token = localStorage.getItem('token');
  if (!token) return;
  const payload = JSON.stringify({
    events: [
      {
        action,
        resourceType: resourceType || 'web',
        resourceId: resourceId || null,
        details: details || {},
      },
    ],
  });

  try {
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: payload,
      keepalive: true,
    });
  } catch {
    // 埋点失败静默忽略，不影响业务
  }
}
