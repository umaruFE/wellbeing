import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

const AI_API_BASE_URL = process.env.AI_API_BASE_URL;

interface ImageGenerationRequest {
  prompt: string;
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

// 创建图片生成工作流
function createWorkflow(prompt: string, width: number, height: number, seed: number): Workflow {
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
        "denoise": 1,
        "model": ["6", 0],
        "positive": ["7", 0],
        "negative": ["8", 0],
        "latent_image": ["9", 0]
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
    }
  };
}

// 提交图片生成任务
async function submitImageTask(prompt: string, width: number, height: number, seed: number): Promise<TaskResponse> {
  const workflow = createWorkflow(prompt, width, height, seed);
  
  console.log(`提交图片生成任务: ${AI_API_BASE_URL}/prompt`);
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
  formData.append('file', new Blob([buffer]), filename);
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
    const body = await request.json();
    const { 
      prompt, 
      count = 4, 
      width = 600, 
      height = 400,
      user_id,
      organization_id
    } = body as ImageGenerationRequest;

    if (!prompt) {
      return NextResponse.json(
        { error: '缺少prompt参数' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const startTime = Date.now();
    const tasks = [];

    // 提交所有任务
    for (let i = 0; i < count; i++) {
      const seed = Date.now() + i * 1000;
      const taskPromise = submitImageTask(prompt, width, height, seed);
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