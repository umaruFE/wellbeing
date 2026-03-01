import { NextRequest, NextResponse } from 'next/server';

const AI_API_BASE_URL = process.env.AI_API_BASE_URL;

// 禁用缓存以避免大文件下载时的警告
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// 提取图片信息
function extractImageInfo(taskData: any) {
  if (!taskData || !taskData.outputs) {
    return null;
  }

  const outputs = taskData.outputs;
  const saveImageNode = Object.values(outputs).find((node: any) => node.images && node.images.length > 0);

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

// 提取音频信息
function extractAudioInfo(taskData: any) {
  if (!taskData || !taskData.outputs) {
    return null;
  }

  const outputs = taskData.outputs;
  const saveAudioNode = Object.values(outputs).find((node: any) => node.audio && node.audio.length > 0);

  if (!saveAudioNode) {
    return null;
  }

  const audioInfo = (saveAudioNode as any).audio[0];
  return {
    filename: audioInfo.filename,
    subfolder: audioInfo.subfolder || '',
    type: audioInfo.type || 'output'
  };
}

// 下载文件
async function downloadFile(filename: string, subfolder: string, type: string): Promise<Buffer> {
  const params = new URLSearchParams({
    filename,
    subfolder,
    type
  });

  const response = await fetch(`${AI_API_BASE_URL}/view?${params.toString()}`, {
    method: 'GET'
  });

  if (!response.ok) {
    throw new Error(`下载文件失败: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// 上传到OSS
async function uploadToOSS(buffer: Buffer, filename: string, folder: string, contentType: string): Promise<string> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  console.log(`上传到OSS: ${apiUrl}/upload, filename: ${filename}, folder: ${folder}`);

  // 使用 FormData 上传文件
  const formData = new FormData();
  const file = new File([buffer], filename, { type: contentType });
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await fetch(`${apiUrl}/upload`, {
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

// GET /api/ai/task-status/{promptId} - 查询任务状态并上传到OSS
export async function GET(
  request: NextRequest,
  { params }: { params: { promptId: string } }
) {
  try {
    const { promptId } = params;

    const apiUrl = `${AI_API_BASE_URL}/history/${promptId}`;
    console.log(`查询任务状态: ${apiUrl}`);
    console.log(`promptId: ${promptId}`);

    const response = await fetch(apiUrl, {
      method: 'GET'
    });

    console.log(`响应状态: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`响应失败:`, errorText);
      throw new Error(`查询任务状态失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`AI API 返回数据:`, JSON.stringify(data, null, 2));

    // AI API 返回格式: { "promptId": { ... } }
    // 需要使用 promptId 作为 key 来获取任务数据
    const taskData = data[promptId];

    console.log(`taskData:`, taskData);

    // 如果 taskData 不存在，说明任务还在处理中，返回 pending 状态
    if (!taskData) {
      console.log(`任务还在处理中，promptId: ${promptId}, data keys:`, Object.keys(data));
      return NextResponse.json({
        success: true,
        status: 'pending'
      });
    }

    // AI API 返回的 status 格式是 { status_str: string, completed: boolean, ... }
    const taskStatus = taskData.status;
    console.log(`任务状态:`, taskStatus);

    if (!taskStatus) {
      throw new Error('任务状态不存在');
    }

    if (taskStatus.status_str === 'success') {
      console.log(`任务 ${promptId} 完成，准备上传到OSS`);

      // 先尝试提取图片
      let fileInfo = extractImageInfo(taskData);
      let folder = 'ai-generated-images';
      let contentType = 'image/png';

      // 如果没有图片，尝试提取音频
      if (!fileInfo) {
        fileInfo = extractAudioInfo(taskData);
        folder = 'ai-generated-audio';
        contentType = 'audio/flac';
      }

      console.log(`fileInfo:`, fileInfo);

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

      console.log(`任务 ${promptId} 上传到OSS成功: ${ossUrl}`);

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
    console.error('查询任务状态失败:', error);
    return NextResponse.json(
      {
        error: '查询任务状态失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
