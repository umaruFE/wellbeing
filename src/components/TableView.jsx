import React, { useState } from 'react';
import { 
  RefreshCw, 
  Music, 
  FileText, 
  Trash2, 
  Maximize2,
  Image as ImageIcon, 
  Plus
} from 'lucide-react';
import { WORD_DOC_DATA } from '../constants';
import { ImagePreviewModal } from './ImagePreviewModal';
import { BookmarkIcon } from './BookmarkIcon';

export const TableView = ({ initialConfig, onReset }) => {
  // 初始化数据时，确保每一行都有 script 字段
  const [slides, setSlides] = useState(WORD_DOC_DATA.map(s => ({...s, script: s.script || ''})));
  const [previewImage, setPreviewImage] = useState(null);
  const [generatingMedia, setGeneratingMedia] = useState({});
  const [generatingPdf, setGeneratingPdf] = useState({}); // PDF生成状态

  const [phases, setPhases] = useState([
    { id: 'Engage', label: 'Engage (引入)', color: 'bg-purple-50 border-purple-200 text-purple-800', slides: WORD_DOC_DATA.filter(s => s.phase.includes('Engage')).map(s => ({...s, script: s.script || ''})) },
    { id: 'Empower', label: 'Empower (赋能)', color: 'bg-blue-50 border-blue-200 text-blue-800', slides: WORD_DOC_DATA.filter(s => s.phase.includes('Empower')).map(s => ({...s, script: s.script || ''})) },
    { id: 'Execute', label: 'Execute (实践/产出)', color: 'bg-green-50 border-green-200 text-green-800', slides: WORD_DOC_DATA.filter(s => s.phase.includes('Execute')).map(s => ({...s, script: s.script || ''})) },
    { id: 'Elevate', label: 'Elevate (升华)', color: 'bg-yellow-50 border-yellow-200 text-yellow-800', slides: WORD_DOC_DATA.filter(s => s.phase.includes('Elevate')).map(s => ({...s, script: s.script || ''})) }
  ]);

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
    const newId = Date.now();
    setPhases(prevPhases => prevPhases.map(phase => {
        if (phase.id !== phaseId) return phase;
        let defaultPhaseStr = phase.label;
        return {
            ...phase,
            slides: [...phase.slides, {
                // 初始化 script 字段为空
                id: newId, phase: defaultPhaseStr, duration: "5分钟", title: "New Activity", objectives: "", activities: "", script: "", materials: "", worksheets: "无", ppt_content: "", image: null, audio: null, video: null, elements: []
            }]
        };
    }));
  };

  const handleDeleteRow = (phaseId, slideId) => {
    setPhases(prevPhases => prevPhases.map(phase => {
        if (phase.id !== phaseId) return phase;
        return { ...phase, slides: phase.slides.filter(s => s.id !== slideId) };
    }));
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


  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-slate-800 font-sans overflow-hidden">
      <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />
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
                    <div className="flex items-center gap-3">
                        <div className="text-xs font-medium px-2 py-1 bg-white/50 rounded-full text-slate-500">{phase.slides.length} 个环节</div>
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
                                    <textarea value={slide.activities} onChange={(e) => updateSlideField(phase.id, slide.id, 'activities', e.target.value)} className="w-full bg-transparent border border-transparent focus:border-blue-200 focus:bg-white rounded p-1 resize-none text-slate-700 leading-relaxed whitespace-pre-wrap transition-colors text-xs" rows={6} placeholder="详细的活动步骤..."/>
                                    <div className="pt-1 border-t border-slate-100">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase">教学目标</label>
                                        <textarea value={slide.objectives} onChange={(e) => updateSlideField(phase.id, slide.id, 'objectives', e.target.value)} className="w-full bg-transparent text-xs text-slate-500 resize-none outline-none focus:bg-white rounded" rows={3} placeholder="输入教学目标..."/>
                                    </div>
                                </div>
                             </td>

                             {/* 讲稿 (新列) */}
                             <td className="p-4 align-top">
                                <textarea value={slide.script} onChange={(e) => updateSlideField(phase.id, slide.id, 'script', e.target.value)} className="w-full bg-slate-100/50 border border-slate-200 focus:border-blue-300 focus:bg-white rounded p-2 resize-none text-xs text-slate-600 leading-relaxed transition-colors h-full min-h-[120px]" placeholder="输入教师讲稿..."/>
                             </td>

                             {/* PPT内容 (改为缩略图) */}
                             <td className="p-4 align-top">
                                 <div className="relative group/media w-full aspect-video bg-slate-100 rounded-md border border-slate-200 overflow-hidden flex items-center justify-center">
                                     {generatingMedia[`${slide.id}-image`] ? (
                                         <div className="flex flex-col items-center gap-1 text-blue-500"><RefreshCw className="w-5 h-5 animate-spin" /><span className="text-[10px]">生成中...</span></div>
                                     ) : slide.image ? (
                                         <>
                                            <img src={slide.image} alt="PPT Slide" className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setPreviewImage(slide.image)}/>
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button onClick={() => setPreviewImage(slide.image)} title="预览" className="p-1.5 bg-white/20 text-white rounded hover:bg-white/40 backdrop-blur-sm"><Maximize2 className="w-3 h-3" /></button>
                                                <button onClick={() => handleRegenerateMedia(phase.id, slide.id, 'image')} title="重新生成" className="p-1.5 bg-white/20 text-white rounded hover:bg-white/40 backdrop-blur-sm"><RefreshCw className="w-3 h-3" /></button>
                                            </div>
                                         </>
                                     ) : (
                                         <button onClick={() => handleRegenerateMedia(phase.id, slide.id, 'image')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-blue-500 transition-colors"><ImageIcon className="w-6 h-6" /><span className="text-[10px]">生成PPT页面</span></button>
                                     )}
                                 </div>
                             </td>

                             {/* 操作列 */}
                             <td className="p-4 align-top text-center"><button onClick={() => handleDeleteRow(phase.id, slide.id)} className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-colors" title="删除此行"><Trash2 className="w-4 h-4" /></button></td>
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
    </div>
  );
};