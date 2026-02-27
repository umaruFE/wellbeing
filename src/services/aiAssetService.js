// AI素材生成服务（图片、音频、视频）
const AI_API_BASE_URL = 'https://8afbu10k60e64svm-8188.container.x-gpu.com';

export const aiAssetService = {
  // 生成图片
  generateImage: async (prompt, options = {}) => {
    const { width = 1104, height = 1472, seed = Date.now() } = options;
    
    const workflow = {
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

    try {
      const response = await fetch(`${AI_API_BASE_URL}/prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(workflow)
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { promptId: data.prompt_id, number: data.number };
    } catch (error) {
      console.error('生成图片失败:', error);
      throw error;
    }
  },

  // 查询任务状态
  getTaskStatus: async (promptId) => {
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
      return data;
    } catch (error) {
      console.error('查询任务状态失败:', error);
      throw error;
    }
  },

  // 获取生成的素材
  getGeneratedAsset: async (filename, subfolder = '', type = 'output') => {
    try {
      const params = new URLSearchParams({
        filename,
        subfolder,
        type
      });

      const response = await fetch(`${AI_API_BASE_URL}/view?${params.toString()}`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`获取素材失败: ${response.status} ${response.statusText}`);
      }

      return response.blob();
    } catch (error) {
      console.error('获取素材失败:', error);
      throw error;
    }
  },

  // 上传图片（图生图）
  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${AI_API_BASE_URL}/upload/image`, {
        method: 'GET',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`上传图片失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('上传图片失败:', error);
      throw error;
    }
  },

  // 轮询任务状态直到完成
  pollTaskStatus: async (promptId, maxAttempts = 60, interval = 2000) => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const statusData = await aiAssetService.getTaskStatus(promptId);
        const taskData = Object.values(statusData)[0];
        
        if (taskData && taskData.outputs) {
          const outputs = taskData.outputs;
          const images = outputs['14']?.images || [];
          
          if (images.length > 0) {
            const filename = images[0].filename;
            const url = `${AI_API_BASE_URL}/view?filename=${filename}&subfolder=&type=output`;
            return { filename, url, completed: true };
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        console.error(`轮询任务状态失败 (尝试 ${attempt + 1}/${maxAttempts}):`, error);
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    throw new Error('任务超时，请稍后重试');
  },

  // 完整的图片生成流程（提交任务 + 轮询结果）
  generateImageWithPolling: async (prompt, options = {}, onProgress) => {
    try {
      onProgress?.(10, '正在提交生成任务...');
      
      const { promptId } = await aiAssetService.generateImage(prompt, options);
      
      onProgress?.(30, '任务已提交，正在生成中...');
      
      const result = await aiAssetService.pollTaskStatus(
        promptId,
        options.maxAttempts || 60,
        options.interval || 2000
      );
      
      onProgress?.(100, '生成完成！');
      
      return result;
    } catch (error) {
      console.error('生成图片失败:', error);
      throw error;
    }
  }
};

export default aiAssetService;