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
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [polishLoading, setPolishLoading] = useState(false);
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

  const handleApplyIdea = async () => {
    if (ideaLoading) return;
    setIdeaLoading(true);
    try {
      const values = form.getFieldsValue(true);
      const payload = {
        courseTitle: values.courseTitle,
        age: values.age,
        duration: values.duration,
        scale: values.classSize,
        vocabulary: values.vocabularies || [],
        grammar: values.grammars || [],
        skills: values.languageSkills || [],
        paths: values.experiencePath ? [values.experiencePath] : [],
        taskName: values.taskName || '',
        storyContext: values.storyContext || '',
        keyOutcome: values.keyOutcome || '',
      };
      const response = await fetch('/api/ai/generate-course-idea', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success && result.data) {
        const data = result.data;
        const textData = data.text ? (() => { try { return JSON.parse(data.text); } catch { return data; } })() : data;
        form.setFieldsValue({
          taskName: textData.taskName || data.taskName || '',
          storyContext: textData.storyContext || data.storyContext || '',
          keyOutcome: textData.keyOutcome || data.keyOutcome || '',
        });
        message.success('已生成 AI 创意灵感');
      } else {
        message.error(result.error || '创意生成失败');
      }
    } catch (err) {
      console.error('获取AI创意灵感失败:', err);
      message.error('创意生成失败，请稍后重试');
    } finally {
      setIdeaLoading(false);
    }
  };

  const handlePolish = async () => {
    if (polishLoading) return;
    setPolishLoading(true);
    try {
      const values = form.getFieldsValue(['taskName', 'storyContext', 'keyOutcome', 'courseTitle']);
      const payload = {
        courseTitle: values.courseTitle || '',
        taskName: values.taskName?.trim() || '',
        storyContext: values.storyContext?.trim() || '',
        keyOutcome: values.keyOutcome?.trim() || '',
      };
      const response = await fetch('/api/ai/polish-course-content', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (result.success && result.data) {
        const data = result.data;
        const textData = data.text ? (() => { try { return JSON.parse(data.text); } catch { return data; } })() : data;
        form.setFieldsValue({
          taskName: textData.taskName || data.taskName || payload.taskName,
          storyContext: textData.storyContext || data.storyContext || payload.storyContext,
          keyOutcome: textData.keyOutcome || data.keyOutcome || payload.keyOutcome,
        });
        message.success('已润色当前内容');
      } else {
        message.error(result.error || '内容润色失败');
      }
    } catch (err) {
      console.error('AI润色失败:', err);
      message.error('内容润色失败，请稍后重试');
    } finally {
      setPolishLoading(false);
    }
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

      const stepValues = await form.validateFields();
      const values = form.getFieldsValue(true);
      Object.assign(values, stepValues);
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
        courseData: {
          courseOverview: overview,
          themeImageUrl,
          age: values.age,
          duration: values.duration,
          classSize: values.classSize,
          vocabularies: values.vocabularies || [],
          grammars: values.grammars || [],
          languageSkills: values.languageSkills || [],
          experiencePath: values.experiencePath || '',
          taskName: values.taskName || '',
          storyContext: values.storyContext || '',
          keyOutcome: values.keyOutcome || '',
          atmosphere: values.atmosphere || '',
          specialRequirements: values.specialRequirements || '',
        },
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
        age: values.age,
        duration: values.duration,
        classSize: values.classSize,
        vocabularies: values.vocabularies || [],
        grammars: values.grammars || [],
        languageSkills: values.languageSkills || [],
        experiencePath: values.experiencePath || '',
        taskName: values.taskName || '',
        storyContext: values.storyContext || '',
        keyOutcome: values.keyOutcome || '',
        atmosphere: values.atmosphere || '',
        specialRequirements: values.specialRequirements || '',
      });
    } catch {
      setSubmitting(false);
      message.warning('请先补全当前步骤的必填内容');
    }
  };

  const stepContent = [
    <CreateCourseStepOne key="step-1" />,
    <CreateCourseStepTwo key="step-2" canPolish={canPolish} ideaLoading={ideaLoading} polishLoading={polishLoading} onApplyIdea={handleApplyIdea} onPolish={handlePolish} />,
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
