const API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY;
const API_URL = import.meta.env.VITE_DASHSCOPE_API_URL;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * 生成人物参考图（文生图或图生图）
 * @param {string} description - 视频描述
 * @param {string[]} uploadedImages - 用户上传的参考图片
 * @param {string} userId - 用户ID
 * @param {string} organizationId - 组织ID
 * @returns {Promise<string[]>} - 生成的图片URL数组
 */
export const generateCharacterReferenceImages = async (description, uploadedImages = [], userId = null, organizationId = null) => {
  const characterPrompt = `${description}，人物特写，正面，清晰面部特征，高质量，细节丰富`;
  
  try {
    let response;
    
    if (uploadedImages.length > 0) {
      // 有上传参考图，使用图生图接口
      console.log('使用图生图接口生成人物参考图');
      response = await fetch(`${API_BASE_URL}/api/ai/image-to-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: characterPrompt,
          imageUrl: uploadedImages[0], // 使用第一张上传的图片作为参考
          count: 4,
          width: 512,
          height: 512,
          user_id: userId,
          organization_id: organizationId
        })
      });
    } else {
      // 没有上传参考图，使用文生图接口
      console.log('使用文生图接口生成人物参考图');
      response = await fetch(`${API_BASE_URL}/api/ai/generate-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: characterPrompt,
          count: 4,
          width: 512,
          height: 512,
          user_id: userId,
          organization_id: organizationId
        })
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '生成人物参考图失败');
    }

    const data = await response.json();
    
    if (!data.success || !data.tasks || data.tasks.length === 0) {
      throw new Error('生成人物参考图失败');
    }
    
    return data.tasks;
  } catch (error) {
    console.error('生成人物参考图失败:', error);
    throw error;
  }
};

/**
 * 轮询任务状态并获取图片URL
 * @param {string} promptId - 任务ID
 * @param {number} maxAttempts - 最大轮询次数
 * @param {number} interval - 轮询间隔（毫秒）
 * @returns {Promise<string>} - 图片URL
 */
export const pollTaskAndGetImageUrl = async (promptId, maxAttempts = 60, interval = 2000) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/task-status/${promptId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`查询任务状态失败: ${response.status}`);
      }

      const data = await response.json();
      
      // 与后端 /api/ai/task-status 接口保持一致：
      // - pending: { success: true, status: 'pending' }
      // - completed: { success: true, status: 'completed', url, filename }
      if (data.status === 'completed') {
        return data.url;
      } else if (data.status === 'error') {
        throw new Error('任务执行失败');
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  throw new Error('任务超时');
};

/**
 * 生成视频分镜脚本
 * @param {string} description - 视频描述
 * @param {string[]} referenceImages - 人物参考图片URL数组
 * @param {number} duration - 视频时长（秒）
 * @returns {Promise<{scenes: Array, title: string}>}
 */
export const generateStoryboardScript = async (description, referenceImages = [], duration = 30) => {
  const systemPrompt = `你是一位专业的视频分镜师，擅长根据视频描述和人物参考图片生成分镜脚本。

请根据用户提供的视频描述，生成详细的分镜脚本。每个分镜需要包含：
1. 时长（如：0-3s, 3-6s）
2. 景别（如：中景、近景、特写、全景）
3. 运镜（如：缓慢推镜、固定镜头、轻微跟镜）
4. 画面内容（详细的场景描述）

要求：
- 分镜要符合视频的整体节奏和情感
- 总时长约 ${duration} 秒
- 每个分镜时长3-5秒
- 画面内容要具体、可执行
- 如果有参考图片，要确保人物形象一致

请严格按照以下JSON格式返回，不要包含任何其他文字：
{
  "title": "视频标题",
  "scenes": [
    {
      "sequence": 1,
      "duration": "0-3s",
      "shotType": "中景",
      "cameraMovement": "缓慢推镜",
      "content": "画面内容描述"
    }
  ]
}`;

  const userContent = `视频描述：${description}
视频时长：${duration}秒
${referenceImages.length > 0 ? `参考图片数量：${referenceImages.length}张` : ''}

请生成分镜脚本。`;

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
            content: userContent
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const content = data.choices[0].message.content.trim();
      // 提取JSON部分
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          title: result.title || '未命名视频',
          scenes: result.scenes || []
        };
      }
    }
    
    throw new Error('无法解析API响应');
  } catch (error) {
    console.error('生成分镜脚本失败:', error);
    throw error;
  }
};

