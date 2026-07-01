import React from 'react';
import { Button, ColorPicker, Form, Input, InputNumber, Radio, Select, Slider } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Copy,
  Italic,
  Maximize2,
  MoveHorizontal,
  MoveVertical,
  Trash2,
  Underline,
  X,
} from 'lucide-react';
import '../css/PptTextConfigPanel.css';

function TextNumberField({ value, unit, onChange, min, max, step }) {
  return (
    <div className="panel-number-field">
      <InputNumber
        controls={false}
        value={value || 0}
        min={min}
        max={max}
        step={step}
        addonAfter={unit}
        style={{ width: '100%' }}
        onChange={(next) => onChange(Number(next) || 0)}
      />
    </div>
  );
}

function TextSizeField({ value, onChange }) {
  const fontSize = Number(value) || 32;
  return (
    <div className="text-size-control">
      <Slider
        min={8}
        max={120}
        step={1}
        value={fontSize}
        tooltip={{ formatter: (next) => `${next}px` }}
        onChange={(next) => onChange(Number(next) || 8)}
      />
      <InputNumber
        controls={false}
        value={fontSize}
        min={8}
        max={200}
        addonAfter="px"
        onChange={(next) => onChange(Number(next) || 8)}
      />
    </div>
  );
}

function normalizeHexColor(value) {
  const text = String(value || '').trim();
  const match = text.match(/^#?([0-9a-fA-F]{6})$/);
  if (!match) return null;
  return `#${match[1].toUpperCase()}`;
}

function TextColorField({ value, onChange, compact = false, presetLabel }) {
  const nextValue = normalizeHexColor(value) || '#F4785E';
  const [draft, setDraft] = React.useState(nextValue);

  React.useEffect(() => {
    setDraft(nextValue);
  }, [nextValue]);

  const applyColor = (inputValue) => {
    const normalized = normalizeHexColor(inputValue);
    if (normalized) onChange(normalized);
  };

  return (
    <div className={`text-color-field ${compact ? 'is-compact' : ''}`}>
      <ColorPicker
        className="text-color-picker"
        value={nextValue}
        disabledAlpha
        onChange={(color) => {
          const normalized = normalizeHexColor(color.toHexString());
          if (normalized) {
            setDraft(normalized);
            onChange(normalized);
          }
        }}
        presets={[
          {
            label: presetLabel || 'Presets',
            colors: ['#253142', '#F4785E', '#FF705D', '#A866E8', '#4F8FF7', '#54BD76', '#FFFFFF'],
          },
        ]}
      />
      <input
        className="text-color-value-input"
        value={draft}
        placeholder={compact ? 'Hex' : '#253142'}
        spellCheck={false}
        onChange={(event) => {
          const inputValue = event.target.value;
          setDraft(inputValue);
          applyColor(inputValue);
        }}
        onBlur={() => {
          const normalized = normalizeHexColor(draft);
          if (normalized) {
            setDraft(normalized);
            onChange(normalized);
          } else {
            setDraft(nextValue);
          }
        }}
      />
    </div>
  );
}

export function PptTextConfigPanel({
  selectedLayer,
  onUpdateLayer,
  onSelectLayer,
  onCenterLayer,
  onDuplicateLayer,
  onDeleteLayer,
}) {
  const { t } = useTranslation();
  const toggleStyle = (style) => {
    if (style === 'bold') {
      onUpdateLayer({ fontWeight: selectedLayer.fontWeight === 'bold' ? 'normal' : 'bold' });
    } else if (style === 'italic') {
      onUpdateLayer({ fontStyle: selectedLayer.fontStyle === 'italic' ? 'normal' : 'italic' });
    } else {
      onUpdateLayer({ textDecoration: selectedLayer.textDecoration === 'underline' ? 'none' : 'underline' });
    }
  };

  const fitTextContent = () => {
    const fontSize = Number(selectedLayer.fontSize) || 32;
    const lineHeight = Number(selectedLayer.lineHeight) || 1.16;
    const width = Math.max(28, Number(selectedLayer.width) || 360);
    const charactersPerLine = Math.max(1, Math.floor((width - 12) / (fontSize * 0.58)));
    const visualLineCount = String(selectedLayer.content || '')
      .split('\n')
      .reduce((count, line) => count + Math.max(1, Math.ceil(line.length / charactersPerLine)), 0);
    const height = Math.min(529, Math.max(28, Math.ceil(visualLineCount * fontSize * lineHeight + 14)));
    onUpdateLayer({ height });
  };

  return (
    <aside className="ppt-right ppt-text-config-panel">
      <div className="text-panel-head">
        <span>{t('assetPanel.editText')}</span>
        <Button
          type="text"
          className="text-panel-close"
          icon={<X size={16} />}
          onClick={() => onSelectLayer(null)}
          aria-label="Close"
        />
      </div>

      <Form className="text-panel-form" layout="vertical">
        <Form.Item label={t('assetPanel.layerName')}>
          <Input
            value={selectedLayer.title || ''}
            onChange={(event) => onUpdateLayer({ title: event.target.value })}
          />
        </Form.Item>

        <div className="text-dim-grid is-three-columns">
          <Form.Item label={t('assetPanel.width')}>
            <TextNumberField value={selectedLayer.width} unit="px" min={28} max={940} onChange={(width) => onUpdateLayer({ width })} />
          </Form.Item>
          <Form.Item label="高">
            <TextNumberField value={selectedLayer.height} unit="px" min={28} max={529} onChange={(height) => onUpdateLayer({ height })} />
          </Form.Item>
          <Form.Item label={t('assetPanel.rotation')}>
            <TextNumberField value={selectedLayer.rotation || 0} unit="°" min={-360} max={360} onChange={(rotation) => onUpdateLayer({ rotation })} />
          </Form.Item>
        </div>

        <div className="text-style-grid">
          <Form.Item label={t('assetPanel.textStyle')}>
            <Select
              value={selectedLayer.fontFamily || '思源黑体 (Bold)'}
              options={[
                { value: '思源黑体 (Bold)', label: t('assetPanel.fontSourceHanBold') },
                { value: '"Microsoft YaHei", sans-serif', label: '微软雅黑' },
                { value: '"PingFang SC", sans-serif', label: '苹方' },
                { value: 'SimSun, serif', label: '宋体' },
                { value: 'KaiTi, serif', label: '楷体' },
                { value: 'Arial Bold', label: 'Arial Bold' },
                { value: 'Arial, sans-serif', label: 'Arial' },
                { value: 'Georgia, serif', label: 'Georgia' },
              ]}
              onChange={(fontFamily) => onUpdateLayer({ fontFamily })}
            />
          </Form.Item>
          <Form.Item label={t('assetPanel.fontSize')}>
            <TextSizeField value={selectedLayer.fontSize || 32} onChange={(fontSize) => onUpdateLayer({ fontSize })} />
          </Form.Item>
        </div>

        <div className="text-control-grid">
          <div className="text-segment text-style-toggles">
            <button type="button" title="粗体" aria-label="粗体" className={selectedLayer.fontWeight === 'bold' ? 'is-active' : ''} aria-pressed={selectedLayer.fontWeight === 'bold'} onClick={() => toggleStyle('bold')}><Bold size={14} /></button>
            <button type="button" title="斜体" aria-label="斜体" className={selectedLayer.fontStyle === 'italic' ? 'is-active' : ''} aria-pressed={selectedLayer.fontStyle === 'italic'} onClick={() => toggleStyle('italic')}><Italic size={14} /></button>
            <button type="button" title="下划线" aria-label="下划线" className={selectedLayer.textDecoration === 'underline' ? 'is-active' : ''} aria-pressed={selectedLayer.textDecoration === 'underline'} onClick={() => toggleStyle('underline')}><Underline size={14} /></button>
          </div>

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

          <TextColorField compact value={selectedLayer.color || '#253142'} onChange={(color) => onUpdateLayer({ color })} presetLabel={t('assetPanel.colorPresets')} />
        </div>

        <div className="text-spacing-grid">
          <Form.Item label="行高">
            <TextNumberField value={selectedLayer.lineHeight || 1.16} unit="×" min={0.8} max={3} step={0.05} onChange={(lineHeight) => onUpdateLayer({ lineHeight })} />
          </Form.Item>
          <Form.Item label="字间距">
            <TextNumberField value={selectedLayer.letterSpacing || 0} unit="px" min={-5} max={30} step={0.5} onChange={(letterSpacing) => onUpdateLayer({ letterSpacing })} />
          </Form.Item>
          <Form.Item label="垂直对齐">
            <Select
              value={selectedLayer.verticalAlign || 'middle'}
              options={[
                { value: 'top', label: '顶部' },
                { value: 'middle', label: '居中' },
                { value: 'bottom', label: '底部' },
              ]}
              onChange={(verticalAlign) => onUpdateLayer({ verticalAlign })}
            />
          </Form.Item>
        </div>

        <Form.Item label={t('assetPanel.textStroke')}>
          <div className="text-stroke-grid">
            <TextColorField
              value={selectedLayer.strokeColor || '#F4785E'}
              onChange={(strokeColor) => onUpdateLayer({
                strokeColor,
                strokeWidth: Number(selectedLayer.strokeWidth) > 0 ? selectedLayer.strokeWidth : 2,
              })}
              presetLabel={t('assetPanel.colorPresets')}
            />
            <TextNumberField value={selectedLayer.strokeWidth ?? 0} unit="px" onChange={(strokeWidth) => onUpdateLayer({ strokeWidth })} />
          </div>
        </Form.Item>

        <Form.Item label={t('assetPanel.textContent')}>
          <Input.TextArea
            value={selectedLayer.content || ''}
            placeholder="Textarea"
            onChange={(event) => onUpdateLayer({ content: event.target.value })}
          />
        </Form.Item>

        <div className="text-quick-actions">
          <Button className="text-fit-content-action" icon={<Maximize2 size={15} />} onClick={fitTextContent}>适应文字内容</Button>
          <Button icon={<MoveHorizontal size={15} />} onClick={() => onCenterLayer?.('horizontal')}>水平居中</Button>
          <Button icon={<MoveVertical size={15} />} onClick={() => onCenterLayer?.('vertical')}>垂直居中</Button>
          <Button icon={<Copy size={15} />} onClick={onDuplicateLayer}>复制</Button>
          <Button danger icon={<Trash2 size={15} />} onClick={onDeleteLayer}>删除</Button>
        </div>
      </Form>
    </aside>
  );
}
