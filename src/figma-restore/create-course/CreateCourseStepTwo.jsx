import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form, Input } from 'antd';
import { Sparkles, Zap } from 'lucide-react';

const { TextArea } = Input;

export function CreateCourseStepTwo({ canPolish, ideaLoading, polishLoading, onApplyIdea, onPolish }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="fr-create-step-head">
        <div>
          <div className="fr-create-step-title">{t('createCourse.step2Title')} <span className="en">| Design the Adventure</span></div>
          <div className="fr-create-step-subtitle">{t('createCourse.step2Subtitle')}</div>
        </div>
      </div>

      <div className="fr-create-ai-row">
        <div>{t('createCourse.aiHelperDesc')}</div>
        <div className="fr-create-ai-actions">
          <Button className="fr-create-ai-btn idea" icon={<Zap size={16} />} onClick={onApplyIdea} loading={ideaLoading}>{t('createCourse.getIdea')}</Button>
          <Button className="fr-create-ai-btn polish" icon={<Sparkles size={16} />} onClick={onPolish} disabled={!canPolish} loading={polishLoading}>{t('createCourse.polishContent')}</Button>
        </div>
      </div>

      <Form.Item
        label={<span><span className="required">*</span>{t('createCourse.taskNameLabel')}</span>}
        name="taskName"
        rules={[{ required: true, message: t('createCourse.taskNameRequired') }]}
      >
        <Input
          placeholder={t('createCourse.taskNamePlaceholder')}
          autoComplete="off"
        />
      </Form.Item>

      <Form.Item
        label={<span><span className="required">*</span>{t('createCourse.storyLabel')}</span>}
        name="storyContext"
        rules={[{ required: true, message: t('createCourse.storyRequired') }]}
      >
        <TextArea
          rows={4}
          placeholder={t('createCourse.storyPlaceholder')}
        />
      </Form.Item>

      <Form.Item
        label={<span><span className="required">*</span>{t('createCourse.outcomeLabel')}</span>}
        name="keyOutcome"
        rules={[{ required: true, message: t('createCourse.outcomeRequired') }]}
      >
        <TextArea
          rows={2}
          placeholder={t('createCourse.outcomePlaceholder')}
        />
      </Form.Item>
    </>
  );
}
