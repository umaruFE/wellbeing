const API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY;
const API_URL = import.meta.env.VITE_DASHSCOPE_API_URL;
// 使用相对路径，这样在任何环境下都能正确访问
const API_BASE_URL = '';

// 获取认证token并添加到请求头
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * 从描述中提取人物特征
 * @param {string} description - 视频描述
 * @returns {Promise<string>} - 人物特征描述
 */
export const extractCharacterFromDescription = async (description) => {
  try {
    const response = await fetch('/api/ai/extract-character', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ description })
    });

    if (!response.ok) {
      console.error('提取人物特征失败，使用默认描述');
      return '一个通用卡通人物';
    }

    const data = await response.json();
    return data.character || '一个通用卡通人物';
  } catch (error) {
    console.error('提取人物特征失败:', error);
    return '一个通用卡通人物';
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
      const response = await fetch(`/api/ai/task-status/${promptId}`, {
        method: 'GET',
        headers: getAuthHeaders()
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
  throw new Error('任务轮询超时');
};

/**
 * 生成人物参考图（文生图或图生图）
 * @param {string} description - 视频描述
 * @param {string[]} uploadedImages - 用户上传的参考图片
 * @param {string} userId - 用户ID
 * @param {string} organizationId - 组织ID
 * @param {number} width - 图片宽度
 * @param {number} height - 图片高度
 * @returns {Promise<string[]>} - 生成的图片URL数组
 */
export const generateCharacterReferenceImages = async (description, uploadedImages = [], userId = null, organizationId = null, width = 512, height = 512) => {
  // 先提取人物特征
  let characterDescription = description;
  if (uploadedImages.length === 0) {
    console.log('开始提取人物特征...');
    characterDescription = await extractCharacterFromDescription(description);
    console.log('提取的人物特征:', characterDescription);
  }
  
  // 从后端获取人物参考图提示词
  let characterPrompt = `${characterDescription}，单个或多个人物，纯白色背景，人物特写，正面视角，清晰面部特征，全身照，无背景元素，无道具，无场景，高质量，细节丰富，肖像摄影风格`;
  try {
    const promptResponse = await fetch('/api/ai/get-character-prompt', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ characterDescription })
    });
    
    if (promptResponse.ok) {
      const promptData = await promptResponse.json();
      if (promptData.prompt) {
        characterPrompt = promptData.prompt;
        console.log('使用后端提示词:', characterPrompt);
      }
    }
  } catch (error) {
    console.error('获取后端提示词失败，使用默认提示词:', error);
  }
  
  try {
    let response;
    
    if (uploadedImages.length > 0) {
      // 有上传参考图，使用图生图接口
      console.log('使用图生图接口生成人物参考图');
      
      // 处理图片 URL，确保服务器可以访问
      let imageUrl = uploadedImages[0];
      if (imageUrl.startsWith('/')) {
        imageUrl = `${imageUrl}`;
        console.log('相对路径:', imageUrl);
      } else if (imageUrl.includes('localhost:517') || imageUrl.includes('127.0.0.1:517')) {
        const urlObj = new URL(imageUrl);
        imageUrl = `${urlObj.pathname}`;
        console.log('前端地址转换为相对路径:', imageUrl);
      }
      
      response = await fetch('/api/ai/image-to-image', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prompt: characterPrompt,
          imageUrl: imageUrl,
          count: 1,
          width: width,
          height: height,
          user_id: userId,
          organization_id: organizationId
        })
      });
    } else {
      // 没有上传参考图，使用文生图接口
      console.log('使用文生图接口生成人物参考图');
      response = await fetch('/api/ai/generate-images', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prompt: characterPrompt,
          count: 1,
          width: width,
          height: height,
          user_id: userId,
          organization_id: organizationId,
          workflow_type: 'person'
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
    
    // 轮询所有任务获取图片URL
    const images = [];
    for (const task of data.tasks) {
      try {
        const imageUrl = await pollTaskAndGetImageUrl(task.promptId);
        images.push(imageUrl);
      } catch (err) {
        console.error('轮询任务失败:', err);
        // 使用占位图
        const randomColor = Math.floor(Math.random() * 16777215).toString(16);
        images.push(`https://placehold.co/512x512/${randomColor}/FFF?text=Character+${images.length + 1}`);
      }
    }
    
    return images;
  } catch (error) {
    console.error('生成人物参考图失败:', error);
    throw error;
  }
};

/**
 * 使用已提取的人物描述生成人物参考图
 * @param {string} characterDescription - 已提取/编辑的人物描述
 * @param {string[]} uploadedImages - 用户上传的参考图片
 * @param {string} userId - 用户ID
 * @param {string} organizationId - 组织ID
 * @param {number} width - 图片宽度
 * @param {number} height - 图片高度
 * @returns {Promise<string[]>} - 生成的图片URL数组
 */
