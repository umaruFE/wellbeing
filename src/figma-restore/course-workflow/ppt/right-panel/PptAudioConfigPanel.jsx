import { Button, Form, Input } from 'antd';
import { History, RotateCcw, X } from 'lucide-react';
import '../css/PptAudioConfigPanel.css';

export function PptAudioConfigPanel({
  selectedLayer,
  onSelectLayer,
  onUpdateLayer,
}) {
  return (
    <aside className="ppt-right ppt-audio-config-panel">
      <div className="audio-panel-head">
        <span>编辑音频素材</span>
        <Button
          type="text"
          className="audio-panel-close"
          icon={<X size={16} />}
          onClick={() => onSelectLayer(null)}
          aria-label="关闭"
        />
      </div>

      <Form className="audio-panel-form" layout="vertical">
        <Form.Item label="图层名称素材">
          <Input
            value={selectedLayer.title || ''}
            placeholder="图层名称"
            onChange={(event) => onUpdateLayer({ title: event.target.value })}
          />
        </Form.Item>

        <div className="audio-info-card">
          <div className="audio-meta-row">
            <span>音频类型</span>
            <strong>{selectedLayer.audioMeta?.audioType || '情绪氛围BGM'}</strong>
          </div>
          <div className="audio-meta-row">
            <span>时长</span>
            <strong>{selectedLayer.duration || '02:16'}</strong>
          </div>
        </div>

        <div className="audio-action-row">
          <Button icon={<History size={15} />}>生成历史</Button>
          <Button className="audio-regenerate" icon={<RotateCcw size={15} />}>重新生成</Button>
        </div>
      </Form>
    </aside>
  );
}
