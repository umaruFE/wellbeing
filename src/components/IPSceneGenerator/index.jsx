import React, { useState } from 'react';
import { Wand2, Download, RotateCcw, Loader2 } from 'lucide-react';
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
        const stepY = layout.sceneH / (total + 1);
        x = layout.offsetX + stepX * (index + 1) - estW / 2;
        y = layout.offsetY + stepY * (index + 1) - estH / 2;
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
      console.log('提取的关键词:', extractData.data);

      const { background: backgroundPrompt, roles: rolePrompts } = extractData.data;

      console.log('生成背景图，提示词:', backgroundPrompt);
      const backgroundResponse = await fetch('/api/ai/generate-images', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prompt: backgroundPrompt,
          count: 1,
          width: state.aspectRatio.width,
          height: state.aspectRatio.height,
          workflow_type: 'background',
          user_id: userId,
          organization_id: organizationId
        })
      });

      if (!backgroundResponse.ok) {
        throw new Error('生成背景图失败');
      }

      const backgroundData = await backgroundResponse.json();
      const backgroundTaskId = backgroundData.tasks[0].promptId;

      const roleTaskPromises = state.selectedRoles.map(async (roleName) => {
        const rolePrompt = rolePrompts[roleName] || state.prompt;
        
        const characterColors = {
          poppy: '粉色',
          edi: '蓝色',
          rolly: '橘色',
          milo: '黄色',
          ace: '紫色'
        };
        
        const characterColor = characterColors[roleName] || '';
        const finalRolePrompt = `${characterColor}的${roleName}角色，${rolePrompt}`;
        
        console.log(`生成角色 ${roleName}，提示词:`, finalRolePrompt);
        
        const roleResponse = await fetch('/api/ai/generate-images', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            prompt: finalRolePrompt,
            count: 1,
            width: 1024,
            height: 1024,
            workflow_type: 'ip-character',
            character_name: roleName,
            user_id: userId,
            organization_id: organizationId
          })
        });

        if (!roleResponse.ok) {
          throw new Error(`生成角色 ${roleName} 失败`);
        }

        const roleData = await roleResponse.json();
        return {
          name: roleName,
          taskId: roleData.tasks[0].promptId
        };
      });

      const roleTasks = await Promise.all(roleTaskPromises);

      const pollTask = async (taskId, maxAttempts = 120, interval = 3000) => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const response = await fetch(`/api/ai/task-status/${taskId}`, {
            headers: getAuthHeaders()
          });
          const data = await response.json();
          
          if (data.status === 'completed') {
            return data.url;
          } else if (data.status === 'error') {
            throw new Error('任务执行失败');
          }
          
          await new Promise(resolve => setTimeout(resolve, interval));
        }
        throw new Error('任务超时');
      };

      const removeWhiteBackground = async (roleName, roleUrl) => {
        console.log(`对角色 ${roleName} 进行白色背景去除处理...`);
        try {
          const removeBgResponse = await fetch('/api/ai/remove-white-background', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
              imageUrl: roleUrl,
              threshold: 240
            })
          });
          
          if (removeBgResponse.ok) {
            const removeBgData = await removeBgResponse.json();
            console.log(`角色 ${roleName} 白色背景去除完成:`, removeBgData.url);
            return removeBgData.url;
          } else {
            console.warn(`角色 ${roleName} 去背景失败，使用原图`);
            return roleUrl;
          }
        } catch (error) {
          console.warn(`角色 ${roleName} 去背景出错，使用原图:`, error);
          return roleUrl;
        }
      };

      const backgroundPromise = pollTask(backgroundTaskId).then(url => {
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
        return pollTask(roleTask.taskId)
          .then(url => removeWhiteBackground(roleTask.name, url))
          .then(url => {
            console.log(`角色 ${roleTask.name} 生成完成:`, url);
            const rolePrompt = rolePrompts[roleTask.name] || state.prompt;
            const characterColors = {
              poppy: '粉色',
              edi: '蓝色',
              rolly: '橘色',
              milo: '黄色',
              ace: '紫色'
            };
            const characterColor = characterColors[roleTask.name] || '';
            const finalRolePrompt = `${characterColor}的${roleTask.name}角色，${rolePrompt}`;
            
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
                  [roleTask.name]: finalRolePrompt
                }
              }
            }));
            return { name: roleTask.name, url };
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

  const handleCanvasComposite = async () => {
    setState(prev => ({ ...prev, isCompositing: true }));

    try {
      console.log('开始Canvas合成...');
      
      const canvas = document.createElement('canvas');
      canvas.width = state.aspectRatio.width;
      canvas.height = state.aspectRatio.height;
      const ctx = canvas.getContext('2d');

      console.log('加载背景图:', state.generatedAssets.background);
      const backgroundImg = new Image();
      backgroundImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        backgroundImg.onload = () => {
          console.log('背景图加载成功');
          resolve();
        };
        backgroundImg.onerror = (e) => {
          console.error('背景图加载失败:', e);
          reject(new Error('背景图加载失败'));
        };
        const fullUrl = state.generatedAssets.background.startsWith('http') 
          ? state.generatedAssets.background 
          : `${window.location.origin}${state.generatedAssets.background}`;
        backgroundImg.src = fullUrl;
      });

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

      for (const roleName of state.selectedRoles) {
        const roleUrl = state.generatedAssets.roles[roleName];
        const position = state.canvasState.roles[roleName];

        if (!roleUrl || !position) {
          console.warn(`跳过角色 ${roleName}: 缺少URL或位置信息`);
          continue;
        }

        console.log(`加载角色图: ${roleName}`, roleUrl);
        const roleImg = new Image();
        roleImg.crossOrigin = 'anonymous';

        await new Promise((resolve, reject) => {
          roleImg.onload = () => {
            console.log(`角色 ${roleName} 加载成功`);
            resolve();
          };
          roleImg.onerror = (e) => {
            console.error(`角色 ${roleName} 加载失败:`, e);
            reject(new Error(`角色 ${roleName} 加载失败`));
          };
          const fullUrl = roleUrl.startsWith('http')
            ? roleUrl
            : `${window.location.origin}${roleUrl}`;
          roleImg.src = fullUrl;
        });

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
          rotation: position.rotation || 0
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

      const pollTask = async (taskId, maxAttempts = 120, interval = 3000) => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const response = await fetch(`/api/ai/task-status/${taskId}`, {
            headers: getAuthHeaders()
          });
          const data = await response.json();
          
          if (data.status === 'completed') {
            return data.url;
          } else if (data.status === 'error') {
            throw new Error('任务执行失败');
          }
          
          await new Promise(resolve => setTimeout(resolve, interval));
        }
        throw new Error('任务超时');
      };

      const compositeUrl = await pollTask(compositeTaskId);

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

      const pollTask = async (taskId, maxAttempts = 120, interval = 3000) => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const response = await fetch(`/api/ai/task-status/${taskId}`, {
            headers: getAuthHeaders()
          });
          const data = await response.json();
          
          if (data.status === 'completed') {
            return data.url;
          } else if (data.status === 'error') {
            throw new Error('任务执行失败');
          }
          
          await new Promise(resolve => setTimeout(resolve, interval));
        }
        throw new Error('任务超时');
      };

      const url = await pollTask(taskId);
      
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
          character_name: roleName,
          user_id: userId,
          organization_id: organizationId
        })
      });

      if (!response.ok) throw new Error(`生成角色 ${roleName} 失败`);

      const data = await response.json();
      const taskId = data.tasks[0].promptId;

      const pollTask = async (taskId, maxAttempts = 120, interval = 3000) => {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          const response = await fetch(`/api/ai/task-status/${taskId}`, {
            headers: getAuthHeaders()
          });
          const data = await response.json();
          
          if (data.status === 'completed') {
            return data.url;
          } else if (data.status === 'error') {
            throw new Error('任务执行失败');
          }
          
          await new Promise(resolve => setTimeout(resolve, interval));
        }
        throw new Error('任务超时');
      };

      let url = await pollTask(taskId);
      
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
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b-2 border-[#e5e3db] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg text-white">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">IP角色场景生成器</h3>
              <p className="text-xs text-slate-500">选择角色、设置场景、生成专业IP场景图片</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          <div className="w-80 border-r-2 border-[#e5e3db] p-6 overflow-y-auto">
            <RoleSelection
              selectedRoles={state.selectedRoles}
              onRoleSelect={handleRoleSelect}
            />

            <div className="mt-6">
              <label className="text-sm font-medium text-slate-700 mb-2 block">图片比例</label>
              <div className="grid grid-cols-2 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.id}
                    onClick={() => handleRatioSelect(ratio)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${
                      state.aspectRatio.id === ratio.id
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-[#e5e3db] hover:border-[#2d2d2d] text-[#2d2d2d] hover:bg-[#fffbe6]'
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
              <p className="text-xs text-slate-400 mt-1">
                {state.aspectRatio.description} ({state.aspectRatio.width}×{state.aspectRatio.height})
              </p>
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium text-slate-700 mb-2 block">场景描述</label>
              <textarea
                value={state.prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                placeholder="描述您想要的场景，例如：美丽的绿色魔法森林，阳光透过树叶..."
                className="w-full border-2 border-[#e5e3db] rounded-xl p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none h-32 transition-all"
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
                <div className="w-80 flex-shrink-0 bg-gray-50 rounded-lg p-4 overflow-y-auto">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">提示词管理</h4>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-600">背景图</span>
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
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {state.prompts.background || '暂无提示词'}
                      </p>
                    </div>
                    
                    {state.selectedRoles.map(roleName => (
                      <div key={roleName} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-slate-600">{roleName}</span>
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
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {state.prompts.roles[roleName] || '暂无提示词'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-shrink-0 p-4 border-t-2 border-[#e5e3db] bg-white">
              {/* <div className="mb-3">
                <label className="text-sm font-medium text-slate-700 mb-2 block">合成方式</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setState(prev => ({ ...prev, compositeMethod: 'canvas' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      state.compositeMethod === 'canvas'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border-2 border-[#e5e3db] text-[#2d2d2d] hover:bg-[#fffbe6]'
                    }`}
                  >
                    Canvas直接合成
                  </button>
                  <button
                    onClick={() => setState(prev => ({ ...prev, compositeMethod: 'ai' }))}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      state.compositeMethod === 'ai'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border-2 border-[#e5e3db] text-[#2d2d2d] hover:bg-[#fffbe6]'
                    }`}
                  >
                    AI流程合成
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {state.compositeMethod === 'canvas' 
                    ? '快速合成，保持原始尺寸和位置' 
                    : 'AI风格融合，需要较长处理时间'}
                </p>
              </div> */}

              <div className="flex items-center justify-between">
                <button
                  onClick={handleReset}
                  disabled={state.isGenerating || state.isCompositing}
                  className="px-4 py-2 border-2 border-[#e5e3db] rounded-lg text-[#2d2d2d] hover:bg-[#fffbe6] hover:border-[#2d2d2d] disabled:opacity-50 transition-all flex items-center gap-2"
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
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
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
