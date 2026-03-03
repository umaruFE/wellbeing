/**
 * CanvasView.assets.js - 资产相关处理函数
 * 功能：
 * 1. 处理资产的变更、删除、复制等操作
 * 2. 处理图层顺序调整
 * 3. 处理参考图片上传
 */

/**
 * 处理资产变更
 * @param {string} assetId - 资产ID
 * @param {string} field - 变更的字段
 * @param {any} value - 新值
 * @param {string} activePhase - 当前活跃的阶段
 * @param {string} activeStepId - 当前活跃的步骤ID
 * @param {Object} courseData - 课程数据
 * @param {Function} setCourseData - 更新课程数据的函数
 * @param {Function} saveToHistory - 保存历史记录的函数
 */
export const handleAssetChange = (assetId, field, value, activePhase, activeStepId, courseData, setCourseData, saveToHistory) => {
  const newCourseData = JSON.parse(JSON.stringify(courseData));
  
  // 处理数组和对象两种格式
  const phase = Array.isArray(newCourseData) 
    ? newCourseData.find(p => p.id === activePhase)
    : newCourseData[activePhase];
  
  if (!phase) return;
  
  const stepsOrSlides = phase.steps || phase.slides;
  if (!stepsOrSlides) return;
  
  const step = stepsOrSlides.find(s => s.id === activeStepId);
  if (!step) return;
  const asset = step.assets?.find(a => a.id === assetId) || step.elements?.find(a => a.id === assetId);
  if (asset) {
    asset[field] = value;
    setCourseData(newCourseData);
    saveToHistory();
  }
};

/**
 * 处理删除资产
 * @param {string} assetId - 资产ID
 * @param {string} activePhase - 当前活跃的阶段
 * @param {string} activeStepId - 当前活跃的步骤ID
 * @param {Object} courseData - 课程数据
 * @param {Function} setCourseData - 更新课程数据的函数
 * @param {Function} saveToHistory - 保存历史记录的函数
 * @param {Function} setSelectedAssetId - 更新选中资产ID的函数
 */
export const handleDeleteAsset = (assetId, activePhase, activeStepId, courseData, setCourseData, saveToHistory, setSelectedAssetId) => {
  const newCourseData = JSON.parse(JSON.stringify(courseData));
  
  // 处理数组和对象两种格式
  const phase = Array.isArray(newCourseData) 
    ? newCourseData.find(p => p.id === activePhase)
    : newCourseData[activePhase];
  
  if (!phase) return;
  
  const stepsOrSlides = phase.steps || phase.slides;
  if (!stepsOrSlides) return;
  
  const step = stepsOrSlides.find(s => s.id === activeStepId);
  if (!step) return;
  if (step.assets) {
    step.assets = step.assets.filter(a => a.id !== assetId);
  }
  if (step.elements) {
    step.elements = step.elements.filter(a => a.id !== assetId);
  }
  setCourseData(newCourseData);
  saveToHistory();
  setSelectedAssetId(null);
};

/**
 * 处理复制资产
 * @param {string} assetId - 资产ID
 * @param {string} activePhase - 当前活跃的阶段
 * @param {string} activeStepId - 当前活跃的步骤ID
 * @param {Object} courseData - 课程数据
 * @param {Function} setCourseData - 更新课程数据的函数
 * @param {Function} saveToHistory - 保存历史记录的函数
 * @param {Function} setSelectedAssetId - 更新选中资产ID的函数
 */
export const handleCopyAsset = (assetId, activePhase, activeStepId, courseData, setCourseData, saveToHistory, setSelectedAssetId) => {
  const phaseData = Array.isArray(courseData) 
    ? courseData.find(p => p.id === activePhase)
    : courseData[activePhase];
  const step = phaseData?.slides?.find(s => s.id === activeStepId);
  const assetToCopy = step?.assets?.find(a => a.id === assetId) || step?.elements?.find(a => a.id === assetId);
  if (!assetToCopy) return;

  const newCourseData = JSON.parse(JSON.stringify(courseData));
  
  // 处理数组和对象两种格式
  const phase = Array.isArray(newCourseData) 
    ? newCourseData.find(p => p.id === activePhase)
    : newCourseData[activePhase];
  
  if (!phase) return;
  
  const currentStep = phase.steps.find(s => s.id === activeStepId);
  if (!currentStep) return;
  const newAsset = {
    ...JSON.parse(JSON.stringify(assetToCopy)),
    id: Date.now().toString(),
    x: assetToCopy.x + 20,
    y: assetToCopy.y + 20,
    title: assetToCopy.title + ' (副本)'
  };
  if (!currentStep.assets) {
    currentStep.assets = [];
  }
  currentStep.assets.push(newAsset);
  setCourseData(newCourseData);
  saveToHistory();
  setSelectedAssetId(newAsset.id);
};

