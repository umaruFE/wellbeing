import OSS from 'ali-oss';

let client: OSS | null = null;

export const getOssClient = () => {
  if (client) return client;

  const region = process.env.ALIYUN_OSS_REGION || 'oss-cn-beijing';
  const bucket = process.env.ALIYUN_OSS_BUCKET || 'wellbeing1';
  const accessKeyId = process.env.ALIYUN_OSS_ACCESS_KEY_ID || '';
  const accessKeySecret = process.env.ALIYUN_OSS_ACCESS_KEY_SECRET || '';

  client = new OSS({
    region,
    bucket,
    accessKeyId,
    accessKeySecret,
    // 私有文件需要签名访问
    timeout: 60000,
  });

  return client;
};

/**
 * 生成带签名的文件访问URL
 * @param filePath OSS上的文件路径
 * @param expires 过期时间（秒），默认3600秒
 */
export const getSignedUrl = (filePath: string, expires: number = 3600): string => {
  const client = getOssClient();
  return client.signatureUrl(filePath, {
    expires,
  });
};

/**
 * 生成不带签名的文件路径（用于存储到数据库）
 * @param folder 文件夹名称
 * @param filename 文件名
 */
export const generateFilePath = (folder: string, filename: string): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // 保持文件扩展名
  const ext = filename.split('.').pop() || '';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

  return `${folder}/${year}/${month}/${day}/${uniqueName}`;
};

/**
 * 上传文件到 OSS
 * @param file 文件对象或 ArrayBuffer
 * @param folder 文件夹名称
 * @param filename 原始文件名
 */
export const uploadToOss = async (
  file: File | ArrayBuffer,
  folder: string,
  filename: string
): Promise<string> => {
  const client = getOssClient();
  const filePath = generateFilePath(folder, filename);

  let result;

  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    result = await client.put(filePath, new Uint8Array(arrayBuffer));
  } else {
    result = await client.put(filePath, file);
  }

  // 返回签名URL（私有文件需要签名）
  return getSignedUrl(filePath, 86400 * 7); // 7天有效期
};

/**
 * 从 OSS 删除文件
 * @param filePath 文件路径
 */
export const deleteFromOss = async (filePath: string): Promise<void> => {
  const client = getOssClient();
  await client.delete(filePath);
};

/**
 * 生成直接访问的URL（需要在服务器端生成签名）
 * @param filePath OSS上的文件路径
 */
export const getAccessUrl = (filePath: string): string => {
  const endpoint = process.env.ALIYUN_OSS_ENDPOINT || 'wellbeing1.oss-cn-beijing.aliyuncs.com';
  return `https://${endpoint}/${filePath}`;
};

