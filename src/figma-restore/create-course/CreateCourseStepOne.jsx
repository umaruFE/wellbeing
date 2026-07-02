import React from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox, Form, Radio, Select, Tag } from 'antd';
import {
  ageOptions,
  classSizeOptions,
  durationOptions,
  languageSkillOptions,
} from './createCourseOptions';

function splitPastedTags(text, separators = /\r?\n/) {
  return String(text || '')
    .split(separators)
    .map((item) => item.replace(/[\u200B-\u200D\uFEFF]/g, '').trim())
    .filter(Boolean);
}

function splitGrammarTags(value) {
  return splitPastedTags(value, /\r?\n/)
    .flatMap((line) => line
      .split(/(?<=\?)\s+|(?<=\.\.\.)\s+(?=[A-Z])/)
      .map((item) => item.trim())
      .filter(Boolean));
}

function toTagArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function EditableTagSelect({ value, onChange, ...selectProps }) {
  const tags = toTagArray(value);
  const [editingTag, setEditingTag] = React.useState(null);
  const [editingValue, setEditingValue] = React.useState('');
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    if (editingTag !== null) {
      inputRef.current?.focus();
      const cursorPosition = inputRef.current?.value.length ?? 0;
      inputRef.current?.setSelectionRange(cursorPosition, cursorPosition);
    }
  }, [editingTag]);

  React.useEffect(() => {
    if (!inputRef.current || editingTag === null) return;
    inputRef.current.style.height = '0px';
    inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
  }, [editingTag, editingValue]);

  const finishEditing = React.useCallback(() => {
    if (editingTag === null) return;

    const nextValue = editingValue.trim();
    const nextTags = tags.flatMap((tag) => {
      if (tag !== editingTag) return [tag];
      return nextValue ? [nextValue] : [];
    });

    setEditingTag(null);
    onChange?.(nextTags);
  }, [editingTag, editingValue, onChange, tags]);

  const renderTag = React.useCallback(({ label, value: tagValue, closable, onClose }) => {
    const isEditing = editingTag === tagValue;

    if (isEditing) {
      return (
        <span
          className="fr-create-editable-tag is-editing"
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onDoubleClick={(event) => event.stopPropagation()}
        >
          <textarea
            ref={inputRef}
            className="fr-create-tag-edit-input"
            value={editingValue}
            rows={1}
            aria-label={`Edit ${String(label)}`}
            onChange={(event) => setEditingValue(event.target.value)}
            onBlur={finishEditing}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => {
              event.stopPropagation();
              if (event.key === 'Enter') {
                event.preventDefault();
                event.currentTarget.blur();
              } else if (event.key === 'Escape') {
                event.preventDefault();
                setEditingTag(null);
              }
            }}
          />
        </span>
      );
    }

    return (
      <Tag
        className="fr-create-editable-tag"
        closable={closable}
        onClose={onClose}
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onDoubleClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setEditingTag(tagValue);
          setEditingValue(String(tagValue));
        }}
      >
        {label}
      </Tag>
    );
  }, [editingTag, editingValue, finishEditing]);

  return (
    <Select
      {...selectProps}
      value={tags}
      onChange={onChange}
      tagRender={renderTag}
    />
  );
}

export function CreateCourseStepOne() {
  const { t } = useTranslation();
  const form = Form.useFormInstance();

  const handleTagPaste = React.useCallback((event, field) => {
    const text = event.clipboardData?.getData('text');
    const lines = field === 'vocabularies'
      ? splitPastedTags(text, /[,\uFF0C\r\n]+/)
      : splitGrammarTags(text);
    if (lines.length < 2) return;

    event.preventDefault();
    const current = toTagArray(form.getFieldValue(field)).map((item) => String(item || '').trim()).filter(Boolean);
    const next = [...current];
    lines.forEach((line) => {
      if (!next.includes(line)) next.push(line);
    });
    form.setFieldsValue({ [field]: next });
  }, [form]);

  const normalizeTags = React.useCallback((value, field) => {
    const next = toTagArray(value)
      .flatMap((item) => field === 'vocabularies' ? splitPastedTags(item, /[,\uFF0C\r\n]+/) : splitGrammarTags(item))
      .filter((item, index, array) => array.indexOf(item) === index);
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
          <EditableTagSelect
            mode="tags"
            open={false}
            suffixIcon={null}
            placeholder={t('createCourse.vocabPlaceholder')}
            className="fr-create-tag-select"
            tokenSeparators={[',', '，']}
            onChange={(value) => normalizeTags(value, 'vocabularies')}
            onPasteCapture={(event) => handleTagPaste(event, 'vocabularies')}
          />
        </Form.Item>

        <Form.Item
          label={<span><span className="required">*</span>{t('createCourse.grammarLabel')}</span>}
          name="grammars"
          className="fr-create-form-item"
        >
          <EditableTagSelect
            mode="tags"
            open={false}
            suffixIcon={null}
            placeholder={t('createCourse.grammarPlaceholder')}
            className="fr-create-tag-select"
            onChange={(value) => normalizeTags(value, 'grammars')}
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
