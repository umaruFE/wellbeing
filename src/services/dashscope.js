import { promptHistoryService } from './promptService';
import { courseGenerationSystemPrompt, promptOptimizationSystemPrompt } from '../lib/prompt-config';

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
            content: courseGenerationSystemPrompt
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
