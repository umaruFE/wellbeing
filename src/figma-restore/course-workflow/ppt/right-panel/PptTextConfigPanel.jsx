import { Button, ColorPicker, Form, Input, InputNumber, Radio, Select } from 'antd';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline,
  X,
} from 'lucide-react';
import '../css/PptTextConfigPanel.css';

function TextNumberField({ value, unit, onChange }) {
  return (
    <div className="panel-number-field">
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

function TextColorField({ value, onChange, compact = false }) {
  const nextValue = value || '#F4785E';
  return (
    <div className={`text-color-field ${compact ? 'is-compact' : ''}`}>
      <ColorPicker
        className="text-color-picker"
        value={nextValue}
        disabledAlpha
        onChange={(color) => onChange(color.toHexString())}
        presets={[
          {
            label: '常用',
            colors: ['#253142', '#F4785E', '#FF705D', '#A866E8', '#4F8FF7', '#54BD76', '#FFFFFF'],
          },
        ]}
      />
      <span className="text-color-value">{compact ? 'Hex' : nextValue}</span>
    </div>
  );
}

export function PptTextConfigPanel({ selectedLayer, onUpdateLayer, onSelectLayer }) {
  const styleMode = selectedLayer.fontStyle === 'italic'
    ? 'italic'
    : selectedLayer.textDecoration === 'underline'
      ? 'underline'
      : selectedLayer.fontWeight === 'bold'
        ? 'bold'
        : 'normal';

  return (
    <aside className="ppt-right ppt-text-config-panel">
      <div className="text-panel-head">
        <span>编辑文本</span>
        <Button
          type="text"
          className="text-panel-close"
          icon={<X size={16} />}
          onClick={() => onSelectLayer(null)}
          aria-label="关闭"
        />
      </div>

      <Form className="text-panel-form" layout="vertical">
        <Form.Item label="图层名称素材">
          <Input
            value={selectedLayer.title || ''}
            onChange={(event) => onUpdateLayer({ title: event.target.value })}
          />
        </Form.Item>

        <div className="text-dim-grid">
          <Form.Item label="宽">
            <TextNumberField value={selectedLayer.width} unit="px" onChange={(width) => onUpdateLayer({ width })} />
          </Form.Item>
          <Form.Item label="旋转">
            <TextNumberField value={selectedLayer.rotation || 0} unit="°" onChange={(rotation) => onUpdateLayer({ rotation })} />
          </Form.Item>
        </div>

        <div className="text-style-grid">
          <Form.Item label="文本样式">
            <Select
              value={selectedLayer.fontFamily || '思源黑体 (Bold)'}
              options={[
                { value: '思源黑体 (Bold)', label: '思源黑体 (Bold)' },
                { value: 'Arial Bold', label: 'Arial Bold' },
              ]}
              onChange={(fontFamily) => onUpdateLayer({ fontFamily })}
            />
          </Form.Item>
          <Form.Item label="尺寸">
            <TextNumberField value={selectedLayer.fontSize || 32} unit="px" onChange={(fontSize) => onUpdateLayer({ fontSize })} />
          </Form.Item>
        </div>

        <div className="text-control-grid">
          <Radio.Group
            className="text-segment"
            optionType="button"
            value={styleMode}
            onChange={(event) => {
              const next = event.target.value;
              onUpdateLayer({
                fontWeight: next === 'bold' ? 'bold' : 'normal',
                fontStyle: next === 'italic' ? 'italic' : 'normal',
                textDecoration: next === 'underline' ? 'underline' : 'none',
              });
            }}
          >
            <Radio.Button value="bold"><Bold size={14} /></Radio.Button>
            <Radio.Button value="italic"><Italic size={14} /></Radio.Button>
            <Radio.Button value="underline"><Underline size={14} /></Radio.Button>
          </Radio.Group>

          <Radio.Group
            className="text-segment"
            optionType="button"
            value={selectedLayer.textAlign || 'center'}
            onChange={(event) => onUpdateLayer({ textAlign: event.target.value })}
          >
            <Radio.Button value="left"><AlignLeft size={14} /></Radio.Button>
            <Radio.Button value="center"><AlignCenter size={14} /></Radio.Button>
            <Radio.Button value="right"><AlignRight size={14} /></Radio.Button>
          </Radio.Group>

          <TextColorField compact value={selectedLayer.color || '#253142'} onChange={(color) => onUpdateLayer({ color })} />
        </div>

        <Form.Item label="文本描边">
          <div className="text-stroke-grid">
            <TextColorField value={selectedLayer.strokeColor || '#F4785E'} onChange={(strokeColor) => onUpdateLayer({ strokeColor })} />
            <TextNumberField value={selectedLayer.strokeWidth || 2} unit="px" onChange={(strokeWidth) => onUpdateLayer({ strokeWidth })} />
          </div>
        </Form.Item>

        <Form.Item label="文本内容">
          <Input.TextArea
            value={selectedLayer.content || ''}
            placeholder="Textarea"
            onChange={(event) => onUpdateLayer({ content: event.target.value })}
          />
        </Form.Item>
      </Form>
    </aside>
  );
}
