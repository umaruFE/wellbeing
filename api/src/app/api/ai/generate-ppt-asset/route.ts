import { NextRequest, NextResponse } from 'next/server';
import { n8nClient } from '@/lib/n8n/client';

type AssetType = 'image' | 'audio' | 'video';

const workflowByType: Record<AssetType, string> = {
  image: process.env.N8N_PPT_IMAGE_WORKFLOW || 'ai-image-generation',
  audio: process.env.N8N_PPT_AUDIO_WORKFLOW || 'gene-music',
  video: process.env.N8N_PPT_VIDEO_WORKFLOW || 'gene-video',
};

const imageSubtypeByCode: Record<string, string> = {
  B1: 'theme_background',
  B2: 'poster_with_text',
  B3: 'vocabulary_flashcard',
  B4: 'story_illustration',
  B5: 'activity_atmosphere',
  B6: 'vocabulary_scene_map',
  B7: 'text_illustration',
  B8: 'knowledge_summary',
  B9: 'storybook_illustration',
  B10: 'four_panel_comic',
  B11: 'action_demonstration',
};

const audioSubtypeByCode: Record<string, string> = {
  C1: 'emotion_bgm',
  C2: 'activity_bgm',
  C3: 'read_aloud_tts',
  C4: 'dialogue_voice',
  C5: 'teaching_song',
  C6: 'meditation_guidance',
};

