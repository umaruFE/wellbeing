import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

const DASHSCOPE_API_KEY = process.env.VITE_DASHSCOPE_API_KEY;
const DASHSCOPE_API_URL = process.env.VITE_DASHSCOPE_API_URL;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

interface ExtractRequest {
  prompt: string;
  selectedRoles: string[];
}

interface ExtractResponse {
  background: string;
  roles: {
    [roleName: string]: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401, headers: corsHeaders() }
      );
    }

    if (!DASHSCOPE_API_KEY || !DASHSCOPE_API_URL) {
      return NextResponse.json(
        { error: 'DashScope API配置缺失' },
        { status: 500, headers: corsHeaders() }
      );
    }

    const body = await request.json();
    const { prompt, selectedRoles } = body as ExtractRequest;

    if (!prompt || !selectedRoles || selectedRoles.length === 0) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const systemPrompt = `你是一个专业的场景描述分析助手。你的任务是从用户的场景描述中提取：
1. 背景环境描述（不包含任何角色的描述）
2. 每个IP角色的具体动作描述

请以JSON格式返回，格式如下：
{
  "background": "背景环境描述",
  "roles": {
    "poppy": "角色动作描述",
    "edi": "角色动作描述"
  }
}

重要规则：

【IP角色固有属性守则 - 必须严格遵守】
所有角色均为"非人类卡通生物"，其视觉特征必须严格遵循以下限制，违背任何一项将被判定为任务失败：
- **禁止添加衣物**：它们不穿任何衣服、内衣、背心、外套、裤子或裙子。
- **禁止添加鞋帽**：它们始终赤脚，不穿鞋子、袜子、运动鞋，也不戴帽子。
- **禁止添加头发**：它们没有头发，不存在"发丝飞扬"、"马尾"、"短发"等描述。
- **禁止拟人化细节**：没有睫毛、眼影、指甲、脚趾、肚脐或明显的肌肉线条。
- **五官特征**：眼睛是极简的纯黑实心圆点，嘴巴是简单的黑色线条，没有任何复杂的瞳孔、白眼球或唇色。
- **肢体特征**：四肢为极简的细长管状（线条状），手脚是圆润的末端，没有手指和脚趾的区分。

【背景描述要求】
- 必须详细丰富，包含以下要素：
  * 时间：白天、夜晚、黄昏、黎明等
  * 天气：晴天、阴天、雨天、雪天等
  * 光线：阳光、月光、星光、灯光、烛光等
  * 色调：暖色调、冷色调、明亮、昏暗等
  * 氛围：温馨、神秘、欢快、宁静、浪漫等
  * 环境元素：天空、地面、建筑、植物、装饰物等
  * 关键状态：必须准确捕捉场景中的关键状态描述（如"门打开着"、"窗户开着"、"灯亮着"等），这些状态是场景的重要组成部分
- 必须包含的风格关键词：
  * 扁平矢量插画，粗细均匀的黑色轮廓线，单线风格，2D扁平设计
  * 无渐变，无阴影，低饱和度的平涂色彩、和谐的柔和色调、连贯的配色方案
  * 简化但风格化的背景环境，清晰的环境线稿，非写实扁平插画
  * 干净亲和的美学，沉浸式叙事扁平背景，画面无人物无文字
- 禁止出现的内容：
  * 任何角色（IP角色）
  * 任何小动物（小猫、小狗、小兔子等）
- 示例：
  * 简单描述："夜晚的楼顶，rolly正在逗小猫玩" → 详细描述："扁平矢量插画，粗细均匀的黑色轮廓线，单线风格，2D扁平设计，无渐变，无阴影，低饱和度的平涂色彩、和谐的柔和色调、连贯的配色方案，夜晚的城市楼顶，深蓝色的夜空中繁星点点，明亮的月光洒在地面，远处是灯火辉煌的城市夜景，楼顶有护栏和几盆绿植，简化但风格化的背景环境，清晰的环境线稿，非写实扁平插画，干净亲和的美学，沉浸式叙事扁平背景，整体氛围宁静而浪漫，画面无人物无文字"
  * 简单描述："校门口，校门打开着" → 详细描述："扁平矢量插画，粗细均匀的黑色轮廓线，单线风格，2D扁平设计，无渐变，无阴影，低饱和度的平涂色彩、和谐的柔和色调、连贯的配色方案，清晨的校园门口，柔和的晨光洒在红砖地面上，天空呈淡青色渐变为浅金，校门是深红色铁艺拱门，大门敞开着，两侧立着整齐的银杏树，枝叶初绿，门旁立有铜牌和一排盛开的粉色海棠花，地面干净整洁，简化但风格化的背景环境，清晰的环境线稿，非写实扁平插画，干净亲和的美学，沉浸式叙事扁平背景，整体氛围朝气蓬勃、宁静而充满希望，画面无人物无文字"
  * 简单描述："森林" → 详细描述："扁平矢量插画，粗细均匀的黑色轮廓线，单线风格，2D扁平设计，无渐变，无阴影，低饱和度的平涂色彩、和谐的柔和色调、连贯的配色方案，阳光明媚的魔法森林，高大的古树参天，翠绿的树叶间透出斑驳的阳光，地面铺满柔软的青苔和五彩斑斓的野花，远处有潺潺的小溪，空气中弥漫着清新的草木香，简化但风格化的背景环境，清晰的环境线稿，非写实扁平插画，干净亲和的美学，沉浸式叙事扁平背景，充满生机和神秘感，画面无人物无文字"

【角色动作描述要求】
- 核心原则：只描述角色本身，绝对不包含任何背景、环境、场景元素
- 必须详细具体，包含以下要素：
  * 具体动作：站立、坐着、跳跃、奔跑等
  * 姿态细节：身体朝向、手部动作、腿部姿态等
  * 表情神态：开心、专注、惊讶、思考等
  * 与小物件的互动：如何使用或互动
- 允许出现的小物件：
  * 家具：椅子、凳子、桌子、沙发、床等
  * 小物品：书本、杯子、玩具、花朵、望远镜、乐器、球、跳绳、逗猫棒等道具
- 绝对禁止出现的内容：
  * 天空、夜空、星空等任何天空相关元素
  * 太阳、月亮、星星、云朵等天体和气象元素
  * 地面、草地、土地等地面元素
  * 山、河流、湖泊、海洋、森林、草原等自然景观
  * 建筑、房屋、树木、花草等环境物体
  * 任何背景、场景、环境描述
- 如果原描述包含观察某个大环境物体（如月亮、星星、远山），只需描述"专注地观察"或"抬头观察"而不指明观察对象
- 示例：
  * 简单描述："正在用天文望远镜观察月亮" → 详细描述："专注地站在望远镜前，双手扶着望远镜，身体微微前倾，眼睛凑近目镜，表情认真而好奇，正在专注地观察远方"
  * 简单描述："正在数星星" → 详细描述："坐在地上，双腿盘起，双手撑在身后，仰着头，眼睛睁得大大的，嘴角带着微笑，正在认真地数着什么"
  * 简单描述："正在逗小猫玩" → 详细描述："蹲在地上，一手拿着逗猫棒轻轻晃动，另一手半张开呈邀请状伸向前方，脸上洋溢着开心的笑容，身体前倾、膝盖微屈，正轻声呼唤并耐心等待"
  * 简单描述："站在楼顶看夜景" → 详细描述："笔直地站着，双手自然下垂，微微仰着头，眼睛睁大，嘴角带着微笑，正专注地观察前方"`;

    const userPrompt = `场景描述：${prompt}
选中的角色：${selectedRoles.join(', ')}

请提取背景描述和每个角色的动作描述。`;

    const response = await fetch(DASHSCOPE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DashScope API错误:', errorText);
      throw new Error(`AI服务调用失败: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    console.log('AI返回内容:', content);

    let extractedData: ExtractResponse;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法从AI响应中提取JSON');
      }
    } catch (parseError) {
      console.error('解析AI响应失败:', parseError);
      extractedData = {
        background: prompt,
        roles: selectedRoles.reduce((acc, role) => {
          acc[role] = prompt;
          return acc;
        }, {} as { [key: string]: string })
      };
    }

    return NextResponse.json({
      success: true,
      data: extractedData
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('提取关键词失败:', error);
    return NextResponse.json(
      { error: '提取关键词失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
