/**
 * 超级管理端服务
 * 负责机构管理、账号管理、时长设置
 */

import { request, get, post, put, del } from './api';

// ===== 机构管理 =====

// 获取机构列表
export const getOrganizations = async (params = {}) => {
  return get('/admin/organizations', params);
};

// 获取单个机构详情
export const getOrganization = async (orgId) => {
  return get(`/admin/organizations/${orgId}`);
};

// 创建机构
export const createOrganization = async (orgData) => {
  return post('/admin/organizations', orgData);
};

// 更新机构
export const updateOrganization = async (orgId, orgData) => {
  return put(`/admin/organizations/${orgId}`, orgData);
};

// 删除机构
export const deleteOrganization = async (orgId) => {
  return del(`/admin/organizations/${orgId}`);
};

// 设置机构时长
export const setOrganizationHours = async (orgId, hours) => {
  return post(`/admin/organizations/${orgId}/hours`, { totalHours: hours });
};

// 获取机构使用统计
export const getOrganizationStats = async (orgId) => {
  return get(`/admin/organizations/${orgId}/stats`);
};

// ===== 账号管理 =====

// 获取账号列表
export const getAccounts = async (params = {}) => {
  return get('/admin/accounts', params);
};

// 获取单个账号详情
export const getAccount = async (accountId) => {
  return get(`/admin/accounts/${accountId}`);
};

// 创建账号
export const createAccount = async (accountData) => {
  return post('/admin/accounts', accountData);
};

// 更新账号
export const updateAccount = async (accountId, accountData) => {
  return put(`/admin/accounts/${accountId}`, accountData);
};

// 删除账号
export const deleteAccount = async (accountId) => {
  return del(`/admin/accounts/${accountId}`);
};

// 重置账号密码
export const resetAccountPassword = async (accountId) => {
  return post(`/admin/accounts/${accountId}/reset-password`);
};

// 禁用/启用账号
export const toggleAccountStatus = async (accountId) => {
  return post(`/admin/accounts/${accountId}/toggle-status`);
};

// ===== 系统管理 =====

// 获取系统配置
export const getSystemConfig = async () => {
  return get('/admin/config');
};

// 更新系统配置
export const updateSystemConfig = async (config) => {
  return put('/admin/config', config);
};

// 获取系统日志
export const getSystemLogs = async (params = {}) => {
  return get('/admin/logs', params);
};

// 获取运维统计
export const getOpsStats = async () => {
  return get('/admin/ops/stats');
};


