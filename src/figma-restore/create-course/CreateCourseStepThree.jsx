import React from 'react';
import { Form } from 'antd';
import { experiencePaths } from './createCourseOptions';

export function CreateCourseStepThree() {
  return (
    <>
      <div className="fr-create-step-head">
        <div className="fr-create-step-title">选择体验路径 <span>| Choose the Path</span></div>
        <div className="fr-create-step-subtitle">选择一种最能让孩子们沉浸其中的探索方式。</div>
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
            <span />
            <span />
            <span />
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
