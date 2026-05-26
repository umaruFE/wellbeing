import { NextRequest, NextResponse } from 'next/server';
import { uploadToOss } from '@/lib/oss';
import { db } from '@/lib/db';

const COMFYUI_URL = process.env.COMFYUI_PUBLIC_URL || 'https://vcbj5meqyp1y7ifw-8188.container.x-gpu.com';

const HAS_OSS_KEYS = !!(process.env.ALIYUN_OSS_ACCESS_KEY_ID && process.env.ALIYUN_OSS_ACCESS_KEY_SECRET);
const UPLOAD_PROVIDER = (process.env.UPLOAD_PROVIDER || 'local').toLowerCase();
const USE_OSS = UPLOAD_PROVIDER === 'oss' && HAS_OSS_KEYS;

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

function buildComfyuiWorkflow(imagePrompt: string) {
  const seed = Math.floor(Math.random() * 1000000000000);

  return {
    "1": {
      "inputs": { "unet_name": "z_image_turbo_bf16.safetensors", "weight_dtype": "default" },
      "class_type": "UNETLoader",
      "_meta": { "title": "UNet\u52A0\u8F7D\u5668" }
    },
    "2": {
      "inputs": { "vae_name": "ae.safetensors" },
      "class_type": "VAELoader",
      "_meta": { "title": "\u52A0\u8F7DVAE" }
    },
    "3": {
      "inputs": { "clip_name": "qwen_3_4b.safetensors", "type": "lumina2", "device": "default" },
      "class_type": "CLIPLoader",
      "_meta": { "title": "\u52A0\u8F7DCLIP" }
    },
    "4": {
      "inputs": { "shift": 3, "model": ["1", 0] },
      "class_type": "ModelSamplingAuraFlow",
      "_meta": { "title": "\u91C7\u6837\u7B97\u6CD5\uFF08AuraFlow\uFF09" }
    },
    "5": {
      "inputs": { "width": 2048, "height": 1152, "batch_size": 1 },
      "class_type": "EmptySD3LatentImage",
      "_meta": { "title": "\u7A7ALatent\u56FE\u50CF\uFF08SD3\uFF09" }
    },
    "6": {
      "inputs": { "text": imagePrompt, "clip": ["3", 0] },
      "class_type": "CLIPTextEncode",
      "_meta": { "title": "\u6B63\u5411\u63D0\u793A\u8BCD" }
    },
    "7": {
      "inputs": {
        "seed": seed,
        "steps": 20,
        "cfg": 4,
        "sampler_name": "euler",
        "scheduler": "beta",
        "model": ["4", 0],
        "positive": ["6", 0],
        "negative": ["6", 0],
        "latent_image": ["5", 0]
      },
      "class_type": "KSampler",
      "_meta": { "title": "KSampler" }
    },
    "8": {
      "inputs": { "samples": ["7", 0], "vae": ["2", 0] },
      "class_type": "VAEDecode",
      "_meta": { "title": "VAE\u89E3\u7801" }
    },
    "10": {
      "inputs": {
        "filename_prefix": "Universal_Scene",
        "images": ["8", 0]
      },
      "class_type": "SaveImage",
      "_meta": { "title": "\u4FDD\u5B58\u56FE\u7247" }
    }
  };
}

