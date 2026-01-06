import { X } from 'lucide-react';

export const ImagePreviewModal = ({ src, onClose }) => {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
        <img src={src} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" />
        <button className="mt-4 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-sm transition-colors">
          <X className="w-4 h-4" /> 关闭预览
        </button>
      </div>
    </div>
  );
};
