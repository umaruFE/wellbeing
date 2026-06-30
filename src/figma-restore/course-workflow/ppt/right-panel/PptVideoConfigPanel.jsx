import { Button, Form, Input, InputNumber, Switch } from 'antd';
import { History, Maximize2, RotateCcw, X } from 'lucide-react';
import '../css/PptVideoConfigPanel.css';

function VideoNumberField({ value, unit, onChange }) {
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

export function PptVideoConfigPanel({ selectedLayer, onUpdateLayer, onSelectLayer, onFitLayer }) {
  const aspectRatio = (Number(selectedLayer.width) || 1) / (Number(selectedLayer.height) || 1);
  return (
    <aside className="ppt-right ppt-video-config-panel">
      <div className="video-panel-head">
        <span>编辑视频素材</span>
        <Button
          type="text"
          className="video-panel-close"
          icon={<X size={16} />}
          onClick={() => onSelectLayer(null)}
          aria-label="关闭"
        />
      </div>

      <Form className="video-panel-form" layout="vertical">
        <Form.Item label="图层名称">
          <Input
            value={selectedLayer.title || ''}
            onChange={(event) => onUpdateLayer({ title: event.target.value })}
          />
        </Form.Item>

        <div className="video-size-grid">
          <Form.Item label="宽">
            <VideoNumberField value={selectedLayer.width} unit="px" onChange={(width) => onUpdateLayer({
              width,
              height: Math.round(width / aspectRatio),
            })} />
          </Form.Item>
          <Form.Item label="高">
            <VideoNumberField value={selectedLayer.height} unit="px" onChange={(height) => onUpdateLayer({
              width: Math.round(height * aspectRatio),
              height,
            })} />
          </Form.Item>
          <Form.Item label="旋转">
            <VideoNumberField value={selectedLayer.rotation || 0} unit="°" onChange={(rotation) => onUpdateLayer({ rotation })} />
          </Form.Item>
        </div>

        <Button className="video-fit-canvas" icon={<Maximize2 size={15} />} onClick={onFitLayer} block>
          适应画布并居中
        </Button>

        <div className="video-info-card">
          <div className="video-meta-row"><span>视频类型</span><strong>{selectedLayer.videoMeta?.videoType || '未设置'}</strong></div>
          <div className="video-meta-row"><span>时长</span><strong>{selectedLayer.duration || '未设置'}</strong></div>
          <div className="video-meta-row"><span>场景 / 模板</span><strong>{selectedLayer.videoMeta?.scene || '未设置'}</strong></div>
          <div className="video-meta-row"><span>IP 角色</span><strong>{selectedLayer.videoMeta?.chars || '未设置'}</strong></div>

          <div className="video-stat-grid">
            <div><span>词汇数</span><strong>{selectedLayer.videoMeta?.vocab || 0}</strong></div>
            <div><span>句型数</span><strong>{selectedLayer.videoMeta?.sents || 0}</strong></div>
          </div>
        </div>

        <div className="video-switch-list">
          <label><span>自动播放</span><Switch defaultChecked /></label>
          <label><span>循环播放</span><Switch /></label>
          <label><span>静音播放</span><Switch /></label>
        </div>

        <div className="video-action-row">
          <Button icon={<History size={15} />}>生成历史</Button>
          <Button className="video-regenerate" icon={<RotateCcw size={15} />}>重新生成</Button>
        </div>
      </Form>
    </aside>
  );
}
