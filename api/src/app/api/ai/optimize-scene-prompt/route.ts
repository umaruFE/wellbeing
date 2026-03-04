import { NextRequest, NextResponse } from 'next/server';
import { scenePromptOptimizationPrompt } from '@/lib/prompt-config';

const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_API_URL = process.env.DASHSCOPE_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

// CORS 响应头辅助函数
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

// OPTIONS 处理函数 - 处理预检请求
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

// POST /api/ai/optimize-scene-prompt - 优化分镜提示词为LTX2.0格式
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scene, characterDescription, videoStyle = 'realistic' } = body;

    if (!scene || !scene.content) {
      return NextResponse.json(
        { error: '缺少scene参数' },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (!DASHSCOPE_API_KEY) {
      console.error('DASHSCOPE_API_KEY 未配置');
      // 返回原始提示词
      return NextResponse.json({
        success: true,
        prompt: generateFallbackPrompt(scene, characterDescription, videoStyle)
      }, { headers: corsHeaders() });
    }

    const systemPrompt = scenePromptOptimizationPrompt;

    const userPrompt = `场景内容：${scene.content}
旁白：${scene.narration || '无'}
镜头类型：${scene.shotType || '中景'}
运镜方式：${scene.cameraMovement || '固定'}
人物描述：${characterDescription || '未指定'}
视频风格：${videoStyle}

请为LTX2.0视频生成模型优化这个分镜的提示词。`;

    const response = await fetch(`${DASHSCOPE_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DASHSCOPE_API_KEY}`
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
            content: userPrompt
          }
        ],
        temperature: 0.5,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('通义千问 API 调用失败:', response.status, response.statusText, errorText);
      return NextResponse.json({
        success: true,
        prompt: generateFallbackPrompt(scene, characterDescription, videoStyle)
      }, { headers: corsHeaders() });
    }

    const data = await response.json();
    const optimizedPrompt = data.choices?.[0]?.message?.content?.trim() || 
      generateFallbackPrompt(scene, characterDescription, videoStyle);

    console.log('原始场景:', scene.content);
    console.log('优化后提示词:', optimizedPrompt);

    return NextResponse.json({
      success: true,
      prompt: optimizedPrompt,
      original: scene.content
    }, { headers: corsHeaders() });

  } catch (error) {
    console.error('优化分镜提示词失败:', error);
    return NextResponse.json({
      success: true,
      prompt: generateFallbackPrompt(body?.scene, body?.characterDescription, body?.videoStyle)
    }, { headers: corsHeaders() });
  }
}

// 生成备用提示词
function generateFallbackPrompt(scene: any, characterDescription?: string, videoStyle: string = 'realistic') {
  const content = scene?.content || 'a scene';
  const shotType = scene?.shotType || 'medium shot';
  const cameraMovement = scene?.cameraMovement || 'static';
  
  const styleKeywords: Record<string, string> = {
    realistic: 'photorealistic, cinematic lighting',
    anime: 'anime style, vibrant colors',
    cartoon: 'cartoon style, bright colors',
    cinematic: 'cinematic, film grain, dramatic lighting'
  };
  
  const character = characterDescription ? `featuring ${characterDescription}, ` : '';
  const style = styleKeywords[videoStyle] || styleKeywords.realistic;
  
  return `${character}${content}, ${shotType}, ${cameraMovement}, ${style}, high quality, smooth motion`;
}
