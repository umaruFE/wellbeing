import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from 'antd';
import { Image, Music, Mic, Play, Plus, Type, Video } from 'lucide-react';
import { SlideRenderer } from '../../components/SlideRenderer';
import AssetGeneratorModal from '../../components/AssetGeneratorModal';
import { useAuth } from '../../contexts/AuthContext';
import { saveToHistory } from '../../modules/course-management/ppt-canvas/CanvasView.history';
import { handleAssetChange, handleDeleteAsset, handleCopyAsset } from '../../modules/course-management/ppt-canvas/CanvasView.assets';

const defaultCourseData = {
  engage: {
    id: 'engage',
    title: 'Engage',
    name: '情境启动',
    steps: [
      {
        id: 'engage-1',
        title: '星际信号接收站',
        assets: [],
        canvasAssets: [],
      },
      {
        id: 'engage-2',
        title: '动物能量球在哪里？',
        assets: [],
        canvasAssets: [],
      },
    ],
  },
  empower: {
    id: 'empower',
    title: 'Empower',
    name: '语言赋能',
    steps: [
      {
        id: 'empower-1',
        title: '语言工具箱',
        assets: [],
        canvasAssets: [],
      },
    ],
  },
  execute: {
    id: 'execute',
    title: 'Execute',
    name: '创作运用',
    steps: [
      {
        id: 'execute-1',
        title: '救援地图任务',
        assets: [],
        canvasAssets: [],
      },
    ],
  },
  elevate: {
    id: 'elevate',
    title: 'Elevate',
    name: '回顾升华',
    steps: [
      {
        id: 'elevate-1',
        title: '成果展示与复盘',
        assets: [],
        canvasAssets: [],
      },
    ],
  },
};

const phaseOrder = ['engage', 'empower', 'execute', 'elevate'];
const phaseLabelMap = { engage: 'Engage', empower: 'Empower', execute: 'Execute', elevate: 'Elevate' };

