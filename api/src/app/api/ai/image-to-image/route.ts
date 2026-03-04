import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const AI_API_BASE_URL = process.env.AI_API_BASE_URL;

interface ImageToImageRequest {
  prompt: string;
  imageUrl: string;
  count?: number;
  width?: number;
  height?: number;
  user_id?: string;
  organization_id?: string;
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

// 上传图片到 ComfyUI
async function uploadImageToComfyUI(imageUrl: string): Promise<string> {
  try {
    let fullUrl = imageUrl;
    
    // 处理不同类型的 URL
    if (imageUrl.startsWith('/')) {
      // 相对路径，构建完整 URL
      fullUrl = new URL(imageUrl, process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').href;
    } else if (imageUrl.includes('localhost:517') || imageUrl.includes('127.0.0.1:517')) {
      // 前端开发服务器地址，构建完整 URL
      const urlObj = new URL(imageUrl);
      fullUrl = new URL(urlObj.pathname, process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').href;
      console.log(`检测到前端本地地址，转换为完整 URL: ${imageUrl} -> ${fullUrl}`);
    }
    // OSS URL 或其他公网 URL 直接使用

    console.log(`下载参考图片: ${fullUrl}`);
    
    // 下载图片
    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`下载图片失败: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    
    // 检测图片类型
    const contentType = response.headers.get('content-type') || 'image/png';
    const extension = contentType.split('/')[1] || 'png';
    const filename = `image_${Date.now()}.${extension}`;
    
    // 创建 FormData
    const formData = new FormData();
    const blob = new Blob([arrayBuffer], { type: contentType });
    formData.append('image', blob, filename);
    
    // 上传到 ComfyUI
    const uploadResponse = await fetch(`${AI_API_BASE_URL}/upload/image`, {
      method: 'POST',
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`上传图片到 ComfyUI 失败: ${uploadResponse.status} ${uploadResponse.statusText}`, errorText);
      throw new Error(`上传图片到 ComfyUI 失败: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    const uploadData = await uploadResponse.json();
    // ComfyUI 返回的格式通常是 { name: "ComfyUI/input/filename.png" }
    const imagePath = uploadData.name || uploadData.filename || uploadData.path;
    
    if (!imagePath) {
      throw new Error('ComfyUI 返回的图片路径为空');
    }

    console.log(`图片上传成功，路径: ${imagePath}`);
    return imagePath;
  } catch (error) {
    console.error('上传图片到 ComfyUI 失败:', error);
    throw error;
  }
}

// 创建图生图工作流
function createImageToImageWorkflow(prompt: string, width: number, height: number, seed: number, imagePath: string): Workflow {
  return {
    "2": {
      "inputs": {
        "unet_name": "qwen_image_fp8_e4m3fn.safetensors",
        "weight_dtype": "fp8_e4m3fn"
      },
      "class_type": "UNETLoader",
      "_meta": {
        "title": "Load Diffusion Model"
      }
    },
    "3": {
      "inputs": {
        "clip_name": "qwen_2.5_vl_7b_fp8_scaled.safetensors",
        "type": "qwen_image",
        "device": "default"
      },
      "class_type": "CLIPLoader",
      "_meta": {
        "title": "Load CLIP"
      }
    },
    "4": {
      "inputs": {
        "vae_name": "qwen_image_vae.safetensors"
      },
      "class_type": "VAELoader",
      "_meta": {
        "title": "Load VAE"
      }
    },
    "5": {
      "inputs": {
        "image": imagePath
      },
      "class_type": "LoadImage",
      "_meta": {
        "title": "Load Image"
      }
    },
    "6": {
      "inputs": {
        "shift": 3.1000000000000005,
        "model": ["12", 0]
      },
      "class_type": "ModelSamplingAuraFlow",
      "_meta": {
        "title": "ModelSamplingAuraFlow"
      }
    },
    "7": {
      "inputs": {
        "text": prompt,
        "clip": ["3", 0]
      },
      "class_type": "CLIPTextEncode",
      "_meta": {
        "title": "CLIP Text Encode (Prompt)"
      }
    },
    "8": {
      "inputs": {
        "text": "模糊，低清，畸形，杂乱背景，过多装饰，恐怖，黑暗，血腥，写实照片，油画，过度写实，文字变形，文字模糊，手绘感太重，噪点，复杂纹理，水印，ui界面，多余人物",
        "clip": ["3", 0]
      },
      "class_type": "CLIPTextEncode",
      "_meta": {
        "title": "CLIP Text Encode (Prompt)"
      }
    },
    "9": {
      "inputs": {
        "width": width,
        "height": height,
        "batch_size": 1
      },
      "class_type": "EmptyLatentImage",
      "_meta": {
        "title": "Empty Latent Image"
      }
    },
    "10": {
      "inputs": {
        "seed": seed,
        "steps": 8,
        "cfg": 1,
        "sampler_name": "res_multistep",
        "scheduler": "sgm_uniform",
        "denoise": 0.75,
        "model": ["6", 0],
        "positive": ["7", 0],
        "negative": ["8", 0],
        "latent_image": ["16", 0]
      },
      "class_type": "KSampler",
      "_meta": {
        "title": "KSampler"
      }
    },
    "12": {
      "inputs": {
        "lora_name": "Qwen-Image-Lightning-8steps-V1.0.safetensors",
        "strength_model": 1,
        "model": ["2", 0]
      },
      "class_type": "LoraLoaderModelOnly",
      "_meta": {
        "title": "LoraLoaderModelOnly"
      }
    },
    "14": {
      "inputs": {
        "filename_prefix": "ComfyUI",
        "images": ["15", 0]
      },
      "class_type": "SaveImage",
      "_meta": {
        "title": "Save Image"
      }
    },
    "15": {
      "inputs": {
        "samples": ["10", 0],
        "vae": ["4", 0]
      },
      "class_type": "VAEDecode",
      "_meta": {
        "title": "VAE Decode"
      }
    },
    "16": {
      "inputs": {
        "pixels": ["5", 0],
        "vae": ["4", 0]
      },
      "class_type": "VAEEncode",
      "_meta": {
        "title": "VAE Encode"
      }
    }
  };
}

// 提交图生图任务（使用已经上传到 ComfyUI 的图片路径）
async function submitImageToImageTask(prompt: string, width: number, height: number, seed: number, imagePath: string): Promise<TaskResponse> {
  console.log(`使用已上传的参考图片路径提交任务: ${imagePath}`);

  const workflow = createImageToImageWorkflow(prompt, width, height, seed, imagePath);

  console.log(`提交图生图任务: ${AI_API_BASE_URL}/prompt`);
  console.log(`请求参数:`, { prompt, width, height, seed });

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
  // 将 Buffer 转换为 Uint8Array 以兼容 Blob
  const uint8Array = new Uint8Array(buffer);
  formData.append('file', new Blob([uint8Array]), filename);
  formData.append('folder', folder);

  // 在服务器端使用完整的 URL
  const response = await fetch(new URL('/api/upload', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'), {
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

// POST /api/ai/image-to-image - 图生图（立即返回任务ID）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      imageUrl,
      count = 4,
      width = 600,
      height = 400,
      user_id,
      organization_id
    } = body as ImageToImageRequest;

    if (!prompt) {
      return NextResponse.json(
        { error: '缺少prompt参数' },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: '缺少imageUrl参数' },
        { status: 400, headers: corsHeaders() }
      );
    }

    console.log(`开始图生图，参考图片: ${imageUrl}`);

    const startTime = Date.now();

    // 先将参考图片上传到 ComfyUI，一次请求只上传一次
    console.log(`开始上传参考图片到 ComfyUI: ${imageUrl}`);
    let imagePath: string;
    try {
      imagePath = await uploadImageToComfyUI(imageUrl);
      console.log(`参考图片上传到 ComfyUI 完成，路径: ${imagePath}`);
    } catch (error) {
      console.error('参考图片上传到 ComfyUI 失败:', error);
      return NextResponse.json(
        {
          error: '参考图片上传到 ComfyUI 失败',
          details: error instanceof Error ? error.message : '未知错误'
        },
        { status: 500, headers: corsHeaders() }
      );
    }
    const tasks = [];

    // 提交所有任务（共用同一张已上传的参考图片）
    for (let i = 0; i < count; i++) {
      const seed = Date.now() + i * 1000;
      const taskPromise = submitImageToImageTask(prompt, width, height, seed, imagePath);
      tasks.push(taskPromise);
    }

    const taskResponses = await Promise.all(tasks);
    console.log(`已提交 ${taskResponses.length} 个图生图任务`);
    console.log(`user_id: ${user_id}, organization_id: ${organization_id}`);
    console.log(`taskResponses:`, taskResponses);

    // 保存 prompt_id 到数据库
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validUserId = (user_id && uuidRegex.test(user_id)) ? user_id : null;
      const validOrganizationId = (organization_id && uuidRegex.test(organization_id)) ? organization_id : null;

      const allPromptIds = taskResponses.map(task => task.promptId).join(',');

      console.log(`准备保存图生图 prompt_id 到数据库：`);
      console.log(`  - user_id: ${validUserId}`);
      console.log(`  - organization_id: ${validOrganizationId}`);
      console.log(`  - prompt_type: image_to_image`);
      console.log(`  - original_prompt: ${prompt.substring(0, 100)}...`);
      console.log(`  - model_name: qwen-image`);
      console.log(`  - prompt_id: ${allPromptIds}`);

      const insertData = {
        user_id: validUserId,
        organization_id: validOrganizationId,
        prompt_type: 'image_to_image',
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
        console.log(`已保存 ${taskResponses.length} 个图生图 prompt_id 到数据库: ${allPromptIds}`);
      }
    } catch (error) {
      console.error(`保存图生图 prompt_id 到数据库失败:`, error);
    }

    // 立即返回任务ID列表，不等待任务完成
    return NextResponse.json(
      {
      success: true,
      tasks: taskResponses.map(task => ({
        promptId: task.promptId,
        number: task.number,
        status: 'pending'
      })),
      prompt,
      width,
      height
      },
      { headers: corsHeaders() }
    );
  } catch (error) {
    console.error('提交图生图任务失败:', error);
    return NextResponse.json(
      {
        error: '提交图生图任务失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500, headers: corsHeaders() }
    );
  }
}
