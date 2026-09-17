import i18next from 'i18next';
import { LocalizedText } from '../../i18n/LocalizedText.jsx';
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
            <div className="fr-read-title"><LocalizedText id="course.readingMaterial" /></div>
            <div className="fr-read-count">{data.length} <LocalizedText id="readingMaterialUi.063d73857f" /> {course?.unit || course?.courseTitle || 'Unit 3: Animals'}</div>
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
              <small>{index === 2 ? i18next.t('readingMaterialUi.a4Landscape') : i18next.t('readingMaterialUi.a4Portrait')}</small>
              <i>×</i>
            </button>
          ))}
        </div>
        <div className="fr-read-foot">
          <Button block onClick={() => window.print()}><LocalizedText id="readingMaterialUi.f6fb7ff29c" /></Button>
        </div>
      </aside>

      <main className="fr-read-canvas">
        <div className="fr-canvas-bar">
          <div className="fr-canvas-info">
            <LocalizedText id="readingMaterialUi.cc80c0edf2" /><strong>{active.title}</strong>
            <button className="fr-title-edit" type="button" onClick={openTitleEdit}><Edit3 size={13} /></button>
            <span /><LocalizedText id="readingMaterialUi.06dfb846bd" /> <b>1</b>/2
          </div>
          <div className="fr-canvas-tools">
            <Button icon={<Type size={15} />}><LocalizedText id="ppt.text" /></Button>
            <Button icon={<Image size={15} />}><LocalizedText id="readingMaterialUi.be8da62ea1" /></Button>
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
        <div className="fr-panel-head"><LocalizedText id="ppt.canvasAndLayers" /></div>
        <div className="fr-panel-body">
          <section>
            <div className="fr-panel-label"><LocalizedText id="ppt.pageBackground" /></div>
            <div className="fr-swatch-row">
              {['#253142', '#fff', '#ffe9e2', '#fff4da', '#eaf4ff', '#f0e7ff'].map((color, index) => (
                <span key={color} className={index === 1 ? 'active' : ''} style={{ background: color }} />
              ))}
            </div>
          </section>
          <section>
            <div className="fr-panel-label"><LocalizedText id="readingMaterialUi.f2e8112bc3" /></div>
            <div className="fr-orient-grid">
              <button className={orientation === 'v' ? 'active' : ''} onClick={() => setOrientation('v')}>
                <span className="v" /><b><LocalizedText id="assetPanel.ratio916" /></b><small>A4 · 210×297</small>
              </button>
              <button className={orientation === 'h' ? 'active' : ''} onClick={() => setOrientation('h')}>
                <span className="h" /><b><LocalizedText id="assetPanel.ratio169" /></b><small>A4 · 297×210</small>
              </button>
            </div>
          </section>
          <section>
            <div className="fr-panel-label"><LocalizedText id="ppt.layerList" /></div>
            <div className="fr-layer-list">
              <div className="fr-layer-row image"><span>▧</span><b><LocalizedText id="readingMaterialUi.c8f7527bc4" /></b></div>
              <div className="fr-layer-row text"><span>T</span><b><LocalizedText id="readingMaterialUi.0396289d61" /></b></div>
              <div className="fr-layer-row text"><span>T</span><b><LocalizedText id="readingMaterialUi.d9d22be73a" /></b></div>
            </div>
          </section>
        </div>
      </aside>

      <Modal title={i18next.t('readingMaterialUi.70209dccac')} open={editingTitle} onCancel={() => setEditingTitle(false)} onOk={saveTitle}>
        <Form form={form} layout="vertical">
          <Form.Item label={i18next.t('readingMaterialUi.6e03e3d5ba')} name="title" rules={[{ required: true, message: i18next.t('readingMaterialUi.titleRequired') }]}>
            <Input maxLength={40} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
