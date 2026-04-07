import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticate } from '@/lib/auth';
import { getQwenImageStyleParams, qwenImageConfig } from '@/lib/prompt-config';
import fs from 'fs';
import path from 'path';

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

const AI_API_BASE_URL = (process.env.AI_API_BASE_URL || '').replace(/\/+$/, '');

interface ImageGenerationRequest {
  prompt: string;
  count?: number;
  width?: number;
  height?: number;
  user_id?: string;
  organization_id?: string;
  workflow_type?: 'scene' | 'person' | 'lora-v3' | 'background' | 'ip-character' | 'composite';
  reference_image?: string;
  video_style?: string;
  character_name?: string;
  background_url?: string;
  roles?: Array<{
    name: string;
    url: string;
    x: number;
    y: number;
    scale?: number;
    rotation?: number;
  }>;
}

interface WorkflowNode {
  inputs: any;
  class_type: string;
  _meta: {
    title: string;
  };
}

interface Workflow {
  [key: string]: WorkflowNode;
}

interface TaskResponse {
  promptId: string;
  number: number;
}

interface TaskStatus {
  status: string;
  outputs?: {
    [key: string]: {
      images: Array<{
        filename: string;
        subfolder: string;
        type: string;
      }>;
    };
  };
}

// 创建人物参考图工作流（基于 person.json）
function createPersonWorkflow(prompt: string, width: number, height: number, seed: number, styleParams?: any): any {
  // 获取风格参数
  const steps = styleParams?.steps || qwenImageConfig.defaultSteps || 8;
  const cfg = styleParams?.cfg || qwenImageConfig.defaultCfg || 1;
  const sampler = styleParams?.sampler || qwenImageConfig.defaultSampler || 'res_multistep';
  const scheduler = styleParams?.scheduler || qwenImageConfig.defaultScheduler || 'sgm_uniform';
  const negativePrompt = qwenImageConfig.negativePrompt || '模糊，低清，畸形，杂乱背景';

  // 如果有风格增强提示词，追加到正向提示词
  let enhancedPrompt = prompt;
  if (styleParams?.promptEnhance) {
    enhancedPrompt = `${prompt}，${styleParams.promptEnhance}`;
  }

  return {
    "6": {
      "inputs": {
        "shift": 3.1000000000000005,
        "model": ["12", 0]
      },
      "class_type": "ModelSamplingAuraFlow",
      "_meta": { "title": "模型采样AuraFlow" }
    },
    "15": {
      "inputs": {
        "samples": ["10", 0],
        "vae": ["4", 0]
      },
      "class_type": "VAEDecode",
      "_meta": { "title": "VAE解码" }
    },
    "4": {
      "inputs": {
        "vae_name": "qwen_image_vae.safetensors"
      },
      "class_type": "VAELoader",
      "_meta": { "title": "加载VAE" }
    },
    "3": {
      "inputs": {
        "clip_name": "qwen_2.5_vl_7b_fp8_scaled.safetensors",
        "type": "qwen_image",
        "device": "default"
      },
      "class_type": "CLIPLoader",
      "_meta": { "title": "加载CLIP" }
    },
    "2": {
      "inputs": {
        "unet_name": "qwen_image_fp8_e4m3fn.safetensors",
        "weight_dtype": "fp8_e4m3fn"
      },
      "class_type": "UNETLoader",
      "_meta": { "title": "UNet加载器" }
    },
    "9": {
      "inputs": {
        "width": width,
        "height": height,
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage",
      "_meta": { "title": "空Latent图像" }
    },
    "10": {
      "inputs": {
        "seed": seed,
        "steps": steps,
        "cfg": cfg,
        "sampler_name": sampler,
        "scheduler": scheduler,
        "denoise": 1,
        "model": ["6", 0],
        "positive": ["7", 0],
        "negative": ["8", 0],
        "latent_image": ["9", 0]
      },
      "class_type": "KSampler",
      "_meta": { "title": "K采样器" }
    },
    "12": {
      "inputs": {
        "lora_name": "Qwen-Image-Lightning-8steps-V1.0.safetensors",
        "strength_model": 1,
        "model": ["2", 0]
      },
      "class_type": "LoraLoaderModelOnly",
      "_meta": { "title": "LoRA加载器（仅模型）" }
    },
    "14": {
      "inputs": {
        "filename_prefix": "ComfyUI",
        "images": ["15", 0]
      },
      "class_type": "SaveImage",
      "_meta": { "title": "保存图像" }
    },
    "8": {
      "inputs": {
        "text": negativePrompt,
        "clip": ["3", 0]
      },
      "class_type": "CLIPTextEncode",
      "_meta": { "title": "CLIP文本编码" }
    },
    "7": {
      "inputs": {
        "text": enhancedPrompt,
        "clip": ["3", 0]
      },
      "class_type": "CLIPTextEncode",
      "_meta": { "title": "CLIP文本编码" }
    }
  };
}

// 创建分镜图工作流（基于 sence.json）
function createSceneWorkflow(prompt: string, width: number, height: number, seed: number, referenceImage?: string, styleParams?: any): any {
  const longerSide = Math.max(width, height);

  // 获取风格参数
  const steps = styleParams?.steps || 4;
  const cfg = styleParams?.cfg || 1;
  const sampler = styleParams?.sampler || 'sa_solver';
  const scheduler = styleParams?.scheduler || 'simple';
  const negativePrompt = qwenImageConfig.negativePrompt || '';

  // 如果有风格增强提示词，追加到正向提示词
  let enhancedPrompt = prompt;
  if (styleParams?.promptEnhance) {
    enhancedPrompt = `${prompt}，${styleParams.promptEnhance}`;
  }

  return {
    "56": {
      "inputs": {
        "seed": seed,
        "steps": 4,
        "cfg": 1,
        "sampler_name": "sa_solver",
        "scheduler": "simple",
        "denoise": 1,
        "model": ["109", 0],
        "positive": ["68", 0],
        "negative": ["61", 0],
        "latent_image": ["60", 0]
      },
      "class_type": "KSampler",
      "_meta": { "title": "K采样器" }
    },
    "60": {
      "inputs": {
        "pixels": ["91", 0],
        "vae": ["110", 0]
      },
      "class_type": "VAEEncode",
      "_meta": { "title": "VAE编码" }
    },
    "61": {
      "inputs": {
        "prompt": "",
        "clip": ["107", 0],
        "vae": ["110", 0],
        "image1": ["91", 0]
      },
      "class_type": "TextEncodeQwenImageEditPlus",
      "_meta": { "title": "文本编码（QwenImageEditPlus）" }
    },
    "68": {
      "inputs": {
        "prompt": ["138", 0],
        "clip": ["107", 0],
        "vae": ["110", 0],
        "image1": ["91", 0]
      },
      "class_type": "TextEncodeQwenImageEditPlus",
      "_meta": { "title": "文本编码（QwenImageEditPlus）" }
    },
    "69": {
      "inputs": {
        "samples": ["56", 0],
        "vae": ["110", 0]
      },
      "class_type": "VAEDecode",
      "_meta": { "title": "VAE解码" }
    },
    "74": {
      "inputs": {
        "image": referenceImage || "1772635175212-0235bb33.png"
      },
      "class_type": "LoadImage",
      "_meta": { "title": "加载图像" }
    },
    "91": {
      "inputs": {
        "aspect_ratio": "custom",
        "proportional_width": width,
        "proportional_height": height,
        "fit": "letterbox",
        "method": "lanczos",
        "round_to_multiple": "8",
        "scale_to_side": "longest",
        "scale_to_length": ["104", 0],
        "background_color": "#000000",
        "image": ["74", 0]
      },
      "class_type": "LayerUtility: ImageScaleByAspectRatio V2",
      "_meta": { "title": "图层工具：按宽高比缩放 V2" }
    },
    "99": {
      "inputs": {
        "text": prompt,
        "anything": ["138", 0]
      },
      "class_type": "easy showAnything",
      "_meta": { "title": "展示任何" }
    },
    "104": {
      "inputs": {
        "Number": longerSide
      },
      "class_type": "Int",
      "_meta": { "title": "Int" }
    },
    "105": {
      "inputs": {
        "filename_prefix": "ComfyUI",
        "images": ["69", 0]
      },
      "class_type": "SaveImage",
      "_meta": { "title": "保存图像" }
    },
    "106": {
      "inputs": {
        "unet_name": "qwen_image_edit_2511_fp8_e4m3fn.safetensors",
        "weight_dtype": "default"
      },
      "class_type": "UNETLoader",
      "_meta": { "title": "UNet加载器" }
    },
    "107": {
      "inputs": {
        "clip_name": "qwen_2.5_vl_7b_fp8_scaled.safetensors",
        "type": "qwen_image",
        "device": "default"
      },
      "class_type": "CLIPLoader",
      "_meta": { "title": "加载CLIP" }
    },
    "109": {
      "inputs": {
        "lora_name": "Qwen-Image-Lightning-4steps-V1.0.safetensors",
        "strength_model": 1.0000000000000002,
        "model": ["133", 0]
      },
      "class_type": "LoraLoaderModelOnly",
      "_meta": { "title": "LoRA加载器（仅模型）" }
    },
    "110": {
      "inputs": {
        "vae_name": "qwen_image_vae.safetensors"
      },
      "class_type": "VAELoader",
      "_meta": { "title": "加载VAE" }
    },
    "133": {
      "inputs": {
        "lora_name": "next-scene_lora-v2-3000.safetensors",
        "strength_model": 0.8000000000000002,
        "model": ["106", 0]
      },
      "class_type": "LoraLoaderModelOnly",
      "_meta": { "title": "LoRA加载器（仅模型）" }
    },
    "138": {
      "inputs": {
        "prompt": prompt,
        "start_index": 0,
        "max_rows": 1000,
        "remove_empty_lines": ""
      },
      "class_type": "easy promptLine",
      "_meta": { "title": "提示词行" }
    }
  };
}

// 创建LoRA V3工作流（基于 lora-v3.json）
function createLoraV3Workflow(prompt: string, width: number, height: number, seed: number): any {
  return {
    "9": {
      "inputs": {
        "filename_prefix": "z-image",
        "images": ["43", 0]
      },
      "class_type": "SaveImage",
      "_meta": { "title": "保存图像" }
    },
    "39": {
      "inputs": {
        "clip_name": "qwen_3_4b.safetensors",
        "type": "lumina2",
        "device": "default"
      },
      "class_type": "CLIPLoader",
      "_meta": { "title": "加载CLIP" }
    },
    "40": {
      "inputs": {
        "vae_name": "ae.safetensors"
      },
      "class_type": "VAELoader",
      "_meta": { "title": "加载VAE" }
    },
    "41": {
      "inputs": {
        "width": width,
        "height": height,
        "batch_size": 1
      },
      "class_type": "EmptySD3LatentImage",
      "_meta": { "title": "空Latent图像（SD3）" }
    },
    "42": {
      "inputs": {
        "conditioning": ["45", 0]
      },
      "class_type": "ConditioningZeroOut",
      "_meta": { "title": "条件零化" }
    },
    "43": {
      "inputs": {
        "samples": ["44", 0],
        "vae": ["40", 0]
      },
      "class_type": "VAEDecode",
      "_meta": { "title": "VAE解码" }
    },
    "44": {
      "inputs": {
        "seed": seed,
        "steps": 11,
        "cfg": 1.8,
        "sampler_name": "res_multistep",
        "scheduler": "simple",
        "denoise": 1,
        "model": ["47", 0],
        "positive": ["45", 0],
        "negative": ["42", 0],
        "latent_image": ["41", 0]
      },
      "class_type": "KSampler",
      "_meta": { "title": "K采样器" }
    },
    "45": {
      "inputs": {
        "text": prompt,
        "clip": ["39", 0]
      },
      "class_type": "CLIPTextEncode",
      "_meta": { "title": "CLIP文本编码" }
    },
    "46": {
      "inputs": {
        "unet_name": "z_image_turbo_bf16.safetensors",
        "weight_dtype": "default"
      },
      "class_type": "UNETLoader",
      "_meta": { "title": "UNet加载器" }
    },
    "47": {
      "inputs": {
        "shift": 3,
        "model": ["48", 0]
      },
      "class_type": "ModelSamplingAuraFlow",
      "_meta": { "title": "采样算法（AuraFlow）" }
    },
    "48": {
      "inputs": {
        "lora_name": "my_first_lora_v3.safetensors",
        "strength_model": 1,
        "model": ["46", 0]
      },
      "class_type": "LoraLoaderModelOnly",
      "_meta": { "title": "LoRA加载器（仅模型）" }
    }
  };
}

// 创建图片生成工作流（保留旧函数名以兼容）
function createWorkflow(prompt: string, width: number, height: number, seed: number): any {
  return createSceneWorkflow(prompt, width, height, seed);
}

// 创建背景生成工作流（基于 背景生成.json）
function createBackgroundWorkflow(prompt: string, width: number, height: number, seed: number): any {
  return {
    "1": {
      "inputs": {
        "unet_name": "z_image_turbo_bf16.safetensors",
        "weight_dtype": "default"
      },
      "class_type": "UNETLoader",
      "_meta": { "title": "UNet加载器" }
    },
    "2": {
      "inputs": {
        "vae_name": "ae.safetensors"
      },
      "class_type": "VAELoader",
      "_meta": { "title": "加载VAE" }
    },
    "3": {
      "inputs": {
        "clip_name": "qwen_3_4b.safetensors",
        "type": "lumina2",
        "device": "default"
      },
      "class_type": "CLIPLoader",
      "_meta": { "title": "加载CLIP" }
    },
    "4": {
      "inputs": {
        "shift": 3,
        "model": ["1", 0]
      },
      "class_type": "ModelSamplingAuraFlow",
      "_meta": { "title": "采样算法（AuraFlow）" }
    },
    "5": {
      "inputs": {
        "width": width,
        "height": height,
        "batch_size": 1
      },
      "class_type": "EmptySD3LatentImage",
      "_meta": { "title": "空Latent图像（SD3）" }
    },
    "6": {
      "inputs": {
        "text": `扁平矢量插画，粗细均匀的黑色轮廓线，单线风格，2D扁平设计，无渐变，无阴影，低饱和度的平涂色彩、和谐的柔和色调、连贯的配色方案，简化但风格化的背景环境，清晰的环境线稿，非写实扁平插画，干净亲和的美学，沉浸式叙事扁平背景，画面无人物无文字, ${prompt}`,
        "clip": ["3", 0]
      },
      "class_type": "CLIPTextEncode",
      "_meta": { "title": "正向提示词" }
    },
    "7": {
      "inputs": {
        "text": "people, humans, characters, animals, blurry, realistic, 3d, complex gradients, dark shadows.",
        "clip": ["3", 0]
      },
      "class_type": "CLIPTextEncode",
      "_meta": { "title": "背景负面提示词" }
    },
    "8": {
      "inputs": {
        "seed": seed,
        "steps": 15,
        "cfg": 1.5,
        "sampler_name": "euler",
        "scheduler": "simple",
        "denoise": 1,
        "model": ["4", 0],
        "positive": ["6", 0],
        "negative": ["7", 0],
        "latent_image": ["5", 0]
      },
      "class_type": "KSampler",
      "_meta": { "title": "生成场景" }
    },
    "9": {
      "inputs": {
        "samples": ["8", 0],
        "vae": ["2", 0]
      },
      "class_type": "VAEDecode",
      "_meta": { "title": "背景解码" }
    },
    "10": {
      "inputs": {
        "filename_prefix": "Universal_Scene",
        "images": ["9", 0]
      },
      "class_type": "SaveImage",
      "_meta": { "title": "保存纯净背景" }
    }
  };
}

// 创建IP角色生成工作流（基于 生成单个IP人物动作.json）
function createIPCharacterWorkflow(prompt: string, characterName: string, seed: number): any {
  const loraMap: Record<string, { lora: string; color: string }> = {
    'poppy': { lora: 'poppy.safetensors', color: '粉色' },
    'edi': { lora: 'edi_new_000002250.safetensors', color: '蓝色' },
    'rolly': { lora: 'rolly.safetensors', color: '橘色' },
    'milo': { lora: 'milo.safetensors', color: '黄色' },
    'ace': { lora: 'ace.safetensors', color: '紫色' }
  };

  const characterConfig = loraMap[characterName.toLowerCase()] || loraMap['poppy'];

  return {
    "1": {
      "inputs": {
        "unet_name": "z_image_turbo_bf16.safetensors",
        "weight_dtype": "default"
      },
      "class_type": "UNETLoader",
      "_meta": { "title": "UNet加载器" }
    },
    "2": {
      "inputs": {
        "vae_name": "ae.safetensors"
      },
      "class_type": "VAELoader",
      "_meta": { "title": "加载VAE" }
    },
    "3": {
      "inputs": {
        "clip_name": "qwen_3_4b.safetensors",
        "type": "lumina2",
        "device": "default"
      },
      "class_type": "CLIPLoader",
      "_meta": { "title": "加载CLIP" }
    },
    "4": {
      "inputs": {
        "shift": 3,
        "model": ["1", 0]
      },
      "class_type": "ModelSamplingAuraFlow",
      "_meta": { "title": "采样算法（AuraFlow）" }
    },
    "5": {
      "inputs": {
        "width": 1024,
        "height": 1024,
        "batch_size": 1
      },
      "class_type": "EmptySD3LatentImage",
      "_meta": { "title": "空Latent图像（SD3）" }
    },
    "7": {
      "inputs": {
        "text": "blurry, 3d, realistic, complex textures, bad anatomy, deformed, shadows, gradients, background details",
        "clip": ["3", 0]
      },
      "class_type": "CLIPTextEncode",
      "_meta": { "title": "全局负面提示词" }
    },
    "101": {
      "inputs": {
        "lora_name": characterConfig.lora,
        "strength_model": 0.8,
        "strength_clip": 1,
        "model": ["4", 0],
        "clip": ["3", 0]
      },
      "class_type": "LoraLoader",
      "_meta": { "title": `LoRA - ${characterName}` }
    },
    "102": {
      "inputs": {
        "text": `cj_vector_style, ${characterName} character, ${prompt}, flat vector illustration, uniform thick black outlines, monoline style, 2D flat design, solid pure white background, no background elements, no scenery, no environment, character only`,
        "clip": ["101", 1]
      },
      "class_type": "CLIPTextEncode",
      "_meta": { "title": `动作 - ${characterName} (${characterConfig.color})` }
    },
    "103": {
      "inputs": {
        "seed": seed,
        "steps": 20,
        "cfg": 1.5,
        "sampler_name": "euler",
        "scheduler": "simple",
        "denoise": 1,
        "model": ["101", 0],
        "positive": ["102", 0],
        "negative": ["7", 0],
        "latent_image": ["5", 0]
      },
      "class_type": "KSampler",
      "_meta": { "title": `生成 ${characterName}` }
    },
    "104": {
      "inputs": {
        "samples": ["103", 0],
        "vae": ["2", 0]
      },
      "class_type": "VAEDecode",
      "_meta": { "title": "VAE解码" }
    },
    "105": {
      "inputs": {
        "filename_prefix": `Asset_${characterName}`,
        "images": ["104", 0]
      },
      "class_type": "SaveImage",
      "_meta": { "title": `保存 ${characterName} 资产` }
    }
  };
}

async function uploadImageToComfyUI(imageUrl: string, AI_API_BASE_URL: string): Promise<string> {
  let fullUrl = imageUrl;
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    fullUrl = `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  }

  console.log('下载图片:', fullUrl);
  const imageResponse = await fetch(fullUrl);
  if (!imageResponse.ok) {
    throw new Error(`下载图片失败: ${imageResponse.status}`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const filename = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.png`;

  const formData = new FormData();
  formData.append('image', new Blob([new Uint8Array(imageBuffer)]), filename);
  formData.append('overwrite', 'true');

  console.log('上传图片到ComfyUI:', `${AI_API_BASE_URL}/upload/image`);
  const uploadResponse = await fetch(`${AI_API_BASE_URL}/upload/image`, {
    method: 'POST',
    body: formData
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`上传图片到ComfyUI失败: ${errorText}`);
  }

  const uploadData = await uploadResponse.json();
  console.log('上传成功:', uploadData);
  return uploadData.name || filename;
}

async function createCompositeWorkflow(
  backgroundUrl: string, 
  roles: Array<{name: string; url: string; x: number; y: number; scale?: number; rotation?: number}>,
  prompt: string,
  seed: number,
  AI_API_BASE_URL: string,
  width?: number,
  height?: number
): Promise<any> {
  console.log('开始创建合成工作流...');
  
  const bgFilename = await uploadImageToComfyUI(backgroundUrl, AI_API_BASE_URL);
  console.log('背景图上传成功:', bgFilename);

  const roleFilenames: Record<string, string> = {};
  for (const role of roles) {
    const filename = await uploadImageToComfyUI(role.url, AI_API_BASE_URL);
    roleFilenames[role.name] = filename;
    console.log(`角色 ${role.name} 上传成功:`, filename);
  }

  const outputWidth = width || 1920;
  const outputHeight = height || 1080;
  console.log(`输出尺寸: ${outputWidth}x${outputHeight}`);

  const workflow: any = {
    "1": {
      "inputs": {
        "unet_name": "z_image_turbo_bf16.safetensors",
        "weight_dtype": "default"
      },
      "class_type": "UNETLoader",
      "_meta": { "title": "UNet加载器" }
    },
    "2": {
      "inputs": {
        "vae_name": "ae.safetensors"
      },
      "class_type": "VAELoader",
      "_meta": { "title": "加载VAE" }
    },
    "3": {
      "inputs": {
        "clip_name": "qwen_3_4b.safetensors",
        "type": "lumina2",
        "device": "default"
      },
      "class_type": "CLIPLoader",
      "_meta": { "title": "加载CLIP" }
    },
    "4": {
      "inputs": {
        "shift": 3,
        "model": ["1", 0]
      },
      "class_type": "ModelSamplingAuraFlow",
      "_meta": { "title": "采样算法（AuraFlow）" }
    },
    "7": {
      "inputs": {
        "text": "people, humans, blurry, realistic, 3d, bad anatomy, deformed.",
        "clip": ["3", 0]
      },
      "class_type": "CLIPTextEncode",
      "_meta": { "title": "全局负面提示词" }
    }
  };

  const bgNodeId = "33";
  workflow[bgNodeId] = {
    "inputs": {
      "image": bgFilename,
      "upload": "image"
    },
    "class_type": "LoadImage",
    "_meta": { "title": "背景图" }
  };

  let lastImageNodeId = bgNodeId;
  let nodeIdCounter = 10;
  let loraNodeId = 25;
  let lastLoraModel = ["4", 0];
  let lastLoraClip = ["3", 0];

  const loraMap: Record<string, string> = {
    'poppy': 'poppy.safetensors',
    'edi': 'edi_new_000002250.safetensors',
    'rolly': 'rolly.safetensors',
    'milo': 'milo.safetensors',
    'ace': 'ace.safetensors'
  };

  roles.forEach((role, index) => {
    const loadNodeId = String(nodeIdCounter++);
    const invertNodeId = String(nodeIdCounter++);
    const compositeNodeId = String(nodeIdCounter++);

    const roleFilename = roleFilenames[role.name] || role.url;

    workflow[loadNodeId] = {
      "inputs": {
        "image": roleFilename,
        "upload": "image"
      },
      "class_type": "LoadImage",
      "_meta": { "title": `角色: ${role.name}` }
    };

    workflow[invertNodeId] = {
      "inputs": {
        "mask": [loadNodeId, 1]
      },
      "class_type": "InvertMask",
      "_meta": { "title": `反转遮罩: ${role.name}` }
    };

    workflow[compositeNodeId] = {
      "inputs": {
        "destination": [lastImageNodeId, 0],
        "source": [loadNodeId, 0],
        "mask": [invertNodeId, 0],
        "x": Math.max(0, Math.round(role.x)),
        "y": Math.max(0, Math.round(role.y)),
        "resize_source": false
      },
      "class_type": "ImageCompositeMasked",
      "_meta": { "title": `拼贴 ${role.name}` }
    };

    lastImageNodeId = compositeNodeId;

    if (loraMap[role.name.toLowerCase()]) {
      const loraNode = String(loraNodeId++);
      workflow[loraNode] = {
        "inputs": {
          "lora_name": loraMap[role.name.toLowerCase()],
          "strength_model": 0.5,
          "strength_clip": 1,
          "model": lastLoraModel,
          "clip": lastLoraClip
        },
        "class_type": "LoraLoader",
        "_meta": { "title": `LoRA - ${role.name}` }
      };
      lastLoraModel = [loraNode, 0];
      lastLoraClip = [loraNode, 1];
    }
  });

  const vaeEncodeNodeId = String(nodeIdCounter++);
  workflow[vaeEncodeNodeId] = {
    "inputs": {
      "pixels": [lastImageNodeId, 0],
      "vae": ["2", 0]
    },
    "class_type": "VAEEncode",
    "_meta": { "title": "整体编码重绘" }
  };

  const promptNodeId = String(nodeIdCounter++);
  workflow[promptNodeId] = {
    "inputs": {
      "text": `cj_vector_style, ${prompt}, flat vector illustration, uniform thick black outlines, harmonious pastel tones.`,
      "clip": lastLoraClip
    },
    "class_type": "CLIPTextEncode",
    "_meta": { "title": "最终融合风格" }
  };

  const samplerNodeId = String(nodeIdCounter++);
  workflow[samplerNodeId] = {
    "inputs": {
      "seed": seed,
      "steps": 15,
      "cfg": 1.5,
      "sampler_name": "euler",
      "scheduler": "simple",
      "denoise": 0.35,
      "model": lastLoraModel,
      "positive": [promptNodeId, 0],
      "negative": ["7", 0],
      "latent_image": [vaeEncodeNodeId, 0]
    },
    "class_type": "KSampler",
    "_meta": { "title": "最终融合" }
  };

  const vaeDecodeNodeId = String(nodeIdCounter++);
  workflow[vaeDecodeNodeId] = {
    "inputs": {
      "samples": [samplerNodeId, 0],
      "vae": ["2", 0]
    },
    "class_type": "VAEDecode",
    "_meta": { "title": "最终解码出图" }
  };

  const saveNodeId = String(nodeIdCounter++);
  workflow[saveNodeId] = {
    "inputs": {
      "filename_prefix": "composite",
      "images": [vaeDecodeNodeId, 0]
    },
    "class_type": "SaveImage",
    "_meta": { "title": "保存合成图" }
  };

  return workflow;
}

// 提交图片生成任务
async function submitImageTask(
  prompt: string, 
  width: number, 
  height: number, 
  seed: number, 
  workflowType: 'scene' | 'person' | 'lora-v3' | 'background' | 'ip-character' | 'composite' = 'scene', 
  referenceImage?: string, 
  styleParams?: any,
  characterName?: string,
  roles?: Array<{name: string; url: string; x: number; y: number; scale?: number; rotation?: number}>
): Promise<TaskResponse> {
  let workflow;
  if (workflowType === 'person') {
    workflow = createPersonWorkflow(prompt, width, height, seed, styleParams);
  } else if (workflowType === 'lora-v3') {
    workflow = createLoraV3Workflow(prompt, width, height, seed);
  } else if (workflowType === 'background') {
    workflow = createBackgroundWorkflow(prompt, width, height, seed);
  } else if (workflowType === 'ip-character') {
    workflow = createIPCharacterWorkflow(prompt, characterName || 'poppy', seed);
  } else if (workflowType === 'composite') {
    const compositeRoles = roles || [];
    const apiUrl = AI_API_BASE_URL || 'https://vcbj5meqyp1y7ifw-8188.container.x-gpu.com';
    workflow = await createCompositeWorkflow(referenceImage || '', compositeRoles, prompt, seed, apiUrl, width, height);
  } else {
    workflow = createSceneWorkflow(prompt, width, height, seed, referenceImage, styleParams);
  }
  
  console.log(`提交图片生成任务: ${AI_API_BASE_URL}/prompt`);
  console.log(`工作流类型: ${workflowType}`);
  console.log(`请求参数:`, { prompt, width, height, seed });
  console.log(`请求体 (workflow):`, JSON.stringify(workflow, null, 2));
  
  const response = await fetch(`${AI_API_BASE_URL}/prompt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt: workflow })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`提交任务失败: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`提交任务失败: ${response.status} ${response.statusText}`);
  }

  const responseData = await response.json();
  console.log(`任务提交成功:`, responseData);
  
  // AI API 返回的数据格式是 { prompt_id: string, number: number }
  // 需要转换为 { promptId: string, number: number }
  return {
    promptId: responseData.prompt_id || responseData.promptId,
    number: responseData.number
  };
}