const videoSubtypeByCode: Record<string, string> = {
  V1: 'fitness_challenge',
  VM: 'narrative_story',
  V3: 'teaching_animation',
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function imageSizeFromRatio(ratio?: string) {
  if (ratio === '3:4') return { width: 960, height: 1280 };
  if (ratio === '9:16') return { width: 720, height: 1280 };
  if (ratio === 'A4') return { width: 1024, height: 1448 };
  if (ratio === '4:3') return { width: 1024, height: 768 };
  if (ratio === '1:1') return { width: 1024, height: 1024 };
  return { width: 1280, height: 720 };
}

function getImageWorkflow(assetCode?: string) {
  const code = typeof assetCode === 'string' ? assetCode.toUpperCase() : '';
  return process.env[`N8N_PPT_IMAGE_${code}_WORKFLOW`]
    || (code === 'B1' ? 'course-theme-image-generator' : undefined)
    || (code === 'B11' ? 'ai-single-ip-character' : undefined)
    || process.env.N8N_PPT_IMAGE_WORKFLOW
    || workflowByType.image;
}

function getAudioWorkflow(assetCode?: string) {
  const code = typeof assetCode === 'string' ? assetCode.toUpperCase() : '';
  return process.env[`N8N_PPT_AUDIO_${code}_WORKFLOW`]
    || process.env.N8N_PPT_AUDIO_WORKFLOW
    || (['C3', 'C4', 'C6'].includes(code) ? 'gene-audio' : 'gene-music');
}

function getVideoWorkflow(assetCode?: string) {
  const code = typeof assetCode === 'string' ? assetCode.toUpperCase() : '';
  return process.env[`N8N_PPT_VIDEO_${code}_WORKFLOW`]
    || process.env.N8N_PPT_VIDEO_WORKFLOW
    || workflowByType.video;
}

function cleanText(value?: unknown) {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function defaultImageNegativePrompt(assetCode?: string) {
  const code = typeof assetCode === 'string' ? assetCode.toUpperCase() : '';
  if (code === 'B2') {
    return 'blurry, low quality, watermark, logo, extra letters, misspelled text, broken typography, cropped title, unreadable words';
  }
  if (code === 'B1') {
    return 'blurry, low quality, watermark, logo, deformed, ugly, bad composition, extra limbs, cropped, text, typography, letters, words, font, signature, chinese text, japanese text, korean text, any text, text overlay';
  }
  return 'blurry, low quality, watermark, logo, deformed, ugly, bad composition, extra limbs, cropped';
}

function buildImagePayload(basePayload: Record<string, any>, assetCode?: string, options: Record<string, any> = {}) {
  const code = typeof assetCode === 'string' ? assetCode.toUpperCase() : '';
  const subtype = imageSubtypeByCode[code] || 'ppt_image';
  const role = code === 'B11' && options.character ? String(options.character).toLowerCase() : 'bg';
  const rawValues = options.rawValues || {};
  const scene = cleanText(rawValues.scene || options.scene);
  const overlayText = cleanText(rawValues.overlayText || options.overlayText);
  const whitespace = cleanText(options.whitespace || rawValues.whitespace);
  const textLayout = cleanText(options.textLayout || rawValues.textLayout);
  const imageStyle = cleanText(options.imageStyle || rawValues.style || basePayload.style);
  const posterPrompt = code === 'B2'
    ? [
        'Create a PPT poster-style atmospheric image with clear readable typography.',
        scene ? `Main scene: ${scene}.` : '',
        overlayText ? `Render exactly this overlay text in the image: "${overlayText}".` : '',
        textLayout ? `Text layout: ${textLayout}.` : '',
        whitespace ? `Whitespace area: ${whitespace}.` : '',
        imageStyle ? `Visual style: ${imageStyle}.` : '',
        'Clean composition for a classroom PPT cover. Do not add watermark, logo, or unrelated extra text.',
      ].filter(Boolean).join(' ')
    : basePayload.prompt;

  return {
    ...basePayload,
    prompt: posterPrompt,
    optimized_prompt: posterPrompt,
    negative_prompt: options.negativePrompt || defaultImageNegativePrompt(code),
    themeImagePrompt: posterPrompt,
    description: posterPrompt,
    imageSubtype: subtype,
    workflow_type: code === 'B11' ? 'ip-character' : 'background',
    role,
    character_name: role,
    name: role,
    scene,
    overlayText,
    text: overlayText,
    titleText: overlayText,
    whitespace,
    textLayout,
    imageStyle,
    count: Array.isArray(options.batchItems) ? options.batchItems.length : 1,
    batchItems: options.batchItems,
    pptImageType: {
      code,
      subtype,
      title: basePayload.assetName,
    },
  };
}

function buildBatchImagePayloads(basePayload: Record<string, any>, assetCode?: string, options: Record<string, any> = {}) {
  const code = typeof assetCode === 'string' ? assetCode.toUpperCase() : '';
  const batchItems = Array.isArray(options.batchItems) ? options.batchItems.filter(Boolean) : [];

  if (code !== 'B3') {
    return [buildImagePayload(basePayload, assetCode, options)];
  }

  const normalizedItems = batchItems.length ? batchItems : [options.rawValues?.words || basePayload.prompt];

  return normalizedItems.map((item, index) => {
    const word = typeof item === 'string' ? item : item?.word || item?.text || `word ${index + 1}`;
    const prompt = [
      `Create one very simple vocabulary flashcard for the word "${word}".`,
      'Minimal white rounded card on a plain light background.',
      'Top area: one simple child-friendly illustration only.',
      'Middle: large bold lowercase English word.',
      options.includeChinese !== false ? 'Bottom: small Chinese meaning.' : 'No Chinese text.',
      options.includePhonetic ? 'Include phonetic transcription.' : '',
      'Use lots of blank space, clean alignment, soft shadow, no decorative frame.',
      'Do not create a grid, worksheet, collage, icons list, labels, extra words, or complex layout.',
    ].filter(Boolean).join(' ');

    return buildImagePayload(
      {
        ...basePayload,
        prompt,
        assetName: `${basePayload.assetName || 'Vocabulary flashcard'} - ${word}`,
      },
      assetCode,
      {
        ...options,
        batchItems: [item],
        currentBatchItem: item,
      },
    );
  });
}

function buildAudioPayload(basePayload: Record<string, any>, assetCode?: string, options: Record<string, any> = {}) {
  const code = typeof assetCode === 'string' ? assetCode.toUpperCase() : '';
  const subtype = audioSubtypeByCode[code] || 'ppt_audio';
  const isVoice = ['C3', 'C4', 'C6'].includes(code);

  return {
    ...basePayload,
    audioSubtype: subtype,
    workflow_type: isVoice ? 'voice' : 'audio',
    prompt: basePayload.prompt,
    storyboard_prompts: isVoice ? undefined : basePayload.prompt,
    text: isVoice ? (options.text || basePayload.prompt) : undefined,
    voice_id: options.voiceId || options.voice || 'zh-CN-XiaoxiaoNeural',
    speed: options.speed || 1,
    pitch: options.pitch || 1,
    genre: subtype,
    tempo: options.tempo,
    emotion: options.emotion,
    activity: options.activity,
    lyrics: options.lyrics,
    count: 1,
    pptAudioType: {
      code,
      subtype,
      title: basePayload.assetName,
    },
  };
}

function buildVideoPayload(basePayload: Record<string, any>, assetCode?: string, options: Record<string, any> = {}) {
  const code = typeof assetCode === 'string' ? assetCode.toUpperCase() : '';
  const subtype = videoSubtypeByCode[code] || 'ppt_video';
  const ratio = options.direction || options.videoRatio || '16:9';
  const isVertical = ratio === '9:16';

  return {
    ...basePayload,
    videoSubtype: subtype,
    workflow_type: 'video',
    prompt: basePayload.prompt,
    optimized_prompt: basePayload.prompt,
    negative_prompt: options.negativePrompt || '',
    duration: options.duration || 8,
    fps: options.fps || 24,
    video_width: isVertical ? 720 : 1280,
    video_height: isVertical ? 1280 : 720,
    scene: options.scene,
    characters: options.characters || [options.character].filter(Boolean),
    words: options.words,
    sentences: options.sentences,
    narrationLanguage: options.narrationLanguage,
    pptVideoType: {
      code,
      subtype,
      title: basePayload.assetName,
    },
  };
}

function durationToSeconds(value?: string) {
  if (!value) return 60;
  const match = value.match(/(\d+)/);
  if (!match) return 60;
  const amount = Number(match[1]);
  return value.includes('分钟') ? amount * 60 : amount;
}

function pickUrl(result: any): string | undefined {
  return result?.url
    || result?.assetUrl
    || result?.imageUrl
    || result?.themeImageUrl
    || result?.audioUrl
    || result?.videoUrl
    || result?.data?.url
    || result?.data?.assetUrl
    || result?.data?.imageUrl
    || result?.data?.themeImageUrl
    || result?.data?.audioUrl
    || result?.data?.videoUrl
    || (Array.isArray(result) ? pickUrl(result[0]) : undefined);
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

function pickAssets(result: any) {
  if (Array.isArray(result?.assets)) return result.assets;
  if (Array.isArray(result?.data?.assets)) return result.data.assets;
  if (Array.isArray(result?.tasks)) return result.tasks;
  if (Array.isArray(result?.data?.tasks)) return result.data.tasks;
  return null;
}

function normalizeAsset(type: AssetType, title: string, prompt: string, result: any) {
  const taskId = pickTaskId(result);
  const workflowType = type === 'image' ? 'image' : type === 'audio' ? 'music' : 'video';
  const url = pickUrl(result);
  const comfyuiUrl = result?.comfyuiUrl || result?.comfyui_url || result?.apiUrl || result?.data?.comfyuiUrl || result?.data?.apiUrl;
  const statusUrl = type === 'audio'
    ? `/api/ai/generate-audio?executionId=${taskId}`
    : type === 'video'
      ? `/api/ai/video-status?executionId=${taskId}`
      : undefined;
  const imageStatusQuery = type === 'image' && comfyuiUrl
    ? `?useComfyUI=true&apiUrl=${encodeURIComponent(String(comfyuiUrl))}`
    : `?workflowType=${workflowType}`;
  return {
    type,
    title: result?.title || result?.name || title,
    prompt: result?.prompt || prompt,
    url,
    taskId,
    status: url ? 'completed' : 'submitted',
    statusUrl: taskId ? (statusUrl || `/api/ai/task-status/${taskId}${imageStatusQuery}`) : undefined,
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
    const workflow = type === 'image'
      ? getImageWorkflow(assetCode)
      : type === 'audio'
        ? getAudioWorkflow(assetCode)
        : getVideoWorkflow(assetCode);
    const imageSize = imageSizeFromRatio(options.imageRatio);
    const duration = durationToSeconds(options.audioDuration);

    const basePayload = {
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
        ratio: options.imageRatio,
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
    const n8nPayload = type === 'image'
      ? buildImagePayload(basePayload, assetCode, options)
      : type === 'audio'
        ? buildAudioPayload(basePayload, assetCode, options)
        : buildVideoPayload(basePayload, assetCode, options);
    const imagePayloads = type === 'image'
      ? buildBatchImagePayloads(basePayload, assetCode, options)
      : [];

    console.log('[generate-ppt-asset] 调用 N8N:', {
      workflow,
      assetType: type,
      assetName,
      promptLength: prompt.length,
      batchCount: imagePayloads.length || 1,
    });

    const singlePayload = type === 'image' ? (imagePayloads[0] || n8nPayload) : n8nPayload;
    const result = type === 'image' && imagePayloads.length > 1
      ? await Promise.all(imagePayloads.map((payload) => n8nClient.call(workflow, payload, { timeout: 300000 })))
      : await n8nClient.call(workflow, singlePayload, { timeout: 300000 });
    const returnedAssets = pickAssets(result);
    const assets = Array.isArray(result) && type === 'image' && imagePayloads.length > 1
      ? result.map((item: any, index: number) => ({
          ...normalizeAsset(type, imagePayloads[index]?.pptImageType?.title || `${assetName || '图片素材'} ${index + 1}`, imagePayloads[index]?.prompt || prompt, item),
          width: imageSize.width,
          height: imageSize.height,
        }))
      : returnedAssets?.length
      ? returnedAssets.map((item: any, index: number) => ({
          ...normalizeAsset(type, item?.title || `${assetName || '图片素材'} ${index + 1}`, item?.prompt || prompt, item),
          ...(type === 'image' ? { width: imageSize.width, height: imageSize.height } : {}),
        }))
      : [{
          ...normalizeAsset(type, assetName || `${type}素材`, prompt, result),
          ...(type === 'image' ? { width: imageSize.width, height: imageSize.height } : {}),
        }];
    const asset = assets[0];

    return NextResponse.json({
      success: true,
      workflow,
      imageSubtype: type === 'image' ? imageSubtypeByCode[String(assetCode || '').toUpperCase()] || 'ppt_image' : undefined,
      audioSubtype: type === 'audio' ? audioSubtypeByCode[String(assetCode || '').toUpperCase()] || 'ppt_audio' : undefined,
      videoSubtype: type === 'video' ? videoSubtypeByCode[String(assetCode || '').toUpperCase()] || 'ppt_video' : undefined,
      asset,
      assets,
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
