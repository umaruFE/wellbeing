import React from 'react';
import { Button, ColorPicker, Form, Input, InputNumber, Radio, Select } from 'antd';
import { useTranslation } from 'react-i18next';
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

export function PptTextConfigPanel({ selectedLayer, onUpdateLayer, onSelectLayer }) {
  const { t } = useTranslation();
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

        <div className="text-dim-grid">
          <Form.Item label={t('assetPanel.width')}>
            <TextNumberField value={selectedLayer.width} unit="px" onChange={(width) => onUpdateLayer({ width })} />
          </Form.Item>
          <Form.Item label={t('assetPanel.rotation')}>
            <TextNumberField value={selectedLayer.rotation || 0} unit="°" onChange={(rotation) => onUpdateLayer({ rotation })} />
          </Form.Item>
        </div>

        <div className="text-style-grid">
          <Form.Item label={t('assetPanel.textStyle')}>
            <Select
              value={selectedLayer.fontFamily || '思源黑体 (Bold)'}
              options={[
                { value: '思源黑体 (Bold)', label: t('assetPanel.fontSourceHanBold') },
                { value: 'Arial Bold', label: 'Arial Bold' },
              ]}
              onChange={(fontFamily) => onUpdateLayer({ fontFamily })}
            />
          </Form.Item>
          <Form.Item label={t('assetPanel.fontSize')}>
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

          <TextColorField compact value={selectedLayer.color || '#253142'} onChange={(color) => onUpdateLayer({ color })} presetLabel={t('assetPanel.colorPresets')} />
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
      </Form>
    </aside>
  );
}
