// Prompt history and optimization service

const API_URL = import.meta.env.VITE_API_URL;

export const promptHistoryService = {
  // Save prompt history
  saveHistory: async (data) => {
    try {
      const response = await fetch(`${API_URL}/prompt-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save prompt history');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving prompt history:', error);
      // 在开发环境下，可以继续执行，不影响主流程
      return { id: 'temp-id' };
    }
  },

  // Get prompt history
  getHistory: async (user_id, prompt_type, limit = 10) => {
    try {
      const params = new URLSearchParams({
        user_id,
        limit: limit.toString()
      });
      
      if (prompt_type) {
        params.append('prompt_type', prompt_type);
      }
      
      const response = await fetch(`${API_URL}/prompt-history?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to get prompt history');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting prompt history:', error);
      // 返回空数组，确保前端不会崩溃
      return [];
    }
  }
};

export const promptOptimizationService = {
  // Save prompt optimization
  saveOptimization: async (data) => {
    try {
      const response = await fetch(`${API_URL}/prompt-optimizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save prompt optimization');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error saving prompt optimization:', error);
      // 在开发环境下，可以继续执行，不影响主流程
      return { id: 'temp-id' };
    }
  },

  // Get prompt optimizations
  getOptimizations: async (user_id, element_type) => {
    try {
      const params = new URLSearchParams({ user_id });
      
      if (element_type) {
        params.append('element_type', element_type);
      }
      
      const response = await fetch(`${API_URL}/prompt-optimizations?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to get prompt optimizations');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting prompt optimizations:', error);
      // 返回空数组，确保前端不会崩溃
      return [];
    }
  },

  // Update optimization score
  updateScore: async (id, improvement_score) => {
    try {
      const response = await fetch(`${API_URL}/prompt-optimizations`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, improvement_score })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update prompt optimization');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating prompt optimization:', error);
      // 静默失败，不影响主流程
      return { id };
    }
  }
};

// Prompt optimization map for different element types
export const promptOptimizationMap = {
  image: {
    base: '生成一张适合小学英语教学的图片，主题是 {topic}，风格要生动有趣，适合 {age} 岁学生',
    improvements: [
      '添加更多色彩和细节，使画面更加丰富',
      '确保图片中的元素符合目标年龄段的认知水平',
      '增加互动元素，让学生能够参与其中',
      '使用明亮的色彩和友好的视觉元素',
      '确保图片内容与教学主题紧密相关'
    ]
  },
  script: {
    base: '为小学英语课程生成教师讲稿，主题是 {topic}，适合 {age} 岁学生，包含互动环节',
    improvements: [
      '增加更多互动问题，鼓励学生参与',
      '使用更简单易懂的语言',
      '添加更多游戏化元素',
      '确保讲稿长度适中，符合课堂时间要求',
      '增加更多鼓励性语言，提高学生自信心'
    ]
  },
  activity: {
    base: '为小学英语课程设计一个活动，主题是 {topic}，适合 {age} 岁学生，时长 {duration} 分钟',
    improvements: [
      '增加更多合作学习元素',
      '设计更明确的活动目标和评估标准',
      '添加更多差异化教学策略',
      '确保活动材料易于准备和使用',
      '增加活动的趣味性和吸引力'
    ]
  },
  ppt: {
    base: '为小学英语课程设计PPT内容，主题是 {topic}，适合 {age} 岁学生，包含视觉元素',
    improvements: [
      '增加更多视觉元素和动画效果',
      '确保文字简洁明了，易于阅读',
      '添加更多互动环节',
      '设计更符合目标年龄段审美的视觉风格',
      '确保PPT内容结构清晰，逻辑连贯'
    ]
  }
};
