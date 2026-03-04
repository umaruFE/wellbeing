import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

const AI_API_BASE_URL = process.env.AI_API_BASE_URL;
const AI_VIDEO_API_BASE_URL = process.env.AI_VIDEO_API_BASE_URL;
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const DASHSCOPE_API_URL =
  process.env.DASHSCOPE_API_URL ||
  'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

// 简单的中文检测函数
function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

// 使用通义千问生成视频用的正向/负向提示词
async function generateVideoPrompts(
  originalPrompt: string
): Promise<{ positivePrompt: string; negativePrompt: string }> {
  // 如果环境变量缺失，退回原始提示词和一个默认负面提示词
  if (!DASHSCOPE_API_KEY || !DASHSCOPE_API_URL) {
    return {
      positivePrompt: originalPrompt,
      negativePrompt:
        'blurry, low quality, distortion, jitter, flicker, artifacts, bad anatomy, wrong proportions'
    };
  }

  try {
    const systemPrompt = `
你是一名专业的视频提示词工程师，需要为视频生成模型（如 wan 或 LTX video）生成**英文正向和负向提示词**，重点是让整个视频在多个镜头之间保持**强关联性和连续性**。

【输入】用户给出一段关于视频内容的中文描述，可能包含多句对话，也可能已经隐含清晰的分镜结构。这通常对应一段**同一主角、同一场景或同一情境**下的短视频，而不是多个完全无关的小视频。

【非常重要的限制】（请务必严格遵守）：
1. **连续性与关联性优先**：把它理解为一段完整的短视频，所有镜头都应围绕**同一位或少数几个固定角色**、在**同一或高度相似的场景/环境**中发展，只是视角、动作或情绪有轻微变化，而不是多个完全无关的小片段。
2. **严禁“跳片段”**：不要突然把人物、场景、穿着、光线、时间、风格完全换掉，除非用户原文里明确写出了“切换到另一个场景/地点/时间”的描述。
3. 严禁添加任何原文中不存在的新剧情、新动作、新镜头或新角色设定，不允许“脑补”复杂的新情节。
4. 只能基于用户原文中已经出现的场景、动作和时间顺序进行整理和重写，可以对语言做等价改写，但不要改变事件本身。
5. 可以适度做细节“删减”或“合并镜头”，但**绝对不能增加额外镜头数量**或引入新的事件。

【要求生成的 positive_prompt】（正向提示词，必须体现强关联的连续画面）：
1. 第一行：用英文写一段对整个视频的总体描述，1-2 句，**明确说明这是一个连续的短视频**，概括固定的人物、稳定的场景和整体情绪，但不得引入原文中没有的新设定。
2. 下面多行：将原文中已有的关键画面和动作，按原有时间顺序整理成分镜头描述，使用如下格式：
	scene 1: ...
	scene 2: ...
	scene 3: ...
   - “scene X:” 后面的内容用英文描述画面与动作，只能描述原文中已经提到或可以直接等价改写的内容。
   - **重点保持前后画面的连续性和关联性**：后面的 scene 通常是对前面 scene 的延续（例如镜头推进、人物动作的自然继续、表情和情绪的变化），而不是突然出现全新的地点或无关人物。
   - 如果原文中有角色对白，请保留对白的原始语言（例如中文台词）原样嵌在英文描述中，不要翻译对白内容。
   - 如果原文本身只有一个整体画面，没有明显分镜，可以只输出 scene 1，不要强行拆出更多 scene。
3. 在描述视觉风格时，可以适度加入“consistent character appearance, consistent lighting, consistent background, same outfit”的表达，以帮助视频在整段时间内保持统一的角色与环境。
4. 整个 positive_prompt 只能使用英文（对白部分除外），适合作为视频生成模型的正向提示词。

【要求生成的 negative_prompt】：
1. 输出一行英文的负向提示词，用逗号分隔，涵盖常见的视频/画面质量问题，例如：blurred, out of focus, low quality, artifacts, jitter, flicker, distorted face, extra limbs, bad hands, etc。
2. 特别要包含与**连贯性相关的负向提示**，例如：inconsistent character, inconsistent outfit, inconsistent background, style mismatch, sudden scene change, random shot, unrelated frame, inconsistent lighting。
3. 不要包含和剧情相关的具体内容，只描述需要避免的画面/音频缺陷和不连续的镜头问题。

【输出格式】：
请严格输出一个 JSON 对象，不要添加任何多余解释或前后缀，例如：
{
  "positive_prompt": "Overall description...\\n\\nscene 1: ...\\nscene 2: ...",
  "negative_prompt": "blurred, out of focus, ..."
}`;

    const response = await fetch(DASHSCOPE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DASHSCOPE_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        input: {
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: originalPrompt
            }
          ]
        },
        parameters: {
          temperature: 0.4,
          max_tokens: 800
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('通义千问视频提示词 API 调用失败:', response.status, response.statusText, errorText);
      return {
        positivePrompt: originalPrompt,
        negativePrompt:
          'blurry, low quality, distortion, jitter, flicker, artifacts, bad anatomy, wrong proportions'
      };
    }

    const data = await response.json();

    // 兼容不同返回结构
    const rawText =
      data.output?.text?.trim() ||
      data.output?.choices?.[0]?.message?.content?.trim() ||
      data.choices?.[0]?.message?.content?.trim();

    if (!rawText) {
      return {
        positivePrompt: originalPrompt,
        negativePrompt:
          'blurry, low quality, distortion, jitter, flicker, artifacts, bad anatomy, wrong proportions'
      };
    }

    // 提取 JSON
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('通义千问返回内容中未找到 JSON，使用原始提示词。');
      return {
        positivePrompt: originalPrompt,
        negativePrompt:
          'blurry, low quality, distortion, jitter, flicker, artifacts, bad anatomy, wrong proportions'
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const positivePrompt =
      typeof parsed.positive_prompt === 'string' && parsed.positive_prompt.trim()
        ? parsed.positive_prompt.trim()
        : originalPrompt;
    const negativePrompt =
      typeof parsed.negative_prompt === 'string' && parsed.negative_prompt.trim()
        ? parsed.negative_prompt.trim()
        : 'blurry, low quality, distortion, jitter, flicker, artifacts, bad anatomy, wrong proportions';

    return { positivePrompt, negativePrompt };
  } catch (error) {
    console.error('生成视频提示词失败，使用回退提示词。错误:', error);
    return {
      positivePrompt: originalPrompt,
      negativePrompt:
        'blurry, low quality, distortion, jitter, flicker, artifacts, bad anatomy, wrong proportions'
    };
  }
}

