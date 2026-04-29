/**
 * 提示词优化服务
 * 通过调用后端 n8n API 进行提示词优化
 */

import { promptHistoryService } from './promptService';

const BASE_API_URL = '/api';

/**
 * 获取认证 headers
 */
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * 调用后端 API 优化提示词
 * @param {string} originalPrompt - 原始提示词
 * @param {string} elementType - 元素类型
 * @param {string} userId - 用户ID
 * @returns {Promise<string>} 优化后的提示词
 */
export const optimizePrompt = async (originalPrompt, elementType, userId = null) => {
  const startTime = Date.now();
  let optimizedPrompt = null;
  let errorMessage = null;

  try {
    const response = await fetch(`${BASE_API_URL}/ai/optimize-prompt`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        originalPrompt,
        elementType: elementType || 'general'
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success && result.optimizedPrompt) {
      optimizedPrompt = result.optimizedPrompt;
    } else if (result.optimizedPrompt) {
      optimizedPrompt = result.optimizedPrompt;
    } else {
      throw new Error(result.error || '优化失败');
    }
  } catch (error) {
    console.error('优化提示词失败:', error);
    errorMessage = error.message;
    throw error;
  } finally {
    // 保存到历史记录
    if (userId) {
      const executionTime = Date.now() - startTime;
      try {
        await promptHistoryService.saveHistory({
          user_id: userId,
          prompt_type: 'prompt_optimization',
          original_prompt: originalPrompt,
          generated_result: { optimized_prompt: optimizedPrompt, element_type: elementType },
          execution_time: executionTime,
          success: !errorMessage,
          error_message: errorMessage
        });
      } catch (historyError) {
        console.error('保存提示词历史失败:', historyError);
      }
    }
  }

  return optimizedPrompt;
};

/**
 * 生成课件数据（已废弃，请使用 /api/ai/generate-course）
 * @param {Object} config - 课程配置
 * @param {string} userId - 用户ID
 * @param {string} organizationId - 机构ID
 * @param {Function} onProgress - 进度回调
 * @returns {Promise<Object>} 课件数据
 * @deprecated 请直接调用后端 API /api/ai/generate-course
 */
export const generateCourseData = async (config, userId = null, organizationId = null, onProgress = null) => {
  const reportProgress = (progress, text) => {
    if (onProgress && typeof onProgress === 'function') {
      onProgress(progress, text);
    }
  };

  reportProgress(10, '正在连接服务...');

  try {
    reportProgress(20, '正在提交生成任务...');

    const response = await fetch(`${BASE_API_URL}/ai/generate-course`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        age: config.age,
        unit: config.unit,
        duration: config.duration,
        theme: config.theme,
        keywords: config.keywords,
        isCustomUnit: config.isCustomUnit,
        customUnit: config.customUnit,
        userId,
        organizationId
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    reportProgress(50, '任务已提交，等待生成...');

    if (result.success && result.data) {
      // 如果是异步任务，返回 executionId
      if (result.data.executionId && result.data.status === 'processing') {
        reportProgress(100, '课件生成任务已提交');
        return {
          executionId: result.data.executionId,
          status: 'processing',
          message: result.data.message
        };
      }
      // 如果是同步完成，直接返回数据
      if (result.data.status === 'completed') {
        reportProgress(100, '课件生成完成');
        return result.data.courseData || result.data.result;
      }
    }

    throw new Error(result.error || '生成失败');
  } catch (error) {
    console.error('生成课件失败:', error);
    reportProgress(0, `生成失败: ${error.message}`);
    throw error;
  }
};
