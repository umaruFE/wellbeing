import { promptHistoryService } from './promptService';

const API_KEY = import.meta.env.VITE_DASHSCOPE_API_KEY;
const API_URL = import.meta.env.VITE_DASHSCOPE_API_URL;
const BASE_API_URL = import.meta.env.VITE_API_URL || '/api';

// 安全检查：如果环境变量未定义，抛出明确的错误
if (!API_URL) {
  throw new Error('环境变量 VITE_DASHSCOPE_API_URL 未定义，请确保 .env 文件已正确配置并重启开发服务器');
}
if (!API_KEY) {
  throw new Error('环境变量 VITE_DASHSCOPE_API_KEY 未定义，请确保 .env 文件已正确配置并重启开发服务器');
}

// 默认提示词配置（后备）
const defaultPromptOptimizationTemplate = `你是一位专业的提示词优化专家，擅长为不同类型的内容生成高质量的提示词。

请根据以下原始提示词和元素类型，生成优化后的提示词：

原始提示词：{originalPrompt}
元素类型：{elementType}

优化要求：
1. 保持原始提示词的核心意图
2. 提高提示词的明确性和具体性
3. 添加适当的细节和约束条件
4. 确保提示词符合目标受众的需求
5. 优化后的提示词应该更能引导AI生成高质量的内容

请直接返回优化后的提示词，不要包含任何其他文字说明。`;

const defaultCourseGenerationSystemPrompt = `你是一位精通"PERMA+4E"课程框架的资深课程设计师。请基于用户提供的核心信息，生成一个完整、详细、可直接使用的教学包。

所有生成内容必须严格遵循以下原则：
1. PERMA驱动 ：每个环节都自然融入积极心理学五大维度
2. 4E结构化 ：严格遵循Engage→Empower→Execute→Elevate四阶段
3. 青少年中心 ：活动设计符合目标学段的认知特点和兴趣偏好
4. 语言真实性 ：在真实、有意义的交际情境中学习语言
5. 体验完整性 ：构成完整的学习旅程，有清晰的递进逻辑

请严格按照以下JSON格式返回课程数据，不要包含任何其他文字说明：

{
  "courseData": {
    "engage": {
      "title": "Engage (引入)",
      "color": "bg-purple-100 text-purple-700 border-purple-200",
      "steps": [
        {
          "id": "e1",
          "time": "X分钟",
          "title": "环节标题",
          "objective": "教学目标",
          "activity": "活动描述",
          "script": "教师讲稿（中文）",
          "assets": [
            {
              "id": "asset-1",
              "type": "image|audio|video|text",
              "title": "素材标题",
              "url": "素材URL（可选）",
              "x": 0,
              "y": 0,
              "width": 400,
              "height": 300,
              "rotation": 0,
              "prompt": "生成提示词（用于图片生成）"
            }
          ]
        }
      ]
    },
    "empower": {
      "title": "Empower (赋能)",
      "color": "bg-blue-100 text-blue-700 border-blue-200",
      "steps": []
    },
    "execute": {
      "title": "Execute (实践)",
      "color": "bg-green-100 text-green-700 border-green-200",
      "steps": []
    },
    "elevate": {
      "title": "Elevate (升华)",
      "color": "bg-yellow-100 text-yellow-700 border-yellow-200",
      "steps": []
    }
  }
}

课程设计要求：
1. Engage阶段：15-20分钟，情感连接与动机唤醒
   - 流程：情绪启动活动、主题引入、个人连接、目标设定
   - 要求：3分钟内抓住注意力，主题呈现符合青少年审美，建立"这与我有关"的连接

2. Empower阶段：45-55分钟，支架学习与技能构建
   - 流程：情境化输入、趣味化读写练习、初步应用
   - 要求：输入情境真实有趣，练习从控制性过渡到半开放性，提供足够的语言和策略支架

3. Execute阶段：35-45分钟，创意实践与初步产出
   - 流程：任务说明、创意实践、成果分享
   - 要求：任务允许个性化表达，创作过程有清晰步骤指导，分享环节具有鼓励性

4. Elevate阶段：15-20分钟，即时反思与期待构建
   - 流程：亮点庆祝、个人反思、悬念设置
   - 要求：庆祝方式具体真诚，反思工具简单易用，悬念能引发真实期待

活动设计要求：
- 活动形式：从多元活动形式库中选择3-5种核心活动形式
- PERMA体验强化：融入积极情绪、全心投入、人际关系、意义感、成就感策略
- 语言目标：核心词汇、句型、语法的学习和应用
- 教学资源：PPT设计、工作纸/手册设计、教具/材料、环境布置建议

生成的课程内容需要：
- 符合目标学生年龄段的兴趣特征
- 匹配单元语言目标适合的表达形式
- 体现PERMA重点维度
- 形式新颖、可操作、有吸引力
- 包含详细的教师中文讲稿
- 提供多媒体素材建议和AI生成指令`;

