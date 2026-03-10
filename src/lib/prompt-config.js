/**
 * 前端提示词配置文件
 * 从后端 API 动态获取配置，支持多风格
 * 如果 API 不可用，使用默认配置作为后备
 */

const API_URL = import.meta.env.VITE_API_URL || '/api';

// 默认配置（后备）
const defaultConfig = {
  characterExtractionPrompts: {
    default: "你是一个专业的人物特征提取助手。你的任务是从用户的视频描述中提取主要人物/角色的外貌特征。\n\n规则：\n1. 识别人物：包括人、卡通角色、玩偶、动物角色等任何有形象描述的主体\n2. 提取外貌特征：年龄、性别、发型、发色、肤色、服装、配饰、材质（如毛绒、塑料等）\n3. 忽略：场景、道具、动作、情节、旁白内容\n4. 如果描述中有多个角色，选择出现频率最高或最重要的那个\n5. 如果确实没有任何角色描述，返回\"一个通用卡通人物\"\n6. 返回简洁的人物描述，不超过50个字\n\n重要：玩偶、娃娃、卡通形象也算人物！\n\n输出格式：直接返回人物描述，不要添加任何其他内容。\n\n示例：\n输入：\"画面1：一个穿着红色裙子的小女孩在公园里玩耍，旁边有一只小狗\"\n输出：\"一个穿着红色裙子的小女孩\"\n\n输入：\"画面1：地面上有几个打开的箱子，远处有一个架子。娃娃和球散落着\"\n输出：\"一个可爱的布娃娃\"\n\n输入：\"画面1：一只穿着蓝色衣服的卡通小熊在森林里采蜂蜜\"\n输出：\"一只穿着蓝色衣服的卡通小熊\"\n\n输入：\"画面1：一个红色的机器人玩具站在桌子上\"\n输出：\"一个红色的机器人玩具\""
  }
};

const defaultCharacterReferencePrompt = "${characterDescription}，单个或多个人物，纯白色背景，人物特写，正面视角，清晰面部特征，全身照，无背景元素，无道具，无场景，高质量，细节丰富，肖像摄影风格";

const defaultCharacterReferencePrompts = {
  default: "${characterDescription}, single person, white background, portrait, full body, front view, clear facial features, high quality, detailed, 8k, professional photography",
  "水墨风格、中国风、典雅含蓄": "${characterDescription}, Chinese ink painting style, traditional Chinese painting, xuan paper texture, ink wash technique, brush strokes, flow of ink, negative space, elegant, classical, full body portrait, white background, high quality, detailed, sumi-e style, minimalist",
  "3d皮克斯风格、温馨治愈、明亮色彩": "${characterDescription}, 3D Pixar animation style, CGI rendering, warm and healing, bright colors, soft lighting, plastic texture, full body portrait, cute character, adorable, white background, high quality, detailed, octane render, blender 3D",
  "2d手绘风格、简约可爱、柔和色调": "${characterDescription}, 2D hand-drawn animation, cel-shaded, smooth lines, soft colors, anime style, full body portrait, white background, high quality, detailed, illustration style",
  "赛博朋克风格、未来科技、霓虹色调": "${characterDescription}, cyberpunk style, neon lights, metallic texture, futuristic, cybernetic, full body portrait, white background, high quality, detailed, LED lights, chrome, sci-fi",
  "写实风格、逼真细腻、自然光影": "${characterDescription}, photorealistic, professional portrait, studio lighting, natural shadows, full body, white background, high quality, detailed, 8k, high-end camera, realistic texture",
  "卡通风格、夸张有趣、鲜明色彩": "${characterDescription}, cartoon style, exaggerated features, fun and playful, bold colors, vibrant, full body portrait, white background, high quality, detailed, illustration, comic",
  "科幻风格、宇宙太空、未来感": "${characterDescription}, sci-fi style, futuristic, space theme, cosmic, full body portrait, white background, high quality, detailed, alien, space exploration",
  "奇幻风格、魔法元素、神秘氛围": "${characterDescription}, fantasy style, magical, mystical, ethereal, full body portrait, white background, high quality, detailed, enchanted, fantasy art, supernatural"
};