/**
 * 处理复制页面
 * @param {string} activePhase - 当前活跃的阶段
 * @param {string} activeStepId - 当前活跃的步骤ID
 * @param {Object} courseData - 课程数据
 * @param {Function} setCourseData - 更新课程数据的函数
 * @param {Function} saveToHistory - 保存历史记录的函数
 * @param {Function} setActiveStepId - 更新活跃步骤ID的函数
 */
export const handleCopyPage = (activePhase, activeStepId, courseData, setCourseData, saveToHistory, setActiveStepId) => {
  const newCourseData = JSON.parse(JSON.stringify(courseData));
  
  // 处理数组和对象两种格式
  const phase = Array.isArray(newCourseData) 
    ? newCourseData.find(p => p.id === activePhase)
    : newCourseData[activePhase];
  
  if (!phase) return;
  
  const currentStep = phase.steps.find(s => s.id === activeStepId);
  if (!currentStep) return;

  const newStep = {
    ...JSON.parse(JSON.stringify(currentStep)),
    id: `${activePhase}-${Date.now()}`,
    title: currentStep.title + ' (副本)',
    assets: (currentStep.assets || []).map(asset => ({
      ...JSON.parse(JSON.stringify(asset)),
      id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: asset.x + 20,
      y: asset.y + 20
    })),
    canvasAssets: (currentStep.canvasAssets || []).map(asset => ({
      ...JSON.parse(JSON.stringify(asset)),
      id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: asset.x + 20,
      y: asset.y + 20
    }))
  };
  phase.steps.push(newStep);
  setCourseData(newCourseData);
  saveToHistory();
  setActiveStepId(newStep.id);
};

/**
 * 处理图层变更
 * @param {string} assetId - 资产ID
 * @param {string} action - 操作类型：front, back, forward, backward
 * @param {string} activePhase - 当前活跃的阶段
 * @param {string} activeStepId - 当前活跃的步骤ID
 * @param {Object} courseData - 课程数据
 * @param {Function} setCourseData - 更新课程数据的函数
 * @param {Function} saveToHistory - 保存历史记录的函数
 */
export const handleLayerChange = (assetId, action, activePhase, activeStepId, courseData, setCourseData, saveToHistory) => {
  const newCourseData = JSON.parse(JSON.stringify(courseData));
  
  // 处理数组和对象两种格式
  const phase = Array.isArray(newCourseData) 
    ? newCourseData.find(p => p.id === activePhase)
    : newCourseData[activePhase];
  
  if (!phase) return;
  
  const stepsOrSlides = phase.steps || phase.slides;
  if (!stepsOrSlides) return;
  
  const step = stepsOrSlides.find(s => s.id === activeStepId);
  if (!step) return;
  const currentAssets = [...(step.assets || step.elements || [])];
  const index = currentAssets.findIndex(a => a.id === assetId);
  if (index === -1) return;
  if (action === 'front') currentAssets.push(currentAssets.splice(index, 1)[0]);
  else if (action === 'back') currentAssets.unshift(currentAssets.splice(index, 1)[0]);
  else if (action === 'forward' && index < currentAssets.length - 1) [currentAssets[index], currentAssets[index + 1]] = [currentAssets[index + 1], currentAssets[index]];
  else if (action === 'backward' && index > 0) [currentAssets[index], currentAssets[index - 1]] = [currentAssets[index - 1], currentAssets[index]];
  step.assets = currentAssets;
  setCourseData(newCourseData);
  saveToHistory();
};

/**
 * 处理参考图片上传
 * @param {Event} e - 文件上传事件
 * @param {string} assetId - 资产ID
 * @param {string} activePhase - 当前活跃的阶段
 * @param {string} activeStepId - 当前活跃的步骤ID
 * @param {Object} courseData - 课程数据
 * @param {Function} setCourseData - 更新课程数据的函数
 * @param {Function} saveToHistory - 保存历史记录的函数
 */
export const handleReferenceUpload = (e, assetId, activePhase, activeStepId, courseData, setCourseData, saveToHistory) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const newCourseData = JSON.parse(JSON.stringify(courseData));
      
      // 处理数组和对象两种格式
      const phase = Array.isArray(newCourseData) 
        ? newCourseData.find(p => p.id === activePhase)
        : newCourseData[activePhase];
      
      if (!phase) return;
      
      const stepsOrSlides = phase.steps || phase.slides;
      if (!stepsOrSlides) return;
      
      const step = stepsOrSlides.find(s => s.id === activeStepId);
      if (!step) return;
      const asset = step.assets?.find(a => a.id === assetId) || step.elements?.find(a => a.id === assetId);
      if (asset) {
        asset.referenceImage = reader.result;
        setCourseData(newCourseData);
        saveToHistory();
      }
    };
    reader.readAsDataURL(file);
  }
};