// 缓存配置
let cachedConfig = null;
let configLoading = false;
let configLoadPromise = null;

// 从 API 加载提示词配置
async function loadPromptConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }

  if (configLoading) {
    return configLoadPromise;
  }

  configLoading = true;
  configLoadPromise = (async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/ai/prompt-config`, {
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
      promptOptimizationTemplate: defaultPromptOptimizationTemplate,
      courseGenerationSystemPrompt: defaultCourseGenerationSystemPrompt
    };

    return cachedConfig;
  })();

  return configLoadPromise;
}

// 获取优化提示词的系统提示
function getOptimizationPrompt(originalPrompt, elementType) {
  // 图片类型不翻译，保持中文
  if (elementType === 'image') {
    return `你是一个专业的图片生成提示词优化专家，擅长为qwen-image模型优化提示词。

优化要求：
1. 保持原始提示词的核心意图
2. 提高提示词的明确性和具体性
3. 添加光照、氛围、质量等关键词
4. 使用中文逗号分隔
5. 不要翻译成英文，qwen-image支持中文
6. 保持简洁，不超过100个汉字

请直接返回优化后的提示词，不要添加任何其他文字说明。`;
  }

  // 视频类型使用英文格式（LTX2.0需要）
  if (elementType === 'video') {
    return `你是一个专业的视频生成提示词优化专家，擅长为LTX2.0视频生成模型优化提示词。

LTX2.0是一个先进的视频生成模型，需要特定的提示词格式来生成高质量视频。

优化规则：
1. 保持场景的核心内容和动作
2. 添加LTX2.0需要的运动描述（如：缓慢移动、快速切换、平稳推进等）
3. 添加光照和氛围描述
4. 添加相机运动描述（如：推近、拉远、平移、旋转等）
5. 保持简洁，不超过100个汉字
6. 使用英文逗号分隔关键词
7. 不要包含旁白或对话内容

输出格式：直接返回优化后的提示词，不要添加任何其他内容。

示例：
输入场景："小女孩走进公园，看到一只小狗"
人物："一个穿粉色裙子的小女孩"
输出："a little girl in pink dress walking into park, seeing a cute puppy, gentle natural lighting, smooth camera tracking shot, warm atmosphere, cinematic composition"`;
  }

  // 其他类型
  if (cachedConfig && cachedConfig.promptOptimizationTemplate) {
    return cachedConfig.promptOptimizationTemplate
      .replace('{originalPrompt}', originalPrompt)
      .replace('{elementType}', elementType === 'image' ? '图片生成' : elementType === 'audio' ? '音频生成' : elementType === 'script' ? '教师讲稿' : elementType === 'activity' ? '教学活动' : 'PPT内容');
  }

  return defaultPromptOptimizationTemplate
    .replace('{originalPrompt}', originalPrompt)
    .replace('{elementType}', elementType === 'image' ? '图片生成' : elementType === 'audio' ? '音频生成' : elementType === 'script' ? '教师讲稿' : elementType === 'activity' ? '教学活动' : 'PPT内容');
}

export const optimizePrompt = async (originalPrompt, elementType, userId = null) => {
  const systemPrompt = getOptimizationPrompt(originalPrompt, elementType);

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

export const generateCourseData = async (config, userId = null, organizationId = null, onProgress = null) => {
  const { age, unit, duration, theme, keywords, isCustomUnit, customUnit } = config;

  const unitName = isCustomUnit ? customUnit : unit;

  const userPrompt = `请为以下配置生成完整的英语课程设计：

学生年龄：${age}
课程单元：${unitName}
课程时长：${duration}
剧情主题：${theme}
重点关键词：${keywords || '无'}

班级基础信息：
- 学生人数：6人
- 年龄范围：7-9岁
- 平均CEFR级别：A1
- 英语水平分布：略有差异
- 优势技能：听力
- 待提升技能：阅读
- 课堂行为特征：积极参与型、容易分心、合作意愿强
- 已知的集体兴趣点：动漫二次元、游戏电竞、体育运动
- 可用资源与限制：活动教室、基础多媒体、低成本预算

语言目标：
- 核心词汇：at, on, in, under, home, boat, cool, keep, ball, doll, car, shelf, box, now, cap, map, put
- 核心句型：Do you have old things at home? Yes, I have some old books. Where is ..?
- 核心语法：1. prepositions: in, on, at, under; 2. simple present tense: Do you have ...?

请根据以上信息，设计一个完整的PERMA+4E教学法课程，包含Engage、Empower、Execute、Elevate四个阶段的所有环节。
每个阶段至少包含1-2个具体的教学步骤，并提供详细的教师讲稿、PPT设计、工作纸/手册设计、教具/材料和环境布置建议。

活动设计要求：
- 融入积极心理学五大维度（PERMA）
- 选择3-5种核心活动形式
- 符合目标学生年龄段的兴趣特征
- 匹配单元语言目标适合的表达形式
- 形式新颖、可操作、有吸引力
- 包含详细的教师中文讲稿
- 提供多媒体素材建议和AI生成指令

重要提示：所有生成的内容（包括教师讲稿、活动描述、教学目标等）都必须使用中文。`;

  const startTime = Date.now();
  let courseData = null;
  let errorMessage = null;

  // 报告进度函数
  const reportProgress = (progress, text) => {
    if (onProgress && typeof onProgress === 'function') {
      onProgress(progress, text);
    }
  };

  // 开始请求，报告初始进度
  reportProgress(10, '正在连接AI服务...');

  try {
    // 加载课程生成提示词
    const promptConfig = await loadPromptConfig();
    const courseSystemPrompt = promptConfig.courseGenerationSystemPrompt || defaultCourseGenerationSystemPrompt;

    reportProgress(20, '正在发送请求...');

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
            content: courseSystemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    reportProgress(40, 'AI正在生成课程内容...');

    const data = await response.json();

    reportProgress(70, '正在解析课程数据...');

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const content = data.choices[0].message.content;

      // 尝试提取 JSON 数据
      let jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法在API返回内容中找到JSON数据');
      }

      let jsonStr = jsonMatch[0];

      // 尝试解析 JSON
      try {
        const parsedData = JSON.parse(jsonStr);
        courseData = parsedData.courseData;
        reportProgress(90, '课程数据解析完成...');
      } catch (parseError) {
        console.error('JSON解析失败，尝试修复:', parseError.message);
        console.error('原始JSON字符串:', jsonStr.substring(0, 500));

        // 尝试修复常见的 JSON 错误
        let fixedJsonStr = jsonStr
          .replace(/,\s*}/g, '}')  // 移除对象末尾的逗号
          .replace(/,\s*]/g, ']')  // 移除数组末尾的逗号
          .replace(/'/g, '"')       // 将单引号替换为双引号
          .replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3')  // 为未加引号的键添加引号
          .replace(/:\s*'([^']*)'/g, ': "$1"');  // 修复字符串值

        try {
          const parsedData = JSON.parse(fixedJsonStr);
          courseData = parsedData.courseData;
          reportProgress(90, '课程数据解析完成...');
          console.log('JSON修复成功');
        } catch (fixedError) {
          console.error('JSON修复失败:', fixedError.message);
          throw new Error(`无法解析API返回的JSON数据: ${parseError.message}`);
        }
      }
    } else {
      throw new Error('API返回数据格式不正确');
    }
  } catch (error) {
    console.error('生成课程数据失败:', error);
    errorMessage = error.message;
    throw error;
  } finally {
    // 保存到历史记录
    if (userId) {
      const executionTime = Date.now() - startTime;
      try {
        await promptHistoryService.saveHistory({
          user_id: userId,
          organization_id: organizationId,
          prompt_type: 'course_generation',
          original_prompt: userPrompt,
          generated_result: courseData,
          execution_time: executionTime,
          success: !errorMessage,
          error_message: errorMessage
        });
      } catch (historyError) {
        console.error('保存提示词历史失败:', historyError);
      }
    }
  }

  return courseData;
};

// 预加载提示词配置
export async function initPromptConfig() {
  return loadPromptConfig();
}
