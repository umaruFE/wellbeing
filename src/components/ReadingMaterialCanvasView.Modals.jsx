import React from 'react';
import { PromptInputModal } from './PromptInputModal';

/**
 * ReadingMaterialCanvasViewModals - 阅读材料画布视图的模态框组件
 */
export const ReadingMaterialCanvasViewModals = ({ 
  showPromptModal,
  setShowPromptModal,
  promptModalConfig,
  setPromptModalConfig,
  onConfirmAddAsset,
  onConfirmAddPageToStep,
  onConfirmAddStep,
  isGenerating,
  isGeneratingAsset,
  showRegeneratePageModal,
  setShowRegeneratePageModal,
  isRegeneratingPage,
  onConfirmRegeneratePage,
  showAddReadingMaterialModal,
  setShowAddReadingMaterialModal,
  isGeneratingReadingMaterial,
  onConfirmAddReadingMaterial,
  showAddPageToMaterialModal,
  setShowAddPageToMaterialModal,
  isGeneratingPageToMaterial,
  onConfirmAddPageToMaterial,
  showHistoryModal,
  setShowHistoryModal,
  generationHistory,
  currentPage,
  onRestoreHistory,
  showPageHistoryModal,
  setShowPageHistoryModal,
  pageHistory,
  onRestorePageHistory
}) => {
  return (
    <>
      {/* Prompt Input Modal */}
      <PromptInputModal
        isOpen={showPromptModal}
        onClose={() => {
          setShowPromptModal(false);
          setPromptModalConfig({ type: null, phaseKey: null, pageId: null, assetType: null });
        }}
        onConfirm={(prompt, inputMode, videoStyle) => {
          if (promptModalConfig.type === 'asset') {
            onConfirmAddAsset(prompt, inputMode, videoStyle);
          } else if (promptModalConfig.type === 'page' && promptModalConfig.stepId) {
            onConfirmAddPageToStep(prompt);
          } else {
            onConfirmAddStep(prompt);
          }
        }}
        title={promptModalConfig.type === 'asset' 
          ? `添加${promptModalConfig.assetType === 'image' ? '图片' : '文本'}元素`
          : promptModalConfig.stepId
          ? '在末尾添加新页面'
          : '添加新页面'}
        description={promptModalConfig.type === 'asset'
          ? promptModalConfig.assetType === 'text'
            ? '选择直接输入文本内容或使用AI生成文本'
            : '请输入AI生成提示词，描述你想要创建的元素（可选，留空将使用默认生成）'
          : '请输入AI生成提示词，描述你想要创建的页面内容（可选，留空将使用默认标题）'}
        placeholder={promptModalConfig.type === 'asset'
          ? `例如：${promptModalConfig.assetType === 'image' ? '生成一张关于动物的图片' : '输入文本内容或AI生成提示词'}...`
          : '例如：创建一个关于颜色词汇的阅读页面，包含图片和文字...'}
        type={promptModalConfig.type === 'asset' ? 'element' : 'session'}
        assetType={promptModalConfig.assetType}
        isLoading={promptModalConfig.type === 'asset' ? isGeneratingAsset : isGenerating}
      />

      {/* 重新生成页面提示词输入模态框 */}
      <PromptInputModal
        isOpen={showRegeneratePageModal}
        onClose={() => setShowRegeneratePageModal(false)}
        onConfirm={(prompt) => onConfirmRegeneratePage(prompt)}
        title="重新生成页面"
        description="请输入AI生成提示词，描述你想要重新生成的页面内容（可选，留空将使用默认生成）"
        placeholder="例如：重新生成一个关于颜色词汇的阅读页面，包含图片和文字..."
        type="session"
        isLoading={isRegeneratingPage}
      />

      {/* 新增阅读材料提示词输入模态框 */}
      {showAddReadingMaterialModal && (
        <PromptInputModal
          isOpen={!!showAddReadingMaterialModal}
          onClose={() => setShowAddReadingMaterialModal(null)}
          onConfirm={onConfirmAddReadingMaterial}
          title="新增阅读材料"
          description="请输入AI生成提示词，描述你想要创建的阅读材料内容"
          placeholder="例如：创建一份关于动物主题的阅读材料，包含图片和练习题..."
          type="session"
          isLoading={isGeneratingReadingMaterial}
        />
      )}

      {/* 新增页面到阅读材料提示词输入模态框 */}
      {showAddPageToMaterialModal && (
        <PromptInputModal
          isOpen={!!showAddPageToMaterialModal}
          onClose={() => setShowAddPageToMaterialModal(null)}
          onConfirm={onConfirmAddPageToMaterial}
          title="新增页面"
          description="请输入AI生成提示词，描述你想要创建的页面内容"
          placeholder="例如：创建一个关于颜色词汇的阅读页面，包含图片和文字..."
          type="session"
          isLoading={isGeneratingPageToMaterial}
        />
      )}

      {/* 历史生成列表模态框 */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <HistoryIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">
                    历史生成列表 - {showHistoryModal.assetType === 'image' ? '图片' : showHistoryModal.assetType === 'video' ? '视频' : showHistoryModal.assetType === 'text' ? '文本' : ''}
                  </h3>
                </div>
              </div>
              <button 
                onClick={() => setShowHistoryModal(null)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {generationHistory
                .filter(h => 
                  h.pageId === currentPage?.id && 
                  h.assetId === showHistoryModal.assetId &&
                  h.type === showHistoryModal.assetType
                )
                .length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <HistoryIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无历史生成记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {generationHistory
                    .filter(h => 
                      h.pageId === currentPage?.id && 
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
                            {(historyItem.type === 'image' || historyItem.type === 'video') && (
                              <img 
                                src={historyItem.url} 
                                alt="历史生成" 
                                className="w-full h-32 object-cover rounded border border-slate-200 mb-2"
                              />
                            )}
                            {historyItem.type === 'text' && (
                              <div className="bg-slate-50 rounded border border-slate-200 p-3 mb-2">
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                                  {historyItem.url || historyItem.content || '(空内容)'}
                                </p>
                              </div>
                            )}
                            {historyItem.prompt && (
                              <p className="text-xs text-slate-600 bg-slate-50 rounded p-2 mt-2">
                                提示词: {historyItem.prompt}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => onRestoreHistory(historyItem)}
                            className="ml-4 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                          >
                            <RefreshCwIcon className="w-3 h-3" />
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

      {/* 页面历史生成列表模态框 */}
      {showPageHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white">
                  <HistoryIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">
                    历史生成列表 - 页面内容
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {currentPage?.title || '当前页面'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowPageHistoryModal(false)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {pageHistory
                .filter(h => h.pageId === currentPage?.id)
                .length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <HistoryIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无历史生成记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pageHistory
                    .filter(h => h.pageId === currentPage?.id)
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
                            <div className="text-sm text-slate-700 mb-2">
                              <div className="font-semibold">{historyItem.data.title}</div>
                              <div className="text-xs text-slate-500 mt-1">素材数量: {historyItem.data.canvasAssets?.length || 0}</div>
                            </div>
                          </div>
                          <button
                            onClick={() => onRestorePageHistory(historyItem)}
                            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 transition-colors"
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
    </>
  );
};

// 使用内联图标组件避免导入问题
const HistoryIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v5h5"/>
    <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
    <path d="M12 7v5l4 2"/>
  </svg>
);

const XIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

const RefreshCwIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
    <path d="M16 21h5v-5"/>
  </svg>
);

export default ReadingMaterialCanvasViewModals;

