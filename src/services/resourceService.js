/**
 * 资源管理服务
 * 负责资源广场、素材管理
 */

import { request, get, post, del } from './api';

// ===== 素材资源 =====

// 获取素材列表
export const getResources = async (params = {}) => {
  return get('/resources', params);
};

// 获取素材详情
export const getResource = async (resourceId) => {
  return get(`/resources/${resourceId}`);
};

// 上传素材
export const uploadResource = async (file, metadata = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify(metadata));
  return request('/resources/upload', {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// 删除素材
export const deleteResource = async (resourceId) => {
  return del(`/resources/${resourceId}`);
};

// 更新素材信息
export const updateResource = async (resourceId, data) => {
  return request(`/resources/${resourceId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// 获取素材分类
export const getResourceCategories = async () => {
  return get('/resources/categories');
};

// 搜索素材
export const searchResources = async (keyword, params = {}) => {
  return post('/resources/search', { keyword, ...params });
};

// ===== 模板管理 =====

// 获取模板列表
export const getTemplates = async (params = {}) => {
  return get('/templates', params);
};

// 获取模板详情
export const getTemplate = async (templateId) => {
  return get(`/templates/${templateId}`);
};

// 使用模板创建课程
export const createFromTemplate = async (templateId, courseData) => {
  return post(`/templates/${templateId}/use`, courseData);
};

// ===== Fork/克隆 =====

// 克隆资源
export const forkResource = async (resourceId) => {
  return post(`/resources/${resourceId}/fork`);
};

// 克隆课程页面
export const forkCoursePage = async (courseId, pageId) => {
  return post(`/courses/${courseId}/pages/${pageId}/fork`);
};


