import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

/**
 * 将上传的文件保存到本地 public/uploads 目录
 * 后续可替换为上传到 OSS
 * @param file 文件对象
 * @param folder 子目录，如 'ppt-images' | 'textbooks'
 * @returns 可访问的 URL，如 /uploads/ppt-images/2024/01/xxx.jpg
 */
export async function saveToLocal(
  file: File,
  folder: string
): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const ext = file.name.split('.').pop() || 'jpg';
  const uniqueName = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  const relativePath = `${folder}/${year}/${month}/${day}/${uniqueName}`;
  const baseDir = path.join(process.cwd(), 'public', 'uploads', folder, String(year), month, day);

  await fs.mkdir(baseDir, { recursive: true });

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filePath = path.join(baseDir, uniqueName);
  await fs.writeFile(filePath, buffer);

  return `/uploads/${relativePath}`;
}
