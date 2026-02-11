/**
 * 课程广场服务
 * 负责课程广场的浏览、搜索、筛选
 */

import { request, get, post } from './api';

// 获取公开课程列表
export const getPublicCourses = async (params = {}) => {
  return get('/square/courses', params);
};

// 获取课程分类
export const getCategories = async () => {
  return get('/square/categories');
};

// 搜索课程
export const searchCourses = async (keyword, params = {}) => {
  return post('/square/search', { keyword, ...params });
};

// 获取推荐课程
export const getRecommendedCourses = async () => {
  return get('/square/recommended');
};

// 获取热门课程
export const getHotCourses = async (limit = 10) => {
  return get('/square/hot', { limit });
};

// 获取课程详情（学习模式）
export const getCourseForLearning = async (courseId) => {
  return get(`/square/courses/${courseId}/learn`);
};

// 收藏课程
export const favoriteCourse = async (courseId) => {
  return post(`/square/courses/${courseId}/favorite`);
};

// 取消收藏
export const unfavoriteCourse = async (courseId) => {
  return post(`/square/courses/${courseId}/unfavorite`);
};

// 获取我的收藏
export const getMyFavorites = async () => {
  return get('/square/my-favorites');
};

// 获取学习历史
export const getLearningHistory = async () => {
  return get('/square/my-learning');
};



