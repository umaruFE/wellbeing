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
  onAssetChange // 新增：用于更新资产属性（文本编辑时需要）
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
    />
  );
};