// 轮询任务状态
async function pollTaskStatus(promptId: string, maxAttempts: number = 60, interval: number = 2000): Promise<TaskStatus> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`${AI_API_BASE_URL}/history/${promptId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`查询任务状态失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const taskData = Object.values(data)[0] as TaskStatus;
      
      if (!taskData) {
        throw new Error('任务不存在');
      }

      if (taskData.status === 'success') {
        return taskData;
      } else if (taskData.status === 'error') {
        throw new Error('任务执行失败');
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  throw new Error('任务超时');
}

// 提取图片信息
function extractImageInfo(taskData: TaskStatus) {
  if (!taskData || !taskData.outputs) {
    return null;
  }

  const outputs = taskData.outputs;
  const saveImageNode = Object.values(outputs).find(node => node.images && node.images.length > 0);
  
  if (!saveImageNode) {
    return null;
  }

  const imageInfo = saveImageNode.images[0];
  return {
    filename: imageInfo.filename,
    subfolder: imageInfo.subfolder || '',
    type: imageInfo.type || 'output'
  };
}

// 下载图片
async function downloadImage(filename: string, subfolder: string, type: string): Promise<Buffer> {
  const params = new URLSearchParams({
    filename,
    subfolder,
    type
  });

  const response = await fetch(`${AI_API_BASE_URL}/view?${params.toString()}`, {
    method: 'GET'
  });

  if (!response.ok) {
    throw new Error(`下载图片失败: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// 上传到OSS
async function uploadToOSS(buffer: Buffer, filename: string, folder: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', new Blob([new Uint8Array(buffer)]), filename);
  formData.append('folder', folder);

  // 直接使用相对路径，因为这是同一个 Next.js 应用内部的 API 调用
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || '上传到OSS失败');
  }

  const data = await response.json();
  return data.url;
}

// POST /api/ai/generate-images - 生成多张图片（立即返回任务ID）
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticate(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || '认证失败' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const user = authResult.user;
    const body = await request.json();
    const {
      prompt,
      count = 4,
      width = 600,
      height = 400,
      user_id,
      organization_id,
      workflow_type = 'scene',
      reference_image,
      video_style,
      character_name,
      roles
    } = body as ImageGenerationRequest;

    if (!prompt) {
      return NextResponse.json(
        { error: '缺少prompt参数' },
        { status: 400, headers: corsHeaders() }
      );
    }

    // 获取风格参数
    const styleParams = getQwenImageStyleParams(video_style);
    console.log('生成图片使用的风格参数:', { video_style, styleParams });

    const startTime = Date.now();
    const tasks = [];

    // 提交所有任务
    for (let i = 0; i < count; i++) {
      const seed = Date.now() + i * 1000;
      const taskPromise = submitImageTask(prompt, width, height, seed, workflow_type, reference_image, styleParams, character_name, roles);
      tasks.push(taskPromise);
    }

    const taskResponses = await Promise.all(tasks);
    console.log(`已提交 ${taskResponses.length} 个任务`);
    console.log(`user_id: ${user_id}, organization_id: ${organization_id}`);
    console.log(`taskResponses:`, taskResponses);

    // 保存 prompt_id 到数据库
    try {
      // 检查 user_id 是否是有效的 UUID，如果不是则设为 null
      // UUID 格式: xxxxxxxx-xxxx-xxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validUserId = (user_id && uuidRegex.test(user_id)) ? user_id : null;
      const validOrganizationId = (organization_id && uuidRegex.test(organization_id)) ? organization_id : null;
      
      // 将所有 prompt_id 用逗号连接
      const allPromptIds = taskResponses.map(task => task.promptId).join(',');
      
      console.log(`准备保存 prompt_id 到数据库：`);
      console.log(`  - user_id: ${validUserId}`);
      console.log(`  - organization_id: ${validOrganizationId}`);
      console.log(`  - prompt_type: image_generation`);
      console.log(`  - original_prompt: ${prompt.substring(0, 100)}...`);
      console.log(`  - model_name: qwen-image`);
      console.log(`  - prompt_id: ${allPromptIds}`);
      
      const insertData = {
        user_id: validUserId,
        organization_id: validOrganizationId,
        prompt_type: 'image_generation',
        original_prompt: prompt,
        generated_result: null,
        model_name: 'qwen-image',
        execution_time: null,
        success: true,
        error_message: null,
        prompt_id: allPromptIds
      };
      
      console.log(`insertData:`, insertData);
      
      const result = await db.from('prompt_history').insert(insertData).select().single();
      
      console.log(`插入结果:`, result);
      
      if (result.error) {
        console.error(`插入数据库失败:`, result.error);
      } else {
        console.log(`已保存 ${taskResponses.length} 个 prompt_id 到数据库: ${allPromptIds}`);
      }
    } catch (error) {
      console.error(`保存 prompt_id 到数据库失败:`, error);
    }

    // 立即返回任务ID列表，不等待任务完成
    return NextResponse.json({
      success: true,
      tasks: taskResponses.map(task => ({
        promptId: task.promptId,
        number: task.number,
        status: 'pending'
      })),
      prompt,
      width,
      height
    }, { headers: corsHeaders() });
  } catch (error) {
    console.error('提交图片生成任务失败:', error);
    return NextResponse.json(
      { 
        error: '提交图片生成任务失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}