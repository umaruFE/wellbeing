import React, { useMemo, useState } from 'react';
import { Button, Form, Modal, message } from 'antd';
import { Loader2 } from 'lucide-react';
import apiService from '../../services/api';
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

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
}

export function CreateCourseModal({ open, onCancel, onSubmit }) {
  const [form] = Form.useForm();
  const [current, setCurrent] = useState(0);
  const [ideaIndex, setIdeaIndex] = useState(-1);
  const [submitting, setSubmitting] = useState(false);
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
    if (submitting) return;
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
        ? `围绕"${title}"，${values.storyContext.trim()}。孩子们将带着明确角色进入情境，通过观察、交流与合作创作，自然使用目标语言完成挑战。`
        : `围绕"${title}"，孩子们将化身任务中的关键角色，在充满画面感的情境中寻找线索、交流想法，并合作完成挑战。`,
      keyOutcome: values.keyOutcome
        ? `最终，${values.keyOutcome.trim()}，并用目标语言进行清晰、有趣的展示。`
        : `最终，每个小组将完成一份与"${title}"相关的创意作品，并用目标语言进行展示与分享。`,
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

      if (submitting) return;
      setSubmitting(true);

      const values = await form.validateFields();
      const user = getUser();
      const attachments = (values.attachments || []).map(file => file.name).filter(Boolean);

      const n8nPayload = {
        courseTitle: values.courseTitle,
        age: values.age,
        duration: values.duration,
        scale: values.classSize,
        vocabulary: values.vocabularies || [],
        grammar: values.grammars || [],
        skills: values.languageSkills || [],
        paths: values.experiencePath ? [values.experiencePath] : [],
        theme: values.taskName || '',
        taskName: values.taskName || '',
        storyContext: values.storyContext || '',
        keyOutcome: values.keyOutcome || '',
        atmosphere: values.atmosphere || '',
        specialRequirements: values.specialRequirements || '',
        attachments,
        userId: user?.id || null,
        organizationId: user?.organization_id || null,
      };

      let overview = null;
      let themeImageUrl = null;

      try {
        const response = await fetch('/api/ai/generate-course-overview', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(n8nPayload)
        });
        const result = await response.json();

        if (result.success && result.data) {
          overview = result.data.courseOverview || result.data;
          themeImageUrl = result.data.themeImageUrl || null;
        } else {
          console.warn('概览生成未返回有效数据，使用表单原始值');
        }
      } catch (err) {
        console.warn('概览生成请求失败，使用表单原始值:', err);
      }

      const courseTitle = overview?.courseTitle || values.courseTitle || '未命名课程';
      const theme = overview?.theme || values.taskName || '';

      const keywordsList = [values.vocabularies, values.grammars]
        .filter(Boolean)
        .flatMap(v => Array.isArray(v) ? v : v.split(',').map(k => k.trim()))
        .filter(Boolean);

      const saveData = {
        title: courseTitle,
        description: overview?.overallContext || values.storyContext || '',
        ageGroup: values.age,
        unit: values.classSize,
        duration: values.duration,
        theme: theme,
        keywords: keywordsList,
        courseData: overview ? { courseOverview: overview, themeImageUrl } : {},
        themeImageUrl,
        status: 'draft',
        userId: user?.id || null,
        organizationId: user?.organization_id || null,
      };

      let savedCourseId = null;
      try {
        const saveResult = await apiService.createCourse(saveData);
        savedCourseId = saveResult?.data?.id || saveResult?.id || null;
      } catch (err) {
        console.error('保存课程失败:', err);
      }

      message.success('课程已创建');
      resetFlow();
      setSubmitting(false);

      onSubmit?.({
        ...values,
        id: savedCourseId || `created-${Date.now()}`,
        courseOverview: overview,
        themeImageUrl,
        title: courseTitle,
        theme,
      });
    } catch {
      setSubmitting(false);
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
        disabled={submitting}
      >
        上一步
      </Button>
      <div className="fr-create-footer-actions">
        <Button onClick={handleCancel} className="fr-create-btn-cancel" disabled={submitting}>取消</Button>
        <Button onClick={handleNext} className="fr-create-btn-next" disabled={submitting}>
          {submitting
            ? <>生成中...</>
            : current === createCourseSteps.length - 1 ? '完成' : '下一步'
          }
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
      closable={!submitting}
      maskClosable={!submitting}
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
