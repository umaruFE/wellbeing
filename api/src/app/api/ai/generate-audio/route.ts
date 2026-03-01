import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const AI_API_BASE_URL = process.env.AI_API_BASE_URL;

interface AudioGenerationRequest {
  prompt: string;
  count?: number;
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
      audio?: Array<{
        filename: string;
        subfolder: string;
        type: string;
      }>;
    };
  };
}

// 创建音频生成工作流
function createWorkflow(prompt: string, seed: number): Workflow {
  return {
    "2": {
      "inputs": {
        "filename_prefix": "audio/ComfyUI",
        "audioUI": "",
        "audio": [
          "9",
          0
        ]
      },
      "class_type": "SaveAudio",
      "_meta": {
        "title": "Save Audio (FLAC)"
      }
    },
    "9": {
      "inputs": {
        "lyrics": prompt,
        "tags": "Funny grounded R&B, immediate vocal entry, no long instrumental intro, start singing right away within 2 seconds, quick build-up, crisp drum machine from the first beat, clean female voice jumps in fast, powerful but no slow fade-in or atmospheric pad intro",
        "version": "RL-oss-3B-20260123",
        "codec_version": "oss-20260123",
        "seed": seed,
        "max_audio_length_seconds": 60,
        "topk": 1,
        "temperature": 1.5,
        "cfg_scale": 1.5,
        "keep_model_loaded": true,
        "offload_mode": "auto",
        "quantize_4bit": false
      },
      "class_type": "HeartMuLa_Generate",
      "_meta": {
        "title": "HeartMuLa Music Generator"
      }
    }
  };
}

// 提交音频生成任务
async function submitAudioTask(prompt: string, seed: number): Promise<TaskResponse> {
  const workflow = createWorkflow(prompt, seed);

  console.log(`提交音频生成任务: ${AI_API_BASE_URL}/prompt`);
  console.log(`请求参数:`, { prompt, seed });
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

// 提取音频信息
function extractAudioInfo(taskData: TaskStatus) {
  if (!taskData || !taskData.outputs) {
    return null;
  }

  const outputs = taskData.outputs;
  const saveAudioNode = Object.values(outputs).find(node => node.audio && node.audio.length > 0);

  if (!saveAudioNode) {
    return null;
  }

  const audioInfo = saveAudioNode.audio[0];
  return {
    filename: audioInfo.filename,
    subfolder: audioInfo.subfolder || '',
    type: audioInfo.type || 'output'
  };
}

// 下载音频
async function downloadAudio(filename: string, subfolder: string, type: string): Promise<Buffer> {
  const params = new URLSearchParams({
    filename,
    subfolder,
    type
  });

  const response = await fetch(`${AI_API_BASE_URL}/view?${params.toString()}`, {
    method: 'GET'
  });

  if (!response.ok) {
    throw new Error(`下载音频失败: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// 上传到OSS
async function uploadToOSS(buffer: Buffer, filename: string, folder: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', new Blob([buffer]), filename);
  formData.append('folder', folder);

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/upload`, {
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

// POST /api/ai/generate-audio - 生成多个音频（立即返回任务ID）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      count = 4,
      user_id,
      organization_id
    } = body as AudioGenerationRequest;

    if (!prompt) {
      return NextResponse.json(
        { error: '缺少prompt参数' },
        { status: 400 }
      );
    }

    const startTime = Date.now();
    const tasks = [];

    // 提交所有任务
    for (let i = 0; i < count; i++) {
      const seed = Date.now() + i * 1000;
      const taskPromise = submitAudioTask(prompt, seed);
      tasks.push(taskPromise);
    }

    const taskResponses = await Promise.all(tasks);
    console.log(`已提交 ${taskResponses.length} 个音频任务`);
    console.log(`user_id: ${user_id}, organization_id: ${organization_id}`);
    console.log(`taskResponses:`, taskResponses);

    // 保存 prompt_id 到数据库
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const validUserId = (user_id && uuidRegex.test(user_id)) ? user_id : null;
      const validOrganizationId = (organization_id && uuidRegex.test(organization_id)) ? organization_id : null;

      const allPromptIds = taskResponses.map(task => task.promptId).join(',');

      console.log(`准备保存音频 prompt_id 到数据库：`);
      console.log(`  - user_id: ${validUserId}`);
      console.log(`  - organization_id: ${validOrganizationId}`);
      console.log(`  - prompt_type: audio_generation`);
      console.log(`  - original_prompt: ${prompt.substring(0, 100)}...`);
      console.log(`  - model_name: heartmula-audio`);
      console.log(`  - prompt_id: ${allPromptIds}`);

      const insertData = {
        user_id: validUserId,
        organization_id: validOrganizationId,
        prompt_type: 'audio_generation',
        original_prompt: prompt,
        generated_result: null,
        model_name: 'heartmula-audio',
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
        console.log(`已保存 ${taskResponses.length} 个音频 prompt_id 到数据库: ${allPromptIds}`);
      }
    } catch (error) {
      console.error(`保存音频 prompt_id 到数据库失败:`, error);
    }

    // 立即返回任务ID列表，不等待任务完成
    return NextResponse.json({
      success: true,
      tasks: taskResponses.map(task => ({
        promptId: task.promptId,
        number: task.number,
        status: 'pending'
      })),
      prompt
    });
  } catch (error) {
    console.error('提交音频生成任务失败:', error);
    return NextResponse.json(
      {
        error: '提交音频生成任务失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
