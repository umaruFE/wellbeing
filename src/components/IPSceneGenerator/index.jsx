import React, { useState } from 'react';
import { Wand2, Download, RotateCcw, Loader2 } from 'lucide-react';
import RoleSelection from './RoleSelection';
import CanvasEditor from './CanvasEditor';

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
    canvasState: {
      roles: {}
    },
    isCompositing: false,
    compositeResult: null,
    compositeMethod: 'canvas' // 'canvas' 或 'ai'
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

    setState(prev => ({ ...prev, isGenerating: true }));

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

      const seed = Date.now();
      
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
        console.log(`生成角色 ${roleName}，提示词:`, rolePrompt);
        
        const roleResponse = await fetch('/api/ai/generate-images', {
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

      const backgroundUrl = await pollTask(backgroundTaskId);
      
      const roleUrls = {};
      for (const roleTask of roleTasks) {
        console.log(`获取角色 ${roleTask.name} 的原始图片...`);
        const roleUrl = await pollTask(roleTask.taskId);
        
        console.log(`对角色 ${roleTask.name} 进行白色背景去除处理...`);
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
            roleUrls[roleTask.name] = removeBgData.url;
            console.log(`角色 ${roleTask.name} 白色背景去除完成:`, removeBgData.url);
          } else {
            console.warn(`角色 ${roleTask.name} 去背景失败，使用原图`);
            roleUrls[roleTask.name] = roleUrl;
          }
        } catch (error) {
          console.warn(`角色 ${roleTask.name} 去背景出错，使用原图:`, error);
          roleUrls[roleTask.name] = roleUrl;
        }
      }

      setState(prev => ({
        ...prev,
        isGenerating: false,
        generatedAssets: {
          background: backgroundUrl,
          roles: roleUrls
        },
        canvasState: {
          roles: state.selectedRoles.reduce((acc, roleName, index) => {
            acc[roleName] = {
              x: 100 + index * 200,
              y: 100 + index * 100,
              scale: 1,
              rotation: 0
            };
            return acc;
          }, {})
        }
      }));

    } catch (error) {
      console.error('生成失败:', error);
      alert(`生成失败: ${error.message}`);
      setState(prev => ({ ...prev, isGenerating: false }));
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
      
      const editorScale = Math.min(
        editorCanvasWidth / state.aspectRatio.width,
        editorCanvasHeight / state.aspectRatio.height
      );
      const offsetX = (editorCanvasWidth - state.aspectRatio.width * editorScale) / 2;
      const offsetY = (editorCanvasHeight - state.aspectRatio.height * editorScale) / 2;

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

        const roleScale = 0.3 * (position.scale || 1);
        const roleWidth = roleImg.width * roleScale;
        const roleHeight = roleImg.height * roleScale;

        const actualX = (position.x - offsetX) / editorScale;
        const actualY = (position.y - offsetY) / editorScale;
        const actualWidth = roleWidth / editorScale;
        const actualHeight = roleHeight / editorScale;

        console.log(`绘制角色 ${roleName}:`, { actualX, actualY, actualWidth, actualHeight });

        ctx.save();
        ctx.translate(actualX + actualWidth / 2, actualY + actualHeight / 2);
        ctx.rotate((position.rotation || 0) * Math.PI / 180);
        ctx.drawImage(roleImg, -actualWidth / 2, -actualHeight / 2, actualWidth, actualHeight);
        ctx.restore();
      }

      console.log('Canvas合成完成，准备上传...');
      const compositeDataUrl = canvas.toDataURL('image/png');
      
      const uploadFormData = new FormData();
      const blob = await fetch(compositeDataUrl).then(r => r.blob());
      const file = new File([blob], `composite-${Date.now()}.png`, { type: 'image/png' });
      uploadFormData.append('file', file);
      uploadFormData.append('folder', 'ai-generated-composite');

      console.log('上传合成图片...');
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        console.error('上传失败:', errorData);
        throw new Error(errorData.error || '上传合成图片失败');
      }

      const uploadData = await uploadResponse.json();
      console.log('Canvas合成图片上传成功:', uploadData.url);

      setState(prev => ({
        ...prev,
        isCompositing: false,
        compositeResult: uploadData.url
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
      compositeResult: null
    });
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
            <div className="flex-1 min-h-0 overflow-hidden">
              <CanvasEditor
                background={state.generatedAssets.background}
                roles={state.generatedAssets.roles}
                rolePositions={state.canvasState.roles}
                onRolePositionChange={handleRolePositionChange}
                aspectRatio={state.aspectRatio}
              />
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