const defaultScenePromptOptimizationPrompt = "你是一个专业的图片生成提示词优化专家，擅长为qwen-image模型优化提示词。\n\n优化规则：\n1. 保持场景的核心内容和动作\n2. 添加光照和氛围描述\n3. 添加质量关键词\n4. 使用中文逗号分隔\n5. 保持简洁，不超过100个汉字\n6. 不要翻译成英文，qwen-image支持中文\n\n输出格式：直接返回优化后的提示词，不要添加任何其他内容。\n\n示例：\n输入：\"一个小女孩在公园喂鸽子\"\n输出：\"一个小女孩在公园喂鸽子，阳光明媚，自然光，温暖氛围，高质量，细节丰富\"\n\n输入：\"一只可爱的小熊在森林里\"\n输出：\"一只可爱的小熊在森林里采蜂蜜，森林背景，阳光透过树叶，温馨治愈，高质量，细节丰富\"";

const defaultCourseGenerationSystemPrompt = "你是一位精通\"PERMA+4E\"课程框架的资深课程设计师。请基于用户提供的核心信息，生成一个完整、详细、可直接使用的教学包。\n\n所有生成内容必须严格遵循以下原则：\n1. PERMA驱动 ：每个环节都自然融入积极心理学五大维度\n2. 4E结构化 ：严格遵循Engage→Empower→Execute→Elevate四阶段\n3. 青少年中心 ：活动设计符合目标学段的认知特点和兴趣偏好\n4. 语言真实性 ：在真实、有意义的交际情境中学习语言\n5. 体验完整性 ：构成完整的学习旅程，有清晰的递进逻辑\n\n请严格按照以下JSON格式返回课程数据，不要包含任何其他文字说明：\n\n{\n  \"courseData\": {\n    \"engage\": {\n      \"title\": \"Engage (引入)\",\n      \"color\": \"bg-purple-100 text-purple-700 border-purple-200\",\n      \"steps\": [\n        {\n          \"id\": \"e1\",\n          \"time\": \"X分钟\",\n          \"title\": \"环节标题\",\n          \"objective\": \"教学目标\",\n          \"activity\": \"活动描述\",\n          \"script\": \"教师讲稿（中文）\",\n          \"assets\": [\n            {\n              \"id\": \"asset-1\",\n              \"type\": \"image|audio|video|text\",\n              \"title\": \"素材标题\",\n              \"url\": \"素材URL（可选）\",\n              \"x\": 0,\n              \"y\": 0,\n              \"width\": 400,\n              \"height\": 300,\n              \"rotation\": 0,\n              \"prompt\": \"生成提示词（用于图片生成）\"\n            }\n          ]\n        }\n      ]\n    },\n    \"empower\": {\n      \"title\": \"Empower (赋能)\",\n      \"color\": \"bg-blue-100 text-blue-700 border-blue-200\",\n      \"steps\": []\n    },\n    \"execute\": {\n      \"title\": \"Execute (实践)\",\n      \"color\": \"bg-green-100 text-green-700 border-green-200\",\n      \"steps\": []\n    },\n    \"elevate\": {\n      \"title\": \"Elevate (升华)\",\n      \"color\": \"bg-yellow-100 text-yellow-700 border-yellow-200\",\n      \"steps\": []\n    }\n  }\n}\n\n课程设计要求：\n1. Engage阶段：15-20分钟，情感连接与动机唤醒\n   - 流程：情绪启动活动、主题引入、个人连接、目标设定\n   - 要求：3分钟内抓住注意力，主题呈现符合青少年审美，建立\"这与我有关\"的连接\n\n2. Empower阶段：45-55分钟，支架学习与技能构建\n   - 流程：情境化输入、趣味化读写练习、初步应用\n   - 要求：输入情境真实有趣，练习从控制性过渡到半开放性，提供足够的语言和策略支架\n\n3. Execute阶段：35-45分钟，创意实践与初步产出\n   - 流程：任务说明、创意实践、成果分享\n   - 要求：任务允许个性化表达，创作过程有清晰步骤指导，分享环节具有鼓励性\n\n4. Elevate阶段：15-20分钟，即时反思与期待构建\n   - 流程：亮点庆祝、个人反思、悬念设置\n   - 要求：庆祝方式具体真诚，反思工具简单易用，悬念能引发真实期待\n\n活动设计要求：\n- 活动形式：从多元活动形式库中选择3-5种核心活动形式\n- PERMA体验强化：融入积极情绪、全心投入、人际关系、意义感、成就感策略\n- 语言目标：核心词汇、句型、语法的学习和应用\n- 教学资源：PPT设计、工作纸/手册设计、教具/材料、环境布置建议\n\n生成的课程内容需要：\n- 符合目标学生年龄段的兴趣特征\n- 匹配单元语言目标适合的表达形式\n- 体现PERMA重点维度\n- 形式新颖、可操作、有吸引力\n- 包含详细的教师中文讲稿\n- 提供多媒体素材建议和AI生成指令";

