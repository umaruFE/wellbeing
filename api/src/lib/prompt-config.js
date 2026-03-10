/**
 * 提示词配置文件
 * 从静态 JSON 文件读取配置，支持热修改
 */

import fs from 'path';

// 读取 JSON 配置文件
const configPath = path.join(process.cwd(), 'src', 'lib', 'prompt-config.json');
const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// 导出配置
export const characterExtractionPrompt = configData.characterExtractionPrompts?.default || configData.characterExtractionPrompt || '';
export const characterExtractionPrompts = configData.characterExtractionPrompts || {};
export const characterReferencePrompt = configData.characterReferencePrompt;
export const characterReferencePrompts = configData.characterReferencePrompts || {};
export const qwenImageConfig = configData.qwenImageConfig || {};
export const scenePromptOptimizationPrompt = configData.scenePromptOptimizationPrompt;
export const courseGenerationSystemPrompt = configData.courseGenerationSystemPrompt;

// 提示词优化系统提示词（函数形式）
export const promptOptimizationSystemPrompt = (originalPrompt, elementType) => {
  return configData.promptOptimizationTemplate
    .replace('{originalPrompt}', originalPrompt)
    .replace('{elementType}', elementType === 'image' ? '图片生成' : elementType === 'audio' ? '音频生成' : elementType === 'script' ? '教师讲稿' : elementType === 'activity' ? '教学活动' : 'PPT内容');
};

// 根据风格获取人物特征提取提示词
export const getCharacterExtractionPrompt = (videoStyle) => {
  if (!videoStyle) {
    return characterExtractionPrompts.default || characterExtractionPrompt;
  }

  // 精确匹配
  if (characterExtractionPrompts[videoStyle]) {
    return characterExtractionPrompts[videoStyle];
  }

  // 模糊匹配
  const styleLower = videoStyle.toLowerCase();
  for (const [key, prompt] of Object.entries(characterExtractionPrompts)) {
    const keyLower = key.toLowerCase();
    const keywords = keyLower.split(/[、,]/).filter(k => k.trim());
    if (keywords.some(keyword => keyword && styleLower.includes(keyword))) {
      return prompt;
    }
  }

  return characterExtractionPrompts.default || characterExtractionPrompt;
};

// 根据风格获取 qwen-image 模型的采样参数
export const getQwenImageStyleParams = (videoStyle) => {
  if (!videoStyle || !qwenImageConfig.styleParams) {
    return {
      steps: qwenImageConfig.defaultSteps || 8,
      cfg: qwenImageConfig.defaultCfg || 1,
      sampler: qwenImageConfig.defaultSampler || 'res_multistep',
      scheduler: qwenImageConfig.defaultScheduler || 'sgm_uniform',
      promptEnhance: ''
    };
  }

  // 精确匹配
  if (qwenImageConfig.styleParams[videoStyle]) {
    return qwenImageConfig.styleParams[videoStyle];
  }

  // 模糊匹配
  const styleLower = videoStyle.toLowerCase();
  for (const [key, params] of Object.entries(qwenImageConfig.styleParams)) {
    const keyLower = key.toLowerCase();
    const keywords = keyLower.split(/[、,]/).filter(k => k.trim());
    if (keywords.some(keyword => keyword && styleLower.includes(keyword))) {
      return params;
    }
  }

  // 返回默认参数
  return {
    steps: qwenImageConfig.defaultSteps || 8,
    cfg: qwenImageConfig.defaultCfg || 1,
    sampler: qwenImageConfig.defaultSampler || 'res_multistep',
    scheduler: qwenImageConfig.defaultScheduler || 'sgm_uniform',
    promptEnhance: ''
  };
};
