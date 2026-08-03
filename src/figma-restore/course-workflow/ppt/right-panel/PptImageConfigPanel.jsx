import React from 'react';
import { Button, Form, Input, Popconfirm, Select, Switch } from 'antd';
import { useTranslation } from 'react-i18next';
import { History, Lock, Maximize2, RotateCcw, Sparkles, Unlock, Upload, X } from 'lucide-react';
import { PptRotationControl } from './PptRotationControl';
import '../css/PptImageConfigPanel.css';

const IMAGE_SIZE_PRESETS = [
  { value: 'fit', label: '适应画布', width: 940, height: 529 },
  { value: 'wide', label: '宽幅 16:9', width: 640, height: 360 },
  { value: 'square', label: '方形 1:1', width: 360, height: 360 },
  { value: 'portrait', label: '竖图 3:4', width: 360, height: 480 },
  { value: 'banner', label: '横幅', width: 720, height: 220 },
  { value: 'icon', label: '图标', width: 120, height: 120 },
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
        onChange={(event) => {
          const nextDraft = event.target.value;
          setDraft(nextDraft);
          const next = Number(nextDraft);
          if (Number.isFinite(next) && next >= 28) onChange(next);
        }}
        onBlur={commit}
        onPressEnter={commit}
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
              onChange={(_, option) => applySizePreset(option)}
            />
          </Form.Item>
          <Form.Item label="宽">
            <ImageNumberField value={selectedLayer.width} unit="px" onChange={(width) => onUpdateLayer({
              width,
              ...(isAspectRatioLocked ? { height: Math.round(width / aspectRatio) } : {}),
            })} />
          </Form.Item>
          <Form.Item label="高">
            <ImageNumberField value={selectedLayer.height} unit="px" onChange={(height) => onUpdateLayer({
              ...(isAspectRatioLocked ? { width: Math.round(height * aspectRatio) } : {}),
              height,
            })} />
          </Form.Item>
          <Form.Item label="旋转">
            <PptRotationControl
              value={selectedLayer.rotation}
              onChange={(rotation) => onUpdateLayer({ rotation })}
            />
          </Form.Item>
        </div>
        <div
          className={`image-aspect-lock ${isAspectRatioLocked ? 'is-locked' : 'is-unlocked'}`}
          title={isAspectRatioLocked ? '缩放或修改宽高时保持图片纵横比' : '宽度和高度可以独立调整'}
        >
          {isAspectRatioLocked ? <Lock size={14} /> : <Unlock size={14} />}
          <span>{isAspectRatioLocked ? '锁定图片纵横比' : '自由调整宽高'}</span>
          <Switch
            size="small"
            checked={isAspectRatioLocked}
            onChange={(checked) => onUpdateLayer({ lockAspectRatio: checked })}
            aria-label="锁定图片纵横比"
          />
        </div>

        <div className="image-canvas-actions">
          <Button className="image-fit-canvas" icon={<Maximize2 size={15} />} onClick={onFitLayer} block>
            适应画布并居中
          </Button>
          <Popconfirm
            title="设为页面背景？"
            description="图片将从普通图层移除，但之后仍可还原为图片图层。"
            okText="设为背景"
            cancelText="取消"
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
