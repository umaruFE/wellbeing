import React, { useState } from 'react';
import { X, Check, Eye, Layout, Wand2 } from 'lucide-react';
import PPT_TEMPLATES from './templates';

export const TemplateSelectionModal = ({ isOpen, onClose, onConfirm }) => {
  const [selectedId, setSelectedId] = useState(PPT_TEMPLATES[0].id);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [autoLayout, setAutoLayout] = useState(true);

  if (!isOpen) return null;

  const selected = PPT_TEMPLATES.find(t => t.id === selectedId);

  const handleConfirm = () => {
    onConfirm(selectedId, autoLayout);
  };

  const renderPreview = (template, large = false) => {
    const w = large ? 480 : 160;
    const h = large ? 270 : 90;
    const layout = template.contentLayout;

    return (
      <div
        style={{
          width: w,
          height: h,
          ...template.contentBackgroundStyle,
          borderRadius: large ? 8 : 4,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        {large && (
          <>
            <div style={{
              position: 'absolute',
              left: layout.title.x * (w / 960),
              top: layout.title.y * (h / 540),
              width: layout.title.w * (w / 960),
              height: layout.title.h * (h / 540),
              background: 'rgba(74,144,217,0.15)',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 4,
              fontSize: Math.max(6, layout.title.fontSize * (w / 960) * 0.5),
              color: template.previewColors.primary,
              fontWeight: 'bold',
              overflow: 'hidden',
            }}>
              环节标题
            </div>
            <div style={{
              position: 'absolute',
              left: layout.objective.x * (w / 960),
              top: layout.objective.y * (h / 540),
              width: layout.objective.w * (w / 960),
              height: layout.objective.h * (h / 540),
              background: 'rgba(255,138,101,0.12)',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'flex-start',
              padding: 3,
              fontSize: Math.max(4, layout.objective.fontSize * (w / 960) * 0.5),
              color: template.previewColors.secondary,
              overflow: 'hidden',
            }}>
              教学目标...
            </div>
            <div style={{
              position: 'absolute',
              left: layout.activitySteps.x * (w / 960),
              top: layout.activitySteps.y * (h / 540),
              width: layout.activitySteps.w * (w / 960),
              height: layout.activitySteps.h * (h / 540),
              background: 'rgba(102,187,106,0.1)',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'flex-start',
              padding: 3,
              fontSize: Math.max(4, layout.activitySteps.fontSize * (w / 960) * 0.5),
              color: template.previewColors.primary,
              overflow: 'hidden',
            }}>
              ① 步骤一... ② 步骤二...
            </div>
            <div style={{
              position: 'absolute',
              left: layout.image.x * (w / 960),
              top: layout.image.y * (h / 540),
              width: layout.image.w * (w / 960),
              height: layout.image.h * (h / 540),
              background: 'rgba(200,200,200,0.3)',
              borderRadius: 3,
              border: '1px dashed rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: Math.max(5, 8 * (w / 960)),
              color: 'rgba(0,0,0,0.25)',
            }}>
              图片区域
            </div>
            <div style={{
              position: 'absolute',
              left: layout.script.x * (w / 960),
              top: layout.script.y * (h / 540),
              width: layout.script.w * (w / 960),
              height: layout.script.h * (h / 540),
              background: 'rgba(149,117,205,0.1)',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'flex-start',
              padding: 3,
              fontSize: Math.max(4, layout.script.fontSize * (w / 960) * 0.5),
              color: template.previewColors.secondary,
              overflow: 'hidden',
            }}>
              教师讲稿...
            </div>
          </>
        )}

        {!large && (
          <>
            <div style={{
              position: 'absolute',
              left: 4, top: 3,
              width: '60%', height: 6,
              background: 'rgba(74,144,217,0.3)',
              borderRadius: 2,
            }} />
            <div style={{
              position: 'absolute',
              left: 4, top: 12,
              width: '40%', height: 20,
              background: 'rgba(255,138,101,0.2)',
              borderRadius: 2,
            }} />
            <div style={{
              position: 'absolute',
              right: 4, top: 12,
              width: '45%', height: 35,
              background: 'rgba(200,200,200,0.3)',
              borderRadius: 2,
              border: '0.5px dashed rgba(0,0,0,0.15)',
            }} />
            <div style={{
              position: 'absolute',
              left: 4, bottom: 4,
              width: '40%', height: 20,
              background: 'rgba(102,187,106,0.15)',
              borderRadius: 2,
            }} />
          </>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        <div className="p-6 border-b border-stroke-light flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-info p-2 rounded-lg text-white"><Layout className="w-5 h-5" /></div>
            <div>
              <h3 className="font-bold text-lg text-primary">选择 PPT 模版</h3>
              <p className="text-sm text-primary-secondary">选择一个背景模版，系统将自动排版课程内容到画布</p>
            </div>
          </div>
          <button onClick={onClose} className="text-primary-placeholder hover:text-primary-secondary transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {PPT_TEMPLATES.map(template => (
              <div
                key={template.id}
                onClick={() => setSelectedId(template.id)}
                className={`cursor-pointer rounded-xl border-2 p-3 transition-all ${
                  selectedId === template.id
                    ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg'
                    : 'border-stroke-light hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-primary">{template.name}</span>
                  {selectedId === template.id && (
                    <Check className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <div className="flex justify-center mb-2">
                  {renderPreview(template)}
                </div>
                <p className="text-xs text-primary-secondary">{template.description}</p>
              </div>
            ))}
          </div>

          {selected && (
            <div className="border-2 border-stroke-light rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-primary-secondary" />
                <span className="font-bold text-sm text-primary">预览：{selected.name}</span>
              </div>
              <div className="flex gap-4 justify-center">
                <div className="text-center">
                  <div className="text-xs text-primary-secondary mb-2">封面页</div>
                  <div
                    style={{
                      width: 240, height: 135,
                      ...selected.coverBackgroundStyle,
                      borderRadius: 8,
                      position: 'relative',
                      overflow: 'hidden',
                      border: '1px solid rgba(0,0,0,0.08)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      left: 40, top: 60,
                      width: 160, height: 30,
                      background: 'rgba(0,0,0,0.06)',
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      color: selected.previewColors.primary,
                      fontWeight: 'bold',
                    }}>
                      课程标题
                    </div>
                    <div style={{
                      position: 'absolute',
                      left: 60, top: 100,
                      width: 120, height: 20,
                      background: 'rgba(0,0,0,0.03)',
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 7,
                      color: selected.previewColors.secondary,
                    }}>
                      课程简介...
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-primary-secondary mb-2">内容页</div>
                  <div
                    style={{
                      width: 240, height: 135,
                      ...selected.contentBackgroundStyle,
                      borderRadius: 8,
                      position: 'relative',
                      overflow: 'hidden',
                      border: '1px solid rgba(0,0,0,0.08)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      left: 10, top: 5,
                      width: '80%', height: 10,
                      background: 'rgba(74,144,217,0.15)',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      paddingLeft: 3,
                      fontSize: 5,
                      color: selected.previewColors.primary,
                      fontWeight: 'bold',
                    }}>
                      环节标题
                    </div>
                    <div style={{
                      position: 'absolute',
                      left: 10, top: 18,
                      width: '40%', height: 28,
                      background: 'rgba(255,138,101,0.12)',
                      borderRadius: 2,
                      padding: 2,
                      fontSize: 4,
                      color: selected.previewColors.secondary,
                    }}>
                      教学目标...
                    </div>
                    <div style={{
                      position: 'absolute',
                      left: 10, top: 50,
                      width: '40%', height: 50,
                      background: 'rgba(102,187,106,0.1)',
                      borderRadius: 2,
                      padding: 2,
                      fontSize: 3.5,
                      color: selected.previewColors.primary,
                    }}>
                      ① 步骤一... ② 步骤二...
                    </div>
                    <div style={{
                      position: 'absolute',
                      right: 10, top: 18,
                      width: '45%', height: 45,
                      background: 'rgba(200,200,200,0.3)',
                      borderRadius: 2,
                      border: '0.5px dashed rgba(0,0,0,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 4,
                      color: 'rgba(0,0,0,0.25)',
                    }}>
                      图片
                    </div>
                    <div style={{
                      position: 'absolute',
                      right: 10, bottom: 10,
                      width: '45%', height: 22,
                      background: 'rgba(149,117,205,0.1)',
                      borderRadius: 2,
                      padding: 2,
                      fontSize: 3.5,
                      color: selected.previewColors.secondary,
                    }}>
                      讲稿...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 p-4 bg-surface-alt rounded-xl">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                autoLayout ? 'bg-blue-500 border-blue-500' : 'border-stroke-light bg-white'
              }`}>
                {autoLayout && <Check className="w-3 h-3 text-white" />}
              </div>
              <div>
                <input type="checkbox" checked={autoLayout} onChange={(e) => setAutoLayout(e.target.checked)} className="hidden" />
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-info" />
                  <span className="font-bold text-sm text-primary">AI 自动排版</span>
                </div>
                <p className="text-xs text-primary-secondary mt-0.5">自动将课程标题、教学目标、活动流程、讲稿排版到画布上</p>
              </div>
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-stroke-light flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-surface-alt text-primary-secondary rounded-lg font-medium hover:bg-stroke transition-colors"
          >
            跳过，手动排版
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 bg-info text-white rounded-lg font-medium hover:bg-info-active transition-colors flex items-center justify-center gap-2"
          >
            <Wand2 className="w-4 h-4" />
            应用模版{autoLayout ? '并自动排版' : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
