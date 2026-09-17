import i18next from 'i18next';
import { LocalizedText } from '../../../../i18n/LocalizedText.jsx';
import { Button, Form, Input, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { History, RotateCcw, X } from 'lucide-react';
import { PptRotationControl } from './PptRotationControl';
import '../css/PptAudioConfigPanel.css';

const getAudioTypeOptions = (t) => [
  { value: '背景音乐', label: t('pptAudioUi.typeBgm') },
  { value: '课堂口播', label: t('pptAudioUi.typeVoiceover') },
  { value: '音效', label: t('pptAudioUi.typeSound') },
  { value: '词汇朗读', label: t('pptAudioUi.typeVocab') },
  { value: '对话音频', label: t('pptAudioUi.typeDialogue') },
];

export function PptAudioConfigPanel({
  selectedLayer,
  onSelectLayer,
  onUpdateLayer,
}) {
  const { t } = useTranslation();
  const audioTypeOptions = getAudioTypeOptions(t);
  return (
    <aside className="ppt-right ppt-audio-config-panel">
      <div className="audio-panel-head">
        <span><LocalizedText id="pptAudioUi.5e2f9f48f0" /></span>
        <Button
          type="text"
          className="audio-panel-close"
          icon={<X size={16} />}
          onClick={() => onSelectLayer(null)}
          aria-label={i18next.t('pptAudioUi.6c14bd7f6f')}
        />
      </div>

      <Form className="audio-panel-form" layout="vertical">
        <Form.Item label={i18next.t('assetPanel.layerName')}>
          <Input
            value={selectedLayer.title || ''}
            placeholder={i18next.t('pptAudioUi.4c619cf584')}
            onChange={(event) => onUpdateLayer({ title: event.target.value })}
          />
        </Form.Item>

        <Form.Item label={i18next.t('pptAudioUi.a69e51e503')}>
          <PptRotationControl
            value={selectedLayer.rotation}
            onChange={(rotation) => onUpdateLayer({ rotation })}
          />
        </Form.Item>

        <div className="audio-info-card">
          <Form.Item label={i18next.t('pptAudioUi.50ff6ddc7b')}>
            <Select
              value={selectedLayer.audioMeta?.audioType}
              placeholder={i18next.t('pptAudioUi.e67a8f228b')}
              options={audioTypeOptions}
              onChange={(audioType) => onUpdateLayer({
                audioMeta: {
                  ...(selectedLayer.audioMeta || {}),
                  audioType,
                },
              })}
            />
          </Form.Item>
          <div className="audio-meta-row">
            <span><LocalizedText id="pptAudioUi.50ff6ddc7b" /></span>
            <strong>{selectedLayer.audioMeta?.audioType || t('course.notSet')}</strong>
          </div>
          <div className="audio-meta-row">
            <span><LocalizedText id="course.duration" /></span>
            <strong>{selectedLayer.duration || t('course.notSet')}</strong>
          </div>
        </div>

        <div className="audio-action-row">
          <Button icon={<History size={15} />}><LocalizedText id="pptAudioUi.6410bdf02c" /></Button>
          <Button className="audio-regenerate" icon={<RotateCcw size={15} />}><LocalizedText id="pptAudioUi.2e19057052" /></Button>
        </div>
      </Form>
    </aside>
  );
}
