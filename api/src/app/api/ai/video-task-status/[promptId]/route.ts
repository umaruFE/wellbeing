import { NextRequest, NextResponse } from 'next/server';

const AI_VIDEO_API_BASE_URL = process.env.AI_VIDEO_API_BASE_URL;

// 禁用缓存以避免大文件下载时的警告
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// 提取图片信息
function extractImageInfo(taskData: any) {
  if (!taskData || !taskData.outputs) {
    return null;
  }

  const outputs = taskData.outputs;
  const saveImageNode = Object.values(outputs).find(
    (node: any) => node.images && node.images.length > 0
  );

  if (!saveImageNode) {
    return null;
  }

  const imageInfo = (saveImageNode as any).images[0];
  return {
    filename: imageInfo.filename,
    subfolder: imageInfo.subfolder || '',
    type: imageInfo.type || 'output'
  };
}

// 提取视频信息
function extractVideoInfo(taskData: any) {
  if (!taskData || !taskData.outputs) {
    return null;
  }

  const outputs = taskData.outputs;
  // VHS_VideoCombine 节点输出视频
  const saveVideoNode = Object.values(outputs).find((node: any) => {
    // 检查是否有视频文件（通常是 gifs 数组，但实际上是视频）
    if (node.gifs && node.gifs.length > 0) {
      return true;
    }
    // 或者检查文件名后缀
    if (node.images && node.images.length > 0) {
      const filename = node.images[0].filename;
      if (
        filename.endsWith('.mp4') ||
        filename.endsWith('.webm') ||
        filename.endsWith('.mov')
      ) {
        return true;
      }
    }
    return false;
  });

  if (!saveVideoNode) {
    return null;
  }

  const node = saveVideoNode as any;
  // 优先从 gifs 数组获取
  if (node.gifs && node.gifs.length > 0) {
    const videoInfo = node.gifs[0];
    return {
      filename: videoInfo.filename,
      subfolder: videoInfo.subfolder || '',
      type: videoInfo.type || 'output'
    };
  }
  // 否则从 images 数组获取
  if (node.images && node.images.length > 0) {
    const videoInfo = node.images[0];
    return {
      filename: videoInfo.filename,
      subfolder: videoInfo.subfolder || '',
      type: videoInfo.type || 'output'
    };
  }

  return null;
}

// 下载文件（从视频专用的 ComfyUI 实例）
async function downloadFile(
  filename: string,
  subfolder: string,
  type: string
): Promise<Buffer> {
  const params = new URLSearchParams({
    filename,
    subfolder,
    type
  });

  const response = await fetch(
    `${AI_VIDEO_API_BASE_URL}/view?${params.toString()}`,
    {
      method: 'GET'
    }
  );

  if (!response.ok) {
    throw new Error(`下载文件失败: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// 上传到OSS
async function uploadToOSS(
  buffer: Buffer,
  filename: string,
  folder: string,
  contentType: string
): Promise<string> {
  const isProduction = process.env.NODE_ENV === 'production';
  const uploadBase = isProduction ? 'http://127.0.0.1:10012' : 'http://localhost:4000';
  const uploadUrl = new URL('/api/upload', uploadBase);
  console.log(
    `上传到OSS: ${uploadUrl.href}, filename: ${filename}, folder: ${folder}`
  );

  // 使用 FormData 上传文件
  const formData = new FormData();
  const file = new File([new Uint8Array(buffer)], filename, { type: contentType });
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || '上传到OSS失败');
  }

  const data = await response.json();
  return data.url;
}

// GET /api/ai/video-task-status/{promptId} - 查询视频任务状态并上传到OSS
export async function GET(
  _request: NextRequest,
  { params }: { params: { promptId: string } }
) {
  try {
    const { promptId } = params;

    if (!AI_VIDEO_API_BASE_URL) {
      throw new Error('AI_VIDEO_API_BASE_URL 未配置');
    }

    const apiUrl = `${AI_VIDEO_API_BASE_URL}/history/${promptId}`;
    console.log(`[video-task-status] 查询任务状态: ${apiUrl}`);
    console.log(`[video-task-status] promptId: ${promptId}`);

    const response = await fetch(apiUrl, {
      method: 'GET'
    });

    console.log(
      `[video-task-status] 响应状态: ${response.status} ${response.statusText}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[video-task-status] 响应失败:`, errorText);
      throw new Error(
        `查询任务状态失败: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    // console.log(
    //   `[video-task-status] AI API 返回数据:`,
    //   JSON.stringify(data, null, 2)
    // );

    // 兼容两种返回格式：
    // 1) { "promptId": { ... } }
    // 2) { "status": { ... }, "outputs": { ... } }
    let taskData: any = data[promptId] || data;

    // console.log(`[video-task-status] taskData:`, taskData);

    // 如果 taskData 不存在，说明任务还在处理中，返回 pending 状态
    if (!taskData || Object.keys(taskData).length === 0) {
      console.log(
        `[video-task-status] 任务还在处理中，promptId: ${promptId}, data keys:`,
        Object.keys(data)
      );
      return NextResponse.json({
        success: true,
        status: 'pending'
      });
    }

    const taskStatus = taskData.status;
    console.log(`[video-task-status] 任务状态:`, taskStatus);

    if (!taskStatus) {
      throw new Error('任务状态不存在');
    }

    if (taskStatus.status_str === 'success') {
      console.log(
        `[video-task-status] 任务 ${promptId} 完成，准备上传到OSS`
      );

      // 优先提取视频，其次图片
      let fileInfo = extractVideoInfo(taskData);
      let folder = 'ai-generated-videos';
      let contentType = 'video/mp4';

      if (!fileInfo) {
        fileInfo = extractImageInfo(taskData);
        folder = 'ai-generated-images';
        contentType = 'image/png';
      }

      console.log(`[video-task-status] fileInfo:`, fileInfo);

      if (!fileInfo) {
        throw new Error('未找到生成的文件');
      }

      const buffer = await downloadFile(
        fileInfo.filename,
        fileInfo.subfolder,
        fileInfo.type
      );

      const ossUrl = await uploadToOSS(
        buffer,
        fileInfo.filename,
        folder,
        contentType
      );

      console.log(
        `[video-task-status] 任务 ${promptId} 上传到OSS成功: ${ossUrl}`
      );

      return NextResponse.json({
        success: true,
        status: 'completed',
        url: ossUrl,
        filename: fileInfo.filename
      });
    } else if (taskStatus.status_str === 'error') {
      throw new Error('任务执行失败');
    }

    return NextResponse.json({
      success: true,
      status: 'pending'
    });
  } catch (error) {
    console.error('[video-task-status] 查询任务状态失败:', error);
    return NextResponse.json(
      {
        error: '查询任务状态失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

