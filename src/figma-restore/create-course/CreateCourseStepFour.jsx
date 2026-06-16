import React from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Input } from 'antd';
import { atmosphereOptions } from './createCourseOptions';

const { TextArea } = Input;

function ClearableButtonGroup({ value, onChange, options, getLabel, className }) {
  return (
    <div className={className}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            className={`ant-radio-button-wrapper ${selected ? 'ant-radio-button-wrapper-checked' : ''}`}
            onClick={() => onChange?.(selected ? '' : option.value)}
          >
            <span className="ant-radio-button" />
            {getLabel(option)}
          </button>
        );
      })}
    </div>
  );
}

export function CreateCourseStepFour() {
  const { t } = useTranslation();
  return (
    <>
      <div className="fr-create-step-head">
        <div>
          <div className="fr-create-step-title">{t('createCourse.step4Title')} <span className="en">| Add Your Magic</span></div>
          <div className="fr-create-step-subtitle">{t('createCourse.step4Subtitle')}</div>
        </div>
      </div>

      <Form.Item label={t('createCourse.requirementsLabel')} name="specialRequirements" className="fr-magic-requirements">
        <TextArea
          rows={4}
          placeholder={t('createCourse.requirementsPlaceholder')}
        />
      </Form.Item>

      <Form.Item label={t('createCourse.atmosphereLabel')} name="atmosphere" className="fr-magic-atmosphere">
        <ClearableButtonGroup
          className="fr-create-radio-group"
          options={atmosphereOptions}
          getLabel={(option) => t(option.labelKey)}
        />
      </Form.Item>
    </>
  );
}
