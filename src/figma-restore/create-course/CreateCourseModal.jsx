import React, { useMemo, useState } from 'react';
import { Button, Form, Modal, message } from 'antd';
import { CreateCourseStepFour } from './CreateCourseStepFour';
import { CreateCourseStepOne } from './CreateCourseStepOne';
import { CreateCourseStepThree } from './CreateCourseStepThree';
import { CreateCourseStepTwo } from './CreateCourseStepTwo';
import {
  adventureIdeas,
  createCourseSteps,
  defaultCreateCourseValues,
} from './createCourseOptions';
import './CreateCourseModal.css';

const stepFields = [
  ['courseTitle', 'age', 'duration', 'classSize'],
  ['taskName', 'storyContext', 'keyOutcome'],
  ['experiencePath'],
  [],
];

export function CreateCourseModal({ open, onCancel, onSubmit }) {
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [ideaIndex, setIdeaIndex] = useState(-1);
  const watchedValues = Form.useWatch([], form);

  const canPolish = useMemo(() => {
    const values = watchedValues || {};
    return ['taskName', 'storyContext', 'keyOutcome'].some(name => String(values[name] || '').trim());
  }, [watchedValues]);

  const resetFlow = () => {
    setCurrent(0);
    setIdeaIndex(-1);
    form.setFieldsValue(defaultCreateCourseValues);
  };

  const handleCancel = () => {
    resetFlow();
    onCancel?.();
  };

  const handleApplyIdea = () => {
    const nextIndex = (ideaIndex + 1) % adventureIdeas.length;
    const idea = adventureIdeas[nextIndex];
    setIdeaIndex(nextIndex);
    form.setFieldsValue(idea);
  };

  const handlePolish = () => {
    const values = form.getFieldsValue(['taskName', 'storyContext', 'keyOutcome']);
    const title = values.taskName?.trim() || '这场奇遇任务';

    form.setFieldsValue({
      taskName: title,
      storyContext: values.storyContext
        ? `围绕“${title}”，${values.storyContext.trim()}。孩子们将带着明确角色进入情境，通过观察、交流与合作创作，自然使用目标语言完成挑战。`
        : `围绕“${title}”，孩子们将化身任务中的关键角色，在充满画面感的情境中寻找线索、交流想法，并合作完成挑战。`,
      keyOutcome: values.keyOutcome
        ? `最终，${values.keyOutcome.trim()}，并用目标语言进行清晰、有趣的展示。`
        : `最终，每个小组将完成一份与“${title}”相关的创意作品，并用目标语言进行展示与分享。`,
    });
    message.success('已润色当前内容');
  };

  const handleNext = async () => {
    try {
      await form.validateFields(stepFields[current]);
      if (current < createCourseSteps.length - 1) {
        setCurrent(value => value + 1);
        return;
      }

      const values = await form.validateFields();
      const attachments = (values.attachments || []).map(file => file.name).filter(Boolean);
      onSubmit?.({
        ...values,
        attachments,
        id: `created-${Date.now()}`,
      });
      message.success('课程已创建');
      resetFlow();
    } catch {
      message.warning('请先补全当前步骤的必填内容');
    }
  };

  const stepContent = [
    <CreateCourseStepOne key="step-1" />,
    <CreateCourseStepTwo key="step-2" canPolish={canPolish} onApplyIdea={handleApplyIdea} onPolish={handlePolish} />,
    <CreateCourseStepThree key="step-3" />,
    <CreateCourseStepFour key="step-4" />,
  ];

  const modalTitle = (
    <div className="fr-create-modal-title">
      <span>创建课程</span>
      <i className="fr-create-title-mark" />
      <i className="fr-create-title-dot large" />
      <i className="fr-create-title-dot small" />
    </div>
  );

  const modalFooter = (
    <div className="fr-create-footer-bar">
      <Button
        onClick={() => setCurrent(value => value - 1)}
        className={`fr-create-btn-cancel fr-create-prev ${current === 0 ? 'hidden' : ''}`}
      >
        上一步
      </Button>
      <div className="fr-create-footer-actions">
        <Button onClick={handleCancel} className="fr-create-btn-cancel">取消</Button>
        <Button onClick={handleNext} className="fr-create-btn-next">
          {current === createCourseSteps.length - 1 ? '完成' : '下一步'}
        </Button>
      </div>
    </div>
  );

  return (
    <Modal
      className="fr-create-modal"
      title={modalTitle}
      open={open}
      onCancel={handleCancel}
      width={858}
      centered
      destroyOnHidden
      footer={modalFooter}
      afterOpenChange={(visible) => {
        if (visible) resetFlow();
      }}
    >
      <div className="fr-create-steps">
        {createCourseSteps.map((step, index) => (
          <div
            key={step.title}
            className={`fr-create-step-item ${index === current ? 'active' : ''} ${index < current ? 'process' : ''}`}
          >
            <span className="fr-create-step-number">{index < current ? '✓' : index + 1}</span>
            <span className="fr-create-step-label">{step.title}</span>
            {index < createCourseSteps.length - 1 && <div className="fr-create-step-tail" />}
          </div>
        ))}
      </div>

      <Form
        form={form}
        layout="vertical"
        initialValues={defaultCreateCourseValues}
        className="fr-create-form"
        requiredMark={false}
      >
        {stepContent[current]}
      </Form>
    </Modal>
  );
}
