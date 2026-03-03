import React from 'react';
import { PromptInputModal } from '../../../components/PromptInputModal';
import { CardSelectionModal } from '../../../components/CardSelectionModal';
import { History, X, RefreshCw, Music } from 'lucide-react';

/**
 * CanvasViewModals - CanvasView 的所有模态框组件
 */
export const CanvasViewModals = ({ 
  showPromptModal,
  setShowPromptModal,
  promptModalConfig,
  setPromptModalConfig,
  onConfirmAddStep,
  onConfirmAddAsset,
  onConfirmAddVideoAsset,
  showCardSelectionModal,
  setShowCardSelectionModal,
  cardSelectionImages,
  setCardSelectionImages,
  pendingAssetConfig,
  setPendingAssetConfig,
  isGenerating,
  onCardSelectionConfirm,
  showRegeneratePageModal,
  setShowRegeneratePageModal,
  isRegeneratingPage,
  onConfirmRegeneratePage,
  showHistoryModal,
  setShowHistoryModal,
  generationHistory,
  activePhase,
  activeStepId,
  onRestoreHistory
}) => {
  return (
    <>
      {/* Prompt Input Modal */}
      <PromptInputModal
        isOpen={showPromptModal}
        onClose={() => {
          setShowPromptModal(false);
          setPromptModalConfig({ type: null, assetType: null, phaseKey: null, addAtEnd: false });
        }}
        onConfirm={(prompt, inputMode, videoStyle, imageSize, referenceImage, lyrics, audioConfig) => {
          if (promptModalConfig.type === 'element') {
            onConfirmAddAsset(prompt, inputMode, videoStyle, imageSize, referenceImage, lyrics, audioConfig);
          } else {
            onConfirmAddStep(prompt);
          }
        }}
        // 视频类型时，通过分镜向导直接添加视频到画布
        onVideoConfirm={promptModalConfig.assetType === 'video' && onConfirmAddVideoAsset
          ? (videoData) => onConfirmAddVideoAsset(videoData)
          : null}
        title={promptModalConfig.type === 'element' 
          ? `添加${promptModalConfig.assetType === 'image' ? '图片' : promptModalConfig.assetType === 'video' ? '视频' : promptModalConfig.assetType === 'audio' ? '音频' : '文本'}元素`
          : promptModalConfig.addAtEnd
          ? '在末尾新增PPT'
          : '添加教学环节'}
        description={promptModalConfig.type === 'element'
          ? promptModalConfig.assetType === 'text'
            ? '选择直接输入文本内容或使用AI生成文本'
            : '请输入AI生成提示词，描述你想要创建的元素（可选，留空将使用默认生成）'
          : '请输入AI生成提示词，描述你想要创建的教学环节（可选，留空将使用默认标题）'}
        placeholder={promptModalConfig.type === 'element'
          ? `例如：${promptModalConfig.assetType === 'image' ? '生成一张关于动物的图片' : promptModalConfig.assetType === 'video' ? '生成一个教学视频' : promptModalConfig.assetType === 'audio' ? '生成背景音乐' : '输入文本内容或AI生成提示词'}...`
          : '例如：设计一个互动游戏环节，让学生学习颜色词汇...'}
        type={promptModalConfig.type}
        assetType={promptModalConfig.assetType}
        isLoading={isGenerating}
      />

      {/* 重新生成页面提示词输入模态框 */}
      <PromptInputModal
        isOpen={showRegeneratePageModal}
        onClose={() => setShowRegeneratePageModal(false)}
        onConfirm={(prompt) => onConfirmRegeneratePage(prompt)}
        title="重新生成页面"
        description="请输入AI生成提示词，描述你想要重新生成的页面内容（可选，留空将使用默认生成）"
        placeholder="例如：重新生成一个关于颜色词汇的教学页面，包含图片和文字..."
        type="session"
        isLoading={isRegeneratingPage}
      />

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
                    历史生成列表 - {showHistoryModal.assetType === 'image' ? '图片' : showHistoryModal.assetType === 'video' ? '视频' : showHistoryModal.assetType === 'text' ? '文本' : showHistoryModal.assetType === 'audio' ? '音频' : ''}
                  </h3>
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
                  h.phaseId === activePhase && 
                  h.stepId === activeStepId && 
                  h.assetId === showHistoryModal.assetId &&
                  h.type === showHistoryModal.assetType
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
                      h.phaseId === activePhase && 
                      h.stepId === activeStepId && 
                      h.assetId === showHistoryModal.assetId &&
                      h.type === showHistoryModal.assetType
                    )
                    .map((historyItem) => (
                      <div 
                        key={historyItem.id} 
                        className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-slate-500">
                                {historyItem.displayTime}
                              </span>
                            </div>
                            {historyItem.type === 'image' || historyItem.type === 'video' ? (
                              <img 
                                src={historyItem.url} 
                                alt="历史生成" 
                                className="w-full h-32 object-cover rounded border border-slate-200 mb-2"
                              />
                            ) : (
                              <div className="w-full h-16 bg-slate-100 rounded border border-slate-200 flex items-center justify-center mb-2">
                                <Music className="w-6 h-6 text-slate-400" />
                              </div>
                            )}
                            {historyItem.prompt && (
                              <p className="text-xs text-slate-600 bg-slate-50 rounded p-2 mt-2">
                                {historyItem.prompt}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => onRestoreHistory(historyItem)}
                            className="ml-4 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            恢复
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

      {/* 图片/音频抽卡选择模态框 */}
      <CardSelectionModal
        isOpen={showCardSelectionModal}
        onClose={() => {
          setShowCardSelectionModal(false);
          setCardSelectionImages([]);
          setPendingAssetConfig(null);
        }}
        title={pendingAssetConfig?.type === 'audio' ? '选择音频' : '选择图片'}
        images={cardSelectionImages}
        isLoading={isGenerating}
        onConfirm={onCardSelectionConfirm}
        type={pendingAssetConfig?.type}
      />
    </>
  );
};

export default CanvasViewModals;

