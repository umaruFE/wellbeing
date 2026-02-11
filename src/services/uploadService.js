// File Upload Service for Frontend
// Handles file uploads to the backend API which uploads to Aliyun OSS

// 使用相对路径，Vite 代理会将 /api/* 请求转发到 http://localhost:3000/api/*
const API_BASE_URL = '';

class UploadService {
  /**
   * Upload a file to the server (which will upload to OSS)
   * @param {File} file - The file to upload
   * @param {string} folder - The folder name in OSS
   * @returns {Promise<{success: boolean, url?: string, error?: string}>}
   */
  async uploadFile(file, folder) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    try {
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || '上传失败'
        };
      }

      return {
        success: true,
        url: data.url
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: '网络错误，上传失败'
      };
    }
  }

  /**
   * Get a signed URL for an existing file
   * @param {string} filePath - The file path stored in the database
   * @param {number} expires - Expiration time in seconds (default 3600)
   * @returns {Promise<string|null>}
   */
  async getSignedUrl(filePath, expires = 3600) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/upload?path=${encodeURIComponent(filePath)}&expires=${expires}`
      );

      const data = await response.json();

      if (response.ok) {
        return data.url;
      }

      console.error('Failed to get signed URL:', data.error);
      return null;
    } catch (error) {
      console.error('Get signed URL error:', error);
      return null;
    }
  }

  /**
   * Upload PPT image
   * @param {File} file - The image file
   * @param {string} name - Image name
   * @param {string[]} tags - Tags (comma separated)
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async uploadPptImage(file, name, tags = []) {
    // First upload the file
    const uploadResult = await this.uploadFile(file, 'ppt-images');

    if (!uploadResult.success || !uploadResult.url) {
      return {
        success: false,
        error: uploadResult.error
      };
    }

    // Then create the database record
    try {
      const response = await fetch(`${API_BASE_URL}/api/ppt-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          imageUrl: uploadResult.url,
          tags
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || '保存失败'
        };
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Create PPT image error:', error);
      return {
        success: false,
        error: '网络错误，保存失败'
      };
    }
  }

  /**
   * Upload IP character image
   * @param {File} file - The image file
   * @param {string} name - Character name
   * @param {string} gender - Gender
   * @param {string} style - Style
   * @param {string} description - Description
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async uploadIpCharacter(file, name, gender, style, description) {
    // First upload the file
    const uploadResult = await this.uploadFile(file, 'ip-characters');

    if (!uploadResult.success || !uploadResult.url) {
      return {
        success: false,
        error: uploadResult.error
      };
    }

    // Then create the database record
    try {
      const response = await fetch(`${API_BASE_URL}/api/ip-characters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          gender,
          style,
          description,
          imageUrl: uploadResult.url
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || '保存失败'
        };
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Create IP character error:', error);
      return {
        success: false,
        error: '网络错误，保存失败'
      };
    }
  }

  /**
   * Upload textbook image
   * @param {File} file - The image file
   * @param {string} unitId - The textbook unit ID
   * @param {number} pageNumber - Page number
   * @param {string} description - Description
   * @returns {Promise<{success: boolean, data?: any, error?: string}>}
   */
  async uploadTextbookImage(file, unitId, pageNumber, description) {
    // First upload the file
    const uploadResult = await this.uploadFile(file, 'textbooks');

    if (!uploadResult.success || !uploadResult.url) {
      return {
        success: false,
        error: uploadResult.error
      };
    }

    // Then create the database record
    try {
      const response = await fetch(`${API_BASE_URL}/api/textbooks/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unitId,
          imageUrl: uploadResult.url,
          pageNumber,
          description
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || '保存失败'
        };
      }

      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Create textbook image error:', error);
      return {
        success: false,
        error: '网络错误，保存失败'
      };
    }
  }

  /**
   * Validate file before upload
   * @param {File} file - The file to validate
   * @param {string[]} allowedTypes - Array of allowed MIME types
   * @param {number} maxSizeInMB - Maximum file size in MB
   * @returns {{valid: boolean, error?: string}}
   */
  validateFile(file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'], maxSizeInMB = 10) {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `不支持的文件类型。允许的类型: ${allowedTypes.join(', ')}`
      };
    }

    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return {
        valid: false,
        error: `文件大小不能超过 ${maxSizeInMB}MB`
      };
    }

    return { valid: true };
  }
}

export const uploadService = new UploadService();
export default uploadService;
