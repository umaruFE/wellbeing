import React, { useState, useEffect } from 'react';
import { Sparkles, Wand2, History, ArrowRight, Star, Save, X } from 'lucide-react';
import { promptOptimizationService, promptOptimizationMap } from '../services/promptService';
import { optimizePrompt } from '../services/dashscope';

const PromptOptimizer = ({ elementType, onOptimize, onClose }) => {
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [improvements, setImprovements] = useState([]);
  const [selectedImprovements, setSelectedImprovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

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
      // 调用大模型优化提示词
      const optimized = await optimizePrompt(originalPrompt, elementType, null);
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
      await promptOptimizationService.saveOptimization({
        user_id: 'anonymous',
        element_type: elementType,
        original_prompt: originalPrompt,
        optimized_prompt: optimizedPrompt,
        improvement_score: 5
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
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wand2 className="w-6 h-6 text-purple-600" />
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">
              提示词优化器 - {elementType === 'image' ? '图片' : elementType === 'video' ? '视频' : elementType === 'audio' ? '音频' : 'AI生成'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 原始提示词 */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">原始提示词</label>
            <textarea
              value={originalPrompt}
              onChange={(e) => setOriginalPrompt(e.target.value)}
              placeholder="输入原始提示词..."
              className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none h-32 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* 优化建议 */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">优化建议</label>
            <div className="space-y-2">
              {improvements.map((improvement, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`improvement-${index}`}
                    checked={selectedImprovements.includes(improvement)}
                    onChange={() => handleImprovementToggle(improvement)}
                    className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor={`improvement-${index}`} className="text-sm text-slate-600 dark:text-slate-400">
                    {improvement}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* 优化后提示词 */}
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">优化后提示词</label>
            <textarea
              value={optimizedPrompt}
              onChange={(e) => setOptimizedPrompt(e.target.value)}
              placeholder="优化后的提示词将显示在这里..."
              className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none h-32 dark:bg-slate-800 dark:text-white"
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
          </div>

          {/* 使用优化后的提示词 */}
          {optimizedPrompt && (
            <button
              onClick={() => onOptimize(optimizedPrompt)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              使用优化后的提示词
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptOptimizer;
