// 获取认证 token 并添加到请求头
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * 获取仪表盘统计数据
 * @returns {Promise<object>} - 返回统计数据
 */
export const fetchDashboardStats = async () => {
  try {
    const response = await fetch('/api/stats', {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`获取统计数据失败: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('获取统计数据失败:', error);
    // 返回默认数据
    return {
      courses: { total: 0 },
      media: { images: 0, videos: 0, audios: 0 },
      tasks: { running: 0, completed: 0, queued: 0 },
      todayCompleted: 0,
      compute: { used: 0, total: 40000, remaining: 40000 }
    };
  }
};

/**
 * 获取最近创建的课程列表
 * @param {number} limit - 返回数量限制
 * @returns {Promise<Array>} - 返回课程列表
 */
export const fetchRecentCourses = async (limit = 8) => {
  try {
    const response = await fetch(`/api/courses?limit=${limit}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`获取课程列表失败: ${response.status}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('获取课程列表失败:', error);
    return [];
  }
};

/**
 * 获取用户最近的任务历史
 * @param {string} userId - 用户ID
 * @param {string} promptType - 任务类型（image/video/audio/storyboard等）
 * @param {number} limit - 返回数量限制
 * @returns {Promise<Array>} - 返回任务列表
 */
export const fetchRecentTasks = async (userId, promptType = null, limit = 10) => {
  try {
    const params = new URLSearchParams({ user_id: userId, limit: String(limit) });
    if (promptType) {
      params.append('prompt_type', promptType);
    }

    const response = await fetch(`/api/prompt-history?${params}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`获取任务历史失败: ${response.status}`);
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('获取任务历史失败:', error);
    return [];
  }
};

/**
 * 获取任务队列状态
 * @returns {Promise<Array>} - 返回当前任务队列
 */
export const fetchTaskQueue = async () => {
  try {
    const response = await fetch('/api/ai/task-queue', {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      // 如果 API 不存在，返回空数组
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('获取任务队列失败:', error);
    return [];
  }
};
