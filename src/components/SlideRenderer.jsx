import { LayoutTemplate, RotateCw, Play, Music, Copy, Trash2 } from 'lucide-react';

export const SlideRenderer = ({ assets, isEditable, onMouseDown, selectedAssetId, onCopyAsset, onDeleteAsset }) => {
  
  if (assets.length === 0 && isEditable) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pointer-events-none">
         <LayoutTemplate className="w-16 h-16 mb-4" />
         <p className="text-sm font-medium">画布为空，请使用上方工具栏添加素材</p>
      </div>
    );
  }

  return (
    <>
      {assets.map(asset => (
        <div
          key={asset.id}
          onMouseDown={(e) => isEditable ? onMouseDown(e, asset.id, 'dragging') : null}
          style={{ 
             left: asset.x, 
             top: asset.y, 
             width: asset.width || 300, 
             height: asset.height || 200,
             zIndex: assets.indexOf(asset),
             transform: `rotate(${asset.rotation || 0}deg)`,
             position: 'absolute'
          }}
          className={`${isEditable ? 'cursor-move select-none' : 'pointer-events-none'} group/asset 
            ${selectedAssetId === asset.id && isEditable ? 'ring-2 ring-blue-500 z-50 shadow-2xl' : ''}
            ${isEditable && selectedAssetId !== asset.id ? 'hover:ring-1 hover:ring-blue-300' : ''}
            transition-shadow duration-75`}
        >
           {/* 右上角复制和删除按钮 - 仅在可编辑模式下显示 */}
           {isEditable && (
             <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover/asset:opacity-100 transition-opacity z-50">
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   if (onCopyAsset) onCopyAsset(asset.id);
                 }}
                 className="p-1.5 bg-blue-500 text-white rounded shadow-sm hover:bg-blue-600 transition-colors"
                 title="复制"
               >
                 <Copy className="w-3 h-3" />
               </button>
               <button
                 onClick={(e) => {
                   e.stopPropagation();
                   if (onDeleteAsset) onDeleteAsset(asset.id);
                 }}
                 className="p-1.5 bg-red-500 text-white rounded shadow-sm hover:bg-red-600 transition-colors"
                 title="删除"
               >
                 <Trash2 className="w-3 h-3" />
               </button>
             </div>
           )}
           
           {/* Editor Controls (Handles) - Only in Editable Mode */}
           {isEditable && selectedAssetId === asset.id && (
             <>
               {/* Resize Handles */}
               <div onMouseDown={(e) => onMouseDown(e, asset.id, 'resizing', 'nw')} className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-nw-resize z-50"></div>
               <div onMouseDown={(e) => onMouseDown(e, asset.id, 'resizing', 'ne')} className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-ne-resize z-50"></div>
               <div onMouseDown={(e) => onMouseDown(e, asset.id, 'resizing', 'sw')} className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-sw-resize z-50"></div>
               <div onMouseDown={(e) => onMouseDown(e, asset.id, 'resizing', 'se')} className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-se-resize z-50"></div>
               
               {/* Rotation Handle */}
               <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing z-50"
                    onMouseDown={(e) => onMouseDown(e, asset.id, 'rotating')}>
                  <div className="w-px h-4 bg-blue-500"></div>
                  <div className="w-5 h-5 bg-white border border-blue-500 rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform">
                     <RotateCw className="w-3 h-3 text-blue-500" />
                  </div>
               </div>
             </>
           )}

           {/* Content */}
           {asset.type === 'text' ? (
              <div className="w-full h-full bg-white/80 backdrop-blur p-2 text-xl font-bold font-sans text-slate-800 whitespace-pre-wrap border border-dashed border-slate-300 rounded shadow-sm overflow-hidden flex items-center justify-center text-center">
                 {asset.content || "请输入文本..."}
              </div>
           ) : (
              <div className="w-full h-full relative bg-black rounded overflow-hidden shadow-sm">
                 <img 
                   src={asset.url} 
                   alt={asset.title} 
                   className="w-full h-full object-cover block select-none pointer-events-none" 
                 />
                 {asset.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                       <Play className="w-12 h-12 text-white opacity-80" />
                    </div>
                 )}
                 {asset.type === 'audio' && (
                    <div className="absolute bottom-0 left-0 right-0 h-full bg-slate-900/80 flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                       <Music className="w-8 h-8 text-white/80" />
                       <div className="text-white text-xs font-mono">Audio Track</div>
                    </div>
                 )}
              </div>
           )}
        </div>
      ))}
    </>
  );
};
