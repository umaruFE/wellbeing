import { Button, Form, Input, InputNumber, Radio, Select, Switch } from 'antd';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Eye,
  EyeOff,
  History,
  Image,
  Italic,
  Music,
  RotateCcw,
  Type,
  Underline,
  Video,
  X,
} from 'lucide-react';
import { PptAssetPanel } from './PptAssetPanel';

const swatches = ['#253142', '#ffffff', '#fff1ed', '#eaf4ff', '#f0e7ff'];

const fallbackLayers = [
  { id: 'demo-image-muted', type: 'image', title: 'landscape 主题意境图', muted: true, hidden: true },
  { id: 'demo-image', type: 'image', title: 'landscape 主题意境图' },
  { id: 'demo-video', type: 'video', title: '银河交通图叙事视频' },
  { id: 'demo-audio', type: 'audio', title: '星际背景音效' },
  { id: 'demo-text', type: 'text', title: '太空探险指引文字' },
];

function LayerGlyph({ type }) {
  if (type === 'text') return <Type size={15} />;
  if (type === 'audio') return <Music size={16} />;
  if (type === 'video') return <Video size={15} />;
  return <Image size={15} />;
}

function InputWithUnit({ value, unit, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <InputNumber
        className="fi"
        controls={false}
        value={value || 0}
        style={{ flex: 1, minWidth: 0 }}
        onChange={(next) => onChange(Number(next) || 0)}
      />
      <span style={{ flex: '0 0 auto', color: '#9ca3af', fontSize: 12, lineHeight: 1 }}>{unit}</span>
    </div>
  );
}

function ToggleRow({ label, on = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <span>{label}</span>
      <Switch defaultChecked={on} />
    </div>
  );
}