export const generateCharacterReferenceImagesWithPrompt = async (characterDescription, uploadedImages = [], userId = null, organizationId = null, width = 512, height = 512) => {
  // 从后端获取人物参考图提示词
  let characterPrompt = `${characterDescription}，单个或多个人物，纯白色背景，人物特写，正面视角，清晰面部特征，全身照，无背景元素，无道具，无场景，高质量，细节丰富，肖像摄影风格`;
  try {
    const promptResponse = await fetch('/api/ai/get-character-prompt', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ characterDescription })
    });
    
    if (promptResponse.ok) {
      const promptData = await promptResponse.json();
      if (promptData.prompt) {
        characterPrompt = promptData.prompt;
        console.log('使用后端提示词:', characterPrompt);
      }
    }
  } catch (error) {
    console.error('获取后端提示词失败，使用默认提示词:', error);
  }
  
  try {
    let response;
    
    if (uploadedImages.length > 0) {
      // 有上传参考图，使用图生图接口
      console.log('使用图生图接口生成人物参考图');
      
      // 处理图片 URL，确保服务器可以访问
      let imageUrl = uploadedImages[0];
      if (imageUrl.startsWith('/')) {
        imageUrl = `${imageUrl}`;
        console.log('相对路径:', imageUrl);
      } else if (imageUrl.includes('localhost:517') || imageUrl.includes('127.0.0.1:517')) {
        const urlObj = new URL(imageUrl);
        imageUrl = `${urlObj.pathname}`;
        console.log('前端地址转换为相对路径:', imageUrl);
      }
      
      response = await fetch('/api/ai/image-to-image', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prompt: characterPrompt,
          imageUrl: imageUrl,
          count: 1,
          width: width,
          height: height,
          user_id: userId,
          organization_id: organizationId
        })
      });
    } else {
      // 没有上传参考图，使用文生图接口
      console.log('使用文生图接口生成人物参考图');
      response = await fetch('/api/ai/generate-images', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prompt: characterPrompt,
          count: 1,
          width: width,
          height: height,
          user_id: userId,
          organization_id: organizationId,
          workflow_type: 'person'
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
    
    // 轮询所有任务获取图片URL
    const images = [];
    for (const task of data.tasks) {
      try {
        const imageUrl = await pollTaskAndGetImageUrl(task.promptId);
        images.push(imageUrl);
      } catch (err) {
        console.error('轮询任务失败:', err);
        // 使用占位图
        const randomColor = Math.floor(Math.random() * 16777215).toString(16);
        images.push(`https://placehold.co/512x512/${randomColor}/FFF?text=Character+${images.length + 1}`);
      }
    }
    
    return images;
  } catch (error) {
    console.error('生成人物参考图失败:', error);
    throw error;
  }
};

/**
 * 生成分镜脚本
 * @param {string} description - 视频描述
 * @param {string[]} referenceImages - 参考图片
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
      throw new Error(`API调用失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // 提取JSON部分
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('无法解析分镜脚本');
    }
    
    const storyboard = JSON.parse(jsonMatch[0]);
    
    // 确保scenes是数组
    if (!Array.isArray(storyboard.scenes)) {
      throw new Error('分镜脚本格式错误');
    }
    
    // 为每个分镜添加narration字段（如果没有）
    storyboard.scenes = storyboard.scenes.map((scene, index) => ({
      ...scene,
      narration: scene.narration || '',
      generatedImage: null
    }));
    
    return storyboard;
  } catch (error) {
    console.error('生成分镜脚本失败:', error);
    // 返回默认分镜
    return {
      title: '默认分镜脚本',
      scenes: [
        {
          sequence: 1,
          duration: '0-3s',
          shotType: '中景',
          cameraMovement: '固定镜头',
          content: '开场画面',
          narration: '',
          generatedImage: null
        },
        {
          sequence: 2,
          duration: '3-6s',
          shotType: '近景',
          cameraMovement: '缓慢推镜',
          content: '主要内容',
          narration: '',
          generatedImage: null
        },
        {
          sequence: 3,
          duration: '6-9s',
          shotType: '全景',
          cameraMovement: '拉远',
          content: '结尾画面',
          narration: '',
          generatedImage: null
        }
      ]
    };
  }
};

/**
 * 生成分镜图片
 * @param {Object} scene - 分镜信息
 * @param {string[]} referenceImages - 人物参考图片（用于保持人物一致性）
 * @param {string} userId - 用户ID
 * @param {string} organizationId - 组织ID
 * @param {string} stylePrompt - 风格提示词
 * @returns {Promise<string>} - 生成的图片URL
 */
