import React from 'react';
import { Button } from 'antd';
import { Image, Music, Play, Plus, Type, Video } from 'lucide-react';

const slideItems = [
  { title: '星际信号接收站', phase: 'Engage', active: true },
  { title: '动物能量球在哪里？', phase: 'Engage' },
  { title: '语言工具箱', phase: 'Empower' },
  { title: '救援地图任务', phase: 'Execute' },
];

const layers = [
  { type: 'image', name: 'landscape 主题意境图' },
  { type: 'text', name: '太空探索标题文字' },
  { type: 'audio', name: '情境氛围 BGM' },
];

export function PptCoursewareView({ onNext }) {
  return (
    <div className="fr-ppt" id="ed-ppt">
      <aside className="fr-ppt-left">
        <div className="fr-ppt-left-head">
          <strong>教案环节</strong>
          <span>选择环节生成页面</span>
        </div>
        <div className="fr-ppt-phase-list">
          {['Engage', 'Empower', 'Execute', 'Elevate'].map((phase, index) => (
            <section key={phase} className={`fr-ppt-phase ph-${index}`}>
              <div className="fr-ppt-phase-title">{phase}</div>
              {slideItems.filter(item => item.phase === phase || index > 1 && item.phase === 'Execute').slice(0, index === 2 ? 1 : 2).map(item => (
                <button key={`${phase}-${item.title}`} className={`fr-ppt-si ${item.active ? 'on' : ''}`}>
                  <span>{item.title}</span>
                  <b>{item.active ? '已生成' : '待生成'}</b>
                </button>
              ))}
            </section>
          ))}
        </div>
        <div className="fr-ppt-thumbs">
          <button className="fr-ppt-thumb on"><span>1</span><div className="fr-ppt-thumb-scene" /></button>
          <button className="fr-ppt-thumb"><span>2</span><div className="fr-ppt-thumb-kitchen" /></button>
          <button className="fr-ppt-thumb add"><Plus size={18} /></button>
        </div>
      </aside>

      <main className="fr-ppt-canvas">
        <div className="fr-canvas-bar">
          <div className="fr-canvas-info">当前页面：<strong>星际信号接收站</strong><span />页面 <b>1</b>/2</div>
          <div className="fr-canvas-tools">
            <Button icon={<Type size={15} />}>文本</Button>
            <Button icon={<Image size={15} />}>图片</Button>
            <Button icon={<Video size={15} />}>视频</Button>
            <Button icon={<Music size={15} />}>音频</Button>
          </div>
        </div>
        <div className="fr-slide-scroll">
          <div className="fr-slide">
            <div className="fr-slide-scene">
              <div className="fr-slide-planet" />
              <div className="fr-slide-rocket" />
              <div className="fr-slide-title">Mission Signal</div>
              <div className="fr-slide-caption">Look, listen, and find the animal energy.</div>
            </div>
          </div>
          <div className="fr-zoom-bar">
            <button>-</button><span>68%</span><button>+</button><button>□</button>
          </div>
        </div>
      </main>

      <aside className="fr-ppt-right">
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
            <div className="fr-panel-label">元素列表</div>
            <div className="fr-layer-list">
              {layers.map(layer => (
                <div key={layer.name} className={`fr-layer-row ${layer.type}`}>
                  <span>{layer.type === 'text' ? 'T' : layer.type === 'audio' ? '♪' : '▧'}</span>
                  <b>{layer.name}</b>
                </div>
              ))}
            </div>
          </section>
          <section>
            <div className="fr-panel-label">AI 来源与高阶重绘</div>
            <textarea defaultValue="深蓝色太空背景，零星分布几颗亮黄色星星，一艘红白相间的卡通迷你火箭向右上方飞行..." />
            <Button type="primary" block icon={<Play size={15} />}>重新生成图片</Button>
          </section>
          <Button type="primary" size="large" block onClick={onNext}>进入阅读材料</Button>
        </div>
      </aside>
    </div>
  );
}
