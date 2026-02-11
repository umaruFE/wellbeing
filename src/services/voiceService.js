/**
 * 声音管理服务
 * 负责声音的上传、分类、播放管理
 */

import { request, get, post, del } from './api';

// 获取声音列表
export const getVoices = async (params = {}) => {
  return get('/voices', params);
};

// 获取单个声音详情
export const getVoice = async (voiceId) => {
  return get(`/voices/${voiceId}`);
};

// 上传声音
export const uploadVoice = async (file, metadata = {}) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('metadata', JSON.stringify(metadata));
  return request('/voices/upload', {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// 更新声音信息
export const updateVoice = async (voiceId, data) => {
  return request(`/voices/${voiceId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// 删除声音
export const deleteVoice = async (voiceId) => {
  return del(`/voices/${voiceId}`);
};

// 按情绪分类获取声音
export const getVoicesByEmotion = async (emotion) => {
  return get('/voices', { emotion });
};

// 获取情绪标签列表
export const getEmotions = async () => {
  return get('/voices/emotions');
};

// 播放声音（记录播放）
export const playVoice = async (voiceId) => {
  return post(`/voices/${voiceId}/play`);
};

// 批量上传声音
export const batchUploadVoices = async (files, defaultEmotion = 'neutral') => {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));
  formData.append('defaultEmotion', defaultEmotion);
  return request('/voices/batch-upload', {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// 获取声音使用统计
export const getVoiceStats = async () => {
  return get('/voices/stats');
};


