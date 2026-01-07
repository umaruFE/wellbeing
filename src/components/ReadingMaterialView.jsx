import React, { useState } from 'react';
import { 
  FileText, 
  Download,
  RefreshCw,
  BookOpen,
  Wand2,
  FileDown,
  Sparkles,
  Eye
} from 'lucide-react';
import { WORD_DOC_DATA } from '../constants';
import { ReadingMaterialEditor } from './ReadingMaterialEditor';

export const ReadingMaterialView = () => {
  const [selectedSlides, setSelectedSlides] = useState(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationText, setGenerationText] = useState('');
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [readingMaterialPages, setReadingMaterialPages] = useState([]);
  const [editingPageIndex, setEditingPageIndex] = useState(null);

  // 按阶段组织幻灯片
  const phases = [
    { id: 'Engage', label: 'Engage (引入)', color: 'bg-purple-50 border-purple-200 text-purple-800', slides: WORD_DOC_DATA.filter(s => s.phase.includes('Engage')) },
    { id: 'Empower', label: 'Empower (赋能)', color: 'bg-blue-50 border-blue-200 text-blue-800', slides: WORD_DOC_DATA.filter(s => s.phase.includes('Empower')) },
    { id: 'Execute', label: 'Execute (实践/产出)', color: 'bg-green-50 border-green-200 text-green-800', slides: WORD_DOC_DATA.filter(s => s.phase.includes('Execute')) },
    { id: 'Elevate', label: 'Elevate (升华)', color: 'bg-yellow-50 border-yellow-200 text-yellow-800', slides: WORD_DOC_DATA.filter(s => s.phase.includes('Elevate')) }
  ];

  const toggleSlideSelection = (slideId) => {
    setSelectedSlides(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slideId)) {
        newSet.delete(slideId);
      } else {
        newSet.add(slideId);
      }
      return newSet;
    });
  };

  const togglePhaseSelection = (phaseId) => {
    const phase = phases.find(p => p.id === phaseId);
    if (!phase) return;
    
    const phaseSlideIds = new Set(phase.slides.map(s => s.id));
    const allSelected = phase.slides.every(s => selectedSlides.has(s.id));
    
    setSelectedSlides(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        phaseSlideIds.forEach(id => newSet.delete(id));
      } else {
        phaseSlideIds.forEach(id => newSet.add(id));
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const allIds = WORD_DOC_DATA.map(s => s.id);
    setSelectedSlides(new Set(allIds));
  };

  const deselectAll = () => {
    setSelectedSlides(new Set());
  };

  const handleGeneratePDF = () => {
    if (selectedSlides.size === 0) {
      alert('请至少选择一个 PPT 页面！');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGeneratedPdfUrl(null);

    const selectedSlidesData = WORD_DOC_DATA.filter(s => selectedSlides.has(s.id));
    
    const stages = [
      { p: 10, t: '正在分析选中的 PPT 页面...' },
      { p: 40, t: '转化布局为画布模式...' },
      { p: 70, t: 'AI 正在生成图文内容...' },
      { p: 95, t: '准备可视化编辑器...' },
      { p: 100, t: '生成完成！' }
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage >= stages.length) {
        clearInterval(interval);
        setIsGenerating(false);
        
        // 生成阅读材料页面数据（适配 Canvas Assets 格式）
        // A4比例：210mm × 297mm ≈ 0.707:1，使用 800px × 1131px
        const PAGE_WIDTH = 800;
        const PAGE_HEIGHT = 1131;
        const PADDING = 40;

        const generatedPages = selectedSlidesData.map((slide, index) => {
          // 简单的自动布局逻辑
          const assets = [];
          let currentY = PADDING;

          // 1. 标题 Asset
          assets.push({
            id: `title-${slide.id}`,
            type: 'text',
            title: '标题',
            content: slide.title,
            x: PADDING,
            y: currentY,
            width: PAGE_WIDTH - (PADDING * 2),
            height: 60,
            rotation: 0,
            fontSize: 28,
            fontWeight: 'bold',
            textAlign: 'center',
            prompt: ''
          });
          currentY += 80;

          // 2. 图片 Asset (如果有)
          if (slide.image) {
            assets.push({
              id: `img-${slide.id}`,
              type: 'image',
              title: '主图',
              url: slide.image,
              content: '',
              x: PADDING,
              y: currentY,
              width: PAGE_WIDTH - (PADDING * 2),
              height: 350,
              rotation: 0,
              prompt: ''
            });
            currentY += 370;
          }

          // 3. 讲稿/正文 Asset
          const scriptContent = slide.script || slide.activities || '暂无内容';
          assets.push({
            id: `text-${slide.id}`,
            type: 'text',
            title: '文本1',
            content: scriptContent,
            x: PADDING,
            y: currentY,
            width: PAGE_WIDTH - (PADDING * 2),
            height: Math.min(200, scriptContent.length / 20 * 20),
            rotation: 0,
            fontSize: 16,
            prompt: ''
          });
          currentY += Math.min(220, scriptContent.length / 20 * 20 + 20);

          // 4. 活动说明 Asset (如果有)
          if (slide.activities && slide.activities !== scriptContent) {
            assets.push({
              id: `activity-${slide.id}`,
              type: 'text',
              title: '文本2',
              content: slide.activities,
              x: PADDING,
              y: currentY,
              width: PAGE_WIDTH - (PADDING * 2),
              height: 120,
              rotation: 0,
              fontSize: 14,
              prompt: ''
            });
            currentY += 140;
          }

          // 5. 教学目标 Asset
          assets.push({
            id: `obj-${slide.id}`,
            type: 'text',
            title: '文本3',
            content: `【教学目标】\n${slide.objectives || '暂无'}`,
            x: PADDING,
            y: PAGE_HEIGHT - 100,
            width: PAGE_WIDTH - (PADDING * 2),
            height: 80,
            rotation: 0,
            fontSize: 13,
            prompt: ''
          });

          // 6. 添加装饰性元素（可选）
          if (index % 2 === 0) {
            assets.push({
              id: `decoration-${slide.id}`,
              type: 'image',
              title: '装饰图',
              url: `https://placehold.co/200x100/4f46e5/FFF?text=Decoration+${index + 1}`,
              content: '',
              x: PAGE_WIDTH - 220,
              y: PAGE_HEIGHT - 90,
              width: 180,
              height: 70,
              rotation: 0,
              prompt: ''
            });
          }

          return {
            id: `page-${slide.id}`,
            slideId: slide.id,
            pageNumber: index + 1,
            title: slide.title,
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            canvasAssets: assets, // 使用canvasAssets字段
            blocks: [] // 保留blocks字段以兼容
          };
        });
        
        setReadingMaterialPages(generatedPages);
        setIsEditing(true);
        setEditingPageIndex(0); // 自动进入第一页的编辑模式
        setGeneratedPdfUrl('https://example.com/generated-reading-material.pdf');
        return;
      }
      setGenerationProgress(stages[currentStage].p);
      setGenerationText(stages[currentStage].t);
      currentStage++;
    }, 600);
  };

  const handleDownloadPDF = () => {
    if (generatedPdfUrl) {
      const link = document.createElement('a');
      link.href = generatedPdfUrl;
      link.download = '阅读辅助材料.pdf';
      link.click();
    }
  };


  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden h-full">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 shrink-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">生成阅读材料</h1>
                <p className="text-sm text-slate-500">AI 自动排版，支持画布模式自由编辑</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isEditing && (
                <>
                  <button onClick={selectAll} className="px-4 py-2 text-sm text-slate-600 hover:text-blue-600 border border-slate-200 rounded-lg transition-colors">全选</button>
                  <button onClick={deselectAll} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg transition-colors">取消全选</button>
                </>
              )}
              
              {!isEditing ? (
                <button 
                  onClick={handleGeneratePDF} 
                  disabled={isGenerating || selectedSlides.size === 0}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-sm disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isGenerating ? <><RefreshCw className="w-4 h-4 animate-spin" /> 生成中...</> : <><Wand2 className="w-4 h-4" /> 生成 PDF 阅读材料</>}
                </button>
              ) : (
                <>
                  <button 
                    onClick={() => { setIsEditing(false); setReadingMaterialPages([]); }}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg font-medium flex items-center gap-2 transition-colors"
                  >
                    <Eye className="w-4 h-4" /> 返回选择
                  </button>
                  <button 
                    onClick={handleDownloadPDF}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-sm transition-colors"
                  >
                    <FileDown className="w-4 h-4" /> 导出 PDF
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-500" /> {generationText}</span>
                <span className="text-indigo-600 font-bold">{generationProgress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out" style={{ width: `${generationProgress}%` }}></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto flex flex-col">
        {isEditing && readingMaterialPages.length > 0 ? (
          <div className="p-6">
            <ReadingMaterialEditor
              pages={readingMaterialPages}
              onPagesChange={setReadingMaterialPages}
              editingPageIndex={editingPageIndex}
              onEditingPageIndexChange={setEditingPageIndex}
            />
          </div>
        ) : (
          /* Selection Mode - Phase Selection */
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {phases.map((phase) => {
                const phaseSlideIds = phase.slides.map(s => s.id);
                const allSelected = phase.slides.length > 0 && phase.slides.every(s => selectedSlides.has(s.id));
                const someSelected = phase.slides.some(s => selectedSlides.has(s.id));

                return (
                  <div key={phase.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    {/* Phase Header */}
                    <div className={`p-4 border-b border-slate-100 flex items-center justify-between ${phase.color.replace('text-', 'bg-opacity-10 ')}`}>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => togglePhaseSelection(phase.id)}
                          className="flex items-center justify-center w-5 h-5 border-2 rounded border-slate-300 hover:border-indigo-500 transition-colors"
                        >
                          {allSelected ? (
                            <div className="w-full h-full bg-indigo-600 rounded flex items-center justify-center"><span className="text-white text-xs">✓</span></div>
                          ) : someSelected ? (
                            <div className="w-full h-full bg-indigo-200 rounded"></div>
                          ) : null}
                        </button>
                        <h2 className="text-lg font-bold">{phase.label}</h2>
                        <span className="text-sm text-slate-500">({phase.slides.filter(s => selectedSlides.has(s.id)).length} / {phase.slides.length} 已选择)</span>
                      </div>
                    </div>

                    {/* Slides List */}
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {phase.slides.map((slide) => {
                          const isSelected = selectedSlides.has(slide.id);
                          return (
                            <div
                              key={slide.id}
                              onClick={() => toggleSlideSelection(slide.id)}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 w-5 h-5 border-2 rounded mt-0.5 flex items-center justify-center ${isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'}`}>
                                  {isSelected && <span className="text-white text-xs">✓</span>}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">{slide.duration}</span>
                                    {slide.image && <div className="w-8 h-6 bg-slate-200 rounded overflow-hidden"><img src={slide.image} alt="" className="w-full h-full object-cover" /></div>}
                                  </div>
                                  <h3 className="font-bold text-sm text-slate-800 mb-1 line-clamp-2">{slide.title}</h3>
                                  <p className="text-xs text-slate-600 line-clamp-2 mb-2">{slide.script?.substring(0, 60)}...</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};