const defaultPromptOptimizationTemplate = "你是一位专业的提示词优化专家，擅长为不同类型的内容生成高质量的提示词。\n\n请根据以下原始提示词和元素类型，生成优化后的提示词：\n\n原始提示词：{originalPrompt}\n元素类型：{elementType}\n\n优化要求：\n1. 保持原始提示词的核心意图\n2. 提高提示词的明确性和具体性\n3. 添加适当的细节和约束条件\n4. 确保提示词符合目标受众的需求\n5. 优化后的提示词应该更能引导AI生成高质量的内容\n\n请直接返回优化后的提示词，不要包含任何其他文字说明。";

// 缓存配置
let cachedConfig = null;
let configLoading = false;
let configLoadPromise = null;

// 从 API 加载配置
async function loadConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  if (configLoading) {
    return configLoadPromise;
  }

  configLoading = true;
  configLoadPromise = (async () => {
    try {
      const response = await fetch(`${API_URL}/ai/prompt-config`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          cachedConfig = result.data;
          console.log('提示词配置已从API加载');
          return cachedConfig;
        }
      }
    } catch (error) {
      console.warn('从API加载提示词配置失败，使用默认配置:', error.message);
    }

    // 返回默认配置
    cachedConfig = {
      characterExtractionPrompts: defaultConfig.characterExtractionPrompts,
      characterReferencePrompt: defaultCharacterReferencePrompt,
      characterReferencePrompts: defaultCharacterReferencePrompts,
      qwenImageConfig: {},
      scenePromptOptimizationPrompt: defaultScenePromptOptimizationPrompt,
      courseGenerationSystemPrompt: defaultCourseGenerationSystemPrompt,
      promptOptimizationTemplate: defaultPromptOptimizationTemplate
    };

    return cachedConfig;
  })();

  return configLoadPromise;
}

// 同步获取配置（需要先调用 loadConfig）
function getConfig() {
  if (!cachedConfig) {
    // 如果没有缓存，返回默认配置
    return {
      characterExtractionPrompts: defaultConfig.characterExtractionPrompts,
      characterReferencePrompt: defaultCharacterReferencePrompt,
      characterReferencePrompts: defaultCharacterReferencePrompts,
      qwenImageConfig: {},
      scenePromptOptimizationPrompt: defaultScenePromptOptimizationPrompt,
      courseGenerationSystemPrompt: defaultCourseGenerationSystemPrompt,
      promptOptimizationTemplate: defaultPromptOptimizationTemplate
    };
  }
  return cachedConfig;
}

// 初始化配置（可选，用于预加载）
export async function initPromptConfig() {
  return loadConfig();
}

// 导出默认配置（保持向后兼容）
export const characterExtractionPrompt = defaultConfig.characterExtractionPrompts.default;
export const characterReferencePrompt = defaultCharacterReferencePrompt;
export const characterReferencePrompts = defaultCharacterReferencePrompts;
export const scenePromptOptimizationPrompt = defaultScenePromptOptimizationPrompt;
export const courseGenerationSystemPrompt = defaultCourseGenerationSystemPrompt;