function TextPanel({ selectedLayer, onUpdateLayer }) {
  const groupStyle = {
    display: 'grid',
    gap: 8,
    minWidth: 0,
  };

  return (
    <Form layout="vertical">
      <div style={{ ...groupStyle, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <Form.Item label="宽" style={{ marginBottom: 0 }}>
          <InputWithUnit value={selectedLayer.width} unit="px" onChange={(width) => onUpdateLayer({ width })} />
          </Form.Item>
        </div>
        <div style={{ minWidth: 0 }}>
          <Form.Item label="旋转" style={{ marginBottom: 0 }}>
          <InputWithUnit value={selectedLayer.rotation || 0} unit="°" onChange={(rotation) => onUpdateLayer({ rotation })} />
          </Form.Item>
        </div>
      </div>

      <div style={{ ...groupStyle, gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)', marginBottom: 12 }}>
        <div style={{ minWidth: 0 }}>
          <Form.Item label="文本样式" style={{ marginBottom: 0 }}>
          <Select
            className="fi"
            value={selectedLayer.fontFamily || '思源黑体 (Bold)'}
            style={{ width: '100%' }}
            onChange={(fontFamily) => onUpdateLayer({ fontFamily })}
            options={[
              { value: '思源黑体 (Bold)', label: '思源黑体 (Bold)' },
              { value: 'Arial Bold', label: 'Arial Bold' },
            ]}
          />
          </Form.Item>
        </div>
        <div style={{ minWidth: 0 }}>
          <Form.Item label="尺寸" style={{ marginBottom: 0 }}>
          <InputWithUnit value={selectedLayer.fontSize || 32} unit="px" onChange={(fontSize) => onUpdateLayer({ fontSize })} />
          </Form.Item>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.25fr)', gap: 8, marginBottom: 12, minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <Form.Item label="B/I/U" style={{ marginBottom: 0 }}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={selectedLayer.fontStyle === 'italic' ? 'italic' : selectedLayer.textDecoration === 'underline' ? 'underline' : selectedLayer.fontWeight === 'bold' ? 'bold' : 'normal'}
            onChange={(event) => {
              const next = event.target.value;
              onUpdateLayer({
                fontWeight: next === 'bold' ? 'bold' : 'normal',
                fontStyle: next === 'italic' ? 'italic' : 'normal',
                textDecoration: next === 'underline' ? 'underline' : 'none',
              });
            }}
            style={{ display: 'flex', width: '100%' }}
            >
            <Radio.Button value="bold" style={{ flex: 1, textAlign: 'center' }}><Bold size={14} /></Radio.Button>
            <Radio.Button value="italic" style={{ flex: 1, textAlign: 'center' }}><Italic size={14} /></Radio.Button>
            <Radio.Button value="underline" style={{ flex: 1, textAlign: 'center' }}><Underline size={14} /></Radio.Button>
          </Radio.Group>
          </Form.Item>
        </div>

        <div style={{ minWidth: 0 }}>
          <Form.Item label="对齐" style={{ marginBottom: 0 }}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={selectedLayer.textAlign || 'center'}
            onChange={(event) => onUpdateLayer({ textAlign: event.target.value })}
            style={{ display: 'flex', width: '100%' }}
            >
            <Radio.Button value="left" style={{ flex: 1, textAlign: 'center' }}><AlignLeft size={14} /></Radio.Button>
            <Radio.Button value="center" style={{ flex: 1, textAlign: 'center' }}><AlignCenter size={14} /></Radio.Button>
            <Radio.Button value="right" style={{ flex: 1, textAlign: 'center' }}><AlignRight size={14} /></Radio.Button>
          </Radio.Group>
          </Form.Item>
        </div>

        <div style={{ minWidth: 0 }}>
          <Form.Item label="颜色 Hex" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ width: 12, height: 12, borderRadius: 999, background: selectedLayer.color || '#253142', flex: '0 0 auto' }} />
            <Input value={selectedLayer.color || '#253142'} onChange={(event) => onUpdateLayer({ color: event.target.value })} />
          </div>
          </Form.Item>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 96px', gap: 8, marginBottom: 12, minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <Form.Item label="文本描边" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ width: 12, height: 12, borderRadius: 999, background: selectedLayer.color || '#F4785E', flex: '0 0 auto' }} />
            <Input value={selectedLayer.color || '#F4785E'} onChange={(event) => onUpdateLayer({ color: event.target.value })} />
          </div>
          </Form.Item>
        </div>
        <div style={{ minWidth: 0 }}>
          <Form.Item label="描边宽度" style={{ marginBottom: 0 }}>
          <InputWithUnit value={selectedLayer.strokeWidth || 2} unit="px" onChange={(strokeWidth) => onUpdateLayer({ strokeWidth })} />
          </Form.Item>
        </div>
      </div>

      <div style={{ minWidth: 0 }}>
        <Form.Item label="文本内容" style={{ marginBottom: 0 }}>
        <Input.TextArea
          className="fi"
          placeholder="Textarea"
          value={selectedLayer.content || ''}
          onChange={(event) => onUpdateLayer({ content: event.target.value })}
        />
        </Form.Item>
      </div>
    </Form>
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
    const isVideo = selectedLayer.type === 'video';
    const isText = selectedLayer.type === 'text';
    const title = isVideo
      ? '编辑视频素材'
      : selectedLayer.type === 'audio'
        ? '编辑音频素材'
        : selectedLayer.type === 'image'
          ? '编辑图片素材'
          : isText
            ? '编辑文本'
            : '编辑元素';

    return (
      <aside className="ppt-right">
        <div id="panelElement" className="overview-ant-form" data-layer-type={selectedLayer.type} style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 12, marginBottom: 14, borderBottom: '1px solid #e5e7eb' }}>
            <span id="panelElementTitle">{title}</span>
            <button className="btn-icon element-panel-close" type="button" onClick={() => onSelectLayer(null)} aria-label="关闭">
              <X size={16} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <Form.Item label="图层名称素材" style={{ marginBottom: 0 }}>
              <Input
                className="fi"
                id="elName"
                placeholder="图层名称"
                value={selectedLayer.title || ''}
                onChange={(event) => onUpdateLayer({ title: event.target.value })}
              />
              </Form.Item>
            </div>

            {selectedLayer.type !== 'audio' && !isText && (
              <div id="elSizeRow" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, minWidth: 0 }}>
                <div style={{ minWidth: 0 }}>
                  <Form.Item label="宽" style={{ marginBottom: 0 }}>
                  <InputWithUnit value={selectedLayer.width} unit="px" onChange={(width) => onUpdateLayer({ width })} />
                  </Form.Item>
                </div>
                <div style={{ minWidth: 0 }}>
                  <Form.Item label="高" style={{ marginBottom: 0 }}>
                  <InputWithUnit value={selectedLayer.height} unit="px" onChange={(height) => onUpdateLayer({ height })} />
                  </Form.Item>
                </div>
                <div style={{ minWidth: 0 }}>
                  <Form.Item label="旋转" style={{ marginBottom: 0 }}>
                  <InputWithUnit value={selectedLayer.rotation || 0} unit="°" onChange={(rotation) => onUpdateLayer({ rotation })} />
                  </Form.Item>
                </div>
              </div>
            )}

            {isVideo && (
              <div id="elVideoCtrl">
                <div className="video-metric-card">
                  <div className="video-meta-row"><span className="k">视频类型</span><span className="v">{selectedLayer.videoMeta?.videoType || '体能闯关'}</span></div>
                  <div className="video-meta-row"><span className="k">时长</span><span className="v">{selectedLayer.duration || '02:16'}</span></div>
                  <div className="video-meta-row"><span className="k">场景 / 模板</span><span className="v">{selectedLayer.videoMeta?.scene || '森林 / 拯救型'}</span></div>
                  <div className="video-meta-row"><span className="k">IP 角色</span><span className="v">{selectedLayer.videoMeta?.chars || 'Poppy, Edi'}</span></div>
                  <div className="video-stats">
                    <div className="video-stat-box"><span>词汇数</span><strong>{selectedLayer.videoMeta?.vocab || 12}</strong></div>
                    <div className="video-stat-box"><span>句型数</span><strong>{selectedLayer.videoMeta?.sents || 5}</strong></div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                  <ToggleRow label="自动播放" on />
                  <ToggleRow label="循环播放" />
                  <ToggleRow label="静音播放" />
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <Button icon={<History size={15} />}>生成历史</Button>
                  <Button icon={<RotateCcw size={15} />}>重新生成</Button>
                </div>
              </div>
            )}

            {isText && <TextPanel selectedLayer={selectedLayer} onUpdateLayer={onUpdateLayer} />}

            {!isVideo && !isText && (
              <div className="ppt-actions">
                <Button onClick={onDuplicateLayer}>复制</Button>
                <Button onClick={onDeleteLayer}>删除</Button>
              </div>
            )}
          </div>
        </div>
      </aside>
    );
  }

  const layers = slide?.layers?.length ? slide.layers : fallbackLayers;

  return (
    <aside className="ppt-right ppt-right-canvas-panel">
      <div className="ppt-right-head">画布与图层</div>
      <div className="ppt-right-body">
        <section className="ppt-bg-section">
          <div className="ppt-panel-label">页面背景</div>
          <div className="ppt-bg-card">
            <span className="ppt-bg-title">背景色</span>
            <div className="ppt-bg-row">
              {swatches.map((color, index) => (
                <button
                  type="button"
                  key={color}
                  className={`${(slide?.background || '#ffffff') === color ? 'on' : ''} swatch-${index}`}
                  style={{ background: color }}
                  onClick={() => onUpdateSlide({ background: color })}
                  aria-label={`背景色 ${color}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="ppt-layer-section">
          <div className="ppt-panel-label">元素列表</div>
          <div className="ppt-layer-list">
            {layers.map((layer) => {
              const realLayer = slide?.layers?.find((item) => item.id === layer.id);
              const active = selectedLayerId === layer.id;
              return (
                <button
                  type="button"
                  key={layer.id}
                  className={`ppt-layer-row ${active ? 'is-selected' : ''} ${layer.muted ? 'is-muted' : ''} type-${layer.type}`}
                  onClick={() => realLayer && onSelectLayer(layer.id)}
                >
                  <span className="ppt-layer-icon"><LayerGlyph type={layer.type} /></span>
                  <strong>{layer.title || layer.type}</strong>
                  <span className="ppt-layer-eye">{layer.hidden ? <EyeOff size={16} /> : <Eye size={16} />}</span>
                </button>
              );
            })}
          </div>
        </section>

        <button type="button" className="ppt-next" onClick={onNext}>进入阅读材料</button>
      </div>
    </aside>
  );
}
