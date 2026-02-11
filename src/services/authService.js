/**
 * 登录认证服务
 * 负责用户登录、登出、权限验证
 */

import { request, get, post } from './api';

// 登录
export const login = async (username, password) => {
  return post('/auth/login', { username, password });
};

// 登出
export const logout = async () => {
  return post('/auth/logout');
};

// 获取当前用户信息
export const getCurrentUser = async () => {
  return get('/auth/me');
};

// 刷新 Token
export const refreshToken = async () => {
  return post('/auth/refresh');
};

// 修改密码
export const changePassword = async (oldPassword, newPassword) => {
  return post('/auth/change-password', { oldPassword, newPassword });
};



