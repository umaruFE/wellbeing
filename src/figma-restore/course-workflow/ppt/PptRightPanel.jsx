import { History, RotateCcw, Upload } from 'lucide-react';
import { PptAssetPanel } from './PptAssetPanel';
import { layerIcon } from './pptUtils';

const colors = ['#ffffff', '#f8fafc', '#fff4da', '#eaf4ff', '#f0e7ff', '#253142'];

function InputWithUnit({ value, unit, onChange }) {
  return (
    <div className="video-input-wrap">
      <input className="fi video-form-input" type="number" value={value || 0} onChange={(event) => onChange(Number(event.target.value))} />
      <span className="video-input-unit">{unit}</span>
    </div>
  );
}

export function PptRightPanel({
  slide,
  selectedLayer,
  selectedLayerId,
  onSelectLayer,
  onUpdateSlide,
  onUpdateLayer,
  onDuplicateLayer,
  onDeleteLayer,
  onNext,
  assetPanelType,
  onCloseAssetPanel,
  onInsertGeneratedAsset,
}) {
  if (assetPanelType) {
    return (
      <PptAssetPanel
        type={assetPanelType}
        onClose={onCloseAssetPanel}
        onInsert={onInsertGeneratedAsset}
      />
    );
  }

  if (selectedLayer) {
    const title = selectedLayer.type === 'video'
      ? '编辑视频素材'
      : selectedLayer.type === 'audio'
        ? '编辑音频素材'
        : selectedLayer.type === 'image'
          ? '编辑图片素材'
          : selectedLayer.type === 'text'
            ? '编辑文本'
            : '编辑元素';

    return (
      <aside className="ppt-right">
        <div id="panelElement" data-layer-type={selectedLayer.type}>
          <div className="element-panel-head">
            <span id="panelElementTitle">{title}</span>
            <button className="btn-icon element-panel-close" type="button" onClick={() => onSelectLayer(null)}>×</button>
          </div>

          <div className="video-form-body">
            <div className="fg video-form-group">
              <label className="fl video-form-label" id="elNameLabel">
                {selectedLayer.type === 'image' || selectedLayer.type === 'audio' ? '素材名称' : selectedLayer.type === 'text' ? '图层名称素材' : '图层名称'}
              </label>
              <input
                className="fi video-form-input"
                id="elName"
                placeholder="图层名称（选填）"
                value={selectedLayer.title || ''}
                onChange={(event) => onUpdateLayer({ title: event.target.value })}
              />
            </div>

            {selectedLayer.type !== 'audio' && (
              <div className="video-size-grid" id="elSizeRow">
                <div className="video-form-group compact">
                  <label className="fl video-form-label">宽</label>
                  <InputWithUnit value={selectedLayer.width} unit="px" onChange={(width) => onUpdateLayer({ width })} />
                </div>
                <div className="video-form-group compact el-size-height">
                  <label className="fl video-form-label">高</label>
                  <InputWithUnit value={selectedLayer.height} unit="px" onChange={(height) => onUpdateLayer({ height })} />
                </div>
                <div className="video-form-group compact">
                  <label className="fl video-form-label">旋转</label>
                  <InputWithUnit value={selectedLayer.rotation || 0} unit="°" onChange={(rotation) => onUpdateLayer({ rotation })} />
                </div>
              </div>
            )}

            {selectedLayer.type === 'text' && (
              <div id="elTextCtrl">
                <div className="text-dim-grid">
                  <div className="video-form-group">
                    <label className="text-control-label">文本样式</label>
                    <select className="fi video-form-input text-style-select" value={selectedLayer.fontWeight || 'bold'} onChange={(event) => onUpdateLayer({ fontWeight: event.target.value })}>
                      <option value="normal">常规</option>
                      <option value="bold">加粗</option>
                    </select>
                  </div>
                  <div className="video-form-group">
                    <label className="text-control-label">尺寸</label>
                    <InputWithUnit value={selectedLayer.fontSize || 32} unit="px" onChange={(fontSize) => onUpdateLayer({ fontSize })} />
                  </div>
                </div>
                <div className="text-control-row">
                  <button type="button" className={`text-seg-btn ${selectedLayer.fontWeight === 'bold' ? 'on' : ''}`} onClick={() => onUpdateLayer({ fontWeight: 'bold' })}>B</button>
                  <button type="button" className={`text-seg-btn ${selectedLayer.fontStyle === 'italic' ? 'on' : ''}`} onClick={() => onUpdateLayer({ fontStyle: selectedLayer.fontStyle === 'italic' ? 'normal' : 'italic' })}><em>I</em></button>
                  <label className="text-hex-wrap">
                    <span>颜色</span>
                    <input type="color" value={selectedLayer.color || '#253142'} onChange={(event) => onUpdateLayer({ color: event.target.value })} />
                  </label>
                </div>
                <div className="text-dim-grid">
                  <div className="video-form-group">
                    <label className="text-control-label">文本描边</label>
                    <input className="fi video-form-input" type="color" value={selectedLayer.strokeColor || '#F4785E'} onChange={(event) => onUpdateLayer({ strokeColor: event.target.value })} />
                  </div>
                  <div className="video-form-group">
                    <label className="text-control-label">&nbsp;</label>
                    <InputWithUnit value={selectedLayer.strokeWidth || 0} unit="px" onChange={(strokeWidth) => onUpdateLayer({ strokeWidth })} />
                  </div>
                </div>
                <div className="video-form-group">
                  <label className="video-form-label">文本内容</label>
                  <textarea className="fi video-form-input text-content-area" value={selectedLayer.content || ''} onChange={(event) => onUpdateLayer({ content: event.target.value })} />
                </div>
              </div>
            )}

            {selectedLayer.type === 'image' && (
              <div id="elImageCtrl">
                <button className="image-replace-drop" type="button">
                  <Upload size={18} />
                  <span>替换本地图片</span>
                </button>
                <div className="video-form-group image-prompt-group">
                  <label className="video-form-label image-prompt-label">原始提示词（可修改后重新生成）</label>
                  <textarea className="fi video-form-input image-prompt-area" value={selectedLayer.prompt || ''} onChange={(event) => onUpdateLayer({ prompt: event.target.value })} />
                </div>
                <button className="image-panel-btn regenerate" type="button"><RotateCcw size={15} />重新生成图片</button>
              </div>
            )}

            {selectedLayer.type === 'video' && (
              <div id="elVideoCtrl">
                <div className="video-metric-card">
                  <div className="video-meta-row"><span className="k">视频类型</span><span className="v">{selectedLayer.videoMeta?.videoType || '体能闯关'}</span></div>
                  <div className="video-meta-row"><span className="k">时长</span><span className="v">{selectedLayer.duration || '02:16'}</span></div>
                  <div className="video-meta-row"><span className="k">场景 / 模板</span><span className="v">{selectedLayer.videoMeta?.scene || '森林 / 拯救型'}</span></div>
                  <div className="video-meta-row"><span className="k">IP 角色</span><span className="v">{selectedLayer.videoMeta?.chars || 'Poppy, Edi'}</span></div>
                </div>
                <div className="video-stats">
                  <div className="video-stat-box"><span>词汇数</span><strong>{selectedLayer.videoMeta?.vocab || 12}</strong></div>
                  <div className="video-stat-box"><span>句型数</span><strong>{selectedLayer.videoMeta?.sents || 5}</strong></div>
                </div>
                <div className="video-toggle-row"><span>自动播放</span><button type="button" className="toggle-switch on"><i /></button></div>
                <div className="video-toggle-row"><span>循环播放</span><button type="button" className="toggle-switch"><i /></button></div>
                <div className="video-toggle-row"><span>静音播放</span><button type="button" className="toggle-switch"><i /></button></div>
                <div className="video-action-row">
                  <button className="video-panel-btn" type="button"><History size={15} />生成历史</button>
                  <button className="video-panel-btn regenerate" type="button"><RotateCcw size={15} />重新生成</button>
                </div>
              </div>
            )}

            {selectedLayer.type === 'audio' && (
              <div id="elAudioCtrl">
                <div className="audio-meta-row"><span className="k">音频类型</span><span className="v">{selectedLayer.audioMeta?.type || selectedLayer.title || '情绪氛围BGM'}</span></div>
                <div className="audio-meta-row"><span className="k">时长</span><span className="v">{selectedLayer.duration || '02:16'}</span></div>
                <div className="video-form-group image-prompt-group">
                  <label className="video-form-label image-prompt-label">原始提示词（可修改后重新生成）</label>
                  <textarea className="fi video-form-input image-prompt-area" value={selectedLayer.prompt || ''} onChange={(event) => onUpdateLayer({ prompt: event.target.value })} />
                </div>
                <button className="audio-panel-btn regenerate" type="button"><RotateCcw size={15} />重新生成音频</button>
              </div>
            )}

          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="ppt-right">
      <div className="ppt-right-head">画布与图层</div>
      <div className="ppt-right-body">
        <section>
          <div className="ppt-panel-label">页面背景</div>
          <div className="ppt-bg-row">
            {colors.map((color) => (
              <button
                type="button"
                key={color}
                className={slide?.background === color ? 'on' : ''}
                style={{ background: color }}
                onClick={() => onUpdateSlide({ background: color })}
                aria-label={`背景色 ${color}`}
              />
            ))}
          </div>
        </section>

        <section>
          <div className="ppt-panel-label-row">
            <span>元素列表</span>
            <b>{slide?.layers?.length || 0}</b>
          </div>
          <div className="ppt-layer-list">
            {(!slide?.layers || slide.layers.length === 0) && (
              <div className="ppt-layer-empty">暂无元素，点击上方工具栏添加</div>
            )}
            {slide?.layers?.map((layer) => (
              <button
                type="button"
                key={layer.id}
                className={`ppt-layer-row ${selectedLayerId === layer.id ? 'is-selected' : ''}`}
                onClick={() => onSelectLayer(layer.id)}
              >
                <span>{layerIcon(layer.type)}</span>
                <strong>{layer.title || layer.type}</strong>
              </button>
            ))}
          </div>
        </section>

        {selectedLayer && (
          <section>
            <div className="ppt-panel-label">编辑元素</div>
            <label className="ppt-field">
              <span>图层名称</span>
              <input value={selectedLayer.title || ''} onChange={(event) => onUpdateLayer({ title: event.target.value })} />
            </label>

            <div className="ppt-size-grid">
              <label>
                <span>宽</span>
                <input type="number" value={selectedLayer.width || 0} onChange={(event) => onUpdateLayer({ width: Number(event.target.value) })} />
              </label>
              <label>
                <span>高</span>
                <input type="number" value={selectedLayer.height || 0} onChange={(event) => onUpdateLayer({ height: Number(event.target.value) })} />
              </label>
              <label>
                <span>旋转</span>
                <input type="number" value={selectedLayer.rotation || 0} onChange={(event) => onUpdateLayer({ rotation: Number(event.target.value) })} />
              </label>
            </div>

            {selectedLayer.type === 'text' && (
              <>
                <div className="ppt-size-grid two">
                  <label>
                    <span>字号</span>
                    <input type="number" value={selectedLayer.fontSize || 32} onChange={(event) => onUpdateLayer({ fontSize: Number(event.target.value) })} />
                  </label>
                  <label>
                    <span>颜色</span>
                    <input type="color" value={selectedLayer.color || '#253142'} onChange={(event) => onUpdateLayer({ color: event.target.value })} />
                  </label>
                </div>
                <textarea
                  className="ppt-text-area"
                  value={selectedLayer.content || ''}
                  onChange={(event) => onUpdateLayer({ content: event.target.value })}
                />
              </>
            )}

            {(selectedLayer.type === 'image' || selectedLayer.type === 'video') && (
              <label className="ppt-field">
                <span>原始提示词</span>
                <textarea value={selectedLayer.prompt || ''} onChange={(event) => onUpdateLayer({ prompt: event.target.value })} />
              </label>
            )}

            {selectedLayer.type === 'video' && (
              <div className="ppt-meta-card">
                <div><span>视频类型</span><b>{selectedLayer.videoMeta?.videoType || '体能闯关'}</b></div>
                <div><span>时长</span><b>{selectedLayer.duration || '02:16'}</b></div>
                <div><span>场景 / 模板</span><b>{selectedLayer.videoMeta?.scene || '森林 / 闯关型'}</b></div>
              </div>
            )}

            <div className="ppt-actions">
              <button type="button" onClick={onDuplicateLayer}><Copy size={14} />复制</button>
              <button type="button" onClick={onDeleteLayer}><Trash2 size={14} />删除</button>
            </div>
          </section>
        )}

        <section>
          <div className="ppt-panel-label">AI 溯源与高阶重绘</div>
          <textarea className="ppt-text-area" defaultValue="深蓝色太空背景，零星分布几颗亮黄色星星，一艘红白相间的卡通迷你火箭向右上方飞行。" />
          <button type="button" className="ppt-regenerate"><RotateCcw size={15} />重新生成</button>
        </section>

        <button type="button" className="ppt-next" onClick={onNext}>进入阅读材料</button>
      </div>
    </aside>
  );
}