// 提示词优化系统提示词（函数形式）- 同步版本，使用默认模板
export const promptOptimizationSystemPrompt = (originalPrompt, elementType) => {
  const config = getConfig();
  const template = config.promptOptimizationTemplate || defaultPromptOptimizationTemplate;

  // 图片类型不翻译，保持中文
  if (elementType === 'image') {
    return `你是一个专业的图片生成提示词优化专家，擅长为qwen-image模型优化提示词。\n\n优化要求：\n1. 保持原始提示词的核心意图\n2. 提高提示词的明确性和具体性\n3. 添加光照、氛围、质量等关键词\n4. 使用中文逗号分隔\n5. 不要翻译成英文，qwen-image支持中文\n6. 保持简洁，不超过100个汉字\n\n请直接返回优化后的提示词，不要添加任何其他文字说明。`;
  }

  // 视频类型使用英文格式（LTX2.0需要）
  if (elementType === 'video') {
    return `你是一个专业的视频生成提示词优化专家，擅长为LTX2.0视频生成模型优化提示词。\n\nLTX2.0是一个先进的视频生成模型，需要特定的提示词格式来生成高质量视频。\n\n优化规则：\n1. 保持场景的核心内容和动作\n2. 添加LTX2.0需要的运动描述（如：缓慢移动、快速切换、平稳推进等）\n3. 添加光照和氛围描述\n4. 添加相机运动描述（如：推近、拉远、平移、旋转等）\n5. 保持简洁，不超过100个汉字\n6. 使用英文逗号分隔关键词\n7. 不要包含旁白或对话内容\n\n输出格式：直接返回优化后的提示词，不要添加任何其他内容。\n\n示例：\n输入场景：\"小女孩走进公园，看到一只小狗\"\n人物：\"一个穿粉色裙子的小女孩\"\n输出：\"a little girl in pink dress walking into park, seeing a cute puppy, gentle natural lighting, smooth camera tracking shot, warm atmosphere, cinematic composition\"`;
  }

  // 其他类型
  return template
    .replace('{originalPrompt}', originalPrompt)
    .replace('{elementType}', elementType === 'image' ? '图片生成' : elementType === 'audio' ? '音频生成' : elementType === 'script' ? '教师讲稿' : elementType === 'activity' ? '教学活动' : 'PPT内容');
};

// 异步获取配置的方法（推荐使用）
export async function getPromptConfig() {
  return loadConfig();
}

// 获取人物特征提取提示词
export async function getCharacterExtractionPrompt(videoStyle) {
  const config = await loadConfig();
  const prompts = config.characterExtractionPrompts || defaultConfig.characterExtractionPrompts;

  if (!videoStyle) {
    return prompts.default || Object.values(prompts)[0];
  }

  // 精确匹配
  if (prompts[videoStyle]) {
    return prompts[videoStyle];
  }

  // 模糊匹配
  const styleLower = videoStyle.toLowerCase();
  for (const [key, prompt] of Object.entries(prompts)) {
    const keyLower = key.toLowerCase();
    const keywords = keyLower.split(/[、,]/).filter(k => k.trim());
    if (keywords.some(keyword => keyword && styleLower.includes(keyword))) {
      return prompt;
    }
  }

  return prompts.default || Object.values(prompts)[0];
}

// 获取人物参考图提示词
export async function getCharacterReferencePrompt(characterDescription, videoStyle) {
  const config = await loadConfig();
  const prompts = config.characterReferencePrompts || defaultCharacterReferencePrompts;
  const defaultPrompt = config.characterReferencePrompt || defaultCharacterReferencePrompt;

  let template = defaultPrompt;

  if (videoStyle) {
    // 精确匹配
    if (prompts[videoStyle]) {
      template = prompts[videoStyle];
    } else {
      // 模糊匹配
      const styleLower = videoStyle.toLowerCase();
      for (const [key, prompt] of Object.entries(prompts)) {
        const keyLower = key.toLowerCase();
        const keywords = keyLower.split(/[、,]/).filter(k => k.trim());
        if (keywords.some(keyword => keyword && styleLower.includes(keyword))) {
          template = prompt;
          break;
        }
      }
    }
  }

  return template.replace('${characterDescription}', characterDescription);
}

// 获取 qwen-image 采样参数
export async function getQwenImageStyleParams(videoStyle) {
  const config = await loadConfig();
  const qwenImageConfig = config.qwenImageConfig || {};

  const defaultParams = {
    steps: qwenImageConfig.defaultSteps || 8,
    cfg: qwenImageConfig.defaultCfg || 1,
    sampler: qwenImageConfig.defaultSampler || 'res_multistep',
    scheduler: qwenImageConfig.defaultScheduler || 'sgm_uniform',
    promptEnhance: ''
  };

  if (!videoStyle || !qwenImageConfig.styleParams) {
    return defaultParams;
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

  return defaultParams;
}

// 获取所有可用风格
export async function getAvailableStyles() {
  const config = await loadConfig();
  return {
    characterExtractionStyles: Object.keys(config.characterExtractionPrompts || defaultConfig.characterExtractionPrompts),
    characterReferenceStyles: Object.keys(config.characterReferencePrompts || defaultCharacterReferencePrompts)
  };
}
