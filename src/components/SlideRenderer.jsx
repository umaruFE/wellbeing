import { CanvasAssetRenderer } from './CanvasAssetRenderer';

/**
 * SlideRenderer - PPT画布资产渲染器（向后兼容）
 * 现在使用共用的 CanvasAssetRenderer 组件
 */
export const SlideRenderer = ({ 
  assets, 
  isEditable, 
  onMouseDown, 
  selectedAssetId, 
  onCopyAsset, 
  onDeleteAsset,
  onAssetChange, // 用于更新资产属性（文本编辑时需要）
  editingTextAssetId, // 正在编辑的文本资产ID
  onEditingTextAssetIdChange, // (assetId) => void
  editingTextContent, // 正在编辑的文本内容
  onEditingTextContentChange, // (content) => void
  onCanvasClick // 点击画布时的回调，用于取消选择或保存编辑
}) => {
  return (
    <CanvasAssetRenderer
      assets={assets}
      isEditable={isEditable}
      onMouseDown={onMouseDown}
      selectedAssetId={selectedAssetId}
      onCopyAsset={onCopyAsset}
      onDeleteAsset={onDeleteAsset}
      onAssetChange={onAssetChange}
      editingTextAssetId={editingTextAssetId}
      onEditingTextAssetIdChange={onEditingTextAssetIdChange}
      editingTextContent={editingTextContent}
      onEditingTextContentChange={onEditingTextContentChange}
      onCanvasClick={onCanvasClick}
    />
  );
};
