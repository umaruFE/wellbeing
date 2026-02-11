/**
 * 课程管理服务
 * 负责课程的增删改查、发布等操作
 */

import { request, get, post, put, del } from './api';

// 获取课程列表
export const getCourses = async (params = {}) => {
  return get('/courses', params);
};

// 获取单个课程详情
export const getCourse = async (courseId) => {
  return get(`/courses/${courseId}`);
};

// 创建课程
export const createCourse = async (courseData) => {
  return post('/courses', courseData);
};

// 更新课程
export const updateCourse = async (courseId, courseData) => {
  return put(`/courses/${courseId}`, courseData);
};

// 删除课程
export const deleteCourse = async (courseId) => {
  return del(`/courses/${courseId}`);
};

// 发布课程
export const publishCourse = async (courseId) => {
  return post(`/courses/${courseId}/publish`);
};

// 取消发布
export const unpublishCourse = async (courseId) => {
  return post(`/courses/${courseId}/unpublish`);
};

// 归档课程
export const archiveCourse = async (courseId) => {
  return post(`/courses/${courseId}/archive`);
};

// 克隆课程
export const forkCourse = async (courseId) => {
  return post(`/courses/${courseId}/fork`);
};

// 获取课程状态
export const getCourseStatus = async (courseId) => {
  return get(`/courses/${courseId}/status`);
};

// 上传课程资源
export const uploadCourseResource = async (courseId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return request(`/courses/${courseId}/resources`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// 获取课程资源列表
export const getCourseResources = async (courseId) => {
  return get(`/courses/${courseId}/resources`);
};



