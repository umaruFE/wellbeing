import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 读取 JSON 配置文件
const configPath = path.join(process.cwd(), 'src', 'lib', 'prompt-config.json');
const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));

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

// GET /api/ai/prompt-config - 获取所有提示词配置
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: {
        characterExtractionPrompts: configData.characterExtractionPrompts || {},
        characterReferencePrompts: configData.characterReferencePrompts || {},
        qwenImageConfig: configData.qwenImageConfig || {},
        scenePromptOptimizationPrompt: configData.scenePromptOptimizationPrompt || '',
        courseGenerationSystemPrompt: configData.courseGenerationSystemPrompt || '',
        promptOptimizationTemplate: configData.promptOptimizationTemplate || ''
      }
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('获取提示词配置失败:', error);
    return NextResponse.json(
      { error: '获取提示词配置失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
