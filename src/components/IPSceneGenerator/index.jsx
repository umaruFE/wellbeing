import React, { useState } from 'react';
import { Wand2, Download, RotateCcw, Loader2, Edit2, X, Check } from 'lucide-react';
import RoleSelection from './RoleSelection';
import CanvasEditor from './CanvasEditor';
import {
  getImageContentBounds,
  getEditorSceneLayout,
  getNormalizedRoleDrawSize
} from './roleImageLayout';

const ASPECT_RATIOS = [
  { id: '16:9', label: '16:9', width: 1920, height: 1080, description: '横屏宽屏' },
  { id: '4:3', label: '4:3', width: 1024, height: 768, description: '标准横屏' },
  { id: '1:1', label: '1:1', width: 1024, height: 1024, description: '正方形' },
  { id: '3:4', label: '3:4', width: 768, height: 1024, description: '标准竖屏' },
  { id: '9:16', label: '9:16', width: 1080, height: 1920, description: '竖屏长图' },
];

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const IPSceneGenerator = ({ isOpen, onClose, userId, organizationId }) => {
  const [state, setState] = useState({
    selectedRoles: [],
    aspectRatio: ASPECT_RATIOS[0],
    prompt: '',
    isGenerating: false,
    generatedAssets: {
      background: null,
      roles: {}
    },
    prompts: {
      background: '',
      roles: {}
    },
    editingPrompts: {
      background: false,
      roles: {}
    },
    canvasState: {
      roles: {}
    },
    isCompositing: false,
    compositeResult: null,
    compositeMethod: 'canvas',
    isLoadingBackground: false,
    loadingRoles: {}
  });

  const handleRoleSelect = (roles) => {
    setState(prev => ({ ...prev, selectedRoles: roles }));
  };

  const handleRatioSelect = (ratio) => {
    setState(prev => ({ ...prev, aspectRatio: ratio }));
  };

  const handlePromptChange = (prompt) => {
    setState(prev => ({ ...prev, prompt }));
  };

  const handleGenerate = async () => {
    if (!state.prompt.trim()) {
      alert('请输入场景描述提示词');
      return;
    }

    if (state.selectedRoles.length === 0) {
      alert('请至少选择一个角色');
      return;
    }

    const EDITOR_W = 700;
    const EDITOR_H = 500;
    const layout = getEditorSceneLayout(EDITOR_W, EDITOR_H, state.aspectRatio);
    const placeholderBounds = { x: 0, y: 0, w: 1024, h: 1024 };
    const { dw: estW, dh: estH } = getNormalizedRoleDrawSize(
      placeholderBounds,
      layout.sceneW,
      layout.sceneH,
      1
    );

    const calculateRolePosition = (index, total) => {
      let x, y;
      if (total <= 3) {
        const stepX = layout.sceneW / (total + 1);
        x = layout.offsetX + stepX * (index + 1) - estW / 2;
        y = layout.offsetY + layout.sceneH / 2 - estH / 2;
      } else {
        const cols = Math.ceil(Math.sqrt(total));
        const rows = Math.ceil(total / cols);
        const col = index % cols;
        const row = Math.floor(index / cols);
        x = layout.offsetX + (layout.sceneW / cols) * (col + 0.5) - estW / 2;
        y = layout.offsetY + (layout.sceneH / rows) * (row + 0.5) - estH / 2;
      }
      return { x, y, scale: 1, rotation: 0 };
    };

    const initialRolePositions = state.selectedRoles.reduce((acc, roleName, index) => {
      acc[roleName] = calculateRolePosition(index, state.selectedRoles.length);
      return acc;
    }, {});

    setState(prev => ({ 
      ...prev, 
      isGenerating: true,
      isLoadingBackground: true,
      loadingRoles: state.selectedRoles.reduce((acc, name) => ({ ...acc, [name]: true }), {}),
      generatedAssets: {
        background: null,
        roles: {}
      },
      canvasState: {
        roles: initialRolePositions
      }
    }));

    try {
      console.log('开始提取关键词...');
      
      // 1. 调用 extract-keywords 获取场景和角色的优化提示词
      const extractResponse = await fetch('/api/ai/extract-keywords', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prompt: state.prompt,
          selectedRoles: state.selectedRoles
        })
      });

      if (!extractResponse.ok) {
        throw new Error('提取关键词失败');
      }

      const extractData = await extractResponse.json();
      console.log('提取的关键词:', extractData);

      // 检查 N8N 是否返回了错误
      if (extractData.error) {
        throw new Error(`提取关键词失败: ${extractData.error}`);
      }

      const { background: backgroundPrompt, roles: rolePrompts } = extractData.data || {};

      if (!backgroundPrompt) {
        throw new Error('关键词提取结果为空');
      }

      // 2. 构建角色数据
      const characterColors = {
        poppy: '粉色',
        edi: '蓝色',
        rolly: '橘色',
        milo: '黄色',
        ace: '紫色'
      };

      const roles = state.selectedRoles.map(name => ({
        name,
        prompt: rolePrompts?.[name] || `${characterColors[name] || ''}的${name}角色，${state.prompt}`
      }));

      // 3. 使用 generate-scene API，并行生成背景和角色图
      console.log('调用 generate-scene API，并行生成...');
      const sceneResponse = await fetch('/api/ai/generate-scene', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          backgroundPrompt,
          backgroundWidth: state.aspectRatio.width,
          backgroundHeight: state.aspectRatio.height,
          roles,
          user_id: userId,
          organization_id: organizationId
        })
      });

      if (!sceneResponse.ok) {
        const errorText = await sceneResponse.text();
        throw new Error(`生成场景失败: ${errorText}`);
      }

      const sceneData = await sceneResponse.json();
      console.log('generate-scene 返回:', sceneData);

      if (!sceneData.success) {
        throw new Error(sceneData.error || '生成场景失败');
      }

      // 解析任务结果
      const backgroundTask = sceneData.tasks.find(t => t.type === 'background');
      const characterTasks = sceneData.tasks.filter(t => t.type === 'character');

      const backgroundTaskId = backgroundTask?.promptId;
      const backgroundApiUrl = backgroundTask?.apiUrl;

      const roleTasks = characterTasks.map(t => ({
        name: t.name,
        taskId: t.promptId,
        apiUrl: t.apiUrl
      }));

      const pollTask = async (taskId, apiUrl, maxAttempts = 240, interval = 3000) => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            const response = await fetch(`/api/ai/task-status/${taskId}?useComfyUI=true&apiUrl=${encodeURIComponent(apiUrl || '')}`, {
              headers: getAuthHeaders()
            });
            const data = await response.json();

            if (data.status === 'completed') {
              return data.url;
            } else if (data.status === 'error') {
              throw new Error('任务执行失败: ' + (data.error || '未知错误'));
            }
          } catch (error) {
            console.warn(`轮询任务状态失败 (尝试 ${attempt + 1}/${maxAttempts}):`, error);
            // 网络错误，继续轮询
          }

          await new Promise(resolve => setTimeout(resolve, interval));
        }
        throw new Error('任务超时');
      };

      const removeWhiteBackground = async (roleName, roleUrl, maxRetries = 3) => {
        console.log(`对角色 ${roleName} 进行白色背景去除处理...`);
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          try {
            // 设置45秒超时
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
              console.warn(`角色 ${roleName} 去背景请求超时，中止请求`);
              controller.abort();
            }, 45000);

            const removeBgResponse = await fetch('/api/ai/remove-white-background', {
              method: 'POST',
              headers: getAuthHeaders(),
              signal: controller.signal,
              body: JSON.stringify({
                imageUrl: roleUrl,
                threshold: 240
              })
            });

            clearTimeout(timeoutId);

            if (removeBgResponse.ok) {
              const removeBgData = await removeBgResponse.json();
              console.log(`角色 ${roleName} 白色背景去除完成:`, removeBgData.url);
              return removeBgData.url;
            } else if (removeBgResponse.status === 429) {
              // 服务器忙，等待后重试
              console.warn(`角色 ${roleName} 去背景请求过多(429)，等待 ${attempt + 1} 秒后重试...`);
              await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
              continue;
            } else {
              console.warn(`角色 ${roleName} 去背景失败(${removeBgResponse.status})，使用原图`);
              return roleUrl;
            }
          } catch (error) {
            if (error.name === 'AbortError') {
              console.warn(`角色 ${roleName} 去背景请求超时，使用原图`);
              return roleUrl;
            }
            if (attempt < maxRetries) {
              console.warn(`角色 ${roleName} 去背景出错，等待 ${attempt + 1} 秒后重试...`);
              await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
              continue;
            }
            console.warn(`角色 ${roleName} 去背景出错，使用原图:`, error);
            return roleUrl;
          }
        }
        console.warn(`角色 ${roleName} 去背景重试次数耗尽，使用原图`);
        return roleUrl;
      };

      const backgroundPromise = pollTask(backgroundTaskId, backgroundApiUrl).then(url => {
        console.log('背景图生成完成:', url);
        setState(prev => ({
          ...prev,
          isLoadingBackground: false,
          generatedAssets: {
            ...prev.generatedAssets,
            background: url
          },
          prompts: {
            ...prev.prompts,
            background: backgroundPrompt
          }
        }));
        return url;
      });

      const rolePromises = roleTasks.map((roleTask, index) => {
        console.log(`开始处理角色: ${roleTask.name}, taskId: ${roleTask.taskId}`);
        return pollTask(roleTask.taskId, roleTask.apiUrl)
          .then(url => {
            console.log(`角色 ${roleTask.name} 轮询完成，URL:`, url);
            return removeWhiteBackground(roleTask.name, url);
          })
          .then(url => {
            console.log(`角色 ${roleTask.name} 生成完成:`, url);
            // 从之前构建的 roles 数组中获取提示词
            const roleData = roles.find(r => r.name === roleTask.name);
            const rolePrompt = roleData?.prompt || state.prompt;

            setState(prev => ({
              ...prev,
              loadingRoles: {
                ...prev.loadingRoles,
                [roleTask.name]: false
              },
              generatedAssets: {
                ...prev.generatedAssets,
                roles: {
                  ...prev.generatedAssets.roles,
                  [roleTask.name]: url
                }
              },
              prompts: {
                ...prev.prompts,
                roles: {
                  ...prev.prompts.roles,
                  [roleTask.name]: rolePrompt
                }
              }
            }));
            return { name: roleTask.name, url };
          })
          .catch(error => {
            console.error(`角色 ${roleTask.name} 处理失败:`, error);
            // 即使失败也要返回一个值，避免阻塞其他任务
            return { name: roleTask.name, url: null, error: error.message };
          });
      });

      await Promise.all([backgroundPromise, ...rolePromises]);

      console.log('所有图片生成完成');
      setState(prev => ({ ...prev, isGenerating: false }));

    } catch (error) {
      console.error('生成失败:', error);
      alert(`生成失败: ${error.message}`);
      setState(prev => ({ 
        ...prev, 
        isGenerating: false,
        isLoadingBackground: false,
        loadingRoles: {}
      }));
    }
  };

  const handleRolePositionChange = (roleName, position) => {
    setState(prev => ({
      ...prev,
      canvasState: {
        ...prev.canvasState,
        roles: {
          ...prev.canvasState.roles,
          [roleName]: position
        }
      }
    }));
  };

  // 快速加载图片（直接使用URL，设置crossOrigin）
  const loadImageFast = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(new Error('图片加载失败'));
      img.src = url;
    });
  };

  const handleCanvasComposite = async () => {
    setState(prev => ({ ...prev, isCompositing: true }));

    try {
      console.log('开始Canvas合成...');
      
      const canvas = document.createElement('canvas');
      canvas.width = state.aspectRatio.width;
      canvas.height = state.aspectRatio.height;
      const ctx = canvas.getContext('2d');

      // 并行加载所有图片
      console.log('并行加载所有图片...');
      const loadPromises = [];
      
      // 加载背景图
      loadPromises.push(
        loadImageFast(state.generatedAssets.background).then(img => {
          console.log('背景图加载成功');
          return { type: 'background', img };
        })
      );

      // 加载角色图
      for (const roleName of state.selectedRoles) {
        const roleUrl = state.generatedAssets.roles[roleName];
        if (roleUrl) {
          loadPromises.push(
            loadImageFast(roleUrl).then(img => {
              console.log(`角色 ${roleName} 加载成功`);
              return { type: 'role', name: roleName, img };
            }).catch(err => {
              console.warn(`角色 ${roleName} 加载失败:`, err);
              return null;
            })
          );
        }
      }

      const loadedImages = await Promise.all(loadPromises);
      const backgroundImg = loadedImages.find(item => item?.type === 'background')?.img;
      const roleImages = {};
      loadedImages.filter(item => item?.type === 'role').forEach(item => {
        roleImages[item.name] = item.img;
      });

      if (!backgroundImg) {
        throw new Error('背景图加载失败');
      }

      // 绘制背景
      ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
      console.log('背景图绘制完成');

      const editorCanvasWidth = 700;
      const editorCanvasHeight = 500;
      const {
        editorScale,
        sceneW,
        sceneH,
        offsetX,
        offsetY
      } = getEditorSceneLayout(editorCanvasWidth, editorCanvasHeight, state.aspectRatio);

      // 绘制角色
      for (const roleName of state.selectedRoles) {
        const roleImg = roleImages[roleName];
        const position = state.canvasState.roles[roleName];

        if (!roleImg || !position) {
          console.warn(`跳过角色 ${roleName}: 缺少图片或位置信息`);
          continue;
        }

        const bounds = getImageContentBounds(roleImg);
        const { dw, dh } = getNormalizedRoleDrawSize(
          bounds,
          sceneW,
          sceneH,
          position.scale || 1
        );

        const actualX = (position.x - offsetX) / editorScale;
        const actualY = (position.y - offsetY) / editorScale;
        const actualWidth = dw / editorScale;
        const actualHeight = dh / editorScale;

        console.log(`绘制角色 ${roleName}:`, {
          actualX,
          actualY,
          actualWidth,
          actualHeight,
          bounds
        });

        ctx.save();
        ctx.translate(actualX + actualWidth / 2, actualY + actualHeight / 2);
        ctx.rotate((position.rotation || 0) * Math.PI / 180);
        // 应用镜像
        ctx.scale(
          position.flipX ? -1 : 1,
          position.flipY ? -1 : 1
        );
        ctx.drawImage(
          roleImg,
          bounds.x,
          bounds.y,
          bounds.w,
          bounds.h,
          -actualWidth / 2,
          -actualHeight / 2,
          actualWidth,
          actualHeight
        );
        ctx.restore();
      }

      console.log('Canvas合成完成');
      const compositeDataUrl = canvas.toDataURL('image/png');

      setState(prev => ({
        ...prev,
        isCompositing: false,
        compositeResult: compositeDataUrl
      }));

    } catch (error) {
      console.error('Canvas合成失败:', error);
      alert(`Canvas合成失败: ${error.message}`);
      setState(prev => ({ ...prev, isCompositing: false }));
    }
  };

  const handleAIComposite = async () => {
    setState(prev => ({ ...prev, isCompositing: true }));

    try {
      const editorCanvasWidth = 700;
      const editorCanvasHeight = 500;
      
      const editorScale = Math.min(
        editorCanvasWidth / state.aspectRatio.width,
        editorCanvasHeight / state.aspectRatio.height
      );
      const offsetX = (editorCanvasWidth - state.aspectRatio.width * editorScale) / 2;
      const offsetY = (editorCanvasHeight - state.aspectRatio.height * editorScale) / 2;

      const rolesData = state.selectedRoles.map(roleName => {
        const position = state.canvasState.roles[roleName];
        const roleScale = 0.3 * (position.scale || 1);
        
        const actualX = (position.x - offsetX) / editorScale;
        const actualY = (position.y - offsetY) / editorScale;
        
        return {
          name: roleName,
          url: state.generatedAssets.roles[roleName],
          x: actualX,
          y: actualY,
          scale: roleScale / editorScale,
          rotation: position.rotation || 0,
          flipX: position.flipX || false,
          flipY: position.flipY || false
        };
      });

      const response = await fetch('/api/ai/generate-images', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prompt: state.prompt,
          workflow_type: 'composite',
          reference_image: state.generatedAssets.background,
          roles: rolesData,
          width: state.aspectRatio.width,
          height: state.aspectRatio.height,
          count: 1,
          user_id: userId,
          organization_id: organizationId
        })
      });

      if (!response.ok) {
        throw new Error('合成图片失败');
      }

      const data = await response.json();
      const compositeTaskId = data.tasks[0].promptId;
      const compositeApiUrl = data.tasks[0].apiUrl;

      const pollTask = async (taskId, apiUrl, maxAttempts = 120, interval = 3000) => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            const response = await fetch(`/api/ai/task-status/${taskId}?useComfyUI=true&apiUrl=${encodeURIComponent(apiUrl)}`, {
              headers: getAuthHeaders()
            });
            const data = await response.json();

            if (data.status === 'completed') {
              return data.url;
            } else if (data.status === 'error') {
              throw new Error('任务执行失败');
            }
          } catch (error) {
            console.warn(`轮询任务状态失败 (尝试 ${attempt + 1}/${maxAttempts}):`, error);
            // 网络错误，继续轮询
          }

          await new Promise(resolve => setTimeout(resolve, interval));
        }
        throw new Error('任务超时');
      };

      const compositeUrl = await pollTask(compositeTaskId, compositeApiUrl);

      setState(prev => ({
        ...prev,
        isCompositing: false,
        compositeResult: compositeUrl
      }));

    } catch (error) {
      console.error('AI合成失败:', error);
      alert(`AI合成失败: ${error.message}`);
      setState(prev => ({ ...prev, isCompositing: false }));
    }
  };

  const handleComposite = async () => {
    if (state.compositeMethod === 'canvas') {
      await handleCanvasComposite();
    } else {
      await handleAIComposite();
    }
  };

  const handleReset = () => {
    setState({
      selectedRoles: [],
      aspectRatio: ASPECT_RATIOS[0],
      prompt: '',
      isGenerating: false,
      generatedAssets: {
        background: null,
        roles: {}
      },
      canvasState: {
        roles: {}
      },
      isCompositing: false,
      compositeResult: null,
      isLoadingBackground: false,
      loadingRoles: {}
    });
  };

  const handleRegenerateBackground = async () => {
    if (!state.prompts.background) return;
    
    setState(prev => ({ ...prev, isLoadingBackground: true }));
    
    try {
      const response = await fetch('/api/ai/generate-images', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prompt: state.prompts.background,
          count: 1,
          width: state.aspectRatio.width,
          height: state.aspectRatio.height,
          workflow_type: 'background',
          user_id: userId,
          organization_id: organizationId
        })
      });

      if (!response.ok) throw new Error('生成背景图失败');

      const data = await response.json();
      const taskId = data.tasks[0].promptId;
      const apiUrl = data.tasks[0].apiUrl;

      const pollTask = async (taskId, apiUrl, maxAttempts = 120, interval = 3000) => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            const response = await fetch(`/api/ai/task-status/${taskId}?useComfyUI=true&apiUrl=${encodeURIComponent(apiUrl)}`, {
              headers: getAuthHeaders()
            });
            const data = await response.json();

            if (data.status === 'completed') {
              return data.url;
            } else if (data.status === 'error') {
              throw new Error('任务执行失败');
            }
          } catch (error) {
            console.warn(`轮询任务状态失败 (尝试 ${attempt + 1}/${maxAttempts}):`, error);
            // 网络错误，继续轮询
          }

          await new Promise(resolve => setTimeout(resolve, interval));
        }
        throw new Error('任务超时');
      };

      const url = await pollTask(taskId, apiUrl);
      
      setState(prev => ({
        ...prev,
        isLoadingBackground: false,
        generatedAssets: {
          ...prev.generatedAssets,
          background: url
        }
      }));
    } catch (error) {
      console.error('重新生成背景失败:', error);
      alert(`重新生成背景失败: ${error.message}`);
      setState(prev => ({ ...prev, isLoadingBackground: false }));
    }
  };

  const handleRegenerateRole = async (roleName) => {
    const rolePrompt = state.prompts.roles[roleName];
    if (!rolePrompt) return;
    
    setState(prev => ({
      ...prev,
      loadingRoles: { ...prev.loadingRoles, [roleName]: true }
    }));
    
    try {
      const response = await fetch('/api/ai/generate-images', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prompt: rolePrompt,
          count: 1,
          width: 1024,
          height: 1024,
          workflow_type: 'ip-character',
          name: roleName,
          user_id: userId,
          organization_id: organizationId
        })
      });

      if (!response.ok) throw new Error(`生成角色 ${roleName} 失败`);

      const data = await response.json();
      const taskId = data.tasks[0].promptId;
      const apiUrl = data.tasks[0].apiUrl;

      const pollTask = async (taskId, apiUrl, maxAttempts = 120, interval = 3000) => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          try {
            const response = await fetch(`/api/ai/task-status/${taskId}?useComfyUI=true&apiUrl=${encodeURIComponent(apiUrl)}`, {
              headers: getAuthHeaders()
            });
            const data = await response.json();

            if (data.status === 'completed') {
              return data.url;
            } else if (data.status === 'error') {
              throw new Error('任务执行失败');
            }
          } catch (error) {
            console.warn(`轮询任务状态失败 (尝试 ${attempt + 1}/${maxAttempts}):`, error);
            // 网络错误，继续轮询
          }

          await new Promise(resolve => setTimeout(resolve, interval));
        }
        throw new Error('任务超时');
      };

      let url = await pollTask(taskId, apiUrl);
      
      // 去除白色背景
      try {
        const removeBgResponse = await fetch('/api/ai/remove-white-background', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ 
            imageUrl: url,
            threshold: 240
          })
        });
        
        if (removeBgResponse.ok) {
          const removeBgData = await removeBgResponse.json();
          url = removeBgData.url;
        }
      } catch (error) {
        console.warn('去背景失败，使用原图:', error);
      }
      
      setState(prev => ({
        ...prev,
        loadingRoles: { ...prev.loadingRoles, [roleName]: false },
        generatedAssets: {
          ...prev.generatedAssets,
          roles: {
            ...prev.generatedAssets.roles,
            [roleName]: url
          }
        }
      }));
    } catch (error) {
      console.error(`重新生成角色 ${roleName} 失败:`, error);
      alert(`重新生成角色 ${roleName} 失败: ${error.message}`);
      setState(prev => ({
        ...prev,
        loadingRoles: { ...prev.loadingRoles, [roleName]: false }
      }));
    }
  };

  const handleDownload = () => {
    if (state.compositeResult) {
      const link = document.createElement('a');
      link.href = state.compositeResult;
      link.download = `ip-scene-${Date.now()}.png`;
      link.click();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-8xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b-2 border-stroke-light flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg text-white">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-primary">IP角色场景生成器</h3>
              <p className="text-xs text-primary-muted">选择角色、设置场景、生成专业IP场景图片</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-primary-placeholder hover:text-primary-secondary"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          <div className="w-80 border-r-2 border-stroke-light p-6 overflow-y-auto">
            <RoleSelection
              selectedRoles={state.selectedRoles}
              onRoleSelect={handleRoleSelect}
            />

            <div className="mt-6">
              <label className="text-sm font-medium text-primary-secondary mb-2 block">图片比例</label>
              <div className="grid grid-cols-2 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => handleRatioSelect(ratio)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
                      state.aspectRatio.id === ratio.id
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-stroke-light hover:border-primary text-dark hover:bg-warning-light'
                    }`}
                  >
                    <div 
                      className="bg-current rounded-sm mb-1"
                      style={{
                        width: ratio.id === '16:9' ? '32px' :
                               ratio.id === '4:3' ? '24px' :
                               ratio.id === '1:1' ? '20px' :
                               ratio.id === '3:4' ? '15px' : '12px',
                        height: ratio.id === '16:9' ? '18px' :
                                ratio.id === '4:3' ? '18px' :
                                ratio.id === '1:1' ? '20px' :
                                ratio.id === '3:4' ? '20px' : '21px'
                      }}
                    />
                    <span className="text-xs font-medium">{ratio.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-primary-placeholder mt-1">
                {state.aspectRatio.description} ({state.aspectRatio.width}×{state.aspectRatio.height})
              </p>
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium text-primary-secondary mb-2 block">场景描述</label>
              <textarea
                value={state.prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                placeholder="描述您想要的场景，例如：美丽的绿色魔法森林，阳光透过树叶..."
                className="w-full border-2 border-stroke-light rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple focus:border-purple-500 outline-none resize-none h-32 transition-all"
                disabled={state.isGenerating}
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={state.isGenerating || !state.prompt.trim() || state.selectedRoles.length === 0}
              className="w-full mt-6 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
            >
              {state.isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  生成资源
                </>
              )}
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 min-h-0 overflow-hidden flex gap-4">
              <div className="flex-1 min-w-0">
                <CanvasEditor
                  background={state.generatedAssets.background}
                  roles={state.generatedAssets.roles}
                  rolePositions={state.canvasState.roles}
                  onRolePositionChange={handleRolePositionChange}
                  aspectRatio={state.aspectRatio}
                  isLoadingBackground={state.isLoadingBackground}
                  loadingRoles={state.loadingRoles}
                />
              </div>
              
              {state.generatedAssets.background && (
                <div className="w-80 flex-shrink-0 bg-surface-alt rounded-lg p-4 overflow-y-auto">
                  <h4 className="text-sm font-medium text-primary-secondary mb-3">提示词管理</h4>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 border border-stroke">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-primary-secondary">背景图</span>
                        <div className="flex gap-1">
                          {state.editingPrompts.background ? (
                            <>
                              <button
                                onClick={() => {
                                  setState(prev => ({
                                    ...prev,
                                    editingPrompts: {
                                      ...prev.editingPrompts,
                                      background: false
                                    }
                                  }));
                                }}
                                className="text-xs p-1 text-success hover:bg-success-light rounded"
                                title="确认"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => {
                                  setState(prev => ({
                                    ...prev,
                                    editingPrompts: {
                                      ...prev.editingPrompts,
                                      background: false
                                    }
                                  }));
                                }}
                                className="text-xs p-1 text-error hover:bg-error-light rounded"
                                title="取消"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setState(prev => ({
                                  ...prev,
                                  editingPrompts: {
                                    ...prev.editingPrompts,
                                    background: true
                                  }
                                }));
                              }}
                              className="text-xs p-1 text-primary-secondary hover:bg-surface-alt rounded"
                              title="编辑"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={handleRegenerateBackground}
                            disabled={state.isLoadingBackground}
                            className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {state.isLoadingBackground ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                生成中
                              </>
                            ) : (
                              '重新生成'
                            )}
                          </button>
                        </div>
                      </div>
                      {state.editingPrompts.background ? (
                        <textarea
                          value={state.prompts.background || ''}
                          onChange={(e) => {
                            setState(prev => ({
                              ...prev,
                              prompts: {
                                ...prev.prompts,
                                background: e.target.value
                              }
                            }));
                          }}
                          className="w-full text-xs text-primary-muted leading-relaxed border border-stroke rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent"
                          rows={4}
                          placeholder="背景提示词"
                          autoFocus
                        />
                      ) : (
                        <p className="text-xs text-primary-muted leading-relaxed">
                          {state.prompts.background || '暂无提示词'}
                        </p>
                      )}
                    </div>
                    
                    {state.selectedRoles.map(roleName => (
                      <div key={roleName} className="bg-white rounded-lg p-3 border border-stroke">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-primary-secondary">{roleName}</span>
                          <div className="flex gap-1">
                            {state.editingPrompts.roles[roleName] ? (
                              <>
                                <button
                                  onClick={() => {
                                    setState(prev => ({
                                      ...prev,
                                      editingPrompts: {
                                        ...prev.editingPrompts,
                                        roles: {
                                          ...prev.editingPrompts.roles,
                                          [roleName]: false
                                        }
                                      }
                                    }));
                                  }}
                                  className="text-xs p-1 text-success hover:bg-success-light rounded"
                                  title="确认"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => {
                                    setState(prev => ({
                                      ...prev,
                                      editingPrompts: {
                                        ...prev.editingPrompts,
                                        roles: {
                                          ...prev.editingPrompts.roles,
                                          [roleName]: false
                                        }
                                      }
                                    }));
                                  }}
                                  className="text-xs p-1 text-error hover:bg-error-light rounded"
                                  title="取消"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  setState(prev => ({
                                    ...prev,
                                    editingPrompts: {
                                      ...prev.editingPrompts,
                                      roles: {
                                        ...prev.editingPrompts.roles,
                                        [roleName]: true
                                      }
                                    }
                                  }));
                                }}
                                className="text-xs p-1 text-primary-secondary hover:bg-surface-alt rounded"
                                title="编辑"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => handleRegenerateRole(roleName)}
                              disabled={state.loadingRoles[roleName]}
                              className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            >
                              {state.loadingRoles[roleName] ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  生成中
                                </>
                              ) : (
                                '重新生成'
                              )}
                            </button>
                          </div>
                        </div>
                        {state.editingPrompts.roles[roleName] ? (
                          <textarea
                            value={state.prompts.roles[roleName] || ''}
                            onChange={(e) => {
                              setState(prev => ({
                                ...prev,
                                prompts: {
                                  ...prev.prompts,
                                  roles: {
                                    ...prev.prompts.roles,
                                    [roleName]: e.target.value
                                  }
                                }
                              }));
                            }}
                            className="w-full text-xs text-primary-muted leading-relaxed border border-stroke rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple focus:border-transparent"
                            rows={4}
                            placeholder={`${roleName}提示词`}
                            autoFocus
                          />
                        ) : (
                          <p className="text-xs text-primary-muted leading-relaxed">
                            {state.prompts.roles[roleName] || '暂无提示词'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-shrink-0 p-4 border-t-2 border-stroke-light bg-white">
              {/* <div className="mb-3">
                <label className="text-sm font-medium text-primary-secondary mb-2 block">合成方式</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setState(prev => ({ ...prev, compositeMethod: 'canvas' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      state.compositeMethod === 'canvas'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border-2 border-stroke-light text-dark hover:bg-warning-light'
                    }`}
                  >
                    Canvas直接合成
                  </button>
                  <button
                    onClick={() => setState(prev => ({ ...prev, compositeMethod: 'ai' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      state.compositeMethod === 'ai'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border-2 border-stroke-light text-dark hover:bg-warning-light'
                    }`}
                  >
                    AI流程合成
                  </button>
                </div>
                <p className="text-xs text-primary-muted mt-1">
                  {state.compositeMethod === 'canvas' 
                    ? '快速合成，保持原始尺寸和位置' 
                    : 'AI风格融合，需要较长处理时间'}
                </p>
              </div> */}

              <div className="flex items-center justify-between">
                <button
                  onClick={handleReset}
                  disabled={state.isGenerating || state.isCompositing}
                  className="px-4 py-2 border-2 border-stroke-light rounded-lg text-dark hover:bg-warning-light hover:border-primary disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  重置
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleComposite}
                    disabled={state.isCompositing || !state.generatedAssets.background}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-medium"
                  >
                    {state.isCompositing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        合成中...
                      </>
                    ) : (
                      '合成图片'
                    )}
                  </button>

                  {state.compositeResult && (
                    <button
                      onClick={handleDownload}
                      className="px-6 py-2 bg-success text-white rounded-lg hover:bg-success-active transition-colors flex items-center gap-2 font-medium"
                    >
                      <Download className="w-4 h-4" />
                      下载
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPSceneGenerator;