/**
 * 生成分镜图片
 * @param {Object} scene - 分镜步骤
 * @param {string[]} referenceImages - 人物参考图片
 * @param {string} userId - 用户ID
 * @param {string} organizationId - 组织ID
 * @returns {Promise<string>} - 生成的图片URL
 */
export const generateSceneImage = async (scene, referenceImages = [], userId = null, organizationId = null) => {
  const scenePrompt = `${scene.content}，${scene.shotType}，${scene.cameraMovement}，高质量，电影感`;
  
  try {
    let response;
    
    if (referenceImages.length > 0) {
      // 有参考图，使用图生图保持人物一致性
      response = await fetch(`${API_BASE_URL}/api/ai/image-to-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: scenePrompt,
          imageUrl: referenceImages[0],
          count: 1,
          width: 800,
          height: 450,
          user_id: userId,
          organization_id: organizationId
        })
      });
    } else {
      // 无参考图，使用文生图
      response = await fetch(`${API_BASE_URL}/api/ai/generate-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: scenePrompt,
          count: 1,
          width: 800,
          height: 450,
          user_id: userId,
          organization_id: organizationId
        })
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '生成分镜图片失败');
    }

    const data = await response.json();
    
    if (!data.success || !data.tasks || data.tasks.length === 0) {
      throw new Error('生成分镜图片失败');
    }
    
    // 轮询获取图片URL
    const imageUrl = await pollTaskAndGetImageUrl(data.tasks[0].promptId);
    return imageUrl;
  } catch (error) {
    console.error('生成分镜图片失败:', error);
    // 返回占位图
    const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    return `https://placehold.co/800x450/${randomColor}/FFF?text=Scene+${scene.sequence}`;
  }
};

/**
 * 合成视频
 * 使用第一个分镜的图片作为参考，生成短视频
 * @param {Array} scenes - 分镜步骤数组
 * @param {string} _title - 视频标题（预留参数）
 * @param {string} userId - 用户ID
 * @param {string} organizationId - 组织ID
 * @returns {Promise<string>} - 生成的视频URL
 */
// eslint-disable-next-line no-unused-vars
export const composeVideo = async (scenes, _title = '', userId = null, organizationId = null) => {
  try {
    // 获取所有有生成图片的分镜（按顺序）
    const sceneImages = (scenes || [])
      .filter(s => s && s.generatedImage)
      .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
      .map(s => s.generatedImage);

    if (sceneImages.length === 0) {
      throw new Error('没有可用的分镜图片');
    }

    // 构建视频生成提示词
    const videoPrompt = scenes.map(s => s.content).join('，');
    
    // 调用视频生成API
    const response = await fetch(`${API_BASE_URL}/api/ai/generate-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: videoPrompt,
        // 传所有分镜图给后端（后端可按需处理）；同时保留 imageUrl 兼容旧逻辑
        imageUrls: sceneImages,
        imageUrl: sceneImages[0],
        duration: 5,
        user_id: userId,
        organization_id: organizationId
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '提交视频生成任务失败');
    }

    const data = await response.json();
    
    if (!data.success || !data.promptId) {
      throw new Error('提交视频生成任务失败');
    }
    
    // 轮询获取视频URL
    const videoUrl = await pollTaskAndGetVideoUrl(data.promptId);
    return videoUrl;
  } catch (error) {
    console.error('合成视频失败:', error);
    throw error;
  }
};

/**
 * 轮询任务状态并获取视频URL
 * @param {string} promptId - 任务ID
 * @param {number} maxAttempts - 最大轮询次数
 * @param {number} interval - 轮询间隔（毫秒）
 * @returns {Promise<string>} - 视频URL
 */
export const pollTaskAndGetVideoUrl = async (promptId, maxAttempts = 120, interval = 3000) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/task-status/${promptId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`查询任务状态失败: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'completed') {
        return data.url;
      } else if (data.status === 'error') {
        throw new Error('任务执行失败');
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  throw new Error('视频生成任务超时');
};

export default {
  generateCharacterReferenceImages,
  pollTaskAndGetImageUrl,
  generateStoryboardScript,
  generateSceneImage,
  composeVideo,
  pollTaskAndGetVideoUrl
};