export function PptCoursewareView({ onNext, initialCourseData }) {
  const { user } = useAuth();
  const canvasRef = useRef(null);

  const [courseData, setCourseData] = useState(() => {
    if (initialCourseData) {
      if (typeof initialCourseData === 'string') {
        try {
          return JSON.parse(initialCourseData);
        } catch {
          return defaultCourseData;
        }
      }
      return initialCourseData;
    }
    return defaultCourseData;
  });

  const [history, setHistory] = useState([JSON.parse(JSON.stringify(courseData))]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const phaseKeys = Object.keys(courseData);
  const [activePhase, setActivePhase] = useState(phaseKeys[0] || 'engage');
  const [activeStepId, setActiveStepId] = useState(
    () => {
      const firstPhase = courseData[phaseKeys[0]];
      return firstPhase?.steps?.[0]?.id || null;
    }
  );
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [isRightOpen, setIsRightOpen] = useState(true);
  const [showAssetGeneratorModal, setShowAssetGeneratorModal] = useState(false);
  const [assetGeneratorType, setAssetGeneratorType] = useState(null);

  const [editingTextAssetId, setEditingTextAssetId] = useState(null);
  const [editingTextContent, setEditingTextContent] = useState('');

  const currentPhase = courseData[activePhase];
  const currentSteps = currentPhase?.steps || [];
  const currentStep = currentSteps.find(s => s.id === activeStepId) || currentSteps[0];
  const currentAssets = currentStep?.canvasAssets || currentStep?.assets || [];

  useEffect(() => {
    const keys = Object.keys(courseData);
    if (keys.length > 0 && !courseData[activePhase]) {
      setActivePhase(keys[0]);
      const firstStep = courseData[keys[0]]?.steps?.[0];
      if (firstStep) setActiveStepId(firstStep.id);
    }
  }, [courseData, activePhase]);

  const handleAddAsset = useCallback((type) => {
    if (type === 'text') {
      const newCourseData = JSON.parse(JSON.stringify(courseData));
      const phase = newCourseData[activePhase];
      if (!phase) return;
      const step = (phase.steps || []).find(s => s.id === activeStepId);
      if (!step) return;
      const newAsset = {
        id: Date.now().toString(),
        type: 'text',
        title: '文本',
        url: '',
        content: '',
        prompt: '',
        referenceImage: null,
        x: 100, y: 100, width: 300, height: 100, rotation: 0,
        fontSize: 24,
        fontWeight: 'normal',
        color: '#1e293b',
        textAlign: 'center',
      };
      if (!step.assets) step.assets = [];
      if (!step.canvasAssets) step.canvasAssets = [];
      step.assets.push(newAsset);
      step.canvasAssets.push(newAsset);
      setCourseData(newCourseData);
      saveToHistory(newCourseData, history, historyIndex, setHistory, setHistoryIndex);
      setSelectedAssetId(newAsset.id);
      setIsRightOpen(true);
      return;
    }
    setAssetGeneratorType(type);
    setShowAssetGeneratorModal(true);
  }, [courseData, activePhase, activeStepId, history, historyIndex]);

  const handleAssetGenerated = useCallback(({ type, url, title }) => {
    const newCourseData = JSON.parse(JSON.stringify(courseData));
    const phase = newCourseData[activePhase];
    if (!phase) return;
    const step = (phase.steps || []).find(s => s.id === activeStepId);
    if (!step) return;
    const newAsset = {
      id: Date.now().toString(),
      type: type === 'audio' ? 'audio' : type,
      title: title || type,
      url,
      content: '',
      prompt: '',
      referenceImage: null,
      x: 50, y: 50,
      width: type === 'audio' ? 300 : 400,
      height: type === 'audio' ? 100 : 300,
      rotation: 0,
    };
    if (!step.assets) step.assets = [];
    if (!step.canvasAssets) step.canvasAssets = [];
    step.assets.push(newAsset);
    step.canvasAssets.push(newAsset);
    setCourseData(newCourseData);
    saveToHistory(newCourseData, history, historyIndex, setHistory, setHistoryIndex);
    setSelectedAssetId(newAsset.id);
    setIsRightOpen(true);
  }, [courseData, activePhase, activeStepId, history, historyIndex]);

  const handleMouseDown = useCallback((e, assetId) => {
    e.stopPropagation();
    if (!canvasRef.current) return;
    setSelectedAssetId(assetId);
    setIsRightOpen(true);
  }, []);

  const handleCanvasClick = useCallback(() => {
    if (editingTextAssetId) {
      const asset = currentStep?.canvasAssets?.find(a => a.id === editingTextAssetId)
        || currentStep?.assets?.find(a => a.id === editingTextAssetId);
      if (asset && editingTextContent !== undefined) {
        handleAssetChange(
          editingTextAssetId, 'content', editingTextContent,
          activePhase, activeStepId, courseData, setCourseData,
          () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex)
        );
      }
      setEditingTextAssetId(null);
      setEditingTextContent('');
    }
    setSelectedAssetId(null);
  }, [editingTextAssetId, editingTextContent, currentStep, activePhase, activeStepId, courseData, history, historyIndex]);

  const selectedAsset = currentAssets.find(a => a.id === selectedAssetId);

  const getLayerIcon = (type) => {
    if (type === 'text') return 'T';
    if (type === 'audio' || type === 'voice') return '♪';
    return '▧';
  };

  return (
    <div className="fr-ppt" id="ed-ppt">
      <aside className="fr-ppt-left">
        <div className="fr-ppt-left-head">
          <strong>教案环节</strong>
          <span>选择环节生成页面</span>
        </div>
        <div className="fr-ppt-phase-list">
          {phaseOrder.map((phaseKey, index) => {
            const phase = courseData[phaseKey];
            if (!phase) return null;
            const steps = phase.steps || [];
            const isPhaseActive = activePhase === phaseKey;
            return (
              <section key={phaseKey} className={`fr-ppt-phase ph-${index} ${isPhaseActive ? 'active' : ''}`}>
                <div className="fr-ppt-phase-title" onClick={() => {
                  setActivePhase(phaseKey);
                  if (steps.length > 0) setActiveStepId(steps[0].id);
                }}>
                  {phaseLabelMap[phaseKey] || phaseKey}
                </div>
                {steps.map(step => (
                  <button
                    key={step.id}
                    className={`fr-ppt-si ${activeStepId === step.id ? 'on' : ''}`}
                    onClick={() => {
                      setActivePhase(phaseKey);
                      setActiveStepId(step.id);
                      setSelectedAssetId(null);
                    }}
                  >
                    <span>{step.title}</span>
                    <b>{(step.canvasAssets?.length || step.assets?.length || 0) > 0 ? '已生成' : '待生成'}</b>
                  </button>
                ))}
              </section>
            );
          })}
        </div>
        <div className="fr-ppt-thumbs">
          {currentSteps.map((step, idx) => (
            <button
              key={step.id}
              className={`fr-ppt-thumb ${activeStepId === step.id ? 'on' : ''}`}
              onClick={() => setActiveStepId(step.id)}
            >
              <span>{idx + 1}</span>
              <div className="fr-ppt-thumb-scene" />
            </button>
          ))}
          <button className="fr-ppt-thumb add"><Plus size={18} /></button>
        </div>
      </aside>

      <main className="fr-ppt-canvas">
        <div className="fr-canvas-bar">
          <div className="fr-canvas-info">当前页面：<strong>{currentStep?.title || '未选择'}</strong><span />页面 <b>{(currentSteps.findIndex(s => s.id === activeStepId) + 1) || 1}</b>/{currentSteps.length}</div>
          <div className="fr-canvas-tools">
            <Button icon={<Type size={15} />} onClick={() => handleAddAsset('text')}>文本</Button>
            <Button icon={<Image size={15} />} onClick={() => handleAddAsset('image')}>图片</Button>
            <Button icon={<Video size={15} />} onClick={() => handleAddAsset('video')}>视频</Button>
            <Button icon={<Music size={15} />} onClick={() => handleAddAsset('audio')}>音频</Button>
            <Button icon={<Mic size={15} />} onClick={() => handleAddAsset('voice')}>声音</Button>
          </div>
        </div>
        <div className="fr-slide-scroll">
          <div ref={canvasRef} className="fr-slide">
            <SlideRenderer
              step={currentStep}
              assets={currentAssets}
              isEditable={true}
              onMouseDown={handleMouseDown}
              onClick={(assetId) => {
                setSelectedAssetId(assetId);
                setIsRightOpen(true);
              }}
              selectedAssetId={selectedAssetId}
              onCopyAsset={(assetId) => handleCopyAsset(assetId, activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex), setSelectedAssetId)}
              onDeleteAsset={(assetId) => handleDeleteAsset(assetId, activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex), setSelectedAssetId)}
              onAssetChange={(assetId, field, value) => handleAssetChange(assetId, field, value, activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex))}
              editingTextAssetId={editingTextAssetId}
              onEditingTextAssetIdChange={setEditingTextAssetId}
              editingTextContent={editingTextContent}
              onEditingTextContentChange={setEditingTextContent}
              onCanvasClick={handleCanvasClick}
            />
          </div>
          <div className="fr-zoom-bar">
            <button>-</button><span>68%</span><button>+</button><button>□</button>
          </div>
        </div>
      </main>

      <aside className="fr-ppt-right">
        <div className="fr-panel-head">画布与图层</div>
        <div className="fr-panel-body">
          <section>
            <div className="fr-panel-label">页面背景</div>
            <div className="fr-swatch-row">
              {['#253142', '#fff', '#ffe9e2', '#fff4da', '#eaf4ff', '#f0e7ff'].map((color, index) => (
                <span key={color} className={index === 1 ? 'active' : ''} style={{ background: color }} />
              ))}
            </div>
          </section>
          <section>
            <div className="fr-panel-label">元素列表</div>
            <div className="fr-layer-list">
              {currentAssets.length === 0 && (
                <div style={{ color: '#9ca3af', fontSize: 13, padding: '8px 0' }}>暂无元素，请点击上方按钮添加</div>
              )}
              {currentAssets.map(asset => (
                <div
                  key={asset.id}
                  className={`fr-layer-row ${asset.type} ${selectedAssetId === asset.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedAssetId(asset.id);
                    setIsRightOpen(true);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <span>{getLayerIcon(asset.type)}</span>
                  <b>{asset.title || asset.type}</b>
                </div>
              ))}
            </div>
          </section>

          {selectedAsset && (
            <section>
              <div className="fr-panel-label">选中元素属性</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 12, color: '#64748b', width: 40 }}>X</label>
                  <input
                    type="number" value={selectedAsset.x || 0}
                    onChange={e => handleAssetChange(selectedAsset.id, 'x', Number(e.target.value), activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex))}
                    style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px', fontSize: 13 }}
                  />
                  <label style={{ fontSize: 12, color: '#64748b', width: 40 }}>Y</label>
                  <input
                    type="number" value={selectedAsset.y || 0}
                    onChange={e => handleAssetChange(selectedAsset.id, 'y', Number(e.target.value), activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex))}
                    style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px', fontSize: 13 }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <label style={{ fontSize: 12, color: '#64748b', width: 40 }}>宽</label>
                  <input
                    type="number" value={selectedAsset.width || 300}
                    onChange={e => handleAssetChange(selectedAsset.id, 'width', Number(e.target.value), activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex))}
                    style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px', fontSize: 13 }}
                  />
                  <label style={{ fontSize: 12, color: '#64748b', width: 40 }}>高</label>
                  <input
                    type="number" value={selectedAsset.height || 200}
                    onChange={e => handleAssetChange(selectedAsset.id, 'height', Number(e.target.value), activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex))}
                    style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px', fontSize: 13 }}
                  />
                </div>
                {selectedAsset.type === 'text' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <label style={{ fontSize: 12, color: '#64748b', width: 40 }}>字号</label>
                      <input
                        type="number" value={selectedAsset.fontSize || 24}
                        onChange={e => handleAssetChange(selectedAsset.id, 'fontSize', Number(e.target.value), activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex))}
                        style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px', fontSize: 13 }}
                      />
                      <label style={{ fontSize: 12, color: '#64748b', width: 40 }}>颜色</label>
                      <input
                        type="color" value={selectedAsset.color || '#1e293b'}
                        onChange={e => handleAssetChange(selectedAsset.id, 'color', e.target.value, activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex))}
                        style={{ width: 36, height: 28, border: '1px solid #e5e7eb', borderRadius: 6, padding: 2, cursor: 'pointer' }}
                      />
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <Button size="small" danger onClick={() => {
                    handleDeleteAsset(selectedAsset.id, activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex), setSelectedAssetId);
                  }}>删除</Button>
                  <Button size="small" onClick={() => {
                    handleCopyAsset(selectedAsset.id, activePhase, activeStepId, courseData, setCourseData, () => saveToHistory(courseData, history, historyIndex, setHistory, setHistoryIndex), setSelectedAssetId);
                  }}>复制</Button>
                </div>
              </div>
            </section>
          )}

          <section>
            <div className="fr-panel-label">AI 来源与高阶重绘</div>
            <textarea defaultValue="深蓝色太空背景，零星分布几颗亮黄色星星，一艘红白相间的卡通迷你火箭向右上方飞行..." />
            <Button type="primary" block icon={<Play size={15} />}>重新生成图片</Button>
          </section>
          <Button type="primary" size="large" block onClick={onNext}>进入阅读材料</Button>
        </div>
      </aside>

      {showAssetGeneratorModal && (
        <AssetGeneratorModal
          isOpen={showAssetGeneratorModal}
          onClose={() => {
            setShowAssetGeneratorModal(false);
            setAssetGeneratorType(null);
          }}
          assetType={assetGeneratorType}
          onGenerated={(result) => {
            handleAssetGenerated(result);
            setShowAssetGeneratorModal(false);
            setAssetGeneratorType(null);
          }}
          userId={user?.id}
          organizationId={user?.organization_id}
        />
      )}
    </div>
  );
}
