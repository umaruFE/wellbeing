import { Button, Form, Input, InputNumber, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { History, Maximize2, RotateCcw, Sparkles, Upload, X } from 'lucide-react';
import '../css/PptImageConfigPanel.css';

const IMAGE_SIZE_PRESETS = [
  { value: 'cover', label: '铺满画布', width: 960, height: 540 },
  { value: 'wide', label: '宽幅 16:9', width: 640, height: 360 },
  { value: 'square', label: '方形 1:1', width: 360, height: 360 },
  { value: 'portrait', label: '竖图 3:4', width: 360, height: 480 },
  { value: 'banner', label: '横幅', width: 720, height: 220 },
  { value: 'icon', label: '图标', width: 120, height: 120 },
];

const ROTATION_PRESETS = [
  { value: 0, label: '0°' },
  { value: 45, label: '45°' },
  { value: 90, label: '90°' },
  { value: 180, label: '180°' },
  { value: -45, label: '-45°' },
  { value: -90, label: '-90°' },
];

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
  onSetAsBackground,
}) {
  const { t } = useTranslation();
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
          <Form.Item label="尺寸预设" className="image-size-preset-field">
            <Select
              placeholder="选择尺寸"
              value={undefined}
              options={IMAGE_SIZE_PRESETS}
              onChange={(_, option) => onUpdateLayer({
                width: option.width,
                height: option.height,
              })}
            />
          </Form.Item>
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
            <div className="image-select-number-stack">
              <Select
                value={ROTATION_PRESETS.some((item) => item.value === selectedLayer.rotation) ? selectedLayer.rotation : undefined}
                placeholder="预设"
                options={ROTATION_PRESETS}
                onChange={(rotation) => onUpdateLayer({ rotation })}
              />
              <ImageNumberField value={selectedLayer.rotation || 0} unit="°" onChange={(rotation) => onUpdateLayer({ rotation })} />
            </div>
          </Form.Item>
        </div>

        <div className="image-canvas-actions">
          <Button className="image-fit-canvas" icon={<Maximize2 size={15} />} onClick={onFitLayer} block>
            适应画布并居中
          </Button>
          <Button
            className="image-set-background"
            icon={<Maximize2 size={15} />}
            onClick={onSetAsBackground}
            disabled={!selectedLayer.url}
            block
          >
            {t('ppt.setAsBackground')}
          </Button>
        </div>

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
