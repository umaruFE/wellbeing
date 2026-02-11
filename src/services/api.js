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

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
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
    return this.request('/api/videos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateVideo(id, data) {
    return this.request('/api/videos', {
      method: 'PUT',
      body: JSON.stringify({ id, ...data }),
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
