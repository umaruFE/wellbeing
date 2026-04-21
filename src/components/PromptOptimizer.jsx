import React, { useState, useEffect } from 'react';
import { Sparkles, Wand2, History, ArrowRight, Star, Save, X } from 'lucide-react';
import { promptOptimizationService, promptOptimizationMap } from '../services/promptService';
import { optimizePrompt } from '../services/dashscope';
import { useAuth } from '../contexts/AuthContext';

const PromptOptimizer = ({ elementType, onOptimize, onClose }) => {
  const { user } = useAuth();
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [improvements, setImprovements] = useState([]);
  const [selectedImprovements, setSelectedImprovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // 加载历史优化记录
    const loadHistory = async () => {
      try {
        const userId = user?.id || 'anonymous';
        const data = await promptOptimizationService.getOptimizations(userId, elementType);
        setHistory(data);
      } catch (error) {
        console.error('加载优化历史失败:', error);
      }
    };

    loadHistory();
  }, [elementType, user]);

  useEffect(() => {
    // 加载对应元素类型的优化建议
    if (promptOptimizationMap[elementType]) {
      setImprovements(promptOptimizationMap[elementType].improvements);
    }
  }, [elementType]);

  const handleImprovementToggle = (improvement) => {
    setSelectedImprovements(prev =>
      prev.includes(improvement)
        ? prev.filter(item => item !== improvement)
        : [...prev, improvement]
    );
  };

  const handleOptimize = async () => {
    if (!originalPrompt) return;

    setLoading(true);
    try {
      const userId = user?.id || null;
      
      // 调用大模型优化提示词
      const optimized = await optimizePrompt(originalPrompt, elementType, userId);
      setOptimizedPrompt(optimized);
    } catch (error) {
      console.error('优化提示词失败:', error);
      alert('优化提示词失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!originalPrompt || !optimizedPrompt) return;

    try {
      const userId = user?.id || 'anonymous';
      await promptOptimizationService.saveOptimization({
        user_id: userId,
        element_type: elementType,
        original_prompt: originalPrompt,
        optimized_prompt: optimizedPrompt,
        improvement_score: 5 // 默认评分
      });
      alert('优化记录已保存');
    } catch (error) {
      console.error('保存优化记录失败:', error);
    }
  };

  const handleUseHistory = (item) => {
    setOriginalPrompt(item.original_prompt);
    setOptimizedPrompt(item.optimized_prompt);
    setShowHistory(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b-2 border-[#e5e3db] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wand2 className="w-6 h-6 text-purple-600" />
            <h3 className="font-bold text-lg text-slate-800">
              提示词优化器 - {elementType === 'image' ? '图片' : elementType === 'video' ? '视频' : elementType === 'audio' ? '音频' : elementType === 'script' ? '讲稿' : elementType === 'activity' ? '活动' : 'PPT'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 原始提示词 */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">原始提示词</label>
            <textarea
              value={originalPrompt}
              onChange={(e) => setOriginalPrompt(e.target.value)}
              placeholder="输入原始提示词..."
              className="w-full p-3 border-2 border-[#e5e3db] rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-[#2d2d2d] outline-none resize-none h-32 transition-all"
            />
          </div>

          {/* 优化建议 */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">优化建议</label>
            <div className="space-y-2">
              {improvements.map((improvement, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`improvement-${index}`}
                    checked={selectedImprovements.includes(improvement)}
                    onChange={() => handleImprovementToggle(improvement)}
                    className="w-4 h-4 text-purple-600 border-[#d1d5db] rounded-lg focus:ring-purple-600"
                  />
                  <label htmlFor={`improvement-${index}`} className="text-sm text-slate-600">
                    {improvement}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* 优化后提示词 */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">优化后提示词</label>
            <textarea
              value={optimizedPrompt}
              onChange={(e) => setOptimizedPrompt(e.target.value)}
              placeholder="优化后的提示词将显示在这里..."
              className="w-full p-3 border-2 border-[#e5e3db] rounded-xl focus:ring-2 focus:ring-[#2d2d2d] focus:border-[#2d2d2d] outline-none resize-none h-32 transition-all"
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <button
              onClick={handleOptimize}
              disabled={loading || !originalPrompt}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <Sparkles className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              优化提示词
            </button>
            <button
              onClick={handleSave}
              disabled={!optimizedPrompt}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-4 py-2 border-2 border-[#e5e3db] text-[#2d2d2d] rounded-xl hover:bg-[#fffbe6] hover:border-[#2d2d2d] transition-all flex items-center justify-center gap-2 font-medium"
            >
              <History className="w-4 h-4" />
              历史
            </button>
          </div>

          {/* 使用优化后的提示词 */}
            <button
              onClick={() => onOptimize(optimizedPrompt)}
              disabled={!optimizedPrompt}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-4"
            >
              使用优化后的提示词
              <ArrowRight className="w-4 h-4" />
            </button>

          {/* 历史记录 */}
          {showHistory && (
            <div className="mt-6 pt-6 border-t-2 border-[#e5e3db]">
              <h4 className="font-medium text-slate-700 mb-3">历史优化记录</h4>
              <div className="space-y-3">
                {history.length === 0 ? (
                  <p className="text-slate-500 text-sm">暂无历史记录</p>
                ) : (
                  history.map((item, index) => (
                    <div key={index} className="p-3 border-2 border-[#e5e3db] rounded-xl hover:bg-[#fffbe6] hover:border-[#2d2d2d] cursor-pointer transition-all" onClick={() => handleUseHistory(item)}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">优化记录 {index + 1}</span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < item.improvement_score ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{item.original_prompt.substring(0, 50)}...</p>
                      <p className="text-xs text-purple-600 mt-1 truncate">{item.optimized_prompt.substring(0, 50)}...</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptOptimizer;
