import i18next from 'i18next';
import React from 'react';
import { AutoComplete, Input } from 'antd';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';
import '../css/PptRotationControl.css';

const getRotationPresets = (t) => [
  { value: '0', label: t('pptRotationUi.defaultZero') },
  { value: '45', label: '45°' },
  { value: '90', label: '90°' },
  { value: '180', label: '180°' },
  { value: '-45', label: '-45°' },
  { value: '-90', label: '-90°' },
  { value: '-180', label: '-180°' },
];

export function PptRotationControl({ value, onChange }) {
  const { t } = useTranslation();
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
      options={getRotationPresets(t)}
      popupMatchSelectWidth
      onChange={(next) => {
        setDraft(next);
        applyRotation(next);
      }}
      onSelect={applyRotation}
      onBlur={() => {
        if (!applyRotation(draft)) setDraft(String(rotation));
      }}
      filterOption={false}
    >
      <Input
        inputMode="decimal"
        aria-label={i18next.t('pptRotationUi.c19e12d501')}
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
