import { promptHistoryService } from './promptService';
import { promptOptimizationSystemPrompt } from '../lib/prompt-config';

const API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY;
const API_URL = import.meta.env.VITE_DASHSCOPE_API_URL;

// 安全检查：如果环境变量未定义，抛出明确的错误
if (!API_URL) {
  throw new Error('环境变量 VITE_DASHSCOPE_API_URL 未定义，请确保 .env 文件已正确配置并重启开发服务器');
}
if (!API_KEY) {
  throw new Error('环境变量 VITE_DASHSCOPE_API_KEY 未定义，请确保 .env 文件已正确配置并重启开发服务器');
}

export const optimizePrompt = async (originalPrompt, elementType, userId = null) => {
  const systemPrompt = promptOptimizationSystemPrompt(originalPrompt, elementType);

  const startTime = Date.now();
  let optimizedPrompt = null;
  let errorMessage = null;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: originalPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      optimizedPrompt = data.choices[0].message.content.trim();
    } else {
      throw new Error('API返回数据格式不正确');
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
