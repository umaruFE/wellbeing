/**
 * 提示词配置文件
 * 从静态 JSON 文件读取配置，支持热修改
 */

import fs from 'path';

// 读取 JSON 配置文件
const configPath = path.join(process.cwd(), 'src', 'lib', 'prompt-config.json');
const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// 导出配置
export const characterExtractionPrompt = configData.characterExtractionPrompt;
export const characterReferencePrompt = configData.characterReferencePrompt;
export const characterReferencePrompts = configData.characterReferencePrompts || {};
export const scenePromptOptimizationPrompt = configData.scenePromptOptimizationPrompt;
export const courseGenerationSystemPrompt = configData.courseGenerationSystemPrompt;

// 提示词优化系统提示词（函数形式）
export const promptOptimizationSystemPrompt = (originalPrompt, elementType) => {
  return configData.promptOptimizationTemplate
    .replace('{originalPrompt}', originalPrompt)
    .replace('{elementType}', elementType === 'image' ? '图片生成' : elementType === 'audio' ? '音频生成' : elementType === 'script' ? '教师讲稿' : elementType === 'activity' ? '教学活动' : 'PPT内容');
};
