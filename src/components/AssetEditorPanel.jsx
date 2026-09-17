import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { LocalizedText } from '../i18n/LocalizedText.jsx';
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
  Palette,
  Clock,
  Music,
  Maximize2,
  Crosshair
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
  onFitToCanvas,
  onCenterAsset,
  isRightOpen,
  onToggleRightOpen
}) => {
  const { t } = useTranslation();
  if (!selectedAsset) return null;

  return (
    <>
      <div className="p-4 border-b-2 border-stroke-light bg-warning-light flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getAssetIcon(selectedAsset.type)}
          <h3 className="font-bold text-info-active"><LocalizedText id="assetEditor.185cf42742" /></h3>
        </div>
        <div className="flex items-center gap-2">
          {onToggleRightOpen && (
            <button onClick={onToggleRightOpen} className="text-primary-placeholder hover:text-primary-secondary" title={i18next.t('assetEditor.1553bf7b86')}>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="text-primary-muted hover:text-primary-secondary">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* 图层操作 */}
      {onLayerChange && (
        <div className="px-4 py-2 border-b-2 border-stroke-light bg-white flex items-center justify-between">
          <span className="text-[10px] font-bold text-primary-placeholder uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3" /> <LocalizedText id="assetEditor.ec4bca7dcc" />
          </span>
          <div className="flex gap-1">
            <button onClick={() => onLayerChange(selectedAsset.id, 'front')} className="p-1.5 hover:bg-surface-alt rounded text-primary-secondary" title={i18next.t('lesson.pinToTop')}>
              <ChevronsUp className="w-4 h-4" />
            </button>
            <button onClick={() => onLayerChange(selectedAsset.id, 'forward')} className="p-1.5 hover:bg-surface-alt rounded text-primary-secondary" title={i18next.t('ppt.moveUp')}>
              <ArrowUp className="w-4 h-4" />
            </button>
            <button onClick={() => onLayerChange(selectedAsset.id, 'backward')} className="p-1.5 hover:bg-surface-alt rounded text-primary-secondary" title={i18next.t('ppt.moveDown')}>
              <ArrowDown className="w-4 h-4" />
            </button>
            <button onClick={() => onLayerChange(selectedAsset.id, 'back')} className="p-1.5 hover:bg-surface-alt rounded text-primary-secondary" title={i18next.t('assetEditor.2298689240')}>
              <ChevronsDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {(onFitToCanvas || onCenterAsset) && (
          <div className="grid grid-cols-2 gap-2">
            {onFitToCanvas && (
              <button
                onClick={() => onFitToCanvas(selectedAsset.id)}
                className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-stroke-light bg-white px-3 py-2 text-xs font-bold text-primary-secondary hover:border-info hover:text-info-active transition-colors"
                title={i18next.t('assetEditor.e9cfcecdf9')}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <LocalizedText id="assetEditor.3bc70c8d9d" />
              </button>
            )}
            {onCenterAsset && (
              <button
                onClick={() => onCenterAsset(selectedAsset.id)}
                className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-stroke-light bg-white px-3 py-2 text-xs font-bold text-primary-secondary hover:border-info hover:text-info-active transition-colors"
                title={i18next.t('assetEditor.0e71c36277')}
              >
                <Crosshair className="w-3.5 h-3.5" />
                <LocalizedText id="assetEditor.5009324782" />
              </button>
            )}
          </div>
        )}

        {/* 尺寸和旋转 */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-[10px] font-bold text-primary-placeholder uppercase mb-1 block"><LocalizedText id="assetEditor.3bdb470c60" /></label>
            <div className="flex items-center border-2 border-stroke-light rounded-xl px-2 bg-surface">
              <input 
                type="number" 
                value={Math.round(selectedAsset.width || 300)} 
                onChange={(e) => onAssetChange(selectedAsset.id, 'width', parseInt(e.target.value))} 
                className="w-full text-xs bg-transparent py-1.5 outline-none"
              />
              <span className="text-[10px] text-primary-placeholder">px</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-primary-placeholder uppercase mb-1 block"><LocalizedText id="assetEditor.6cb4458ede" /></label>
            <div className="flex items-center border-2 border-stroke-light rounded-xl px-2 bg-surface">
              <input 
                type="number" 
                value={Math.round(selectedAsset.height || 200)} 
                onChange={(e) => onAssetChange(selectedAsset.id, 'height', parseInt(e.target.value))} 
                className="w-full text-xs bg-transparent py-1.5 outline-none"
              />
              <span className="text-[10px] text-primary-placeholder">px</span>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-primary-placeholder uppercase mb-1 block"><LocalizedText id="assetEditor.4c355215cc" /></label>
            <div className="flex items-center border-2 border-stroke-light rounded-xl px-2 bg-surface">
              <input 
                type="number" 
                value={Math.round(selectedAsset.rotation || 0)} 
                onChange={(e) => onAssetChange(selectedAsset.id, 'rotation', parseInt(e.target.value))} 
                className="w-full text-xs bg-transparent py-1.5 outline-none"
              />
              <span className="text-[10px] text-primary-placeholder">°</span>
            </div>
          </div>
        </div>

        {/* 标题 */}
        <div>
          <label className="text-xs font-bold text-primary-muted uppercase mb-1 block"><LocalizedText id="assetEditor.cb23ac4594" /></label>
          <input 
            type="text" 
            value={selectedAsset.title || ''} 
            onChange={(e) => onAssetChange(selectedAsset.id, 'title', e.target.value)} 
            className="w-full text-sm border-2 border-stroke-light rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#2d2d2d] focus:border-primary outline-none transition-all"
          />
        </div>

        {/* 文本类型 */}
        {selectedAsset.type === 'text' ? (
          <div className="space-y-4">
            {/* 文本内容 */}
            <div>
              <label className="text-xs font-bold text-primary-muted uppercase mb-1 block"><LocalizedText id="assetEditor.f20c2fe170" /></label>
              <textarea 
                value={selectedAsset.content || ''} 
                onChange={(e) => onAssetChange(selectedAsset.id, 'content', e.target.value)} 
                className="w-full text-sm border-2 border-stroke-light rounded-xl px-3 py-2 focus:ring-2 focus:ring-[#2d2d2d] focus:border-primary outline-none transition-all h-32 resize-none"
              />
            </div>
            
            {/* AI 生成提示词 (文本) */}
            <div>
              <label className="text-xs font-bold text-primary-muted uppercase mb-1 flex items-center gap-2">
                <Wand2 className="w-3 h-3 text-purple-500" /> <LocalizedText id="assetEditor.c5bd13ad2b" />
              </label>
              <textarea 
                value={selectedAsset.prompt || ''} 
                onChange={(e) => onAssetChange(selectedAsset.id, 'prompt', e.target.value)} 
                placeholder={i18next.t('assetEditor.1638157083')}
                className="w-full text-sm border border-purple-200 bg-purple-50 rounded px-3 py-2 focus:ring-2 focus:ring-purple outline-none h-24 resize-none mb-2"
              />
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={() => onShowHistoryModal?.({ assetId: selectedAsset.id, assetType: selectedAsset.type })}
                  className="flex-1 py-2 bg-surface-alt text-primary-secondary rounded text-sm font-bold hover:bg-stroke flex items-center justify-center gap-2 transition-all"
                >
                  <History className="w-4 h-4" />
                  <LocalizedText id="assetEditor.afae334af3" />
                </button>
                <button 
                  onClick={() => onRegenerateAsset?.(selectedAsset.id)}
                  className="flex-1 py-2 bg-purple-600 text-white rounded text-sm font-bold shadow hover:bg-purple-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <RefreshCw className={`w-4 h-4 ${generatingAssetId === selectedAsset.id ? 'animate-spin' : ''}`} /> 
                  <LocalizedText id="assetEditor.67fe89f079" />
                </button>
              </div>
            </div>
            
            {/* 文本样式选项 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-primary-muted uppercase"><LocalizedText id="assetPanel.textStyle" /></label>
              </div>
              
              {/* 字号 */}
              <div>
                <label className="text-[10px] font-bold text-primary-placeholder uppercase mb-1 block"><LocalizedText id="assetEditor.fd2d495ddf" /></label>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    min="8" 
                    max="200" 
                    value={selectedAsset.fontSize || 24} 
                    onChange={(e) => onAssetChange(selectedAsset.id, 'fontSize', parseInt(e.target.value) || 24)} 
                    className="flex-1 text-xs border-2 border-stroke-light rounded-lg px-2 py-1.5 bg-surface outline-none transition-all"
                  />
                  <span className="text-[10px] text-primary-placeholder">px</span>
                </div>
              </div>

              {/* 加粗 */}
              <div>
                <label className="text-[10px] font-bold text-primary-placeholder uppercase mb-1 block"><LocalizedText id="assetEditor.d3eae56126" /></label>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAssetChange(selectedAsset.id, 'fontWeight', 'normal')}
                    className={`flex-1 px-3 py-2 rounded border text-xs transition-colors ${
                      (selectedAsset.fontWeight || 'normal') === 'normal' 
                        ? 'bg-info-light border-info-border text-info-active' 
                        : 'bg-white border-2 border-stroke-light text-dark hover:bg-warning-light hover:border-primary'
                    }`}
                  >
                    <LocalizedText id="audioLib.normal" />
                  </button>
                  <button
                    onClick={() => onAssetChange(selectedAsset.id, 'fontWeight', 'bold')}
                    className={`flex-1 px-3 py-2 rounded border text-xs transition-colors flex items-center justify-center gap-1 ${
                      selectedAsset.fontWeight === 'bold' 
                        ? 'bg-info-light border-info-border text-info-active' 
                        : 'bg-white border-2 border-stroke-light text-dark hover:bg-warning-light hover:border-primary'
                    }`}
                  >
                    <Bold className="w-3 h-3" />
                    <LocalizedText id="assetEditor.f670b2adc0" />
                  </button>
                </div>
              </div>

              {/* 文本颜色 */}
              <div>
                <label className="text-[10px] font-bold text-primary-placeholder uppercase mb-1 block flex items-center gap-1">
                  <Palette className="w-3 h-3" /> <LocalizedText id="assetEditor.534ce06a8f" />
                </label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={selectedAsset.color || '#1e293b'} 
                    onChange={(e) => onAssetChange(selectedAsset.id, 'color', e.target.value)} 
                    className="w-12 h-10 rounded-xl border-2 border-stroke-light cursor-pointer transition-all hover:border-primary"
                  />
                  <input 
                    type="text" 
                    value={selectedAsset.color || '#1e293b'} 
                    onChange={(e) => onAssetChange(selectedAsset.id, 'color', e.target.value)} 
                    className="flex-1 text-xs border-2 border-stroke-light rounded-lg px-2 py-1.5 bg-surface outline-none font-mono transition-all"
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* 文本对齐 */}
              <div>
                <label className="text-[10px] font-bold text-primary-placeholder uppercase mb-1 block"><LocalizedText id="assetEditor.ebe8423be3" /></label>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAssetChange(selectedAsset.id, 'textAlign', 'left')}
                    className={`flex-1 px-2 py-2 rounded border text-xs transition-colors flex items-center justify-center ${
                      (selectedAsset.textAlign || 'center') === 'left' 
                        ? 'bg-info-light border-info-border text-info-active' 
                        : 'bg-white border-2 border-stroke-light text-dark hover:bg-warning-light hover:border-primary'
                    }`}
                    title={i18next.t('assetEditor.413f8db65f')}
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onAssetChange(selectedAsset.id, 'textAlign', 'center')}
                    className={`flex-1 px-2 py-2 rounded border text-xs transition-colors flex items-center justify-center ${
                      (selectedAsset.textAlign || 'center') === 'center' 
                        ? 'bg-info-light border-info-border text-info-active' 
                        : 'bg-white border-2 border-stroke-light text-dark hover:bg-warning-light hover:border-primary'
                    }`}
                    title={i18next.t('assetEditor.5009324782')}
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onAssetChange(selectedAsset.id, 'textAlign', 'right')}
                    className={`flex-1 px-2 py-2 rounded border text-xs transition-colors flex items-center justify-center ${
                      selectedAsset.textAlign === 'right' 
                        ? 'bg-info-light border-info-border text-info-active' 
                        : 'bg-white border-2 border-stroke-light text-dark hover:bg-warning-light hover:border-primary'
                    }`}
                    title={i18next.t('assetEditor.70fe40dec2')}
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 描边 */}
              <div>
                <label className="text-[10px] font-bold text-primary-placeholder uppercase mb-1 block"><LocalizedText id="assetEditor.f78f47a879" /></label>
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
                      className="w-4 h-4 text-dark border-2 border-stroke-light rounded focus:ring-[#2d2d2d]"
                    />
                    <span className="text-xs text-primary-secondary"><LocalizedText id="assetEditor.469a3eadb0" /></span>
                  </div>
                  {selectedAsset.strokeWidth && selectedAsset.strokeWidth > 0 && (
                    <div className="space-y-2 pl-6">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-primary-muted"><LocalizedText id="assetEditor.de4b5a59bd" /></span>
                          <span className="text-[10px] text-primary-placeholder">{selectedAsset.strokeWidth}px</span>
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
                        <label className="text-[10px] text-primary-muted"><LocalizedText id="assetEditor.eaa98f95ba" /></label>
                        <input 
                          type="color" 
                          value={selectedAsset.strokeColor || '#000000'} 
                          onChange={(e) => onAssetChange(selectedAsset.id, 'strokeColor', e.target.value)} 
                          className="w-10 h-8 rounded-lg border-2 border-stroke-light cursor-pointer transition-all hover:border-primary"
                        />
                        <input 
                          type="text" 
                          value={selectedAsset.strokeColor || '#000000'} 
                          onChange={(e) => onAssetChange(selectedAsset.id, 'strokeColor', e.target.value)} 
                          className="flex-1 text-xs border-2 border-stroke-light rounded-lg px-2 py-1 bg-surface outline-none font-mono transition-all"
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
                  <label className="text-xs font-bold text-primary-muted uppercase flex items-center gap-1">
                    <Upload className="w-3 h-3" /> <LocalizedText id="assetEditor.dc33859347" />
                  </label>
                  <span className="text-[10px] bg-surface text-dark px-1.5 py-0.5 rounded-lg border border-stroke-light">Optional</span>
                </div>
                {!selectedAsset.referenceImage ? (
                  <div className="border-2 border-dashed border-stroke-light rounded-xl p-4 flex flex-col items-center justify-center bg-surface hover:bg-warning-light hover:border-primary transition-all cursor-pointer relative group/upload">
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
                      <Upload className="w-5 h-5 text-primary-placeholder" />
                    </div>
                    <span className="text-xs text-primary-muted font-medium"><LocalizedText id="assetEditor.7f4eac35c3" /></span>
                    <span className="text-[10px] text-primary-placeholder mt-1"><LocalizedText id="assetEditor.3e2b389305" /></span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative group/ref">
                      <img src={selectedAsset.referenceImage} alt="Reference" className="w-full h-32 object-cover rounded-xl border-2 border-stroke-light opacity-90" />
                      <div className="absolute inset-0 bg-black/0 group-hover/ref:bg-black/10 transition-colors rounded"></div>
                      <button 
                        onClick={() => onAssetChange(selectedAsset.id, 'referenceImage', null)} 
                        className="absolute top-2 right-2 bg-white text-primary-secondary hover:text-error p-1.5 rounded-full shadow-sm opacity-0 group-hover/ref:opacity-100 transition-opacity"
                        title={i18next.t('assetEditor.6c72b99216')}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* AI 生成提示词 */}
            <div>
              <label className="text-xs font-bold text-primary-muted uppercase mb-1 flex items-center gap-2">
                <Wand2 className="w-3 h-3 text-purple-500" /> <LocalizedText id="assetEditor.c5bd13ad2b" />
              </label>
              <textarea 
                value={selectedAsset.prompt || ''} 
                onChange={(e) => onAssetChange(selectedAsset.id, 'prompt', e.target.value)} 
                placeholder={i18next.t('assetEditor.d9f1d40ad4')}
                className="w-full text-sm border border-purple-200 bg-purple-50 rounded px-3 py-2 focus:ring-2 focus:ring-purple outline-none h-24 resize-none mb-2"
              />
              <div className="flex gap-2 mb-2">
                <button 
                  onClick={() => onShowHistoryModal?.({ assetId: selectedAsset.id, assetType: selectedAsset.type })}
                  className="flex-1 py-2 bg-surface-alt text-primary-secondary rounded text-sm font-bold hover:bg-stroke flex items-center justify-center gap-2 transition-all"
                >
                  <History className="w-4 h-4" />
                  <LocalizedText id="assetEditor.afae334af3" />
                </button>
                <button
                  onClick={() => onRegenerateAsset?.(selectedAsset.id)}
                  className="flex-1 py-2 bg-purple-600 text-white rounded text-sm font-bold shadow hover:bg-purple-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <RefreshCw className={`w-4 h-4 ${generatingAssetId === selectedAsset.id ? 'animate-spin' : ''}`} />
                  {selectedAsset.referenceImage ? t('assetEditor.imageToImage') : t('assetEditor.67fe89f079')}
                </button>
              </div>
            </div>

            {/* 音频设置 */}
            {selectedAsset.type === 'audio' && (
              <>
                <div>
                  <label className="text-xs font-bold text-primary-muted uppercase mb-1 flex items-center gap-2">
                    <Music className="w-3 h-3 text-info-hover" /> <LocalizedText id="assetEditor.08fddaf39e" />
                  </label>
                  <select
                    value={selectedAsset.style || ''}
                    onChange={(e) => onAssetChange(selectedAsset.id, 'style', e.target.value)}
                    className="w-full text-sm border border-info-border bg-info-light rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value=""><LocalizedText id="assetEditor.9741bc8c5f" /></option>
                    <option value="pop, catchy, upbeat"><LocalizedText id="assetEditor.61d5ebf290" /></option>
                    <option value="R&B, smooth, soulful">R&B</option>
                    <option value="rock, electric guitar, energetic"><LocalizedText id="assetEditor.3a1544429a" /></option>
                    <option value="electronic, synthesizer, modern"><LocalizedText id="assetEditor.9e5a9d1f1d" /></option>
                    <option value="jazz, improvisation, sophisticated"><LocalizedText id="assetEditor.6728028cc8" /></option>
                    <option value="classical, orchestral, elegant"><LocalizedText id="assetEditor.106ec2422d" /></option>
                    <option value="folk, acoustic, storytelling"><LocalizedText id="assetEditor.4e4951a5c3" /></option>
                    <option value="cafe, warm, reflection, relaxed"><LocalizedText id="assetEditor.eb40341bd8" /></option>
                    <option value="piano, keyboard, melodic"><LocalizedText id="assetEditor.e11cedb864" /></option>
                    <option value="guitar, strings, acoustic"><LocalizedText id="assetEditor.4ae01ed99c" /></option>
                    <option value="soft, gentle, calming"><LocalizedText id="assetEditor.b7e48ef10f" /></option>
                    <option value="upbeat, happy, energetic"><LocalizedText id="assetEditor.0eaffd210a" /></option>
                    <option value="emotional, heartfelt, moving"><LocalizedText id="assetEditor.a3ef720b90" /></option>
                    <option value="ambient, atmospheric, ethereal"><LocalizedText id="assetEditor.1830f0764b" /></option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-primary-muted uppercase mb-1 flex items-center gap-2">
                    <Clock className="w-3 h-3 text-info-hover" /> <LocalizedText id="assetEditor.48d2d5cfc9" />
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="10"
                      max="60"
                      step="5"
                      value={selectedAsset.duration || 30}
                      onChange={(e) => onAssetChange(selectedAsset.id, 'duration', Number(e.target.value))}
                      className="flex-1 h-2 bg-stroke rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <span className="text-sm font-medium text-primary-secondary min-w-[50px]">
                      {selectedAsset.duration || 30} <LocalizedText id="videoWizard.eb6aaba1a1" />
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-primary-muted uppercase mb-1 flex items-center gap-2">
                    <Wand2 className="w-3 h-3 text-info-hover" /> <LocalizedText id="assetEditor.6f39f08406" />
                  </label>
                  <textarea 
                    value={selectedAsset.lyrics || ''} 
                    onChange={(e) => onAssetChange(selectedAsset.id, 'lyrics', e.target.value)} 
                    placeholder={i18next.t('assetEditor.a6e06a0792')}
                    className="w-full text-sm border border-info-border bg-info-light rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                  />
                  <p className="text-[10px] text-primary-placeholder mt-1">
                    <LocalizedText id="assetEditor.3302e78670" />
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {/* 操作按钮 */}
        <div className="pt-6 mt-6 border-t-2 border-stroke-light space-y-2">
          <button 
            onClick={() => onCopyAsset?.(selectedAsset.id)} 
            className="w-full py-2 text-info-hover border border-info-border rounded text-sm font-bold hover:bg-info-light flex items-center justify-center gap-2"
          >
            <Copy className="w-4 h-4" /> <LocalizedText id="assetEditor.0a9d2f07dd" />
          </button>
          <button 
            onClick={() => onDeleteAsset?.(selectedAsset.id)} 
            className="w-full py-2 text-error border border-error-border rounded text-sm font-bold hover:bg-error-light flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> <LocalizedText id="assetEditor.2057deb61b" />
          </button>
        </div>
      </div>
    </>
  );
};
