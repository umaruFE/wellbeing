/**
 * SOP流程服务
 * 负责课程策划-制作-发布的状态流转
 */

import { request, get, post, put } from './api';

// SOP 状态枚举
export const SOP_STATUS = {
  DRAFT: 'draft',         // 草稿（策划中）
  REVIEW: 'review',       // 待审核
  APPROVED: 'approved',   // 已审核
  PUBLISHED: 'published', // 已发布
  ARCHIVED: 'archived',   // 已归档
  REJECTED: 'rejected',  // 已驳回
};

// 获取 SOP 流程定义
export const getSOPDefinition = async () => {
  return get('/sop/definition');
};

// 获取课程 SOP 状态
export const getCourseSOPStatus = async (courseId) => {
  return get(`/sop/courses/${courseId}/status`);
};

// 更新 SOP 状态
export const updateSOPStatus = async (courseId, action) => {
  return post(`/sop/courses/${courseId}/transition`, { action });
};

// 获取可执行操作列表
export const getAvailableActions = async (courseId) => {
  return get(`/sop/courses/${courseId}/actions`);
};

// 提交审核
export const submitForReview = async (courseId, comment = '') => {
  return post(`/sop/courses/${courseId}/submit`, { comment });
};

// 审核通过
export const approveCourse = async (courseId, comment = '') => {
  return post(`/sop/courses/${courseId}/approve`, { comment });
};

// 驳回
export const rejectCourse = async (courseId, reason) => {
  return post(`/sop/courses/${courseId}/reject`, { reason });
};

// 发布课程
export const releaseCourse = async (courseId) => {
  return post(`/sop/courses/${courseId}/release`);
};

// 下架课程
export const unpublishCourse = async (courseId) => {
  return post(`/sop/courses/${courseId}/unpublish`);
};

// 归档课程
export const archiveCourseSOP = async (courseId) => {
  return post(`/sop/courses/${courseId}/archive`);
};

// 获取操作历史
export const getSOPHistory = async (courseId) => {
  return get(`/sop/courses/${courseId}/history`);
};

// 获取待审核列表（教研组长/管理员）
export const getPendingReview = async () => {
  return get('/sop/pending-review');
};

// 获取我的任务
export const getMyTasks = async () => {
  return get('/sop/my-tasks');
};


