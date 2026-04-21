import { promptHistoryService } from './promptService';

// 使用后端代理API，避免CORS问题
const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL || '/api';

export const optimizePrompt = async (originalPrompt, elementType, userId = null) => {
  const startTime = Date.now();
  let optimizedPrompt = null;
  let errorMessage = null;

  try {
    const response = await fetch(`${BACKEND_API_URL}/ai/optimize-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        originalPrompt,
        elementType
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.success && data.optimizedPrompt) {
      optimizedPrompt = data.optimizedPrompt;
    } else {
      throw new Error(data.error || 'API返回数据格式不正确');
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
