import React from 'react';
import { Form } from 'antd';
import pathArt from '../../assets/create-course/path-1.png';
import pathBody from '../../assets/create-course/path-2.png';
import pathMusic from '../../assets/create-course/path-3.png';
import { experiencePaths } from './createCourseOptions';

const pathImages = {
  艺术表达: pathArt,
  体感探索: pathBody,
  音乐律动: pathMusic,
};

export function CreateCourseStepThree() {
  return (
    <>
      <div className="fr-create-step-head">
        <div>
          <div className="fr-create-step-title">选择体验路径 <span className="en">| Choose the Path</span></div>
          <div className="fr-create-step-subtitle">选择一种最能让孩子们沉浸其中的探索方式。</div>
        </div>
      </div>

      <Form.Item name="experiencePath" rules={[{ required: true, message: '请选择体验路径' }]}>
        <PathSelector />
      </Form.Item>
    </>
  );
}

function PathSelector({ value, onChange }) {
  return (
    <div className="fr-path-grid">
      {experiencePaths.map(path => (
        <button
          key={path.value}
          type="button"
          className={`fr-path-card tone-${path.tone} ${value === path.value ? 'active' : ''}`}
          onClick={() => onChange(path.value)}
        >
          <div className="fr-path-visual">
            <img className={`fr-path-img path-${path.tone}`} src={pathImages[path.value]} alt={path.title} />
          </div>
          <div className="fr-path-body">
            <div className="fr-path-title">{path.title}</div>
            <div className="fr-path-desc">{path.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
