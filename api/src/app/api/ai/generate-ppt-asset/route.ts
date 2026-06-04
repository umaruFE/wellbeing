import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';

type AssetType = 'image' | 'audio' | 'video';

const workflowByType: Record<AssetType, string> = {
  image: process.env.N8N_PPT_IMAGE_WORKFLOW || 'ai-free-image-generation',
  audio: process.env.N8N_PPT_AUDIO_WORKFLOW || 'gene-music',
  video: process.env.N8N_PPT_VIDEO_WORKFLOW || 'gene-video',
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function imageSizeFromRatio(ratio?: string) {
  if (ratio === '4:3') return { width: 1024, height: 768 };
  if (ratio === '1:1') return { width: 1024, height: 1024 };
  return { width: 1280, height: 720 };
}

function durationToSeconds(value?: string) {
  if (!value) return 60;
  const match = value.match(/(\d+)/);
  if (!match) return 60;
  const amount = Number(match[1]);
  return value.includes('分钟') ? amount * 60 : amount;
}

function pickUrl(result: any) {
  return result?.url
    || result?.assetUrl
    || result?.imageUrl
    || result?.audioUrl
    || result?.videoUrl
    || result?.data?.url
    || result?.data?.assetUrl
    || result?.data?.imageUrl
    || result?.data?.audioUrl
    || result?.data?.videoUrl;
}

function pickTaskId(result: any) {
  return result?.executionId
    || result?.promptId
    || result?.id
    || result?.data?.executionId
    || result?.data?.promptId
    || result?.data?.id
    || result?.tasks?.[0]?.promptId;
}

function normalizeAsset(type: AssetType, title: string, prompt: string, result: any) {
  const taskId = pickTaskId(result);
  const workflowType = type === 'image' ? 'image' : type === 'audio' ? 'music' : 'video';
  return {
    type,
    title,
    prompt,
    url: pickUrl(result),
    taskId,
    status: pickUrl(result) ? 'completed' : 'submitted',
    statusUrl: taskId ? `/api/ai/task-status/${taskId}?workflowType=${workflowType}` : undefined,
    raw: result,
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      assetType,
      assetCode,
      assetName,
      prompt,
      options = {},
      user_id,
      organization_id,
    } = body;

    if (!['image', 'audio', 'video'].includes(assetType)) {
      return NextResponse.json(
        { error: 'assetType 必须是 image、audio 或 video' },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: '缺少必要参数: prompt' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const type = assetType as AssetType;
    const workflow = workflowByType[type];
    const imageSize = imageSizeFromRatio(options.imageRatio);
    const duration = durationToSeconds(options.audioDuration);

    const n8nPayload = {
      assetType: type,
      assetCode,
      assetName,
      prompt,
      ppt: true,
      options,
      user_id,
      organization_id,
      timestamp: Date.now(),
      ...(type === 'image' ? {
        width: imageSize.width,
        height: imageSize.height,
        style: options.imageStyle,
      } : {}),
      ...(type === 'audio' ? {
        duration,
        mood: options.audioMood,
        count: 1,
      } : {}),
      ...(type === 'video' ? {
        video_width: 1280,
        video_height: 720,
        videoType: options.videoType,
        scene: options.videoScene,
        role: options.videoRole,
        script: options.videoScript,
      } : {}),
    };

    console.log('[generate-ppt-asset] 调用 N8N:', {
      workflow,
      assetType: type,
      assetName,
      promptLength: prompt.length,
    });

    const result = await n8nClient.call(workflow, n8nPayload, { timeout: 300000 });
    const asset = normalizeAsset(type, assetName || `${type}素材`, prompt, result);

    return NextResponse.json({
      success: true,
      workflow,
      asset,
      assets: [asset],
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('[generate-ppt-asset] 失败:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'PPT 素材生成失败',
        details: error instanceof Error ? error.stack : null,
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