async function saveImageToStorage(buffer: Buffer, ext: string): Promise<string> {
  const savedFilename = `theme-${Date.now()}.${ext}`;

  if (USE_OSS) {
    return await uploadToOss(buffer, 'course-themes', savedFilename);
  }

  const fs = await import('fs/promises');
  const path = await import('path');
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
  const baseDir = path.join(process.cwd(), 'public', 'uploads', 'course-themes', String(year), month, day);
  await fs.mkdir(baseDir, { recursive: true });
  await fs.writeFile(path.join(baseDir, uniqueName), buffer);
  return `/uploads/course-themes/${year}/${month}/${day}/${uniqueName}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, themeImagePrompt } = body;

    if (!themeImagePrompt) {
      return NextResponse.json(
        { success: false, error: '缺少 themeImagePrompt 参数' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const imagePrompt = themeImagePrompt;

    const workflow = buildComfyuiWorkflow(imagePrompt);

    console.log('[regenerate-theme-image] 提交 ComfyUI 任务');

    const submitResponse = await fetch(`${COMFYUI_URL}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow),
    });

    if (!submitResponse.ok) {
      const errorText = await submitResponse.text();
      console.error('[regenerate-theme-image] ComfyUI 提交失败:', errorText);
      return NextResponse.json(
        { success: false, error: 'ComfyUI 任务提交失败' },
        { status: 500, headers: corsHeaders() }
      );
    }

    const submitData = await submitResponse.json();
    const promptId = submitData.prompt_id;

    if (!promptId) {
      return NextResponse.json(
        { success: false, error: 'ComfyUI 未返回 prompt_id' },
        { status: 500, headers: corsHeaders() }
      );
    }

    console.log('[regenerate-theme-image] promptId:', promptId, '开始轮询...');

    const maxAttempts = 200;
    const pollInterval = 3000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      try {
        const historyResponse = await fetch(`${COMFYUI_URL}/history/${promptId}`);
        if (!historyResponse.ok) continue;

        const history = await historyResponse.json();
        const taskData = history[promptId];

        if (!taskData) continue;

        if (taskData.status?.status_str === 'error') {
          console.error('[regenerate-theme-image] ComfyUI 内部错误');
          return NextResponse.json(
            { success: false, error: '图片生成失败(ComfyUI内部报错)' },
            { status: 500, headers: corsHeaders() }
          );
        }

        const outputs = taskData.outputs || {};
        for (const nodeId of Object.keys(outputs)) {
          const nodeOutput = outputs[nodeId];
          if (nodeOutput?.images && nodeOutput.images.length > 0) {
            const img = nodeOutput.images[0];
            const imageUrl = `${COMFYUI_URL}/view?filename=${encodeURIComponent(img.filename)}&subfolder=${encodeURIComponent(img.subfolder || '')}&type=${encodeURIComponent(img.type || 'output')}`;

            console.log('[regenerate-theme-image] 图片生成完成，下载中:', imageUrl);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            const imgResponse = await fetch(imageUrl, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (!imgResponse.ok) {
              console.error('[regenerate-theme-image] 图片下载失败:', imgResponse.status);
              return NextResponse.json(
                { success: false, error: '图片下载失败' },
                { status: 500, headers: corsHeaders() }
              );
            }

            const arrayBuffer = await imgResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const ext = img.filename.split('.').pop() || 'png';

            const themeImageUrl = await saveImageToStorage(buffer, ext);

            console.log('[regenerate-theme-image] 图片已保存:', themeImageUrl);

            if (courseId) {
              try {
                const existing = await db.query('SELECT course_data FROM courses WHERE id = $1', [courseId]);
                const existingData = existing.rows[0]?.course_data || {};
                if (typeof existingData === 'string') {
                  try { Object.assign(existingData, JSON.parse(existingData)); } catch {}
                }
                existingData.themeImageUrl = themeImageUrl;
                await db.query('UPDATE courses SET course_data = $1, updated_at = $2 WHERE id = $3', [
                  JSON.stringify(existingData),
                  new Date().toISOString(),
                  courseId
                ]);
                console.log('[regenerate-theme-image] 数据库已更新');
              } catch (dbErr) {
                console.error('[regenerate-theme-image] 数据库更新失败:', dbErr);
              }
            }

            return NextResponse.json({
              success: true,
              themeImageUrl
            }, { headers: corsHeaders() });
          }
        }
      } catch (pollErr) {
        console.warn('[regenerate-theme-image] 轮询异常:', pollErr);
      }
    }

    return NextResponse.json(
      { success: false, error: '图片生成超时' },
      { status: 500, headers: corsHeaders() }
    );

  } catch (error) {
    console.error('[regenerate-theme-image] 失败:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '图片生成失败' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