export const generateSceneImage = async (scene, referenceImages = [], userId = null, organizationId = null, stylePrompt = null) => {
  // 先优化提示词为LTX2.0格式
  let optimizedPrompt = scene.content;
  try {
    const response = await fetch('/api/ai/optimize-prompt', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        originalPrompt: scene.content,
        elementType: 'storyboard'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      optimizedPrompt = data.optimizedPrompt || scene.content;
      console.log(`分镜${scene.sequence || ''} 原始提示词:`, scene.content);
      console.log(`分镜${scene.sequence || ''} 优化后提示词:`, optimizedPrompt);
    }
  } catch (error) {
    console.error('优化分镜提示词失败，使用原始提示词:', error);
  }

  // 风格一致性描述
  const baseStyle = 'consistent visual style, coherent color palette, unified art direction';
  
  const scenePrompt = `${optimizedPrompt}, ${baseStyle}, high quality, detailed, professional cinematography`;
  
  try {
    let response;
    
    // 选择参考图片：优先使用用户上传的人物参考图，保持人物一致性
    let referenceImage = null;
    if (referenceImages && referenceImages.length > 0) {
      referenceImage = referenceImages[0];
      console.log('使用人物参考图作为风格参考');
    }
    
    // 处理图片 URL，确保服务器可以访问
    if (referenceImage) {
      // 如果是相对路径（如 /uploads/...），转换为完整 URL
      if (referenceImage.startsWith('/')) {
        referenceImage = `${API_BASE_URL}${referenceImage}`;
        console.log('相对路径转换为完整 URL:', referenceImage);
      }
      // 如果是前端开发服务器地址，转换为后端地址
      else if (referenceImage.includes('localhost:517') || referenceImage.includes('127.0.0.1:517')) {
        const urlObj = new URL(referenceImage);
        referenceImage = `${API_BASE_URL}${urlObj.pathname}`;
        console.log('前端地址转换为后端地址:', referenceImage);
      }
    }
    
    if (referenceImage) {
      console.log('使用图生图保持风格一致性');
      response = await fetch('/api/ai/image-to-image', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prompt: scenePrompt,
          imageUrl: referenceImage,
          count: 1,
          width: 800,
          height: 450,
          user_id: userId,
          organization_id: organizationId,
          strength: 0.5
        })
      });
    } else {
      console.log('使用分镜图工作流生成图片');
      response = await fetch('/api/ai/generate-images', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prompt: scenePrompt,
          count: 1,
          width: 800,
          height: 450,
          user_id: userId,
          organization_id: organizationId,
          workflow_type: 'scene',
          reference_image: referenceImage
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
    
    const imageUrl = await pollTaskAndGetImageUrl(data.tasks[0].promptId);
    return imageUrl;
  } catch (error) {
    console.error('生成分镜图片失败:', error);
    const randomColor = Math.floor(Math.random() * 16777215).toString(16);
    return `https://placehold.co/800x450/${randomColor}/FFF?text=Scene+${scene.sequence}`;
  }
};

/**
 * 轮询视频生成任务状态
 * @param {string} promptId - 任务ID
 * @param {number} maxAttempts - 最大轮询次数
 * @param {number} interval - 轮询间隔（毫秒）
 * @returns {Promise<string>} - 视频URL
 */
export const pollTaskAndGetVideoUrl = async (promptId, maxAttempts = 300, interval = 5000) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`/api/ai/video-task-status/${promptId}`, {
        method: 'GET',
        headers: getAuthHeaders()
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

/**
 * 合成视频
 * 使用第一个分镜的图片作为参考，生成短视频
 * @param {Array} scenes - 分镜步骤数组
 * @param {string} _title - 视频标题（预留参数）
 * @param {string} userId - 用户ID
 * @param {string} organizationId - 组织ID
 * @returns {Promise<string>} - 生成的视频URL
 */
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
    const response = await fetch('/api/ai/generate-video', {
      method: 'POST',
      headers: getAuthHeaders(),
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
    
    console.log('视频生成任务ID:', data.promptId);
    
    // 轮询任务状态
    const videoUrl = await pollTaskAndGetVideoUrl(data.promptId);
    return videoUrl;
  } catch (error) {
    console.error('合成视频失败:', error);
    throw error;
  }
};

// 导出默认对象
export default {
  extractCharacterFromDescription,
  generateCharacterReferenceImages,
  generateCharacterReferenceImagesWithPrompt,
  pollTaskAndGetImageUrl,
  generateStoryboardScript,
  generateSceneImage,
  composeVideo,
  pollTaskAndGetVideoUrl
};
