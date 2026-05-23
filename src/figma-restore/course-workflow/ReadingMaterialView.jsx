import React from 'react';
import { Button, Form, Input, Modal } from 'antd';
import { Edit3, Image, Type } from 'lucide-react';
import { readingTemplates } from './workflowData';

export function ReadingMaterialView({ course, materials, onMaterialsChange }) {
  const [activeId, setActiveId] = React.useState(materials?.[0]?.id || readingTemplates[0].id);
  const [editingTitle, setEditingTitle] = React.useState(false);
  const [orientation, setOrientation] = React.useState('v');
  const [form] = Form.useForm();
  const data = materials?.length ? materials : readingTemplates;
  const active = data.find(item => item.id === activeId) || data[0];

  const openTitleEdit = () => {
    form.setFieldsValue({ title: active.title });
    setEditingTitle(true);
  };

  const saveTitle = async () => {
    const values = await form.validateFields();
    onMaterialsChange(data.map(item => item.id === active.id ? { ...item, ...values } : item));
    setEditingTitle(false);
  };

  return (
    <div className="fr-read" id="ed-read">
      <aside className="fr-read-left">
        <div className="fr-read-head">
          <div>
            <div className="fr-read-title">阅读材料</div>
            <div className="fr-read-count">{data.length} 份材料 · {course?.unit || course?.courseTitle || 'Unit 3: Animals'}</div>
          </div>
          <button className="fr-read-add" type="button">+</button>
        </div>
        <div className="fr-read-mat-list">
          {data.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={`fr-read-mat ${item.id === active.id ? 'on' : ''}`}
              onClick={() => setActiveId(item.id)}
            >
              <span>A4</span>
              <strong>{item.title}</strong>
              <small>{index === 2 ? 'A4 横版' : 'A4 竖版'}</small>
              <i>×</i>
            </button>
          ))}
        </div>
        <div className="fr-read-foot">
          <Button block onClick={() => window.print()}>导出 / 打印阅读材料</Button>
        </div>
      </aside>

      <main className="fr-read-canvas">
        <div className="fr-canvas-bar">
          <div className="fr-canvas-info">
            当前材料：<strong>{active.title}</strong>
            <button className="fr-title-edit" type="button" onClick={openTitleEdit}><Edit3 size={13} /></button>
            <span />页面 <b>1</b>/2
          </div>
          <div className="fr-canvas-tools">
            <Button icon={<Type size={15} />}>文本</Button>
            <Button icon={<Image size={15} />}>图片</Button>
          </div>
        </div>
        <div className="fr-read-scroll">
          <div className={`fr-read-slide ${orientation}`}>
            <div className="fr-read-inner">
              <div className="fr-read-demo-scene" />
              <h2>{active.pages[0]?.title || active.title}</h2>
              <p>{active.pages[0]?.text}</p>
              <div className="fr-read-task-box">{active.pages[0]?.prompt}</div>
            </div>
          </div>
          <div className="fr-zoom-bar">
            <button>-</button><span>68%</span><button>+</button><button>□</button>
          </div>
        </div>
      </main>

      <aside className="fr-read-right">
        <div className="fr-panel-head">画布与图层</div>
        <div className="fr-panel-body">
          <section>
            <div className="fr-panel-label">页面背景</div>
            <div className="fr-swatch-row">
              {['#253142', '#fff', '#ffe9e2', '#fff4da', '#eaf4ff', '#f0e7ff'].map((color, index) => (
                <span key={color} className={index === 1 ? 'active' : ''} style={{ background: color }} />
              ))}
            </div>
          </section>
          <section>
            <div className="fr-panel-label">页面方向</div>
            <div className="fr-orient-grid">
              <button className={orientation === 'v' ? 'active' : ''} onClick={() => setOrientation('v')}>
                <span className="v" /><b>竖版</b><small>A4 · 210×297</small>
              </button>
              <button className={orientation === 'h' ? 'active' : ''} onClick={() => setOrientation('h')}>
                <span className="h" /><b>横版</b><small>A4 · 297×210</small>
              </button>
            </div>
          </section>
          <section>
            <div className="fr-panel-label">元素列表</div>
            <div className="fr-layer-list">
              <div className="fr-layer-row image"><span>▧</span><b>landscape 主题意境图</b></div>
              <div className="fr-layer-row text"><span>T</span><b>阅读标题文字</b></div>
              <div className="fr-layer-row text"><span>T</span><b>任务提示文字</b></div>
            </div>
          </section>
        </div>
      </aside>

      <Modal title="编辑阅读材料标题" open={editingTitle} onCancel={() => setEditingTitle(false)} onOk={saveTitle}>
        <Form form={form} layout="vertical">
          <Form.Item label="阅读材料标题" name="title" rules={[{ required: true, message: '请输入阅读材料标题' }]}>
            <Input maxLength={40} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
