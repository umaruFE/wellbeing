import React, { useState } from 'react';
import { 
  FileText, 
  Download,
  CheckSquare,
  Square,
  RefreshCw,
  BookOpen,
  Wand2,
  FileDown,
  Sparkles
} from 'lucide-react';
import { WORD_DOC_DATA } from '../constants';

export const ReadingMaterialView = () => {
  const [selectedSlides, setSelectedSlides] = useState(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationText, setGenerationText] = useState('');
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState(null);

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
        // 取消选择该阶段的所有幻灯片
        phaseSlideIds.forEach(id => newSet.delete(id));
      } else {
        // 选择该阶段的所有幻灯片
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
      { p: 25, t: '提取视觉画面内容...' },
      { p: 40, t: '整合讲稿文本信息...' },
      { p: 55, t: '分析教学目标与重难点...' },
      { p: 70, t: 'AI 正在生成图文内容...' },
      { p: 85, t: '优化排版与布局设计...' },
      { p: 95, t: '生成 PDF 文档...' },
      { p: 100, t: '生成完成！' }
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      if (currentStage >= stages.length) {
        clearInterval(interval);
        setIsGenerating(false);
        // 模拟生成 PDF URL
        setGeneratedPdfUrl('https://example.com/generated-reading-material.pdf');
        alert(`成功生成阅读材料！\n\n包含 ${selectedSlides.size} 个页面\n总字数：约 ${selectedSlidesData.reduce((sum, s) => sum + (s.script?.length || 0), 0)} 字`);
        return;
      }
      setGenerationProgress(stages[currentStage].p);
      setGenerationText(stages[currentStage].t);
      currentStage++;
    }, 600);
  };

  const handleDownloadPDF = () => {
    if (generatedPdfUrl) {
      // 模拟下载
      const link = document.createElement('a');
      link.href = generatedPdfUrl;
      link.download = '阅读辅助材料.pdf';
      link.click();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">生成阅读材料</h1>
                <p className="text-sm text-slate-500">选择 PPT 页面范围，AI 将基于视觉画面、讲稿内容和教学目标生成 PDF 阅读辅助材料</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={selectAll} 
                className="px-4 py-2 text-sm text-slate-600 hover:text-blue-600 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors"
              >
                全选
              </button>
              <button 
                onClick={deselectAll} 
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors"
              >
                取消全选
              </button>
              <button 
                onClick={handleGeneratePDF} 
                disabled={isGenerating || selectedSlides.size === 0}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-sm disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    生成 PDF 阅读材料
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  {generationText}
                </span>
                <span className="text-indigo-600 font-bold">{generationProgress}%</span>
              </div>
              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 ease-out"
                  style={{ width: `${generationProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {generatedPdfUrl && !isGenerating && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-green-800">阅读材料生成成功！</p>
                  <p className="text-sm text-green-600">已选择 {selectedSlides.size} 个页面</p>
                </div>
              </div>
              <button 
                onClick={handleDownloadPDF}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-sm transition-colors"
              >
                <FileDown className="w-4 h-4" />
                下载 PDF
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
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
                        <div className="w-full h-full bg-indigo-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      ) : someSelected ? (
                        <div className="w-full h-full bg-indigo-200 rounded"></div>
                      ) : null}
                    </button>
                    <h2 className="text-lg font-bold">{phase.label}</h2>
                    <span className="text-sm text-slate-500">
                      ({phase.slides.filter(s => selectedSlides.has(s.id)).length} / {phase.slides.length} 已选择)
                    </span>
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
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-50 shadow-md'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-5 h-5 border-2 rounded mt-0.5 flex items-center justify-center ${
                              isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                            }`}>
                              {isSelected && <span className="text-white text-xs">✓</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">
                                  {slide.duration}
                                </span>
                                {slide.image && (
                                  <div className="w-8 h-6 bg-slate-200 rounded overflow-hidden">
                                    <img src={slide.image} alt="" className="w-full h-full object-cover" />
                                  </div>
                                )}
                              </div>
                              <h3 className="font-bold text-sm text-slate-800 mb-1 line-clamp-2">
                                {slide.title}
                              </h3>
                              {slide.script && (
                                <p className="text-xs text-slate-600 line-clamp-2 mb-2">
                                  {slide.script.substring(0, 60)}...
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <FileText className="w-3 h-3" />
                                <span>讲稿: {slide.script?.length || 0} 字</span>
                              </div>
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
    </div>
  );
};
