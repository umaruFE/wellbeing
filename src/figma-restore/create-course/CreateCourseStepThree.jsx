import React from 'react';
import { useTranslation } from 'react-i18next';
import { Form } from 'antd';
import pathArt from '../../assets/create-course/path-1.png';
import pathBody from '../../assets/create-course/path-2.png';
import pathMusic from '../../assets/create-course/path-3.png';
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

      <Form.Item name="experiencePath" rules={[{ required: true, message: t('createCourse.pathRequired') }]}>
        <PathSelector t={t} />
      </Form.Item>
    </>
  );
}

function PathSelector({ value, onChange, t }) {
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
            <img className={`fr-path-img path-${path.tone}`} src={pathImages[path.value]} alt={t(path.titleKey)} />
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
