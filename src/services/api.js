// Frontend API Service
// This service provides a convenient wrapper for API calls to the Next.js backend

// 使用相对路径，Vite 代理会将 /api/* 请求转发到 http://localhost:3000/api/*
const API_BASE_URL = '';

class ApiService {
  // Generic request handler
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Remove Content-Type for FormData
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, config);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (err) {
      console.error('API 请求异常:', err.message);
      throw err;
    }
  }

  // ============ Courses ============

  async getCourses(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/courses${queryString ? `?${queryString}` : ''}`);
  }

  async getCourse(id) {
    return this.request(`/api/courses/${id}`);
  }

  async createCourse(courseData) {
    return this.request('/api/courses', {
      method: 'POST',
      body: JSON.stringify(courseData),
    });
  }

  async updateCourse(id, courseData) {
    return this.request(`/api/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(courseData),
    });
  }

  async deleteCourse(id) {
    return this.request(`/api/courses/${id}`, {
      method: 'DELETE',
    });
  }

  // ============ Textbooks ============

  async getTextbooks() {
    return this.request('/api/textbooks');
  }

  async createTextbookType(data) {
    return this.request('/api/textbooks', {
      method: 'POST',
      body: JSON.stringify({ action: 'type', ...data }),
    });
  }

  async createTextbookUnit(data) {
    return this.request('/api/textbooks', {
      method: 'POST',
      body: JSON.stringify({ action: 'unit', ...data }),
    });
  }

  // ============ PPT Images ============

  async getPptImages(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/ppt-images${queryString ? `?${queryString}` : ''}`);
  }

  async createPptImage(data) {
    return this.request('/api/ppt-images', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============ IP Characters ============

  async getIpCharacters() {
    return this.request('/api/ip-characters');
  }

  async createIpCharacter(data) {
    return this.request('/api/ip-characters', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============ Voice Configs ============

  async getVoiceConfigs(userId) {
    return this.request(`/api/voices${userId ? `?userId=${userId}` : ''}`);
  }

  async createVoiceConfig(data) {
    return this.request('/api/voices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============ Organizations ============

  async getOrganizations(search = '') {
    return this.request(`/api/organizations${search ? `?search=${search}` : ''}`);
  }

  async createOrganization(data) {
    return this.request('/api/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrganization(id, data) {
    return this.request('/api/organizations', {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
    });
  }

  // ============ Users ============

  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/users${queryString ? `?${queryString}` : ''}`);
  }

  async createUser(data) {
    return this.request('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============ Videos ============

  async getVideos(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/videos${queryString ? `?${queryString}` : ''}`);
  }

  async createVideo(data) {
    // Backend expects snake_case fields (video_url, thumbnail_url)
    const payload = { ...(data || {}) };
    if (payload.videoUrl && !payload.video_url) {
      payload.video_url = payload.videoUrl;
      delete payload.videoUrl;
    }
    if (payload.thumbnailUrl && !payload.thumbnail_url) {
      payload.thumbnail_url = payload.thumbnailUrl;
      delete payload.thumbnailUrl;
    }
    return this.request('/api/videos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateVideo(id, data) {
    // Backend expects snake_case fields (video_url, thumbnail_url)
    const payload = { ...(data || {}) };
    if (payload.videoUrl && !payload.video_url) {
      payload.video_url = payload.videoUrl;
      delete payload.videoUrl;
    }
    if (payload.thumbnailUrl && !payload.thumbnail_url) {
      payload.thumbnail_url = payload.thumbnailUrl;
      delete payload.thumbnailUrl;
    }
    return this.request('/api/videos', {
      method: 'PUT',
      body: JSON.stringify({ id, ...payload }),
    });
  }

  async deleteVideo(id) {
    return this.request(`/api/videos?id=${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
export default apiService;

// =========================
// Named exports for service modules (./courseService, ./voiceService, etc.)
// These helpers map business paths like "/courses" to backend routes "/api/courses".
// =========================

const normalizeApiPath = (path) => {
  if (!path) return '/api';
  // Allow passing full "/api/xxx" to avoid double prefixing
  if (path.startsWith('/api/')) return path;
  if (path === '/api') return path;
  if (path.startsWith('/')) return `/api${path}`;
  return `/api/${path}`;
};

export const request = async (path, options = {}) => {
  return apiService.request(normalizeApiPath(path), options);
};

export const get = async (path, params = {}, options = {}) => {
  const queryString = params && Object.keys(params).length
    ? `?${new URLSearchParams(params).toString()}`
    : '';
  return request(`${path}${queryString}`, { method: 'GET', ...options });
};

export const post = async (path, data, options = {}) => {
  const body = data instanceof FormData ? data : JSON.stringify(data ?? {});
  return request(path, { method: 'POST', body, ...options });
};

export const put = async (path, data, options = {}) => {
  const body = data instanceof FormData ? data : JSON.stringify(data ?? {});
  return request(path, { method: 'PUT', body, ...options });
};

export const del = async (path, options = {}) => {
  return request(path, { method: 'DELETE', ...options });
};