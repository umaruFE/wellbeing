import React, { useState, useRef, useEffect } from 'react';
import { 
  RefreshCw, 
  Music, 
  FileText, 
  Trash2, 
  Maximize2,
  Image as ImageIcon, 
  Plus,
  Copy,
  Wand2,
  Clock,
  History,
  Layout,
  BookOpen,
  ChevronRight,
  X,
  Sparkles
} from 'lucide-react';
import { WORD_DOC_DATA } from '../constants';
import { ImagePreviewModal } from './ImagePreviewModal';
import { BookmarkIcon } from './BookmarkIcon';
import { HistoryVersionView } from './HistoryVersionView';
import { PromptInputModal } from './PromptInputModal';

export const TableView = ({ initialConfig, onReset, onNavigateToCanvas }) => {
  // 初始化数据时，确保每一行都有 script 字段
  const [slides, setSlides] = useState(WORD_DOC_DATA.map(s => ({...s, script: s.script || ''})));
  const [previewImage, setPreviewImage] = useState(null);
  const [generatingMedia, setGeneratingMedia] = useState({});
  const [generatingPdf, setGeneratingPdf] = useState({}); // PDF生成状态
  const [showHistoryView, setShowHistoryView] = useState(false);
  const [historyVersions, setHistoryVersions] = useState([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [showGenerateModal, setShowGenerateModal] = useState(null); // {type: 'activity'|'script'|'session', phaseId, slideId}
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [showAddRowPromptModal, setShowAddRowPromptModal] = useState(null); // {phaseId}
  const [isGeneratingRow, setIsGeneratingRow] = useState(false);
  const [showReadingMaterialPromptModal, setShowReadingMaterialPromptModal] = useState(null); // {phaseId, slideId}
  const [isGeneratingReadingMaterial, setIsGeneratingReadingMaterial] = useState(false);
  const [showAddPPTPromptModal, setShowAddPPTPromptModal] = useState(null); // {phaseId, slideId}
  const [isGeneratingPPT, setIsGeneratingPPT] = useState(false);
  const [showRegeneratePPTPromptModal, setShowRegeneratePPTPromptModal] = useState(null); // {phaseId, slideId}
  const [isRegeneratingPPT, setIsRegeneratingPPT] = useState(false);
  const [showRegenerateReadingMaterialPromptModal, setShowRegenerateReadingMaterialPromptModal] = useState(null); // {phaseId, slideId}
  const [isRegeneratingReadingMaterial, setIsRegeneratingReadingMaterial] = useState(false);
  const [selectedField, setSelectedField] = useState(null); // {phaseId, slideId, field: 'activity'|'objectives'|'script'}
  const [generationHistory, setGenerationHistory] = useState([]); // 历史生成记录 [{ phaseId, slideId, field, content, timestamp, type }]
  const [showHistoryModal, setShowHistoryModal] = useState(null); // { phaseId, slideId, field }
  const [showRegenerateModal, setShowRegenerateModal] = useState(null); // { phaseId, slideId, field: 'activity'|'objectives'|'script'|'session' }
  const [phaseGenerationHistory, setPhaseGenerationHistory] = useState([]); // 阶段历史生成记录 [{ phaseId, data, timestamp }]
  const [showPhaseHistoryModal, setShowPhaseHistoryModal] = useState(null); // { phaseId }
  const [showRegeneratePhaseModal, setShowRegeneratePhaseModal] = useState(null); // { phaseId }
  const [showHistorySessionModal, setShowHistorySessionModal] = useState(null); // { phaseId, slideId } - 环节历史生成

  // 生成示例阅读材料的辅助函数
  const generateSampleReadingMaterial = (slide, index = 0) => {
    const materialId = `reading-sample-${slide.id}-${index}`;
    const title = `${slide.title} - 阅读材料`;
    // 使用简单的英文文本避免编码问题
    const thumbnailText = `Reading${index + 1}`;
    
    return {
      id: materialId,
      title: title,
      thumbnail: `https://placehold.co/200x267/6366f1/FFFFFF?text=${thumbnailText}`,
      pages: [
        {
          id: `page-${materialId}-1`,
          pageNumber: 1,
          title: title,
          width: 680,
          height: 960,
          canvasAssets: [
            {
              id: `asset-${materialId}-1`,
              type: 'text',
              title: '标题',
              content: title,
              x: 50,
              y: 40,
              width: 580,
              height: 70,
              rotation: 0,
              fontSize: 28,
              fontWeight: 'bold',
              textAlign: 'center',
              prompt: ''
            },
            {
              id: `asset-${materialId}-2`,
              type: 'image',
              title: '示例图片',
              url: `https://placehold.co/400x250/6366f1/FFF?text=${encodeURIComponent(slide.title.substring(0, 10))}`,
              x: 140,
              y: 120,
              width: 400,
              height: 250,
              rotation: 0,
              prompt: ''
            },
            {
              id: `asset-${materialId}-3`,
              type: 'text',
              title: '内容',
              content: `【${slide.title}】\n\n本阅读材料包含以下内容：\n\n• 核心知识点\n• 实例分析\n• 练习题\n• 拓展阅读\n\n让我们一起开始学习吧！`,
              x: 50,
              y: 390,
              width: 580,
              height: 520,
              rotation: 0,
              fontSize: 16,
              lineHeight: 1.6,
              prompt: ''
            }
          ]
        }
      ],
      timestamp: Date.now() - (index * 1000),
      prompt: ''
    };
  };

  // 扩展数据结构：支持多个PPT和阅读素材
  const [phases, setPhases] = useState([
    { 
      id: 'Engage', 
      label: 'Engage (引入)', 
      color: 'bg-purple-50 border-purple-200 text-purple-800', 
      slides: WORD_DOC_DATA.filter(s => s.phase.includes('Engage')).map((s, idx) => ({
        ...s, 
        script: s.script || '',
        // 扩展：支持多个PPT和阅读素材
        pptSlides: s.image ? [{ id: `ppt-${s.id}`, image: s.image, timestamp: Date.now() }] : [],
        // 为所有环节添加示例阅读材料（至少一个）
        readingMaterials: [generateSampleReadingMaterial(s, 0)]
      }))
    },
    { 
      id: 'Empower', 
      label: 'Empower (赋能)', 
      color: 'bg-blue-50 border-blue-200 text-blue-800', 
      slides: WORD_DOC_DATA.filter(s => s.phase.includes('Empower')).map((s, idx) => ({
        ...s, 
        script: s.script || '',
        pptSlides: s.image ? [{ id: `ppt-${s.id}`, image: s.image, timestamp: Date.now() }] : [],
        // 为所有环节添加示例阅读材料（至少一个）
        readingMaterials: [generateSampleReadingMaterial(s, 0)]
      }))
    },
    { 
      id: 'Execute', 
      label: 'Execute (实践/产出)', 
      color: 'bg-green-50 border-green-200 text-green-800', 
      slides: WORD_DOC_DATA.filter(s => s.phase.includes('Execute')).map((s, idx) => ({
        ...s, 
        script: s.script || '',
        pptSlides: s.image ? [{ id: `ppt-${s.id}`, image: s.image, timestamp: Date.now() }] : [],
        // 为所有环节添加示例阅读材料（至少一个）
        readingMaterials: [generateSampleReadingMaterial(s, 0)]
      }))
    },
    { 
      id: 'Elevate', 
      label: 'Elevate (升华)', 
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800', 
      slides: WORD_DOC_DATA.filter(s => s.phase.includes('Elevate')).map((s, idx) => ({
        ...s, 
        script: s.script || '',
        pptSlides: s.image ? [{ id: `ppt-${s.id}`, image: s.image, timestamp: Date.now() }] : [],
        // 为所有环节添加示例阅读材料（至少一个）
        readingMaterials: [generateSampleReadingMaterial(s, 0)]
      }))
    }
  ]);

  // 历史版本管理
  const saveToHistory = () => {
    const newVersion = {
      timestamp: Date.now(),
      data: JSON.parse(JSON.stringify(phases)),
      description: `自动保存 - ${new Date().toLocaleString('zh-CN')}`
    };
    setHistoryVersions(prev => [...prev, newVersion]);
    setCurrentVersionIndex(historyVersions.length);
  };

  useEffect(() => {
    // 自动保存到历史（简化版，实际应该防抖）
    const timer = setTimeout(() => {
      if (phases.length > 0) {
        saveToHistory();
      }
    }, 30000); // 每30秒自动保存
    return () => clearTimeout(timer);
  }, [phases]);

  const updateSlideField = (phaseId, slideId, field, value) => {
    setPhases(prevPhases => prevPhases.map(phase => {
        if (phase.id !== phaseId) return phase;
        return { ...phase, slides: phase.slides.map(slide => slide.id === slideId ? { ...slide, [field]: value } : slide) };
    }));
  };

  const handleAddPhase = () => {
    const newId = `Phase-${Date.now()}`;
    setPhases([...phases, { id: newId, label: 'New Phase (新阶段)', color: 'bg-gray-50 border-gray-200 text-gray-800', slides: [] }]);
  };

  const handleDeletePhase = (phaseId) => {
    if (confirm('确定要删除这个阶段及其所有内容吗？')) {
        setPhases(phases.filter(p => p.id !== phaseId));
    }
  };

  const handleEditPhaseLabel = (phaseId, newLabel) => {
    setPhases(phases.map(p => p.id === phaseId ? { ...p, label: newLabel } : p));
  };

  const handleAddRow = (phaseId) => {
    // 显示提示词输入模态框
    setShowAddRowPromptModal({ phaseId });
  };

  const handleConfirmAddRow = (prompt) => {
    setIsGeneratingRow(true);
    const phaseId = showAddRowPromptModal.phaseId;
    
    // 模拟AI生成
    setTimeout(() => {
      const newId = Date.now();
      setPhases(prevPhases => prevPhases.map(phase => {
          if (phase.id !== phaseId) return phase;
          let defaultPhaseStr = phase.label;
          const generatedTitle = prompt ? `AI生成：${prompt.substring(0, 20)}...` : "New Activity";
          const generatedActivities = prompt ? `根据提示词"${prompt}"生成的教学活动内容` : "";
          const generatedObjectives = prompt ? `根据提示词"${prompt}"生成的教学目标` : "";
          
          return {
              ...phase,
              slides: [...phase.slides, {
                  // 初始化 script 字段为空，并添加扩展字段
                  id: newId, 
                  phase: defaultPhaseStr, 
                  duration: "5分钟", 
                  title: generatedTitle, 
                  objectives: generatedObjectives, 
                  activities: generatedActivities, 
                  script: "", 
                  materials: "", 
                  worksheets: "无", 
                  ppt_content: "", 
                  image: null, 
                  audio: null, 
                  video: null, 
                  elements: [],
                  pptSlides: [],
                  readingMaterials: []
              }]
          };
      }));
      setIsGeneratingRow(false);
      setShowAddRowPromptModal(null);
      saveToHistory();
    }, 1500);
  };

  const handleDeleteRow = (phaseId, slideId) => {
    setPhases(prevPhases => prevPhases.map(phase => {
        if (phase.id !== phaseId) return phase;
        return { ...phase, slides: phase.slides.filter(s => s.id !== slideId) };
    }));
    saveToHistory();
  };

  // 复制整个页面/环节
  const handleCopySlide = (phaseId, slideId) => {
    setPhases(prevPhases => prevPhases.map(phase => {
        if (phase.id !== phaseId) return phase;
        const slideToCopy = phase.slides.find(s => s.id === slideId);
        if (!slideToCopy) return phase;
        const newSlide = {
          ...JSON.parse(JSON.stringify(slideToCopy)),
          id: Date.now(),
          title: slideToCopy.title + ' (副本)'
        };
        return { ...phase, slides: [...phase.slides, newSlide] };
    }));
    saveToHistory();
  };

  // 跳转到画布视图（PPT模式）
  const handleNavigateToCanvasView = (phaseId, slideId) => {
    if (onNavigateToCanvas) {
      onNavigateToCanvas({ 
        phaseId, 
        slideId,
        type: 'ppt' // 明确指定为PPT模式
      });
    }
  };

  // 生成功能
  const handleGenerate = async (type, phaseId, slideId) => {
    const prompt = generatePrompt || '请根据当前教学环节生成相关内容';
    setGeneratingMedia(prev => ({ ...prev, [`${slideId}-${type}`]: true }));
    
    // 模拟AI生成
    setTimeout(() => {
      setPhases(prevPhases => prevPhases.map(phase => {
        if (phase.id !== phaseId) return phase;
        return {
          ...phase,
          slides: phase.slides.map(slide => {
            if (slide.id !== slideId) return slide;
            const generated = {
              activity: type === 'activity' ? `AI生成的活动内容：${prompt}` : slide.activities,
              script: type === 'script' ? `AI生成的讲稿：${prompt}` : slide.script,
              session: type === 'session' ? { ...slide, title: `AI生成：${prompt}` } : slide
            };
            return { ...slide, ...generated };
          })
        };
      }));
      setGeneratingMedia(prev => ({ ...prev, [`${slideId}-${type}`]: false }));
      setShowGenerateModal(null);
      setGeneratePrompt('');
      saveToHistory();
    }, 2000);
  };

  // 生成阅读材料
  const handleGenerateReadingMaterial = (prompt) => {
    setIsGeneratingReadingMaterial(true);
    const { phaseId, slideId } = showReadingMaterialPromptModal;
    const slide = phases.find(p => p.id === phaseId)?.slides.find(s => s.id === slideId);
    
    // 模拟AI生成阅读材料
    setTimeout(() => {
      const newMaterialId = `reading-${slideId}-${Date.now()}`;
      const baseTitle = slide?.title || '新阅读材料';
      const generatedTitle = prompt ? prompt.substring(0, 30) : baseTitle;
      
      // 根据提示词生成更丰富的内容
      const generateContent = (prompt) => {
        if (!prompt) {
          return `欢迎阅读这份教学材料！\n\n本材料包含以下内容：\n• 核心知识点讲解\n• 实例分析\n• 练习题\n• 拓展阅读\n\n让我们一起开始学习吧！`;
        }
        
        // 根据提示词生成相关内容
        let content = `【${generatedTitle}】\n\n`;
        content += `一、学习目标\n`;
        content += `通过本材料的学习，学生将能够：\n`;
        content += `• 理解核心概念\n`;
        content += `• 掌握基本技能\n`;
        content += `• 应用所学知识\n\n`;
        content += `二、主要内容\n`;
        content += `根据"${prompt}"的要求，本材料包含以下内容：\n`;
        content += `1. 基础概念介绍\n`;
        content += `2. 详细内容讲解\n`;
        content += `3. 实例演示\n`;
        content += `4. 练习题\n\n`;
        content += `三、学习建议\n`;
        content += `建议学生按照以下步骤学习：\n`;
        content += `1. 仔细阅读材料内容\n`;
        content += `2. 完成相关练习题\n`;
        content += `3. 复习巩固知识点\n\n`;
        content += `祝学习愉快！`;
        
        return content;
      };
      
      // 生成阅读材料的页面（包含丰富的内容）
      const generatedPages = [
        {
          id: `page-${newMaterialId}-1`,
          pageNumber: 1,
          title: generatedTitle,
          width: 680,
          height: 960,
          canvasAssets: [
            // 标题
            {
              id: `asset-${Date.now()}-1`,
              type: 'text',
              title: '标题',
              content: generatedTitle,
              x: 50,
              y: 40,
              width: 580,
              height: 70,
              rotation: 0,
              fontSize: 28,
              fontWeight: 'bold',
              textAlign: 'center',
              prompt: prompt
            },
            // 装饰图片
            {
              id: `asset-${Date.now()}-2`,
              type: 'image',
              title: '装饰图片',
              url: `https://placehold.co/400x250/4f46e5/FFF?text=${encodeURIComponent(generatedTitle.substring(0, 10))}`,
              x: 140,
              y: 120,
              width: 400,
              height: 250,
              rotation: 0,
              prompt: prompt ? `${prompt} 相关图片` : '教学图片'
            },
            // 主要内容
            {
              id: `asset-${Date.now()}-3`,
              type: 'text',
              title: '内容',
              content: generateContent(prompt),
              x: 50,
              y: 390,
              width: 580,
              height: 520,
              rotation: 0,
              fontSize: 16,
              lineHeight: 1.6,
              prompt: prompt
            }
          ]
        },
        // 第二页（如果有提示词，生成第二页）
        ...(prompt ? [{
          id: `page-${newMaterialId}-2`,
          pageNumber: 2,
          title: `${generatedTitle} - 练习题`,
          width: 680,
          height: 960,
          canvasAssets: [
            {
              id: `asset-${Date.now()}-4`,
              type: 'text',
              title: '练习题标题',
              content: '练习题',
              x: 50,
              y: 40,
              width: 580,
              height: 50,
              rotation: 0,
              fontSize: 24,
              fontWeight: 'bold',
              textAlign: 'center',
              prompt: prompt
            },
            {
              id: `asset-${Date.now()}-5`,
              type: 'text',
              title: '练习题内容',
              content: `【练习题】\n\n1. 根据"${prompt}"的内容，请回答以下问题：\n   • 问题一：________________\n   • 问题二：________________\n   • 问题三：________________\n\n2. 实践练习：\n   请根据所学内容完成以下任务：\n   ________________________________\n   ________________________________\n\n3. 思考题：\n   请思考并回答：\n   ________________________________\n   ________________________________\n\n【答案提示】\n参考答案将在下一页提供。`,
              x: 50,
              y: 110,
              width: 580,
              height: 800,
              rotation: 0,
              fontSize: 15,
              lineHeight: 1.8,
              prompt: prompt
            }
          ]
        }] : [])
      ];

      // 生成更真实的缩略图（基于第一页的内容）
      const firstPage = generatedPages[0];
      // 使用简单的标识符避免编码问题
      const thumbnailText = `Reading${Date.now().toString().slice(-4)}`;
      const thumbnailUrl = `https://placehold.co/200x267/6366f1/FFFFFF?text=${thumbnailText}`;
      
      const newMaterial = {
        id: newMaterialId,
        title: generatedTitle,
        thumbnail: thumbnailUrl,
        pages: generatedPages,
        timestamp: Date.now(),
        prompt: prompt
      };

      setPhases(prevPhases => prevPhases.map(phase => {
        if (phase.id !== phaseId) return phase;
        return {
          ...phase,
          slides: phase.slides.map(slide => {
            if (slide.id !== slideId) return slide;
            return {
              ...slide,
              readingMaterials: [
                ...(slide.readingMaterials || []),
                newMaterial
              ]
            };
          })
        };
      }));

      setIsGeneratingReadingMaterial(false);
      setShowReadingMaterialPromptModal(null);
      saveToHistory();

      // 自动跳转到阅读材料画布模式进行编辑
      if (onNavigateToCanvas) {
        setTimeout(() => {
          onNavigateToCanvas({ 
            phaseId, 
            slideId, 
            type: 'reading-material',
            materialId: newMaterialId,
            material: newMaterial // 传递完整的阅读材料数据
          });
        }, 500);
      }
    }, 2000);
  };

  // 媒体生成逻辑（用于PPT缩略图）
  const handleRegenerateMedia = (phaseId, slideId, type) => {
    const key = `${slideId}-${type}`;
    setGeneratingMedia(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setPhases(prevPhases => prevPhases.map(phase => {
        if (phase.id !== phaseId) return phase;
        return {
            ...phase,
            slides: phase.slides.map(slide => {
                if (slide.id !== slideId) return slide;
                let newContent = null;
                if (type === 'image') newContent = `https://placehold.co/600x400/${Math.floor(Math.random()*16777215).toString(16)}/FFF?text=AI+Gen+Slide+${Date.now().toString().slice(-4)}`;
                return { ...slide, [type]: newContent };
            })
        };
      }));
      setGeneratingMedia(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // 保存生成历史
  const saveGenerationHistory = (phaseId, slideId, field, content, type = 'regenerate') => {
    const historyItem = {
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      phaseId,
      slideId,
      field,
      content,
      type,
      timestamp: new Date().toISOString(),
      displayTime: new Date().toLocaleString('zh-CN')
    };
    setGenerationHistory(prev => [historyItem, ...prev].slice(0, 100)); // 最多保存100条
  };

  // 恢复历史生成内容
  const handleRestoreHistory = (historyItem) => {
    setPhases(prevPhases => prevPhases.map(phase => {
      if (phase.id !== historyItem.phaseId) return phase;
      return {
        ...phase,
        slides: phase.slides.map(slide => {
          if (slide.id !== historyItem.slideId) return slide;
          const update = { [historyItem.field]: historyItem.content };
          return { ...slide, ...update };
        })
      };
    }));
    setShowHistoryModal(null);
  };

  // 保存阶段历史
  const savePhaseHistory = (phaseId) => {
    const currentPhase = phases.find(p => p.id === phaseId);
    if (!currentPhase) return;
    
    const historyItem = {
      id: `phase-history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      phaseId,
      data: JSON.parse(JSON.stringify(currentPhase)),
      timestamp: new Date().toISOString(),
      displayTime: new Date().toLocaleString('zh-CN')
    };
    setPhaseGenerationHistory(prev => [historyItem, ...prev].slice(0, 50)); // 最多保存50条
  };

  // 恢复阶段历史
  const handleRestorePhaseHistory = (historyItem) => {
    setPhases(prevPhases => prevPhases.map(phase => {
      if (phase.id !== historyItem.phaseId) {
        return phase;
      }
      return historyItem.data;
    }));
    setShowPhaseHistoryModal(null);
  };

  // 重新生成阶段（带提示词）
  const handleRegeneratePhase = (phaseId, prompt = '') => {
    // 保存当前阶段到历史
    savePhaseHistory(phaseId);
    
    setTimeout(() => {
      setPhases(prevPhases => prevPhases.map(phase => {
        if (phase.id !== phaseId) return phase;
        return {
          ...phase,
          slides: phase.slides.map(slide => ({
            ...slide,
            title: prompt ? `AI生成：${prompt.substring(0, 20)}...` : slide.title,
            activities: prompt 
              ? `根据提示词"${prompt}"重新生成的教学活动：\n1. 准备阶段\n2. 导入环节\n3. 活动实施\n4. 总结反思\n（AI生成于 ${new Date().toLocaleTimeString()}）`
              : slide.activities,
            script: prompt
              ? `根据提示词"${prompt}"重新生成的讲稿：\n\n同学们，今天我们要学习一个非常有趣的主题...\n（AI生成于 ${new Date().toLocaleTimeString()}）`
              : slide.script,
            objectives: prompt
              ? `根据提示词"${prompt}"重新生成的教学目标：\n1. 理解核心概念\n2. 掌握关键技能\n3. 培养思维能力\n（AI生成于 ${new Date().toLocaleTimeString()}）`
              : slide.objectives
          }))
        };
      }));
      setShowRegeneratePhaseModal(null);
    }, 2000);
  };

  // 保存环节历史（用于环节级别的历史生成）
  const saveSessionHistory = (phaseId, slideId) => {
    const currentPhase = phases.find(p => p.id === phaseId);
    const currentSlide = currentPhase?.slides.find(s => s.id === slideId);
    if (!currentSlide) return;
    
    const historyItem = {
      id: `session-history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      phaseId,
      slideId,
      data: JSON.parse(JSON.stringify(currentSlide)),
      timestamp: new Date().toISOString(),
      displayTime: new Date().toLocaleString('zh-CN')
    };
    setGenerationHistory(prev => [historyItem, ...prev].slice(0, 100));
  };

  // 恢复环节历史
  const handleRestoreSessionHistory = (historyItem) => {
    setPhases(prevPhases => prevPhases.map(phase => {
      if (phase.id !== historyItem.phaseId) return phase;
      return {
        ...phase,
        slides: phase.slides.map(slide => {
          if (slide.id !== historyItem.slideId) return slide;
          return historyItem.data;
        })
      };
    }));
    setShowHistorySessionModal(null);
  };

  // 获取字段显示名称
  const getFieldDisplayName = (field) => {
    const fieldNames = {
      'activities': '教学活动',
      'activity': '教学活动', // 添加 activity 的映射
      'objectives': '教学目标',
      'script': '讲稿',
      'session': '本环节'
    };
    return fieldNames[field] || field;
  };

  // 重新生成教学目标（带提示词）
  const handleRegenerateObjectives = (phaseId, slideId, prompt = '') => {
    const key = `${slideId}-objectives`;
    setGeneratingMedia(prev => ({ ...prev, [key]: true }));
    
    // 保存当前内容到历史
    const currentPhase = phases.find(p => p.id === phaseId);
    const currentSlide = currentPhase?.slides.find(s => s.id === slideId);
    if (currentSlide?.objectives) {
      saveGenerationHistory(phaseId, slideId, 'objectives', currentSlide.objectives, 'regenerate');
    }
    
    setTimeout(() => {
      setPhases(prevPhases => prevPhases.map(phase => {
        if (phase.id !== phaseId) return phase;
        return {
          ...phase,
          slides: phase.slides.map(slide => {
            if (slide.id !== slideId) return slide;
            const generatedObjectives = prompt 
              ? `根据提示词"${prompt}"生成的教学目标：\n1. 理解核心概念\n2. 掌握关键技能\n3. 培养思维能力\n4. 提升实践能力\n（AI生成于 ${new Date().toLocaleTimeString()}）`
              : `1. 理解核心概念\n2. 掌握关键技能\n3. 培养思维能力\n4. 提升实践能力\n（AI生成于 ${new Date().toLocaleTimeString()}）`;
            return { ...slide, objectives: generatedObjectives };
          })
        };
      }));
      setGeneratingMedia(prev => ({ ...prev, [key]: false }));
      setShowRegenerateModal(null);
    }, 2000);
  };

  // 重新生成教学活动（带提示词）
  const handleRegenerateActivity = (phaseId, slideId, prompt = '') => {
    const key = `${slideId}-activity`;
    setGeneratingMedia(prev => ({ ...prev, [key]: true }));
    
    // 保存当前内容到历史
    const currentPhase = phases.find(p => p.id === phaseId);
    const currentSlide = currentPhase?.slides.find(s => s.id === slideId);
    if (currentSlide?.activities) {
      saveGenerationHistory(phaseId, slideId, 'activities', currentSlide.activities, 'regenerate');
    }
    
    setTimeout(() => {
      setPhases(prevPhases => prevPhases.map(phase => {
        if (phase.id !== phaseId) return phase;
        return {
          ...phase,
          slides: phase.slides.map(slide => {
            if (slide.id !== slideId) return slide;
            const generatedActivity = prompt
              ? `根据提示词"${prompt}"生成的教学活动：\n1. 准备阶段：准备相关教具和材料\n2. 导入环节：通过提问或游戏引入主题\n3. 活动实施：组织学生参与互动活动\n4. 总结反思：引导学生总结活动收获\n（AI生成于 ${new Date().toLocaleTimeString()}）`
              : `1. 准备阶段：准备相关教具和材料\n2. 导入环节：通过提问或游戏引入主题\n3. 活动实施：组织学生参与互动活动\n4. 总结反思：引导学生总结活动收获\n（AI生成于 ${new Date().toLocaleTimeString()}）`;
            return { ...slide, activities: generatedActivity };
          })
        };
      }));
      setGeneratingMedia(prev => ({ ...prev, [key]: false }));
      setShowRegenerateModal(null);
    }, 2000);
  };

  // 重新生成讲稿（带提示词）
  const handleRegenerateScript = (phaseId, slideId, prompt = '') => {
    const key = `${slideId}-script`;
    setGeneratingMedia(prev => ({ ...prev, [key]: true }));
    
    // 保存当前内容到历史
    const currentPhase = phases.find(p => p.id === phaseId);
    const currentSlide = currentPhase?.slides.find(s => s.id === slideId);
    if (currentSlide?.script) {
      saveGenerationHistory(phaseId, slideId, 'script', currentSlide.script, 'regenerate');
    }
    
    setTimeout(() => {
      setPhases(prevPhases => prevPhases.map(phase => {
        if (phase.id !== phaseId) return phase;
        return {
          ...phase,
          slides: phase.slides.map(slide => {
            if (slide.id !== slideId) return slide;
            const generatedScript = prompt
              ? `根据提示词"${prompt}"生成的讲稿：\n\n同学们，今天我们要学习一个非常有趣的主题。首先，让我们一起来观察一下...\n\n通过这个活动，我希望大家能够...\n\n现在，让我们开始吧！\n（AI生成于 ${new Date().toLocaleTimeString()}）`
              : `同学们，今天我们要学习一个非常有趣的主题。首先，让我们一起来观察一下...\n\n通过这个活动，我希望大家能够...\n\n现在，让我们开始吧！\n（AI生成于 ${new Date().toLocaleTimeString()}）`;
            return { ...slide, script: generatedScript };
          })
        };
      }));
      setGeneratingMedia(prev => ({ ...prev, [key]: false }));
      setShowRegenerateModal(null);
    }, 2000);
  };

  // 重新生成本环节（带提示词）
  const handleRegenerateSession = (phaseId, slideId, prompt = '') => {
    const key = `${slideId}-session`;
    setGeneratingMedia(prev => ({ ...prev, [key]: true }));
    
    // 保存当前环节到历史
    saveSessionHistory(phaseId, slideId);
    
    setTimeout(() => {
      setPhases(prevPhases => prevPhases.map(phase => {
        if (phase.id !== phaseId) return phase;
        return {
          ...phase,
          slides: phase.slides.map(slide => {
            if (slide.id !== slideId) return slide;
            return {
              ...slide,
              title: prompt ? `AI生成：${prompt.substring(0, 20)}...` : `新环节 ${new Date().toLocaleTimeString()}`,
              activities: prompt 
                ? `根据提示词"${prompt}"生成的教学活动：\n1. 准备阶段\n2. 导入环节\n3. 活动实施\n4. 总结反思\n（AI生成于 ${new Date().toLocaleTimeString()}）`
                : `1. 准备阶段\n2. 导入环节\n3. 活动实施\n4. 总结反思\n（AI生成于 ${new Date().toLocaleTimeString()}）`,
              script: prompt
                ? `根据提示词"${prompt}"生成的讲稿：\n\n同学们，今天我们要学习一个非常有趣的主题...\n（AI生成于 ${new Date().toLocaleTimeString()}）`
                : `同学们，今天我们要学习一个非常有趣的主题...\n（AI生成于 ${new Date().toLocaleTimeString()}）`,
              objectives: prompt
                ? `根据提示词"${prompt}"生成的教学目标：\n1. 理解核心概念\n2. 掌握关键技能\n3. 培养思维能力\n（AI生成于 ${new Date().toLocaleTimeString()}）`
                : `1. 理解核心概念\n2. 掌握关键技能\n3. 培养思维能力\n（AI生成于 ${new Date().toLocaleTimeString()}）`
            };
          })
        };
      }));
      setGeneratingMedia(prev => ({ ...prev, [key]: false }));
      setShowRegenerateModal(null);
    }, 2000);
  };

  // 处理重新生成确认（带提示词）
  const handleConfirmRegenerate = (prompt) => {
    if (!showRegenerateModal) return;
    const { phaseId, slideId, field } = showRegenerateModal;
    
    if (field === 'activity') {
      handleRegenerateActivity(phaseId, slideId, prompt);
    } else if (field === 'objectives') {
      handleRegenerateObjectives(phaseId, slideId, prompt);
    } else if (field === 'script') {
      handleRegenerateScript(phaseId, slideId, prompt);
    } else if (field === 'session') {
      handleRegenerateSession(phaseId, slideId, prompt);
    }
  };

  // 显示添加PPT提示词输入模态框
  const handleAddPPT = (phaseId, slideId) => {
    setShowAddPPTPromptModal({ phaseId, slideId });
  };

  // 确认添加PPT页面（带提示词）
  const handleConfirmAddPPT = (prompt) => {
    if (!showAddPPTPromptModal) return;
    
    const { phaseId, slideId } = showAddPPTPromptModal;
    setIsGeneratingPPT(true);
    
    // 模拟AI生成PPT
    setTimeout(() => {
      const randomColor = Math.floor(Math.random()*16777215).toString(16);
      const generatedImage = prompt 
        ? `https://placehold.co/600x400/${randomColor}/FFF?text=AI+PPT+${encodeURIComponent(prompt.substring(0, 10))}+${Date.now().toString().slice(-4)}`
        : `https://placehold.co/600x400/${randomColor}/FFF?text=PPT+${Date.now().toString().slice(-4)}`;
      
      const newPPT = {
        id: `ppt-${slideId}-${Date.now()}`,
        image: generatedImage,
        timestamp: Date.now(),
        prompt: prompt || ''
      };
      
      setPhases(prevPhases => prevPhases.map(phase => {
        if (phase.id !== phaseId) return phase;
        return {
          ...phase,
          slides: phase.slides.map(slide => {
            if (slide.id !== slideId) return slide;
            return {
              ...slide,
              pptSlides: [...(slide.pptSlides || []), newPPT]
            };
          })
        };
      }));
      
      setIsGeneratingPPT(false);
      setShowAddPPTPromptModal(null);
    }, 2000);
  };

  // 删除PPT页面
  const handleDeletePPT = (phaseId, slideId, pptId) => {
    if (!confirm('确定要删除这个PPT页面吗？')) {
      return;
    }
    
    setPhases(prevPhases => prevPhases.map(phase => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        slides: phase.slides.map(slide => {
          if (slide.id !== slideId) return slide;
          return {
            ...slide,
            pptSlides: (slide.pptSlides || []).filter(ppt => ppt.id !== pptId)
          };
        })
      };
    }));
  };

  // 删除阅读材料
  const handleDeleteReadingMaterial = (phaseId, slideId, materialId) => {
    if (!confirm('确定要删除这个阅读材料吗？')) {
      return;
    }
    
    setPhases(prevPhases => prevPhases.map(phase => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        slides: phase.slides.map(slide => {
          if (slide.id !== slideId) return slide;
          return {
            ...slide,
            readingMaterials: (slide.readingMaterials || []).filter(material => material.id !== materialId)
          };
        })
      };
    }));
  };

  // 显示重新生成PPT提示词输入模态框
  const handleRegeneratePPT = (phaseId, slideId) => {
    setShowRegeneratePPTPromptModal({ phaseId, slideId });
  };

  // 确认重新生成PPT（带提示词）
  const handleConfirmRegeneratePPT = (prompt) => {
    if (!showRegeneratePPTPromptModal) return;
    
    const { phaseId, slideId } = showRegeneratePPTPromptModal;
    setIsRegeneratingPPT(true);
    
    // 模拟AI重新生成PPT
    setTimeout(() => {
      const randomColor = Math.floor(Math.random()*16777215).toString(16);
      const generatedImage = prompt 
        ? `https://placehold.co/600x400/${randomColor}/FFF?text=AI+Regen+PPT+${encodeURIComponent(prompt.substring(0, 10))}+${Date.now().toString().slice(-4)}`
        : `https://placehold.co/600x400/${randomColor}/FFF?text=Regen+PPT+${Date.now().toString().slice(-4)}`;
      
      // 重新生成第一个PPT页面，如果没有则创建一个
      setPhases(prevPhases => prevPhases.map(phase => {
        if (phase.id !== phaseId) return phase;
        return {
          ...phase,
          slides: phase.slides.map(slide => {
            if (slide.id !== slideId) return slide;
            const pptSlides = slide.pptSlides || [];
            const updatedSlides = pptSlides.length > 0
              ? pptSlides.map((ppt, index) => 
                  index === 0 ? {
                    ...ppt,
                    image: generatedImage,
                    timestamp: Date.now(),
                    prompt: prompt || ''
                  } : ppt
                )
              : [{
                  id: `ppt-${slideId}-${Date.now()}`,
                  image: generatedImage,
                  timestamp: Date.now(),
                  prompt: prompt || ''
                }];
            
            return {
              ...slide,
              pptSlides: updatedSlides,
              image: updatedSlides[0]?.image || slide.image
            };
          })
        };
      }));
      
      setIsRegeneratingPPT(false);
      setShowRegeneratePPTPromptModal(null);
    }, 2000);
  };

  // 显示重新生成阅读材料提示词输入模态框
  const handleRegenerateReadingMaterial = (phaseId, slideId) => {
    setShowRegenerateReadingMaterialPromptModal({ phaseId, slideId });
  };

  // 确认重新生成阅读材料（带提示词）
  const handleConfirmRegenerateReadingMaterial = (prompt) => {
    if (!showRegenerateReadingMaterialPromptModal) return;
    
    const { phaseId, slideId } = showRegenerateReadingMaterialPromptModal;
    setIsRegeneratingReadingMaterial(true);
    
    // 模拟AI重新生成阅读材料
    setTimeout(() => {
      const slide = phases.find(p => p.id === phaseId)?.slides.find(s => s.id === slideId);
      if (!slide) {
        setIsRegeneratingReadingMaterial(false);
        setShowRegenerateReadingMaterialPromptModal(null);
        return;
      }

      const randomColor = Math.floor(Math.random()*16777215).toString(16);
      const materialTitle = prompt 
        ? `AI重新生成：${prompt.substring(0, 20)}...` 
        : `${slide.title} - 阅读材料`;
      const thumbnailText = `Reading${Date.now().toString().slice(-4)}`;
      
      const newReadingMaterial = generateSampleReadingMaterial(slide, 0);
      newReadingMaterial.title = materialTitle;
      newReadingMaterial.thumbnail = `https://placehold.co/200x267/${randomColor}/FFFFFF?text=${encodeURIComponent(thumbnailText)}`;
      newReadingMaterial.pages[0].title = materialTitle;
      
      // 重新生成第一个阅读材料，如果没有则创建一个
      setPhases(prevPhases => prevPhases.map(phase => {
        if (phase.id !== phaseId) return phase;
        return {
          ...phase,
          slides: phase.slides.map(slide => {
            if (slide.id !== slideId) return slide;
            const readingMaterials = slide.readingMaterials || [];
            const updatedMaterials = readingMaterials.length > 0
              ? readingMaterials.map((material, index) => 
                  index === 0 ? newReadingMaterial : material
                )
              : [newReadingMaterial];
            
            return {
              ...slide,
              readingMaterials: updatedMaterials
            };
          })
        };
      }));
      
      setIsRegeneratingReadingMaterial(false);
      setShowRegenerateReadingMaterialPromptModal(null);
    }, 2000);
  };


  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />
      
      {/* 工具栏 */}
      {/* <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistoryView(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <History className="w-4 h-4" />
            历史版本
          </button>
          <div className="text-xs text-slate-400">
            版本 {currentVersionIndex + 1} / {historyVersions.length || 1}
          </div>
        </div>
      </div> */}

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-[1600px] mx-auto space-y-8">
           {phases.map((phase) => {
             return (
               <div key={phase.id} className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden group/phase">
                 <div className={`p-4 border-b border-slate-100 flex justify-between items-center ${phase.color.replace('text-', 'bg-opacity-10 ')}`}>
                    <div className="flex items-center gap-2 flex-1">
                        <BookmarkIcon phase={phase.id.split('-')[0]} />
                        <input type="text" value={phase.label} onChange={(e) => handleEditPhaseLabel(phase.id, e.target.value)} className={`text-lg font-bold bg-transparent outline-none w-full ${phase.color}`} />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="text-xs font-medium px-2 py-1 bg-white/50 rounded-full text-slate-500">{phase.slides.length} 个环节</div>
                        <button 
                          onClick={() => setShowPhaseHistoryModal({ phaseId: phase.id })} 
                          className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-white/50 rounded transition-colors flex items-center gap-1"
                          title="历史生成阶段"
                        >
                          <History className="w-3.5 h-3.5" />
                          历史生成
                        </button>
                        <button 
                          onClick={() => setShowRegeneratePhaseModal({ phaseId: phase.id })} 
                          className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-orange-600 hover:bg-white/50 rounded transition-colors flex items-center gap-1"
                          title="重新生成阶段"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          重新生成
                        </button>
                        <button onClick={() => handleDeletePhase(phase.id)} className="p-1.5 hover:bg-white/50 text-red-400 hover:text-red-600 rounded transition-colors opacity-0 group-hover/phase:opacity-100" title="删除整个阶段"><Trash2 className="w-4 h-4" /></button>
                    </div>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                     <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                       <tr>
                           <th className="p-4 w-20">时长</th>
                           <th className="p-4 w-28">环节</th>
                           <th className="p-4 w-40">教学活动</th>
                           <th className="p-4 w-40">讲稿</th>
                           <th className="p-4 w-48">PPT内容 (缩略图)</th>
                           <th className="p-4 w-48">阅读材料</th>
                           <th className="p-4 w-12 text-center">操作</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                       {phase.slides.length > 0 ? (
                         phase.slides.map((slide) => (
                           <tr key={slide.id} className="hover:bg-slate-50 group transition-colors">
                             {/* 时长 */}
                             <td className="p-4 align-top"><input value={slide.duration} onChange={(e) => updateSlideField(phase.id, slide.id, 'duration', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-blue-400 outline-none font-medium text-blue-600 transition-colors" placeholder="时长"/></td>
                             
                             {/* 环节标题 */}
                             <td className="p-4 align-top"><textarea value={slide.title} onChange={(e) => updateSlideField(phase.id, slide.id, 'title', e.target.value)} className="w-full bg-transparent text-xs font-bold text-slate-700 resize-none outline-none focus:bg-white rounded" rows={2} placeholder="小标题..."/></td>
                             
                             {/* 教学活动 (含目标) */}
                             <td className="p-4 align-top">
                                <div className="space-y-2">
                                    <div className="relative">
                                      <div className="flex items-start gap-1 mb-1">
                                        <textarea 
                                          value={slide.activities} 
                                          onChange={(e) => updateSlideField(phase.id, slide.id, 'activities', e.target.value)} 
                                          onClick={() => setSelectedField({ phaseId: phase.id, slideId: slide.id, field: 'activity' })}
                                          className={`flex-1 bg-transparent border border-transparent focus:border-blue-200 focus:bg-white rounded p-1 resize-none text-slate-700 leading-relaxed whitespace-pre-wrap transition-colors text-xs ${selectedField?.phaseId === phase.id && selectedField?.slideId === slide.id && selectedField?.field === 'activity' ? 'ring-2 ring-purple-300' : ''}`}
                                          rows={6} 
                                          placeholder="详细的活动步骤..."
                                        />
                                        <div className="flex flex-col gap-1 pt-1">
                                          <button 
                                            onClick={() => setShowHistoryModal({ phaseId: phase.id, slideId: slide.id, field: 'activities' })} 
                                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                            title="历史生成"
                                          >
                                            <History className="w-3.5 h-3.5" />
                                          </button>
                                          <button 
                                            onClick={() => setShowRegenerateModal({ phaseId: phase.id, slideId: slide.id, field: 'activity' })} 
                                            disabled={generatingMedia[`${slide.id}-activity`]}
                                            className="p-1 text-slate-400 hover:text-purple-600 transition-colors disabled:opacity-50"
                                            title="重新生成"
                                          >
                                            <RefreshCw className={`w-3.5 h-3.5 ${generatingMedia[`${slide.id}-activity`] ? 'animate-spin' : ''}`} />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="pt-1 border-t border-slate-100">
                                        <div className="flex items-center justify-between mb-1">
                                          <label className="text-[10px] text-slate-400 font-bold uppercase">教学目标</label>
                                        </div>
                                        <div className="flex items-start gap-1">
                                          <textarea 
                                            value={slide.objectives} 
                                            onChange={(e) => updateSlideField(phase.id, slide.id, 'objectives', e.target.value)} 
                                            onClick={() => setSelectedField({ phaseId: phase.id, slideId: slide.id, field: 'objectives' })}
                                            className={`flex-1 bg-transparent text-xs text-slate-500 resize-none outline-none focus:bg-white rounded ${selectedField?.phaseId === phase.id && selectedField?.slideId === slide.id && selectedField?.field === 'objectives' ? 'ring-2 ring-blue-300' : ''}`}
                                            rows={3} 
                                            placeholder="输入教学目标..."
                                          />
                                          <div className="flex flex-col gap-1 pt-1">
                                            <button 
                                              onClick={() => setShowHistoryModal({ phaseId: phase.id, slideId: slide.id, field: 'objectives' })} 
                                              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                              title="历史生成"
                                            >
                                              <History className="w-3.5 h-3.5" />
                                            </button>
                                            <button 
                                              onClick={() => setShowRegenerateModal({ phaseId: phase.id, slideId: slide.id, field: 'objectives' })} 
                                              disabled={generatingMedia[`${slide.id}-objectives`]}
                                              className="p-1 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                                              title="重新生成"
                                            >
                                              <RefreshCw className={`w-3.5 h-3.5 ${generatingMedia[`${slide.id}-objectives`] ? 'animate-spin' : ''}`} />
                                            </button>
                                          </div>
                                        </div>
                                    </div>
                                </div>
                             </td>

                             {/* 讲稿 (新列) */}
                             <td className="p-4 align-top">
                                <div className="relative">
                                  <div className="flex items-start gap-1">
                                    <textarea 
                                      value={slide.script} 
                                      onChange={(e) => updateSlideField(phase.id, slide.id, 'script', e.target.value)} 
                                      onClick={() => setSelectedField({ phaseId: phase.id, slideId: slide.id, field: 'script' })}
                                      className={`flex-1 bg-slate-100/50 border border-slate-200 focus:border-blue-300 focus:bg-white rounded p-2 resize-none text-xs text-slate-600 leading-relaxed transition-colors h-full min-h-[120px] ${selectedField?.phaseId === phase.id && selectedField?.slideId === slide.id && selectedField?.field === 'script' ? 'ring-2 ring-green-300' : ''}`}
                                      placeholder="输入教师讲稿..."
                                    />
                                    <div className="flex flex-col gap-1 pt-2">
                                      <button 
                                        onClick={() => setShowHistoryModal({ phaseId: phase.id, slideId: slide.id, field: 'script' })} 
                                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                        title="历史生成"
                                      >
                                        <History className="w-3.5 h-3.5" />
                                      </button>
                                      <button 
                                        onClick={() => setShowRegenerateModal({ phaseId: phase.id, slideId: slide.id, field: 'script' })} 
                                        disabled={generatingMedia[`${slide.id}-script`]}
                                        className="p-1 text-slate-400 hover:text-green-600 transition-colors disabled:opacity-50"
                                        title="重新生成"
                                      >
                                        <RefreshCw className={`w-3.5 h-3.5 ${generatingMedia[`${slide.id}-script`] ? 'animate-spin' : ''}`} />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                             </td>

                             {/* PPT内容 (改为缩略图) - 支持多个PPT */}
                             <td className="p-4 align-top">
                                 <div className="space-y-2">
                                   {/* 显示所有PPT缩略图 */}
                                   {slide.pptSlides && slide.pptSlides.length > 0 ? (
                                     <>
                                       {slide.pptSlides.map((ppt, idx) => (
                                         <div key={ppt.id} className="relative group/media w-full aspect-video bg-slate-100 rounded-md border border-slate-200 overflow-hidden flex items-center justify-center">
                                           <img 
                                             src={ppt.image} 
                                             alt={`PPT ${idx + 1}`} 
                                             className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                                             onClick={() => handleNavigateToCanvasView(phase.id, slide.id)}
                                           />
                                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                             <button 
                                               onClick={() => handleNavigateToCanvasView(phase.id, slide.id)} 
                                               title="跳转到画布视图" 
                                               className="p-1.5 bg-white/20 text-white rounded hover:bg-white/40 backdrop-blur-sm"
                                             >
                                               <Layout className="w-3 h-3" />
                                             </button>
                                             <button onClick={() => setPreviewImage(ppt.image)} title="预览" className="p-1.5 bg-white/20 text-white rounded hover:bg-white/40 backdrop-blur-sm"><Maximize2 className="w-3 h-3" /></button>
                                             <button 
                                               onClick={(e) => {
                                                 e.stopPropagation();
                                                 handleDeletePPT(phase.id, slide.id, ppt.id);
                                               }} 
                                               title="删除PPT" 
                                               className="p-1.5 bg-red-500/80 text-white rounded hover:bg-red-600 backdrop-blur-sm"
                                             >
                                               <Trash2 className="w-3 h-3" />
                                             </button>
                                           </div>
                                           <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">PPT {idx + 1}</div>
                                         </div>
                                       ))}
                                       {/* 重新生成PPT按钮 */}
                                       {/* {slide.pptSlides && slide.pptSlides.length > 0 && (
                                         <button 
                                           onClick={() => handleRegeneratePPT(phase.id, slide.id)} 
                                           className="w-full py-1.5 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                                         >
                                           <RefreshCw className="w-4 h-4" />
                                           <span className="text-[10px]">重新生成PPT</span>
                                         </button>
                                       )} */}
                                       {/* 添加PPT按钮 */}
                                       <button 
                                         onClick={() => handleAddPPT(phase.id, slide.id)} 
                                         className="w-full py-1.5 text-xs text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1"
                                       >
                                         <Plus className="w-5 h-5" />
                                         <span className="text-[10px]">添加PPT页面</span>
                                       </button>
                                     </>
                                   ) : slide.image ? (
                                     <>
                                       <div className="relative group/media w-full aspect-video bg-slate-100 rounded-md border border-slate-200 overflow-hidden flex items-center justify-center">
                                         <img 
                                           src={slide.image} 
                                           alt="PPT Slide" 
                                           className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" 
                                           onClick={() => handleNavigateToCanvasView(phase.id, slide.id)}
                                         />
                                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                           <button 
                                             onClick={() => handleNavigateToCanvasView(phase.id, slide.id)} 
                                             title="跳转到画布视图" 
                                             className="p-1.5 bg-white/20 text-white rounded hover:bg-white/40 backdrop-blur-sm"
                                           >
                                             <Layout className="w-3 h-3" />
                                           </button>
                                           <button onClick={() => setPreviewImage(slide.image)} title="预览" className="p-1.5 bg-white/20 text-white rounded hover:bg-white/40 backdrop-blur-sm"><Maximize2 className="w-3 h-3" /></button>
                                           <button onClick={() => handleRegenerateMedia(phase.id, slide.id, 'image')} title="重新生成" className="p-1.5 bg-white/20 text-white rounded hover:bg-white/40 backdrop-blur-sm"><RefreshCw className="w-3 h-3" /></button>
                                         </div>
                                       </div>
                                       {/* 重新生成PPT按钮 */}
                                       <button 
                                         onClick={() => handleRegeneratePPT(phase.id, slide.id)} 
                                         className="w-full py-1.5 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                                       >
                                         <RefreshCw className="w-4 h-4" />
                                         <span className="text-[10px]">重新生成PPT</span>
                                       </button>
                                       {/* 添加PPT按钮 */}
                                       <button 
                                         onClick={() => handleAddPPT(phase.id, slide.id)} 
                                         className="w-full py-1.5 text-xs text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1"
                                       >
                                         <Plus className="w-5 h-5" />
                                         <span className="text-[10px]">添加PPT页面</span>
                                       </button>
                                     </>
                                   ) : (
                                     <button 
                                       onClick={() => handleRegenerateMedia(phase.id, slide.id, 'image')} 
                                       className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-500 transition-colors w-full aspect-video border border-dashed border-slate-300 rounded-md"
                                     >
                                       <ImageIcon className="w-6 h-6" />
                                       <span className="text-[10px]">生成PPT页面</span>
                                     </button>
                                   )}
                                   
                                 </div>
                             </td>

                             {/* 阅读材料列 */}
                             <td className="p-4 align-top">
                                 <div className="space-y-2">
                                   {/* 显示所有阅读材料缩略图 */}
                                   {slide.readingMaterials && slide.readingMaterials.length > 0 ? (
                                     slide.readingMaterials.map((material, idx) => (
                                       <div key={material.id} className="relative group/material w-full aspect-[3/4] bg-slate-100 rounded-md border border-slate-200 overflow-hidden flex items-center justify-center">
                                         {material.thumbnail ? (
                                           <>
                                             <img 
                                               src={material.thumbnail || `https://placehold.co/200x267/6366f1/FFFFFF?text=Reading${idx + 1}`} 
                                               alt={`阅读材料 ${idx + 1}`} 
                                               className="w-full h-full object-contain bg-white cursor-pointer hover:opacity-90 transition-opacity" 
                                               onClick={(e) => {
                                                 e.stopPropagation();
                                                 // 跳转到阅读材料画布模式
                                                 if (onNavigateToCanvas) {
                                                   onNavigateToCanvas({ 
                                                     phaseId: phase.id, 
                                                     slideId: slide.id, 
                                                     type: 'reading-material',
                                                     materialId: material.id,
                                                     material: material // 传递完整的阅读材料数据
                                                   });
                                                 }
                                               }}
                                               onError={(e) => {
                                                 // 如果图片加载失败，显示占位符
                                                 e.target.src = `https://placehold.co/200x267/6366f1/FFFFFF?text=Reading${idx + 1}`;
                                                 e.target.onerror = null; // 防止无限循环
                                               }}
                                             />
                                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/material:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                               <button 
                                                 onClick={() => {
                                                   if (onNavigateToCanvas) {
                                                     onNavigateToCanvas({ 
                                                       phaseId: phase.id, 
                                                       slideId: slide.id, 
                                                       type: 'reading-material',
                                                       materialId: material.id,
                                                       material: material // 传递完整的阅读材料数据
                                                     });
                                                   }
                                                 }}
                                                 title="跳转到阅读材料画布" 
                                                 className="p-1.5 bg-white/20 text-white rounded hover:bg-white/40 backdrop-blur-sm"
                                               >
                                                 <FileText className="w-3 h-3" />
                                               </button>
                                               <button 
                                                 onClick={() => setPreviewImage(material.thumbnail)} 
                                                 title="预览" 
                                                 className="p-1.5 bg-white/20 text-white rounded hover:bg-white/40 backdrop-blur-sm"
                                               >
                                                 <Maximize2 className="w-3 h-3" />
                                               </button>
                                               <button 
                                                 onClick={(e) => {
                                                   e.stopPropagation();
                                                   handleDeleteReadingMaterial(phase.id, slide.id, material.id);
                                                 }} 
                                                 title="删除阅读材料" 
                                                 className="p-1.5 bg-red-500/80 text-white rounded hover:bg-red-600 backdrop-blur-sm"
                                               >
                                                 <Trash2 className="w-3 h-3" />
                                               </button>
                                             </div>
                                             <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">{idx + 1}/{slide.readingMaterials.length}</div>
                                           </>
                                         ) : (
                                           <div className="flex flex-col items-center gap-1 text-slate-400 relative w-full h-full">
                                             <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">{idx + 1}/{slide.readingMaterials.length}</div>
                                             <BookOpen className="w-6 h-6" />
                                             <span className="text-[10px]">阅读材料</span>
                                           </div>
                                         )}
                                       </div>
                                     ))
                                   ) : (
                                     <button 
                                       onClick={() => {
                                         // 显示提示词输入模态框
                                         setShowReadingMaterialPromptModal({ phaseId: phase.id, slideId: slide.id });
                                       }}
                                       className="flex flex-col items-center gap-1 text-slate-400 hover:text-indigo-500 transition-colors w-full aspect-[3/4] border border-dashed border-slate-300 rounded-md"
                                     >
                                       <BookOpen className="w-6 h-6" />
                                       <span className="text-[10px]">生成阅读材料</span>
                                     </button>
                                   )}
                                   
                                   {/* 重新生成阅读材料按钮 */}
                                   {/* {slide.readingMaterials && slide.readingMaterials.length > 0 && (
                                     <button
                                       onClick={() => handleRegenerateReadingMaterial(phase.id, slide.id)}
                                       className="w-full py-1.5 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                                     >
                                       <RefreshCw className="w-4 h-4" />
                                       <span className="text-[10px]">重新生成阅读材料</span>
                                     </button>
                                   )} */}
                                   {/* 添加更多阅读材料按钮 */}
                                   {slide.readingMaterials && slide.readingMaterials.length > 0 && (
                                     <button
                                       onClick={() => {
                                         // 显示提示词输入模态框
                                         setShowReadingMaterialPromptModal({ phaseId: phase.id, slideId: slide.id });
                                       }}
                                       className="w-full py-1.5 text-xs text-indigo-600 border border-indigo-200 rounded hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1"
                                     >
                                       <Plus className="w-3 h-3" />
                                       添加阅读材料
                                     </button>
                                   )}
                                 </div>
                             </td>

                             {/* 操作列 */}
                             <td className="p-4 align-top">
                               <div className="flex flex-col gap-2 items-center">
                                 <button 
                                   onClick={() => handleCopySlide(phase.id, slide.id)} 
                                   className="p-2 hover:bg-blue-50 text-slate-300 hover:text-blue-500 rounded transition-colors" 
                                   title="复制此环节"
                                 >
                                   <Copy className="w-4 h-4" />
                                 </button>
                                 <button 
                                   onClick={() => setShowHistorySessionModal({ phaseId: phase.id, slideId: slide.id })}
                                   className="p-2 rounded transition-colors hover:bg-blue-50 text-slate-300 hover:text-blue-500"
                                   title="历史生成环节"
                                 >
                                   <History className="w-4 h-4" />
                                 </button>
                                 <button 
                                   onClick={() => setShowRegenerateModal({ phaseId: phase.id, slideId: slide.id, field: 'session' })}
                                   disabled={generatingMedia[`${slide.id}-session`]}
                                   className="p-2 rounded transition-colors hover:bg-orange-50 text-slate-300 hover:text-orange-500 disabled:opacity-50"
                                   title="重新生成本环节"
                                 >
                                   <RefreshCw className={`w-4 h-4 ${generatingMedia[`${slide.id}-session`] ? 'animate-spin' : ''}`} />
                                 </button>
                                 <button 
                                   onClick={() => handleDeleteRow(phase.id, slide.id)} 
                                   className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-colors" 
                                   title="删除此行"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                               </div>
                             </td>
                           </tr>
                         ))
                       ) : (
                         <tr><td colSpan="7" className="p-8 text-center text-slate-400 text-sm">此阶段暂无教学环节，请点击下方按钮添加。</td></tr>
                       )}
                     </tbody>
                   </table>
                 </div>
                 <div className="p-3 border-t border-slate-100 bg-slate-50">
                    <button onClick={() => handleAddRow(phase.id)} className="w-full py-2 border border-dashed border-slate-300 rounded-md text-slate-400 text-xs font-bold hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"><Plus className="w-3 h-3" /> 添加 {phase.label.split(' ')[0]} 环节</button>
                 </div>
               </div>
             );
           })}
           <button onClick={handleAddPhase} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 font-bold hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"><Plus className="w-5 h-5" /> 添加新的课程阶段 (New Phase)</button>
        </div>
      </div>

      {/* 历史版本查看 - 侧边栏显示，不关闭当前版本 */}
      {showHistoryView && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute right-0 top-0 bottom-0 w-[50%] min-w-[600px] bg-white border-l-4 border-blue-500 shadow-2xl pointer-events-auto">
            <HistoryVersionView
              historyVersions={historyVersions}
              currentVersionIndex={currentVersionIndex}
              onSelectVersion={(index) => {
                // 查看历史版本时，不修改当前版本
                // 只有在点击"恢复此版本"按钮时才会应用数据
                setCurrentVersionIndex(index);
                // 注意：这里不应用数据，只有在handleRestore中才应用
              }}
              onRestore={(index) => {
                // 恢复版本时，实际应用数据
                if (historyVersions[index]) {
                  setPhases(JSON.parse(JSON.stringify(historyVersions[index].data)));
                  setCurrentVersionIndex(index);
                }
              }}
              onClose={() => setShowHistoryView(false)}
            />
          </div>
        </div>
      )}

      {/* 添加环节提示词输入模态框 */}
      {showAddRowPromptModal && (
        <PromptInputModal
          isOpen={!!showAddRowPromptModal}
          onClose={() => setShowAddRowPromptModal(null)}
          onConfirm={handleConfirmAddRow}
          title="添加教学环节"
          description="请输入AI生成提示词，描述你想要创建的教学环节"
          placeholder="例如：设计一个互动游戏环节，让学生学习颜色词汇..."
          type="session"
          isLoading={isGeneratingRow}
        />
      )}

      {/* 生成阅读材料提示词输入模态框 */}
      {showReadingMaterialPromptModal && (
        <PromptInputModal
          isOpen={!!showReadingMaterialPromptModal}
          onClose={() => setShowReadingMaterialPromptModal(null)}
          onConfirm={handleGenerateReadingMaterial}
          title="生成阅读材料"
          description="请输入AI生成提示词，描述你想要创建的阅读材料内容"
          placeholder="例如：创建一份关于动物主题的阅读材料，包含图片和练习题..."
          type="element"
          isLoading={isGeneratingReadingMaterial}
        />
      )}

      {/* 添加PPT页面提示词输入模态框 */}
      {showAddPPTPromptModal && (
        <PromptInputModal
          isOpen={!!showAddPPTPromptModal}
          onClose={() => setShowAddPPTPromptModal(null)}
          onConfirm={handleConfirmAddPPT}
          title="添加PPT页面"
          description="请输入AI生成提示词，描述你想要创建的PPT页面内容"
          placeholder="例如：创建一个关于颜色词汇的PPT页面，包含图片和文字..."
          type="element"
          isLoading={isGeneratingPPT}
        />
      )}

      {/* 重新生成PPT提示词输入模态框 */}
      {showRegeneratePPTPromptModal && (
        <PromptInputModal
          isOpen={!!showRegeneratePPTPromptModal}
          onClose={() => setShowRegeneratePPTPromptModal(null)}
          onConfirm={handleConfirmRegeneratePPT}
          title="重新生成PPT"
          description="请输入AI生成提示词，描述你想要重新生成的PPT页面内容（可选，留空将使用默认生成）"
          placeholder="例如：重新生成一个关于颜色词汇的PPT页面，包含图片和文字..."
          type="element"
          isLoading={isRegeneratingPPT}
        />
      )}

      {/* 重新生成阅读材料提示词输入模态框 */}
      {showRegenerateReadingMaterialPromptModal && (
        <PromptInputModal
          isOpen={!!showRegenerateReadingMaterialPromptModal}
          onClose={() => setShowRegenerateReadingMaterialPromptModal(null)}
          onConfirm={handleConfirmRegenerateReadingMaterial}
          title="重新生成阅读材料"
          description="请输入AI生成提示词，描述你想要重新生成的阅读材料内容（可选，留空将使用默认生成）"
          placeholder="例如：重新生成一个关于颜色词汇的阅读材料，包含图片和文字..."
          type="element"
          isLoading={isRegeneratingReadingMaterial}
        />
      )}

      {/* 重新生成提示词输入模态框 */}
      {showRegenerateModal && (
        <PromptInputModal
          isOpen={!!showRegenerateModal}
          onClose={() => setShowRegenerateModal(null)}
          onConfirm={handleConfirmRegenerate}
          title={`重新生成${getFieldDisplayName(showRegenerateModal.field)}`}
          description="请输入AI生成提示词，描述你想要生成的内容（可选，留空将使用默认生成）"
          placeholder={showRegenerateModal.field === 'activity' 
            ? '例如：设计一个互动游戏环节，让学生学习颜色词汇...'
            : showRegenerateModal.field === 'objectives'
            ? '例如：生成关于颜色认知的教学目标...'
            : showRegenerateModal.field === 'script'
            ? '例如：生成一段鼓励性的教师讲稿...'
            : '例如：生成一个完整的教学环节，包含活动、目标和讲稿...'}
          type="element"
          isLoading={generatingMedia[`${showRegenerateModal.slideId}-${showRegenerateModal.field === 'session' ? 'session' : showRegenerateModal.field}`]}
        />
      )}

      {/* 重新生成阶段提示词输入模态框 */}
      {showRegeneratePhaseModal && (
        <PromptInputModal
          isOpen={!!showRegeneratePhaseModal}
          onClose={() => setShowRegeneratePhaseModal(null)}
          onConfirm={(prompt) => handleRegeneratePhase(showRegeneratePhaseModal.phaseId, prompt)}
          title="重新生成阶段"
          description="请输入AI生成提示词，描述你想要重新生成的阶段内容（可选，留空将使用默认生成）"
          placeholder="例如：重新生成一个关于颜色教学的阶段，包含多个互动环节..."
          type="session"
          isLoading={false}
        />
      )}

      {/* 历史生成列表模态框 */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">
                    历史生成列表 - {getFieldDisplayName(showHistoryModal.field)}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {phases.find(p => p.id === showHistoryModal.phaseId)?.slides.find(s => s.id === showHistoryModal.slideId)?.title || '当前环节'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowHistoryModal(null)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {generationHistory
                .filter(h => 
                  h.phaseId === showHistoryModal.phaseId && 
                  h.slideId === showHistoryModal.slideId && 
                  h.field === showHistoryModal.field
                )
                .length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无历史生成记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {generationHistory
                    .filter(h => 
                      h.phaseId === showHistoryModal.phaseId && 
                      h.slideId === showHistoryModal.slideId && 
                      h.field === showHistoryModal.field
                    )
                    .map((historyItem, index) => (
                      <div 
                        key={historyItem.id} 
                        className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-slate-500">
                                {historyItem.displayTime}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                                {historyItem.type === 'regenerate' ? '重新生成' : '生成'}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRestoreHistory(historyItem)}
                            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            恢复
                          </button>
                        </div>
                        <div className="bg-slate-50 rounded p-3 text-xs text-slate-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {historyItem.content || '(空内容)'}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 阶段历史生成列表模态框 */}
      {showPhaseHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">
                    历史生成列表 - 阶段
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {phases.find(p => p.id === showPhaseHistoryModal.phaseId)?.label || '当前阶段'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowPhaseHistoryModal(null)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {phaseGenerationHistory
                .filter(h => h.phaseId === showPhaseHistoryModal.phaseId)
                .length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无历史生成记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {phaseGenerationHistory
                    .filter(h => h.phaseId === showPhaseHistoryModal.phaseId)
                    .map((historyItem, index) => (
                      <div 
                        key={historyItem.id} 
                        className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-slate-500">
                                版本 {index + 1}
                              </span>
                              <span className="text-xs text-slate-400">
                                {historyItem.displayTime}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 mt-2">
                              包含 {historyItem.data.slides.length} 个环节
                            </div>
                          </div>
                          <button
                            onClick={() => handleRestorePhaseHistory(historyItem)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                          >
                            恢复此版本
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 环节历史生成列表模态框 */}
      {showHistorySessionModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">
                    历史生成列表 - 环节
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {phases.find(p => p.id === showHistorySessionModal.phaseId)?.slides.find(s => s.id === showHistorySessionModal.slideId)?.title || '当前环节'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowHistorySessionModal(null)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {generationHistory
                .filter(h => 
                  h.phaseId === showHistorySessionModal.phaseId && 
                  h.slideId === showHistorySessionModal.slideId &&
                  h.data // 环节历史记录有data字段
                )
                .length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无历史生成记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {generationHistory
                    .filter(h => 
                      h.phaseId === showHistorySessionModal.phaseId && 
                      h.slideId === showHistorySessionModal.slideId &&
                      h.data
                    )
                    .map((historyItem, index) => (
                      <div 
                        key={historyItem.id} 
                        className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium text-slate-500">
                                版本 {index + 1}
                              </span>
                              <span className="text-xs text-slate-400">
                                {historyItem.displayTime}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600 mt-2">
                              标题: {historyItem.data.title || '(无标题)'}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRestoreSessionHistory(historyItem)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded transition-colors"
                          >
                            恢复此版本
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 生成模态框 */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600 p-2 rounded-lg text-white">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">
                    {showGenerateModal.type === 'activity' ? '生成教学活动' : 
                     showGenerateModal.type === 'script' ? '生成讲稿' : '生成教学环节'}
                  </h3>
                </div>
              </div>
              <button onClick={() => { setShowGenerateModal(null); setGeneratePrompt(''); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">提示词（可选）</label>
                <textarea
                  value={generatePrompt}
                  onChange={(e) => setGeneratePrompt(e.target.value)}
                  placeholder="输入你的需求，例如：'设计一个互动游戏环节' 或 '生成一段鼓励性讲稿'"
                  className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none h-24"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowGenerateModal(null); setGeneratePrompt(''); }}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => handleGenerate(showGenerateModal.type, showGenerateModal.phaseId, showGenerateModal.slideId)}
                  disabled={generatingMedia[`${showGenerateModal.slideId}-${showGenerateModal.type}`]}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {generatingMedia[`${showGenerateModal.slideId}-${showGenerateModal.type}`] ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      开始生成
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};