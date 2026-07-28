import React from 'react';
import { AutoComplete, Input } from 'antd';
import { ChevronDown } from 'lucide-react';
import '../css/PptRotationControl.css';

const ROTATION_PRESETS = [
  { value: '0', label: '默认 0°' },
  { value: '45', label: '45°' },
  { value: '90', label: '90°' },
  { value: '180', label: '180°' },
  { value: '-45', label: '-45°' },
  { value: '-90', label: '-90°' },
  { value: '-180', label: '-180°' },
];

export function PptRotationControl({ value, onChange }) {
  const rotation = Number(value) || 0;
  const [draft, setDraft] = React.useState(String(rotation));

  React.useEffect(() => {
    setDraft(String(rotation));
  }, [rotation]);

  const applyRotation = (nextValue) => {
    const next = Number(String(nextValue).replace('°', '').trim());
    if (!Number.isFinite(next)) return false;
    const clamped = Math.min(360, Math.max(-360, next));
    setDraft(String(clamped));
    onChange(clamped);
    return true;
  };

  return (
    <AutoComplete
      className="ppt-rotation-control"
      value={draft}
      options={ROTATION_PRESETS}
      popupMatchSelectWidth
      onChange={(next) => {
        setDraft(next);
        applyRotation(next);
      }}
      onSelect={applyRotation}
      onBlur={() => {
        if (!applyRotation(draft)) setDraft(String(rotation));
      }}
      filterOption={(inputValue, option) => (
        String(option?.label || '').includes(inputValue)
        || String(option?.value || '').includes(inputValue)
      )}
    >
      <Input
        inputMode="decimal"
        aria-label="选择预设或输入旋转角度"
        suffix={(
          <span className="ppt-rotation-suffix" aria-hidden="true">
            <span>°</span>
            <ChevronDown size={16} />
          </span>
        )}
      />
    </AutoComplete>
  );
}
