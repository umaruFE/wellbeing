import React from 'react';
import {
  X,
  ChevronRight,
  Layers,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  Wand2,
  Upload,
  Sliders,
  Copy,
  Trash2,
  History,
  RefreshCw,
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette
} from 'lucide-react';
import { getAssetIcon } from '../utils';

/**
 * AssetEditorPanel - 共用的资产编辑面板组件
 * 统一PPT画布视图和阅读材料画布视图的编辑面板
 */
export const AssetEditorPanel = ({
  selectedAsset,
  onClose,
  onAssetChange,
  onLayerChange,
  onCopyAsset,
  onDeleteAsset,
  onShowHistoryModal,
  onRegenerateAsset,
  generatingAssetId,
  onReferenceUpload,
  isRightOpen,
  onToggleRightOpen
}) => {
  if (!selectedAsset) return null;

  return (
    <>
      <div className="p-4 border-b border-slate-100 bg-blue-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getAssetIcon(selectedAsset.type)}
          <h3 className="font-bold text-blue-800">编辑元素</h3>
        </div>
        <div className="flex items-center gap-2">
          {onToggleRightOpen && (
            <button onClick={onToggleRightOpen} className="text-slate-400 hover:text-slate-600" title="收起面板">
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* 图层操作 */}
      {onLayerChange && (
        <div className="px-4 py-2 border-b border-slate-100 bg-white flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3" /> 图层
          </span>
          <div className="flex gap-1">
            <button onClick={() => onLayerChange(selectedAsset.id, 'front')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="置顶">
              <ChevronsUp className="w-4 h-4" />
            </button>
            <button onClick={() => onLayerChange(selectedAsset.id, 'forward')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="上移">
              <ArrowUp className="w-4 h-4" />
            </button>
            <button onClick={() => onLayerChange(selectedAsset.id, 'backward')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="下移">
              <ArrowDown className="w-4 h-4" />
            </button>
            <button onClick={() => onLayerChange(selectedAsset.id, 'back')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="置底">
              <ChevronsDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* 尺寸和旋转 */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">宽 Width</label>
            <div className="flex items-center border border-slate-200 rounded px-2 bg-slate-50">
              <input 
                type="number" 
                value={Math.round(selectedAsset.width || 300)} 
                onChange={(e) => onAssetChange(selectedAsset.id, 'width', parseInt(e.target.value))} 
                className="w-full text-xs bg-transparent py-1.5 outline-none"
              />
              <span className="text-[10px] text-slate-400">px</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">高 Height</label>
            <div className="flex items-center border border-slate-200 rounded px-2 bg-slate-50">
              <input 
                type="number" 
                value={Math.round(selectedAsset.height || 200)} 
                onChange={(e) => onAssetChange(selectedAsset.id, 'height', parseInt(e.target.value))} 
                className="w-full text-xs bg-transparent py-1.5 outline-none"
              />
              <span className="text-[10px] text-slate-400">px</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">旋转 Rotate</label>
            <div className="flex items-center border border-slate-200 rounded px-2 bg-slate-50">
              <input 
                type="number" 
                value={Math.round(selectedAsset.rotation || 0)} 
                onChange={(e) => onAssetChange(selectedAsset.id, 'rotation', parseInt(e.target.value))} 
                className="w-full text-xs bg-transparent py-1.5 outline-none"
              />
              <span className="text-[10px] text-slate-400">°</span>
            </div>
          </div>
        </div>

        {/* 标题 */}
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">标题 / Name</label>
          <input 
            type="text" 
            value={selectedAsset.title || ''} 
            onChange={(e) => onAssetChange(selectedAsset.id, 'title', e.target.value)} 
            className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        {/* 文本类型 */}
        {selectedAsset.type === 'text' ? (
          <div className="space-y-4">
            {/* 文本内容 */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">文本内容 / Content</label>
              <textarea 
                value={selectedAsset.content || ''} 
                onChange={(e) => onAssetChange(selectedAsset.id, 'content', e.target.value)} 
                className="w-full text-sm border border-slate-200 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-32 resize-none"
              />
            </div>
            
            {/* AI 生成提示词 (文本) */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-2">
                <Wand2 className="w-3 h-3 text-purple-500" /> AI 生成提示词 / Prompt
              </label>
              <textarea 
                value={selectedAsset.prompt || ''} 
                onChange={(e) => onAssetChange(selectedAsset.id, 'prompt', e.target.value)} 
                placeholder="描述你想要生成的文本内容..." 
                className="w-full text-sm border border-purple-200 bg-purple-50 rounded px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none h-24 resize-none mb-2"
              />
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={() => onShowHistoryModal?.({ assetId: selectedAsset.id, assetType: selectedAsset.type })}
                  className="flex-1 py-2 bg-slate-100 text-slate-600 rounded text-sm font-bold hover:bg-slate-200 flex items-center justify-center gap-2 transition-all"
                >
                  <History className="w-4 h-4" />
                  历史生成
                </button>
                <button 
                  onClick={() => onRegenerateAsset?.(selectedAsset.id)}
                  className="flex-1 py-2 bg-purple-600 text-white rounded text-sm font-bold shadow hover:bg-purple-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <RefreshCw className={`w-4 h-4 ${generatingAssetId === selectedAsset.id ? 'animate-spin' : ''}`} /> 
                  立即生成
                </button>
              </div>
            </div>
            
            {/* 文本样式选项 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-500 uppercase">文本样式</label>
              </div>
              
              {/* 字号 */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">字号 Font Size</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="8" 
                    max="200" 
                    value={selectedAsset.fontSize || 24} 
                    onChange={(e) => onAssetChange(selectedAsset.id, 'fontSize', parseInt(e.target.value) || 24)} 
                    className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-slate-50 outline-none"
                  />
                  <span className="text-[10px] text-slate-400">px</span>
                </div>
              </div>

              {/* 加粗 */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">字重 Font Weight</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAssetChange(selectedAsset.id, 'fontWeight', 'normal')}
                    className={`flex-1 px-3 py-2 rounded border text-xs transition-colors ${
                      (selectedAsset.fontWeight || 'normal') === 'normal' 
                        ? 'bg-blue-50 border-blue-300 text-blue-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    正常
                  </button>
                  <button
                    onClick={() => onAssetChange(selectedAsset.id, 'fontWeight', 'bold')}
                    className={`flex-1 px-3 py-2 rounded border text-xs transition-colors flex items-center justify-center gap-1 ${
                      selectedAsset.fontWeight === 'bold' 
                        ? 'bg-blue-50 border-blue-300 text-blue-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Bold className="w-3 h-3" />
                    加粗
                  </button>
                </div>
              </div>

              {/* 文本颜色 */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block flex items-center gap-1">
                  <Palette className="w-3 h-3" /> 文本颜色 Color
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={selectedAsset.color || '#1e293b'} 
                    onChange={(e) => onAssetChange(selectedAsset.id, 'color', e.target.value)} 
                    className="w-12 h-10 rounded border border-slate-200 cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={selectedAsset.color || '#1e293b'} 
                    onChange={(e) => onAssetChange(selectedAsset.id, 'color', e.target.value)} 
                    className="flex-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-slate-50 outline-none font-mono"
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* 文本对齐 */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">对齐方式 Align</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAssetChange(selectedAsset.id, 'textAlign', 'left')}
                    className={`flex-1 px-2 py-2 rounded border text-xs transition-colors flex items-center justify-center ${
                      (selectedAsset.textAlign || 'center') === 'left' 
                        ? 'bg-blue-50 border-blue-300 text-blue-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    title="左对齐"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onAssetChange(selectedAsset.id, 'textAlign', 'center')}
                    className={`flex-1 px-2 py-2 rounded border text-xs transition-colors flex items-center justify-center ${
                      (selectedAsset.textAlign || 'center') === 'center' 
                        ? 'bg-blue-50 border-blue-300 text-blue-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    title="居中"
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onAssetChange(selectedAsset.id, 'textAlign', 'right')}
                    className={`flex-1 px-2 py-2 rounded border text-xs transition-colors flex items-center justify-center ${
                      selectedAsset.textAlign === 'right' 
                        ? 'bg-blue-50 border-blue-300 text-blue-700' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    title="右对齐"
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 描边 */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">描边 Stroke</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={!!selectedAsset.strokeWidth && selectedAsset.strokeWidth > 0} 
                      onChange={(e) => {
                        if (e.target.checked) {
                          onAssetChange(selectedAsset.id, 'strokeWidth', 2);
                        } else {
                          onAssetChange(selectedAsset.id, 'strokeWidth', null);
                          onAssetChange(selectedAsset.id, 'strokeColor', null);
                        }
                      }} 
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs text-slate-600">启用描边</span>
                  </div>
                  {selectedAsset.strokeWidth && selectedAsset.strokeWidth > 0 && (
                    <div className="space-y-2 pl-6">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-slate-500">描边宽度</span>
                          <span className="text-[10px] text-slate-400">{selectedAsset.strokeWidth}px</span>
                        </div>
                        <input 
                          type="range" 
                          min="1" 
                          max="10" 
                          value={selectedAsset.strokeWidth || 2} 
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (value > 0) {
                              onAssetChange(selectedAsset.id, 'strokeWidth', value);
                            }
                          }} 
                          className="w-full"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] text-slate-500">描边颜色</label>
                        <input 
                          type="color" 
                          value={selectedAsset.strokeColor || '#000000'} 
                          onChange={(e) => onAssetChange(selectedAsset.id, 'strokeColor', e.target.value)} 
                          className="w-10 h-8 rounded border border-slate-200 cursor-pointer"
                        />
                        <input 
                          type="text" 
                          value={selectedAsset.strokeColor || '#000000'} 
                          onChange={(e) => onAssetChange(selectedAsset.id, 'strokeColor', e.target.value)} 
                          className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 bg-slate-50 outline-none font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 图片/视频的参考图片 */}
            {(selectedAsset.type === 'image' || selectedAsset.type === 'video') && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Upload className="w-3 h-3" /> 参考图片 (可选)
                  </label>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">Optional</span>
                </div>
                {!selectedAsset.referenceImage ? (
                  <div className="border border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative group/upload">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file && onReferenceUpload) {
                          onReferenceUpload(e, selectedAsset.id);
                        } else if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            onAssetChange(selectedAsset.id, 'referenceImage', reader.result);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="p-2 bg-white rounded-full shadow-sm mb-2 group-hover/upload:scale-110 transition-transform">
                      <Upload className="w-5 h-5 text-slate-400" />
                    </div>
                    <span className="text-xs text-slate-500 font-medium">点击上传参考图片</span>
                    <span className="text-[10px] text-slate-400 mt-1">仅用于风格辅助，非必传</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative group/ref">
                      <img src={selectedAsset.referenceImage} alt="Reference" className="w-full h-32 object-cover rounded border border-slate-200 opacity-90" />
                      <div className="absolute inset-0 bg-black/0 group-hover/ref:bg-black/10 transition-colors rounded"></div>
                      <button 
                        onClick={() => onAssetChange(selectedAsset.id, 'referenceImage', null)} 
                        className="absolute top-2 right-2 bg-white text-slate-600 hover:text-red-500 p-1.5 rounded-full shadow-sm opacity-0 group-hover/ref:opacity-100 transition-opacity"
                        title="移除参考图"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sliders className="w-3 h-3 text-slate-400" />
                      <div className="flex-1 h-1 bg-slate-200 rounded overflow-hidden">
                        <div className="w-1/3 h-full bg-blue-400"></div>
                      </div>
                      <span className="text-[10px] text-slate-400">参考权重: 低</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* AI 生成提示词 */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-2">
                <Wand2 className="w-3 h-3 text-purple-500" /> AI 生成提示词 / Prompt
              </label>
              <textarea 
                value={selectedAsset.prompt || ''} 
                onChange={(e) => onAssetChange(selectedAsset.id, 'prompt', e.target.value)} 
                placeholder="描述你想要生成的画面..." 
                className="w-full text-sm border border-purple-200 bg-purple-50 rounded px-3 py-2 focus:ring-2 focus:ring-purple-500 outline-none h-24 resize-none mb-2"
              />
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={() => onShowHistoryModal?.({ assetId: selectedAsset.id, assetType: selectedAsset.type })}
                  className="flex-1 py-2 bg-slate-100 text-slate-600 rounded text-sm font-bold hover:bg-slate-200 flex items-center justify-center gap-2 transition-all"
                >
                  <History className="w-4 h-4" />
                  历史生成
                </button>
                <button 
                  onClick={() => onRegenerateAsset?.(selectedAsset.id)}
                  className="flex-1 py-2 bg-purple-600 text-white rounded text-sm font-bold shadow hover:bg-purple-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <RefreshCw className={`w-4 h-4 ${generatingAssetId === selectedAsset.id ? 'animate-spin' : ''}`} /> 
                  {selectedAsset.referenceImage ? '参考图 + 文本生成' : '立即生成'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* 操作按钮 */}
        <div className="pt-6 mt-6 border-t border-slate-100 space-y-2">
          <button 
            onClick={() => onCopyAsset?.(selectedAsset.id)} 
            className="w-full py-2 text-blue-500 border border-blue-200 rounded text-sm font-bold hover:bg-blue-50 flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" /> 复制此元素
          </button>
          <button 
            onClick={() => onDeleteAsset?.(selectedAsset.id)} 
            className="w-full py-2 text-red-500 border border-red-200 rounded text-sm font-bold hover:bg-red-50 flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> 删除此元素 (Del)
          </button>
        </div>
      </div>
    </>
  );
};
