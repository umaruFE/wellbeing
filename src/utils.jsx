import React from 'react';
import { ImageIcon, Video, Music, Type, Box } from 'lucide-react';

// Get icon component based on asset type
export const getAssetIcon = (type) => {
  switch(type) {
    case 'image': return <ImageIcon className="w-4 h-4" />;
    case 'video': return <Video className="w-4 h-4" />;
    case 'audio': return <Music className="w-4 h-4" />;
    case 'text': return <Type className="w-4 h-4" />;
    default: return <Box className="w-4 h-4" />;
  }
};