interface VideoGenerationRequest {
  prompt: string;
  imageUrl?: string;
  imageUrls?: string[];
  duration?: number;
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
      gifs?: Array<{
        filename: string;
        subfolder: string;
        type: string;
      }>;
      images?: Array<{
        filename: string;
        subfolder: string;
        type: string;
      }>;
    };
  };
}

interface ComfyUIUploadResponse {
  name: string;
  subfolder?: string;
  type?: string;
}

// 简单的 CORS 辅助方法（如果后续有全局中间件，可以再调整）
const ALLOWED_ORIGIN =
  process.env.NEXT_PUBLIC_WEB_ORIGIN ||
  process.env.NEXT_PUBLIC_APP_URL ||
  '*';

function withCors(response: NextResponse) {
  response.headers.set('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET,POST,OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type,Authorization,X-Requested-With'
  );
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  return response;
}

// 处理浏览器的预检请求，避免 CORS 报错
export async function OPTIONS() {
  const res = new NextResponse(null, { status: 204 });
  return withCors(res);
}

// 从OSS URL下载图片
async function downloadImage(imageUrl: string): Promise<Buffer> {
  try {
    // 如果是本地路径，需要处理
    let fullUrl = imageUrl;
    if (imageUrl.startsWith('/')) {
      fullUrl = new URL(imageUrl, process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').href;
    }

    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`下载图片失败: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('下载图片失败:', error);
    throw error;
  }
}

// 上传图片到ComfyUI
async function uploadImageToComfyUI(imageBuffer: Buffer, filename: string): Promise<string> {
  try {
    const formData = new FormData();
    // Buffer 在 TS 类型上不总是被视为合法 BlobPart，这里显式转成 Uint8Array
    const blob = new Blob([new Uint8Array(imageBuffer)]);
    formData.append('image', blob, filename);

    const response = await fetch(`${AI_VIDEO_API_BASE_URL}/upload/image`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`上传图片到ComfyUI失败: ${response.status} ${errorText}`);
    }

    const data: ComfyUIUploadResponse = await response.json();

    // 对于 ComfyUI 的 LoadImage 节点，这里只需要返回文件名本身
    // 例如: "xxx.png"；subfolder 和 type 由 ComfyUI 自己管理
    return data.name;
  } catch (error) {
    console.error('上传图片到ComfyUI失败:', error);
    throw error;
  }
}

// 上传多张图片到ComfyUI（保持顺序）
async function uploadImagesToComfyUI(imageUrls: string[]): Promise<string[]> {
  const results: string[] = [];
  for (const url of imageUrls) {
    console.log(`开始下载参考图: ${url}`);
    const imageBuffer = await downloadImage(url);

    // 从URL中提取文件名，如果没有则使用默认名称
    const urlParts = url.split('/');
    const originalFilename = urlParts[urlParts.length - 1].split('?')[0] || 'reference_image.png';

    console.log(`上传参考图到ComfyUI: ${originalFilename}`);
    const comfyPath = await uploadImageToComfyUI(imageBuffer, originalFilename);
    console.log(`参考图上传成功，ComfyUI路径: ${comfyPath}`);
    results.push(comfyPath);
  }
  return results;
}

export async function POST(request: NextRequest) {
  try {
    const body: VideoGenerationRequest = await request.json();
    const { prompt, imageUrl, imageUrls, duration = 5, user_id, organization_id } = body;

    if (!prompt) {
      return withCors(
        NextResponse.json(
          { success: false, error: 'Prompt is required' },
          { status: 400 }
        )
      );
    }

    if (!AI_VIDEO_API_BASE_URL) {
      return withCors(
        NextResponse.json(
          { success: false, error: 'AI API base URL not configured' },
          { status: 500 }
        )
      );
    }

    // 使用通义千问生成英文正向/负向提示词
    console.log('原始视频提示词:', prompt);
    console.log('是否包含中文:', containsChinese(prompt));
    const { positivePrompt, negativePrompt } = await generateVideoPrompts(prompt);
    console.log('生成的视频正向提示词:', positivePrompt);
    console.log('生成的视频负向提示词:', negativePrompt);

    // 如果有参考图（支持单张 imageUrl 或多张 imageUrls），先上传到ComfyUI
    const allImageUrls: string[] = Array.isArray(imageUrls) && imageUrls.length > 0
      ? imageUrls.filter(Boolean)
      : (imageUrl ? [imageUrl] : []);

    let comfyImagePaths: string[] = [];

    if (allImageUrls.length > 0) {
      try {
        comfyImagePaths = await uploadImagesToComfyUI(allImageUrls);
      } catch (error) {
        console.error('上传参考图失败:', error);
        return withCors(
          NextResponse.json(
            { success: false, error: `上传参考图失败: ${(error as Error).message}` },
            { status: 500 }
          )
        );
      }
    }

    // 根据分镜图数量自动匹配对应的工作流 JSON
    // 1 张 -> video-1.json
    // 2 张 -> video-2.json
    // 3 张 -> video-3.json
    // 4 张 -> video-4.json
    // 5 张及以上 -> video-5.json
    const storyboardCount = comfyImagePaths.length || allImageUrls.length || 0;
    let workflowJsonFile = 'video-3.json';

    if (storyboardCount <= 1) {
      workflowJsonFile = 'video-1.json';
    } else if (storyboardCount === 2) {
      workflowJsonFile = 'video-2.json';
    } else if (storyboardCount === 3) {
      workflowJsonFile = 'video-3.json';
    } else if (storyboardCount === 4) {
      workflowJsonFile = 'video-4.json';
    } else if (storyboardCount >= 5) {
      workflowJsonFile = 'video-5.json';
    }

    // 注意：当前 Next 应用根目录为 api，因此这里的 cwd 已经是 D:\workspace\wellbeing\api
    // 工作流 JSON 实际存放在 src/app/api/ai/generate-video 下，不需要再额外拼一层 api 目录
    const workflowJsonPath = path.join(
      process.cwd(),
      'src',
      'app',
      'api',
      'ai',
      'generate-video',
      workflowJsonFile
    );

    let workflow: Workflow;

    try {
      const jsonContent = await fs.readFile(workflowJsonPath, 'utf-8');
      workflow = JSON.parse(jsonContent) as Workflow;

      // 写入正向 / 负向提示词（节点 71 / 78）
      if (workflow['71']?.inputs) {
        workflow['71'].inputs.text = positivePrompt;
      }
      if (workflow['78']?.inputs) {
        workflow['78'].inputs.text = negativePrompt;
      }

      // 兼容不同版本的工作流：补全部分节点的必需输入，避免 ComfyUI 校验报错
      // 1) CLIPTextEncode 节点 71 / 78 需要 clip 输入，连接到 DualCLIPLoader 节点 53
      if (workflow['53'] && workflow['71']?.inputs && !workflow['71'].inputs.clip) {
        workflow['71'].inputs.clip = ['53', 0];
      }
      if (workflow['53'] && workflow['78']?.inputs && !workflow['78'].inputs.clip) {
        workflow['78'].inputs.clip = ['53', 0];
      }

      // 2) LTXVAddGuideMulti (86) 和 VAEDecodeTiled (93) 需要图像 vae，连接到 VAELoader 节点 56
      if (workflow['56']) {
        if (workflow['86']?.inputs && !workflow['86'].inputs.vae) {
          workflow['86'].inputs.vae = ['56', 0];
        }
        if (workflow['93']?.inputs && !workflow['93'].inputs.vae) {
          workflow['93'].inputs.vae = ['56', 0];
        }
      }

      // 3) LTXVEmptyLatentAudio (91) 和 LTXVAudioVAEDecode (65) 需要 audio_vae，连接到 VAELoaderKJ 节点 60
      if (workflow['60']) {
        if (workflow['91']?.inputs && !workflow['91'].inputs.audio_vae) {
          workflow['91'].inputs.audio_vae = ['60', 0];
        }
        if (workflow['65']?.inputs && !workflow['65'].inputs.audio_vae) {
          workflow['65'].inputs.audio_vae = ['60', 0];
        }
      }

      // 用上传到 ComfyUI 的分镜图替换模板中的 LoadImage 节点图片
      const comfyPathsToUse =
        comfyImagePaths.length > 0
          ? comfyImagePaths
          : imageUrl
          ? [imageUrl]
          : [];

      if (comfyPathsToUse.length > 0) {
        const loadImageNodeKeys = Object.keys(workflow)
          .filter((key) => {
            const node = workflow[key];
            return (
              node &&
              node.class_type === 'LoadImage' &&
              node.inputs &&
              typeof node.inputs.image === 'string'
            );
          })
          // 按节点编号排序，保证与模板中的顺序一致
          .sort((a, b) => Number(a) - Number(b));

        loadImageNodeKeys.forEach((key, index) => {
          const replacement =
            comfyPathsToUse[index] ||
            comfyPathsToUse[comfyPathsToUse.length - 1];
          if (replacement) {
            workflow[key].inputs.image = replacement;
          }
        });

        // 打印出最终替换后的 LoadImage 节点参数，方便排查图片路径是否正确
        console.log(
          'Generate-video 使用的工作流文件:',
          workflowJsonFile,
          '分镜数量:',
          storyboardCount
        );
        console.log(
          'ComfyUI 上传返回的图片文件名:',
          comfyImagePaths
        );
        console.log(
          '工作流中 LoadImage 节点的最终 image 参数:',
          loadImageNodeKeys.map((key) => ({
            id: key,
            image: workflow[key]?.inputs?.image
          }))
        );
      }
    } catch (jsonError) {
      console.error(
        '读取或解析工作流 JSON 失败，无法根据分镜数量匹配模板:',
        jsonError
      );
      throw new Error('读取视频工作流模板失败');
    }

    // 调用AI API提交任务
    const comfyRequestBody = {
      prompt: workflow,
      client_id: user_id || 'anonymous'
    };

    // 为了方便你排查，把发给 ComfyUI 的完整参数都打印出来（只在服务端日志里）
    try {
      console.log(
        '即将发送给 ComfyUI 的完整请求体:',
        JSON.stringify(comfyRequestBody, null, 2)
      );
    } catch (e) {
      // 极端情况下 stringify 失败（如循环引用），至少打印一个简略版
      console.log('即将发送给 ComfyUI 的请求体（简略版）:', {
        hasPrompt: !!workflow,
        nodeCount: Object.keys(workflow || {}).length,
        client_id: comfyRequestBody.client_id
      });
    }

    const promptResponse = await fetch(`${AI_VIDEO_API_BASE_URL}/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(comfyRequestBody)
    });

    if (!promptResponse.ok) {
      const errorText = await promptResponse.text();
      throw new Error(`AI API error: ${promptResponse.status} - ${errorText}`);
    }

    const promptRaw = await promptResponse.json();

    // 兼容后端可能返回的不同字段名：prompt_id / promptId
    const promptData: TaskResponse = {
      promptId: (promptRaw as any).prompt_id || (promptRaw as any).promptId,
      number: (promptRaw as any).number ?? 0
    };

    // 如果后端没有返回 promptId，记录错误日志但继续后续流程
    if (!promptData.promptId) {
      console.error('ComfyUI 返回结果中缺少 prompt_id/promptId 字段:', promptRaw);
    }

    // 保存任务到数据库
    const { data: taskData, error: taskError } = await db
      .from('ai_tasks')
      .insert({
        // 如果没有拿到 promptId，就先存 null，后续可以通过其他方式补回
        prompt_id: promptData.promptId || null,
        type: 'video_generation',
        status: 'pending',
        prompt: prompt,
        user_id: user_id || null,
        organization_id: organization_id || null,
        metadata: {
          image_url: imageUrl || (allImageUrls[0] || null),
          image_urls: allImageUrls,
          comfy_image_paths: comfyImagePaths,
          duration: duration,
          workflow_type: allImageUrls.length > 0 ? 'image_to_video' : 'text_to_video'
        }
      })
      .select()
      .single();

    if (taskError) {
      console.error('Error saving task:', taskError);
    }

    return withCors(
      NextResponse.json({
        success: true,
        taskId: taskData?.id,
        promptId: promptData.promptId,
        number: promptData.number,
        message: 'Video generation task submitted successfully'
      })
    );

  } catch (error) {
    console.error('Error in video generation:', error);
    return withCors(
      NextResponse.json(
        { success: false, error: (error as Error).message },
        { status: 500 }
      )
    );
  }
}
