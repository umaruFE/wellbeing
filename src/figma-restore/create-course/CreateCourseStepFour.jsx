import React from 'react';
import { useTranslation } from 'react-i18next';
import { Form, Input, Radio } from 'antd';
import { atmosphereOptions } from './createCourseOptions';

const { TextArea } = Input;

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
        <Radio.Group optionType="button" buttonStyle="solid" className="fr-create-radio-group">
          {atmosphereOptions.map(option => <Radio.Button key={option.value} value={option.value}>{t(option.labelKey)}</Radio.Button>)}
        </Radio.Group>
      </Form.Item>
    </>
  );
}
