import i18next from 'i18next';
import { LocalizedText } from '../../../../i18n/LocalizedText.jsx';
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
import { PptRotationControl } from './PptRotationControl';
import '../css/PptTextConfigPanel.css';

const FONT_SIZE_OPTIONS = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 46, 52, 60, 72, 88, 104, 120]
  .map((size) => ({ value: size, label: `${size}px` }));

const getLineHeightOptions = (t) => [
  { value: 1, label: `${t('pptTextUi.lhCompact')} 1.0×` },
  { value: 1.1, label: `${t('pptTextUi.lhStandard')} 1.1×` },
  { value: 1.25, label: `${t('pptTextUi.lhRelaxed')} 1.25×` },
  { value: 1.5, label: `${t('pptTextUi.lhLoose')} 1.5×` },
  { value: 1.8, label: `${t('pptTextUi.lhParagraph')} 1.8×` },
  { value: 2, label: `${t('pptTextUi.lhDouble')} 2.0×` },
];

const getLetterSpacingOptions = (t) => [
  { value: -1, label: `${t('pptTextUi.lsCompact')} -1px` },
  { value: 0, label: `${t('pptTextUi.lsDefault')} 0px` },
  { value: 1, label: `${t('pptTextUi.lsSlightlyWide')} 1px` },
  { value: 2, label: `${t('pptTextUi.lsLoose')} 2px` },
  { value: 4, label: `${t('pptTextUi.lsTitle')} 4px` },
  { value: 8, label: `${t('pptTextUi.lsDisplay')} 8px` },
];

function getTextContent(value) {
  const content = String(value || '');
  return ['双击编辑文本', 'Double-click to edit text'].includes(content.trim()) ? '' : content;
}

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
      <Select
        className="text-size-preset"
        value={FONT_SIZE_OPTIONS.some((item) => item.value === fontSize) ? fontSize : undefined}
        placeholder={i18next.t('pictureBook.select')}
        options={FONT_SIZE_OPTIONS}
        onChange={(next) => onChange(Number(next) || 8)}
      />
      <Slider
        min={8}
        max={120}
        step={1}
        value={fontSize}
        tooltip={{ formatter: (next) => `${next}px` }}
        onChange={(next) => onChange(Number(next) || 8)}
      />
      <InputNumber
        className="text-size-number"
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
  const lineHeightOptions = getLineHeightOptions(t);
  const letterSpacingOptions = getLetterSpacingOptions(t);
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
          <Form.Item label={i18next.t('pptTextUi.b096b3f5ac')}>
            <TextNumberField value={selectedLayer.height} unit="px" min={28} max={529} onChange={(height) => onUpdateLayer({ height })} />
          </Form.Item>
          <Form.Item label={t('assetPanel.rotation')}>
            <PptRotationControl
              value={selectedLayer.rotation}
              onChange={(rotation) => onUpdateLayer({ rotation })}
            />
          </Form.Item>
        </div>

        <div className="text-style-grid">
          <Form.Item label={t('assetPanel.textStyle')}>
            <Select
              value={selectedLayer.fontFamily || '思源黑体 (Bold)'}
              options={[
                { value: '思源黑体 (Bold)', label: t('assetPanel.fontSourceHanBold') },
                { value: '"Microsoft YaHei", sans-serif', label: t('pptTextUi.fontYaHei') },
                { value: '"PingFang SC", sans-serif', label: t('pptTextUi.fontPingFang') },
                { value: 'SimSun, serif', label: t('pptTextUi.fontSimSun') },
                { value: 'KaiTi, serif', label: t('pptTextUi.fontKaiTi') },
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
            <button type="button" title={i18next.t('pptTextUi.67c6b77f89')} aria-label={i18next.t('pptTextUi.67c6b77f89')} className={selectedLayer.fontWeight === 'bold' ? 'is-active' : ''} aria-pressed={selectedLayer.fontWeight === 'bold'} onClick={() => toggleStyle('bold')}><Bold size={14} /></button>
            <button type="button" title={i18next.t('pptTextUi.af5a2c8bff')} aria-label={i18next.t('pptTextUi.af5a2c8bff')} className={selectedLayer.fontStyle === 'italic' ? 'is-active' : ''} aria-pressed={selectedLayer.fontStyle === 'italic'} onClick={() => toggleStyle('italic')}><Italic size={14} /></button>
            <button type="button" title={i18next.t('pptTextUi.9bc18ae51e')} aria-label={i18next.t('pptTextUi.9bc18ae51e')} className={selectedLayer.textDecoration === 'underline' ? 'is-active' : ''} aria-pressed={selectedLayer.textDecoration === 'underline'} onClick={() => toggleStyle('underline')}><Underline size={14} /></button>
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
          <Form.Item label={i18next.t('pptTextUi.b534c8636c')}>
            <div className="text-select-number-stack">
              <Select
                value={lineHeightOptions.some((item) => item.value === selectedLayer.lineHeight) ? selectedLayer.lineHeight : undefined}
                placeholder={i18next.t('pptTextUi.9a0158b486')}
                options={lineHeightOptions}
                onChange={(lineHeight) => onUpdateLayer({ lineHeight })}
              />
              <TextNumberField value={selectedLayer.lineHeight || 1.16} unit="×" min={0.8} max={3} step={0.05} onChange={(lineHeight) => onUpdateLayer({ lineHeight })} />
            </div>
          </Form.Item>
          <Form.Item label={i18next.t('pptTextUi.a9a180f198')}>
            <div className="text-select-number-stack">
              <Select
                value={letterSpacingOptions.some((item) => item.value === selectedLayer.letterSpacing) ? selectedLayer.letterSpacing : undefined}
                placeholder={i18next.t('pptTextUi.9a0158b486')}
                options={letterSpacingOptions}
                onChange={(letterSpacing) => onUpdateLayer({ letterSpacing })}
              />
              <TextNumberField value={selectedLayer.letterSpacing || 0} unit="px" min={-5} max={30} step={0.5} onChange={(letterSpacing) => onUpdateLayer({ letterSpacing })} />
            </div>
          </Form.Item>
          <Form.Item label={i18next.t('pptTextUi.ba5af08d76')}>
            <Select
              value={selectedLayer.verticalAlign || 'middle'}
              options={[
                { value: 'top', label: t('pptTextUi.alignTop') },
                { value: 'middle', label: t('pptTextUi.alignMiddle') },
                { value: 'bottom', label: t('pptTextUi.alignBottom') },
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
            value={getTextContent(selectedLayer.content)}
            placeholder="Textarea"
            onChange={(event) => onUpdateLayer({ content: event.target.value })}
          />
        </Form.Item>

        <div className="text-quick-actions">
          <Button className="text-fit-content-action" icon={<Maximize2 size={15} />} onClick={fitTextContent}><LocalizedText id="pptTextUi.89d27865a1" /></Button>
          <Button icon={<MoveHorizontal size={15} />} onClick={() => onCenterLayer?.('horizontal')}><LocalizedText id="pptTextUi.83fa059046" /></Button>
          <Button icon={<MoveVertical size={15} />} onClick={() => onCenterLayer?.('vertical')}><LocalizedText id="pptTextUi.67668f11c1" /></Button>
          <Button icon={<Copy size={15} />} onClick={onDuplicateLayer}><LocalizedText id="common.copy" /></Button>
          <Button danger icon={<Trash2 size={15} />} onClick={onDeleteLayer}><LocalizedText id="common.delete" /></Button>
        </div>
      </Form>
    </aside>
  );
}
