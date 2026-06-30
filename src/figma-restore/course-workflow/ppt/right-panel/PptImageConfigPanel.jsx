import { Button, Form, Input, InputNumber } from 'antd';
import { History, Maximize2, RotateCcw, Sparkles, Upload, X } from 'lucide-react';
import '../css/PptImageConfigPanel.css';

function ImageNumberField({ value, unit, onChange }) {
  return (
    <div className="image-number-field">
      <InputNumber
        controls={false}
        value={value || 0}
        addonAfter={unit}
        style={{ width: '100%' }}
        onChange={(next) => onChange(Number(next) || 0)}
      />
    </div>
  );
}

export function PptImageConfigPanel({
  selectedLayer,
  onSelectLayer,
  onUpdateLayer,
  onFitLayer,
}) {
  const prompt = selectedLayer.prompt || selectedLayer.imageMeta?.prompt || '';
  const aspectRatio = (Number(selectedLayer.width) || 1) / (Number(selectedLayer.height) || 1);

  return (
    <aside className="ppt-right ppt-image-config-panel">
      <div className="image-panel-head">
        <span>编辑图片素材</span>
        <Button
          type="text"
          className="image-panel-close"
          icon={<X size={16} />}
          onClick={() => onSelectLayer(null)}
          aria-label="关闭"
        />
      </div>

      <Form className="image-panel-form" layout="vertical">
        <Form.Item label="图层名称素材">
          <Input
            value={selectedLayer.title || ''}
            placeholder="图层名称"
            onChange={(event) => onUpdateLayer({ title: event.target.value })}
          />
        </Form.Item>

        <div className="image-size-grid">
          <Form.Item label="宽">
            <ImageNumberField value={selectedLayer.width} unit="px" onChange={(width) => onUpdateLayer({
              width,
              height: Math.round(width / aspectRatio),
            })} />
          </Form.Item>
          <Form.Item label="高">
            <ImageNumberField value={selectedLayer.height} unit="px" onChange={(height) => onUpdateLayer({
              width: Math.round(height * aspectRatio),
              height,
            })} />
          </Form.Item>
          <Form.Item label="旋转">
            <ImageNumberField value={selectedLayer.rotation || 0} unit="°" onChange={(rotation) => onUpdateLayer({ rotation })} />
          </Form.Item>
        </div>

        <Button className="image-fit-canvas" icon={<Maximize2 size={15} />} onClick={onFitLayer} block>
          适应画布并居中
        </Button>

        <button className="image-replace-drop" type="button">
          <Upload size={15} />
          <span>替换本地图片</span>
        </button>

        <section className="image-ai-section">
          <div className="image-ai-title">
            <Sparkles size={15} />
            <span>AI 溯源与高阶重绘</span>
          </div>

          <Form.Item label="原始提示词（可修改后重新生成）">
            <Input.TextArea
              value={prompt}
              placeholder="Textarea"
              rows={5}
              onChange={(event) => onUpdateLayer({ prompt: event.target.value })}
            />
          </Form.Item>
        </section>

        <div className="image-action-row">
          <Button icon={<History size={15} />}>生成历史</Button>
          <Button className="image-regenerate" icon={<RotateCcw size={15} />}>重新生成</Button>
        </div>
      </Form>
    </aside>
  );
}
