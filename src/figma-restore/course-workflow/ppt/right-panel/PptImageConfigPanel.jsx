import { LocalizedText } from '../../../../i18n/LocalizedText.jsx';
import i18next from 'i18next';
import React from 'react';
import { Button, Form, Input, Popconfirm, Select, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import { History, Lock, Maximize2, RotateCcw, Sparkles, Unlock, Upload, X } from 'lucide-react';
import { PptRotationControl } from './PptRotationControl';
import '../css/PptImageConfigPanel.css';

const getImageSizePresets = (t) => [
  { value: 'fit', label: t('pptImageUi.presetFit'), width: 940, height: 529 },
  { value: 'wide', label: t('pptImageUi.presetWide'), width: 640, height: 360 },
  { value: 'square', label: t('pptImageUi.presetSquare'), width: 360, height: 360 },
  { value: 'portrait', label: t('pptImageUi.presetPortrait'), width: 360, height: 480 },
  { value: 'banner', label: t('pptImageUi.presetBanner'), width: 720, height: 220 },
  { value: 'icon', label: t('pptImageUi.presetIcon'), width: 120, height: 120 },
];

function ImageNumberField({ value, unit, onChange }) {
  const [draft, setDraft] = React.useState(String(value ?? ''));

  React.useEffect(() => {
    setDraft(String(value ?? ''));
  }, [value]);

  const commit = () => {
    const next = Number(draft);
    // The 28px minimum is a validation boundary only. An invalid value must
    // not be persisted and must never resize the other dimension.
    if (!Number.isFinite(next) || next < 28) {
      setDraft(String(value ?? ''));
      return;
    }
    onChange(next);
  };

  return (
    <div className="image-number-field">
      <Input
        inputMode="numeric"
        value={draft}
        addonAfter={unit}
        style={{ width: '100%' }}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
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
  const imageSizePresets = getImageSizePresets(t);
  const prompt = selectedLayer.prompt || selectedLayer.imageMeta?.prompt || '';
  const isAspectRatioLocked = selectedLayer.lockAspectRatio !== false;

  // 缓存原始比例，只在切换图层或锁定状态变化时更新，避免编辑过程中比例漂移
  const [cachedRatio, setCachedRatio] = React.useState(null);
  const [trackedId, setTrackedId] = React.useState(null);
  const [trackedLock, setTrackedLock] = React.useState(null);

  React.useEffect(() => {
    const id = selectedLayer.id || selectedLayer._localId;
    const lock = selectedLayer.lockAspectRatio !== false;
    // 切换图层、或从解锁切回锁定时，重新捕获当前比例
    if (id !== trackedId || (lock && !trackedLock)) {
      setTrackedId(id);
      setTrackedLock(lock);
      const w = Number(selectedLayer.width) || 1;
      const h = Number(selectedLayer.height) || 1;
      setCachedRatio(w / h);
    } else if (lock !== trackedLock) {
      setTrackedLock(lock);
    }
  }, [selectedLayer.id, selectedLayer._localId, isAspectRatioLocked]);

  const aspectRatio = cachedRatio || ((Number(selectedLayer.width) || 1) / (Number(selectedLayer.height) || 1));

  const applySizePreset = (option) => {
    // Presets replace both dimensions, so they also become the new source of
    // truth for a subsequently locked resize (for example 640 / 360 = 16:9).
    setCachedRatio(option.width / option.height);
    onUpdateLayer({ width: option.width, height: option.height });
  };

  return (
    <aside className="ppt-right ppt-image-config-panel">
      <div className="image-panel-head">
        <span><LocalizedText id="pptImageUi.8d45b68560" /></span>
        <Button
          type="text"
          className="image-panel-close"
          icon={<X size={16} />}
          onClick={() => onSelectLayer(null)}
          aria-label={i18next.t('pptImageUi.6c14bd7f6f')}
        />
      </div>

      <Form className="image-panel-form" layout="vertical">
        <Form.Item label={i18next.t('assetPanel.layerName')}>
          <Input
            value={selectedLayer.title || ''}
            placeholder={i18next.t('pptImageUi.4c619cf584')}
            onChange={(event) => onUpdateLayer({ title: event.target.value })}
          />
        </Form.Item>

        <div className="image-size-grid">
          <Form.Item label={i18next.t('pptImageUi.eaa8ac23a0')} className="image-size-preset-field">
            <Select
              placeholder={i18next.t('pptImageUi.f10d07d138')}
              value={undefined}
              options={imageSizePresets}
              onChange={(_, option) => applySizePreset(option)}
            />
          </Form.Item>
          <Form.Item label={i18next.t('assetPanel.width')}>
            <ImageNumberField value={selectedLayer.width} unit="px" onChange={(width) => onUpdateLayer({
              width,
              ...(isAspectRatioLocked ? { height: Math.round(width / aspectRatio) } : {}),
            })} />
          </Form.Item>
          <Form.Item label={i18next.t('pptImageUi.b096b3f5ac')}>
            <ImageNumberField value={selectedLayer.height} unit="px" onChange={(height) => onUpdateLayer({
              ...(isAspectRatioLocked ? { width: Math.round(height * aspectRatio) } : {}),
              height,
            })} />
          </Form.Item>
          <Form.Item label={i18next.t('pptImageUi.a69e51e503')}>
            <PptRotationControl
              value={selectedLayer.rotation}
              onChange={(rotation) => onUpdateLayer({ rotation })}
            />
          </Form.Item>
        </div>
        <div
          className={`image-aspect-lock ${isAspectRatioLocked ? 'is-locked' : 'is-unlocked'}`}
          title={isAspectRatioLocked ? t('pptImageUi.lockRatioHint') : t('pptImageUi.unlockRatioHint')}
        >
          {isAspectRatioLocked ? <Lock size={14} /> : <Unlock size={14} />}
          <span>{isAspectRatioLocked ? t('pptImageUi.3e85e4edc5') : t('pptImageUi.freeSize')}</span>
          <Switch
            size="small"
            checked={isAspectRatioLocked}
            onChange={(checked) => onUpdateLayer({ lockAspectRatio: checked })}
            aria-label={i18next.t('pptImageUi.3e85e4edc5')}
          />
        </div>

        <div className="image-canvas-actions">
          <Button className="image-fit-canvas" icon={<Maximize2 size={15} />} onClick={onFitLayer} block>
            <LocalizedText id="pptImageUi.c795250471" />
          </Button>
          <Popconfirm
            title={i18next.t('pptImageUi.3c81652e20')}
            description={i18next.t('pptImageUi.926555ca49')}
            okText={i18next.t('pptImageUi.f1426c6c1f')}
            cancelText={i18next.t('common.cancel')}
            onConfirm={onSetAsBackground}
            disabled={!selectedLayer.url}
          >
            <Button
              className="image-set-background"
              icon={<Maximize2 size={15} />}
              disabled={!selectedLayer.url}
              block
            >
              {t('ppt.setAsBackground')}
            </Button>
          </Popconfirm>
        </div>

        <button className="image-replace-drop" type="button">
          <Upload size={15} />
          <span><LocalizedText id="pptImageUi.dc817fb878" /></span>
        </button>

        <section className="image-ai-section">
          <div className="image-ai-title">
            <Sparkles size={15} />
            <span><LocalizedText id="pptImageUi.480cddb0cc" /></span>
          </div>

          <Form.Item label={i18next.t('pptImageUi.8c13fde218')}>
            <Input.TextArea
              value={prompt}
              placeholder="Textarea"
              rows={5}
              onChange={(event) => onUpdateLayer({ prompt: event.target.value })}
            />
          </Form.Item>
        </section>

        <div className="image-action-row">
          <Button icon={<History size={15} />}><LocalizedText id="pptImageUi.6410bdf02c" /></Button>
          <Button className="image-regenerate" icon={<RotateCcw size={15} />}><LocalizedText id="pptImageUi.2e19057052" /></Button>
        </div>
      </Form>
    </aside>
  );
}
