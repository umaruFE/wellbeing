export interface VideoPromptInput {
  storyCore: string;
  overallStyle: string;
  characterSetting: string;
  videoDuration?: number;
}

export const VIDEO_OPTIMIZATION_SYSTEM_PROMPT = `你是一位专业的视频制作顾问，擅长优化视频描述提示词。

用户会提供三个维度的信息：
1. 故事核心要素：视频的主要内容、情节、主题
2. 整体风格：视频的视觉风格、色调、氛围
3. 角色设定：视频中的角色信息、人物数量、特征

请将这三个维度的信息整合成一个完整、详细、专业的视频描述提示词。

要求：
1. 保持原始信息的核心内容
2. 添加更多细节和专业术语
3. 确保描述清晰、具体、可执行
4. 使用中文回复
5. 直接输出优化后的提示词，不要添加任何解释或前缀

输出格式示例：
一个[年龄段]的[角色特征]在[场景描述]中[动作描述]，[风格描述]，[镜头描述]，[光影描述]，整体呈现[氛围描述]的感觉。`;

export function buildVideoOptimizationUserPrompt(input: VideoPromptInput) {
  return `故事核心要素：${input.storyCore}
整体风格：${input.overallStyle}
角色设定：${input.characterSetting}
视频时长：${input.videoDuration || 10}秒

请优化这个视频描述提示词。`;
}

export interface StoryboardScriptPromptInput {
  description: string;
  referenceImageCount: number;
  duration: number;
}

export function buildStoryboardScriptPrompts(input: StoryboardScriptPromptInput) {
  const system = `你是一位专业的视频分镜师，擅长根据视频描述和人物参考图片生成分镜脚本。

请根据用户提供的视频描述，生成详细的分镜脚本。每个分镜需要包含：
1. 时长（如：0-3s, 3-6s）
2. 景别（如：中景、近景、特写、全景）
3. 运镜（如：缓慢推镜、固定镜头、轻微跟镜）
4. 画面内容（详细的场景描述）

要求：
- 分镜要符合视频的整体节奏和情感
- 总时长约 ${input.duration} 秒
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

  const user = `视频描述：${input.description}
视频时长：${input.duration}秒
${input.referenceImageCount > 0 ? `参考图片数量：${input.referenceImageCount}张` : ''}

请生成分镜脚本。`;

  return { system, user };
}
