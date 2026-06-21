import React from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox, Form, Radio, Select } from 'antd';
import {
  ageOptions,
  classSizeOptions,
  durationOptions,
  languageSkillOptions,
} from './createCourseOptions';

function splitPastedTagLines(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((item) => item.replace(/[\u200B-\u200D\uFEFF]/g, '').trim())
    .filter(Boolean);
}

function toTagArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function CreateCourseStepOne() {
  const { t } = useTranslation();
  const form = Form.useFormInstance();

  const handleTagPaste = React.useCallback((event, field) => {
    const lines = splitPastedTagLines(event.clipboardData?.getData('text'));
    if (lines.length < 2) return;

    event.preventDefault();
    const current = toTagArray(form.getFieldValue(field)).map((item) => String(item || '').trim()).filter(Boolean);
    const next = [...current];
    lines.forEach((line) => {
      if (!next.includes(line)) next.push(line);
    });
    form.setFieldsValue({ [field]: next });
  }, [form]);

  return (
    <>
      <div className="fr-create-step-head">
        <div>
          <div className="fr-create-step-title">{t('createCourse.step1Title')} <span className="en">| Set the Course</span></div>
          <div className="fr-create-step-subtitle">{t('createCourse.step1Subtitle')}</div>
        </div>
      </div>

      <div className="fr-create-three">
        <Form.Item
          label={<span><span className="required">*</span>{t('createCourse.ageLabel')}</span>}
          name="age"
          rules={[{ required: true }]}
          className="fr-create-form-item"
        >
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            className="fr-create-radio-group"
          >
            {ageOptions.map(option => <Radio.Button key={option.value} value={option.value}>{t(option.labelKey)}</Radio.Button>)}
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label={<span><span className="required">*</span>{t('createCourse.durationLabel')}</span>}
          name="duration"
          rules={[{ required: true }]}
          className="fr-create-form-item"
        >
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            className="fr-create-radio-group"
          >
            {durationOptions.map(option => <Radio.Button key={option.value} value={option.value}>{t(option.labelKey)}</Radio.Button>)}
          </Radio.Group>
        </Form.Item>

        <Form.Item
          label={<span><span className="required">*</span>{t('createCourse.classSizeLabel')}</span>}
          name="classSize"
          rules={[{ required: true }]}
          className="fr-create-form-item"
        >
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            className="fr-create-radio-group"
          >
            {classSizeOptions.map(option => <Radio.Button key={option.value} value={option.value}>{t(option.labelKey)}</Radio.Button>)}
          </Radio.Group>
        </Form.Item>
      </div>

      <div className="fr-create-two">
        <Form.Item
          label={<span><span className="required">*</span>{t('createCourse.vocabLabel')}</span>}
          name="vocabularies"
          className="fr-create-form-item"
        >
          <Select
            mode="tags"
            open={false}
            suffixIcon={null}
            placeholder={t('createCourse.vocabPlaceholder')}
            className="fr-create-tag-select"
            onPasteCapture={(event) => handleTagPaste(event, 'vocabularies')}
          />
        </Form.Item>

        <Form.Item
          label={<span><span className="required">*</span>{t('createCourse.grammarLabel')}</span>}
          name="grammars"
          className="fr-create-form-item"
        >
          <Select
            mode="tags"
            open={false}
            suffixIcon={null}
            placeholder={t('createCourse.grammarPlaceholder')}
            className="fr-create-tag-select"
            onPasteCapture={(event) => handleTagPaste(event, 'grammars')}
          />
        </Form.Item>
      </div>

      <Form.Item
        label={<span>{t('createCourse.skillLabel')}<span className="hint">({t('createCourse.multiSelect')})</span></span>}
        name="languageSkills"
        className="fr-create-form-item"
      >
        <Checkbox.Group
          options={languageSkillOptions.map(opt => ({ label: t(opt.labelKey), value: opt.value }))}
          className="fr-create-checkbox-group"
        />
      </Form.Item>
    </>
  );
}
