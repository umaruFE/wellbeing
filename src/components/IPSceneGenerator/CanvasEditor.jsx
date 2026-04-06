import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Move, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';

export const CanvasEditor = ({ 
  background, 
  roles, 
  rolePositions, 
  onRolePositionChange,
  aspectRatio 
}) => {
  const canvasRef = useRef(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const backgroundImgRef = useRef(null);
  const roleImgsRef = useRef({});
  const animationFrameRef = useRef(null);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !backgroundImgRef.current) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const scale = Math.min(canvas.width / aspectRatio.width, canvas.height / aspectRatio.height);
    const x = (canvas.width - aspectRatio.width * scale) / 2;
    const y = (canvas.height - aspectRatio.height * scale) / 2;
    
    ctx.drawImage(backgroundImgRef.current, x, y, aspectRatio.width * scale, aspectRatio.height * scale);
    
    Object.entries(roles).forEach(([roleName, roleUrl]) => {
      const position = rolePositions[roleName];
      const roleImg = roleImgsRef.current[roleName];
      if (!position || !roleImg) return;
      
      const roleScale = 0.3 * (position.scale || 1);
      const roleWidth = roleImg.width * roleScale;
      const roleHeight = roleImg.height * roleScale;
      
      ctx.save();
      ctx.translate(position.x + roleWidth / 2, position.y + roleHeight / 2);
      ctx.rotate((position.rotation || 0) * Math.PI / 180);
      ctx.drawImage(roleImg, -roleWidth / 2, -roleHeight / 2, roleWidth, roleHeight);
      ctx.restore();
      
      if (selectedRole === roleName) {
        ctx.strokeStyle = '#9333ea';
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(position.x - 2, position.y - 2, roleWidth + 4, roleHeight + 4);
        ctx.setLineDash([]);
      }
    });
  }, [roles, rolePositions, selectedRole, aspectRatio]);

  useEffect(() => {
    if (!background) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      backgroundImgRef.current = img;
      drawCanvas();
    };
    img.src = background;
  }, [background, drawCanvas]);

  useEffect(() => {
    Object.entries(roles).forEach(([roleName, roleUrl]) => {
      if (roleImgsRef.current[roleName]) return;
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        roleImgsRef.current[roleName] = img;
        drawCanvas();
      };
      img.src = roleUrl;
    });
  }, [roles, drawCanvas]);

  useEffect(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(drawCanvas);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawCanvas]);

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let foundRole = null;
    Object.entries(rolePositions).forEach(([roleName, position]) => {
      const roleScale = 0.3 * (position.scale || 1);
      const roleWidth = 1024 * roleScale;
      const roleHeight = 1024 * roleScale;
      
      if (x >= position.x && x <= position.x + roleWidth &&
          y >= position.y && y <= position.y + roleHeight) {
        foundRole = roleName;
      }
    });

    if (foundRole) {
      setSelectedRole(foundRole);
      setIsDragging(true);
      setDragOffset({
        x: x - rolePositions[foundRole].x,
        y: y - rolePositions[foundRole].y
      });
    } else {
      setSelectedRole(null);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedRole) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    onRolePositionChange(selectedRole, {
      ...rolePositions[selectedRole],
      x: x - dragOffset.x,
      y: y - dragOffset.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScaleChange = (delta) => {
    if (!selectedRole) return;
    
    const currentScale = rolePositions[selectedRole]?.scale || 1;
    const newScale = Math.max(0.3, Math.min(3, currentScale + delta));
    
    onRolePositionChange(selectedRole, {
      ...rolePositions[selectedRole],
      scale: newScale
    });
  };

  const handleRotationChange = (delta) => {
    if (!selectedRole) return;
    
    const currentRotation = rolePositions[selectedRole]?.rotation || 0;
    const newRotation = currentRotation + delta;
    
    onRolePositionChange(selectedRole, {
      ...rolePositions[selectedRole],
      rotation: newRotation
    });
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {background ? (
        <>
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm font-medium text-slate-700">选择角色：</span>
              <div className="flex gap-2">
                {Object.keys(roles).map(roleName => (
                  <button
                    key={roleName}
                    onClick={() => setSelectedRole(roleName)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedRole === roleName
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-gray-300 text-slate-700 hover:bg-gray-50'
                    }`}
                  >
                    {roleName}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center bg-gray-100 p-4">
            <canvas
              ref={canvasRef}
              width={700}
              height={500}
              className="border-2 border-gray-300 rounded-lg cursor-move bg-white shadow-lg flex-shrink-0"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          {selectedRole && (
            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <span className="text-sm font-medium text-slate-700">
                  已选择: {selectedRole}
                </span>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleScaleChange(-0.1)}
                    className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                    title="缩小"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  
                  <span className="text-sm text-slate-600 w-16 text-center">
                    {Math.round((rolePositions[selectedRole]?.scale || 1) * 100)}%
                  </span>
                  
                  <button
                    onClick={() => handleScaleChange(0.1)}
                    className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                    title="放大"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRotationChange(-15)}
                    className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                    title="逆时针旋转"
                  >
                    <RotateCw className="w-4 h-4 transform -scale-x-100" />
                  </button>
                  
                  <span className="text-sm text-slate-600 w-12 text-center">
                    {rolePositions[selectedRole]?.rotation || 0}°
                  </span>
                  
                  <button
                    onClick={() => handleRotationChange(15)}
                    className="p-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                    title="顺时针旋转"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Move className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg font-medium">画布编辑器</p>
            <p className="text-gray-400 text-sm mt-2">生成资源后，可在此编辑角色位置</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasEditor;
