import { NextRequest, NextResponse } from 'next/server';

const AI_API_BASE_URL = process.env.AI_API_BASE_URL || 'http://localhost:8188';

// 提取图片信息
function extractImageInfo(taskData: any) {
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
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  console.log(`上传到OSS: ${apiUrl}/upload, filename: ${filename}, folder: ${folder}`);
  
  // 使用 FormData 上传文件
  const formData = new FormData();
  const file = new File([buffer], filename, { type: 'image/png' });
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
      
      const imageInfo = extractImageInfo(taskData);
      console.log(`imageInfo:`, imageInfo);
      
      if (!imageInfo) {
        throw new Error('未找到生成的图片');
      }

      const buffer = await downloadImage(
        imageInfo.filename,
        imageInfo.subfolder,
        imageInfo.type
      );

      const ossUrl = await uploadToOSS(
        buffer,
        imageInfo.filename,
        'ai-generated-images'
      );

      console.log(`任务 ${promptId} 上传到OSS成功: ${ossUrl}`);

      return NextResponse.json({
        success: true,
        status: 'completed',
        url: ossUrl,
        filename: imageInfo.filename
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