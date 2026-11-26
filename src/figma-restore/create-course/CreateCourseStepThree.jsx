import React from 'react';
import { useTranslation } from 'react-i18next';
import { Form } from 'antd';
import pathArt from '../../assets/complete-course/path-art.jpg';
import pathBody from '../../assets/complete-course/path-movement.jpg';
import pathMusic from '../../assets/complete-course/path-music.jpg';
import { experiencePaths } from './createCourseOptions';

const pathImages = {
  art: pathArt,
  body: pathBody,
  music: pathMusic,
};

export function CreateCourseStepThree() {
  const { t } = useTranslation();
  return (
    <>
      <div className="fr-create-step-head">
        <div>
          <div className="fr-create-step-title">{t('createCourse.step3Title')} <span className="en">| Choose the Path</span></div>
          <div className="fr-create-step-subtitle">{t('createCourse.step3Subtitle')}</div>
        </div>
      </div>

      <Form.Item
        name="experiencePaths"
        rules={[{
          validator: (_, value) => Array.isArray(value) && value.length > 0
            ? Promise.resolve()
            : Promise.reject(new Error(t('createCourse.pathRequired'))),
        }]}
      >
        <PathSelector t={t} />
      </Form.Item>
    </>
  );
}

function PathSelector({ value, onChange, t }) {
  const selected = Array.isArray(value) ? value : (value ? [value] : []);
  const togglePath = (pathValue) => {
    onChange(
      selected.includes(pathValue)
        ? selected.filter((item) => item !== pathValue)
        : [...selected, pathValue]
    );
  };

  return (
    <div className="fr-path-grid">
      {experiencePaths.map(path => (
        <button
          key={path.value}
          type="button"
          className={`fr-path-card tone-${path.tone} ${selected.includes(path.value) ? 'active' : ''}`}
          aria-pressed={selected.includes(path.value)}
          onClick={() => togglePath(path.value)}
        >
          <div className="fr-path-visual">
            <img className="fr-path-img" src={pathImages[path.value]} alt="" />
          </div>
          <div className="fr-path-body">
            <div className="fr-path-title">{t(path.titleKey)}</div>
            <div className="fr-path-desc">{t(path.descriptionKey)}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
